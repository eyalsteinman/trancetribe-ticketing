import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
  titleColor?: string;
  isBackgroundDark?: boolean;
  fixed?: boolean;
}

const PageHeader = ({ title, onBack, showBackButton = true }: PageHeaderProps) => {
  const headerClasses = "page-header";

  return (
    <div className={headerClasses}>
      {showBackButton && onBack && (
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          aria-label="Back"
          className="back-button back-button-consistent mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      <h1 className="headline-consistent text-foreground">
        {title}
      </h1>
    </div>
  );
};

export default PageHeader;