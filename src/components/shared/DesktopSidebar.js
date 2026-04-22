import React, { useState } from 'react';
import './DesktopSidebar.css';

const NAV_ITEMS = [
  { id: 'envelopes',    icon: '📦', label: 'Budget'       },
  { id: 'habits',       icon: '🎯', label: 'Habits'       },
  { id: 'todos',        icon: '✅', label: 'To-Do'        },
  { id: 'transactions', icon: '💳', label: 'Transactions' },
  { id: 'reports',      icon: '📊', label: 'Reports'      },
  { id: 'settings',     icon: '⚙️', label: 'Settings'     },
];

const fmt = (n) => Math.abs(n).toLocaleString('en-IN');

const DesktopSidebar = ({
  activeTab, onTabChange,
  onAddTransaction, onExport, onSignOut,
  user, syncing, isOnline,
  accountBalances = {}, onViewAccount,
}) => {
  const [accountsOpen, setAccountsOpen] = useState(true);

  const accounts = Object.entries(accountBalances)
    .filter(([, bal]) => bal !== 0)
    .sort((a, b) => b[1] - a[1]); // highest balance first

  const totalBalance = accounts.reduce((s, [, b]) => s + b, 0);

  return (
    <aside className="desktop-sidebar">

      {/* ── Brand ── */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo">💰</div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-good">Budget</span>
          <span className="sidebar-brand-buddy">Buddy</span>
        </div>
      </div>

      {/* ── Nav ── */}
      <div className="sidebar-section-label">Navigate</div>
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

      {/* ── Accounts ── */}
      {accounts.length > 0 && (
        <div className="sidebar-accounts">
          {/* Section header */}
          <button
            className="sidebar-accounts-header"
            onClick={() => setAccountsOpen(v => !v)}
          >
            <span className="sidebar-accounts-title">Accounts</span>
            <span className={`sidebar-accounts-total ${totalBalance >= 0 ? 'pos' : 'neg'}`}>
              {totalBalance < 0 ? '-' : ''}₹{fmt(totalBalance)}
            </span>
            <span className="sidebar-accounts-chevron">{accountsOpen ? '▾' : '▸'}</span>
          </button>

          {/* Account rows */}
          {accountsOpen && (
            <div className="sidebar-account-list">
              {accounts.map(([name, bal]) => (
                <button
                  key={name}
                  className="sidebar-account-row"
                  onClick={() => onViewAccount && onViewAccount(name)}
                  title={`View ${name} transactions`}
                >
                  <span className="sidebar-account-dot" style={{
                    background: bal >= 0 ? '#10b981' : '#ef4444'
                  }} />
                  <span className="sidebar-account-name">{name}</span>
                  <span className={`sidebar-account-bal ${bal >= 0 ? 'pos' : 'neg'}`}>
                    {bal < 0 ? '-' : ''}₹{fmt(bal)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Status ── */}
      <div className="sidebar-status">
        {syncing   && <div className="sidebar-status-pill syncing">🔄 Syncing…</div>}
        {!isOnline && <div className="sidebar-status-pill offline">📡 Offline</div>}
      </div>

      {/* ── Footer ── */}
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
};

export default DesktopSidebar;
