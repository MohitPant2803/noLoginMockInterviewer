import React from 'react';
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
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>
          Main question {Math.min(mainQuestionsAsked, mainQuestionCount)} of {mainQuestionCount}
        </span>
        <span>{pct}% complete</span>
      </div>
      <div className="w-full h-1.5 bg-surface-muted rounded overflow-hidden">
        <div
          className="h-full rounded bg-accent transition-transform duration-300 origin-left"
          style={{ transform: `scaleX(${Math.min(pct, 100) / 100})` }}
        />
      </div>
    </div>
  );
};
