import React, { useState, useMemo, useCallback } from 'react';
import './Dashboard.modern.css';
import { useData } from '../contexts/DataContext';

const fmt = (n) => Math.abs(n).toLocaleString('en-IN');

const parseDate = (ddmmyyyy) => {
  const [d, m, y] = ddmmyyyy.split('-');
  return new Date(y, m - 1, d);
};

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

const Dashboard = ({ transactions, budgets, onAddTransaction, onViewTransactions }) => {
  const { envelopes, getEnvelopeCategory } = useData();
  const today = new Date();

  const [selYear, setSelYear]   = useState(today.getFullYear());
  const [selMonth, setSelMonth] = useState(today.getMonth());

  // ── Month navigation ──────────────────────────────────────────
  const prevMonth = () => {
    if (selMonth === 0) { setSelMonth(11); setSelYear(y => y - 1); }
    else setSelMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (selMonth === 11) { setSelMonth(0); setSelYear(y => y + 1); }
    else setSelMonth(m => m + 1);
  };
  const isCurrentMonth = selYear === today.getFullYear() && selMonth === today.getMonth();

  // ── Filtered transactions ─────────────────────────────────────
  const monthTx = useMemo(() => transactions.filter(t => {
    const d = parseDate(t.date);
    return d.getFullYear() === selYear && d.getMonth() === selMonth;
  }), [transactions, selYear, selMonth]);

  // ── Summary numbers ───────────────────────────────────────────
  const { income, expense } = useMemo(() => {
    let inc = 0, exp = 0;
    monthTx.forEach(t => {
      const amt = parseFloat(t.amount);
      if (t.type === 'income') inc += amt;
      else if (t.type === 'expense') exp += amt;
    });
    return { income: inc, expense: exp };
  }, [monthTx]);

  // ── Account balances — all-time running totals ────────────────
  const accountBalances = useMemo(() => {
    const accounts = {};
    transactions.forEach(t => {
      const amt = parseFloat(t.amount);
      if (t.type === 'income') {
        accounts[t.paymentMethod] = (accounts[t.paymentMethod] || 0) + amt;
      } else if (t.type === 'expense') {
        accounts[t.paymentMethod] = (accounts[t.paymentMethod] || 0) - amt;
      } else if (t.type === 'transfer') {
        accounts[t.sourceAccount]      = (accounts[t.sourceAccount]      || 0) - amt;
        accounts[t.destinationAccount] = (accounts[t.destinationAccount] || 0) + amt;
      }
    });
    return accounts;
  }, [transactions]);

  const net = income - expense;
  const budgetKey = `${selYear}-${selMonth}`;

  // ── Budget vs actual per envelope ─────────────────────────────
  const envelopeStats = useMemo(() => {
    const spending = {};
    monthTx.forEach(t => {
      if (t.type === 'expense' && t.envelope) {
        spending[t.envelope] = (spending[t.envelope] || 0) + parseFloat(t.amount);
      }
    });

    const monthBudgets = budgets[budgetKey] || {};

    // Union of all envelopes that have a budget OR spending this month
    const allNames = new Set([
      ...envelopes.map(e => e.name),
      ...Object.keys(spending),
      ...Object.keys(monthBudgets),
    ]);

    return Array.from(allNames).map(name => {
      const budgeted = parseFloat(monthBudgets[name] || 0);
      const spent    = parseFloat(spending[name]     || 0);
      const remaining = budgeted - spent;
      const pct = budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0;
      const category = getEnvelopeCategory(name);
      return { name, budgeted, spent, remaining, pct, category, isOver: remaining < 0 };
    });
  }, [monthTx, budgets, budgetKey, envelopes, getEnvelopeCategory]);

  // ── Today's transactions (individual, not grouped) ────────────
  const todayStr = `${String(today.getDate()).padStart(2,'0')}-${String(today.getMonth()+1).padStart(2,'0')}-${today.getFullYear()}`;
  const todayTx = useMemo(() =>
    transactions
      .filter(t => t.date === todayStr && t.type === 'expense')
      .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount)),
    [transactions, todayStr]
  );
  const todayTotal = todayTx.reduce((s, t) => s + parseFloat(t.amount), 0);

  // ── Render envelope row (shared for all categories) ───────────
  const renderEnvelopeRow = useCallback((env) => (
    <div
      key={env.name}
      className="db-env-item"
      onClick={() => onViewTransactions({ envelope: env.name, year: selYear, month: selMonth })}
    >
      <div className="db-env-left">
        <span className="db-env-name">{env.name}</span>
        <div className="db-env-bar">
          <div
            className={`db-env-fill ${env.isOver ? 'over' : env.category}`}
            style={{ width: `${env.pct}%` }}
          />
        </div>
        <span className="db-env-meta">
          ₹{fmt(env.spent)} of ₹{fmt(env.budgeted)}
        </span>
      </div>
      <span className={`db-env-remaining ${env.isOver ? 'neg' : env.spent > 0 ? 'pos' : 'zero'}`}>
        {env.isOver ? '-' : ''}₹{fmt(env.remaining)}
      </span>
    </div>
  ), [onViewTransactions, selYear, selMonth]);

  const hasData = monthTx.length > 0;

  return (
    <div className="dashboard">

      {/* ── Sticky header ── */}
      <div className="db-header">
        <div className="db-header-top">
          <div className="db-logo">
            <div className="db-avatar">BB</div>
            <span className="db-app-name">BudgetBuddy</span>
          </div>
          <button
            className="db-add-btn"
            onClick={() => onAddTransaction('expense')}
            aria-label="Add transaction"
          >
            + Add
          </button>
        </div>

        {/* Month nav */}
        <div className="db-month-nav">
          <button className="db-month-arrow" onClick={prevMonth}>‹</button>
          <div className="db-month-center">
            <span className="db-month-label">{MONTHS[selMonth]} {selYear}</span>
            {!isCurrentMonth && (
              <button className="db-today-btn" onClick={() => { setSelYear(today.getFullYear()); setSelMonth(today.getMonth()); }}>
                Today
              </button>
            )}
          </div>
          <button className="db-month-arrow" onClick={nextMonth}>›</button>
        </div>

        {/* Summary strip */}
        <div className="db-summary-strip">
          <div className="db-strip-item">
            <span className="db-strip-label">Income</span>
            <span className="db-strip-value income">+₹{fmt(income)}</span>
          </div>
          <div className="db-strip-div" />
          <div className="db-strip-item">
            <span className="db-strip-label">Expense</span>
            <span className="db-strip-value expense">₹{fmt(expense)}</span>
          </div>
          <div className="db-strip-div" />
          <div className="db-strip-item">
            <span className="db-strip-label">Net</span>
            <span className={`db-strip-value ${net >= 0 ? 'income' : 'expense'}`}>
              {net >= 0 ? '+' : '-'}₹{fmt(net)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="db-scroll">

        {!hasData ? (
          <div className="db-empty">
            <div className="db-empty-icon">📊</div>
            <div className="db-empty-title">No data for {MONTHS[selMonth]}</div>
            <div className="db-empty-sub">Add income or expenses to see your dashboard</div>
            <button className="db-empty-btn" onClick={() => onAddTransaction('income')}>Add Income</button>
          </div>
        ) : (
          <>
            {/* Accounts — running balance */}
            {Object.keys(accountBalances).length > 0 && (
              <div className="db-section">
                <div className="db-section-title">Accounts <span className="db-section-subtitle">(all-time balance)</span></div>
                <div className="db-card">
                  {Object.entries(accountBalances).map(([name, bal], i, arr) => (
                    <div
                      key={name}
                      className={`db-account-row ${i < arr.length - 1 ? 'bordered' : ''}`}
                      onClick={() => onViewTransactions({ paymentMethod: name, year: selYear, month: selMonth })}
                    >
                      <div className="db-account-icon">💳</div>
                      <span className="db-account-name">{name}</span>
                      <span className={`db-account-bal ${bal >= 0 ? 'pos' : 'neg'}`}>
                        {bal < 0 ? '-' : ''}₹{fmt(bal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Today's spending — only show when viewing current month */}
            {isCurrentMonth && todayTx.length > 0 && (
              <div className="db-section">
                <div className="db-section-title">
                  Today
                  <span className="db-section-badge">-₹{fmt(todayTotal)}</span>
                </div>
                <div className="db-card">
                  {todayTx.map((t, i) => (
                    <div key={t.id} className={`db-today-row ${i < todayTx.length - 1 ? 'bordered' : ''}`}>
                      <div className={`db-today-icon ${getEnvelopeCategory(t.envelope)}`}>
                        {getEnvelopeCategory(t.envelope) === 'need' ? '🛒' :
                         getEnvelopeCategory(t.envelope) === 'want' ? '🎉' : '💰'}
                      </div>
                      <div className="db-today-body">
                        <span className="db-today-note">{t.note}</span>
                        <span className="db-today-env">{t.envelope}</span>
                      </div>
                      <span className="db-today-amt">-₹{fmt(t.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Budget overview — all categories */}
            {envelopeStats.length > 0 && (
              <div className="db-section">
                <div className="db-section-title">Envelopes</div>
                {[
                  { key: 'need',   label: 'Needs',           icon: '🛒' },
                  { key: 'want',   label: 'Wants',           icon: '🎉' },
                  { key: 'saving', label: 'Savings & Goals', icon: '💰' },
                ].map(({ key, label, icon }) => {
                  const list = envelopeStats.filter(e => e.category === key);
                  if (list.length === 0) return null;
                  return (
                    <div key={key} className="db-env-group">
                      <div className="db-env-group-label">{icon} {label}</div>
                      <div className="db-card">
                        {list.map(renderEnvelopeRow)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
