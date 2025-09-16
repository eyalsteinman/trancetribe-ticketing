import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Users, Calendar, Gamepad2, Crown, ArrowRight, Check } from 'lucide-react';

interface OnboardingFlowProps {
  userType: 'user' | 'admin';
  onComplete: () => void;
}

const OnboardingFlow = ({ userType, onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-advance through steps
    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        // Complete onboarding after showing all steps
        setTimeout(() => {
          setIsVisible(false);
          setTimeout(onComplete, 300);
        }, 2000);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [currentStep, onComplete]);

  const userSteps = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Welcome to Trance Tribes!",
      description: "Join the ultimate electronic music community",
      gradient: "from-primary to-accent",
      features: ["🎵 Discover Events", "🎮 Play Games", "👥 Connect with Tribes"]
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Explore Events",
      description: "Find and join the hottest electronic music events",
      gradient: "from-accent to-secondary",
      features: ["📱 Get QR Tickets", "🎫 VIP Access", "📍 Event Maps"]
    },
    {
      icon: <Gamepad2 className="w-8 h-8" />,
      title: "Interactive Features",
      description: "Games, social features, and more await you!",
      gradient: "from-secondary to-primary",
      features: ["🎯 Play Games", "💬 Chat with Community", "🍺 Bar Tab Management"]
    }
  ];

  const adminSteps = [
    {
      icon: <Crown className="w-8 h-8" />,
      title: "Admin Dashboard",
      description: "Welcome to your powerful admin control center",
      gradient: "from-accent to-secondary",
      features: ["🎛️ Event Management", "👥 User Control", "📊 Analytics"]
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Event Management",
      description: "Create and manage events with ease",
      gradient: "from-secondary to-primary",
      features: ["📅 Create Events", "🔍 QR Scanner", "📋 Guest Lists"]
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Advanced Tools",
      description: "Access powerful admin features and insights",
      gradient: "from-primary to-accent",
      features: ["💰 Bar Management", "📧 Messaging", "🎮 Game Controls"]
    }
  ];

  const steps = userType === 'admin' ? adminSteps : userSteps;
  const step = steps[currentStep];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="max-w-md w-full bg-glass backdrop-blur-xl border-white/20 shadow-neon animate-scale-in">
        <CardContent className="p-8 text-center space-y-6">
          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-500 ${
                  index <= currentStep 
                    ? 'w-8 bg-gradient-to-r from-primary to-accent' 
                    : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mx-auto shadow-neon animate-float`}>
            <div className="text-white">
              {step.icon}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-glow mb-2">
                {step.title}
              </h2>
              <p className="text-muted-foreground font-medium">
                {step.description}
              </p>
            </div>

            {/* Features */}
            <div className="space-y-2">
              {step.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center gap-2 text-sm opacity-0 animate-fade-in"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-foreground/80">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Skip Button */}
          <Button
            variant="ghost"
            onClick={() => {
              setIsVisible(false);
              setTimeout(onComplete, 300);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip intro
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingFlow;