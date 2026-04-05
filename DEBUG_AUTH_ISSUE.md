# Authentication Debug Checklist

## Common Issues When Auth Fails on Localhost

Since localhost is already added to authorized domains, let's check these other potential issues:

### 1. Browser Console Errors
Open browser DevTools (F12) and check for:
- CORS errors
- Firebase initialization errors
- Network request failures
- Specific error codes (auth/...)

### 2. Firebase API Key Issues
**Check if API key is restricted:**
1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Select project: budgetbuddy-9d7da
3. Go to: APIs & Services → Credentials
4. Find your API key: AIzaSyDY-LZIb3RZlYAH1eBcTejzGdhZ-b5PEGg
5. Check "Application restrictions"
   - Should be "None" OR
   - Should include "HTTP referrers" with `localhost:3000` and `localhost`

### 3. Firebase Authentication Providers
**Verify providers are enabled:**
1. Firebase Console → Authentication → Sign-in method
2. Check these are ENABLED:
   - ✅ Email/Password
   - ✅ Google (if using Google sign-in)

### 4. Browser Cache/Cookies
**Clear browser data:**
1. Open DevTools (F12)
2. Application tab → Storage
3. Click "Clear site data"
4. Refresh page (Ctrl+Shift+R)

### 5. Third-Party Cookies
**Google Sign-In requires third-party cookies:**
1. Browser Settings → Privacy
2. Ensure third-party cookies are NOT blocked
3. Or add exception for `accounts.google.com`

### 6. Network Issues
**Check if Firebase is reachable:**
```javascript
// Open browser console and run:
fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyDY-LZIb3RZlYAH1eBcTejzGdhZ-b5PEGg', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ returnSecureToken: true })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### 7. Firewall/Antivirus
- Check if firewall is blocking Firebase domains
- Temporarily disable antivirus to test

### 8. Browser Extensions
- Disable ad blockers
- Disable privacy extensions (Privacy Badger, uBlock Origin)
- Try in Incognito/Private mode

### 9. Port Issues
**Try different port:**
```bash
# In package.json, change start script to:
"start": "PORT=3001 react-scripts start"
```
Then add `localhost:3001` to Firebase authorized domains

### 10. Firebase SDK Version
Current version: 12.11.0 (latest)
- This is correct, no issues here

## Quick Test Commands

### Test 1: Check if Firebase is initialized
Open browser console on localhost:3000 and run:
```javascript
console.log(window.firebase);
```

### Test 2: Check auth state
```javascript
import { getAuth } from 'firebase/auth';
const auth = getAuth();
console.log('Auth instance:', auth);
console.log('Current user:', auth.currentUser);
```

### Test 3: Test email sign-in directly
```javascript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
const auth = getAuth();
signInWithEmailAndPassword(auth, 'test@example.com', 'password123')
  .then(user => console.log('Success:', user))
  .catch(error => console.error('Error:', error.code, error.message));
```

## What Error Are You Seeing?

Please check browser console and tell me:
1. **Exact error message** (including error code like `auth/...`)
2. **When does it fail?** (on page load, clicking sign in, after entering credentials?)
3. **Which sign-in method?** (Email/Password or Google?)
4. **Network tab** - Are requests to Firebase failing? (Status codes?)

## Common Error Codes & Solutions

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `auth/unauthorized-domain` | Domain not authorized | Add to Firebase Console |
| `auth/api-key-not-valid` | Invalid API key | Check API key restrictions in Google Cloud Console |
| `auth/network-request-failed` | Network issue | Check internet, firewall, or CORS |
| `auth/popup-blocked` | Popup blocked | App uses redirect, shouldn't happen |
| `auth/invalid-api-key` | Wrong API key | Verify firebaseConfig |
| `auth/app-not-authorized` | App not authorized | Check Google Cloud Console |
| `auth/operation-not-allowed` | Provider disabled | Enable in Firebase Console |

## Next Steps

1. Open browser DevTools (F12)
2. Go to Console tab
3. Refresh page
4. Try to sign in
5. Copy the EXACT error message
6. Share it with me

I'll provide a specific fix once I know the exact error!
