import React, { useState, useMemo } from 'react';
import './Transactions.css';

const Transactions = ({ transactions, onEdit, onDelete, initialFilters = {}, onFiltersCleared }) => {
  const [filterType, setFilterType] = useState(initialFilters.type || 'all');
  const [filterMonth, setFilterMonth] = useState(initialFilters.month || 'all');
  const [filterYear, setFilterYear] = useState(initialFilters.year || new Date().getFullYear());
  const [filterPaymentMethod, setFilterPaymentMethod] = useState(initialFilters.paymentMethod || 'all');
  const [filterEnvelope, setFilterEnvelope] = useState(initialFilters.envelope || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Update filters when initialFilters change
  React.useEffect(() => {
    if (Object.keys(initialFilters).length > 0) {
      setFilterType(initialFilters.type || 'all');
      setFilterMonth(initialFilters.month || 'all');
      setFilterYear(initialFilters.year || new Date().getFullYear());
      setFilterPaymentMethod(initialFilters.paymentMethod || 'all');
      setFilterEnvelope(initialFilters.envelope || 'all');
      setShowFilters(true);
    }
  }, [initialFilters]);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];

  // Get unique payment methods and envelopes
  const paymentMethods = useMemo(() => {
    const methods = new Set();
    transactions.forEach(t => {
      if (t.paymentMethod) methods.add(t.paymentMethod);
      if (t.sourceAccount) methods.add(t.sourceAccount);
      if (t.destinationAccount) methods.add(t.destinationAccount);
    });
    return Array.from(methods);
  }, [transactions]);

  const envelopes = useMemo(() => {
    const envs = new Set();
    transactions.forEach(t => {
      if (t.envelope) envs.add(t.envelope);
    });
    return Array.from(envs);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Type filter
      if (filterType !== 'all' && t.type !== filterType) return false;

      // Date filter
      const tDate = new Date(t.date.split('-').reverse().join('-'));
      if (tDate.getFullYear() !== filterYear) return false;
      if (filterMonth !== 'all' && tDate.getMonth() !== parseInt(filterMonth)) return false;

      // Payment method filter
      if (filterPaymentMethod !== 'all') {
        const hasMethod = t.paymentMethod === filterPaymentMethod || 
                         t.sourceAccount === filterPaymentMethod || 
                         t.destinationAccount === filterPaymentMethod;
        if (!hasMethod) return false;
      }

      // Envelope filter
      if (filterEnvelope !== 'all' && t.envelope !== filterEnvelope) return false;

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesNote = t.note?.toLowerCase().includes(query);
        const matchesAmount = t.amount?.toString().includes(query);
        if (!matchesNote && !matchesAmount) return false;
      }

      return true;
    });
  }, [transactions, filterType, filterMonth, filterYear, filterPaymentMethod, filterEnvelope, searchQuery]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      const dateA = new Date(a.date.split('-').reverse().join('-'));
      const dateB = new Date(b.date.split('-').reverse().join('-'));
      return dateB - dateA;
    });
  }, [filteredTransactions]);

  const totalStats = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach(t => {
      if (t.type === 'income') income += parseFloat(t.amount);
      if (t.type === 'expense') expense += parseFloat(t.amount);
    });
    return { income, expense, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const formatAmount = (transaction) => {
    const amount = parseFloat(transaction.amount);
    if (transaction.type === 'income') {
      return `+${amount.toFixed(0)}`;
    } else if (transaction.type === 'expense') {
      return `-${amount.toFixed(0)}`;
    } else {
      // Transfer - just show the amount without sign
      return amount.toFixed(0);
    }
  };

  const getTransactionType = (transaction) => {
    if (transaction.type === 'income') return 'Income';
    if (transaction.type === 'expense') return transaction.envelope;
    return 'Transfer';
  };

  const getTransactionIcon = (transaction) => {
    if (transaction.type === 'income') return '💰';
    if (transaction.type === 'expense') return '💸';
    return '🔄';
  };

  const clearFilters = () => {
    setFilterType('all');
    setFilterMonth('all');
    setFilterYear(new Date().getFullYear());
    setFilterPaymentMethod('all');
    setFilterEnvelope('all');
    setSearchQuery('');
    if (onFiltersCleared) onFiltersCleared();
  };

  const activeFiltersCount = [
    filterType !== 'all',
    filterMonth !== 'all',
    filterPaymentMethod !== 'all',
    filterEnvelope !== 'all',
    searchQuery !== ''
  ].filter(Boolean).length;

  return (
    <div className="transactions">
      <div className="transactions-header">
        <h1 className="transactions-title">Transactions</h1>
        <button 
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          🔍 Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="search-box">
            <input
              type="text"
              className="search-input"
              placeholder="Search by note or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-chips">
            <button
              className={`chip ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All
            </button>
            <button
              className={`chip ${filterType === 'income' ? 'active' : ''}`}
              onClick={() => setFilterType('income')}
            >
              💰 Income
            </button>
            <button
              className={`chip ${filterType === 'expense' ? 'active' : ''}`}
              onClick={() => setFilterType('expense')}
            >
              💸 Expense
            </button>
            <button
              className={`chip ${filterType === 'transfer' ? 'active' : ''}`}
              onClick={() => setFilterType('transfer')}
            >
              🔄 Transfer
            </button>
          </div>

          <div className="filter-row">
            <select 
              className="filter-select"
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <select 
              className="filter-select"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              <option value="all">All Months</option>
              {months.map((month, idx) => (
                <option key={idx} value={idx}>{month}</option>
              ))}
            </select>
          </div>

          {paymentMethods.length > 0 && (
            <select 
              className="filter-select full-width"
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
            >
              <option value="all">All Payment Methods</option>
              {paymentMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          )}

          {envelopes.length > 0 && (
            <select 
              className="filter-select full-width"
              value={filterEnvelope}
              onChange={(e) => setFilterEnvelope(e.target.value)}
            >
              <option value="all">All Envelopes</option>
              {envelopes.map(env => (
                <option key={env} value={env}>{env}</option>
              ))}
            </select>
          )}

          {activeFiltersCount > 0 && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear All Filters
            </button>
          )}
        </div>
      )}

      <div className="transaction-stats">
        <div className="stat-item">
          <span className="stat-label">Total</span>
          <span className="stat-value">{totalStats.count}</span>
        </div>
        <div className="stat-item income">
          <span className="stat-label">Income</span>
          <span className="stat-value">₹{totalStats.income.toFixed(0)}</span>
        </div>
        <div className="stat-item expense">
          <span className="stat-label">Expense</span>
          <span className="stat-value">₹{totalStats.expense.toFixed(0)}</span>
        </div>
      </div>
      
      {sortedTransactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>No transactions found</p>
          {activeFiltersCount > 0 && (
            <button className="btn-clear-empty" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="transaction-list">
          {sortedTransactions.map((transaction) => (
            <div key={transaction.id} className="transaction-item">
              <div className="transaction-icon">
                {getTransactionIcon(transaction)}
              </div>
              <div className="transaction-content">
                <div className="transaction-main">
                  <div className="transaction-note">{transaction.note}</div>
                  <div className={`transaction-amount ${
                    transaction.type === 'income' ? 'positive' : 'negative'
                  }`}>
                    ₹{formatAmount(transaction)}
                  </div>
                </div>
                <div className="transaction-details">
                  <span className="transaction-date">{transaction.date}</span>
                  <span className="transaction-separator">•</span>
                  <span className="transaction-method">
                    {transaction.type === 'transfer' 
                      ? `${transaction.sourceAccount} → ${transaction.destinationAccount}`
                      : transaction.paymentMethod}
                  </span>
                  <span className="transaction-separator">•</span>
                  <span className="transaction-category">{getTransactionType(transaction)}</span>
                </div>
              </div>
              <div className="transaction-actions">
                <button className="action-btn edit" onClick={() => onEdit(transaction)}>
                  ✏️
                </button>
                <button className="action-btn delete" onClick={() => onDelete(transaction.id)}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Transactions;
