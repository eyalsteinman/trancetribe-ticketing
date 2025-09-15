import React from 'react';
import BackButton from '@/components/ui/back-button';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

const PageHeader = ({ title, onBack, showBackButton = true }: PageHeaderProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border p-2 flex items-center justify-between">
      <h1 className="text-xl font-bold text-foreground">
        {title}
      </h1>
      {showBackButton && onBack && (
        <BackButton onBack={onBack} />
      )}
    </div>
  );
};

export default PageHeader;