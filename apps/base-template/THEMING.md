# Global Theming System

This application uses a comprehensive theming system that allows for easy theme switching and customization at the global and app level.

## Quick Start

### 1. Wrap your app with ThemeProvider

```tsx
import { ThemeProvider } from '@/components/ThemeProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider defaultTheme="dark" enableSystemTheme={true}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 2. Use theme classes in your components

```tsx
export function MyComponent() {
  return (
    <div className="theme-page">
      <div className="theme-container">
        <div className="theme-card">
          <div className="theme-card-header">
            <h1 className="theme-heading-1">My Title</h1>
            <p className="theme-text-muted">Subtitle text</p>
          </div>
          <div className="theme-card-content">
            <button className="theme-btn-primary">Primary Button</button>
            <button className="theme-btn-secondary">Secondary Button</button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 3. Add theme switching

```tsx
import { ThemeSwitcher, ThemeToggle, useTheme } from '@/components/ThemeProvider';

export function Navigation() {
  const { currentTheme, changeTheme } = useTheme();
  
  return (
    <nav>
      {/* Full theme selector */}
      <ThemeSwitcher />
      
      {/* Quick light/dark toggle */}
      <ThemeToggle />
      
      {/* Custom theme button */}
      <button onClick={() => changeTheme('ocean')}>
        Ocean Theme
      </button>
    </nav>
  );
}
```

## Available Theme Classes

### Layout
- `theme-page` - Full page container with background and text colors
- `theme-container` - Standard page container with max-width and padding
- `theme-card` - Card component with background, border, and shadow
- `theme-card-header` - Card header with bottom border
- `theme-card-content` - Card content area with padding
- `theme-card-section` - Individual sections within cards

### Typography
- `theme-heading-1` - Large heading (3xl, bold)
- `theme-heading-2` - Medium heading (xl, semibold)  
- `theme-heading-3` - Small heading (lg, medium)
- `theme-text-primary` - Primary text color
- `theme-text-secondary` - Secondary text color
- `theme-text-muted` - Muted/subtle text color

### Buttons
- `theme-btn-primary` - Primary action button
- `theme-btn-secondary` - Secondary action button

### Forms
- `theme-input` - Text input styling
- `theme-textarea` - Textarea styling
- `theme-select` - Select dropdown styling

### Status/Alerts
- `theme-status-success` - Success message styling
- `theme-status-error` - Error message styling
- `theme-status-warning` - Warning message styling
- `theme-status-info` - Info message styling

### Badges
- `theme-badge` - Base badge styling
- `theme-badge-primary` - Primary colored badge
- `theme-badge-success` - Success colored badge
- `theme-badge-error` - Error colored badge

### Navigation
- `theme-nav-item` - Navigation item styling
- `theme-nav-item.active` - Active navigation item

### Links
- `theme-link` - Themed link styling

### Utility Classes
- `theme-bg-primary`, `theme-bg-secondary`, `theme-bg-tertiary` - Background colors
- `theme-border-primary`, `theme-border-secondary` - Border colors
- `hover-theme-bg-tertiary`, `hover-theme-bg-quaternary` - Hover states

## Built-in Themes

### Dark Theme (default)
- Dark backgrounds with light text
- Purple primary color
- High contrast for accessibility

### Light Theme  
- Light backgrounds with dark text
- Same purple primary color
- Clean, minimal appearance

### Ocean Theme
- Blue/teal color scheme
- Ocean-inspired dark theme
- Perfect for maritime or tech applications

### Forest Theme
- Green color scheme
- Nature-inspired dark theme
- Great for environmental or outdoor applications

## Creating Custom Themes

### Method 1: Using createCustomTheme()

```tsx
import { createCustomTheme, switchTheme } from '@/lib/theme';

// Create a custom theme based on dark theme
createCustomTheme('sunset', 'dark', {
  primary: '249 115 22',        // orange-500
  primaryDark: '234 88 12',     // orange-600
  primaryLight: '254 215 170',  // orange-200
  bgPrimary: '69 10 10',        // custom dark red
  bgSecondary: '127 29 29',     // red-900
  // ... override any other colors
});

// Use the theme
switchTheme('sunset');
```

### Method 2: Direct theme configuration

```tsx
import { customThemes, applyTheme } from '@/lib/theme';

// Add directly to customThemes
customThemes.sunset = {
  primary: '249 115 22',
  primaryDark: '234 88 12',
  // ... full theme config
};
```

### Method 3: CSS variables override

For app-specific overrides, you can override CSS variables:

```css
/* In your app's CSS file */
:root {
  --color-primary: 249 115 22; /* Override primary color */
}

/* Or for specific components */
.my-special-component {
  --color-bg-secondary: 59 130 246; /* Blue background for this component */
}
```

## App-Level Overrides

### Option 1: CSS Variables
Override specific variables in your app's CSS:

```css
/* apps/my-app/app/globals.css */
@import '../../../base-template/app/globals.css';

:root {
  --color-primary: 34 197 94; /* Change primary to green */
  --color-bg-primary: 15 23 42; /* Custom background */
}
```

### Option 2: Custom Theme Provider
Create a wrapper that applies a specific theme:

```tsx
// apps/my-app/components/MyAppTheme.tsx
import { ThemeProvider } from '@chat/base-template/components/ThemeProvider';
import { createCustomTheme } from '@chat/base-template/lib/theme';

// Create app-specific theme
createCustomTheme('my-app', 'dark', {
  primary: '34 197 94', // green
  bgPrimary: '15 23 42', // custom slate
});

export function MyAppTheme({ children }) {
  return (
    <ThemeProvider defaultTheme="my-app">
      {children}
    </ThemeProvider>
  );
}
```

### Option 3: Component-Level Overrides
Use Tailwind classes to override specific components:

```tsx
export function MyComponent() {
  return (
    <div className="theme-card bg-green-900 border-green-800">
      {/* This card will be green instead of the theme color */}
      <div className="theme-card-header">
        <h2 className="theme-heading-2 text-green-100">
          Custom styled header
        </h2>
      </div>
    </div>
  );
}
```

## Theme Persistence

Themes are automatically saved to localStorage and restored on page reload. The system also supports:

- System theme detection (light/dark mode)
- Automatic theme switching based on user's OS preference
- Graceful fallbacks when themes are not found

## Best Practices

1. **Use theme classes consistently** - Prefer `theme-*` classes over hardcoded colors
2. **Test all themes** - Make sure your components work with different themes
3. **Provide theme switching** - Let users choose their preferred theme
4. **Override sparingly** - Use the theme system as much as possible before overriding
5. **Document custom themes** - If you create app-specific themes, document them

## Examples

### Basic Page Layout
```tsx
export default function MyPage() {
  return (
    <div className="theme-page">
      <div className="theme-container">
        <h1 className="theme-heading-1 mb-6">Welcome</h1>
        
        <div className="theme-grid-responsive">
          <div className="theme-card">
            <div className="theme-card-header">
              <h2 className="theme-heading-2">Features</h2>
            </div>
            <div className="theme-card-content">
              <p className="theme-text-secondary mb-4">
                Discover our amazing features.
              </p>
              <button className="theme-btn-primary">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Form Example
```tsx
export function ContactForm() {
  return (
    <div className="theme-card">
      <div className="theme-card-header">
        <h2 className="theme-heading-2">Contact Us</h2>
      </div>
      <div className="theme-card-content">
        <form className="space-y-4">
          <div>
            <label className="theme-text-primary">Name</label>
            <input 
              type="text" 
              className="theme-input w-full"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="theme-text-primary">Message</label>
            <textarea 
              className="theme-textarea w-full"
              placeholder="Your message"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="theme-btn-primary">
              Send Message
            </button>
            <button type="button" className="theme-btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

This theming system provides a solid foundation that can be easily customized per app while maintaining consistency across your entire application suite.