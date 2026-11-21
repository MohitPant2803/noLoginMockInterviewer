import React from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-border-subtle bg-canvas py-6 text-xs text-text-muted">
      <div className="mx-auto max-w-container px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 text-text-secondary">
            <Cpu className="h-3.5 w-3.5 text-text-muted" />
            <span>Direct browser-to-Groq architecture</span>
          </div>

          <div className="flex items-center gap-2 text-text-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-status-success" />
            <span>In-memory runtime, zero disk or cookie persistence</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
