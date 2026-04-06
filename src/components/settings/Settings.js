import React, { useState } from 'react';
import './Settings.css';
import EnvelopeManagement from './EnvelopeManagement';
import PaymentMethodManagement from './PaymentMethodManagement';
import RecurringTransactions from './RecurringTransactions';
import BudgetTemplates from './BudgetTemplates';
import BudgetPreferences from './BudgetPreferences';

const Settings = ({ budgets, setBudgets, transactions, recurring, setRecurring, templates, setTemplates, onLoadTemplate }) => {
  const [activeSection, setActiveSection] = useState('envelopes');

  const sections = [
    { id: 'envelopes', label: 'Envelopes', icon: '📦' },
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
        {activeSection === 'envelopes' && (
          <EnvelopeManagement budgets={budgets} setBudgets={setBudgets} transactions={transactions} />
        )}
        {activeSection === 'payment-methods' && (
          <PaymentMethodManagement />
        )}
        {activeSection === 'recurring' && (
          <RecurringTransactions recurring={recurring} setRecurring={setRecurring} />
        )}
        {activeSection === 'templates' && (
          <BudgetTemplates templates={templates} setTemplates={setTemplates} onLoadTemplate={onLoadTemplate} />
        )}
        {activeSection === 'preferences' && (
          <BudgetPreferences />
        )}
      </div>
    </div>
  );
};

export default Settings;
