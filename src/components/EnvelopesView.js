import React, { useState, useMemo } from 'react';
import './EnvelopesView.css';
import { useData } from '../contexts/DataContext';

const EnvelopesView = ({ transactions, budgets, setBudgets, onAddTransaction, onViewTransactions }) => {
  const { envelopes: customEnvelopes, getEnvelopeCategory } = useData();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showFillModal, setShowFillModal] = useState(false);
  const [fillAmounts, setFillAmounts] = useState({});

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];

  // Calculate spending for selected month
  const monthlySpending = useMemo(() => {
    const spending = {};
    transactions
      .filter(t => {
        const tDate = new Date(t.date.split('-').reverse().join('-'));
        return t.type === 'expense' && 
               tDate.getFullYear() === selectedYear && 
               tDate.getMonth() === selectedMonth;
      })
      .forEach(t => {
        spending[t.envelope] = (spending[t.envelope] || 0) + parseFloat(t.amount);
      });
    return spending;
  }, [transactions, selectedYear, selectedMonth]);

  // Get budget allocations (what was filled into envelopes)
  const budgetKey = `${selectedYear}-${selectedMonth}`;
  const envelopeFills = budgets[budgetKey] || {};

  // Calculate income for the month
  const monthlyIncome = useMemo(() => {
    return transactions
      .filter(t => {
        const tDate = new Date(t.date.split('-').reverse().join('-'));
        return t.type === 'income' && 
               tDate.getFullYear() === selectedYear && 
               tDate.getMonth() === selectedMonth;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  }, [transactions, selectedYear, selectedMonth]);

  const totalFilled = Object.values(envelopeFills).reduce((sum, val) => sum + parseFloat(val || 0), 0);
  const unallocated = monthlyIncome - totalFilled;

  // Group envelopes by category
  const envelopesByCategory = useMemo(() => {
    const grouped = { need: [], want: [], saving: [] };
    customEnvelopes.forEach(env => {
      const filled = envelopeFills[env.name] || 0;
      const spent = monthlySpending[env.name] || 0;
      const remaining = filled - spent;
      
      grouped[env.category].push({
        name: env.name,
        category: env.category,
        filled,
        spent,
        remaining
      });
    });
    return grouped;
  }, [customEnvelopes, envelopeFills, monthlySpending]);

  const handleFillEnvelopes = () => {
    // Initialize with current fills
    const initial = {};
    customEnvelopes.forEach(env => {
      initial[env.name] = envelopeFills[env.name] || 0;
    });
    setFillAmounts(initial);
    setShowFillModal(true);
  };

  // Auto-save fill amounts as user types
  const handleFillAmountChange = (envelopeName, value) => {
    const numValue = value === '' ? 0 : parseFloat(value) || 0;
    
    const newFillAmounts = {
      ...fillAmounts,
      [envelopeName]: numValue
    };
    
    setFillAmounts(newFillAmounts);
    
    // Auto-save to budgets immediately
    setBudgets({
      ...budgets,
      [budgetKey]: newFillAmounts
    });
  };

  const handleQuickFill = () => {
    // Calculate current unallocated based on fillAmounts state
    const currentFilled = Object.values(fillAmounts).reduce((sum, val) => sum + parseFloat(val || 0), 0);
    const currentUnallocated = monthlyIncome - currentFilled;
    
    if (currentUnallocated <= 0 || customEnvelopes.length === 0) return;
    
    const perEnvelope = Math.floor(currentUnallocated / customEnvelopes.length);
    const newFills = { ...fillAmounts };
    
    customEnvelopes.forEach(env => {
      newFills[env.name] = (newFills[env.name] || 0) + perEnvelope;
    });
    
    setFillAmounts(newFills);
    
    // Auto-save immediately
    setBudgets({
      ...budgets,
      [budgetKey]: newFills
    });
  };

  const renderEnvelopeCard = (envelope) => {
    const percentage = envelope.filled > 0 ? (envelope.spent / envelope.filled) * 100 : 0;
    const isOverBudget = envelope.remaining < 0;
    
    return (
      <div 
        key={envelope.name} 
        className={`envelope-card ${isOverBudget ? 'over-budget' : ''}`}
        onClick={() => onViewTransactions({ 
          envelope: envelope.name,
          year: selectedYear,
          month: selectedMonth
        })}
      >
        <div className="envelope-header">
          <div className="envelope-icon-name">
            <span className={`env-icon ${envelope.category}`}>
              {envelope.category === 'need' && '🛒'}
              {envelope.category === 'want' && '🎉'}
              {envelope.category === 'saving' && '💰'}
            </span>
            <span className="env-name">{envelope.name}</span>
          </div>
          <div className={`env-remaining ${isOverBudget ? 'negative' : 'positive'}`}>
            ₹{envelope.remaining.toLocaleString('en-IN')}
          </div>
        </div>
        
        <div className="envelope-bar">
          <div 
            className={`envelope-bar-fill ${isOverBudget ? 'over' : envelope.category}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        
        <div className="envelope-footer">
          <span className="env-spent">Spent: ₹{envelope.spent.toLocaleString('en-IN')}</span>
          <span className="env-filled">of ₹{envelope.filled.toLocaleString('en-IN')}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="envelopes-view">
      <div className="envelopes-header">
        <h1>📦 Envelopes</h1>
        <button className="btn-fill-envelopes" onClick={handleFillEnvelopes}>
          💰 Fill Envelopes
        </button>
      </div>

      <div className="month-selector">
        <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
          {[2024, 2025, 2026, 2027].map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
          {months.map((month, idx) => (
            <option key={idx} value={idx}>{month}</option>
          ))}
        </select>
      </div>

      <div className="income-summary">
        <div className="income-card">
          <span className="income-label">Income</span>
          <span className="income-value">₹{monthlyIncome.toLocaleString('en-IN')}</span>
        </div>
        <div className="income-card">
          <span className="income-label">Filled</span>
          <span className="income-value">₹{totalFilled.toLocaleString('en-IN')}</span>
        </div>
        <div className={`income-card ${unallocated === 0 ? 'zero' : unallocated < 0 ? 'negative' : 'positive'}`}>
          <span className="income-label">Unallocated</span>
          <span className="income-value">₹{unallocated.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {unallocated !== 0 && (
        <div className={`unallocated-alert ${unallocated < 0 ? 'danger' : 'warning'}`}>
          {unallocated > 0 ? (
            <>
              ⚠️ You have ₹{unallocated.toLocaleString('en-IN')} unallocated. Fill your envelopes!
            </>
          ) : (
            <>
              ⚠️ Over-allocated by ₹{Math.abs(unallocated).toLocaleString('en-IN')}. Reduce some fills.
            </>
          )}
        </div>
      )}

      {/* Needs */}
      {envelopesByCategory.need.length > 0 && (
        <div className="envelope-section">
          <h2 className="section-title">
            <span className="section-icon">🛒</span>
            Needs
          </h2>
          <div className="envelope-list">
            {envelopesByCategory.need.map(renderEnvelopeCard)}
          </div>
        </div>
      )}

      {/* Wants */}
      {envelopesByCategory.want.length > 0 && (
        <div className="envelope-section">
          <h2 className="section-title">
            <span className="section-icon">🎉</span>
            Wants
          </h2>
          <div className="envelope-list">
            {envelopesByCategory.want.map(renderEnvelopeCard)}
          </div>
        </div>
      )}

      {/* Savings */}
      {envelopesByCategory.saving.length > 0 && (
        <div className="envelope-section">
          <h2 className="section-title">
            <span className="section-icon">💰</span>
            Savings & Goals
          </h2>
          <div className="envelope-list">
            {envelopesByCategory.saving.map(renderEnvelopeCard)}
          </div>
        </div>
      )}

      {customEnvelopes.length === 0 && (
        <div className="empty-state">
          <p>No envelopes yet. Go to Settings to create your first envelope!</p>
        </div>
      )}

      {/* Fill Envelopes Modal */}
      {showFillModal && (
        <div className="modal-overlay" onClick={() => setShowFillModal(false)}>
          <div className="fill-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fill-modal-header">
              <h2>💰 Fill Envelopes</h2>
              <button className="modal-close" onClick={() => setShowFillModal(false)}>×</button>
            </div>

            <div className="fill-summary">
              <div className="fill-summary-item">
                <span>Income:</span>
                <span>₹{monthlyIncome.toLocaleString('en-IN')}</span>
              </div>
              <div className="fill-summary-item">
                <span>To Allocate:</span>
                <span className={(monthlyIncome - Object.values(fillAmounts).reduce((s, v) => s + parseFloat(v || 0), 0)) < 0 ? 'negative' : 'positive'}>
                  ₹{(monthlyIncome - Object.values(fillAmounts).reduce((s, v) => s + parseFloat(v || 0), 0)).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="auto-save-indicator">
                <span className="save-icon">✓</span>
                <span className="save-text">Auto-saved</span>
              </div>
            </div>

            {(monthlyIncome - Object.values(fillAmounts).reduce((s, v) => s + parseFloat(v || 0), 0)) > 0 && (
              <button className="btn-quick-fill" onClick={handleQuickFill}>
                ⚡ Quick Fill Remaining
              </button>
            )}

            <div className="fill-list">
              {customEnvelopes.map(env => (
                <div key={env.name} className="fill-item">
                  <div className="fill-item-name">
                    <span className={`fill-icon ${env.category}`}>
                      {env.category === 'need' && '🛒'}
                      {env.category === 'want' && '🎉'}
                      {env.category === 'saving' && '💰'}
                    </span>
                    <span>{env.name}</span>
                  </div>
                  <input
                    type="number"
                    className="fill-input"
                    value={fillAmounts[env.name] || ''}
                    onChange={(e) => handleFillAmountChange(env.name, e.target.value)}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>

            <div className="fill-modal-actions">
              <button className="btn-done" onClick={() => setShowFillModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        className="fab" 
        onClick={() => onAddTransaction('expense')}
        aria-label="Add expense"
      >
        +
      </button>
    </div>
  );
};

export default EnvelopesView;
