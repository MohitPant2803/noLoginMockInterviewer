import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Keyboard, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import type { SessionStatus } from '@/types';

interface AnswerInputProps {
  transcript: string;
  interimTranscript: string;
  typedAnswer: string;
  onTypedAnswerChange: (val: string) => void;
  isListening: boolean;
  isTranscribing?: boolean;
  transcriptionEngine?: 'browser' | 'whisper';
  voiceSupported: boolean;
  voiceError: string | null;
  sessionStatus: SessionStatus;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  hasAnswered: boolean;
}

export const AnswerInput: React.FC<AnswerInputProps> = ({
  transcript,
  interimTranscript,
  typedAnswer,
  onTypedAnswerChange,
  isListening,
  isTranscribing = false,
  transcriptionEngine = 'browser',
  voiceSupported,
  voiceError,
  sessionStatus,
  onStartRecording,
  onStopRecording,
  onSubmit,
  isSubmitting,
  hasAnswered,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const displayText = transcript || typedAnswer;
  const fullDisplay = displayText + (interimTranscript ? ` ${interimTranscript}` : '');
  const canSubmit =
    (displayText.trim().length > 0 || interimTranscript.length > 0) &&
    !isSubmitting &&
    !hasAnswered &&
    !isTranscribing &&
    sessionStatus === 'in_progress';
  const isProcessing = sessionStatus === 'evaluating' || sessionStatus === 'generating_followup';
  const isDisabled = hasAnswered || isProcessing || isTranscribing || sessionStatus !== 'in_progress';

  // Space-key shortcut (not in textareas or inputs)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isDisabled) return;
      const target = e.target as HTMLElement;
      const isTypingArea =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;
      if (isTypingArea) return;
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
    <div className="rounded border border-border-subtle bg-surface p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
          <Keyboard className="h-3.5 w-3.5 text-text-muted" />
          <span>Candidate response</span>
        </div>
        {isListening && (
          <span className="flex items-center gap-1.5 text-xs text-status-danger font-medium">
            <span className="h-2 w-2 rounded-full bg-status-danger animate-pulse" />
            {transcriptionEngine === 'whisper'
              ? 'Recording (Groq Whisper AI)...'
              : 'Listening... speak now'}
          </span>
        )}
        {isTranscribing && (
          <span className="flex items-center gap-1.5 text-xs text-text-primary font-medium bg-surface-elevated px-2 py-0.5 rounded border border-border-subtle">
            <Loader2 className="h-3 w-3 animate-spin text-accent" />
            Transcribing speech with Whisper AI...
          </span>
        )}
        {isProcessing && (
          <span className="flex items-center gap-1.5 text-xs text-accent-text font-normal">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {sessionStatus === 'evaluating' ? 'Evaluating answer...' : 'Generating follow-up...'}
          </span>
        )}
        {hasAnswered && !isProcessing && (
          <span className="text-xs text-status-success font-medium">Answer submitted</span>
        )}
      </div>

      {/* Answer text area */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={isListening ? fullDisplay : (transcript || typedAnswer)}
          onChange={(e) => {
            if (!isListening && !hasAnswered && !isTranscribing) {
              onTypedAnswerChange(e.target.value);
            }
          }}
          readOnly={isListening || hasAnswered || isProcessing || isTranscribing}
          rows={5}
          placeholder={
            isListening
              ? transcriptionEngine === 'whisper'
                ? 'Recording your voice... text will appear when you stop recording'
                : 'Listening... speak now'
              : isTranscribing
                ? 'Transcribing your audio with Groq Whisper AI...'
                : hasAnswered
                  ? 'Answer submitted'
                  : voiceSupported
                    ? 'Press Space or the record button to speak, or type your answer here...'
                    : 'Type your answer here...'
          }
          className={`w-full rounded border bg-canvas p-3.5 text-sm leading-relaxed transition-colors resize-none focus:outline-none ${
            isListening
              ? 'border-status-danger focus:border-status-danger text-text-primary'
              : isTranscribing
                ? 'border-accent bg-surface-elevated text-text-muted cursor-wait'
                : hasAnswered
                  ? 'border-status-success-border text-text-secondary cursor-default'
                  : 'border-border-subtle focus:border-border-focus text-text-primary'
          } placeholder:text-text-muted`}
        />
        {isListening && interimTranscript && (
          <div className="absolute bottom-2 left-3.5 right-3.5 text-xs text-text-muted italic truncate pointer-events-none">
            Hearing: {interimTranscript}
          </div>
        )}
      </div>

      {/* Voice error */}
      {voiceError && (
        <div className="p-2.5 rounded bg-status-danger-bg border border-status-danger-border text-xs text-status-danger flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{voiceError}</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
        {voiceSupported && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isTranscribing ? (
              <Button
                variant="outline"
                size="md"
                disabled
                leftIcon={<Loader2 className="h-4 w-4 animate-spin" />}
                className="flex-1 sm:flex-initial"
              >
                Transcribing...
              </Button>
            ) : !isListening ? (
              <Button
                variant="outline"
                size="md"
                onClick={onStartRecording}
                disabled={isDisabled}
                leftIcon={<Mic className="h-4 w-4" />}
                className="flex-1 sm:flex-initial"
              >
                Start recording
              </Button>
            ) : (
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
          </div>
        )}

        <div className="flex items-center gap-3 w-full sm:w-auto sm:ml-auto">
          {voiceSupported && !isListening && !hasAnswered && !isProcessing && (
            <span className="text-xs text-text-muted hidden lg:inline">
              Space to toggle mic
            </span>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={onSubmit}
            disabled={!canSubmit}
            isLoading={isSubmitting}
            leftIcon={!isSubmitting ? <Send className="h-3.5 w-3.5" /> : undefined}
            className="flex-1 sm:flex-initial"
          >
            Submit answer
          </Button>
        </div>
      </div>
    </div>
  );
};
