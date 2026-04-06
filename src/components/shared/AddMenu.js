import React from 'react';

const ACTIONS = [
  { type: 'income',   icon: '💰', label: 'Income' },
  { type: 'expense',  icon: '💸', label: 'Expense' },
  { type: 'credit',   icon: '↩',  label: 'Credit' },
  { type: 'transfer', icon: '🔄', label: 'Transfer' },
];

const AddMenu = ({ onSelect, onClose }) => (
  <div className="mobile-menu-overlay" onClick={onClose}>
    <div className="add-menu" onClick={e => e.stopPropagation()}>
      <div className="add-menu-title">Add Transaction</div>
      <div className="add-menu-options">
        {ACTIONS.map(({ type, icon, label }) => (
          <button
            key={type}
            className={`add-menu-btn ${type}`}
            onClick={() => { onSelect(type); onClose(); }}
          >
            <span className="add-menu-icon">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default AddMenu;
