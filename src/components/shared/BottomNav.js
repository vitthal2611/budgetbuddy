import React from 'react';

const BottomNav = ({ activeTab, onTabChange }) => (
  <div className="bottom-nav">
    <button
      className={`nav-tab ${activeTab === 'envelopes' ? 'active' : ''}`}
      onClick={() => onTabChange('envelopes')}
      aria-label="Envelopes"
    >
      <span className="nav-icon">📦</span>
      <span className="nav-label">Budget</span>
    </button>

    <button
      className={`nav-tab ${activeTab === 'habits' ? 'active' : ''}`}
      onClick={() => onTabChange('habits')}
      aria-label="Habits"
    >
      <span className="nav-icon">🎯</span>
      <span className="nav-label">Habits</span>
    </button>

    <button
      className={`nav-tab ${activeTab === 'add' ? 'active' : ''}`}
      onClick={() => onTabChange('add')}
      aria-label="Add"
    >
      <span className="nav-icon">➕</span>
      <span className="nav-label">Add</span>
    </button>

    <button
      className={`nav-tab ${activeTab === 'todos' ? 'active' : ''}`}
      onClick={() => onTabChange('todos')}
      aria-label="To-Do"
    >
      <span className="nav-icon">✅</span>
      <span className="nav-label">To-Do</span>
    </button>

    <button
      className={`nav-tab ${activeTab === 'transactions' ? 'active' : ''}`}
      onClick={() => onTabChange('transactions')}
      aria-label="Transactions"
    >
      <span className="nav-icon">💳</span>
      <span className="nav-label">History</span>
    </button>
  </div>
);

export default BottomNav;
