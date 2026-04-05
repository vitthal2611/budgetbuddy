import React, { useState, useMemo, useEffect } from 'react';
import './Dashboard.css';
import { useData } from '../contexts/DataContext';
import { safeSessionStorage } from '../utils/safeStorage';

const Dashboard = ({ transactions, budgets, onAddTransaction, onViewTransactions }) => {
  const { getEnvelopeCategory } = useData();
  const currentDate = new Date();
  
  const [selectedYear, setSelectedYear] = useState(() => {
    const saved = safeSessionStorage.getItem('dashboardYear');
    return saved === 'all' ? 'all' : (saved ? Number(saved) : 'all');
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const saved = safeSessionStorage.getItem('dashboardMonth');
    // Only restore from session if it's a valid month number (0-11), not 'all'
    if (saved && saved !== 'all' && !isNaN(saved)) {
      return Number(saved);
    }
    return currentDate.getMonth();
  });

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];

  // Get unique years from transactions
  const availableYears = useMemo(() => {
    const years = new Set();
    transactions.forEach(t => {
      const tDate = new Date(t.date.split('-').reverse().join('-'));
      years.add(tDate.getFullYear());
    });
    
    // Always include 2026 and onward
    const currentYear = new Date().getFullYear();
    const startYear = Math.max(2026, currentYear);
    for (let year = startYear; year <= startYear + 4; year++) {
      years.add(year);
    }
    
    return Array.from(years).sort((a, b) => b - a); // Sort descending
  }, [transactions]);

  // Save selections to sessionStorage
  useEffect(() => {
    safeSessionStorage.setItem('dashboardYear', selectedYear.toString());
  }, [selectedYear]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    safeSessionStorage.setItem('dashboardMonth', selectedMonth.toString());
  }, [selectedMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredTransactions = useMemo(() => {
    // If "All Time" is selected, return all transactions
    if (selectedYear === 'all') {
      return transactions;
    }
    
    return transactions.filter(t => {
      const tDate = new Date(t.date.split('-').reverse().join('-'));
      if (tDate.getFullYear() !== selectedYear) return false;
      if (selectedMonth !== 'all' && tDate.getMonth() !== selectedMonth) return false;
      return true;
    });
  }, [transactions, selectedYear, selectedMonth]);

  const { totalIncome, totalExpense, accountBalances, envelopeSpending } = useMemo(() => {
    let income = 0;
    let expense = 0;
    const accounts = {};
    const envelopes = {};

    filteredTransactions.forEach(t => {
      if (t.type === 'income') {
        income += parseFloat(t.amount);
        accounts[t.paymentMethod] = (accounts[t.paymentMethod] || 0) + parseFloat(t.amount);
      } else if (t.type === 'expense') {
        expense += parseFloat(t.amount);
        accounts[t.paymentMethod] = (accounts[t.paymentMethod] || 0) - parseFloat(t.amount);
        envelopes[t.envelope] = (envelopes[t.envelope] || 0) + parseFloat(t.amount);
      } else if (t.type === 'transfer') {
        // Single transfer transaction affects both accounts
        accounts[t.sourceAccount] = (accounts[t.sourceAccount] || 0) - parseFloat(t.amount);
        accounts[t.destinationAccount] = (accounts[t.destinationAccount] || 0) + parseFloat(t.amount);
      }
    });

    return { 
      totalIncome: income, 
      totalExpense: expense, 
      accountBalances: accounts,
      envelopeSpending: envelopes
    };
  }, [filteredTransactions]);

  const totalBalance = Object.values(accountBalances).reduce((sum, val) => sum + val, 0);

  // Calculate today's expenses grouped by envelope
  const todayExpenses = useMemo(() => {
    const today = new Date();
    const todayStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    
    const byEnvelope = {};
    let total = 0;
    
    transactions.forEach(t => {
      if (t.type === 'expense' && t.date === todayStr) {
        const envelope = t.envelope;
        byEnvelope[envelope] = (byEnvelope[envelope] || 0) + parseFloat(t.amount);
        total += parseFloat(t.amount);
      }
    });
    
    return { byEnvelope, total };
  }, [transactions]);

  const getBudgetForEnvelope = (envelope) => {
    if (selectedYear === 'all') {
      // Sum all budgets across all years and months
      let total = 0;
      Object.keys(budgets).forEach(key => {
        total += budgets[key]?.[envelope] || 0;
      });
      return total;
    } else if (selectedMonth === 'all') {
      // Sum all months for the year
      let total = 0;
      for (let i = 0; i < 12; i++) {
        const key = `${selectedYear}-${i}`;
        total += budgets[key]?.[envelope] || 0;
      }
      return total;
    } else {
      const key = `${selectedYear}-${selectedMonth}`;
      return budgets[key]?.[envelope] || 0;
    }
  };

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">BudgetBuddy</h1>
      
      <div className="date-navigation">
        <div className="date-selector">
          <label>Year:</label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
            <option value="all">All Time</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="date-selector">
          <label>Month:</label>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            disabled={selectedYear === 'all'}
          >
            <option value="all">All Months</option>
            {months.map((month, idx) => (
              <option key={idx} value={idx}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card income">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <div className="label">Income</div>
            <div className="amount">₹{totalIncome.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="summary-card expense">
          <div className="card-icon">💸</div>
          <div className="card-content">
            <div className="label">Expense</div>
            <div className="amount">₹{totalExpense.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="summary-card balance">
          <div className="card-icon">💳</div>
          <div className="card-content">
            <div className="label">Balance</div>
            <div className={`amount ${totalBalance >= 0 ? 'positive' : 'negative'}`}>
              ₹{totalBalance.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button className="btn btn-income" onClick={() => onAddTransaction('income')}>
          <span className="btn-icon">+</span>
          <span className="btn-text">Income</span>
        </button>
        <button className="btn btn-expense" onClick={() => onAddTransaction('expense')}>
          <span className="btn-icon">-</span>
          <span className="btn-text">Expense</span>
        </button>
        <button className="btn btn-transfer" onClick={() => onAddTransaction('transfer')}>
          <span className="btn-icon">⇄</span>
          <span className="btn-text">Transfer</span>
        </button>
      </div>

      {todayExpenses.total > 0 && (
        <div className="today-expenses">
          <h3>📅 Today's Expenses</h3>
          <div className="today-envelope-list">
            {Object.entries(todayExpenses.byEnvelope).map(([envelope, amount]) => {
              const category = getEnvelopeCategory(envelope);
              return (
                <div key={envelope} className={`today-envelope-item ${category}`}>
                  <div className="envelope-info">
                    <span className="envelope-icon">
                      {category === 'need' && '🛒'}
                      {category === 'want' && '🎉'}
                      {category === 'saving' && '💰'}
                    </span>
                    <span className="envelope-name">{envelope}</span>
                  </div>
                  <span className="envelope-amount">₹{amount.toLocaleString('en-IN')}</span>
                </div>
              );
            })}
            <div className="today-total">
              <span className="total-label">Total Today</span>
              <span className="total-amount">₹{todayExpenses.total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}

      <div className="account-balances">
        <h3>💳 Payment Methods</h3>
        {Object.entries(accountBalances).map(([account, balance]) => (
          <div 
            key={account} 
            className="balance-row clickable"
            onClick={() => onViewTransactions({ 
              paymentMethod: account,
              year: selectedYear,
              month: selectedMonth
            })}
          >
            <span className="account-name">{account}</span>
            <span className={`account-balance ${balance >= 0 ? 'positive' : 'negative'}`}>
              ₹{balance.toLocaleString('en-IN')}
            </span>
          </div>
        ))}
        <div className="balance-row total">
          <span className="total-label-text">Total Balance</span>
          <span className={`total-balance ${totalBalance >= 0 ? 'positive' : 'negative'}`}>
            ₹{totalBalance.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <div className="envelopes">
        <h3>Budget Envelopes</h3>
        
        {/* Need Category */}
        {Object.entries(envelopeSpending).filter(([envelope]) => getEnvelopeCategory(envelope) === 'need').length > 0 && (
          <div className="envelope-category-section">
            <div className="category-header need">
              <span className="category-icon">🛒</span>
              <span className="category-title">Needs</span>
            </div>
            {Object.entries(envelopeSpending)
              .filter(([envelope]) => getEnvelopeCategory(envelope) === 'need')
              .map(([envelope, spent]) => {
                const budget = getBudgetForEnvelope(envelope);
                const percentage = budget > 0 ? (spent / budget) * 100 : 0;
                return (
                  <div 
                    key={envelope} 
                    className="envelope-item clickable"
                    onClick={() => onViewTransactions({ 
                      envelope: envelope,
                      year: selectedYear,
                      month: selectedMonth
                    })}
                  >
                    <div className="envelope-header">
                      <span className="envelope-name">{envelope}</span>
                      <span className="envelope-amounts">₹{spent.toLocaleString('en-IN')}/{budget.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill need" 
                        style={{ 
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: percentage > 100 ? '#ef4444' : '#10b981'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Want Category */}
        {Object.entries(envelopeSpending).filter(([envelope]) => getEnvelopeCategory(envelope) === 'want').length > 0 && (
          <div className="envelope-category-section">
            <div className="category-header want">
              <span className="category-icon">🎉</span>
              <span className="category-title">Wants</span>
            </div>
            {Object.entries(envelopeSpending)
              .filter(([envelope]) => getEnvelopeCategory(envelope) === 'want')
              .map(([envelope, spent]) => {
                const budget = getBudgetForEnvelope(envelope);
                const percentage = budget > 0 ? (spent / budget) * 100 : 0;
                return (
                  <div 
                    key={envelope} 
                    className="envelope-item clickable"
                    onClick={() => onViewTransactions({ 
                      envelope: envelope,
                      year: selectedYear,
                      month: selectedMonth
                    })}
                  >
                    <div className="envelope-header">
                      <span className="envelope-name">{envelope}</span>
                      <span className="envelope-amounts">₹{spent.toLocaleString('en-IN')}/{budget.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill want" 
                        style={{ 
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: percentage > 100 ? '#ef4444' : '#f59e0b'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Saving Category */}
        {Object.entries(envelopeSpending).filter(([envelope]) => getEnvelopeCategory(envelope) === 'saving').length > 0 && (
          <div className="envelope-category-section">
            <div className="category-header saving">
              <span className="category-icon">💰</span>
              <span className="category-title">Savings</span>
            </div>
            {Object.entries(envelopeSpending)
              .filter(([envelope]) => getEnvelopeCategory(envelope) === 'saving')
              .map(([envelope, spent]) => {
                const budget = getBudgetForEnvelope(envelope);
                const percentage = budget > 0 ? (spent / budget) * 100 : 0;
                return (
                  <div 
                    key={envelope} 
                    className="envelope-item clickable"
                    onClick={() => onViewTransactions({ 
                      envelope: envelope,
                      year: selectedYear,
                      month: selectedMonth
                    })}
                  >
                    <div className="envelope-header">
                      <span className="envelope-name">{envelope}</span>
                      <span className="envelope-amounts">₹{spent.toLocaleString('en-IN')}/{budget.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill saving" 
                        style={{ 
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: percentage > 100 ? '#ef4444' : '#3b82f6'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
