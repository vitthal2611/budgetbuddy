/**
 * TEST: Improved Envelope UI - Larger Cards, Less Taps
 * 
 * IMPROVEMENTS IMPLEMENTED:
 * 1. Larger cards with generous spacing (20px padding)
 * 2. All information visible upfront - NO expand/collapse
 * 3. Category icon prominently displayed (24px)
 * 4. 3-column amounts grid: Budget | Spent | Left
 * 5. Budget input always visible inline
 * 6. Action buttons always visible (Add Expense | Transactions)
 * 7. Thicker progress bar (8px vs 6px)
 * 8. Better visual hierarchy with larger typography
 * 9. Cleaner card design with rounded corners and shadows
 * 10. More whitespace between cards (16px margin)
 * 
 * ZERO TAPS NEEDED:
 * - See all info at a glance
 * - Edit budget directly
 * - Quick actions immediately accessible
 */

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();

const formatDate = (year, month, day) => {
  return `${String(day).padStart(2, '0')}-${String(month + 1).padStart(2, '0')}-${year}`;
};

// Test income
const testIncome = [
  {
    id: 'test-income-ui-1',
    type: 'income',
    amount: 60000,
    note: 'Monthly Salary',
    date: formatDate(currentYear, currentMonth, 1),
    paymentMethod: 'HDFC'
  }
];

// Test envelopes - variety of states
const testEnvelopes = [
  // Needs - well managed
  { name: 'Groceries', category: 'need' },
  { name: 'Rent', category: 'need' },
  { name: 'Utilities', category: 'need' },
  { name: 'Transport', category: 'need' },
  
  // Wants - some overspending
  { name: 'Entertainment', category: 'want' },
  { name: 'Dining Out', category: 'want' },
  { name: 'Shopping', category: 'want' },
  
  // Savings - goals
  { name: 'Emergency Fund', category: 'saving' },
  { name: 'Vacation', category: 'saving', envelopeType: 'goal', goalAmount: 50000, dueDate: `01-12-${currentYear}` },
  { name: 'New Laptop', category: 'saving', envelopeType: 'goal', goalAmount: 80000, dueDate: `01-06-${currentYear + 1}` }
];

// Budget allocations
const testBudgets = {
  [`${currentYear}-${currentMonth}`]: {
    'Groceries': 10000,
    'Rent': 20000,
    'Utilities': 4000,
    'Transport': 3000,
    'Entertainment': 3000,
    'Dining Out': 2500,
    'Shopping': 2000,
    'Emergency Fund': 5000,
    'Vacation': 3000,
    'New Laptop': 2500
  }
};

// Test expenses - various spending patterns
const testExpenses = [
  // Groceries - moderate spending
  {
    id: 'test-exp-ui-1',
    type: 'expense',
    amount: 3500,
    note: 'Weekly Groceries - Week 1',
    date: formatDate(currentYear, currentMonth, 5),
    paymentMethod: 'HDFC',
    envelope: 'Groceries'
  },
  {
    id: 'test-exp-ui-2',
    type: 'expense',
    amount: 3200,
    note: 'Weekly Groceries - Week 2',
    date: formatDate(currentYear, currentMonth, 12),
    paymentMethod: 'HDFC',
    envelope: 'Groceries'
  },
  
  // Rent - fully spent
  {
    id: 'test-exp-ui-3',
    type: 'expense',
    amount: 20000,
    note: 'Monthly Rent',
    date: formatDate(currentYear, currentMonth, 1),
    paymentMethod: 'HDFC',
    envelope: 'Rent'
  },
  
  // Utilities - low spending
  {
    id: 'test-exp-ui-4',
    type: 'expense',
    amount: 1500,
    note: 'Electricity Bill',
    date: formatDate(currentYear, currentMonth, 8),
    paymentMethod: 'HDFC',
    envelope: 'Utilities'
  },
  
  // Transport - warning level (80%+)
  {
    id: 'test-exp-ui-5',
    type: 'expense',
    amount: 2500,
    note: 'Fuel + Metro',
    date: formatDate(currentYear, currentMonth, 10),
    paymentMethod: 'HDFC',
    envelope: 'Transport'
  },
  
  // Entertainment - OVERSPENT
  {
    id: 'test-exp-ui-6',
    type: 'expense',
    amount: 3500,
    note: 'Concert Tickets',
    date: formatDate(currentYear, currentMonth, 15),
    paymentMethod: 'HDFC',
    envelope: 'Entertainment'
  },
  
  // Dining Out - high spending
  {
    id: 'test-exp-ui-7',
    type: 'expense',
    amount: 2200,
    note: 'Restaurants',
    date: formatDate(currentYear, currentMonth, 18),
    paymentMethod: 'HDFC',
    envelope: 'Dining Out'
  },
  
  // Shopping - not started
  // (no expenses)
  
  // Savings
  {
    id: 'test-exp-ui-8',
    type: 'expense',
    amount: 5000,
    note: 'Emergency Fund Transfer',
    date: formatDate(currentYear, currentMonth, 1),
    paymentMethod: 'HDFC',
    envelope: 'Emergency Fund'
  },
  {
    id: 'test-exp-ui-9',
    type: 'expense',
    amount: 3000,
    note: 'Vacation Savings',
    date: formatDate(currentYear, currentMonth, 1),
    paymentMethod: 'HDFC',
    envelope: 'Vacation'
  },
  {
    id: 'test-exp-ui-10',
    type: 'expense',
    amount: 2500,
    note: 'Laptop Fund',
    date: formatDate(currentYear, currentMonth, 1),
    paymentMethod: 'HDFC',
    envelope: 'New Laptop'
  }
];

