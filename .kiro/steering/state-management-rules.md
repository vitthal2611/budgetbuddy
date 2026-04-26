---
inclusion: auto
---

# State Management Rules

## State Organization Principles

### Single Source of Truth
- Each piece of state should have ONE authoritative source
- Avoid duplicating state across components
- Derive computed values instead of storing them
- Use Context for truly global state only

### State Placement Rules
1. **Local State** - Use `useState` when state is only needed in one component
2. **Lifted State** - Move to parent when multiple children need it
3. **Context State** - Use for app-wide state (user, preferences, data)
4. **Server State** - Firebase real-time subscriptions for persisted data

## Context Usage Rules

### When to Use Context
✅ Use Context for:
- User authentication state
- App-wide preferences (theme, currency)
- Shared data collections (envelopes, payment methods)
- Feature flags and configuration

❌ Don't Use Context for:
- Frequently changing values (causes re-renders)
- Data that's only needed by 1-2 components
- Temporary UI state (modals, dropdowns)
- Form input values

### Context Structure
```javascript
// Good - Focused context with specific purpose
const DataContext = createContext();

export function DataProvider({ children }) {
  const [envelopes, setEnvelopes] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  
  const value = {
    envelopes,
    paymentMethods,
    addEnvelope,
    removeEnvelope
  };
  
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// Bad - Kitchen sink context
const AppContext = createContext(); // Contains everything
```

## State Update Rules

### Immutability is Required
ALWAYS create new objects/arrays when updating state:

```javascript
// ✅ CORRECT - Immutable updates
setTransactions(prev => [...prev, newTransaction]);
setTransactions(prev => prev.filter(t => t.id !== id));
setTransactions(prev => prev.map(t => t.id === id ? updated : t));

// ❌ WRONG - Mutating state
transactions.push(newTransaction); // Don't mutate
setTransactions(transactions); // React won't detect change
```

### Batch Related Updates
Group related state updates together:

```javascript
// ✅ Good - Batched updates
const handleSave = async (data) => {
  setLoading(true);
  setError(null);
  
  try {
    await save(data);
    setSuccess(true);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

// ❌ Bad - Scattered updates
setLoading(true);
// ... other code ...
setLoading(false);
// ... more code ...
setError(null);
```

## Derived State Rules

### Compute, Don't Store
If a value can be calculated from existing state, DON'T store it:

```javascript
// ✅ CORRECT - Computed value
const totalSpent = useMemo(() => {
  return transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
}, [transactions]);

// ❌ WRONG - Storing derived state
const [totalSpent, setTotalSpent] = useState(0);
useEffect(() => {
  const total = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  setTotalSpent(total);
}, [transactions]); // Unnecessary state and effect
```

## useEffect Rules

### Dependency Array is Mandatory
ALWAYS include all dependencies:

```javascript
// ✅ CORRECT
useEffect(() => {
  fetchData(userId);
}, [userId]); // All dependencies listed

// ❌ WRONG
useEffect(() => {
  fetchData(userId);
}, []); // Missing dependency - will use stale userId
```

### Cleanup is Required
Clean up subscriptions, timers, and listeners:

```javascript
// ✅ CORRECT
useEffect(() => {
  const unsubscribe = cloudStorage.subscribeToTransactions((data) => {
    setTransactions(data);
  });
  
  return () => unsubscribe(); // Cleanup
}, []);

// ❌ WRONG
useEffect(() => {
  cloudStorage.subscribeToTransactions((data) => {
    setTransactions(data);
  });
  // No cleanup - memory leak!
}, []);
```

### Don't Set State in Render
NEVER call setState during render:

```javascript
// ✅ CORRECT
useEffect(() => {
  if (condition) {
    setState(newValue);
  }
}, [condition]);

// ❌ WRONG
if (condition) {
  setState(newValue); // Causes infinite loop
}
```

## useCallback Rules

### When to Use useCallback
Use `useCallback` for functions passed as props to memoized components:

```javascript
// ✅ Good - Prevents unnecessary re-renders
const handleDelete = useCallback((id) => {
  setTransactions(prev => prev.filter(t => t.id !== id));
}, []);

<MemoizedChild onDelete={handleDelete} />

// ❌ Unnecessary - Not passed to memoized component
const handleClick = useCallback(() => {
  console.log('clicked');
}, []); // Overkill if not needed
```

