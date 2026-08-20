import { useState, useEffect } from 'react';

export type Theme = 'revert' | 'ocean' | 'sunset' | 'forest' | 'purple' | 'crimson' | 'amber';

const themes: Theme[] = ['revert', 'ocean', 'sunset', 'forest', 'purple', 'crimson', 'amber'];

/**
 * Theme handling is now fully token-driven: the design system in index.css owns
 * every color. Switching a theme only swaps the accent-hue class on <html>;
 * no inline CSS variables are written anymore (that used to override the
 * design system with legacy light-mode colors).
 */
const LEGACY_INLINE_VARS = [
  '--background', '--foreground', '--card', '--card-foreground',
  '--primary', '--primary-foreground', '--secondary', '--secondary-foreground',
  '--muted', '--muted-foreground', '--accent', '--accent-foreground',
  '--border', '--input',
];

export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>('revert');

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as Theme | null;
    const initialTheme: Theme = savedTheme && themes.includes(savedTheme) ? savedTheme : 'revert';
    setCurrentTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;

    // Clear any legacy inline overrides so index.css tokens win.
    LEGACY_INLINE_VARS.forEach((name) => root.style.removeProperty(name));
    document.body.style.removeProperty('background-color');

    root.className = root.className.replace(/theme-\w+/g, '').trim();
    if (theme !== 'revert') {
      root.classList.add(`theme-${theme}`);
    }
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