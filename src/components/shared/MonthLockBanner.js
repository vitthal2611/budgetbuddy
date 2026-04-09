import React from 'react';
import './MonthLockBanner.css';
import { getMonthLockStatus } from '../../utils/budgetRules';

const fmt = (n) => Math.abs(n).toLocaleString('en-IN');

/**
 * Banner shown at top of app when month is locked or has issues
 * Provides clear feedback about budget status
 */
const MonthLockBanner = ({ readyToAssign, onFillEnvelopes }) => {
  const status = getMonthLockStatus(readyToAssign);

  // Don't show banner if everything is ready
  if (status.status === 'READY') {
    return null;
  }

  return (
    <div className={`month-lock-banner ${status.color}`}>
      <div className="mlb-content">
        <div className="mlb-icon">{status.icon}</div>
        <div className="mlb-info">
          <div className="mlb-title">
            {status.status === 'UNASSIGNED' && 'Assign Income to Unlock Spending'}
            {status.status === 'OVERASSIGNED' && 'Budget Over-Assigned'}
          </div>
          <div className="mlb-message">{status.message}</div>
        </div>
        {status.status === 'UNASSIGNED' && onFillEnvelopes && (
          <button className="mlb-action" onClick={onFillEnvelopes}>
            💰 Assign Now
          </button>
        )}
      </div>
    </div>
  );
};

export default MonthLockBanner;
