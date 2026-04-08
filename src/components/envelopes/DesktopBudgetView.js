import React, { useState, useRef, useEffect, useCallback } from 'react';
import './DesktopBudgetView.css';

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
      title={disabled ? 'Select a specific month to assign' : 'Click to assign'}
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
const Inspector = ({ envelope, selectedYear, selectedMonth, onAddTransaction, onViewTransactions, onEdit, onDelete, onClose }) => {
  if (!envelope) return (
    <div className="yn-inspector yn-inspector-empty">
      <div className="yn-inspector-hint">
        <span className="yn-inspector-hint-icon">📊</span>
        <span className="yn-inspector-hint-title">Envelope Details</span>
        <span className="yn-inspector-hint-sub">Click any envelope row to see its balance, spending progress, and quick actions.</span>
      </div>
    </div>
  );

  const pct     = envelope.filled > 0 ? Math.min((envelope.spent / envelope.filled) * 100, 100) : 0;
  const isOver  = envelope.remaining < 0;
  const isWarn  = !isOver && pct >= 80;
  const cat     = CAT_META[envelope.category] || CAT_META.need;

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
        <div className="yn-inspector-avail-label">Available</div>
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
            <span>₹{fmt(envelope.filled)} assigned</span>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="yn-inspector-stats">
        <div className="yn-inspector-stat">
          <span className="yn-inspector-stat-label">Assigned</span>
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

      {/* Actions */}
      <div className="yn-inspector-actions">
        <button className="yn-insp-btn primary"
          onClick={() => onAddTransaction('expense', { envelope: envelope.name })}>
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
  cat, envelopes, collapsed, onToggle,
  onAssign, onAddTransaction, onViewTransactions,
  selectedYear, selectedMonth,
  selectedEnv, onSelectEnv,
  onAddEnvelope,
}) => {
  const meta         = CAT_META[cat];
  const totalAssigned  = envelopes.reduce((s, e) => s + e.filled, 0);
  const totalActivity  = envelopes.reduce((s, e) => s + e.spent,  0);
  const totalAvailable = envelopes.reduce((s, e) => s + e.remaining, 0);
  const isOver = totalAvailable < 0;

  return (
    <div className="yn-group">
      {/* Group header */}
      <div className="yn-group-header" onClick={onToggle} style={{ borderLeftColor: meta.color }}>
        <button className="yn-group-chevron" tabIndex={-1}>
          {collapsed ? '▶' : '▼'}
        </button>
        <span className="yn-group-label" style={{ color: meta.textColor }}>{meta.label}</span>
        <span className="yn-group-count">{envelopes.length}</span>
        <div className="yn-group-totals">
          <span className="yn-group-total-item">
            <span className="yn-group-total-label">Assigned</span>
            <span className="yn-group-total-val">{totalAssigned > 0 ? `₹${fmt(totalAssigned)}` : '—'}</span>
          </span>
          <span className="yn-group-total-item">
            <span className="yn-group-total-label">Activity</span>
            <span className="yn-group-total-val yn-activity">{totalActivity > 0 ? `-₹${fmt(totalActivity)}` : '—'}</span>
          </span>
          <span className="yn-group-total-item">
            <span className="yn-group-total-label">Available</span>
            <span className={`yn-group-total-val ${isOver ? 'yn-over' : 'yn-ok'}`}>
              {totalAssigned === 0 ? '—' : (isOver ? `-₹${fmt(totalAvailable)}` : `₹${fmt(totalAvailable)}`)}
            </span>
          </span>
        </div>
      </div>

      {/* Envelope rows */}
      {!collapsed && (
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

          {/* Add envelope to this category */}
          <button className="yn-add-env-row" onClick={() => onAddEnvelope(cat)}>
            <span className="yn-add-env-plus">+</span>
            <span>Add Envelope</span>
          </button>
        </div>
      )}
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
  handleSettleBorrow,
}) => {
  const [collapsed,       setCollapsed]       = useState({});
  const [selectedEnv,     setSelectedEnv]     = useState(null);

  const toggleCat = (cat) => setCollapsed(p => ({ ...p, [cat]: !p[cat] }));

  const pendingBorrows = (budgets._borrows || []).filter(b => !b.settled);

  const monthLabel = selectedMonth === 'all'
    ? 'All Months'
    : (MONTHS_LONG[selectedMonth] ?? 'Unknown') + ' ' + selectedYear;

  const rtaCls = unallocated === 0 ? 'rta-zero' : unallocated < 0 ? 'rta-over' : 'rta-pos';

  const hasEnvelopes = Object.values(envelopesByCategory).some(arr => arr.length > 0);

  return (
    <div className="yn-root">

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
          <button className="yn-topbar-btn primary" onClick={onFillEnvelopes}>
            💰 Fill Envelopes
          </button>
          <button className="yn-topbar-btn" onClick={onTransfer}>
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

          {/* Column headers */}
          <div className="yn-col-headers">
            <div className="yn-col-name">Envelope</div>
            <div className="yn-col-assigned">Assigned</div>
            <div className="yn-col-activity">Activity</div>
            <div className="yn-col-available">Available</div>
          </div>

          {/* Scrollable envelope list */}
          <div className="yn-table-scroll">

            {/* Category groups */}
            {hasEnvelopes ? (
              CATEGORIES.map(cat => {
                const envs = envelopesByCategory[cat] || [];
                if (envs.length === 0 && collapsed[cat]) return null;
                return (
                  <CategoryGroup
                    key={cat}
                    cat={cat}
                    envelopes={envs}
                    collapsed={!!collapsed[cat]}
                    onToggle={() => toggleCat(cat)}
                    onAssign={onAssign}
                    onAddTransaction={onAddTransaction}
                    onViewTransactions={onViewTransactions}
                    selectedYear={selectedYear}
                    selectedMonth={selectedMonth}
                    selectedEnv={selectedEnv}
                    onSelectEnv={setSelectedEnv}
                    onAddEnvelope={onAddEnvelope}
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

            {/* Add category-less envelope */}
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
        />
      </div>
    </div>
  );
};

export default DesktopBudgetView;
