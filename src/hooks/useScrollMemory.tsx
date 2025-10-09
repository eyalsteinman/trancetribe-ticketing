import { useEffect, useRef } from 'react';

interface UseScrollMemoryProps {
  viewKey: string;
  enabled: boolean;
}

const scrollPositions = new Map<string, number>();

export const useScrollMemory = ({ viewKey, enabled }: UseScrollMemoryProps) => {
  const hasRestoredRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Save scroll position when view changes
    return () => {
      scrollPositions.set(viewKey, window.pageYOffset);
    };
  }, [viewKey, enabled]);

  useEffect(() => {
    if (!enabled || hasRestoredRef.current) return;

    // Restore scroll position when returning to this view
    const savedPosition = scrollPositions.get(viewKey);
    if (savedPosition !== undefined) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo({
          top: savedPosition,
          behavior: 'instant' as ScrollBehavior
        });
      });
    }
    
    hasRestoredRef.current = true;
  }, [viewKey, enabled]);

  // Reset the restored flag when view changes
  useEffect(() => {
    hasRestoredRef.current = false;
  }, [viewKey]);
};
