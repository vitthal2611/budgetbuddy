import React, { useState, useMemo, useCallback } from 'react';
import './EnvelopesView.css';
import { useData } from '../contexts/DataContext';

const fmt = (n) => Math.abs(n).toLocaleString('en-IN');

// Compute monthly fill for annual/goal envelopes
const computeMonthlyFill = (env, year, month) => {
  if (env.envelopeType === 'annual' && env.annualAmount) {
    return Math.ceil(env.annualAmount / 12);
  }
  if (env.envelopeType === 'goal' && env.goalAmount) {
    if (env.dueDate) {
      const due = new Date(env.dueDate);
      const now = new Date(year, month, 1);
      const monthsLeft = Math.max(1,
        (due.getFullYear() - now.getFullYear()) * 12 + (due.getMonth() - now.getMonth()) + 1
      );
      return Math.ceil(env.goalAmount / monthsLeft);
    }
    return 0; // no due date → manual fill
  }
  return null; // regular → manual
};

const EnvelopesView = ({ transactions, budgets, setBudgets, onAddTransaction, onViewTransactions }) => {
  const { envelopes: customEnvelopes, addEnvelope, removeEnvelope, updateEnvelope, setEnvelopes } = useData();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showFillModal, setShowFillModal] = useState(false);
  const [fillAmounts, setFillAmounts] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({ from: '', to: '', amount: '' });
  const [newEnv, setNewEnv] = useState({ name: '', category: 'need', envelopeType: 'regular', annualAmount: '', goalAmount: '', dueDate: '' });
  const [expandedEnv, setExpandedEnv] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [transferError, setTransferError] = useState('');
  const [showAccounts, setShowAccounts] = useState(true);

  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const budgetKey = `${selectedYear}-${selectedMonth}`;
  const envelopeFills = useMemo(() => budgets[budgetKey] || {}, [budgets, budgetKey]);

  const monthlySpending = useMemo(() => {
    const spending = {};
    transactions.forEach(t => {
      if (t.type !== 'expense') return;
      const d = new Date(t.date.split('-').reverse().join('-'));
      if (d.getFullYear() === selectedYear && d.getMonth() === selectedMonth) {
        // Credits (refunds) have negative amounts — they reduce spending
        spending[t.envelope] = (spending[t.envelope] || 0) + parseFloat(t.amount);
      }
    });
    return spending;
  }, [transactions, selectedYear, selectedMonth]);

  const monthlyIncome = useMemo(() => transactions
    .filter(t => {
      const d = new Date(t.date.split('-').reverse().join('-'));
      return t.type === 'income' && d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    })
    .reduce((s, t) => s + parseFloat(t.amount), 0),
    [transactions, selectedYear, selectedMonth]);

  const totalFilled = useMemo(() =>
    Object.values(envelopeFills).reduce((s, v) => s + parseFloat(v || 0), 0),
    [envelopeFills]);

  const totalSpent = useMemo(() =>
    Object.values(monthlySpending).reduce((s, v) => s + v, 0),
    [monthlySpending]);

  const totalFillAmounts = useMemo(() =>
    Object.values(fillAmounts).reduce((s, v) => s + parseFloat(v || 0), 0),
    [fillAmounts]);

  const unallocated = monthlyIncome - totalFilled;

  // Account balances — all-time running totals (from Dashboard)
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

  // Compute goal progress (cumulative fills across all months)
  const goalProgress = useMemo(() => {
    const progress = {};
    customEnvelopes.forEach(env => {
      if (env.envelopeType !== 'goal') return;
      let total = 0;
      Object.entries(budgets).forEach(([key, monthBudget]) => {
        total += parseFloat(monthBudget[env.name] || 0);
      });
      // Subtract spending
      transactions.forEach(t => {
        if (t.type === 'expense' && t.envelope === env.name) {
          total -= parseFloat(t.amount);
        }
      });
      progress[env.name] = Math.max(0, total);
    });
    return progress;
  }, [customEnvelopes, budgets, transactions]);

  // Annual YTD fills
  const annualYTD = useMemo(() => {
    const ytd = {};
    customEnvelopes.forEach(env => {
      if (env.envelopeType !== 'annual') return;
      let total = 0;
      Object.entries(budgets).forEach(([key, monthBudget]) => {
        const [y] = key.split('-');
        if (parseInt(y) === selectedYear) total += parseFloat(monthBudget[env.name] || 0);
      });
      ytd[env.name] = total;
    });
    return ytd;
  }, [customEnvelopes, budgets, selectedYear]);

  const envelopesByCategory = useMemo(() => {
    const grouped = { need: [], want: [], saving: [] };
    customEnvelopes.forEach(env => {
      const filled = envelopeFills[env.name] || 0;
      const spent = monthlySpending[env.name] || 0;
      const remaining = filled - spent;
      const suggestedFill = computeMonthlyFill(env, selectedYear, selectedMonth);
      grouped[env.category] = grouped[env.category] || [];
      grouped[env.category].push({ ...env, filled, spent, remaining, suggestedFill });
    });
    return grouped;
  }, [customEnvelopes, envelopeFills, monthlySpending, selectedYear, selectedMonth]);

  const handleFillOpen = () => {
    const initial = {};
    customEnvelopes.forEach(env => {
      initial[env.name] = envelopeFills[env.name] || 0;
    });
    setFillAmounts(initial);
    setShowFillModal(true);
  };

  const handleFillChange = useCallback((name, value) => {
    const num = value === '' ? 0 : parseFloat(value) || 0;
    setFillAmounts(prev => {
      const next = { ...prev, [name]: num };
      setBudgets({ ...budgets, [budgetKey]: next });
      return next;
    });
  }, [budgets, budgetKey, setBudgets]);


  const handleAddEnvelope = (e) => {
    e.preventDefault();
    if (!newEnv.name.trim()) return;
    try {
      addEnvelope(newEnv.name.trim(), newEnv.category, {
        envelopeType: newEnv.envelopeType,
        annualAmount: newEnv.annualAmount,
        goalAmount: newEnv.goalAmount,
        dueDate: newEnv.dueDate
      });
      setNewEnv({ name: '', category: 'need', envelopeType: 'regular', annualAmount: '', goalAmount: '', dueDate: '' });
      setShowAddModal(false);
    } catch (err) { alert(err.message); }
  };

  const handleEnvelopeTransfer = (e) => {
    e.preventDefault();
    const { from, to, amount } = transferData;
    if (!from || !to || !amount || from === to) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    const sourceRemaining = (envelopeFills[from] || 0) - (monthlySpending[from] || 0);
    if (amt > sourceRemaining) {
      setTransferError(`Only ₹${fmt(sourceRemaining)} available in ${from}`);
      return;
    }
    setTransferError('');
    const newFills = { ...envelopeFills };
    newFills[from] = Math.max(0, (newFills[from] || 0) - amt);
    newFills[to] = (newFills[to] || 0) + amt;
    setBudgets({ ...budgets, [budgetKey]: newFills });
    setTransferData({ from: '', to: '', amount: '' });
    setShowTransferModal(false);
  };

  const handleDeleteEnvelope = (name) => {
    setDeleteTarget(name);
  };

  const confirmDeleteEnvelope = () => {
    removeEnvelope(deleteTarget);
    const cleaned = { ...budgets };
    Object.keys(cleaned).forEach(k => { delete cleaned[k][deleteTarget]; });
    setBudgets(cleaned);
    setDeleteTarget(null);
  };

  const handleEditOpen = (envelope) => {
    setEditTarget(envelope);
    setEditForm({
      name: envelope.name,
      category: envelope.category,
      envelopeType: envelope.envelopeType || 'regular',
      annualAmount: envelope.annualAmount || '',
      goalAmount: envelope.goalAmount || '',
      dueDate: envelope.dueDate || ''
    });
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    try {
      const { originalName, newName } = updateEnvelope(editTarget.name, {
        name: editForm.name,
        category: editForm.category,
        envelopeType: editForm.envelopeType,
        annualAmount: editForm.annualAmount ? parseFloat(editForm.annualAmount) : undefined,
        goalAmount: editForm.goalAmount ? parseFloat(editForm.goalAmount) : undefined,
        dueDate: editForm.dueDate || undefined
      });
      // Rename budget keys if name changed
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

  const renderEnvelopeCard = (envelope) => {
    const pct = envelope.filled > 0 ? Math.min((envelope.spent / envelope.filled) * 100, 100) : 0;
    const isOver = envelope.remaining < 0;
    const isWarning = !isOver && pct >= 80;
    const isGoal = envelope.envelopeType === 'goal';
    const isAnnual = envelope.envelopeType === 'annual';
    const goalPct = isGoal && envelope.goalAmount > 0
      ? Math.min((goalProgress[envelope.name] / envelope.goalAmount) * 100, 100)
      : 0;

    // Goal pace indicator
    let goalPaceLabel = null;
    if (isGoal && envelope.goalAmount > 0 && envelope.dueDate) {
      const due = new Date(envelope.dueDate);
      const now = new Date(selectedYear, selectedMonth, 1);
      const monthsLeft = Math.max(1,
        (due.getFullYear() - now.getFullYear()) * 12 + (due.getMonth() - now.getMonth()) + 1
      );
      const saved = goalProgress[envelope.name] || 0;
      const needed = envelope.goalAmount - saved;
      const neededPerMonth = Math.ceil(needed / monthsLeft);
      const expectedByNow = envelope.goalAmount - neededPerMonth * monthsLeft;
      if (saved >= envelope.goalAmount) {
        goalPaceLabel = { text: 'Goal reached 🎉', cls: 'pace-done' };
      } else if (saved >= expectedByNow) {
        goalPaceLabel = { text: `On track · ₹${fmt(neededPerMonth)}/mo needed`, cls: 'pace-ok' };
      } else {
        goalPaceLabel = { text: `Behind · need ₹${fmt(neededPerMonth)}/mo`, cls: 'pace-behind' };
      }
    }

    // Annual YTD pace
    let annualPaceLabel = null;
    if (isAnnual && envelope.annualAmount > 0) {
      const ytd = annualYTD[envelope.name] || 0;
      const expectedMonths = selectedMonth + 1;
      const expectedYTD = Math.ceil((envelope.annualAmount / 12) * expectedMonths);
      if (ytd >= envelope.annualAmount) {
        annualPaceLabel = { text: 'Fully funded for year', cls: 'pace-done' };
      } else if (ytd >= expectedYTD) {
        annualPaceLabel = { text: `On track · ₹${fmt(ytd)} of ₹${fmt(expectedYTD)} expected`, cls: 'pace-ok' };
      } else {
        annualPaceLabel = { text: `Behind · ₹${fmt(ytd)} of ₹${fmt(expectedYTD)} expected YTD`, cls: 'pace-behind' };
      }
    }
    const isExpanded = expandedEnv === envelope.name;

    return (
      <div
        key={envelope.name}
        className={`env-card ${isOver ? 'env-over' : ''} ${isGoal ? 'env-goal' : ''} ${isAnnual ? 'env-annual' : ''} ${envelope.filled === 0 ? 'env-unfilled' : ''}`}
      >
        <div className="env-card-main">
          <div className="env-card-left" onClick={() => setExpandedEnv(isExpanded ? null : envelope.name)}>
            <div className={`env-type-badge ${envelope.envelopeType}`}>
              {isGoal ? '🎯' : isAnnual ? '📅' : getCatIcon(envelope.category)}
            </div>
            <div className="env-card-info">
              <div className="env-name">{envelope.name}</div>
              {isGoal && envelope.goalAmount > 0 && (
                <div className="env-goal-meta">
                  Goal: ₹{fmt(envelope.goalAmount)}
                  {envelope.dueDate && ` · Due ${new Date(envelope.dueDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`}
                </div>
              )}
              {isAnnual && envelope.annualAmount > 0 && (
                <div className="env-goal-meta">Annual: ₹{fmt(envelope.annualAmount)}</div>
              )}
            </div>
            <span className={`env-chevron ${isExpanded ? 'expanded' : ''}`}>›</span>
          </div>
          <div className="env-card-right">
            <div className={`env-remaining ${isOver ? 'negative' : 'positive'}`}>
              {isOver ? '-' : ''}₹{fmt(envelope.remaining)}
            </div>
            <button
              className="env-quick-add"
              aria-label={`Add expense to ${envelope.name}`}
              onClick={e => { e.stopPropagation(); onAddTransaction('expense', { envelope: envelope.name }); }}
            >
              + Spend
            </button>
          </div>
        </div>

        {/* Progress bar + always-visible stats */}
        <div className="env-progress-wrap">
          {envelope.filled === 0 ? (
            <div className="env-progress-empty">Not filled yet</div>
          ) : (
            <div className="env-progress-bar">
              <div
                className={`env-progress-fill ${isOver ? 'over' : isWarning ? 'warning' : envelope.category}`}
                style={{ width: `${isGoal ? goalPct : pct}%` }}
              />
            </div>
          )}
          {isGoal && envelope.goalAmount > 0 && (
            <div className="env-progress-label">
              ₹{fmt(goalProgress[envelope.name] || 0)} of ₹{fmt(envelope.goalAmount)} saved
            </div>
          )}
          {goalPaceLabel && (
            <div className={`env-pace-label ${goalPaceLabel.cls}`}>{goalPaceLabel.text}</div>
          )}
          {annualPaceLabel && (
            <div className={`env-pace-label ${annualPaceLabel.cls}`}>{annualPaceLabel.text}</div>
          )}
          <div className="env-stats-row">
            {envelope.filled === 0 ? (
              <span className="env-stat-unfilled">Not filled — tap Fill Envelopes to allocate</span>
            ) : (
              <>
                <span className="env-stat">
                  <span className="env-stat-label">Filled</span>
                  <span className="env-stat-value">₹{fmt(envelope.filled)}</span>
                </span>
                <span className="env-stat-dot">·</span>
                <span className="env-stat">
                  <span className="env-stat-label">Spent</span>
                  <span className={`env-stat-value ${isOver ? 'negative' : ''}`}>₹{fmt(envelope.spent)}</span>
                </span>
                <span className="env-stat-dot">·</span>
                <span className="env-stat">
                  <span className="env-stat-label">Left</span>
                  <span className={`env-stat-value ${isOver ? 'negative' : 'positive'}`}>
                    {isOver ? '-' : ''}₹{fmt(envelope.remaining)}
                  </span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Expanded: actions only */}
        {isExpanded && (
          <div className="env-card-details">
            {envelope.suggestedFill !== null && envelope.suggestedFill > 0 && (
              <div className="env-detail-row hint">
                <span>Suggested fill</span>
                <span>₹{fmt(envelope.suggestedFill)}/mo</span>
              </div>
            )}
            <div className="env-card-actions">
              <button className="env-action-btn" onClick={() => onViewTransactions({ envelope: envelope.name, year: selectedYear, month: selectedMonth })}>
                View Transactions
              </button>
              <button className="env-action-btn" onClick={() => { setTransferData({ from: envelope.name, to: '', amount: '' }); setShowTransferModal(true); }}>
                Transfer
              </button>
              <button className="env-action-btn" onClick={() => handleEditOpen(envelope)}>
                Edit
              </button>
              <button className="env-action-btn danger" onClick={() => handleDeleteEnvelope(envelope.name)}>
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getCatIcon = (cat) => cat === 'need' ? '🛒' : cat === 'want' ? '🎉' : '💰';


  return (
    <div className="envelopes-view">
      {/* Header */}
      <div className="ev-header">
        <div className="ev-header-top">
          <h1 className="ev-title">Envelopes</h1>
          <div className="ev-header-actions">
            <button className="ev-btn-icon" onClick={() => setShowTransferModal(true)} title="Transfer between envelopes">⇄</button>
            <button className="ev-btn-add" onClick={() => setShowAddModal(true)}>+ Add</button>
          </div>
        </div>

        {/* Month selector */}
        <div className="ev-month-nav">
          <button className="ev-month-arrow" onClick={() => {
            if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
            else setSelectedMonth(m => m - 1);
          }}>‹</button>
          <div className="ev-month-center">
            <span className="ev-month-label">{months[selectedMonth]} {selectedYear}</span>
            {(selectedMonth !== new Date().getMonth() || selectedYear !== new Date().getFullYear()) && (
              <button
                className="ev-today-btn"
                onClick={() => { setSelectedMonth(new Date().getMonth()); setSelectedYear(new Date().getFullYear()); }}
              >
                Today
              </button>
            )}
          </div>
          <button className="ev-month-arrow" onClick={() => {
            if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
            else setSelectedMonth(m => m + 1);
          }}>›</button>
        </div>

        {/* Summary bar */}
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

        {unallocated !== 0 && (
          <div className={`ev-alert ${unallocated < 0 ? 'danger' : 'warning'}`}>
            {unallocated > 0
              ? `₹${fmt(unallocated)} left to allocate — fill your envelopes to reach ₹0`
              : `Over-allocated by ₹${fmt(Math.abs(unallocated))} — reduce some fills`}
          </div>
        )}

        <button className="ev-fill-btn" onClick={handleFillOpen}>
          💰 Fill Envelopes
        </button>
      </div>

      {/* Envelope sections */}
      <div className="ev-content">
        {/* Accounts section */}
        {Object.keys(accountBalances).length > 0 && (
          <div className="ev-accounts-section">
            <button
              className="ev-accounts-header"
              onClick={() => setShowAccounts(v => !v)}
            >
              <span>💳 Accounts</span>
              <span className={`ev-accounts-chevron ${showAccounts ? 'open' : ''}`}>›</span>
            </button>
            {showAccounts && (
              <div className="ev-accounts-list">
                {Object.entries(accountBalances).map(([name, bal]) => (
                  <div
                    key={name}
                    className="ev-account-row"
                    onClick={() => onViewTransactions({ paymentMethod: name })}
                  >
                    <div className="ev-account-icon">💳</div>
                    <span className="ev-account-name">{name}</span>
                    <span className={`ev-account-bal ${bal >= 0 ? 'pos' : 'neg'}`}>
                      {bal < 0 ? '-' : ''}₹{fmt(bal)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {customEnvelopes.length === 0 ? (
          <div className="ev-empty">
            <div className="ev-empty-icon">📦</div>
            <div className="ev-empty-title">No envelopes yet</div>
            <div className="ev-empty-sub">Create envelopes to start budgeting</div>
            <button className="ev-btn-add large" onClick={() => setShowAddModal(true)}>Create First Envelope</button>
          </div>
        ) : (
          <>
            {[
              { key: 'need', label: 'Needs', icon: '🛒' },
              { key: 'want', label: 'Wants', icon: '🎉' },
              { key: 'saving', label: 'Savings & Goals', icon: '💰' }
            ].map(({ key, label, icon }) => {
              const list = envelopesByCategory[key] || [];
              const allEnvsInCat = customEnvelopes.filter(e => e.category === key);
              const catRemaining = list.reduce((s, e) => s + e.remaining, 0);
              const catIsOver = catRemaining < 0;

              // Show empty-category prompt only when not searching
              if (list.length === 0) {
                return (
                  <div key={key} className="ev-section">
                    <div className="ev-section-header">
                      <span>{icon} {label}</span>
                    </div>
                    <div className="ev-cat-empty" onClick={() => setShowAddModal(true)}>
                      + Add a {label.slice(0, -1)} envelope
                    </div>
                  </div>
                );
              }
              if (list.length === 0) return null;
              return (
                <div key={key} className="ev-section">
                  <div className="ev-section-header">
                    <span>{icon} {label}</span>
                    <div className="ev-section-meta">
                      <span className={`ev-section-remaining ${catIsOver ? 'neg' : ''}`}>
                        {catIsOver ? '-' : ''}₹{fmt(catRemaining)} left
                      </span>
                      <span className="ev-section-count">{list.length}</span>
                    </div>
                  </div>
                  {list.map(renderEnvelopeCard)}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* FAB */}
      <button className="ev-fab" onClick={() => onAddTransaction('expense')} aria-label="Add expense">+</button>

      {/* ===== FILL MODAL ===== */}
      {showFillModal && (
        <div className="ev-modal-overlay" onClick={() => setShowFillModal(false)}>
          <div className="ev-modal" onClick={e => e.stopPropagation()}>
            <div className="ev-modal-header">
              <h2>Fill Envelopes</h2>
              <button className="ev-modal-close" onClick={() => setShowFillModal(false)}>×</button>
            </div>

            <div className="fill-summary-bar">
              <div className="fill-summary-row">
                <span>Income</span>
                <span>₹{fmt(monthlyIncome)}</span>
              </div>
              <div className="fill-summary-row">
                <span>Filled</span>
                <span>₹{fmt(totalFillAmounts)}</span>
              </div>
              <div className={`fill-summary-row bold ${(monthlyIncome - totalFillAmounts) < 0 ? 'neg' : 'pos'}`}>
                <span>Remaining to fill</span>
                <span>₹{fmt(monthlyIncome - totalFillAmounts)}</span>
              </div>
            </div>

            <div className="fill-list">
              {customEnvelopes.map(env => {
                const suggested = computeMonthlyFill(env, selectedYear, selectedMonth);
                const spent = monthlySpending[env.name] || 0;
                const filled = fillAmounts[env.name] || 0;
                const remaining = filled - spent;
                const isOver = remaining < 0 && filled > 0;
                return (
                  <div key={env.name} className="fill-item">
                    <div className="fill-item-left">
                      <span className="fill-item-icon">
                        {env.envelopeType === 'goal' ? '🎯' : env.envelopeType === 'annual' ? '📅' : getCatIcon(env.category)}
                      </span>
                      <div>
                        <div className="fill-item-name">{env.name}</div>
                        <div className="fill-item-context">
                          {spent > 0 && (
                            <span className="fill-ctx-spent">Spent ₹{fmt(spent)}</span>
                          )}
                          {spent > 0 && filled > 0 && <span className="fill-ctx-sep">·</span>}
                          {filled > 0 && (
                            <span className={`fill-ctx-remaining ${isOver ? 'over' : ''}`}>
                              {isOver ? `₹${fmt(Math.abs(remaining))} over` : `₹${fmt(remaining)} left`}
                            </span>
                          )}
                          {spent === 0 && filled === 0 && suggested !== null && suggested > 0 && (
                            <span className="fill-item-hint">Suggested ₹{fmt(suggested)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="fill-item-right">
                      <input
                        type="number"
                        inputMode="numeric"
                        className={`fill-input ${isOver ? 'fill-input-over' : ''}`}
                        value={fillAmounts[env.name] || ''}
                        onChange={e => handleFillChange(env.name, e.target.value)}
                        placeholder="0"
                        min="0"
                      />
                      {(fillAmounts[env.name] > 0) && (
                        <button className="fill-clear-btn" onClick={() => handleFillChange(env.name, 0)} aria-label={`Clear ${env.name}`}>✕</button>
                      )}
                      {suggested !== null && suggested > 0 && !(spent === 0 && filled === 0) && (
                        <button className="fill-use-suggested" onClick={() => handleFillChange(env.name, suggested)}>
                          Use
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button className="ev-btn-primary full" onClick={() => setShowFillModal(false)}>Done</button>
          </div>
        </div>
      )}

      {/* ===== ADD ENVELOPE MODAL ===== */}
      {showAddModal && (
        <div className="ev-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="ev-modal" onClick={e => e.stopPropagation()}>
            <div className="ev-modal-header">
              <h2>New Envelope</h2>
              <button className="ev-modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <form onSubmit={handleAddEnvelope} className="add-env-form">
              <div className="form-field">
                <label>Name</label>
                <input className="ev-input" type="text" value={newEnv.name}
                  onChange={e => setNewEnv({ ...newEnv, name: e.target.value })}
                  placeholder="e.g. Groceries" autoFocus required />
              </div>

              <div className="form-field">
                <label>Category</label>
                <div className="ev-seg-control">
                  {[['need', '🛒 Need'], ['want', '🎉 Want'], ['saving', '💰 Saving']].map(([v, l]) => (
                    <button key={v} type="button"
                      className={`ev-seg-btn ${newEnv.category === v ? 'active' : ''}`}
                      onClick={() => setNewEnv({ ...newEnv, category: v })}>{l}</button>
                  ))}
                </div>
              </div>

              <div className="form-field">
                <label>Type</label>
                <div className="ev-seg-control">
                  {[['regular', '📦 Regular'], ['annual', '📅 Annual'], ['goal', '🎯 Goal']].map(([v, l]) => (
                    <button key={v} type="button"
                      className={`ev-seg-btn ${newEnv.envelopeType === v ? 'active' : ''}`}
                      onClick={() => setNewEnv({ ...newEnv, envelopeType: v })}>{l}</button>
                  ))}
                </div>
                <div className="ev-type-hint">
                  {newEnv.envelopeType === 'annual' && 'Set a yearly budget — auto-divided into monthly fills'}
                  {newEnv.envelopeType === 'goal' && 'Save toward a one-time goal with an optional due date'}
                  {newEnv.envelopeType === 'regular' && 'Standard monthly envelope'}
                </div>
              </div>

              {newEnv.envelopeType === 'annual' && (
                <div className="form-field">
                  <label>Annual Amount (₹)</label>
                  <input className="ev-input" type="number" min="0" value={newEnv.annualAmount}
                    onChange={e => setNewEnv({ ...newEnv, annualAmount: e.target.value })}
                    placeholder="e.g. 12000" />
                  {newEnv.annualAmount && (
                    <div className="ev-type-hint">Monthly fill: ₹{fmt(Math.ceil(parseFloat(newEnv.annualAmount) / 12))}</div>
                  )}
                </div>
              )}

              {newEnv.envelopeType === 'goal' && (
                <>
                  <div className="form-field">
                    <label>Goal Amount (₹)</label>
                    <input className="ev-input" type="number" min="0" value={newEnv.goalAmount}
                      onChange={e => setNewEnv({ ...newEnv, goalAmount: e.target.value })}
                      placeholder="e.g. 50000" />
                  </div>
                  <div className="form-field">
                    <label>Due Date (optional)</label>
                    <input className="ev-input" type="month" value={newEnv.dueDate}
                      onChange={e => setNewEnv({ ...newEnv, dueDate: e.target.value })} />
                  </div>
                </>
              )}

              <div className="ev-modal-footer">
                <button type="button" className="ev-btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="ev-btn-primary">Add Envelope</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== TRANSFER MODAL ===== */}
      {showTransferModal && (
        <div className="ev-modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="ev-modal" onClick={e => e.stopPropagation()}>
            <div className="ev-modal-header">
              <h2>Transfer Between Envelopes</h2>
              <button className="ev-modal-close" onClick={() => setShowTransferModal(false)}>×</button>
            </div>
            <form onSubmit={handleEnvelopeTransfer} className="add-env-form">
              <div className="form-field">
                <label>From Envelope</label>
                <select className="ev-input" value={transferData.from}
                  onChange={e => { setTransferData({ ...transferData, from: e.target.value }); setTransferError(''); }} required>
                  <option value="">Select envelope</option>
                  {customEnvelopes.map(e => {
                    const filled = envelopeFills[e.name] || 0;
                    const spent = monthlySpending[e.name] || 0;
                    return <option key={e.name} value={e.name}>{e.name} (₹{fmt(filled - spent)} left)</option>;
                  })}
                </select>
              </div>
              <div className="form-field">
                <label>To Envelope</label>
                <select className="ev-input" value={transferData.to}
                  onChange={e => setTransferData({ ...transferData, to: e.target.value })} required>
                  <option value="">Select envelope</option>
                  {customEnvelopes.filter(e => e.name !== transferData.from).map(e => {
                    const filled = envelopeFills[e.name] || 0;
                    const spent = monthlySpending[e.name] || 0;
                    return <option key={e.name} value={e.name}>{e.name} (₹{fmt(filled - spent)} left)</option>;
                  })}
                </select>
              </div>
              <div className="form-field">
                <label>Amount (₹)</label>
                <input className="ev-input" type="number" inputMode="numeric" min="0.01" step="0.01"
                  value={transferData.amount}
                  onChange={e => { setTransferData({ ...transferData, amount: e.target.value }); setTransferError(''); }}
                  placeholder="0" required />
                {transferError && <div className="ev-transfer-error">{transferError}</div>}
              </div>
              <div className="ev-modal-footer">
                <button type="button" className="ev-btn-ghost" onClick={() => { setShowTransferModal(false); setTransferError(''); }}>Cancel</button>
                <button type="submit" className="ev-btn-primary">Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== EDIT ENVELOPE MODAL ===== */}
      {editTarget && (
        <div className="ev-modal-overlay" onClick={() => setEditTarget(null)}>
          <div className="ev-modal" onClick={e => e.stopPropagation()}>
            <div className="ev-modal-header">
              <h2>Edit Envelope</h2>
              <button className="ev-modal-close" onClick={() => setEditTarget(null)}>×</button>
            </div>
            <form onSubmit={handleEditSave} className="add-env-form">
              <div className="form-field">
                <label>Name</label>
                <input className="ev-input" type="text" value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  autoFocus required />
              </div>

              <div className="form-field">
                <label>Category</label>
                <div className="ev-seg-control">
                  {[['need', '🛒 Need'], ['want', '🎉 Want'], ['saving', '💰 Saving']].map(([v, l]) => (
                    <button key={v} type="button"
                      className={`ev-seg-btn ${editForm.category === v ? 'active' : ''}`}
                      onClick={() => setEditForm({ ...editForm, category: v })}>{l}</button>
                  ))}
                </div>
              </div>

              <div className="form-field">
                <label>Type</label>
                <div className="ev-seg-control">
                  {[['regular', '📦 Regular'], ['annual', '📅 Annual'], ['goal', '🎯 Goal']].map(([v, l]) => (
                    <button key={v} type="button"
                      className={`ev-seg-btn ${editForm.envelopeType === v ? 'active' : ''}`}
                      onClick={() => setEditForm({ ...editForm, envelopeType: v })}>{l}</button>
                  ))}
                </div>
              </div>

              {editForm.envelopeType === 'annual' && (
                <div className="form-field">
                  <label>Annual Amount (₹)</label>
                  <input className="ev-input" type="number" min="0" value={editForm.annualAmount}
                    onChange={e => setEditForm({ ...editForm, annualAmount: e.target.value })}
                    placeholder="e.g. 12000" />
                  {editForm.annualAmount && (
                    <div className="ev-type-hint">Monthly fill: ₹{fmt(Math.ceil(parseFloat(editForm.annualAmount) / 12))}</div>
                  )}
                </div>
              )}

              {editForm.envelopeType === 'goal' && (
                <>
                  <div className="form-field">
                    <label>Goal Amount (₹)</label>
                    <input className="ev-input" type="number" min="0" value={editForm.goalAmount}
                      onChange={e => setEditForm({ ...editForm, goalAmount: e.target.value })}
                      placeholder="e.g. 50000" />
                  </div>
                  <div className="form-field">
                    <label>Due Date (optional)</label>
                    <input className="ev-input" type="month" value={editForm.dueDate}
                      onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })} />
                  </div>
                </>
              )}

              <div className="ev-modal-footer">
                <button type="button" className="ev-btn-ghost" onClick={() => setEditTarget(null)}>Cancel</button>
                <button type="submit" className="ev-btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRM MODAL ===== */}
      {deleteTarget && (
        <div className="ev-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="ev-modal ev-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="ev-modal-header">
              <h2>Delete Envelope</h2>
              <button className="ev-modal-close" onClick={() => setDeleteTarget(null)}>×</button>
            </div>
            <div className="ev-delete-body">
              <div className="ev-delete-icon">🗑️</div>
              <p className="ev-delete-msg">
                Delete <strong>"{deleteTarget}"</strong>? All budget allocations for this envelope will be removed.
              </p>
              <p className="ev-delete-sub">This cannot be undone.</p>
            </div>
            <div className="ev-modal-footer ev-delete-footer">
              <button className="ev-btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="ev-btn-danger" onClick={confirmDeleteEnvelope}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvelopesView;
