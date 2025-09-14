import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

interface RtlInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  autoDetectRtl?: boolean;
}

const RtlInput = forwardRef<HTMLInputElement, RtlInputProps>(
  ({ autoDetectRtl = true, className = '', value, ...props }, ref) => {
    const { isRTL } = useLanguage();
    
    // Check if text contains Hebrew characters (fallback if context not used)
    const hasHebrewCharacters = autoDetectRtl && value ? 
      /[\u0590-\u05FF]/.test(value.toString()) : false;
    const shouldUseRTL = isRTL || hasHebrewCharacters;
    
    return (
      <Input
        ref={ref}
        className={`${className} ${shouldUseRTL ? 'text-right' : 'text-left'}`}
        dir={shouldUseRTL ? 'rtl' : 'ltr'}
        value={value}
        {...props}
      />
    );
  }
);

RtlInput.displayName = 'RtlInput';

export default RtlInput;