export function getMonthKey(dateStr) {
  return dateStr.slice(0, 7); // 'YYYY-MM'
}

export function currentMonthKey() {
  return getMonthKey(new Date().toISOString());
}

export function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric'
  });
}

export function listMonthsWithData(transactions) {
  const months = new Set(transactions.map((t) => getMonthKey(t.date)));
  months.add(currentMonthKey());
  return Array.from(months).sort().reverse();
}

export function computeTotals(transactions, monthKey) {
  const monthTx = transactions.filter((t) => getMonthKey(t.date) === monthKey);
  const income = monthTx
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = monthTx
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  return { income, expense, net: income - expense };
}

export function computeCategorySummary(categories, transactions, monthKey) {
  const monthExpenses = transactions.filter(
    (t) => t.type === 'expense' && getMonthKey(t.date) === monthKey
  );

  return categories.map((cat) => {
    const spent = monthExpenses
      .filter((t) => t.categoryId === cat.id)
      .reduce((sum, t) => sum + t.amount, 0);
    const budget = cat.monthlyBudget || 0;
    const remaining = budget - spent;
    const percent = budget > 0 ? (spent / budget) * 100 : 0;

    return {
      ...cat,
      spent,
      remaining,
      percent,
      isOverBudget: remaining < 0
    };
  });
}
