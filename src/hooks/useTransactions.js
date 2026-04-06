import { useMemo } from 'react';

export const useTransactions = (transactions) => {
  // Calculate monthly income
  const getMonthlyIncome = (year, month) => {
    return transactions
      .filter(t => {
        const tDate = new Date(t.date.split('-').reverse().join('-'));
        return t.type === 'income' && 
               tDate.getFullYear() === year && 
               tDate.getMonth() === month;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  };

  // Calculate monthly spending by envelope
  const getMonthlySpending = (year, month) => {
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
  };

  // Get transactions for specific envelope and month
  const getEnvelopeTransactions = (envelope, year, month) => {
    return transactions.filter(t => {
      if (t.type !== 'expense' || t.envelope !== envelope) return false;
      const tDate = new Date(t.date.split('-').reverse().join('-'));
      return tDate.getFullYear() === year && tDate.getMonth() === month;
    });
  };

  // Calculate total income
  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  }, [transactions]);

  // Calculate total expenses
  const totalExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  }, [transactions]);

  // Get today's transactions
  const getTodayTransactions = () => {
    const today = new Date();
    const todayStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    return transactions.filter(t => t.date === todayStr);
  };

  // Get payment method balances
  const getPaymentMethodBalances = () => {
    const balances = {};
    transactions.forEach(t => {
      if (t.type === 'income') {
        balances[t.paymentMethod] = (balances[t.paymentMethod] || 0) + parseFloat(t.amount);
      } else if (t.type === 'expense') {
        balances[t.paymentMethod] = (balances[t.paymentMethod] || 0) - parseFloat(t.amount);
      } else if (t.type === 'transfer') {
        balances[t.sourceAccount] = (balances[t.sourceAccount] || 0) - parseFloat(t.amount);
        balances[t.destinationAccount] = (balances[t.destinationAccount] || 0) + parseFloat(t.amount);
      }
    });
    return balances;
  };

  return {
    getMonthlyIncome,
    getMonthlySpending,
    getEnvelopeTransactions,
    getTodayTransactions,
    getPaymentMethodBalances,
    totalIncome,
    totalExpenses
  };
};
