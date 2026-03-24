import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeLocalStorage } from '../utils/safeStorage';

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
    const saved = safeLocalStorage.getItem('envelopes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Failed to parse envelopes:', error);
        return [];
      }
    }
    
    // Migration: Check for old data structure
    const oldEnvelopes = safeLocalStorage.getItem('customEnvelopes');
    const oldCategories = safeLocalStorage.getItem('envelopeCategories');
    if (oldEnvelopes) {
      try {
        const envelopeNames = JSON.parse(oldEnvelopes);
        const categories = oldCategories ? JSON.parse(oldCategories) : {};
        const migrated = envelopeNames.map(name => ({
          name,
          category: categories[name] || 'need'
        }));
        safeLocalStorage.setItem('envelopes', JSON.stringify(migrated));
        safeLocalStorage.removeItem('customEnvelopes');
        safeLocalStorage.removeItem('envelopeCategories');
        return migrated;
      } catch (error) {
        console.error('Failed to migrate envelopes:', error);
        return [];
      }
    }
    
    return [];
  });

  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState(() => {
    const saved = safeLocalStorage.getItem('paymentMethods');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Failed to parse payment methods:', error);
        return [];
      }
    }
    return [];
  });

  // Sync envelopes to localStorage
  useEffect(() => {
    safeLocalStorage.setItem('envelopes', JSON.stringify(envelopes));
  }, [envelopes]);

  // Sync payment methods to localStorage
  useEffect(() => {
    safeLocalStorage.setItem('paymentMethods', JSON.stringify(paymentMethods));
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

  // Validation functions for imports
  const validateTransaction = (transaction) => {
    const errors = [];

    // Validate required fields
    if (!transaction.date) {
      errors.push('Date is required');
    } else if (!isValidDate(transaction.date)) {
      errors.push('Invalid date format. Use DD-MM-YYYY');
    }

    if (!transaction.amount || isNaN(parseFloat(transaction.amount))) {
      errors.push('Valid amount is required');
    } else if (parseFloat(transaction.amount) <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!transaction.type || !['income', 'expense', 'transfer'].includes(transaction.type)) {
      errors.push('Type must be income, expense, or transfer');
    }

    if (!transaction.note || transaction.note.trim() === '') {
      errors.push('Note is required');
    }

    // Type-specific validation
    if (transaction.type === 'transfer') {
      if (!transaction.sourceAccount) {
        errors.push('Source account is required for transfers');
      }
      if (!transaction.destinationAccount) {
        errors.push('Destination account is required for transfers');
      }
      if (transaction.sourceAccount === transaction.destinationAccount) {
        errors.push('Source and destination accounts must be different');
      }
    } else {
      if (!transaction.paymentMethod) {
        errors.push('Payment method is required');
      }
      if (transaction.type === 'expense' && !transaction.envelope) {
        errors.push('Envelope is required for expenses');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const isValidDate = (dateStr) => {
    const match = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!match) return false;

    const [, day, month, year] = match;
    const date = new Date(year, month - 1, day);
    
    return date.getFullYear() === parseInt(year) &&
           date.getMonth() === parseInt(month) - 1 &&
           date.getDate() === parseInt(day);
  };

  const detectDuplicates = (newTransactions, existingTransactions) => {
    const duplicates = [];
    
    newTransactions.forEach((newTx, idx) => {
      const isDuplicate = existingTransactions.some(existingTx => {
        return existingTx.date === newTx.date &&
               existingTx.amount === newTx.amount &&
               existingTx.type === newTx.type &&
               existingTx.note === newTx.note;
      });
      
      if (isDuplicate) {
        duplicates.push({ index: idx, transaction: newTx });
      }
    });

    return duplicates;
  };

  const normalizeAmount = (amount) => {
    if (typeof amount === 'number') return Math.abs(amount);
    
    const cleaned = amount.toString().replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    
    return isNaN(parsed) ? 0 : Math.abs(parsed);
  };

  // Generate unique transaction ID with collision prevention
  const generateTransactionId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const value = {
    envelopes,
    paymentMethods,
    addEnvelope,
    removeEnvelope,
    getEnvelopeCategory,
    addPaymentMethod,
    setEnvelopes,
    setPaymentMethods,
    // Validation functions
    validateTransaction,
    isValidDate,
    detectDuplicates,
    normalizeAmount,
    generateTransactionId
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
