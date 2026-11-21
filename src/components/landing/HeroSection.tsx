import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield, Mic } from 'lucide-react';
import { Button } from '@/components/ui';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 border-b border-slate-900 overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center">
        <div className="h-72 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Top pill badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3.5 py-1 text-xs text-slate-300 mb-8 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Real-time voice-driven mock interviews powered by AI</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-100 max-w-4xl mx-auto leading-tight sm:leading-tight">
          Master Your Next Tech Interview with an{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            Intelligent AI Interviewer
          </span>
        </h1>

        {/* Explanation */}
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Upload your resume, specify your target role, and practice with realistic technical and
          behavioral questions. Speak your answers, tackle adaptive follow-ups, and receive deep,
          actionable feedback—all running directly in your browser.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/setup" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto text-base font-semibold shadow-lg shadow-indigo-600/20" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Start Interview
            </Button>
          </Link>

          <a href="#features" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
              Explore Features
            </Button>
          </a>
        </div>

        {/* Trust points */}
        <div className="mt-12 pt-8 border-t border-slate-900/60 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span>Zero Login & Zero Stored Data</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Mic className="h-4 w-4 text-indigo-400" />
            <span>Speech Recognition & Voice Playback</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span>Detailed Scoring & Breakdown</span>
          </div>
        </div>
      </div>
    </section>
  );
};
