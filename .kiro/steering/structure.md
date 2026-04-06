# Project Structure

## Root Directory

```
/
├── src/                    # Source code
├── public/                 # Static assets
├── build/                  # Production build output
├── .kiro/                  # Kiro configuration
├── .firebase/              # Firebase deployment cache
├── node_modules/           # Dependencies
├── package.json            # Project dependencies
├── firebase.json           # Firebase configuration
├── firestore.rules         # Firestore security rules
└── firestore.indexes.json  # Firestore indexes
```

## Source Structure (`src/`)

```
src/
├── components/             # React components
│   ├── Auth.js            # Authentication UI
│   ├── Dashboard.js       # Main dashboard view
│   ├── EnvelopesView.js   # Envelope management
│   ├── Transactions.js    # Transaction list
│   ├── BudgetAllocation.js # Monthly allocation UI
│   ├── IncomeAllocation.js # Income distribution
│   ├── TransactionModal.js # Add/edit transaction
│   ├── ImportTransactions.js # CSV import
│   ├── StorageIndicator.js # Storage usage display
│   └── *.css              # Component styles
├── contexts/
│   └── DataContext.js     # Global state (envelopes, payment methods)
├── services/
│   ├── authService.js     # Firebase auth wrapper
│   └── cloudStorage.js    # Firestore operations
├── utils/
│   ├── storage.js         # localStorage helpers
│   └── safeStorage.js     # Safe localStorage wrapper
├── config/
│   └── firebase.js        # Firebase initialization
├── styles/
│   ├── variables.css      # CSS variables
│   └── modern-variables.css # Modern theme variables
├── App.js                 # Root component
├── App.css                # Global styles
├── index.js               # Entry point
└── index.css              # Base styles
```

## Component Organization

### View Components (Top-level)
- `Auth.js` - Login/signup screen
- `Dashboard.js` - Overview with charts and summaries
- `EnvelopesView.js` - Envelope list and budget overview
- `Transactions.js` - Transaction history with filters
- `BudgetAllocation.js` - Settings and envelope management

### Feature Components
- `TransactionModal.js` - Modal for adding/editing transactions
- `IncomeAllocation.js` - Monthly income distribution UI
- `ImportTransactions.js` - CSV import functionality
- `StorageIndicator.js` - Cloud storage usage indicator

### Component Responsibilities

**App.js**
- Authentication state management
- Tab navigation
- Transaction CRUD operations
- Firebase real-time subscriptions
- Offline/online status monitoring
- Data migration from localStorage to Firebase

**DataContext.js**
- Manages envelopes and payment methods
- Provides validation functions
- Handles localStorage sync
- Syncs with Firebase via custom events

**cloudStorage.js**
- All Firestore operations
- Real-time listeners
- Batch operations for imports
- Offline queue management

## Data Flow Architecture

### State Layers
1. **Firebase (Source of Truth)** - Server-side data
2. **React State** - In-memory app state
3. **localStorage** - Offline persistence

### Sync Pattern
```
User Action
    ↓
Optimistic Update (React State)
    ↓
Background Sync (Firebase)
    ↓
Real-time Listener (Other Devices)
    ↓
Update React State
```

### Context Usage
- `DataContext` - Envelopes and payment methods only
- Component state - Transactions and budgets (managed in App.js)
- Firebase listeners - Real-time sync across devices

## Key Patterns

### Transaction Structure
```javascript
{
  id: "timestamp-random",
  type: "income" | "expense" | "transfer",
  amount: number,
  date: "DD-MM-YYYY",
  note: string,
  
  // For income/expense
  paymentMethod: string,
  envelope: string,  // expense only
  
  // For transfers
  sourceAccount: string,
  destinationAccount: string
}
```

### Budget Structure
```javascript
{
  "YYYY-MM": {
    "Envelope Name": allocatedAmount
  }
}
```

### Envelope Structure
```javascript
{
  name: string,
  category: "need" | "want" | "saving"
}
```

## File Naming Conventions

- Components: `ComponentName.js` + `ComponentName.css`
- Modern styles: `ComponentName.modern.css` (alternative theme)
- Services: `serviceName.js`
- Utilities: `utilityName.js`
- No index.js barrel exports

## Import Patterns

### Absolute imports from src/
```javascript
import { useData } from './contexts/DataContext';
import cloudStorage from './services/cloudStorage';
import authService from './services/authService';
```

### Component imports
```javascript
import Dashboard from './components/Dashboard';
import './components/Dashboard.css';
```

## Testing Structure

- Test files: `*.test.js` (co-located with components)
- Setup: `setupTests.js`
- Currently minimal test coverage

## Documentation Files

- `QUICK_START.md` - User onboarding guide
- `ZERO_BASED_BUDGETING_GUIDE.md` - Budgeting methodology
- `IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- `GOODBUDGET_FLOW_IMPLEMENTATION.md` - Feature implementation notes
- `AUTO_SAVE_FEATURE.md` - Auto-save feature documentation
