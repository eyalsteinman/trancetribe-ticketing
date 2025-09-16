import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [logoVisible, setLogoVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // Staggered animations
    const logoTimer = setTimeout(() => setLogoVisible(true), 300);
    const textTimer = setTimeout(() => setTextVisible(true), 800);
    
    const fadeTimer = setTimeout(() => setFadeOut(true), 2500);
    
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 3500);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(textTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center z-50 transition-all duration-1000 ${
        fadeOut ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div className="relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/10 rounded-full animate-float"></div>
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-white/5 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-20 right-20 w-20 h-20 bg-white/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Main content */}
        <div className="relative text-center text-white z-10">
          <div className={`transition-all duration-1000 ${
            logoVisible ? 'opacity-100 transform-none' : 'opacity-0 transform scale-50'
          }`}>
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-2xl">
                <div className="text-4xl font-bold">T</div>
              </div>
            </div>
          </div>
          
          <div className={`transition-all duration-1000 delay-300 ${
            textVisible ? 'opacity-100 transform-none' : 'opacity-0 transform translate-y-8'
          }`}>
            <p className="text-lg font-light mb-4 text-white/90">{t('welcome_to')}</p>
            <h1 className="text-responsive-xl font-black mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              {t('trance_tribes')}
            </h1>
            <p className="text-lg font-light text-white/90">{t('ticket_generator')}</p>
          </div>

          {/* Loading animation */}
          <div className={`mt-12 transition-all duration-500 delay-700 ${
            textVisible ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-white/60 rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;