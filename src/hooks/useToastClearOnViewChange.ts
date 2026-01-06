import { useEffect, useRef } from 'react';
import { dismissAllToasts } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';

/**
 * Hook that clears all toasts when the view changes.
 * This prevents toasts from one view appearing in another.
 */
export const useToastClearOnViewChange = (currentView: string) => {
  const previousViewRef = useRef<string>(currentView);

  useEffect(() => {
    // Only clear toasts when the view actually changes (not on initial mount)
    if (previousViewRef.current !== currentView) {
      // Clear shadcn/radix toasts
      dismissAllToasts();
      // Clear sonner toasts
      sonnerToast.dismiss();
      previousViewRef.current = currentView;
    }
  }, [currentView]);
};

export default useToastClearOnViewChange;
