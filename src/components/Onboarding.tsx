import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { LogOut, Play, Users, Sparkles } from 'lucide-react';

interface OnboardingProps {
  user: User;
  onComplete: () => void;
}

const Onboarding = ({ user, onComplete }: OnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const steps = [
    {
      title: "Welcome to Trance Tribes! 🎉",
      description: "Your ultimate ticket management and event platform",
      icon: <Sparkles className="h-20 w-20 text-primary" />,
      content: "Let's take a quick tour to get you started with all the amazing features!"
    },
    {
      title: "Dashboard Overview 📊",
      description: "Your command center for everything",
      icon: <Users className="h-20 w-20 text-accent" />,
      content: "The dashboard shows all your events, tickets, and management tools in beautiful tiles. Each tile is interactive and takes you to different sections."
    },
    {
      title: "Event Management 🎫",
      description: "Create and manage events effortlessly",
      icon: <Play className="h-20 w-20 text-success" />,
      content: "Create parties, scan QR codes, manage guest lists, and track everything in real-time. Your events have never been easier to manage!"
    },
    {
      title: "Ready to Go! 🚀",
      description: "You're all set to use Trance Tribes",
      icon: <Sparkles className="h-20 w-20 text-primary" />,
      content: "Explore the dark theme, vibrant purple highlights, and smooth animations. Everything is designed for maximum efficiency and beauty!"
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 300);
    } else {
      onComplete();
    }
  };

  const skipOnboarding = () => {
    onComplete();
  };

  return (
    <div className="app-container dynamic-bg min-h-screen">
      {/* Floating background elements */}
      <div className="floating-orb" />
      <div className="floating-orb" />
      <div className="floating-orb" />
      
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
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

      <div className="page-container relative z-10 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex space-x-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-8 rounded-full transition-all duration-300 ${
                      index <= currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                onClick={skipOnboarding}
                className="text-muted-foreground hover:text-foreground"
              >
                Skip Tour
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className={`glass-card p-8 text-center transition-all duration-300 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <div className="space-y-6">
              {/* Icon */}
              <div className="flex justify-center animate-float">
                <div className="p-6 rounded-full bg-gradient-primary">
                  {steps[currentStep].icon}
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h1 className="text-3xl font-bold gradient-text">
                  {steps[currentStep].title}
                </h1>
                <p className="text-xl text-primary font-semibold">
                  {steps[currentStep].description}
                </p>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {steps[currentStep].content}
                </p>
              </div>

              {/* Navigation */}
              <div className="flex justify-center pt-6">
                <Button
                  onClick={nextStep}
                  variant="premium"
                  size="lg"
                  className="px-12"
                >
                  {currentStep < steps.length - 1 ? 'Next' : 'Get Started'}
                  <Play className="h-5 w-5 ml-2" />
                </Button>
              </div>

              {/* Step indicator */}
              <p className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;