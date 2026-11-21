import React from 'react';
import { Mic, FileText, Award } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      icon: FileText,
      title: 'Contextual intake',
      description:
        'Upload your PDF or DOCX resume or paste plaintext. Text is parsed directly in your browser without uploading files to any server.',
    },
    {
      num: '02',
      icon: Mic,
      title: 'Voice-driven interview',
      description:
        'Speak your answers using the Web Speech API or use the spacebar shortcut. The AI probes interesting claims with adaptive follow-ups.',
    },
    {
      num: '03',
      icon: Award,
      title: 'Structured scorecard',
      description:
        'Receive categorized evaluation across technical correctness, clarity, and reasoning, complete with model answers and PDF export.',
    },
  ];

  return (
    <section id="mechanics" className="py-16 md:py-24 bg-canvas border-b border-border-subtle">
      <div className="mx-auto max-w-container px-4 sm:px-6">
        <div className="max-w-2xl mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
            How the interview loop operates
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            A three-stage evaluation cycle designed to mirror real technical and behavioral rounds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="p-6 rounded border border-border-subtle bg-surface space-y-3"
              >
                <div className="flex items-center justify-between text-text-muted">
                  <Icon className="h-4 w-4" />
                  <span className="font-mono text-xs text-text-muted">{step.num}</span>
                </div>
                <h3 className="text-sm font-semibold text-text-primary">
                  {step.title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed font-normal">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
