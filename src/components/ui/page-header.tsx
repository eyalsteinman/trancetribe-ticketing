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

const PageHeader = ({ title, onBack, showBackButton = true, titleColor, isBackgroundDark, fixed = false }: PageHeaderProps) => {
  const headerClasses = fixed 
    ? "fixed top-0 left-0 right-0 z-50 p-4 flex items-center justify-between bg-background/80 backdrop-blur-sm"
    : "relative p-4 flex items-center justify-between";

  return (
    <div className={headerClasses}>
      {/* Title on the left */}
      <h1 
        className="text-2xl font-bold"
        style={{ 
          color: titleColor || (isBackgroundDark ? '#ffffff' : '#000000')
        }}
      >
        {title}
      </h1>
      
      {/* Back button on the right */}
      {showBackButton && onBack && (
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          aria-label="Back"
          className="on-color"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default PageHeader;