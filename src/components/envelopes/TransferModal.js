import React from 'react';

const fmt = (n) => Math.abs(n).toLocaleString('en-IN');

const TransferModal = ({
  transferData, setTransferData,
  transferError, setTransferError,
  envelopeFills, monthlySpending,
  customEnvelopes,
  onSubmit, onClose,
}) => (
  <div className="ev-modal-overlay" onClick={onClose}>
    <div className="ev-modal" onClick={e => e.stopPropagation()}>
      <div className="ev-modal-header">
        <h2>Transfer Between Envelopes</h2>
        <button className="ev-modal-close" onClick={onClose}>×</button>
      </div>
      <form onSubmit={onSubmit} className="add-env-form">
        <div className="form-field">
          <label>From Envelope</label>
          <select
            className="ev-input"
            value={transferData.from}
            onChange={e => { setTransferData({ ...transferData, from: e.target.value }); setTransferError(''); }}
            required
          >
            <option value="">Select envelope</option>
            {customEnvelopes.map(e => {
              const left = (envelopeFills[e.name] || 0) - (monthlySpending[e.name] || 0);
              return <option key={e.name} value={e.name}>{e.name} (₹{fmt(left)} left)</option>;
            })}
          </select>
        </div>

        <div className="form-field">
          <label>To Envelope</label>
          <select
            className="ev-input"
            value={transferData.to}
            onChange={e => setTransferData({ ...transferData, to: e.target.value })}
            required
          >
            <option value="">Select envelope</option>
            {customEnvelopes.filter(e => e.name !== transferData.from).map(e => {
              const left = (envelopeFills[e.name] || 0) - (monthlySpending[e.name] || 0);
              return <option key={e.name} value={e.name}>{e.name} (₹{fmt(left)} left)</option>;
            })}
          </select>
        </div>

        <div className="form-field">
          <label>Amount (₹)</label>
          <input
            className="ev-input"
            type="number" inputMode="numeric" min="0.01" step="0.01"
            value={transferData.amount}
            onChange={e => { setTransferData({ ...transferData, amount: e.target.value }); setTransferError(''); }}
            placeholder="0"
            required
          />
          {transferError && <div className="ev-transfer-error">{transferError}</div>}
        </div>

        <div className="ev-modal-footer">
          <button type="button" className="ev-btn-ghost" onClick={() => { onClose(); setTransferError(''); }}>Cancel</button>
          <button type="submit" className="ev-btn-primary">Transfer</button>
        </div>
      </form>
    </div>
  </div>
);

export default TransferModal;
