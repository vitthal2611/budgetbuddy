# 🔧 Troubleshooting: Transactions Not Persisting on Refresh

## Issue Description
Transactions disappear after browser refresh, indicating they're not being saved to Firebase or not being loaded correctly.

---

## Quick Diagnosis

### Step 1: Open Debug Page
1. Open `debug-transactions.html` in your browser
2. Click through each test button
3. Check which step fails

### Step 2: Check Browser Console
1. Open browser console (F12)
2. Look for errors (red text)
3. Common errors:
   - `PERMISSION_DENIED` - Security rules blocking
   - `UNAUTHENTICATED` - User not signed in
   - `NOT_FOUND` - Collection doesn't exist

---

## Common Causes & Solutions

### Cause 1: User Not Authenticated ❌

**Symptoms:**
- Console shows: `User not authenticated`
- Transactions work but don't save
- No error messages shown

**Solution:**
```javascript
// Check if user is signed in
console.log('Current user:', auth.currentUser);

// If null, sign in first
```

**Fix:** Make sure you're signed in to the app before adding transactions.

---

### Cause 2: Security Rules Too Strict 🔒

**Symptoms:**
- Console shows: `PERMISSION_DENIED`
- Error: `Missing or insufficient permissions`

**Diagnosis:**
```bash
# Check Firebase Console > Firestore > Rules > Logs
# Look for denied requests
```

**Solution:** The security rules require exact field matching. I've fixed the update function to always include the `id` field.

**What was fixed:**
```javascript
// BEFORE (missing id on update)
await setDoc(docRef, {
  ...updates,
  updatedAt: serverTimestamp()
}, { merge: true });

// AFTER (includes id)
await setDoc(docRef, {
  ...updates,
  id: transactionId.toString(),  // ✅ Always present
  updatedAt: serverTimestamp()
}, { merge: true });
```

---

### Cause 3: Offline Persistence Not Working 📡

**Symptoms:**
- Works when online
- Fails when offline
- Data disappears on refresh

**Solution:**
Firestore offline persistence is already enabled in `firebase.js`:
```javascript
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
```

**Check:**
1. Open DevTools > Application > IndexedDB
2. Look for `firestore` database
3. Should contain cached data

---

### Cause 4: Real-time Listener Not Subscribing 🔄

**Symptoms:**
- Transactions save but don't appear after refresh
- Console shows: `Subscribing to transactions...` but no data

**Diagnosis:**
```javascript
// Add to App.js subscription
const unsubTransactions = cloudStorage.subscribeToTransactions((data) => {
  console.log('📥 Received transactions from Firebase:', data.length);
  setTransactions(data);
});
```

**Check Console:**
- Should see: `📥 Received transactions from Firebase: X`
- If 0, no transactions in Firebase
- If no message, subscription not working

---

### Cause 5: Wrong User ID 🆔

**Symptoms:**
- Transactions save but to wrong user
- Can't see own transactions
- See other user's transactions

**Diagnosis:**
```javascript
// Check current user ID
console.log('Auth UID:', auth.currentUser?.uid);
console.log('CloudStorage UID:', cloudStorage.userId);

// Should match!
```

**Solution:**
```javascript
// Ensure cloudStorage.setUser() is called on auth
authService.onAuthStateChange((user) => {
  if (user) {
    cloudStorage.setUser(user.uid);  // ✅ Must be called
  }
});
```

---

## Step-by-Step Debugging

### 1. Verify Authentication
```javascript
// In browser console
console.log('User:', auth.currentUser);
console.log('Email:', auth.currentUser?.email);
console.log('UID:', auth.currentUser?.uid);
```

**Expected:** User object with email and UID
**If null:** Sign in first

### 2. Test Manual Save
```javascript
// In browser console
const testTransaction = {
  id: `test-${Date.now()}`,
  type: 'expense',
  amount: 100,
  date: '01-01-2025',
  note: 'Test',
  paymentMethod: 'Cash',
  envelope: 'Testing'
};

await cloudStorage.addTransaction(testTransaction);
console.log('✅ Saved successfully');
```

