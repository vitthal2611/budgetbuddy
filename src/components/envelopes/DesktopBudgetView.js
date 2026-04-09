import React, { useState, useRef, useEffect, useCallback } from 'react';
import './DesktopBudgetView.css';
import MonthLockBanner from '../shared/MonthLockBanner';
import { isMonthLocked } from '../../utils/budgetRules';

const fmt  = (n) => Math.abs(n).toLocaleString('en-IN');
const fmtS = (n) => n < 0 ? `-₹${fmt(n)}` : `₹${fmt(n)}`;

const MONTHS_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CATEGORIES   = ['need','want','saving'];

const CAT_META = {
  need:   { label: 'Needs',           color: '#10b981', bg: '#ecfdf5', textColor: '#065f46' },
  want:   { label: 'Wants',           color: '#f59e0b', bg: '#fffbeb', textColor: '#92400e' },
  saving: { label: 'Savings & Goals', color: '#6366f1', bg: '#eef2ff', textColor: '#3730a3' },
};

/* ─── Inline editable Assigned cell ─────────────────────────── */
const AssignedCell = ({ value, onSave, disabled }) => {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState('');
  const inputRef = useRef(null);

  const startEdit = () => {
    if (disabled) return;
    setDraft(value > 0 ? String(value) : '');
    setEditing(true);
  };

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.select();
  }, [editing]);

  const commit = useCallback(() => {
    onSave(parseFloat(draft) || 0);
    setEditing(false);
  }, [draft, onSave]);

  const handleKey = (e) => {
    if (e.key === 'Enter')  commit();
    if (e.key === 'Escape') setEditing(false);
  };

  if (editing) {
    return (
      <div className="yn-assigned-editing">
        <span className="yn-assigned-prefix">₹</span>
        <input
          ref={inputRef}
          className="yn-assigned-input"
          type="number"
          min="0"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKey}
          autoFocus
        />
      </div>
    );
  }

  return (
    <button
      className={`yn-assigned-btn ${value > 0 ? 'filled' : 'empty'} ${disabled ? 'disabled' : ''}`}
      onClick={startEdit}
      title={disabled ? 'Select a specific month to fill' : 'Click to fill'}
    >
      {value > 0 ? `₹${fmt(value)}` : <span className="yn-assigned-dash">—</span>}
    </button>
  );
};

/* ─── Available pill ─────────────────────────────────────────── */
const AvailablePill = ({ value, filled }) => {
  if (filled === 0) return <span className="yn-avail-empty">—</span>;
  const isOver = value < 0;
  const isZero = value === 0;
  return (
    <span className={`yn-avail-pill ${isOver ? 'over' : isZero ? 'zero' : 'ok'}`}>
      {isOver ? `-₹${fmt(value)}` : `₹${fmt(value)}`}
    </span>
  );
};

