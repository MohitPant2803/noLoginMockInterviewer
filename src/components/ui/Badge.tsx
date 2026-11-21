import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'info' | 'outline' | 'danger';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-surface-muted text-text-secondary border-border-subtle',
    success: 'bg-status-success-bg text-status-success border-status-success-border',
    warning: 'bg-status-warning-bg text-status-warning border-status-warning-border',
    info: 'bg-accent-surface text-accent-text border-accent-border',
    outline: 'bg-transparent text-text-muted border-border-subtle',
    danger: 'bg-status-danger-bg text-status-danger border-status-danger-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2 py-0.5 text-xs font-normal normal-case leading-none',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
