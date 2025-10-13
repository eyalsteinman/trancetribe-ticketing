import React from 'react';
import BackButton from '@/components/ui/back-button';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

const PageHeader = ({ title, onBack, showBackButton = true }: PageHeaderProps) => {
  return (
    <div className="container-section flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-white">
        {title}
      </h1>
      {showBackButton && onBack && (
        <BackButton onBack={onBack} />
      )}
    </div>
  );
};

export default PageHeader;