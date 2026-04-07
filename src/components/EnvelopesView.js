import React, { useState, useCallback } from 'react';
import './EnvelopesView.css';
import { useData } from '../contexts/DataContext';
import { useEnvelopesData, computeMonthlyFill } from '../hooks/useEnvelopesData';
import FillEnvelopesModal from './envelopes/FillEnvelopesModal';
import TransferModal from './envelopes/TransferModal';
import { AddEnvelopeModal, EditEnvelopeModal, DeleteEnvelopeModal } from './envelopes/EnvelopeFormModals';

const fmt = (n) => Math.abs(n).toLocaleString('en-IN');
const getCatIcon = (cat) => cat === 'need' ? '🛒' : cat === 'want' ? '🎉' : '💰';

const renderEnvelopeCard = (envelope, {
  expandedEnv, setExpandedEnv,
  goalProgress, annualYTD,
  selectedYear, selectedMonth,
  onAddTransaction, onViewTransactions,
  setTransferData, setShowTransferModal,
  handleEditOpen, setDeleteTarget,
}) => {
  const pct = envelope.filled > 0 ? Math.min((envelope.spent / envelope.filled) * 100, 100) : 0;
  const isOver    = envelope.remaining < 0;
  const isWarning = !isOver && pct >= 80;
  const isLow     = !isOver && !isWarning && pct >= 50;
  const isGoal    = envelope.envelopeType === 'goal';
  const isAnnual  = envelope.envelopeType === 'annual';
  const goalPct   = isGoal && envelope.goalAmount > 0
    ? Math.min((goalProgress[envelope.name] / envelope.goalAmount) * 100, 100) : 0;
  const isExpanded = expandedEnv === envelope.name;

  // Status color for left bar
  const statusCls = isOver ? 'status-over' : isWarning ? 'status-warn' : isLow ? 'status-low' : 'status-ok';

  let goalPaceLabel = null;
  if (isGoal && envelope.goalAmount > 0 && envelope.dueDate) {
    const due = new Date(envelope.dueDate);
    const now = new Date(selectedYear, selectedMonth, 1);
    const monthsLeft = Math.max(1,
      (due.getFullYear() - now.getFullYear()) * 12 + (due.getMonth() - now.getMonth()) + 1);
    const saved = goalProgress[envelope.name] || 0;
    const neededPerMonth = Math.ceil((envelope.goalAmount - saved) / monthsLeft);
    const expectedByNow  = envelope.goalAmount - neededPerMonth * monthsLeft;
    if (saved >= envelope.goalAmount)
      goalPaceLabel = { text: 'Goal reached 🎉', cls: 'pace-done' };
    else if (saved >= expectedByNow)
      goalPaceLabel = { text: `On track · ₹${fmt(neededPerMonth)}/mo needed`, cls: 'pace-ok' };
    else
      goalPaceLabel = { text: `Behind · need ₹${fmt(neededPerMonth)}/mo`, cls: 'pace-behind' };
  }

  let annualPaceLabel = null;
  if (isAnnual && envelope.annualAmount > 0) {
    const ytd = annualYTD[envelope.name] || 0;
    const expectedYTD = Math.ceil((envelope.annualAmount / 12) * (selectedMonth + 1));
    if (ytd >= envelope.annualAmount)
      annualPaceLabel = { text: 'Fully funded for year', cls: 'pace-done' };
    else if (ytd >= expectedYTD)
      annualPaceLabel = { text: `On track · ₹${fmt(ytd)} of ₹${fmt(expectedYTD)} expected`, cls: 'pace-ok' };
    else
      annualPaceLabel = { text: `Behind · ₹${fmt(ytd)} of ₹${fmt(expectedYTD)} expected YTD`, cls: 'pace-behind' };
  }

  return (
    <div key={envelope.name}
      className={`env-row ${isOver ? 'env-over' : ''} ${isGoal ? 'env-goal' : ''} ${isAnnual ? 'env-annual' : ''} ${envelope.filled === 0 ? 'env-unfilled' : ''} ${isExpanded ? 'env-expanded' : ''}`}
      onDoubleClick={() => onAddTransaction('expense', { envelope: envelope.name })}
      title="Double-click to add expense"
    >
      {/* Left status bar */}
      <div className={`env-status-bar ${envelope.filled === 0 ? 'status-empty' : statusCls}`} />

      <div className="env-row-body">
        {/* Row 1: name + remaining */}
        <div className="env-row-top" onClick={() => setExpandedEnv(isExpanded ? null : envelope.name)}>
          <span className="env-row-name">{envelope.name}</span>
          <span className={`env-row-remaining ${isOver ? 'negative' : envelope.filled === 0 ? 'unfilled' : 'positive'}`}>
            {envelope.filled === 0 ? 'Not filled' : `${isOver ? '-' : ''}₹${fmt(envelope.remaining)}`}
          </span>
        </div>

        {/* Row 2: progress bar */}
        {envelope.filled > 0 && (
          <div className="env-row-bar">
            <div className={`env-row-fill ${isOver ? 'over' : isWarning ? 'warning' : envelope.category}`}
              style={{ width: `${isGoal ? goalPct : pct}%` }} />
          </div>
        )}

        {/* Row 3: spent/filled + pace */}
        {envelope.filled > 0 && (
          <div className="env-row-sub">
            <span>₹{fmt(envelope.spent)} / ₹{fmt(envelope.filled)}</span>
            {(goalPaceLabel || annualPaceLabel) && (
              <>
                <span className="env-row-dot">·</span>
                <span className={`env-pace-label ${(goalPaceLabel || annualPaceLabel).cls}`}>
                  {(goalPaceLabel || annualPaceLabel).text}
                </span>
              </>
            )}
          </div>
        )}

        {/* Expanded: view transactions */}
        {isExpanded && (
          <button className="env-view-txn-btn"
            onClick={e => { e.stopPropagation(); onViewTransactions({ envelope: envelope.name, year: selectedYear, month: selectedMonth }); }}>
            📋 View Transactions
          </button>
        )}
      </div>
    </div>
  );
};

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CATEGORIES = [
  { key: 'need',   label: 'Needs',           icon: '🛒' },
  { key: 'want',   label: 'Wants',           icon: '🎉' },
  { key: 'saving', label: 'Savings & Goals', icon: '💰' },
];

