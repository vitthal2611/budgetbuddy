# CSV Import Flow Diagram

## Visual Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER STARTS IMPORT                        │
│                    (Clicks Import Button)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         STEP 1: UPLOAD                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         📁 Click to upload CSV file                      │   │
│  │              or drag and drop                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Expected CSV Format:                                            │
│  • Date (DD-MM-YYYY or YYYY-MM-DD)                              │
│  • Amount (numbers, can include currency symbols)               │
│  • Note/Description (optional)                                   │
│  • Type (income/expense/transfer - optional)                    │
│  • Payment Method (optional)                                     │
│  • Envelope/Category (optional)                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Parse CSV     │
                    │  Extract       │
                    │  Headers       │
                    └────────┬───────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 2: MAP COLUMNS                           │
├─────────────────────────────────────────────────────────────────┤
│  Auto-Detected Mappings:                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Date *          → [Select column...]                    │   │
│  │  Amount *        → [Select column...]                    │   │
│  │  Note            → [Select column...]                    │   │
│  │  Type            → [Select column...]                    │   │
│  │  Payment Method  → [Select column...]                    │   │
│  │  Envelope        → [Select column...]                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Sample Data Preview:                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Row 1: Date: 01-01-2025, Amount: 5000, ...            │   │
│  │  Row 2: Date: 15-01-2025, Amount: -500, ...            │   │
│  │  Row 3: Date: 20-01-2025, Amount: -100, ...            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  [Back]                                          [Next →]        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Parse Each    │
                    │  Row into      │
                    │  Transaction   │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Validate      │
                    │  Each          │
                    │  Transaction   │
                    └────────┬───────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
         ┌──────────┐              ┌──────────┐
         │  Valid   │              │  Invalid │
         │  Trans.  │              │  Trans.  │
         └────┬─────┘              └────┬─────┘
              │                         │
              │                         ▼
              │                  ┌──────────────┐
              │                  │ Error List   │
              │                  │ with Row #s  │
              │                  └──────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   STEP 3: PREVIEW & CONFIRM                      │
├─────────────────────────────────────────────────────────────────┤
│  ⚠️ Errors Found (if any):                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • Row 5: Invalid date format                           │   │
│  │  • Row 12: Invalid amount                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ✅ New Items to Create:                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  New Envelopes (3): Groceries, Entertainment, Health    │   │
│  │  New Payment Methods (2): Credit Card, PayPal           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Summary Statistics:                                             │
│  ┌──────────┬──────────┬──────────┬──────────┐                 │
│  │  Total   │  Income  │ Expense  │ Transfer │                 │
│  │    25    │    8     │    15    │    2     │                 │
│  └──────────┴──────────┴──────────┴──────────┘                 │
│                                                                   │
│  Preview Table:                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Date       │Type    │Amount │Note        │Method │Env.  │×│ │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 01-01-2025 │💰Income│₹5000  │Salary      │Bank   │-     │×│ │
│  │ 15-01-2025 │💸Expense│₹500  │Groceries   │Card   │Food  │×│ │
│  │ 20-01-2025 │🔄Transfer│₹100 │Savings     │Bank→Save│-  │×│ │
│  │ ...                                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  [← Back]                    [Import 25 Transactions →]         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  User Confirms │
                    │  Import        │
                    └────────┬───────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      IMPORT PROCESSING                           │
├─────────────────────────────────────────────────────────────────┤
│  1. Create New Envelopes                                         │
│     └─ Add to DataContext with "need" category                  │
│                                                                   │
│  2. Create New Payment Methods                                   │
│     └─ Add to DataContext                                        │
│                                                                   │
│  3. Add Transactions to App State                                │
│     └─ Merge with existing transactions                          │
│                                                                   │
│  4. Save to LocalStorage                                         │
│     └─ Persist all data                                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       IMPORT COMPLETE                            │
│                                                                   │
│  ✅ Successfully imported 25 transactions                        │
│  ✅ Created 3 new envelopes                                      │
│  ✅ Created 2 new payment methods                                │
│                                                                   │
│  → Redirected to Transactions page                               │
│  → All imported transactions visible                             │
└─────────────────────────────────────────────────────────────────┘
```

## Data Transformation Flow

```
CSV Row:
┌──────────────────────────────────────────────────────────┐
│ 01-01-2025, 5000, income, Salary, Bank Account,         │
└──────────────────────────────────────────────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  Column Mapping │
              └────────┬────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
    Date Field    Amount Field   Type Field
        │              │              │
        ▼              ▼              ▼
   parseDate()   normalizeAmount()  Detect Type
        │              │              │
        ▼              ▼              ▼
  DD-MM-YYYY      Absolute Value   income/expense
        │              │              │
        └──────────────┼──────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Transaction    │
              │  Object         │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Validation     │
              └────────┬────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
            ▼                     ▼
      ✅ Valid              ❌ Invalid
            │                     │
            ▼                     ▼
    Add to Parsed          Add to Errors
    Transactions           with Row #
