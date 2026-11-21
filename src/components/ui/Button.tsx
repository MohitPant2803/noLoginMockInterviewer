import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded transition-colors focus-visible:outline-none disabled:opacity-40 disabled:pointer-events-none select-none cursor-pointer';

    const variants = {
      primary:
        'bg-slate-900 text-white hover:bg-black active:scale-[0.99] shadow-sm font-semibold',
      secondary:
        'bg-surface text-text-primary border border-border-strong hover:bg-surface-elevated hover:border-text-secondary shadow-xs',
      outline:
        'border border-border-strong bg-transparent text-text-primary hover:bg-surface-muted hover:text-text-primary',
      ghost:
        'bg-transparent text-text-secondary hover:bg-surface-muted hover:text-text-primary',
      danger:
        'bg-status-danger text-white hover:brightness-110 active:brightness-90 font-medium',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-sm px-3.5 py-2 gap-2',
      lg: 'text-sm font-semibold px-5 py-2.5 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
