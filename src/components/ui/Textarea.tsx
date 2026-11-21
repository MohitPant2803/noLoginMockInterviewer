import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const textareaId = id || props.name;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-medium text-text-secondary">
            {label}
            {props.required && <span className="text-status-danger ml-1">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            'w-full rounded border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors leading-relaxed',
            'border-border-subtle focus:border-border-focus focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-40 min-h-[90px]',
            error && 'border-status-danger focus:border-status-danger',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-status-danger">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-text-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
