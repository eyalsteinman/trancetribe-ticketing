import React, { forwardRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';

interface RtlTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoDetectRtl?: boolean;
}

const RtlTextArea = forwardRef<HTMLTextAreaElement, RtlTextAreaProps>(
  ({ autoDetectRtl = true, className = '', value, ...props }, ref) => {
    const { isRTL } = useLanguage();
    
    // Check if text contains Hebrew characters (fallback if context not used)
    const hasHebrewCharacters = autoDetectRtl && value ? 
      /[\u0590-\u05FF]/.test(value.toString()) : false;
    const shouldUseRTL = isRTL || hasHebrewCharacters;
    
    return (
      <Textarea
        ref={ref}
        className={`${className} ${shouldUseRTL ? 'text-right' : 'text-left'}`}
        dir={shouldUseRTL ? 'rtl' : 'ltr'}
        value={value}
        {...props}
      />
    );
  }
);

RtlTextArea.displayName = 'RtlTextArea';

export default RtlTextArea;