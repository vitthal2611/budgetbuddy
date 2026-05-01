# Test Data for Improved Envelopes View

## Overview
This document contains test data to demonstrate the minimalist, mobile-first UI improvements to the Envelopes View.

## Test Envelopes

### To add these test envelopes, use the browser console:

```javascript
// Get the current envelopes
const currentEnvelopes = JSON.parse(localStorage.getItem('envelopes') || '[]');

// Test envelopes with different states
const testEnvelopes = [
  // Regular envelopes - Needs
  { name: 'Groceries', category: 'need', envelopeType: 'regular' },
  { name: 'Rent', category: 'need', envelopeType: 'regular' },
  { name: 'Utilities', category: 'need', envelopeType: 'regular' },
  { name: 'Transportation', category: 'need', envelopeType: 'regular' },
  
  // Regular envelopes - Wants
  { name: 'Entertainment', category: 'want', envelopeType: 'regular' },
  { name: 'Dining Out', category: 'want', envelopeType: 'regular' },
  { name: 'Shopping', category: 'want', envelopeType: 'regular' },
  
  // Goal envelopes - Savings
  { 
    name: 'Emergency Fund', 
    category: 'saving', 
    envelopeType: 'goal',
    goalAmount: 100000,
    dueDate: '2026-12-31'
  },
  { 
    name: 'Vacation', 
    category: 'saving', 
    envelopeType: 'goal',
    goalAmount: 50000,
    dueDate: '2026-08-15'
  },
  
  // Annual envelopes - Savings
  { 
    name: 'Insurance', 
    category: 'saving', 
    envelopeType: 'annual',
    annualAmount: 24000,
    monthlyFill: 2000
  },
  { 
    name: 'Car Maintenance', 
    category: 'saving', 
    envelopeType: 'annual',
    annualAmount: 12000,
    monthlyFill: 1000
  }
];

// Merge with existing (avoid duplicates)
const merged = [...currentEnvelopes];
testEnvelopes.forEach(test => {
  if (!merged.some(e => e.name === test.name)) {
    merged.push(test);
  }
});

// Save
localStorage.setItem('envelopes', JSON.stringify(merged));
console.log('✅ Added', merged.length - currentEnvelopes.length, 'test envelopes');
console.log('🔄 Refresh the page to see changes');
```

## Test Transactions

### To add test transactions with different states:

```javascript
// Get current transactions
const currentTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');

// Current date for testing
const today = new Date();
const formatDate = (date) => {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

// Test transactions
const testTransactions = [
  // Income
  {
    id: `${Date.now()}-1`,
    date: formatDate(today),
    type: 'income',
    amount: '75000',
    note: 'Monthly Salary',
    paymentMethod: 'Bank Account'
  },
  
  // Expenses - Groceries (high usage)
  {
    id: `${Date.now()}-2`,
    date: formatDate(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)),
    type: 'expense',
    amount: '3500',
    note: 'Weekly groceries',
    envelope: 'Groceries',
    paymentMethod: 'Credit Card'
  },
  {
    id: `${Date.now()}-3`,
    date: formatDate(new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000)),
    type: 'expense',
    amount: '2800',
    note: 'Vegetables and fruits',
    envelope: 'Groceries',
    paymentMethod: 'Cash'
  },
  
  // Expenses - Rent (paid)
  {
    id: `${Date.now()}-4`,
    date: formatDate(new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)),
    type: 'expense',
    amount: '15000',
    note: 'Monthly rent',
    envelope: 'Rent',
    paymentMethod: 'Bank Account'
  },
  
  // Expenses - Entertainment (moderate)
  {
    id: `${Date.now()}-5`,
    date: formatDate(new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000)),
    type: 'expense',
    amount: '1200',
    note: 'Movie tickets',
    envelope: 'Entertainment',
    paymentMethod: 'Credit Card'
  },
  
  // Expenses - Dining Out (recent)
  {
    id: `${Date.now()}-6`,
    date: formatDate(today),
    type: 'expense',
    amount: '850',
    note: 'Lunch with friends',
    envelope: 'Dining Out',
    paymentMethod: 'Credit Card'
  },
  
  // Goal savings
  {
    id: `${Date.now()}-7`,
    date: formatDate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)),
    type: 'expense',
    amount: '5000',
    note: 'Emergency fund contribution',
    envelope: 'Emergency Fund',
    paymentMethod: 'Bank Account'
  }
];

// Merge
const mergedTx = [...currentTransactions, ...testTransactions];
localStorage.setItem('transactions', JSON.stringify(mergedTx));
console.log('✅ Added', testTransactions.length, 'test transactions');
console.log('🔄 Refresh the page to see changes');
```

