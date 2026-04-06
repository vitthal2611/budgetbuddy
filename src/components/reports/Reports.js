import React, { useState, useMemo } from 'react';
import './Reports.css';
import {
  PieChart, Pie, Cell,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useData } from '../../contexts/DataContext';

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const MONTHS_SHORT = MONTHS.map(m => m.slice(0, 3));
const CAT_COLORS = { need: '#10b981', want: '#f59e0b', saving: '#3b82f6' };
const PALETTE = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16'];

const fmt = (n) => Math.abs(n).toLocaleString('en-IN');
const parseDate = (ddmmyyyy) => { const [d,m,y] = ddmmyyyy.split('-'); return new Date(y, m-1, d); };

const Reports = ({ transactions, budgets }) => {
  const { envelopes } = useData();
  const today = new Date();

  const [selYear,  setSelYear]  = useState(today.getFullYear());
  const [selMonth, setSelMonth] = useState(today.getMonth());
  const [tab, setTab] = useState('overview');

  // ── Month navigation ──────────────────────────────────────────
  const prevMonth = () => {
    if (selMonth === 0) { setSelMonth(11); setSelYear(y => y - 1); }
    else setSelMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (selMonth === 11) { setSelMonth(0); setSelYear(y => y + 1); }
    else setSelMonth(m => m + 1);
  };

  // ── Month transactions ────────────────────────────────────────
  const monthTx = useMemo(() => transactions.filter(t => {
    const d = parseDate(t.date);
    return d.getFullYear() === selYear && d.getMonth() === selMonth;
  }), [transactions, selYear, selMonth]);

  // ── Summary ───────────────────────────────────────────────────
  const summary = useMemo(() => {
    const income   = monthTx.filter(t => t.type === 'income').reduce((s,t) => s + parseFloat(t.amount), 0);
    const expenses = monthTx.filter(t => t.type === 'expense').reduce((s,t) => s + parseFloat(t.amount), 0);
    const budgetKey = `${selYear}-${selMonth}`;
    const allocated = Object.values(budgets[budgetKey] || {}).reduce((s,v) => s + parseFloat(v||0), 0);
    const savingsRate = income > 0 ? ((income - expenses) / income * 100) : 0;
    return { income, expenses, net: income - expenses, allocated, unallocated: income - allocated, savingsRate };
  }, [monthTx, budgets, selYear, selMonth]);

  // ── Spending by category (pie) ────────────────────────────────
  const categoryData = useMemo(() => {
    const totals = { need: 0, want: 0, saving: 0 };
    monthTx.filter(t => t.type === 'expense').forEach(t => {
      const env = envelopes.find(e => e.name === t.envelope);
      if (env) totals[env.category] += parseFloat(t.amount);
    });
    return [
      { name: 'Needs',   value: totals.need,   color: CAT_COLORS.need   },
      { name: 'Wants',   value: totals.want,   color: CAT_COLORS.want   },
      { name: 'Savings', value: totals.saving, color: CAT_COLORS.saving },
    ].filter(d => d.value > 0);
  }, [monthTx, envelopes]);

  // ── Top expenses ──────────────────────────────────────────────
  const topExpenses = useMemo(() =>
    monthTx
      .filter(t => t.type === 'expense' && parseFloat(t.amount) > 0)
      .sort((a,b) => parseFloat(b.amount) - parseFloat(a.amount))
      .slice(0, 8),
    [monthTx]
  );

  // ── Budget vs Actual ──────────────────────────────────────────
  const bvaData = useMemo(() => {
    const budgetKey = `${selYear}-${selMonth}`;
    const monthBudgets = budgets[budgetKey] || {};
    const spending = {};
    monthTx.filter(t => t.type === 'expense' && t.envelope).forEach(t => {
      spending[t.envelope] = (spending[t.envelope] || 0) + parseFloat(t.amount);
    });
    const allNames = new Set([
      ...envelopes.map(e => e.name),
      ...Object.keys(monthBudgets),
      ...Object.keys(spending),
    ]);
    return Array.from(allNames).map(name => {
      const budgeted  = parseFloat(monthBudgets[name] || 0);
      const spent     = parseFloat(spending[name]     || 0);
      const remaining = budgeted - spent;
      const pct       = budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0;
      const env       = envelopes.find(e => e.name === name);
      return { name, budgeted, spent, remaining, pct, category: env?.category || 'need', isOver: remaining < 0 };
    }).sort((a,b) => b.spent - a.spent);
  }, [monthTx, budgets, envelopes, selYear, selMonth]);

  // ── 6-month trend ─────────────────────────────────────────────
  const trendData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      let m = selMonth - (5 - i);
      let y = selYear;
      while (m < 0) { m += 12; y--; }
      const tx = transactions.filter(t => {
        const d = parseDate(t.date);
        return d.getFullYear() === y && d.getMonth() === m;
      });
      const income   = tx.filter(t => t.type === 'income').reduce((s,t) => s + parseFloat(t.amount), 0);
      const expenses = tx.filter(t => t.type === 'expense').reduce((s,t) => s + parseFloat(t.amount), 0);
      return { month: MONTHS_SHORT[m], income, expenses, net: income - expenses };
    });
  }, [transactions, selYear, selMonth]);

  // ── Insights ──────────────────────────────────────────────────
  const insights = useMemo(() => {
    const list = [];
    if (summary.expenses > summary.income && summary.income > 0)
      list.push({ type: 'danger', icon: '🚨', text: `Spent ₹${fmt(summary.expenses - summary.income)} more than earned this month.` });
    if (summary.savingsRate >= 20)
      list.push({ type: 'positive', icon: '🎉', text: `Saving ${summary.savingsRate.toFixed(1)}% of income — great discipline!` });
    else if (summary.savingsRate > 0 && summary.savingsRate < 10)
      list.push({ type: 'warning', icon: '⚠️', text: `Savings rate is ${summary.savingsRate.toFixed(1)}%. Try to reach 20%.` });
    if (summary.unallocated > 0)
      list.push({ type: 'info', icon: '💡', text: `₹${fmt(summary.unallocated)} unallocated — fill your envelopes to reach ₹0.` });
    const overBudget = bvaData.filter(e => e.isOver);
    if (overBudget.length > 0)
      list.push({ type: 'warning', icon: '📦', text: `${overBudget.length} envelope${overBudget.length > 1 ? 's' : ''} over budget: ${overBudget.map(e => e.name).join(', ')}.` });
    return list;
  }, [summary, bvaData]);

  const hasData = monthTx.length > 0;

  // ── Custom pie label ──────────────────────────────────────────
  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    if (percent < 0.08) return null;
    const RADIAN = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="rp-root">

      {/* ── Sticky header ── */}
      <div className="rp-header">
        <div className="rp-header-top">
          <h1 className="rp-title">Reports</h1>
        </div>

        {/* Month nav */}
        <div className="rp-month-nav">
          <button className="rp-arrow" onClick={prevMonth}>‹</button>
          <span className="rp-month-label">{MONTHS[selMonth]} {selYear}</span>
          <button className="rp-arrow" onClick={nextMonth}>›</button>
        </div>

        {/* Tab bar */}
        <div className="rp-tabs">
          {[
            { id: 'overview',  label: 'Overview'  },
            { id: 'budget',    label: 'Budget'    },
            { id: 'trends',    label: 'Trends'    },
            { id: 'breakdown', label: 'Breakdown' },
          ].map(t => (
            <button
              key={t.id}
              className={`rp-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="rp-scroll">

        {!hasData ? (
          <div className="rp-empty">
            <div className="rp-empty-icon">📊</div>
            <div className="rp-empty-title">No data for {MONTHS[selMonth]}</div>
            <div className="rp-empty-sub">Add transactions to see reports</div>
          </div>
        ) : (
          <>
            {/* ── OVERVIEW ── */}
            {tab === 'overview' && (
              <div className="rp-content">

                {/* KPI strip */}
                <div className="rp-kpi-strip">
                  <div className="rp-kpi">
                    <span className="rp-kpi-label">Income</span>
                    <span className="rp-kpi-value income">+₹{fmt(summary.income)}</span>
                  </div>
                  <div className="rp-kpi-div" />
                  <div className="rp-kpi">
                    <span className="rp-kpi-label">Expense</span>
                    <span className="rp-kpi-value expense">-₹{fmt(summary.expenses)}</span>
                  </div>
                  <div className="rp-kpi-div" />
                  <div className="rp-kpi">
                    <span className="rp-kpi-label">Saved</span>
                    <span className={`rp-kpi-value ${summary.net >= 0 ? 'income' : 'expense'}`}>
                      {summary.net >= 0 ? '+' : '-'}₹{fmt(summary.net)}
                    </span>
                  </div>
                  <div className="rp-kpi-div" />
                  <div className="rp-kpi">
                    <span className="rp-kpi-label">Rate</span>
                    <span className={`rp-kpi-value ${summary.savingsRate >= 20 ? 'income' : summary.savingsRate < 0 ? 'expense' : 'neutral'}`}>
                      {summary.savingsRate.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Insights */}
                {insights.length > 0 && (
                  <div className="rp-section">
                    <div className="rp-section-title">Insights</div>
                    <div className="rp-insights">
                      {insights.map((ins, i) => (
                        <div key={i} className={`rp-insight ${ins.type}`}>
                          <span className="rp-insight-icon">{ins.icon}</span>
                          <span>{ins.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Spending by category — pie */}
                {categoryData.length > 0 && (
                  <div className="rp-section">
                    <div className="rp-section-title">Spending by Category</div>
                    <div className="rp-card">
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%" cy="50%"
                            outerRadius={90}
                            dataKey="value"
                            labelLine={false}
                            label={renderPieLabel}
                          >
                            {categoryData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => `₹${fmt(v)}`} />
                          <Legend iconType="circle" iconSize={10} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Top expenses */}
                {topExpenses.length > 0 && (
                  <div className="rp-section">
                    <div className="rp-section-title">Top Expenses</div>
                    <div className="rp-card">
                      {topExpenses.map((t, i) => (
                        <div key={t.id} className={`rp-top-row ${i < topExpenses.length - 1 ? 'bordered' : ''}`}>
                          <span className="rp-top-rank">#{i + 1}</span>
                          <div className="rp-top-body">
                            <span className="rp-top-note">{t.note}</span>
                            <span className="rp-top-meta">{t.envelope} · {t.date}</span>
                          </div>
                          <span className="rp-top-amt">-₹{fmt(t.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── BUDGET VS ACTUAL ── */}
            {tab === 'budget' && (
              <div className="rp-content">
                <div className="rp-section">
                  <div className="rp-section-title">Budget vs Actual — {MONTHS[selMonth]} {selYear}</div>
                  {bvaData.length === 0 ? (
                    <div className="rp-no-data">No envelope data this month</div>
                  ) : (
                    <div className="rp-card">
                      {bvaData.map((item, i) => (
                        <div key={item.name} className={`rp-bva-row ${i < bvaData.length - 1 ? 'bordered' : ''}`}>
                          <div className="rp-bva-top">
                            <span className={`rp-bva-name ${item.isOver ? 'over' : ''}`}>{item.name}</span>
                            <span className={`rp-bva-rem ${item.isOver ? 'neg' : 'pos'}`}>
                              {item.isOver ? '-' : ''}₹{fmt(item.remaining)} {item.isOver ? 'over' : 'left'}
                            </span>
                          </div>
                          <div className="rp-bva-bar">
                            <div
                              className={`rp-bva-fill ${item.isOver ? 'over' : item.category}`}
                              style={{ width: `${item.pct}%` }}
                            />
                          </div>
                          <div className="rp-bva-meta">
                            <span>Spent ₹{fmt(item.spent)}</span>
                            <span>Budget ₹{fmt(item.budgeted)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TRENDS ── */}
            {tab === 'trends' && (
              <div className="rp-content">
                <div className="rp-section">
                  <div className="rp-section-title">6-Month Trend</div>
                  <div className="rp-card rp-chart-wrap">
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={trendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v) => `₹${fmt(v)}`} />
                        <Legend iconType="circle" iconSize={8} />
                        <Line type="monotone" dataKey="income"   stroke="#10b981" strokeWidth={2} dot={false} name="Income"   />
                        <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={false} name="Expenses" />
                        <Line type="monotone" dataKey="net"      stroke="#6366f1" strokeWidth={2} dot={false} name="Net"      strokeDasharray="4 2" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Monthly table */}
                <div className="rp-section">
                  <div className="rp-section-title">Monthly Summary</div>
                  <div className="rp-card">
                    <div className="rp-trend-table-head">
                      <span>Month</span><span>Income</span><span>Expense</span><span>Net</span>
                    </div>
                    {trendData.map((row, i) => (
                      <div key={i} className={`rp-trend-row ${i < trendData.length - 1 ? 'bordered' : ''}`}>
                        <span className="rp-trend-month">{row.month}</span>
                        <span className="rp-trend-income">+₹{fmt(row.income)}</span>
                        <span className="rp-trend-expense">-₹{fmt(row.expenses)}</span>
                        <span className={`rp-trend-net ${row.net >= 0 ? 'pos' : 'neg'}`}>
                          {row.net >= 0 ? '+' : '-'}₹{fmt(row.net)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── BREAKDOWN ── */}
            {tab === 'breakdown' && (
              <div className="rp-content">
                <div className="rp-section">
                  <div className="rp-section-title">Spending by Envelope</div>
                  {bvaData.filter(e => e.spent > 0).length === 0 ? (
                    <div className="rp-no-data">No expenses this month</div>
                  ) : (
                    <>
                      {/* Horizontal bar chart — easier to read on mobile */}
                      <div className="rp-card rp-chart-wrap">
                        <ResponsiveContainer width="100%" height={Math.max(200, bvaData.filter(e => e.spent > 0).length * 36)}>
                          <BarChart
                            data={bvaData.filter(e => e.spent > 0).slice(0, 10)}
                            layout="vertical"
                            margin={{ top: 4, right: 60, left: 4, bottom: 4 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
                            <Tooltip formatter={(v) => `₹${fmt(v)}`} />
                            <Bar dataKey="spent" radius={[0, 4, 4, 0]}>
                              {bvaData.filter(e => e.spent > 0).slice(0, 10).map((entry, i) => (
                                <Cell key={i} fill={CAT_COLORS[entry.category] || PALETTE[i % PALETTE.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* List with % of total */}
                      <div className="rp-card" style={{ marginTop: 12 }}>
                        {bvaData.filter(e => e.spent > 0).map((item, i, arr) => {
                          const totalSpent = arr.reduce((s, e) => s + e.spent, 0);
                          const pct = totalSpent > 0 ? (item.spent / totalSpent * 100).toFixed(1) : 0;
                          return (
                            <div key={item.name} className={`rp-breakdown-row ${i < arr.length - 1 ? 'bordered' : ''}`}>
                              <div className="rp-breakdown-dot" style={{ background: CAT_COLORS[item.category] || '#6366f1' }} />
                              <span className="rp-breakdown-name">{item.name}</span>
                              <span className="rp-breakdown-pct">{pct}%</span>
                              <span className="rp-breakdown-amt">₹{fmt(item.spent)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;
