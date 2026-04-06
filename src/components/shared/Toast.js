import React, { useEffect } from 'react';
import './Toast.css';

// Usage: <Toast message="Saved!" type="success" onClose={() => setToast(null)} />
// type: 'success' | 'error' | 'info'
const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`toast-bar toast-${type}`} onClick={onClose}>
      <span className="toast-icon">
        {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
      </span>
      <span className="toast-msg">{message}</span>
    </div>
  );
};

export default Toast;
