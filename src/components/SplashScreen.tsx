import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-blue-600 flex items-center justify-center z-50">
      <div className="text-center">
        <p className="text-white text-lg font-light mb-4">welcome to</p>
        <h1 className="text-white text-6xl font-bold font-sans leading-tight">
          TRANCE
          <br />
          TRIBE
        </h1>
        <p className="text-white text-lg font-light mt-4">ticket generator</p>
      </div>
    </div>
  );
};

export default SplashScreen;