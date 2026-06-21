import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function TransactionForm() {
  const { categories, addTransaction } = useData();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || (type === 'expense' && !categoryId)) return;

    await addTransaction({ type, amount, categoryId, date, note });
    setAmount('');
    setNote('');
  };

  return (
    <div className="panel">
      <h2>Add Entry</h2>
      <form className="transaction-form" onSubmit={handleSubmit}>
        <div className="type-toggle">
          <button
            type="button"
            className={type === 'expense' ? 'active' : ''}
            onClick={() => setType('expense')}
          >
            Expense
          </button>
          <button
            type="button"
            className={type === 'income' ? 'active' : ''}
            onClick={() => setType('income')}
          >
            Income
          </button>
        </div>

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0"
          step="0.01"
          required
        />

        {type === 'expense' && (
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        )}

        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />

        <input
          type="text"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <button type="submit">Add {type === 'expense' ? 'Expense' : 'Income'}</button>
      </form>
    </div>
  );
}
