import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Add scroll event listener
    window.addEventListener('scroll', toggleVisibility, { passive: true });

    // Check initial scroll position
    toggleVisibility();

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-20 right-4 z-[99999] w-12 h-12 rounded-full p-0 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
      style={{
        backgroundColor: '#9333ea',
        border: 'none',
      }}
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-5 w-5 text-white" strokeWidth={3} />
    </button>
  );
};

export default ScrollToTop;
