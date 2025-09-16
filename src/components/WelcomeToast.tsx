import React, { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Crown } from 'lucide-react';

interface WelcomeToastProps {
  userType: 'user' | 'admin';
  userName?: string;
}

const WelcomeToast = ({ userType, userName }: WelcomeToastProps) => {
  const { toast } = useToast();

  useEffect(() => {
    const showWelcomeToast = () => {
      if (userType === 'admin') {
        toast({
          title: "👑 Welcome, Admin!",
          description: "You have full access to the admin dashboard with event management and user control features.",
          duration: 5000,
        });
      } else {
        toast({
          title: "✨ Welcome to Trance Tribes!",
          description: "Get ready to explore events, games, and connect with the community.",
          duration: 5000,
        });
      }
    };

    // Show toast after a short delay
    const timer = setTimeout(showWelcomeToast, 1000);
    return () => clearTimeout(timer);
  }, [userType, userName, toast]);

  return null;
};

export default WelcomeToast;