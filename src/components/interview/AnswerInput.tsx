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
    sessionStatus === 'in_progress';
  const isProcessing = sessionStatus === 'evaluating' || sessionStatus === 'generating_followup';
  const isDisabled = hasAnswered || isProcessing || sessionStatus !== 'in_progress';

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
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <Keyboard className="h-4 w-4 text-emerald-400" />
          <span>Your Response</span>
        </div>
        {isListening && (
          <span className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Recording...
          </span>
        )}
        {isProcessing && (
          <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {sessionStatus === 'evaluating' ? 'Evaluating answer...' : 'Generating next question...'}
          </span>
        )}
        {hasAnswered && !isProcessing && (
          <span className="text-xs text-emerald-400 font-medium">✓ Answer submitted</span>
        )}
      </div>

      {/* Answer text area */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={isListening ? fullDisplay : (transcript || typedAnswer)}
          onChange={(e) => {
            if (!isListening && !hasAnswered) {
              onTypedAnswerChange(e.target.value);
            }
          }}
          readOnly={isListening || hasAnswered || isProcessing}
          rows={5}
          placeholder={
            isListening
              ? 'Listening... speak now'
              : hasAnswered
                ? 'Answer submitted'
                : voiceSupported
                  ? 'Press Space or the mic button to start recording, or type your answer here...'
                  : 'Type your answer here...'
          }
          className={`w-full rounded-lg border bg-slate-950/70 p-4 text-sm leading-relaxed transition-colors resize-none focus:outline-none focus:ring-1 ${
            isListening
              ? 'border-red-500/60 focus:ring-red-500 text-slate-100'
              : hasAnswered
                ? 'border-emerald-800/60 text-slate-300 cursor-default'
                : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500 text-slate-100'
          } placeholder:text-slate-600`}
        />
        {isListening && interimTranscript && (
          <div className="absolute bottom-2 left-4 right-4 text-xs text-slate-500 italic truncate pointer-events-none">
            Hearing: {interimTranscript}
          </div>
        )}
      </div>

      {/* Voice error */}
      {voiceError && (
        <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-900/40 text-xs text-red-300 flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
          {voiceError}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
        {/* Mic controls */}
        {voiceSupported && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!isListening ? (
              <Button
                variant="outline"
                size="md"
                onClick={onStartRecording}
                disabled={isDisabled}
                leftIcon={<Mic className="h-4 w-4" />}
                className="flex-1 sm:flex-initial"
              >
                Start Recording
              </Button>
            ) : (
              <Button
                variant="danger"
                size="md"
                onClick={onStopRecording}
                leftIcon={<MicOff className="h-4 w-4" />}
                className="flex-1 sm:flex-initial"
              >
                Stop Recording
              </Button>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
          {voiceSupported && !isListening && !hasAnswered && !isProcessing && (
            <span className="text-[11px] text-slate-500 hidden lg:inline">
              Space = toggle mic
            </span>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={onSubmit}
            disabled={!canSubmit}
            isLoading={isSubmitting}
            leftIcon={!isSubmitting ? <Send className="h-4 w-4" /> : undefined}
            className="flex-1 sm:flex-initial"
          >
            Submit Answer
          </Button>
        </div>
      </div>
    </div>
  );
};
