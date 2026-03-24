import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import BudgetAllocation from './components/BudgetAllocation';
import TransactionModal from './components/TransactionModal';
import Auth from './components/Auth';
import { DataProvider } from './contexts/DataContext';
import authService from './services/authService';
import cloudStorage from './services/cloudStorage';

function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // App state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('expense');
  const [editTransaction, setEditTransaction] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [transactionFilters, setTransactionFilters] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Listen to auth state changes - ALWAYS CHECK AUTH FIRST
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user);
      setAuthLoading(false);
      
      if (!user) {
        // User signed out, clear data
        setTransactions([]);
        setBudgets({});
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to real-time cloud data when user is authenticated
  useEffect(() => {
    if (!user) return;

    setSyncing(true);

    // Subscribe to transactions
    const unsubTransactions = cloudStorage.subscribeToTransactions((data) => {
      setTransactions(data);
      setSyncing(false);
    });

    // Subscribe to budgets
    const unsubBudgets = cloudStorage.subscribeToBudgets((data) => {
      setBudgets(data);
    });

    // Cleanup subscriptions
    return () => {
      unsubTransactions();
      unsubBudgets();
    };
  }, [user]);

  // LEGACY: Load from localStorage (for migration)
  useEffect(() => {
    if (!user) return;
    
    const savedTransactions = localStorage.getItem('transactions');
    const savedBudgets = localStorage.getItem('budgets');
    
    if (savedTransactions) {
      const parsed = JSON.parse(savedTransactions);
      
      // Migration: Convert old dual-transaction transfers to single transactions
      // Note: Old format used numeric IDs with optional "-source"/"-dest" suffix
      // New format uses "timestamp-randomstring" (e.g., "1711276200000-k3j9x2m4p")
      const migratedTransactions = [];
      const processedTransferIds = new Set();
      
      parsed.forEach(t => {
        if (t.type === 'transfer' && t.isSource !== undefined) {
          // Old format transfer (has isSource property)
          // Old IDs were like: 123456789 or 123456789-source
          const idStr = t.id.toString();
          const baseId = idStr.endsWith('-source') || idStr.endsWith('-dest') 
            ? idStr.substring(0, idStr.lastIndexOf('-'))
            : idStr;
          
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
          // Keep non-transfer or already migrated transfers (including new format)
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
    try {
      localStorage.setItem('transactions', JSON.stringify(transactions));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        alert(
          '⚠️ Storage Limit Reached!\n\n' +
          'Your browser storage is full. Please:\n' +
          '1. Export your data as backup\n' +
          '2. Delete old transactions\n' +
          '3. Clear browser cache\n\n' +
          'Your recent changes may not be saved.'
        );
        console.error('localStorage quota exceeded:', e);
      } else {
        console.error('Error saving transactions:', e);
      }
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem('budgets', JSON.stringify(budgets));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded for budgets:', e);
      } else {
        console.error('Error saving budgets:', e);
      }
    }
  }, [budgets]);

  // Handle import transactions event
  useEffect(() => {
    const handleImportEvent = (event) => {
      const importedTransactions = event.detail;
      console.log('Import event received in App.js:', importedTransactions.length, 'transactions');
      
      setTransactions(prevTransactions => {
        const newTransactions = [...prevTransactions, ...importedTransactions];
        console.log('Previous transactions:', prevTransactions.length);
        console.log('New total transactions:', newTransactions.length);
        return newTransactions;
      });
    };

    window.addEventListener('importTransactions', handleImportEvent);
    console.log('Import event listener registered');
    
    return () => {
      window.removeEventListener('importTransactions', handleImportEvent);
      console.log('Import event listener removed');
    };
  }, []);

  // Handle undo import event
  useEffect(() => {
    const handleUndoImport = (event) => {
      const { transactions: importedTransactions } = event.detail;
      console.log('Undo import event received:', importedTransactions.length, 'transactions');
      
      setTransactions(prevTransactions => {
        // Create a Set of imported transaction IDs for efficient lookup
        const importedIds = new Set(importedTransactions.map(t => t.id));
        
        // Filter out the imported transactions
        const filtered = prevTransactions.filter(t => !importedIds.has(t.id));
        
        console.log('Removed', prevTransactions.length - filtered.length, 'transactions');
        console.log('Remaining transactions:', filtered.length);
        
        return filtered;
      });
    };

    window.addEventListener('undoImport', handleUndoImport);
    console.log('Undo import event listener registered');
    
    return () => {
      window.removeEventListener('undoImport', handleUndoImport);
      console.log('Undo import event listener removed');
    };
  }, []);

  // Handle tab switch event
  useEffect(() => {
    const handleTabSwitch = (event) => {
      const tab = event.detail;
      console.log('Switching to tab:', tab);
      setActiveTab(tab);
    };

    window.addEventListener('switchTab', handleTabSwitch);
    return () => window.removeEventListener('switchTab', handleTabSwitch);
  }, []);

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

  const handleSaveTransaction = async (transaction) => {
    try {
      if (editTransaction) {
        await cloudStorage.updateTransaction(editTransaction.id, transaction);
      } else {
        await cloudStorage.addTransaction(transaction);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Save transaction error:', error);
      alert('Failed to save transaction. Please try again.');
    }
  };

  const handleDeleteTransaction = async (id) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    // Build confirmation message
    const typeIcon = transaction.type === 'income' ? '💰' : 
                     transaction.type === 'expense' ? '💸' : '🔄';
    
    let details = `${transaction.date} • ₹${transaction.amount}\n${transaction.note}`;
    
    if (transaction.type === 'transfer') {
      details += `\n${transaction.sourceAccount} → ${transaction.destinationAccount}`;
    } else {
      details += `\n${transaction.paymentMethod}`;
      if (transaction.envelope) {
        details += ` • ${transaction.envelope}`;
      }
    }

    const confirmMsg = 
      `${typeIcon} Delete this transaction?\n\n` +
      `${details}\n\n` +
      `⚠️ This action cannot be undone.`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      await cloudStorage.deleteTransaction(id);
    } catch (error) {
      console.error('Delete transaction error:', error);
      alert('Failed to delete transaction. Please try again.');
    }
  };

  const handleViewTransactions = (filters) => {
    setTransactionFilters(filters);
    setActiveTab('transactions');
  };

  const handleExportData = async () => {
    try {
      const exportData = await cloudStorage.exportAllData();
      
      // Add statistics
      exportData.statistics = {
        totalTransactions: transactions.length,
        totalIncome: transactions.filter(t => t.type === 'income')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0),
        totalExpense: transactions.filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0),
      };

      // Create JSON file
      const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], 
        { type: 'application/json' });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      const jsonLink = document.createElement('a');
      jsonLink.href = jsonUrl;
      jsonLink.download = `budgetbuddy-backup-${Date.now()}.json`;
      jsonLink.click();
      URL.revokeObjectURL(jsonUrl);

      alert('✅ Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Export failed. Please try again.');
    }
  };

  const handleSignOut = async () => {
    if (window.confirm('Sign out from Budget Buddy?')) {
      try {
        await authService.signOut();
      } catch (error) {
        console.error('Sign out error:', error);
        alert('Failed to sign out. Please try again.');
      }
    }
  };

  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show auth screen if not logged in - ALWAYS AUTH FIRST
  if (!user) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  // Show main app only after authentication
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
          <button 
            className="export-btn" 
            onClick={handleExportData}
            title="Export all data as backup"
          >
            📥 Export
          </button>
          <button 
            className="signout-btn" 
            onClick={handleSignOut}
            title="Sign out"
          >
            👤 Sign Out
          </button>
        </div>

        {syncing && (
          <div className="sync-indicator">
            <span className="sync-icon">🔄</span>
            Syncing...
          </div>
        )}

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
              setBudgets={async (newBudgets) => {
                try {
                  await cloudStorage.saveBudgets(newBudgets);
                } catch (error) {
                  console.error('Save budgets error:', error);
                  alert('Failed to save budgets. Please try again.');
                }
              }}
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
          <button 
            className={showMenu ? 'active' : ''} 
            onClick={() => setShowMenu(!showMenu)}
          >
            <span className="nav-icon">⚙️</span>
            <span>Menu</span>
          </button>
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <div className="mobile-menu-overlay" onClick={() => setShowMenu(false)}>
            <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-menu-header">
                <h3>Menu</h3>
                <button className="close-menu" onClick={() => setShowMenu(false)}>×</button>
              </div>
              
              <div className="mobile-menu-user">
                <div className="user-avatar">👤</div>
                <div className="user-info">
                  <div className="user-email">{user?.email}</div>
                  <div className="user-status">Signed in</div>
                </div>
              </div>

              <div className="mobile-menu-items">
                <button className="menu-item" onClick={() => { handleExportData(); setShowMenu(false); }}>
                  <span className="menu-icon">📥</span>
                  <div className="menu-text">
                    <div className="menu-title">Export Data</div>
                    <div className="menu-subtitle">Download backup</div>
                  </div>
                </button>

                <button className="menu-item danger" onClick={() => { handleSignOut(); setShowMenu(false); }}>
                  <span className="menu-icon">🚪</span>
                  <div className="menu-text">
                    <div className="menu-title">Sign Out</div>
                    <div className="menu-subtitle">Log out of your account</div>
                  </div>
                </button>
              </div>

              <div className="mobile-menu-footer">
                <div className="app-version">Budget Buddy v1.0</div>
              </div>
            </div>
          </div>
        )}

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
