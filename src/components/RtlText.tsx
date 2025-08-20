import React from 'react';

interface RtlTextProps {
  text: string;
  className?: string;
}

const RtlText = ({ text, className = '' }: RtlTextProps) => {
  // Check if text contains Hebrew characters
  const hasHebrewCharacters = /[\u0590-\u05FF]/.test(text);
  
  return (
    <div 
      className={`${className} ${hasHebrewCharacters ? 'text-right' : 'text-left'}`}
      dir={hasHebrewCharacters ? 'rtl' : 'ltr'}
    >
      {text}
    </div>
  );
};

export default RtlText;