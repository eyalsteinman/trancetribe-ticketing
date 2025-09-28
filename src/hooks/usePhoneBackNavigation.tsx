import { useEffect } from 'react';

interface UsePhoneBackNavigationProps {
  onBackNavigation: () => void;
  isActive: boolean;
}

export const usePhoneBackNavigation = ({ onBackNavigation, isActive }: UsePhoneBackNavigationProps) => {
  useEffect(() => {
    if (!isActive) return;

    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      onBackNavigation();
    };

    // Add a history entry so we can detect back navigation
    window.history.pushState({ modal: true }, '');
    
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isActive, onBackNavigation]);
};