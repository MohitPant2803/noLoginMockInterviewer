import React from 'react';
import { SetupForm } from '@/components/setup/SetupForm';
import { Sparkles, ShieldCheck, Cpu } from 'lucide-react';

export const InterviewSetupPage: React.FC = () => {
  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-800 bg-slate-900/90 text-xs text-indigo-400 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Stage 1 • Interview Configuration</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
          Set Up Your Mock Interview
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          Upload your resume and choose your target role. Your resume text is extracted client-side
          in browser memory and used to formulate realistic, personalized interview questions.
        </p>
      </div>

      <SetupForm />

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>In-Memory Only: No data saved to localStorage or databases</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Cpu className="h-4 w-4 text-indigo-400" />
          <span>Direct Browser-to-Groq LLM communication</span>
        </div>
      </div>
    </div>
  );
};
