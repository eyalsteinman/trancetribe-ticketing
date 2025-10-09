import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ViewTransitionProps {
  children: React.ReactNode;
  viewKey: string;
  className?: string;
}

const ViewTransition = ({ children, viewKey, className }: ViewTransitionProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Reset animation on view change
    setMounted(false);
    const timer = setTimeout(() => {
      setMounted(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [viewKey]);

  return (
    <div
      className={cn(
        "w-full transition-all duration-300 ease-out",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
        className
      )}
    >
      {children}
    </div>
  );
};

export default ViewTransition;
