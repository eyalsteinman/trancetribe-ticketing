import { useEffect, useRef } from 'react';

interface UseScrollMemoryProps {
  viewKey: string;
  enabled: boolean;
}

const scrollPositions = new Map<string, number>();

export const useScrollMemory = ({ viewKey, enabled }: UseScrollMemoryProps) => {
  const previousViewRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Save scroll position when leaving a view
    if (previousViewRef.current && previousViewRef.current !== viewKey) {
      scrollPositions.set(previousViewRef.current, window.pageYOffset);
    }

    // Restore scroll position when entering a view
    const savedPosition = scrollPositions.get(viewKey);
    if (savedPosition !== undefined) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        window.scrollTo({
          top: savedPosition,
          behavior: 'auto'
        });
      }, 50);
    } else {
      // Scroll to top for new views
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'auto'
        });
      }, 50);
    }

    previousViewRef.current = viewKey;
  }, [viewKey, enabled]);
};
