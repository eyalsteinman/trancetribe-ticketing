import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ViewTransitionProps {
  children: React.ReactNode;
  viewKey: string;
  className?: string;
}

const ViewTransition = ({ children, viewKey, className }: ViewTransitionProps) => {
  const [isExiting, setIsExiting] = useState(false);
  const [currentKey, setCurrentKey] = useState(viewKey);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    if (viewKey !== currentKey) {
      setIsExiting(true);
      
      const exitTimeout = setTimeout(() => {
        setCurrentKey(viewKey);
        setDisplayChildren(children);
        setIsExiting(false);
      }, 200); // Match exit animation duration

      return () => clearTimeout(exitTimeout);
    } else {
      setDisplayChildren(children);
    }
  }, [viewKey, children, currentKey]);

  return (
    <div
      key={currentKey}
      className={cn(
        "transition-all duration-200",
        isExiting ? "animate-fade-out opacity-0" : "animate-fade-in opacity-100",
        className
      )}
    >
      {displayChildren}
    </div>
  );
};

export default ViewTransition;
