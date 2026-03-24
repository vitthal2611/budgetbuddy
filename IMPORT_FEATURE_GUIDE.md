# CSV Import Feature Guide

## Overview
The BudgetBuddy app now supports importing transactions from CSV files. This feature allows you to bulk import income, expenses, and transfers with automatic column mapping and validation.

## Features

### 1. CSV Upload
- Upload CSV files with transaction data
- Automatic column detection
- Support for various date formats

### 2. Smart Column Mapping
- Auto-detect common column names (Date, Amount, Type, etc.)
- Manual column mapping interface
- Preview sample data before mapping

### 3. Data Validation
- Date format validation (DD-MM-YYYY, YYYY-MM-DD)
- Amount parsing (handles currency symbols)
- Transaction type detection
- Required field validation

### 4. Preview & Confirmation
- Preview all transactions before import
- See summary statistics (income, expense, transfer counts)
- Identify new envelopes and payment methods
- Remove individual transactions from import
- Error reporting for invalid rows

### 5. Auto-Creation
- Automatically creates new envelopes
- Automatically creates new payment methods
- Smart category assignment

## CSV Format

### Required Columns
- **Date**: Transaction date (DD-MM-YYYY or YYYY-MM-DD)
- **Amount**: Transaction amount (positive for income, negative for expense)

### Optional Columns
- **Type**: Transaction type (income/expense/transfer)
- **Note**: Description or memo
- **Payment Method**: Account or payment method name
- **Envelope**: Category or envelope name (for expenses)

### Sample CSV

```csv
Date,Amount,Type,Note,Payment Method,Envelope
01-01-2025,5000,income,January Salary,Bank Account,
15-01-2025,-500,expense,Grocery Shopping,Credit Card,Groceries
20-01-2025,-100,transfer,Transfer to Savings,Bank Account,Savings Account
```

## How to Use

### Step 1: Prepare Your CSV
1. Export transactions from your bank or create a CSV file
2. Ensure you have at least Date and Amount columns
3. Use consistent date format throughout

### Step 2: Upload
1. Go to the Transactions tab
2. Click the "📥 Import" button
3. Select your CSV file

### Step 3: Map Columns
1. Review auto-detected column mappings
2. Adjust mappings if needed
3. Date and Amount are required fields
4. Preview sample data to verify mappings

### Step 4: Preview & Confirm
1. Review all parsed transactions
2. Check for errors or warnings
3. See new envelopes and payment methods that will be created
4. Remove any unwanted transactions
5. Click "Import" to complete

## Tips

### Date Formats
Supported formats:
- DD-MM-YYYY (e.g., 15-01-2025)
- DD/MM/YYYY (e.g., 15/01/2025)
- YYYY-MM-DD (e.g., 2025-01-15)
- YYYY/MM/DD (e.g., 2025/01/15)

### Amount Handling
- Positive amounts are treated as income
- Negative amounts are treated as expenses
- Currency symbols (₹, $, etc.) are automatically removed
- Commas in amounts are handled correctly

### Transaction Types
If no Type column is provided:
- Positive amounts → Income
- Negative amounts → Expense

For transfers, include a Type column with "transfer" value.

### Envelopes & Payment Methods
- New envelopes are created with "need" category by default
- You can change categories after import in Budget Allocation
- New payment methods are added automatically
- Existing names are matched case-sensitively

## Validation Rules

### Date Validation
- Must be in DD-MM-YYYY format after parsing
- Must be a valid calendar date
- Invalid dates will show error in preview

### Amount Validation
- Must be a valid number
- Cannot be zero
- Negative signs are handled automatically

### Type Validation
- Must be: income, expense, or transfer
- Case-insensitive matching
- Auto-detected if not provided

### Transfer Validation
- Requires source and destination accounts
- Source and destination must be different
- Uses Payment Method column for source
- Uses Envelope column for destination

## Error Handling

### Common Errors
1. **Invalid date format**: Check date format matches DD-MM-YYYY or YYYY-MM-DD
2. **Invalid amount**: Ensure amounts are numeric
3. **Missing required fields**: Date and Amount are required
4. **Duplicate transactions**: Review preview for duplicates

### Error Display
- Errors shown in preview step
- Row numbers indicated for easy reference
- Invalid rows can be skipped
- Valid transactions can still be imported

## Sample File

A sample CSV file (`sample-transactions.csv`) is included in the project root for testing.

**NEW - Download Template Feature**: 
You can now download a CSV template directly from the import interface:
1. Click the Import button in Transactions tab
2. Click "⬇️ Download CSV Template" button
3. Open the downloaded file to see the correct format
4. Replace sample data with your own transactions
5. Upload and import!

The template includes sample data for:
- Income transactions (salary, freelance, bonus)
- Expense transactions (groceries, rent, utilities, etc.)
- Transfer transactions (savings, investments)

## Technical Details

### Components
- **ImportTransactions.js**: Main import component
- **ImportTransactions.css**: Styling
- **DataContext.js**: Enhanced with validation functions

### Validation Functions
- `validateTransaction()`: Validates transaction data
- `isValidDate()`: Checks date format
- `detectDuplicates()`: Finds potential duplicates
- `normalizeAmount()`: Parses and normalizes amounts

### Data Flow
1. File upload → CSV parsing
2. Column mapping → Transaction parsing
3. Validation → Preview
4. Confirmation → Import to app state
5. Auto-save to localStorage

## Future Enhancements

Potential improvements:
- Excel (.xlsx) file support
- Bank-specific import templates
- Duplicate detection and merging
- Bulk edit before import
- Import history and undo
- Export transactions to CSV
- Scheduled imports
- Cloud sync integration

## Troubleshooting

### Import button not visible
- Ensure you're on the Transactions tab
- Check browser console for errors

### Column mapping not working
- Verify CSV has header row
- Check for special characters in headers
- Try manual mapping

### Transactions not importing
- Check browser console for errors
- Verify all required fields are mapped
- Review error messages in preview

### New envelopes not appearing
- Refresh the Budget Allocation page
- Check DataContext for errors
- Verify envelope names are valid

## Support

For issues or questions:
1. Check this guide first
2. Review sample CSV format
3. Test with provided sample file
4. Check browser console for errors
