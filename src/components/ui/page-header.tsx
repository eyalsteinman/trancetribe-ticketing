import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
  titleStyle?: React.CSSProperties;
}

const PageHeader = ({ title, onBack, showBackButton = true, titleStyle }: PageHeaderProps) => {
  return (
    <div className="relative w-full mb-6">
      {/* Title on the left */}
      <h1 
        className="text-2xl font-bold absolute left-0 top-0"
        style={titleStyle}
      >
        {title}
      </h1>
      
      {/* Back button on the right */}
      {showBackButton && onBack && (
        <button
          onClick={onBack}
          className="absolute top-0 right-0 p-2 rounded-lg border border-border hover:bg-accent transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default PageHeader;