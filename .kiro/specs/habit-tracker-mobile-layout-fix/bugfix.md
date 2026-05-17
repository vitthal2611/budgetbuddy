# Bugfix Requirements Document

## Introduction

This document defines the requirements for fixing mobile view layout issues in the Habit Tracker component. The bug manifests as habit card elements breaking into column layouts instead of proper row layouts, content being cut off at the bottom of the screen, and elements being hidden behind the fixed bottom navigation bar. This affects the usability of the habit tracker on mobile devices, preventing users from viewing and interacting with all their habits properly.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN viewing the habit tracker on mobile devices (max-width: 480px) THEN habit card information displays in a broken column layout instead of the intended row layout

1.2 WHEN scrolling through habit cards in the "today" view on mobile THEN the last habit card(s) are cut off or hidden behind the bottom navigation bar

1.3 WHEN the habit list contains multiple cards on mobile THEN the bottom padding does not account for the fixed bottom navigation height (64px + safe-area-inset-bottom), causing content to be inaccessible

1.4 WHEN habit cards render on mobile THEN the card body layout (`.habit-today-body`) breaks into columns instead of maintaining a horizontal row structure with left action button, content area, and right action button

1.5 WHEN viewing habit card content on mobile THEN elements within the card overlap or misalign due to incorrect flexbox direction or sizing constraints

### Expected Behavior (Correct)

2.1 WHEN viewing the habit tracker on mobile devices (max-width: 480px) THEN habit card information SHALL display in proper row layout with elements aligned horizontally as designed

2.2 WHEN scrolling through habit cards in the "today" view on mobile THEN all habit cards SHALL be fully visible and scrollable, with the last card having sufficient bottom padding to clear the bottom navigation bar

2.3 WHEN the habit list contains multiple cards on mobile THEN the bottom padding SHALL properly account for the fixed bottom navigation height using `calc(var(--nav-height, 64px) + env(safe-area-inset-bottom))` to ensure all content is accessible

2.4 WHEN habit cards render on mobile THEN the card body layout (`.habit-today-body`) SHALL maintain a horizontal row structure with proper flexbox properties (`flex-direction: row`) and correct sizing for action buttons and content area

2.5 WHEN viewing habit card content on mobile THEN all elements within the card SHALL be properly aligned without overlapping, with correct flex properties and width constraints

### Unchanged Behavior (Regression Prevention)

3.1 WHEN viewing the habit tracker on tablet devices (481px - 767px) THEN the layout SHALL CONTINUE TO display correctly as currently implemented

3.2 WHEN viewing the habit tracker on desktop devices (768px+) THEN the layout SHALL CONTINUE TO display correctly with sidebar integration as currently implemented

3.3 WHEN interacting with habit cards (completing, missing, editing) on any device THEN the functionality SHALL CONTINUE TO work as currently implemented

3.4 WHEN viewing the "week" tab on mobile THEN the week view layout SHALL CONTINUE TO display correctly as currently implemented

3.5 WHEN using the habit tracker on devices with notches (safe area insets) THEN the safe area handling SHALL CONTINUE TO work correctly for all device types

3.6 WHEN viewing habit cards in completed or missed states on mobile THEN the visual styling and state indicators SHALL CONTINUE TO display correctly

3.7 WHEN opening modals (add habit, edit habit) on mobile THEN the modal layouts SHALL CONTINUE TO function correctly as currently implemented

## Bug Condition Analysis

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type ViewportContext
  OUTPUT: boolean
  
  // Returns true when the bug condition is met
  RETURN (X.viewportWidth <= 480) AND 
         (X.component = "HabitTracker") AND
         (X.activeTab = "today" OR X.hasHabitCards = true)
END FUNCTION
```

### Property Specification - Fix Checking

```pascal
// Property: Fix Checking - Mobile Layout Correction
FOR ALL X WHERE isBugCondition(X) DO
  layout ← renderHabitTracker'(X)
  
  // Verify row layout for habit cards
  ASSERT layout.habitCardBody.flexDirection = "row"
  
  // Verify proper bottom padding
  ASSERT layout.habitList.paddingBottom >= (64 + X.safeAreaInsetBottom)
  
  // Verify all content is scrollable and visible
  ASSERT layout.allCardsVisible = true
  
  // Verify no overlapping elements
  ASSERT layout.hasOverlappingElements = false
  
  // Verify proper alignment
  ASSERT layout.cardElementsAligned = true
END FOR
```

### Preservation Goal

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  // For tablet and desktop viewports, or non-today views
  ASSERT renderHabitTracker(X) = renderHabitTracker'(X)
END FOR
```

**Key Definitions:**
- **renderHabitTracker**: The original (unfixed) rendering function
- **renderHabitTracker'**: The fixed rendering function
- **X.viewportWidth**: The current viewport width in pixels
- **X.safeAreaInsetBottom**: The safe area inset for notched devices

## Counterexample

**Concrete example demonstrating the bug:**

```
Input: 
  - Device: iPhone 12 (viewport width: 390px)
  - Component: HabitTracker
  - Active Tab: "today"
  - Habit Cards: 5 cards present
  - Bottom Navigation: Fixed at bottom (64px height)

Current Behavior (Buggy):
  - Habit card body displays in column layout (elements stacked vertically)
  - Last habit card is partially hidden behind bottom navigation
  - User cannot scroll to see the complete last card
  - Card elements overlap or misalign

Expected Behavior (Fixed):
  - Habit card body displays in row layout (elements aligned horizontally)
  - All 5 habit cards are fully visible and scrollable
  - Bottom padding of habit list = 64px + safe-area-inset-bottom
  - User can scroll to see all cards with proper spacing from bottom nav
  - No overlapping or misaligned elements
```
