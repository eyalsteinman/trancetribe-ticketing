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
      event.preventDefault();
      onBackNavigation();
    };

    // Add a history entry so we can detect back navigation
    window.history.pushState({ modal: true }, '');
    
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Do not navigate back automatically on cleanup to avoid unintended page navigation
      // Optionally, clear the modal flag without changing history
      if (window.history.state?.modal) {
        try {
          const current = window.history.state;
          window.history.replaceState({ ...current, modal: false }, '');
        } catch {
          // no-op
        }
      }
    };
  }, [isActive, onBackNavigation, preventBackNavigation]);
};