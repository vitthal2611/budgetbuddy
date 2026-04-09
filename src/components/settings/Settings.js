import React, { useState } from 'react';
import './Settings.css';
import PaymentMethodManagement from './PaymentMethodManagement';
import RecurringTransactions from './RecurringTransactions';
import BudgetTemplates from './BudgetTemplates';
import BudgetPreferences from './BudgetPreferences';

const Settings = ({ budgets, setBudgets, transactions }) => {
  const [activeSection, setActiveSection] = useState('payment-methods');
  const [recurring, setRecurring] = useState([]);
  const [templates, setTemplates] = useState([]);

  const handleTemplateAction = (action, data) => {
    const today = new Date();
    const budgetKey = `${today.getFullYear()}-${today.getMonth()}`;

    if (action === 'save') {
      const currentBudget = budgets[budgetKey] || {};
      if (Object.keys(currentBudget).length === 0) {
        alert('No budget to save. Fill your envelopes first!');
        return;
      }
      const newTemplate = {
        id: `template-${Date.now()}`,
        name: data,
        data: currentBudget,
        createdAt: new Date().toISOString()
      };
      setTemplates(prev => [...prev, newTemplate]);
      alert(`✅ Template "${data}" saved!`);
    } else if (action === 'load') {
      setBudgets({ ...budgets, [budgetKey]: data.data });
      alert(`✅ Template "${data.name}" loaded!`);
    }
  };

  const sections = [
    { id: 'payment-methods', label: 'Payment Methods', icon: '💳' },
    { id: 'recurring', label: 'Recurring', icon: '🔄' },
    { id: 'templates', label: 'Templates', icon: '📋' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' }
  ];

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>⚙️ Settings</h1>
        <p className="settings-subtitle">Manage your budget configuration</p>
      </div>

      <div className="settings-nav">
        {sections.map(section => (
          <button
            key={section.id}
            className={`settings-nav-btn ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            <span className="settings-nav-icon">{section.icon}</span>
            <span className="settings-nav-label">{section.label}</span>
          </button>
        ))}
      </div>

      <div className="settings-content">
        {activeSection === 'payment-methods' && (
          <PaymentMethodManagement />
        )}
        {activeSection === 'recurring' && (
          <RecurringTransactions recurring={recurring} setRecurring={setRecurring} />
        )}
        {activeSection === 'templates' && (
          <BudgetTemplates templates={templates} setTemplates={setTemplates} onLoadTemplate={handleTemplateAction} />
        )}
        {activeSection === 'preferences' && (
          <BudgetPreferences />
        )}
      </div>
    </div>
  );
};

export default Settings;
