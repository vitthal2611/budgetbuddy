import React from 'react';
import { useData } from '../contexts/DataContext';
import { getMonthKey } from '../utils/calculations';

export default function TransactionList({ monthKey }) {
  const { transactions, categories, deleteTransaction } = useData();

  const categoryName = (id) => categories.find((c) => c.id === id)?.name || 'Uncategorized';

  const monthTx = transactions
    .filter((t) => getMonthKey(t.date) === monthKey)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="panel">
      <h2>Entries</h2>
      {monthTx.length === 0 ? (
        <p className="empty-hint">No entries for this month yet.</p>
      ) : (
        <ul className="transaction-list">
          {monthTx.map((t) => (
            <li key={t.id} className={t.type}>
              <div className="tx-main">
                <span className="tx-desc">
                  {t.type === 'expense' ? categoryName(t.categoryId) : 'Income'}
                  {t.note ? ` · ${t.note}` : ''}
                </span>
                <span className="tx-date">{t.date}</span>
              </div>
              <div className="tx-side">
                <span className={`tx-amount ${t.type}`}>
                  {t.type === 'expense' ? '-' : '+'}₹{t.amount.toLocaleString('en-IN')}
                </span>
                <button
                  type="button"
                  className="link-button danger"
                  onClick={() => deleteTransaction(t.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
