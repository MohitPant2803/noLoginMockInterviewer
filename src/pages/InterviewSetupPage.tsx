import React from 'react';
import { SetupForm } from '@/components/setup/SetupForm';

export const InterviewSetupPage: React.FC = () => {
  return (
    <div className="flex-1 py-10 px-4 sm:px-6 max-w-container mx-auto w-full space-y-8">
      <div className="max-w-xl space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
          Configure interview session
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed font-normal">
          Provide your target role and resume context. Documents are parsed locally in browser memory.
        </p>
      </div>

      <SetupForm />
    </div>
  );
};
