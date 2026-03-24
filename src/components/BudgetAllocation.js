import React, { useState, useMemo } from 'react';
import './BudgetAllocation.css';

const BudgetAllocation = ({ budgets, setBudgets, transactions }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' or 'yearly'
  const [showAddEnvelope, setShowAddEnvelope] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [envelopeToDelete, setEnvelopeToDelete] = useState(null);
  const [newEnvelope, setNewEnvelope] = useState('');
  const [customEnvelopes, setCustomEnvelopes] = useState(() => {
    const saved = localStorage.getItem('customEnvelopes');
    return saved ? JSON.parse(saved) : [];
  });
  
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const envelopes = useMemo(() => {
    const envelopeSet = new Set([...customEnvelopes]);
    transactions.forEach(t => {
      if (t.type === 'expense' && t.envelope) {
        envelopeSet.add(t.envelope);
      }
    });
    return Array.from(envelopeSet);
  }, [transactions, customEnvelopes]);

  const getMonthlyData = (monthIndex) => {
    const key = `${selectedYear}-${monthIndex}`;
    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date.split('-').reverse().join('-'));
      return tDate.getFullYear() === selectedYear && tDate.getMonth() === monthIndex;
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const envelopeBudgets = budgets[key] || {};
    const totalAllocated = Object.values(envelopeBudgets).reduce((sum, val) => sum + parseFloat(val || 0), 0);
    const unallocated = income - totalAllocated;

    return { income, unallocated, envelopeBudgets };
  };

  const handleBudgetChange = (monthIndex, envelope, value) => {
    const key = `${selectedYear}-${monthIndex}`;
    setBudgets({
      ...budgets,
      [key]: {
        ...(budgets[key] || {}),
        [envelope]: parseFloat(value) || 0
      }
    });
  };

  const handleAddEnvelope = (e) => {
    e.preventDefault();
    const trimmedName = newEnvelope.trim();
    
    if (!trimmedName) {
      alert('Please enter an envelope name');
      return;
    }
    
    if (envelopes.includes(trimmedName)) {
      alert('This envelope already exists');
      return;
    }
    
    const updated = [...customEnvelopes, trimmedName];
    setCustomEnvelopes(updated);
    localStorage.setItem('customEnvelopes', JSON.stringify(updated));
    setNewEnvelope('');
    setShowAddEnvelope(false);
  };

  const handleRemoveEnvelope = (envelope) => {
    setEnvelopeToDelete(envelope);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (envelopeToDelete) {
      const updated = customEnvelopes.filter(e => e !== envelopeToDelete);
      setCustomEnvelopes(updated);
      localStorage.setItem('customEnvelopes', JSON.stringify(updated));
    }
    setShowDeleteConfirm(false);
    setEnvelopeToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setEnvelopeToDelete(null);
  };

  const totals = useMemo(() => {
    let totalIncome = 0;
    let totalUnallocated = 0;
    const envelopeTotals = {};

    monthsShort.forEach((_, idx) => {
      const data = getMonthlyData(idx);
      totalIncome += data.income;
      totalUnallocated += data.unallocated;
      
      envelopes.forEach(env => {
        envelopeTotals[env] = (envelopeTotals[env] || 0) + (data.envelopeBudgets[env] || 0);
      });
    });

    return { totalIncome, totalUnallocated, envelopeTotals };
  }, [selectedYear, budgets, transactions, envelopes]);

  const currentMonthData = getMonthlyData(selectedMonth);

  return (
    <div className="budget-allocation">
      <h1 className="budget-title">Budget Allocation</h1>
      
      <div className="budget-controls">
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'monthly' ? 'active' : ''}`}
            onClick={() => setViewMode('monthly')}
          >
            Monthly
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'yearly' ? 'active' : ''}`}
            onClick={() => setViewMode('yearly')}
          >
            Yearly
          </button>
        </div>

        <div className="date-selectors">
          <select 
            className="year-select" 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {[2024, 2025, 2026, 2027].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          {viewMode === 'monthly' && (
            <select 
              className="month-select" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {months.map((month, idx) => (
                <option key={idx} value={idx}>{month}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {viewMode === 'monthly' ? (
        <>
          <div className="summary-cards-grid">
            <div className="summary-card-small income">
              <div className="card-label">Income</div>
              <div className="card-value">₹{currentMonthData.income.toFixed(0)}</div>
            </div>
            <div className="summary-card-small unallocated">
              <div className="card-label">Unallocated</div>
              <div className={`card-value ${currentMonthData.unallocated >= 0 ? '' : 'negative'}`}>
                ₹{currentMonthData.unallocated.toFixed(0)}
              </div>
            </div>
          </div>

          <div className="envelope-list">
            {envelopes.length === 0 ? (
              <div className="empty-state">
                <p>No envelopes yet. Add your first envelope to start budgeting!</p>
              </div>
            ) : (
              envelopes.map(env => {
                const budgetValue = currentMonthData.envelopeBudgets[env] || '';
                
                return (
                  <div key={env} className="envelope-row">
                    <div className="envelope-info">
                      <span className="envelope-name">{env}</span>
                    </div>
                    <div className="envelope-actions">
                      <input
                        type="number"
                        className="envelope-budget-input"
                        value={budgetValue}
                        onChange={(e) => handleBudgetChange(selectedMonth, env, e.target.value)}
                        placeholder="0"
                      />
                      <button 
                        className="remove-btn-small" 
                        onClick={() => handleRemoveEnvelope(env)}
                        title="Remove envelope"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            
            <button 
              className="add-envelope-card" 
              onClick={() => setShowAddEnvelope(true)}
            >
              <span className="plus-icon">+</span>
              <span>Add Envelope</span>
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="summary-section">
            <div className="summary-row">
              <span className="summary-label">Total Income:</span>
              <span className="summary-value positive">₹{totals.totalIncome.toFixed(0)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Unallocated:</span>
              <span className={`summary-value ${totals.totalUnallocated >= 0 ? 'positive' : 'negative'}`}>
                ₹{totals.totalUnallocated.toFixed(0)}
              </span>
            </div>
          </div>

          <div className="budget-table-container">
            <table className="budget-table">
              <thead>
                <tr>
                  <th>Envelope</th>
                  {monthsShort.map((month, idx) => (
                    <th key={idx}>{month}</th>
                  ))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {envelopes.length === 0 ? (
                  <tr>
                    <td colSpan={14} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                      No envelopes yet. Add your first envelope to start budgeting!
                    </td>
                  </tr>
                ) : (
                  envelopes.map(env => {
                    return (
                      <tr key={env}>
                        <td>
                          <div className="envelope-header-cell">
                            <span>{env}</span>
                            <button 
                              className="remove-envelope-btn" 
                              onClick={() => handleRemoveEnvelope(env)}
                              title="Remove envelope"
                            >
                              ×
                            </button>
                          </div>
                        </td>
                        {monthsShort.map((_, idx) => {
                          const data = getMonthlyData(idx);
                          return (
                            <td key={idx}>
                              <input
                                type="number"
                                className="budget-input"
                                value={data.envelopeBudgets[env] || ''}
                                onChange={(e) => handleBudgetChange(idx, env, e.target.value)}
                                placeholder="0"
                              />
                            </td>
                          );
                        })}
                        <td className="budget-value">
                          {totals.envelopeTotals[env]?.toFixed(0) || '0'}
                        </td>
                      </tr>
                    );
                  })
                )}
                <tr className="add-row">
                  <td>
                    <button 
                      className="btn-add-row" 
                      onClick={() => setShowAddEnvelope(true)}
                      title="Add new envelope"
                    >
                      + Add Envelope
                    </button>
                  </td>
                  {monthsShort.map((_, idx) => (
                    <td key={idx}></td>
                  ))}
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {showAddEnvelope && (
        <div className="add-envelope-modal" onClick={(e) => {
          if (e.target.className === 'add-envelope-modal') {
            setShowAddEnvelope(false);
            setNewEnvelope('');
          }
        }}>
          <div className="add-envelope-content">
            <h3>Add New Envelope</h3>
            <form onSubmit={handleAddEnvelope}>
              <input
                type="text"
                className="envelope-input"
                value={newEnvelope}
                onChange={(e) => setNewEnvelope(e.target.value)}
                placeholder="Enter envelope name..."
                autoFocus
              />
              <div className="modal-buttons">
                <button type="button" className="btn-cancel-envelope" onClick={() => {
                  setShowAddEnvelope(false);
                  setNewEnvelope('');
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn-save-envelope">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="add-envelope-modal" onClick={(e) => {
          if (e.target.className === 'add-envelope-modal') {
            cancelDelete();
          }
        }}>
          <div className="add-envelope-content confirm-dialog">
            <h3>Delete Envelope</h3>
            <p className="confirm-message">
              Are you sure you want to delete "<strong>{envelopeToDelete}</strong>"? 
              This will remove all budget data for this envelope.
            </p>
            <div className="modal-buttons">
              <button type="button" className="btn-cancel-envelope" onClick={cancelDelete}>
                Cancel
              </button>
              <button type="button" className="btn-delete-envelope" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetAllocation;
