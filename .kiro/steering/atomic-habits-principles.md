---
inclusion: auto
---

# Atomic Habits Principles - Steering Rules

This steering file ensures all development on the Atomic Streaks habit tracker follows James Clear's Atomic Habits principles and methodology.

## Core Philosophy

**"You do not rise to the level of your goals. You fall to the level of your systems."**

Every feature, UI element, and interaction must reinforce the core principles of Atomic Habits:
1. Make it Obvious (Cue)
2. Make it Attractive (Craving)
3. Make it Easy (Response)
4. Make it Satisfying (Reward)

---

## The Four Laws of Behavior Change

### Law 1: Make it Obvious (Cue)

**Implementation Requirements:**
- **Identity-First Design**: Always show the identity statement prominently on habit cards
  - Format: "💭 I am a person who..." or the user's custom identity
  - Identity is MANDATORY when creating habits
  - Identity should be the most visible cue on the card

- **Implementation Intention**: Display time + location clearly
  - Format: "📍 [TIME] · [LOCATION]"
  - Example: "📍 07:00 · Bedroom"

- **Habit Stacking**: Show stack relationships prominently
  - Format: "🔗 After: [PARENT HABIT]"
  - OR custom trigger: "⚡ [CUSTOM TRIGGER]"
  - Stack cue should use purple/violet styling to differentiate

- **Visual Hierarchy on Habit Cards**:
  ```
  Priority Order (top to bottom):
  1. Habit name + streak badge + time
  2. Stack relationship OR custom trigger (if exists)
  3. Identity statement (ALWAYS show if exists)
  4. Time + location (if not stacked)
  5. Alerts (missed yesterday, reward)
  6. Badges (frequency, difficulty)
  ```

### Law 2: Make it Attractive (Craving)

**Implementation Requirements:**
- **Temptation Bundling**: Support reward field
  - Show rewards prominently when habit is completed
  - Format: "🎉 [REWARD]"
  - Example: "🎉 Enjoy coffee" or "🎉 10 min social media"

- **Streak Visualization**: Make streaks visually exciting
  - 1-6 days: 🔥 (orange/red gradient)
  - 7-29 days: 🔥 (stronger glow, "streak-good" class)
  - 30-49 days: ⭐ (yellow gradient, pulse animation, "streak-great" class)
  - 50-99 days: 💎 (blue gradient, pulse animation, "streak-epic" class)
  - 100+ days: 👑 (purple gradient, pulse + glow animation, "streak-legendary" class)

- **Milestone Celebrations**: Auto-trigger at key milestones
  - 7 days: 🎯 "One week strong! You're building momentum."
  - 30 days: 🔥 "30 days! This is becoming part of who you are."
  - 50 days: ⭐ "50 days! You're in the top 1% of habit builders."
  - 100 days: 💎 "100 days! You've mastered this habit."
  - 365 days: 👑 "ONE YEAR! You are legendary!"
  - Display as full-screen overlay with animations

- **Daily Quotes**: Rotate through Atomic Habits quotes
  - Show at top of Today tab
  - Include the law/principle reference
  - 14 quotes covering all core principles

### Law 3: Make it Easy (Response)

**Implementation Requirements:**
- **2-Minute Rule Enforcement**:
  - Default difficulty: "easy" (~2 minutes)
  - Show warning modal if user selects medium/hard
  - Provide scaling examples:
    - "Read 30 pages" → "Read 1 page"
    - "Run 5km" → "Put on running shoes"
    - "Meditate 20 min" → "Meditate 1 breath"
  - Allow override but educate first

- **Reduce Friction**:
  - One-tap habit completion (tap card to toggle)
  - Swipe gestures for quick completion (left/right swipe)
  - FAB button for quick habit addition
  - Template library for instant habit creation (16 pre-made habits)

- **Habit Stacking Support**:
  - Allow habits to be stacked after existing habits
  - Visual connector line between stacked habits
  - Automatic ordering: parent habit → stacked habit
  - Supports multi-level stacking (A → B → C)

- **Frequency Options**:
  - Daily: Most common, default
  - Weekly: For less frequent habits
  - Monthly: For periodic habits
  - Completion tracked appropriately for each frequency

### Law 4: Make it Satisfying (Reward)

**Implementation Requirements:**
- **Immediate Feedback**:
  - Checkmark animation on completion (scale + pop effect)
  - Green background on completed habits
  - Completion time badge showing when habit was done
  - Undo button appears immediately after completion (green banner)

- **Progress Tracking**:
  - Real-time progress bar showing daily completion rate
  - Metrics strip: Done (X/Y), Rate (%), Best Streak (🔥)
  - "Perfect day!" celebration when all habits completed

- **Never Miss Twice**:
  - Show warning if habit was missed yesterday: "⚠️ Don't miss twice!"
  - Visual alert on habit card
  - Reinforces the principle: missing once is accident, twice is new habit

- **Visual Progress**:
  - Monthly calendar with color-coded completion rates:
    - Perfect (100%): Green gradient with glow
    - Good (70%+): Light green gradient
    - Okay (40-69%): Yellow gradient
    - Low (1-39%): Light yellow
    - Missed (0%): Red background
  - Weekly comparison chart showing last 4 weeks
  - Plateau of Latent Potential visualization

---

## Identity-Based Habits

**Core Principle**: "Every action you take is a vote for the type of person you wish to become."

