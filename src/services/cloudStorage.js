import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  onSnapshot,
  writeBatch,
  runTransaction,
  serverTimestamp,
  orderBy,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { db } from '../config/firebase';

class CloudStorageService {
  constructor() {
    this.userId = null;
    this.listeners = new Map();
    this.isOnline = navigator.onLine;
    this.pendingWrites = [];
    
    // Monitor online/offline status
    window.addEventListener('online', () => {
      console.log('🟢 Back online - resuming Firestore sync');
      this.isOnline = true;
      enableNetwork(db).catch(err => console.error('Failed to enable network:', err));
      this.processPendingWrites();
    });
    
    window.addEventListener('offline', () => {
      console.log('🔴 Offline - Firestore will queue writes');
      this.isOnline = false;
      disableNetwork(db).catch(err => console.error('Failed to disable network:', err));
    });
  }

  // Process any writes that were queued while offline
  async processPendingWrites() {
    if (this.pendingWrites.length === 0) return;
    
    console.log(`Processing ${this.pendingWrites.length} pending writes...`);
    const writes = [...this.pendingWrites];
    this.pendingWrites = [];
    
    for (const write of writes) {
      try {
        await write();
      } catch (error) {
        console.error('Failed to process pending write:', error);
        this.pendingWrites.push(write); // Re-queue on failure
      }
    }
  }

  // Set current user
  setUser(userId) {
    this.userId = userId;
  }

