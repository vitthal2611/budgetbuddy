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
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';

class CloudStorageService {
  constructor() {
    this.userId = null;
    this.listeners = new Map();
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
    const docRef = doc(transactionsRef, transaction.id.toString());
    
    await setDoc(docRef, {
      ...transaction,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return transaction;
  }

  // Update transaction
  async updateTransaction(transactionId, updates) {
    const transactionsRef = this.getUserCollection('transactions');
    const docRef = doc(transactionsRef, transactionId.toString());
    
    await setDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return { id: transactionId, ...updates };
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

  // Save budgets
  async saveBudgets(budgets) {
    const budgetsRef = this.getUserCollection('budgets');
    const docRef = doc(budgetsRef, 'current');
    
    await setDoc(docRef, {
      data: budgets,
      updatedAt: serverTimestamp()
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

  // ==================== BULK OPERATIONS ====================

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

  // Unsubscribe from all listeners
  unsubscribeAll() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}

// Create singleton instance
const cloudStorage = new CloudStorageService();

export default cloudStorage;
