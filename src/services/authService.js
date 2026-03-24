import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from '../config/firebase';
import cloudStorage from './cloudStorage';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.initializePersistence();
  }

  // Initialize auth persistence
  async initializePersistence() {
    try {
      // Use local persistence for "remember me" functionality
      await setPersistence(auth, browserLocalPersistence);
    } catch (error) {
      console.error('Failed to set persistence:', error);
    }
  }

  // Detect if device is mobile
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  // Sign up with email/password
  async signUp(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      this.currentUser = userCredential.user;
      cloudStorage.setUser(userCredential.user.uid);
      return userCredential.user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Sign in with email/password
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      this.currentUser = userCredential.user;
      cloudStorage.setUser(userCredential.user.uid);
      return userCredential.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Sign in with Google (uses redirect for better compatibility and no CORS issues)
  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      // Add prompt to always show account selection
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Always use redirect (works on all platforms, no CORS issues)
      // More reliable than popup, especially with modern browser security policies
      await signInWithRedirect(auth, provider);
      // Note: User will be redirected away and back
      // The result is handled in handleRedirectResult()
    } catch (error) {
      console.error('Google sign in error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Handle redirect result after Google sign-in (for mobile or popup fallback)
  async handleRedirectResult() {
    try {
      const result = await getRedirectResult(auth);
      if (result) {
        this.currentUser = result.user;
        cloudStorage.setUser(result.user.uid);
        console.log('✅ Google sign-in successful:', result.user.email);
        return result.user;
      }
      return null;
    } catch (error) {
      // Filter out harmless Firebase UI errors
      if (error.message?.includes('MDL') || 
          error.message?.includes('onboarding') ||
          error.message?.includes('Cross-Origin-Opener-Policy')) {
        console.debug('Suppressed harmless Firebase UI error:', error.code);
        return null;
      }
      console.error('Redirect result error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Sign out
  async signOut() {
    try {
      await signOut(auth);
      this.currentUser = null;
      cloudStorage.setUser(null);
      cloudStorage.unsubscribeAll();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      if (user) {
        cloudStorage.setUser(user.uid);
      } else {
        cloudStorage.setUser(null);
      }
      callback(user);
    });
  }

  // Get current user
  getCurrentUser() {
    return auth.currentUser || this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getCurrentUser();
  }

  // Handle auth errors with user-friendly messages
  handleAuthError(error) {
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered. Try signing in instead.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/user-not-found': 'No account found with this email. Please sign up.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/weak-password': 'Password should be at least 6 characters long.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later or reset your password.',
      'auth/network-request-failed': 'Network error. Please check your internet connection.',
      'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
      'auth/cancelled-popup-request': 'Another sign-in is in progress.',
      'auth/popup-blocked': 'Popup was blocked. Please allow popups for this site or try again.',
      'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
      'auth/invalid-credential': 'Invalid credentials. Please try again.',
      'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
      'auth/user-disabled': 'This account has been disabled. Please contact support.',
      'auth/requires-recent-login': 'Please sign in again to complete this action.'
    };
    
    const message = errorMessages[error.code] || error.message || 'An error occurred. Please try again.';
    return new Error(message);
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
