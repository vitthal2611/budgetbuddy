/**
 * TEST: Default to Current Month/Year Filter
 * 
 * REQUIREMENT:
 * - All views (Envelopes, Transactions, Reports) should default to current month/year
 * - No more "All Months" default selection
 * 
 * TEST DATA:
 * - Transactions across multiple months
 * - Budget allocations for different months
 * - Current month should be pre-selected
 */

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();

// Helper to format date as DD-MM-YYYY
const formatDate = (year, month, day) => {
  return `${String(day).padStart(2, '0')}-${String(month + 1).padStart(2, '0')}-${year}`;
};

// Test transactions across 3 months
const testTransactions = [
  // Last month
  {
    id: 'test-last-1',
    type: 'income',
    amount: 50000,
    note: 'Last Month Salary',
    date: formatDate(currentMonth === 0 ? currentYear - 1 : currentYear, currentMonth === 0 ? 11 : currentMonth - 1, 1),
    paymentMethod: 'HDFC'
  },
  {
    id: 'test-last-2',
    type: 'expense',
    amount: 5000,
    note: 'Last Month Groceries',
    date: formatDate(currentMonth === 0 ? currentYear - 1 : currentYear, currentMonth === 0 ? 11 : currentMonth - 1, 15),
    paymentMethod: 'HDFC',
    envelope: 'Groceries'
  },
  
  // Current month (should be visible by default)
  {
    id: 'test-current-1',
    type: 'income',
    amount: 55000,
    note: 'Current Month Salary',
    date: formatDate(currentYear, currentMonth, 1),
    paymentMethod: 'HDFC'
  },
  {
    id: 'test-current-2',
    type: 'expense',
    amount: 3000,
    note: 'Groceries',
    date: formatDate(currentYear, currentMonth, 5),
    paymentMethod: 'HDFC',
    envelope: 'Groceries'
  },
  {
    id: 'test-current-3',
    type: 'expense',
    amount: 15000,
    note: 'Rent Payment',
    date: formatDate(currentYear, currentMonth, 10),
    paymentMethod: 'HDFC',
    envelope: 'Rent'
  },
  {
    id: 'test-current-4',
    type: 'expense',
    amount: 2000,
    note: 'Electricity Bill',
    date: formatDate(currentYear, currentMonth, 12),
    paymentMethod: 'HDFC',
    envelope: 'Utilities'
  },
  
  // Next month
  {
    id: 'test-next-1',
    type: 'expense',
    amount: 1000,
    note: 'Next Month Advance',
    date: formatDate(currentMonth === 11 ? currentYear + 1 : currentYear, currentMonth === 11 ? 0 : currentMonth + 1, 5),
    paymentMethod: 'HDFC',
    envelope: 'Miscellaneous'
  }
];

// Test budgets for multiple months
const testBudgets = {
  // Last month budget
  [`${currentMonth === 0 ? currentYear - 1 : currentYear}-${currentMonth === 0 ? 11 : currentMonth - 1}`]: {
    'Groceries': 8000,
    'Rent': 15000,
    'Utilities': 3000,
    'Transport': 2000
  },
  
  // Current month budget (should be visible by default)
  [`${currentYear}-${currentMonth}`]: {
    'Groceries': 8000,
    'Rent': 15000,
    'Utilities': 3000,
    'Transport': 2500,
    'Entertainment': 2000
  },
  
  // Next month budget
  [`${currentMonth === 11 ? currentYear + 1 : currentYear}-${currentMonth === 11 ? 0 : currentMonth + 1}`]: {
    'Groceries': 8500,
    'Rent': 15000,
    'Utilities': 3000
  }
};

// Test envelopes
const testEnvelopes = [
  { name: 'Groceries', category: 'need' },
  { name: 'Rent', category: 'need' },
  { name: 'Utilities', category: 'need' },
  { name: 'Transport', category: 'need' },
  { name: 'Entertainment', category: 'want' },
  { name: 'Miscellaneous', category: 'want' }
];

/**
 * EXPECTED BEHAVIOR:
 * 
 * 1. EnvelopesView:
 *    - Should show current month/year by default
 *    - Should display: Groceries (₹5,000 left), Rent (₹0 left), Utilities (₹1,000 left)
 *    - Ready to Assign should show: ₹55,000 - ₹38,500 = ₹16,500
 * 
 * 2. Transactions View:
 *    - Should filter to current month by default
 *    - Should show 4 transactions (1 income + 3 expenses)
 *    - Should NOT show last month or next month transactions
 *    - Month selector should show current month name
 * 
 * 3. Reports View:
 *    - Should show current month/year by default
 *    - Income: ₹55,000
 *    - Expenses: ₹20,000
 *    - Net: ₹35,000
 * 
 * 4. Fill Envelopes Modal:
 *    - Should allow direct budget amount entry
 *    - Each envelope should have an input field
 *    - "Copy Last Month" button should remain available
 * 
 * TESTING STEPS:
 * 1. Import this test data
 * 2. Navigate to Envelopes view - verify current month is selected
 * 3. Navigate to Transactions view - verify current month filter
 * 4. Navigate to Reports view - verify current month data
 * 5. Click "Fill Envelopes" - verify direct input fields work
 * 6. Change month using dropdown - verify data updates correctly
 */

console.log('Test Data Generated for Current Month:', {
  currentYear,
  currentMonth: currentMonth + 1, // Display as 1-12
  monthName: new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' }),
  transactionsCount: testTransactions.length,
  currentMonthTransactions: testTransactions.filter(t => t.date.includes(`-${String(currentMonth + 1).padStart(2, '0')}-${currentYear}`)).length,
  budgetKey: `${currentYear}-${currentMonth}`
});

// Export for use in app
export { testTransactions, testBudgets, testEnvelopes };
