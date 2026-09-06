import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animate, setAnimate] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // Start animation immediately
    setAnimate(true);
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-[hsl(240_60%_3%)] overflow-hidden px-4">
      {/* High-contrast glow accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-56 h-56 bg-primary/25 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary-glow/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Main content container */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-sm text-center">
        {/* Welcome text */}
        <div className={`mb-3 transition-all duration-1000 ease-out ${
          animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <p className="text-xl sm:text-2xl font-bold uppercase tracking-[0.2em] text-primary-glow">
            {t('welcome_to')}
          </p>
        </div>

        {/* Main title */}
        <div className={`transition-all duration-1000 delay-300 ease-out ${
          animate ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
        }`}>
          <h1 className="text-5xl sm:text-7xl font-black leading-[0.95] tracking-tight text-primary-foreground drop-shadow-[0_0_18px_hsl(var(--primary))]">
            TRANCE
          </h1>
          <h1 className="text-5xl sm:text-7xl font-black leading-[0.95] tracking-tight text-primary-foreground drop-shadow-[0_0_18px_hsl(var(--primary))] mb-5">
            TRIBES
          </h1>

          <p className="text-2xl font-bold text-primary-glow" dir="rtl">
            תודה שטוב לך
          </p>
        </div>

        {/* Ticket generator text */}
        <div className={`mt-8 transition-all duration-1000 delay-700 ease-out ${
          animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <p className="text-lg sm:text-xl font-semibold uppercase tracking-widest text-primary-foreground">
            {t('ticket_generator')}
          </p>
        </div>
      </div>

      {/* Beta version and Loader at bottom */}
      <div className={`pb-12 relative z-10 transition-all duration-1000 delay-1000 ease-out ${
        animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        <div className="text-center space-y-2">
          <p className="text-xs font-semibold tracking-widest text-primary-glow">beta v2.1</p>
          <Loader2 className="w-8 h-8 text-primary-foreground animate-spin mx-auto" />
        </div>
      </div>
    </div>
  );

};

export default SplashScreen;