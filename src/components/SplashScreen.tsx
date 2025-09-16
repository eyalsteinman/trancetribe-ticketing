import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 bg-background overflow-hidden"
    >
      {/* Animated background */}
      <div className="absolute inset-0 gradient-primary opacity-90"></div>
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-accent/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-electric-blue/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-24 h-24 bg-neon-pink/20 rounded-full blur-xl animate-pulse delay-2000"></div>
      </div>
      
      {/* Content with glass effect */}
      <div className="relative z-10 text-center text-white glass p-12 rounded-3xl">
        <div className="float">
          <p className="text-xl font-light mb-6 opacity-90 animate-fade-in">{t('welcome_to')}</p>
          <h1 className="text-7xl font-bold font-sans leading-tight mb-6 animate-scale-in bg-gradient-to-r from-white via-accent to-electric-blue bg-clip-text text-transparent">
            {t('trance_tribes')}
          </h1>
          <p className="text-xl font-light opacity-90 animate-fade-in delay-500">{t('ticket_generator')}</p>
        </div>
        
        {/* Loading dots */}
        <div className="flex justify-center gap-2 mt-8">
          <div className="w-3 h-3 bg-accent rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-electric-blue rounded-full animate-bounce delay-150"></div>
          <div className="w-3 h-3 bg-neon-pink rounded-full animate-bounce delay-300"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;