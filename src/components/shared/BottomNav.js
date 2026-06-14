import React from 'react';

const BottomNav = ({ activeTab, onTabChange }) => (
  <div className="bottom-nav">
    <button
      className={`nav-tab ${activeTab === 'habits' ? 'active' : ''}`}
      onClick={() => onTabChange('habits')}
      aria-label="Habits"
    >
      <span className="nav-icon" aria-hidden="true">H</span>
      <span className="nav-label">Habits</span>
    </button>

    <button
      className={`nav-tab ${activeTab === 'todos' ? 'active' : ''}`}
      onClick={() => onTabChange('todos')}
      aria-label="To-Do"
    >
      <span className="nav-icon" aria-hidden="true">T</span>
      <span className="nav-label">To-Do</span>
    </button>
  </div>
);

export default BottomNav;
