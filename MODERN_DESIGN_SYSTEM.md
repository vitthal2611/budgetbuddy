# BudgetBuddy Modern Design System
## Premium Fintech Experience

Inspired by: CRED, Jupiter, Notion, Revolut

---

## Design Philosophy

### Core Principles
1. **Clarity First** - Information hierarchy over decoration
2. **Minimal & Elegant** - Less is more, every element has purpose
3. **Premium Feel** - Subtle details, smooth interactions
4. **Readable** - High contrast, clear typography
5. **Consistent** - Predictable patterns throughout

---

## Color System

### Neutrals (Primary Palette)
```css
--bg-primary: #F7F8FA;        /* Main background */
--bg-secondary: #FFFFFF;      /* Cards, surfaces */
--bg-tertiary: #F0F1F3;       /* Subtle backgrounds */

--text-primary: #1A1D1F;      /* Headings, important text */
--text-secondary: #6F767E;    /* Body text */
--text-tertiary: #9A9FA5;     /* Subtle text, labels */
--text-disabled: #D1D5DB;     /* Disabled state */

--border-light: #EFEFEF;      /* Subtle dividers */
--border-medium: #E5E7EB;     /* Card borders */
--border-dark: #D1D5DB;       /* Input borders */
```

### Brand Colors
```css
--primary: #6366F1;           /* Indigo - Primary actions */
--primary-light: #818CF8;     /* Hover states */
--primary-dark: #4F46E5;      /* Active states */
--primary-bg: #EEF2FF;        /* Subtle backgrounds */

--secondary: #8B5CF6;         /* Purple - Secondary actions */
--secondary-light: #A78BFA;
--secondary-bg: #F5F3FF;
```

### Semantic Colors
```css
--success: #10B981;           /* Income, positive */
--success-light: #34D399;
--success-bg: #ECFDF5;
--success-text: #047857;

--danger: #EF4444;            /* Expense, negative */
--danger-light: #F87171;
--danger-bg: #FEF2F2;
--danger-text: #DC2626;

--warning: #F59E0B;           /* Alerts, warnings */
--warning-light: #FBBF24;
--warning-bg: #FFFBEB;
--warning-text: #D97706;

--info: #3B82F6;              /* Information */
--info-light: #60A5FA;
--info-bg: #EFF6FF;
--info-text: #1D4ED8;
```

### Usage Guidelines
- Use neutrals for 90% of the interface
- Brand colors for CTAs and key actions only
- Semantic colors for indicators, not full backgrounds
- Never use gradients on cards (flat surfaces only)
- Subtle gradients allowed on hero sections only

---

## Typography

### Font Stack
```css
--font-primary: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 
                'Inter', 'Segoe UI', sans-serif;
--font-mono: 'SF Mono', 'Consolas', 'Monaco', monospace;
```

### Type Scale (Mobile First)
```css
/* Display - Hero numbers */
--text-display: 48px / 700 / -1.5px;

/* Headings */
--text-h1: 32px / 700 / -0.8px;      /* Page titles */
--text-h2: 24px / 600 / -0.5px;      /* Section headers */
--text-h3: 20px / 600 / -0.3px;      /* Card titles */
--text-h4: 18px / 600 / 0px;         /* Subsections */

/* Body */
--text-body-lg: 17px / 400 / 0px;    /* Large body */
--text-body: 15px / 400 / 0px;       /* Default body */
--text-body-sm: 14px / 400 / 0px;    /* Small body */

/* Labels */
--text-label: 13px / 500 / 0.3px;    /* Input labels */
--text-caption: 12px / 400 / 0px;    /* Captions, hints */
--text-overline: 11px / 600 / 0.8px; /* Overline text (uppercase) */
```

### Font Weights
```css
--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
```

---

## Spacing System (8pt Grid)

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### Component Spacing
```css
--padding-card: 20px;
--padding-section: 24px;
--gap-items: 12px;
--gap-sections: 24px;
```

---

## Border Radius

```css
--radius-sm: 8px;       /* Small elements */
--radius-md: 12px;      /* Inputs, chips */
--radius-lg: 16px;      /* Cards */
--radius-xl: 20px;      /* Large cards */
--radius-2xl: 24px;     /* Hero sections */
--radius-full: 9999px;  /* Pills, avatars */
```

---

## Shadows

### Elevation System
```css
/* Subtle shadows only */
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.04);
--shadow-md: 0 4px 8px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.08);
--shadow-xl: 0 12px 24px rgba(0, 0, 0, 0.10);

/* Colored shadows (very subtle) */
--shadow-primary: 0 4px 12px rgba(99, 102, 241, 0.15);
--shadow-success: 0 4px 12px rgba(16, 185, 129, 0.15);
--shadow-danger: 0 4px 12px rgba(239, 68, 68, 0.15);
```

### Usage
- Most cards: shadow-sm or shadow-md
- Floating elements: shadow-lg
- Modals: shadow-xl
- No shadows on flat surfaces

---

## Components

### 1. Cards

#### White Card (Default)
```css
background: var(--bg-secondary);
border-radius: var(--radius-lg);
padding: var(--padding-card);
box-shadow: var(--shadow-sm);
border: 1px solid var(--border-light);
```

