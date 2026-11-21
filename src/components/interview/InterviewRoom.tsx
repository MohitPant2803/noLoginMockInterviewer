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
import { Button, Card, CardContent, Badge } from '@/components/ui';
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

  const [typedAnswer, setTypedAnswer] = useState('');
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
              ? 'Invalid Groq API key. Please go back to setup and correct it.'
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
    // Small delay to let UI render
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
    speech.stop(); // Stop TTS when mic starts
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
    const answerText = (voice.transcript || typedAnswer).trim();
    if (!answerText) {
      toast.warning('Please provide an answer before submitting.');
      return;
    }

    processingRef.current = true;
    setIsSubmitting(true);
    voice.stopListening();
    speech.stop();
    store.getState().setIsListening(false);

    // 1. Save answer immediately (never lose it)
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
        description: 'Your answer was saved. Evaluation can be retried in the report.',
      });
    }

    // 3. Check for follow-up
    const sess = store.getState().session;
    const isMainDone =
      sess.mainQuestionsAsked >= sess.mainQuestionCount &&
      !currentQuestion.isFollowUp;
    const allMainsDone = sess.mainQuestionsAsked >= sess.mainQuestionCount;

    if (evaluation?.shouldFollowUp && sess.followUpsForCurrentMain < 2 && !isMainDone) {
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
          setTypedAnswer('');
          voice.resetTranscript();
          spokenQuestionRef.current = null;
          processingRef.current = false;
          setIsSubmitting(false);
          return;
        }
      } catch {
        // Follow-up generation failed — just move on
      }
    }

    // 4. Advance to next main question or finish
    if (currentQuestion.isFollowUp || !evaluation?.shouldFollowUp || sess.followUpsForCurrentMain >= 2) {
      // Find next main question
      const currentMainIdx = currentQuestion.isFollowUp
        ? session.questions.findIndex((q) => q.id === currentQuestion.followUpForId)
        : session.questions.indexOf(currentQuestion);
      const nextMainQ = session.questions.find(
        (q, i) => i > currentMainIdx && !q.isFollowUp && q.status === 'pending'
      );

      if (nextMainQ && !allMainsDone) {
        store.getState().updateQuestion(nextMainQ.id, { status: 'in_progress' });
        store.getState().setCurrentQuestionIndex(session.questions.indexOf(nextMainQ));
        store.getState().resetFollowUps();
        store.getState().incrementMainQuestionsAsked();
        store.getState().setStatus('in_progress');
        setTypedAnswer('');
        voice.resetTranscript();
        spokenQuestionRef.current = null;
      } else {
        // All done
        await finishInterview();
      }
    }

    processingRef.current = false;
    setIsSubmitting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, hasAnswered, voice.transcript, typedAnswer, config, resume]);

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
      toast.success('Interview complete! Generating your report...');
      navigate('/report');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate report';
      setReportError(msg);
      toast.error('Report generation failed', {
        description: 'Navigate to the report page to retry.',
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
      <div className="max-w-2xl mx-auto text-center py-20 space-y-6">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Preparing Your Interview</h2>
          <p className="mt-2 text-sm text-slate-400">
            Generating {config.questionCount} personalized questions for{' '}
            <span className="text-indigo-400 font-medium">{config.jobRole}</span> based on your
            resume...
          </p>
        </div>
        <p className="text-xs text-slate-500">This usually takes 5–15 seconds.</p>
      </div>
    );
  }

  // ── Error State ──
  if (session.status === 'idle' && session.currentError) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-6">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-red-950/60 border border-red-800/50 flex items-center justify-center">
          <WifiOff className="h-7 w-7 text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Could Not Start Interview</h2>
          <p className="mt-2 text-sm text-red-300/90">{session.currentError}</p>
        </div>
        <div className="flex justify-center gap-3">
          <Link to="/setup">
            <Button variant="outline" leftIcon={<Settings className="h-4 w-4" />}>
              Edit Setup
            </Button>
          </Link>
          <Button
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
    <div className="max-w-4xl mx-auto w-full space-y-5">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100">{config.jobRole}</h2>
              <Badge variant={session.status === 'paused' ? 'warning' : 'success'} className="text-[10px]">
                {session.status === 'paused' ? 'Paused' : 'Live'}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Model: {config.groqModel}
            </p>
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
            End Interview
          </Button>
        </div>
      </div>

      {/* Progress */}
      <InterviewProgress session={session} />

      {/* Question */}
      <QuestionDisplay
        question={currentQuestion}
        status={session.status}
        isSpeaking={speech.isSpeaking}
        isMuted={speech.isMuted}
        onToggleMute={speech.toggleMute}
        onReplay={() => currentQuestion && speech.speak(currentQuestion.questionText)}
      />

      {/* Paused overlay */}
      {session.status === 'paused' && (
        <Card className="border-amber-900/50 bg-amber-950/20 text-center">
          <CardContent className="p-6 space-y-3">
            <PauseCircle className="h-8 w-8 text-amber-400 mx-auto" />
            <h3 className="text-base font-semibold text-amber-200">Interview Paused</h3>
            <p className="text-sm text-amber-300/70">
              Take your time. Click Resume to continue from where you left off.
            </p>
            <Button
              onClick={() => store.getState().setStatus('in_progress')}
              leftIcon={<PlayCircle className="h-4 w-4" />}
            >
              Resume Interview
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Answer input */}
      {session.status !== 'paused' && (
        <AnswerInput
          transcript={voice.transcript}
          interimTranscript={voice.interimTranscript}
          typedAnswer={typedAnswer}
          onTypedAnswerChange={setTypedAnswer}
          isListening={voice.isListening}
          voiceSupported={voice.isSupported}
          voiceError={voice.error}
          sessionStatus={session.status}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onSubmit={handleSubmitAnswer}
          isSubmitting={isSubmitting}
          hasAnswered={hasAnswered}
        />
      )}

      {/* API Error */}
      {session.currentError && session.status !== 'idle' && (
        <div className="p-3.5 rounded-xl border border-red-900/50 bg-red-950/20 text-xs text-red-300 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-200">Error</p>
            <p className="mt-0.5">{session.currentError}</p>
          </div>
        </div>
      )}

      {/* Session Loss Warning */}
      <div className="text-center text-[11px] text-slate-600 py-2">
        ⚠ Interview data is held in memory only. Refreshing or closing this tab will lose your session.
      </div>

      {/* End Interview Confirmation Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="max-w-md w-full border-slate-700 bg-slate-900 shadow-2xl">
            <CardContent className="p-6 space-y-4 text-center">
              <StopCircle className="h-10 w-10 text-red-400 mx-auto" />
              <h3 className="text-lg font-bold text-slate-100">End Interview Early?</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                You have answered {session.answers.length} of {session.mainQuestionCount} main
                questions. A report will be generated from the answers provided so far.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowEndConfirm(false)}>
                  Continue Interview
                </Button>
                <Button variant="danger" onClick={confirmEndInterview} isLoading={isSubmitting}>
                  End & Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
