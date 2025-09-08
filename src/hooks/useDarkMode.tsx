import { useState, useEffect } from 'react';

export type Theme = 'revert' | 'ocean' | 'sunset' | 'forest' | 'purple' | 'crimson' | 'amber';

const themes: Theme[] = ['revert', 'ocean', 'sunset', 'forest', 'purple', 'crimson', 'amber'];

const themeColors = {
  revert: {
    background: '0 0% 100%',
    foreground: '0 0% 0%',
    primary: '217 91% 60%',
  },
  ocean: {
    background: '200 100% 15%',
    foreground: '0 0% 100%',
    primary: '180 100% 70%',
  },
  sunset: {
    background: '25 100% 25%',
    foreground: '0 0% 100%',
    primary: '45 100% 70%',
  },
  forest: {
    background: '120 60% 20%',
    foreground: '0 0% 100%',
    primary: '140 70% 60%',
  },
  purple: {
    background: '270 70% 25%',
    foreground: '0 0% 100%',
    primary: '290 80% 70%',
  },
  crimson: {
    background: '350 80% 30%',
    foreground: '0 0% 100%',
    primary: '10 90% 70%',
  },
  amber: {
    background: '35 90% 30%',
    foreground: '0 0% 100%',
    primary: '50 100% 70%',
  },
};

export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>('revert');

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as Theme | null;
    const initialTheme: Theme = savedTheme && themes.includes(savedTheme) ? savedTheme : 'revert';
    setCurrentTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (theme: Theme) => {
    const colors = themeColors[theme];
    const root = document.documentElement;
    
    // Apply theme colors
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--foreground', colors.foreground);
    root.style.setProperty('--primary', colors.primary);
    
    // Update body background
    document.body.style.backgroundColor = `hsl(${colors.background})`;
    
    // Set colored background attribute for CSS rules
    const isColored = theme !== 'revert';
    document.body.setAttribute('data-colored-bg', isColored.toString());
    
    // Remove dark class and add theme class
    document.documentElement.classList.remove('dark');
    document.documentElement.className = document.documentElement.className.replace(/theme-\w+/g, '');
    document.documentElement.classList.add(`theme-${theme}`);
  };

  const cycleTheme = () => {
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    
    setCurrentTheme(nextTheme);
    applyTheme(nextTheme);
    localStorage.setItem('app-theme', nextTheme);
  };

  const getThemeDisplayName = (theme: Theme) => {
    const names = {
      revert: 'Light',
      ocean: 'Ocean',
      sunset: 'Sunset', 
      forest: 'Forest',
      purple: 'Purple',
      crimson: 'Crimson',
      amber: 'Amber',
    };
    return names[theme];
  };

  return {
    currentTheme,
    cycleTheme,
    getThemeDisplayName,
    isDarkMode: currentTheme !== 'revert', // For backwards compatibility
    toggleDarkMode: cycleTheme, // For backwards compatibility
  };
};

// Export the old hook for backwards compatibility
export const useDarkMode = useTheme;