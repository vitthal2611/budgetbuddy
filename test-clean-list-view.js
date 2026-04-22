// ============================================
// TEST DATA - 2-COLUMN COMPACT GRID VIEW
// ============================================
// This demonstrates the new 2-column grid layout for envelopes
// Copy and paste into browser console, then call: setupCleanListView()

function setupCleanListView() {
  console.log('🎨 Setting up test data for 2-column grid view...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  const formatDate = (date) => {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };

  // ============================================
  // ENVELOPES - Realistic categories
  // ============================================
  const envelopes = [
    // NEEDS
    { name: 'Groceries', category: 'need', envelopeType: 'regular' },
    { name: 'Rent', category: 'need', envelopeType: 'regular' },
    { name: 'Utilities', category: 'need', envelopeType: 'regular' },
    { name: 'Transportation', category: 'need', envelopeType: 'regular' },
    
    // WANTS
    { name: 'Dining Out', category: 'want', envelopeType: 'regular' },
    { name: 'Entertainment', category: 'want', envelopeType: 'regular' },
    { name: 'Shopping', category: 'want', envelopeType: 'regular' },
    
    // SAVINGS
    { name: 'Emergency Fund', category: 'saving', envelopeType: 'goal', goalAmount: 100000, dueDate: '2025-12-31' },
    { name: 'Vacation', category: 'saving', envelopeType: 'goal', goalAmount: 50000, dueDate: '2025-06-30' },
  ];

  // ============================================
  // PAYMENT METHODS
  // ============================================
  const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'UPI'];

  // ============================================
  // TRANSACTIONS - Current Month
  // ============================================
  const transactions = [
    // Income
    {
      id: `${Date.now()}-1`,
      type: 'income',
      amount: 75000,
      note: 'Monthly Salary',
      date: formatDate(new Date(currentYear, currentMonth, 1)),
      paymentMethod: 'Bank Transfer'
    },
    
    // Expenses - Groceries
    {
      id: `${Date.now()}-2`,
      type: 'expense',
      amount: 2500,
      note: 'Weekly groceries',
      date: formatDate(new Date(currentYear, currentMonth, 5)),
      envelope: 'Groceries',
      paymentMethod: 'Credit Card'
    },
    {
      id: `${Date.now()}-3`,
      type: 'expense',
      amount: 1800,
      note: 'Vegetables and fruits',
      date: formatDate(new Date(currentYear, currentMonth, 12)),
      envelope: 'Groceries',
      paymentMethod: 'Cash'
    },
    
    // Expenses - Rent
    {
      id: `${Date.now()}-4`,
      type: 'expense',
      amount: 15000,
      note: 'Monthly rent',
      date: formatDate(new Date(currentYear, currentMonth, 1)),
      envelope: 'Rent',
      paymentMethod: 'Bank Transfer'
    },
    
    // Expenses - Utilities
    {
      id: `${Date.now()}-5`,
      type: 'expense',
      amount: 1200,
      note: 'Electricity bill',
      date: formatDate(new Date(currentYear, currentMonth, 8)),
      envelope: 'Utilities',
      paymentMethod: 'UPI'
    },
    
    // Expenses - Transportation
    {
      id: `${Date.now()}-6`,
      type: 'expense',
      amount: 800,
      note: 'Fuel',
      date: formatDate(new Date(currentYear, currentMonth, 10)),
      envelope: 'Transportation',
      paymentMethod: 'Credit Card'
    },
    
    // Expenses - Dining Out
    {
      id: `${Date.now()}-7`,
      type: 'expense',
      amount: 1500,
      note: 'Restaurant dinner',
      date: formatDate(new Date(currentYear, currentMonth, 14)),
      envelope: 'Dining Out',
      paymentMethod: 'Credit Card'
    },
    
    // Expenses - Entertainment
    {
      id: `${Date.now()}-8`,
      type: 'expense',
      amount: 600,
      note: 'Movie tickets',
      date: formatDate(new Date(currentYear, currentMonth, 16)),
      envelope: 'Entertainment',
      paymentMethod: 'UPI'
    },
  ];

  // ============================================
  // BUDGETS - Current Month
  // ============================================
  const budgetKey = `${currentYear}-${currentMonth}`;
  const budgets = {
    [budgetKey]: {
      'Groceries': 8000,
      'Rent': 15000,
      'Utilities': 3000,
      'Transportation': 4000,
      'Dining Out': 5000,
      'Entertainment': 3000,
      'Shopping': 5000,
      'Emergency Fund': 10000,
      'Vacation': 5000,
    }
  };

  // ============================================
  // SAVE TO LOCALSTORAGE
  // ============================================
  localStorage.setItem('envelopes', JSON.stringify(envelopes));
  localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods));
  localStorage.setItem('transactions', JSON.stringify(transactions));
  localStorage.setItem('budgets', JSON.stringify(budgets));

  // ============================================
  // SUMMARY
  // ============================================
  console.log('✅ Test data created successfully!');
  console.log('');
  console.log('📊 SUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`💰 Income: ₹75,000`);
  console.log(`📦 Envelopes: ${envelopes.length}`);
  console.log(`💳 Payment Methods: ${paymentMethods.length}`);
  console.log(`📝 Transactions: ${transactions.length}`);
  console.log(`📅 Budget Month: ${currentMonth + 1}/${currentYear}`);
  console.log('');
  console.log('🎯 NEW FEATURES:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ 2-column grid layout (compact view)');
  console.log('📱 See more envelopes at once - less scrolling');
  console.log('👆 Tap card → Opens "Add Expense" directly');
  console.log('💰 Tap budget amount → Edit budget (no edit icon)');
  console.log('📊 Shows: Name, Budget, Balance (minimal info)');
  console.log('📐 Fixed height cards (120px) - consistent layout');
  console.log('🚫 Removed: Icons, edit buttons, spent amount');
  console.log('⚡ Result: 50% less scrolling, cleaner view');
  console.log('');
  console.log('🔄 Refresh the page to see the new 2-column design!');
}

// Auto-run
console.log('📝 2-Column Grid View test data loaded!');
console.log('Run: setupCleanListView()');
