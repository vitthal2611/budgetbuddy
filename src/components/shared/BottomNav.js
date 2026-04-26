import React from 'react';

const BottomNav = ({ activeTab, onTabChange, onOpenMenu }) => (
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
      className={`nav-tab ${activeTab === 'todos' ? 'active' : ''}`}
      onClick={() => onTabChange('todos')}
      aria-label="To-Do"
    >
      <span className="nav-icon">✅</span>
      <span className="nav-label">To-Do</span>
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
      className="nav-tab nav-more-btn"
      onClick={onOpenMenu}
      aria-label="More options"
    >
      <span className="nav-icon">☰</span>
      <span className="nav-label">More</span>
    </button>
  </div>
);

export default BottomNav;
