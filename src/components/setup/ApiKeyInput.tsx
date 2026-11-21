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
        label="Groq API key"
        type={showKey ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="gsk_..."
        required
        error={error}
        leftElement={<Key className="h-3.5 w-3.5" />}
        rightElement={
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="p-1 text-text-muted hover:text-text-primary transition-colors focus-visible:outline-none"
            aria-label={showKey ? 'Mask API key' : 'Show API key'}
          >
            {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        }
      />

      <div className="rounded border border-border-subtle bg-surface p-3.5 text-xs text-text-muted space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium text-text-secondary">
            <ShieldCheck className="h-3.5 w-3.5 text-status-success" />
            <span>In-memory storage only</span>
          </div>
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors"
          >
            <span>Obtain key from Groq console</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <p className="leading-relaxed">
          The API key resides in temporary browser memory and is never written to disk or sent to application servers.
        </p>

        <div className="flex items-start gap-1.5 text-text-muted pt-1 border-t border-border-subtle">
          <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5 text-status-warning" />
          <span>
            Key validity and quota will be verified directly with Groq on session start.
          </span>
        </div>
      </div>
    </div>
  );
};
