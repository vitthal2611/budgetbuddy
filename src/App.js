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
import BottomNav from './components/shared/BottomNav';
import AddMenu from './components/shared/AddMenu';
import MobileMenu from './components/shared/MobileMenu';
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
      // Skip non-month keys like _borrows
      if (monthKey.startsWith('_')) return;

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
    // Ensure id is always present
    const id = transaction.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const txWithId = { ...transaction, id };
    try {
      if (editTransaction && editTransaction.id) {
        const updatedTransaction = { ...txWithId, id: editTransaction.id };
        setTransactions(prev => prev.map(t => t.id === editTransaction.id ? updatedTransaction : t));
        setShowModal(false);
        await cloudStorage.updateTransaction(editTransaction.id, updatedTransaction);
        setToast({ message: 'Transaction updated', type: 'success' });
      } else {
        setTransactions(prev => [...prev, txWithId]);
        setShowModal(false);
        await cloudStorage.addTransaction(txWithId);
        setToast({ message: 'Transaction saved', type: 'success' });
      }
    } catch (error) {
      console.error('Save transaction error:', error);
      if (editTransaction) {
        setTransactions(prev => prev.map(t => t.id === editTransaction.id ? editTransaction : t));
      } else {
        setTransactions(prev => prev.filter(t => t.id !== txWithId.id));
      }
      alert(`Failed to save transaction: ${error.message || 'Please try again.'}`);
    }
  };

  const handleDeleteTransaction = async (id) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    const previousTransactions = [...transactions];
    try {
      setTransactions(prev => prev.filter(t => t.id !== id));
      await cloudStorage.deleteTransaction(id);
      setToast({ message: 'Transaction deleted', type: 'success' });
    } catch (error) {
      console.error('Delete transaction error:', error);
      setTransactions(previousTransactions);
      setToast({ message: 'Failed to delete transaction', type: 'error' });
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

  // Auto rollover on new month — no modal, applies immediately
  useEffect(() => {
    if (!user || transactions.length === 0 || Object.keys(budgets).length === 0) return;

    const lastOpenDate = localStorage.getItem('lastOpenDate');
    const today = new Date();
    const todayStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    if (isNewMonth(lastOpenDate)) {
      const rollover = calculateRollover(budgets, transactions, today.getFullYear(), today.getMonth());
      if (Object.keys(rollover).length > 0) {
        const budgetKey = `${today.getFullYear()}-${today.getMonth()}`;
        const updatedBudget = applyRollover(budgets[budgetKey] || {}, rollover);
        const newBudgets = { ...budgets, [budgetKey]: updatedBudget };
        setBudgets(newBudgets);
        cloudStorage.saveBudgets(newBudgets).catch(e => console.error('Rollover save error:', e));

        // Show a toast summary
        const surplus = Object.values(rollover).filter(v => v > 0).reduce((s, v) => s + v, 0);
        const deficit = Object.values(rollover).filter(v => v < 0).reduce((s, v) => s + v, 0);
        const fmt = n => Math.abs(n).toLocaleString('en-IN');
        const msg = surplus > 0 && deficit < 0
          ? `Rollover applied: +₹${fmt(surplus)} surplus, -₹${fmt(deficit)} overspend`
          : surplus > 0
          ? `Rollover applied: +₹${fmt(surplus)} carried forward`
          : `Rollover applied: -₹${fmt(deficit)} overspend deducted`;
        setToast({ message: msg, type: 'success' });
      }
    }

    localStorage.setItem('lastOpenDate', todayStr);
  }, [user, transactions.length, budgets]); // eslint-disable-line react-hooks/exhaustive-deps

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
            {/* Desktop tab bar — hidden on mobile */}
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
              <div className="sync-indicator"><span className="sync-icon">🔄</span>Syncing...</div>
            )}
            {!isOnline && (
              <div className="offline-indicator"><span className="offline-icon">📡</span>Offline - Changes will sync when connected</div>
            )}

            {/* Main content */}
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

            {/* Bottom navigation */}
            <BottomNav
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onAddPress={() => setShowMenu('add')}
              onMorePress={() => setShowMenu(prev => prev === true ? false : true)}
              showMore={showMenu === true}
            />

            {/* Add transaction menu */}
            {showMenu === 'add' && (
              <AddMenu
                onSelect={handleAddTransaction}
                onClose={() => setShowMenu(false)}
              />
            )}

            {/* More menu */}
            {showMenu === true && (
              <MobileMenu
                user={user}
                onNavigate={setActiveTab}
                onExport={handleExportData}
                onDeleteAll={handleDeleteAllData}
                onSignOut={handleSignOut}
                onClose={() => setShowMenu(false)}
              />
            )}

            {showModal && (
              <TransactionModal
                type={modalType}
                transaction={editTransaction?._prefill ? null : editTransaction}
                initialEnvelope={editTransaction?._prefill ? editTransaction.envelope : undefined}
                onSave={handleSaveTransaction}
                onDelete={handleDeleteTransaction}
                onClose={() => setShowModal(false)}
                budgets={budgets}
                transactions={transactions}
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
