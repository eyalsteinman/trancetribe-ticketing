import React from 'react';
import BackButton from '@/components/ui/back-button';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBackButton?: boolean;
  actions?: React.ReactNode;
}

const PageHeader = ({ title, subtitle, onBack, showBackButton = true, actions }: PageHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 -mx-4 mb-4 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 py-3">
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl leading-none tracking-wide text-foreground sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {showBackButton && onBack && <BackButton onBack={onBack} />}
        </div>
      </div>
      <div className="h-px w-full bg-gradient-primary opacity-60" />
    </header>
  );
};

export default PageHeader;
