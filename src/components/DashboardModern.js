import React, { useState, useMemo, useEffect } from 'react';
import './Dashboard.modern.css';
import { useData } from '../contexts/DataContext';
import { safeSessionStorage } from '../utils/safeStorage';

const DashboardModern = ({ transactions, budgets, onAddTransaction, onViewTransactions }) => {
  const { getEnvelopeCategory } = useData();
  const currentDate = new Date();
  
  const [selectedYear, setSelectedYear] = useState(() => {
    const saved = safeSessionStorage.getItem('dashboardYear');
    return saved === 'all' ? 'all' : (saved ? Number(saved) : 'all');
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const saved = safeSessionStorage.getItem('dashboardMonth');
    if (saved && saved !== 'all' && !isNaN(saved)) {
      return Number(saved);
    }
    return currentDate.getMonth();
  });

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];

  const availableYears = useMemo(() => {
    const years = new Set();
    transactions.forEach(t => {
      const tDate = new Date(t.date.split('-').reverse().join('-'));
      years.add(tDate.getFullYear());
    });
    
    const currentYear = new Date().getFullYear();
    const startYear = Math.max(2026, currentYear);
    for (let year = startYear; year <= startYear + 4; year++) {
      years.add(year);
    }
    
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  useEffect(() => {
    safeSessionStorage.setItem('dashboardYear', selectedYear.toString());
  }, [selectedYear]);

  useEffect(() => {
    safeSessionStorage.setItem('dashboardMonth', selectedMonth.toString());
  }, [selectedMonth]);

  const filteredTran