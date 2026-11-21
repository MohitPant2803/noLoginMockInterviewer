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

  const categoryColors: Record<string, string> = {
    technical: 'bg-blue-950 text-blue-400 border-blue-800',
    behavioral: 'bg-purple-950 text-purple-400 border-purple-800',
    situational: 'bg-amber-950 text-amber-400 border-amber-800',
    background: 'bg-teal-950 text-teal-400 border-teal-800',
  };

  const isProcessing = status === 'evaluating' || status === 'generating_followup';

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Bot className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Interviewer
          </span>
          {isSpeaking && (
            <span className="flex items-center gap-1 text-xs text-indigo-400">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Speaking...
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMute}
            title={isMuted ? 'Unmute question audio' : 'Mute question audio'}
            className="text-slate-400 hover:text-slate-200"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReplay}
            disabled={isProcessing}
            title="Replay question"
            className="text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
            categoryColors[question.category] || categoryColors.technical
          }`}
        >
          {question.category}
        </span>
        {question.difficulty && (
          <Badge variant="outline" className="text-[10px] capitalize">
            {question.difficulty}
          </Badge>
        )}
        {question.isFollowUp && (
          <Badge variant="info" className="text-[10px]">
            Follow-up
          </Badge>
        )}
      </div>

      <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
        {question.questionText}
      </p>
    </div>
  );
};
