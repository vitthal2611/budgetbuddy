// Recurring Transaction Service
// Handles automatic processing of recurring transactions

class RecurringService {
  constructor() {
    this.recurringTransactions = [];
  }

  // Load recurring transactions from storage
  loadRecurringTransactions(transactions) {
    this.recurringTransactions = transactions;
  }

  // Check if a recurring transaction should be processed
  shouldProcess(recurring, currentDate) {
    if (!recurring.isActive) return false;
    
    const lastProcessed = recurring.lastProcessed 
      ? this.parseDate(recurring.lastProcessed)
      : null;
    
    const startDate = this.parseDate(recurring.startDate);
    const endDate = recurring.endDate ? this.parseDate(recurring.endDate) : null;
    
    // Check if within date range
    if (currentDate < startDate) return false;
    if (endDate && currentDate > endDate) return false;
    
    // Check if already processed this period
    if (lastProcessed) {
      const daysSinceProcessed = Math.floor((currentDate - lastProcessed) / (1000 * 60 * 60 * 24));
      
      switch(recurring.frequency) {
        case 'daily':
          return daysSinceProcessed >= 1;
        case 'weekly':
          return daysSinceProcessed >= 7;
        case 'monthly':
          // Check if we're past the day of month
          const lastMonth = lastProcessed.getMonth();
          const currentMonth = currentDate.getMonth();
          const lastYear = lastProcessed.getFullYear();
          const currentYear = currentDate.getFullYear();
          
          if (currentYear > lastYear || (currentYear === lastYear && currentMonth > lastMonth)) {
            return currentDate.getDate() >= recurring.dayOfMonth;
          }
          return false;
        case 'yearly':
          const yearsSince = currentDate.getFullYear() - lastProcessed.getFullYear();
          return yearsSince >= 1;
        default:
          return false;
      }
    }
    
    // First time processing
    return true;
  }

  // Get all recurring transactions that need processing
  getTransactionsToProcess(currentDate = new Date()) {
    return this.recurringTransactions.filter(recurring => 
      this.shouldProcess(recurring, currentDate)
    );
  }

  // Generate transaction from recurring template
  generateTransaction(recurring, date) {
    const dateStr = this.formatDate(date);
    
    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: recurring.type,
      amount: recurring.amount,
      note: `${recurring.note} (Auto)`,
      date: dateStr,
      paymentMethod: recurring.paymentMethod,
      envelope: recurring.envelope,
      isRecurring: true,
      recurringId: recurring.id
    };
  }

  // Parse DD-MM-YYYY date string
  parseDate(dateStr) {
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Format date to DD-MM-YYYY
  formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Calculate next processing date
  getNextProcessingDate(recurring) {
    const lastProcessed = recurring.lastProcessed 
      ? this.parseDate(recurring.lastProcessed)
      : this.parseDate(recurring.startDate);
    
    const next = new Date(lastProcessed);
    
    switch(recurring.frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        next.setDate(recurring.dayOfMonth);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    
    return this.formatDate(next);
  }
}

const recurringService = new RecurringService();
export default recurringService;
