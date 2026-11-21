import React, { useState } from 'react';
import { Key, Eye, EyeOff, ShieldCheck, ExternalLink, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui';

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ value, onChange, error }) => {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="space-y-2">
      <Input
        label="Groq API Key"
        type={showKey ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="gsk_..."
        required
        error={error}
        leftElement={<Key className="h-4 w-4" />}
        rightElement={
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="p-1 hover:text-slate-200 transition-colors focus:outline-none"
            aria-label={showKey ? 'Mask API key' : 'Show API key'}
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />

      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 text-xs text-slate-400 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Strict In-Memory Storage</span>
          </div>
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Get a Groq API key
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <p className="leading-relaxed">
          Your key resides strictly in client-side React memory. It is never persisted to disk,
          localStorage, or sent to any telemetry server.
        </p>

        <div className="flex items-start gap-1.5 text-[11px] text-amber-400/90 pt-1 border-t border-slate-800/60">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400" />
          <span>
            Format verification only: API key validity and inference quota will be confirmed directly
            with Groq when starting your interview questions.
          </span>
        </div>
      </div>
    </div>
  );
};
