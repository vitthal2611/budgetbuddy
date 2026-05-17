# Implementation Plan

- [ ] 1. Fix for missing trigger display in Today view cards

  - [x] 1.1 Restructure Today view card layout in HabitTracker.js
    - Open `src/components/HabitTracker.js` and locate Today view card rendering (lines ~2952-3060)
    - Create header row structure with identity (left) and streak (right)
    - Move identity field to top of card (before time/trigger/action)
    - Move streak display to top-right corner (aligned with identity)
    - Keep checkbox on left side of card
    - Keep miss/undo button on right side below streak
    - Apply same restructuring to incomplete, completed, and missed habit cards
    - _Bug_Condition: isBugCondition(habit) where habit.trigger IS NOT NULL AND habit.trigger IS NOT EMPTY_STRING AND todayViewCardRendering(habit) DOES NOT include trigger field_
    - _Expected_Behavior: Today view cards SHALL display trigger field inline with time field when habit.trigger exists_
    - _Preservation: Time, action, identity, streak, checkbox, miss/undo buttons, completed/missed styling must remain unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 1.2 Add trigger field inline with time in HabitTracker.js
    - In `src/components/HabitTracker.js`, locate time field rendering (line ~2964)
    - Add JSX element after `habit-today-time` span, inline on same row
    - Use separator (bullet point "•") between time and trigger
    - Conditionally render trigger only if `habit.trigger` exists and is not empty
    - Use CSS class `habit-today-trigger` for styling
    - Structure: `{habit.trigger && <><span className="habit-today-separator"> • </span><span className="habit-today-trigger">{habit.trigger}</span></>`}
    - Apply to incomplete habits cards (line ~2952-3005)
    - Apply to completed habits cards (line ~3006-3038)
    - Apply to missed habits cards (line ~3039-3060)
    - _Bug_Condition: isBugCondition(habit) where habit.trigger IS NOT NULL AND habit.trigger IS NOT EMPTY_STRING_
    - _Expected_Behavior: Trigger field SHALL be rendered inline with time field, separated by bullet separator_
    - _Preservation: Existing time field display and styling must remain unchanged_
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 1.3 Add CSS styling for trigger field in HabitTracker.css
    - Open `src/components/HabitTracker.css`
    - Add `.habit-today-header` class for identity + streak row (display: flex, justify-content: space-between, align-items: center, margin-bottom: 8px)
    - Update `.habit-today-identity` to work in header position (flex: 1, text-overflow: ellipsis)
    - Add `.habit-today-time-row` class for time + trigger inline display (display: flex, align-items: center, flex-wrap: wrap)
    - Add `.habit-today-separator` class (font-size: 13px, color: #999, padding: 0 8px)
    - Add `.habit-today-trigger` class (font-size: 13px, font-weight: 600, color: #667eea, background: rgba(102, 126, 234, 0.1), padding: 6px 12px, border-radius: 8px, display: inline-block)
    - Add `.habit-today-card-completed .habit-today-trigger` selector (color: #666, background: rgba(158, 158, 158, 0.1))
    - Add `.habit-today-card-missed .habit-today-trigger` selector (color: #C62828, background: rgba(244, 67, 54, 0.2))
    - Add responsive adjustments for screens < 360px if needed (reduce font-size to 12px, padding to 5px 10px)
    - _Bug_Condition: Missing CSS class definition for trigger field styling_
    - _Expected_Behavior: Trigger field SHALL have purple-tinted background, semi-bold text, and appropriate spacing_
    - _Preservation: Existing card styling, spacing, and layout must remain unchanged_
    - _Requirements: 2.2, 2.3_

- [ ] 2. Manual verification
  - Verify trigger field displays correctly in Today view for incomplete, completed, and missed habits
  - Verify all existing functionality works identically (checkbox, miss/undo buttons, styling)
  - Verify responsive behavior on mobile viewports (375px, 414px, 360px)
  - Verify Week view and All Habits view remain unchanged
  - Test with habits that have empty/null trigger (should not display trigger field)
  - Test with habits that have long trigger text (should handle gracefully)
  - If any issues arise, ask the user for guidance
