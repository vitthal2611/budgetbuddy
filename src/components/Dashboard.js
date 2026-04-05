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
          <div className="label">Income</div>
          <div className="amount">₹{totalIncome.toFixed(0)}</div>
        </div>
        <div className="summary-card expense">
          <div className="label">Expense</div>
          <div className="amount">₹{totalExpense.toFixed(0)}</div>
        </div>
      </div>

      <div className="account-balances">
        <h3>Mode Balance</h3>
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
            <span>{account}</span>
            <span className={balance >= 0 ? 'positive' : 'negative'}>
              ₹{balance.toFixed(0)}
            </span>
          </div>
        ))}
        <div className="balance-row total">
          <span>Total</span>
          <span className={totalBalance >= 0 ? 'positive' : 'negative'}>
            ₹{totalBalance.toFixed(0)}
          </span>
        </div>
      </div>

      <div className="action-buttons">
        <button className="btn btn-income" onClick={() => onAddTransaction('income')}>
          + Income
        </button>
        <button className="btn btn-expense" onClick={() => onAddTransaction('expense')}>
          - Expense
        </button>
        <button className="btn btn-transfer" onClick={() => onAddTransaction('transfer')}>
          ⇄ Transfer
        </button>
      </div>

      <div className="envelopes">
        <h3>Envelopes</h3>
        {Object.entries(envelopeSpending).map(([envelope, spent]) => {
          const budget = getBudgetForEnvelope(envelope);
          const percentage = budget > 0 ? (spent / budget) * 100 : 0;
          const category = getEnvelopeCategory(envelope);
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
                <span className="envelope-with-icon">
                  <span>{envelope}</span>
                  <span className="envelope-category-icon">
                    {category === 'need' && '🛒'}
                    {category === 'want' && '🎉'}
                    {category === 'saving' && '💰'}
                  </span>
                </span>
                <span>{spent.toFixed(0)}/{budget.toFixed(0)}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: percentage > 100 ? '#ef4444' : '#6366f1'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
