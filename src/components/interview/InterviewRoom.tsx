import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Loader2,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  StopCircle,
  Settings,
  Bot,
  WifiOff,
} from 'lucide-react';

import { useConfigStore, useResumeStore, useInterviewStore, useReportStore } from '@/store';
import { useVoiceRecognition, useSpeechSynthesis } from '@/hooks';
import { groqService, GroqApiError } from '@/services/groqService';
import { Button, Badge } from '@/components/ui';
import { InterviewProgress } from './InterviewProgress';
import { QuestionDisplay } from './QuestionDisplay';
import { AnswerInput } from './AnswerInput';
import type { CandidateAnswer, InterviewQuestion } from '@/types';

export const InterviewRoom: React.FC = () => {
  const navigate = useNavigate();
  const config = useConfigStore((s) => s.config)!;
  const resume = useResumeStore((s) => s.resume)!;
  const session = useInterviewStore((s) => s.session);
  const store = useInterviewStore;

  const setReport = useReportStore((s) => s.setReport);
  const setReportLoading = useReportStore((s) => s.setIsLoading);
  const setReportError = useReportStore((s) => s.setError);

  const voice = useVoiceRecognition();
  const speech = useSpeechSynthesis();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const processingRef = useRef(false);
  const spokenQuestionRef = useRef<string | null>(null);

  const currentQuestion = session.questions[session.currentQuestionIndex] as
    | InterviewQuestion
    | undefined;
  const hasAnswered = currentQuestion
    ? session.answers.some((a) => a.questionId === currentQuestion.id)
    : false;

  // ── Generate initial questions on mount ──
  useEffect(() => {
    if (session.status !== 'idle' && session.status !== 'generating_questions') return;
    if (session.questions.length > 0) return;

    const generate = async () => {
      store.getState().setStatus('generating_questions');
      store.getState().setError(null);
      try {
        const questions = await groqService.generateQuestions({ config, resume });
        store.getState().startSession(questions);
      } catch (err) {
        const msg =
          err instanceof GroqApiError
            ? err.isAuthError
              ? 'Invalid Groq API key. Please check your credentials in setup.'
              : err.message
            : 'Failed to generate questions. Please try again.';
        store.getState().setError(msg);
        store.getState().setStatus('idle');
        toast.error('Failed to start interview', { description: msg });
      }
    };
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Speak question when it changes ──
  useEffect(() => {
    if (!currentQuestion) return;
    if (currentQuestion.questionText === spokenQuestionRef.current) return;
    spokenQuestionRef.current = currentQuestion.questionText;
    const t = setTimeout(() => {
      speech.speak(currentQuestion.questionText);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id]);

  // ── Sync voice transcript to store ──
  useEffect(() => {
    if (voice.transcript) {
      store.getState().setActiveTranscript(voice.transcript);
    }
  }, [voice.transcript]);

  // ── Mic handlers ──
  const handleStartRecording = useCallback(() => {
    if (hasAnswered) return;
    speech.stop();
    voice.startListening();
    store.getState().setIsListening(true);
  }, [hasAnswered, speech, voice]);

  const handleStopRecording = useCallback(() => {
    voice.stopListening();
    store.getState().setIsListening(false);
  }, [voice]);

  // ── Submit answer ──
  const handleSubmitAnswer = useCallback(async () => {
    if (!currentQuestion || hasAnswered || processingRef.current) return;
    const answerText = voice.transcript.trim();
    if (!answerText) {
      toast.warning('Please speak your answer before submitting.');
      return;
    }

    processingRef.current = true;
    setIsSubmitting(true);
    voice.stopListening();
    speech.stop();
    store.getState().setIsListening(false);

    // 1. Save answer immediately
    const answer: CandidateAnswer = {
      questionId: currentQuestion.id,
      transcript: answerText,
      startedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
    };
    store.getState().addAnswer(answer);
    store.getState().updateQuestion(currentQuestion.id, { status: 'completed' });
    store.getState().setStatus('evaluating');

    // 2. Evaluate answer
    let evaluation;
    try {
      const history = groqService.buildConversationHistory(
        store.getState().session.questions,
        store.getState().session.answers
      );
      evaluation = await groqService.evaluateAnswer({
        config,
        question: currentQuestion,
        answer,
        resume,
        conversationHistory: history,
      });
      store.getState().updateAnswer(currentQuestion.id, { evaluation });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Evaluation failed';
      store.getState().updateAnswer(currentQuestion.id, { evaluationError: errMsg });
      toast.error('Could not evaluate answer', {
        description: 'Your response was preserved in memory.',
      });
    }

    // 3. Check for adaptive follow-up (max 1 follow-up per main question)
    const sess = store.getState().session;
    const shouldFollowUp =
      Boolean(evaluation?.shouldFollowUp) &&
      sess.followUpsForCurrentMain < 1 &&
      !currentQuestion.isFollowUp;

    if (shouldFollowUp && evaluation) {
      store.getState().setStatus('generating_followup');
      try {
        const history = groqService.buildConversationHistory(
          store.getState().session.questions,
          store.getState().session.answers
        );
        const followUp = await groqService.generateFollowUp({
          config,
          currentQuestion,
          candidateAnswer: { ...answer, evaluation },
          evaluation,
          resume,
          followUpCount: sess.followUpsForCurrentMain,
          conversationHistory: history,
        });

        if (followUp) {
          followUp.index = store.getState().session.questions.length;
          store.getState().addQuestion(followUp);
          store.getState().incrementFollowUps();
          store.getState().setCurrentQuestionIndex(followUp.index);
          store.getState().setStatus('in_progress');
          voice.resetTranscript();
          spokenQuestionRef.current = null;
          processingRef.current = false;
          setIsSubmitting(false);
          return;
        }
      } catch (err) {
        console.warn('Follow-up generation error:', err);
      }
    }

    // 4. Advance to the next pending main question (guaranteeing all configured main questions are asked)
    const allQuestions = store.getState().session.questions;
    const nextMainQ = allQuestions.find((q) => !q.isFollowUp && q.status === 'pending');

    if (nextMainQ) {
      const nextIndex = allQuestions.indexOf(nextMainQ);
      store.getState().updateQuestion(nextMainQ.id, { status: 'in_progress' });
      store.getState().setCurrentQuestionIndex(nextIndex);
      store.getState().resetFollowUps();
      store.getState().incrementMainQuestionsAsked();
      store.getState().setStatus('in_progress');
      voice.resetTranscript();
      spokenQuestionRef.current = null;
    } else {
      // All main questions completed! Conclude session.
      await finishInterview();
    }

    processingRef.current = false;
    setIsSubmitting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, hasAnswered, voice.transcript, config, resume]);

  // ── Finish interview & generate report ──
  const finishInterview = useCallback(async () => {
    store.getState().completeSession();
    setReportLoading(true);
    speech.stop();

    const sess = store.getState().session;
    const start = sess.startedAt ? new Date(sess.startedAt).getTime() : Date.now();
    const durationMin = Math.max(1, Math.round((Date.now() - start) / 60000));

    try {
      const report = await groqService.generateReport({
        config,
        resume,
        questions: sess.questions.filter((q) => q.status === 'completed'),
        answers: sess.answers,
        durationMinutes: durationMin,
      });
      report.interviewId = sess.id;
      setReport(report);
      toast.success('Interview complete');
      navigate('/report');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate report';
      setReportError(msg);
      toast.error('Report generation failed', {
        description: 'You can retry from the evaluation page.',
      });
      navigate('/report');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, resume, navigate]);

  const handleEndInterview = useCallback(() => {
    if (session.answers.length === 0) {
      toast.warning('Answer at least one question before ending.');
      return;
    }
    setShowEndConfirm(true);
  }, [session.answers.length]);

  const confirmEndInterview = useCallback(async () => {
    setShowEndConfirm(false);
    voice.stopListening();
    speech.stop();
    setIsSubmitting(true);
    await finishInterview();
    setIsSubmitting(false);
  }, [finishInterview, voice, speech]);

  // ── Generating Questions State ──
  if (session.status === 'generating_questions') {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <div className="mx-auto h-10 w-10 rounded bg-surface-muted flex items-center justify-center">
          <Loader2 className="h-5 w-5 text-accent animate-spin" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-text-primary">Preparing interview session</h2>
          <p className="text-xs text-text-muted">
            Formulating {config.questionCount} questions for {config.jobRole}...
          </p>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (session.status === 'idle' && session.currentError) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="mx-auto h-10 w-10 rounded bg-status-danger-bg border border-status-danger-border flex items-center justify-center">
          <WifiOff className="h-5 w-5 text-status-danger" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-text-primary">Unable to initialize interview</h2>
          <p className="text-xs text-status-danger">{session.currentError}</p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <Link to="/setup">
            <Button variant="outline" size="sm" leftIcon={<Settings className="h-3.5 w-3.5" />}>
              Edit setup
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => {
              store.getState().setError(null);
              store.getState().setStatus('idle');
              window.location.reload();
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-container mx-auto w-full space-y-5 px-4 sm:px-6 py-6">
      {/* Top action plane */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded border border-border-subtle bg-surface">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-surface-muted flex items-center justify-center text-text-secondary">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-text-primary">{config.jobRole}</h2>
              <Badge variant={session.status === 'paused' ? 'warning' : 'success'}>
                {session.status === 'paused' ? 'Paused' : 'Active'}
              </Badge>
            </div>
            <div className="text-[11px] text-text-muted mt-0.5">
              <span>Model: {config.groqModel}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {session.status === 'paused' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => store.getState().setStatus('in_progress')}
              leftIcon={<PlayCircle className="h-3.5 w-3.5" />}
            >
              Resume
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                voice.stopListening();
                speech.stop();
                store.getState().setStatus('paused');
              }}
              disabled={session.status !== 'in_progress'}
              leftIcon={<PauseCircle className="h-3.5 w-3.5" />}
            >
              Pause
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            onClick={handleEndInterview}
            disabled={isSubmitting}
            leftIcon={<StopCircle className="h-3.5 w-3.5" />}
          >
            End interview
          </Button>
        </div>
      </div>

      {/* Progress track */}
      <InterviewProgress session={session} />

      {/* Question prompt */}
      <QuestionDisplay
        question={currentQuestion}
        status={session.status}
        isSpeaking={speech.isSpeaking}
        isMuted={speech.isMuted}
        onToggleMute={speech.toggleMute}
        onReplay={() => currentQuestion && speech.speak(currentQuestion.questionText)}
      />

      {/* Paused state */}
      {session.status === 'paused' && (
        <div className="rounded border border-status-warning-border bg-status-warning-bg p-6 text-center space-y-2">
          <PauseCircle className="h-6 w-6 text-status-warning mx-auto" />
          <h3 className="text-sm font-semibold text-status-warning">Interview paused</h3>
          <p className="text-xs text-text-muted">
            The session is held in memory. Resume whenever you are ready.
          </p>
          <div className="pt-2">
            <Button
              size="sm"
              onClick={() => store.getState().setStatus('in_progress')}
              leftIcon={<PlayCircle className="h-3.5 w-3.5" />}
            >
              Resume interview
            </Button>
          </div>
        </div>
      )}

      {/* Candidate answer console (100% voice-driven) */}
      {session.status !== 'paused' && (
        <AnswerInput
          transcript={voice.transcript}
          interimTranscript={voice.interimTranscript}
          isListening={voice.isListening}
          isTranscribing={voice.isTranscribing}
          transcriptionEngine={voice.engine}
          voiceSupported={voice.isSupported}
          voiceError={voice.error}
          sessionStatus={session.status}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onResetRecording={voice.resetTranscript}
          onSubmit={handleSubmitAnswer}
          isSubmitting={isSubmitting}
          hasAnswered={hasAnswered}
        />
      )}

      {/* Error alert */}
      {session.currentError && session.status !== 'idle' && (
        <div className="p-3 rounded border border-status-danger-border bg-status-danger-bg text-xs text-status-danger flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{session.currentError}</span>
        </div>
      )}

      {/* Early Termination Confirmation Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-w-sm w-full rounded border border-border-strong bg-surface p-5 space-y-3 text-center">
            <StopCircle className="h-7 w-7 text-status-danger mx-auto" />
            <h3 className="text-sm font-semibold text-text-primary">Conclude interview early?</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              You have completed {session.answers.length} of {session.mainQuestionCount} questions.
              An evaluation scorecard will be synthesized from the available answers.
            </p>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowEndConfirm(false)}>
                Continue
              </Button>
              <Button variant="danger" size="sm" onClick={confirmEndInterview} isLoading={isSubmitting}>
                Generate report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
