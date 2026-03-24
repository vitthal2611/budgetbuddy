import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import BudgetAllocation from './components/BudgetAllocation';
import TransactionModal from './components/TransactionModal';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('expense');
  const [editTransaction, setEditTransaction] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [transactionFilters, setTransactionFilters] = useState({});

  useEffect(() => {
    const savedTransactions = localStorage.getItem('transactions');
    const savedBudgets = localStorage.getItem('budgets');
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
    if (savedBudgets) setBudgets(JSON.parse(savedBudgets));
  }, []);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('budgets', JSON.stringify(budgets));
  }, [budgets]);

  const handleAddTransaction = (type) => {
    setModalType(type);
    setEditTransaction(null);
    setShowModal(true);
  };

  const handleEditTransaction = (transaction) => {
    setEditTransaction(transaction);
    setModalType(transaction.type);
    setShowModal(true);
  };

  const handleSaveTransaction = (transaction) => {
    if (editTransaction) {
      setTransactions(transactions.map(t => t.id === editTransaction.id ? transaction : t));
    } else {
      setTransactions([...transactions, transaction]);
    }
    setShowModal(false);
  };

  const handleDeleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const handleViewTransactions = (filters) => {
    setTransactionFilters(filters);
    setActiveTab('transactions');
  };

  return (
    <div className="App">
      <div className="tabs">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''} 
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'transactions' ? 'active' : ''} 
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
        <button 
          className={activeTab === 'budget' ? 'active' : ''} 
          onClick={() => setActiveTab('budget')}
        >
          Budget
        </button>
      </div>

      <div className="content">
        {activeTab === 'dashboard' && (
          <Dashboard 
            transactions={transactions}
            budgets={budgets}
            onAddTransaction={handleAddTransaction}
            onViewTransactions={handleViewTransactions}
          />
        )}
        {activeTab === 'transactions' && (
          <Transactions 
            transactions={transactions}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            initialFilters={transactionFilters}
            onFiltersCleared={() => setTransactionFilters({})}
          />
        )}
        {activeTab === 'budget' && (
          <BudgetAllocation 
            budgets={budgets}
            setBudgets={setBudgets}
            transactions={transactions}
          />
        )}
      </div>

      <div className="bottom-nav">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''} 
          onClick={() => setActiveTab('dashboard')}
        >
          <span className="nav-icon">📊</span>
          <span>Dashboard</span>
        </button>
        <button 
          className={activeTab === 'transactions' ? 'active' : ''} 
          onClick={() => setActiveTab('transactions')}
        >
          <span className="nav-icon">💳</span>
          <span>Transactions</span>
        </button>
        <button 
          className={activeTab === 'budget' ? 'active' : ''} 
          onClick={() => setActiveTab('budget')}
        >
          <span className="nav-icon">💰</span>
          <span>Budget</span>
        </button>
      </div>

      {showModal && (
        <TransactionModal
          type={modalType}
          transaction={editTransaction}
          onSave={handleSaveTransaction}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

export default App;
