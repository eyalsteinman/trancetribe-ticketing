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
    <div className="fixed inset-0 flex items-center justify-center z-50 overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      {/* Modern blue gradient background with subtle animations */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-indigo-600/20 animate-gradient-shift"></div>
      <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-radial from-blue-400/30 to-transparent rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-radial from-cyan-400/30 to-transparent rounded-full blur-3xl animate-float-delayed"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-indigo-400/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
      
      {/* Floating particles with blue theme */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-blue-300/40 rounded-full animate-float"></div>
        <div className="absolute top-2/3 left-1/3 w-2 h-2 bg-cyan-300/30 rounded-full animate-float-delayed"></div>
        <div className="absolute top-1/3 right-1/4 w-4 h-4 bg-indigo-300/35 rounded-full animate-bounce-slow"></div>
        <div className="absolute bottom-1/4 right-1/3 w-2.5 h-2.5 bg-blue-400/30 rounded-full animate-ping"></div>
        <div className="absolute top-1/2 left-1/6 w-1.5 h-1.5 bg-cyan-400/40 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/3 left-2/3 w-3 h-3 bg-indigo-400/25 rounded-full animate-bounce"></div>
      </div>
      
      {/* Geometric shapes with blue theme */}
      <div className="absolute top-1/6 right-1/6 w-20 h-20 border border-blue-300/30 rotate-45 animate-spin-slow"></div>
      <div className="absolute bottom-1/6 left-1/6 w-16 h-16 border-2 border-cyan-300/20 rounded-full animate-pulse"></div>
      
      {/* Main content */}
      <div className="relative z-10 text-center text-white px-4 sm:px-6">
        <div className="animate-fade-in-up">
          <p className="text-base sm:text-lg font-light mb-4 opacity-90 animate-fade-in delay-300">
            {t('welcome_to')}
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-4 animate-scale-in delay-500">
            <span className="bg-gradient-to-r from-blue-200 via-cyan-200 to-indigo-200 bg-clip-text text-transparent drop-shadow-2xl">
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
      <div className="absolute inset-0 bg-black/30"></div>
    </div>
  );
};

export default SplashScreen;