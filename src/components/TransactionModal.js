import React, { useState, useEffect } from 'react';
import './TransactionModal.modern.css';
import { useData } from '../contexts/DataContext';

const TransactionModal = ({ type, transaction, onSave, onClose }) => {
  const { envelopes, paymentMethods, addEnvelope, addPaymentMethod, generateTransactionId } = useData();
  
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
      const firstEnvelope = envelopes.length > 0 ? envelopes[0].name : '';
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
    
    if (type === 'transfer') {
      // Store transfer as single transaction with both accounts
      onSave({
        id: transaction?.id || generateTransactionId(),
        type: 'transfer',
        amount: parseFloat(formData.amount),
        note: formData.note,
        date: formData.date,
        sourceAccount: formData.sourceAccount,
        destinationAccount: formData.destinationAccount
      });
    } else if (type === 'income') {
      // Income transaction
      onSave({
        id: transaction?.id || generateTransactionId(),
        type: 'income',
        amount: parseFloat(formData.amount),
        note: formData.note,
        date: formData.date,
        paymentMethod: formData.paymentMethod
      });
    } else {
      // Expense transaction
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {transaction ? 'Edit' : 'Add'} {type.charAt(0).toUpperCase() + type.slice(1)}
          </h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Amount (Rs)</label>
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

          {type === 'transfer' ? (
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

              {type === 'expense' && (
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
                        const icon = env.category === 'need' ? '🛒' : env.category === 'want' ? '🎉' : '💰';
                        return (
                          <option key={env.name} value={env.name}>{icon} {env.name}</option>
                        );
                      })}
                      <option value="__add_new__">+ Add New</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-modal btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-modal btn-save">
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
