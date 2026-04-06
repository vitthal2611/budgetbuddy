import React, { useState, useMemo } from 'react';
import './IncomeAllocation.css';
import { useData } from '../contexts/DataContext';

const IncomeAllocation = ({ transactions, budgets, setBudgets, onViewTransactions }) => {
  const { envelopes: customEnvelopes, getEnvelopeCategory } = useData();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];

  // Calculate income and spending for selected month
  const monthlyData = useMemo(() => {
    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date.split('-').reverse().join('-'));
      return tDate.getFullYear() === selectedYear && tDate.getMonth() === selectedMonth;
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const spending = {};
    monthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        spending[t.envelope] = (spending[t.envelope] || 0) + parseFloat(t.amount);
      });

    return { income, spending };
  }, [transactions, selectedYear, selectedMonth]);

  // Get budget allocations
  const budgetKey = `${selectedYear}-${selectedMonth}`;
  const allocations = budgets[budgetKey] || {};
  
  // Calculate totals
  const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + parseFloat(val || 0), 0);
  const unallocated = monthlyData.income - totalAllocated;

  // Group envelopes by category
  const envelopesByCategory = useMemo(() => {
    const grouped = { need: [], want: [], saving: [] };
    customEnvelopes.forEach(env => {
      grouped[env.category].push(env.name);
    });
    return grouped;
  }, [customEnvelopes]);

  const handleAllocationChange = (envelope, value) => {
    const numValue = value === '' ? 0 : parseFloat(value) || 0;
    
    setBudgets({
      ...budgets,
      [budgetKey]: {
        ...allocations,
        [envelope]: numValue
      }
    });
  };

  const handleQuickAllocate = () => {
    if (unallocated <= 0) return;
    
    // Distribute unallocated money evenly across all envelopes
    const envelopeCount = customEnvelopes.length;
    if (envelopeCount === 0) return;
    
    const perEnvelope = Math.floor(unallocated / envelopeCount);
    const newAllocations = { ...allocations };
    
    customEnvelopes.forEach(env => {
      newAllocations[env.name] = (newAllocations[env.name] || 0) + perEnvelope;
    });
    
    setBudgets({
      ...budgets,
      [budgetKey]: newAllocations
    });
  };

  const handleTransfer = () => {
    if (!transferFrom || !transferTo || !transferAmount) return;
    
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    const fromAllocation = allocations[transferFrom] || 0;
    if (amount > fromAllocation) {
      alert(`Cannot transfer ₹${amount}. Only ₹${fromAllocation} available in ${transferFrom}`);
      return;
    }
    
    const newAllocations = {
      ...allocations,
      [transferFrom]: fromAllocation - amount,
      [transferTo]: (allocations[transferTo] || 0) + amount
    };
    
    setBudgets({
      ...budgets,
      [budgetKey]: newAllocations
    });
    
    setShowTransferModal(false);
    setTransferFrom('');
    setTransferTo('');
    setTransferAmount('');
  };

  const renderEnvelopeCard = (envelope) => {
    const allocated = allocations[envelope] || 0;
    const spent = monthlyData.spending[envelope] || 0;
    const remaining = allocated - spent;
    const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
    const category = getEnvelopeCategory(envelope);
    
    return (
      <div key={envelope} className="envelope-card" onClick={() => onViewTransactions({ 
        envelope: envelope,
        year: selectedYear,
        month: selectedMonth
      })}>
        <div className="envelope-card-header">
          <div className="envelope-card-name">
            <span className={`envelope-icon ${category}`}>
              {category === 'need' && '🛒'}
              {category === 'want' && '🎉'}
              {category === 'saving' && '💰'}
            </span>
            <span>{envelope}</span>
          </div>
          <input
            type="number"
            className="envelope-allocation-input"
            value={allocated || ''}
            onChange={(e) => {
              e.stopPropagation();
              handleAllocationChange(envelope, e.target.value);
            }}
            onClick={(e) => e.stopPropagation()}
            placeholder="0"
          />
        </div>
        
        <div className="envelope-card-body">
          <div className="envelope-remaining">
            <span className="remaining-label">Remaining</span>
            <span className={`remaining-amount ${remaining < 0 ? 'negative' : 'positive'}`}>
              ₹{remaining.toLocaleString('en-IN')}
            </span>
          </div>
          
          <div className="envelope-progress-bar">
            <div 
              className={`envelope-progress-fill ${percentage > 100 ? 'over' : category}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          
          <div className="envelope-stats">
            <span className="stat-item">Spent: ₹{spent.toLocaleString('en-IN')}</span>
            <span className="stat-item">{Math.round(percentage)}%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="income-allocation">
      <div className="allocation-header">
        <h1>💰 Income Allocation</h1>
        <p className="allocation-subtitle">Give every rupee a job</p>
      </div>

      <div className="allocation-controls">
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

      <div className="allocation-summary">
        <div className="summary-card income-card">
          <div className="summary-icon">💵</div>
          <div className="summary-content">
            <div className="summary-label">Total Income</div>
            <div className="summary-value">₹{monthlyData.income.toLocaleString('en-IN')}</div>
          </div>
        </div>
        
        <div className="summary-card allocated-card">
          <div className="summary-icon">📊</div>
          <div className="summary-content">
            <div className="summary-label">Allocated</div>
            <div className="summary-value">₹{totalAllocated.toLocaleString('en-IN')}</div>
          </div>
        </div>
        
        <div className={`summary-card unallocated-card ${unallocated === 0 ? 'zero' : unallocated < 0 ? 'negative' : 'positive'}`}>
          <div className="summary-icon">{unallocated === 0 ? '✅' : unallocated < 0 ? '⚠️' : '💸'}</div>
          <div className="summary-content">
            <div className="summary-label">Unallocated</div>
            <div className="summary-value">₹{unallocated.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {unallocated !== 0 && (
        <div className={`allocation-alert ${unallocated < 0 ? 'alert-danger' : 'alert-warning'}`}>
          {unallocated > 0 ? (
            <>
              <span>⚠️ You have ₹{unallocated.toLocaleString('en-IN')} unallocated. Give every rupee a job!</span>
              <button className="btn-quick-allocate" onClick={handleQuickAllocate}>
                Quick Allocate
              </button>
            </>
          ) : (
            <span>⚠️ Over-allocated by ₹{Math.abs(unallocated).toLocaleString('en-IN')}. Reduce some allocations.</span>
          )}
        </div>
      )}

      <div className="allocation-actions">
        <button className="btn-transfer" onClick={() => setShowTransferModal(true)}>
          🔄 Transfer Between Envelopes
        </button>
      </div>

      {/* Needs */}
      {envelopesByCategory.need.length > 0 && (
        <div className="envelope-category-section">
          <h2 className="category-title">
            <span className="category-icon">🛒</span>
            Needs
          </h2>
          <div className="envelope-grid">
            {envelopesByCategory.need.map(renderEnvelopeCard)}
          </div>
        </div>
      )}

      {/* Wants */}
      {envelopesByCategory.want.length > 0 && (
        <div className="envelope-category-section">
          <h2 className="category-title">
            <span className="category-icon">🎉</span>
            Wants
          </h2>
          <div className="envelope-grid">
            {envelopesByCategory.want.map(renderEnvelopeCard)}
          </div>
        </div>
      )}

      {/* Savings */}
      {envelopesByCategory.saving.length > 0 && (
        <div className="envelope-category-section">
          <h2 className="category-title">
            <span className="category-icon">💰</span>
            Savings & Goals
          </h2>
          <div className="envelope-grid">
            {envelopesByCategory.saving.map(renderEnvelopeCard)}
          </div>
        </div>
      )}

      {customEnvelopes.length === 0 && (
        <div className="empty-state">
          <p>No envelopes yet. Go to Budget tab to create your first envelope!</p>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Transfer Between Envelopes</h3>
            <p className="modal-subtitle">Move money from one envelope to another</p>
            
            <div className="form-group">
              <label>From Envelope</label>
              <select value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)}>
                <option value="">Select envelope...</option>
                {customEnvelopes.map(env => (
                  <option key={env.name} value={env.name}>
                    {env.name} (₹{(allocations[env.name] || 0).toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>To Envelope</label>
              <select value={transferTo} onChange={(e) => setTransferTo(e.target.value)}>
                <option value="">Select envelope...</option>
                {customEnvelopes.filter(env => env.name !== transferFrom).map(env => (
                  <option key={env.name} value={env.name}>
                    {env.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Amount</label>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="Enter amount..."
              />
            </div>
            
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowTransferModal(false)}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={handleTransfer}>
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomeAllocation;
