// Theme configuration and utilities

export type ThemeMode = 'light' | 'dark';

export interface ThemeConfig {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgQuaternary: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  borderPrimary: string;
  borderSecondary: string;
  borderTertiary: string;
  success: string;
  successBg: string;
  successText: string;
  error: string;
  errorBg: string;
  errorText: string;
  warning: string;
  warningBg: string;
  warningText: string;
  info: string;
  infoBg: string;
  infoText: string;
}

export const themes: Record<ThemeMode, ThemeConfig> = {
  dark: {
    primary: '168 85 247',      // purple-500
    primaryDark: '147 51 234',  // purple-600
    primaryLight: '196 181 253', // purple-300
    bgPrimary: '0 0 0',         // black
    bgSecondary: '17 24 39',    // gray-900
    bgTertiary: '31 41 55',     // gray-800
    bgQuaternary: '55 65 81',   // gray-700
    textPrimary: '255 255 255', // white
    textSecondary: '209 213 219', // gray-300
    textTertiary: '156 163 175', // gray-400
    textMuted: '107 114 128',   // gray-500
    borderPrimary: '31 41 55',  // gray-800
    borderSecondary: '55 65 81', // gray-700
    borderTertiary: '75 85 99', // gray-600
    success: '34 197 94',       // green-500
    successBg: '20 83 45',      // green-900
    successText: '187 247 208', // green-200
    error: '239 68 68',         // red-500
    errorBg: '127 29 29',       // red-900
    errorText: '252 165 165',   // red-300
    warning: '245 158 11',      // amber-500
    warningBg: '146 64 14',     // amber-900
    warningText: '253 230 138', // amber-200
    info: '59 130 246',         // blue-500
    infoBg: '30 58 138',        // blue-900
    infoText: '191 219 254',    // blue-200
  },
  light: {
    primary: '168 85 247',      // purple-500
    primaryDark: '147 51 234',  // purple-600
    primaryLight: '147 51 234', // purple-600 (darker for light theme)
    bgPrimary: '255 255 255',   // white
    bgSecondary: '249 250 251', // gray-50
    bgTertiary: '243 244 246',  // gray-100
    bgQuaternary: '229 231 235', // gray-200
    textPrimary: '17 24 39',    // gray-900
    textSecondary: '55 65 81',  // gray-700
    textTertiary: '75 85 99',   // gray-600
    textMuted: '107 114 128',   // gray-500
    borderPrimary: '229 231 235', // gray-200
    borderSecondary: '209 213 219', // gray-300
    borderTertiary: '156 163 175', // gray-400
    success: '34 197 94',       // green-500
    successBg: '240 253 244',   // green-50
    successText: '22 163 74',   // green-600
    error: '239 68 68',         // red-500
    errorBg: '254 242 242',     // red-50
    errorText: '220 38 38',     // red-600
    warning: '245 158 11',      // amber-500
    warningBg: '255 251 235',   // amber-50
    warningText: '217 119 6',   // amber-600
    info: '59 130 246',         // blue-500
    infoBg: '239 246 255',      // blue-50
    infoText: '37 99 235',      // blue-600
  }
};

// Custom theme configurations - add your own themes here
export const customThemes: Record<string, ThemeConfig> = {
  ocean: {
    primary: '14 165 233',      // sky-500
    primaryDark: '2 132 199',   // sky-600
    primaryLight: '125 211 252', // sky-300
    bgPrimary: '8 47 73',       // custom dark blue
    bgSecondary: '12 74 110',   // custom blue
    bgTertiary: '14 116 144',   // custom lighter blue
    bgQuaternary: '22 163 174', // custom teal
    textPrimary: '240 249 255', // sky-50
    textSecondary: '186 230 253', // sky-200
    textTertiary: '125 211 252', // sky-300
    textMuted: '56 189 248',    // sky-400
    borderPrimary: '12 74 110', // custom blue
    borderSecondary: '14 116 144', // custom lighter blue
    borderTertiary: '22 163 174', // custom teal
    success: '34 197 94',       // green-500
    successBg: '6 78 59',       // green-900
    successText: '167 243 208', // green-200
    error: '239 68 68',         // red-500
    errorBg: '127 29 29',       // red-900
    errorText: '252 165 165',   // red-300
    warning: '245 158 11',      // amber-500
    warningBg: '146 64 14',     // amber-900
    warningText: '253 230 138', // amber-200
    info: '14 165 233',         // sky-500
    infoBg: '12 74 110',        // custom blue
    infoText: '186 230 253',    // sky-200
  },
  forest: {
    primary: '34 197 94',       // green-500
    primaryDark: '22 163 74',   // green-600
    primaryLight: '134 239 172', // green-300
    bgPrimary: '20 83 45',      // green-900
    bgSecondary: '22 101 52',   // green-800
    bgTertiary: '21 128 61',    // green-700
    bgQuaternary: '22 163 74',  // green-600
    textPrimary: '240 253 244', // green-50
    textSecondary: '187 247 208', // green-200
    textTertiary: '134 239 172', // green-300
    textMuted: '74 222 128',    // green-400
    borderPrimary: '22 101 52', // green-800
    borderSecondary: '21 128 61', // green-700
    borderTertiary: '22 163 74', // green-600
    success: '34 197 94',       // green-500
    successBg: '20 83 45',      // green-900
    successText: '187 247 208', // green-200
    error: '239 68 68',         // red-500
    errorBg: '127 29 29',       // red-900
    errorText: '252 165 165',   // red-300
    warning: '245 158 11',      // amber-500
    warningBg: '146 64 14',     // amber-900
    warningText: '253 230 138', // amber-200
    info: '59 130 246',         // blue-500
    infoBg: '30 58 138',        // blue-900
    infoText: '191 219 254',    // blue-200
  }
};

