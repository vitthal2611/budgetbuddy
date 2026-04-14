// ============================================
// TEST DATA - NO OVERSPENDING RESTRICTIONS
// ============================================
// This tests that you can spend ANY amount regardless of budget
// Copy and paste into browser console, then run: testNoRestrictions()

function testNoRestrictions() {
  console.log('🧪 Testing: No Overspending Restrictions');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Setup test data
  const today = new Date();
  const formatDate = (date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };
  
  // Clear existing
  localStorage.removeItem('envelopes');
  localStorage.removeItem('transactions');
  localStorage.removeItem('budgets');
  localStorage.removeItem('paymentMethods');
  localStorage.removeItem('userPreferences');
  
  // Add payment methods
  const paymentMethods = ['Credit Card', 'Cash'];
  localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods));
  
  // Add envelopes
  const envelopes = [
    { name: 'Groceries', category: 'need', envelopeType: 'regular' },
    { name: 'Entertainment', category: 'want', envelopeType: 'regular' },
  ];
  localStorage.setItem('envelopes', JSON.stringify(envelopes));
  
  // Add income
  const transactions = [
    {
      id: `${Date.now()}-1`,
      date: formatDate(today),
      type: 'income',
      amount: '10000',
      note: 'Test Income',
      paymentMethod: 'Credit Card'
    }
  ];
  localStorage.setItem('transactions', JSON.stringify(transactions));
  
  // Add SMALL budget (₹1000) to test overspending
  const budgets = {};
  const currentKey = `${today.getFullYear()}-${today.getMonth()}`;
  budgets[currentKey] = {
    'Groceries': 1000,      // Only ₹1000 allocated
    'Entertainment': 500    // Only ₹500 allocated
  };
  localStorage.setItem('budgets', JSON.stringify(budgets));
  
  console.log('✅ Test data created:');
  console.log('   Income: ₹10,000');
  console.log('   Groceries budget: ₹1,000');
  console.log('   Entertainment budget: ₹500');
  console.log('');
  console.log('🧪 TEST SCENARIOS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('1️⃣ Try to spend ₹5,000 on Groceries');
  console.log('   Budget: ₹1,000 | Trying: ₹5,000');
  console.log('   Expected: ✅ SHOULD ALLOW (no restrictions)');
  console.log('');
  console.log('2️⃣ Try to spend ₹2,000 on Entertainment');
  console.log('   Budget: ₹500 | Trying: ₹2,000');
  console.log('   Expected: ✅ SHOULD ALLOW (no restrictions)');
  console.log('');
  console.log('3️⃣ Try to spend with NO budget allocated');
  console.log('   Create new envelope with ₹0 budget');
  console.log('   Expected: ✅ SHOULD ALLOW (no restrictions)');
  console.log('');
  console.log('4️⃣ Check FAB button');
  console.log('   Expected: ✅ Always enabled (no lock icon)');
  console.log('');
  console.log('5️⃣ Check Settings');
  console.log('   Expected: ❌ No "Block Overspending" toggle');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 Refresh the page and test!');
  console.log('');
  console.log('✅ PASS CRITERIA:');
  console.log('   - Can add expense > budget amount');
  console.log('   - No warning messages shown');
  console.log('   - No "Cannot Save" button state');
  console.log('   - No SpendingBlockModal popup');
  console.log('   - FAB always shows "+" (never 🔒)');
  console.log('   - No "Block Overspending" in Settings');
}

// Auto-run
console.log('📝 Test script loaded!');
console.log('Run: testNoRestrictions()');
