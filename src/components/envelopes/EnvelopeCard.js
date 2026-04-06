import React from 'react';
import './EnvelopeCard.css';

const EnvelopeCard = ({ envelope, onClick }) => {
  const { name, category, filled, spent, remaining } = envelope;
  const percentage = filled > 0 ? (spent / filled) * 100 : 0;
  const isOverBudget = remaining < 0;
  
  const getCategoryIcon = (cat) => {
    switch(cat) {
      case 'need': return '🛒';
      case 'want': return '🎉';
      case 'saving': return '💰';
      default: return '📦';
    }
  };

  return (
    <div 
      className={`envelope-card ${isOverBudget ? 'over-budget' : ''}`}
      onClick={onClick}
    >
      <div className="envelope-card-header">
        <div className="envelope-icon-name">
          <span className={`env-icon ${category}`}>
            {getCategoryIcon(category)}
          </span>
          <span className="env-name">{name}</span>
        </div>
        <div className={`env-remaining ${isOverBudget ? 'negative' : 'positive'}`}>
          ₹{remaining.toLocaleString('en-IN')}
        </div>
      </div>
      
      <div className="envelope-bar">
        <div 
          className={`envelope-bar-fill ${isOverBudget ? 'over' : category}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      <div className="envelope-card-footer">
        <span className="env-spent">Spent: ₹{spent.toLocaleString('en-IN')}</span>
        <span className="env-filled">of ₹{filled.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
};

export default EnvelopeCard;