#### Flat Card (No shadow)
```css
background: var(--bg-secondary);
border-radius: var(--radius-lg);
padding: var(--padding-card);
border: 1px solid var(--border-light);
```

#### Colored Indicator Card
```css
/* White card with colored left border */
border-left: 3px solid var(--primary);
```

### 2. Buttons

#### Primary Button
```css
background: var(--primary);
color: white;
padding: 14px 24px;
border-radius: var(--radius-md);
font-size: var(--text-body);
font-weight: var(--weight-medium);
box-shadow: var(--shadow-sm);
transition: all 0.2s ease;

/* Hover */
background: var(--primary-light);
transform: translateY(-1px);
box-shadow: var(--shadow-md);

/* Active */
background: var(--primary-dark);
transform: translateY(0);
```

#### Secondary Button (Outline)
```css
background: transparent;
color: var(--primary);
border: 1.5px solid var(--primary);
padding: 14px 24px;
border-radius: var(--radius-md);

/* Hover */
background: var(--primary-bg);
```

#### Ghost Button
```css
background: transparent;
color: var(--text-secondary);
padding: 14px 24px;

/* Hover */
background: var(--bg-tertiary);
```

#### Icon Button
```css
width: 40px;
height: 40px;
border-radius: var(--radius-md);
background: var(--bg-tertiary);
color: var(--text-secondary);

/* Hover */
background: var(--border-medium);
```

### 3. Floating Action Button (FAB)
```css
position: fixed;
bottom: 80px;
right: 20px;
width: 56px;
height: 56px;
border-radius: var(--radius-full);
background: var(--primary);
color: white;
box-shadow: var(--shadow-xl);
z-index: 100;

/* Icon */
font-size: 24px;
```

### 4. Chips / Tags

#### Default Chip
```css
display: inline-flex;
align-items: center;
padding: 6px 12px;
border-radius: var(--radius-full);
background: var(--bg-tertiary);
color: var(--text-secondary);
font-size: var(--text-caption);
font-weight: var(--weight-medium);
```

#### Active Chip
```css
background: var(--primary-bg);
color: var(--primary);
border: 1px solid var(--primary);
```

#### Semantic Chips
```css
/* Success */
background: var(--success-bg);
color: var(--success-text);

/* Danger */
background: var(--danger-bg);
color: var(--danger-text);
```

### 5. Progress Bars

#### Modern Thin Progress
```css
height: 6px;
background: var(--bg-tertiary);
border-radius: var(--radius-full);
overflow: hidden;

/* Fill */
height: 100%;
background: var(--primary);
border-radius: var(--radius-full);
transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
```

#### With Percentage
```css
/* Container */
display: flex;
align-items: center;
gap: 12px;

/* Bar */
flex: 1;

/* Percentage */
font-size: var(--text-caption);
color: var(--text-tertiary);
min-width: 40px;
text-align: right;
```

### 6. List Items

#### Clean List Item
```css
display: flex;
align-items: center;
padding: 16px 0;
border-bottom: 1px solid var(--border-light);
gap: 12px;

/* Icon */
width: 40px;
height: 40px;
border-radius: var(--radius-md);
background: var(--bg-tertiary);
display: flex;
align-items: center;
justify-content: center;

/* Content */
flex: 1;

/* Amount */
font-size: var(--text-body-lg);
font-weight: var(--weight-semibold);
```

### 7. Bottom Navigation

#### Modern Bottom Nav
```css
position: fixed;
bottom: 0;
left: 0;
right: 0;
height: 64px;
background: var(--bg-secondary);
border-top: 1px solid var(--border-light);
display: flex;
justify-content: space-around;
padding: 8px 0;
padding-bottom: env(safe-area-inset-bottom);

/* Nav Item */
display: flex;
flex-direction: column;
align-items: center;
gap: 4px;
color: var(--text-tertiary);
font-size: var(--text-caption);

/* Active */
color: var(--primary);

/* Active Indicator */
width: 4px;
height: 4px;
border-radius: var(--radius-full);
background: var(--primary);
position: absolute;
top: -2px;
```

### 8. Inputs

#### Text Input
```css
padding: 14px 16px;
border: 1.5px solid var(--border-dark);
border-radius: var(--radius-md);
font-size: var(--text-body);
background: var(--bg-secondary);
color: var(--text-primary);

/* Focus */
border-color: var(--primary);
box-shadow: 0 0 0 3px var(--primary-bg);

/* Error */
border-color: var(--danger);
```

#### Select / Dropdown
```css
/* Same as input but with arrow icon */
appearance: none;
background-image: url("data:image/svg+xml,...");
background-position: right 12px center;
padding-right: 40px;
```

### 9. Modals / Bottom Sheets

#### Bottom Sheet
```css
position: fixed;
bottom: 0;
left: 0;
right: 0;
background: var(--bg-secondary);
border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
padding: 24px;
padding-bottom: calc(24px + env(safe-area-inset-bottom));
box-shadow: var(--shadow-xl);
max-height: 90vh;
overflow-y: auto;

/* Handle */
width: 40px;
height: 4px;
background: var(--border-medium);
border-radius: var(--radius-full);
margin: 0 auto 20px;
```

