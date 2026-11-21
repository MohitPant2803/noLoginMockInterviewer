import React from 'react';
import { Bot, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import type { InterviewQuestion, SessionStatus } from '@/types';

interface QuestionDisplayProps {
  question: InterviewQuestion | undefined;
  status: SessionStatus;
  isSpeaking: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onReplay: () => void;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  status,
  isSpeaking,
  isMuted,
  onToggleMute,
  onReplay,
}) => {
  if (!question) return null;

  const isProcessing = status === 'evaluating' || status === 'generating_followup';

  return (
    <div className="rounded border border-border-subtle bg-surface p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-surface-muted flex items-center justify-center text-text-secondary">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-medium text-text-secondary">
            Interviewer
          </span>
          {isSpeaking && (
            <span className="text-xs text-accent-text font-normal">
              Speaking
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMute}
            title={isMuted ? 'Unmute question audio' : 'Mute question audio'}
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReplay}
            disabled={isProcessing}
            title="Replay question"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="default" className="text-xs">
          {question.category}
        </Badge>
        {question.difficulty && (
          <Badge variant="outline" className="text-xs capitalize">
            {question.difficulty}
          </Badge>
        )}
        {question.isFollowUp && (
          <Badge variant="info" className="text-xs">
            Follow-up
          </Badge>
        )}
      </div>

      <p className="text-base sm:text-lg font-medium text-text-primary leading-relaxed">
        {question.questionText}
      </p>
    </div>
  );
};
