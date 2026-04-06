import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeLocalStorage } from '../utils/safeStorage';

const PreferencesContext = createContext();

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

export const PreferencesProvider = ({ children }) => {
  const [preferences, setPreferences] = useState(() => {
    const saved = safeLocalStorage.getItem('userPreferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Failed to parse preferences:', error);
      }
    }
    
    // Default preferences
    return {
      budgetStartDay: 1,
      rolloverMode: 'automatic', // automatic, manual, none
      blockOverspending: false, // Strict mode
      defaultView: 'envelopes',
      currency: 'INR',
      theme: 'modern',
      notifications: {
        lowBalance: true,
        overBudget: true,
        monthlyReminder: true
      }
    };
  });

  // Sync to localStorage
  useEffect(() => {
    safeLocalStorage.setItem('userPreferences', JSON.stringify(preferences));
  }, [preferences]);

  // Sync to cloud storage
  useEffect(() => {
    const syncToCloud = async () => {
      try {
        const cloudStorage = (await import('../services/cloudStorage')).default;
        await cloudStorage.savePreferences(preferences);
      } catch (error) {
        console.error('Failed to sync preferences to cloud:', error);
      }
    };

    const timer = setTimeout(syncToCloud, 1000);
    return () => clearTimeout(timer);
  }, [preferences]);

  const updatePreference = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateNotificationPreference = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const value = {
    preferences,
    updatePreference,
    updateNotificationPreference,
    setPreferences
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};
