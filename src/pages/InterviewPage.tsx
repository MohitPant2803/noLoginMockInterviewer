import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useConfigStore } from '@/store';
import { InterviewRoom } from '@/components/interview/InterviewRoom';
import { Button } from '@/components/ui';

export const InterviewPage: React.FC = () => {
  const hasValidConfig = useConfigStore((state) => state.hasValidConfig());

  if (!hasValidConfig) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 min-h-[60vh]">
        <div className="max-w-md w-full rounded border border-border-subtle bg-surface p-6 text-center space-y-3">
          <div className="mx-auto h-10 w-10 rounded bg-surface-muted flex items-center justify-center text-text-muted">
            <AlertCircle className="h-5 w-5" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-semibold text-text-primary">No active interview session</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Configure your target role, resume context, and Groq API key to enter the interview studio.
            </p>
          </div>

          <div className="pt-2">
            <Link to="/setup">
              <Button size="md" className="w-full">
                Configure interview
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 py-4 w-full">
      <div className="max-w-container mx-auto px-4 sm:px-6 mb-2">
        <Link
          to="/setup"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Back to setup</span>
        </Link>
      </div>

      <InterviewRoom />
    </div>
  );
};
