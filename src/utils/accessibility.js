// Accessibility Utilities

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Trap focus within a modal or dialog
 * @param {HTMLElement} element - Container element
 */
export const trapFocus = (element) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  const handleTabKey = (e) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  };
  
  element.addEventListener('keydown', handleTabKey);
  
  // Focus first element
  firstFocusable?.focus();
  
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
};

/**
 * Format currency for screen readers
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 */
export const formatCurrencyForScreenReader = (amount, currency = 'INR') => {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency
  }).format(amount);
  
  return formatted.replace('₹', 'Rupees ');
};

/**
 * Get ARIA label for transaction type
 * @param {string} type - Transaction type
 */
export const getTransactionAriaLabel = (type) => {
  const labels = {
    income: 'Income transaction',
    expense: 'Expense transaction',
    transfer: 'Transfer transaction'
  };
  return labels[type] || 'Transaction';
};

/**
 * Get ARIA label for envelope category
 * @param {string} category - Envelope category
 */
export const getEnvelopeCategoryAriaLabel = (category) => {
  const labels = {
    need: 'Need category',
    want: 'Want category',
    saving: 'Saving category'
  };
  return labels[category] || 'Envelope';
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Add keyboard navigation to a list
 * @param {HTMLElement} listElement - List container
 * @param {string} itemSelector - Selector for list items
 */
export const addKeyboardNavigation = (listElement, itemSelector) => {
  const items = Array.from(listElement.querySelectorAll(itemSelector));
  
  const handleKeyDown = (e) => {
    const currentIndex = items.indexOf(document.activeElement);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % items.length;
        items[nextIndex]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        items[prevIndex]?.focus();
        break;
      case 'Home':
        e.preventDefault();
        items[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        items[items.length - 1]?.focus();
        break;
      default:
        break;
    }
  };
  
  listElement.addEventListener('keydown', handleKeyDown);
  
  return () => {
    listElement.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Create skip link for keyboard navigation
 */
export const createSkipLink = () => {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Skip to main content';
  
  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView();
    }
  });
  
  document.body.insertBefore(skipLink, document.body.firstChild);
};
