# Visual User Guide - CSV Import

## 📥 How to Import Transactions

### Step-by-Step Visual Guide

---

## Step 1: Access Import Feature

```
┌─────────────────────────────────────────────────────────┐
│  BudgetBuddy                                            │
├─────────────────────────────────────────────────────────┤
│  [Dashboard] [Transactions] [Budget]                    │
│                    ↑                                     │
│              Click here first                            │
└─────────────────────────────────────────────────────────┘

Then look for:

┌─────────────────────────────────────────────────────────┐
│  Transactions                    [📥 Import] [🔍 Filters]│
│                                       ↑                  │
│                                  Click here              │
└─────────────────────────────────────────────────────────┘
```

---

## Step 2: Upload Your CSV File

```
┌─────────────────────────────────────────────────────────┐
│  Import Transactions                               [×]   │
├─────────────────────────────────────────────────────────┤
│  ● Upload    ○ Map Columns    ○ Preview                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│         ┌───────────────────────────────────┐          │
│         │                                   │          │
│         │            📁                     │          │
│         │                                   │          │
│         │   Click to upload CSV file        │          │
│         │     or drag and drop              │          │
│         │                                   │          │
│         └───────────────────────────────────┘          │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │     [⬇️ Download CSV Template]                 │    │
│  │                                                │    │
│  │  Not sure how to format your CSV?             │    │
│  │  Download our template with sample data!      │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Expected CSV Format:                                   │
│  • Date (DD-MM-YYYY or YYYY-MM-DD)                     │
│  • Amount (numbers, can include currency symbols)       │
│  • Note/Description (optional)                          │
│  • Type (income/expense/transfer - optional)           │
│  • Payment Method (optional)                            │
│  • Envelope/Category (optional)                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**What to do:**
1. **Option A**: Click "Download CSV Template" to get a sample file
   - Open the downloaded file in Excel or any spreadsheet app
   - Replace sample data with your own transactions
   - Save the file
2. **Option B**: Use your own CSV file
3. Click the upload area OR drag your CSV file onto it
4. Select your CSV file from your computer
5. Wait for the file to be processed

---

## Step 3: Map Your Columns

```
┌─────────────────────────────────────────────────────────┐
│  Import Transactions                               [×]   │
├─────────────────────────────────────────────────────────┤
│  ● Upload    ● Map Columns    ○ Preview                 │
├─────────────────────────────────────────────────────────┤
│  Map Your Columns                                        │
│  Match your CSV columns to transaction fields            │
│                                                          │
│  Date *              [Transaction Date    ▼]            │
│  Amount *            [Amount              ▼]            │
│  Note                [Description         ▼]            │
│  Type                [Category            ▼]            │
│  Payment Method      [Account             ▼]            │
│  Envelope            [Budget              ▼]            │
│                                                          │
│  Sample Data Preview:                                    │
│  ┌────────────────────────────────────────────────┐    │
│  │ Row 1:                                         │    │
│  │ Transaction Date: 01-01-2025                   │    │
│  │ Amount: 5000                                   │    │
│  │ Description: Salary                            │    │
│  │ ...                                            │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  [← Back]                                  [Next →]     │
└─────────────────────────────────────────────────────────┘
```

**What to do:**
1. Review the auto-detected mappings (usually correct!)
2. Adjust any incorrect mappings using the dropdowns
3. Make sure Date and Amount are mapped (required)
4. Check the sample data preview to verify
5. Click "Next" when ready

---

## Step 4: Preview & Confirm

```
┌─────────────────────────────────────────────────────────┐
│  Import Transactions                               [×]   │
├─────────────────────────────────────────────────────────┤
│  ● Upload    ● Map Columns    ● Preview                 │
├─────────────────────────────────────────────────────────┤
│  Preview & Confirm                                       │
│                                                          │
│  ✅ New Items to Create:                                │
│  ┌────────────────────────────────────────────────┐    │
│  │ New Envelopes (3): Groceries, Food, Health    │    │
│  │ New Payment Methods (2): Credit Card, PayPal  │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Summary:                                                │
│  ┌──────────┬──────────┬──────────┬──────────┐         │
│  │  Total   │  Income  │ Expense  │ Transfer │         │
│  │    25    │    8     │    15    │    2     │         │
│  └──────────┴──────────┴──────────┴──────────┘         │
│                                                          │
│  Preview Table:                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │Date      │Type   │Amount│Note      │Method│×  │    │
│  ├────────────────────────────────────────────────┤    │
│  │01-01-2025│💰Income│₹5000│Salary    │Bank  │×  │    │
│  │15-01-2025│💸Expense│₹500│Groceries │Card  │×  │    │
│  │20-01-2025│🔄Transfer│₹100│Savings  │Bank  │×  │    │
│  │...                                             │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  [← Back]              [Import 25 Transactions →]       │
└─────────────────────────────────────────────────────────┘
```

**What to do:**
1. Review the summary statistics
2. Check new envelopes and payment methods
3. Scroll through the preview table
4. Click × to remove any unwanted transactions
5. Click "Import" when everything looks good

---

## Step 5: Success!

```
┌─────────────────────────────────────────────────────────┐
│  Transactions                    [📥 Import] [🔍 Filters]│
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ✅ Successfully imported 25 transactions!               │
│                                                          │
│  Total: 25    Income: ₹40,000    Expense: ₹15,000      │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ 💰  Salary                          +₹5,000    │    │
│  │     01-01-2025 • Bank Account • Income         │    │
│  ├────────────────────────────────────────────────┤    │
│  │ 💸  Grocery Shopping                -₹500      │    │
│  │     15-01-2025 • Credit Card • Groceries       │    │
│  ├────────────────────────────────────────────────┤    │
│  │ 🔄  Transfer to Savings             ₹100       │    │
│  │     20-01-2025 • Bank → Savings • Transfer     │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**What happened:**
- All transactions were imported
- New envelopes were created
- New payment methods were added
- Everything is saved automatically

