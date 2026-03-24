/**
 * Enhanced localStorage Manager
 * Provides better error handling, versioning, and storage monitoring
 */

class StorageManager {
  constructor() {
    this.prefix = 'budgetbuddy_';
    this.version = '1.0';
  }

  /**
   * Save data to localStorage with error handling
   * @param {string} key - Storage key
   * @param {any} data - Data to save
   * @returns {boolean} Success status
   */
  save(key, data) {
    try {
      const payload = {
        version: this.version,
        timestamp: Date.now(),
        data: data
      };
      
      const json = JSON.stringify(payload);
      localStorage.setItem(this.prefix + key, json);
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded');
        this.handleQuotaExceeded(key, data);
      } else {
        console.error('Storage error:', e);
      }
      return false;
    }
  }

  /**
   * Load data from localStorage with migration support
   * @param {string} key - Storage key
   * @returns {any} Loaded data or null
   */
  load(key) {
    try {
      const json = localStorage.getItem(this.prefix + key);
      if (!json) return null;
      
      const parsed = JSON.parse(json);
      
      // Handle old format (direct data, no version wrapper)
      if (!parsed.version) {
        console.log(`Migrating old format for key: ${key}`);
        return parsed;
      }
      
      // Handle new format
      return parsed.data;
    } catch (e) {
      console.error('Load error:', e);
      return null;
    }
  }

  /**
   * Remove data from localStorage
   * @param {string} key - Storage key
   */
  remove(key) {
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (e) {
      console.error('Remove error:', e);
      return false;
    }
  }

  /**
   * Get storage usage statistics
   * @returns {object} Usage statistics
   */
  getUsage() {
    let total = 0;
    let appTotal = 0;
    const items = {};

    // Calculate total localStorage usage
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const size = localStorage[key].length;
        total += size;
        
        // Track app-specific storage
        if (key.startsWith(this.prefix)) {
          appTotal += size;
          items[key.replace(this.prefix, '')] = {
            size: size,
            sizeMB: (size / 1024 / 1024).toFixed(3)
          };
        }
      }
    }

    const limitBytes = 5 * 1024 * 1024; // 5MB typical limit
    
    return {
      total: total,
      totalMB: (total / 1024 / 1024).toFixed(2),
      appTotal: appTotal,
      appTotalMB: (appTotal / 1024 / 1024).toFixed(2),
      limit: limitBytes,
      limitMB: (limitBytes / 1024 / 1024).toFixed(0),
      percentage: ((appTotal / limitBytes) * 100).toFixed(1),
      items: items,
      available: limitBytes - appTotal,
      availableMB: ((limitBytes - appTotal) / 1024 / 1024).toFixed(2)
    };
  }

  /**
   * Handle quota exceeded error
   * @param {string} key - Storage key that failed
   * @param {any} data - Data that couldn't be saved
   */
  handleQuotaExceeded(key, data) {
    const usage = this.getUsage();
    
    console.warn('Storage quota exceeded:', {
      key,
      usage: usage.appTotalMB + 'MB',
      limit: usage.limitMB + 'MB',
      percentage: usage.percentage + '%'
    });

    // Emit custom event for UI to handle
    window.dispatchEvent(new CustomEvent('storageQuotaExceeded', {
      detail: {
        key,
        usage,
        data
      }
    }));
  }

  /**
   * Clear all app data from localStorage
   * @returns {boolean} Success status
   */
  clearAll() {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.prefix)
      );
      
      keys.forEach(key => localStorage.removeItem(key));
      console.log(`Cleared ${keys.length} items from storage`);
      return true;
    } catch (e) {
      console.error('Clear error:', e);
      return false;
    }
  }

  /**
   * Export all app data
   * @returns {object} All app data
   */
  exportAll() {
    const data = {};
    
    for (let key in localStorage) {
      if (key.startsWith(this.prefix)) {
        const cleanKey = key.replace(this.prefix, '');
        data[cleanKey] = this.load(cleanKey);
      }
    }
    
    return {
      version: this.version,
      exportDate: new Date().toISOString(),
      exportTimestamp: Date.now(),
      data: data
    };
  }

  /**
   * Import data (restore from backup)
   * @param {object} backup - Backup data to import
   * @returns {boolean} Success status
   */
  importAll(backup) {
    try {
      if (!backup.data) {
        throw new Error('Invalid backup format');
      }

      // Save each key
      for (let key in backup.data) {
        this.save(key, backup.data[key]);
      }

      console.log('Import successful');
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }

  /**
   * Check if storage is available
   * @returns {boolean} Storage availability
   */
  isAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get metadata about stored data
   * @param {string} key - Storage key
   * @returns {object} Metadata
   */
  getMetadata(key) {
    try {
      const json = localStorage.getItem(this.prefix + key);
      if (!json) return null;
      
      const parsed = JSON.parse(json);
      
      return {
        version: parsed.version || 'legacy',
        timestamp: parsed.timestamp || null,
        lastModified: parsed.timestamp ? new Date(parsed.timestamp).toLocaleString() : 'Unknown',
        size: json.length,
        sizeMB: (json.length / 1024 / 1024).toFixed(3)
      };
    } catch (e) {
      console.error('Metadata error:', e);
      return null;
    }
  }
}

// Create singleton instance
const storage = new StorageManager();

export default storage;
