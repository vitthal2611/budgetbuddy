import React, { useState } from 'react';
import './EnvelopeManagement.css';
import { useData } from '../../contexts/DataContext';

const EnvelopeManagement = ({ budgets, setBudgets, transactions }) => {
  const { envelopes, addEnvelope, removeEnvelope, updateEnvelope, setEnvelopes } = useData();
  const [newEnvelopeName, setNewEnvelopeName] = useState('');
  const [newEnvelopeCategory, setNewEnvelopeCategory] = useState('need');
  const [newEnvelopeType, setNewEnvelopeType] = useState('regular');
  const [newAnnualAmount, setNewAnnualAmount] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleAddEnvelope = (e) => {
    e.preventDefault();
    if (!newEnvelopeName.trim()) return;

    try {
      addEnvelope(newEnvelopeName.trim(), newEnvelopeCategory, {
        envelopeType: newEnvelopeType,
        annualAmount: newAnnualAmount,
        goalAmount: newGoalAmount,
        dueDate: newDueDate
      });
      setNewEnvelopeName('');
      setNewEnvelopeCategory('need');
      setNewEnvelopeType('regular');
      setNewAnnualAmount('');
      setNewGoalAmount('');
      setNewDueDate('');
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

  const handleEditOpen = (envelope) => {
    setEditTarget(envelope.name);
    setEditForm({
      name: envelope.name,
      category: envelope.category,
      envelopeType: envelope.envelopeType || 'regular',
      annualAmount: envelope.annualAmount || '',
      goalAmount: envelope.goalAmount || '',
      dueDate: envelope.dueDate || '',
    });
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    try {
      const { originalName, newName } = updateEnvelope(editTarget, {
        name: editForm.name,
        category: editForm.category,
        envelopeType: editForm.envelopeType,
        annualAmount: editForm.annualAmount ? parseFloat(editForm.annualAmount) : undefined,
        goalAmount: editForm.goalAmount ? parseFloat(editForm.goalAmount) : undefined,
        dueDate: editForm.dueDate || undefined,
      });
      if (originalName !== newName) {
        const updated = { ...budgets };
        Object.keys(updated).forEach(k => {
          if (updated[k][originalName] !== undefined) {
            updated[k][newName] = updated[k][originalName];
            delete updated[k][originalName];
          }
        });
        setBudgets(updated);
      }
      setEditTarget(null);
    } catch (err) { alert(err.message); }
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
            <select
              className="envelope-category-select"
              value={newEnvelopeType}
              onChange={(e) => setNewEnvelopeType(e.target.value)}
            >
              <option value="regular">📦 Regular</option>
              <option value="annual">📅 Annual</option>
              <option value="goal">🎯 Goal</option>
            </select>
          </div>
          {newEnvelopeType === 'annual' && (
            <div className="form-row">
              <input type="number" className="envelope-name-input" placeholder="Annual amount (₹)..."
                value={newAnnualAmount} onChange={e => setNewAnnualAmount(e.target.value)} min="0" />
            </div>
          )}
          {newEnvelopeType === 'goal' && (
            <div className="form-row">
              <input type="number" className="envelope-name-input" placeholder="Goal amount (₹)..."
                value={newGoalAmount} onChange={e => setNewGoalAmount(e.target.value)} min="0" />
              <input type="month" className="envelope-name-input" placeholder="Due date (optional)"
                value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
            </div>
          )}
          <div className="form-row">
            <button type="submit" className="btn-save-envelope">Add</button>
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
                          {envelope.envelopeType === 'goal' ? '🎯' : envelope.envelopeType === 'annual' ? '📅' : getCategoryIcon(envelope.category)}
                        </span>
                        <span className="envelope-item-name">{envelope.name}</span>
                        {envelope.envelopeType !== 'regular' && (
                          <span className="envelope-type-tag">{envelope.envelopeType}</span>
                        )}
                      </div>
                      {editTarget === envelope.name ? (
                        <form className="envelope-edit-form" onSubmit={handleEditSave}>
                          <input className="envelope-name-input" value={editForm.name}
                            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                          <select className="envelope-category-select" value={editForm.category}
                            onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}>
                            <option value="need">🛒 Need</option>
                            <option value="want">🎉 Want</option>
                            <option value="saving">💰 Saving</option>
                          </select>
                          <button type="submit" className="btn-save-envelope">Save</button>
                          <button type="button" className="btn-cancel-edit" onClick={() => setEditTarget(null)}>✕</button>
                        </form>
                      ) : (
                        <div className="envelope-item-actions">
                          <button className="btn-edit-envelope" onClick={() => handleEditOpen(envelope)} title="Edit">✏️</button>
                          <button className="btn-delete-envelope" onClick={() => handleDeleteEnvelope(envelope.name)} title="Delete">🗑️</button>
                        </div>
                      )}
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
