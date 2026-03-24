import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../config/firebase';
import cloudStorage from './cloudStorage';

class AuthService {
  constructor() {
    this.currentUser = null;
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

  // Sign in with Google (uses redirect for mobile compatibility)
  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      // Add prompt to always show account selection
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Use redirect instead of popup (better for mobile)
      await signInWithRedirect(auth, provider);
      // Note: User will be redirected away and back
      // The result is handled in handleRedirectResult()
    } catch (error) {
      console.error('Google sign in error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Handle redirect result after Google sign-in
  async handleRedirectResult() {
    try {
      const result = await getRedirectResult(auth);
      if (result) {
        this.currentUser = result.user;
        cloudStorage.setUser(result.user.uid);
        return result.user;
      }
      return null;
    } catch (error) {
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
    return this.currentUser;
  }

  // Handle auth errors
  handleAuthError(error) {
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Check your connection',
      'auth/popup-closed-by-user': 'Sign-in popup was closed',
      'auth/cancelled-popup-request': 'Sign-in was cancelled',
      'auth/popup-blocked': 'Popup was blocked by browser. Please allow popups for this site.'
    };
    
    return new Error(errorMessages[error.code] || error.message);
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
