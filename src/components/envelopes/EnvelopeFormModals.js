import React from 'react';

const fmt = (n) => Math.abs(n).toLocaleString('en-IN');

const SEG_CATEGORIES = [['need', '🛒 Need'], ['want', '🎉 Want'], ['saving', '💰 Saving']];
const SEG_TYPES      = [['regular', '📦 Regular'], ['annual', '📅 Annual'], ['goal', '🎯 Goal']];

/* ── Add Envelope Modal ─────────────────────────────────────── */
export const AddEnvelopeModal = ({ newEnv, setNewEnv, onSubmit, onClose }) => (
  <div className="ev-modal-overlay" onClick={onClose}>
    <div className="ev-modal" onClick={e => e.stopPropagation()}>
      <div className="ev-modal-header">
        <h2>New Envelope</h2>
        <button className="ev-modal-close" onClick={onClose}>×</button>
      </div>
      <form onSubmit={onSubmit} className="add-env-form">
        <div className="form-field">
          <label>Name</label>
          <input className="ev-input" type="text" value={newEnv.name}
            onChange={e => setNewEnv({ ...newEnv, name: e.target.value })}
            placeholder="e.g. Groceries" autoFocus required />
        </div>

        <div className="form-field">
          <label>Category</label>
          <div className="ev-seg-control">
            {SEG_CATEGORIES.map(([v, l]) => (
              <button key={v} type="button"
                className={`ev-seg-btn ${newEnv.category === v ? 'active' : ''}`}
                onClick={() => setNewEnv({ ...newEnv, category: v })}>{l}</button>
            ))}
          </div>
        </div>

        <div className="form-field">
          <label>Type</label>
          <div className="ev-seg-control">
            {SEG_TYPES.map(([v, l]) => (
              <button key={v} type="button"
                className={`ev-seg-btn ${newEnv.envelopeType === v ? 'active' : ''}`}
                onClick={() => setNewEnv({ ...newEnv, envelopeType: v })}>{l}</button>
            ))}
          </div>
          <div className="ev-type-hint">
            {newEnv.envelopeType === 'annual' && 'Set a yearly budget — auto-divided into monthly fills'}
            {newEnv.envelopeType === 'goal'   && 'Save toward a one-time goal with an optional due date'}
            {newEnv.envelopeType === 'regular' && 'Standard monthly envelope'}
          </div>
        </div>

        {newEnv.envelopeType === 'annual' && (
          <div className="form-field">
            <label>Annual Amount (₹)</label>
            <input className="ev-input" type="number" min="0" value={newEnv.annualAmount}
              onChange={e => setNewEnv({ ...newEnv, annualAmount: e.target.value })}
              placeholder="e.g. 12000" />
            {newEnv.annualAmount && (
              <div className="ev-type-hint">Monthly fill: ₹{fmt(Math.ceil(parseFloat(newEnv.annualAmount) / 12))}</div>
            )}
          </div>
        )}

        {newEnv.envelopeType === 'goal' && (
          <>
            <div className="form-field">
              <label>Goal Amount (₹)</label>
              <input className="ev-input" type="number" min="0" value={newEnv.goalAmount}
                onChange={e => setNewEnv({ ...newEnv, goalAmount: e.target.value })}
                placeholder="e.g. 50000" />
            </div>
            <div className="form-field">
              <label>Due Date (optional)</label>
              <input className="ev-input" type="month" value={newEnv.dueDate}
                onChange={e => setNewEnv({ ...newEnv, dueDate: e.target.value })} />
            </div>
          </>
        )}

        <div className="ev-modal-footer">
          <button type="button" className="ev-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="ev-btn-primary">Add Envelope</button>
        </div>
      </form>
    </div>
  </div>
);

/* ── Edit Envelope Modal ─────────────────────────────────────── */
export const EditEnvelopeModal = ({ editForm, setEditForm, onSubmit, onClose }) => (
  <div className="ev-modal-overlay" onClick={onClose}>
    <div className="ev-modal" onClick={e => e.stopPropagation()}>
      <div className="ev-modal-header">
        <h2>Edit Envelope</h2>
        <button className="ev-modal-close" onClick={onClose}>×</button>
      </div>
      <form onSubmit={onSubmit} className="add-env-form">
        <div className="form-field">
          <label>Name</label>
          <input className="ev-input" type="text" value={editForm.name}
            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
            autoFocus required />
        </div>

        <div className="form-field">
          <label>Category</label>
          <div className="ev-seg-control">
            {SEG_CATEGORIES.map(([v, l]) => (
              <button key={v} type="button"
                className={`ev-seg-btn ${editForm.category === v ? 'active' : ''}`}
                onClick={() => setEditForm({ ...editForm, category: v })}>{l}</button>
            ))}
          </div>
        </div>

        <div className="form-field">
          <label>Type</label>
          <div className="ev-seg-control">
            {SEG_TYPES.map(([v, l]) => (
              <button key={v} type="button"
                className={`ev-seg-btn ${editForm.envelopeType === v ? 'active' : ''}`}
                onClick={() => setEditForm({ ...editForm, envelopeType: v })}>{l}</button>
            ))}
          </div>
        </div>

        {editForm.envelopeType === 'annual' && (
          <div className="form-field">
            <label>Annual Amount (₹)</label>
            <input className="ev-input" type="number" min="0" value={editForm.annualAmount}
              onChange={e => setEditForm({ ...editForm, annualAmount: e.target.value })}
              placeholder="e.g. 12000" />
            {editForm.annualAmount && (
              <div className="ev-type-hint">Monthly fill: ₹{fmt(Math.ceil(parseFloat(editForm.annualAmount) / 12))}</div>
            )}
          </div>
        )}

        {editForm.envelopeType === 'goal' && (
          <>
            <div className="form-field">
              <label>Goal Amount (₹)</label>
              <input className="ev-input" type="number" min="0" value={editForm.goalAmount}
                onChange={e => setEditForm({ ...editForm, goalAmount: e.target.value })}
                placeholder="e.g. 50000" />
            </div>
            <div className="form-field">
              <label>Due Date (optional)</label>
              <input className="ev-input" type="month" value={editForm.dueDate}
                onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })} />
            </div>
          </>
        )}

        <div className="ev-modal-footer">
          <button type="button" className="ev-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="ev-btn-primary">Save</button>
        </div>
      </form>
    </div>
  </div>
);

/* ── Delete Confirm Modal ────────────────────────────────────── */
export const DeleteEnvelopeModal = ({ name, onConfirm, onClose }) => (
  <div className="ev-modal-overlay" onClick={onClose}>
    <div className="ev-modal ev-modal-sm" onClick={e => e.stopPropagation()}>
      <div className="ev-modal-header">
        <h2>Delete Envelope</h2>
        <button className="ev-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="ev-delete-body">
        <div className="ev-delete-icon">🗑️</div>
        <p className="ev-delete-msg">
          Delete <strong>"{name}"</strong>? All budget allocations for this envelope will be removed.
        </p>
        <p className="ev-delete-sub">This cannot be undone.</p>
      </div>
      <div className="ev-modal-footer ev-delete-footer">
        <button className="ev-btn-ghost" onClick={onClose}>Cancel</button>
        <button className="ev-btn-danger" onClick={onConfirm}>Delete</button>
      </div>
    </div>
  </div>
);
