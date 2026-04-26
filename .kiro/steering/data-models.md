---
inclusion: auto
---

# Data Models & Schema

## Transaction Model

### Structure
```javascript
{
  id: string,              // Unique identifier (timestamp-random)
  type: string,            // 'income' | 'expense' | 'transfer'
  amount: number,          // Transaction amount (positive)
  date: string,            // ISO date string (YYYY-MM-DD)
  note: string,            // Description/memo
  
  // For income and expense
  paymentMethod: string,   // Account/payment method name
  
  // For expense only
  envelope: string,        // Budget envelope name
  
  // For transfer only
  sourceAccount: string,   // Source payment method
  destinationAccount: string // Destination payment method
}
```

### Examples

#### Income Transaction
```javascript
{
  id: '1234567890-abc123',
  type: 'income',
  amount: 3000,
  date: '2026-04-15',
  note: 'Monthly salary',
  paymentMethod: 'Checking Account'
}
```

#### Expense Transaction
```javascript
{
  id: '1234567891-def456',
  type: 'expense',
  amount: 50.25,
  date: '2026-04-16',
  note: 'Grocery shopping',
  paymentMethod: 'Credit Card',
  envelope: 'Groceries'
}
```

#### Transfer Transaction
```javascript
{
  id: '1234567892-ghi789',
  type: 'transfer',
  amount: 500,
  date: '2026-04-17',
  note: 'Move to savings',
  sourceAccount: 'Checking Account',
  destinationAccount: 'Savings Account'
}
```

## Budget Model

### Structure
```javascript
{
  'MM-YYYY': {
    'Envelope Name': {
      allocated: number,    // Amount allocated to envelope
      spent: number        // Amount spent from envelope
    }
  },
  '_borrows': {
    'MM-YYYY': {
      'Envelope Name': {
        amount: number,     // Amount borrowed
        from: string       // Source envelope
      }
    }
  }
}
```

### Example
```javascript
{
  '04-2026': {
    'Groceries': {
      allocated: 500,
      spent: 325.50
    },
    'Entertainment': {
      allocated: 200,
      spent: 150
    }
  },
  '_borrows': {
    '04-2026': {
      'Entertainment': {
        amount: 50,
        from: 'Groceries'
      }
    }
  }
}
```

## Envelope Model

### Structure
```javascript
{
  id: string,              // Unique identifier
  name: string,            // Envelope name
  icon: string,            // Emoji icon
  color: string,           // Hex color code
  order: number,           // Display order
  isActive: boolean        // Active status
}
```

### Example
```javascript
{
  id: 'env-1234567890',
  name: 'Groceries',
  icon: '🛒',
  color: '#4CAF50',
  order: 1,
  isActive: true
}
```

## Payment Method Model

### Structure
```javascript
{
  id: string,              // Unique identifier
  name: string,            // Payment method name
  type: string,            // 'checking' | 'savings' | 'credit' | 'cash' | 'other'
  icon: string,            // Emoji icon
  color: string,           // Hex color code
  isActive: boolean        // Active status
}
```

### Example
```javascript
{
  id: 'pm-1234567890',
  name: 'Chase Checking',
  type: 'checking',
  icon: '🏦',
  color: '#2196F3',
  isActive: true
}
```

## Habit Model

### Structure
```javascript
{
  id: string,              // Unique identifier
  name: string,            // Habit name
  description: string,     // Habit description
  frequency: string,       // 'daily' | 'weekly' | 'monthly'
  targetDays: number[],    // Days of week (0-6) for weekly
  completions: {
    'YYYY-MM-DD': boolean  // Completion status by date
  },
  createdAt: string,       // ISO timestamp
  isActive: boolean        // Active status
}
```

### Example
```javascript
{
  id: 'habit-1234567890',
  name: 'Morning Exercise',
  description: 'Exercise for 30 minutes',
  frequency: 'daily',
  targetDays: [1, 2, 3, 4, 5], // Mon-Fri
  completions: {
    '2026-04-15': true,
    '2026-04-16': true,
    '2026-04-17': false
  },
  createdAt: '2026-04-01T00:00:00Z',
  isActive: true
}
```

## Todo Model

### Structure
```javascript
{
  id: string,              // Unique identifier
  title: string,           // Todo title
  description: string,     // Todo description
  quadrant: number,        // 1-4 (Eisenhower Matrix)
  priority: string,        // 'high' | 'medium' | 'low'
  status: string,          // 'pending' | 'in-progress' | 'completed'
  dueDate: string,         // ISO date string
  createdAt: string,       // ISO timestamp
  completedAt: string      // ISO timestamp (if completed)
}
```

### Example
```javascript
{
  id: 'todo-1234567890',
  title: 'Review budget',
  description: 'Review monthly budget allocations',
  quadrant: 1,             // Urgent & Important
  priority: 'high',
  status: 'pending',
  dueDate: '2026-04-20',
  createdAt: '2026-04-15T10:00:00Z',
  completedAt: null
}
```

## Recurring Transaction Model

### Structure
```javascript
{
  id: string,              // Unique identifier
  type: string,            // 'income' | 'expense'
  amount: number,          // Transaction amount
  note: string,            // Description
  paymentMethod: string,   // Payment method
  envelope: string,        // Envelope (for expenses)
  frequency: string,       // 'daily' | 'weekly' | 'monthly' | 'yearly'
  startDate: string,       // ISO date string
  endDate: string,         // ISO date string (optional)
  lastProcessed: string,   // ISO date string
  isActive: boolean        // Active status
}
```

### Example
```javascript
{
  id: 'recurring-1234567890',
  type: 'expense',
  amount: 99.99,
  note: 'Netflix subscription',
  paymentMethod: 'Credit Card',
  envelope: 'Entertainment',
  frequency: 'monthly',
  startDate: '2026-01-01',
  endDate: null,
  lastProcessed: '2026-04-01',
  isActive: true
}
```

## Firestore Collections Structure

```
users/
  {userId}/
    transactions/
      {transactionId}
    budgets/
      data (single document)
    envelopes/
      {envelopeId}
    paymentMethods/
      {paymentMethodId}
    habits/
      {habitId}
    todos/
      {todoId}
    recurring/
      {recurringId}
    preferences/
      settings (single document)
```

## Data Validation Rules

### Transaction Validation
- `amount` must be positive number
- `date` must be valid ISO date string
- `type` must be one of: income, expense, transfer
- `paymentMethod` required for income/expense
- `envelope` required for expense
- `sourceAccount` and `destinationAccount` required for transfer

### Budget Validation
- Month key format: `MM-YYYY`
- `allocated` and `spent` must be non-negative numbers
- Envelope names must match existing envelopes

### Envelope Validation
- `name` must be unique and non-empty
- `color` must be valid hex color
- `order` must be non-negative integer

### Payment Method Validation
- `name` must be unique and non-empty
- `type` must be valid payment type
- `color` must be valid hex color

## Computed Values

### Account Balance
```javascript
const balance = transactions.reduce((sum, t) => {
  if (t.paymentMethod === accountName) {
    return t.type === 'income' ? sum + t.amount : sum - t.amount;
  }
  if (t.sourceAccount === accountName) return sum - t.amount;
  if (t.destinationAccount === accountName) return sum + t.amount;
  return sum;
}, 0);
```

### Envelope Spent
```javascript
const spent = transactions
  .filter(t => t.type === 'expense' && t.envelope === envelopeName)
  .reduce((sum, t) => sum + parseFloat(t.amount), 0);
```

### Available Budget
```javascript
const available = (budgets[monthKey]?.[envelope]?.allocated || 0) - spent;
```
