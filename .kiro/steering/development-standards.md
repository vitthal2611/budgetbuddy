# Development Standards - STRICT MODE

**Status**: MANDATORY - All rules must be followed without exception
**Scope**: Entire project (including refactoring existing code)
**Priority**: HIGHEST

---

## 1. Execution Control

### CRITICAL: Ask Before Building
- **NEVER** start implementation immediately
- **ALWAYS** ask clarifying questions if any requirement is unclear
- If assumptions are required → **PAUSE and ASK**
- Do not proceed until clarity is achieved

### Decision Flow
```
Requirement Received → Analyze → Questions? → YES → Ask User → Wait for Answer
                                            → NO  → Proceed with Implementation
```

---

## 2. Mobile-First Enforcement

### Primary Design Target
- **Every UI MUST be designed mobile-first**
- Desktop/tablet layouts are secondary adaptations
- Default viewport: 375px - 480px width

### Mobile Priorities (In Order)
1. **Small screen usability** - Everything must work on small screens
2. **Touch-friendly interactions** - Minimum 44x44px touch targets
3. **Minimal scrolling** - Key actions visible without scrolling
4. **Minimal friction** - Reduce steps to complete tasks

### Implementation Rules
- Start with mobile CSS, then add `@media (min-width: 768px)` for larger screens
- Test all interactions on mobile viewport first
- Use mobile-appropriate components (bottom sheets, full-screen modals, etc.)
- Avoid hover-dependent interactions

---

## 3. Zero Redundancy Rule

### Eliminate Duplication
- **No duplicate information in UI** - Show data once, reference elsewhere
- **No repeated inputs from users** - Remember and reuse previous inputs
- **No unnecessary fields or components** - Every field must have clear purpose

### Detection and Action
```
If duplication detected → Eliminate it immediately
If field seems unnecessary → Remove it or justify its existence
If user enters same data twice → Refactor to single entry point
```

### Examples
❌ **BAD**: Asking for category in both transaction form and envelope selection
✅ **GOOD**: Select envelope, category auto-filled from envelope

❌ **BAD**: Showing same transaction total in 3 different places
✅ **GOOD**: Show once prominently, reference elsewhere if needed

---

## 4. UI Simplicity Standard

### Design Principles
Every UI must be:
- **Clean** - No visual clutter
- **Minimal** - Only essential elements
- **Clear hierarchy** - Obvious what's important
- **Purposeful** - Every element has a reason to exist

### Avoid
- ❌ Clutter
- ❌ Over-design
- ❌ Excessive elements
- ❌ Decorative-only components
- ❌ Unnecessary animations
- ❌ Complex nested layouts

### Checklist Before Adding Any UI Element
1. Is this element absolutely necessary?
2. Does it serve a clear user need?
3. Can existing elements handle this?
4. Does it add cognitive load?
5. Can it be simplified further?

---

## 5. Test Data Enforcement

### MANDATORY: Include Test Data
You **MUST ALWAYS** include realistic test data for:
- ✅ Income transactions
- ✅ Expense transactions
- ✅ Envelopes/Categories
- ✅ Budget allocations
- ✅ Recurring transactions
- ✅ Habits (if applicable)
- ✅ Any newly introduced feature

### Test Data Quality Standards
- **Realistic** - Use real-world scenarios and amounts
- **Relevant** - Directly related to the feature being tested
- **Sufficient** - Enough data to test edge cases
- **Not excessive** - Don't overwhelm with unnecessary data
- **Diverse** - Cover different scenarios (high/low amounts, different categories, etc.)

### Example Test Data Structure
```javascript
// ✅ GOOD - Realistic and relevant
const testTransactions = [
  { date: '2026-05-01', amount: 3500, type: 'income', description: 'Salary', envelope: 'Income' },
  { date: '2026-05-03', amount: 45.50, type: 'expense', description: 'Groceries', envelope: 'Food' },
  { date: '2026-05-05', amount: 120, type: 'expense', description: 'Electric Bill', envelope: 'Utilities' }
];

// ❌ BAD - Excessive and irrelevant
const testTransactions = [
  { date: '2020-01-01', amount: 999999, type: 'income', description: 'Test Test Test', envelope: 'Test' },
  // ... 100 more similar entries
];
```

---

## 6. Consistency Rule

### Maintain Consistency Across
- **Layout patterns** - Same spacing, alignment, structure
- **Component usage** - Reuse existing components
- **Naming conventions** - Follow established patterns
- **Design patterns** - Modal behavior, form structure, navigation
- **Color usage** - Stick to defined color palette
- **Typography** - Use consistent font sizes and weights
- **Interaction patterns** - Similar actions work the same way

