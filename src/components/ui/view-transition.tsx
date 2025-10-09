import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ViewTransitionProps {
  children: React.ReactNode;
  viewKey: string;
  className?: string;
}

const ViewTransition = ({ children, viewKey, className }: ViewTransitionProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger fade in after mount
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    return () => clearTimeout(timer);
  }, [viewKey]);

  return (
    <div
      className={cn(
        "transition-all duration-200",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        className
      )}
    >
      {children}
    </div>
  );
};

export default ViewTransition;
