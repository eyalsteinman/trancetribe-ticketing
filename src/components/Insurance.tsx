import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
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
      <div className="max-w-md mx-auto space-y-6 text-left">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack} aria-label="Back" className="absolute top-4 right-4 z-[9999] on-color back-button">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 
            className="text-xl font-bold"
            style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
          >
            Insurance
          </h1>
        </div>

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
      </div>
    </div>
  );
};

export default Insurance;
