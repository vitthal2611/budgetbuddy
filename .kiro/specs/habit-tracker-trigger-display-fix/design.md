# Habit Tracker Trigger Display Fix - Design Document

## Overview

This design addresses a missing UI element in the habit tracker's Today view. The trigger field (e.g., "After Wakeup", "After Breakfast", "Before Sleep") exists in the data model but is not rendered in the Today view habit cards. This omission reduces usability by hiding the contextual cue that tells users when to perform their habits.

The fix will add the trigger field to the Today view cards in a visually distinct format that maintains the mobile-first design principles and existing card layout. The trigger will be displayed prominently near the time field, as both represent temporal/contextual information about when the habit should be performed.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when a habit has trigger data but the Today view card does not display it
- **Property (P)**: The desired behavior - Today view cards should display the trigger field when it exists
- **Preservation**: Existing card layout, styling, interactions, and functionality that must remain unchanged
- **Trigger**: The contextual cue field (e.g., "After Wakeup") stored in `habit.trigger` that indicates when or what prompts a habit
- **Today View Card**: The habit card component rendered in the Today tab, showing time, action, identity, streak, and completion controls
- **habit-today-card**: The CSS class for Today view habit cards in `src/components/HabitTracker.css`
- **habit-today-content**: The CSS class for the content area within Today view cards containing time, action, and identity

## Bug Details

### Bug Condition

The bug manifests when a habit has trigger data in the data model but the Today view card rendering logic does not include this field in the JSX output. The `HabitTracker.js` component renders time, action, and identity fields but omits the trigger field despite it being available in the habit object.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type Habit (object with id, trigger, action, identity, time, etc.)
  OUTPUT: boolean
  
  RETURN input.trigger IS NOT NULL
         AND input.trigger IS NOT EMPTY_STRING
         AND todayViewCardRendering(input) DOES NOT include trigger field
END FUNCTION
```

### Examples

- **Example 1**: Habit with trigger "After Wakeup" displays only time "06:00", action "I will drink half glass of water", and identity "I am a person who starts the day hydrated" - trigger is missing
- **Example 2**: Habit with trigger "After Breakfast" displays only time "08:00", action "I will do 10 pushups", and identity "I am a person who exercises daily" - trigger is missing
- **Example 3**: Habit with trigger "Before Sleep" displays only time "22:00", action "I will read one page", and identity "I am a person who reads every day" - trigger is missing
- **Edge Case**: Habit with empty or null trigger should not display trigger field (expected behavior - no change needed)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Time field display and styling must remain unchanged
- Action field display and styling must remain unchanged
- Identity field display and styling must remain unchanged
- Streak display and functionality must remain unchanged
- Checkbox interaction and styling must remain unchanged
- Miss/Undo button functionality and styling must remain unchanged
- Completed habit card styling (strikethrough, opacity) must remain unchanged
- Missed habit card styling (red background, strikethrough) must remain unchanged
- Card layout responsiveness across screen sizes must remain unchanged
- Card spacing, padding, and overall dimensions must remain unchanged

**Scope:**
All inputs that do NOT involve displaying the trigger field should be completely unaffected by this fix. This includes:
- Mouse/touch interactions with checkboxes, miss buttons, and undo buttons
- Keyboard interactions with habit cards
- Week view rendering (should remain unchanged)
- All Habits view rendering (should remain unchanged)
- Habit creation and editing flows (already include trigger field)
- Data model and service layer (already correct)

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **Incomplete JSX Rendering**: The Today view card rendering logic in `HabitTracker.js` (lines ~2952-3060) includes JSX for time, action, and identity fields but does not include a JSX element for the trigger field, despite the trigger data being available in the `habit` object.

2. **Missing CSS Styling**: There is no CSS class defined for styling the trigger field within Today view cards (e.g., `.habit-today-trigger`), which would be needed to style the trigger field consistently with the mobile-first design.

3. **Oversight in Initial Implementation**: The trigger field was included in the data model, habit creation form, and Week/All Habits views, but was inadvertently omitted from the Today view card rendering logic.

## Correctness Properties

Property 1: Bug Condition - Trigger Field Display

_For any_ habit object where the trigger field is not null or empty, the Today view card SHALL display the trigger field in a visually distinct format between the time field and the action field, using appropriate styling that maintains the mobile-first design principles.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Existing Card Layout and Functionality

_For any_ interaction with Today view cards that does NOT involve reading the trigger field (checkbox clicks, miss button clicks, undo button clicks, card scrolling), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality, styling, and interactions.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/components/HabitTracker.js`

**Function**: Today view card rendering (lines ~2952-3060)

**Specific Changes**:

1. **Restructure Card Layout** (line ~2952-3060):
   - Move identity field to the top of the card (before time/trigger/action)
   - Move streak display to the top-right corner (aligned with identity)
   - Create a header row with identity (left) and streak (right)
   - Keep checkbox on the left side of the card
   - Keep miss/undo button on the right side below streak

