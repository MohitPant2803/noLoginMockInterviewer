import React from 'react';
import { SetupForm } from '@/components/setup/SetupForm';
import { ShieldCheck, Cpu } from 'lucide-react';

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

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-text-muted pt-4 border-t border-border-subtle">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-status-success" />
          <span>In-memory only: credentials and resume reset on tab reload</span>
        </div>
        <div className="flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5 text-text-muted" />
          <span>Direct browser-to-Groq API execution</span>
        </div>
      </div>
    </div>
  );
};
