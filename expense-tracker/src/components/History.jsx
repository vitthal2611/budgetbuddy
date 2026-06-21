import React from 'react';
import { useData } from '../contexts/DataContext';
import { computeTotals, formatMonthLabel, listMonthsWithData } from '../utils/calculations';

export default function History({ selectedMonth, onSelectMonth }) {
  const { transactions } = useData();
  const months = listMonthsWithData(transactions);

  return (
    <div className="panel">
      <h2>Monthly History</h2>
      {months.length === 0 ? (
        <p className="empty-hint">No data yet.</p>
      ) : (
        <ul className="history-list">
          {months.map((monthKey) => {
            const totals = computeTotals(transactions, monthKey);
            return (
              <li
                key={monthKey}
                className={monthKey === selectedMonth ? 'selected' : ''}
                onClick={() => onSelectMonth(monthKey)}
              >
                <span className="history-month">{formatMonthLabel(monthKey)}</span>
                <span className="history-totals">
                  <span className="income">+₹{totals.income.toLocaleString('en-IN')}</span>
                  <span className="expense">-₹{totals.expense.toLocaleString('en-IN')}</span>
                  <span className={totals.net < 0 ? 'negative' : 'positive'}>
                    ₹{totals.net.toLocaleString('en-IN')}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
