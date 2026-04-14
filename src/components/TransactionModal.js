import React, { useState, useEffect } from 'react';
import './TransactionModal.modern.css';
import { useData } from '../contexts/DataContext';

const TransactionModal = ({ type, transaction, initialEnvelope, onSave, onDelete, onClose, budgets, transactions, monthlyIncome, onFillEnvelopes, onTransferRequest }) => {
  const { envelopes, paymentMethods, addEnvelope, addPaymentMethod, generateTransactionId } = useData();
  
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
  
  // Track if we've initialized defaults to prevent overriding user selections
  const defaultsInitialized = React.useRef(false);

  // Calculate remaining budget for selected envelope
  // Removed - no longer showing warnings

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
    
    // All budget validation removed - allow any transaction
    
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

  const handleTransferAndContinue = (sourceEnvelope) => {
    // Transfer functionality removed - no longer needed
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
          {/* Amount - Large and prominent */}
          <div className="form-group form-group-amount">
            <label>Amount</label>
            <div className="amount-input-wrapper">
              <span className="currency-symbol">₹</span>
              <input
                type="number"
                className="form-input amount-input"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                min="0"
                step="0.01"
                placeholder="0"
                autoFocus={!transaction}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Note</label>
            <input
              type="text"
              className="form-input"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              required
              placeholder="What's this for?"
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
              {/* Payment Method - Chips */}
              <div className="form-group">
                <label>Payment Method</label>
                {paymentMethods.length > 0 ? (
                  <div className="payment-chips">
                    {paymentMethods.map(method => (
                      <button
                        key={method}
                        type="button"
                        className={`payment-chip ${formData.paymentMethod === method ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, paymentMethod: method })}
                      >
                        💳 {method}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="payment-chip add-new"
                      onClick={() => setShowAddPaymentMethod(true)}
                    >
                      + Add
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-add-first"
                    onClick={() => setShowAddPaymentMethod(true)}
                  >
                    + Add Payment Method
                  </button>
                )}
              </div>

              {effectiveType === 'expense' && (
                <div className="form-group">
                  <label>Envelope</label>
                  {envelopes.length > 0 ? (
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
                      <option value="">Select envelope</option>
                      {envelopes.map(env => {
                        const icon = getCategoryIcon(env.category);
                        return (
                          <option key={env.name} value={env.name}>{icon} {env.name}</option>
                        );
                      })}
                      <option value="__add_new__">+ Add New</option>
                    </select>
                  ) : (
                    <button
                      type="button"
                      className="btn-add-first"
                      onClick={() => setShowAddEnvelope(true)}
                    >
                      + Create First Envelope
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Date - Keep native picker */}
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
            >
              Save
            </button>
          </div>
        </form>

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
