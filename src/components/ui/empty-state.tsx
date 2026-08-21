import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'error';
  className?: string;
}

/** Friendly empty / error screen used across the app. */
const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default',
  className,
}: EmptyStateProps) => {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-border/60 bg-card/60 px-6 py-10 text-center backdrop-blur-xl',
        className
      )}
    >
      {icon && (
        <div
          aria-hidden="true"
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full',
            variant === 'error' ? 'bg-destructive/15 text-destructive' : 'bg-primary/15 text-primary'
          )}
        >
          {icon}
        </div>
      )}
      <h2 className="font-display text-xl tracking-wide text-foreground">{title}</h2>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-2 min-h-11">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
