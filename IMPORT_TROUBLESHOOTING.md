# Import Troubleshooting Guide

## Quick Fixes

### Transactions Not Showing After Import?

**Try these steps in order:**

1. **Click OK in the success dialog**
   - After import, a dialog asks if you want to view Dashboard
   - Click OK to automatically switch to Dashboard
   - Your transactions will be visible there

2. **Manually switch to Dashboard**
   - Click the "Dashboard" tab at the top
   - Or click the Dashboard icon in bottom navigation
   - Transactions should appear

3. **Refresh the page**
   - Press F5 or Ctrl+R (Cmd+R on Mac)
   - Data is saved in localStorage
   - Should load on refresh

4. **Check browser console**
   - Press F12 to open Developer Tools
   - Click "Console" tab
   - Look for import-related messages
   - Should see: "Import event received: X transactions"

## Common Issues

### Issue 1: "Import button not working"
**Symptoms:** Nothing happens when clicking Import

**Solutions:**
- Make sure you're on the Transactions tab
- Check if CSV file is selected
- Try a different browser
- Clear browser cache

### Issue 2: "Transactions imported but not visible"
**Symptoms:** Success message shows but Dashboard is empty

**Solutions:**
- Click OK in success dialog to view Dashboard
- Manually click Dashboard tab
- Check if correct month/year is selected in Dashboard
- Refresh the page

### Issue 3: "Import fails with errors"
**Symptoms:** Error messages in preview step

**Solutions:**
- Check CSV format matches template
- Verify date format (DD-MM-YYYY or YYYY-MM-DD)
- Ensure amounts are numbers
- Remove any special characters
- Download and use the template

### Issue 4: "Duplicate transactions"
**Symptoms:** Same transactions appear multiple times

**Solutions:**
- Don't import the same file twice
- Check localStorage before importing
- Delete duplicates manually
- Refresh page and try again

### Issue 5: "New envelopes not created"
**Symptoms:** Transactions imported but envelopes missing

**Solutions:**
- Check Budget Allocation page
- New envelopes should be there
- Default category is "Need"
- You can change categories later

## Verification Steps

### After Import, Verify:

1. **Console Logs** (F12 → Console)
   ```
   ✓ "Importing transactions: X"
   ✓ "Import event dispatched"
   ✓ "Import event received in App.js: X transactions"
   ✓ "New total transactions: Y"
   ```

2. **LocalStorage** (F12 → Application → Local Storage)
   ```
   ✓ transactions: [array with your data]
   ✓ envelopes: [array with new envelopes]
   ✓ paymentMethods: [array with new methods]
   ```

3. **Dashboard**
   ```
   ✓ Income/Expense summary updated
   ✓ Account balances show new data
   ✓ Envelopes show spending
   ```

4. **Transactions Page**
   ```
   ✓ All transactions listed
   ✓ Can filter and search
   ✓ Can edit/delete
   ```

## Debug Mode

### Enable Detailed Logging

1. Open browser console (F12)
2. Before importing, run:
   ```javascript
   localStorage.setItem('debug', 'true');
   ```
3. Refresh page
4. Import transactions
5. Check console for detailed logs

### Check Current State

```javascript
// In browser console:

// Check transactions
console.log('Transactions:', 
  JSON.parse(localStorage.getItem('transactions'))
);

// Check envelopes
console.log('Envelopes:', 
  JSON.parse(localStorage.getItem('envelopes'))
);

// Check payment methods
console.log('Payment Methods:', 
  JSON.parse(localStorage.getItem('paymentMethods'))
);
```

### Manual Import Trigger

If automatic import fails, try manual trigger:

```javascript
// In browser console:
const transactions = [
  {
    id: Date.now(),
    type: 'income',
    amount: 5000,
    note: 'Test',
    date: '01-01-2025',
    paymentMethod: 'Bank'
  }
];

window.dispatchEvent(new CustomEvent('importTransactions', { 
  detail: transactions 
}));
```

## Reset & Clean Start

### If Nothing Works, Reset:

1. **Clear All Data**
   ```javascript
   // In browser console:
   localStorage.clear();
   location.reload();
   ```

2. **Start Fresh**
   - Add 1 manual transaction
   - Verify it appears in Dashboard
   - Try importing again

3. **Use Template**
   - Download CSV template
   - Don't modify format
   - Just change the data
   - Import template

## Browser Compatibility

### Tested Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Known Issues
- ❌ Internet Explorer (not supported)
- ⚠️ Safari < 14 (localStorage issues)
- ⚠️ Mobile browsers (use desktop for import)

## Getting Help

### Before Asking for Help:

1. Check this troubleshooting guide
2. Try the quick fixes above
3. Check browser console for errors
4. Verify CSV format matches template
5. Try with template file first

### When Reporting Issues:

Include:
- Browser name and version
- Steps to reproduce
- Console error messages
- Sample CSV file (if possible)
- Screenshots of the issue

### Contact Information:

- Check documentation files
- Review sample CSV files
- Open issue on GitHub
- Contact support team

## Prevention Tips

### To Avoid Issues:

1. **Use the Template**
   - Download template from import screen
   - Keep the same format
   - Only change the data

2. **Validate Before Import**
   - Check date formats
   - Verify amounts are numbers
   - Remove special characters
   - Test with small file first

3. **Backup Data**
   - Export current transactions
   - Save CSV files
   - Keep backups before importing

4. **Import in Batches**
   - Don't import 1000+ transactions at once
   - Split into smaller files
   - Import one month at a time

5. **Verify After Import**
   - Check Dashboard immediately
   - Verify transaction counts
   - Review new envelopes
   - Test filtering and search

---

**Need More Help?**
- Read: `IMPORT_FEATURE_GUIDE.md`
- Quick Start: `QUICK_START_IMPORT.md`
- Visual Guide: `VISUAL_USER_GUIDE.md`
