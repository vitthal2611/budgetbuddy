import React, { useEffect } from 'react';
import './SuccessToast.css';

const SuccessToast = ({ message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="success-toast success-animation" role="alert" aria-live="polite">
      <div className="toast-icon">✓</div>
      <div className="toast-message">{message}</div>
      <button 
        className="toast-close" 
        onClick={onClose}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export default SuccessToast;
