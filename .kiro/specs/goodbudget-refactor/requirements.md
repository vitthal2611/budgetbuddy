# Requirements Document: Goodbudget-Style Refactor

## Introduction

This document specifies requirements for refactoring the existing React-based envelope budgeting app into a comprehensive, production-ready Goodbudget-style system. The current implementation has basic envelope budgeting features but lacks structural enforcement of the core budgeting flow, has inconsistent data models, and needs significant UI/UX improvements to match Goodbudget's proven methodology.

The refactor will transform the app from a basic expense tracker into a disciplined zero-based budgeting system that enforces the three-step flow: Fill Envelopes → Add Expense → Stop When Empty.

## Glossary

- **System**: The BudgetBuddy web application
- **User**: A person using the app to manage their budget
- **Envelope**: A budget category that holds allocated money for specific purposes
- **Transaction**: A financial record (income, expense, or transfer)
- **Budget_Cycle**: A time period (monthly or annual) for budget planning
- **Allocation**: The act of assigning income to envelopes
- **Unallocated_Amount**: Income that has not been assigned to any envelope
- **Payment_Method**: An account or payment source (bank account, credit card, cash)
- **Firebase**: Cloud backend service for data storage and authentication
- **Dashboard**: The main overview screen showing financial summary
- **Fill_Envelopes_Modal**: The interface for distributing income across envelopes
- **Transaction_Modal**: The interface for adding/editing transactions
- **Envelope_Type**: Classification of envelope as Monthly or Annual
- **Category**: Classification of envelope as Need, Want, or Saving
- **Remaining_Balance**: The amount left to spend in an envelope (allocated - spent)
- **Overspending**: When expenses exceed envelope allocation
- **Transfer**: Moving money between envelopes or payment methods
- **Budget_Period**: The selected month/year for viewing and planning
- **Archive**: Historical data for past budget cycles
- **Validation_Rule**: A constraint that prevents invalid operations

## Requirements

### Requirement 1: Core Flow Enforcement

**User Story:** As a user, I want the system to enforce the Fill → Spend → Stop flow, so that I cannot overspend and maintain budget discipline.

#### Acceptance Criteria

1. WHEN a User attempts to add an expense, THE System SHALL verify that the selected Envelope has sufficient Remaining_Balance
2. IF an Envelope has zero Remaining_Balance, THEN THE System SHALL prevent the expense and display an error message
3. WHEN Unallocated_Amount is greater than zero, THE System SHALL display a prominent warning on the Dashboard
4. THE System SHALL NOT allow negative Remaining_Balance in any Envelope
5. WHEN a User adds income, THE System SHALL immediately prompt to allocate it via Fill_Envelopes_Modal
6. THE System SHALL calculate Remaining_Balance as (Allocated - Spent) for each Envelope in real-time

### Requirement 2: Normalized Data Models

**User Story:** As a developer, I want consistent data structures, so that the codebase is maintainable and scalable.

#### Acceptance Criteria

1. THE System SHALL store each Transaction with fields: id, type, amount, note, date, timestamp
2. WHEN Transaction type is EXPENSE, THE System SHALL include fields: paymentMethod, envelope
3. WHEN Transaction type is INCOME, THE System SHALL include field: paymentMethod
4. WHEN Transaction type is TRANSFER, THE System SHALL include fields: sourceAccount, destinationAccount
5. THE System SHALL store each Envelope with fields: id, name, category, envelopeType, createdAt
6. THE System SHALL store each Budget_Cycle with fields: year, month, allocations (map of envelope_id to amount)
7. THE System SHALL use consistent date format DD-MM-YYYY across all components
8. THE System SHALL generate unique transaction IDs using timestamp and random string combination

### Requirement 3: Monthly and Annual Envelope Types

**User Story:** As a user, I want to create both monthly and annual envelopes, so that I can budget for irregular expenses.

#### Acceptance Criteria

1. WHEN creating an Envelope, THE System SHALL allow User to select Envelope_Type as Monthly or Annual
2. WHERE Envelope_Type is Annual, THE System SHALL divide annual allocation by 12 for monthly contribution
3. THE System SHALL display monthly contribution amount for Annual envelopes in Fill_Envelopes_Modal
4. WHEN viewing Dashboard, THE System SHALL show accumulated balance for Annual envelopes
5. THE System SHALL allow spending from Annual envelopes at any time regardless of monthly cycle

### Requirement 4: Budget Planning and Forecasting

**User Story:** As a user, I want to plan future months' budgets, so that I can prepare for upcoming expenses.

#### Acceptance Criteria

1. THE System SHALL allow User to select any future Budget_Period for planning
2. WHEN viewing a future Budget_Period, THE System SHALL display projected income based on historical average
3. THE System SHALL allow User to copy previous month's allocation to current month
4. THE System SHALL save budget allocations for future months without requiring income transactions
5. WHEN switching Budget_Period, THE System SHALL preserve unsaved changes with a confirmation dialog

### Requirement 5: Enhanced Transfer System

