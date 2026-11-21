import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';
import { useConfigStore } from '@/store';
import { InterviewRoom } from '@/components/interview/InterviewRoom';
import { Button, Card, CardContent } from '@/components/ui';

export const InterviewPage: React.FC = () => {
  const hasValidConfig = useConfigStore((state) => state.hasValidConfig());

  if (!hasValidConfig) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-slate-800 bg-slate-900/60 text-center">
          <CardContent className="p-8 space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-amber-950/60 border border-amber-800/50 flex items-center justify-center text-amber-400">
              <AlertCircle className="h-6 w-6" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-100">No Active Interview Setup</h2>
              <p className="text-sm text-slate-400">
                You haven't configured an interview session yet. Please specify your target job role,
                resume, and Groq API key to enter the interview room.
              </p>
            </div>

            <div className="pt-2">
              <Link to="/setup">
                <Button size="lg" className="w-full" leftIcon={<Sparkles className="h-4 w-4" />}>
                  Configure Interview Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/setup" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Setup
        </Link>
      </div>

      <InterviewRoom />
    </div>
  );
};