### Before Creating New Component
1. Does a similar component already exist?
2. Can existing component be extended?
3. Will this create inconsistency?
4. Document new patterns if absolutely necessary

---

## 7. Output Quality Standard

### Code Must Be
- **Structured** - Logical organization, clear sections
- **Production-ready** - No TODOs, no placeholders, no "will implement later"
- **Easy to understand** - Clear variable names, logical flow
- **Well-commented** - Complex logic explained
- **Complete** - Fully functional, no partial implementations

### Avoid
- ❌ Vague implementations
- ❌ Incomplete features
- ❌ Placeholder functions
- ❌ "TODO" comments in production code
- ❌ Console.log statements (except intentional logging)
- ❌ Commented-out code blocks

---

## 8. Failure Handling

### When Any Rule is Violated
1. **STOP IMMEDIATELY** - Do not continue
2. **Re-evaluate the solution** - Identify the violation
3. **Correct before proceeding** - Fix the issue
4. **Document the fix** - Explain what was wrong and how it was corrected

### Self-Check Process
Before submitting any code:
1. ✅ Did I ask clarifying questions?
2. ✅ Is this mobile-first?
3. ✅ Is there any duplication?
4. ✅ Is the UI minimal and clean?
5. ✅ Did I include test data?
6. ✅ Is this consistent with existing code?
7. ✅ Is this production-ready?

---

## 9. Behavior Summary

### Quick Reference
| Rule | Action |
|------|--------|
| **Ask** | Then build |
| **Mobile** | First |
| **Keep** | Minimal |
| **Avoid** | Duplication |
| **Include** | Relevant test data |
| **Ensure** | Consistency |
| **Remove** | Dead code |
| **Refactor** | When needed |

---

## 10. Documentation Rule

### NEVER Create
- ❌ Markdown files (`.md`)
- ❌ Documentation files
- ❌ README files
- ❌ CHANGELOG files

### Exception
- ✅ This steering file (already exists)
- ✅ Code comments (inline documentation)

---

## 11. User Experience Priority

### Always Keep in Mind
- Users must have the **best possible experience**
- Every decision should improve UX
- Remove friction at every opportunity
- Make common tasks effortless
- Anticipate user needs

### UX Checklist
- ✅ Is this intuitive?
- ✅ Can users complete tasks quickly?
- ✅ Are error messages helpful?
- ✅ Is feedback immediate?
- ✅ Does it work smoothly on mobile?

---

## 12. Code Cleanliness

### Always Remove
- ❌ Dead code (unused functions, variables, imports)
- ❌ Unnecessary code (redundant logic, over-engineering)
- ❌ Commented-out code blocks
- ❌ Unused dependencies
- ❌ Debug statements

### Keep Minimal Working Code
- Only include what's necessary
- Simplify complex logic
- Remove abstraction layers that don't add value
- Prefer clarity over cleverness

---

## 13. Refactoring Mandate

### Always Refactor When
- Code is duplicated
- Logic is overly complex
- Naming is unclear
- Structure is inconsistent
- Performance can be improved
- Readability suffers

### Refactoring is NOT Optional
- If you see code that needs refactoring → **Refactor it**
- Don't leave technical debt
- Don't postpone improvements
- Clean as you go

---

## 14. Single Responsibility

### Keep Code Minimal in Single Class/File
- Each file should have **one clear purpose**
- Each function should do **one thing well**
- Each component should have **one responsibility**

### File Size Guidelines
- Components: < 500 lines (ideally < 300)
- Utility files: < 200 lines
- Services: < 400 lines

### When File Gets Too Large
1. Identify separate concerns
2. Extract into separate files
3. Maintain clear interfaces
4. Update imports

---

## Enforcement

These rules are **MANDATORY** and apply to:
- ✅ All new code
- ✅ All refactored code
- ✅ All bug fixes
- ✅ All feature additions
- ✅ All UI changes

**No exceptions without explicit approval.**

---

## Quick Decision Tree

```
New Task Received
    ↓
Is requirement clear? → NO → Ask clarifying questions → Wait for answer
    ↓ YES
Design mobile-first
    ↓
Check for duplication → Found? → Eliminate it
    ↓ None
Keep UI minimal and clean
    ↓
Add realistic test data
    ↓
Ensure consistency with existing code
    ↓
Remove dead code
    ↓
Refactor if needed
    ↓
Self-check all rules
    ↓
Submit production-ready code
```

---

**Remember: Quality over speed. Correctness over convenience. User experience over everything.**
