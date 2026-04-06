import React, { useState, useEffect } from 'react';
import './App.css';
import EnvelopesView from './components/EnvelopesView';
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
  const [activeTab, setActiveTab] = useState('envelopes');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('expense');
  const [editTransaction, setEditTransaction] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [transactionFilters, setTransactionFilters] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
    
    // Flag to prevent overwriting during initial load
    let isInitialLoad = true;

    // Subscribe to transactions
    const unsubTransactions = cloudStorage.subscribeToTransactions((data) => {
      if (isInitialLoad) {
        // First load: merge with any pending local changes
        setTransactions(prevLocal => {
          // If we have local transactions that aren't in cloud yet, keep them
          const cloudIds = new Set(data.map(t => t.id));
          const localOnly = prevLocal.filter(t => !cloudIds.has(t.id));
          
          if (localOnly.length > 0) {
            console.log(`Preserving ${localOnly.length} local-only transactions during initial sync`);
            return [...data, ...localOnly];
          }
          
          return data;
        });
        isInitialLoad = false;
      } else {
        // Subsequent updates: trust cloud as source of truth
        setTransactions(data);
      }
      setSyncing(false);
    });

    // Subscribe to budgets
    const unsubBudgets = cloudStorage.subscribeToBudgets((data) => {
      setBudgets(data);
    });

    // Subscribe to envelopes
    const unsubEnvelopes = cloudStorage.subscribeToEnvelopes((data) => {
      // Update localStorage so DataContext picks it up (even if empty)
      localStorage.setItem('envelopes', JSON.stringify(data || []));
      // Trigger a storage event to notify DataContext
      window.dispatchEvent(new CustomEvent('cloudEnvelopesLoaded', { detail: data || [] }));
    });

    // Subscribe to payment methods
    const unsubPaymentMethods = cloudStorage.subscribeToPaymentMethods((data) => {
      // Update localStorage so DataContext picks it up (even if empty)
      localStorage.setItem('paymentMethods', JSON.stringify(data || []));
      // Trigger a storage event to notify DataContext
      window.dispatchEvent(new CustomEvent('cloudPaymentMethodsLoaded', { detail: data || [] }));
    });

    // Cleanup subscriptions
    return () => {
      unsubTransactions();
      unsubBudgets();
      unsubEnvelopes();
      unsubPaymentMethods();
    };
  }, [user]);

  // ONE-TIME SYNC: Extract payment methods from transactions and sync to DataContext
  useEffect(() => {
    if (!user || transactions.length === 0) return;
    
    const syncPaymentMethodsFromTransactions = async () => {
      try {
        // Get current payment methods from localStorage
        const savedMethods = localStorage.getItem('paymentMethods');
        const currentMethods = savedMethods ? JSON.parse(savedMethods) : [];
        
        // If payment methods list is empty and we have transactions, sync them
        // But if both are empty, don't do anything (user might have deleted all data)
        if (currentMethods.length === 0 && transactions.length === 0) {
          return; // Both empty, nothing to sync
        }
        
        // Extract all unique payment methods from transactions
        const methodsFromTransactions = new Set();
        transactions.forEach(t => {
          if (t.paymentMethod) {
            methodsFromTransactions.add(t.paymentMethod);
          }
          if (t.sourceAccount) {
            methodsFromTransactions.add(t.sourceAccount);
          }
          if (t.destinationAccount) {
            methodsFromTransactions.add(t.destinationAccount);
          }
        });
        
        // Find methods that exist in transactions but not in payment methods list
        const missingMethods = Array.from(methodsFromTransactions).filter(
          method => !currentMethods.includes(method)
        );
        
        if (missingMethods.length > 0) {
          console.log(`Found ${missingMethods.length} payment methods in transactions that aren't in the list:`, missingMethods);
          
          // Add missing methods to the list
          const updatedMethods = [...currentMethods, ...missingMethods];
          
          // Update localStorage
          localStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
          
          // Sync to cloud
          await cloudStorage.savePaymentMethods(updatedMethods);
          
          // Trigger event to update DataContext
          window.dispatchEvent(new CustomEvent('cloudPaymentMethodsLoaded', { detail: updatedMethods }));
          
          console.log(`✅ Synced ${missingMethods.length} missing payment methods`);
        }
      } catch (error) {
        console.error('Failed to sync payment methods from transactions:', error);
      }
    };
    
    // Run once after transactions are loaded (but not immediately to avoid conflicts with delete)
    const timeoutId = setTimeout(syncPaymentMethodsFromTransactions, 3000);
    
    return () => clearTimeout(timeoutId);
  }, [user, transactions.length]); // Only run when user changes or transaction count changes

  // ONE-TIME MIGRATION: Load from localStorage and migrate to Firebase
  useEffect(() => {
    if (!user) return;
    
    const savedTransactions = localStorage.getItem('transactions');
    const savedBudgets = localStorage.getItem('budgets');
    
    // Only migrate if we have localStorage data
    if (savedTransactions || savedBudgets) {
      console.log('🔄 Migrating localStorage data to Firebase...');
      
      const migrateData = async () => {
        try {
          if (savedTransactions) {
            const parsed = JSON.parse(savedTransactions);
            
            // Migration: Convert old dual-transaction transfers to single transactions
            const migratedTransactions = [];
            const processedTransferIds = new Set();
            
            parsed.forEach(t => {
              if (t.type === 'transfer' && t.isSource !== undefined) {
                // Old format transfer (has isSource property)
                const idStr = t.id.toString();
                const baseId = idStr.endsWith('-source') || idStr.endsWith('-dest') 
                  ? idStr.substring(0, idStr.lastIndexOf('-'))
                  : idStr;
                
                if (!processedTransferIds.has(baseId)) {
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
                migratedTransactions.push(t);
              }
            });
            
            // Upload to Firebase using batch operation
            if (migratedTransactions.length > 0) {
              console.log(`Migrating ${migratedTransactions.length} transactions to Firebase...`);
              await cloudStorage.batchAddTransactions(migratedTransactions);
              console.log('✅ Transactions migrated to Firebase');
            }
          }
          
          if (savedBudgets) {
            const budgetsData = JSON.parse(savedBudgets);
            if (Object.keys(budgetsData).length > 0) {
              console.log('Migrating budgets to Firebase...');
              await cloudStorage.saveBudgets(budgetsData);
              console.log('✅ Budgets migrated to Firebase');
            }
          }
          
          // Clear localStorage after successful migration
          localStorage.removeItem('transactions');
          localStorage.removeItem('budgets');
          console.log('✅ Migration complete - localStorage cleared');
          
        } catch (error) {
          console.error('Migration error:', error);
          alert(
            '⚠️ Migration Warning\n\n' +
            'Failed to migrate some data to cloud.\n' +
            'Your data is safe in localStorage.\n\n' +
            'Please try refreshing the page.'
          );
        }
      };
      
      migrateData();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup orphaned budget data on mount
  useEffect(() => {
    const cleanupOrphanedBudgets = () => {
      if (Object.keys(budgets).length === 0) return;
      
      // Get valid envelope names from DataContext
      const validEnvelopeNames = new Set();
      
      // Include envelopes from transactions
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
  }, [budgets, transactions]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle import transactions event
  useEffect(() => {
    const handleImportEvent = async (event) => {
      const importedTransactions = event.detail;
      
      // Update local state immediately for responsive UI
      setTransactions(prevTransactions => {
        const newTransactions = [...prevTransactions, ...importedTransactions];
        return newTransactions;
      });

      // Sync to cloud storage in background using BATCH operations
      if (user) {
        setSyncing(true);
        
        try {
          // Use batch operation for much faster imports
          const successCount = await cloudStorage.batchAddTransactions(importedTransactions);
          const failCount = 0;
          
          if (failCount > 0) {
            alert(
              `⚠️ Partial Cloud Sync\n\n` +
              `${successCount} transactions synced successfully.\n` +
              `${failCount} transactions failed to sync.\n\n` +
              `Data is saved locally. Try exporting and re-importing if issues persist.`
            );
          }
        } catch (error) {
          console.error('Cloud sync error:', error);
          alert(
            '⚠️ Cloud Sync Failed\n\n' +
            'Import completed but cloud sync failed.\n' +
            'Data is saved locally only.\n\n' +
            'Your data will be available on this device but may not sync across devices until you refresh.'
          );
        } finally {
          setSyncing(false);
        }
      }
    };

    window.addEventListener('importTransactions', handleImportEvent);
    
    return () => {
      window.removeEventListener('importTransactions', handleImportEvent);
    };
  }, [user]);

  // Handle undo import event
  useEffect(() => {
    const handleUndoImport = async (event) => {
      const { transactions: importedTransactions } = event.detail;
      
      // Update local state immediately
      setTransactions(prevTransactions => {
        // Create a Set of imported transaction IDs for efficient lookup
        const importedIds = new Set(importedTransactions.map(t => t.id));
        
        // Filter out the imported transactions
        const filtered = prevTransactions.filter(t => !importedIds.has(t.id));
        
        return filtered;
      });

      // Sync deletion to cloud storage
      if (user) {
        setSyncing(true);
        
        try {
          let successCount = 0;
          let failCount = 0;
          
          // Delete each transaction from cloud storage
          for (const transaction of importedTransactions) {
            try {
              await cloudStorage.deleteTransaction(transaction.id);
              successCount++;
            } catch (error) {
              console.error(`Failed to delete transaction ${transaction.id}:`, error);
              failCount++;
            }
          }
          
          if (failCount > 0) {
            alert(
              `⚠️ Partial Undo Sync\n\n` +
              `${successCount} transactions removed from cloud.\n` +
              `${failCount} transactions failed to remove.\n\n` +
              `Local data updated. Refresh to see cloud state.`
            );
          }
        } catch (error) {
          console.error('Undo sync error:', error);
          alert(
            '⚠️ Cloud Sync Failed\n\n' +
            'Undo completed locally but cloud sync failed.\n' +
            'Refresh the page to see the current cloud state.'
          );
        } finally {
          setSyncing(false);
        }
      }
    };

    window.addEventListener('undoImport', handleUndoImport);
    
    return () => {
      window.removeEventListener('undoImport', handleUndoImport);
    };
  }, [user]);

  // Handle tab switch event
  useEffect(() => {
    const handleTabSwitch = (event) => {
      const tab = event.detail;
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
      console.log('Attempting to save transaction:', JSON.stringify(transaction, null, 2));
      
      // Optimistic update: Update UI immediately
      if (editTransaction) {
        // Editing existing transaction - preserve the ID
        const updatedTransaction = { ...transaction, id: editTransaction.id };
        setTransactions(prev => prev.map(t => 
          t.id === editTransaction.id ? updatedTransaction : t
        ));
        
        setShowModal(false);
        
        // Sync to cloud in background
        console.log('Updating transaction with ID:', editTransaction.id);
        await cloudStorage.updateTransaction(editTransaction.id, updatedTransaction);
        console.log('Transaction updated successfully');
      } else {
        // Adding new transaction
        setTransactions(prev => [...prev, transaction]);
        setShowModal(false);
        
        console.log('Adding new transaction');
        await cloudStorage.addTransaction(transaction);
        console.log('Transaction added successfully');
      }
    } catch (error) {
      console.error('Save transaction error:', error);
      console.error('Error details:', error.message, error.code);
      console.error('Transaction data:', JSON.stringify(transaction, null, 2));
      
      // Rollback on error
      if (editTransaction) {
        setTransactions(prev => prev.map(t => 
          t.id === editTransaction.id ? editTransaction : t
        ));
      } else {
        setTransactions(prev => prev.filter(t => t.id !== transaction.id));
      }
      
      alert(`Failed to save transaction: ${error.message || 'Please try again.'}`);
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

    // Store current state for rollback
    const previousTransactions = [...transactions];

    try {
      // Optimistic delete: Remove from UI immediately
      setTransactions(prev => prev.filter(t => t.id !== id));
      
      // Delete from cloud in background
      await cloudStorage.deleteTransaction(id);
    } catch (error) {
      console.error('Delete transaction error:', error);
      
      // Rollback on error
      setTransactions(previousTransactions);
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

  const handleDeleteAllData = async () => {
    const confirmMsg = 
      '⚠️ DELETE ALL DATA?\n\n' +
      'This will permanently delete:\n' +
      '• All transactions\n' +
      '• All budgets\n' +
      '• All envelopes\n' +
      '• All payment methods\n\n' +
      '🚨 THIS CANNOT BE UNDONE!\n\n' +
      'Type "DELETE" to confirm:';
    
    const userInput = window.prompt(confirmMsg);
    
    if (userInput !== 'DELETE') {
      if (userInput !== null) {
        alert('Deletion cancelled. You must type "DELETE" exactly to confirm.');
      }
      return;
    }

    try {
      setSyncing(true);
      
      // Delete from Firebase
      const result = await cloudStorage.deleteAllData();
      
      // Clear local state
      setTransactions([]);
      setBudgets({});
      
      // Clear localStorage
      localStorage.removeItem('transactions');
      localStorage.removeItem('budgets');
      localStorage.removeItem('envelopes');
      localStorage.removeItem('paymentMethods');
      
      // Set empty arrays in localStorage to ensure they're cleared
      localStorage.setItem('envelopes', JSON.stringify([]));
      localStorage.setItem('paymentMethods', JSON.stringify([]));
      
      // Trigger events to update DataContext
      window.dispatchEvent(new CustomEvent('cloudEnvelopesLoaded', { detail: [] }));
      window.dispatchEvent(new CustomEvent('cloudPaymentMethodsLoaded', { detail: [] }));
      
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSyncing(false);
      
      alert(
        `✅ All Data Deleted\n\n` +
        `${result.transactionsDeleted} transactions deleted\n` +
        `All budgets, envelopes, and payment methods cleared\n\n` +
        `Your account is now empty.`
      );
    } catch (error) {
      console.error('Delete all data error:', error);
      setSyncing(false);
      alert('❌ Failed to delete data. Please try again or contact support.');
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
            className={activeTab === 'envelopes' ? 'active' : ''} 
            onClick={() => setActiveTab('envelopes')}
          >
            Envelopes
          </button>
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
            className={activeTab === 'settings' ? 'active' : ''} 
            onClick={() => setActiveTab('settings')}
          >
            Settings
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

        {!isOnline && (
          <div className="offline-indicator">
            <span className="offline-icon">📡</span>
            Offline - Changes will sync when connected
          </div>
        )}

        <div className="content">
          {activeTab === 'envelopes' && (
            <EnvelopesView 
              transactions={transactions}
              budgets={budgets}
              setBudgets={async (newBudgets) => {
                try {
                  await cloudStorage.saveBudgets(newBudgets);
                } catch (error) {
                  console.error('Save budgets error:', error);
                  alert('Failed to save budgets. Please try again.');
                }
              }}
              onAddTransaction={handleAddTransaction}
              onViewTransactions={handleViewTransactions}
            />
          )}
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
          {activeTab === 'settings' && (
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
            className={activeTab === 'envelopes' ? 'active' : ''} 
            onClick={() => setActiveTab('envelopes')}
          >
            <span className="nav-icon">📦</span>
            <span>Envelopes</span>
          </button>
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
                <button className="menu-item" onClick={() => { setActiveTab('settings'); setShowMenu(false); }}>
                  <span className="menu-icon">⚙️</span>
                  <div className="menu-text">
                    <div className="menu-title">Manage Envelopes</div>
                    <div className="menu-subtitle">Create, edit, delete envelopes</div>
                  </div>
                </button>

                <button className="menu-item" onClick={() => { handleExportData(); setShowMenu(false); }}>
                  <span className="menu-icon">📥</span>
                  <div className="menu-text">
                    <div className="menu-title">Export Data</div>
                    <div className="menu-subtitle">Download backup</div>
                  </div>
                </button>

                <button className="menu-item danger" onClick={() => { handleDeleteAllData(); setShowMenu(false); }}>
                  <span className="menu-icon">🗑️</span>
                  <div className="menu-text">
                    <div className="menu-title">Delete All Data</div>
                    <div className="menu-subtitle">Permanently erase everything</div>
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
            budgets={budgets}
            transactions={transactions}
          />
        )}
      </div>
    </DataProvider>
  );
}

export default App;
