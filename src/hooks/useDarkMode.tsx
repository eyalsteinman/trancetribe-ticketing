import { createContext, useContext, useEffect, useState } from 'react';

interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isSystemDark: boolean;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export const DarkModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isSystemDark, setIsSystemDark] = useState(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  
  const [userPreference, setUserPreference] = useState<'light' | 'dark' | 'system'>(() => {
    const stored = localStorage.getItem('darkMode-preference');
    return stored as 'light' | 'dark' | 'system' || 'system';
  });

  const isDarkMode = userPreference === 'system' ? isSystemDark : userPreference === 'dark';

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode-preference', userPreference);
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode, userPreference]);

  const toggleDarkMode = () => {
    if (userPreference === 'system') {
      setUserPreference(isSystemDark ? 'light' : 'dark');
    } else if (userPreference === 'light') {
      setUserPreference('dark');
    } else {
      setUserPreference('system');
    }
  };

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode, isSystemDark }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};