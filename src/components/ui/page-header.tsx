import React from 'react';
import BackButton from '@/components/ui/back-button';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

const PageHeader = ({ title, onBack, showBackButton = true }: PageHeaderProps) => {
  return (
    <div className="page-header">
      <div className="flex items-center gap-4">
        {showBackButton && onBack && (
          <BackButton onBack={onBack} />
        )}
        <h1 className="page-title">{title}</h1>
      </div>
    </div>
  );
};

export default PageHeader;