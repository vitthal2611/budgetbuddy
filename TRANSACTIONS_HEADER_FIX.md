# Transactions Header Alignment Fix

## Issue
The Import button and Filters button in the Transactions header were not properly aligned, especially on mobile devices.

## Changes Made

### 1. Header Structure
- Added `flex-wrap: wrap` to `.transactions-header` for better wrapping on small screens
- Added `flex-shrink: 0` to `.header-actions` to prevent button shrinking
- Added `margin: 0` to `.transactions-title` to remove default margins

### 2. Import Button
- Changed `display: flex` to `display: inline-flex` for better inline alignment
- Added `justify-content: center` for proper icon/text centering
- Added `white-space: nowrap` to prevent text wrapping

### 3. Mobile Responsiveness

#### Medium Mobile (max-width: 480px)
- Title font-size: 20px
- Button padding: 8px 12px
- Button font-size: 13px
- Button min-height: 40px
- Gap between buttons: 6px

#### Small Mobile (max-width: 360px)
- Title font-size: 18px
- Button padding: 8px 10px/12px
- Button font-size: 12px
- Gap between buttons: 4px
- Header gap: 8px

## Result
- Buttons now align properly on all screen sizes
- No wrapping or misalignment issues
- Consistent spacing and sizing
- Touch-friendly button sizes maintained (40-44px height)
