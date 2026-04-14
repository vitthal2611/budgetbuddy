// ============================================
// TEST DATA FOR IMPROVED ADD/FILL/TRANSFER FLOWS
// ============================================
// Copy and paste this entire file into browser console
// Then call: setupTestData()

function setupTestData() {
  console.log('🚀 Setting up test data for improved flows...');
  
  // Clear existing data
  localStorage.removeItem('envelopes');
  localStorage.removeItem('transactions');
  localStorage.removeItem('budgets');
  localStorage.removeItem('paymentMethods');
  
  // ============================================
  // 1. PAYMENT METHODS (for chips display)
  // ============================================
  const paymentMethods = [
    'HDFC Credit Card',
    'Cash',
    'UPI',
    'Debit Card'
  ];
  localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods));
  console.log('✅ Added', paymentMethods.length, 'payment methods');
  
  // ============================================
  // 2. ENVELOPES (mix of template and custom)
  // ============================================
  const envelopes = [
    // From templates - Needs
    { name: 'Groceries', category: 'need', envelopeType: 'regular' },
    { name: 'Rent', category: 'need', envelopeType: 'regular' },
    { name: 'Utilities', category: 'need', envelopeType: 'regular' },
    { name: 'Transportation', category: 'need', envelopeType: 'regular' },
    
    // From templates - Wants
    { name: 'Entertainment', category: 'want', envelopeType: 'regular' },
    { name: 'Dining Out', category: 'want', envelopeType: 'regular' },
    { name: 'Shopping', category: 'want', envelopeType: 'regular' },
    
    // From templates - Savings
    { name: 'Emergency Fund', category: 'saving', envelopeType: 'goal', goalAmount: 100000, dueDate: '2026-12' },
    { name: 'Vacation', category: 'saving', envelopeType: 'goal', goalAmount: 50000, dueDate: '2026-08' },
    { name: 'Insurance', category: 'saving', envelopeType: 'annual', annualAmount: 24000, monthlyFill: 2000 },
  ];
  localStorage.setItem('envelopes', JSON.stringify(envelopes));
  console.log('✅ Added', envelopes.length, 'envelopes (from templates)');
  
  // ============================================
  // 3. TRANSACTIONS (realistic data)
  // ============================================
  const today = new Date();
  const formatDate = (date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };
  
  const transactions = [
    // Income
    {
      id: `${Date.now()}-1`,
      date: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)),
      type: 'income',
      amount: '75000',
      note: 'Monthly Salary',
      paymentMethod: 'HDFC Credit Card'
    },
    
    // Expenses - Various envelopes
    {
      id: `${Date.now()}-2`,
      date: formatDate(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)),
      type: 'expense',
      amount: '3500',
      note: 'Weekly groceries',
      envelope: 'Groceries',
      paymentMethod: 'HDFC Credit Card'
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
    {
      id: `${Date.now()}-4`,
      date: formatDate(new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)),
      type: 'expense',
      amount: '15000',
      note: 'Monthly rent',
      envelope: 'Rent',
      paymentMethod: 'UPI'
    },
    {
      id: `${Date.now()}-5`,
      date: formatDate(new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000)),
      type: 'expense',
      amount: '1200',
      note: 'Movie tickets',
      envelope: 'Entertainment',
      paymentMethod: 'HDFC Credit Card'
    },
    {
      id: `${Date.now()}-6`,
      date: formatDate(today),
      type: 'expense',
      amount: '850',
      note: 'Lunch with friends',
      envelope: 'Dining Out',
      paymentMethod: 'UPI'
    },
  ];
  localStorage.setItem('transactions', JSON.stringify(transactions));
  console.log('✅ Added', transactions.length, 'transactions');
  
  // ============================================
  // 4. BUDGETS (current month + last month)
  // ============================================
  const budgets = {};
  
  // Current month
  const currentKey = `${today.getFullYear()}-${today.getMonth()}`;
  budgets[currentKey] = {
    'Groceries': 8000,
    'Rent': 15000,
    'Utilities': 3000,
    'Transportation': 4000,
    'Entertainment': 2500,
    'Dining Out': 3000,
    'Shopping': 2000,
    'Emergency Fund': 5000,
    'Vacation': 3000,
    'Insurance': 2000
  };
  
  // Last month (for "Copy from last month" feature)
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastKey = `${lastMonth.getFullYear()}-${lastMonth.getMonth()}`;
  budgets[lastKey] = {
    'Groceries': 7500,
    'Rent': 15000,
    'Utilities': 2800,
    'Transportation': 3500,
    'Entertainment': 2000,
    'Dining Out': 2500,
    'Shopping': 1500,
    'Emergency Fund': 5000,
    'Vacation': 2500,
    'Insurance': 2000
  };
  
  localStorage.setItem('budgets', JSON.stringify(budgets));
  console.log('✅ Added budget data for 2 months');
  
  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n📊 TEST DATA SUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Payment Methods:', paymentMethods.length);
  console.log('Envelopes:', envelopes.length);
  console.log('Transactions:', transactions.length);
  console.log('Budget Months:', Object.keys(budgets).length);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n✨ FEATURES TO TEST:');
  console.log('1. Add Expense → See payment method chips');
  console.log('2. Add Expense → Large amount input');
  console.log('3. Add Envelope → See template grid');
  console.log('4. Fill Envelopes → Copy from last month');
  console.log('5. Transfer → Visual envelope selector');
  console.log('\n🔄 Refresh the page to see changes!');
}

// Auto-run if you want
// setupTestData();

console.log('📝 Test data script loaded!');
console.log('Run: setupTestData()');
