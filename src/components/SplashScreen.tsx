import { useEffect, useState } from 'react';
import { useBackground } from '@/contexts/BackgroundContext';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const { backgroundColor, isBackgroundDark } = useBackground();

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
      className="fixed inset-0 flex items-center justify-center z-50 transition-colors duration-500"
      style={{ 
        backgroundColor: backgroundColor
      }}
    >
      <div className="text-center">
        <p className="text-lg font-light mb-4">welcome to</p>
        <h1 className="text-6xl font-bold font-sans leading-tight">
          TRANCE
          <br />
          TRIBES
        </h1>
        <p className="text-lg font-light mt-4">ticket generator</p>
      </div>
    </div>
  );
};

export default SplashScreen;