**Expected:** Success message
**If error:** Check error message

### 3. Verify Data in Firebase Console
1. Go to: https://console.firebase.google.com/project/budgetbuddy-9d7da/firestore/data
2. Navigate to: `users/{your-uid}/transactions`
3. Check if transactions exist

**Expected:** See your transactions
**If empty:** Transactions not saving

### 4. Test Real-time Listener
```javascript
// In browser console
cloudStorage.subscribeToTransactions((data) => {
  console.log('📥 Received:', data.length, 'transactions');
  console.log('First transaction:', data[0]);
});
```

**Expected:** Log showing transaction count
**If 0:** No transactions in Firebase
**If no log:** Listener not working

### 5. Check Security Rules
```javascript
// Try to read transactions
const transactionsRef = collection(db, 'users', auth.currentUser.uid, 'transactions');
const snapshot = await getDocs(transactionsRef);
console.log('Can read:', snapshot.size, 'transactions');
```

**Expected:** Number of transactions
**If error:** Security rules blocking

---

## Fixes Applied

### Fix 1: Update Function Now Includes ID ✅
**File:** `src/services/cloudStorage.js`
**Change:** Added `id` field to update operations

```javascript
// Now includes id for security rules validation
await setDoc(docRef, {
  ...updates,
  id: transactionId.toString(),  // ✅ Added
  updatedAt: serverTimestamp()
}, { merge: true });
```

---

## Testing After Fix

### Test 1: Create Transaction
1. Open your app
2. Add a new transaction
3. Check browser console for errors
4. Refresh page
5. Transaction should still be there ✅

### Test 2: Edit Transaction
1. Edit an existing transaction
2. Save changes
3. Refresh page
4. Changes should persist ✅

### Test 3: Offline Mode
1. Open DevTools > Network
2. Set to "Offline"
3. Add transaction (should work)
4. Set to "Online"
5. Transaction should sync ✅

---

## Still Not Working?

### Check These:

1. **Browser Console Errors**
   - Open F12
   - Look for red errors
   - Copy error message

2. **Firebase Console Logs**
   - Go to: Firestore > Rules > Logs
   - Check for denied requests
   - Note the error code

3. **Network Tab**
   - Open F12 > Network
   - Filter by "firestore"
   - Check if requests are being made
   - Check response status (should be 200)

4. **IndexedDB**
   - Open F12 > Application > IndexedDB
   - Look for `firestore` database
   - Check if data is cached

---

## Emergency: Temporarily Relax Rules

**⚠️ ONLY FOR DEBUGGING - NOT FOR PRODUCTION**

If you need to test if security rules are the issue:

```javascript
// firestore.rules - TEMPORARY
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

```bash
firebase deploy --only firestore:rules
```

**Test if transactions persist now:**
- If YES: Security rules were too strict
- If NO: Different issue

**⚠️ IMPORTANT:** Redeploy proper rules immediately after testing!

---

## Contact Support

If issue persists after trying all steps:

1. **Collect Information:**
   - Browser console errors
   - Firebase Console logs
   - Network tab screenshots
   - Steps to reproduce

2. **Check Firebase Status:**
   - https://status.firebase.google.com/

3. **Firebase Support:**
   - https://firebase.google.com/support

---

## Prevention

To avoid this issue in future:

1. ✅ Always test after deploying security rules
2. ✅ Check browser console regularly
3. ✅ Monitor Firebase Console logs
4. ✅ Test offline mode
5. ✅ Verify data in Firebase Console
6. ✅ Use debug tools provided

---

## Summary

**Most Likely Cause:** Security rules validation on update
**Fix Applied:** Added `id` field to update operations
**Next Step:** Test creating and editing transactions
**Verification:** Refresh page and check if data persists

**If still not working:** Use `debug-transactions.html` to diagnose the exact issue.
