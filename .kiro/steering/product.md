# Product Overview

BudgetBuddy is a zero-based budgeting web application that helps users manage personal finances using the envelope budgeting method. Every rupee must have a job.

## Target Users

- Individuals practicing zero-based budgeting
- Families managing shared household expenses
- Anyone seeking intentional spending habits
- Users familiar with Goodbudget methodology

## Core Concept

Users allocate their income into virtual "envelopes" (budget categories) at the start of each month. The goal is to make unallocated money equal to zero, ensuring every rupee is assigned a purpose before spending.

**Currency**: Currently optimized for Indian Rupee (₹).

## Key Features

- Envelope-based budgeting with three categories: Needs, Wants, and Savings
- Real-time transaction tracking (income, expenses, transfers)
- Monthly budget allocation and reallocation
- Visual spending progress with remaining balance emphasis
- CSV transaction import/export
- Firebase authentication and cloud sync with offline support
- Multi-device synchronization

## User Flow

1. Create envelopes for different spending categories
2. Log income transactions
3. Allocate income across envelopes (target: ₹0 unallocated)
4. Log expenses and see remaining balance in real-time
5. Transfer money between envelopes as needed
6. Review spending patterns and adjust next month

## Design Philosophy

- **Remaining-first**: Focus on "remaining balance" rather than "amount spent"
- **Proactive warnings**: Provide warnings before overspending, not after
- **Zero friction**: Enable quick decisions without mental math
- **Offline-first**: Support offline-first with cloud sync for reliability
- **Data integrity**: Maintain data integrity across devices with conflict resolution
- **Goodbudget-inspired**: Follow proven envelope budgeting methodology

## Current Limitations

- Single currency support (₹)
- Manual transaction entry (no bank integration)
- Web-only (no native mobile apps)
- Requires internet for initial sync (offline-first after)

## Success Metrics

Users are successful when they:
- Achieve ₹0 unallocated at month start
- Check remaining balance before spending
- Transfer between envelopes instead of overspending
- Maintain consistent logging habits
- Reduce financial stress through planning

## Related Documentation

- [Quick Start Guide](../../../QUICK_START.md) - User onboarding
- [Zero-Based Budgeting Guide](../../../ZERO_BASED_BUDGETING_GUIDE.md) - Methodology
- [Goodbudget Flow](../../../GOODBUDGET_FLOW_IMPLEMENTATION.md) - Feature details
- [Requirements Spec](../specs/goodbudget-refactor/requirements.md) - Technical requirements