---

## 📋 CSV Format Examples

### Example 1: Simple Format
```csv
Date,Amount,Note
01-01-2025,5000,Salary
15-01-2025,-500,Groceries
20-01-2025,-100,Coffee
```

### Example 2: Complete Format
```csv
Date,Amount,Type,Note,Payment Method,Envelope
01-01-2025,5000,income,January Salary,Bank Account,
15-01-2025,-500,expense,Grocery Shopping,Credit Card,Groceries
20-01-2025,-100,transfer,Transfer to Savings,Bank Account,Savings Account
```

### Example 3: Bank Export Format
```csv
Transaction Date,Amount,Description,Account
2025-01-01,5000.00,Salary Deposit,Checking Account
2025-01-15,-500.00,Supermarket Purchase,Credit Card
2025-01-20,-100.00,ATM Withdrawal,Checking Account
```

---

## 💡 Pro Tips

### Tip 0: Use the Template!
🎯 **Best for beginners**: Click "Download CSV Template" in the import screen
- Get a ready-to-use CSV file
- See examples of all transaction types
- Just replace the sample data with yours
- Upload and you're done!

### Tip 1: Date Formats
✅ Supported:
- 01-01-2025 (DD-MM-YYYY)
- 01/01/2025 (DD/MM/YYYY)
- 2025-01-01 (YYYY-MM-DD)
- 2025/01/01 (YYYY/MM/DD)

### Tip 2: Amount Signs
- Positive numbers (5000) → Income
- Negative numbers (-500) → Expense
- Add a Type column for transfers

### Tip 3: Currency Symbols
Don't worry about currency symbols!
- ₹5000 → Works ✅
- $5000 → Works ✅
- 5,000 → Works ✅
- 5000.00 → Works ✅

### Tip 4: New Categories
The app will automatically create:
- New envelopes (with "need" category)
- New payment methods
You can change categories later in Budget Allocation!

### Tip 5: Preview Before Import
Always review the preview:
- Check transaction counts
- Verify amounts
- Remove unwanted transactions
- Confirm new items

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Invalid date format"
**Problem:** Date not recognized
**Solution:** Use DD-MM-YYYY or YYYY-MM-DD format

### Issue 2: "Invalid amount"
**Problem:** Amount not recognized
**Solution:** Make sure amounts are numbers (symbols are OK)

### Issue 3: Wrong transaction type
**Problem:** Income showing as expense
**Solution:** Add a Type column or use positive/negative amounts

### Issue 4: Missing envelope
**Problem:** Expense has no envelope
**Solution:** Add an Envelope column or it will use "Uncategorized"

### Issue 5: Can't find Import button
**Problem:** Import button not visible
**Solution:** Make sure you're on the Transactions tab

---

## 🎯 Quick Checklist

Before importing:
- [ ] CSV file has header row
- [ ] Date column exists
- [ ] Amount column exists
- [ ] Dates are in correct format
- [ ] Amounts are numbers

During import:
- [ ] Column mappings look correct
- [ ] Sample data preview looks good
- [ ] Date and Amount are mapped

After preview:
- [ ] Transaction count is correct
- [ ] Income/expense split looks right
- [ ] New envelopes are acceptable
- [ ] No unwanted transactions

---

## 🚀 You're Ready!

Now you know how to:
1. ✅ Access the import feature
2. ✅ Upload a CSV file
3. ✅ Map columns correctly
4. ✅ Preview and confirm
5. ✅ Handle common issues

**Try it now with the sample file:**
`sample-transactions.csv`

**Need more help?**
- Quick guide: `QUICK_START_IMPORT.md`
- Detailed guide: `IMPORT_FEATURE_GUIDE.md`
- Technical docs: `CSV_IMPORT_IMPLEMENTATION.md`

---

**Happy Importing! 🎉**
