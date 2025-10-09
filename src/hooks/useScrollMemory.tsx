import { useEffect, useRef } from 'react';

interface UseScrollMemoryProps {
  viewKey: string;
  enabled: boolean;
}

const scrollPositions = new Map<string, number>();

export const useScrollMemory = ({ viewKey, enabled }: UseScrollMemoryProps) => {
  const previousViewRef = useRef<string | null>(null);
  const isRestoringRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const handleScrollSave = () => {
      if (!isRestoringRef.current && previousViewRef.current) {
        scrollPositions.set(previousViewRef.current, window.scrollY);
      }
    };

    // Save current scroll position before view changes
    if (previousViewRef.current && previousViewRef.current !== viewKey) {
      scrollPositions.set(previousViewRef.current, window.scrollY);
    }

    // Restore scroll position for this view
    const savedPosition = scrollPositions.get(viewKey);
    if (savedPosition !== undefined && savedPosition > 0) {
      isRestoringRef.current = true;
      // Wait for DOM to be ready
      setTimeout(() => {
        window.scrollTo({ top: savedPosition, behavior: 'auto' });
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 100);
      }, 100);
    } else {
      // Scroll to top for new views
      window.scrollTo({ top: 0, behavior: 'auto' });
    }

    previousViewRef.current = viewKey;

    // Save scroll position on scroll
    window.addEventListener('scroll', handleScrollSave, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollSave);
  }, [viewKey, enabled]);
};
