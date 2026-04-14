import React from 'react';

const BottomNav = ({ activeTab, onTabChange, onAddPress }) => (
  <div className="bottom-nav">
    <button
      className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
      onClick={() => onTabChange('dashboard')}
      aria-label="Dashboard"
    >
      <span className="nav-icon">🏠</span>
      <span className="nav-label">Home</span>
    </button>

    <button
      className={`nav-tab ${activeTab === 'envelopes' ? 'active' : ''}`}
      onClick={() => onTabChange('envelopes')}
      aria-label="Envelopes"
    >
      <span className="nav-icon">📦</span>
      <span className="nav-label">Budget</span>
    </button>

    <button
      className="nav-add-btn"
      onClick={onAddPress}
      aria-label="Add transaction"
    >
      <span className="nav-add-icon">+</span>
    </button>

    <button
      className={`nav-tab ${activeTab === 'transactions' ? 'active' : ''}`}
      onClick={() => onTabChange('transactions')}
      aria-label="Transactions"
    >
      <span className="nav-icon">💳</span>
      <span className="nav-label">History</span>
    </button>

    <button
      className={`nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
      onClick={() => onTabChange('reports')}
      aria-label="Reports"
    >
      <span className="nav-icon">📊</span>
      <span className="nav-label">Reports</span>
    </button>
  </div>
);

export default BottomNav;
