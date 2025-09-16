import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import Footer from '@/components/ui/footer';
import { useBackground } from '@/contexts/BackgroundContext';
import { useBackNavigation } from '@/hooks/useBackNavigation';

interface InsuranceProps {
  onBack: () => void;
}

const Insurance = ({ onBack }: InsuranceProps) => {
  const { backgroundColor, isBackgroundDark } = useBackground();
  
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
        title="Insurance"
        onBack={onBack}
      />
      
      <div className="max-w-md mx-auto pt-20 space-y-6 text-left">

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Buy insurance for parties. 19 ILS a month. Get covered for any party and any unused tickets for up to 400 ILS per year.
          </p>

          <Button size="lg" className="mt-2">Buy Now!</Button>

          <div className="text-xs text-muted-foreground">
            For terms
            {' '}
            <a className="underline underline-offset-4" href="/insurance-terms.pdf" download>
              press here
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
