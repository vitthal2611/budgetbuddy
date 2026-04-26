---
inclusion: auto
---

# Security Rules & Guidelines

## Authentication Requirements

### User Authentication
- NEVER allow unauthenticated access to user data
- Always check `auth.currentUser` before Firebase operations
- Redirect to login if user is null
- Implement proper session management

```javascript
// Always verify user before operations
const user = auth.currentUser;
if (!user) {
  throw new Error('User must be authenticated');
}
```

## Firestore Security Rules

### User Data Isolation
All user data MUST be scoped to authenticated user's UID:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Rule Enforcement
- NEVER bypass security rules in client code
- Test security rules before deployment
- Use Firebase emulator for local testing
- Review rules regularly for vulnerabilities

## Data Validation

### Input Sanitization
Always validate and sanitize user input:

```javascript
// Validate transaction amount
const amount = parseFloat(input);
if (isNaN(amount) || amount <= 0) {
  throw new Error('Invalid amount');
}

// Sanitize text input
const sanitizedNote = input.trim().substring(0, 500);
```

### Required Validations
- Transaction amounts must be positive numbers
- Dates must be valid ISO format
- Enum values must match allowed types
- String lengths must be within limits
- No script injection in text fields

## Sensitive Data Handling

### What NOT to Store
- NEVER store passwords in plain text
- NEVER store credit card numbers
- NEVER store SSN or sensitive IDs
- NEVER log sensitive user data

### What to Protect
- User email addresses
- Transaction details
- Account balances
- Personal preferences

## API Key Protection

### Environment Variables
- Store Firebase config in environment variables
- NEVER commit `.env` files to git
- Use different configs for dev/prod
- Rotate keys if exposed

```javascript
// .env.local (NEVER commit this file)
REACT_APP_FIREBASE_API_KEY=your_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
```

### .gitignore Requirements
```
.env
.env.local
.env.production
.env.development
firebase-debug.log
.firebase/
```

## XSS Prevention

### Safe Rendering
- React escapes content by default - keep it that way
- NEVER use `dangerouslySetInnerHTML` unless absolutely necessary
- Sanitize any HTML content from external sources
- Validate URLs before rendering links

```javascript
// SAFE - React escapes automatically
<div>{userInput}</div>

// DANGEROUS - Avoid this
<div dangerouslySetInnerHTML={{__html: userInput}} />
```

## CSRF Protection

### Firebase Authentication
- Firebase handles CSRF tokens automatically
- Use Firebase Auth for all authentication
- Don't implement custom auth without CSRF protection

## Data Access Patterns

### Principle of Least Privilege
- Only fetch data that's needed
- Filter data on server side when possible
- Don't expose unnecessary user information
- Limit query results with `.limit()`

```javascript
// Good - Limited query
const q = query(
  collection(db, 'users', userId, 'transactions'),
  orderBy('date', 'desc'),
  limit(100)
);

// Bad - Fetching everything
const q = collection(db, 'users', userId, 'transactions');
```

## Error Handling Security

### Safe Error Messages
- Don't expose system details in error messages
- Log detailed errors server-side only
- Show generic messages to users
- Never reveal database structure

```javascript
try {
  await cloudStorage.saveTransaction(data);
} catch (error) {
  // Log detailed error for debugging
  console.error('Transaction save failed:', error);
  
  // Show generic message to user
  alert('Failed to save transaction. Please try again.');
}
```

## Session Management

### Token Handling
- Firebase handles token refresh automatically
- Don't store tokens in localStorage (Firebase SDK handles this)
- Implement proper sign-out functionality
- Clear sensitive data on sign-out

```javascript
const handleSignOut = async () => {
  try {
    await authService.signOut();
    // Clear local data
    setTransactions([]);
    setBudgets({});
  } catch (error) {
    console.error('Sign out error:', error);
  }
};
```

## Third-Party Dependencies

### Dependency Security
- Regularly update dependencies: `npm audit`
- Review security advisories
- Use `npm audit fix` for automatic fixes
- Avoid dependencies with known vulnerabilities

```bash
# Check for vulnerabilities
npm audit

# Fix automatically when possible
npm audit fix

# Update dependencies
npm update
```

## Content Security Policy

### CSP Headers (if using custom hosting)
```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://apis.google.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://*.firebaseio.com https://*.googleapis.com;
```

## Rate Limiting

### Client-Side Throttling
Implement debouncing for frequent operations:

```javascript
import { debounce } from 'lodash';

const debouncedSearch = debounce((query) => {
  performSearch(query);
}, 300);
```

## Audit Logging

### Important Events to Log
- User authentication (success/failure)
- Data modifications (create/update/delete)
- Permission errors
- Unusual activity patterns

```javascript
// Log important operations
console.log(`[AUDIT] User ${userId} deleted transaction ${transactionId}`);
```

## Security Checklist

Before deploying:
- [ ] Security rules tested and deployed
- [ ] Environment variables configured
- [ ] No sensitive data in code
- [ ] Dependencies updated and audited
- [ ] Error messages don't expose system details
- [ ] Authentication required for all protected routes
- [ ] Input validation implemented
- [ ] XSS prevention verified
- [ ] HTTPS enforced (Firebase Hosting does this)
- [ ] .gitignore includes sensitive files

## Incident Response

### If Security Issue Detected
1. Immediately revoke compromised credentials
2. Review Firebase audit logs
3. Notify affected users if data exposed
4. Patch vulnerability
5. Deploy fix
6. Document incident and prevention measures

## Regular Security Tasks

### Weekly
- Review Firebase console for unusual activity
- Check authentication logs

### Monthly
- Run `npm audit`
- Update dependencies
- Review security rules

### Quarterly
- Full security audit
- Review access permissions
- Update security documentation
