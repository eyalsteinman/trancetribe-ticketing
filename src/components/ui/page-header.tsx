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
  return (
    <header className="flex justify-between items-center py-4 px-6 border-b border-gray-700">
      {showBackButton && onBack ? (
        <button 
          onClick={onBack} 
          className="flex items-center text-gray-400 hover:text-white transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          <span className="hidden sm:inline">Back</span>
        </button>
      ) : (
        <div></div>
      )}
      
      <div className="flex items-center space-x-2">
        <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-xl font-bold text-gray-200">{title}</h1>
      </div>
      
      <div></div>
    </header>
  );
};

export default PageHeader;