import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import './styles/animations.css';
import './styles/accessibility.css';
import EnvelopesView from './components/EnvelopesView';
import Transactions from './components/Transactions';
import Settings from './components/settings/Settings';
import Reports from './components/reports/Reports';
import TransactionModal from './components/TransactionModal';
import Auth from './components/Auth';
import LoadingSpinner from './components/shared/LoadingSpinner';
import Toast from './components/shared/Toast';
import ErrorBoundary from './components/shared/ErrorBoundary';
import RolloverModal from './components/envelopes/RolloverModal';
import { DataProvider } from './contexts/DataContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import authService from './services/authService';
import cloudStorage from './services/cloudStorage';
import { calculateRollover, applyRollover, isNewMonth } from './utils/budgetRollover';

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
  const [showRolloverModal, setShowRolloverModal] = useState(false);
  const [pendingRollover, setPendingRollover] = useState({});
  const [toast, setToast] = useState(null);

  // Ref to DataContext's loadFromCloud - set via callback prop on DataProvider
  const loadFromCloudRef = useRef(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((authUser) => {
      setUser(authUser);
      setAuthLoading(false);
      if (!authUser) {
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
    let isInitialLoad = true;

    const unsubTransactions = cloudStorage.subscribeToTransactions((data) => {
      if (isInitialLoad) {
        setTransactions(prevLocal => {
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
        setTransactions(data);
      }
      setSyncing(false);
    });

    const unsubBudgets = cloudStorage.subscribeToBudgets((data) => {
      setBudgets(data);
    });

    // Use loadFromCloud directly instead of window events
    const unsubEnvelopes = cloudStorage.subscribeToEnvelopes((data) => {
      if (loadFromCloudRef.current) {
        loadFromCloudRef.current(data || [], undefined);
      }
    });

    const unsubPaymentMethods = cloudStorage.subscribeToPaymentMethods((data) => {
      if (loadFromCloudRef.current) {
        loadFromCloudRef.current(undefined, data || []);
      }
    });

    return () => {
      unsubTransactions();
      unsubBudgets();
      unsubEnvelopes();
      unsubPaymentMethods();
    };
  }, [user]);

  // ONE-TIME SYNC: Extract payment methods from transactions and add any missing ones
  useEffect(() => {
    if (!user || transactions.length === 0) return;

    const syncPaymentMethodsFromTransactions = async () => {
      try {
        const savedMethods = localStorage.getItem('paymentMethods');
        const currentMethods = savedMethods ? JSON.parse(savedMethods) : [];

        const methodsFromTransactions = new Set();
        transactions.forEach(t => {
          if (t.paymentMethod) methodsFromTransactions.add(t.paymentMethod);
          if (t.sourceAccount) methodsFromTransactions.add(t.sourceAccount);
          if (t.destinationAccount) methodsFromTransactions.add(t.destinationAccount);
        });

        const missingMethods = Array.from(methodsFromTransactions).filter(
          m => !currentMethods.includes(m)
        );

        if (missingMethods.length > 0) {
          console.log(`Syncing ${missingMethods.length} missing payment methods from transactions`);
          const updatedMethods = [...currentMethods, ...missingMethods];
          localStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
          await cloudStorage.savePaymentMethods(updatedMethods);
          if (loadFromCloudRef.current) {
            loadFromCloudRef.current(undefined, updatedMethods);
          }
        }
      } catch (error) {
        console.error('Failed to sync payment methods from transactions:', error);
      }
    };

    const timeoutId = setTimeout(syncPaymentMethodsFromTransactions, 3000);
    return () => clearTimeout(timeoutId);
  }, [user, transactions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ONE-TIME MIGRATION: Load from localStorage and migrate to Firebase
  useEffect(() => {
    if (!user) return;

    const savedTransactions = localStorage.getItem('transactions');
    const savedBudgets = localStorage.getItem('budgets');

    if (!savedTransactions && !savedBudgets) return;

    console.log('🔄 Migrating localStorage data to Firebase...');

    const migrateData = async () => {
      try {
        if (savedTransactions) {
          const parsed = JSON.parse(savedTransactions);
          const migratedTransactions = [];
          const processedTransferIds = new Set();

          parsed.forEach(t => {
            if (t.type === 'transfer' && t.isSource !== undefined) {
              const idStr = t.id.toString();
              const baseId =
                idStr.endsWith('-source') || idStr.endsWith('-dest')
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

          if (migratedTransactions.length > 0) {
            console.log(`Migrating ${migratedTransactions.length} transactions to Firebase...`);
            await cloudStorage.batchAddTransactions(migratedTransactions);
            console.log('✅ Transactions migrated');
          }
        }

        if (savedBudgets) {
          const budgetsData = JSON.parse(savedBudgets);
          if (Object.keys(budgetsData).length > 0) {
            await cloudStorage.saveBudgets(budgetsData);
            console.log('✅ Budgets migrated');
          }
        }

        localStorage.removeItem('transactions');
        localStorage.removeItem('budgets');
        console.log('✅ Migration complete');
      } catch (error) {
        console.error('Migration error:', error);
        alert(
          '⚠️ Migration Warning\n\nFailed to migrate some data to cloud.\nYour data is safe in localStorage.\n\nPlease try refreshing the page.'
        );
      }
    };

    migrateData();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup orphaned budget entries when budgets change
  // Only removes entries for envelopes that have never had any transactions
  useEffect(() => {
    if (Object.keys(budgets).length === 0) return;

    const validEnvelopeNames = new Set(
      transactions.filter(t => t.type === 'expense' && t.envelope).map(t => t.envelope)
    );

    // Also keep envelopes that exist in DataContext (loaded from localStorage)
    const savedEnvelopes = localStorage.getItem('envelopes');
    if (savedEnvelopes) {
      try {
        JSON.parse(savedEnvelopes).forEach(env => validEnvelopeNames.add(env.name));
      } catch (_) {}
    }

    let hasOrphanedData = false;
    const cleanedBudgets = JSON.parse(JSON.stringify(budgets));

    Object.keys(cleanedBudgets).forEach(monthKey => {
      Object.keys(cleanedBudgets[monthKey]).forEach(envelopeName => {
        if (!validEnvelopeNames.has(envelopeName)) {
          delete cleanedBudgets[monthKey][envelopeName];
          hasOrphanedData = true;
        }
      });
      if (Object.keys(cleanedBudgets[monthKey]).length === 0) {
        delete cleanedBudgets[monthKey];
      }
    });

    if (hasOrphanedData) {
      console.log('Cleaned up orphaned budget data');
      setBudgets(cleanedBudgets);
    }
  }, [budgets]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle import transactions event
  useEffect(() => {
    const handleImportEvent = async (event) => {
      const importedTransactions = event.detail;
      setTransactions(prev => [...prev, ...importedTransactions]);

      if (user) {
        setSyncing(true);
        try {
          await cloudStorage.batchAddTransactions(importedTransactions);
        } catch (error) {
          console.error('Cloud sync error during import:', error);
          alert(
            '⚠️ Cloud Sync Failed\n\nImport completed but cloud sync failed.\nData is saved locally only.\n\nYour data will sync when you refresh.'
          );
        } finally {
          setSyncing(false);
        }
      }
    };

    window.addEventListener('importTransactions', handleImportEvent);
    return () => window.removeEventListener('importTransactions', handleImportEvent);
  }, [user]);

  // Handle undo import event
  useEffect(() => {
    const handleUndoImport = async (event) => {
      const { transactions: importedTransactions } = event.detail;
      const importedIds = new Set(importedTransactions.map(t => t.id));
      setTransactions(prev => prev.filter(t => !importedIds.has(t.id)));

      if (user) {
        setSyncing(true);
        try {
          for (const transaction of importedTransactions) {
            await cloudStorage.deleteTransaction(transaction.id);
          }
        } catch (error) {
          console.error('Undo sync error:', error);
          alert('⚠️ Cloud Sync Failed\n\nUndo completed locally but cloud sync failed.\nRefresh to see the current cloud state.');
        } finally {
          setSyncing(false);
        }
      }
    };

    window.addEventListener('undoImport', handleUndoImport);
    return () => window.removeEventListener('undoImport', handleUndoImport);
  }, [user]);

  // Handle tab switch event (from other components)
  useEffect(() => {
    const handleTabSwitch = (event) => setActiveTab(event.detail);
    window.addEventListener('switchTab', handleTabSwitch);
    return () => window.removeEventListener('switchTab', handleTabSwitch);
  }, []);

  const handleAddTransaction = (type, prefill = null) => {
    setModalType(type);
    setEditTransaction(prefill ? { _prefill: true, envelope: prefill.envelope } : null);
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
        const updatedTransaction = { ...transaction, id: editTransaction.id };
        setTransactions(prev => prev.map(t => t.id === editTransaction.id ? updatedTransaction : t));
        setShowModal(false);
        await cloudStorage.updateTransaction(editTransaction.id, updatedTransaction);
        setToast({ message: 'Transaction updated', type: 'success' });
      } else {
        setTransactions(prev => [...prev, transaction]);
        setShowModal(false);
        await cloudStorage.addTransaction(transaction);
        setToast({ message: 'Transaction saved', type: 'success' });
      }
    } catch (error) {
      console.error('Save transaction error:', error);
      // Rollback
      if (editTransaction) {
        setTransactions(prev => prev.map(t => t.id === editTransaction.id ? editTransaction : t));
      } else {
        setTransactions(prev => prev.filter(t => t.id !== transaction.id));
      }
      alert(`Failed to save transaction: ${error.message || 'Please try again.'}`);
    }
  };

  const handleDeleteTransaction = async (id) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    const typeIcon = transaction.type === 'income' ? '💰' : transaction.type === 'expense' ? '💸' : '🔄';
    let details = `${transaction.date} • ₹${transaction.amount}\n${transaction.note}`;
    if (transaction.type === 'transfer') {
      details += `\n${transaction.sourceAccount} → ${transaction.destinationAccount}`;
    } else {
      details += `\n${transaction.paymentMethod}`;
      if (transaction.envelope) details += ` • ${transaction.envelope}`;
    }

    if (!window.confirm(`${typeIcon} Delete this transaction?\n\n${details}\n\n⚠️ This action cannot be undone.`)) {
      return;
    }

    const previousTransactions = [...transactions];
    try {
      setTransactions(prev => prev.filter(t => t.id !== id));
      await cloudStorage.deleteTransaction(id);
    } catch (error) {
      console.error('Delete transaction error:', error);
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
      exportData.statistics = {
        totalTransactions: transactions.length,
        totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0),
        totalExpense: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0)
      };

      const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
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
    const userInput = window.prompt(
      '⚠️ DELETE ALL DATA?\n\nThis will permanently delete all transactions, budgets, envelopes, and payment methods.\n\n🚨 THIS CANNOT BE UNDONE!\n\nType "DELETE" to confirm:'
    );

    if (userInput !== 'DELETE') {
      if (userInput !== null) alert('Deletion cancelled. You must type "DELETE" exactly to confirm.');
      return;
    }

    try {
      setSyncing(true);
      const result = await cloudStorage.deleteAllData();

      setTransactions([]);
      setBudgets({});

      localStorage.removeItem('transactions');
      localStorage.removeItem('budgets');
      localStorage.removeItem('lastOpenDate');
      localStorage.setItem('envelopes', JSON.stringify([]));
      localStorage.setItem('paymentMethods', JSON.stringify([]));

      if (loadFromCloudRef.current) {
        loadFromCloudRef.current([], []);
      }

      setSyncing(false);
      alert(
        `✅ All Data Deleted\n\n${result.transactionsDeleted} transactions deleted\nAll budgets, envelopes, and payment methods cleared.`
      );
    } catch (error) {
      console.error('Delete all data error:', error);
      setSyncing(false);
      alert('❌ Failed to delete data. Please try again.');
    }
  };

  // Check for rollover on app load
  useEffect(() => {
    if (!user || transactions.length === 0) return;

    const lastOpenDate = localStorage.getItem('lastOpenDate');
    const today = new Date();
    const todayStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    if (isNewMonth(lastOpenDate)) {
      const rollover = calculateRollover(budgets, transactions, today.getFullYear(), today.getMonth());
      if (Object.keys(rollover).length > 0) {
        setPendingRollover(rollover);
        setShowRolloverModal(true);
      }
    }

    localStorage.setItem('lastOpenDate', todayStr);
  }, [user, transactions.length, budgets]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyRollover = () => {
    const today = new Date();
    const budgetKey = `${today.getFullYear()}-${today.getMonth()}`;
    const updatedBudget = applyRollover(budgets[budgetKey] || {}, pendingRollover, 'automatic');
    setBudgets({ ...budgets, [budgetKey]: updatedBudget });
    setShowRolloverModal(false);
    setPendingRollover({});
    alert('✅ Rollover applied! Your envelopes have been updated.');
  };

  const handleSkipRollover = () => {
    setShowRolloverModal(false);
    setPendingRollover({});
  };

  const saveBudgets = useCallback(async (newBudgets) => {
    setBudgets(newBudgets);
    try {
      await cloudStorage.saveBudgets(newBudgets);
    } catch (error) {
      console.error('Save budgets error:', error);
      alert('Failed to save budgets. Please try again.');
    }
  }, []);

  if (authLoading) {
    return (
      <div className="loading-screen">
        <LoadingSpinner size="large" message="Loading..." />
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  return (
    <PreferencesProvider>
      <DataProvider
        onLoadFromCloud={(fn) => { loadFromCloudRef.current = fn; }}
      >
        <ErrorBoundary>
          <div className="App">
            <div className="tabs">
              <button className={activeTab === 'envelopes' ? 'active' : ''} onClick={() => setActiveTab('envelopes')}>Envelopes</button>
              <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>Reports</button>
              <button className={activeTab === 'transactions' ? 'active' : ''} onClick={() => setActiveTab('transactions')}>Transactions</button>
              <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>Settings</button>
              <div className="tab-spacer" />
              <button className="export-btn" onClick={handleExportData} title="Export all data as backup">📥 Export</button>
              <button className="signout-btn" onClick={handleSignOut} title="Sign out">Sign Out</button>
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
                  setBudgets={saveBudgets}
                  onAddTransaction={handleAddTransaction}
                  onViewTransactions={handleViewTransactions}
                />
              )}
              {activeTab === 'reports' && (
                <Reports transactions={transactions} budgets={budgets} />
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
                <Settings
                  budgets={budgets}
                  setBudgets={saveBudgets}
                  transactions={transactions}
                />
              )}
            </div>

            <div className="bottom-nav">
              <button className={activeTab === 'envelopes' ? 'active' : ''} onClick={() => setActiveTab('envelopes')}>
                <span className="nav-icon">📦</span>
                <span>Envelopes</span>
              </button>
              <button
                className="nav-add-btn"
                onClick={() => setShowMenu(prev => (prev ? false : 'add'))}
                aria-label="Add transaction"
              >
                <span className="nav-add-icon">+</span>
              </button>
              <button className={activeTab === 'transactions' ? 'active' : ''} onClick={() => setActiveTab('transactions')}>
                <span className="nav-icon">💳</span>
                <span>History</span>
              </button>
              <button className={showMenu === true ? 'active' : ''} onClick={() => setShowMenu(prev => (prev === true ? false : true))}>
                <span className="nav-icon">☰</span>
                <span>More</span>
              </button>
            </div>

            {/* Add Transaction Quick Menu */}
            {showMenu === 'add' && (
              <div className="mobile-menu-overlay" onClick={() => setShowMenu(false)}>
                <div className="add-menu" onClick={e => e.stopPropagation()}>
                  <div className="add-menu-title">Add Transaction</div>
                  <div className="add-menu-options">
                    <button className="add-menu-btn income" onClick={() => { handleAddTransaction('income'); setShowMenu(false); }}>
                      <span className="add-menu-icon">💰</span><span>Income</span>
                    </button>
                    <button className="add-menu-btn expense" onClick={() => { handleAddTransaction('expense'); setShowMenu(false); }}>
                      <span className="add-menu-icon">💸</span><span>Expense</span>
                    </button>
                    <button className="add-menu-btn credit" onClick={() => { handleAddTransaction('credit'); setShowMenu(false); }}>
                      <span className="add-menu-icon">↩</span><span>Credit</span>
                    </button>
                    <button className="add-menu-btn transfer" onClick={() => { handleAddTransaction('transfer'); setShowMenu(false); }}>
                      <span className="add-menu-icon">🔄</span><span>Transfer</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Menu */}
            {showMenu === true && (
              <div className="mobile-menu-overlay" onClick={() => setShowMenu(false)}>
                <div className="mobile-menu" onClick={e => e.stopPropagation()}>
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
                    <button className="menu-item" onClick={() => { setActiveTab('reports'); setShowMenu(false); }}>
                      <span className="menu-icon">📊</span>
                      <div className="menu-text">
                        <div className="menu-title">Reports</div>
                        <div className="menu-subtitle">Spending insights & trends</div>
                      </div>
                    </button>
                    <button className="menu-item" onClick={() => { setActiveTab('settings'); setShowMenu(false); }}>
                      <span className="menu-icon">⚙️</span>
                      <div className="menu-text">
                        <div className="menu-title">Settings</div>
                        <div className="menu-subtitle">Envelopes, accounts, preferences</div>
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
                    <div className="app-version">Budget Buddy v2.0</div>
                  </div>
                </div>
              </div>
            )}

            {showModal && (
              <TransactionModal
                type={modalType}
                transaction={editTransaction?._prefill ? null : editTransaction}
                initialEnvelope={editTransaction?._prefill ? editTransaction.envelope : undefined}
                onSave={handleSaveTransaction}
                onClose={() => setShowModal(false)}
                budgets={budgets}
                transactions={transactions}
              />
            )}

            {showRolloverModal && (
              <RolloverModal
                isOpen={showRolloverModal}
                onClose={() => setShowRolloverModal(false)}
                rollover={pendingRollover}
                onApply={handleApplyRollover}
                onSkip={handleSkipRollover}
              />
            )}

            {toast && (
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(null)}
              />
            )}
          </div>
        </ErrorBoundary>
      </DataProvider>
    </PreferencesProvider>
  );
}

export default App;
