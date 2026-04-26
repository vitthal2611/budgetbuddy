---
inclusion: auto
---

# CSS & Styling Rules

## File Organization

### CSS File Structure
- One CSS file per component (co-located)
- Component CSS: `ComponentName.css`
- Global styles: `src/index.css`
- Shared variables: `src/styles/modern-variables.css`
- Animations: `src/styles/animations.css`
- Accessibility: `src/styles/accessibility.css`

### Import Order in Components
```javascript
import React from 'react';
import './ComponentName.css';        // Component styles
import './styles/animations.css';    // Animations if needed
```

## Naming Conventions

### BEM-like Methodology
Use clear, descriptive class names:

```css
/* Block */
.transaction-modal { }

/* Element */
.transaction-modal__header { }
.transaction-modal__body { }
.transaction-modal__footer { }

/* Modifier */
.transaction-modal--large { }
.transaction-modal__button--primary { }
.transaction-modal__button--danger { }
```

### Class Naming Rules
- Use kebab-case: `.my-component`
- Be descriptive: `.transaction-list-item` not `.item`
- Avoid abbreviations: `.button` not `.btn`
- Use semantic names: `.primary-action` not `.blue-button`

## Mobile-First Approach

### Always Start with Mobile
Write base styles for mobile, then add desktop overrides:

```css
/* Mobile first (base styles) */
.sidebar {
  display: none;
}

.bottom-nav {
  display: flex;
  position: fixed;
  bottom: 0;
}

/* Desktop overrides */
@media (min-width: 768px) {
  .sidebar {
    display: block;
    width: 250px;
  }
  
  .bottom-nav {
    display: none;
  }
}
```

### Breakpoints
Use consistent breakpoints across the app:

```css
/* Mobile: default (< 768px) */
/* Tablet: 768px - 1024px */
@media (min-width: 768px) { }

/* Desktop: > 1024px */
@media (min-width: 1024px) { }

/* Large Desktop: > 1440px */
@media (min-width: 1440px) { }
```

## CSS Variables

### Use CSS Custom Properties
Define variables in `src/styles/modern-variables.css`:

```css
:root {
  /* Colors */
  --color-primary: #4CAF50;
  --color-secondary: #2196F3;
  --color-danger: #f44336;
  --color-warning: #ff9800;
  --color-success: #4CAF50;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Typography */
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;
  
  /* Borders */
  --border-radius: 8px;
  --border-radius-sm: 4px;
  --border-radius-lg: 12px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 350ms ease;
}
```

### Using Variables
```css
.button {
  background-color: var(--color-primary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  transition: all var(--transition-base);
}
```

## Layout Rules

### Flexbox for Components
Use flexbox for component layouts:

```css
.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}
```

### Grid for Page Layouts
Use CSS Grid for page-level layouts:

```css
.app-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: auto 1fr;
  height: 100vh;
}

@media (max-width: 767px) {
  .app-layout {
    grid-template-columns: 1fr;
  }
}
```

## Spacing Rules

### Consistent Spacing
Use spacing variables for consistency:

```css
/* ✅ CORRECT */
.card {
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  gap: var(--spacing-sm);
}

/* ❌ WRONG */
.card {
  padding: 15px;  /* Magic number */
  margin-bottom: 23px;  /* Inconsistent */
}
```

### Spacing Scale
- `--spacing-xs` (4px): Tight spacing, icon gaps
- `--spacing-sm` (8px): Small gaps, button padding
- `--spacing-md` (16px): Default spacing
- `--spacing-lg` (24px): Section spacing
- `--spacing-xl` (32px): Large section gaps

## Typography Rules

### Font Sizing
Use relative units (rem) for font sizes:

```css
/* ✅ CORRECT */
.heading {
  font-size: var(--font-size-xl);  /* 1.5rem */
}

.body-text {
  font-size: var(--font-size-base);  /* 1rem */
}

/* ❌ WRONG */
.heading {
  font-size: 24px;  /* Fixed pixels */
}
```

