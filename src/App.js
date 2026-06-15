import React, { useState, useEffect } from 'react';
import './App.css';
import './styles/animations.css';
import './styles/accessibility.css';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import LoadingSpinner from './components/shared/LoadingSpinner';
import Toast from './components/shared/Toast';
import ErrorBoundary from './components/shared/ErrorBoundary';
import authService from './services/authService';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((authUser) => {
      setUser(authUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (window.confirm('Sign out?')) {
      try {
        await authService.signOut();
      } catch (error) {
        setToast({ message: 'Failed to sign out', type: 'error' });
      }
    }
  };

  if (authLoading) {
    return (
      <div className="loading-screen">
        <LoadingSpinner size="large" message="Loading..." />
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  return (
    <ErrorBoundary>
      <div className="App">
        {!isOnline && (
          <div className="offline-indicator">
            <span className="offline-icon">📡</span>Offline - Changes will sync when connected
          </div>
        )}
        <Dashboard user={user} onSignOut={handleSignOut} />
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