2. **Add Trigger Field Inline with Time** (line ~2964):
   - Add JSX element after `habit-today-time` span, inline on same row
   - Use separator (bullet point "•") between time and trigger
   - Conditionally render trigger only if `habit.trigger` exists and is not empty
   - Use CSS class `habit-today-trigger` for styling
   - Structure: `{habit.trigger && <><span className="habit-today-separator"> • </span><span className="habit-today-trigger">{habit.trigger}</span></>`}

3. **Update Completed Habits Cards Layout** (line ~3006):
   - Apply same layout restructuring as incomplete cards
   - Ensure identity and streak are at top
   - Ensure time and trigger are inline with separator
   - Ensure trigger inherits completed card styling (opacity, color adjustments)

4. **Update Missed Habits Cards Layout** (line ~3039):
   - Apply same layout restructuring as incomplete cards
   - Ensure identity and streak are at top
   - Ensure time and trigger are inline with separator
   - Ensure trigger inherits missed card styling (red tones, strikethrough if appropriate)

**File**: `src/components/HabitTracker.css`

**Section**: Today View Card Styles (after line ~530)

**Specific Changes**:

4. **Define Base Trigger Field Styling**:
   - Create `.habit-today-trigger` class
   - Font size: 13px (same as time field for consistency)
   - Font weight: 600 (medium weight for readability)
   - Color: `#667eea` (purple to differentiate from time)
   - Background: `rgba(102, 126, 234, 0.1)` (subtle purple tint)
   - Padding: 6px 12px
   - Border radius: 8px
   - Display: inline-block
   - Width: fit-content

5. **Define Separator Styling**:
   - Create `.habit-today-separator` class
   - Font size: 13px
   - Color: `var(--text-secondary, #999)`
   - Padding: 0 8px (spacing around bullet)
   - Display: inline

6. **Define Header Row Layout**:
   - Create `.habit-today-header` class for identity + streak row
   - Display: flex
   - Justify-content: space-between
   - Align-items: center
   - Margin-bottom: 8px
   - Width: 100%

7. **Update Identity Field Styling**:
   - Modify `.habit-today-identity` to work in header position
   - Remove margin/padding that was for bottom placement
   - Flex: 1 (to take available space)
   - Text-overflow: ellipsis (for long identity text)

8. **Update Time and Trigger Row Layout**:
   - Create `.habit-today-time-row` class for time + trigger inline display
   - Display: flex
   - Align-items: center
   - Flex-wrap: wrap (for responsive behavior)
   - Gap: 0 (separator handles spacing)

9. **Define Completed Card Trigger Styling**:
   - Create `.habit-today-card-completed .habit-today-trigger` selector
   - Color: `var(--text-secondary, #666)` (muted for completed state)
   - Background: `rgba(158, 158, 158, 0.1)` (gray tint for completed state)
   - Optional: Add strikethrough if desired (text-decoration: line-through)

10. **Define Missed Card Trigger Styling**:
   - Create `.habit-today-card-missed .habit-today-trigger` selector
   - Color: `#C62828` (red tone matching missed card theme)
   - Background: `rgba(244, 67, 54, 0.2)` (red tint for missed state)
   - Optional: Add strikethrough if desired (text-decoration: line-through)

11. **Responsive Adjustments** (if needed):
   - Add media query adjustments for screens < 360px if trigger field causes layout issues
   - Reduce font size to 12px on very small screens if necessary
   - Adjust padding to 5px 10px on very small screens if necessary
   - Allow time + trigger to wrap to new line if needed on very small screens

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Manually inspect the Today view in the browser with the unfixed code. Verify that habits with trigger data do not display the trigger field. Use browser DevTools to inspect the DOM and confirm the trigger field JSX is not rendered.

**Test Cases**:
1. **Seed Data Habit 1 Test**: View habit "After Wakeup" in Today view (will show missing trigger on unfixed code)
2. **Seed Data Habit 2 Test**: View habit "After Breakfast" in Today view (will show missing trigger on unfixed code)
3. **Seed Data Habit 3 Test**: View habit "Before Sleep" in Today view (will show missing trigger on unfixed code)
4. **DOM Inspection Test**: Use DevTools to confirm no element with class `habit-today-trigger` exists (will confirm on unfixed code)

**Expected Counterexamples**:
- Today view cards display time, action, identity, but no trigger field
- Possible causes: Missing JSX rendering logic, missing CSS class definition

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL habit WHERE habit.trigger IS NOT NULL AND habit.trigger IS NOT EMPTY DO
  todayCard := renderTodayCard_fixed(habit)
  ASSERT todayCard contains trigger field element
  ASSERT trigger field displays habit.trigger value
  ASSERT trigger field has appropriate styling
