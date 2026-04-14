import React, { useState, useEffect } from 'react';
import './FillEnvelopesModal.css';
import { useData } from '../../contexts/DataContext';

const fmt = (n) => Math.abs(n).toLocaleString('en-IN');

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CATS = [
  { key: 'need',   label: 'Needs',   icon: '🛒' },
  { key: 'want',   label: 'Wants',   icon: '🎉' },
  { key: 'saving', label: 'Savings', icon: '💰' },
];

const FillEnvelopesModal = ({
  isOpen, onClose,
  budgets, setBudgets,
  transactions, monthlyIncome,
  year: initYear, month: initMonth,
}) => {
  const { envelopes } = useData();

  // Internal month state — independent of main view
  const today = new Date();
  const [fillYear,  setFillYear]  = useState(initYear  ?? today.getFullYear());
  const [fillMonth, setFillMonth] = useState(
    initMonth === 'all' || initMonth === undefined ? today.getMonth() : initMonth
  );
  const [fills, setFills] = useState({});
  const [copySource, setCopySource] = useState('');

  const budgetKey = `${fillYear}-${fillMonth}`;

  // Build list of months that have budget data (for copy dropdown)
  const availableMonths = React.useMemo(() => {
    const months = [];
    Object.keys(budgets).forEach(key => {
      if (key.startsWith('_')) return;
      const [y, m] = key.split('-');
      if (!y || m === undefined) return;
      const hasData = Object.values(budgets[key]).some(v => parseFloat(v) > 0);
      if (hasData) months.push({ key, label: `${MONTHS_SHORT[parseInt(m)]} ${y}` });
    });
    return months.sort((a, b) => b.key.localeCompare(a.key));
  }, [budgets]);

  // Load fills when month changes
  useEffect(() => {
    if (!isOpen) return;
    const current = budgets[budgetKey] || {};
    const init = {};
    envelopes.forEach(e => { init[e.name] = current[e.name] || 0; });
    setFills(init);
    setCopySource('');
  }, [isOpen, budgetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Month navigation
  const prevMonth = () => {
    if (fillMonth === 0) { setFillMonth(11); setFillYear(y => y - 1); }
    else setFillMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (fillMonth === 11) { setFillMonth(0); setFillYear(y => y + 1); }
    else setFillMonth(m => m + 1);
  };

  // Copy from another month
  const handleCopy = (sourceKey) => {
    if (!sourceKey) return;
    const source = budgets[sourceKey] || {};
    const next = {};
    envelopes.forEach(e => { next[e.name] = source[e.name] || 0; });
    setFills(next);
    setBudgets({ ...budgets, [budgetKey]: next });
    setCopySource('');
  };

  // One-click copy from last month
  const handleCopyLastMonth = () => {
    if (availableMonths.length === 0) return;
    // Get the most recent month (first in sorted list)
    const lastMonth = availableMonths[0];
    handleCopy(lastMonth.key);
  };

  // Compute income for the selected fill month
  const fillMonthIncome = React.useMemo(() => {
    return transactions
      .filter(t => {
        if (t.type !== 'income') return false;
        const d = new Date(t.date.split('-').reverse().join('-'));
        return d.getFullYear() === fillYear && d.getMonth() === fillMonth;
      })
      .reduce((s, t) => s + parseFloat(t.amount), 0);
  }, [transactions, fillYear, fillMonth]);

  const totalFilled  = Object.values(fills).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const unallocated  = fillMonthIncome - totalFilled;

  const handleChange = (name, val) => setFills(p => ({ ...p, [name]: val }));

  const handleBlur = (name, val) => {
    const num = parseFloat(val) || 0;
    const next = { ...fills, [name]: num };
    setFills(next);
    setBudgets({ ...budgets, [budgetKey]: next });
  };

  const handleDone = () => {
    const next = {};
    Object.entries(fills).forEach(([k, v]) => { next[k] = parseFloat(v) || 0; });
    setBudgets({ ...budgets, [budgetKey]: next });
    onClose();
  };

  if (!isOpen) return null;

  const isCurrentMonth = fillYear === today.getFullYear() && fillMonth === today.getMonth();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="fill-modal" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="fill-modal-header">
          <div className="fill-modal-title-wrap">
            <h2>💰 Fill Envelopes</h2>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* ── Month navigator ── */}
        <div className="fill-month-nav">
          <button className="fill-month-arrow" onClick={prevMonth}>‹</button>
          <div className="fill-month-center">
            <span className="fill-month-label">{MONTHS[fillMonth]} {fillYear}</span>
            {!isCurrentMonth && (
              <button
                className="fill-today-chip"
                onClick={() => { setFillMonth(today.getMonth()); setFillYear(today.getFullYear()); }}
              >
                Today
              </button>
            )}
          </div>
          <button className="fill-month-arrow" onClick={nextMonth}>›</button>
        </div>

        {/* ── Summary bar ── */}
        <div className="fill-summary">
          <div className="fill-summary-item">
            <span>Income</span>
            <span>₹{fmt(fillMonthIncome)}</span>
          </div>
          <div className="fill-summary-divider" />
          <div className="fill-summary-item">
            <span>Assigned</span>
            <span>₹{fmt(totalFilled)}</span>
          </div>
          <div className="fill-summary-divider" />
          <div className={`fill-summary-item ${unallocated === 0 ? 'zero' : unallocated < 0 ? 'neg' : 'pos'}`}>
            <span>To Allocate</span>
            <span>{unallocated < 0 ? '-' : ''}₹{fmt(unallocated)}</span>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        {availableMonths.length > 0 && (
          <div className="fill-quick-actions">
            <button 
              className="btn-copy-last-month"
              onClick={handleCopyLastMonth}
            >
              📋 Copy Last Month
            </button>
          </div>
        )}

        {/* ── Envelope list — 3 columns ── */}
        <div className="fill-list">
          {CATS.map(({ key, label, icon }) => {
            const group = envelopes.filter(e => e.category === key);
            if (group.length === 0) return null;
            return (
              <div key={key} className="fill-col">
                <div className={`fill-col-header fill-col-${key}`}>
                  <span>{icon}</span>
                  <span>{label}</span>
                  <span className="fill-col-count">{group.length}</span>
                </div>
                {group.map(env => (
                  <div key={env.name} className="fill-item">
                    <span className="fill-item-name">{env.name}</span>
                    <input
                      className="fill-input"
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={fills[env.name] ?? ''}
                      placeholder="0"
                      onChange={e => handleChange(env.name, e.target.value)}
                      onBlur={e => handleBlur(env.name, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div className="fill-modal-actions">
          <button className="btn-done" onClick={handleDone}>
            Done — {MONTHS_SHORT[fillMonth]} {fillYear}
          </button>
        </div>

      </div>
    </div>
  );
};

export default FillEnvelopesModal;