// Apply theme to CSS variables
export function applyTheme(theme: ThemeConfig) {
  const root = document.documentElement;
  
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-primary-dark', theme.primaryDark);
  root.style.setProperty('--color-primary-light', theme.primaryLight);
  root.style.setProperty('--color-bg-primary', theme.bgPrimary);
  root.style.setProperty('--color-bg-secondary', theme.bgSecondary);
  root.style.setProperty('--color-bg-tertiary', theme.bgTertiary);
  root.style.setProperty('--color-bg-quaternary', theme.bgQuaternary);
  root.style.setProperty('--color-text-primary', theme.textPrimary);
  root.style.setProperty('--color-text-secondary', theme.textSecondary);
  root.style.setProperty('--color-text-tertiary', theme.textTertiary);
  root.style.setProperty('--color-text-muted', theme.textMuted);
  root.style.setProperty('--color-border-primary', theme.borderPrimary);
  root.style.setProperty('--color-border-secondary', theme.borderSecondary);
  root.style.setProperty('--color-border-tertiary', theme.borderTertiary);
  root.style.setProperty('--color-success', theme.success);
  root.style.setProperty('--color-success-bg', theme.successBg);
  root.style.setProperty('--color-success-text', theme.successText);
  root.style.setProperty('--color-error', theme.error);
  root.style.setProperty('--color-error-bg', theme.errorBg);
  root.style.setProperty('--color-error-text', theme.errorText);
  root.style.setProperty('--color-warning', theme.warning);
  root.style.setProperty('--color-warning-bg', theme.warningBg);
  root.style.setProperty('--color-warning-text', theme.warningText);
  root.style.setProperty('--color-info', theme.info);
  root.style.setProperty('--color-info-bg', theme.infoBg);
  root.style.setProperty('--color-info-text', theme.infoText);
}

// Switch between predefined themes
export function switchTheme(themeName: ThemeMode | keyof typeof customThemes) {
  let theme: ThemeConfig;
  
  if (themeName in themes) {
    theme = themes[themeName as ThemeMode];
  } else if (themeName in customThemes) {
    theme = customThemes[themeName];
  } else {
    console.warn(`Theme "${themeName}" not found, falling back to dark theme`);
    theme = themes.dark;
  }
  
  applyTheme(theme);
  
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
}

// Get stored theme preference
export function getStoredTheme(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('theme') || 'dark';
  }
  return 'dark';
}

// Initialize theme on app load
export function initializeTheme() {
  const storedTheme = getStoredTheme();
  switchTheme(storedTheme);
}

// React hook for theme switching
export function useTheme() {
  const [currentTheme, setCurrentTheme] = React.useState(getStoredTheme());
  
  const changeTheme = (themeName: string) => {
    switchTheme(themeName);
    setCurrentTheme(themeName);
  };
  
  return {
    currentTheme,
    changeTheme,
    availableThemes: {
      ...themes,
      ...customThemes
    }
  };
}

// Add this to your React imports
declare global {
  namespace React {
    function useState<T>(initialState: T): [T, (value: T) => void];
  }
}

// Utility function to create custom themes easily
export function createCustomTheme(
  name: string,
  baseTheme: ThemeMode,
  overrides: Partial<ThemeConfig>
): void {
  customThemes[name] = {
    ...themes[baseTheme],
    ...overrides
  };
}