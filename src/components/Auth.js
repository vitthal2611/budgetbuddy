import React, { useState, useEffect } from 'react';
import './Auth.css';
import authService from '../services/authService';

const Auth = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGoogleRedirect, setIsGoogleRedirect] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setError(''); // Clear network errors when back online
    };
    const handleOffline = () => {
      setIsOnline(false);
      setError('No internet connection. Please check your network.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle redirect result on component mount (for Google sign-in)
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const user = await authService.handleRedirectResult();
        if (user) {
          console.log('Google sign-in successful:', user.email);
          onAuthSuccess();
        }
      } catch (err) {
        console.error('Redirect result error:', err);
        setError(err.message);
      }
    };

    checkRedirectResult();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up validation
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        
        await authService.signUp(email, password);
      } else {
        // Sign in
        await authService.signIn(email, password);
      }
      
      onAuthSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    setIsGoogleRedirect(true);
    try {
      const result = await authService.signInWithGoogle();
      if (result) {
        // Popup flow (localhost) — result returned directly
        onAuthSuccess();
      }
      // Redirect flow (production) — page reloads, nothing runs after this
    } catch (err) {
      setError(err.message);
      setLoading(false);
      setIsGoogleRedirect(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await authService.resetPassword(email);
      alert('Password reset email sent! Check your inbox.');
      setShowResetPassword(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (showResetPassword) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Reset Password</h1>
            <p>Enter your email to receive a password reset link</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              className="btn-link"
              onClick={() => setShowResetPassword(false)}
              disabled={loading}
            >
              Back to Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Show loading state only during Google redirect
  if (isGoogleRedirect && loading && !error) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>💰 Budget Buddy</h1>
          </div>
          <div className="auth-loading">
            <div className="loading-spinner"></div>
            <p>Signing you in...</p>
            <p className="loading-hint">Please wait, you may be redirected to Google</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>💰 Budget Buddy</h1>
          <p>{isSignUp ? 'Create your account' : 'Welcome back!'}</p>
        </div>

        {!isOnline && (
          <div className="auth-warning">
            <span>⚠️</span>
            <span>You're offline. Please check your internet connection.</span>
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          {isSignUp && (
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={6}
              />
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading || !isOnline}
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button 
          className="btn-google"
          onClick={handleGoogleSignIn}
          disabled={loading || !isOnline}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="auth-footer">
          {!isSignUp && (
            <button
              type="button"
              className="btn-link"
              onClick={() => setShowResetPassword(true)}
              disabled={loading}
            >
              Forgot password?
            </button>
          )}
          
          <button
            type="button"
            className="btn-link"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setConfirmPassword('');
            }}
            disabled={loading}
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        <div className="auth-features">
          <div className="feature">
            <span className="feature-icon">🔄</span>
            <span>Sync across devices</span>
          </div>
          <div className="feature">
            <span className="feature-icon">☁️</span>
            <span>Cloud backup</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🔒</span>
            <span>Secure & private</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
