"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  ThemeConfig, 
  ThemeMode, 
  themes, 
  customThemes, 
  applyTheme, 
  getStoredTheme 
} from '@/lib/theme';

interface ThemeContextType {
  currentTheme: string;
  themeConfig: ThemeConfig;
  changeTheme: (themeName: string) => void;
  availableThemes: Record<string, ThemeConfig>;
  isLight: boolean;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  enableSystemTheme?: boolean;
}

export function ThemeProvider({ 
  children, 
  defaultTheme = 'dark',
  enableSystemTheme = false 
}: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Get the current theme configuration
  const getThemeConfig = (themeName: string): ThemeConfig => {
    if (themeName in themes) {
      return themes[themeName as ThemeMode];
    } else if (themeName in customThemes) {
      return customThemes[themeName];
    }
    return themes.dark; // fallback
  };

  const themeConfig = getThemeConfig(currentTheme);
  const availableThemes = { ...themes, ...customThemes };

  // Change theme function
  const changeTheme = (themeName: string) => {
    if (!(themeName in availableThemes)) {
      console.warn(`Theme "${themeName}" not found, falling back to dark theme`);
      themeName = 'dark';
    }

    const newThemeConfig = getThemeConfig(themeName);
    applyTheme(newThemeConfig);
    setCurrentTheme(themeName);
    
    // Store theme preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', themeName);
      
      // Set data attribute for CSS selectors
      if (themeName === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    }
  };

  // Initialize theme on mount
  useEffect(() => {
    setMounted(true);
    
    let initialTheme = defaultTheme;
    
    // Check for stored theme preference
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme && storedTheme in availableThemes) {
        initialTheme = storedTheme;
      } else if (enableSystemTheme) {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        initialTheme = prefersDark ? 'dark' : 'light';
      }
    }
    
    changeTheme(initialTheme);
  }, [defaultTheme, enableSystemTheme, availableThemes, changeTheme]);

  // Listen for system theme changes if enabled
  useEffect(() => {
    if (!enableSystemTheme || typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if no user preference is stored
      const storedTheme = localStorage.getItem('theme');
      if (!storedTheme) {
        changeTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [enableSystemTheme, changeTheme]);

  // Prevent hydration mismatch
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  const contextValue: ThemeContextType = {
    currentTheme,
    themeConfig,
    changeTheme,
    availableThemes,
    isLight: currentTheme === 'light',
    isDark: currentTheme === 'dark'
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme context
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme switcher component
export function ThemeSwitcher({ 
  className = "",
  showCustomThemes = true 
}: { 
  className?: string;
  showCustomThemes?: boolean;
}) {
  const { currentTheme, changeTheme, availableThemes } = useTheme();
  
  const themeOptions = showCustomThemes 
    ? availableThemes 
    : { light: themes.light, dark: themes.dark };

  return (
    <select
      value={currentTheme}
      onChange={(e) => changeTheme(e.target.value)}
      className={`theme-select ${className}`}
    >
      {Object.keys(themeOptions).map((themeName) => (
        <option key={themeName} value={themeName}>
          {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
        </option>
      ))}
    </select>
  );
}

// Quick theme toggle button for light/dark
export function ThemeToggle({ 
  className = "",
  size = "md" 
}: { 
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const { currentTheme, changeTheme, isLight } = useTheme();
  
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6"
  };
  
  const toggleTheme = () => {
    changeTheme(isLight ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className={`theme-btn-secondary ${className}`}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} theme`}
    >
      {isLight ? (
        <svg className={sizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ) : (
        <svg className={sizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
    </button>
  );
}