### Line Height
Maintain readable line heights:

```css
body {
  line-height: 1.6;  /* Good for body text */
}

h1, h2, h3 {
  line-height: 1.2;  /* Tighter for headings */
}
```

## Color Rules

### Use Semantic Color Names
```css
/* ✅ CORRECT - Semantic */
.error-message {
  color: var(--color-danger);
}

.success-message {
  color: var(--color-success);
}

/* ❌ WRONG - Non-semantic */
.error-message {
  color: red;
}
```

### Color Contrast
Ensure WCAG AA compliance (4.5:1 for normal text):

```css
/* Good contrast */
.button-primary {
  background-color: #2196F3;
  color: #ffffff;  /* High contrast */
}

/* Check contrast at https://webaim.org/resources/contrastchecker/ */
```

## Accessibility Rules

### Focus Indicators
ALWAYS provide visible focus indicators:

```css
/* ✅ CORRECT */
button:focus,
input:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* ❌ WRONG */
button:focus {
  outline: none;  /* Never remove without replacement */
}
```

### Touch Targets
Minimum 44x44px for touch targets:

```css
.button,
.icon-button {
  min-width: 44px;
  min-height: 44px;
  padding: var(--spacing-sm);
}
```

### Screen Reader Only Content
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

## Animation Rules

### Use CSS Transitions
Prefer CSS transitions over JavaScript animations:

```css
.button {
  transition: all var(--transition-base);
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

### Respect Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Animation Performance
Only animate transform and opacity for best performance:

```css
/* ✅ GOOD - GPU accelerated */
.modal {
  transform: translateY(0);
  opacity: 1;
  transition: transform var(--transition-base), 
              opacity var(--transition-base);
}

/* ❌ BAD - Causes reflow */
.modal {
  top: 0;
  transition: top var(--transition-base);
}
```

## Component-Specific Rules

### Buttons
```css
.button {
  /* Base styles */
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all var(--transition-base);
  
  /* Touch target */
  min-height: 44px;
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.button:active {
  transform: translateY(0);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Cards
```css
.card {
  background: white;
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-base);
}

.card:hover {
  box-shadow: var(--shadow-md);
}
```

### Modals
```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}
```

## Performance Rules

### Avoid Expensive Properties
Minimize use of properties that trigger reflow:

```css
/* Expensive (avoid if possible) */
width, height, padding, margin, border
top, left, right, bottom
font-size, line-height

/* Cheap (prefer these) */
transform, opacity
```

### Use will-change Sparingly
```css
/* Only for elements that will definitely animate */
.modal-entering {
  will-change: transform, opacity;
}

.modal-entered {
  will-change: auto;  /* Remove after animation */
}
```

## Dark Mode Support (Future)

### Prepare for Dark Mode
```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #000000;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #1a1a1a;
    --text-primary: #ffffff;
  }
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
```

## CSS Anti-Patterns

### ❌ Don't Use !important
```css
/* BAD */
.button {
  color: red !important;
}

/* GOOD - Fix specificity instead */
.modal .button {
  color: red;
}
```

### ❌ Don't Use Inline Styles
```javascript
// BAD
<div style={{ color: 'red', padding: '10px' }}>

// GOOD
<div className="error-message">
```

### ❌ Don't Use Magic Numbers
```css
/* BAD */
.card {
  padding: 17px;
  margin-top: 23px;
}

/* GOOD */
.card {
  padding: var(--spacing-md);
  margin-top: var(--spacing-lg);
}
```

## CSS Checklist

Before committing CSS:
- [ ] Mobile-first approach used
- [ ] CSS variables used for colors, spacing, etc.
- [ ] Focus indicators visible
- [ ] Touch targets at least 44x44px
- [ ] Animations respect prefers-reduced-motion
- [ ] No !important used
- [ ] No inline styles
- [ ] Semantic class names
- [ ] Consistent spacing scale
- [ ] Good color contrast (WCAG AA)
