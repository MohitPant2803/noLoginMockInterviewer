import React from 'react';
import { cn } from '@/lib/utils';
import type { InterviewSession } from '@/types';

interface InterviewProgressProps {
  session: InterviewSession;
}

export const InterviewProgress: React.FC<InterviewProgressProps> = ({ session }) => {
  const { mainQuestionCount, mainQuestionsAsked, questions, answers } = session;
  const mainAnswered = answers.filter((a) => {
    const q = questions.find((qq) => qq.id === a.questionId);
    return q && !q.isFollowUp;
  }).length;
  const pct = mainQuestionCount > 0 ? Math.round((mainAnswered / mainQuestionCount) * 100) : 0;

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Main question {Math.min(mainQuestionsAsked, mainQuestionCount)} of {mainQuestionCount}
        </span>
        <span>{pct}% complete</span>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            pct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'
          )}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
};
