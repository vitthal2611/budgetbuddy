import React, { useState } from 'react';
import './RecurringTransactions.css';
import { useData } from '../../contexts/DataContext';
import EmptyState from '../shared/EmptyState';

const RecurringTransactions = ({ recurring, setRecurring }) => {
  const { envelopes, paymentMethods } = useData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    note: '',
    envelope: '',
    paymentMethod: '',
    frequency: 'monthly',
    dayOfMonth: 1,
    startDate: '',
    endDate: '',
    isActive: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newRecurring = {
      id: `recurring-${Date.now()}`,
      ...formData,
      amount: parseFloat(formData.amount),
      dayOfMonth: parseInt(formData.dayOfMonth),
      lastProcessed: null
    };
    
    setRecurring([...recurring, newRecurring]);
    
    // Reset form
    setFormData({
      type: 'expense',
      amount: '',
      note: '',
      envelope: '',
      paymentMethod: '',
      frequency: 'monthly',
      dayOfMonth: 1,
      startDate: '',
      endDate: '',
      isActive: true
    });
    setShowAddForm(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this recurring transaction?')) return;
    setRecurring(recurring.filter(r => r.id !== id));
  };

  const toggleActive = (id) => {
    setRecurring(recurring.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const getFrequencyLabel = (freq) => {
    switch(freq) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return freq;
    }
  };

  return (
    <div className="recurring-transactions">
      <div className="recurring-header">
        <div>
          <h2>🔄 Recurring Transactions</h2>
          <p className="recurring-subtitle">Automate regular income and expenses</p>
        </div>
        <button 
          className="btn-add-recurring"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '✕ Cancel' : '+ Add Recurring'}
        </button>
      </div>

      {showAddForm && (
        <form className="add-recurring-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Type</label>
              <select
                className="form-select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div className="form-group">
              <label>Amount</label>
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

            <div className="form-group full-width">
              <label>Description</label>
              <input
                type="text"
                className="form-input"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="e.g., Netflix Subscription, Salary"
                required
              />
            </div>

            <div className="form-group">
              <label>Payment Method</label>
              <select
                className="form-select"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                required
              >
                <option value="">Select...</option>
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            {formData.type === 'expense' && (
              <div className="form-group">
                <label>Envelope</label>
                <select
                  className="form-select"
                  value={formData.envelope}
                  onChange={(e) => setFormData({ ...formData, envelope: e.target.value })}
                  required
                >
                  <option value="">Select...</option>
                  {envelopes.map(env => (
                    <option key={env.name} value={env.name}>{env.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Frequency</label>
              <select
                className="form-select"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                required
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {formData.frequency === 'monthly' && (
              <div className="form-group">
                <label>Day of Month</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.dayOfMonth}
                  onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
                  min="1"
                  max="31"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>End Date (Optional)</label>
              <input
                type="date"
                className="form-input"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-save-recurring">
              Add Recurring Transaction
            </button>
          </div>
        </form>
      )}

      {recurring.length === 0 ? (
        <EmptyState
          icon="🔄"
          title="No Recurring Transactions"
          message="Set up automatic transactions for regular income and expenses like salary, rent, subscriptions, etc."
          actionLabel="Add Your First"
          onAction={() => setShowAddForm(true)}
        />
      ) : (
        <div className="recurring-list">
          {recurring.map(item => (
            <div key={item.id} className={`recurring-item ${!item.isActive ? 'inactive' : ''}`}>
              <div className="recurring-item-header">
                <div className="recurring-item-title">
                  <span className={`recurring-type-badge ${item.type}`}>
                    {item.type === 'income' ? '💰' : '💸'} {item.type}
                  </span>
                  <span className="recurring-item-note">{item.note}</span>
                </div>
                <div className="recurring-item-amount">
                  ₹{item.amount.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="recurring-item-details">
                <span className="recurring-detail">
                  <strong>Frequency:</strong> {getFrequencyLabel(item.frequency)}
                  {item.frequency === 'monthly' && ` (Day ${item.dayOfMonth})`}
                </span>
                <span className="recurring-detail">
                  <strong>Payment:</strong> {item.paymentMethod}
                </span>
                {item.envelope && (
                  <span className="recurring-detail">
                    <strong>Envelope:</strong> {item.envelope}
                  </span>
                )}
              </div>

              <div className="recurring-item-actions">
                <button
                  className={`btn-toggle-active ${item.isActive ? 'active' : 'inactive'}`}
                  onClick={() => toggleActive(item.id)}
                >
                  {item.isActive ? '✓ Active' : '⏸ Paused'}
                </button>
                <button
                  className="btn-delete-recurring"
                  onClick={() => handleDelete(item.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="recurring-info">
        <p>💡 <strong>Tip:</strong> Recurring transactions are processed automatically when you open the app. You can review and edit them before they're added to your transactions.</p>
      </div>
    </div>
  );
};

export default RecurringTransactions;
