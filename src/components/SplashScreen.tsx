import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

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
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-400/10 rounded-full blur-2xl animate-ping delay-500" />
      </div>
      
      {/* Main content */}
      <div className={`text-center text-white relative z-10 transition-all duration-1000 ${
        animate ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'
      }`}>
        <div className={`transition-all duration-1200 delay-300 ${
          animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <p className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            {t('welcome_to')}
          </p>
        </div>
        
        <div className={`transition-all duration-1200 delay-500 ${
          animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <h1 className="text-7xl font-black leading-none tracking-tight mb-1 bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent animate-pulse">
            TRANCE
          </h1>
          <h1 className="text-7xl font-black leading-none tracking-tight bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent animate-pulse">
            TRIBES
          </h1>
        </div>
        
        <div className={`transition-all duration-1200 delay-700 ${
          animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <p className="text-xl font-semibold mt-4 bg-gradient-to-r from-purple-200 to-white bg-clip-text text-transparent">
            {t('ticket_generator')}
          </p>
          <p className="text-lg font-bold mt-2 text-purple-200" dir="rtl">
            תודה שטוב לך
          </p>
        </div>
      </div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-white/30 rounded-full animate-bounce`}
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 8}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: '3s'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default SplashScreen;