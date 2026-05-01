# Atomic Streaks - Habit Card Complete Redesign

## New Card Structure

### Visual Layout
```
┌─────────────────────────────────────────────┐
│  ○  [🔗 After Dinner]                    │  ← Top Section
│     Put the plate in dishwasher         🔥7d│
│                                              │
│     💭 I am organized and clean              │  ← Identity (Most Prominent)
│     📍 20:00 · Kitchen                       │  ← Implementation Intention
│                                              │
├─────────────────────────────────────────────┤
│  DAILY  ~2M                            ✓ 20:15│  ← Bottom Badge Bar
└─────────────────────────────────────────────┘
```

## Key Design Changes

### 1. **Two-Section Layout**
- **Top Section**: Check circle + Trigger badge + Habit name + Streak
- **Middle Section**: Identity cue + Implementation intention + Alerts
- **Bottom Section**: Frequency + Difficulty + Completion time

### 2. **Trigger Badge** (New!)
- Compact pill at the top showing the trigger
- Icons: 🔗 (stack), ⚡ (custom), ⏰ (time), 📍 (location)
- Purple gradient background
- Examples:
  - "🔗 After Dinner"
  - "⚡ When I feel stressed"
  - "⏰ 07:00"
  - "📍 Kitchen"

### 3. **Larger Check Circle**
- 32px instead of 28px
- Better shadow and gradient when checked
- More satisfying to tap

### 4. **Prominent Identity**
- Larger font (13px → 14px)
- Blue gradient background
- Border and shadow
- Always visible when set

### 5. **Bottom Badge Bar**
- Separated section with light background
- All metadata badges in one row
- Completion time badge on the right

### 6. **Completed State**
- Green gradient background
- No strikethrough on name
- Green tint on bottom bar

## Color Scheme

### Trigger Badge
- Background: `linear-gradient(135deg, #ede9fe, #ddd6fe)`
- Border: `#c4b5fd`
- Text: `#6d28d9` (purple)

### Identity Cue
- Background: `var(--primary-bg)` with gradient
- Border: `var(--primary-light)`
- Text: `var(--primary)`
- Shadow: `0 1px 3px rgba(99, 102, 241, 0.1)`

### Implementation Intention
- Background: `var(--bg-tertiary)`
- Border: `var(--border-light)`
- Text: `var(--text-secondary)`

### Completed Card
- Background: `linear-gradient(135deg, #f0fdf4, #dcfce7)`
- Border: `#86efac`
- Bottom bar: `rgba(34, 197, 94, 0.05)`

## Typography

### Habit Name
- Font size: 16px (increased from 15px)
- Font weight: 700 (bolder)
- Letter spacing: -0.3px (tighter)

### Trigger Badge
- Font size: 11px
- Font weight: 700
- All caps for emphasis

### Identity
- Font size: 13px
- Font weight: 600

### Badges
- Font size: 10px
- Font weight: 700
- All caps

## Spacing & Layout

### Card Padding
- Top section: 14px all around
- Bottom section: 10px horizontal, 10px vertical
- Gap between sections: 8px

### Internal Gaps
- Between trigger and name: 8px
- Between cues: 6px
- Between badges: 6px

## Animations

### Check Animation
- Scale from 0 to 1.3 to 1
- Duration: 0.3s
- Easing: ease-out

### Card Tap
- Scale to 0.98
- Duration: 0.15s
- Shadow reduces

### Streak Badges
- Pulse animation for 30+ day streaks
- Glow animation for 100+ day streaks

## Examples

### Example 1: Stacked Habit
```
┌─────────────────────────────────────────────┐
│  ✓  [🔗 After I brush my teeth]         🔥15d│
│     Floss one tooth                          │
│                                              │
│     💭 I am someone who takes care of my teeth│
│                                              │
├─────────────────────────────────────────────┤
│  DAILY  ~2M                            ✓ 07:05│
└─────────────────────────────────────────────┘
```

### Example 2: Time-Based Habit
```
┌─────────────────────────────────────────────┐
│  ○  [⏰ 06:30]                           🔥42d│
│     Put on running shoes                     │
│                                              │
│     💭 I am a runner                         │
│     📍 06:30 · Bedroom                       │
│                                              │
├─────────────────────────────────────────────┤
│  DAILY  ~2M                                  │
└─────────────────────────────────────────────┘
```

### Example 3: Custom Trigger
```
┌─────────────────────────────────────────────┐
│  ○  [⚡ When I feel stressed]            🔥7d│
│     Take one deep breath                     │
│                                              │
│     💭 I am calm and centered                │
│                                              │
│     ⚠️ Don't miss twice!                     │
│                                              │
├─────────────────────────────────────────────┤
│  DAILY  ~2M                                  │
└─────────────────────────────────────────────┘
```

### Example 4: Completed with Reward
```
┌─────────────────────────────────────────────┐
│  ✓  [📍 Kitchen]                         💎52d│
│     Drink one glass of water                 │
│                                              │
│     💭 I am someone who stays hydrated       │
│     📍 08:00 · Kitchen                       │
│                                              │
│     🎉 Enjoy coffee                          │
│                                              │
├─────────────────────────────────────────────┤
│  DAILY  ~2M                            ✓ 08:15│
└─────────────────────────────────────────────┘
```

## Benefits of New Design

1. **Clearer Hierarchy** - Trigger → Action → Identity → Details
2. **More Scannable** - Important info at top, details at bottom
3. **Better Atomic Habits Alignment** - Trigger is prominent
4. **More Attractive** - Gradients, shadows, better spacing
5. **Stays Within Card** - No overflow, everything contained
6. **More Satisfying** - Larger tap targets, better animations

## Implementation Status

- [ ] Update HTML structure in HabitTracker.js
- [ ] Update CSS in HabitTracker.css
- [ ] Test on mobile devices
- [ ] Test with long habit names
- [ ] Test with all trigger types
- [ ] Deploy to Firebase

