import React, { createContext, useContext, useState, useEffect } from 'react';

interface BackgroundContextType {
  backgroundColor: string;
  setGlobalBackground: (color: string) => void;
  isBackgroundDark: boolean;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

/**
 * The app now uses a single dark "Midnight Indigo" design system defined in
 * index.css. This provider is kept for backwards compatibility: consumers can
 * still read `backgroundColor`, but it always resolves to `transparent` so the
 * global gradient backdrop stays coherent across every page.
 */
export const BackgroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storedColor, setStoredColor] = useState<string>('transparent');

  const setGlobalBackground = (color: string) => {
    setStoredColor(color);
    localStorage.setItem('app-background', color);
  };

  useEffect(() => {
    const savedColor = localStorage.getItem('app-background');
    if (savedColor) setStoredColor(savedColor);
    document.body.setAttribute('data-colored-bg', 'true');
  }, []);

  return (
    <BackgroundContext.Provider
      value={{
        backgroundColor: 'transparent',
        setGlobalBackground,
        isBackgroundDark: true,
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
