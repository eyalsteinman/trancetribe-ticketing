import React, { createContext, useContext, useState, useEffect } from 'react';

interface BackgroundContextType {
  backgroundColor: string;
  setGlobalBackground: (color: string) => void;
  isBackgroundDark: boolean;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export const BackgroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');

  // Determine if a color should be treated as white
  const isWhiteColor = (color: string): boolean => {
    const c = color.trim().toLowerCase();
    if (c === '#ffffff' || c === 'white') return true;
    const noSpace = c.replace(/\s/g, '');
    if (noSpace === 'hsl(0,0%,100%)') return true;
    if (noSpace === 'rgb(255,255,255)') return true;
    return false;
  };

  const setGlobalBackground = (color: string) => {
    setBackgroundColor(color);
    localStorage.setItem('app-background', color);
    
    // Apply to document body
    document.body.style.backgroundColor = color;
    // Toggle colored background mode for global text color handling
    const isWhite = isWhiteColor(color);
    document.body.setAttribute('data-colored-bg', isWhite ? 'false' : 'true');
  };

  // Load saved background on mount
  useEffect(() => {
    const savedColor = localStorage.getItem('app-background');
    if (savedColor) {
      setBackgroundColor(savedColor);
      document.body.style.backgroundColor = savedColor;
      const isWhite = isWhiteColor(savedColor);
      document.body.setAttribute('data-colored-bg', isWhite ? 'false' : 'true');
    }
  }, []);

  return (
    <BackgroundContext.Provider 
      value={{ 
        backgroundColor, 
        setGlobalBackground, 
        isBackgroundDark: !isWhiteColor(backgroundColor) 
      }}
    >
      {children}
    </BackgroundContext.Provider>
  );
};

export const useBackground = (): BackgroundContextType => {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
};