import React, { useState, useEffect } from 'react';
import './TransactionModal.modern.css';
import { useData } from '../contexts/DataContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { canSpend, getTransferableEnvelopes } from '../utils/budgetRules';
import SpendingBlockModal from './shared/SpendingBlockModal';

const TransactionModal = ({ type, transaction, initialEnvelope, onSave, onDelete, onClose, budgets, transactions, monthlyIncome, onFillEnvelopes, onTransferRequest }) => {
  const { envelopes, paymentMethods, addEnvelope, addPaymentMethod, generateTransactionId } = useData();
  const { preferences } = usePreferences();
  
  const effectiveType = type === 'credit' ? 'expense' : type;
  
  // Helper functions to convert between DD-MM-YYYY and YYYY-MM-DD formats
  const toInputFormat = (ddmmyyyy) => {
    if (!ddmmyyyy) return '';
    const [day, month, year] = ddmmyyyy.split('-');
    return `${year}-${month}-${day}`;
  };
  
  const toStorageFormat = (yyyymmdd) => {
    if (!yyyymmdd) return '';
    const [year, month, day] = yyyymmdd.split('-');
    return `${day}-${month}-${year}`;
  };
  
  const today = new Date();
  const defaultDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

  const [formData, setFormData] = useState({
    amount: '',
    note: '',
    date: defaultDate,
    paymentMethod: '',
    envelope: '',
    sourceAccount: '',
    destinationAccount: ''
  });

  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [showAddEnvelope, setShowAddEnvelope] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [newEnvelope, setNewEnvelope] = useState('');
  const [spendingWarning, setSpendingWarning] = useState(null);
  const [showTransferSuggestion, setShowTransferSuggestion] = useState(false);
  const [alternativeEnvelopes, setAlternativeEnvelopes] = useState([]);
  const [showSpendingBlock, setShowSpendingBlock] = useState(null);
  
  // Track if we've initialized defaults to prevent overriding user selections
  const defaultsInitialized = React.useRef(false);

  // Calculate remaining budget for selected envelope
  useEffect(() => {
    if (type === 'expense' && formData.envelope && formData.amount && formData.date) {
      const [day, month, year] = formData.date.split('-');
      const monthIndex = parseInt(month) - 1;
      const budgetKey = `${year}-${monthIndex}`;
      
      const budget = budgets?.[budgetKey]?.[formData.envelope] || 0;
      
      // Calculate current spending for this envelope in this month
      const currentSpending = (transactions || [])
        .filter(t => {
          if (t.type !== 'expense' || t.envelope !== formData.envelope) return false;
          if (transaction && t.id === transaction.id) return false; // Exclude current transaction if editing
          const [tDay, tMonth, tYear] = t.date.split('-');
          return tYear === year && tMonth === month;
        })
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const newAmount = parseFloat(formData.amount) || 0;
      const remaining = budget - currentSpending - newAmount;
      
      // Find alternative envelopes with enough money
      const alternatives = envelopes
        .filter(env => env.name !== formData.envelope)
        .map(env => {
          const envBudget = budgets?.[budgetKey]?.[env.name] || 0;
          const envSpending = (transactions || [])
            .filter(t => {
              if (t.type !== 'expense' || t.envelope !== env.name) return false;
              const [tDay, tMonth, tYear] = t.date.split('-');
              return tYear === year && tMonth === month;
            })
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
          const envRemaining = envBudget - envSpending;
          
          return {
            name: env.name,
            category: env.category,
            remaining: envRemaining,
            canCover: envRemaining >= newAmount
          };
        })
        .filter(env => env.canCover)
        .sort((a, b) => b.remaining - a.remaining)
        .slice(0, 3);
      
      setAlternativeEnvelopes(alternatives);
      
      if (budget === 0) {
        const isBlocked = preferences.blockOverspending;
        setSpendingWarning({
          type: 'no-budget',
          message: isBlocked
            ? `🚫 No budget allocated for ${formData.envelope} this month.`
            : `⚠️ No budget allocated for ${formData.envelope} this month.`,
          isBlocked,
          suggestion: 'Fill this envelope first, or choose a different one.'
        });
        setShowTransferSuggestion(false);
      } else if (remaining < 0) {
        const isBlocked = preferences.blockOverspending;
        setSpendingWarning({
          type: 'over-budget',
          message: isBlocked 
            ? `🚫 Cannot spend! This exceeds your budget by ₹${Math.abs(remaining).toLocaleString('en-IN')}.`
            : `⚠️ This will exceed your budget by ₹${Math.abs(remaining).toLocaleString('en-IN')}!`,
          remaining: remaining,
          isBlocked: isBlocked,
          suggestion: alternatives.length > 0 
            ? 'Transfer money from another envelope or choose a different envelope.'
            : 'Set a higher budget or choose a different envelope.'
        });
        setShowTransferSuggestion(alternatives.length > 0);
      } else if (remaining < budget * 0.2) {
        setSpendingWarning({
          type: 'low-budget',
          message: `⚠️ Only ₹${remaining.toLocaleString('en-IN')} will be left in ${formData.envelope}`,
          remaining: remaining,
          suggestion: 'Consider if this expense is necessary.'
        });
        setShowTransferSuggestion(false);
      } else {
        setSpendingWarning({
          type: 'ok',
          message: `✓ ₹${remaining.toLocaleString('en-IN')} will remain in ${formData.envelope}`,
          remaining: remaining
        });
        setShowTransferSuggestion(false);
      }
    } else {
      setSpendingWarning(null);
      setShowTransferSuggestion(false);
    }
  }, [type, formData.envelope, formData.amount, formData.date, budgets, transactions, transaction, envelopes, preferences.blockOverspending]);

  useEffect(() => {
    if (transaction) {
      // Editing existing transaction - always update
      setFormData({
        amount: transaction.amount,
        note: transaction.note,
        date: transaction.date,
        paymentMethod: transaction.paymentMethod || '',
        envelope: transaction.envelope || '',
        sourceAccount: transaction.sourceAccount || '',
        destinationAccount: transaction.destinationAccount || ''
      });
      defaultsInitialized.current = true;
    } else if (!defaultsInitialized.current && (paymentMethods.length > 0 || envelopes.length > 0)) {
      // New transaction - set defaults only once when data is available
      const firstEnvelope = initialEnvelope || (envelopes.length > 0 ? envelopes[0].name : '');
      const defaultPaymentMethod = paymentMethods.includes('HDFC') ? 'HDFC' : (paymentMethods[0] || '');
      setFormData(prev => ({
        ...prev,
        paymentMethod: defaultPaymentMethod,
        envelope: firstEnvelope,
        sourceAccount: defaultPaymentMethod,
        destinationAccount: paymentMethods[1] || paymentMethods[0] || ''
      }));
      defaultsInitialized.current = true;
    }
  }, [transaction, paymentMethods, envelopes]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // STRICT BUDGET RULES ENFORCEMENT
    if (effectiveType === 'expense' && formData.envelope && formData.amount && formData.date) {
      const [day, month, year] = formData.date.split('-');
      const monthIndex = parseInt(month) - 1;
      const budgetKey = `${year}-${monthIndex}`;
      
      // Calculate Ready to Assign
      const income = (transactions || [])
        .filter(t => {
          if (t.type !== 'income') return false;
          const [tDay, tMonth, tYear] = t.date.split('-');
          return tYear === year && tMonth === month;
        })
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const totalFilled = Object.values(budgets[budgetKey] || {}).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      const readyToAssign = income - totalFilled;
      
      // Calculate envelope balance
      const filled = budgets?.[budgetKey]?.[formData.envelope] || 0;
      const currentSpending = (transactions || [])
        .filter(t => {
          if (t.type !== 'expense' || t.envelope !== formData.envelope) return false;
          if (transaction && t.id === transaction.id) return false;
          const [tDay, tMonth, tYear] = t.date.split('-');
          return tYear === year && tMonth === month;
        })
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const envelopeBalance = filled - currentSpending;
      const spendAmount = parseFloat(formData.amount);
      
      // Check if spending is allowed
      const spendCheck = canSpend(readyToAssign, envelopeBalance, spendAmount);
      
      if (!spendCheck.allowed) {
        // Get transferable envelopes
        const allEnvelopes = envelopes.map(env => {
          const envFilled = budgets?.[budgetKey]?.[env.name] || 0;
          const envSpent = (transactions || [])
            .filter(t => {
              if (t.type !== 'expense' || t.envelope !== env.name) return false;
              const [tDay, tMonth, tYear] = t.date.split('-');
              return tYear === year && tMonth === month;
            })
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
          
          return {
            name: env.name,
            category: env.category,
            filled: envFilled,
            spent: envSpent,
            remaining: envFilled - envSpent
          };
        });
        
        const transferable = getTransferableEnvelopes(allEnvelopes, formData.envelope);
        
        // Show spending block modal
        setShowSpendingBlock({
          reason: spendCheck.reason,
          message: spendCheck.message,
          shortfall: spendCheck.shortfall,
          targetEnvelope: formData.envelope,
          spendAmount: spendAmount,
          transferableEnvelopes: transferable
        });
        return;
      }
    }
    
    // Block submission if overspending is not allowed (legacy check)
    if (spendingWarning?.isBlocked) {
      alert('Cannot save: This transaction exceeds your budget. Transfer money from another envelope first.');
      return;
    }
    
    if (effectiveType === 'transfer') {
      onSave({
        id: transaction?.id || generateTransactionId(),
        type: 'transfer',
        amount: parseFloat(formData.amount),
        note: formData.note,
        date: formData.date,
        sourceAccount: formData.sourceAccount,
        destinationAccount: formData.destinationAccount
      });
    } else if (effectiveType === 'income') {
      onSave({
        id: transaction?.id || generateTransactionId(),
        type: 'income',
        amount: parseFloat(formData.amount),
        note: formData.note,
        date: formData.date,
        paymentMethod: formData.paymentMethod
      });
    } else {
      // Expense
      onSave({
        id: transaction?.id || generateTransactionId(),
        type: 'expense',
        amount: parseFloat(formData.amount),
        note: formData.note,
        date: formData.date,
        paymentMethod: formData.paymentMethod,
        envelope: formData.envelope
      });
    }
  };

  const handleTransferFromBlock = (sourceEnvelope, targetEnvelope, amount) => {
    // Close spending block modal
    setShowSpendingBlock(null);
    
    // Trigger transfer
    if (onTransferRequest) {
      onTransferRequest({
        from: sourceEnvelope,
        to: targetEnvelope,
        amount: amount,
        returnToExpense: {
          ...formData,
          amount: parseFloat(formData.amount)
        }
      });
    }
  };

  const handleTransferAndContinue = (sourceEnvelope) => {
    // Close this modal and open transfer modal
    if (onTransferRequest) {
      onTransferRequest({
        from: sourceEnvelope,
        to: formData.envelope,
        amount: parseFloat(formData.amount),
        returnToExpense: {
          ...formData,
          amount: parseFloat(formData.amount)
        }
      });
    }
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'need': return '🛒';
      case 'want': return '🎉';
      case 'saving': return '💰';
      default: return '📦';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {transaction ? 'Edit' : 'Add'} {effectiveType.charAt(0).toUpperCase() + effectiveType.slice(1)}
          </h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Amount (₹)</label>
            <input
              type="number"
              className="form-input"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Note</label>
            <input
              type="text"
              className="form-input"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              className="form-input date-input"
              value={toInputFormat(formData.date)}
              onChange={(e) => setFormData({ ...formData, date: toStorageFormat(e.target.value) })}
              required
            />
          </div>

          {effectiveType === 'transfer' ? (
            <>
              <div className="form-group">
                <label>Source Account</label>
                <select
                  className="form-select"
                  value={formData.sourceAccount}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setShowAddPaymentMethod(true);
                    } else {
                      setFormData({ ...formData, sourceAccount: e.target.value });
                    }
                  }}
                  required
                >
                  <option value="">
                    {paymentMethods.length === 0 ? 'No accounts - Add one below' : 'Select source account'}
                  </option>
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                  <option value="__add_new__">+ Add New</option>
                </select>
              </div>

              <div className="form-group">
                <label>Destination Account</label>
                <select
                  className="form-select"
                  value={formData.destinationAccount}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setShowAddPaymentMethod(true);
                    } else {
                      setFormData({ ...formData, destinationAccount: e.target.value });
                    }
                  }}
                  required
                >
                  <option value="">
                    {paymentMethods.length === 0 ? 'No accounts - Add one below' : 'Select destination account'}
                  </option>
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                  <option value="__add_new__">+ Add New</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Payment Method</label>
                <div className="select-with-add">
                  <select
                    className="form-select"
                    value={formData.paymentMethod}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setShowAddPaymentMethod(true);
                      } else {
                        setFormData({ ...formData, paymentMethod: e.target.value });
                      }
                    }}
                    required
                  >
                    <option value="">
                      {paymentMethods.length === 0 ? 'No payment methods - Add one below' : 'Select payment method'}
                    </option>
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                    <option value="__add_new__">+ Add New</option>
                  </select>
                </div>
              </div>

              {effectiveType === 'expense' && (
                <div className="form-group">
                  <label>Envelope</label>
                  <div className="select-with-add">
                    <select
                      className="form-select"
                      value={formData.envelope}
                      onChange={(e) => {
                        if (e.target.value === '__add_new__') {
                          setShowAddEnvelope(true);
                        } else {
                          setFormData({ ...formData, envelope: e.target.value });
                        }
                      }}
                      required
                    >
                      <option value="">
                        {envelopes.length === 0 ? 'No envelopes - Add one below' : 'Select envelope'}
                      </option>
                      {envelopes.map(env => {
                        const icon = getCategoryIcon(env.category);
                        return (
                          <option key={env.name} value={env.name}>{icon} {env.name}</option>
                        );
                      })}
                      <option value="__add_new__">+ Add New</option>
                    </select>
                  </div>
                  
                  {spendingWarning && (
                    <div className={`spending-warning ${spendingWarning.type}`}>
                      <div className="warning-message">{spendingWarning.message}</div>
                      {spendingWarning.suggestion && (
                        <div className="warning-suggestion">{spendingWarning.suggestion}</div>
                      )}
                      
                      {showTransferSuggestion && alternativeEnvelopes.length > 0 && (
                        <div className="transfer-suggestions">
                          <div className="suggestions-title">Transfer from:</div>
                          {alternativeEnvelopes.map(env => (
                            <button
                              key={env.name}
                              type="button"
                              className="btn-transfer-suggestion"
                              onClick={() => handleTransferAndContinue(env.name)}
                            >
                              {getCategoryIcon(env.category)} {env.name} (₹{env.remaining.toLocaleString('en-IN')})
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="modal-actions">
            {transaction && (
              <button
                type="button"
                className="btn-modal btn-delete"
                onClick={() => { onClose(); setTimeout(() => onDelete && onDelete(transaction.id), 100); }}
              >
                Delete
              </button>
            )}
            <button type="button" className="btn-modal btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-modal btn-save"
              disabled={spendingWarning?.isBlocked}
            >
              {spendingWarning?.isBlocked ? 'Cannot Save' : 'Save'}
            </button>
          </div>
        </form>

        {/* Spending Block Modal */}
        {showSpendingBlock && (
          <SpendingBlockModal
            reason={showSpendingBlock.reason}
            message={showSpendingBlock.message}
            shortfall={showSpendingBlock.shortfall}
            targetEnvelope={showSpendingBlock.targetEnvelope}
            spendAmount={showSpendingBlock.spendAmount}
            transferableEnvelopes={showSpendingBlock.transferableEnvelopes}
            onTransfer={handleTransferFromBlock}
            onAssignIncome={() => {
              setShowSpendingBlock(null);
              onClose();
              if (onFillEnvelopes) onFillEnvelopes();
            }}
            onCancel={() => setShowSpendingBlock(null)}
          />
        )}

        {showAddPaymentMethod && (
          <div className="inline-add-form">
            <input
              type="text"
              className="inline-input"
              value={newPaymentMethod}
              onChange={(e) => setNewPaymentMethod(e.target.value)}
              placeholder="Enter payment method name..."
              autoFocus
            />
            <div className="inline-buttons">
              <button 
                type="button" 
                className="btn-inline-cancel" 
                onClick={() => {
                  setShowAddPaymentMethod(false);
                  setNewPaymentMethod('');
                }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-inline-save"
                onClick={() => {
                  if (newPaymentMethod.trim()) {
                    try {
                      addPaymentMethod(newPaymentMethod.trim());
                      setFormData({ ...formData, paymentMethod: newPaymentMethod.trim() });
                      setNewPaymentMethod('');
                      setShowAddPaymentMethod(false);
                    } catch (error) {
                      alert(error.message);
                    }
                  }
                }}
              >
                Add
              </button>
            </div>
          </div>
        )}

        {showAddEnvelope && (
          <div className="inline-add-form">
            <input
              type="text"
              className="inline-input"
              value={newEnvelope}
              onChange={(e) => setNewEnvelope(e.target.value)}
              placeholder="Enter envelope name..."
              autoFocus
            />
            <div className="inline-buttons">
              <button 
                type="button" 
                className="btn-inline-cancel" 
                onClick={() => {
                  setShowAddEnvelope(false);
                  setNewEnvelope('');
                }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-inline-save"
                onClick={() => {
                  if (newEnvelope.trim()) {
                    try {
                      addEnvelope(newEnvelope.trim(), 'need');
                      setFormData({ ...formData, envelope: newEnvelope.trim() });
                      setNewEnvelope('');
                      setShowAddEnvelope(false);
                    } catch (error) {
                      alert(error.message);
                    }
                  }
                }}
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionModal;
