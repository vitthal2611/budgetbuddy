---
inclusion: manual
---

# Testing Guide

## Testing Philosophy

- Test user behavior, not implementation details
- Focus on integration tests over unit tests
- Mock external dependencies (Firebase, localStorage)
- Test accessibility and keyboard navigation
- Cover error scenarios and edge cases

## Test Setup

### Install Testing Dependencies
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Test File Structure
Place test files next to components:
```
src/components/
  TransactionModal.js
  TransactionModal.test.js
  TransactionModal.css
```

## Testing Patterns

### Basic Component Test
```javascript
import { render, screen } from '@testing-library/react';
import TransactionModal from './TransactionModal';

test('renders transaction modal', () => {
  render(<TransactionModal type="expense" onClose={() => {}} />);
  expect(screen.getByText(/add expense/i)).toBeInTheDocument();
});
```

### User Interaction Test
```javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('submits form with valid data', async () => {
  const handleSave = jest.fn();
  render(<TransactionModal type="expense" onSave={handleSave} />);
  
  await userEvent.type(screen.getByLabelText(/amount/i), '50');
  await userEvent.type(screen.getByLabelText(/note/i), 'Groceries');
  await userEvent.click(screen.getByRole('button', { name: /save/i }));
  
  expect(handleSave).toHaveBeenCalledWith(
    expect.objectContaining({
      amount: '50',
      note: 'Groceries'
    })
  );
});
```

### Mocking Firebase
```javascript
jest.mock('../services/cloudStorage', () => ({
  addTransaction: jest.fn().mockResolvedValue({ id: '123' }),
  subscribeToTransactions: jest.fn(() => () => {}),
}));
```

### Testing Context
```javascript
import { render } from '@testing-library/react';
import { DataProvider } from '../contexts/DataContext';

const renderWithContext = (component) => {
  return render(
    <DataProvider>
      {component}
    </DataProvider>
  );
};

test('uses data from context', () => {
  renderWithContext(<MyComponent />);
  // assertions
});
```

### Testing Async Operations
```javascript
import { waitFor } from '@testing-library/react';

test('loads data on mount', async () => {
  render(<TransactionList />);
  
  await waitFor(() => {
    expect(screen.getByText(/groceries/i)).toBeInTheDocument();
  });
});
```

### Testing Error States
```javascript
test('shows error message on save failure', async () => {
  const mockSave = jest.fn().mockRejectedValue(new Error('Network error'));
  render(<TransactionModal onSave={mockSave} />);
  
  await userEvent.click(screen.getByRole('button', { name: /save/i }));
  
  await waitFor(() => {
    expect(screen.getByText(/failed to save/i)).toBeInTheDocument();
  });
});
```

## Accessibility Testing

### Keyboard Navigation
```javascript
test('can navigate with keyboard', async () => {
  render(<TransactionModal />);
  
  await userEvent.tab(); // Focus first input
  expect(screen.getByLabelText(/amount/i)).toHaveFocus();
  
  await userEvent.tab(); // Focus next input
  expect(screen.getByLabelText(/note/i)).toHaveFocus();
});
```

### ARIA Labels
```javascript
test('has proper ARIA labels', () => {
  render(<TransactionModal />);
  
  expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Add Transaction');
  expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test TransactionModal.test.js
```

## Test Coverage Goals

- Critical paths: 90%+ coverage
- UI components: 70%+ coverage
- Utility functions: 100% coverage
- Service layer: 80%+ coverage

## Common Testing Pitfalls

1. **Don't test implementation details** - Test what users see and do
2. **Avoid snapshot tests** - They're brittle and don't catch real bugs
3. **Mock external dependencies** - Don't make real Firebase calls
4. **Clean up after tests** - Clear mocks, timers, and event listeners
5. **Use semantic queries** - Prefer `getByRole` over `getByTestId`

## Example Test Suite

```javascript
describe('TransactionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders with correct title', () => {
    render(<TransactionModal type="expense" />);
    expect(screen.getByText(/add expense/i)).toBeInTheDocument();
  });
  
  test('validates required fields', async () => {
    render(<TransactionModal onSave={jest.fn()} />);
    
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    
    expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
  });
  
  test('calls onSave with form data', async () => {
    const handleSave = jest.fn();
    render(<TransactionModal type="expense" onSave={handleSave} />);
    
    await userEvent.type(screen.getByLabelText(/amount/i), '100');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    
    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({ amount: '100' })
    );
  });
  
  test('closes modal on cancel', async () => {
    const handleClose = jest.fn();
    render(<TransactionModal onClose={handleClose} />);
    
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    
    expect(handleClose).toHaveBeenCalled();
  });
});
```
