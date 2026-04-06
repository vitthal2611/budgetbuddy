// Budget Rollover Utilities
// Handles automatic and manual budget rollover between months

/**
 * Calculate unused budget from previous month
 * @param {Object} budgets - All budgets object
 * @param {Array} transactions - All transactions
 * @param {number} year - Current year
 * @param {number} month - Current month (0-11)
 * @returns {Object} - Rollover amounts by envelope
 */
export const calculateRollover = (budgets, transactions, year, month) => {
  // Get previous month
  let prevYear = year;
  let prevMonth = month - 1;
  
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear = year - 1;
  }
  
  const prevBudgetKey = `${prevYear}-${prevMonth}`;
  const prevBudget = budgets[prevBudgetKey] || {};
  
  // Calculate spending for previous month
  const prevSpending = {};
  transactions
    .filter(t => {
      if (t.type !== 'expense') return false;
      const tDate = new Date(t.date.split('-').reverse().join('-'));
      return tDate.getFullYear() === prevYear && tDate.getMonth() === prevMonth;
    })
    .forEach(t => {
      prevSpending[t.envelope] = (prevSpending[t.envelope] || 0) + parseFloat(t.amount);
    });
  
  // Calculate rollover for each envelope
  const rollover = {};
  Object.keys(prevBudget).forEach(envelope => {
    const allocated = prevBudget[envelope] || 0;
    const spent = prevSpending[envelope] || 0;
    const remaining = allocated - spent;
    
    // Only rollover positive amounts
    if (remaining > 0) {
      rollover[envelope] = remaining;
    }
  });
  
  return rollover;
};

/**
 * Apply rollover to current month's budget
 * @param {Object} currentBudget - Current month budget
 * @param {Object} rollover - Rollover amounts
 * @param {string} mode - 'automatic' or 'manual'
 * @returns {Object} - Updated budget with rollover
 */
export const applyRollover = (currentBudget, rollover, mode = 'automatic') => {
  if (mode === 'none') return currentBudget;
  
  const updated = { ...currentBudget };
  
  Object.keys(rollover).forEach(envelope => {
    const rolloverAmount = rollover[envelope];
    const currentAmount = updated[envelope] || 0;
    
    if (mode === 'automatic') {
      // Automatically add rollover to current budget
      updated[envelope] = currentAmount + rolloverAmount;
    }
    // For manual mode, rollover is shown but not automatically applied
  });
  
  return updated;
};

/**
 * Get rollover summary for display
 * @param {Object} rollover - Rollover amounts
 * @returns {Object} - Summary statistics
 */
export const getRolloverSummary = (rollover) => {
  const envelopes = Object.keys(rollover);
  const total = envelopes.reduce((sum, env) => sum + rollover[env], 0);
  
  return {
    envelopeCount: envelopes.length,
    totalAmount: total,
    envelopes: envelopes.map(name => ({
      name,
      amount: rollover[name]
    }))
  };
};

/**
 * Check if it's a new month (first time opening app this month)
 * @param {string} lastOpenDate - Last app open date (DD-MM-YYYY)
 * @returns {boolean}
 */
export const isNewMonth = (lastOpenDate) => {
  if (!lastOpenDate) return true;
  
  const [day, month, year] = lastOpenDate.split('-').map(Number);
  const lastOpen = new Date(year, month - 1, day);
  const today = new Date();
  
  return lastOpen.getMonth() !== today.getMonth() || 
         lastOpen.getFullYear() !== today.getFullYear();
};

/**
 * Format rollover message for user
 * @param {Object} rollover - Rollover amounts
 * @returns {string}
 */
export const formatRolloverMessage = (rollover) => {
  const summary = getRolloverSummary(rollover);
  
  if (summary.envelopeCount === 0) {
    return 'No unused budget from last month.';
  }
  
  return `You have ₹${summary.totalAmount.toLocaleString('en-IN')} unused from last month across ${summary.envelopeCount} envelope${summary.envelopeCount > 1 ? 's' : ''}.`;
};
