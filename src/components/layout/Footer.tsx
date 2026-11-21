import React from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-8 text-xs text-slate-500">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-indigo-400" />
            <span>
              {APP_CONFIG.appName} • Direct Browser-to-Groq Architecture
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Strict In-Memory Privacy: No data stored in localStorage or remote database</span>
          </div>

          <div className="text-slate-600">
            Phase 1: Frontend Foundation
          </div>
        </div>
      </div>
    </footer>
  );
};
