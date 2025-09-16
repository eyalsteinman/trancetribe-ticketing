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
      className="fixed inset-0 flex items-center justify-center z-50 transition-colors duration-500 bg-sky-600"
    >
      <div className="text-center text-white">
        <p className="text-lg font-light mb-4">{t('welcome_to')}</p>
        <h1 className="text-6xl font-bold font-sans leading-tight">
          {t('trance_tribes')}
        </h1>
        <p className="text-lg font-light mt-4">{t('ticket_generator')}</p>
      </div>
    </div>
  );
};

export default SplashScreen;