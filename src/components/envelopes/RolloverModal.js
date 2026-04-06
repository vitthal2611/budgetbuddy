import React from 'react';
import './RolloverModal.css';
import Modal from '../shared/Modal';

const RolloverModal = ({ isOpen, onClose, rollover, onApply, onSkip }) => {
  const envelopes = Object.keys(rollover);
  const total = envelopes.reduce((sum, env) => sum + rollover[env], 0);

  if (envelopes.length === 0) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💰 Rollover from Last Month" size="medium">
      <div className="rollover-content">
        <div className="rollover-message">
          <p>You have unused budget from last month! Would you like to add it to this month's envelopes?</p>
        </div>

        <div className="rollover-summary">
          <div className="rollover-total">
            <span className="rollover-total-label">Total Rollover:</span>
            <span className="rollover-total-amount">₹{total.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="rollover-list">
          <h4>Breakdown by Envelope:</h4>
          {envelopes.map(envelope => (
            <div key={envelope} className="rollover-item">
              <span className="rollover-envelope-name">{envelope}</span>
              <span className="rollover-envelope-amount">
                +₹{rollover[envelope].toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>

        <div className="rollover-actions">
          <button className="btn-rollover-skip" onClick={onSkip}>
            Skip (Start Fresh)
          </button>
          <button className="btn-rollover-apply" onClick={onApply}>
            ✓ Apply Rollover
          </button>
        </div>

        <div className="rollover-note">
          <p>💡 <strong>Tip:</strong> You can change rollover preferences in Settings → Preferences</p>
        </div>
      </div>
    </Modal>
  );
};

export default RolloverModal;
