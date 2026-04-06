import React, { useState, useMemo } from 'react';
import './Reports.css';
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useData } from '../../contexts/DataContext';

const Reports = ({ transactions, budgets }) => {
  const { envelopes } = useData();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [reportType, setReportType] = useState('overview');

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];

  // Calculate spending by category
  const spendingByCategory = useMemo(() => {
    const categorySpending = { need: 0, want: 0, saving: 0 };
    
    transactions
      .filter(t => {
        if (t.type !== 'expense') return false;
        const tDate = new Date(t.date.split('-').reverse().join('-'));
        return tDate.getFullYear() === selectedYear && tDate.getMonth() === selectedMonth;
      })
      .forEach(t => {
        const envelope = envelopes.find(e => e.name === t.envelope);
        if (envelope) {
          categorySpending[envelope.category] += parseFloat(t.amount);
        }
      });

    return [
      { name: 'Needs', value: categorySpending.need, color: '#3b82f6' },
      { name: 'Wants', value: categorySpending.want, color: '#8b5cf6' },
      { name: 'Savings', value: categorySpending.saving, color: '#10b981' }
    ].filter(item => item.value > 0);
  }, [transactions, envelopes, selectedYear, selectedMonth]);

  // Calculate spending by envelope
  const spendingByEnvelope = useMemo(() => {
    const envelopeSpending = {};
    
    transactions
      .filter(t => {
        if (t.type !== 'expense') return false;
        const tDate = new Date(t.date.split('-').reverse().join('-'));
        return tDate.getFullYear() === selectedYear && tDate.getMonth() === selectedMonth;
      })
      .forEach(t => {
        envelopeSpending[t.envelope] = (envelopeSpending[t.envelope] || 0) + parseFloat(t.amount);
      });

    return Object.entries(envelopeSpending)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [transactions, selectedYear, selectedMonth]);

  // Calculate monthly trends (last 6 months)
  const monthlyTrends = useMemo(() => {
    const trends = [];
    
    for (let i = 5; i >= 0; i--) {
      let month = selectedMonth - i;
      let year = selectedYear;
      
      while (month < 0) {
        month += 12;
        year -= 1;
      }
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date.split('-').reverse().join('-'));
        return tDate.getFullYear() === year && tDate.getMonth() === month;
      });
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      trends.push({
        month: months[month].substring(0, 3),
        income,
        expenses,
        savings: income - expenses
      });
    }
    
    return trends;
  }, [transactions, selectedYear, selectedMonth, months]);

  // Calculate top expenses
  const topExpenses = useMemo(() => {
    return transactions
      .filter(t => {
        if (t.type !== 'expense') return false;
        const tDate = new Date(t.date.split('-').reverse().join('-'));
        return tDate.getFullYear() === selectedYear && tDate.getMonth() === selectedMonth;
      })
      .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
      .slice(0, 10);
  }, [transactions, selectedYear, selectedMonth]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date.split('-').reverse().join('-'));
      return tDate.getFullYear() === selectedYear && tDate.getMonth() === selectedMonth;
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const budgetKey = `${selectedYear}-${selectedMonth}`;
    const allocated = Object.values(budgets[budgetKey] || {})
      .reduce((sum, val) => sum + parseFloat(val || 0), 0);

    return {
      income,
      expenses,
      savings: income - expenses,
      allocated,
      unallocated: income - allocated,
      savingsRate: income > 0 ? ((income - expenses) / income * 100).toFixed(1) : 0
    };
  }, [transactions, budgets, selectedYear, selectedMonth]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>📊 Reports & Insights</h1>
        <div className="reports-controls">
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
            {[2024, 2025, 2026, 2027].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
            {months.map((month, idx) => (
              <option key={idx} value={idx}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="report-tabs">
        <button 
          className={reportType === 'overview' ? 'active' : ''}
          onClick={() => setReportType('overview')}
        >
          Overview
        </button>
        <button 
          className={reportType === 'trends' ? 'active' : ''}
          onClick={() => setReportType('trends')}
        >
          Trends
        </button>
        <button 
          className={reportType === 'breakdown' ? 'active' : ''}
          onClick={() => setReportType('breakdown')}
        >
          Breakdown
        </button>
      </div>

      {reportType === 'overview' && (
        <div className="report-content">
          <div className="summary-cards">
            <div className="summary-card income">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <div className="card-label">Total Income</div>
                <div className="card-value">₹{summary.income.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="summary-card expenses">
              <div className="card-icon">💸</div>
              <div className="card-content">
                <div className="card-label">Total Expenses</div>
                <div className="card-value">₹{summary.expenses.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="summary-card savings">
              <div className="card-icon">🎯</div>
              <div className="card-content">
                <div className="card-label">Net Savings</div>
                <div className="card-value">₹{summary.savings.toLocaleString('en-IN')}</div>
                <div className="card-subtitle">{summary.savingsRate}% savings rate</div>
              </div>
            </div>

            <div className="summary-card allocated">
              <div className="card-icon">📦</div>
              <div className="card-content">
                <div className="card-label">Allocated</div>
                <div className="card-value">₹{summary.allocated.toLocaleString('en-IN')}</div>
                <div className="card-subtitle">
                  {summary.unallocated >= 0 ? `₹${summary.unallocated.toLocaleString('en-IN')} unallocated` : 'Over-allocated'}
                </div>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3>Spending by Category</h3>
              {spendingByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={spendingByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {spendingByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data">No expenses this month</div>
              )}
            </div>

            <div className="chart-card">
              <h3>Top 10 Expenses</h3>
              {topExpenses.length > 0 ? (
                <div className="top-expenses-list">
                  {topExpenses.map((expense, idx) => (
                    <div key={expense.id} className="expense-item">
                      <div className="expense-rank">#{idx + 1}</div>
                      <div className="expense-details">
                        <div className="expense-note">{expense.note}</div>
                        <div className="expense-meta">{expense.envelope} • {expense.date}</div>
                      </div>
                      <div className="expense-amount">₹{parseFloat(expense.amount).toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">No expenses this month</div>
              )}
            </div>
          </div>
        </div>
      )}

      {reportType === 'trends' && (
        <div className="report-content">
          <div className="chart-card full-width">
            <h3>6-Month Trend</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                <Line type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={2} name="Savings" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="insights-section">
            <h3>💡 Insights</h3>
            <div className="insights-list">
              {summary.savingsRate > 20 && (
                <div className="insight-item positive">
                  <span className="insight-icon">🎉</span>
                  <span>Great job! You're saving {summary.savingsRate}% of your income.</span>
                </div>
              )}
              {summary.savingsRate < 10 && summary.income > 0 && (
                <div className="insight-item warning">
                  <span className="insight-icon">⚠️</span>
                  <span>Your savings rate is {summary.savingsRate}%. Consider reducing expenses.</span>
                </div>
              )}
              {summary.unallocated > 0 && (
                <div className="insight-item info">
                  <span className="insight-icon">💡</span>
                  <span>You have ₹{summary.unallocated.toLocaleString('en-IN')} unallocated. Fill your envelopes!</span>
                </div>
              )}
              {summary.expenses > summary.income && (
                <div className="insight-item danger">
                  <span className="insight-icon">🚨</span>
                  <span>You spent ₹{(summary.expenses - summary.income).toLocaleString('en-IN')} more than you earned!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {reportType === 'breakdown' && (
        <div className="report-content">
          <div className="chart-card full-width">
            <h3>Spending by Envelope</h3>
            {spendingByEnvelope.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={spendingByEnvelope}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                  <Bar dataKey="amount" fill="#3b82f6">
                    {spendingByEnvelope.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No expenses this month</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
