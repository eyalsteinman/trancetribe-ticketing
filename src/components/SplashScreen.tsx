import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animationStage, setAnimationStage] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    const stageTimer = setTimeout(() => setAnimationStage(1), 500);
    const secondStageTimer = setTimeout(() => setAnimationStage(2), 1500);
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(stageTimer);
      clearTimeout(secondStageTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 app-container dynamic-bg overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${20 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      {/* Floating orbs */}
      <div className="floating-orb" />
      <div className="floating-orb" />
      <div className="floating-orb" />

      {/* Main content */}
      <div className="text-center relative z-10 space-y-8">
        {/* Logo/Icon area with glow effect */}
        <div className={`
          w-32 h-32 mx-auto relative flex items-center justify-center
          ${animationStage >= 1 ? 'animate-fadeInScale' : 'opacity-0'}
        `}>
          <div className="absolute inset-0 bg-gradient-primary rounded-full animate-glow-pulse" />
          <div className="relative w-24 h-24 bg-gradient-accent rounded-full flex items-center justify-center">
            <div className="text-4xl font-bold text-primary-foreground">TT</div>
          </div>
          {/* Sparkles around logo */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary rounded-full animate-sparkle"
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.3}s`
              }}
            />
          ))}
        </div>

        {/* Welcome text */}
        <div className={`
          space-y-4 
          ${animationStage >= 1 ? 'animate-slideInUp' : 'opacity-0 translate-y-8'}
        `}>
          <p className="text-lg font-light text-muted-foreground animate-shimmer">
            {t('welcome_to')}
          </p>
          <h1 className="text-6xl font-bold text-glow gradient-text leading-tight">
            {t('trance_tribes')}
          </h1>
          <p className="text-lg font-light text-muted-foreground">
            {t('ticket_generator')}
          </p>
        </div>

        {/* Loading indicator */}
        <div className={`
          mt-12 flex justify-center
          ${animationStage >= 2 ? 'animate-fadeInScale' : 'opacity-0'}
        `}>
          <div className="flex space-x-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 bg-primary rounded-full animate-float"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-primary/5 pointer-events-none" />
    </div>
  );
};

export default SplashScreen;