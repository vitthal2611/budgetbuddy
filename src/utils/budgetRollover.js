// Budget Rollover Utilities

export const calculateRollover = (budgets, transactions, year, month) => {
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth < 0) { prevMonth = 11; prevYear = year - 1; }

  const prevBudgetKey = `${prevYear}-${prevMonth}`;
  const prevBudget = budgets[prevBudgetKey] || {};

  const prevSpending = {};
  transactions
    .filter(t => {
      if (t.type !== 'expense') return false;
      const d = new Date(t.date.split('-').reverse().join('-'));
      return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
    })
    .forEach(t => {
      prevSpending[t.envelope] = (prevSpending[t.envelope] || 0) + parseFloat(t.amount);
    });

  // Include both positive (surplus) and negative (overspend)
  const rollover = {};
  Object.keys(prevBudget).forEach(envelope => {
    const allocated = prevBudget[envelope] || 0;
    const spent = prevSpending[envelope] || 0;
    const remaining = allocated - spent;
    if (remaining !== 0) rollover[envelope] = remaining;
  });

  return rollover;
};

export const applyRollover = (currentBudget, rollover) => {
  const updated = { ...currentBudget };
  Object.keys(rollover).forEach(envelope => {
    updated[envelope] = Math.max(0, (updated[envelope] || 0) + rollover[envelope]);
  });
  return updated;
};

export const isNewMonth = (lastOpenDate) => {
  if (!lastOpenDate) return true;
  const [day, month, year] = lastOpenDate.split('-').map(Number);
  const lastOpen = new Date(year, month - 1, day);
  const today = new Date();
  return lastOpen.getMonth() !== today.getMonth() ||
         lastOpen.getFullYear() !== today.getFullYear();
};
