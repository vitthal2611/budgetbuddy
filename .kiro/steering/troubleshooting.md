---
inclusion: manual
---

# Troubleshooting Guide

## Common Issues & Solutions

### Firebase Connection Issues

#### Problem: "Firebase not initialized" error
**Solution:**
1. Check `src/config/firebase.js` configuration
2. Verify environment variables in `.env.local`
3. Ensure Firebase project is active in console
4. Check browser console for specific error messages

#### Problem: Authentication fails
**Solution:**
1. Verify Firebase Authentication is enabled in console
2. Check email/password provider is enabled
3. Clear browser cache and cookies
4. Try incognito/private browsing mode
5. Check Firebase console for authentication errors

#### Problem: Data not syncing
**Solution:**
1. Check internet connection
2. Verify user is authenticated: `console.log(auth.currentUser)`
3. Check Firestore security rules
4. Look for errors in browser console
5. Verify subscription is active (check unsubscribe functions)

### Data Issues

#### Problem: Transactions not appearing
**Solution:**
1. Check if user is logged in
2. Verify transaction was saved: check Firestore console
3. Check transaction filters are not hiding data
4. Clear localStorage and refresh: `localStorage.clear()`
5. Check for JavaScript errors in console

#### Problem: Budget calculations incorrect
**Solution:**
1. Verify transaction amounts are numbers, not strings
2. Check for duplicate transactions
3. Ensure envelope names match exactly (case-sensitive)
4. Look for orphaned budget entries
5. Recalculate from transactions:
```javascript
const spent = transactions
  .filter(t => t.type === 'expense' && t.envelope === envelopeName)
  .reduce((sum, t) => sum + parseFloat(t.amount), 0);
```

#### Problem: Duplicate transactions after import
**Solution:**
1. Check transaction IDs are unique
2. Verify import logic doesn't add existing transactions
3. Use `Set` to filter duplicates:
```javascript
const uniqueTransactions = Array.from(
  new Map(transactions.map(t => [t.id, t])).values()
);
```

### UI/UX Issues

#### Problem: Modal not closing
**Solution:**
1. Check `onClose` prop is passed correctly
2. Verify state update in parent component
3. Check for event propagation issues
4. Add `e.stopPropagation()` to modal content clicks

#### Problem: Infinite re-renders
**Solution:**
1. Check `useEffect` dependency arrays
2. Ensure functions passed as props are wrapped in `useCallback`
3. Use `useMemo` for computed values
4. Avoid setting state in render function

#### Problem: Component not updating
**Solution:**
1. Verify state is being updated correctly
2. Check if component is memoized unnecessarily
3. Ensure props are changing (use React DevTools)
4. Check for stale closures in event handlers

### Performance Issues

#### Problem: Slow page load
**Solution:**
1. Check bundle size: `npm run build` and analyze
2. Implement code splitting for routes
3. Lazy load heavy components
4. Optimize images and assets
5. Use React DevTools Profiler to identify bottlenecks

#### Problem: Laggy UI interactions
**Solution:**
1. Debounce search/filter inputs
2. Use `React.memo` for expensive components
3. Virtualize long lists
4. Avoid inline function definitions in render
5. Check for unnecessary re-renders

### Build & Deployment Issues

#### Problem: Build fails
**Solution:**
1. Clear cache: `rm -rf node_modules package-lock.json && npm install`
2. Check Node version: `node --version` (should be 14+)
3. Fix ESLint errors: `npm run lint`
4. Check for missing dependencies
5. Review error messages carefully

#### Problem: Deployed app shows blank page
**Solution:**
1. Check browser console for errors
2. Verify Firebase config in production
3. Check `firebase.json` rewrites configuration
4. Ensure all environment variables are set
5. Test build locally: `npx serve -s build`

#### Problem: Firebase deployment fails
**Solution:**
1. Login to Firebase: `firebase login`
2. Check project ID: `firebase projects:list`
3. Verify `firebase.json` configuration
4. Ensure build directory exists
5. Try deploying with `--debug` flag

### Browser Compatibility

#### Problem: App not working in Safari
**Solution:**
1. Check for unsupported JavaScript features
2. Add polyfills if needed
3. Test date handling (Safari is strict)
4. Check CSS compatibility
5. Use Babel to transpile modern syntax

#### Problem: Mobile layout broken
**Solution:**
1. Test responsive breakpoints
2. Check viewport meta tag in `index.html`
3. Verify CSS media queries
4. Test on actual devices, not just browser DevTools
5. Check touch event handling

### Data Migration Issues

#### Problem: localStorage data not migrating
**Solution:**
1. Check migration logic in `App.js` useEffect
2. Verify user is authenticated before migration
3. Check for errors in console during migration
4. Manually trigger migration:
```javascript
const savedData = localStorage.getItem('transactions');
if (savedData) {
  const parsed = JSON.parse(savedData);
  await cloudStorage.batchAddTransactions(parsed);
  localStorage.removeItem('transactions');
}
```

#### Problem: Duplicate data after migration
**Solution:**
1. Check if migration has already run
2. Add migration flag to prevent re-running
3. Clear Firestore data and re-migrate
4. Use transaction IDs to prevent duplicates

## Debugging Tools

### Browser DevTools
- Console: Check for errors and warnings
- Network: Monitor Firebase requests
- Application: Inspect localStorage and IndexedDB
- Performance: Profile component renders
- React DevTools: Inspect component tree and props

### Firebase Console
- Authentication: Check user accounts
- Firestore: View and edit data
- Hosting: Check deployment history
- Performance: Monitor app performance
- Analytics: Track user behavior

### Useful Console Commands
```javascript
// Check current user
console.log(auth.currentUser);

// View all transactions
console.log(JSON.parse(localStorage.getItem('transactions')));

// View all budgets
console.log(JSON.parse(localStorage.getItem('budgets')));

// Clear all data
localStorage.clear();

// Force reload
window.location.reload(true);
```

## Getting Help

### Before Asking for Help
1. Check browser console for errors
2. Review this troubleshooting guide
3. Search for similar issues in project documentation
4. Try reproducing in incognito mode
5. Test with different browsers

### Information to Provide
- Browser and version
- Operating system
- Steps to reproduce
- Error messages (full text)
- Screenshots or screen recordings
- Console logs
- Network requests (if relevant)

### Useful Logs
```javascript
// Enable Firebase debug logging
localStorage.setItem('debug', 'firebase:*');

// Log component lifecycle
useEffect(() => {
  console.log('Component mounted');
  return () => console.log('Component unmounted');
}, []);

// Log state changes
useEffect(() => {
  console.log('State changed:', state);
}, [state]);
```

## Emergency Recovery

### Reset Everything
```javascript
// Clear all local data
localStorage.clear();
sessionStorage.clear();

// Sign out
await authService.signOut();

// Reload app
window.location.reload();
```

### Restore from Backup
1. Export data from Firebase console
2. Clear Firestore collections
3. Import backup data
4. Verify data integrity
5. Test app functionality

### Rollback Deployment
```bash
# View deployment history
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:clone source-site-id:source-channel-id target-site-id:live
```
