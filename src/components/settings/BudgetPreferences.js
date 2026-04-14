import React from 'react';
import './BudgetPreferences.css';
import { usePreferences } from '../../contexts/PreferencesContext';

const BudgetPreferences = () => {
  const { preferences, updatePreference, updateNotificationPreference } = usePreferences();

  return (
    <div className="budget-preferences">
      <div className="preferences-header">
        <h2>⚙️ Budget Preferences</h2>
        <p className="preferences-subtitle">Customize how your budget works</p>
      </div>

      <div className="preference-section">
        <h3 className="section-title">Budget Behavior</h3>
        
        <div className="preference-item">
          <div className="preference-info">
            <div className="preference-label">Rollover Mode</div>
            <div className="preference-description">
              How unused budget from previous month is handled
            </div>
          </div>
          <select
            className="preference-select"
            value={preferences.rolloverMode}
            onChange={(e) => updatePreference('rolloverMode', e.target.value)}
          >
            <option value="automatic">Automatic - Add to next month</option>
            <option value="manual">Manual - Ask me each month</option>
            <option value="none">None - Start fresh each month</option>
          </select>
        </div>

        <div className="preference-item">
          <div className="preference-info">
            <div className="preference-label">Budget Start Day</div>
            <div className="preference-description">
              Day of month when your budget cycle starts
            </div>
          </div>
          <input
            type="number"
            className="preference-input"
            min="1"
            max="31"
            value={preferences.budgetStartDay}
            onChange={(e) => updatePreference('budgetStartDay', parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="preference-section">
        <h3 className="section-title">Notifications</h3>
        
        <div className="preference-item">
          <div className="preference-info">
            <div className="preference-label">Low Balance Warnings</div>
            <div className="preference-description">
              Alert when envelope has less than 20% remaining
            </div>
          </div>
          <label className="preference-toggle">
            <input
              type="checkbox"
              checked={preferences.notifications.lowBalance}
              onChange={(e) => updateNotificationPreference('lowBalance', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="preference-item">
          <div className="preference-info">
            <div className="preference-label">Over Budget Warnings</div>
            <div className="preference-description">
              Alert when expense will exceed envelope budget
            </div>
          </div>
          <label className="preference-toggle">
            <input
              type="checkbox"
              checked={preferences.notifications.overBudget}
              onChange={(e) => updateNotificationPreference('overBudget', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="preference-item">
          <div className="preference-info">
            <div className="preference-label">Monthly Reminders</div>
            <div className="preference-description">
              Remind to allocate budget at start of month
            </div>
          </div>
          <label className="preference-toggle">
            <input
              type="checkbox"
              checked={preferences.notifications.monthlyReminder}
              onChange={(e) => updateNotificationPreference('monthlyReminder', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div className="preference-section">
        <h3 className="section-title">Display</h3>
        
        <div className="preference-item">
          <div className="preference-info">
            <div className="preference-label">Default View</div>
            <div className="preference-description">
              Screen to show when app opens
            </div>
          </div>
          <select
            className="preference-select"
            value={preferences.defaultView}
            onChange={(e) => updatePreference('defaultView', e.target.value)}
          >
            <option value="envelopes">Envelopes</option>
            <option value="dashboard">Dashboard</option>
            <option value="transactions">Transactions</option>
          </select>
        </div>

        <div className="preference-item">
          <div className="preference-info">
            <div className="preference-label">Currency</div>
            <div className="preference-description">
              Display currency (currently INR only)
            </div>
          </div>
          <select
            className="preference-select"
            value={preferences.currency}
            onChange={(e) => updatePreference('currency', e.target.value)}
            disabled
          >
            <option value="INR">₹ Indian Rupee (INR)</option>
          </select>
        </div>
      </div>

      <div className="preferences-info">
        <p>💡 <strong>Tip:</strong> Changes are saved automatically and synced across all your devices.</p>
      </div>
    </div>
  );
};

export default BudgetPreferences;
