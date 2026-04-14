import { useMemo } from 'react';

export const computeMonthlyFill = (env, year, month) => {
  if (env.envelopeType === 'annual' && env.annualAmount)
    return Math.ceil(env.annualAmount / 12);
  if (env.envelopeType === 'goal' && env.goalAmount) {
    if (env.dueDate) {
      const due = new Date(env.dueDate);
      const now = new Date(year, month === 'all' ? 0 : month, 1);
      const monthsLeft = Math.max(1,
        (due.getFullYear() - now.getFullYear()) * 12 + (due.getMonth() - now.getMonth()) + 1
      );
      return Math.ceil(env.goalAmount / monthsLeft);
    }
    return 0;
  }
  return null;
};

const matchesPeriod = (dateStr, selectedYear, selectedMonth) => {
  const d = new Date(dateStr.split('-').reverse().join('-'));
  return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
};

export const useEnvelopesData = ({
  transactions, budgets, customEnvelopes, selectedYear, selectedMonth,
}) => {
  const budgetKey = `${selectedYear}-${selectedMonth}`;

  const envelopeFills = useMemo(
    () => budgetKey ? (budgets[budgetKey] || {}) : {},
    [budgets, budgetKey]
  );

  const monthlySpending = useMemo(() => {
    const spending = {};
    transactions.forEach(t => {
      if (t.type !== 'expense' || !t.envelope) return;
      if (matchesPeriod(t.date, selectedYear, selectedMonth))
        spending[t.envelope] = (spending[t.envelope] || 0) + parseFloat(t.amount);
    });
    return spending;
  }, [transactions, selectedYear, selectedMonth]);

  const lastUsed = useMemo(() => {
    const dates = {};
    transactions.forEach(t => {
      if (t.type !== 'expense' || !t.envelope) return;
      const d = new Date(t.date.split('-').reverse().join('-'));
      if (!dates[t.envelope] || d > dates[t.envelope]) dates[t.envelope] = d;
    });
    return dates;
  }, [transactions]);

  const monthlyIncome = useMemo(() =>
    transactions
      .filter(t => t.type === 'income' && matchesPeriod(t.date, selectedYear, selectedMonth))
      .reduce((s, t) => s + parseFloat(t.amount), 0),
    [transactions, selectedYear, selectedMonth]
  );

  const totalFilled = useMemo(() => {
    return Object.values(envelopeFills).reduce((s, v) => s + parseFloat(v || 0), 0);
  }, [envelopeFills]);

  const totalSpent = useMemo(
    () => Object.values(monthlySpending).reduce((s, v) => s + v, 0),
    [monthlySpending]
  );

  const accountBalances = useMemo(() => {
    const accounts = {};
    transactions.forEach(t => {
      const amt = parseFloat(t.amount);
      if (t.type === 'income')
        accounts[t.paymentMethod] = (accounts[t.paymentMethod] || 0) + amt;
      else if (t.type === 'expense')
        accounts[t.paymentMethod] = (accounts[t.paymentMethod] || 0) - amt;
      else if (t.type === 'transfer') {
        accounts[t.sourceAccount]      = (accounts[t.sourceAccount]      || 0) - amt;
        accounts[t.destinationAccount] = (accounts[t.destinationAccount] || 0) + amt;
      }
    });
    return accounts;
  }, [transactions]);

  const totalAccountBalance = useMemo(
    () => Object.values(accountBalances).reduce((s, v) => s + v, 0),
    [accountBalances]
  );

  const goalProgress = useMemo(() => {
    const progress = {};
    customEnvelopes.forEach(env => {
      if (env.envelopeType !== 'goal') return;
      let total = 0;
      Object.values(budgets).forEach(mb => { total += parseFloat(mb[env.name] || 0); });
      transactions.forEach(t => {
        if (t.type === 'expense' && t.envelope === env.name)
          total -= parseFloat(t.amount);
      });
      progress[env.name] = Math.max(0, total);
    });
    return progress;
  }, [customEnvelopes, budgets, transactions]);

  const annualYTD = useMemo(() => {
    const ytd = {};
    customEnvelopes.forEach(env => {
      if (env.envelopeType !== 'annual') return;
      let total = 0;
      Object.entries(budgets).forEach(([key, mb]) => {
        const [y] = key.split('-');
        if (parseInt(y) === selectedYear) total += parseFloat(mb[env.name] || 0);
      });
      ytd[env.name] = total;
    });
    return ytd;
  }, [customEnvelopes, budgets, selectedYear]);

  const envelopesByCategory = useMemo(() => {
    const grouped = { need: [], want: [], saving: [] };

    customEnvelopes.forEach(env => {
      const filled = envelopeFills[env.name] || 0;
      const spent  = monthlySpending[env.name] || 0;
      const remaining = filled - spent;
      const suggestedFill = computeMonthlyFill(env, selectedYear, selectedMonth);
      grouped[env.category].push({ ...env, filled, spent, remaining, suggestedFill });
    });
    return grouped;
  }, [customEnvelopes, envelopeFills, monthlySpending, selectedYear, selectedMonth]);

  return {
    budgetKey,
    envelopeFills,
    monthlySpending,
    lastUsed,
    monthlyIncome,
    totalFilled,
    totalSpent,
    unallocated: monthlyIncome - totalFilled,
    accountBalances,
    totalAccountBalance,
    goalProgress,
    annualYTD,
    envelopesByCategory,
  };
};
