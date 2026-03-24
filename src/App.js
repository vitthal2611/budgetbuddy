import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import BudgetAllocation from './components/BudgetAllocation';
import TransactionModal from './components/TransactionModal';
import { DataProvider } from './contexts/DataContext';

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
    
    if (savedTransactions) {
      const parsed = JSON.parse(savedTransactions);
      
      // Migration: Convert old dual-transaction transfers to single transactions
      const migratedTransactions = [];
      const processedTransferIds = new Set();
      
      parsed.forEach(t => {
        if (t.type === 'transfer' && t.isSource !== undefined) {
          // Old format transfer
          const baseId = t.id.includes('-') ? t.id.split('-')[0] : t.id;
          
          if (!processedTransferIds.has(baseId)) {
            // Create single transfer transaction
            migratedTransactions.push({
              id: baseId,
              type: 'transfer',
              amount: t.amount,
              note: t.note,
              date: t.date,
              sourceAccount: t.sourceAccount,
              destinationAccount: t.destinationAccount
            });
            processedTransferIds.add(baseId);
          }
        } else if (t.type !== 'transfer' || t.isSource === undefined) {
          // Keep non-transfer or already migrated transfers
          migratedTransactions.push(t);
        }
      });
      
      setTransactions(migratedTransactions);
      
      // Save migrated data if migration occurred
      if (migratedTransactions.length !== parsed.length) {
        localStorage.setItem('transactions', JSON.stringify(migratedTransactions));
      }
    }
    
    if (savedBudgets) {
      setBudgets(JSON.parse(savedBudgets));
    }
  }, []);

  // Cleanup orphaned budget data on mount
  useEffect(() => {
    const cleanupOrphanedBudgets = () => {
      const savedEnvelopes = localStorage.getItem('envelopes');
      if (!savedEnvelopes || Object.keys(budgets).length === 0) return;
      
      const envelopeList = JSON.parse(savedEnvelopes);
      const validEnvelopeNames = new Set(envelopeList.map(env => env.name));
      
      // Also include envelopes from transactions (legacy support)
      transactions.forEach(t => {
        if (t.type === 'expense' && t.envelope) {
          validEnvelopeNames.add(t.envelope);
        }
      });
      
      let hasOrphanedData = false;
      const cleanedBudgets = { ...budgets };
      
      Object.keys(cleanedBudgets).forEach(monthKey => {
        const monthBudgets = cleanedBudgets[monthKey];
        Object.keys(monthBudgets).forEach(envelopeName => {
          if (!validEnvelopeNames.has(envelopeName)) {
            delete cleanedBudgets[monthKey][envelopeName];
            hasOrphanedData = true;
          }
        });
        
        // Remove empty month entries
        if (Object.keys(cleanedBudgets[monthKey]).length === 0) {
          delete cleanedBudgets[monthKey];
        }
      });
      
      if (hasOrphanedData) {
        console.log('Cleaned up orphaned budget data');
        setBudgets(cleanedBudgets);
      }
    };
    
    // Run cleanup after budgets and transactions are loaded
    if (Object.keys(budgets).length > 0 || transactions.length > 0) {
      cleanupOrphanedBudgets();
    }
  }, []); // Only run once on mount

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
    // For new single-transaction transfers, just delete the one transaction
    // For old dual-transaction transfers, delete both (migration safety)
    const baseId = id.includes('-') ? id.split('-')[0] : id;
    setTransactions(transactions.filter(t => {
      const tBaseId = t.id.toString().includes('-') ? t.id.toString().split('-')[0] : t.id.toString();
      return tBaseId !== baseId.toString();
    }));
  };

  const handleViewTransactions = (filters) => {
    setTransactionFilters(filters);
    setActiveTab('transactions');
  };

  return (
    <DataProvider>
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
    </DataProvider>
  );
}

export default App;
