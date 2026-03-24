# BudgetBuddy

A modern, mobile-friendly personal finance tracker built with React.

## Features

- Track Income, Expenses, and Transfers
- **CSV Import**: Bulk import transactions from CSV files with smart column mapping
- Dashboard with monthly overview
- Account balance tracking
- Envelope budgeting system with categories (Need, Want, Saving)
- Budget allocation by month and yearly view
- Transaction history with filtering and search
- Edit and delete transactions
- Responsive mobile-first design
- Local storage persistence
- Auto-creation of envelopes and payment methods

## Installation

```bash
npm install
```

## Run the App

```bash
npm start
```

The app will open at http://localhost:3000

## Usage

### Dashboard
- View income/expense summary for selected month/year
- See account balances across payment methods
- Track envelope spending against budgets
- Quick action buttons to add transactions

### Transactions
- View all transactions sorted by date
- **Import CSV**: Bulk import transactions with automatic validation
- Filter by type, date, payment method, and envelope
- Search transactions by note or amount
- Edit or delete existing transactions
- Income shown as positive, expenses as negative
- Transfers show source → destination accounts

### CSV Import
- Upload CSV files with transaction data
- Smart column mapping with auto-detection
- Preview transactions before importing
- Automatic validation and error reporting
- Auto-create new envelopes and payment methods
- Support for multiple date formats
- See [QUICK_START_IMPORT.md](QUICK_START_IMPORT.md) for quick guide
- See [IMPORT_FEATURE_GUIDE.md](IMPORT_FEATURE_GUIDE.md) for detailed documentation

### Budget Allocation
- Set monthly budgets for each envelope
- View income and unallocated amounts
- Track total allocations across the year
- Switch between monthly and yearly views
- Manage envelopes with categories (Need 🛒, Want 🎉, Saving 💰)

## Sample Data

Two sample CSV files are included for testing the import feature:
- `sample-transactions.csv`: Basic example with 14 transactions
- `sample-transactions-advanced.csv`: Advanced example with 35+ transactions

## Documentation

- [Quick Start Import Guide](QUICK_START_IMPORT.md) - Get started with CSV imports
- [Import Feature Guide](IMPORT_FEATURE_GUIDE.md) - Comprehensive import documentation
- [Implementation Details](CSV_IMPORT_IMPLEMENTATION.md) - Technical documentation

## Build for Production

```bash
npm run build
```
