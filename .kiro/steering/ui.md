---
inclusion: auto
---

# UI/UX Guidelines - Mandatory Standards

## Design System Foundation

### Design Tokens (MUST USE)
ALL UI components MUST use CSS variables from `src/styles/modern-variables.css`:

```css
/* Colors - NEVER use hardcoded colors */
var(--color-primary)      /* #4CAF50 - Primary actions */
var(--color-secondary)    /* #2196F3 - Secondary actions */
var(--color-danger)       /* #f44336 - Destructive actions */
var(--color-warning)      /* #ff9800 - Warnings */
var(--color-success)      /* #4CAF50 - Success states */
var(--color-info)         /* #2196F3 - Info messages */

/* Spacing - NEVER use arbitrary pixel values */
var(--spacing-xs)         /* 4px - Tight spacing */
var(--spacing-sm)         /* 8px - Small gaps */
var(--spacing-md)         /* 16px - Default spacing */
var(--spacing-lg)         /* 24px - Section spacing */
var(--spacing-xl)         /* 32px - Large gaps */

/* Typography - NEVER use hardcoded font sizes */
var(--font-size-sm)       /* 0.875rem - Small text */
var(--font-size-base)     /* 1rem - Body text */
var(--font-size-lg)       /* 1.25rem - Large text */
var(--font-size-xl)       /* 1.5rem - Headings */

/* Border Radius - NEVER use arbitrary border-radius */
var(--border-radius-sm)   /* 4px - Small elements */
var(--border-radius)      /* 8px - Default */
var(--border-radius-lg)   /* 12px - Large elements */

/* Shadows - NEVER create custom shadows */
var(--shadow-sm)          /* Subtle elevation */
var(--shadow-md)          /* Medium elevation */
var(--shadow-lg)          /* High elevation */

/* Transitions - NEVER use arbitrary timing */
var(--transition-fast)    /* 150ms - Quick feedback */
var(--transition-base)    /* 250ms - Default */
var(--transition-slow)    /* 350ms - Smooth transitions */
```

### ❌ VIOLATIONS (DO NOT DO THIS)
```css
/* WRONG - Hardcoded values */
.button {
  background-color: #4CAF50;  /* Use var(--color-primary) */
  padding: 15px;              /* Use var(--spacing-md) */
  font-size: 14px;            /* Use var(--font-size-sm) */
  border-radius: 6px;         /* Use var(--border-radius) */
  transition: 200ms;          /* Use var(--transition-base) */
}

/* CORRECT - Using design tokens */
.button {
  background-color: var(--color-primary);
  padding: var(--spacing-md);
  font-size: var(--font-size-base);
  border-radius: var(--border-radius);
  transition: all var(--transition-base);
}
```

## Mobile-First Approach (MANDATORY)

### Responsive Design Rules
1. **ALWAYS write mobile styles first** (base styles)
2. **Add desktop overrides** using media queries
3. **Test on mobile devices**, not just browser DevTools
4. **Touch targets MUST be minimum 44x44px**

### Standard Breakpoints (USE THESE ONLY)
```css
/* Mobile: Default (< 768px) - Base styles */
.component {
  /* Mobile styles here */
}

/* Tablet: 768px - 1024px */
@media (min-width: 768px) {
  .component {
    /* Tablet overrides */
  }
}

/* Desktop: > 1024px */
@media (min-width: 1024px) {
  .component {
    /* Desktop overrides */
  }
}

/* Large Desktop: > 1440px */
@media (min-width: 1440px) {
  .component {
    /* Large screen overrides */
  }
}
```

### Mobile-First Example
```css
/* ✅ CORRECT - Mobile first */
.sidebar {
  display: none;  /* Hidden on mobile */
}

.bottom-nav {
  display: flex;
  position: fixed;
  bottom: 0;
  width: 100%;
}

@media (min-width: 768px) {
  .sidebar {
    display: block;  /* Show on desktop */
    width: 250px;
  }
  
  .bottom-nav {
    display: none;  /* Hide on desktop */
  }
}

/* ❌ WRONG - Desktop first */
.sidebar {
  display: block;
  width: 250px;
}

@media (max-width: 767px) {
  .sidebar {
    display: none;
  }
}
```

## Component Structure Standards

