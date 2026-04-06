import React, { useState, useEffect } from 'react';
import './FillEnvelopesModal.css';
import { useData } from '../../contexts/DataContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import { calculateRollover, getRolloverSummary } from '../../utils/budgetRollover';

const FillEnvelopesModal = ({ 
  isOpen, 
  onClose, 
  budgets, 
  setBudgets, 
  transactions,
  monthlyIncome,
  year,
  month,
  templates = []
}) => {
  const { envelopes: customEnvelopes } = useData();
  const { preferences } = usePreferences();
  const [fillAmounts, setFillAmounts] = useState({});
  const [showRollover, setShowRollover] = useState(false);
  const [rolloverData, setRolloverData] = useState({});
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  const budgetKey = `${year}-${month}`;

  // Initialize fill amounts and calculate rollover
  useEffect(() => {
    if (isOpen) {
      const currentBudget = budgets[budgetKey] || {};
      const initial = {};
      
      customEnvelopes.forEach(env => {
        initial[env.name] = currentBudget[env.name] || 0;
      });
      
      setFillAmounts(initial);

      // Calculate rollover if enabled
      if (preferences.rolloverMode !== 'none') {
        const rollover = calculateRollover(budgets, transactions, year, month);
        setRolloverData(rollover);
        setShowRollover(Object.keys(rollover).length > 0);
      }
    }
  }, [isOpen, budgets, budgetKey, customEnvelopes, preferences.rolloverMode, transactions, year, month]);

  const handleFillAmountChange = (envelopeName, value) => {
    const numValue = value === '' ? 0 : parseFloat(value) || 0;
    
    const newFillAmounts = {
      ...fillAmounts,
      [envelopeName]: numValue
    };
    
    setFillAmounts(newFillAmounts);
    
    // Auto-save to budgets immediately
    setBudgets({
      ...budgets,
      [budgetKey]: newFillAmounts
    });
  };

  const handleQuickFill = () => {
    const currentFilled = Object.values(fillAmounts).reduce((sum, val) => sum + parseFloat(val || 0), 0);
    const currentUnallocated = monthlyIncome - currentFilled;
    
    if (currentUnallocated <= 0 || customEnvelopes.length === 0) return;
    
    const perEnvelope = Math.floor(currentUnallocated / customEnvelopes.length);
    const newFills = { ...fillAmounts };
    
    customEnvelopes.forEach(env => {
      newFills[env.name] = (newFills[env.name] || 0) + perEnvelope;
    });
    
    setFillAmounts(newFills);
    setBudgets({
      ...budgets,
      [budgetKey]: newFills
    });
  };

  const handleApplyRollover = () => {
    const newFills = { ...fillAmounts };
    
    Object.keys(rolloverData).forEach(envelope => {
      newFills[envelope] = (newFills[envelope] || 0) + rolloverData[envelope];
    });
    
    setFillAmounts(newFills);
    setBudgets({
      ...budgets,
      [budgetKey]: newFills
    });
    
    setShowRollover(false);
  };

  const handleLoadTemplate = (template) => {
    const newFills = { ...template.data };
    setFillAmounts(newFills);
    setBudgets({
      ...budgets,
      [budgetKey]: newFills
    });
    setShowTemplates(false);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    const newTemplate = {
      id: `template-${Date.now()}`,
      name: templateName.trim(),
      data: fillAmounts,
      createdAt: new Date().toISOString()
    };

    // This should be passed from parent to save to Firebase
    // For now, just close the modal
    setShowSaveTemplate(false);
    setTemplateName('');
    alert(`Template "${newTemplate.name}" saved! (Integration pending)`);
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'need': return '🛒';
      case 'want': return '🎉';
      case 'saving': return '💰';
      default: return '📦';
    }
  };

  const currentFilled = Object.values(fillAmounts).reduce((s, v) => s + parseFloat(v || 0), 0);
  const unallocated = monthlyIncome - currentFilled;
  const rolloverSummary = getRolloverSummary(rolloverData);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="fill-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fill-modal-header">
          <h2>💰 Fill Envelopes</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="fill-summary">
          <div className="fill-summary-item">
            <span>Income:</span>
            <span>₹{monthlyIncome.toLocaleString('en-IN')}</span>
          </div>
          <div className="fill-summary-item">
            <span>To Allocate:</span>
            <span className={unallocated < 0 ? 'negative' : 'positive'}>
              ₹{unallocated.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="auto-save-indicator">
            <span className="save-icon">✓</span>
            <span className="save-text">Auto-saved</span>
          </div>
        </div>

        {showRollover && rolloverSummary.totalAmount > 0 && (
          <div className="rollover-banner">
            <div className="rollover-info">
              <span className="rollover-icon">🔄</span>
              <div className="rollover-text">
                <strong>Rollover Available:</strong> ₹{rolloverSummary.totalAmount.toLocaleString('en-IN')} 
                from {rolloverSummary.envelopeCount} envelope(s)
              </div>
            </div>
            <button className="btn-apply-rollover" onClick={handleApplyRollover}>
              Apply Rollover
            </button>
          </div>
        )}

        <div className="fill-actions-bar">
          {unallocated > 0 && (
            <button className="btn-quick-fill" onClick={handleQuickFill}>
              ⚡ Quick Fill Remaining
            </button>
          )}
          <button className="btn-templates" onClick={() => setShowTemplates(!showTemplates)}>
            📋 Templates
          </button>
          <button className="btn-save-template" onClick={() => setShowSaveTemplate(!showSaveTemplate)}>
            💾 Save as Template
          </button>
        </div>

        {showTemplates && templates.length > 0 && (
          <div className="templates-list">
            <h4>Load Template:</h4>
            {templates.map(template => (
              <button
                key={template.id}
                className="template-item"
                onClick={() => handleLoadTemplate(template)}
              >
                <span className="template-name">{template.name}</span>
                <span className="template-arrow">→</span>
              </button>
            ))}
          </div>
        )}

        {showSaveTemplate && (
          <div className="save-template-form">
            <input
              type="text"
              className="template-name-input"
              placeholder="Template name (e.g., Regular Month, Tight Budget)..."
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              autoFocus
            />
            <button className="btn-save-template-confirm" onClick={handleSaveTemplate}>
              Save
            </button>
          </div>
        )}

        <div className="fill-list">
          {customEnvelopes.map(env => (
            <div key={env.name} className="fill-item">
              <div className="fill-item-name">
                <span className={`fill-icon ${env.category}`}>
                  {getCategoryIcon(env.category)}
                </span>
                <span>{env.name}</span>
                {rolloverData[env.name] > 0 && (
                  <span className="rollover-badge">
                    +₹{rolloverData[env.name].toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <input
                type="number"
                className="fill-input"
                value={fillAmounts[env.name] || ''}
                onChange={(e) => handleFillAmountChange(env.name, e.target.value)}
                placeholder="0"
              />
            </div>
          ))}
        </div>

        <div className="fill-modal-actions">
          <button className="btn-done" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default FillEnvelopesModal;
