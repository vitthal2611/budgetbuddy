---
inclusion: auto
priority: high
---

# Mobile-First Design Standards

**Status**: MANDATORY - Always Active
**Scope**: All UI/UX development
**Priority**: CRITICAL

---

## Core Principle

**MOBILE FIRST, ALWAYS**

Every UI component, feature, and interaction MUST be designed for mobile devices first, then progressively enhanced for larger screens.

---

## Mobile Design Requirements

### 1. Screen Size Targets

**Primary Target Devices:**
- iPhone SE (375px width) - MINIMUM
- iPhone 12/13/14 (390px width)
- iPhone 12/13/14 Pro Max (428px width)
- Small Android phones (360px width)

**Breakpoints:**
```css
/* Mobile First - Default styles */
/* No media query needed */

/* Tablet and up */
@media (min-width: 768px) { }

/* Desktop and up */
@media (min-width: 1024px) { }
```

---

### 2. Touch Target Sizes

**Minimum Touch Targets:**
- Buttons: 44px × 44px (Apple HIG standard)
- Interactive elements: 48px × 48px (Material Design)
- Text inputs: 44px minimum height
- Checkboxes/Radio buttons: 24px × 24px minimum

**Spacing:**
- Minimum 8px between touch targets
- Recommended 12px for comfortable tapping

---

### 3. Typography for Mobile

**Font Sizes:**
- Body text: 14px - 16px (NEVER smaller than 14px)
- Input fields: 16px minimum (prevents iOS zoom)
- Headings: Scale appropriately (18px - 24px)
- Small text: 12px minimum (use sparingly)

**Line Height:**
- Body text: 1.4 - 1.6
- Headings: 1.2 - 1.3

---

### 4. Layout & Spacing

**Container Width:**
- Mobile: 100% width with padding
- Max-width: 480px for single-column layouts
- Padding: 12px - 16px on mobile

**Vertical Spacing:**
- Sections: 16px - 24px apart
- Elements: 8px - 12px apart
- Compact cards: 10px - 12px gap

**Horizontal Spacing:**
- Side padding: 12px - 16px
- Between elements: 8px - 12px

---

### 5. Navigation Patterns

**Mobile Navigation:**
- Bottom navigation bar (thumb-friendly)
- Hamburger menu for secondary items
- Fixed position for primary navigation
- Maximum 5 items in bottom nav

**Avoid:**
- ❌ Top-only navigation (hard to reach)
- ❌ Hover-dependent interactions
- ❌ Complex nested menus
- ❌ Tiny tap targets

---

### 6. Forms & Inputs

**Input Fields:**
- Font-size: 16px minimum (prevents iOS zoom)
- Height: 44px minimum
- Padding: 12px - 14px
- Clear labels above inputs
- Visible focus states

**Form Layout:**
- Single column on mobile
- Full-width inputs
- Stacked fields (no side-by-side)
- Large, obvious submit buttons

**Keyboard Considerations:**
- Appropriate input types (email, tel, number)
- Autocomplete attributes
- Scroll to input on focus
- Avoid fixed positioning issues

---

### 7. Modals & Overlays

**Mobile Modal Behavior:**
- Slide up from bottom (not centered)
- Full-width or near full-width
- Border-radius on top corners only
- Easy-to-reach close button
- Max-height: 95vh

**Bottom Sheets:**
- Preferred over centered modals
- Swipe-to-dismiss support
- Backdrop tap to close

---

### 8. Lists & Cards

**Card Design:**
- Compact padding (10px - 12px)
- Clear visual hierarchy
- Adequate spacing between cards (10px - 12px)
- Swipe actions where appropriate

**List Items:**
- Minimum height: 48px
- Clear tap areas
- Visual feedback on tap
- Avoid tiny icons or text

---

### 9. Images & Media

**Image Handling:**
- Responsive images (srcset)
- Lazy loading
- Appropriate compression
- Max-width: 100%

**Icons:**
- Minimum 20px × 20px
- Clear and recognizable
- Sufficient contrast

---

### 10. Performance

**Mobile Performance:**
- Fast load times (< 3 seconds)
- Minimal JavaScript
- Optimized images
- Efficient CSS

**Interactions:**
- Instant feedback on tap
- Smooth animations (60fps)
- No janky scrolling
- Touch-optimized gestures

---

## iOS-Specific Considerations

### Prevent Zoom on Input Focus
```css
input[type="text"],
input[type="email"],
input[type="tel"],
input[type="number"],
textarea,
select {
  font-size: 16px !important;
}
```

### Safe Area Support
```css
@supports (padding: max(0px)) {
  .header {
    padding-left: max(16px, env(safe-area-inset-left));
    padding-right: max(16px, env(safe-area-inset-right));
  }
}
```

### Disable Tap Highlight
```css
* {
  -webkit-tap-highlight-color: transparent;
}
```

