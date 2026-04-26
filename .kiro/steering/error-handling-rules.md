---
inclusion: auto
---

# Error Handling Rules

## General Principles

### Always Handle Errors
NEVER leave async operations without error handling:

```javascript
// ✅ CORRECT
try {
  await cloudStorage.saveTransaction(data);
} catch (error) {
  console.error('Save failed:', error);
  showError('Failed to save transaction');
}

// ❌ WRONG
await cloudStorage.saveTransaction(data); // Unhandled rejection
```

### Fail Gracefully
Application should never crash - always provide fallback:

```javascript
// ✅ CORRECT
try {
  const data = await fetchData();
  return data;
} catch (error) {
  console.error('Fetch failed:', error);
  return []; // Fallback to empty array
}

// ❌ WRONG
const data = await fetchData(); // Crashes if fails
return data;
```

## Error Handling Patterns

### Try-Catch for Async Operations
```javascript
const handleSaveTransaction = async (transaction) => {
  try {
    setLoading(true);
    setError(null);
    
    await cloudStorage.addTransaction(transaction);
    
    setToast({ message: 'Transaction saved', type: 'success' });
    onClose();
  } catch (error) {
    console.error('Transaction save error:', error);
    setError('Failed to save transaction. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

### Error State Management
```javascript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async () => {
  try {
    setLoading(true);
    setError(null); // Clear previous errors
    
    const result = await api.fetch();
    setData(result);
  } catch (err) {
    setError(err.message);
    setData(null); // Clear stale data
  } finally {
    setLoading(false);
  }
};

