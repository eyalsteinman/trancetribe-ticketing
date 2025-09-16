import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import Footer from '@/components/ui/footer';
import { useBackground } from '@/contexts/BackgroundContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBackNavigation } from '@/hooks/useBackNavigation';

interface InsuranceProps {
  onBack: () => void;
}

const Insurance = ({ onBack }: InsuranceProps) => {
  const { backgroundColor, isBackgroundDark } = useBackground();
  const { t } = useLanguage();
  
  useBackNavigation({
    onBackNavigation: onBack,
    isActive: true
  });

  return (
    <div
      className="min-h-screen p-4 transition-colors duration-500"
      style={{
        backgroundColor
      }}
    >
      <PageHeader
        title={t('insurance')}
        onBack={onBack}
      />
      
      <div className="max-w-md mx-auto pt-20 space-y-6 text-left">

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('insurance_description')}
          </p>

          <Button size="lg" className="mt-2">{t('buy_now')}</Button>

          <div className="text-xs text-muted-foreground">
            {t('for_terms')}
            {' '}
            <a className="underline underline-offset-4" href="/insurance-terms.pdf" download>
              {t('press_here')}
            </a>
            .
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Insurance;