  // Get user's collection reference
  getUserCollection(collectionName) {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }
    return collection(db, 'users', this.userId, collectionName);
  }

  // ==================== TRANSACTIONS ====================

  // Add transaction
  async addTransaction(transaction) {
    const transactionsRef = this.getUserCollection('transactions');
    const id = (transaction.id ?? `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`).toString();
    const docRef = doc(transactionsRef, id);
    
    await setDoc(docRef, {
      ...transaction,
      id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return transaction;
  }

  // Update transaction
  async updateTransaction(transactionId, updates) {
    const transactionsRef = this.getUserCollection('transactions');
    const id = transactionId ? transactionId.toString() : (updates.id ? updates.id.toString() : null);
    if (!id) throw new Error('Transaction ID is required');
    const docRef = doc(transactionsRef, id);
    
    await setDoc(docRef, {
      ...updates,
      id,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return { id, ...updates };
  }

  // Delete transaction
  async deleteTransaction(transactionId) {
    const transactionsRef = this.getUserCollection('transactions');
    const docRef = doc(transactionsRef, transactionId.toString());
    
    await deleteDoc(docRef);
    return transactionId;
  }

  // Get all transactions
  async getTransactions() {
    const transactionsRef = this.getUserCollection('transactions');
    const q = query(transactionsRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Remove Firestore timestamps from returned data
      const { createdAt, updatedAt, ...transaction } = data;
      return transaction;
    });
  }

  // Real-time sync for transactions
  subscribeToTransactions(callback) {
    const transactionsRef = this.getUserCollection('transactions');
    const q = query(transactionsRef, orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactions = snapshot.docs.map(doc => {
        const data = doc.data();
        // Remove Firestore timestamps from returned data
        const { createdAt, updatedAt, ...transaction } = data;
        return transaction;
      });
      callback(transactions);
    }, (error) => {
      console.error('Transaction sync error:', error);
    });
    
    this.listeners.set('transactions', unsubscribe);
    return unsubscribe;
  }

  // ==================== BUDGETS ====================

  // Rule 12: use Firestore transaction to prevent concurrent budget overwrites
  async saveBudgets(budgets) {
    const budgetsRef = this.getUserCollection('budgets');
    const docRef = doc(budgetsRef, 'current');

    await runTransaction(db, async (tx) => {
      tx.set(docRef, { data: budgets, updatedAt: serverTimestamp() });
    });

    return budgets;
  }

  // Get budgets
  async getBudgets() {
    const budgetsRef = this.getUserCollection('budgets');
    const docRef = doc(budgetsRef, 'current');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().data;
    }
    return {};
  }

  // Real-time sync for budgets
  subscribeToBudgets(callback) {
    const budgetsRef = this.getUserCollection('budgets');
    const docRef = doc(budgetsRef, 'current');
    
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data().data);
      } else {
        callback({});
      }
    }, (error) => {
      console.error('Budget sync error:', error);
    });
    
    this.listeners.set('budgets', unsubscribe);
    return unsubscribe;
  }

  // ==================== ENVELOPES ====================

  // Save envelopes
  async saveEnvelopes(envelopes) {
    const envelopesRef = this.getUserCollection('envelopes');
    const docRef = doc(envelopesRef, 'current');
    
    await setDoc(docRef, {
      data: envelopes,
      updatedAt: serverTimestamp()
    });
    
    return envelopes;
  }

  // Get envelopes
  async getEnvelopes() {
    const envelopesRef = this.getUserCollection('envelopes');
    const docRef = doc(envelopesRef, 'current');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().data;
    }
    return [];
  }

  // Real-time sync for envelopes
  subscribeToEnvelopes(callback) {
    const envelopesRef = this.getUserCollection('envelopes');
    const docRef = doc(envelopesRef, 'current');
    
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data().data);
      } else {
        callback([]);
      }
    }, (error) => {
      console.error('Envelope sync error:', error);
    });
    
    this.listeners.set('envelopes', unsubscribe);
    return unsubscribe;
  }

  // ==================== PAYMENT METHODS ====================

  // Save payment methods
  async savePaymentMethods(paymentMethods) {
    const methodsRef = this.getUserCollection('paymentMethods');
    const docRef = doc(methodsRef, 'current');
    
    await setDoc(docRef, {
      data: paymentMethods,
      updatedAt: serverTimestamp()
    });
    
    return paymentMethods;
  }

  // Get payment methods
  async getPaymentMethods() {
    const methodsRef = this.getUserCollection('paymentMethods');
    const docRef = doc(methodsRef, 'current');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().data;
    }
    return [];
  }

  // Real-time sync for payment methods
  subscribeToPaymentMethods(callback) {
    const methodsRef = this.getUserCollection('paymentMethods');
    const docRef = doc(methodsRef, 'current');
    
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data().data);
      } else {
        callback([]);
      }
    }, (error) => {
      console.error('Payment methods sync error:', error);
    });
    
    this.listeners.set('paymentMethods', unsubscribe);
    return unsubscribe;
  }

  // ==================== PREFERENCES ====================

  // Save user preferences
  async savePreferences(preferences) {
    const prefsRef = this.getUserCollection('preferences');
    const docRef = doc(prefsRef, 'current');
    
    await setDoc(docRef, {
      data: preferences,
      updatedAt: serverTimestamp()
    });
    
    return preferences;
  }

  // Get user preferences
  async getPreferences() {
    const prefsRef = this.getUserCollection('preferences');
    const docRef = doc(prefsRef, 'current');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().data;
    }
    return null;
  }

  // Real-time sync for preferences
  subscribeToPreferences(callback) {
    const prefsRef = this.getUserCollection('preferences');
    const docRef = doc(prefsRef, 'current');
    
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data().data);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Preferences sync error:', error);
    });
    
    this.listeners.set('preferences', unsubscribe);
    return unsubscribe;
  }

  // ==================== BULK OPERATIONS ====================

  // Batch add transactions (up to 500 per batch - Firestore limit)
  async batchAddTransactions(transactions) {
    const transactionsRef = this.getUserCollection('transactions');
    const batches = [];
    
    // Split into chunks of 500 (Firestore batch limit)
    for (let i = 0; i < transactions.length; i += 500) {
      const chunk = transactions.slice(i, i + 500);
      const batch = writeBatch(db);
      
      chunk.forEach(transaction => {
        const docRef = doc(transactionsRef, transaction.id.toString());
        batch.set(docRef, {
          ...transaction,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      
      batches.push(batch.commit());
    }
    
    await Promise.all(batches);
    return transactions.length;
  }

  // Import all data (bulk write)
  async importAllData(data) {
    const batch = writeBatch(db);
    
    // Import transactions
    if (data.transactions) {
      const transactionsRef = this.getUserCollection('transactions');
      data.transactions.forEach(transaction => {
        const docRef = doc(transactionsRef, transaction.id.toString());
        batch.set(docRef, {
          ...transaction,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
    }
    
    // Import budgets
    if (data.budgets) {
      const budgetsRef = this.getUserCollection('budgets');
      const docRef = doc(budgetsRef, 'current');
      batch.set(docRef, {
        data: data.budgets,
        updatedAt: serverTimestamp()
      });
    }
    
    // Import envelopes
    if (data.envelopes) {
      const envelopesRef = this.getUserCollection('envelopes');
      const docRef = doc(envelopesRef, 'current');
      batch.set(docRef, {
        data: data.envelopes,
        updatedAt: serverTimestamp()
      });
    }
    
    // Import payment methods
    if (data.paymentMethods) {
      const methodsRef = this.getUserCollection('paymentMethods');
      const docRef = doc(methodsRef, 'current');
      batch.set(docRef, {
        data: data.paymentMethods,
        updatedAt: serverTimestamp()
      });
    }
    
    await batch.commit();
    console.log('Bulk import completed');
  }

  // Export all data
  async exportAllData() {
    const [transactions, budgets, envelopes, paymentMethods] = await Promise.all([
      this.getTransactions(),
      this.getBudgets(),
      this.getEnvelopes(),
      this.getPaymentMethods()
    ]);
    
    return {
      transactions,
      budgets,
      envelopes,
      paymentMethods,
      exportDate: new Date().toISOString()
    };
  }

  // ==================== CLEANUP ====================

  // Delete all user data
  async deleteAllData() {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }

    try {
      // Delete all transactions in chunks of 499 (leave room for the other deletes)
      const transactionsRef = this.getUserCollection('transactions');
      const transactionsSnapshot = await getDocs(transactionsRef);
      const transactionDocs = transactionsSnapshot.docs;

      // Chunk transaction deletes into batches of 490
      for (let i = 0; i < transactionDocs.length; i += 490) {
        const chunk = transactionDocs.slice(i, i + 490);
        const batch = writeBatch(db);
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }

      // Delete the single-document collections in one final batch
      const finalBatch = writeBatch(db);

      const budgetsRef = this.getUserCollection('budgets');
      finalBatch.delete(doc(budgetsRef, 'current'));

      const envelopesRef = this.getUserCollection('envelopes');
      finalBatch.delete(doc(envelopesRef, 'current'));

      const methodsRef = this.getUserCollection('paymentMethods');
      finalBatch.delete(doc(methodsRef, 'current'));

      const prefsRef = this.getUserCollection('preferences');
      finalBatch.delete(doc(prefsRef, 'current'));

      await finalBatch.commit();
      console.log('✅ All user data deleted from Firebase');

      return {
        transactionsDeleted: transactionsSnapshot.size,
        success: true
      };
    } catch (error) {
      console.error('Failed to delete all data:', error);
      throw error;
    }
  }

  // Unsubscribe from all listeners
  unsubscribeAll() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}

// Create singleton instance
const cloudStorage = new CloudStorageService();

export default cloudStorage;
