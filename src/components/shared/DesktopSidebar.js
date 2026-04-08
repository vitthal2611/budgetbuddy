import React from 'react';
import './DesktopSidebar.css';

const NAV_ITEMS = [
  { id: 'envelopes', icon: '📦', label: 'Budget' },
  { id: 'transactions', icon: '💳', label: 'Transactions' },
  { id: 'reports', icon: '📊', label: 'Reports' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

const DesktopSidebar = ({ activeTab, onTabChange, onAddTransaction, onExport, onSignOut, user, syncing, isOnline }) => (
  <aside className="desktop-sidebar">
    {/* Brand */}
    <div className="sidebar-brand">
      <span className="sidebar-brand-good">Budget</span>
      <span className="sidebar-brand-buddy">Buddy</span>
    </div>

    {/* Add Transaction Button */}
    <button className="sidebar-add-btn" onClick={() => onAddTransaction('expense')}>
      <span className="sidebar-add-icon">+</span>
      Add Transaction
    </button>

    {/* Nav */}
    <nav className="sidebar-nav">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => onTabChange(item.id)}
        >
          <span className="sidebar-nav-icon">{item.icon}</span>
          <span className="sidebar-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>

    {/* Status indicators */}
    <div className="sidebar-status">
      {syncing && <div className="sidebar-status-pill syncing">🔄 Syncing…</div>}
      {!isOnline && <div className="sidebar-status-pill offline">📡 Offline</div>}
    </div>

    {/* Footer */}
    <div className="sidebar-footer">
      <div className="sidebar-user">
        <div className="sidebar-user-avatar">👤</div>
        <div className="sidebar-user-email" title={user?.email}>{user?.email}</div>
      </div>
      <div className="sidebar-footer-actions">
        <button className="sidebar-footer-btn" onClick={onExport} title="Export data">📥</button>
        <button className="sidebar-footer-btn danger" onClick={onSignOut} title="Sign out">🚪</button>
      </div>
    </div>
  </aside>
);

export default DesktopSidebar;
