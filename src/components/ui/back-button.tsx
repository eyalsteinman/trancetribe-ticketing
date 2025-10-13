import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface BackButtonProps {
  onBack: () => void;
  className?: string;
}

const BackButton = ({ onBack, className }: BackButtonProps) => {
  const { t } = useLanguage();
  
  return (
    <Button
      variant="outline"
      onClick={onBack}
      className={cn(
        "flex items-center gap-2 px-3 py-2 h-auto text-sm font-medium",
        "border-foreground/20 bg-background/50 backdrop-blur-sm",
        "text-foreground hover:bg-foreground/10",
        "transition-all duration-200",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {t('back')}
    </Button>
  );
};

export default BackButton;