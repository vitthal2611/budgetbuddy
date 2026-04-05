# Firebase Authentication Localhost Fix

## Problem
Authentication fails when accessing the app from `http://localhost:3000/`

## Root Cause
Firebase Authentication requires all domains (including localhost) to be explicitly authorized in the Firebase Console.

## Solution

### Step 1: Add localhost to Firebase Authorized Domains

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **budgetbuddy-9d7da**
3. Navigate to: **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Enter: `localhost`
6. Click **Add**

### Step 2: Verify Configuration

After adding localhost, your authorized domains should include:
- `budgetbuddy-9d7da.firebaseapp.com` (default)
- `budgetbuddy-9d7da.web.app` (if using Firebase Hosting)
- `localhost` (for local development)

### Step 3: Test Authentication

1. Clear browser cache and cookies
2. Restart your development server:
   ```bash
   npm start
   ```
3. Try signing in again from `http://localhost:3000/`

## Additional Notes

### For Google Sign-In
If you're using Google Sign-In, also ensure:
1. Google provider is enabled in Firebase Console
2. OAuth consent screen is configured in Google Cloud Console
3. Authorized JavaScript origins include `http://localhost:3000`

### Common Errors

**Error: "auth/unauthorized-domain"**
- Solution: Add the domain to Firebase Authorized domains

**Error: "auth/popup-blocked"**
- Solution: The app uses redirect flow which doesn't have this issue

**Error: "auth/network-request-failed"**
- Solution: Check internet connection and Firebase project status

## Testing Checklist

- [ ] localhost added to Firebase Authorized domains
- [ ] Browser cache cleared
- [ ] Development server restarted
- [ ] Email/Password sign-in works
- [ ] Google sign-in works
- [ ] Sign-up works
- [ ] Password reset works

## Production Deployment

When deploying to production, remember to add your production domain:
1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your production domain (e.g., `yourdomain.com`)
3. Add www subdomain if needed (e.g., `www.yourdomain.com`)

## Current Firebase Configuration

- **Project ID**: budgetbuddy-9d7da
- **Auth Domain**: budgetbuddy-9d7da.firebaseapp.com
- **Hosting URL**: https://budgetbuddy-9d7da.web.app

## Support

If issues persist:
1. Check Firebase Console for any service outages
2. Verify Firebase project billing status
3. Check browser console for detailed error messages
4. Ensure Firebase SDK versions are up to date
