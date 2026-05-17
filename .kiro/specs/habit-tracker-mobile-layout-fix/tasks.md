# Implementation Plan

## Overview
This task list implements the fix for mobile layout issues in the Habit Tracker component where habit cards break into column layouts instead of maintaining proper row layouts, and content is cut off behind the fixed bottom navigation bar.

---

## Tasks

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Mobile Row Layout and Bottom Padding Verification
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Test concrete failing cases across mobile viewport widths (375px, 390px, 430px)
  - Test implementation details from Bug Condition in design:
    - Verify `.habit-today-body` does NOT have `flex-direction: row` on mobile (≤480px) in unfixed code
    - Verify `.habit-list` bottom padding is insufficient (< 64px + safe-area-inset-bottom) in unfixed code
    - Test with multiple habit cards (5+) to verify last cards are hidden behind bottom nav
    - Test that card body elements break into column layout or overlap
  - The test assertions should match the Expected Behavior Properties from design:
    - Assert `.habit-today-body` SHOULD have `flex-direction: row`
    - Assert `.habit-list` SHOULD have bottom padding ≥ `calc(64px + safe-area-inset-bottom)`
    - Assert all habit cards SHOULD be scrollable and visible above bottom nav
    - Assert no overlapping elements within habit cards
  - Run test on UNFIXED code (src/components/HabitTracker.css before modifications)
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found:
    - Record actual computed `flex-direction` value on mobile
    - Record actual bottom padding value
    - Record which cards are hidden/cut off
    - Screenshot or describe visual layout issues
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Tablet and Desktop Layout Preservation
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (viewport width > 480px):
    - Test tablet layout (768px viewport) - observe header, tabs, card layout, spacing
    - Test desktop layout (1024px viewport) - observe sidebar integration, card layout
    - Test week view tab on mobile - observe calendar grid layout
    - Test habit interactions (complete, miss, undo, edit) - observe functionality
    - Test modals (add habit, edit habit) - observe modal layout and behavior
    - Test safe area handling on notched devices - observe header/footer spacing
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - Property: For all viewports > 480px, layout matches original unfixed behavior
    - Property: For all habit interactions, functionality matches original unfixed behavior
    - Property: For all modal interactions, behavior matches original unfixed behavior
    - Property: For week view, layout matches original unfixed behavior
    - Property: For safe area handling, spacing matches original unfixed behavior
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 3. Fix mobile layout issues in HabitTracker.css

  - [x] 3.1 Add explicit flex-direction for mobile habit card body
    - Open `src/components/HabitTracker.css`
    - Locate the `@media (max-width: 480px)` section (around line 1738)
    - Add explicit CSS rule for `.habit-today-body`:
      ```css
      .habit-today-body {
        display: flex;
        flex-direction: row !important;
        align-items: stretch;
        gap: 0;
        padding: 0;
        background: #ffffff;
        width: 100%;
        box-sizing: border-box;
        min-height: 80px;
      }
      ```
    - Ensure this rule is within the mobile media query block
    - _Bug_Condition: isBugCondition(input) where input.viewportWidth <= 480 AND bodyFlexDirection(input) != "row"_
    - _Expected_Behavior: habitCardBody.flexDirection = "row" AND habitCardBody.alignItems = "stretch"_
    - _Preservation: Tablet (>480px) and desktop layouts must remain unchanged_
    - _Requirements: 1.1, 1.4, 1.5, 2.1, 2.4, 2.5_

  - [x] 3.2 Correct bottom padding calculation for habit list
    - In the same `@media (max-width: 480px)` section
    - Locate or add CSS rule for `.habit-list` (around line 2044)
    - Update bottom padding to account for full navigation height:
      ```css
      .habit-list {
        padding: 8px 12px;
        padding-bottom: calc(var(--nav-height, 64px) + 8px + env(safe-area-inset-bottom));
        gap: 8px;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }
      ```
    - The additional 8px accounts for the bottom nav's own padding
    - _Bug_Condition: isBugCondition(input) where bottomPadding(input) < (64 + safeAreaInsetBottom(input))_
    - _Expected_Behavior: habitList.paddingBottom >= (64 + 8 + safeAreaInsetBottom)_
    - _Preservation: Tablet and desktop bottom padding must remain unchanged_
    - _Requirements: 1.2, 1.3, 2.2, 2.3_

  - [x] 3.3 Ensure action button sizing consistency
    - Verify existing rules for `.habit-action-icon` (lines 821-841)
    - Ensure mobile override maintains these properties:
      - `flex-shrink: 0` (prevents buttons from collapsing)
      - `min-width: 56px` and `width: 56px` (consistent sizing)
      - `height: 100%` (fills vertical space)
    - If mobile override conflicts, add explicit rules in mobile media query
    - _Expected_Behavior: Action buttons maintain consistent 56px width on mobile_
    - _Preservation: Button sizing on tablet/desktop must remain unchanged_
    - _Requirements: 2.4, 2.5_

  - [x] 3.4 Verify content area flex properties
    - Verify existing rules for `.habit-today-content` (lines 844-852)
    - Ensure mobile override maintains these properties:
      - `flex: 1` (takes remaining space)
      - `min-width: 0` (allows text truncation)
      - `box-sizing: border-box` (correct width calculations)
    - If mobile override conflicts, add explicit rules in mobile media query
    - _Expected_Behavior: Content area flexes to fill available space_
    - _Preservation: Content area behavior on tablet/desktop must remain unchanged_
    - _Requirements: 2.4, 2.5_

  - [x] 3.5 Add defensive box-sizing rules
    - In the `@media (max-width: 480px)` section
    - Add universal box-sizing rule for habit card children:
      ```css
      .habit-today-body * {
        box-sizing: border-box;
      }
      ```
    - This prevents width calculation issues that could cause overflow
    - _Expected_Behavior: All child elements use border-box sizing_
    - _Preservation: Box-sizing on tablet/desktop must remain unchanged_
    - _Requirements: 2.5_

  - [x] 3.6 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Mobile Row Layout and Bottom Padding Verification
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1 on FIXED code
    - Verify assertions now pass:
      - `.habit-today-body` has `flex-direction: row` on mobile
      - `.habit-list` has bottom padding ≥ `calc(64px + 8px + safe-area-inset-bottom)`
      - All habit cards are scrollable and visible above bottom nav
      - No overlapping elements within habit cards
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Test on multiple mobile viewports (375px, 390px, 430px)
    - Document that counterexamples are now resolved
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.7 Verify preservation tests still pass
    - **Property 2: Preservation** - Tablet and Desktop Layout Preservation
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2 on FIXED code
    - Verify all preservation tests still pass:
      - Tablet layout (768px) matches original behavior
      - Desktop layout (1024px) matches original behavior
      - Week view layout matches original behavior
      - All habit interactions work identically
      - Modal behavior matches original
      - Safe area handling matches original
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - If any test fails, identify the regression and adjust the fix
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 4. Checkpoint - Ensure all tests pass and manual verification
  - Run all automated tests (bug condition + preservation)
  - Perform manual testing on physical devices or browser DevTools:
    - iPhone SE (375px) - verify row layout and scrollability
    - iPhone 12 (390px) - verify row layout and scrollability
    - iPhone 14 Pro Max (430px) - verify row layout and safe area handling
    - iPad (768px) - verify tablet layout unchanged
    - Desktop (1024px+) - verify desktop layout unchanged
  - Test with varying numbers of habit cards (1, 5, 10, 20)
  - Test all habit interactions (complete, miss, undo, edit, delete)
  - Test week view tab
  - Test add/edit habit modals
  - Verify no visual regressions or new bugs introduced
  - If any issues found, return to step 3 and adjust the fix
  - Document final verification results
  - Ask user if questions arise or if additional testing is needed

---

## Success Criteria

✅ All habit cards display in row layout on mobile (≤480px) with action buttons on left/right sides
✅ All habit cards are fully scrollable and visible above the bottom navigation bar on mobile
✅ Bottom padding accounts for full navigation height (64px + 8px + safe-area-inset-bottom)
✅ No elements overlap or misalign within habit cards on mobile
✅ Tablet (481px-767px) layout remains unchanged
✅ Desktop (≥768px) layout remains unchanged
✅ All habit interactions (complete, miss, edit, delete) continue to work correctly
✅ Week view layout remains unchanged
✅ Safe area handling continues to work on notched devices
✅ No new visual bugs or regressions are introduced

---

## Notes

- **CSS-Only Fix**: This fix only requires CSS changes in `src/components/HabitTracker.css`. No JavaScript changes are necessary.
- **Mobile-First Approach**: The fix targets mobile viewports (≤480px) specifically, following the mobile-first design principle.
- **Minimal Changes**: The fix is as minimal as possible to reduce risk of regressions.
- **Testing Priority**: Focus testing on mobile viewports first (375px, 390px, 430px), then verify preservation on tablet/desktop.
- **Browser Compatibility**: Test on both iOS Safari and Chrome/Android to ensure cross-browser compatibility.
