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
  const { envelopes: customEnvelopes, addEnvelope, removeEnvelope, setEnvelopes } = useData();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showFillModal, setShowFillModal] = useState(false);
  const [fillAmounts, setFillAmounts] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({ from: '', to: '', amount: '' });
  const [newEnv, setNewEnv] = useState({ name: '', category: 'need', envelopeType: 'regular', annualAmount: '', goalAmount: '', dueDate: '' });
  const [expandedEnv, setExpandedEnv] = useState(null);

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

  const unallocated = monthlyIncome - totalFilled;

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

  const handleAutoFill = () => {
    const currentFilled = Object.values(fillAmounts).reduce((s, v) => s + parseFloat(v || 0), 0);
    const remaining = monthlyIncome - currentFilled;
    if (remaining <= 0 || customEnvelopes.length === 0) return;
    const unfilled = customEnvelopes.filter(e => !fillAmounts[e.name] || fillAmounts[e.name] === 0);
    if (unfilled.length === 0) return;
    const perEnv = Math.floor(remaining / unfilled.length);
    const newFills = { ...fillAmounts };
    unfilled.forEach(e => { newFills[e.name] = perEnv; });
    setFillAmounts(newFills);
    setBudgets({ ...budgets, [budgetKey]: newFills });
  };

  const handleSuggestedFill = () => {
    const newFills = { ...fillAmounts };
    customEnvelopes.forEach(env => {
      const suggested = computeMonthlyFill(env, selectedYear, selectedMonth);
      if (suggested !== null && suggested > 0) {
        newFills[env.name] = suggested;
      }
    });
    setFillAmounts(newFills);
    setBudgets({ ...budgets, [budgetKey]: newFills });
  };

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
    const newFills = { ...envelopeFills };
    newFills[from] = Math.max(0, (newFills[from] || 0) - amt);
    newFills[to] = (newFills[to] || 0) + amt;
    setBudgets({ ...budgets, [budgetKey]: newFills });
    setTransferData({ from: '', to: '', amount: '' });
    setShowTransferModal(false);
  };

  const handleDeleteEnvelope = (name) => {
    if (!window.confirm(`Delete envelope "${name}"? Budget allocations will be removed.`)) return;
    removeEnvelope(name);
    const cleaned = { ...budgets };
    Object.keys(cleaned).forEach(k => { delete cleaned[k][name]; });
    setBudgets(cleaned);
  };

  const renderEnvelopeCard = (envelope) => {
    const pct = envelope.filled > 0 ? Math.min((envelope.spent / envelope.filled) * 100, 100) : 0;
    const isOver = envelope.remaining < 0;
    const isGoal = envelope.envelopeType === 'goal';
    const isAnnual = envelope.envelopeType === 'annual';
    const goalPct = isGoal && envelope.goalAmount > 0
      ? Math.min((goalProgress[envelope.name] / envelope.goalAmount) * 100, 100)
      : 0;
    const isExpanded = expandedEnv === envelope.name;

    return (
      <div
        key={envelope.name}
        className={`env-card ${isOver ? 'env-over' : ''} ${isGoal ? 'env-goal' : ''} ${isAnnual ? 'env-annual' : ''}`}
      >
        <div className="env-card-main" onClick={() => setExpandedEnv(isExpanded ? null : envelope.name)}>
          <div className="env-card-left">
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
          </div>
          <div className={`env-remaining ${isOver ? 'negative' : 'positive'}`}>
            {isOver ? '-' : ''}₹{fmt(envelope.remaining)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="env-progress-wrap">
          <div className="env-progress-bar">
            <div
              className={`env-progress-fill ${isOver ? 'over' : envelope.category}`}
              style={{ width: `${isGoal ? goalPct : pct}%` }}
            />
          </div>
          {isGoal && envelope.goalAmount > 0 && (
            <div className="env-progress-label">
              ₹{fmt(goalProgress[envelope.name] || 0)} of ₹{fmt(envelope.goalAmount)} saved
            </div>
          )}
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="env-card-details">
            <div className="env-detail-row">
              <span>Filled this month</span>
              <span>₹{fmt(envelope.filled)}</span>
            </div>
            <div className="env-detail-row">
              <span>Spent</span>
              <span className={isOver ? 'negative' : ''}>₹{fmt(envelope.spent)}</span>
            </div>
            <div className="env-detail-row">
              <span>Remaining</span>
              <span className={isOver ? 'negative' : 'positive'}>
                {isOver ? '-' : ''}₹{fmt(envelope.remaining)}
              </span>
            </div>
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

  const hasAnnualOrGoal = customEnvelopes.some(e => e.envelopeType !== 'regular');

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
          <span className="ev-month-label">{months[selectedMonth]} {selectedYear}</span>
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
              if (list.length === 0) return null;
              return (
                <div key={key} className="ev-section">
                  <div className="ev-section-header">
                    <span>{icon} {label}</span>
                    <span className="ev-section-count">{list.length}</span>
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
                <span>₹{fmt(Object.values(fillAmounts).reduce((s, v) => s + parseFloat(v || 0), 0))}</span>
              </div>
              <div className={`fill-summary-row bold ${(monthlyIncome - Object.values(fillAmounts).reduce((s, v) => s + parseFloat(v || 0), 0)) < 0 ? 'neg' : 'pos'}`}>
                <span>Remaining to fill</span>
                <span>₹{fmt(monthlyIncome - Object.values(fillAmounts).reduce((s, v) => s + parseFloat(v || 0), 0))}</span>
              </div>
            </div>

            <div className="fill-actions-row">
              {(monthlyIncome - Object.values(fillAmounts).reduce((s, v) => s + parseFloat(v || 0), 0)) > 0 && (
                <button className="fill-quick-btn" onClick={handleAutoFill}>⚡ Auto-fill Remaining</button>
              )}
              {hasAnnualOrGoal && (
                <button className="fill-quick-btn secondary" onClick={handleSuggestedFill}>📅 Use Suggested</button>
              )}
            </div>

            <div className="fill-list">
              {customEnvelopes.map(env => {
                const suggested = computeMonthlyFill(env, selectedYear, selectedMonth);
                return (
                  <div key={env.name} className="fill-item">
                    <div className="fill-item-left">
                      <span className="fill-item-icon">
                        {env.envelopeType === 'goal' ? '🎯' : env.envelopeType === 'annual' ? '📅' : getCatIcon(env.category)}
                      </span>
                      <div>
                        <div className="fill-item-name">{env.name}</div>
                        {suggested !== null && suggested > 0 && (
                          <div className="fill-item-hint">Suggested: ₹{fmt(suggested)}</div>
                        )}
                      </div>
                    </div>
                    <div className="fill-item-right">
                      <input
                        type="number"
                        className="fill-input"
                        value={fillAmounts[env.name] || ''}
                        onChange={e => handleFillChange(env.name, e.target.value)}
                        placeholder="0"
                        min="0"
                      />
                      {suggested !== null && suggested > 0 && (
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
                  onChange={e => setTransferData({ ...transferData, from: e.target.value })} required>
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
                  {customEnvelopes.filter(e => e.name !== transferData.from).map(e => (
                    <option key={e.name} value={e.name}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Amount (₹)</label>
                <input className="ev-input" type="number" min="0.01" step="0.01"
                  value={transferData.amount}
                  onChange={e => setTransferData({ ...transferData, amount: e.target.value })}
                  placeholder="0" required />
              </div>
              <div className="ev-modal-footer">
                <button type="button" className="ev-btn-ghost" onClick={() => setShowTransferModal(false)}>Cancel</button>
                <button type="submit" className="ev-btn-primary">Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvelopesView;
