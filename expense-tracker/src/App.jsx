import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CategoryManager from './components/CategoryManager';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import History from './components/History';
import { currentMonthKey } from './utils/calculations';

const TABS = ['Dashboard', 'Add', 'Entries', 'Categories', 'History'];

function AppShell() {
  const { user, signOut } = useAuth();
  const { loading } = useData();
  const [tab, setTab] = useState('Dashboard');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());

  if (!user) return <Login />;
  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Expense Tracker</h1>
        <button type="button" className="link-button" onClick={signOut}>
          Sign out
        </button>
      </header>

      <main className="app-main">
        {tab === 'Dashboard' && <Dashboard monthKey={selectedMonth} />}
        {tab === 'Add' && <TransactionForm />}
        {tab === 'Entries' && <TransactionList monthKey={selectedMonth} />}
        {tab === 'Categories' && <CategoryManager />}
        {tab === 'History' && (
          <History selectedMonth={selectedMonth} onSelectMonth={setSelectedMonth} />
        )}
      </main>

      <nav className="app-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={tab === t ? 'active' : ''}
            onClick={() => setTab(t)}
            type="button"
          >
            {t}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppShell />
    </DataProvider>
  );
}
