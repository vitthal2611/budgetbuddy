import React, { useState, useEffect } from 'react';
import './StorageIndicator.css';
import storage from '../utils/storage';

const StorageIndicator = () => {
  const [usage, setUsage] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    updateUsage();
    
    // Update usage every 10 seconds
    const interval = setInterval(updateUsage, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const updateUsage = () => {
    const usageData = storage.getUsage();
    setUsage(usageData);
  };

  if (!usage) return null;

  const percentage = parseFloat(usage.percentage);
  const isWarning = percentage > 70;
  const isCritical = percentage > 90;

  return (
    <div className="storage-indicator">
      <div 
        className={`storage-bar ${isWarning ? 'warning' : ''} ${isCritical ? 'critical' : ''}`}
        onClick={() => setShowDetails(!showDetails)}
        title={`Storage: ${usage.appTotalMB}MB / ${usage.limitMB}MB (${usage.percentage}%)`}
      >
        <div className="storage-fill" style={{ width: `${percentage}%` }} />
        <span className="storage-text">
          💾 {usage.appTotalMB}MB
        </span>
      </div>

      {showDetails && (
        <div className="storage-details">
          <div className="storage-details-header">
            <h4>Storage Usage</h4>
            <button 
              className="close-details"
              onClick={() => setShowDetails(false)}
            >
              ×
            </button>
          </div>

          <div className="storage-stats">
            <div className="stat-row">
              <span className="stat-label">Used:</span>
              <span className="stat-value">{usage.appTotalMB} MB</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Available:</span>
              <span className="stat-value">{usage.availableMB} MB</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Limit:</span>
              <span className="stat-value">{usage.limitMB} MB</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Usage:</span>
              <span className={`stat-value ${isWarning ? 'warning' : ''} ${isCritical ? 'critical' : ''}`}>
                {usage.percentage}%
              </span>
            </div>
          </div>

          <div className="storage-breakdown">
            <h5>Breakdown:</h5>
            {Object.entries(usage.items).map(([key, item]) => (
              <div key={key} className="breakdown-item">
                <span className="breakdown-key">{key}</span>
                <span className="breakdown-size">{item.sizeMB} MB</span>
              </div>
            ))}
          </div>

          {isWarning && (
            <div className={`storage-warning ${isCritical ? 'critical' : ''}`}>
              {isCritical ? (
                <>
                  <span className="warning-icon">🚨</span>
                  <span>Storage almost full! Export and delete old data.</span>
                </>
              ) : (
                <>
                  <span className="warning-icon">⚠️</span>
                  <span>Storage getting full. Consider exporting old data.</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StorageIndicator;
