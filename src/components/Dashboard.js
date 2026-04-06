import React, { useState, useMemo, useEffect } from 'react';
import './Dashboard.modern.css';
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
      {/* Modern Header */}
      <div className="dashboard-header">
        <div className="dashboard-logo">
          <div className="dashboard-avatar">BB</div>
          <h1 className="dashboard-title">BudgetBuddy</h1>
        </div>
        <div className="dashboard-actions">
          <button className="icon-btn" aria-label="Notifications">
            🔔
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="date-filter">
        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
          <option value="all">All Time</option>
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
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

      <div className="dashboard-content">
        {/* Compact Balance Row */}
        <div className="balance-row">
          <div className="balance-item balance-total">
            <div className="balance-item-icon">💰</div>
            <div className="balance-item-content">
              <div className="balance-item-label">Balance</div>
              <div className="balance-item-amount">₹{totalBalance.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div className="balance-item balance-income">
            <div className="balance-item-icon">💰</div>
            <div className="balance-item-content">
              <div className="balance-item-label">Income</div>
              <div className="balance-item-amount">₹{totalIncome.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div className="balance-item balance-expense">
            <div className="balance-item-icon">💸</div>
            <div className="balance-item-content">
              <div className="balance-item-label">Expense</div>
              <div className="balance-item-amount">₹{totalExpense.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        {/* Today's Expenses */}
        {todayExpenses.total > 0 && (
          <div className="today-section">
            <h2 className="section-header-modern">📅 Today's Expenses</h2>
            <div className="expense-list">
              {Object.entries(todayExpenses.byEnvelope).map(([envelope, amount]) => {
                const category = getEnvelopeCategory(envelope);
                return (
                  <div key={envelope} className="expense-item">
                    <div className={`expense-icon ${category}`}>
                      {category === 'need' && '🛒'}
                      {category === 'want' && '🎉'}
                      {category === 'saving' && '💰'}
                    </div>
                    <div className="expense-details">
                      <div className="expense-name">{envelope}</div>
                      <div className="expense-category">{category}</div>
                    </div>
                    <div className="expense-amount">₹{amount.toLocaleString('en-IN')}</div>
                  </div>
                );
              })}
              <div className="expense-total">
                <span className="expense-total-label">Total Today</span>
                <span className="expense-total-amount">₹{todayExpenses.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        <div className="payment-section">
          <h2 className="section-header-modern">💳 Payment Methods</h2>
          <div className="payment-list">
            {Object.entries(accountBalances).map(([account, balance]) => (
              <div 
                key={account} 
                className="payment-item"
                onClick={() => onViewTransactions({ 
                  paymentMethod: account,
                  year: selectedYear,
                  month: selectedMonth
                })}
              >
                <div className="payment-icon">💳</div>
                <div className="payment-details">
                  <div className="payment-name">{account}</div>
                </div>
                <div className={`payment-balance ${balance >= 0 ? 'positive' : 'negative'}`}>
                  ₹{balance.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
            <div className="payment-total">
              <span className="payment-total-label">Total Balance</span>
              <span className="payment-total-amount">₹{totalBalance.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="budget-section">
          <h2 className="section-header-modern">💰 Budget Overview</h2>
          
          {/* Need Category */}
          {Object.entries(envelopeSpending).filter(([envelope]) => getEnvelopeCategory(envelope) === 'need').length > 0 && (
            <div className="budget-category">
              <div className="category-header-modern">
                <span className="category-icon-modern">🛒</span>
                <span className="category-title-modern">Needs</span>
              </div>
              <div className="budget-list">
                {Object.entries(envelopeSpending)
                  .filter(([envelope]) => getEnvelopeCategory(envelope) === 'need')
                  .map(([envelope, spent]) => {
                    const budget = getBudgetForEnvelope(envelope);
                    const remaining = budget - spent;
                    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
                    return (
                      <div 
                        key={envelope} 
                        className="budget-item"
                        onClick={() => onViewTransactions({ 
                          envelope: envelope,
                          year: selectedYear,
                          month: selectedMonth
                        })}
                      >
                        <div className="budget-header">
                          <span className="budget-name">{envelope}</span>
                          <span className={`budget-remaining ${remaining < 0 ? 'negative' : 'positive'}`}>
                            ₹{remaining.toLocaleString('en-IN')} left
                          </span>
                        </div>
                        <div className="budget-progress">
                          <div className="budget-bar">
                            <div 
                              className={`budget-fill ${percentage > 100 ? 'over' : 'need'}`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <span className="budget-stats-text">
                            ₹{spent.toLocaleString('en-IN')} of ₹{budget.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Want Category */}
          {Object.entries(envelopeSpending).filter(([envelope]) => getEnvelopeCategory(envelope) === 'want').length > 0 && (
            <div className="budget-category">
              <div className="category-header-modern">
                <span className="category-icon-modern">🎉</span>
                <span className="category-title-modern">Wants</span>
              </div>
              <div className="budget-list">
                {Object.entries(envelopeSpending)
                  .filter(([envelope]) => getEnvelopeCategory(envelope) === 'want')
                  .map(([envelope, spent]) => {
                    const budget = getBudgetForEnvelope(envelope);
                    const remaining = budget - spent;
                    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
                    return (
                      <div 
                        key={envelope} 
                        className="budget-item"
                        onClick={() => onViewTransactions({ 
                          envelope: envelope,
                          year: selectedYear,
                          month: selectedMonth
                        })}
                      >
                        <div className="budget-header">
                          <span className="budget-name">{envelope}</span>
                          <span className={`budget-remaining ${remaining < 0 ? 'negative' : 'positive'}`}>
                            ₹{remaining.toLocaleString('en-IN')} left
                          </span>
                        </div>
                        <div className="budget-progress">
                          <div className="budget-bar">
                            <div 
                              className={`budget-fill ${percentage > 100 ? 'over' : 'want'}`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <span className="budget-stats-text">
                            ₹{spent.toLocaleString('en-IN')} of ₹{budget.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Saving Category */}
          {Object.entries(envelopeSpending).filter(([envelope]) => getEnvelopeCategory(envelope) === 'saving').length > 0 && (
            <div className="budget-category">
              <div className="category-header-modern">
                <span className="category-icon-modern">💰</span>
                <span className="category-title-modern">Savings</span>
              </div>
              <div className="budget-list">
                {Object.entries(envelopeSpending)
                  .filter(([envelope]) => getEnvelopeCategory(envelope) === 'saving')
                  .map(([envelope, spent]) => {
                    const budget = getBudgetForEnvelope(envelope);
                    const remaining = budget - spent;
                    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
                    return (
                      <div 
                        key={envelope} 
                        className="budget-item"
                        onClick={() => onViewTransactions({ 
                          envelope: envelope,
                          year: selectedYear,
                          month: selectedMonth
                        })}
                      >
                        <div className="budget-header">
                          <span className="budget-name">{envelope}</span>
                          <span className={`budget-remaining ${remaining < 0 ? 'negative' : 'positive'}`}>
                            ₹{remaining.toLocaleString('en-IN')} left
                          </span>
                        </div>
                        <div className="budget-progress">
                          <div className="budget-bar">
                            <div 
                              className={`budget-fill ${percentage > 100 ? 'over' : 'saving'}`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <span className="budget-stats-text">
                            ₹{spent.toLocaleString('en-IN')} of ₹{budget.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <button 
          className="fab" 
          onClick={() => onAddTransaction('expense')}
          aria-label="Add transaction"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
