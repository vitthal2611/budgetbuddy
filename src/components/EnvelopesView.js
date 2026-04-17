import React, { useState, useCallback, useEffect } from 'react';
import './EnvelopesView.css';
import { useData } from '../contexts/DataContext';
import { useEnvelopesData, computeMonthlyFill } from '../hooks/useEnvelopesData';
import { AddEnvelopeModal, EditEnvelopeModal, DeleteEnvelopeModal } from './envelopes/EnvelopeFormModals';
import DesktopBudgetView from './envelopes/DesktopBudgetView';

// Single Envelope Budget Modal
const SingleBudgetModal = ({ envelope, currentBudget, monthlyIncome, totalAllocated, onSave, onClose }) => {
  const [budgetValue, setBudgetValue] = useState(currentBudget);
  const fmt = (n) => Math.abs(n).toLocaleString('en-IN');
  
  const catIcon = envelope.category === 'need' ? '🛒' : envelope.category === 'want' ? '🎉' : '💰';
  
  // Calculate what the new total would be
  const otherEnvelopesTotal = totalAllocated - currentBudget;
  const newTotal = otherEnvelopesTotal + parseFloat(budgetValue || 0);
  const remaining = monthlyIncome - newTotal;
  const isOverBudget = remaining < 0;

  const handleSave = () => {
    if (isOverBudget) {
      alert(`Cannot allocate more than income!\n\nIncome: ₹${fmt(monthlyIncome)}\nTrying to allocate: ₹${fmt(newTotal)}\n\nPlease reduce the budget amount.`);
      return;
    }
    onSave(budgetValue);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="single-budget-modal minimal" onClick={e => e.stopPropagation()}>
        <div className="single-budget-header">
          <div className="single-budget-title">
            <span className="single-budget-icon">{catIcon}</span>
            <span>{envelope.name}</span>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="single-budget-input-section">
          <div className="single-budget-input-wrap">
            <span className="single-budget-currency">₹</span>
            <input
              type="number"
              inputMode="decimal"
              className="single-budget-input"
              value={budgetValue}
              onChange={e => setBudgetValue(e.target.value)}
              placeholder="0"
              min="0"
              autoFocus
            />
          </div>
        </div>

        <div className="single-budget-footer">
          <button className="btn-single-cancel" onClick={onClose}>Cancel</button>
          <button 
            className="btn-single-save" 
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
};

const fmt = (n) => Math.abs(n).toLocaleString('en-IN');
const getCatIcon = (cat) => cat === 'need' ? '🛒' : cat === 'want' ? '🎉' : '💰';

const renderEnvelopeCard = (envelope, {
  goalProgress, annualYTD,
  selectedYear, selectedMonth,
  onAddTransaction, onViewTransactions,
  onEditBudget,
}) => {
  const pct = envelope.filled > 0 ? Math.min((envelope.spent / envelope.filled) * 100, 100) : 0;
  const isOver    = envelope.remaining < 0;
  const isWarning = !isOver && pct >= 80;
  const isLow     = !isOver && !isWarning && pct >= 50;
  const isGoal    = envelope.envelopeType === 'goal';
  const isAnnual  = envelope.envelopeType === 'annual';
  const goalPct   = isGoal && envelope.goalAmount > 0
    ? Math.min((goalProgress[envelope.name] / envelope.goalAmount) * 100, 100) : 0;

  // Status color
  const statusCls = isOver ? 'status-over' : isWarning ? 'status-warn' : isLow ? 'status-low' : 'status-ok';

  // Simplified pace indicators
  let paceIcon = null;
  if (isGoal && envelope.goalAmount > 0 && envelope.dueDate) {
    const due = new Date(envelope.dueDate);
    const now = new Date(selectedYear, selectedMonth, 1);
    const monthsLeft = Math.max(1,
      (due.getFullYear() - now.getFullYear()) * 12 + (due.getMonth() - now.getMonth()) + 1);
    const saved = goalProgress[envelope.name] || 0;
    const neededPerMonth = Math.ceil((envelope.goalAmount - saved) / monthsLeft);
    const expectedByNow  = envelope.goalAmount - neededPerMonth * monthsLeft;
    if (saved >= envelope.goalAmount)
      paceIcon = '✅';
    else if (saved >= expectedByNow)
      paceIcon = '🎯';
    else
      paceIcon = '⚠️';
  }

  if (isAnnual && envelope.annualAmount > 0) {
    const ytd = annualYTD[envelope.name] || 0;
    const expectedYTD = Math.ceil((envelope.annualAmount / 12) * (selectedMonth + 1));
    if (ytd >= envelope.annualAmount)
      paceIcon = '✅';
    else if (ytd >= expectedYTD)
      paceIcon = '🎯';
    else
      paceIcon = '⚠️';
  }

  const catIcon = getCatIcon(envelope.category);

  return (
    <div key={envelope.name}
      className={`env-card ${isOver ? 'env-over' : ''} ${isGoal ? 'env-goal' : ''} ${isAnnual ? 'env-annual' : ''} ${envelope.filled === 0 ? 'env-unfilled' : ''}`}
    >
      {/* Left accent bar */}
      <div className={`env-card-accent ${envelope.filled === 0 ? 'status-empty' : statusCls}`} />

      <div className="env-card-body">
        {/* Header: Category icon + Name + Pace */}
        <div className="env-card-header">
          <div className="env-card-title-row">
            <span className="env-card-icon">{catIcon}</span>
            <span className="env-card-name">{envelope.name}</span>
            {paceIcon && <span className="env-pace-badge">{paceIcon}</span>}
          </div>
        </div>

        {/* Amounts Grid - 3 columns */}
        <div className="env-card-amounts">
          <div 
            className="env-amount-item clickable" 
            onClick={(e) => { e.stopPropagation(); onEditBudget(envelope); }}
          >
            <span className="env-amount-label">Budget</span>
            <span className="env-amount-value budget">₹{fmt(envelope.filled)}</span>
            <span className="env-amount-edit-hint">✏️</span>
          </div>
          <div className="env-amount-item">
            <span className="env-amount-label">Spent</span>
            <span className="env-amount-value spent">₹{fmt(envelope.spent)}</span>
          </div>
          <div className="env-amount-item">
            <span className="env-amount-label">Left</span>
            <span className={`env-amount-value ${isOver ? 'negative' : envelope.filled === 0 ? 'unfilled' : 'positive'}`}>
              {envelope.filled === 0 ? '—' : `${isOver ? '-' : ''}₹${fmt(envelope.remaining)}`}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="env-card-progress">
          <div className={`env-card-progress-fill ${isOver ? 'over' : isWarning ? 'warning' : envelope.category}`}
            style={{ width: envelope.filled === 0 ? '0%' : `${isGoal ? goalPct : pct}%` }} />
        </div>

        {/* Action buttons - always visible */}
        <div className="env-card-actions">
          <button 
            className="env-card-btn primary"
            onClick={(e) => { e.stopPropagation(); onAddTransaction('expense', { envelope: envelope.name }); }}
          >
            ➕ Expense
          </button>
          <button 
            className="env-card-btn secondary"
            onClick={(e) => { e.stopPropagation(); onViewTransactions({ envelope: envelope.name, year: selectedYear, month: selectedMonth }); }}
          >
            📋 History
          </button>
          <button 
            className="env-card-btn secondary"
            onClick={(e) => { e.stopPropagation(); onEditBudget(envelope); }}
          >
            💰 Budget
          </button>
        </div>
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

const EnvelopesView = ({ transactions, budgets, setBudgets, onAddTransaction, onViewTransactions, onNavigate }) => {
  const { envelopes: customEnvelopes, addEnvelope, removeEnvelope, updateEnvelope } = useData();
  const isDesktop = useIsDesktop();

  // ── Month selection ──────────────────────────────────────────
  const today = new Date();
  const [selectedYear,  setSelectedYear]  = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());

  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };
  const goToday = () => { setSelectedMonth(today.getMonth()); setSelectedYear(today.getFullYear()); };
  const isCurrentMonth = selectedYear === today.getFullYear() && selectedMonth === today.getMonth();

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
    const [y, m] = val.split('-');
    setSelectedYear(parseInt(y));
    setSelectedMonth(parseInt(m));
  };
  // ── UI state ─────────────────────────────────────────────────
  const [showAddModal,      setShowAddModal]      = useState(false);
  const [editingEnvelope,   setEditingEnvelope]   = useState(null);
  const [deleteTarget,      setDeleteTarget]      = useState(null);
  const [editTarget,        setEditTarget]        = useState(null);
  const [editForm,          setEditForm]          = useState({});
  const [newEnv,            setNewEnv]            = useState(EMPTY_ENV);
  const [showAccounts,      setShowAccounts]      = useState(false);

  // ── Derived data ─────────────────────────────────────────────
  const {
    budgetKey, envelopeFills, monthlySpending,
    monthlyIncome, totalFilled, totalSpent, unallocated,
    accountBalances, totalAccountBalance,
    goalProgress, annualYTD, envelopesByCategory, lastUsed,
  } = useEnvelopesData({ transactions, budgets, customEnvelopes, selectedYear, selectedMonth });

  // ── Fill handler with validation ─────────────────────────────
  const handleFillChange = useCallback((name, value) => {
    const num = value === '' ? 0 : parseFloat(value) || 0;
    const newFills = { ...envelopeFills, [name]: num };
    const newTotal = Object.values(newFills).reduce((s, v) => s + parseFloat(v || 0), 0);
    
    // Hard block: prevent allocation > income
    if (newTotal > monthlyIncome) {
      alert(`Cannot allocate more than income!\n\nIncome: ₹${fmt(monthlyIncome)}\nTrying to allocate: ₹${fmt(newTotal)}\n\nPlease reduce the budget amount.`);
      return false;
    }
    
    setBudgets({ ...budgets, [budgetKey]: newFills });
    return true;
  }, [budgets, budgetKey, envelopeFills, setBudgets, monthlyIncome]);

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
  // Desktop: YNAB-style table view
  if (isDesktop) {
    return (
      <>
        <DesktopBudgetView
          envelopesByCategory={envelopesByCategory}
          envelopeFills={envelopeFills}
          monthlyIncome={monthlyIncome}
          totalFilled={totalFilled}
          totalSpent={totalSpent}
          unallocated={unallocated}
          accountBalances={accountBalances}
          totalAccountBalance={totalAccountBalance}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          availableYears={availableYears}
          onMonthChange={handleMonthDropdownChange}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onGoToday={goToday}
          isCurrentMonth={isCurrentMonth}
          onAssign={handleFillChange}
          onAddTransaction={onAddTransaction}
          onViewTransactions={onViewTransactions}
          onAddEnvelope={(cat) => {
            setNewEnv({ ...EMPTY_ENV, category: cat || 'need' });
            setShowAddModal(true);
          }}
          onEditEnvelope={handleEditOpen}
          onDeleteEnvelope={setDeleteTarget}
          budgets={budgets}
          transactions={transactions}
          monthlyIncome={monthlyIncome}
        />

        {/* Shared modals */}
        {showAddModal && (
          <AddEnvelopeModal
            newEnv={newEnv}
            setNewEnv={setNewEnv}
            onSubmit={handleAddEnvelope}
            onClose={() => { setShowAddModal(false); setNewEnv(EMPTY_ENV); }}
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
      </>
    );
  }

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
              value={`${selectedYear}-${selectedMonth}`}
              onChange={handleMonthDropdownChange}
              aria-label="Select month"
            >
              {availableYears.map(year =>
                MONTHS_SHORT.map((label, idx) => (
                  <option key={`${year}-${idx}`} value={`${year}-${idx}`}>
                    {label} {year}
                  </option>
                ))
              )}
            </select>
            {!isCurrentMonth && (
              <button type="button" className="ev-today-pill" onClick={goToday} aria-label="Go to current month">
                Today
              </button>
            )}
          </div>
          <button 
            type="button" 
            className="ev-settings-btn" 
            onClick={() => onNavigate('settings')}
            aria-label="Settings"
          >
            ⚙️
          </button>
        </div>

        <div className="ev-header-card">
          {/* Compact single-line Ready to Assign */}
          <div className="ev-header-row">
            <div className="ev-ready-assign-compact">
              <span className="ev-ready-label">Ready to Assign:</span>
              <span className={`ev-ready-amount ${unallocated === 0 ? 'zero' : unallocated < 0 ? 'neg' : 'pos'}`}>
                {unallocated < 0 ? '-' : ''}₹{fmt(unallocated)}
              </span>
            </div>
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

        {/* Metric Cards: Income | Spend | Balance */}
        <div className="ev-metrics">
          <div className="ev-metric-card income">
            <span className="ev-metric-icon">💰</span>
            <div className="ev-metric-content">
              <span className="ev-metric-label">Income</span>
              <span className="ev-metric-value">₹{fmt(monthlyIncome)}</span>
            </div>
          </div>
          <div className="ev-metric-card spend">
            <span className="ev-metric-icon">💸</span>
            <div className="ev-metric-content">
              <span className="ev-metric-label">Spend</span>
              <span className="ev-metric-value">₹{fmt(totalSpent)}</span>
            </div>
          </div>
          <div className="ev-metric-card balance">
            <span className="ev-metric-icon">💵</span>
            <div className="ev-metric-content">
              <span className="ev-metric-label">Balance</span>
              <span className={`ev-metric-value ${(monthlyIncome - totalSpent) >= 0 ? 'positive' : 'negative'}`}>
                {(monthlyIncome - totalSpent) < 0 ? '-' : ''}₹{fmt(Math.abs(monthlyIncome - totalSpent))}
              </span>
            </div>
          </div>
        </div>

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

        {/* Envelopes */}
        <div className="ev-section-divider">
          <span>Envelopes</span>
        </div>
        {customEnvelopes.length === 0 ? (
          <div className="ev-empty">
            <div className="ev-empty-icon">📦</div>
            <div className="ev-empty-title">No envelopes yet</div>
            <div className="ev-empty-sub">Create envelopes to start budgeting</div>
            <button className="ev-add-envelope-row" style={{ marginTop: 16 }} onClick={() => { setNewEnv(EMPTY_ENV); setShowAddModal(true); }}>
              <span className="ev-add-envelope-icon">＋</span>
              <span>Create First Envelope</span>
            </button>
          </div>
        ) : (
          <>
            {/* Single list sorted by recently used - show ALL envelopes */}
            {(() => {
              const allEnvelopes = Object.values(envelopesByCategory).flat();
              const sorted = [...allEnvelopes]
                .sort((a, b) => {
                  const da = lastUsed[a.name] || new Date(0);
                  const db = lastUsed[b.name] || new Date(0);
                  return db - da;
                });
              return (
                <div className="ev-envelope-list">
                  {sorted.map(envelope => renderEnvelopeCard(envelope, {
                    goalProgress, annualYTD,
                    selectedYear, selectedMonth,
                    onAddTransaction, onViewTransactions,
                    onEditBudget: (env) => setEditingEnvelope(env),
                  }))}
                </div>
              );
            })()}
            <button className="ev-add-envelope-row" onClick={() => { setNewEnv(EMPTY_ENV); setShowAddModal(true); }}>
              <span className="ev-add-envelope-icon">＋</span>
              <span>Add Envelope</span>
            </button>
          </>
        )}
      </div>

      {/* FAB */}
      <button 
        className="ev-fab"
        onClick={() => onAddTransaction('expense')}
        aria-label="Add expense"
        title="Add expense"
      >
        +
      </button>

      {/* ── MODALS ── */}
      {editingEnvelope && (
        <SingleBudgetModal
          envelope={editingEnvelope}
          currentBudget={envelopeFills[editingEnvelope.name] || 0}
          monthlyIncome={monthlyIncome}
          totalAllocated={totalFilled}
          onSave={(value) => {
            if (handleFillChange(editingEnvelope.name, value)) {
              setEditingEnvelope(null);
            }
          }}
          onClose={() => setEditingEnvelope(null)}
        />
      )}

      {showAddModal && (
        <AddEnvelopeModal
          newEnv={newEnv}
          setNewEnv={setNewEnv}
          onSubmit={handleAddEnvelope}
          onClose={() => { setShowAddModal(false); setNewEnv(EMPTY_ENV); }}
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
