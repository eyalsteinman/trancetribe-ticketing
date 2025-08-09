import React, { createContext, useContext, useState, useEffect } from 'react';

interface BackgroundContextType {
  backgroundColor: string;
  setGlobalBackground: (color: string) => void;
  isBackgroundDark: boolean;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export const BackgroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');

  // Function to determine if a color is dark
  const isColorDark = (hexColor: string): boolean => {
    // Convert hex to RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  };

  const setGlobalBackground = (color: string) => {
    setBackgroundColor(color);
    localStorage.setItem('app-background', color);
    
    // Apply to document body
    document.body.style.backgroundColor = color;
    document.body.style.color = isColorDark(color) ? '#ffffff' : '#000000';
  };

  // Load saved background on mount
  useEffect(() => {
    const savedColor = localStorage.getItem('app-background');
    if (savedColor) {
      setBackgroundColor(savedColor);
      document.body.style.backgroundColor = savedColor;
      document.body.style.color = isColorDark(savedColor) ? '#ffffff' : '#000000';
    }
  }, []);

  return (
    <BackgroundContext.Provider 
      value={{ 
        backgroundColor, 
        setGlobalBackground, 
        isBackgroundDark: isColorDark(backgroundColor) 
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