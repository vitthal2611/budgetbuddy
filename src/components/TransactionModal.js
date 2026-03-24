import React, { useState, useEffect } from 'react';
import './TransactionModal.css';

const TransactionModal = ({ type, transaction, onSave, onClose }) => {
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

  const [paymentMethods, setPaymentMethods] = useState(() => {
    const saved = localStorage.getItem('paymentMethods');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [envelopes, setEnvelopes] = useState(() => {
    const customEnvelopes = localStorage.getItem('customEnvelopes');
    return customEnvelopes ? JSON.parse(customEnvelopes) : [];
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: transaction.amount,
        note: transaction.note,
        date: transaction.date,
        paymentMethod: transaction.paymentMethod || '',
        envelope: transaction.envelope || '',
        sourceAccount: transaction.sourceAccount || '',
        destinationAccount: transaction.destinationAccount || ''
      });
    } else {
      // Set defaults for new transactions
      setFormData(prev => ({
        ...prev,
        paymentMethod: paymentMethods[0] || '',
        envelope: envelopes[0] || '',
        sourceAccount: paymentMethods[0] || '',
        destinationAccount: paymentMethods[1] || paymentMethods[0] || ''
      }));
    }
  }, [transaction, paymentMethods, envelopes]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (type === 'transfer') {
      const baseId = transaction?.id || Date.now();
      const sourceTransaction = {
        id: transaction ? transaction.id : `${baseId}-source`,
        type: 'transfer',
        amount: formData.amount,
        note: formData.note,
        date: formData.date,
        sourceAccount: formData.sourceAccount,
        destinationAccount: formData.destinationAccount,
        isSource: true
      };
      
      const destTransaction = {
        id: transaction ? `${transaction.id.split('-')[0]}-dest` : `${baseId}-dest`,
        type: 'transfer',
        amount: formData.amount,
        note: formData.note,
        date: formData.date,
        sourceAccount: formData.sourceAccount,
        destinationAccount: formData.destinationAccount,
        isSource: false
      };
      
      onSave(sourceTransaction);
      if (!transaction) {
        onSave(destTransaction);
      }
    } else {
      onSave({
        id: transaction?.id || Date.now(),
        type,
        ...formData
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
            <label>Date (DD-MM-YYYY)</label>
            <input
              type="text"
              className="form-input"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              placeholder="DD-MM-YYYY"
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
                  <option value="">Select source account</option>
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
                  <option value="">Select destination account</option>
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
                    <option value="">Select payment method</option>
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
                      <option value="">Select envelope</option>
                      {envelopes.map(env => (
                        <option key={env} value={env}>{env}</option>
                      ))}
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
                    const updated = [...paymentMethods, newPaymentMethod.trim()];
                    setPaymentMethods(updated);
                    localStorage.setItem('paymentMethods', JSON.stringify(updated));
                    setFormData({ ...formData, paymentMethod: newPaymentMethod.trim() });
                    setNewPaymentMethod('');
                    setShowAddPaymentMethod(false);
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
                    const updated = [...envelopes, newEnvelope.trim()];
                    setEnvelopes(updated);
                    localStorage.setItem('customEnvelopes', JSON.stringify(updated));
                    setFormData({ ...formData, envelope: newEnvelope.trim() });
                    setNewEnvelope('');
                    setShowAddEnvelope(false);
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
