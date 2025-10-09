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
    <Button
      onClick={scrollToTop}
      style={{
        position: 'fixed',
        right: '1rem',
        bottom: '5rem',
        zIndex: 99999,
        width: '3.5rem',
        height: '3.5rem',
        borderRadius: '9999px',
        padding: 0,
        backgroundColor: '#9333ea',
        color: 'white',
        boxShadow: '0 10px 25px -5px rgba(147, 51, 234, 0.5)',
      }}
      className="hover:bg-purple-700 transition-all duration-300 hover:scale-110"
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-6 w-6" strokeWidth={3} />
    </Button>
  );
};

export default ScrollToTop;