### Component File Organization (MANDATORY)
```
ComponentName/
├── ComponentName.js       # Component logic
├── ComponentName.css      # Component styles
└── ComponentName.test.js  # Component tests (if applicable)
```

### Component Template (MUST FOLLOW)
```javascript
import React, { useState, useEffect } from 'react';
import './ComponentName.css';

/**
 * ComponentName - Brief description
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Title text
 * @param {Function} props.onAction - Action callback
 */
function ComponentName({ title, onAction }) {
  const [state, setState] = useState(null);
  
  return (
    <div className="component-name">
      <h2 className="component-name__title">{title}</h2>
      <button 
        className="component-name__button"
        onClick={onAction}
      >
        Action
      </button>
    </div>
  );
}

export default ComponentName;
```

## CSS Naming Conventions (STRICT)

### BEM Methodology (MANDATORY)
```css
/* Block */
.transaction-modal { }

/* Element - Use double underscore */
.transaction-modal__header { }
.transaction-modal__body { }
.transaction-modal__footer { }
.transaction-modal__button { }

/* Modifier - Use double dash */
.transaction-modal--large { }
.transaction-modal--fullscreen { }
.transaction-modal__button--primary { }
.transaction-modal__button--danger { }

/* State - Use 'is-' or 'has-' prefix */
.transaction-modal.is-open { }
.transaction-modal.is-loading { }
.transaction-modal__button.is-disabled { }
```

### Naming Rules (STRICT)
1. **Use kebab-case**: `.my-component` NOT `.myComponent` or `.MyComponent`
2. **Be descriptive**: `.transaction-list-item` NOT `.item`
3. **No abbreviations**: `.button` NOT `.btn`
4. **Semantic names**: `.primary-action` NOT `.blue-button`
5. **Avoid generic names**: `.transaction-card` NOT `.card`

### ❌ VIOLATIONS
```css
/* WRONG */
.btn { }                    /* Too generic, abbreviated */
.Item { }                   /* Wrong case */
.transaction_modal { }      /* Wrong separator */
.blueButton { }             /* camelCase not allowed */
.modal-1 { }                /* Numbers without context */

/* CORRECT */
.button { }
.transaction-item { }
.transaction-modal { }
.primary-button { }
.modal-variant-large { }
```

## Layout Standards

### Flexbox Usage (PREFERRED)
Use flexbox for component-level layouts:

```css
/* ✅ CORRECT - Flexbox for components */
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

.card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
```

### CSS Grid Usage (FOR PAGE LAYOUTS)
Use CSS Grid for page-level layouts:

```css
/* ✅ CORRECT - Grid for page layouts */
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

### Gap Property (MANDATORY)
ALWAYS use `gap` instead of margins for flex/grid spacing:

```css
/* ✅ CORRECT - Using gap */
.button-group {
  display: flex;
  gap: var(--spacing-sm);
}

/* ❌ WRONG - Using margins */
.button-group button {
  margin-right: 8px;
}
.button-group button:last-child {
  margin-right: 0;
}
```

## Button Standards (STRICT)

### Button Variants (USE THESE ONLY)
```css
/* Primary Button - Main actions */
.button--primary {
  background-color: var(--color-primary);
  color: white;
  border: none;
}

/* Secondary Button - Secondary actions */
.button--secondary {
  background-color: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
}

/* Danger Button - Destructive actions */
.button--danger {
  background-color: var(--color-danger);
  color: white;
  border: none;
}

