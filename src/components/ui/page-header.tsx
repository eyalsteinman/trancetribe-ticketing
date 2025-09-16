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
    <div className="page-header">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-4 mb-2">
            {showBackButton && onBack && (
              <BackButton onBack={onBack} />
            )}
            <h1 className="page-title text-balance">{title}</h1>
          </div>
          {subtitle && (
            <p className="page-subtitle">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;