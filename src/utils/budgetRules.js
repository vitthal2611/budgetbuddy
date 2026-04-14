/**
 * YNAB-Style Zero-Based Budgeting Rules
 * Strict enforcement of budget discipline
 */

/**
 * Calculate Ready to Assign amount
 * @param {number} monthlyIncome - Total income for the month
 * @param {number} totalFilled - Total amount assigned to envelopes
 * @returns {number} Amount remaining to be assigned
 */
export const calculateReadyToAssign = (monthlyIncome, totalFilled) => {
  return monthlyIncome - totalFilled;
};

/**
 * Check if month is locked (has unassigned income)
 * @param {number} readyToAssign - Amount not yet assigned
 * @returns {boolean} True if month is locked
 */
export const isMonthLocked = (readyToAssign) => {
  // Month locking removed - always unlocked
  return false;
};

/**
 * Check if spending is allowed
 * @param {number} readyToAssign - Unassigned income
 * @param {number} envelopeBalance - Balance in target envelope
 * @param {number} spendAmount - Amount to spend
 * @returns {object} { allowed: boolean, reason: string }
 */
export const canSpend = (readyToAssign, envelopeBalance, spendAmount) => {
  // All spending restrictions removed - always allow
  return { allowed: true };
};

/**
 * Get envelopes available for transfer (positive balance)
 * @param {Array} envelopes - All envelopes with their data
 * @param {string} excludeEnvelope - Envelope to exclude (target envelope)
 * @returns {Array} Envelopes with positive balance
 */
export const getTransferableEnvelopes = (envelopes, excludeEnvelope) => {
  return envelopes
    .filter(env => env.name !== excludeEnvelope && env.remaining > 0)
    .sort((a, b) => b.remaining - a.remaining); // Sort by balance descending
};

/**
 * Validate transfer operation
 * @param {number} sourceBalance - Source envelope balance
 * @param {number} transferAmount - Amount to transfer
 * @returns {object} { valid: boolean, reason: string }
 */
export const canTransfer = (sourceBalance, transferAmount) => {
  if (sourceBalance <= 0) {
    return {
      valid: false,
      reason: 'Source envelope has no funds'
    };
  }

  if (transferAmount > sourceBalance) {
    return {
      valid: false,
      reason: `Only ₹${Math.abs(sourceBalance).toLocaleString('en-IN')} available to transfer`
    };
  }

  if (transferAmount <= 0) {
    return {
      valid: false,
      reason: 'Transfer amount must be greater than 0'
    };
  }

  return { valid: true };
};

/**
 * Get month lock status with details
 * @param {number} readyToAssign - Unassigned amount
 * @returns {object} Lock status with message
 */
export const getMonthLockStatus = (readyToAssign) => {
  if (readyToAssign > 0) {
    return {
      locked: true,
      status: 'UNASSIGNED',
      color: 'warning',
      message: `Assign ₹${Math.abs(readyToAssign).toLocaleString('en-IN')} to unlock spending`,
      icon: '⚠️'
    };
  }

  if (readyToAssign < 0) {
    return {
      locked: false,
      status: 'OVERASSIGNED',
      color: 'danger',
      message: `Over-assigned by ₹${Math.abs(readyToAssign).toLocaleString('en-IN')}`,
      icon: '❌'
    };
  }

  return {
    locked: false,
    status: 'READY',
    color: 'success',
    message: 'All income assigned - Ready to spend',
    icon: '✅'
  };
};

/**
 * Calculate suggested transfer amount to cover shortfall
 * @param {number} shortfall - Amount needed
 * @param {number} sourceBalance - Available in source envelope
 * @returns {number} Suggested transfer amount
 */
export const suggestTransferAmount = (shortfall, sourceBalance) => {
  return Math.min(shortfall, sourceBalance);
};
