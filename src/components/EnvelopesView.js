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

const renderEnvelopeRow = (envelope, {
  goalProgress, annualYTD,
  selectedYear, selectedMonth,
  onAddTransaction, onViewTransactions,
  onEditBudget,
}) => {
  const isOver = envelope.remaining < 0;
  const isGoal = envelope.envelopeType === 'goal';
  const isAnnual = envelope.envelopeType === 'annual';

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

  return (
    <div 
      key={envelope.name}
      className={`env-card-compact ${isOver ? 'over' : ''} ${envelope.filled === 0 ? 'unfilled' : ''}`}
      onClick={() => onAddTransaction('expense', { envelope: envelope.name })}
    >
      {/* Header: Name + Pace */}
      <div className="env-card-compact-header">
        <div className="env-card-compact-name">
          {envelope.name}
          {paceIcon && <span className="env-card-compact-pace">{paceIcon}</span>}
        </div>
      </div>

      {/* Budget - Clickable to edit */}
      <div 
        className="env-card-compact-budget clickable"
        onClick={(e) => { e.stopPropagation(); onEditBudget(envelope); }}
      >
        <span className="env-card-compact-label">Budget</span>
        <span className="env-card-compact-value primary">₹{fmt(envelope.filled)}</span>
      </div>

      {/* Spent - Clickable to view transactions */}
      <div 
        className="env-card-compact-spent clickable"
        onClick={(e) => { e.stopPropagation(); onViewTransactions({ envelope: envelope.name, year: selectedYear, month: selectedMonth }); }}
      >
        <span className="env-card-compact-label">Spent</span>
        <span className="env-card-compact-value spent">₹{fmt(envelope.spent)}</span>
      </div>

      {/* Balance */}
      <div className="env-card-compact-balance">
        <span className="env-card-compact-label">Balance</span>
        <span className={`env-card-compact-value ${isOver ? 'negative' : envelope.filled === 0 ? 'unfilled' : 'positive'}`}>
          {envelope.filled === 0 ? '—' : `${isOver ? '-' : ''}₹${fmt(envelope.remaining)}`}
        </span>
      </div>
    </div>
  );
};

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Year View Component ───────────────────────────────────────
const YearView = ({ transactions, budgets, customEnvelopes, selectedYear }) => {
  const fmt = (n) => Math.abs(n).toLocaleString('en-IN');

  // Build per-month totals for the year
  const yearData = React.useMemo(() => {
    return MONTHS_SHORT.map((label, month) => {
      const budgetKey = `${selectedYear}-${month}`;
      const fills = budgets[budgetKey] || {};
      const budgeted = Object.values(fills).reduce((s, v) => s + parseFloat(v || 0), 0);

      let income = 0;
      let spent = 0;
      transactions.forEach(t => {
        const parts = t.date.split('-');
        if (parseInt(parts[2]) !== selectedYear || parseInt(parts[1]) - 1 !== month) return;
        if (t.type === 'income') income += parseFloat(t.amount);
        if (t.type === 'expense') spent += parseFloat(t.amount);
      });

      return { label, month, income, spent, budgeted, net: income - spent };
    });
  }, [transactions, budgets, selectedYear]);

  // Per-envelope annual totals
  const envelopeAnnual = React.useMemo(() => {
    return customEnvelopes.map(env => {
      let totalBudgeted = 0;
      let totalSpent = 0;
      for (let m = 0; m < 12; m++) {
        const key = `${selectedYear}-${m}`;
        totalBudgeted += parseFloat((budgets[key] || {})[env.name] || 0);
      }
      transactions.forEach(t => {
        if (t.type !== 'expense' || t.envelope !== env.name) return;
        const parts = t.date.split('-');
        if (parseInt(parts[2]) === selectedYear) totalSpent += parseFloat(t.amount);
      });
      return { ...env, totalBudgeted, totalSpent, balance: totalBudgeted - totalSpent };
    }).filter(e => e.totalBudgeted > 0 || e.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [customEnvelopes, budgets, transactions, selectedYear]);

  const totalIncome   = yearData.reduce((s, m) => s + m.income, 0);
  const totalSpent    = yearData.reduce((s, m) => s + m.spent, 0);
  const totalBudgeted = yearData.reduce((s, m) => s + m.budgeted, 0);
  const totalNet      = totalIncome - totalSpent;

  const today = new Date();
  const isCurrentYear = selectedYear === today.getFullYear();

  return (
    <div className="ev-year-view">
      {/* Annual KPI strip */}
      <div className="ev-year-kpis">
        <div className="ev-year-kpi income">
          <span className="ev-year-kpi-label">Income</span>
          <span className="ev-year-kpi-value">₹{fmt(totalIncome)}</span>
        </div>
        <div className="ev-year-kpi spend">
          <span className="ev-year-kpi-label">Spent</span>
          <span className="ev-year-kpi-value">₹{fmt(totalSpent)}</span>
        </div>
        <div className="ev-year-kpi net">
          <span className="ev-year-kpi-label">Net</span>
          <span className={`ev-year-kpi-value ${totalNet >= 0 ? 'pos' : 'neg'}`}>
            {totalNet < 0 ? '-' : ''}₹{fmt(totalNet)}
          </span>
        </div>
      </div>

      {/* Month-by-month table */}
      <div className="ev-year-section-title">Monthly Breakdown</div>
      <div className="ev-year-table-card">
        <div className="ev-year-table-head">
          <span>Month</span>
          <span>Income</span>
          <span>Spent</span>
          <span>Net</span>
        </div>
        {yearData.map((row, i) => {
          const isFuture = isCurrentYear && row.month > today.getMonth();
          return (
            <div key={row.label} className={`ev-year-table-row ${isFuture ? 'future' : ''} ${i < 11 ? 'bordered' : ''}`}>
              <span className="ev-year-row-month">
                {row.label}
                {isCurrentYear && row.month === today.getMonth() && (
                  <span className="ev-year-now-badge">Now</span>
                )}
              </span>
              <span className="ev-year-row-income">{row.income > 0 ? `₹${fmt(row.income)}` : '—'}</span>
              <span className="ev-year-row-spent">{row.spent > 0 ? `₹${fmt(row.spent)}` : '—'}</span>
              <span className={`ev-year-row-net ${row.net > 0 ? 'pos' : row.net < 0 ? 'neg' : ''}`}>
                {row.income === 0 && row.spent === 0 ? '—' : (row.net < 0 ? '-' : '') + '₹' + fmt(row.net)}
              </span>
            </div>
          );
        })}
        {/* Totals row */}
        <div className="ev-year-table-total">
          <span>Total</span>
          <span className="ev-year-row-income">₹{fmt(totalIncome)}</span>
          <span className="ev-year-row-spent">₹{fmt(totalSpent)}</span>
          <span className={`ev-year-row-net ${totalNet >= 0 ? 'pos' : 'neg'}`}>
            {totalNet < 0 ? '-' : ''}₹{fmt(totalNet)}
          </span>
        </div>
      </div>

      {/* Per-envelope annual totals */}
      {envelopeAnnual.length > 0 && (
        <>
          <div className="ev-year-section-title" style={{ marginTop: 20 }}>Envelope Totals</div>
          <div className="ev-year-table-card">
            <div className="ev-year-env-head">
              <span>Envelope</span>
              <span>Budgeted</span>
              <span>Spent</span>
              <span>Balance</span>
            </div>
            {envelopeAnnual.map((env, i) => (
              <div key={env.name} className={`ev-year-env-row ${i < envelopeAnnual.length - 1 ? 'bordered' : ''}`}>
                <span className="ev-year-env-name">{env.name}</span>
                <span className="ev-year-env-budgeted">₹{fmt(env.totalBudgeted)}</span>
                <span className="ev-year-env-spent">₹{fmt(env.totalSpent)}</span>
                <span className={`ev-year-env-bal ${env.balance >= 0 ? 'pos' : 'neg'}`}>
                  {env.balance < 0 ? '-' : ''}₹{fmt(env.balance)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

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
  
  // ── FAB menu state ───────────────────────────────────────────
  const [fabOpen, setFabOpen] = useState(false);

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
  const [viewMode,          setViewMode]          = useState('month'); // 'month' | 'year'

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

        {/* Row 1: Brand left · Toggle center · Nav right */}
        <div className="ev-header-top">
          <div className="ev-view-toggle">
            <button
              className={`ev-toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >Month</button>
            <button
              className={`ev-toggle-btn ${viewMode === 'year' ? 'active' : ''}`}
              onClick={() => setViewMode('year')}
            >Year</button>
          </div>

          {/* Month mode: prev · month label · next */}
          {viewMode === 'month' && (
            <div className="ev-header-nav">
              <button className="ev-nav-arrow" onClick={prevMonth} aria-label="Previous month">‹</button>
              <span className="ev-nav-period">{MONTHS_SHORT[selectedMonth]} {selectedYear}</span>
              <button className="ev-nav-arrow" onClick={nextMonth} aria-label="Next month">›</button>
            </div>
          )}

          {/* Year mode: prev · year label · next */}
          {viewMode === 'year' && (
            <div className="ev-header-nav">
              <button className="ev-nav-arrow" onClick={() => setSelectedYear(y => y - 1)} aria-label="Previous year">‹</button>
              <span className="ev-nav-period">{selectedYear}</span>
              <button
                className="ev-nav-arrow"
                onClick={() => setSelectedYear(y => y + 1)}
                disabled={selectedYear >= today.getFullYear()}
                aria-label="Next year"
              >›</button>
            </div>
          )}
        </div>


        {/* Summary card — month mode */}
        {viewMode === 'month' && (
          <>
            <div className="ev-header-card">
              <div className="ev-summary-row">
                <div className="ev-summary-item">
                  <span className="ev-summary-label">Income</span>
                  <span className="ev-summary-value income">₹{fmt(monthlyIncome)}</span>
                </div>
                <div className="ev-summary-divider" />
                <div className="ev-summary-item">
                  <span className="ev-summary-label">Spent</span>
                  <span className="ev-summary-value spent">₹{fmt(totalSpent)}</span>
                </div>
                <div className="ev-summary-divider" />
                <div className="ev-summary-item">
                  <span className="ev-summary-label">To Assign</span>
                  <span className={`ev-summary-value assign ${unallocated === 0 ? 'zero' : unallocated < 0 ? 'neg' : 'pos'}`}>
                    {unallocated < 0 ? '-' : ''}₹{fmt(unallocated)}
                  </span>
                </div>
              </div>
              {unallocated !== 0 && (
                <div className={`ev-alert ${unallocated < 0 ? 'danger' : 'warning'}`}>
                  {unallocated > 0
                    ? `₹${fmt(unallocated)} unallocated — tap a budget to assign`
                    : `Over-allocated by ₹${fmt(Math.abs(unallocated))}`}
                </div>
              )}
            </div>
          </>
        )}

        {/* Summary card — year mode */}
        {viewMode === 'year' && (
          <div className="ev-header-card">
            <div className="ev-summary-row">
              {(() => {
                let yi = 0, ys = 0;
                transactions.forEach(t => {
                  const parts = t.date.split('-');
                  if (parseInt(parts[2]) !== selectedYear) return;
                  if (t.type === 'income')  yi += parseFloat(t.amount);
                  if (t.type === 'expense') ys += parseFloat(t.amount);
                });
                const yn = yi - ys;
                return (<>
                  <div className="ev-summary-item">
                    <span className="ev-summary-label">Income</span>
                    <span className="ev-summary-value income">₹{fmt(yi)}</span>
                  </div>
                  <div className="ev-summary-divider" />
                  <div className="ev-summary-item">
                    <span className="ev-summary-label">Spent</span>
                    <span className="ev-summary-value spent">₹{fmt(ys)}</span>
                  </div>
                  <div className="ev-summary-divider" />
                  <div className="ev-summary-item">
                    <span className="ev-summary-label">Net</span>
                    <span className={`ev-summary-value ${yn >= 0 ? 'pos' : 'neg'}`}>
                      {yn < 0 ? '-' : ''}₹{fmt(yn)}
                    </span>
                  </div>
                </>);
              })()}
            </div>
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div className="ev-content">

        {/* ── YEAR VIEW ── */}
        {viewMode === 'year' && (
          <YearView
            transactions={transactions}
            budgets={budgets}
            customEnvelopes={customEnvelopes}
            selectedYear={selectedYear}
          />
        )}

        {/* ── MONTH VIEW ── */}
        {viewMode === 'month' && (<>

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

        {/* Recent Transactions */}
        {(() => {
          // Sort all transactions chronologically to calculate running balances
          const allSorted = [...transactions].sort((a, b) => {
            const da = new Date(a.date.split('-').reverse().join('-'));
            const db = new Date(b.date.split('-').reverse().join('-'));
            return da - db;
          });
          
          // Calculate running balances for each payment method
          const balances = {};
          const transactionBalances = new Map();
          
          allSorted.forEach(t => {
            if (t.type === 'income' && t.paymentMethod) {
              if (!balances[t.paymentMethod]) balances[t.paymentMethod] = 0;
              balances[t.paymentMethod] += parseFloat(t.amount);
              transactionBalances.set(t.id, { balance: balances[t.paymentMethod], paymentMethod: t.paymentMethod });
            } else if (t.type === 'expense' && t.paymentMethod) {
              if (!balances[t.paymentMethod]) balances[t.paymentMethod] = 0;
              balances[t.paymentMethod] -= parseFloat(t.amount);
              transactionBalances.set(t.id, { balance: balances[t.paymentMethod], paymentMethod: t.paymentMethod });
            } else if (t.type === 'transfer') {
              if (t.sourceAccount) {
                if (!balances[t.sourceAccount]) balances[t.sourceAccount] = 0;
                balances[t.sourceAccount] -= parseFloat(t.amount);
              }
              if (t.destinationAccount) {
                if (!balances[t.destinationAccount]) balances[t.destinationAccount] = 0;
                balances[t.destinationAccount] += parseFloat(t.amount);
                transactionBalances.set(t.id, { balance: balances[t.destinationAccount], paymentMethod: t.destinationAccount });
              }
            }
          });
          
          const recent = [...transactions]
            .filter(t => t.type === 'expense' || t.type === 'income')
            .sort((a, b) => {
              const da = new Date(a.date.split('-').reverse().join('-'));
              const db = new Date(b.date.split('-').reverse().join('-'));
              return db - da;
            })
            .slice(0, 3)
            .map(t => {
              const balanceInfo = transactionBalances.get(t.id);
              return {
                ...t,
                balance: balanceInfo?.balance ?? null,
                balancePaymentMethod: balanceInfo?.paymentMethod ?? null
              };
            });

          if (recent.length === 0) return null;

          return (
            <div className="ev-recent-section">
              <div className="ev-recent-header">
                <span className="ev-recent-title">Recent</span>
                <button
                  className="ev-recent-all"
                  onClick={() => onViewTransactions({})}
                >View all →</button>
              </div>
              <div className="ev-recent-list">
                {recent.map(t => (
                  <div key={t.id} className="ev-recent-row">
                    <div className={`ev-recent-dot ${t.type}`} />
                    <div className="ev-recent-body">
                      <span className="ev-recent-note">{t.note}</span>
                      <div className="ev-recent-meta">
                        {t.envelope && <span className="ev-recent-env">{t.envelope}</span>}
                        {t.balance !== null && (
                          <span className="ev-recent-balance">
                            Bal: ₹{fmt(t.balance)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ev-recent-right">
                      <span className={`ev-recent-amt ${t.type}`}>
                        {t.type === 'income' ? '+' : '-'}₹{fmt(t.amount)}
                      </span>
                      <span className="ev-recent-date">{t.date.slice(0, 5)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

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
            {(() => {
              const allEnvelopes = Object.values(envelopesByCategory).flat();
              const sorted = [...allEnvelopes]
                .sort((a, b) => a.name.localeCompare(b.name));
              return (
                <div className="ev-envelope-grid">
                  {sorted.map(envelope => renderEnvelopeRow(envelope, {
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

        </>)} {/* end month view */}
      </div>



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

      {/* ── FAB (Floating Action Button) - Mobile only ── */}
      {!isDesktop && viewMode === 'month' && (
        <>
          {/* Backdrop when FAB is open */}
          {fabOpen && (
            <div 
              className="ev-fab-backdrop" 
              onClick={() => setFabOpen(false)}
            />
          )}

          {/* FAB Menu */}
          <div className={`ev-fab-container ${fabOpen ? 'open' : ''}`}>
            {/* Action buttons - appear when open */}
            {fabOpen && (
              <>
                <button 
                  className="ev-fab-action income"
                  onClick={() => {
                    setFabOpen(false);
                    onAddTransaction('income');
                  }}
                >
                  <span className="ev-fab-action-icon">💰</span>
                  <span className="ev-fab-action-label">Income</span>
                </button>
                <button 
                  className="ev-fab-action expense"
                  onClick={() => {
                    setFabOpen(false);
                    onAddTransaction('expense');
                  }}
                >
                  <span className="ev-fab-action-icon">🛒</span>
                  <span className="ev-fab-action-label">Expense</span>
                </button>
                <button 
                  className="ev-fab-action transfer"
                  onClick={() => {
                    setFabOpen(false);
                    onAddTransaction('transfer');
                  }}
                >
                  <span className="ev-fab-action-icon">🔄</span>
                  <span className="ev-fab-action-label">Transfer</span>
                </button>
              </>
            )}

            {/* Main FAB button */}
            <button 
              className="ev-fab-main"
              onClick={() => setFabOpen(!fabOpen)}
              aria-label="Add transaction"
            >
              <span className={`ev-fab-icon ${fabOpen ? 'open' : ''}`}>+</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default EnvelopesView;
