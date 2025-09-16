import { useState, useEffect } from 'react';

export type Theme = 'revert' | 'ocean' | 'sunset' | 'forest' | 'purple' | 'crimson' | 'amber';

const themes: Theme[] = ['revert', 'ocean', 'sunset', 'forest', 'purple', 'crimson', 'amber'];

const themeColors = {
  revert: {
    background: '220 13% 3%',
    foreground: '0 0% 98%',
    primary: '270 91% 65%',
  },
  ocean: {
    background: '220 13% 3%',
    foreground: '0 0% 98%',
    primary: '195 100% 65%',
  },
  sunset: {
    background: '220 13% 3%',
    foreground: '0 0% 98%',
    primary: '25 100% 65%',
  },
  forest: {
    background: '220 13% 3%',
    foreground: '0 0% 98%',
    primary: '140 70% 55%',
  },
  purple: {
    background: '220 13% 3%',
    foreground: '0 0% 98%',
    primary: '270 91% 65%',
  },
  crimson: {
    background: '220 13% 3%',
    foreground: '0 0% 98%',
    primary: '350 90% 65%',
  },
  amber: {
    background: '220 13% 3%',
    foreground: '0 0% 98%',
    primary: '45 100% 65%',
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
    
    // Apply background and foreground
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--foreground', colors.foreground);
    
    // All themes now use ultra dark design with maximum contrast
    root.style.setProperty('--card', '220 13% 6%');
    root.style.setProperty('--card-foreground', '0 0% 98%');
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-foreground', '0 0% 100%');
    root.style.setProperty('--secondary', '285 85% 60%');
    root.style.setProperty('--secondary-foreground', '0 0% 100%');
    root.style.setProperty('--muted', '220 13% 10%');
    root.style.setProperty('--muted-foreground', '0 0% 85%');
    root.style.setProperty('--accent', '285 85% 70%');
    root.style.setProperty('--accent-foreground', '0 0% 100%');
    
    // Ultra dark borders and inputs with maximum contrast
    root.style.setProperty('--border', '220 13% 15%');
    root.style.setProperty('--input', '220 13% 8%');
    
    // Update body background
    document.body.style.backgroundColor = `hsl(${colors.background})`;
    
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
      revert: 'Purple',
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