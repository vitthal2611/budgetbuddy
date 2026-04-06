import React from 'react';
import './SkeletonLoader.css';

export const SkeletonCard = () => (
  <div className="skeleton-card-wrapper">
    <div className="skeleton skeleton-card"></div>
  </div>
);

export const SkeletonText = ({ lines = 3 }) => (
  <div className="skeleton-text-wrapper">
    {Array.from({ length: lines }).map((_, idx) => (
      <div key={idx} className="skeleton skeleton-text"></div>
    ))}
  </div>
);

export const SkeletonEnvelope = () => (
  <div className="skeleton-envelope">
    <div className="skeleton-envelope-header">
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-amount"></div>
    </div>
    <div className="skeleton skeleton-bar"></div>
    <div className="skeleton-envelope-footer">
      <div className="skeleton skeleton-text-small"></div>
      <div className="skeleton skeleton-text-small"></div>
    </div>
  </div>
);

export const SkeletonTransaction = () => (
  <div className="skeleton-transaction">
    <div className="skeleton skeleton-icon"></div>
    <div className="skeleton-transaction-content">
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text-small"></div>
    </div>
    <div className="skeleton skeleton-amount"></div>
  </div>
);

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return <SkeletonCard />;
      case 'text':
        return <SkeletonText />;
      case 'envelope':
        return <SkeletonEnvelope />;
      case 'transaction':
        return <SkeletonTransaction />;
      default:
        return <SkeletonCard />;
    }
  };

  return (
    <div className="skeleton-loader">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx}>{renderSkeleton()}</div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
