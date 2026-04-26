---
inclusion: auto
---

# Component Patterns & Guidelines

## Shared Components

Reusable UI components are located in `src/components/shared/`:

- `Modal.js` - Generic modal wrapper
- `Toast.js` - Notification messages
- `LoadingSpinner.js` - Loading states
- `EmptyState.js` - Empty state placeholders
- `ErrorBoundary.js` - Error handling wrapper
- `BottomNav.js` - Mobile navigation
- `DesktopSidebar.js` - Desktop navigation
- `AddMenu.js` - Add transaction menu
- `MobileMenu.js` - Mobile hamburger menu

## Modal Pattern

Use the shared Modal component for dialogs and overlays:

```javascript
import Modal from './shared/Modal';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowModal(true)}>Open</button>
      
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <h2>Modal Content</h2>
          <p>Your content here</p>
        </Modal>
      )}
    </>
  );
}
```

## Toast Notifications

Show feedback for user actions:

```javascript
const [toast, setToast] = useState(null);

// Trigger toast
setToast({ message: 'Action completed', type: 'success' });

// Render toast
{toast && (
  <Toast
    message={toast.message}
    type={toast.type}
    onClose={() => setToast(null)}
  />
)}
```

Toast types: `success`, `error`, `info`, `warning`

## Loading States

Show loading indicators during async operations:

```javascript
import LoadingSpinner from './shared/LoadingSpinner';

{loading && <LoadingSpinner size="large" message="Loading..." />}
```

Sizes: `small`, `medium`, `large`

## Empty States

Display helpful messages when no data exists:

```javascript
import EmptyState from './shared/EmptyState';

{items.length === 0 && (
  <EmptyState
    icon="📭"
    title="No items yet"
    message="Get started by adding your first item"
    actionLabel="Add Item"
    onAction={() => setShowModal(true)}
  />
)}
```

## Error Boundaries

Wrap components to catch and handle errors gracefully:

```javascript
import ErrorBoundary from './shared/ErrorBoundary';

<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

## Navigation Pattern

### Mobile Navigation (Bottom Nav)
```javascript
<BottomNav
  activeTab={activeTab}
  onTabChange={setActiveTab}
  onOpenMenu={() => setShowMenu(true)}
/>
```

### Desktop Navigation (Sidebar)
```javascript
<DesktopSidebar
  activeTab={activeTab}
  onTabChange={setActiveTab}
  onAddTransaction={handleAddTransaction}
  user={user}
  syncing={syncing}
  isOnline={isOnline}
/>
```

## Form Patterns

### Controlled Inputs
Always use controlled components for form inputs:

```javascript
const [formData, setFormData] = useState({
  amount: '',
  note: '',
  date: new Date().toISOString().split('T')[0]
});

const handleChange = (field, value) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};

<input
  type="number"
  value={formData.amount}
  onChange={(e) => handleChange('amount', e.target.value)}
/>
```

### Form Validation
Validate before submission:

```javascript
const handleSubmit = (e) => {
  e.preventDefault();
  
  if (!formData.amount || parseFloat(formData.amount) <= 0) {
    alert('Please enter a valid amount');
    return;
  }
  
  onSave(formData);
};
```

## List Rendering

### Transaction Lists
```javascript
{transactions.map(transaction => (
  <div key={transaction.id} className="transaction-item">
    <span>{transaction.note}</span>
    <span>${transaction.amount}</span>
  </div>
))}
```

### Empty List Handling
```javascript
{transactions.length === 0 ? (
  <EmptyState
    icon="💸"
    title="No transactions"
    message="Start tracking your finances"
  />
) : (
  transactions.map(t => <TransactionItem key={t.id} transaction={t} />)
)}
```

## Event Handling Patterns

### Custom Events
Use custom events for cross-component communication:

```javascript
// Dispatch event
window.dispatchEvent(new CustomEvent('switchTab', {
  detail: 'transactions'
}));

// Listen for event
useEffect(() => {
  const handleTabSwitch = (event) => setActiveTab(event.detail);
  window.addEventListener('switchTab', handleTabSwitch);
  return () => window.removeEventListener('switchTab', handleTabSwitch);
}, []);
```

### Callback Props
Pass callbacks for child-to-parent communication:

```javascript
// Parent
<ChildComponent onAction={(data) => handleAction(data)} />

// Child
<button onClick={() => props.onAction(someData)}>
  Click Me
</button>
```

## Conditional Rendering

### Tab-based Views
```javascript
{activeTab === 'envelopes' && <EnvelopesView />}
{activeTab === 'transactions' && <Transactions />}
{activeTab === 'reports' && <Reports />}
```

### Feature Flags
```javascript
{user?.isPremium && <PremiumFeature />}
{isOnline && <SyncButton />}
```

## Styling Patterns

### Component-specific CSS
Each component has its own CSS file:
- `TransactionModal.js` → `TransactionModal.css`
- `EnvelopesView.js` → `EnvelopesView.css`

### CSS Class Naming
Use BEM-like naming for clarity:
```css
.transaction-modal { }
.transaction-modal__header { }
.transaction-modal__button--primary { }
```

### Responsive Classes
```css
/* Mobile first */
.sidebar { display: none; }

/* Desktop */
@media (min-width: 768px) {
  .sidebar { display: block; }
  .bottom-nav { display: none; }
}
```

## Data Context Usage

### Consuming Context
```javascript
import { useData } from '../contexts/DataContext';

function MyComponent() {
  const { envelopes, paymentMethods, addEnvelope } = useData();
  
  return (
    <div>
      {envelopes.map(env => <div key={env.id}>{env.name}</div>)}
    </div>
  );
}
```

### Preferences Context
```javascript
import { usePreferences } from '../contexts/PreferencesContext';

function MyComponent() {
  const { theme, currency, updatePreference } = usePreferences();
  
  return (
    <div className={`theme-${theme}`}>
      Currency: {currency}
    </div>
  );
}
```