/* ─── Inspector panel (right side) ──────────────────────────── */
const Inspector = ({ envelope, selectedYear, selectedMonth, onAddTransaction, onViewTransactions, onEdit, onDelete, onClose, onAddEnvelope, budgets, transactions, monthLocked }) => {
  if (!envelope) return (
    <div className="yn-inspector yn-inspector-empty">
      <div className="yn-inspector-hint">
        <span className="yn-inspector-hint-icon">📊</span>
        <span className="yn-inspector-hint-title">Envelope Details</span>
        <span className="yn-inspector-hint-sub">Click any envelope row to see its balance, spending progress, and quick actions.</span>
        <button className="yn-insp-btn primary" style={{ marginTop: 24 }} onClick={() => onAddEnvelope()}>
          ＋ Add New Envelope
        </button>
      </div>
    </div>
  );

  const pct     = envelope.filled > 0 ? Math.min((envelope.spent / envelope.filled) * 100, 100) : 0;
  const isOver  = envelope.remaining < 0;
  const isWarn  = !isOver && pct >= 80;
  const cat     = CAT_META[envelope.category] || CAT_META.need;

  // Calculate month-wise history
  const monthHistory = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonthIdx = currentDate.getMonth();

  // Get last 6 months including current
  for (let i = 5; i >= 0; i--) {
    let year = currentYear;
    let month = currentMonthIdx - i;
    
    if (month < 0) {
      month += 12;
      year -= 1;
    }

    const budgetKey = `${year}-${month}`;
    const filled = (budgets[budgetKey] && budgets[budgetKey][envelope.name]) || 0;
    
    // Calculate spent for this month
    let spent = 0;
    transactions.forEach(t => {
      if (t.type === 'expense' && t.envelope === envelope.name) {
        const parts = t.date.split('-');
        if (parts.length === 3) {
          const txYear = parseInt(parts[2]);
          const txMonth = parseInt(parts[1]) - 1;
          if (txYear === year && txMonth === month) {
            spent += parseFloat(t.amount) || 0;
          }
        }
      }
    });

    const balance = filled - spent;
    const monthName = MONTHS_LONG[month];
    const shortMonth = monthName.substring(0, 3);

    monthHistory.push({
      year,
      month,
      monthName,
      shortMonth,
      filled,
      spent,
      balance,
      isCurrent: year === currentYear && month === currentMonthIdx
    });
  }

  return (
    <div className="yn-inspector">
      <div className="yn-inspector-header">
        <div className="yn-inspector-cat" style={{ background: cat.bg, color: cat.textColor }}>
          {cat.label}
        </div>
        <button className="yn-inspector-close" onClick={onClose}>×</button>
      </div>

      <div className="yn-inspector-name">{envelope.name}</div>

      {/* Big available number */}
      <div className={`yn-inspector-avail ${isOver ? 'over' : 'ok'}`}>
        <div className="yn-inspector-avail-label">Balance</div>
        <div className="yn-inspector-avail-value">
          {envelope.filled === 0 ? '—' : (isOver ? '-' : '') + '₹' + fmt(envelope.remaining)}
        </div>
      </div>

      {/* Progress bar */}
      {envelope.filled > 0 && (
        <div className="yn-inspector-bar-wrap">
          <div className="yn-inspector-bar">
            <div
              className={`yn-inspector-bar-fill ${isOver ? 'over' : isWarn ? 'warn' : envelope.category}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="yn-inspector-bar-labels">
            <span>₹{fmt(envelope.spent)} spent</span>
            <span>₹{fmt(envelope.filled)} filled</span>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="yn-inspector-stats">
        <div className="yn-inspector-stat">
          <span className="yn-inspector-stat-label">Filled</span>
          <span className="yn-inspector-stat-value">₹{fmt(envelope.filled)}</span>
        </div>
        <div className="yn-inspector-stat">
          <span className="yn-inspector-stat-label">Spent</span>
          <span className="yn-inspector-stat-value yn-stat-spent">₹{fmt(envelope.spent)}</span>
        </div>
        {envelope.envelopeType === 'goal' && envelope.goalAmount > 0 && (
          <div className="yn-inspector-stat">
            <span className="yn-inspector-stat-label">Goal</span>
            <span className="yn-inspector-stat-value">₹{fmt(envelope.goalAmount)}</span>
          </div>
        )}
        {envelope.envelopeType === 'annual' && envelope.annualAmount > 0 && (
          <div className="yn-inspector-stat">
            <span className="yn-inspector-stat-label">Annual</span>
            <span className="yn-inspector-stat-value">₹{fmt(envelope.annualAmount)}</span>
          </div>
        )}
      </div>

      {/* Month-wise history */}
      <div className="yn-inspector-history">
        <div className="yn-history-title">Last 6 Months</div>
        <div className="yn-history-table">
          <div className="yn-history-header">
            <div className="yn-history-col">Month</div>
            <div className="yn-history-col">Filled</div>
            <div className="yn-history-col">Spent</div>
            <div className="yn-history-col">Balance</div>
          </div>
          {monthHistory.map((m, idx) => (
            <div key={idx} className={`yn-history-row ${m.isCurrent ? 'current' : ''}`}>
              <div className="yn-history-col yn-history-month">
                {m.shortMonth} '{String(m.year).slice(-2)}
                {m.isCurrent && <span className="yn-current-badge">Now</span>}
              </div>
              <div className="yn-history-col yn-history-filled">
                {m.filled > 0 ? `₹${fmt(m.filled)}` : '—'}
              </div>
              <div className="yn-history-col yn-history-spent">
                {m.spent > 0 ? `₹${fmt(m.spent)}` : '—'}
              </div>
              <div className={`yn-history-col yn-history-balance ${m.balance < 0 ? 'negative' : m.balance > 0 ? 'positive' : ''}`}>
                {m.filled === 0 && m.spent === 0 ? '—' : (m.balance < 0 ? '-' : '') + '₹' + fmt(m.balance)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="yn-inspector-actions">
        <button 
          className="yn-insp-btn primary"
          onClick={() => onAddTransaction('expense', { envelope: envelope.name })}
          disabled={monthLocked}
          title={monthLocked ? "Assign all income before spending" : "Add expense to this envelope"}
        >
          ＋ Add Expense
        </button>
        <button className="yn-insp-btn"
          onClick={() => onViewTransactions({ envelope: envelope.name, year: selectedYear, month: selectedMonth })}>
          ↗ View Transactions
        </button>
        <button className="yn-insp-btn"
          onClick={() => onEdit(envelope)}>
          ✏️ Edit Envelope
        </button>
        <button className="yn-insp-btn danger"
          onClick={() => onDelete(envelope.name)}>
          🗑️ Delete Envelope
        </button>
      </div>
    </div>
  );
};

/* ─── Category group ─────────────────────────────────────────── */
const CategoryGroup = ({
  cat, envelopes,
  onAssign, onAddTransaction, onViewTransactions,
  selectedYear, selectedMonth,
  selectedEnv, onSelectEnv,
}) => {
  const meta = CAT_META[cat];

  return (
    <div className="yn-group">
      {/* Group header - simple divider */}
      <div className="yn-group-header" style={{ borderLeftColor: meta.color }}>
        <span className="yn-group-label" style={{ color: meta.textColor }}>{meta.label}</span>
      </div>

      {/* Column headers for this category */}
      <div className="yn-col-headers yn-col-headers-category">
        <div className="yn-col-name">Envelope</div>
        <div className="yn-col-assigned">Filled</div>
        <div className="yn-col-activity">Spent</div>
        <div className="yn-col-available">Balance</div>
      </div>

      {/* Envelope rows */}
      <div className="yn-env-list">
        {envelopes.map(env => {
          const isOver  = env.remaining < 0;
          const pct     = env.filled > 0 ? Math.min((env.spent / env.filled) * 100, 100) : 0;
          const isWarn  = !isOver && pct >= 80;
          const isSelected = selectedEnv?.name === env.name;

          return (
            <div
              key={env.name}
              className={`yn-env-row ${isOver ? 'yn-row-over' : ''} ${isSelected ? 'yn-row-selected' : ''}`}
              onClick={() => onSelectEnv(isSelected ? null : env)}
            >
              {/* Left accent */}
              <div className="yn-row-accent" style={{ background: meta.color }} />

              {/* Name */}
              <div className="yn-row-name">
                <span className="yn-row-env-name">{env.name}</span>
                {env.envelopeType === 'goal'   && <span className="yn-badge goal">Goal</span>}
                {env.envelopeType === 'annual' && <span className="yn-badge annual">Annual</span>}
              </div>

              {/* Assigned */}
              <div className="yn-row-assigned" onClick={e => e.stopPropagation()}>
                <AssignedCell
                  value={env.filled}
                  onSave={val => onAssign(env.name, val)}
                  disabled={selectedMonth === 'all'}
                />
              </div>

              {/* Activity */}
              <div className="yn-row-activity">
                {env.spent > 0
                  ? <span className="yn-activity-val">-₹{fmt(env.spent)}</span>
                  : <span className="yn-dash">—</span>
                }
              </div>

              {/* Available */}
              <div className="yn-row-available">
                <AvailablePill value={env.remaining} filled={env.filled} />
                {env.filled > 0 && (
                  <div className="yn-row-bar">
                    <div
                      className={`yn-row-bar-fill ${isOver ? 'over' : isWarn ? 'warn' : cat}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Main DesktopBudgetView ─────────────────────────────────── */
const DesktopBudgetView = ({
  envelopesByCategory,
  monthlyIncome,
  totalFilled,
  totalSpent,
  unallocated,
  accountBalances,
  totalAccountBalance,
  selectedYear,
  selectedMonth,
  availableYears,
  onMonthChange,
  onPrevMonth,
  onNextMonth,
  onGoToday,
  isCurrentMonth,
  onAssign,
  onAddTransaction,
  onViewTransactions,
  onFillEnvelopes,
  onTransfer,
  onAddEnvelope,
  onEditEnvelope,
  onDeleteEnvelope,
  budgets,
  transactions,
  handleSettleBorrow,
}) => {
  const [selectedEnv, setSelectedEnv] = useState(null);

  const pendingBorrows = (budgets._borrows || []).filter(b => !b.settled);

  const monthLabel = selectedMonth === 'all'
    ? 'All Months'
    : (MONTHS_LONG[selectedMonth] ?? 'Unknown') + ' ' + selectedYear;

  const rtaCls = unallocated === 0 ? 'rta-zero' : unallocated < 0 ? 'rta-over' : 'rta-pos';

  const hasEnvelopes = Object.values(envelopesByCategory).some(arr => arr.length > 0);
  
  // Check if month is locked
  const monthLocked = isMonthLocked(unallocated);

  return (
    <div className="yn-root">

      {/* ══ LOCK BANNER ══════════════════════════════════════════ */}
      <MonthLockBanner 
        readyToAssign={unallocated} 
        onFillEnvelopes={onFillEnvelopes}
      />

      {/* ══ TOP BAR ══════════════════════════════════════════════ */}
      <div className="yn-topbar">

        {/* Month navigation */}
        <div className="yn-month-nav">
          <button className="yn-month-arrow" onClick={onPrevMonth}>‹</button>
          <div className="yn-month-label">
            <span className="yn-month-text">{monthLabel}</span>
            {!isCurrentMonth && selectedMonth !== 'all' && (
              <button className="yn-today-chip" onClick={onGoToday}>Today</button>
            )}
          </div>
          <button className="yn-month-arrow" onClick={onNextMonth}>›</button>
        </div>

        {/* Ready to Assign — hero element */}
        <div className={`yn-rta ${rtaCls}`}>
          <span className="yn-rta-label">Ready to Assign</span>
          <span className="yn-rta-amount">
            {unallocated < 0 ? '-' : ''}₹{fmt(unallocated)}
          </span>
          {unallocated !== 0 && (
            <span className="yn-rta-hint">
              {unallocated > 0 ? 'Assign to envelopes' : 'Over-assigned'}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="yn-topbar-actions">
          <button 
            className="yn-topbar-btn primary" 
            onClick={onFillEnvelopes}
          >
            💰 Fill Envelopes
          </button>
          <button 
            className="yn-topbar-btn" 
            onClick={onTransfer}
            disabled={monthLocked}
            title={monthLocked ? "Assign all income first" : "Transfer between envelopes"}
          >
            ⇄ Transfer
          </button>
        </div>
      </div>

      {/* ══ PENDING BORROWS ══════════════════════════════════════ */}
      {pendingBorrows.length > 0 && (
        <div className="yn-borrows-bar">
          <span className="yn-borrows-icon">💸</span>
          <span className="yn-borrows-title">Pending Settlements</span>
          {pendingBorrows.map(b => (
            <div key={b.id} className="yn-borrow-item">
              <span><strong>{b.to}</strong> borrowed <strong>₹{fmt(b.amount)}</strong> from <strong>{b.from}</strong></span>
              <button className="yn-settle-btn" onClick={() => handleSettleBorrow(b)}>Settle ↩</button>
            </div>
          ))}
        </div>
      )}

      {/* ══ BODY: table + inspector ══════════════════════════════ */}
      <div className="yn-body">

        {/* ── Budget table ── */}
        <div className="yn-table-area">

          {/* Scrollable envelope list */}
          <div className="yn-table-scroll">

            {/* Category groups */}
            {hasEnvelopes ? (
              CATEGORIES.map(cat => {
                const envs = envelopesByCategory[cat] || [];
                if (envs.length === 0) return null;
                return (
                  <CategoryGroup
                    key={cat}
                    cat={cat}
                    envelopes={envs}
                    onAssign={onAssign}
                    onAddTransaction={onAddTransaction}
                    onViewTransactions={onViewTransactions}
                    selectedYear={selectedYear}
                    selectedMonth={selectedMonth}
                    selectedEnv={selectedEnv}
                    onSelectEnv={setSelectedEnv}
                  />
                );
              })
            ) : (
              <div className="yn-empty">
                <div className="yn-empty-icon">📦</div>
                <div className="yn-empty-title">No envelopes yet</div>
                <div className="yn-empty-sub">Create your first envelope to start budgeting</div>
                <button className="yn-topbar-btn primary" style={{ marginTop: 16 }} onClick={() => onAddEnvelope()}>
                  + Create First Envelope
                </button>
              </div>
            )}

            {/* Global add envelope button at bottom */}
            {hasEnvelopes && (
              <button className="yn-add-envelope-global" onClick={() => onAddEnvelope()}>
                + Add Envelope
              </button>
            )}
          </div>
        </div>

        {/* ── Inspector panel ── */}
        <Inspector
          envelope={selectedEnv}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onAddTransaction={onAddTransaction}
          onViewTransactions={onViewTransactions}
          onEdit={(env) => { onEditEnvelope(env); setSelectedEnv(null); }}
          onDelete={(name) => { onDeleteEnvelope(name); setSelectedEnv(null); }}
          onClose={() => setSelectedEnv(null)}
          onAddEnvelope={onAddEnvelope}
          budgets={budgets}
          transactions={transactions}
          monthLocked={monthLocked}
        />
      </div>
    </div>
  );
};

export default DesktopBudgetView;