**Implementation Rules:**
1. Identity field is MANDATORY when creating habits
2. Identity should be phrased as: "I am a person who..." or "I am a [identity]"
3. Examples:
   - "I am a person who exercises daily"
   - "I am a reader"
   - "I am organized"
   - "I am someone who stays hydrated"

4. Identity should be the PRIMARY cue shown on habit cards
5. Identity takes precedence over time/location in visual hierarchy

---

## The Plateau of Latent Potential

**Concept**: Results compound slowly, then suddenly. Most people quit in the "Valley of Disappointment."

**Implementation Requirements:**
- Show visualization in Stats tab
- Graph showing:
  - Expected progress (linear, dashed line)
  - Actual progress (slow curve, then exponential)
  - Valley of Disappointment (plateau region)
  - Breakthrough point (vertical dashed line)
  - User's current position (based on longest streak)

- Explanation text:
  - "You're in the valley. Most habits feel useless at first."
  - "Results compound slowly, then suddenly. Keep going."
  - Quote: "Success is the product of daily habits—not once-in-a-lifetime transformations."

---

## Habit Scorecard

**Purpose**: Track positive, negative, and neutral habits to build awareness.

**Implementation Requirements:**
- Habit type field: positive, negative, neutral
- Visual indicator: colored dot on habit card
  - Positive: Green dot
  - Negative: Red dot
  - Neutral: Gray dot
- Stats summary showing count of each type

---

## Systems Over Goals

**Principle**: Focus on systems (daily habits) rather than goals (outcomes).

**Implementation Rules:**
1. No "goal" field - only habits (systems)
2. Emphasize daily actions over end results
3. Metrics focus on consistency (streaks, completion rate) not outcomes
4. Weekly review focuses on system adherence, not goal achievement

---

## Data Export & Reflection

**Requirements:**
- Export in 3 formats: JSON (backup), CSV (analysis), Text (readable)
- Weekly review modal (Sundays):
  - Show completion rate for the week
  - Per-habit breakdown
  - Insights based on performance
  - Motivational quote
- Achievement badges for milestones
- Completion time tracking for pattern analysis

---

## UI/UX Principles

### Visual Design
- Clean, minimal interface (max-width: 480px mobile-first)
- Card-based design for habits
- Smooth animations for feedback
- Color-coded visual cues
- Emoji for emotional connection

### Interaction Patterns
- Tap to complete/uncomplete
- Swipe for quick actions
- Long-press for edit (future)
- Pull to refresh (future)

### Completed Habits
- Move to bottom section with divider
- Show "Completed (X)" label
- Maintain visibility but separate from active habits
- Allow un-completion by tapping again

---

## Feature Development Guidelines

When adding new features to Atomic Streaks:

1. **Ask**: Does this make habits more obvious, attractive, easy, or satisfying?
2. **Verify**: Does this align with James Clear's principles?
3. **Check**: Does this reduce friction or add complexity?
4. **Ensure**: Identity-based habits remain central
5. **Maintain**: 2-Minute Rule as default guidance

### Feature Priority Framework
- **High Priority**: Features that directly implement the 4 Laws
- **Medium Priority**: Features that enhance tracking and reflection
- **Low Priority**: Features that add complexity without clear benefit

---

## Code Implementation Notes

### State Management
- Habits stored with all Atomic Habits fields (identity, time, location, reward, stackAfter, customTrigger)
- Completions tracked by date string (YYYY-MM-DD)
- Streaks calculated dynamically based on completion history

### Habit Card Structure
```javascript
{
  id: string,
  name: string,
  identity: string,        // MANDATORY
  time: string,            // HH:MM format
  location: string,        // Predefined or custom
  reward: string,          // Optional
  stackAfter: string,      // Parent habit ID
  customTrigger: string,   // Alternative to stacking
  frequency: 'daily' | 'weekly' | 'monthly',
  habitType: 'positive' | 'negative' | 'neutral',
  difficulty: 'easy' | 'medium' | 'hard',
  createdAt: string        // YYYY-MM-DD
}
```

### Completion Tracking
```javascript
completions: {
  'YYYY-MM-DD': [habitId1, habitId2, ...],
  ...
}
```

---

## Testing Checklist

When testing Atomic Streaks features:

- [ ] Identity is always visible on habit cards
- [ ] Stack relationships display correctly
- [ ] Streak badges show appropriate emoji and styling
- [ ] Milestone celebrations trigger at correct streaks
- [ ] 2-Minute Rule warning appears for medium/hard habits
- [ ] Completed habits move to bottom section
- [ ] "Never miss twice" warning shows correctly
- [ ] Undo button appears after completion
- [ ] Daily quote rotates properly
- [ ] Week view shows 7-day overview correctly
- [ ] Achievement badges unlock at correct thresholds
- [ ] Export includes all necessary data
- [ ] Template library creates habits correctly

---

## References

- Book: "Atomic Habits" by James Clear
- Website: jamesclear.com
- Core Concepts: Identity-based habits, 4 Laws, 2-Minute Rule, Habit Stacking, Never Miss Twice

---

## Version History

- v1.0 (2024): Initial steering rules based on Atomic Habits principles
- Includes: High-priority features (quotes, swipes, milestones, undo, streaks)
- Includes: Medium-priority features (week view, achievements, time tracking, export, templates)
