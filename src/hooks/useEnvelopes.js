import { useMemo } from 'react';
import { useData } from '../contexts/DataContext';

export const useEnvelopes = (budgets, transactions, year, month) => {
  const { envelopes: customEnvelopes, getEnvelopeCategory } = useData();
  
  const budgetKey = `${year}-${month}`;
  const envelopeFills = budgets[budgetKey] || {};

  // Calculate spending for the month
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

  // Group envelopes by category with budget info
  const envelopesByCategory = useMemo(() => {
    const grouped = { need: [], want: [], saving: [] };
    
    customEnvelopes.forEach(env => {
      const filled = envelopeFills[env.name] || 0;
      const spent = monthlySpending[env.name] || 0;
      const remaining = filled - spent;
      
      grouped[env.category].push({
        name: env.name,
        category: env.category,
        filled,
        spent,
        remaining,
        percentage: filled > 0 ? (spent / filled) * 100 : 0,
        isOverBudget: remaining < 0,
        isLowBudget: remaining > 0 && remaining < filled * 0.2
      });
    });
    
    return grouped;
  }, [customEnvelopes, envelopeFills, monthlySpending]);

  // Get all envelopes with budget info
  const allEnvelopes = useMemo(() => {
    return [
      ...envelopesByCategory.need,
      ...envelopesByCategory.want,
      ...envelopesByCategory.saving
    ];
  }, [envelopesByCategory]);

  // Get envelopes with money left
  const envelopesWithMoney = useMemo(() => {
    return allEnvelopes.filter(env => env.remaining > 0);
  }, [allEnvelopes]);

  // Get over-budget envelopes
  const overBudgetEnvelopes = useMemo(() => {
    return allEnvelopes.filter(env => env.isOverBudget);
  }, [allEnvelopes]);

  // Get low-budget envelopes
  const lowBudgetEnvelopes = useMemo(() => {
    return allEnvelopes.filter(env => env.isLowBudget);
  }, [allEnvelopes]);

  return {
    envelopesByCategory,
    allEnvelopes,
    envelopesWithMoney,
    overBudgetEnvelopes,
    lowBudgetEnvelopes,
    monthlySpending
  };
};
