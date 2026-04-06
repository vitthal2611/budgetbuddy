import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { safeLocalStorage } from '../utils/safeStorage';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Envelope types:
// regular - standard monthly envelope
// annual  - spreads a yearly amount across 12 months (e.g. ₹12000/yr → ₹1000/mo fill)
// goal    - one-time savings goal with optional due date

export const DataProvider = ({ children, onLoadFromCloud, onEnvelopesChange, onPaymentMethodsChange }) => {
  // Envelopes with categories and types
  const [envelopes, setEnvelopesState] = useState(() => {
    const saved = safeLocalStorage.getItem('envelopes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map(env => ({ envelopeType: 'regular', ...env }));
      } catch (error) {
        console.error('Failed to parse envelopes:', error);
        return [];
      }
    }

    // Migration: Check for old data structure
    const oldEnvelopes = safeLocalStorage.getItem('customEnvelopes');
    const oldCategories = safeLocalStorage.getItem('envelopeCategories');
    if (oldEnvelopes && !saved) {
      try {
        const envelopeNames = JSON.parse(oldEnvelopes);
        const categories = oldCategories ? JSON.parse(oldCategories) : {};
        const migrated = envelopeNames.map(name => ({
          name,
          category: categories[name] || 'need',
          envelopeType: 'regular'
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
  const [paymentMethods, setPaymentMethodsState] = useState(() => {
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

  // Separate timeout refs so envelope and payment method debounces don't cancel each other
  const envelopeSyncRef = useRef(null);
  const paymentMethodSyncRef = useRef(null);
  // Flag to suppress cloud sync when data is being loaded from cloud
  const suppressSyncRef = useRef(true);

  // Enable cloud sync after initial load delay
  useEffect(() => {
    const timer = setTimeout(() => {
      suppressSyncRef.current = false;
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const setEnvelopes = useCallback((data) => {
    setEnvelopesState(data);
  }, []);

  const setPaymentMethods = useCallback((data) => {
    setPaymentMethodsState(data);
  }, []);

  // Sync envelopes to localStorage and optionally cloud
  useEffect(() => {
    safeLocalStorage.setItem('envelopes', JSON.stringify(envelopes));

    if (suppressSyncRef.current) return;

    if (envelopeSyncRef.current) clearTimeout(envelopeSyncRef.current);
    envelopeSyncRef.current = setTimeout(async () => {
      try {
        const cloudStorage = (await import('../services/cloudStorage')).default;
        await cloudStorage.saveEnvelopes(envelopes);
        if (onEnvelopesChange) onEnvelopesChange(envelopes);
      } catch (error) {
        console.error('Failed to sync envelopes to cloud:', error);
      }
    }, 1000);
  }, [envelopes]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync payment methods to localStorage and optionally cloud
  useEffect(() => {
    safeLocalStorage.setItem('paymentMethods', JSON.stringify(paymentMethods));

    if (suppressSyncRef.current) return;

    if (paymentMethodSyncRef.current) clearTimeout(paymentMethodSyncRef.current);
    paymentMethodSyncRef.current = setTimeout(async () => {
      try {
        const cloudStorage = (await import('../services/cloudStorage')).default;
        await cloudStorage.savePaymentMethods(paymentMethods);
        if (onPaymentMethodsChange) onPaymentMethodsChange(paymentMethods);
      } catch (error) {
        console.error('Failed to sync payment methods to cloud:', error);
      }
    }, 1000);
  }, [paymentMethods]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (envelopeSyncRef.current) clearTimeout(envelopeSyncRef.current);
      if (paymentMethodSyncRef.current) clearTimeout(paymentMethodSyncRef.current);
    };
  }, []);

  // Called by App.js when cloud data arrives - suppresses re-sync back to cloud
  const loadFromCloud = useCallback((cloudEnvelopes, cloudPaymentMethods) => {
    suppressSyncRef.current = true;

    if (cloudEnvelopes !== undefined) {
      setEnvelopesState(cloudEnvelopes);
      safeLocalStorage.setItem('envelopes', JSON.stringify(cloudEnvelopes));
    }
    if (cloudPaymentMethods !== undefined) {
      setPaymentMethodsState(cloudPaymentMethods);
      safeLocalStorage.setItem('paymentMethods', JSON.stringify(cloudPaymentMethods));
    }

    // Re-enable sync after writes settle
    setTimeout(() => {
      suppressSyncRef.current = false;
    }, 2000);
  }, []);

  // Register loadFromCloud with parent on every render so the ref stays current
  if (onLoadFromCloud) {
    onLoadFromCloud(loadFromCloud);
  }

  // Helper functions
  const addEnvelope = (name, category = 'need', options = {}) => {
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error('Envelope name cannot be empty');
    if (envelopes.some(env => env.name === trimmedName)) throw new Error('Envelope already exists');

    const { envelopeType = 'regular', annualAmount, goalAmount, dueDate } = options;
    const newEnv = { name: trimmedName, category, envelopeType };
    if (envelopeType === 'annual' && annualAmount) {
      newEnv.annualAmount = parseFloat(annualAmount);
      newEnv.monthlyFill = Math.ceil(parseFloat(annualAmount) / 12);
    }
    if (envelopeType === 'goal') {
      if (goalAmount) newEnv.goalAmount = parseFloat(goalAmount);
      if (dueDate) newEnv.dueDate = dueDate;
    }
    setEnvelopesState(prev => [...prev, newEnv]);
  };

  const removeEnvelope = (name) => {
    setEnvelopesState(prev => prev.filter(env => env.name !== name));
    return name;
  };

  const updateEnvelope = (originalName, updates) => {
    const trimmedName = updates.name?.trim();
    if (!trimmedName) throw new Error('Envelope name cannot be empty');
    if (trimmedName !== originalName && envelopes.some(env => env.name === trimmedName)) {
      throw new Error('An envelope with that name already exists');
    }
    setEnvelopesState(prev => prev.map(env => {
      if (env.name !== originalName) return env;
      const updated = { ...env, ...updates, name: trimmedName };
      if (updated.envelopeType === 'annual' && updated.annualAmount) {
        updated.monthlyFill = Math.ceil(parseFloat(updated.annualAmount) / 12);
      }
      return updated;
    }));
    return { originalName, newName: trimmedName };
  };

  const getEnvelopeCategory = (name) => {
    const envelope = envelopes.find(env => env.name === name);
    return envelope ? envelope.category : 'need';
  };

  const addPaymentMethod = (method) => {
    const trimmedMethod = method.trim();
    if (!trimmedMethod) throw new Error('Payment method cannot be empty');
    if (paymentMethods.includes(trimmedMethod)) throw new Error('Payment method already exists');
    setPaymentMethodsState(prev => [...prev, trimmedMethod]);
  };

  const validateTransaction = (transaction) => {
    const errors = [];

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

    if (transaction.type === 'transfer') {
      if (!transaction.sourceAccount) errors.push('Source account is required for transfers');
      if (!transaction.destinationAccount) errors.push('Destination account is required for transfers');
      if (transaction.sourceAccount === transaction.destinationAccount) {
        errors.push('Source and destination accounts must be different');
      }
    } else {
      if (!transaction.paymentMethod) errors.push('Payment method is required');
      if (transaction.type === 'expense' && !transaction.envelope) {
        errors.push('Envelope is required for expenses');
      }
    }

    return { isValid: errors.length === 0, errors };
  };

  const isValidDate = (dateStr) => {
    const match = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!match) return false;
    const [, day, month, year] = match;
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === parseInt(year) &&
      date.getMonth() === parseInt(month) - 1 &&
      date.getDate() === parseInt(day)
    );
  };

  const detectDuplicates = (newTransactions, existingTransactions) => {
    return newTransactions.reduce((acc, newTx, idx) => {
      const isDuplicate = existingTransactions.some(
        ex =>
          ex.date === newTx.date &&
          ex.amount === newTx.amount &&
          ex.type === newTx.type &&
          ex.note === newTx.note
      );
      if (isDuplicate) acc.push({ index: idx, transaction: newTx });
      return acc;
    }, []);
  };

  const normalizeAmount = (amount) => {
    if (typeof amount === 'number') return Math.abs(amount);
    const cleaned = amount.toString().replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.abs(parsed);
  };

  const generateTransactionId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const value = {
    envelopes,
    paymentMethods,
    addEnvelope,
    removeEnvelope,
    updateEnvelope,
    getEnvelopeCategory,
    addPaymentMethod,
    setEnvelopes,
    setPaymentMethods,
    loadFromCloud,
    validateTransaction,
    isValidDate,
    detectDuplicates,
    normalizeAmount,
    generateTransactionId
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
