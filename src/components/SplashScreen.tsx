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
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-400/10 rounded-full blur-2xl animate-ping delay-500" />
      </div>
      
      {/* Main content container */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        {/* Welcome text */}
        <div className={`text-center mb-4 transition-all duration-1000 ease-out ${
          animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <p className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            {t('welcome_to')}
          </p>
        </div>
        
        {/* Main title */}
        <div className={`text-center transition-all duration-1200 delay-300 ease-out ${
          animate ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
        }`}>
          <h1 className="text-6xl font-black leading-none tracking-tight bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
            TRANCE
          </h1>
          <h1 className="text-6xl font-black leading-none tracking-tight bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent mb-6">
            TRIBES
          </h1>
          
          {/* Hebrew text centered and raised */}
          <div className="flex justify-center -mt-2">
            <p className="text-2xl font-bold text-center text-purple-100" dir="rtl">
              תודה שטוב לך
            </p>
          </div>
        </div>
      </div>
      
      {/* Dynamic loader with particles */}
      <div className={`pb-8 transition-all duration-1000 delay-1000 ease-out ${
        animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        <div className="relative flex justify-center items-center">
          {/* Multi-ring loader */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
            <div className="absolute top-1 left-1 w-14 h-14 border-4 border-transparent border-t-purple-300 rounded-full animate-spin animation-delay-200"></div>
            <div className="absolute top-2 left-2 w-12 h-12 border-4 border-transparent border-t-pink-300 rounded-full animate-spin animation-delay-400"></div>
          </div>
          
          {/* Orbiting particles */}
          <div className="absolute w-20 h-20">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-white/60 rounded-full animate-bounce"
                style={{
                  top: `${50 + 30 * Math.cos((i * Math.PI * 2) / 6)}%`,
                  left: `${50 + 30 * Math.sin((i * Math.PI * 2) / 6)}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1.5s',
                }}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Ticket generator text */}
      <div className={`text-center pb-8 transition-all duration-1200 delay-1200 ease-out ${
        animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        <p className="text-lg font-semibold bg-gradient-to-r from-purple-200 to-white bg-clip-text text-transparent">
          {t('ticket_generator')}
        </p>
      </div>
      
      {/* Elegant floating orbs */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full animate-bounce"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: '4s',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default SplashScreen;