**User Story:** As a user, I want to transfer money between envelopes with validation, so that I can adjust my budget flexibly without errors.

#### Acceptance Criteria

1. WHEN initiating a Transfer between envelopes, THE System SHALL verify source Envelope has sufficient Remaining_Balance
2. THE System SHALL display current Remaining_Balance for source Envelope during transfer
3. WHEN Transfer is completed, THE System SHALL update both source and destination Envelope allocations atomically
4. THE System SHALL record Transfer as a single transaction with both source and destination
5. IF Transfer amount exceeds source Remaining_Balance, THEN THE System SHALL prevent the transfer and display error
6. THE System SHALL allow transfers between Payment_Methods without envelope involvement

### Requirement 6: Archive and History Management

**User Story:** As a user, I want to view historical budget data, so that I can analyze past spending patterns.

#### Acceptance Criteria

1. THE System SHALL archive Budget_Cycle data when a new month begins
2. WHEN User selects a past Budget_Period, THE System SHALL display read-only archived data
3. THE System SHALL allow User to view transactions from any past Budget_Period
4. THE System SHALL calculate statistics for archived periods: total income, total expense, savings rate
5. THE System SHALL allow User to export archived data as JSON or CSV

### Requirement 7: Reports and Analytics

**User Story:** As a user, I want visual reports of my spending, so that I can understand my financial habits.

#### Acceptance Criteria

1. THE System SHALL display spending by Category (Need/Want/Saving) for selected Budget_Period
2. THE System SHALL show monthly spending trends for the past 12 months
3. THE System SHALL calculate and display average spending per Envelope over selected time range
4. THE System SHALL show top 5 envelopes by spending amount
5. THE System SHALL display income vs expense comparison chart
6. THE System SHALL allow User to filter reports by date range, Category, or Envelope

### Requirement 8: Budget Cycle Management

**User Story:** As a user, I want automatic monthly budget resets with carry-forward options, so that unused money doesn't disappear.

#### Acceptance Criteria

1. WHEN a new month begins, THE System SHALL create a new Budget_Cycle automatically
2. THE System SHALL allow User to configure carry-forward behavior per Envelope (Yes/No)
3. WHERE carry-forward is enabled, THE System SHALL add previous month's Remaining_Balance to new allocation
4. WHERE carry-forward is disabled, THE System SHALL reset Envelope to zero at month start
5. THE System SHALL display carry-forward amount separately from new allocation in Fill_Envelopes_Modal
6. THE System SHALL archive previous Budget_Cycle data before creating new cycle

### Requirement 9: Enhanced Transaction History

**User Story:** As a user, I want powerful filtering and search in transaction history, so that I can find specific transactions quickly.

#### Acceptance Criteria

1. THE System SHALL allow User to filter transactions by type, date range, Envelope, Payment_Method
2. THE System SHALL provide text search across transaction notes
3. THE System SHALL display transaction count and totals for current filter
4. THE System SHALL allow User to sort transactions by date, amount, or envelope
5. THE System SHALL highlight transactions that caused Overspending in red
6. THE System SHALL allow bulk operations: delete multiple, export selected

### Requirement 10: Settings and Preferences

**User Story:** As a user, I want to configure app settings, so that the app matches my preferences and locale.

#### Acceptance Criteria

1. THE System SHALL allow User to set currency symbol and format
2. THE System SHALL allow User to set budget start date (1st-28th of month)
3. THE System SHALL allow User to configure default Budget_Period view (current month or custom)
4. THE System SHALL allow User to enable/disable spending warnings
5. THE System SHALL allow User to set warning threshold percentage (default 20%)
6. THE System SHALL persist all settings in Firebase per user account

### Requirement 11: Dashboard Redesign

**User Story:** As a user, I want a clear dashboard that shows what I can spend, so that I make informed financial decisions.

#### Acceptance Criteria

1. THE System SHALL display total Remaining_Balance prominently at top of Dashboard
2. THE System SHALL show Unallocated_Amount with warning if greater than zero
3. THE System SHALL display Envelope cards grouped by Category with Remaining_Balance emphasized
4. THE System SHALL use color coding: Green for safe (>20% remaining), Yellow for low (<20%), Red for overspent
5. THE System SHALL show today's expenses in a dedicated section
6. THE System SHALL provide quick action buttons: Fill Envelopes, Add Expense
7. THE System SHALL display Payment_Method balances in collapsible section

### Requirement 12: Fill Envelopes Modal Redesign

**User Story:** As a user, I want a simple interface to allocate income, so that I can complete budgeting quickly.

#### Acceptance Criteria

1. THE System SHALL display total income and Unallocated_Amount at top of Fill_Envelopes_Modal
2. THE System SHALL update Unallocated_Amount in real-time as User enters allocations
3. THE System SHALL provide "Quick Fill" button to distribute Unallocated_Amount evenly
4. THE System SHALL group Envelopes by Category in the modal
5. THE System SHALL auto-save allocations as User types (debounced)
6. THE System SHALL display success indicator when Unallocated_Amount reaches zero
7. THE System SHALL show monthly contribution for Annual envelopes

