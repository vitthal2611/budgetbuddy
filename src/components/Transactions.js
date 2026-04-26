import React, { useState, useMemo, useRef } from 'react';
import './Transactions.modern.css';
import ImportTransactions from './ImportTransactions';

const fmt = (n) => Math.abs(parseFloat(n)).toLocaleString('en-IN');

const parseDate = (ddmmyyyy) => {
  const [d, m, y] = ddmmyyyy.split('-');
  return new Date(y, m - 1, d);
};

const formatGroupLabel = (ddmmyyyy) => {
  const date = parseDate(ddmmyyyy);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

const Transactions = ({ transactions, onEdit, onDelete, onAdd, initialFilters = {}, onFiltersCleared, onNavigate }) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const [filterType, setFilterType] = useState(initialFilters.type || 'all');
  const [filterMonth, setFilterMonth] = useState(
    initialFilters.month !== undefined ? initialFilters.month : currentMonth
  );
  const [filterYear, setFilterYear] = useState(initialFilters.year || currentYear);
  const [filterPaymentMethod, setFilterPaymentMethod] = useState(initialFilters.paymentMethod || 'all');
  const [filterEnvelope, setFilterEnvelope] = useState(initialFilters.envelope || 'all');
  const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' });
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'day'
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [swipedId, setSwipedId] = useState(null);
  const touchStartX = useRef(null);

  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  // Dynamic year list from transactions
  const availableYears = useMemo(() => {
    const years = new Set([currentYear]);
    transactions.forEach(t => years.add(parseDate(t.date).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  // Update filters when initialFilters change (e.g. from Dashboard drill-down)
  React.useEffect(() => {
    if (Object.keys(initialFilters).length > 0) {
      setFilterType(initialFilters.type || 'all');
      setFilterMonth(initialFilters.month !== undefined ? initialFilters.month : currentMonth);
      setFilterYear(initialFilters.year || currentYear);
      setFilterPaymentMethod(initialFilters.paymentMethod || 'all');
      setFilterEnvelope(initialFilters.envelope || 'all');
    }
  }, [initialFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  const paymentMethods = useMemo(() => {
    const s = new Set();
    transactions.forEach(t => {
      if (t.paymentMethod) s.add(t.paymentMethod);
      if (t.sourceAccount) s.add(t.sourceAccount);
      if (t.destinationAccount) s.add(t.destinationAccount);
    });
    return Array.from(s).sort();
  }, [transactions]);

  const envelopes = useMemo(() => {
    const s = new Set();
    transactions.forEach(t => { if (t.envelope) s.add(t.envelope); });
    return Array.from(s).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filterType !== 'all' && t.type !== filterType) return false;

      const d = parseDate(t.date);
      
      // Day view mode - show only selected day
      if (viewMode === 'day') {
        if (t.date !== selectedDate) return false;
      } else {
        // Month view mode
        // Date range filter takes precedence over month/year filter
        if (filterDateRange.start || filterDateRange.end) {
          if (filterDateRange.start) {
            const startDate = new Date(filterDateRange.start);
            if (d < startDate) return false;
          }
          if (filterDateRange.end) {
            const endDate = new Date(filterDateRange.end);
            endDate.setHours(23, 59, 59, 999); // Include the end date
            if (d > endDate) return false;
          }
        } else {
          // Use month/year filter only if no date range is set
          if (d.getFullYear() !== filterYear) return false;
          if (filterMonth !== 'all' && d.getMonth() !== parseInt(filterMonth)) return false;
        }
      }

      if (filterPaymentMethod !== 'all') {
        const match = t.paymentMethod === filterPaymentMethod ||
          t.sourceAccount === filterPaymentMethod ||
          t.destinationAccount === filterPaymentMethod;
        if (!match) return false;
      }

      if (filterEnvelope !== 'all' && t.envelope !== filterEnvelope) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!t.note?.toLowerCase().includes(q) && !String(Math.abs(parseFloat(t.amount))).includes(q)) return false;
      }

      return true;
    });
  }, [transactions, filterType, filterMonth, filterYear, filterPaymentMethod, filterEnvelope, filterDateRange, searchQuery, viewMode, selectedDate]);

  // Calculate opening balances for day view
  const openingBalances = useMemo(() => {
    if (viewMode !== 'day') return {};
    
    const balances = {};
    const selectedDateObj = parseDate(selectedDate);
    
    // Sort all transactions chronologically
    const allSorted = [...transactions].sort((a, b) => parseDate(a.date) - parseDate(b.date));
    
    // Calculate balances up to (but not including) the selected date
    allSorted.forEach(t => {
      const tDate = parseDate(t.date);
      if (tDate >= selectedDateObj) return; // Stop before selected date
      
      if (t.type === 'income' && t.paymentMethod) {
        if (!balances[t.paymentMethod]) balances[t.paymentMethod] = 0;
        balances[t.paymentMethod] += parseFloat(t.amount);
      } else if (t.type === 'expense' && t.paymentMethod) {
        if (!balances[t.paymentMethod]) balances[t.paymentMethod] = 0;
        balances[t.paymentMethod] -= parseFloat(t.amount);
      } else if (t.type === 'transfer') {
        if (t.sourceAccount) {
          if (!balances[t.sourceAccount]) balances[t.sourceAccount] = 0;
          balances[t.sourceAccount] -= parseFloat(t.amount);
        }
        if (t.destinationAccount) {
          if (!balances[t.destinationAccount]) balances[t.destinationAccount] = 0;
          balances[t.destinationAccount] += parseFloat(t.amount);
        }
      }
    });
    
    return balances;
  }, [transactions, viewMode, selectedDate]);

  // Sort and group by date
  const groupedTransactions = useMemo(() => {
    // Sort all transactions chronologically (oldest first) to calculate running balances
    const allSorted = [...transactions].sort((a, b) => parseDate(a.date) - parseDate(b.date));
    
    // Calculate running balances for each payment method
    const balances = {};
    const transactionBalances = new Map();
    
    allSorted.forEach(t => {
      if (t.type === 'income' && t.paymentMethod) {
        if (!balances[t.paymentMethod]) balances[t.paymentMethod] = 0;
        balances[t.paymentMethod] += parseFloat(t.amount);
        transactionBalances.set(t.id, { balance: balances[t.paymentMethod], paymentMethod: t.paymentMethod });
      } else if (t.type === 'expense' && t.paymentMethod) {
        if (!balances[t.paymentMethod]) balances[t.paymentMethod] = 0;
        balances[t.paymentMethod] -= parseFloat(t.amount);
        transactionBalances.set(t.id, { balance: balances[t.paymentMethod], paymentMethod: t.paymentMethod });
      } else if (t.type === 'transfer') {
        if (t.sourceAccount) {
          if (!balances[t.sourceAccount]) balances[t.sourceAccount] = 0;
          balances[t.sourceAccount] -= parseFloat(t.amount);
        }
        if (t.destinationAccount) {
          if (!balances[t.destinationAccount]) balances[t.destinationAccount] = 0;
          balances[t.destinationAccount] += parseFloat(t.amount);
          transactionBalances.set(t.id, { balance: balances[t.destinationAccount], paymentMethod: t.destinationAccount });
        }
      }
    });
    
    // Now sort filtered transactions for display (newest first)
    const sorted = [...filteredTransactions].sort((a, b) => parseDate(b.date) - parseDate(a.date));
    
    // Add balance info to each transaction
    const sortedWithBalance = sorted.map(t => {
      const balanceInfo = transactionBalances.get(t.id);
      return { 
        ...t, 
        balance: balanceInfo?.balance ?? null,
        balancePaymentMethod: balanceInfo?.paymentMethod ?? null
      };
    });
    
    const groups = [];
    let currentDate = null;

    sortedWithBalance.forEach(t => {
      if (t.date !== currentDate) {
        currentDate = t.date;
        groups.push({ date: t.date, label: formatGroupLabel(t.date), items: [] });
      }
      groups[groups.length - 1].items.push(t);
    });

    return groups;
  }, [filteredTransactions, transactions]);

  const totalStats = useMemo(() => {
    let income = 0, expense = 0, credits = 0;
    filteredTransactions.forEach(t => {
      if (t.type === 'income') income += parseFloat(t.amount);
      if (t.type === 'expense') {
        const amt = parseFloat(t.amount);
        if (t.subtype === 'credit' || amt < 0) credits += Math.abs(amt);
        else expense += amt;
      }
    });
    return { income, expense, credits, net: income - expense + credits, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const activeFiltersCount = [
    filterType !== 'all',
    filterMonth !== currentMonth || filterYear !== currentYear,
    filterPaymentMethod !== 'all',
    filterEnvelope !== 'all',
    filterDateRange.start || filterDateRange.end,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterType('all');
    setFilterMonth(currentMonth);
    setFilterYear(currentYear);
    setFilterPaymentMethod('all');
    setFilterEnvelope('all');
    setFilterDateRange({ start: '', end: '' });
    setViewMode('month');
    setSearchQuery('');
    if (onFiltersCleared) onFiltersCleared();
  };

  const goToPreviousDay = () => {
    const d = parseDate(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(`${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`);
  };

  const goToNextDay = () => {
    const d = parseDate(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(`${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`);
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(`${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`);
  };

  const isViewingToday = (() => {
    const today = new Date();
    const todayStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    return selectedDate === todayStr;
  })();

  const handleImport = (importedTransactions) => {
    window.dispatchEvent(new CustomEvent('importTransactions', { detail: importedTransactions }));
    setTimeout(() => {
      const go = window.confirm(`✅ Imported ${importedTransactions.length} transaction(s)!\n\nView Dashboard?`);
      if (go) window.dispatchEvent(new CustomEvent('switchTab', { detail: 'dashboard' }));
    }, 200);
  };

  const handleTouchStart = (e, id) => {
    touchStartX.current = e.touches[0].clientX;
    if (swipedId && swipedId !== id) setSwipedId(null);
  };

  const handleTouchEnd = (e, id) => {
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (dx > 50) setSwipedId(id);
    else if (dx < -20) setSwipedId(null);
    touchStartX.current = null;
  };

  const getIcon = (t) => {
    if (t.voided) return { icon: '∅', cls: 'icon-voided' };
    if (t.subtype === 'reversal') return { icon: '↺', cls: 'icon-reversal' };
    if (t.type === 'income') return { icon: '↑', cls: 'icon-income' };
    if (t.type === 'transfer') return { icon: '⇄', cls: 'icon-transfer' };
    if (t.subtype === 'credit' || parseFloat(t.amount) < 0) return { icon: '↩', cls: 'icon-credit' };
    return { icon: '↓', cls: 'icon-expense' };
  };

  const getAmountClass = (t) => {
    if (t.voided || t.subtype === 'reversal') return 'voided';
    if (t.type === 'income') return 'positive';
    if (t.type === 'transfer') return 'transfer';
    if (t.subtype === 'credit' || parseFloat(t.amount) < 0) return 'positive';
    return 'negative';
  };

  const formatAmount = (t) => {
    const abs = `₹${fmt(t.amount)}`;
    if (t.voided) return abs;
    if (t.subtype === 'reversal') return abs;
    if (t.type === 'income') return `+${abs}`;
    if (t.type === 'transfer') return abs;
    if (t.subtype === 'credit' || parseFloat(t.amount) < 0) return `+${abs}`;
    return `-${abs}`;
  };

  const getSubLabel = (t) => {
    if (t.type === 'transfer') return `${t.sourceAccount} → ${t.destinationAccount}`;
    if (t.type === 'income') return t.paymentMethod || '';
    return [t.envelope, t.paymentMethod].filter(Boolean).join(' · ');
  };

  return (
    <div className="transactions" onClick={() => swipedId && setSwipedId(null)}>

      {/* ── Sticky top chrome ── */}
      <div className="tx-top">
        {/* Header */}
        <div className="tx-header">
          {initialFilters.envelope && onNavigate && (
            <button 
              className="tx-back-btn" 
              onClick={() => onNavigate('envelopes')}
              aria-label="Back to Envelopes"
            >
              ← Back
            </button>
          )}
          <h1 className="tx-title">Transactions</h1>
          <div className="tx-header-actions">
            <button className="tx-icon-btn" onClick={() => setShowImport(true)} title="Import CSV">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
            <button
              className={`tx-icon-btn ${activeFiltersCount > 0 ? 'active' : ''}`}
              onClick={() => setShowFilterSheet(true)}
              title="Filters"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
              {activeFiltersCount > 0 && <span className="filter-badge">{activeFiltersCount}</span>}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="tx-search-wrap">
          <div className="tx-search-inner">
            <svg className="tx-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="tx-search-input"
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="tx-search-clear" onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>
        </div>

        {/* Month nav */}
        {viewMode === 'month' ? (
          <div className="tx-month-nav">
            <button className="tx-month-arrow" onClick={() => {
              if (filterMonth === 'all') return;
              const m = parseInt(filterMonth);
              if (m === 0) { setFilterMonth(11); setFilterYear(y => y - 1); }
              else setFilterMonth(m - 1);
            }}>‹</button>
            <button
              className={`tx-month-label ${filterMonth === 'all' ? 'all' : ''}`}
              onClick={() => setFilterMonth(filterMonth === 'all' ? currentMonth : 'all')}
            >
              {filterMonth === 'all' ? `All of ${filterYear}` : `${months[parseInt(filterMonth)]} ${filterYear}`}
            </button>
            <button className="tx-month-arrow" onClick={() => {
              if (filterMonth === 'all') return;
              const m = parseInt(filterMonth);
              if (m === 11) { setFilterMonth(0); setFilterYear(y => y + 1); }
              else setFilterMonth(m + 1);
            }}>›</button>
            <button 
              className="tx-view-mode-btn" 
              onClick={() => setViewMode('day')}
              title="Switch to day view"
            >
              📅 Day
            </button>
          </div>
        ) : (
          <div className="tx-month-nav">
            <button className="tx-month-arrow" onClick={goToPreviousDay}>‹</button>
            <div className="tx-day-nav-center">
              <button className="tx-month-label" onClick={() => setViewMode('month')}>
                {parseDate(selectedDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </button>
              {!isViewingToday && (
                <button className="tx-today-chip" onClick={goToToday}>Today</button>
              )}
            </div>
            <button className="tx-month-arrow" onClick={goToNextDay}>›</button>
            <button 
              className="tx-view-mode-btn" 
              onClick={() => setViewMode('month')}
              title="Switch to month view"
            >
              📆 Month
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="tx-stats">
          <div className="tx-stat">
            <span className="tx-stat-label">Transactions</span>
            <span className="tx-stat-value neutral">{totalStats.count}</span>
          </div>
          <div className="tx-stat-divider" />
          <div className="tx-stat">
            <span className="tx-stat-label">Income</span>
            <span className="tx-stat-value income">+₹{fmt(totalStats.income)}</span>
          </div>
          <div className="tx-stat-divider" />
          <div className="tx-stat">
            <span className="tx-stat-label">Expense</span>
            <span className="tx-stat-value expense">-₹{fmt(totalStats.expense)}</span>
          </div>
          <div className="tx-stat-divider" />
          <div className="tx-stat">
            <span className="tx-stat-label">Net</span>
            <span className={`tx-stat-value ${totalStats.net >= 0 ? 'income' : 'expense'}`}>
              {totalStats.net >= 0 ? '+' : '-'}₹{fmt(totalStats.net)}
            </span>
          </div>
        </div>

        {/* Active filter pills */}
        {(activeFiltersCount > 0 || searchQuery) && (
          <div className="tx-active-filters">
            {filterType !== 'all' && (
              <span className="tx-filter-pill" onClick={() => setFilterType('all')}>
                {filterType} ×
              </span>
            )}
            {filterPaymentMethod !== 'all' && (
              <span className="tx-filter-pill" onClick={() => setFilterPaymentMethod('all')}>
                {filterPaymentMethod} ×
              </span>
            )}
            {filterEnvelope !== 'all' && (
              <span className="tx-filter-pill" onClick={() => setFilterEnvelope('all')}>
                {filterEnvelope} ×
              </span>
            )}
            {(filterDateRange.start || filterDateRange.end) && (
              <span className="tx-filter-pill" onClick={() => setFilterDateRange({ start: '', end: '' })}>
                {filterDateRange.start && filterDateRange.end 
                  ? `${filterDateRange.start} to ${filterDateRange.end}` 
                  : filterDateRange.start 
                  ? `From ${filterDateRange.start}` 
                  : `Until ${filterDateRange.end}`} ×
              </span>
            )}
            <button className="tx-clear-all" onClick={clearFilters}>Clear all</button>
          </div>
        )}
      </div>

      {/* ── Scrollable list ── */}
      <div className="tx-scroll">
        {/* Opening balances for day view */}
        {viewMode === 'day' && Object.keys(openingBalances).length > 0 && (
          <div className="tx-opening-balances">
            <div className="tx-opening-title">Opening Balance</div>
            <div className="tx-opening-list">
              {Object.entries(openingBalances)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([method, balance]) => (
                  <div key={method} className="tx-opening-item">
                    <div className="tx-opening-method">
                      <span className="tx-opening-icon">💳</span>
                      {method}
                    </div>
                    <div className={`tx-opening-balance ${balance < 0 ? 'negative' : balance === 0 ? 'zero' : ''}`}>
                      ₹{fmt(balance)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {groupedTransactions.length === 0 ? (
          <div className="tx-empty">
            <div className="tx-empty-icon">📭</div>
            <div className="tx-empty-title">No transactions</div>
            <div className="tx-empty-sub">
              {searchQuery || activeFiltersCount > 0 ? 'Try adjusting your filters' : 'Add your first transaction'}
            </div>
            {(searchQuery || activeFiltersCount > 0) && (
              <button className="tx-empty-btn" onClick={clearFilters}>Clear filters</button>
            )}
          </div>
        ) : (
          <div className="tx-list">
            {groupedTransactions.map(group => (
              <div key={group.date} className="tx-group">
                <div className="tx-group-header">
                  <span className="tx-group-label">{group.label}</span>
                  <span className="tx-group-total">
                    {(() => {
                      const net = group.items.reduce((s, t) => {
                        if (t.type === 'income') return s + parseFloat(t.amount);
                        if (t.type === 'expense') return s - Math.abs(parseFloat(t.amount));
                        return s;
                      }, 0);
                      return (
                        <span className={net >= 0 ? 'positive' : 'negative'}>
                          {net >= 0 ? '+' : '-'}₹{fmt(net)}
                        </span>
                      );
                    })()}
                  </span>
                </div>

                {group.items.map(t => {
                  const { icon, cls } = getIcon(t);
                  const isSwiped = swipedId === t.id;

                  return (
                    <div
                      key={t.id}
                      className={`tx-item-wrap ${isSwiped ? 'swiped' : ''}`}
                      onTouchStart={e => handleTouchStart(e, t.id)}
                      onTouchEnd={e => handleTouchEnd(e, t.id)}
                      onDoubleClick={e => { e.stopPropagation(); onEdit(t); }}
                    >
                      <div className="tx-item" onClick={() => { if (isSwiped) setSwipedId(null); }}>
                        <div className={`tx-item-icon ${cls}`}>{icon}</div>
                        <div className="tx-item-body">
                          <div className="tx-item-top">
                            <span className={`tx-item-note${t.voided ? ' tx-item-note--voided' : ''}`}
                              style={t.voided ? { textDecoration: 'line-through', color: 'var(--text-tertiary)' } : {}}>
                              {t.note}
                            </span>
                            <span className={`tx-item-amount ${getAmountClass(t)}`}>{formatAmount(t)}</span>
                          </div>
                          <div className="tx-item-sub">
                            <span>{getSubLabel(t)}</span>
                            {t.balance !== null && (
                              <span className="tx-item-balance">
                                Bal: ₹{fmt(t.balance)}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Desktop actions */}
                        <div className="tx-item-actions desktop-only">
                          <button className="tx-action edit" onClick={e => { e.stopPropagation(); onEdit(t); }}>✏️</button>
                          <button className="tx-action delete" onClick={e => { e.stopPropagation(); onDelete(t.id); }}>🗑️</button>
                        </div>
                      </div>

                      {/* Swipe actions */}
                      <div className="tx-swipe-actions">
                        <button className="tx-swipe-btn edit" onClick={e => { e.stopPropagation(); setSwipedId(null); onEdit(t); }}>Edit</button>
                        <button className="tx-swipe-btn delete" onClick={e => { e.stopPropagation(); setSwipedId(null); onDelete(t.id); }}>Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Filter bottom sheet ── */}
      {showFilterSheet && (
        <div className="tx-sheet-overlay" onClick={() => setShowFilterSheet(false)}>
          <div className="tx-sheet" onClick={e => e.stopPropagation()}>
            <div className="tx-sheet-header">
              <span className="tx-sheet-title">Filters</span>
              <button className="tx-sheet-close" onClick={() => setShowFilterSheet(false)}>×</button>
            </div>

            <div className="tx-sheet-body">
              {/* Type */}
              <div className="tx-filter-section">
                <div className="tx-filter-label">Type</div>
                <div className="tx-chip-row">
                  {[['all', 'All'], ['income', '↑ Income'], ['expense', '↓ Expense'], ['transfer', '⇄ Transfer']].map(([v, l]) => (
                    <button key={v} className={`tx-chip ${filterType === v ? 'active' : ''}`}
                      onClick={() => setFilterType(v)}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="tx-filter-section">
                <div className="tx-filter-label">Date Range</div>
                <div className="tx-date-range">
                  <div className="tx-date-input-group">
                    <label className="tx-date-label">From</label>
                    <input
                      type="date"
                      className="tx-date-input"
                      value={filterDateRange.start}
                      onChange={(e) => setFilterDateRange({ ...filterDateRange, start: e.target.value })}
                    />
                  </div>
                  <div className="tx-date-input-group">
                    <label className="tx-date-label">To</label>
                    <input
                      type="date"
                      className="tx-date-input"
                      value={filterDateRange.end}
                      onChange={(e) => setFilterDateRange({ ...filterDateRange, end: e.target.value })}
                    />
                  </div>
                </div>
                {(filterDateRange.start || filterDateRange.end) && (
                  <button 
                    className="tx-clear-date-range" 
                    onClick={() => setFilterDateRange({ start: '', end: '' })}
                  >
                    Clear date range
                  </button>
                )}
              </div>

              {/* Year */}
              <div className="tx-filter-section">
                <div className="tx-filter-label">Year (Quick Select)</div>
                <div className="tx-chip-row">
                  {availableYears.map(y => (
                    <button key={y} className={`tx-chip ${filterYear === y ? 'active' : ''}`}
                      onClick={() => setFilterYear(y)}>{y}</button>
                  ))}
                </div>
              </div>

              {/* Month */}
              <div className="tx-filter-section">
                <div className="tx-filter-label">Month (Quick Select)</div>
                <div className="tx-chip-row wrap">
                  <button className={`tx-chip ${filterMonth === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterMonth('all')}>All</button>
                  {months.map((m, i) => (
                    <button key={i} className={`tx-chip ${filterMonth === i || filterMonth === String(i) ? 'active' : ''}`}
                      onClick={() => setFilterMonth(i)}>{m.slice(0, 3)}</button>
                  ))}
                </div>
              </div>

              {/* Account */}
              {paymentMethods.length > 0 && (
                <div className="tx-filter-section">
                  <div className="tx-filter-label">Account</div>
                  <div className="tx-chip-row wrap">
                    <button className={`tx-chip ${filterPaymentMethod === 'all' ? 'active' : ''}`}
                      onClick={() => setFilterPaymentMethod('all')}>All</button>
                    {paymentMethods.map(m => (
                      <button key={m} className={`tx-chip ${filterPaymentMethod === m ? 'active' : ''}`}
                        onClick={() => setFilterPaymentMethod(m)}>{m}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Envelope */}
              {envelopes.length > 0 && (
                <div className="tx-filter-section">
                  <div className="tx-filter-label">Envelope</div>
                  <div className="tx-chip-row wrap">
                    <button className={`tx-chip ${filterEnvelope === 'all' ? 'active' : ''}`}
                      onClick={() => setFilterEnvelope('all')}>All</button>
                    {envelopes.map(e => (
                      <button key={e} className={`tx-chip ${filterEnvelope === e ? 'active' : ''}`}
                        onClick={() => setFilterEnvelope(e)}>{e}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="tx-sheet-footer">
              <button className="tx-sheet-clear" onClick={() => { clearFilters(); setShowFilterSheet(false); }}>Reset</button>
              <button className="tx-sheet-apply" onClick={() => setShowFilterSheet(false)}>
                Show {filteredTransactions.length} results
              </button>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <ImportTransactions
          onImport={handleImport}
          onClose={() => setShowImport(false)}
          existingTransactions={transactions}
        />
      )}

      {/* FAB and menu */}
      {onAdd && (
        <>
          {showFabMenu && (
            <>
              <div className="tx-fab-backdrop" onClick={() => setShowFabMenu(false)} />
              <div className="tx-fab-menu">
                <div 
                  className="tx-fab-item"
                  onClick={() => {
                    setShowFabMenu(false);
                    onAdd('income');
                  }}
                >
                  <div className="tx-fab-icon income">↑</div>
                  <span className="tx-fab-label">Add Income</span>
                </div>
                <div 
                  className="tx-fab-item"
                  onClick={() => {
                    setShowFabMenu(false);
                    onAdd('expense');
                  }}
                >
                  <div className="tx-fab-icon expense">↓</div>
                  <span className="tx-fab-label">Add Expense</span>
                </div>
                <div 
                  className="tx-fab-item"
                  onClick={() => {
                    setShowFabMenu(false);
                    onAdd('transfer');
                  }}
                >
                  <div className="tx-fab-icon transfer">⇄</div>
                  <span className="tx-fab-label">Transfer</span>
                </div>
              </div>
            </>
          )}
          <button 
            className={`tx-fab ${showFabMenu ? 'open' : ''}`}
            onClick={() => setShowFabMenu(!showFabMenu)}
            aria-label="Add transaction"
          >
            +
          </button>
        </>
      )}
    </div>
  );
};

export default Transactions;
