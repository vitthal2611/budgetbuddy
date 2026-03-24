import React, { useState, useEffect } from 'react';
import './ImportTransactions.css';
import { useData } from '../contexts/DataContext';

const ImportTransactions = ({ onImport, onClose, existingTransactions }) => {
  const { envelopes, paymentMethods, addEnvelope, addPaymentMethod } = useData();
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Preview
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({
    date: '',
    amount: '',
    type: '',
    note: '',
    paymentMethod: '',
    envelope: ''
  });
  const [parsedTransactions, setParsedTransactions] = useState([]);
  const [errors, setErrors] = useState([]);
  const [newEnvelopes, setNewEnvelopes] = useState(new Set());
  const [newPaymentMethods, setNewPaymentMethods] = useState(new Set());
  const [duplicates, setDuplicates] = useState([]);
  const [mappingWarnings, setMappingWarnings] = useState([]);
  
  // New features state
  const [savedTemplates, setSavedTemplates] = useState(() => {
    const saved = localStorage.getItem('importTemplates');
    return saved ? JSON.parse(saved) : [];
  });
  const [templateName, setTemplateName] = useState('');
  const [showTemplateSave, setShowTemplateSave] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState(new Set());
  const [bulkEditField, setBulkEditField] = useState('');
  const [bulkEditValue, setBulkEditValue] = useState('');
  const [importProgress, setImportProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importHistory, setImportHistory] = useState(() => {
    const saved = localStorage.getItem('importHistory');
    return saved ? JSON.parse(saved) : [];
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Escape to close modal
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      
      // Ctrl/Cmd + S to save template (only in step 2)
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && step === 2) {
        e.preventDefault();
        setShowTemplateSave(true);
      }
      
      // Ctrl/Cmd + A to select all in bulk edit mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && bulkEditMode && step === 3) {
        e.preventDefault();
        selectAllTransactions();
      }
      
      // Ctrl/Cmd + Enter to proceed to next step or import
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (step === 2 && !isProcessing) {
          handleMapping();
        } else if (step === 3 && parsedTransactions.length > 0) {
          handleImport();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [step, bulkEditMode, isProcessing, parsedTransactions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      alert('CSV file must have at least a header row and one data row');
      return;
    }

    const headerLine = lines[0];
    const parsedHeaders = headerLine.split(',').map(h => h.trim().replace(/['"]/g, ''));
    
    const data = lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      const row = {};
      parsedHeaders.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      return row;
    });

    setHeaders(parsedHeaders);
    setCsvData(data);
    setStep(2);
    autoDetectMapping(parsedHeaders);
  };

  const parseCSVLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const autoDetectMapping = (headers) => {
    const mapping = { ...columnMapping };
    
    headers.forEach(header => {
      const lower = header.toLowerCase();
      
      if (lower.includes('date') || lower.includes('day')) {
        mapping.date = header;
      } else if (lower.includes('amount') || lower.includes('value') || lower.includes('price')) {
        mapping.amount = header;
      } else if (lower.includes('type') || lower.includes('category')) {
        mapping.type = header;
      } else if (lower.includes('note') || lower.includes('description') || lower.includes('memo')) {
        mapping.note = header;
      } else if (lower.includes('payment') || lower.includes('method') || lower.includes('account')) {
        mapping.paymentMethod = header;
      } else if (lower.includes('envelope') || lower.includes('budget')) {
        mapping.envelope = header;
      }
    });
    
    setColumnMapping(mapping);
    validateMapping(mapping);
  };

  const validateMapping = (mapping) => {
    const warnings = [];
    
    if (!mapping.date) {
      warnings.push({ field: 'date', message: 'Date column is required', severity: 'error' });
    }
    if (!mapping.amount) {
      warnings.push({ field: 'amount', message: 'Amount column is required', severity: 'error' });
    }
    if (!mapping.note) {
      warnings.push({ field: 'note', message: 'Note column recommended for better tracking', severity: 'warning' });
    }
    if (!mapping.type) {
      warnings.push({ field: 'type', message: 'Type will be auto-detected from amount', severity: 'info' });
    }
    if (!mapping.paymentMethod) {
      warnings.push({ field: 'paymentMethod', message: 'Payment method will default to "Cash"', severity: 'info' });
    }
    if (!mapping.envelope) {
      warnings.push({ field: 'envelope', message: 'Expenses will default to "Uncategorized"', severity: 'info' });
    }
    
    setMappingWarnings(warnings);
  };

  // Template Management Functions
  const saveTemplate = () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    const template = {
      id: Date.now(),
      name: templateName.trim(),
      mapping: columnMapping,
      headers: headers,
      createdAt: new Date().toISOString()
    };

    const updated = [...savedTemplates, template];
    setSavedTemplates(updated);
    localStorage.setItem('importTemplates', JSON.stringify(updated));
    
    setTemplateName('');
    setShowTemplateSave(false);
    alert(`Template "${template.name}" saved successfully!`);
  };

  const loadTemplate = (templateId) => {
    const template = savedTemplates.find(t => t.id === parseInt(templateId));
    if (!template) return;
    
    // Check which mappings are valid for current headers
    const validMapping = {};
    const invalidMappings = [];
    
    Object.entries(template.mapping).forEach(([field, headerName]) => {
      if (headerName && headers.includes(headerName)) {
        validMapping[field] = headerName;
      } else if (headerName) {
        invalidMappings.push(`${field}: "${headerName}"`);
      }
    });
    
    // Show warning if some mappings are invalid
    if (invalidMappings.length > 0) {
      const message = `Some template mappings don't match current CSV headers:\n\n` +
        `Invalid mappings:\n${invalidMappings.join('\n')}\n\n` +
        `Valid mappings will be applied. You'll need to map the missing fields manually.\n\n` +
        `Continue?`;
      
      if (!window.confirm(message)) {
        setSelectedTemplate('');
        return;
      }
    }
    
    // Apply valid mappings, keep existing for invalid ones
    const newMapping = { ...columnMapping, ...validMapping };
    setColumnMapping(newMapping);
    validateMapping(newMapping);
    setSelectedTemplate(templateId);
  };

  const deleteTemplate = (templateId) => {
    if (!window.confirm('Delete this template?')) return;
    
    const updated = savedTemplates.filter(t => t.id !== templateId);
    setSavedTemplates(updated);
    localStorage.setItem('importTemplates', JSON.stringify(updated));
    
    if (selectedTemplate === templateId.toString()) {
      setSelectedTemplate('');
    }
  };

  const findSimilarItem = (name, existingItems) => {
    const nameLower = name.toLowerCase().trim();
    
    for (const item of existingItems) {
      const itemName = typeof item === 'string' ? item : item.name;
      const itemLower = itemName.toLowerCase().trim();
      
      // Exact match (case-insensitive)
      if (nameLower === itemLower) return itemName;
      
      // Fuzzy match: check if one contains the other
      if (nameLower.includes(itemLower) || itemLower.includes(nameLower)) {
        return itemName;
      }
      
      // Check for common variations (plural/singular)
      if (nameLower === itemLower + 's' || nameLower + 's' === itemLower) {
        return itemName;
      }
    }
    
    return null;
  };

  // Bulk Edit Functions
  const toggleSelectTransaction = (idx) => {
    const newSelected = new Set(selectedForEdit);
    if (newSelected.has(idx)) {
      newSelected.delete(idx);
    } else {
      newSelected.add(idx);
    }
    setSelectedForEdit(newSelected);
  };

  const selectAllTransactions = () => {
    if (selectedForEdit.size === parsedTransactions.length) {
      setSelectedForEdit(new Set());
    } else {
      setSelectedForEdit(new Set(parsedTransactions.map((_, idx) => idx)));
    }
  };

  const applyBulkEdit = () => {
    if (selectedForEdit.size === 0) {
      alert('Please select transactions to edit');
      return;
    }

    if (!bulkEditField || !bulkEditValue) {
      alert('Please select a field and enter a value');
      return;
    }

    // Validate field compatibility with transaction types
    if (bulkEditField === 'envelope') {
      const selectedTransactions = Array.from(selectedForEdit).map(idx => parsedTransactions[idx]);
      const nonExpenseCount = selectedTransactions.filter(t => t.type !== 'expense').length;
      
      if (nonExpenseCount > 0) {
        const message = `${nonExpenseCount} selected transaction(s) are not expenses.\n\n` +
          `Envelopes only apply to expense transactions.\n\n` +
          `These will be skipped. Continue?`;
        
        if (!window.confirm(message)) {
          return;
        }
      }
    }

    if (bulkEditField === 'type') {
      const message = `Changing transaction type may cause data inconsistencies.\n\n` +
        `For example, changing expense to income will keep the envelope field.\n\n` +
        `Continue?`;
      
      if (!window.confirm(message)) {
        return;
      }
    }

    // Apply changes with type-aware logic
    const updated = parsedTransactions.map((tx, idx) => {
      if (selectedForEdit.has(idx)) {
        // Only apply envelope to expenses
        if (bulkEditField === 'envelope' && tx.type !== 'expense') {
          return tx; // Skip non-expenses
        }
        
        // Create updated transaction
        const updatedTx = { ...tx, [bulkEditField]: bulkEditValue };
        
        // Clean up fields based on new type if type was changed
        if (bulkEditField === 'type') {
          if (bulkEditValue === 'income') {
            delete updatedTx.envelope;
          } else if (bulkEditValue === 'transfer') {
            delete updatedTx.envelope;
            // Note: Transfer needs sourceAccount and destinationAccount
            // which we can't set in bulk edit, so this might create invalid data
          }
        }
        
        return updatedTx;
      }
      return tx;
    });

    const actualChanges = updated.filter((tx, idx) => 
      selectedForEdit.has(idx) && 
      (bulkEditField !== 'envelope' || tx.type === 'expense')
    ).length;

    setParsedTransactions(updated);
    setSelectedForEdit(new Set());
    setBulkEditField('');
    setBulkEditValue('');
    setBulkEditMode(false);
    
    alert(`Updated ${actualChanges} transaction(s)`);
  };

  // Import History Functions
  const saveToHistory = (transactions) => {
    const historyEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      count: transactions.length,
      transactions: transactions,
      envelopes: Array.from(newEnvelopes),
      paymentMethods: Array.from(newPaymentMethods)
    };

    const updated = [historyEntry, ...importHistory].slice(0, 10); // Keep last 10
    setImportHistory(updated);
    localStorage.setItem('importHistory', JSON.stringify(updated));
  };

  const undoImport = (historyId) => {
    const entry = importHistory.find(h => h.id === historyId);
    if (!entry) return;

    if (!window.confirm(`Undo import of ${entry.count} transactions from ${new Date(entry.timestamp).toLocaleString()}?`)) {
      return;
    }

    // Emit undo event
    window.dispatchEvent(new CustomEvent('undoImport', { detail: entry }));
    
    // Remove from history
    const updated = importHistory.filter(h => h.id !== historyId);
    setImportHistory(updated);
    localStorage.setItem('importHistory', JSON.stringify(updated));
    
    alert('Import undone successfully!');
  };

  const handleMapping = async () => {
    if (!columnMapping.date || !columnMapping.amount) {
      alert('Date and Amount columns are required');
      return;
    }

    setIsProcessing(true);
    setImportProgress(0);

    const parsed = [];
    const errorList = [];
    const newEnvs = new Set();
    const newMethods = new Set();
    const fuzzyMatches = { envelopes: {}, paymentMethods: {} };

    const totalRows = csvData.length;
    const batchSize = 10; // Process in batches for progress updates

    for (let i = 0; i < totalRows; i += batchSize) {
      const batch = csvData.slice(i, Math.min(i + batchSize, totalRows));
      
      batch.forEach((row, batchIdx) => {
        const idx = i + batchIdx;
        try {
          const transaction = parseTransaction(row, idx);
          
          // Track new envelopes and payment methods with fuzzy matching
          if (transaction.type === 'expense' && transaction.envelope) {
            const similar = findSimilarItem(transaction.envelope, envelopes);
            if (similar && similar !== transaction.envelope) {
              fuzzyMatches.envelopes[transaction.envelope] = similar;
              transaction.envelope = similar; // Use existing envelope
            } else if (!envelopes.find(e => e.name === transaction.envelope)) {
              newEnvs.add(transaction.envelope);
            }
          }
          
          if (transaction.paymentMethod) {
            const similar = findSimilarItem(transaction.paymentMethod, paymentMethods);
            if (similar && similar !== transaction.paymentMethod) {
              fuzzyMatches.paymentMethods[transaction.paymentMethod] = similar;
              transaction.paymentMethod = similar; // Use existing method
            } else if (!paymentMethods.includes(transaction.paymentMethod)) {
              newMethods.add(transaction.paymentMethod);
            }
          }
          
          if (transaction.sourceAccount) {
            const similar = findSimilarItem(transaction.sourceAccount, paymentMethods);
            if (similar && similar !== transaction.sourceAccount) {
              fuzzyMatches.paymentMethods[transaction.sourceAccount] = similar;
              transaction.sourceAccount = similar;
            } else if (!paymentMethods.includes(transaction.sourceAccount)) {
              newMethods.add(transaction.sourceAccount);
            }
          }
          
          if (transaction.destinationAccount) {
            const similar = findSimilarItem(transaction.destinationAccount, paymentMethods);
            if (similar && similar !== transaction.destinationAccount) {
              fuzzyMatches.paymentMethods[transaction.destinationAccount] = similar;
              transaction.destinationAccount = similar;
            } else if (!paymentMethods.includes(transaction.destinationAccount)) {
              newMethods.add(transaction.destinationAccount);
            }
          }

          parsed.push(transaction);
        } catch (error) {
          errorList.push({ row: idx + 2, message: error.message });
        }
      });

      // Update progress
      const progress = Math.round(((i + batch.length) / totalRows) * 100);
      setImportProgress(progress);
      
      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    // Detect duplicates
    const duplicateList = [];
    parsed.forEach((newTx, idx) => {
      const isDuplicate = existingTransactions.some(existingTx => {
        return existingTx.date === newTx.date &&
               Math.abs(existingTx.amount - newTx.amount) < 0.01 &&
               existingTx.type === newTx.type &&
               existingTx.note?.toLowerCase().trim() === newTx.note?.toLowerCase().trim();
      });
      
      if (isDuplicate) {
        duplicateList.push({ index: idx, transaction: newTx });
      }
    });

    setParsedTransactions(parsed);
    setErrors(errorList);
    setDuplicates(duplicateList);
    setNewEnvelopes(newEnvs);
    setNewPaymentMethods(newMethods);
    
    // Show fuzzy match info
    if (Object.keys(fuzzyMatches.envelopes).length > 0 || Object.keys(fuzzyMatches.paymentMethods).length > 0) {
      let matchMsg = '✨ Smart matching applied:\n\n';
      
      if (Object.keys(fuzzyMatches.envelopes).length > 0) {
        matchMsg += 'Envelopes:\n';
        Object.entries(fuzzyMatches.envelopes).forEach(([from, to]) => {
          matchMsg += `  "${from}" → "${to}"\n`;
        });
      }
      
      if (Object.keys(fuzzyMatches.paymentMethods).length > 0) {
        matchMsg += '\nPayment Methods:\n';
        Object.entries(fuzzyMatches.paymentMethods).forEach(([from, to]) => {
          matchMsg += `  "${from}" → "${to}"\n`;
        });
      }
      
      console.log(matchMsg);
    }
    
    setIsProcessing(false);
    setImportProgress(0);
    setStep(3);
  };

  const parseTransaction = (row, idx) => {
    // Parse date
    const dateStr = row[columnMapping.date];
    const date = parseDate(dateStr);
    if (!date) {
      throw new Error(`Invalid date format: ${dateStr}`);
    }

    // Parse amount
    const amountStr = row[columnMapping.amount]?.toString().replace(/[^\d.-]/g, '');
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount === 0) {
      throw new Error(`Invalid amount: ${row[columnMapping.amount]}`);
    }

    // Determine type
    let type = 'expense';
    if (columnMapping.type && row[columnMapping.type]) {
      const typeStr = row[columnMapping.type].toLowerCase();
      if (typeStr.includes('income') || typeStr.includes('credit')) {
        type = 'income';
      } else if (typeStr.includes('transfer')) {
        type = 'transfer';
      }
    } else if (amount > 0) {
      type = 'income';
    }

    // Build transaction
    const transaction = {
      id: Date.now() + idx,
      type,
      amount: Math.abs(amount),
      note: row[columnMapping.note] || 'Imported transaction',
      date: date,
      _rowIndex: idx
    };

    if (type === 'transfer') {
      transaction.sourceAccount = row[columnMapping.paymentMethod] || 'Unknown';
      transaction.destinationAccount = row[columnMapping.envelope] || 'Unknown';
    } else {
      transaction.paymentMethod = row[columnMapping.paymentMethod] || 'Cash';
      if (type === 'expense') {
        transaction.envelope = row[columnMapping.envelope] || 'Uncategorized';
      }
    }

    return transaction;
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return null;

    // Remove extra whitespace
    const cleaned = dateStr.trim();

    // Try DD-MM-YYYY or DD/MM/YYYY format
    let match = cleaned.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (match) {
      const [, day, month, year] = match;
      return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
    }

    // Try YYYY-MM-DD or YYYY/MM/DD format
    match = cleaned.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
      const [, year, month, day] = match;
      return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
    }

    // Try DD.MM.YYYY format (European)
    match = cleaned.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (match) {
      const [, day, month, year] = match;
      return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
    }

    // Try Month DD, YYYY format (e.g., "Jan 15, 2025" or "January 15, 2025")
    const monthNames = {
      jan: '01', january: '01', feb: '02', february: '02',
      mar: '03', march: '03', apr: '04', april: '04',
      may: '05', jun: '06', june: '06', jul: '07', july: '07',
      aug: '08', august: '08', sep: '09', september: '09',
      oct: '10', october: '10', nov: '11', november: '11',
      dec: '12', december: '12'
    };
    
    match = cleaned.match(/([a-z]+)\s+(\d{1,2}),?\s+(\d{4})/i);
    if (match) {
      const [, monthStr, day, year] = match;
      const month = monthNames[monthStr.toLowerCase()];
      if (month) {
        return `${day.padStart(2, '0')}-${month}-${year}`;
      }
    }

    // Try DD Month YYYY format (e.g., "15 Jan 2025" or "15 January 2025")
    match = cleaned.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/i);
    if (match) {
      const [, day, monthStr, year] = match;
      const month = monthNames[monthStr.toLowerCase()];
      if (month) {
        return `${day.padStart(2, '0')}-${month}-${year}`;
      }
    }

    // Try MM/DD/YYYY format (US format) - handle ambiguity
    match = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      const [, first, second, year] = match;
      
      // If first number > 12, it must be day (DD/MM/YYYY)
      if (parseInt(first) > 12) {
        return `${first.padStart(2, '0')}-${second.padStart(2, '0')}-${year}`;
      }
      // If second number > 12, it must be day (MM/DD/YYYY)
      else if (parseInt(second) > 12) {
        return `${second.padStart(2, '0')}-${first.padStart(2, '0')}-${year}`;
      }
      // Ambiguous - default to DD/MM/YYYY (European standard)
      else {
        return `${first.padStart(2, '0')}-${second.padStart(2, '0')}-${year}`;
      }
    }

    // Try YYYYMMDD format (no separators)
    match = cleaned.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (match) {
      const [, year, month, day] = match;
      return `${day}-${month}-${year}`;
    }

    // Try DD-MMM-YYYY format (e.g., "15-Jan-2025")
    match = cleaned.match(/(\d{1,2})-([a-z]{3})-(\d{4})/i);
    if (match) {
      const [, day, monthStr, year] = match;
      const month = monthNames[monthStr.toLowerCase()];
      if (month) {
        return `${day.padStart(2, '0')}-${month}-${year}`;
      }
    }

    return null;
  };

  const handleImport = () => {
    // Build confirmation message
    let confirmMessage = `Import ${parsedTransactions.length} transaction(s)?`;
    
    if (newEnvelopes.size > 0 || newPaymentMethods.size > 0) {
      confirmMessage += '\n\nThe following items will be created (same as manual entry):';
      if (newEnvelopes.size > 0) {
        confirmMessage += `\n\n📁 New Envelopes (${newEnvelopes.size}):\n`;
        confirmMessage += Array.from(newEnvelopes).map(env => `  • ${env} (Category: Need)`).join('\n');
      }
      if (newPaymentMethods.size > 0) {
        confirmMessage += `\n\n💳 New Payment Methods (${newPaymentMethods.size}):\n`;
        confirmMessage += Array.from(newPaymentMethods).map(method => `  • ${method}`).join('\n');
      }
      confirmMessage += '\n\nThis follows the same process as adding transactions manually.';
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }

    // Track successfully created items
    const createdEnvelopes = [];
    const createdMethods = [];

    // Create new envelopes (same as manual transaction entry)
    newEnvelopes.forEach(env => {
      try {
        // Check if envelope already exists before adding
        if (!envelopes.find(e => e.name === env)) {
          addEnvelope(env, 'need'); // Default to "need" like manual entry
          createdEnvelopes.push(env);
          console.log(`✅ Created envelope: ${env}`);
        } else {
          console.log(`ℹ️ Envelope ${env} already exists, skipping`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not create envelope ${env}:`, error.message);
      }
    });

    // Create new payment methods (same as manual transaction entry)
    newPaymentMethods.forEach(method => {
      try {
        // Check if payment method already exists before adding
        if (!paymentMethods.includes(method)) {
          addPaymentMethod(method);
          createdMethods.push(method);
          console.log(`✅ Created payment method: ${method}`);
        } else {
          console.log(`ℹ️ Payment method ${method} already exists, skipping`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not create payment method ${method}:`, error.message);
      }
    });

    // Calculate detailed statistics
    const stats = {
      total: parsedTransactions.length,
      income: parsedTransactions.filter(t => t.type === 'income').length,
      expense: parsedTransactions.filter(t => t.type === 'expense').length,
      transfer: parsedTransactions.filter(t => t.type === 'transfer').length,
      totalIncome: parsedTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0),
      totalExpense: parsedTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0),
      newEnvelopes: createdEnvelopes.length,
      newMethods: createdMethods.length
    };

    // Log summary
    console.log(`📊 Import Summary:
      - Transactions: ${stats.total}
      - Income: ${stats.income} (₹${stats.totalIncome.toFixed(2)})
      - Expense: ${stats.expense} (₹${stats.totalExpense.toFixed(2)})
      - Transfer: ${stats.transfer}
      - New Envelopes: ${stats.newEnvelopes}/${newEnvelopes.size}
      - New Payment Methods: ${stats.newMethods}/${newPaymentMethods.size}
      - Net: ₹${(stats.totalIncome - stats.totalExpense).toFixed(2)}`);

    // Save to history before importing
    saveToHistory(parsedTransactions);

    // Import transactions
    onImport(parsedTransactions);
    
    // Show detailed success message with statistics
    const summaryMsg = `✅ Import Complete!\n\n` +
      `📊 Summary:\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Transactions: ${stats.total}\n` +
      `  • Income: ${stats.income} (₹${stats.totalIncome.toFixed(0)})\n` +
      `  • Expense: ${stats.expense} (₹${stats.totalExpense.toFixed(0)})\n` +
      `  • Transfer: ${stats.transfer}\n\n` +
      (stats.newEnvelopes > 0 || stats.newMethods > 0 ? 
        `Created:\n` +
        (stats.newEnvelopes > 0 ? `  • ${stats.newEnvelopes} envelope(s)\n` : '') +
        (stats.newMethods > 0 ? `  • ${stats.newMethods} payment method(s)\n` : '') +
        `\n` : '') +
      `Net Change: ₹${(stats.totalIncome - stats.totalExpense).toFixed(0)}\n\n` +
      `💡 You can undo this import from the import history.`;
    
    alert(summaryMsg);
    
    // Close modal after a brief delay to ensure state update completes
    setTimeout(() => {
      onClose();
    }, 100);
  };

  const removeTransaction = (idx) => {
    // Remove from parsed transactions
    setParsedTransactions(parsedTransactions.filter((_, i) => i !== idx));
    
    // Update duplicate indices - remove if it was the deleted one, adjust others
    setDuplicates(duplicates
      .filter(dup => dup.index !== idx)
      .map(dup => ({
        ...dup,
        index: dup.index > idx ? dup.index - 1 : dup.index
      }))
    );
    
    // Update bulk edit selection indices
    const newSelected = new Set();
    selectedForEdit.forEach(selectedIdx => {
      if (selectedIdx !== idx) {
        newSelected.add(selectedIdx > idx ? selectedIdx - 1 : selectedIdx);
      }
    });
    setSelectedForEdit(newSelected);
  };

  const downloadTemplate = () => {
    const template = `Date,Amount,Type,Note,Payment Method,Envelope
01-01-2025,5000,income,Monthly Salary,Bank Account,
05-01-2025,1500,income,Freelance Project,PayPal,
10-01-2025,-850,expense,Grocery Shopping,Credit Card,Groceries
12-01-2025,-200,expense,Restaurant Dinner,Cash,Food
15-01-2025,-1200,expense,Rent Payment,Bank Account,Housing
18-01-2025,-150,expense,Electricity Bill,Bank Account,Utilities
20-01-2025,-500,transfer,Transfer to Savings,Bank Account,Savings Account
22-01-2025,-80,expense,Gas Station,Debit Card,Transportation
25-01-2025,-300,expense,Shopping - Clothes,Credit Card,Shopping
28-01-2025,800,income,Bonus Payment,Bank Account,
30-01-2025,-120,expense,Gym Membership,Credit Card,Health`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'budgetbuddy-template.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="import-modal-overlay" onClick={onClose}>
      <div className="import-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="import-header">
          <h2>Import Transactions</h2>
          <div className="header-right">
            <div className="keyboard-hints" title="Keyboard Shortcuts">
              <span className="hint-icon">⌨️</span>
              <div className="hints-tooltip">
                <div className="hint-item"><kbd>Esc</kbd> Close</div>
                {step === 2 && <div className="hint-item"><kbd>Ctrl+S</kbd> Save Template</div>}
                {step === 3 && bulkEditMode && <div className="hint-item"><kbd>Ctrl+A</kbd> Select All</div>}
                {(step === 2 || step === 3) && <div className="hint-item"><kbd>Ctrl+Enter</kbd> {step === 2 ? 'Next' : 'Import'}</div>}
              </div>
            </div>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
        </div>

        <div className="import-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Upload</div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Map Columns</div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Preview</div>
        </div>

        {step === 1 && (
          <div className="import-step">
            <div className="upload-area">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                id="csv-upload"
                className="file-input"
              />
              <label htmlFor="csv-upload" className="upload-label">
                <div className="upload-icon">📁</div>
                <div className="upload-text">Click to upload CSV file</div>
                <div className="upload-hint">or drag and drop</div>
              </label>
            </div>
            
            <div className="template-download-prominent">
              <div className="template-header">
                <span className="template-icon">📋</span>
                <div className="template-text">
                  <h4>First time importing?</h4>
                  <p>Download our template to see the correct format</p>
                </div>
              </div>
              <button 
                className="download-template-btn-large"
                onClick={downloadTemplate}
                type="button"
              >
                <span className="download-icon">⬇️</span>
                Download CSV Template
              </button>
            </div>
            
            <div className="format-info">
              <h4>Expected CSV Format:</h4>
              <p>Your CSV should include columns for:</p>
              <ul>
                <li>Date (DD-MM-YYYY or YYYY-MM-DD)</li>
                <li>Amount (numbers, can include currency symbols)</li>
                <li>Note/Description (optional)</li>
                <li>Type (income/expense/transfer - optional)</li>
                <li>Payment Method (optional)</li>
                <li>Envelope/Category (optional for expenses)</li>
              </ul>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="import-step">
            <h3>Map Your Columns</h3>
            <p className="mapping-hint">Match your CSV columns to transaction fields</p>
            
            {/* Template Management */}
            <div className="template-management">
              <div className="template-actions">
                <div className="template-load">
                  <label>Load Template:</label>
                  <select 
                    value={selectedTemplate}
                    onChange={(e) => loadTemplate(e.target.value)}
                    className="template-select"
                  >
                    <option value="">Select a saved template...</option>
                    {savedTemplates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({new Date(template.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
                
                {savedTemplates.length > 0 && selectedTemplate && (
                  <button 
                    className="btn-delete-template"
                    onClick={() => deleteTemplate(parseInt(selectedTemplate))}
                    title="Delete selected template"
                  >
                    🗑️
                  </button>
                )}
                
                <button 
                  className="btn-save-template"
                  onClick={() => setShowTemplateSave(!showTemplateSave)}
                  title="Save current mapping as template"
                >
                  💾 Save Template
                </button>
              </div>
              
              {showTemplateSave && (
                <div className="template-save-form">
                  <input
                    type="text"
                    placeholder="Enter template name (e.g., 'Chase Bank', 'PayPal Export')"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="template-name-input"
                    onKeyPress={(e) => e.key === 'Enter' && saveTemplate()}
                  />
                  <button className="btn-confirm-save" onClick={saveTemplate}>
                    Save
                  </button>
                  <button className="btn-cancel-save" onClick={() => {
                    setShowTemplateSave(false);
                    setTemplateName('');
                  }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
            
            <div className="mapping-grid">
              <div className="mapping-row">
                <label>Date <span className="required">*</span></label>
                <select
                  value={columnMapping.date}
                  onChange={(e) => {
                    const newMapping = { ...columnMapping, date: e.target.value };
                    setColumnMapping(newMapping);
                    validateMapping(newMapping);
                  }}
                >
                  <option value="">Select column...</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div className="mapping-row">
                <label>Amount <span className="required">*</span></label>
                <select
                  value={columnMapping.amount}
                  onChange={(e) => {
                    const newMapping = { ...columnMapping, amount: e.target.value };
                    setColumnMapping(newMapping);
                    validateMapping(newMapping);
                  }}
                >
                  <option value="">Select column...</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div className="mapping-row">
                <label>Note/Description</label>
                <select
                  value={columnMapping.note}
                  onChange={(e) => {
                    const newMapping = { ...columnMapping, note: e.target.value };
                    setColumnMapping(newMapping);
                    validateMapping(newMapping);
                  }}
                >
                  <option value="">Select column...</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div className="mapping-row">
                <label>Type</label>
                <select
                  value={columnMapping.type}
                  onChange={(e) => {
                    const newMapping = { ...columnMapping, type: e.target.value };
                    setColumnMapping(newMapping);
                    validateMapping(newMapping);
                  }}
                >
                  <option value="">Select column...</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div className="mapping-row">
                <label>Payment Method</label>
                <select
                  value={columnMapping.paymentMethod}
                  onChange={(e) => {
                    const newMapping = { ...columnMapping, paymentMethod: e.target.value };
                    setColumnMapping(newMapping);
                    validateMapping(newMapping);
                  }}
                >
                  <option value="">Select column...</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div className="mapping-row">
                <label>Envelope/Category</label>
                <select
                  value={columnMapping.envelope}
                  onChange={(e) => {
                    const newMapping = { ...columnMapping, envelope: e.target.value };
                    setColumnMapping(newMapping);
                    validateMapping(newMapping);
                  }}
                >
                  <option value="">Select column...</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            {mappingWarnings.length > 0 && (
              <div className="mapping-warnings">
                {mappingWarnings.map((warning, idx) => (
                  <div key={idx} className={`mapping-warning ${warning.severity}`}>
                    <span className="warning-icon">
                      {warning.severity === 'error' ? '❌' : warning.severity === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                    <span className="warning-message">{warning.message}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="preview-sample">
              <h4>Sample Data Preview (First 10 rows):</h4>
              <div className="sample-table">
                {csvData.slice(0, 10).map((row, idx) => (
                  <div key={idx} className="sample-row">
                    <div className="sample-row-number">Row {idx + 1}</div>
                    {headers.map(header => (
                      <div key={header} className="sample-cell">
                        <strong>{header}:</strong> {row[header] || <span className="empty-value">(empty)</span>}
                      </div>
                    ))}
                  </div>
                ))}
                {csvData.length > 10 && (
                  <div className="sample-more">
                    + {csvData.length - 10} more rows...
                  </div>
                )}
              </div>
            </div>

            <div className="import-actions">
              <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button 
                className="btn-primary" 
                onClick={handleMapping}
                disabled={isProcessing}
              >
                {isProcessing ? `Processing... ${importProgress}%` : 'Next'}
              </button>
            </div>
            
            {/* Progress Bar */}
            {isProcessing && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <div className="progress-text">{importProgress}% Complete</div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="import-step">
            <h3>Preview & Confirm</h3>
            
            {duplicates.length > 0 && (
              <div className="duplicate-warning">
                <h4>🔄 {duplicates.length} Potential Duplicate(s) Detected</h4>
                <p className="duplicate-intro">
                  These transactions appear to already exist in your records. Review carefully to avoid double-counting.
                </p>
                <div className="duplicate-list">
                  {duplicates.slice(0, 5).map((dup, idx) => (
                    <div key={idx} className="duplicate-item">
                      <span className="duplicate-icon">⚠️</span>
                      <div className="duplicate-details">
                        <div className="duplicate-main">
                          {dup.transaction.date} • ₹{dup.transaction.amount} • {dup.transaction.note}
                        </div>
                        <div className="duplicate-hint">
                          {dup.transaction.type} via {dup.transaction.paymentMethod || dup.transaction.sourceAccount}
                        </div>
                      </div>
                      <button 
                        className="remove-duplicate-btn"
                        onClick={() => removeTransaction(dup.index)}
                        title="Remove this duplicate"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {duplicates.length > 5 && (
                    <div className="duplicate-more">
                      + {duplicates.length - 5} more potential duplicates
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {errors.length > 0 && (
              <div className="error-summary">
                <h4>❌ {errors.length} Error(s) Found:</h4>
                <ul>
                  {errors.map((err, idx) => (
                    <li key={idx}>Row {err.row}: {err.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {(newEnvelopes.size > 0 || newPaymentMethods.size > 0) && (
              <div className="validation-summary info">
                <h4>✨ Auto-Create New Items</h4>
                <p className="validation-intro">
                  These items will be created automatically during import, just like when you add a manual transaction with "+ Add New".
                </p>
                
                {newEnvelopes.size > 0 && (
                  <div className="validation-section">
                    <div className="validation-header">
                      <span className="validation-icon">📁</span>
                      <strong>New Envelopes ({newEnvelopes.size})</strong>
                      <span className="validation-badge success">Auto-create</span>
                    </div>
                    <div className="validation-items">
                      {Array.from(newEnvelopes).map(env => (
                        <div key={env} className="validation-item">
                          <span className="item-name">{env}</span>
                          <span className="item-category">Category: Need 🛒</span>
                        </div>
                      ))}
                    </div>
                    <p className="validation-note">
                      💡 Default category is "Need". You can change it later in Budget Allocation.
                    </p>
                  </div>
                )}
                
                {newPaymentMethods.size > 0 && (
                  <div className="validation-section">
                    <div className="validation-header">
                      <span className="validation-icon">💳</span>
                      <strong>New Payment Methods ({newPaymentMethods.size})</strong>
                      <span className="validation-badge success">Auto-create</span>
                    </div>
                    <div className="validation-items">
                      {Array.from(newPaymentMethods).map(method => (
                        <div key={method} className="validation-item">
                          <span className="item-name">{method}</span>
                          <span className="item-status">✅ Ready to create</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="validation-actions info">
                  <div className="validation-info">
                    <span className="info-icon">ℹ️</span>
                    <span>No manual action needed - items will be created when you click Import below.</span>
                  </div>
                </div>
              </div>
            )}

            <div className="preview-summary">
              <div className="summary-stat">
                <span className="stat-label">Total Transactions:</span>
                <span className="stat-value">{parsedTransactions.length}</span>
              </div>
              <div className="summary-stat">
                <span className="stat-label">Income:</span>
                <span className="stat-value income">
                  {parsedTransactions.filter(t => t.type === 'income').length}
                </span>
              </div>
              <div className="summary-stat">
                <span className="stat-label">Expense:</span>
                <span className="stat-value expense">
                  {parsedTransactions.filter(t => t.type === 'expense').length}
                </span>
              </div>
              <div className="summary-stat">
                <span className="stat-label">Transfer:</span>
                <span className="stat-value">
                  {parsedTransactions.filter(t => t.type === 'transfer').length}
                </span>
              </div>
            </div>

            {/* Bulk Edit Section */}
            <div className="bulk-edit-section">
              <button 
                className="btn-bulk-edit"
                onClick={() => setBulkEditMode(!bulkEditMode)}
              >
                {bulkEditMode ? '✓ Done Editing' : '✏️ Bulk Edit'}
              </button>
              
              {bulkEditMode && (
                <div className="bulk-edit-controls">
                  <button 
                    className="btn-select-all"
                    onClick={selectAllTransactions}
                  >
                    {selectedForEdit.size === parsedTransactions.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="selected-count">
                    {selectedForEdit.size} selected
                  </span>
                  
                  {selectedForEdit.size > 0 && (
                    <div className="bulk-edit-form">
                      <select 
                        value={bulkEditField}
                        onChange={(e) => setBulkEditField(e.target.value)}
                        className="bulk-field-select"
                      >
                        <option value="">Select field to edit...</option>
                        <option value="envelope">Envelope</option>
                        <option value="paymentMethod">Payment Method</option>
                        <option value="type">Type</option>
                        <option value="note">Note</option>
                      </select>
                      
                      {bulkEditField && (
                        <>
                          {bulkEditField === 'envelope' && (
                            <select
                              value={bulkEditValue}
                              onChange={(e) => setBulkEditValue(e.target.value)}
                              className="bulk-value-input"
                            >
                              <option value="">Select envelope...</option>
                              {envelopes.map(env => (
                                <option key={env.name} value={env.name}>{env.name}</option>
                              ))}
                            </select>
                          )}
                          
                          {bulkEditField === 'paymentMethod' && (
                            <select
                              value={bulkEditValue}
                              onChange={(e) => setBulkEditValue(e.target.value)}
                              className="bulk-value-input"
                            >
                              <option value="">Select payment method...</option>
                              {paymentMethods.map(method => (
                                <option key={method} value={method}>{method}</option>
                              ))}
                            </select>
                          )}
                          
                          {bulkEditField === 'type' && (
                            <select
                              value={bulkEditValue}
                              onChange={(e) => setBulkEditValue(e.target.value)}
                              className="bulk-value-input"
                            >
                              <option value="">Select type...</option>
                              <option value="income">Income</option>
                              <option value="expense">Expense</option>
                              <option value="transfer">Transfer</option>
                            </select>
                          )}
                          
                          {bulkEditField === 'note' && (
                            <input
                              type="text"
                              placeholder="Enter note..."
                              value={bulkEditValue}
                              onChange={(e) => setBulkEditValue(e.target.value)}
                              className="bulk-value-input"
                            />
                          )}
                          
                          <button 
                            className="btn-apply-bulk"
                            onClick={applyBulkEdit}
                          >
                            Apply to {selectedForEdit.size} transaction(s)
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="preview-table-container">
              <table className="preview-table">
                <thead>
                  <tr>
                    {bulkEditMode && <th className="checkbox-col">Select</th>}
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Note</th>
                    <th>Payment Method</th>
                    <th>Envelope</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedTransactions.map((t, idx) => (
                    <tr key={idx} className={selectedForEdit.has(idx) ? 'selected-row' : ''}>
                      {bulkEditMode && (
                        <td className="checkbox-col">
                          <input
                            type="checkbox"
                            checked={selectedForEdit.has(idx)}
                            onChange={() => toggleSelectTransaction(idx)}
                            className="bulk-checkbox"
                          />
                        </td>
                      )}
                      <td>{t.date}</td>
                      <td>
                        <span className={`type-badge ${t.type}`}>
                          {t.type === 'income' ? '💰' : t.type === 'expense' ? '💸' : '🔄'}
                          {t.type}
                        </span>
                      </td>
                      <td className="amount-cell">₹{t.amount}</td>
                      <td className="note-cell">{t.note}</td>
                      <td>
                        {t.type === 'transfer' 
                          ? `${t.sourceAccount} → ${t.destinationAccount}`
                          : t.paymentMethod}
                      </td>
                      <td>{t.envelope || '-'}</td>
                      <td>
                        <button 
                          className="remove-btn-small"
                          onClick={() => removeTransaction(idx)}
                          title="Remove"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="import-actions">
              <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
              <button 
                className="btn-primary" 
                onClick={handleImport}
                disabled={parsedTransactions.length === 0}
              >
                Import {parsedTransactions.length} Transaction(s)
                {(newEnvelopes.size > 0 || newPaymentMethods.size > 0) && 
                  ` (+ Create ${newEnvelopes.size + newPaymentMethods.size} Items)`
                }
              </button>
            </div>
            
            {/* Import History */}
            {importHistory.length > 0 && (
              <div className="import-history">
                <h4>📜 Recent Imports (Last 10)</h4>
                <div className="history-list">
                  {importHistory.map(entry => (
                    <div key={entry.id} className="history-item">
                      <div className="history-info">
                        <span className="history-count">{entry.count} transactions</span>
                        <span className="history-date">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <button 
                        className="btn-undo"
                        onClick={() => undoImport(entry.id)}
                        title="Undo this import"
                      >
                        ↶ Undo
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportTransactions;
