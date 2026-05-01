---
inclusion: auto
---

# Firebase Integration Patterns

## Service Layer Architecture

All Firebase operations are centralized in service files under `src/services/`:

- `cloudStorage.js` - Transactions, budgets, envelopes, payment methods
- `authService.js` - Authentication operations
- `habitService.js` - Habit tracking data
- `todoService.js` - Todo/task management
- `recurringService.js` - Recurring transaction logic

## Real-time Data Subscription Pattern

### Standard Subscription
```javascript
// In service file
subscribeToTransactions(callback) {
  const userId = auth.currentUser?.uid;
  if (!userId) return () => {};
  
  const q = query(
    collection(db, 'users', userId, 'transactions'),
    orderBy('date', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(data);
  });
}

// In component
useEffect(() => {
  if (!user) return;
  
  const unsubscribe = cloudStorage.subscribeToTransactions((data) => {
    setTransactions(data);
  });
  
  return () => unsubscribe();
}, [user]);
```

## Optimistic Updates with Rollback

Always update local state immediately, then sync to Firebase with error handling:

```javascript
const handleDeleteTransaction = async (id) => {
  const transaction = transactions.find(t => t.id === id);
  const previousTransactions = [...transactions];
  
  try {
    // Optimistic update
    setTransactions(prev => prev.filter(t => t.id !== id));
    
    // Sync to cloud
    await cloudStorage.deleteTransaction(id);
    
    setToast({ message: 'Transaction deleted', type: 'success' });
  } catch (error) {
    // Rollback on error
    console.error('Delete error:', error);
    setTransactions(previousTransactions);
    setToast({ message: 'Failed to delete', type: 'error' });
  }
};
```

## Data Migration Pattern

When migrating from localStorage to Firebase:

```javascript
useEffect(() => {
  if (!user) return;
  
  const savedData = localStorage.getItem('transactions');
  if (!savedData) return;
  
  const migrateData = async () => {
    try {
      const parsed = JSON.parse(savedData);
      await cloudStorage.batchAddTransactions(parsed);
      localStorage.removeItem('transactions');
      console.log('✅ Migration complete');
    } catch (error) {
      console.error('Migration error:', error);
      alert('Migration failed. Data is safe in localStorage.');
    }
  };
  
  migrateData();
}, [user]);
```

## Batch Operations

For bulk operations, use batch writes to improve performance:

```javascript
async batchAddTransactions(transactions) {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Not authenticated');
  
  const batch = writeBatch(db);
  const collectionRef = collection(db, 'users', userId, 'transactions');
  
  transactions.forEach(transaction => {
    const docRef = doc(collectionRef, transaction.id);
    batch.set(docRef, transaction);
  });
  
  await batch.commit();
}
```

## Offline Support

Firebase automatically handles offline mode, but implement UI indicators:

```javascript
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

// Show offline indicator
{!isOnline && (
  <div className="offline-indicator">
    📡 Offline - Changes will sync when connected
  </div>
)}
```

## Security Rules

Firestore security rules ensure users can only access their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Error Handling Best Practices

1. **Always catch errors** in async Firebase operations
2. **Show user-friendly messages** - avoid technical jargon
3. **Log to console** for debugging
4. **Rollback optimistic updates** on failure
5. **Provide recovery options** when possible

## Data Structure Guidelines

### Transactions Collection
```javascript
{
  id: string,
  type: 'income' | 'expense' | 'transfer',
  amount: number,
  date: string (ISO format),
  note: string,
  envelope: string (for expenses),
  paymentMethod: string,
  sourceAccount: string (for transfers),
  destinationAccount: string (for transfers)
}
```

### Budgets Document
```javascript
{
  'MM-YYYY': {
    'Envelope Name': {
      allocated: number,
      spent: number
    }
  }
}
```

## Performance Optimization

- Use `orderBy` and `limit` in queries to reduce data transfer
- Implement pagination for large datasets
- Cache frequently accessed data in memory
- Use `onSnapshot` only when real-time updates are needed
- Consider using `getDoc` for one-time reads