### Requirement 13: Transaction Modal Enhancement

**User Story:** As a user, I want clear feedback when adding expenses, so that I avoid overspending.

#### Acceptance Criteria

1. WHEN User selects an Envelope, THE System SHALL display current Remaining_Balance
2. WHEN entered amount exceeds Remaining_Balance, THE System SHALL show red warning
3. WHEN Remaining_Balance is low (<20%), THE System SHALL show yellow warning
4. WHEN Envelope has no allocation, THE System SHALL show info message to fill envelope first
5. THE System SHALL calculate and display new Remaining_Balance after transaction
6. THE System SHALL allow User to proceed with overspending after confirmation
7. THE System SHALL suggest transferring from another Envelope if overspending

### Requirement 14: Envelope Management Improvements

**User Story:** As a user, I want better envelope organization, so that I can manage many envelopes easily.

#### Acceptance Criteria

1. THE System SHALL allow User to reorder Envelopes within Category via drag-and-drop
2. THE System SHALL allow User to archive unused Envelopes instead of deleting
3. THE System SHALL display archived Envelopes in separate section with restore option
4. THE System SHALL prevent deletion of Envelope with transactions (require archive instead)
5. THE System SHALL allow User to merge two Envelopes, combining their allocations and transactions
6. THE System SHALL provide Envelope templates for common categories (Groceries, Rent, etc.)

### Requirement 15: Data Migration and Validation

**User Story:** As a developer, I want safe data migration from old structure, so that existing users don't lose data.

#### Acceptance Criteria

1. THE System SHALL detect old data format on first load after update
2. THE System SHALL migrate old dual-transaction transfers to single transaction format
3. THE System SHALL migrate old envelope structure to new normalized format with IDs
4. THE System SHALL validate all migrated data for consistency
5. THE System SHALL create backup of old data before migration
6. THE System SHALL log migration errors and allow rollback if critical errors occur
7. THE System SHALL display migration progress to User during process

### Requirement 16: Offline Support and Sync

**User Story:** As a user, I want to use the app offline, so that I can track expenses without internet connection.

#### Acceptance Criteria

1. THE System SHALL cache all user data locally using IndexedDB
2. WHEN offline, THE System SHALL allow User to add/edit transactions
3. THE System SHALL queue offline changes for sync when connection restored
4. WHEN connection is restored, THE System SHALL sync queued changes to Firebase
5. THE System SHALL resolve conflicts using last-write-wins strategy
6. THE System SHALL display offline indicator in UI when not connected
7. THE System SHALL show sync status: synced, syncing, offline, error

### Requirement 17: Performance Optimization

**User Story:** As a user, I want fast app performance, so that I can complete tasks without delays.

#### Acceptance Criteria

1. THE System SHALL render Dashboard in less than 500ms on average device
2. THE System SHALL use React.memo for expensive components to prevent unnecessary re-renders
3. THE System SHALL implement virtual scrolling for transaction lists exceeding 100 items
4. THE System SHALL debounce search and filter operations by 300ms
5. THE System SHALL lazy-load reports and analytics components
6. THE System SHALL cache Firebase queries using React Query or similar
7. THE System SHALL use optimistic updates for all user actions

### Requirement 18: Accessibility Compliance

**User Story:** As a user with disabilities, I want accessible interfaces, so that I can use the app independently.

#### Acceptance Criteria

1. THE System SHALL provide keyboard navigation for all interactive elements
2. THE System SHALL use ARIA labels for all icons and buttons
3. THE System SHALL maintain color contrast ratio of at least 4.5:1 for text
4. THE System SHALL provide focus indicators for all focusable elements
5. THE System SHALL announce dynamic content changes to screen readers
6. THE System SHALL support screen reader navigation through semantic HTML
7. THE System SHALL allow font size adjustment without breaking layout

### Requirement 19: Error Handling and Recovery

**User Story:** As a user, I want clear error messages and recovery options, so that I can resolve issues independently.

#### Acceptance Criteria

1. WHEN Firebase operation fails, THE System SHALL display user-friendly error message
2. THE System SHALL provide retry button for failed operations
3. WHEN data validation fails, THE System SHALL highlight specific fields with errors
4. THE System SHALL log errors to console with context for debugging
5. THE System SHALL prevent data loss by saving to localStorage before risky operations
6. WHEN critical error occurs, THE System SHALL offer export data option
7. THE System SHALL display connection status and auto-retry on network errors

### Requirement 20: Security and Privacy

**User Story:** As a user, I want my financial data protected, so that my privacy is maintained.

#### Acceptance Criteria

1. THE System SHALL enforce Firebase authentication for all data access
2. THE System SHALL use Firestore security rules to prevent unauthorized access
3. THE System SHALL encrypt sensitive data before storing in localStorage
4. THE System SHALL automatically sign out User after 30 days of inactivity
5. THE System SHALL not log sensitive data (amounts, notes) to console in production
6. THE System SHALL provide option to enable biometric authentication on supported devices
7. THE System SHALL allow User to permanently delete all data from account settings

