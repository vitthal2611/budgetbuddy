import React, { useState } from 'react';
import './EnvelopeManagement.css';
import { useData } from '../../contexts/DataContext';

const fmt = (n) => Math.abs(n).toLocaleString('en-IN');

const CAT_META = {
  need:   { icon: '🛒', label: 'Needs',           cls: 'cat-need',   color: '#10b981', bg: '#ecfdf5', text: '#065f46' },
  want:   { icon: '🎉', label: 'Wants',           cls: 'cat-want',   color: '#f59e0b', bg: '#fffbeb', text: '#92400e' },
  saving: { icon: '💰', label: 'Savings & Goals', cls: 'cat-saving', color: '#6366f1', bg: '#eef2ff', text: '#3730a3' },
};

const TYPE_META = {
  regular: { icon: '📦', label: 'Regular' },
  annual:  { icon: '📅', label: 'Annual'  },
  goal:    { icon: '🎯', label: 'Goal'    },
};

const SEG_CATS  = [['need','🛒 Need'], ['want','🎉 Want'], ['saving','💰 Saving']];
const SEG_TYPES = [['regular','📦 Regular'], ['annual','📅 Annual'], ['goal','🎯 Goal']];
const EMPTY_FORM = { name: '', category: 'need', envelopeType: 'regular', annualAmount: '', goalAmount: '', dueDate: '' };

/* ── Delete confirm modal ── */
const DeleteModal = ({ name, hasTransactions, onConfirm, onClose }) => (
  <div className="em-delete-overlay" onClick={onClose}>
    <div className="em-delete-modal" onClick={e => e.stopPropagation()}>
      <div className="em-delete-icon">🗑️</div>
      <div className="em-delete-title">Delete "{name}"?</div>
      <p className="em-delete-msg">
        All budget allocations will be removed.
        {hasTransactions && ' Transactions will remain but won\'t be linked to this envelope.'}
      </p>
      <p className="em-delete-warn">This cannot be undone.</p>
      <div className="em-delete-actions">
        <button className="em-delete-cancel" onClick={onClose}>Cancel</button>
        <button className="em-delete-confirm" onClick={onConfirm}>Delete</button>
      </div>
    </div>
  </div>
);

/* ── Envelope form (used in both panel and mobile inline) ── */
const EnvelopeForm = ({ form, setForm, onSubmit, onCancel, isEdit }) => (
  <div className="em-form-body">
    <div className="em-field">
      <label>Name</label>
      <input
        className="em-input"
        type="text"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        placeholder="e.g. Groceries"
        autoFocus
      />
    </div>

    <div className="em-field">
      <label>Category</label>
      <div className="em-seg">
        {SEG_CATS.map(([v, l]) => (
          <button key={v} type="button"
            className={`em-seg-btn ${form.category === v ? 'active' : ''}`}
            onClick={() => setForm(f => ({ ...f, category: v }))}>{l}
          </button>
        ))}
      </div>
    </div>

    <div className="em-field">
      <label>Type</label>
      <div className="em-seg">
        {SEG_TYPES.map(([v, l]) => (
          <button key={v} type="button"
            className={`em-seg-btn ${form.envelopeType === v ? 'active' : ''}`}
            onClick={() => setForm(f => ({ ...f, envelopeType: v }))}>{l}
          </button>
        ))}
      </div>
      <div className="em-type-hint">
        {form.envelopeType === 'annual'  && 'Yearly budget split into monthly fills automatically'}
        {form.envelopeType === 'goal'    && 'Save toward a one-time target with an optional due date'}
        {form.envelopeType === 'regular' && 'Standard monthly envelope'}
      </div>
    </div>

    {form.envelopeType === 'annual' && (
      <div className="em-field">
        <label>Annual Amount (₹)</label>
        <input className="em-input" type="number" min="0"
          value={form.annualAmount}
          onChange={e => setForm(f => ({ ...f, annualAmount: e.target.value }))}
          placeholder="e.g. 12000" />
        {form.annualAmount && (
          <div className="em-type-hint">Monthly fill: ₹{fmt(Math.ceil(parseFloat(form.annualAmount) / 12))}</div>
        )}
      </div>
    )}

    {form.envelopeType === 'goal' && (
      <>
        <div className="em-field">
          <label>Goal Amount (₹)</label>
          <input className="em-input" type="number" min="0"
            value={form.goalAmount}
            onChange={e => setForm(f => ({ ...f, goalAmount: e.target.value }))}
            placeholder="e.g. 50000" />
        </div>
        <div className="em-field">
          <label>Due Date (optional)</label>
          <input className="em-input" type="month"
            value={form.dueDate}
            onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
        </div>
      </>
    )}

    <div className="em-form-actions">
      <button type="button" className="em-btn-ghost" onClick={onCancel}>Cancel</button>
      <button type="button" className="em-btn-primary" onClick={onSubmit}>
        {isEdit ? 'Save Changes' : 'Add Envelope'}
      </button>
    </div>
  </div>
);