### Include All Dependencies
```javascript
// ✅ CORRECT
const handleSave = useCallback(async (data) => {
  await cloudStorage.save(data);
  setToast({ message: 'Saved', type: 'success' });
}, []); // setToast is stable from useState

// ❌ WRONG
const handleSave = useCallback(async (data) => {
  await cloudStorage.save(data);
  showNotification(message); // message not in dependencies
}, []); // Missing dependency
```

## useMemo Rules

### When to Use useMemo
Use for expensive computations only:

```javascript
// ✅ Good - Expensive calculation
const sortedTransactions = useMemo(() => {
  return transactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .filter(t => t.amount > 100);
}, [transactions]);

// ❌ Unnecessary - Simple operation
const doubled = useMemo(() => count * 2, [count]); // Overkill
```

## State Synchronization Rules

### Firebase Sync Pattern
Follow this pattern for Firebase synchronization:

```javascript
// 1. Subscribe to real-time updates
useEffect(() => {
  if (!user) return;
  
  const unsubscribe = cloudStorage.subscribeToTransactions((data) => {
    setTransactions(data);
  });
  
  return () => unsubscribe();
}, [user]);

// 2. Optimistic updates with rollback
const handleDelete = async (id) => {
  const previous = [...transactions];
  
  try {
    // Optimistic update
    setTransactions(prev => prev.filter(t => t.id !== id));
    
    // Sync to cloud
    await cloudStorage.deleteTransaction(id);
  } catch (error) {
    // Rollback on error
    setTransactions(previous);
    showError('Failed to delete');
  }
};
```

## Form State Rules

### Controlled Components
ALWAYS use controlled components for forms:

```javascript
// ✅ CORRECT - Controlled
const [formData, setFormData] = useState({ amount: '', note: '' });

<input
  value={formData.amount}
  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
/>

// ❌ WRONG - Uncontrolled
<input defaultValue={amount} /> // Loses React control
```

### Form Validation State
```javascript
const [formData, setFormData] = useState({});
const [errors, setErrors] = useState({});
const [touched, setTouched] = useState({});

const validate = (field, value) => {
  if (field === 'amount' && (!value || parseFloat(value) <= 0)) {
    return 'Amount must be positive';
  }
  return null;
};

const handleBlur = (field) => {
  setTouched(prev => ({ ...prev, [field]: true }));
  const error = validate(field, formData[field]);
  setErrors(prev => ({ ...prev, [field]: error }));
};
```

## Loading State Rules

### Loading State Pattern
```javascript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.fetch();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, []);

// Render based on state
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;
return <DataView data={data} />;
```

## State Anti-Patterns

### ❌ Don't Store Props in State
```javascript
// BAD
function Child({ initialValue }) {
  const [value, setValue] = useState(initialValue);
  // value won't update if initialValue changes
}

// GOOD
function Child({ value, onChange }) {
  // Use props directly or lift state up
}
```

### ❌ Don't Use State for Constants
```javascript
// BAD
const [categories] = useState(['Food', 'Transport', 'Entertainment']);

// GOOD
const CATEGORIES = ['Food', 'Transport', 'Entertainment'];
```

### ❌ Don't Duplicate Server State
```javascript
// BAD
const [transactions, setTransactions] = useState([]);
const [transactionCount, setTransactionCount] = useState(0);

useEffect(() => {
  setTransactionCount(transactions.length); // Duplicate state
}, [transactions]);

// GOOD
const [transactions, setTransactions] = useState([]);
const transactionCount = transactions.length; // Derived value
```

## Performance Rules

### Prevent Unnecessary Re-renders
1. Use `React.memo` for expensive components
2. Use `useCallback` for functions passed to memoized children
3. Use `useMemo` for expensive computations
4. Split large components into smaller ones
5. Use proper key props in lists

```javascript
// Memoize expensive component
const TransactionList = React.memo(({ transactions, onDelete }) => {
  return transactions.map(t => (
    <TransactionItem key={t.id} transaction={t} onDelete={onDelete} />
  ));
});
```

## State Debugging

### Useful Debugging Techniques
```javascript
// Log state changes
useEffect(() => {
  console.log('Transactions updated:', transactions);
}, [transactions]);

// Track render count
const renderCount = useRef(0);
renderCount.current++;
console.log('Render count:', renderCount.current);

// Use React DevTools
// - Inspect component props and state
// - Profile component renders
// - Track state updates
```