/* Ghost Button - Subtle actions */
.button--ghost {
  background-color: transparent;
  color: var(--color-primary);
  border: none;
}
```

### Button Base Styles (MANDATORY)
```css
.button {
  /* Sizing */
  padding: var(--spacing-sm) var(--spacing-md);
  min-height: 44px;  /* Touch target */
  min-width: 44px;
  
  /* Typography */
  font-size: var(--font-size-base);
  font-weight: 500;
  
  /* Visual */
  border-radius: var(--border-radius);
  cursor: pointer;
  
  /* Interaction */
  transition: all var(--transition-base);
  
  /* Accessibility */
  outline: none;
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.button:active {
  transform: translateY(0);
}

.button:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
```

### Button Usage Rules
1. **Primary button**: ONE per screen/modal (main action)
2. **Secondary button**: Supporting actions
3. **Danger button**: Delete, remove, destructive actions ONLY
4. **Ghost button**: Tertiary actions, cancel buttons

## Form Standards (MANDATORY)

### Input Field Structure
```jsx
<div className="form-field">
  <label htmlFor="amount" className="form-field__label">
    Amount
    {required && <span className="form-field__required">*</span>}
  </label>
  <input
    id="amount"
    type="number"
    className={`form-field__input ${error ? 'form-field__input--error' : ''}`}
    value={value}
    onChange={onChange}
    aria-invalid={!!error}
    aria-describedby={error ? 'amount-error' : undefined}
  />
  {error && (
    <span id="amount-error" className="form-field__error">
      {error}
    </span>
  )}
</div>
```

### Input Styles (MANDATORY)
```css
.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.form-field__label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: #333;
}

.form-field__required {
  color: var(--color-danger);
  margin-left: var(--spacing-xs);
}

.form-field__input {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid #ddd;
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  transition: border-color var(--transition-fast);
  min-height: 44px;  /* Touch target */
}

.form-field__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.form-field__input--error {
  border-color: var(--color-danger);
}

.form-field__error {
  font-size: var(--font-size-sm);
  color: var(--color-danger);
}
```

### Form Validation Rules
1. **Validate on blur**, not on every keystroke
2. **Show errors below the field**
3. **Use red color for errors** (var(--color-danger))
4. **Disable submit button** when form is invalid
5. **Show loading state** during submission

## Modal Standards (STRICT)

### Modal Structure (MANDATORY)
```jsx
<div className="modal-overlay" onClick={onClose}>
  <div 
    className="modal-content" 
    onClick={(e) => e.stopPropagation()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <div className="modal-header">
      <h2 id="modal-title" className="modal-header__title">
        {title}
      </h2>
      <button 
        className="modal-header__close"
        onClick={onClose}
        aria-label="Close modal"
      >
        ✕
      </button>
    </div>
    
    <div className="modal-body">
      {children}
    </div>
    
    <div className="modal-footer">
      <button className="button--secondary" onClick={onClose}>
        Cancel
      </button>
      <button className="button--primary" onClick={onSave}>
        Save
      </button>
    </div>
  </div>
</div>
```

### Modal Styles (MANDATORY)
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
  padding: var(--spacing-md);
}

.modal-content {
  background: white;
  border-radius: var(--border-radius-lg);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid #eee;
}

.modal-body {
  padding: var(--spacing-lg);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  border-top: 1px solid #eee;
}
```

### Modal Rules
1. **Close on overlay click**
2. **Close on ESC key press**
3. **Trap focus inside modal**
4. **Return focus to trigger element** on close
5. **Prevent body scroll** when modal is open
6. **Maximum one modal** at a time

## Card Standards

### Card Structure (MANDATORY)
```jsx
<div className="card">
  <div className="card__header">
    <h3 className="card__title">{title}</h3>
    {action && (
      <button className="card__action" onClick={action}>
        {actionLabel}
      </button>
    )}
  </div>
  
  <div className="card__body">
    {children}
  </div>
  
  {footer && (
    <div className="card__footer">
      {footer}
    </div>
  )}
</div>
```

### Card Styles (MANDATORY)
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

.card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.card__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin: 0;
}

.card__body {
  /* Content styles */
}

.card__footer {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid #eee;
}
```

## Loading States (MANDATORY)

### Loading Spinner Component
```jsx
<div className="loading-spinner" role="status" aria-live="polite">
  <div className="loading-spinner__circle"></div>
  {message && (
    <span className="loading-spinner__message">{message}</span>
  )}
</div>
```

### Loading Styles
```css
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.loading-spinner__circle {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-spinner__message {
  font-size: var(--font-size-sm);
  color: #666;
}
```

### Loading State Rules
1. **Show loading spinner** for operations >300ms
2. **Disable interactive elements** during loading
3. **Show loading message** for clarity
4. **Use skeleton screens** for initial page loads (optional)

## Empty States (MANDATORY)

### Empty State Structure
```jsx
<div className="empty-state">
  <div className="empty-state__icon">{icon}</div>
  <h3 className="empty-state__title">{title}</h3>
  <p className="empty-state__message">{message}</p>
  {action && (
    <button className="button--primary" onClick={action}>
      {actionLabel}
    </button>
  )}
</div>
```

### Empty State Styles
```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  text-align: center;
  min-height: 300px;
}

