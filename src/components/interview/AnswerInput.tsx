import React, { useEffect } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Loader2,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  AudioLines,
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import type { SessionStatus } from '@/types';

interface AnswerInputProps {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isTranscribing?: boolean;
  transcriptionEngine?: 'browser' | 'whisper';
  voiceSupported: boolean;
  voiceError: string | null;
  sessionStatus: SessionStatus;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onResetRecording: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  hasAnswered: boolean;
}

export const AnswerInput: React.FC<AnswerInputProps> = ({
  transcript,
  interimTranscript,
  isListening,
  isTranscribing = false,
  transcriptionEngine = 'browser',
  voiceSupported,
  voiceError,
  sessionStatus,
  onStartRecording,
  onStopRecording,
  onResetRecording,
  onSubmit,
  isSubmitting,
  hasAnswered,
}) => {
  const hasSpokenAnswer = transcript.trim().length > 0;
  const canSubmit =
    hasSpokenAnswer &&
    !isSubmitting &&
    !hasAnswered &&
    !isTranscribing &&
    !isListening &&
    sessionStatus === 'in_progress';
  const isProcessing = sessionStatus === 'evaluating' || sessionStatus === 'generating_followup';
  const isDisabled = hasAnswered || isProcessing || isTranscribing || sessionStatus !== 'in_progress';

  // Space-key shortcut: tap Space to toggle recording
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isDisabled) return;
      if (e.code !== 'Space') return;
      e.preventDefault();

      if (isListening) {
        onStopRecording();
      } else if (voiceSupported) {
        onStartRecording();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isListening, voiceSupported, onStartRecording, onStopRecording, isDisabled]);

  return (
    <div className="rounded border border-border-strong bg-surface p-5 sm:p-6 space-y-4 shadow-xs">
      {/* Console Header */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-surface-elevated flex items-center justify-center text-text-primary">
            <AudioLines className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold text-text-primary">
            Spoken response
          </span>
          <Badge variant="outline" className="text-[10px]">
            Voice only
          </Badge>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2">
          {isListening && (
            <span className="flex items-center gap-1.5 text-xs text-status-danger font-semibold bg-red-50 border border-red-200 px-2 py-0.5 rounded">
              <span className="h-2 w-2 rounded-full bg-status-danger animate-pulse" />
              {transcriptionEngine === 'whisper' ? 'Recording (Whisper AI)...' : 'Recording... speak now'}
            </span>
          )}
          {isTranscribing && (
            <span className="flex items-center gap-1.5 text-xs text-text-primary font-medium bg-surface-elevated px-2.5 py-0.5 rounded border border-border-subtle">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-900" />
              Transcribing audio with Whisper AI...
            </span>
          )}
          {hasSpokenAnswer && !isListening && !isTranscribing && !hasAnswered && (
            <span className="flex items-center gap-1 text-xs text-status-success font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Speech transcribed
            </span>
          )}
          {hasAnswered && !isProcessing && (
            <span className="text-xs text-status-success font-medium">Answer submitted</span>
          )}
          {isProcessing && (
            <span className="flex items-center gap-1.5 text-xs text-accent font-medium">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {sessionStatus === 'evaluating' ? 'Evaluating answer...' : 'Generating follow-up...'}
            </span>
          )}
        </div>
      </div>

      {/* Voice Transcript Display Console (No write/type option) */}
      <div className="min-h-[140px] rounded border border-border-subtle bg-slate-50/70 p-4 sm:p-5 flex flex-col justify-center transition-all">
        {/* STATE 1: Empty / Waiting for candidate to speak */}
        {!hasSpokenAnswer && !isListening && !isTranscribing && (
          <div className="text-center py-4 space-y-2">
            <div className="mx-auto h-11 w-11 rounded-full bg-white border border-border-strong flex items-center justify-center text-slate-800 shadow-xs">
              <Mic className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-text-primary">
                Speak your answer out loud
              </p>
              <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
                Click <span className="font-semibold text-text-primary">Start recording</span> or press <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono text-[11px] text-slate-700">Space</kbd> to record your voice response.
              </p>
            </div>
          </div>
        )}

        {/* STATE 2: Recording actively */}
        {isListening && (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span className="flex items-center gap-1.5 text-status-danger font-medium">
                <span className="h-2 w-2 rounded-full bg-status-danger animate-pulse" />
                Microphone active
              </span>
              <span className="font-mono text-[11px]">Tap Space or click Stop when finished</span>
            </div>

            <div className="min-h-[60px] p-3 rounded bg-white border border-border-subtle">
              {interimTranscript ? (
                <p className="text-sm text-text-primary font-medium italic leading-relaxed">
                  "{interimTranscript}"
                </p>
              ) : transcript ? (
                <p className="text-sm text-text-primary leading-relaxed">
                  {transcript}
                </p>
              ) : (
                <p className="text-xs text-text-muted italic flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400 animate-ping" />
                  Listening... speak your response clearly.
                </p>
              )}
            </div>
          </div>
        )}

        {/* STATE 3: Transcribing with Groq Whisper AI */}
        {isTranscribing && (
          <div className="text-center py-6 space-y-2">
            <Loader2 className="h-7 w-7 animate-spin text-slate-900 mx-auto" />
            <p className="text-xs font-semibold text-text-primary">
              Transcribing speech with Groq Whisper AI...
            </p>
            <p className="text-[11px] text-text-muted">
              Converting recorded speech to text. Your answer will appear in a moment.
            </p>
          </div>
        )}

        {/* STATE 4: Speech transcript recorded */}
        {hasSpokenAnswer && !isListening && !isTranscribing && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span className="font-medium text-text-secondary flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-status-success" />
                Spoken transcript:
              </span>
              <span className="text-[11px] text-text-muted font-mono">
                {transcript.trim().split(/\s+/).length} words
              </span>
            </div>
            <div className="p-3.5 rounded bg-white border border-border-strong text-sm leading-relaxed text-text-primary font-medium shadow-xs">
              {transcript}
            </div>
          </div>
        )}
      </div>

      {/* Voice Error notice */}
      {voiceError && (
        <div className="p-2.5 rounded bg-status-danger-bg border border-status-danger-border text-xs text-status-danger flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{voiceError}</span>
        </div>
      )}

      {/* Action Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-border-subtle">
        {/* Left: Recording & Re-record controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {voiceSupported && !isListening && (
            <Button
              variant={hasSpokenAnswer ? 'outline' : 'primary'}
              size="md"
              onClick={onStartRecording}
              disabled={isDisabled}
              leftIcon={<Mic className="h-4 w-4" />}
              className="flex-1 sm:flex-initial"
            >
              {hasSpokenAnswer ? 'Speak more' : 'Start recording'}
            </Button>
          )}

          {isListening && (
            <Button
              variant="danger"
              size="md"
              onClick={onStopRecording}
              leftIcon={<MicOff className="h-4 w-4" />}
              className="flex-1 sm:flex-initial"
            >
              Stop recording
            </Button>
          )}

          {hasSpokenAnswer && !isListening && !isTranscribing && !hasAnswered && (
            <Button
              variant="outline"
              size="md"
              onClick={onResetRecording}
              disabled={isDisabled}
              leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
              title="Clear transcript to record again from scratch"
              className="text-text-muted hover:text-text-primary"
            >
              Re-record
            </Button>
          )}
        </div>

        {/* Right: Submit Button & Shortcut Indicator */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {voiceSupported && !isListening && !hasAnswered && !isProcessing && (
            <span className="text-xs text-text-muted hidden md:inline">
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border-subtle font-mono text-[10px]">
                Space
              </kbd>{' '}
              to toggle mic
            </span>
          )}

          <Button
            variant="primary"
            size="md"
            onClick={onSubmit}
            disabled={!canSubmit}
            isLoading={isSubmitting}
            leftIcon={!isSubmitting ? <Send className="h-3.5 w-3.5" /> : undefined}
            className="w-full sm:w-auto px-6 py-2 bg-slate-900 hover:bg-black text-white font-semibold shadow-sm"
          >
            Submit answer
          </Button>
        </div>
      </div>
    </div>
  );
};
