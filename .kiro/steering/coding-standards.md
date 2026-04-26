---
inclusion: auto
---

# Coding Standards & Best Practices

## React Component Guidelines

### Component Structure
- Use functional components with hooks (no class components)
- Keep components focused and single-responsibility
- Extract reusable logic into custom hooks
- Place shared components in `src/components/shared/`

### State Management
- Use `useState` for local component state
- Use Context API for global state (DataContext, PreferencesContext)
- Avoid prop drilling - use context when passing data through multiple levels
- Use `useCallback` for functions passed as props to prevent unnecessary re-renders
- Use `useMemo` for expensive computations

### Hooks Best Practices
- Follow React hooks rules (only call at top level, only in React functions)
- Add proper dependency arrays to `useEffect`, `useCallback`, `useMemo`
- Use `useRef` for mutable values that don't trigger re-renders
- Clean up subscriptions and listeners in `useEffect` return functions

## Firebase Integration

### Data Operations
- All Firebase operations go through service layer (`src/services/`)
- Use real-time subscriptions for live data (`subscribeToTransactions`, `subscribeToBudgets`)
- Implement optimistic updates with error rollback
- Handle offline scenarios gracefully

### Error Handling
- Wrap Firebase operations in try-catch blocks
- Show user-friendly error messages
- Log errors to console for debugging
- Rollback optimistic updates on failure

### Data Sync Pattern
```javascript
// Subscribe to real-time updates
useEffect(() => {
  if (!user) return;
  
  const unsubscribe = cloudStorage.subscribeToData((data) => {
    setData(data);
  });
  
  return () => unsubscribe();
}, [user]);
```

## Code Style

### Naming Conventions
- Components: PascalCase (`TransactionModal.js`)
- Functions/variables: camelCase (`handleSaveTransaction`)
- Constants: UPPER_SNAKE_CASE (`MAX_BUDGET_AMOUNT`)
- CSS files: Match component name (`TransactionModal.css`)
- Service files: camelCase with 'Service' suffix (`authService.js`)

### File Organization
- One component per file
- Co-locate CSS with component (same directory)
- Group related components in subdirectories
- Keep utility functions in `src/utils/`

### Import Order
1. React imports
2. Third-party libraries
3. Local components
4. Contexts and hooks
5. Services and utilities
6. CSS files

## UI/UX Standards

### Responsive Design
- Mobile-first approach
- Use CSS media queries for desktop layouts
- Bottom navigation for mobile, sidebar for desktop
- Touch-friendly tap targets (minimum 44x44px)

### Accessibility
- Use semantic HTML elements
- Include ARIA labels where needed
- Ensure keyboard navigation works
- Maintain sufficient color contrast
- Use focus indicators

### User Feedback
- Show loading states during async operations
- Display success/error toasts for user actions
- Confirm destructive actions with dialogs
- Show sync status (syncing, offline indicators)

## Performance

### Optimization Techniques
- Use `React.memo` for expensive components
- Implement virtual scrolling for long lists
- Lazy load routes and heavy components
- Debounce search and filter inputs
- Minimize re-renders with proper dependency arrays

### Bundle Size
- Avoid importing entire libraries (use tree-shaking)
- Code-split routes if needed
- Optimize images and assets
- Remove unused dependencies

## Testing Approach

- Test user interactions, not implementation details
- Mock Firebase services in tests
- Test error scenarios and edge cases
- Ensure accessibility in tests
