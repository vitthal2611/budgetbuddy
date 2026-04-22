// Test data for Income and Transfer features
// Instructions:
// 1. Open the app in your browser
// 2. Open browser console (F12)
// 3. Copy and paste this entire file into the console
// 4. Press Enter to execute
// 5. Refresh the page to see the new data

const testData = {
  // Sample income transactions
  incomeTransactions: [
    {
      id: `income-${Date.now()}-1`,
      type: 'income',
      amount: '50000',
      note: 'Monthly Salary',
      date: new Date().toLocaleDateString('en-GB').split('/').join('-'),
      paymentMethod: 'Bank Account'
    },
    {
      id: `income-${Date.now()}-2`,
      type: 'income',
      amount: '5000',
      note: 'Freelance Project',
      date: new Date().toLocaleDateString('en-GB').split('/').join('-'),
      paymentMethod: 'Cash'
    },
    {
      id: `income-${Date.now()}-3`,
      type: 'income',
      amount: '2000',
      note: 'Gift Money',
      date: new Date().toLocaleDateString('en-GB').split('/').join('-'),
      paymentMethod: 'Cash'
    }
  ],

  // Sample transfer transactions
  transferTransactions: [
    {
      id: `transfer-${Date.now()}-1`,
      type: 'transfer',
      amount: '10000',
      note: 'ATM Withdrawal',
      date: new Date().toLocaleDateString('en-GB').split('/').join('-'),
      sourceAccount: 'Bank Account',
      destinationAccount: 'Cash'
    },
    {
      id: `transfer-${Date.now()}-2`,
      type: 'transfer',
      amount: '5000',
      note: 'Credit Card Payment',
      date: new Date().toLocaleDateString('en-GB').split('/').join('-'),
      sourceAccount: 'Bank Account',
      destinationAccount: 'Credit Card'
    }
  ]
};

// Function to add test data
async function addTestData() {
  try {
    console.log('🔄 Adding test data...');
    
    // Trigger import event
    window.dispatchEvent(new CustomEvent('importTransactions', {
      detail: [...testData.incomeTransactions, ...testData.transferTransactions]
    }));
    
    console.log('✅ Test data added successfully!');
    console.log(`📥 Added ${testData.incomeTransactions.length} income transactions`);
    console.log(`🔄 Added ${testData.transferTransactions.length} transfer transactions`);
    console.log('');
    console.log('💡 The data has been added. You should see:');
    console.log('   - Income button in the Envelopes tab (after header)');
    console.log('   - Transfer button in the Envelopes tab (after header)');
    console.log('   - Updated account balances');
    console.log('');
    console.log('🎯 Try clicking the Income or Transfer buttons to add more!');
  } catch (error) {
    console.error('❌ Failed to add test data:', error);
  }
}

// Run the function
addTestData();