#### Modal Backdrop
```css
position: fixed;
inset: 0;
background: rgba(0, 0, 0, 0.4);
backdrop-filter: blur(4px);
z-index: 999;
```

---

## Screen Layouts

### Dashboard Layout
```
┌─────────────────────────────────┐
│ [Avatar] BudgetBuddy      [🔔] │ ← Header (white bg)
├─────────────────────────────────┤
│                                 │
│ Total Balance                   │ ← Label (small, gray)
│ ₹1,50,000                       │ ← Hero number (48px, bold)
│ +₹15,000 this month            │ ← Subtitle (green, small)
│                                 │
│ ┌─────────────┬─────────────┐  │
│ │ 💰 Income   │ 💸 Expense  │  │ ← Summary cards (white)
│ │ ₹50,000     │ ₹35,000     │  │   Flat, subtle shadow
│ └─────────────┴─────────────┘  │
│                                 │
│ ┌─────────────────────────────┐│
│ │ 📊 Spending Trend           ││ ← Chart card
│ │ [Line chart visualization]  ││
│ └─────────────────────────────┘│
│                                 │
│ Today's Expenses                │ ← Section header
│ ─────────────────────────────  │
│ 🍕 Food & Dining        ₹450   │ ← Clean list
│ ☕ Coffee               ₹120   │   Icon + text + amount
│ 🚕 Transport           ₹200   │   Subtle dividers
│                                 │
│ Payment Methods                 │
│ ─────────────────────────────  │
│ 💳 HDFC Bank          ₹45,000  │
│ 💵 Cash               ₹5,000   │
│                                 │
│ Budget Overview                 │
│ ─────────────────────────────  │
│ Groceries    ████░░░░░░  60%   │ ← Thin progress bars
│ Transport    ██████░░░░  80%   │
│                                 │
└─────────────────────────────────┘
                [+] FAB             ← Floating action button
```

### Transaction List Layout
```
┌─────────────────────────────────┐
│ ← Transactions            [⋮]   │
├─────────────────────────────────┤
│ [All] [Income] [Expense] [...]  │ ← Filter chips
│                                 │
│ ┌─────────────────────────────┐│
│ │ March 2026                  ││ ← Sticky summary
│ │ Income: ₹50,000             ││
│ │ Expense: ₹35,000            ││
│ └─────────────────────────────┘│
│                                 │
│ Today                           │
│ ─────────────────────────────  │
│ 🍕 Lunch at Pizza Hut           │
│    Food & Dining                │
│    12:30 PM • HDFC         -₹450│ ← Red amount
│                                 │
│ ☕ Starbucks Coffee              │
│    Food & Dining                │
│    9:15 AM • Cash          -₹120│
│                                 │
│ Yesterday                       │
│ ─────────────────────────────  │
│ 💰 Salary                       │
│    Income                       │
│    Bank Transfer          +₹50K │ ← Green amount
│                                 │
└─────────────────────────────────┘
```

---

## Micro-interactions

### Tap Feedback
```css
/* Button press */
transform: scale(0.98);
transition: transform 0.1s ease;

/* Release */
transform: scale(1);
```

### Loading States
```css
/* Skeleton shimmer */
background: linear-gradient(
  90deg,
  var(--bg-tertiary) 25%,
  var(--border-light) 50%,
  var(--bg-tertiary) 75%
);
background-size: 200% 100%;
animation: shimmer 1.5s infinite;

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Smooth Transitions
```css
/* Page transitions */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## Icons

### Style
- Outline style (not filled)
- 24px default size
- 1.5px stroke width
- Rounded line caps

### Usage
```
💰 Income
💸 Expense
🔄 Transfer
📊 Dashboard
💳 Transactions
💰 Budget
👤 Profile
🔔 Notifications
⚙️ Settings
```

---

## Accessibility

### Contrast Ratios
- Text on white: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

### Touch Targets
- Minimum: 44x44px
- Recommended: 48x48px
- Spacing: 8px minimum

### Focus States
```css
outline: 2px solid var(--primary);
outline-offset: 2px;
```

---

## Do's and Don'ts

### ✅ Do:
- Use white cards with subtle shadows
- Use colored indicators (borders, icons, text)
- Keep backgrounds neutral
- Use consistent spacing
- Add smooth transitions
- Use semantic colors sparingly
- Maintain visual hierarchy

### ❌ Don't:
- Use gradient backgrounds on cards
- Overuse colors
- Create cluttered layouts
- Use inconsistent spacing
- Add unnecessary decorations
- Use heavy shadows
- Mix different design patterns

---

## Implementation Checklist

- [ ] Update color variables
- [ ] Remove gradient backgrounds
- [ ] Flatten card designs
- [ ] Add FAB for quick actions
- [ ] Redesign bottom navigation
- [ ] Update typography scale
- [ ] Add micro-interactions
- [ ] Implement loading skeletons
- [ ] Add empty states
- [ ] Update all components
- [ ] Test on real devices
- [ ] Ensure accessibility

---

*Modern. Minimal. Premium.*