.empty-state__icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.empty-state__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  color: #333;
}

.empty-state__message {
  font-size: var(--font-size-base);
  color: #666;
  margin-bottom: var(--spacing-lg);
  max-width: 400px;
}
```

## Toast Notifications (MANDATORY)

### Toast Types
```css
.toast {
  position: fixed;
  bottom: var(--spacing-lg);
  right: var(--spacing-lg);
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  min-width: 300px;
  z-index: 2000;
  animation: slideIn 0.3s ease;
}

.toast--success {
  background-color: var(--color-success);
  color: white;
}

.toast--error {
  background-color: var(--color-danger);
  color: white;
}

.toast--warning {
  background-color: var(--color-warning);
  color: white;
}

.toast--info {
  background-color: var(--color-info);
  color: white;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

### Toast Rules
1. **Auto-dismiss after 3-5 seconds**
2. **Show one toast at a time**
3. **Position bottom-right on desktop**, top-center on mobile
4. **Include close button**
5. **Use appropriate type** (success, error, warning, info)

## Accessibility Standards (MANDATORY)

### Focus Indicators (NEVER REMOVE)
```css
/* ✅ CORRECT - Visible focus */
button:focus,
input:focus,
a:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* ❌ FORBIDDEN - Removing outline */
button:focus {
  outline: none;  /* NEVER DO THIS */
}
```

### Touch Targets (STRICT)
```css
/* ALL interactive elements MUST be at least 44x44px */
.button,
.icon-button,
.link,
.checkbox,
.radio {
  min-width: 44px;
  min-height: 44px;
}
```

### ARIA Labels (MANDATORY)
```jsx
/* Icon buttons MUST have aria-label */
<button aria-label="Delete transaction">
  <TrashIcon />
</button>

/* Form inputs MUST have labels */
<label htmlFor="amount">Amount</label>
<input id="amount" type="number" />

/* Modals MUST have role and aria attributes */
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Add Transaction</h2>
</div>
```

### Color Contrast (WCAG AA)
- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text**: Minimum 3:1 contrast ratio
- **Test all color combinations** at https://webaim.org/resources/contrastchecker/

### Keyboard Navigation (MANDATORY)
1. **All interactive elements** must be keyboard accessible
2. **Tab order** must be logical
3. **ESC key** closes modals and dropdowns
4. **Enter key** submits forms
5. **Arrow keys** navigate lists (when applicable)

## Animation Standards

### Animation Rules (STRICT)
1. **Only animate transform and opacity** (GPU accelerated)
2. **Use CSS transitions**, not JavaScript animations
3. **Respect prefers-reduced-motion**
4. **Keep animations under 350ms**

### Allowed Animations
```css
/* ✅ CORRECT - GPU accelerated */
.element {
  transform: translateY(0);
  opacity: 1;
  transition: transform var(--transition-base), 
              opacity var(--transition-base);
}

.element:hover {
  transform: translateY(-2px);
}

/* ❌ WRONG - Causes reflow */
.element {
  top: 0;
  transition: top var(--transition-base);
}
```

### Reduced Motion (MANDATORY)
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

## Icon Standards

### Icon Usage Rules
1. **Use emoji icons** for simplicity (🏠, 💰, 📊)
2. **Consistent size**: 1.5rem for inline, 2rem for standalone
3. **Always include aria-label** for icon-only buttons
4. **Use semantic meaning**

```jsx
/* ✅ CORRECT */
<button aria-label="Delete transaction">
  🗑️
</button>

/* ❌ WRONG - No label */
<button>
  🗑️
</button>
```

## Typography Standards

### Font Hierarchy (MANDATORY)
```css
h1 {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: var(--spacing-md);
}

h2 {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.3;
  margin-bottom: var(--spacing-sm);
}

h3 {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: var(--spacing-sm);
}

p {
  font-size: var(--font-size-base);
  line-height: 1.6;
  margin-bottom: var(--spacing-md);
}

small {
  font-size: var(--font-size-sm);
  line-height: 1.5;
}
```

### Typography Rules
1. **Use relative units** (rem, em) NOT pixels
2. **Line height 1.6** for body text
3. **Line height 1.2-1.4** for headings
4. **Maximum line length** 65-75 characters
5. **Use system fonts** for performance

## Color Usage Rules (STRICT)

### Semantic Colors (MANDATORY)
```css
/* Success - Positive actions, confirmations */
var(--color-success)  /* Green */

/* Danger - Destructive actions, errors */
var(--color-danger)   /* Red */

/* Warning - Cautions, alerts */
var(--color-warning)  /* Orange */

/* Info - Informational messages */
var(--color-info)     /* Blue */

/* Primary - Main brand color, primary actions */
var(--color-primary)  /* Green */

/* Secondary - Supporting actions */
var(--color-secondary) /* Blue */
```

### Color Rules
1. **NEVER use colors directly** - Always use CSS variables
2. **Use semantic meaning** - Red for danger, green for success
3. **Ensure contrast** - Test with WCAG tools
4. **Limit color palette** - Don't introduce new colors
5. **Consistent usage** - Same color for same meaning

## Z-Index Scale (MANDATORY)

### Z-Index Layers (USE THESE ONLY)
```css
/* Base content */
.content { z-index: 1; }

/* Dropdowns, tooltips */
.dropdown { z-index: 100; }

/* Sticky headers */
.sticky-header { z-index: 500; }

/* Modals, overlays */
.modal-overlay { z-index: 1000; }

/* Toasts, notifications */
.toast { z-index: 2000; }

/* Critical alerts */
.alert { z-index: 3000; }
```

### Z-Index Rules
1. **Use predefined values ONLY**
2. **Never use z-index: 9999**
3. **Document any new z-index values**
4. **Keep z-index hierarchy logical**

## Performance Rules

### CSS Performance (MANDATORY)
1. **Avoid expensive properties**: width, height, top, left
2. **Prefer transform and opacity**
3. **Use will-change sparingly**
4. **Minimize reflows and repaints**
5. **Avoid universal selectors** (*)

### Image Optimization
1. **Compress all images** before adding
2. **Use appropriate formats** (WebP, PNG, JPG)
3. **Provide alt text** for all images
4. **Lazy load images** below the fold
5. **Use responsive images** with srcset

## Component Checklist

Before creating/updating ANY component:
- [ ] Uses design tokens (CSS variables)
- [ ] Mobile-first responsive design
- [ ] BEM naming convention
- [ ] Minimum 44x44px touch targets
- [ ] Visible focus indicators
- [ ] ARIA labels where needed
- [ ] Keyboard accessible
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Empty states handled
- [ ] Animations respect reduced-motion
- [ ] Color contrast meets WCAG AA
- [ ] No hardcoded colors/spacing
- [ ] Semantic HTML elements
- [ ] Proper heading hierarchy

## Common Violations (FORBIDDEN)

### ❌ NEVER DO THESE
```css
/* Hardcoded colors */
color: #4CAF50;

/* Arbitrary spacing */
padding: 15px;
margin: 23px;

/* Removing focus outline */
:focus { outline: none; }

/* Desktop-first media queries */
@media (max-width: 767px) { }

/* Inline styles */
<div style="color: red;">

/* Generic class names */
.item { }
.box { }
.container { }

/* Magic numbers */
z-index: 9999;
width: 347px;

/* Non-semantic HTML */
<div onClick={handleClick}>Click me</div>

/* Missing accessibility */
<button><Icon /></button>  /* No aria-label */
```

## Enforcement

ALL UI code MUST pass these checks:
1. ✅ Uses CSS variables for colors, spacing, typography
2. ✅ Mobile-first responsive design
3. ✅ BEM naming convention
4. ✅ Accessibility standards met
5. ✅ Touch targets minimum 44x44px
6. ✅ Focus indicators visible
7. ✅ Animations respect reduced-motion
8. ✅ No hardcoded values
9. ✅ Semantic HTML
10. ✅ Proper ARIA labels

## Remember

> "Consistency is more important than perfection."

> "Design tokens are not optional - they are mandatory."

> "Mobile-first is not a suggestion - it's a requirement."

> "Accessibility is not a feature - it's a necessity."

> "If you're hardcoding a value, you're doing it wrong."