/* ── Main component ── */
const EnvelopeManagement = ({ budgets, setBudgets, transactions }) => {
  const { envelopes, addEnvelope, removeEnvelope, updateEnvelope } = useData();

  // panel mode: null | 'add' | 'edit'
  const [panelMode,    setPanelMode]    = useState(null);
  const [addForm,      setAddForm]      = useState(EMPTY_FORM);
  const [editTarget,   setEditTarget]   = useState(null);
  const [editForm,     setEditForm]     = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedEnv,  setSelectedEnv]  = useState(null); // for desktop highlight

  /* ── Add ── */
  const openAdd = () => {
    setAddForm(EMPTY_FORM);
    setPanelMode('add');
    setSelectedEnv(null);
    setEditTarget(null);
  };

  const handleAdd = () => {
    if (!addForm.name.trim()) return;
    try {
      addEnvelope(addForm.name.trim(), addForm.category, {
        envelopeType: addForm.envelopeType,
        annualAmount: addForm.annualAmount,
        goalAmount:   addForm.goalAmount,
        dueDate:      addForm.dueDate,
      });
      setAddForm(EMPTY_FORM);
      setPanelMode(null);
    } catch (err) { alert(err.message); }
  };

  /* ── Edit ── */
  const openEdit = (env) => {
    setEditTarget(env.name);
    setEditForm({
      name:         env.name,
      category:     env.category,
      envelopeType: env.envelopeType || 'regular',
      annualAmount: env.annualAmount || '',
      goalAmount:   env.goalAmount   || '',
      dueDate:      env.dueDate      || '',
    });
    setPanelMode('edit');
    setSelectedEnv(env.name);
  };

  const handleEditSave = () => {
    try {
      const { originalName, newName } = updateEnvelope(editTarget, {
        name:         editForm.name,
        category:     editForm.category,
        envelopeType: editForm.envelopeType,
        annualAmount: editForm.annualAmount ? parseFloat(editForm.annualAmount) : undefined,
        goalAmount:   editForm.goalAmount   ? parseFloat(editForm.goalAmount)   : undefined,
        dueDate:      editForm.dueDate || undefined,
      });
      if (originalName !== newName) {
        const updated = { ...budgets };
        Object.keys(updated).forEach(k => {
          if (updated[k][originalName] !== undefined) {
            updated[k][newName] = updated[k][originalName];
            delete updated[k][originalName];
          }
        });
        setBudgets(updated);
      }
      setPanelMode(null);
      setEditTarget(null);
      setSelectedEnv(null);
    } catch (err) { alert(err.message); }
  };

  /* ── Delete ── */
  const confirmDelete = () => {
    try {
      removeEnvelope(deleteTarget);
      const cleaned = { ...budgets };
      Object.keys(cleaned).forEach(k => { delete cleaned[k][deleteTarget]; });
      setBudgets(cleaned);
    } catch (err) { alert(err.message); }
    setDeleteTarget(null);
    if (selectedEnv === deleteTarget) { setSelectedEnv(null); setPanelMode(null); }
  };

  const closePanel = () => { setPanelMode(null); setEditTarget(null); setSelectedEnv(null); };

  const grouped = {
    need:   envelopes.filter(e => e.category === 'need'),
    want:   envelopes.filter(e => e.category === 'want'),
    saving: envelopes.filter(e => e.category === 'saving'),
  };

  /* ── Envelope list (shared between mobile and desktop) ── */
  const renderList = () => (
    <div className="em-list-area">
      {/* Toolbar */}
      <div className="em-toolbar">
        <div className="em-toolbar-left">
          <span className="em-toolbar-title">Envelopes</span>
          <span className="em-toolbar-count">{envelopes.length}</span>
        </div>
        <button className="em-add-btn" onClick={openAdd}>+ Add Envelope</button>
      </div>

      {/* Empty */}
      {envelopes.length === 0 && (
        <div className="em-empty">
          <div className="em-empty-icon">📦</div>
          <div className="em-empty-title">No envelopes yet</div>
          <div className="em-empty-sub">Create envelopes to start budgeting</div>
        </div>
      )}

      {/* Groups */}
      <div className="em-groups-scroll">
        {['need', 'want', 'saving'].map(cat => {
          const list = grouped[cat];
          if (list.length === 0) return null;
          const meta = CAT_META[cat];
          return (
            <div key={cat} className="em-group">
              {/* Group header */}
              <div className="em-group-header" style={{ borderLeftColor: meta.color }}>
                <span className="em-group-icon">{meta.icon}</span>
                <span className="em-group-label" style={{ color: meta.text }}>{meta.label}</span>
                <span className="em-group-count">{list.length}</span>
              </div>

              {/* Rows */}
              {list.map(env => {
                const typeMeta = TYPE_META[env.envelopeType || 'regular'];
                const isSelected = selectedEnv === env.name;
                return (
                  <div
                    key={env.name}
                    className={`em-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => openEdit(env)}
                  >
                    <div className="em-row-accent" style={{ background: meta.color }} />
                    <div className="em-row-icon-wrap">
                      <span className="em-row-type-icon">{typeMeta.icon}</span>
                    </div>
                    <div className="em-row-info">
                      <div className="em-row-name">{env.name}</div>
                      <div className="em-row-meta">
                        {env.envelopeType !== 'regular' && (
                          <span className={`em-type-badge ${env.envelopeType}`}>{typeMeta.label}</span>
                        )}
                        {env.envelopeType === 'annual' && env.annualAmount && (
                          <span className="em-row-detail">₹{fmt(env.annualAmount)}/yr</span>
                        )}
                        {env.envelopeType === 'goal' && env.goalAmount && (
                          <span className="em-row-detail">Goal ₹{fmt(env.goalAmount)}</span>
                        )}
                      </div>
                    </div>
                    <div className="em-row-actions" onClick={e => e.stopPropagation()}>
                      <button className="em-action-btn danger" title="Delete"
                        onClick={() => setDeleteTarget(env.name)}>🗑️</button>
                    </div>
                  </div>
                );
              })}

              {/* Add to this category shortcut */}
              <button className="em-add-cat-row" onClick={() => {
                setAddForm({ ...EMPTY_FORM, category: cat });
                setPanelMode('add');
                setSelectedEnv(null);
              }}>
                <span>+</span> Add to {meta.label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ── Right panel ── */
  const renderPanel = () => {
    if (!panelMode) {
      return (
        <div className="em-panel em-panel-empty">
          <div className="em-panel-hint-icon">📦</div>
          <div className="em-panel-hint-title">Select an envelope to edit</div>
          <div className="em-panel-hint-sub">or add a new one</div>
          <button className="em-add-btn" style={{ marginTop: 16 }} onClick={openAdd}>+ Add Envelope</button>
        </div>
      );
    }

    const isEdit = panelMode === 'edit';
    const form   = isEdit ? editForm : addForm;
    const setForm = isEdit ? setEditForm : setAddForm;
    const onSubmit = isEdit ? handleEditSave : handleAdd;

    return (
      <div className="em-panel">
        {/* Panel header */}
        <div className="em-panel-header">
          <div className="em-panel-title">{isEdit ? `Edit: ${editTarget}` : 'New Envelope'}</div>
          <button className="em-panel-close" onClick={closePanel}>×</button>
        </div>

        {/* Form */}
        <div className="em-panel-scroll">
          <EnvelopeForm
            form={form}
            setForm={setForm}
            onSubmit={onSubmit}
            onCancel={closePanel}
            isEdit={isEdit}
          />

          {/* Danger zone for edit */}
          {isEdit && (
            <div className="em-danger-zone">
              <div className="em-danger-title">Danger Zone</div>
              <div className="em-danger-desc">
                Deleting this envelope removes all budget allocations. Transactions are kept.
              </div>
              <button className="em-danger-btn" onClick={() => setDeleteTarget(editTarget)}>
                🗑️ Delete Envelope
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="em-root">
      {/* Desktop: two-panel layout */}
      <div className="em-desktop-layout">
        {renderList()}
        {renderPanel()}
      </div>

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteModal
          name={deleteTarget}
          hasTransactions={transactions.some(t => t.envelope === deleteTarget)}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default EnvelopeManagement;
