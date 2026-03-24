# Quick Start: Import Transactions

## 🚀 Get Started in 3 Steps

### Step 1: Click Import Button
Navigate to the **Transactions** tab and click the green **📥 Import** button in the top right.

### Step 2: Download Template (Optional)
Click **⬇️ Download CSV Template** to get a sample CSV file with example transactions for all types (income, expense, transfer).

### Step 3: Upload Your CSV
Click to upload or drag and drop your CSV file. Your file should have:
- A header row with column names
- At least Date and Amount columns

### Step 4: Map & Import
1. Review the auto-detected column mappings
2. Adjust if needed (Date and Amount are required)
3. Preview your transactions
4. Click "Import" to add them to your budget

## 📋 CSV Template

```csv
Date,Amount,Type,Note,Payment Method,Envelope
01-01-2025,5000,income,Salary,Bank Account,
15-01-2025,-500,expense,Groceries,Credit Card,Food
```

## 💡 Quick Tips

- **Positive amounts** = Income
- **Negative amounts** = Expense  
- **Date formats**: DD-MM-YYYY or YYYY-MM-DD
- **New categories**: Automatically created during import
- **Preview first**: Review everything before importing

## 🎯 Example Use Cases

### Bank Statement Import
Export your bank statement as CSV, map columns, and import all transactions at once.

### Expense Tracking
Keep a spreadsheet of daily expenses, then bulk import weekly or monthly.

### Migration
Moving from another app? Export your data and import it into BudgetBuddy.

### Shared Expenses
Collect expenses from family members in a shared spreadsheet, then import.

## ⚠️ Common Issues

**Problem**: Date format error  
**Solution**: Use DD-MM-YYYY or YYYY-MM-DD format

**Problem**: Amount not recognized  
**Solution**: Remove currency symbols or let the parser handle them

**Problem**: Wrong transaction type  
**Solution**: Add a Type column with "income", "expense", or "transfer"

## 📁 Sample File

Use `sample-transactions.csv` in the project root to test the import feature.

## 🔧 Advanced Features

- **Smart Mapping**: Automatically detects common column names
- **Validation**: Checks data before import
- **Error Handling**: Shows which rows have issues
- **Preview**: See exactly what will be imported
- **Selective Import**: Remove unwanted transactions before importing
- **Auto-Creation**: New envelopes and payment methods created automatically

---

**Need more help?** Check out `IMPORT_FEATURE_GUIDE.md` for detailed documentation.
