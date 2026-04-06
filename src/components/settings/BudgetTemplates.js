import React, { useState } from 'react';
import './BudgetTemplates.css';
import EmptyState from '../shared/EmptyState';

const BudgetTemplates = ({ templates, setTemplates, onLoadTemplate }) => {
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const handleSaveTemplate = (e) => {
    e.preventDefault();
    
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    // This will be called from parent with current budget data
    if (onLoadTemplate) {
      onLoadTemplate('save', templateName.trim());
    }

    setTemplateName('');
    setShowSaveForm(false);
  };

  const handleLoadTemplate = (template) => {
    if (!window.confirm(`Load template "${template.name}"?\n\nThis will replace your current month's budget allocations.`)) {
      return;
    }

    if (onLoadTemplate) {
      onLoadTemplate('load', template);
    }
  };

  const handleDeleteTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (!window.confirm(`Delete template "${template.name}"?\n\nThis cannot be undone.`)) {
      return;
    }

    setTemplates(templates.filter(t => t.id !== templateId));
  };

  return (
    <div className="budget-templates">
      <div className="templates-header">
        <div>
          <h2>📋 Budget Templates</h2>
          <p className="templates-subtitle">Save and reuse your budget allocations</p>
        </div>
        <button 
          className="btn-save-template"
          onClick={() => setShowSaveForm(!showSaveForm)}
        >
          {showSaveForm ? '✕ Cancel' : '+ Save Current Budget'}
        </button>
      </div>

      {showSaveForm && (
        <form className="save-template-form" onSubmit={handleSaveTemplate}>
          <input
            type="text"
            className="template-name-input"
            placeholder="Template name (e.g., Regular Month, Holiday Budget)..."
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn-save-template-submit">
            Save Template
          </button>
        </form>
      )}

      {templates.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No Templates Yet"
          message="Save your current budget as a template to quickly reuse it in future months. Perfect for regular monthly budgets!"
          actionLabel="Save Your First Template"
          onAction={() => setShowSaveForm(true)}
        />
      ) : (
        <div className="templates-list">
          {templates.map(template => (
            <div key={template.id} className="template-card">
              <div className="template-card-header">
                <div className="template-info">
                  <h3 className="template-name">{template.name}</h3>
                  <p className="template-meta">
                    {Object.keys(template.data).length} envelopes • 
                    Created {new Date(template.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="template-total">
                  ₹{Object.values(template.data).reduce((sum, val) => sum + parseFloat(val || 0), 0).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="template-preview">
                {Object.entries(template.data).slice(0, 3).map(([envelope, amount]) => (
                  <div key={envelope} className="template-preview-item">
                    <span className="preview-envelope">{envelope}</span>
                    <span className="preview-amount">₹{parseFloat(amount).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                {Object.keys(template.data).length > 3 && (
                  <div className="template-preview-more">
                    +{Object.keys(template.data).length - 3} more envelopes
                  </div>
                )}
              </div>

              <div className="template-actions">
                <button
                  className="btn-load-template"
                  onClick={() => handleLoadTemplate(template)}
                >
                  📥 Load Template
                </button>
                <button
                  className="btn-delete-template"
                  onClick={() => handleDeleteTemplate(template.id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="templates-info">
        <p>💡 <strong>Tip:</strong> Templates save your envelope allocations. Use them to quickly set up your budget each month without manually entering amounts.</p>
      </div>
    </div>
  );
};

export default BudgetTemplates;
