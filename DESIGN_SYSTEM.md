# BudgetBuddy Design System

## Overview
A modern, mobile-first design system focused on clarity, simplicity, and financial data visualization.

---

## Core Principles

### 1. Clarity First
- Financial data must be immediately understandable
- Clear visual hierarchy: Amount > Label > Context
- No ambiguity in transaction types or categories

### 2. Minimal & Focused
- Remove visual clutter
- One primary action per screen
- Progressive disclosure of complex features

### 3. Accessible & Inclusive
- WCAG 2.1 AA compliant
- Touch targets minimum 48x48px
- High contrast ratios (4.5:1 for text)
- Color is not the only indicator

---

## Layout System

### Grid System
- **Base unit:** 8px
- **Spacing scale:** 8, 16, 24, 32, 40, 48px
- **Container max-width:** 1200px (desktop)
- **Mobile padding:** 16px
- **Desktop padding:** 24-32px

### Breakpoints
```css
Mobile:  320px - 639px  (base styles)
Tablet:  640px - 767px
Desktop: 768px+
Large:   1024px+
```

---

## Color Palette

### Primary Colors
```
Brand Purple:     #667eea → #764ba2 (gradient)
Background:       #f8f9ff → #ffffff (gradient)
Surface:          #ffffff
```

### Semantic Colors
```
Success (Income):   #10b981 (green)
Danger (Expense):   #ef4444 (red)
Info (Transfer):    #6366f1 (indigo)
Warning:            #f59e0b (amber)
```

### Category Colors
```
Needs:    #10b981 (green)  - Essential expenses
Wants:    #f59e0b (amber)  - Discretionary spending
Savings:  #3b82f6 (blue)   - Future planning
```

### Neutral Scale
```
Gray 50:  #f9fafb
Gray 100: #f3f4f6
Gray 200: #e5e7eb
Gray 300: #d1d5db
Gray 400: #9ca3af
Gray 500: #6b7280
Gray 600: #4b5563
Gray 700: #374151
Gray 800: #1f2937
Gray 900: #111827
```

