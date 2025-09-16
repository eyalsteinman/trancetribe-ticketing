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
    <div className="fixed inset-0 flex items-center justify-center z-50 overflow-hidden">
      {/* Dynamic background with animated gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-secondary animate-gradient-shift"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/20 to-accent/30 animate-pulse"></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-white/30 rounded-full animate-float"></div>
        <div className="absolute top-2/3 left-1/3 w-2 h-2 bg-white/20 rounded-full animate-float-delayed"></div>
        <div className="absolute top-1/3 right-1/4 w-4 h-4 bg-white/25 rounded-full animate-bounce-slow"></div>
        <div className="absolute bottom-1/4 right-1/3 w-2.5 h-2.5 bg-white/20 rounded-full animate-ping"></div>
        <div className="absolute top-1/2 left-1/6 w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/3 left-2/3 w-3 h-3 bg-white/15 rounded-full animate-bounce"></div>
      </div>
      
      {/* Geometric shapes */}
      <div className="absolute top-1/6 right-1/6 w-20 h-20 border border-white/20 rotate-45 animate-spin-slow"></div>
      <div className="absolute bottom-1/6 left-1/6 w-16 h-16 border-2 border-white/10 rounded-full animate-pulse"></div>
      
      {/* Main content */}
      <div className="relative z-10 text-center text-white px-4 sm:px-6">
        <div className="animate-fade-in-up">
          <p className="text-base sm:text-lg font-light mb-4 opacity-90 animate-fade-in delay-300">
            {t('welcome_to')}
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-4 animate-scale-in delay-500">
            <span className="bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent drop-shadow-2xl">
              {t('trance_tribes')}
            </span>
          </h1>
          <p className="text-base sm:text-lg font-light opacity-90 animate-fade-in delay-700">
            {t('ticket_generator')}
          </p>
          
          {/* Loading indicator */}
          <div className="mt-8 flex justify-center animate-fade-in delay-1000">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Overlay for better text contrast */}
      <div className="absolute inset-0 bg-black/20"></div>
    </div>
  );
};

export default SplashScreen;