END FOR
```

**Test Plan**: After implementing the fix, manually test the Today view with multiple habits that have trigger data. Verify the trigger field appears, displays correct text, and has appropriate styling.

**Test Cases**:
1. **Incomplete Habit Trigger Display**: Verify trigger appears for incomplete habits with correct styling
2. **Completed Habit Trigger Display**: Verify trigger appears for completed habits with muted styling
3. **Missed Habit Trigger Display**: Verify trigger appears for missed habits with red-toned styling
4. **Empty Trigger Handling**: Verify habits with empty/null trigger do not display trigger field
5. **Mobile Responsiveness**: Verify trigger field displays correctly on 375px, 414px, and 360px screen widths
6. **Text Overflow**: Verify long trigger text is handled gracefully (truncation or wrapping)

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL interaction WHERE interaction IS NOT reading_trigger_field DO
  ASSERT originalBehavior(interaction) = fixedBehavior(interaction)
END FOR
```

**Testing Approach**: Manual testing is recommended for preservation checking because:
- The changes are purely additive (adding a display field)
- Existing interactions (checkbox, buttons) should not be affected
- Visual regression testing can quickly confirm layout preservation
- The scope of changes is small and localized

**Test Plan**: After implementing the fix, test all existing interactions to ensure they work identically to the unfixed version.

**Test Cases**:
1. **Checkbox Interaction Preservation**: Click checkboxes on incomplete, completed, and missed habits - verify same behavior
2. **Miss Button Preservation**: Click "Miss" button on incomplete habits - verify same behavior
3. **Undo Button Preservation**: Click "Undo" button on missed habits - verify same behavior
4. **Card Layout Preservation**: Verify card dimensions, spacing, and alignment remain unchanged
5. **Completed Card Styling Preservation**: Verify strikethrough, opacity, and color changes work identically
6. **Missed Card Styling Preservation**: Verify red background, strikethrough, and color changes work identically
7. **Streak Display Preservation**: Verify streak counter displays and updates correctly
8. **Scrolling Preservation**: Verify card list scrolling works smoothly without layout shifts
9. **Week View Preservation**: Verify Week view rendering is completely unchanged
10. **All Habits View Preservation**: Verify All Habits view rendering is completely unchanged

### Unit Tests

- Test that trigger field renders when `habit.trigger` is not null/empty
- Test that trigger field does not render when `habit.trigger` is null/empty
- Test that trigger field displays correct text from `habit.trigger`
- Test that trigger field has correct CSS class applied

### Property-Based Tests

Not applicable for this bugfix. The changes are purely presentational (adding a display field) and do not involve complex logic or data transformations that would benefit from property-based testing.

### Integration Tests

- Test full Today view rendering with multiple habits (incomplete, completed, missed)
- Test that trigger field appears correctly in all three habit states
- Test that adding a new habit with trigger displays correctly in Today view
- Test that editing a habit's trigger updates the Today view display
- Test responsive behavior across different screen sizes (375px, 414px, 360px)

## Visual Design Specification

### Trigger Field Placement

The trigger field will be placed inline with the time field on the same row, separated by a bullet point separator ("•"). The identity field and streak will be moved to the top of the card as a header row. This creates a clear visual hierarchy:

1. **Header Row**: Identity (left) + Streak (right) - establishes "who you are"
2. **Context Row**: Time + Trigger (inline) - establishes "when to do it"
3. **Action Row**: The specific action to take - establishes "what to do"

This layout groups related information together and puts the identity-based motivation at the forefront.

### Visual Hierarchy

```
┌─────────────────────────────────────────┐
│ I am a person who starts...      🔥 5   │
│ ☐  06:00 • After Wakeup          Miss   │
│    I will drink half glass of water     │
└─────────────────────────────────────────┘
```

- **Identity**: Gray text, medium, 15px (MOVED TO TOP)
- **Streak**: Fire emoji + count, right-aligned (MOVED TO TOP)
- **Time**: Green background, bold, 13px
- **Trigger**: Purple-tinted background, semi-bold, 13px (NEW - inline with time)
- **Action**: Black text, bold, 18px

### Color Palette

- **Identity (Header)**: Gray `#666` text, medium weight
- **Streak (Header)**: Fire emoji 🔥 + red `#FF6B6B` count
- **Time**: Green background `rgba(76, 175, 80, 0.15)`, green `#4CAF50` text
- **Separator**: Gray `#999` bullet point "•"
- **Trigger (Normal)**: Purple background `rgba(102, 126, 234, 0.1)`, purple `#667eea` text (NEW)
- **Trigger (Completed)**: Gray background `rgba(158, 158, 158, 0.1)`, gray `#666` text
- **Trigger (Missed)**: Red background `rgba(244, 67, 54, 0.2)`, red `#C62828` text
- **Action**: Black `#000` text, bold

### Spacing

- **Header row margin-bottom**: 8px (spacing between identity/streak and time/trigger row)
- **Separator padding**: 0 8px (spacing around bullet point)
- **Time padding**: 6px 12px
- **Trigger padding**: 6px 12px
- **Gap between time/trigger row and action**: 8px (inherited from `habit-today-content` gap)
- **Action margin-top**: 8px
