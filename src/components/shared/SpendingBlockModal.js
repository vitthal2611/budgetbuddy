import React, { useState } from 'react';
import './SpendingBlockModal.css';

const fmt = (n) => Math.abs(n).toLocaleString('en-IN');

/**
 * Modal shown when spending is blocked due to budget rules
 * Provides options to:
 * 1. Assign income first (if unassigned)
 * 2. Transfer from another envelope (if insufficient funds)
 * 3. Cancel the transaction
 */
const SpendingBlockModal = ({
  reason,
  message,
  shortfall,
  targetEnvelope,
  spendAmount,
  transferableEnvelopes,
  onTransfer,
  onAssignIncome,
  onCancel
}) => {
  const [selectedSource, setSelectedSource] = useState('');
  const [transferAmount, setTransferAmount] = useState(shortfall || 0);

  const handleTransfer = () => {
    if (!selectedSource || transferAmount <= 0) return;
    onTransfer(selectedSource, targetEnvelope, transferAmount);
  };

  // Unassigned Income - Must assign first
  if (reason === 'UNASSIGNED_INCOME') {
    return (
      <div className="spending-block-overlay" onClick={onCancel}>
        <div className="spending-block-modal" onClick={e => e.stopPropagation()}>
          <div className="sbm-icon warning">⚠️</div>
          <h2 className="sbm-title">Assign Income First</h2>
          <p className="sbm-message">{message}</p>
          <div className="sbm-explanation">
            You must assign all income to envelopes before you can spend. This ensures every rupee has a job.
          </div>
          <div className="sbm-actions">
            <button className="sbm-btn secondary" onClick={onCancel}>
              Cancel
            </button>
            <button className="sbm-btn primary" onClick={onAssignIncome}>
              💰 Assign Income Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No Balance - Envelope is empty
  if (reason === 'NO_BALANCE') {
    return (
      <div className="spending-block-overlay" onClick={onCancel}>
        <div className="spending-block-modal" onClick={e => e.stopPropagation()}>
          <div className="sbm-icon danger">🚫</div>
          <h2 className="sbm-title">No Funds Available</h2>
          <p className="sbm-message">
            <strong>{targetEnvelope}</strong> has no funds assigned.
          </p>
          <div className="sbm-explanation">
            Assign money to this envelope first, or transfer from another envelope.
          </div>
          <div className="sbm-actions">
            <button className="sbm-btn secondary" onClick={onCancel}>
              Cancel
            </button>
            <button className="sbm-btn primary" onClick={onAssignIncome}>
              💰 Fill Envelopes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Insufficient Funds - Need to transfer
  if (reason === 'INSUFFICIENT_FUNDS') {
    const sourceEnvelope = transferableEnvelopes.find(e => e.name === selectedSource);
    const maxTransfer = sourceEnvelope?.remaining || 0;
    const suggestedAmount = Math.min(shortfall, maxTransfer);

    return (
      <div className="spending-block-overlay" onClick={onCancel}>
        <div className="spending-block-modal large" onClick={e => e.stopPropagation()}>
          <div className="sbm-icon danger">💸</div>
          <h2 className="sbm-title">Insufficient Funds</h2>
          <p className="sbm-message">{message}</p>
          
          <div className="sbm-spend-details">
            <div className="sbm-detail-row">
              <span>Trying to spend:</span>
              <strong>₹{fmt(spendAmount)}</strong>
            </div>
            <div className="sbm-detail-row">
              <span>Available in {targetEnvelope}:</span>
              <strong>₹{fmt(spendAmount - shortfall)}</strong>
            </div>
            <div className="sbm-detail-row shortage">
              <span>Shortage:</span>
              <strong className="shortage-amount">₹{fmt(shortfall)}</strong>
            </div>
          </div>

          {transferableEnvelopes.length > 0 ? (
            <>
              <div className="sbm-section-title">Transfer from another envelope:</div>
              <div className="sbm-transfer-list">
                {transferableEnvelopes.map(env => (
                  <div
                    key={env.name}
                    className={`sbm-transfer-option ${selectedSource === env.name ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedSource(env.name);
                      setTransferAmount(Math.min(shortfall, env.remaining));
                    }}
                  >
                    <div className="sbm-transfer-info">
                      <span className="sbm-transfer-name">{env.name}</span>
                      <span className="sbm-transfer-balance">₹{fmt(env.remaining)} available</span>
                    </div>
                    {selectedSource === env.name && (
                      <span className="sbm-transfer-check">✓</span>
                    )}
                  </div>
                ))}
              </div>

              {selectedSource && (
                <div className="sbm-transfer-amount">
                  <label>Transfer Amount:</label>
                  <div className="sbm-amount-input-wrap">
                    <span className="sbm-currency">₹</span>
                    <input
                      type="number"
                      className="sbm-amount-input"
                      value={transferAmount}
                      onChange={e => setTransferAmount(parseFloat(e.target.value) || 0)}
                      min="1"
                      max={maxTransfer}
                    />
                  </div>
                  <button
                    className="sbm-quick-btn"
                    onClick={() => setTransferAmount(suggestedAmount)}
                  >
                    Use ₹{fmt(suggestedAmount)}
                  </button>
                </div>
              )}

              <div className="sbm-actions">
                <button className="sbm-btn secondary" onClick={onCancel}>
                  Cancel
                </button>
                <button
                  className="sbm-btn primary"
                  onClick={handleTransfer}
                  disabled={!selectedSource || transferAmount <= 0 || transferAmount > maxTransfer}
                >
                  ⇄ Transfer & Continue
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="sbm-explanation">
                No other envelopes have sufficient funds. Fill envelopes first.
              </div>
              <div className="sbm-actions">
                <button className="sbm-btn secondary" onClick={onCancel}>
                  Cancel
                </button>
                <button className="sbm-btn primary" onClick={onAssignIncome}>
                  💰 Fill Envelopes
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default SpendingBlockModal;