const EMPTY_ENV = { name: '', category: 'need', envelopeType: 'regular', annualAmount: '', goalAmount: '', dueDate: '' };

const EnvelopesView = ({ transactions, budgets, setBudgets, onAddTransaction, onViewTransactions }) => {
  const { envelopes: customEnvelopes, addEnvelope, removeEnvelope, updateEnvelope } = useData();

  // ── Month selection ──────────────────────────────────────────
  const today = new Date();
  const [selectedYear,  setSelectedYear]  = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('all');

  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };
  const goToday = () => { setSelectedMonth(today.getMonth()); setSelectedYear(today.getFullYear()); };
  const isCurrentMonth = selectedMonth !== 'all' && selectedYear === today.getFullYear() && selectedMonth === today.getMonth();

  // Build year list from transactions + current year
  const availableYears = React.useMemo(() => {
    const years = new Set([today.getFullYear()]);
    transactions.forEach(t => {
      const parts = t.date.split('-');
      if (parts[2]) years.add(parseInt(parts[2]));
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMonthDropdownChange = (e) => {
    const val = e.target.value;
    if (val === 'all') {
      setSelectedMonth('all');
    } else {
      const [y, m] = val.split('-');
      setSelectedYear(parseInt(y));
      setSelectedMonth(parseInt(m));
    }
  };
  // ── UI state ─────────────────────────────────────────────────
  const [showFillModal,     setShowFillModal]     = useState(false);
  const [showAddModal,      setShowAddModal]      = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [expandedEnv,       setExpandedEnv]       = useState(null);
  const [deleteTarget,      setDeleteTarget]      = useState(null);
  const [editTarget,        setEditTarget]        = useState(null);
  const [editForm,          setEditForm]          = useState({});
  const [newEnv,            setNewEnv]            = useState(EMPTY_ENV);
  const [transferData,      setTransferData]      = useState({ from: '', to: '', amount: '' });
  const [transferError,     setTransferError]     = useState('');
  const [showAccounts,      setShowAccounts]      = useState(false);

  // ── Derived data ─────────────────────────────────────────────
  const {
    budgetKey, envelopeFills, monthlySpending,
    monthlyIncome, totalFilled, totalSpent, unallocated,
    accountBalances, totalAccountBalance,
    goalProgress, annualYTD, envelopesByCategory, lastUsed,
  } = useEnvelopesData({ transactions, budgets, customEnvelopes, selectedYear, selectedMonth });

  // ── Fill handler ─────────────────────────────────────────────
  const handleFillChange = useCallback((name, value) => {
    const num = value === '' ? 0 : parseFloat(value) || 0;
    const newFills = { ...envelopeFills, [name]: num };
    const newTotal = Object.values(newFills).reduce((s, v) => s + parseFloat(v || 0), 0);
    if (newTotal > totalAccountBalance && totalAccountBalance > 0) return;
    setBudgets({ ...budgets, [budgetKey]: newFills });
  }, [budgets, budgetKey, envelopeFills, setBudgets, totalAccountBalance]);

  // ── Add envelope ─────────────────────────────────────────────
  const handleAddEnvelope = (e) => {
    e.preventDefault();
    if (!newEnv.name.trim()) return;
    try {
      addEnvelope(newEnv.name.trim(), newEnv.category, {
        envelopeType: newEnv.envelopeType,
        annualAmount: newEnv.annualAmount,
        goalAmount:   newEnv.goalAmount,
        dueDate:      newEnv.dueDate,
      });
      setNewEnv(EMPTY_ENV);
      setShowAddModal(false);
    } catch (err) { alert(err.message); }
  };

  // ── Transfer ─────────────────────────────────────────────────
  const handleEnvelopeTransfer = (e) => {
    e.preventDefault();
    const { from, to, amount, isBorrow } = transferData;
    if (!from || !to || !amount || from === to) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    // Use current month key if "all months" selected
    const activeKey = budgetKey || `${today.getFullYear()}-${today.getMonth()}`;

    const activeFills = budgets[activeKey] || {};

    // Always use current month spending for the availability check
    const currentMonthSpending = {};
    transactions.forEach(t => {
      if (t.type !== 'expense' || !t.envelope) return;
      const d = new Date(t.date.split('-').reverse().join('-'));
      if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth())
        currentMonthSpending[t.envelope] = (currentMonthSpending[t.envelope] || 0) + parseFloat(t.amount);
    });

    const spendingToCheck = selectedMonth === 'all' ? currentMonthSpending : monthlySpending;
    const sourceRemaining = (activeFills[from] || 0) - (spendingToCheck[from] || 0);
    if (amt > sourceRemaining) {
      setTransferError(`Only ₹${fmt(Math.max(0, sourceRemaining))} available in ${from}`);
      return;
    }
    const newFills = { ...activeFills };
    newFills[from] = Math.max(0, (newFills[from] || 0) - amt);
    newFills[to]   = (newFills[to] || 0) + amt;

    let updatedBudgets = { ...budgets, [activeKey]: newFills };
    if (isBorrow) {
      const borrowId = `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const existing = budgets._borrows || [];
      updatedBudgets._borrows = [...existing, {
        id: borrowId,
        from, to, amount: amt,
        date: new Date().toLocaleDateString('en-IN'),
        settled: false,
      }];
    }

    setBudgets(updatedBudgets);
    setTransferData({ from: '', to: '', amount: '', isBorrow: false });
    setTransferError('');
    setShowTransferModal(false);
  };

  // ── Settle borrow ─────────────────────────────────────────────
  const handleSettleBorrow = (borrow) => {
    if (!window.confirm(`Settle ₹${fmt(borrow.amount)} back to ${borrow.from}?`)) return;
    const key = selectedMonth === 'all'
      ? `${today.getFullYear()}-${today.getMonth()}`
      : budgetKey;
    const fills = { ...(budgets[key] || {}) };
    fills[borrow.from] = (fills[borrow.from] || 0) + borrow.amount;
    fills[borrow.to]   = Math.max(0, (fills[borrow.to] || 0) - borrow.amount);
    const updatedBorrows = (budgets._borrows || []).map(b =>
      b.id === borrow.id ? { ...b, settled: true } : b
    );
    setBudgets({ ...budgets, [key]: fills, _borrows: updatedBorrows });
  };

  // ── Edit envelope ─────────────────────────────────────────────
  const handleEditOpen = (envelope) => {
    setEditTarget(envelope);
    setEditForm({
      name:         envelope.name,
      category:     envelope.category,
      envelopeType: envelope.envelopeType || 'regular',
      annualAmount: envelope.annualAmount || '',
      goalAmount:   envelope.goalAmount   || '',
      dueDate:      envelope.dueDate      || '',
    });
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    try {
      const { originalName, newName } = updateEnvelope(editTarget.name, {
        name:         editForm.name,
        category:     editForm.category,
        envelopeType: editForm.envelopeType,
        annualAmount: editForm.annualAmount ? parseFloat(editForm.annualAmount) : undefined,
        goalAmount:   editForm.goalAmount   ? parseFloat(editForm.goalAmount)   : undefined,
        dueDate:      editForm.dueDate || undefined,
      });
      if (originalName !== newName) {
        const updated = { ...budgets };
        Object.keys(updated).forEach(k => {
          if (updated[k][originalName] !== undefined) {
            updated[k][newName] = updated[k][originalName];
            delete updated[k][originalName];
          }
        });
        setBudgets(updated);
      }
      setEditTarget(null);
    } catch (err) { alert(err.message); }
  };

  // ── Delete envelope ───────────────────────────────────────────
  const confirmDeleteEnvelope = () => {
    removeEnvelope(deleteTarget);
    const cleaned = { ...budgets };
    Object.keys(cleaned).forEach(k => { delete cleaned[k][deleteTarget]; });
    setBudgets(cleaned);
    setDeleteTarget(null);
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="envelopes-view">

      {/* ── HEADER ── */}
      <div className="ev-header">
        <div className="ev-header-top">
          <span className="ev-brand-name">
            <span className="ev-brand-good">Good</span><span className="ev-brand-budget">Budget</span>
          </span>
          <div className="ev-month-dropdown-wrap">
            <select
              className="ev-month-dropdown"
              value={selectedMonth === 'all' ? 'all' : `${selectedYear}-${selectedMonth}`}
              onChange={handleMonthDropdownChange}
              aria-label="Select month"
            >
              <option value="all">All Months</option>
              {availableYears.map(year =>
                MONTHS_SHORT.map((label, idx) => (
                  <option key={`${year}-${idx}`} value={`${year}-${idx}`}>
                    {label} {year}
                  </option>
                ))
              )}
            </select>
            {!isCurrentMonth && selectedMonth !== 'all' && (
              <button type="button" className="ev-today-pill" onClick={goToday} aria-label="Go to current month">
                Today
              </button>
            )}
          </div>
        </div>

        <div className="ev-header-card">
          <div className="ev-summary">
            <div className="ev-summary-item">
              <span className="ev-summary-label">Income</span>
              <span className="ev-summary-value">₹{fmt(monthlyIncome)}</span>
            </div>
            <div className="ev-summary-divider" />
            <div className="ev-summary-item">
              <span className="ev-summary-label">Filled</span>
              <span className="ev-summary-value">₹{fmt(totalFilled)}</span>
            </div>
            <div className="ev-summary-divider" />
            <div className="ev-summary-item">
              <span className="ev-summary-label">Spent</span>
              <span className="ev-summary-value">₹{fmt(totalSpent)}</span>
            </div>
            <div className="ev-summary-divider" />
            <div className={`ev-summary-item ${unallocated === 0 ? 'zero' : unallocated < 0 ? 'neg' : 'pos'}`}>
              <span className="ev-summary-label">To Fill</span>
              <span className="ev-summary-value">{unallocated < 0 ? '-' : ''}₹{fmt(unallocated)}</span>
            </div>
          </div>

          <div className="ev-header-actions">
            <button type="button" className="ev-action-pill fill" onClick={() => setShowFillModal(true)}>
              <span className="ev-action-pill-icon">💰</span>
              <span>Fill Envelopes</span>
            </button>
            <button type="button" className="ev-action-pill transfer" onClick={() => setShowTransferModal(true)}>
              <span className="ev-action-pill-icon">⇄</span>
              <span>Transfer</span>
            </button>
          </div>

          {unallocated !== 0 && (
            <div className={`ev-alert ${unallocated < 0 ? 'danger' : 'warning'}`}>
              {unallocated > 0
                ? `₹${fmt(unallocated)} left to allocate`
                : `Over-allocated by ₹${fmt(Math.abs(unallocated))}`}
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="ev-content">

        {/* Accounts */}
        {Object.keys(accountBalances).length > 0 && (
          <div className="ev-accounts-section">
            <button className="ev-accounts-header-row" onClick={() => setShowAccounts(v => !v)}>
              <span className="ev-accounts-title">💳 Accounts</span>
              <div className="ev-accounts-header-right">
                <span className={`ev-accounts-total ${totalAccountBalance >= 0 ? 'pos' : 'neg'}`}>
                  {totalAccountBalance < 0 ? '-' : ''}₹{fmt(totalAccountBalance)}
                </span>
                <span className={`ev-accounts-chevron ${showAccounts ? 'open' : ''}`}>›</span>
              </div>
            </button>
            {showAccounts && (
              <div className="ev-accounts-cards">
                {Object.entries(accountBalances)
                  .filter(([, bal]) => bal !== 0)
                  .map(([name, bal]) => (
                  <div key={name} className="ev-account-card" onClick={() => onViewTransactions({ paymentMethod: name })}>
                    <span className="ev-ac-icon">💳</span>
                    <span className="ev-ac-name">{name}</span>
                    <span className={`ev-ac-bal ${bal >= 0 ? 'pos' : 'neg'}`}>
                      {bal < 0 ? '-' : ''}₹{fmt(bal)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active borrows */}
        {(budgets._borrows || []).filter(b => !b.settled).length > 0 && (
          <div className="ev-borrows-section">
            <div className="ev-borrows-title">💸 Pending Settlements</div>
            {(budgets._borrows || []).filter(b => !b.settled).map(b => (
              <div key={b.id} className="ev-borrow-row">
                <div className="ev-borrow-info">
                  <span className="ev-borrow-text">
                    <strong>{b.to}</strong> borrowed <strong>₹{fmt(b.amount)}</strong> from <strong>{b.from}</strong>
                  </span>
                  <span className="ev-borrow-date">{b.date}</span>
                </div>
                <button className="ev-settle-btn" onClick={() => handleSettleBorrow(b)}>
                  Settle ↩
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Envelopes */}
        <div className="ev-section-divider">
          <span>Envelopes</span>
        </div>
        {customEnvelopes.length === 0 ? (
          <div className="ev-empty">
            <div className="ev-empty-icon">📦</div>
            <div className="ev-empty-title">No envelopes yet</div>
            <div className="ev-empty-sub">Create envelopes to start budgeting</div>
            <button className="ev-add-envelope-row" style={{ marginTop: 16 }} onClick={() => setShowAddModal(true)}>
              <span className="ev-add-envelope-icon">＋</span>
              <span>Create First Envelope</span>
            </button>
          </div>
        ) : (
          <>
            {/* Single list sorted by recently used */}
            {(() => {
              const allEnvelopes = Object.values(envelopesByCategory).flat();
              const sorted = [...allEnvelopes]
                .filter(e => selectedMonth === 'all' ? e.spent > 0 : e.filled > 0)
                .sort((a, b) => {
                  const da = lastUsed[a.name] || new Date(0);
                  const db = lastUsed[b.name] || new Date(0);
                  return db - da;
                });
              return (
                <div className="ev-envelope-list">
                  {sorted.map(envelope => renderEnvelopeCard(envelope, {
                    expandedEnv, setExpandedEnv,
                    goalProgress, annualYTD,
                    selectedYear, selectedMonth,
                    onAddTransaction, onViewTransactions,
                    setTransferData, setShowTransferModal,
                    handleEditOpen, setDeleteTarget,
                  }))}
                </div>
              );
            })()}
            <button className="ev-add-envelope-row" onClick={() => setShowAddModal(true)}>
              <span className="ev-add-envelope-icon">＋</span>
              <span>Add Envelope</span>
            </button>
          </>
        )}
      </div>

      {/* FAB */}
      <button className="ev-fab" onClick={() => onAddTransaction('expense')} aria-label="Add expense">+</button>

      {/* ── MODALS ── */}
      {showFillModal && (
        <FillEnvelopesModal
          isOpen={showFillModal}
          onClose={() => setShowFillModal(false)}
          budgets={budgets}
          setBudgets={setBudgets}
          transactions={transactions}
          monthlyIncome={monthlyIncome}
          year={selectedYear}
          month={selectedMonth}
        />
      )}

      {showAddModal && (
        <AddEnvelopeModal
          newEnv={newEnv}
          setNewEnv={setNewEnv}
          onSubmit={handleAddEnvelope}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showTransferModal && (
        <TransferModal
          transferData={transferData}
          setTransferData={setTransferData}
          transferError={transferError}
          setTransferError={setTransferError}
          envelopeFills={budgets[`${today.getFullYear()}-${today.getMonth()}`] || envelopeFills}
          monthlySpending={monthlySpending}
          customEnvelopes={customEnvelopes}
          onSubmit={handleEnvelopeTransfer}
          onClose={() => setShowTransferModal(false)}
        />
      )}

      {editTarget && (
        <EditEnvelopeModal
          editForm={editForm}
          setEditForm={setEditForm}
          onSubmit={handleEditSave}
          onClose={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeleteEnvelopeModal
          name={deleteTarget}
          onConfirm={confirmDeleteEnvelope}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default EnvelopesView;