```

## Validation Flow

```
Transaction Object
        │
        ▼
┌───────────────┐
│ Date Valid?   │
└───────┬───────┘
        │ Yes
        ▼
┌───────────────┐
│ Amount Valid? │
└───────┬───────┘
        │ Yes
        ▼
┌───────────────┐
│ Type Valid?   │
└───────┬───────┘
        │ Yes
        ▼
┌───────────────┐
│ Note Present? │
└───────┬───────┘
        │ Yes
        ▼
┌───────────────────┐
│ Type-Specific     │
│ Validation        │
└───────┬───────────┘
        │
        ├─ Income/Expense: Payment Method?
        │                  Envelope (if expense)?
        │
        └─ Transfer: Source Account?
                    Destination Account?
                    Different accounts?
        │
        ▼
┌───────────────┐
│ All Valid?    │
└───────┬───────┘
        │
    ┌───┴───┐
    │       │
    ▼       ▼
  ✅ Pass  ❌ Fail
    │       │
    │       └─→ Collect Errors
    │
    └─→ Add to Valid List
```

## Error Handling Flow

```
Parse Error
    │
    ├─ Invalid CSV Format
    │  └─→ Show alert, return to upload
    │
    ├─ Missing Headers
    │  └─→ Show alert, return to upload
    │
    └─ Malformed Rows
       └─→ Skip row, continue parsing

Validation Error
    │
    ├─ Invalid Date
    │  └─→ Add to error list with row #
    │
    ├─ Invalid Amount
    │  └─→ Add to error list with row #
    │
    ├─ Missing Required Field
    │  └─→ Add to error list with row #
    │
    └─ Type-Specific Error
       └─→ Add to error list with row #

Display Errors
    │
    ├─ Show error summary panel
    ├─ List all errors with row numbers
    ├─ Allow user to proceed with valid rows
    └─ Option to go back and fix CSV
```

## State Management Flow

```
Component State
    │
    ├─ step (1, 2, or 3)
    ├─ csvData (array of row objects)
    ├─ headers (array of column names)
    ├─ columnMapping (object)
    ├─ parsedTransactions (array)
    ├─ errors (array)
    ├─ newEnvelopes (Set)
    └─ newPaymentMethods (Set)

DataContext State
    │
    ├─ envelopes (array)
    ├─ paymentMethods (array)
    └─ validation functions

App State
    │
    ├─ transactions (array)
    ├─ budgets (object)
    └─ event listeners

LocalStorage
    │
    ├─ transactions
    ├─ budgets
    ├─ envelopes
    └─ paymentMethods
```

## User Interaction Flow

```
User Action                    System Response
    │                              │
    ├─ Click Import Button    →   Show Modal (Step 1)
    │                              │
    ├─ Upload CSV File        →   Parse CSV
    │                              Auto-detect Mapping
    │                              Show Step 2
    │                              │
    ├─ Adjust Mappings        →   Update Preview
    │                              │
    ├─ Click Next             →   Parse Transactions
    │                              Validate Data
    │                              Show Step 3
    │                              │
    ├─ Review Preview         →   Display Statistics
    │                              Show Errors
    │                              List New Items
    │                              │
    ├─ Remove Transaction     →   Update Preview
    │                              Recalculate Stats
    │                              │
    ├─ Click Import           →   Create New Items
    │                              Add Transactions
    │                              Save to Storage
    │                              Close Modal
    │                              │
    └─ View Transactions      →   Show All Transactions
                                   Including Imported
```

## Performance Considerations

```
Optimization Points:
    │
    ├─ CSV Parsing
    │  └─ Stream processing for large files
    │
    ├─ Validation
    │  └─ Batch validation, not per-keystroke
    │
    ├─ Preview Rendering
    │  └─ Virtual scrolling for 100+ rows
    │
    ├─ State Updates
    │  └─ Batch updates, minimize re-renders
    │
    └─ Storage
       └─ Debounced localStorage writes
```

---

This diagram provides a comprehensive visual representation of the CSV import flow, from user interaction to data persistence.
