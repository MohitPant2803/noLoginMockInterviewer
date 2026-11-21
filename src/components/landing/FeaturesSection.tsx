import React from 'react';
import { Mic, FileCode, GitFork, Award, ShieldCheck, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: FileCode,
      title: 'Contextual Resume Matching',
      description:
        'Upload your PDF or DOCX resume or paste your experience. The AI drafts interview questions matched directly to your projects and target role.',
    },
    {
      icon: Mic,
      title: 'Voice-First Interaction',
      description:
        'Speak your answers naturally using browser speech recognition. Practice articulating complex architectural and behavioral thoughts clearly.',
    },
    {
      icon: GitFork,
      title: 'Adaptive Follow-Up Questions',
      description:
        'Just like a seasoned hiring manager, the AI digs into edge cases, trade-offs, and technical specifics based directly on what you answered.',
    },
    {
      icon: Award,
      title: 'In-Depth Performance Report',
      description:
        'Get a structured evaluation with overall readiness scores, category breakdowns, highlighted strengths, and model answer suggestions.',
    },
    {
      icon: ShieldCheck,
      title: 'Complete Data Privacy',
      description:
        'Your resume, API key, and transcripts live only in your temporary browser memory. Nothing is stored in cookies, localStorage, or remote databases.',
    },
    {
      icon: Zap,
      title: 'Lightning-Fast Inference',
      description:
        'Powered by direct client-side integration with Groq high-speed Llama models, keeping latency minimal for realistic conversational pacing.',
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs uppercase tracking-widest text-indigo-400 font-semibold mb-2">
            Features & Capabilities
          </h2>
          <p className="text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
            Everything you need for realistic interview preparation
          </p>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Engineered to simulate authentic technical and behavioral evaluation cycles with zero friction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card
                key={idx}
                className="bg-slate-900/40 border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="h-10 w-10 rounded-lg bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center text-indigo-400 mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-100 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Workflow Overview */}
        <div className="mt-20 rounded-2xl border border-slate-800 bg-slate-900/30 p-8 sm:p-10">
          <h3 className="text-lg font-semibold text-slate-200 mb-6 text-center">
            How a Mock Session Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-indigo-400 font-bold text-sm mb-3">
                1
              </span>
              <h4 className="font-medium text-slate-200 text-sm mb-1">Configure</h4>
              <p className="text-xs text-slate-400">
                Provide your target role, paste or upload your resume, and configure question preferences.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-indigo-400 font-bold text-sm mb-3">
                2
              </span>
              <h4 className="font-medium text-slate-200 text-sm mb-1">Interview</h4>
              <p className="text-xs text-slate-400">
                Answer questions via voice or text. Receive dynamic follow-ups based on your exact answers.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-indigo-400 font-bold text-sm mb-3">
                3
              </span>
              <h4 className="font-medium text-slate-200 text-sm mb-1">Review</h4>
              <p className="text-xs text-slate-400">
                Inspect categorized scoring, detailed critique, and concrete suggestions to improve before game day.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
