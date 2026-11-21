import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';

export const HeroSection: React.FC = () => {
  return (
    <section className="pt-16 pb-16 md:pt-24 md:pb-24 border-b border-border-subtle bg-canvas">
      <div className="mx-auto max-w-container px-4 sm:px-6">
        <div className="max-w-2xl space-y-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-text-primary leading-tight">
            Realistic Technical Mock Interviews
          </h1>

          <p className="text-base sm:text-lg text-text-secondary leading-relaxed font-normal">
            Practice with voice input and adaptive follow-ups in your browser.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link to="/setup">
              <Button size="lg" variant="primary">
                Configure interview
              </Button>
            </Link>

            <a href="#mechanics">
              <Button variant="outline" size="lg">
                Explore mechanics
              </Button>
            </a>
          </div>

          <div className="pt-6 border-t border-border-subtle grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs text-text-muted">
            <div>
              <span className="font-medium text-text-primary block">In-memory execution</span>
              <span className="text-text-muted">No database or cookie storage</span>
            </div>
            <div>
              <span className="font-medium text-text-primary block">Web Speech API</span>
              <span className="text-text-muted">Native voice input and playback</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="font-medium text-text-primary block">Evaluated feedback</span>
              <span className="text-text-muted">Scored critique and model answers</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
