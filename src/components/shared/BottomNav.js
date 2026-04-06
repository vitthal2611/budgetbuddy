import React from 'react';

const BottomNav = ({ activeTab, onTabChange, onAddPress, onMorePress, showMore }) => (
  <div className="bottom-nav">
    <button
      className={activeTab === 'envelopes' ? 'active' : ''}
      onClick={() => onTabChange('envelopes')}
    >
      <span className="nav-icon">📦</span>
      <span>Envelopes</span>
    </button>

    <button
      className={activeTab === 'transactions' ? 'active' : ''}
      onClick={() => onTabChange('transactions')}
    >
      <span className="nav-icon">💳</span>
      <span>History</span>
    </button>

    <button
      className="nav-add-btn"
      onClick={onAddPress}
      aria-label="Add transaction"
    >
      <span className="nav-add-icon">+</span>
    </button>

    <button
      className={activeTab === 'reports' ? 'active' : ''}
      onClick={() => onTabChange('reports')}
    >
      <span className="nav-icon">📊</span>
      <span>Reports</span>
    </button>

    <button
      className={showMore ? 'active' : ''}
      onClick={onMorePress}
    >
      <span className="nav-icon">☰</span>
      <span>More</span>
    </button>
  </div>
);

export default BottomNav;
