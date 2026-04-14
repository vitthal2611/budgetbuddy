// ============================================
// TEST DATA - EASY BUDGET ALLOCATION
// ============================================
// This tests the improved budget allocation flow
// Copy and paste into browser console, then run: testEasyAllocation()

function testEasyAllocation() {
  console.log('🧪 Testing: Easy Budget Allocation');
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
  
  // Add payment methods
  const paymentMethods = ['Credit Card', 'Cash'];
  localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods));
  
  // Add envelopes
  const envelopes = [
    { name: 'Groceries', category: 'need', envelopeType: 'regular' },
    { name: 'Rent', category: 'need', envelopeType: 'regular' },
    { name: 'Entertainment', category: 'want', envelopeType: 'regular' },
    { name: 'Savings', category: 'saving', envelopeType: 'regular' },
  ];
  localStorage.setItem('envelopes', JSON.stringify(envelopes));
  
  // Add income for current month
  const transactions = [
    {
      id: `${Date.now()}-1`,
      date: formatDate(today),
      type: 'income',
      amount: '50000',
      note: 'Monthly Salary',
      paymentMethod: 'Credit Card'
    }
  ];
  localStorage.setItem('transactions', JSON.stringify(transactions));
  
  // Add budget for LAST MONTH (to test copy feature)
  const budgets = {};
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastKey = `${lastMonth.getFullYear()}-${lastMonth.getMonth()}`;
  budgets[lastKey] = {
    'Groceries': 12000,
    'Rent': 20000,
    'Entertainment': 5000,
    'Savings': 10000
  };
  
  // Current month has NO budget yet (to test allocation)
  const currentKey = `${today.getFullYear()}-${today.getMonth()}`;
  budgets[currentKey] = {};
  
  localStorage.setItem('budgets', JSON.stringify(budgets));
  
  console.log('✅ Test data created:');
  console.log('   Current Month Income: ₹50,000');
  console.log('   Current Month Budget: Empty (needs allocation)');
  console.log('   Last Month Budget: ₹47,000 total');
  console.log('   Envelopes: 4');
  console.log('');
  console.log('🧪 TEST SCENARIOS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('1️⃣ Check Envelopes View');
  console.log('   Expected: ✅ "Ready to Assign: ₹50,000" shown');
  console.log('   Expected: ❌ NO warning banner');
  console.log('   Expected: ❌ NO "Assign Income to Unlock" message');
  console.log('');
  console.log('2️⃣ Click "Fill Envelopes" Button');
  console.log('   Expected: ✅ Modal opens');
  console.log('   Expected: ✅ "Copy Last Month" button visible');
  console.log('   Expected: ✅ Button is prominent and easy to tap');
  console.log('');
  console.log('3️⃣ Click "Copy Last Month" Button');
  console.log('   Expected: ✅ All envelopes filled instantly');
  console.log('   Expected: ✅ Groceries: ₹12,000');
  console.log('   Expected: ✅ Rent: ₹20,000');
  console.log('   Expected: ✅ Entertainment: ₹5,000');
  console.log('   Expected: ✅ Savings: ₹10,000');
  console.log('   Expected: ✅ Ready to Assign: ₹3,000 (50k - 47k)');
  console.log('');
  console.log('4️⃣ Check FAB Button');
  console.log('   Expected: ✅ Always enabled (no lock)');
  console.log('   Expected: ✅ Can add expense immediately');
  console.log('');
  console.log('5️⃣ Mobile Experience');
  console.log('   Expected: ✅ Large touch targets (48px+)');
  console.log('   Expected: ✅ One-tap copy action');
  console.log('   Expected: ✅ No scrolling needed for button');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 Refresh the page and test!');
  console.log('');
  console.log('✅ PASS CRITERIA:');
  console.log('   - No warning banners');
  console.log('   - "Copy Last Month" button visible');
  console.log('   - One-click copies all amounts');
  console.log('   - Mobile-friendly (48px+ buttons)');
  console.log('   - Fast allocation flow');
}

// Auto-run
console.log('📝 Test script loaded!');
console.log('Run: testEasyAllocation()');
