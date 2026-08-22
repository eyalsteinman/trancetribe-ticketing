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
      size="sm"
      onClick={onBack}
      aria-label={t('back')}
      className={cn('min-h-11 gap-1.5', className)}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {t('back')}
    </Button>

  );
};

export default BackButton;
