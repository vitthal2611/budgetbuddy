/**
 * Safe storage wrapper that handles cases where storage is unavailable
 * (e.g., private browsing, storage quota exceeded, or disabled by browser settings)
 */

const createSafeStorage = (storage) => {
  const isAvailable = () => {
    try {
      const testKey = '__storage_test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    getItem: (key) => {
      try {
        if (!isAvailable()) return null;
        return storage.getItem(key);
      } catch (error) {
        console.warn(`Storage getItem failed for key "${key}":`, error.message);
        return null;
      }
    },

    setItem: (key, value) => {
      try {
        if (!isAvailable()) return false;
        storage.setItem(key, value);
        return true;
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          console.error('Storage quota exceeded:', error);
        } else {
          console.warn(`Storage setItem failed for key "${key}":`, error.message);
        }
        return false;
      }
    },

    removeItem: (key) => {
      try {
        if (!isAvailable()) return false;
        storage.removeItem(key);
        return true;
      } catch (error) {
        console.warn(`Storage removeItem failed for key "${key}":`, error.message);
        return false;
      }
    },

    clear: () => {
      try {
        if (!isAvailable()) return false;
        storage.clear();
        return true;
      } catch (error) {
        console.warn('Storage clear failed:', error.message);
        return false;
      }
    },

    isAvailable
  };
};

export const safeLocalStorage = createSafeStorage(window.localStorage);
export const safeSessionStorage = createSafeStorage(window.sessionStorage);

export default {
  local: safeLocalStorage,
  session: safeSessionStorage
};