/**
 * EXPECTED UI BEHAVIOR:
 * 
 * 1. CARD LAYOUT:
 *    - Each card is larger with 20px padding
 *    - 16px margin between cards
 *    - Rounded corners (12px radius)
 *    - Subtle shadow on hover
 *    - 6px colored accent bar on left
 * 
 * 2. CARD HEADER:
 *    - Large category icon (24px) - 🛒 🎉 💰
 *    - Envelope name (18px, bold)
 *    - Pace icon if applicable (🎯 ⚠️ ✅)
 * 
 * 3. AMOUNTS GRID (3 columns):
 *    Column 1: Budget - ₹10,000 (blue)
 *    Column 2: Spent - ₹6,700 (gray)
 *    Column 3: Left - ₹3,300 (green/red)
 *    
 *    Each with label above in small caps
 * 
 * 4. PROGRESS BAR:
 *    - 8px height (thicker)
 *    - Color matches category
 *    - Smooth animation
 * 
 * 5. BUDGET INPUT:
 *    - Always visible inline
 *    - "Set Budget:" label
 *    - ₹ prefix + input field
 *    - 44px touch target
 *    - Compact design
 * 
 * 6. ACTION BUTTONS:
 *    - 2 buttons side by side
 *    - "➕ Add Expense" (primary blue)
 *    - "📋 Transactions" (secondary gray)
 *    - 48px height each
 *    - Always visible
 * 
 * 7. VISUAL STATES:
 *    Groceries: ₹10,000 budget, ₹6,700 spent, ₹3,300 left (67% - yellow bar)
 *    Rent: ₹20,000 budget, ₹20,000 spent, ₹0 left (100% - green bar)
 *    Utilities: ₹4,000 budget, ₹1,500 spent, ₹2,500 left (38% - green bar)
 *    Transport: ₹3,000 budget, ₹2,500 spent, ₹500 left (83% - orange bar)
 *    Entertainment: ₹3,000 budget, ₹3,500 spent, -₹500 left (OVER - red bar + red bg)
 *    Shopping: ₹2,000 budget, ₹0 spent, ₹2,000 left (0% - empty bar)
 * 
 * 8. NO TAPS NEEDED:
 *    - All info visible immediately
 *    - No expand/collapse
 *    - Direct budget editing
 *    - Quick actions ready
 * 
 * 9. COMPARISON - OLD vs NEW:
 *    OLD: Tap → Expand → See budget input → Tap button
 *    NEW: See everything → Edit/Act immediately
 *    
 *    Taps saved: 1-2 per interaction
 *    Visual clarity: Much better
 *    Information density: Optimal
 * 
 * 10. MOBILE OPTIMIZATION:
 *     - Touch targets ≥ 44px
 *     - Generous spacing
 *     - Clear visual hierarchy
 *     - Easy to scan
 *     - Thumb-friendly layout
 */

console.log('Improved Envelope UI Test Data:', {
  income: '₹60,000',
  totalBudget: '₹55,000',
  available: '₹5,000',
  envelopes: testEnvelopes.length,
  expenses: testExpenses.length,
  states: {
    wellManaged: 'Groceries, Utilities',
    warning: 'Transport (83%)',
    overspent: 'Entertainment (-₹500)',
    unused: 'Shopping (₹2,000 left)',
    complete: 'Rent (100%)'
  }
});

export { testIncome, testEnvelopes, testBudgets, testExpenses };
