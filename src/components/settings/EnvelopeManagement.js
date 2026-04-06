import React, { useState } from 'react';
import './EnvelopeManagement.css';
import { useData } from '../../contexts/DataContext';

const EnvelopeManagement = ({ budgets, setBudgets, transactions }) => {
  const { envelopes, addEnvelope, removeEnvelope, setEnvelopes } = useData();
  const [newEnvelopeName, setNewEnvelopeName] = useState('');
  const [newEnvelopeCategory, setNewEnvelopeCategory] = useState('need');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddEnvelope = (e) => {
    e.preventDefault();
    if (!newEnvelopeName.trim()) return;

    try {
      addEnvelope(newEnvelopeName.trim(), newEnvelopeCategory);
      setNewEnvelopeName('');
      setNewEnvelopeCategory('need');
      setShowAddForm(false);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteEnvelope = (envelopeName) => {
    // Check if envelope has transactions
    const hasTransactions = transactions.some(t => t.envelope === envelopeName);
    
    const confirmMsg = hasTransactions
      ? `⚠️ Delete "${envelopeName}"?\n\nThis envelope has transactions. Deleting it will also remove all budget allocations.\n\nTransactions will remain but won't be linked to an envelope.\n\nThis cannot be undone.`
      : `Delete "${envelopeName}"?\n\nThis will remove all budget allocations for this envelope.\n\nThis cannot be undone.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      // Remove envelope
      removeEnvelope(envelopeName);

      // Clean up budgets
      const cleanedBudgets = { ...budgets };
      Object.keys(cleanedBudgets).forEach(monthKey => {
        if (cleanedBudgets[monthKey][envelopeName]) {
          delete cleanedBudgets[monthKey][envelopeName];
        }
      });
      setBudgets(cleanedBudgets);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleCategoryChange = (envelopeName, newCategory) => {
    const updatedEnvelopes = envelopes.map(env =>
      env.name === envelopeName ? { ...env, category: newCategory } : env
    );
    setEnvelopes(updatedEnvelopes);
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'need': return '🛒';
      case 'want': return '🎉';
      case 'saving': return '💰';
      default: return '📦';
    }
  };

  const groupedEnvelopes = {
    need: envelopes.filter(e => e.category === 'need'),
    want: envelopes.filter(e => e.category === 'want'),
    saving: envelopes.filter(e => e.category === 'saving')
  };

  return (
    <div className="envelope-management">
      <div className="envelope-management-header">
        <h2>📦 Manage Envelopes</h2>
        <button 
          className="btn-add-envelope"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '✕ Cancel' : '+ Add Envelope'}
        </button>
      </div>

      {showAddForm && (
        <form className="add-envelope-form" onSubmit={handleAddEnvelope}>
          <div className="form-row">
            <input
              type="text"
              className="envelope-name-input"
              placeholder="Envelope name..."
              value={newEnvelopeName}
              onChange={(e) => setNewEnvelopeName(e.target.value)}
              autoFocus
            />
            <select
              className="envelope-category-select"
              value={newEnvelopeCategory}
              onChange={(e) => setNewEnvelopeCategory(e.target.value)}
            >
              <option value="need">🛒 Need</option>
              <option value="want">🎉 Want</option>
              <option value="saving">💰 Saving</option>
            </select>
            <button type="submit" className="btn-save-envelope">
              Add
            </button>
          </div>
        </form>
      )}

      {envelopes.length === 0 ? (
        <div className="empty-envelopes">
          <p>No envelopes yet. Create your first envelope to get started!</p>
        </div>
      ) : (
        <>
          {['need', 'want', 'saving'].map(category => {
            const categoryEnvelopes = groupedEnvelopes[category];
            if (categoryEnvelopes.length === 0) return null;

            return (
              <div key={category} className="envelope-category-group">
                <h3 className="category-group-title">
                  {getCategoryIcon(category)}
                  {category === 'need' && ' Needs'}
                  {category === 'want' && ' Wants'}
                  {category === 'saving' && ' Savings & Goals'}
                </h3>
                <div className="envelope-list">
                  {categoryEnvelopes.map(envelope => (
                    <div key={envelope.name} className="envelope-item">
                      <div className="envelope-item-info">
                        <span className="envelope-item-icon">
                          {getCategoryIcon(envelope.category)}
                        </span>
                        <span className="envelope-item-name">{envelope.name}</span>
                      </div>
                      <div className="envelope-item-actions">
                        <select
                          className="envelope-category-change"
                          value={envelope.category}
                          onChange={(e) => handleCategoryChange(envelope.name, e.target.value)}
                        >
                          <option value="need">🛒 Need</option>
                          <option value="want">🎉 Want</option>
                          <option value="saving">💰 Saving</option>
                        </select>
                        <button
                          className="btn-delete-envelope"
                          onClick={() => handleDeleteEnvelope(envelope.name)}
                          title="Delete envelope"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default EnvelopeManagement;
