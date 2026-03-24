import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  // Envelopes with categories
  const [envelopes, setEnvelopes] = useState(() => {
    const saved = localStorage.getItem('envelopes');
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Migration: Check for old data structure
    const oldEnvelopes = localStorage.getItem('customEnvelopes');
    const oldCategories = localStorage.getItem('envelopeCategories');
    if (oldEnvelopes) {
      const envelopeNames = JSON.parse(oldEnvelopes);
      const categories = oldCategories ? JSON.parse(oldCategories) : {};
      const migrated = envelopeNames.map(name => ({
        name,
        category: categories[name] || 'need'
      }));
      localStorage.setItem('envelopes', JSON.stringify(migrated));
      localStorage.removeItem('customEnvelopes');
      localStorage.removeItem('envelopeCategories');
      return migrated;
    }
    
    return [];
  });

  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState(() => {
    const saved = localStorage.getItem('paymentMethods');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync envelopes to localStorage
  useEffect(() => {
    localStorage.setItem('envelopes', JSON.stringify(envelopes));
  }, [envelopes]);

  // Sync payment methods to localStorage
  useEffect(() => {
    localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  // Helper functions
  const addEnvelope = (name, category = 'need') => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Envelope name cannot be empty');
    }
    if (envelopes.some(env => env.name === trimmedName)) {
      throw new Error('Envelope already exists');
    }
    setEnvelopes([...envelopes, { name: trimmedName, category }]);
  };

  const removeEnvelope = (name) => {
    setEnvelopes(envelopes.filter(env => env.name !== name));
    // Return the envelope name so components can clean up related data
    return name;
  };

  const getEnvelopeCategory = (name) => {
    const envelope = envelopes.find(env => env.name === name);
    return envelope ? envelope.category : 'need';
  };

  const addPaymentMethod = (method) => {
    const trimmedMethod = method.trim();
    if (!trimmedMethod) {
      throw new Error('Payment method cannot be empty');
    }
    if (paymentMethods.includes(trimmedMethod)) {
      throw new Error('Payment method already exists');
    }
    setPaymentMethods([...paymentMethods, trimmedMethod]);
  };

  const value = {
    envelopes,
    paymentMethods,
    addEnvelope,
    removeEnvelope,
    getEnvelopeCategory,
    addPaymentMethod,
    setEnvelopes,
    setPaymentMethods
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
