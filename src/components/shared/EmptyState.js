import React from 'react';
import './EmptyState.css';

const EmptyState = ({ 
  icon = '📭', 
  title = 'Nothing here yet', 
  message, 
  actionLabel, 
  onAction 
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      {message && <p className="empty-state-message">{message}</p>}
      {actionLabel && onAction && (
        <button className="empty-state-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
