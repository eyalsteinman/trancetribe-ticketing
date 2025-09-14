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
    background: '0 0% 0%',
    foreground: '0 0% 100%',
    primary: '180 100% 70%',
  },
  sunset: {
    background: '0 0% 0%',
    foreground: '0 0% 100%',
    primary: '45 100% 70%',
  },
  forest: {
    background: '0 0% 0%',
    foreground: '0 0% 100%',
    primary: '140 70% 60%',
  },
  purple: {
    background: '0 0% 0%',
    foreground: '0 0% 100%',
    primary: '290 80% 70%',
  },
  crimson: {
    background: '0 0% 0%',
    foreground: '0 0% 100%',
    primary: '10 90% 70%',
  },
  amber: {
    background: '0 0% 0%',
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
    
    // Apply background and foreground
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--foreground', colors.foreground);
    
    if (theme === 'revert') {
      // Revert theme - white background, black text
      root.style.setProperty('--card', '0 0% 100%');
      root.style.setProperty('--card-foreground', '0 0% 0%');
      root.style.setProperty('--primary', colors.primary);
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      root.style.setProperty('--secondary', '220 14% 96%');
      root.style.setProperty('--secondary-foreground', '0 0% 0%');
      root.style.setProperty('--muted', '220 14% 96%');
      root.style.setProperty('--muted-foreground', '220 9% 46%');
      root.style.setProperty('--accent', colors.primary);
      root.style.setProperty('--accent-foreground', '0 0% 100%');
    } else {
      // Colored themes - black background, theme color for tiles/buttons
      root.style.setProperty('--card', colors.primary);
      root.style.setProperty('--card-foreground', '0 0% 100%');
      root.style.setProperty('--primary', colors.primary);
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      root.style.setProperty('--secondary', colors.primary);
      root.style.setProperty('--secondary-foreground', '0 0% 100%');
      root.style.setProperty('--muted', colors.primary);
      root.style.setProperty('--muted-foreground', '0 0% 100%');
      root.style.setProperty('--accent', colors.primary);
      root.style.setProperty('--accent-foreground', '0 0% 100%');
    }
    
    // Update borders and inputs
    root.style.setProperty('--border', theme === 'revert' ? '220 13% 91%' : colors.primary);
    root.style.setProperty('--input', theme === 'revert' ? '220 13% 91%' : colors.primary);
    
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