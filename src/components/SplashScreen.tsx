import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, 400);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 center-content z-50 bg-gradient-primary transition-all duration-500 ${
        isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      <div className="text-center text-white space-y-6 max-w-md mx-auto px-6">
        <div className={`transform transition-all duration-1000 delay-300 ${
          isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <p className="text-base font-light opacity-90 tracking-wider uppercase">
            {t('welcome_to')}
          </p>
        </div>
        
        <div className={`transform transition-all duration-1000 delay-500 ${
          isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            {t('trance_tribes')}
          </h1>
        </div>
        
        <div className={`transform transition-all duration-1000 delay-700 ${
          isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <p className="text-base font-light opacity-80 tracking-wide">
            {t('ticket_generator')}
          </p>
        </div>
        
        <div className={`mt-8 transform transition-all duration-1000 delay-1000 ${
          isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <div className="w-16 h-0.5 bg-white/30 mx-auto rounded-full">
            <div className="h-full bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;