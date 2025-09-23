import { useEffect } from 'react';

interface UseBackNavigationProps {
  onBackNavigation: () => void;
  isActive: boolean;
  preventBackNavigation?: boolean;
}

export const useBackNavigation = ({ onBackNavigation, isActive, preventBackNavigation = false }: UseBackNavigationProps) => {
  useEffect(() => {
    if (!isActive) return;

    const handlePopState = (event: PopStateEvent) => {
      if (preventBackNavigation) {
        // Push the same state back to prevent actual navigation
        window.history.pushState({ modal: true }, '');
      }
      onBackNavigation();
    };

    // Add a history entry so we can detect back navigation
    window.history.pushState({ modal: true }, '');
    
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Go back to clear the pushed state when unmounting
      if (window.history.state?.modal) {
        try {
          window.history.back();
        } catch {
          // no-op
        }
      }
    };
  }, [isActive, onBackNavigation, preventBackNavigation]);
};