import React, { useState } from 'react';
import './PaymentMethodManagement.css';
import { useData } from '../../contexts/DataContext';

const PaymentMethodManagement = () => {
  const { paymentMethods, addPaymentMethod, setPaymentMethods } = useData();
  const [newMethod, setNewMethod] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddMethod = (e) => {
    e.preventDefault();
    if (!newMethod.trim()) return;

    try {
      addPaymentMethod(newMethod.trim());
      setNewMethod('');
      setShowAddForm(false);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteMethod = (method) => {
    if (!window.confirm(`Delete payment method "${method}"?\n\nThis cannot be undone.`)) {
      return;
    }

    const updated = paymentMethods.filter(m => m !== method);
    setPaymentMethods(updated);
  };

  return (
    <div className="payment-method-management">
      <div className="payment-method-header">
        <h2>💳 Manage Payment Methods</h2>
        <button 
          className="btn-add-method"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '✕ Cancel' : '+ Add Payment Method'}
        </button>
      </div>

      {showAddForm && (
        <form className="add-method-form" onSubmit={handleAddMethod}>
          <input
            type="text"
            className="method-name-input"
            placeholder="Payment method name (e.g., HDFC Bank, Cash, Credit Card)..."
            value={newMethod}
            onChange={(e) => setNewMethod(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn-save-method">
            Add
          </button>
        </form>
      )}

      {paymentMethods.length === 0 ? (
        <div className="empty-methods">
          <p>No payment methods yet. Add your first payment method to get started!</p>
        </div>
      ) : (
        <div className="method-list">
          {paymentMethods.map(method => (
            <div key={method} className="method-item">
              <div className="method-item-info">
                <span className="method-item-icon">💳</span>
                <span className="method-item-name">{method}</span>
              </div>
              <button
                className="btn-delete-method"
                onClick={() => handleDeleteMethod(method)}
                title="Delete payment method"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentMethodManagement;