### Usage Guidelines
- **Positive values:** Green (#10b981)
- **Negative values:** Red (#ef4444)
- **Neutral values:** Gray (#6b7280)
- **Interactive elements:** Purple gradient
- **Backgrounds:** White with subtle gray tints

---

## Typography

### Font Family
```css
Primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
         'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 
         'Fira Sans', 'Droid Sans', 'Helvetica Neue', 
         sans-serif
```

### Type Scale

#### Mobile (Base)
```
Display:    24px / 800 / -0.5px  (Page titles)
Heading 1:  20px / 800 / -0.3px  (Section headers)
Heading 2:  16px / 800 / -0.2px  (Card titles)
Heading 3:  14px / 700 / 0px     (Subsections)

Body Large: 16px / 600 / 0px     (Primary content)
Body:       15px / 600 / 0px     (Default text)
Body Small: 14px / 600 / 0px     (Secondary text)

Label:      13px / 700 / 0.5px   (Input labels, uppercase)
Caption:    12px / 600 / 0px     (Helper text)
Tiny:       11px / 600 / 0.5px   (Metadata, uppercase)
```

#### Desktop (768px+)
```
Display:    32px / 800 / -0.5px
Heading 1:  24px / 800 / -0.3px
Heading 2:  20px / 800 / -0.3px
Body Large: 18px / 600 / 0px
Body:       16px / 600 / 0px
```

### Font Weights
- **Regular:** 400 (not used, prefer 600)
- **Semibold:** 600 (body text)
- **Bold:** 700 (emphasis)
- **Extrabold:** 800 (headings)

### Line Heights
- **Tight:** 1.2 (headings, numbers)
- **Normal:** 1.5 (body text)
- **Relaxed:** 1.75 (long-form content)

---

## Component Library

### 1. Cards

#### Summary Card (Income/Expense/Balance)
```
Structure:
┌─────────────────────────────────┐
│ [Icon]  Label                   │
│         ₹Amount                 │
└─────────────────────────────────┘

Specs:
- Height: 80px (mobile) → 100px (desktop)
- Padding: 16px 14px → 24px 20px
- Border-radius: 16px → 24px
- Icon size: 48px → 64px
- Gradient background with 2px white border
- Shadow: 0 4px 12px rgba(0,0,0,0.12)
```

#### Content Card (Accounts, Envelopes)
```
Structure:
┌─────────────────────────────────┐
│ [Accent Bar]                    │
│ 📊 Section Title                │
│                                 │
│ Item Name          ₹1,234       │
│ Item Name          ₹5,678       │
│ ─────────────────────────       │
│ Total              ₹6,912       │
└─────────────────────────────────┘

Specs:
- Padding: 16px → 24px
- Border-radius: 16px → 24px
- Top accent: 4px gradient bar
- Shadow: 0 2px 8px rgba(0,0,0,0.06)
- Background: white
```

#### Category Card (Need/Want/Saving)
```
Structure:
┌─────────────────────────────────┐
│ [Icon] CATEGORY NAME            │
├─────────────────────────────────┤
│ Envelope Name    ₹500/₹1,000    │
│ [Progress Bar ████░░░░░] 50%    │
│                                 │
│ Envelope Name    ₹800/₹1,000    │
│ [Progress Bar ████████░] 80%    │
└─────────────────────────────────┘

Specs:
- Header padding: 12px 16px → 16px 20px
- Header height: 48px → 56px
- Item padding: 12px → 16px
- Progress bar height: 12px → 16px
- Border-radius: 12px → 16px
```

### 2. Buttons

#### Primary Action Button
```
Specs:
- Height: 72px (mobile) → 90px (desktop)
- Padding: 14px 10px → 20px 12px
- Border-radius: 16px → 20px
- Font: 12px/700 → 14px/700
- Icon size: 22px → 28px
- Gradient background
- 2px white border (rgba)
- Shadow: 0 4px 12px rgba(0,0,0,0.12)

States:
- Default: Full opacity
- Active: scale(0.95) + inner glow
- Disabled: opacity 0.5
```

#### Types
```
Income:   Green gradient (#34d399 → #059669)
Expense:  Red gradient (#f87171 → #dc2626)
Transfer: Indigo gradient (#818cf8 → #4f46e5)
```

### 3. Form Controls

#### Select Dropdown
```
Specs:
- Height: 48px (mobile) → 52px (desktop)
- Padding: 12px 10px → 16px 14px
- Border: 2px solid #e5e7eb
- Border-radius: 12px → 16px
- Background: #f9fafb
- Font: 15px/600 → 16px/600
- Custom arrow icon (right aligned)

States:
- Default: Gray border
- Focus: Purple border + 4px shadow
- Disabled: Opacity 0.5
```

#### Date Navigation
```
Structure:
┌─────────────────────────────────┐
│ YEAR:          MONTH:            │
│ [2026 ▼]      [January ▼]       │
└─────────────────────────────────┘

Specs:
- Container padding: 12px → 20px
- Gap between selects: 10px → 16px
- Label: 11px/600 uppercase
- Background: white card
```

### 4. Lists & Rows

#### Balance Row (Clickable)
```
Structure:
┌─────────────────────────────────┐
│ Account Name          ₹12,345 › │
└─────────────────────────────────┘

Specs:
- Height: 52px (mobile) → 60px (desktop)
- Padding: 12px 10px → 16px 14px
- Border-bottom: 1px solid #f3f4f6
- Font: 14px/600 → 15px/600
- Amount: 15px/700 → 16px/700
- Chevron: 20px → 22px (hidden by default)

States:
- Default: Transparent
- Active: Gray background + visible chevron
```

#### Envelope Item (Clickable)
```
Structure:
┌─────────────────────────────────┐
│ Envelope Name    ₹500/₹1,000  › │
│ [Progress ████████░░] 50%       │
└─────────────────────────────────┘

Specs:
- Padding: 12px → 16px
- Border-radius: 12px → 16px
- Background: gradient (#f9fafb → #fff)
- Border: 2px solid #e5e7eb
- Gap: 8px between text and bar
```

### 5. Progress Indicators

#### Progress Bar
```
Specs:
- Height: 12px (mobile) → 16px (desktop)
- Border-radius: 6px → 8px
- Background: #e5e7eb
- Fill: Category color or red (>100%)
- Inner shadow: inset 0 1px 2px rgba(0,0,0,0.08)
- Highlight: Top gradient overlay
- Animation: 0.6s cubic-bezier ease
```

### 6. Icons & Emojis

#### Usage
```
Summary Cards:  💰 💸 💳 (42px → 64px)
Categories:     🛒 🎉 💰 (18px → 20px)
Sections:       💳 📊 📅 (in titles)
Envelopes:      Based on category (22px → 28px)
```

#### Icon Container
```
- Background: rgba(255,255,255,0.2)
- Border-radius: 12px → 16px
- Padding: Creates square aspect
- Backdrop-filter: blur(10px)
- Drop-shadow for depth
```

---

## Screen Layouts

### Dashboard Screen

```
┌─────────────────────────────────┐
│         BudgetBuddy             │ ← Display title
│                                 │
│ ┌─────────────────────────────┐ │
│ │ YEAR: [2026▼] MONTH: [Jan▼]│ │ ← Date filters
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 💰 Income    ₹50,000        │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │ ← Summary cards
│ │ 💸 Expense   ₹35,000        │ │   (stacked mobile,
│ └─────────────────────────────┘ │    grid desktop)
│ ┌─────────────────────────────┐ │
│ │ 💳 Balance   ₹15,000        │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │  [+Income] [-Expense] [⇄]  │ │ ← Action buttons
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📅 Today's Expenses          │ │
│ │ 🛒 Groceries      ₹500      │ │ ← Today section
│ │ 🎉 Entertainment  ₹300      │ │   (conditional)
│ │ ─────────────────────────   │ │
│ │ Total Today       ₹800      │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 💳 Payment Methods           │ │
│ │ Cash              ₹5,000 ›  │ │ ← Accounts list
│ │ Bank Account      ₹10,000 › │ │   (clickable)
│ │ ─────────────────────────   │ │
│ │ Total Balance     ₹15,000   │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Budget Envelopes             │ │
│ │                              │ │
│ │ 🛒 NEEDS                     │ │
│ │ Groceries    ₹500/₹1,000 ›  │ │
│ │ [████████░░░░░░] 50%        │ │ ← Envelope groups
│ │                              │ │   by category
│ │ 🎉 WANTS                     │ │
│ │ Entertainment ₹300/₹500 ›   │ │
│ │ [████████████░░] 60%        │ │
│ │                              │ │
│ │ 💰 SAVINGS                   │ │
│ │ Emergency    ₹2,000/₹5,000 ›│ │
│ │ [████████░░░░░░] 40%        │ │
│ └─────────────────────────────┘ │
│                                 │
│         [96px bottom space]     │ ← Nav clearance
└─────────────────────────────────┘
```

### Visual Hierarchy
1. **Title** - Largest, gradient, centered
2. **Date Controls** - Prominent, top of content
3. **Summary Cards** - Bold colors, large numbers
4. **Action Buttons** - Bright, equal prominence
5. **Today's Expenses** - Conditional highlight
6. **Accounts** - Clean list, clear totals
7. **Envelopes** - Grouped, visual progress

---

## Spacing System

### Component Spacing (Mobile → Desktop)
```
Container padding:     16px → 24px → 32px
Card margin-bottom:    16px → 24px
Card padding:          16px → 24px
Section gap:           16px → 24px
Button gap:            8px → 12px → 16px
List item padding:     12px → 16px
Form control gap:      10px → 16px
```

### Internal Spacing
```
Card header margin:    16px → 20px
Icon-text gap:         8px → 12px
Label-input gap:       6px
Progress bar margin:   8px → 10px
```

---

## Elevation & Shadows

### Shadow Scale
```
Level 1 (Subtle):     0 1px 4px rgba(0,0,0,0.04)
Level 2 (Card):       0 2px 8px rgba(0,0,0,0.06)
Level 3 (Elevated):   0 4px 12px rgba(0,0,0,0.12)
Level 4 (Prominent):  0 6px 20px rgba(0,0,0,0.15)
Level 5 (Modal):      0 8px 24px rgba(0,0,0,0.15)

Colored shadows:
- Green:  0 4px 12px rgba(16,185,129,0.3)
- Red:    0 4px 12px rgba(239,68,68,0.3)
- Purple: 0 6px 20px rgba(99,102,241,0.35)
```

### Usage
- **Summary cards:** Level 3 + colored shadow
- **Action buttons:** Level 3 + colored shadow
- **Content cards:** Level 2
- **Clickable items:** Level 1 → Level 2 on hover
- **Category headers:** Level 3 + colored shadow

---

## Animation & Transitions

### Timing Functions
```css
Standard:  cubic-bezier(0.4, 0, 0.2, 1)  /* 300ms */
Entrance:  ease-out                       /* 400ms */
Exit:      ease-in                        /* 200ms */
```

### Animations

#### Fade In Down (Title)
```css
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Duration: 400ms, ease-out */
```

#### Fade In Up (Cards)
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Duration: 400ms, ease-out, staggered delays */
```

#### Button Press
```css
Active state: scale(0.95) + inner radial glow
Duration: 300ms cubic-bezier
```

#### Progress Bar Fill
```css
Width transition: 600ms cubic-bezier(0.4, 0, 0.2, 1)
```

### Stagger Delays
```
Date navigation:  0ms
Summary cards:    50ms
Action buttons:   200ms
Today section:    150ms
Accounts:         0ms
Envelopes:        100ms
```

---

## Interaction States

### Clickable Elements

#### Default
- Cursor: pointer
- No visual change

#### Hover (Desktop only)
- Subtle background change
- Border color shift
- Shadow increase

#### Active/Pressed
- Scale: 0.95-0.98
- Background darken
- Shadow decrease
- Chevron appears (lists)

#### Focus
- Purple border (2px)
- 4px shadow ring
- No outline

#### Disabled
- Opacity: 0.5
- Cursor: not-allowed
- No interactions

### Touch Feedback
- Minimum target: 48x48px
- Active state on touchstart
- Ripple effect (optional)
- Haptic feedback (native)

---

## Accessibility Guidelines

### Color Contrast
```
Text on white:     #1f2937 (16.1:1) ✓
Text on cards:     #374151 (11.8:1) ✓
Labels:            #6b7280 (4.6:1) ✓
Amounts:           #1f2937 (16.1:1) ✓
```

### Touch Targets
- Minimum: 48x48px
- Recommended: 52-60px
- Spacing: 8px minimum between

### Screen Reader Support
- Semantic HTML
- ARIA labels for icons
- Role attributes
- Focus management
- Announce dynamic changes

### Keyboard Navigation
- Tab order logical
- Focus visible
- Enter/Space activate
- Escape closes modals
- Arrow keys for lists

---

## Responsive Behavior

### Mobile (320-639px)
- Single column layout
- Stacked summary cards
- Full-width buttons
- Compact spacing (16px)
- Smaller typography
- Touch-optimized (48px+)

### Tablet (640-767px)
- 3-column summary cards
- Increased spacing (20px)
- Larger touch targets (52px)
- Medium typography

### Desktop (768px+)
- Max-width container (1200px)
- 3-column summary cards
- Generous spacing (24-32px)
- Hover states enabled
- Larger typography
- Mouse-optimized interactions

### Scaling Strategy
```
Mobile:  Base styles (mobile-first)
Tablet:  @media (min-width: 640px)
Desktop: @media (min-width: 768px)
Large:   @media (min-width: 1024px)
```

---

## Data Visualization

### Number Formatting
```
Currency: ₹12,345 (Indian locale)
Decimals: Avoid unless necessary
Large numbers: ₹1,23,456 (lakh system)
Negative: Red color + minus sign
Positive: Green color (no plus sign)
```

### Progress Indicators
- 0-100%: Category color
- >100%: Red (#ef4444)
- Smooth animation
- Visual feedback
- Percentage optional

### Empty States
```
No transactions: Friendly illustration + CTA
No budgets: Setup guide
No data: Clear message + action
```

---

## Best Practices

### Do's ✓
- Use consistent spacing (8px grid)
- Maintain visual hierarchy
- Provide clear feedback
- Use semantic colors
- Keep touch targets large
- Animate intentionally
- Test on real devices
- Support dark mode (future)

### Don'ts ✗
- Don't use color alone for meaning
- Don't make touch targets <48px
- Don't use too many colors
- Don't animate everything
- Don't hide important actions
- Don't use tiny fonts (<12px)
- Don't ignore accessibility
- Don't break the grid

---

## Implementation Notes

### CSS Architecture
```
1. Reset/Base styles
2. Typography system
3. Color variables
4. Spacing utilities
5. Component styles
6. Layout styles
7. Responsive overrides
8. Animations
```

### Component Reusability
- Build atomic components
- Use composition
- Maintain consistency
- Document variations
- Test edge cases

### Performance
- Optimize animations (transform/opacity)
- Use CSS containment
- Lazy load images
- Minimize repaints
- Hardware acceleration

---

## Future Enhancements

### Phase 2
- Dark mode support
- Custom themes
- Advanced charts
- Gesture controls
- Offline indicators

### Phase 3
- Micro-interactions
- Skeleton loaders
- Pull-to-refresh
- Swipe actions
- Haptic feedback

---

## Design Tokens (CSS Variables)

```css
:root {
  /* Colors */
  --color-brand-start: #667eea;
  --color-brand-end: #764ba2;
  --color-success: #10b981;
  --color-danger: #ef4444;
  --color-info: #6366f1;
  --color-warning: #f59e0b;
  
  /* Spacing */
  --space-xs: 8px;
  --space-sm: 16px;
  --space-md: 24px;
  --space-lg: 32px;
  --space-xl: 40px;
  
  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
  
  /* Shadows */
  --shadow-sm: 0 1px 4px rgba(0,0,0,0.04);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.06);
  --shadow-lg: 0 4px 12px rgba(0,0,0,0.12);
  --shadow-xl: 0 6px 20px rgba(0,0,0,0.15);
  
  /* Typography */
  --font-size-xs: 11px;
  --font-size-sm: 12px;
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  
  /* Transitions */
  --transition-fast: 150ms;
  --transition-base: 300ms;
  --transition-slow: 400ms;
}
```

---

## Conclusion

This design system provides a solid foundation for building a consistent, accessible, and delightful financial management app. Focus on clarity, simplicity, and user needs. Iterate based on user feedback and usage patterns.

**Key Takeaways:**
1. Mobile-first, progressively enhanced
2. Clear visual hierarchy
3. Consistent spacing and typography
4. Accessible by default
5. Purposeful animations
6. Semantic color usage
7. Touch-friendly interactions
8. Scalable and maintainable