// Render based on state
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} onRetry={fetchData} />;
if (!data) return <EmptyState />;
return <DataView data={data} />;
```

## Firebase Error Handling

### Authentication Errors
```javascript
const handleSignIn = async (email, password) => {
  try {
    await authService.signIn(email, password);
  } catch (error) {
    let message = 'Sign in failed';
    
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'No account found with this email';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled';
        break;
      case 'auth/too-many-requests':
        message = 'Too many attempts. Please try again later';
        break;
      default:
        message = 'Sign in failed. Please try again';
    }
    
    setError(message);
  }
};
```

### Firestore Errors
```javascript
const handleSaveData = async (data) => {
  try {
    await cloudStorage.save(data);
  } catch (error) {
    console.error('Firestore error:', error);
    
    let message = 'Failed to save data';
    
    if (error.code === 'permission-denied') {
      message = 'You do not have permission to perform this action';
    } else if (error.code === 'unavailable') {
      message = 'Service temporarily unavailable. Please try again';
    } else if (error.code === 'unauthenticated') {
      message = 'Please sign in to continue';
      // Redirect to login
    }
    
    showError(message);
  }
};
```

### Network Errors
```javascript
const handleNetworkError = (error) => {
  if (!navigator.onLine) {
    return 'No internet connection. Changes will sync when online.';
  }
  
  if (error.message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  return 'Network error. Please check your connection.';
};
```

## User-Facing Error Messages

### Error Message Guidelines
- Be specific but not technical
- Suggest next steps
- Be empathetic
- Avoid blame

```javascript
// ✅ GOOD - Clear and helpful
'Failed to save transaction. Please check your internet connection and try again.'

// ❌ BAD - Technical and unhelpful
'Error: FIRESTORE_PERMISSION_DENIED at line 42'
```

### Error Message Examples
```javascript
const ERROR_MESSAGES = {
  // Network errors
  OFFLINE: 'No internet connection. Changes will sync when you\'re back online.',
  TIMEOUT: 'Request timed out. Please try again.',
  
  // Authentication errors
  AUTH_REQUIRED: 'Please sign in to continue.',
  AUTH_EXPIRED: 'Your session has expired. Please sign in again.',
  
  // Validation errors
  INVALID_AMOUNT: 'Please enter a valid amount greater than 0.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_DATE: 'Please enter a valid date.',
  
  // Permission errors
  PERMISSION_DENIED: 'You don\'t have permission to perform this action.',
  
  // Generic errors
  SAVE_FAILED: 'Failed to save. Please try again.',
  DELETE_FAILED: 'Failed to delete. Please try again.',
  LOAD_FAILED: 'Failed to load data. Please refresh the page.',
};
```

## Validation Errors

### Form Validation
```javascript
const validateTransaction = (data) => {
  const errors = {};
  
  if (!data.amount || parseFloat(data.amount) <= 0) {
    errors.amount = 'Amount must be greater than 0';
  }
  
  if (!data.date) {
    errors.date = 'Date is required';
  }
  
  if (!data.note || data.note.trim().length === 0) {
    errors.note = 'Description is required';
  }
  
  if (data.type === 'expense' && !data.envelope) {
    errors.envelope = 'Please select an envelope';
  }
  
  return errors;
};

const handleSubmit = (e) => {
  e.preventDefault();
  
  const errors = validateTransaction(formData);
  
  if (Object.keys(errors).length > 0) {
    setErrors(errors);
    return;
  }
  
  // Proceed with save
  handleSave(formData);
};
```

### Display Validation Errors
```javascript
<input
  type="number"
  value={formData.amount}
  onChange={(e) => handleChange('amount', e.target.value)}
  className={errors.amount ? 'input-error' : ''}
/>
{errors.amount && (
  <span className="error-message">{errors.amount}</span>
)}
```

## Optimistic Updates with Rollback

### Pattern for Optimistic Updates
```javascript
const handleDeleteTransaction = async (id) => {
  // Store previous state for rollback
  const previousTransactions = [...transactions];
  const transaction = transactions.find(t => t.id === id);
  
  try {
    // Optimistic update
    setTransactions(prev => prev.filter(t => t.id !== id));
    setToast({ message: 'Transaction deleted', type: 'success' });
    
    // Sync to server
    await cloudStorage.deleteTransaction(id);
  } catch (error) {
    // Rollback on error
    console.error('Delete failed:', error);
    setTransactions(previousTransactions);
    setToast({ 
      message: 'Failed to delete transaction', 
      type: 'error' 
    });
  }
};
```

## Error Boundaries

### Component Error Boundary
```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>We're sorry for the inconvenience.</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

## Logging Rules

### What to Log
✅ Log these:
- Errors with context
- Important state changes
- API calls (start/success/failure)
- User actions (for debugging)
- Performance metrics

❌ Don't log these:
- Sensitive data (passwords, tokens)
- Personal information
- Complete user objects
- Large data structures in production

### Logging Levels
```javascript
// Development
console.log('Info: Transaction saved');
console.warn('Warning: Slow operation');
console.error('Error: Save failed', error);

// Production - Use error tracking service
if (process.env.NODE_ENV === 'production') {
  // Send to error tracking (Sentry, LogRocket, etc.)
  errorTracker.captureException(error);
} else {
  console.error(error);
}
```

### Structured Logging
```javascript
const logError = (context, error) => {
  console.error({
    timestamp: new Date().toISOString(),
    context,
    error: {
      message: error.message,
      code: error.code,
      stack: error.stack
    },
    user: auth.currentUser?.uid,
    url: window.location.href
  });
};

// Usage
try {
  await saveTransaction(data);
} catch (error) {
  logError('saveTransaction', error);
}
```

## Retry Logic

### Exponential Backoff
```javascript
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Usage
try {
  await retryWithBackoff(() => cloudStorage.save(data));
} catch (error) {
  showError('Failed after multiple attempts');
}
```

## Error Recovery

### Provide Recovery Options
```javascript
const ErrorMessage = ({ error, onRetry, onCancel }) => (
  <div className="error-message">
    <p>{error}</p>
    <div className="error-actions">
      <button onClick={onRetry}>Try Again</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  </div>
);
```

### Auto-Recovery
```javascript
useEffect(() => {
  const handleOnline = async () => {
    console.log('Back online, syncing...');
    try {
      await syncPendingChanges();
      setToast({ message: 'Synced successfully', type: 'success' });
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };
  
  window.addEventListener('online', handleOnline);
  return () => window.removeEventListener('online', handleOnline);
}, []);
```

## Error Handling Checklist

Before deploying:
- [ ] All async operations have try-catch
- [ ] User-friendly error messages
- [ ] Errors logged with context
- [ ] Optimistic updates have rollback
- [ ] Loading and error states handled
- [ ] Network errors handled gracefully
- [ ] Firebase errors handled specifically
- [ ] Validation errors displayed clearly
- [ ] Error boundaries in place
- [ ] Recovery options provided
- [ ] No sensitive data in error logs
- [ ] Offline scenarios handled
