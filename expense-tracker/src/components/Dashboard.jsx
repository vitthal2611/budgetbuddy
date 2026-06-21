import React from 'react';
import { useData } from '../contexts/DataContext';
import { computeCategorySummary, computeTotals, formatMonthLabel } from '../utils/calculations';

export default function Dashboard({ monthKey }) {
  const { categories, transactions } = useData();
  const totals = computeTotals(transactions, monthKey);
  const summary = computeCategorySummary(categories, transactions, monthKey);

  return (
    <div className="panel">
      <h2>{formatMonthLabel(monthKey)} Overview</h2>

      <div className="totals-row">
        <div className="total-card income">
          <span className="total-label">Income</span>
          <span className="total-value">₹{totals.income.toLocaleString('en-IN')}</span>
        </div>
        <div className="total-card expense">
          <span className="total-label">Expense</span>
          <span className="total-value">₹{totals.expense.toLocaleString('en-IN')}</span>
        </div>
        <div className={`total-card net ${totals.net < 0 ? 'negative' : 'positive'}`}>
          <span className="total-label">Net</span>
          <span className="total-value">₹{totals.net.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {summary.length === 0 ? (
        <p className="empty-hint">Add a category to start tracking budget utilization.</p>
      ) : (
        <div className="category-cards">
          {summary.map((cat) => (
            <div key={cat.id} className={`category-card ${cat.isOverBudget ? 'over-budget' : ''}`}>
              <div className="category-card-header">
                <span className="cat-name">{cat.name}</span>
                <span className={`cat-remaining ${cat.isOverBudget ? 'negative' : 'positive'}`}>
                  ₹{cat.remaining.toLocaleString('en-IN')} left
                </span>
              </div>
              <div className="budget-bar">
                <div
                  className={`budget-bar-fill ${cat.isOverBudget ? 'over' : ''}`}
                  style={{ width: `${Math.min(cat.percent, 100)}%` }}
                />
              </div>
              <div className="category-card-footer">
                <span>
                  ₹{cat.spent.toLocaleString('en-IN')} of ₹{cat.monthlyBudget.toLocaleString('en-IN')}
                </span>
                <span>{cat.percent.toFixed(0)}% used</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
