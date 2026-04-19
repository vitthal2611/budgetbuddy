import React from 'react';

const MobileMenu = ({ user, onNavigate, onExport, onDeleteAll, onSignOut, onClose }) => (
  <div className="mobile-menu-overlay" onClick={onClose}>
    <div className="mobile-menu" onClick={e => e.stopPropagation()}>
      <div className="mobile-menu-header">
        <h3>More</h3>
        <button className="close-menu" onClick={onClose}>×</button>
      </div>

      <div className="mobile-menu-user">
        <div className="user-avatar">👤</div>
        <div className="user-info">
          <div className="user-email">{user?.email}</div>
          <div className="user-status">Signed in</div>
        </div>
      </div>

      <div className="mobile-menu-items">
        <button className="menu-item" onClick={() => { onNavigate('todos'); onClose(); }}>
          <span className="menu-icon">✅</span>
          <div className="menu-text">
            <div className="menu-title">To-Do</div>
            <div className="menu-subtitle">Tasks & priorities</div>
          </div>
        </button>

        <button className="menu-item" onClick={() => { onNavigate('reports'); onClose(); }}>
          <span className="menu-icon">📊</span>
          <div className="menu-text">
            <div className="menu-title">Reports</div>
            <div className="menu-subtitle">Spending insights</div>
          </div>
        </button>

        <button className="menu-item" onClick={() => { onNavigate('settings'); onClose(); }}>
          <span className="menu-icon">⚙️</span>
          <div className="menu-text">
            <div className="menu-title">Settings</div>
            <div className="menu-subtitle">Envelopes, accounts, preferences</div>
          </div>
        </button>

        <button className="menu-item" onClick={() => { onExport(); onClose(); }}>
          <span className="menu-icon">📥</span>
          <div className="menu-text">
            <div className="menu-title">Export Data</div>
            <div className="menu-subtitle">Download backup</div>
          </div>
        </button>

        <button className="menu-item danger" onClick={() => { onDeleteAll(); onClose(); }}>
          <span className="menu-icon">🗑️</span>
          <div className="menu-text">
            <div className="menu-title">Delete All Data</div>
            <div className="menu-subtitle">Permanently erase everything</div>
          </div>
        </button>

        <button className="menu-item danger" onClick={() => { onSignOut(); onClose(); }}>
          <span className="menu-icon">🚪</span>
          <div className="menu-text">
            <div className="menu-title">Sign Out</div>
            <div className="menu-subtitle">Log out of your account</div>
          </div>
        </button>
      </div>

      <div className="mobile-menu-footer">
        <div className="app-version">GoodBudget v2.0</div>
      </div>
    </div>
  </div>
);

export default MobileMenu;
