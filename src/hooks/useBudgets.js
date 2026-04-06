import { useMemo } from 'react';

export const useBudgets = (budgets, transactions, year, month) => {
  const budgetKey = `${year}-${month}`;
  const currentBudget = budgets[budgetKey] || {};

  // Calculate monthly income
  const monthlyIncome = useMemo(() => {
    return transactions
      .filter(t => {
        const tDate = new Date(t.date.split('-').reverse().join('-'));
        return t.type === 'income' && 
               tDate.getFullYear() === year && 
               tDate.getMonth() === month;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  }, [transactions, year, month]);

  // Calculate monthly spending
  const monthlySpending = useMemo(() => {
    const spending = {};
    transactions
      .filter(t => {
        const tDate = new Date(t.date.split('-').reverse().join('-'));
        return t.type === 'expense' && 
               tDate.getFullYear() === year && 
               tDate.getMonth() === month;
      })
      .forEach(t => {
        spending[t.envelope] = (spending[t.envelope] || 0) + parseFloat(t.amount);
      });
    return spending;
  }, [transactions, year, month]);

  // Calculate total allocated
  const totalAllocated = useMemo(() => {
    return Object.values(currentBudget).reduce((sum, val) => sum + parseFloat(val || 0), 0);
  }, [currentBudget]);

  // Calculate unallocated
  const unallocated = monthlyIncome - totalAllocated;

  // Get envelope budget info
  const getEnvelopeBudget = (envelopeName) => {
    const allocated = currentBudget[envelopeName] || 0;
    const spent = monthlySpending[envelopeName] || 0;
    const remaining = allocated - spent;
    const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;

    return {
      allocated,
      spent,
      remaining,
      percentage,
      isOverBudget: remaining < 0,
      isLowBudget: remaining > 0 && remaining < allocated * 0.2
    };
  };

  // Check if can spend from envelope
  const canSpendFromEnvelope = (envelopeName, amount) => {
    const budget = getEnvelopeBudget(envelopeName);
    return budget.remaining >= amount;
  };

  return {
    budgetKey,
    currentBudget,
    monthlyIncome,
    monthlySpending,
    totalAllocated,
    unallocated,
    getEnvelopeBudget,
    canSpendFromEnvelope
  };
};
