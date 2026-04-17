import React from 'react';
import './AddTransaction.css';

const AddTransaction = ({ onAddTransaction }) => {
  const actions = [
    {
      id: 'income',
      title: 'Add Income',
      subtitle: 'Record money received',
      icon: '💰',
      color: '#10B981'
    },
    {
      id: 'expense',
      title: 'Add Expense',
      subtitle: 'Track spending',
      icon: '💸',
      color: '#EF4444'
    },
    {
      id: 'credit',
      title: 'Add Credit',
      subtitle: 'Record credit card payment',
      icon: '💳',
      color: '#3B82F6'
    },
    {
      id: 'transfer',
      title: 'Transfer to Envelope',
      subtitle: 'Move money to budget',
      icon: '📦',
      color: '#8B5CF6'
    }
  ];

  return (
    <div className="add-transaction-screen">
      <div className="add-header">
        <h1>Add Transaction</h1>
        <p className="add-subtitle">Choose what you want to add</p>
      </div>

      <div className="add-content">
        <div className="action-grid">
          {actions.map(action => (
            <button
              key={action.id}
              className="action-card"
              onClick={() => onAddTransaction(action.id)}
              style={{ '--action-color': action.color }}
            >
              <div className="action-icon">{action.icon}</div>
              <div className="action-info">
                <h3 className="action-title">{action.title}</h3>
                <p className="action-subtitle">{action.subtitle}</p>
              </div>
              <div className="action-arrow">→</div>
            </button>
          ))}
        </div>

        <div className="add-tip">
          <div className="tip-icon">💡</div>
          <div className="tip-content">
            <p className="tip-title">Quick Tip</p>
            <p className="tip-text">
              Track every transaction to maintain accurate budgets and financial insights.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTransaction;