### Smooth Scrolling
```css
.scrollable {
  -webkit-overflow-scrolling: touch;
  overflow-y: auto;
}
```

---

## Android-Specific Considerations

### Material Design Touch Ripple
- Use visual feedback on tap
- 48dp minimum touch target
- Ripple effect on interactive elements

### Back Button Support
- Handle Android back button
- Proper navigation stack
- Close modals on back

---

## Common Mobile Pitfalls to Avoid

### ❌ DON'T:
1. Use hover states as primary interaction
2. Make touch targets smaller than 44px
3. Use font-size smaller than 16px for inputs
4. Create horizontal scrolling (except intentional carousels)
5. Use fixed positioning without safe-area support
6. Ignore landscape orientation
7. Use tiny fonts (< 12px)
8. Create complex multi-column layouts
9. Rely on tooltips (no hover on mobile)
10. Use desktop-first media queries

### ✅ DO:
1. Design for thumb reach zones
2. Use large, obvious buttons
3. Provide immediate visual feedback
4. Test on real devices
5. Support both portrait and landscape
6. Use native input types
7. Optimize for one-handed use
8. Minimize typing requirements
9. Use progressive disclosure
10. Test with slow connections

---

## Testing Checklist

**Before Deploying:**
- [ ] Test on iPhone SE (smallest screen)
- [ ] Test on Android phone (360px width)
- [ ] Test all touch targets (44px minimum)
- [ ] Test form inputs (no zoom on focus)
- [ ] Test in portrait and landscape
- [ ] Test with slow 3G connection
- [ ] Test scrolling performance
- [ ] Test modal/overlay behavior
- [ ] Verify safe area support (notched devices)
- [ ] Test with one hand (thumb reach)

---

## Mobile-First CSS Pattern

```css
/* Mobile First - Base Styles */
.component {
  padding: 12px;
  font-size: 14px;
  /* Mobile styles here */
}

/* Tablet and larger */
@media (min-width: 768px) {
  .component {
    padding: 20px;
    font-size: 16px;
    /* Enhanced styles for larger screens */
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .component {
    max-width: 1200px;
    margin: 0 auto;
    /* Desktop-specific enhancements */
  }
}
```

---

## Thumb Reach Zones

**Easy to Reach (Green Zone):**
- Bottom third of screen
- Center of screen
- Primary actions here

**Stretch to Reach (Yellow Zone):**
- Middle third of screen
- Secondary actions here

**Hard to Reach (Red Zone):**
- Top third of screen
- Corners of screen
- Avoid primary actions here

**Design Accordingly:**
- Bottom navigation (easy reach)
- Primary buttons at bottom
- Secondary actions in middle
- Informational content at top

---

## Responsive Images

```html
<!-- Responsive image with srcset -->
<img 
  src="image-small.jpg"
  srcset="image-small.jpg 400w,
          image-medium.jpg 800w,
          image-large.jpg 1200w"
  sizes="(max-width: 480px) 100vw,
         (max-width: 768px) 50vw,
         33vw"
  alt="Description"
  loading="lazy"
/>
```

---

## Mobile Debugging

**Chrome DevTools:**
- Device mode (Cmd/Ctrl + Shift + M)
- Network throttling (Slow 3G)
- Touch simulation
- Responsive viewport testing

**Real Device Testing:**
- Always test on real devices
- Test on oldest supported device
- Test with poor network conditions
- Test with one hand

---

## Accessibility on Mobile

**Touch Accessibility:**
- Large touch targets (44px+)
- Clear focus indicators
- Sufficient color contrast (4.5:1)
- Screen reader support
- Keyboard navigation support

**Visual Accessibility:**
- Readable font sizes (14px+)
- High contrast text
- Clear visual hierarchy
- Avoid color-only indicators

---

## Performance Budget

**Mobile Performance Targets:**
- First Contentful Paint: < 1.8s
- Time to Interactive: < 3.8s
- Total Bundle Size: < 200KB (gzipped)
- Images: Optimized and lazy-loaded

---

## Quick Reference

**Minimum Sizes:**
- Touch target: 44px × 44px
- Input height: 44px
- Font size (input): 16px
- Font size (body): 14px
- Card padding: 10px - 12px
- Section spacing: 16px - 24px

**Breakpoints:**
- Mobile: < 768px (default)
- Tablet: 768px - 1023px
- Desktop: ≥ 1024px

**Safe Zones:**
- Side padding: 12px - 16px
- Top/bottom: Account for safe-area-inset
- Between elements: 8px - 12px

---

## Remember

> "If it doesn't work well on mobile, it doesn't work."

Every feature, every component, every interaction must be designed and tested for mobile devices first. Desktop is an enhancement, not the baseline.

---

**Last Updated:** 2026-05-11
**Version:** 1.0
**Applies To:** All UI/UX development in this project