## Test Budget Allocations

### To add budget fills for the current month:

```javascript
// Get current budgets
const currentBudgets = JSON.parse(localStorage.getItem('budgets') || '{}');

// Current month key
const today = new Date();
const monthKey = `${today.getFullYear()}-${today.getMonth()}`;

// Test budget fills
const testBudgetFills = {
  'Groceries': 8000,
  'Rent': 15000,
  'Utilities': 3000,
  'Transportation': 4000,
  'Entertainment': 2500,
  'Dining Out': 3000,
  'Shopping': 2000,
  'Emergency Fund': 5000,
  'Vacation': 3000,
  'Insurance': 2000,
  'Car Maintenance': 1000
};

// Merge with existing month data
currentBudgets[monthKey] = {
  ...(currentBudgets[monthKey] || {}),
  ...testBudgetFills
};

localStorage.setItem('budgets', JSON.stringify(currentBudgets));
console.log('✅ Added budget fills for', Object.keys(testBudgetFills).length, 'envelopes');
console.log('🔄 Refresh the page to see changes');
```

## Expected UI States After Adding Test Data

### 1. **Filled Envelopes** (with spending)
- Groceries: ₹8,000 filled, ₹6,300 spent → ₹1,700 remaining (yellow/warning)
- Rent: ₹15,000 filled, ₹15,000 spent → ₹0 remaining (green/ok)
- Entertainment: ₹2,500 filled, ₹1,200 spent → ₹1,300 remaining (green/ok)
- Dining Out: ₹3,000 filled, ₹850 spent → ₹2,150 remaining (green/ok)

### 2. **Unfilled Envelopes** (visible but grayed out)
- Utilities: Not filled yet
- Transportation: Not filled yet
- Shopping: Not filled yet

### 3. **Goal Envelopes** (with pace indicators)
- Emergency Fund: ₹5,000 filled, ₹5,000 saved → Shows 🎯 or ⚠️ based on target
- Vacation: ₹3,000 filled, ₹0 spent → Shows pace icon

### 4. **Annual Envelopes** (with pace indicators)
- Insurance: ₹2,000 filled (monthly from ₹24,000/year)
- Car Maintenance: ₹1,000 filled (monthly from ₹12,000/year)

## UI Improvements Demonstrated

1. ✅ **Simplified Header** - Only "Ready to Assign" amount shown prominently
2. ✅ **All Envelopes Visible** - Including unfilled ones (grayed out)
3. ✅ **Cleaner Cards** - No redundant spent/filled text
4. ✅ **Pace Icons** - Simple 🎯/⚠️/✅ instead of verbose text
5. ✅ **Single Tap** - Tap to expand, see actions
6. ✅ **Touch-Friendly** - All buttons 44px+ height
7. ✅ **Recently Used Sorting** - Most recent transactions appear first

## Clean Up Test Data

```javascript
// To remove test data and start fresh:
localStorage.removeItem('envelopes');
localStorage.removeItem('transactions');
localStorage.removeItem('budgets');
console.log('✅ Cleared all test data');
console.log('🔄 Refresh the page');
```
