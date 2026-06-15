import React from 'react';
import './DesktopSidebar.css';

const NAV_ITEMS = [
  { id: 'habits', icon: '🏠', label: 'Today' },
  { id: 'habitHistory', icon: '✓', label: 'Habits' },
  { id: 'todos', icon: '📝', label: 'To-Do' },
];

const DesktopSidebar = ({ activeTab, onTabChange, onSignOut, user, isOnline }) => (
  <aside className="desktop-sidebar">
    <div className="sidebar-brand">
      <div className="sidebar-brand-logo">BB</div>
      <div className="sidebar-brand-text">
        <span className="sidebar-brand-good">Budget</span>
        <span className="sidebar-brand-buddy">Buddy</span>
      </div>
    </div>

    <div className="sidebar-section-label">Navigate</div>
    <nav className="sidebar-nav">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => onTabChange(item.id)}
        >
          <span className="sidebar-nav-icon" aria-hidden="true">{item.icon}</span>
          <span className="sidebar-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>

    <div className="sidebar-status">
      {!isOnline && <div className="sidebar-status-pill offline">Offline</div>}
    </div>

    <div className="sidebar-footer">
      <div className="sidebar-user">
        <div className="sidebar-user-avatar">U</div>
        <div className="sidebar-user-email" title={user?.email}>{user?.email}</div>
      </div>
      <div className="sidebar-footer-actions">
        <button className="sidebar-footer-btn danger" onClick={onSignOut} title="Sign out">Out</button>
      </div>
    </div>
  </aside>
);

export default DesktopSidebar;
