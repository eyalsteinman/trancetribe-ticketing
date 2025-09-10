import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface RtlTextProps {
  text: string;
  className?: string;
  children?: React.ReactNode;
}

const RtlText = ({ text, className = '', children }: RtlTextProps) => {
  const { isRTL } = useLanguage();
  
  // Check if text contains Hebrew characters (fallback if context not used)
  const hasHebrewCharacters = /[\u0590-\u05FF]/.test(text);
  const shouldUseRTL = isRTL || hasHebrewCharacters;
  
  return (
    <div 
      className={`${className} ${shouldUseRTL ? 'text-right' : 'text-left'}`}
      dir={shouldUseRTL ? 'rtl' : 'ltr'}
    >
      {children || text}
    </div>
  );
};

export default RtlText;