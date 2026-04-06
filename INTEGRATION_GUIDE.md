# 🚀 Integration Guide - Completing the Refactor

This guide will help you integrate all the new components and features into your existing app.

---

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ All Phase 1-3 files created
- ✅ No TypeScript errors
- ✅ Firebase configured and working
- ✅ App running on `npm start`

---

## Step 1: Update App.js - Add New State

Add these state variables to `src/App.js`:

```javascript
// Add after existing state declarations
const [recurring, setRecurring] = useState([]);
const [templates, setTemplates] = useState([]);
const [showOnboarding, setShowOnboarding] = useState(false);
const [showReports, setShowReports] = useState(false);

// Check if onboarding is needed
useEffect(() => {
  const onboardingComplete = localStorage.getItem('onboardingComplete');
  if (!onboardingComplete && user) {
    setShowOnboarding(true);
  }
}, [user]);
```

---

## Step 2: Update App.js - Add Imports

Add these imports at the top of `src/App.js`:

```javascript
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import Reports from './components/reports/Reports';
import recurringService from './services/recurringService';
```

---

## Step 3: Update App.js - Add Recurring Processing

Add this effect to process recurring transactions:

```javascript
// Process recurring transactions on app load
useEffect(() => {
  if (!user || recurring.length === 0) return;
  
  recurringService.loadRecurringTransactions(recurring);
  const toProcess = recurringService.getTransactionsToProcess();
  
  if (toProcess.length > 0) {
    const confirmMsg = `Process ${toProcess.length} recurring transaction(s)?`;
    if (window.confirm(confirmMsg)) {
      toProcess.forEach(recurring => {
        const transaction = recurringService.generateTransaction(recurring, new Date());
        handleSaveTransaction(transaction);
        
        // Update last processed date
        setRecurring(prev => prev.map(r => 
          r.id === recurring.id 
            ? { ...r, lastProcessed: recurringService.formatDate(new Date()) }
            : r
        ));
      });
    }
  }
}, [user, recurring]);
```

---

## Step 4: Update App.js - Add Navigation

Update the tabs section to include Reports:

```javascript
<div className="tabs">
  <button 
    className={activeTab === 'envelopes' ? 'active' : ''} 
    onClick={() => setActiveTab('envelopes')}
  >
    Envelopes
  </button>
  <button 
    className={activeTab === 'dashboard' ? 'active' : ''} 
    onClick={() => setActiveTab('dashboard')}
  >
    Dashboard
  </button>
  <button 
    className={activeTab === 'transactions' ? 'active' : ''} 
    onClick={() => setActiveTab('transactions')}
  >
    Transactions
  </button>
  <button 
    className={activeTab === 'reports' ? 'active' : ''} 
    onClick={() => setActiveTab('reports')}
  >
    Reports
  </button>
  <button 
    className={activeTab === 'settings' ? 'active' : ''} 
    onClick={() => setActiveTab('settings')}
  >
    Settings
  </button>
  {/* ... existing export and signout buttons ... */}
</div>
```

---

## Step 5: Update App.js - Add Content Rendering

Add Reports rendering in the content section:

```javascript
{activeTab === 'reports' && (
  <Reports 
    transactions={transactions}
    budgets={budgets}
  />
)}
```

---

## Step 6: Update App.js - Add Onboarding

Add onboarding rendering before the main app:

```javascript
// Show onboarding if needed
if (showOnboarding) {
  return (
    <PreferencesProvider>
      <DataProvider>
        <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
      </DataProvider>
    </PreferencesProvider>
  );
}
```

---

## Step 7: Update Settings.js - Add Recurring Tab

Update `src/components/settings/Settings.js`:

```javascript
import RecurringTransactions from './RecurringTransactions';

// Add to sections array
const sections = [
  { id: 'envelopes', label: 'Envelopes', icon: '📦' },
  { id: 'payment-methods', label: 'Payment Methods', icon: '💳' },
  { id: 'recurring', label: 'Recurring', icon: '🔄' },
  { id: 'preferences', label: 'Preferences', icon: '⚙️' }
];

// Add to render section
{activeSection === 'recurring' && (
  <RecurringTransactions 
    recurring={recurring}
    setRecurring={setRecurring}
  />
)}
```

---

## Step 8: Update Settings Component Props

Update Settings component to accept recurring props:

```javascript
const Settings = ({ budgets, setBudgets, transactions, recurring, setRecurring }) => {
  // ... existing code
};
```

And pass from App.js:

```javascript
{activeTab === 'settings' && (
  <Settings 
    budgets={budgets}
    setBudgets={async (newBudgets) => {
      try {
        await cloudStorage.saveBudgets(newBudgets);
      } catch (error) {
        console.error('Save budgets error:', error);
        alert('Failed to save budgets. Please try again.');
      }
    }}
    transactions={transactions}
    recurring={recurring}
    setRecurring={setRecurring}
  />
)}
```

---

## Step 9: Update EnvelopesView - Use New Fill Modal

Replace the existing fill modal in `src/components/EnvelopesView.js` with:

```javascript
import FillEnvelopesModal from './envelopes/FillEnvelopesModal';

// Replace the existing modal with:
<FillEnvelopesModal
  isOpen={showFillModal}
  onClose={() => setShowFillModal(false)}
  budgets={budgets}
  setBudgets={setBudgets}
  transactions={transactions}
  monthlyIncome={monthlyIncome}
  year={selectedYear}
  month={selectedMonth}
  templates={templates}
/>
```

---

## Step 10: Add Preferences UI

Create `src/components/settings/BudgetPreferences.js`:

```javascript
import React from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';

const BudgetPreferences = () => {
  const { preferences, updatePreference } = usePreferences();

  return (
    <div className="budget-preferences">
      <h2>Budget Preferences</h2>
      
      <div className="preference-item">
        <label>
          <input
            type="checkbox"
            checked={preferences.blockOverspending}
            onChange={(e) => updatePreference('blockOverspending', e.target.checked)}
          />
          Block overspending (Strict Mode)
        </label>
        <p className="preference-description">
          Prevent adding expenses when envelope balance is insufficient
        </p>
      </div>

      <div className="preference-item">
        <label>Rollover Mode</label>
        <select
          value={preferences.rolloverMode}
          onChange={(e) => updatePreference('rolloverMode', e.target.value)}
        >
          <option value="automatic">Automatic</option>
          <option value="manual">Manual</option>
          <option value="none">None</option>
        </select>
        <p className="preference-description">
          How unused budget should carry over to next month
        </p>
      </div>

      <div className="preference-item">
        <label>Budget Start Day</label>
        <input
          type="number"
          min="1"
          max="31"
          value={preferences.budgetStartDay}
          onChange={(e) => updatePreference('budgetStartDay', parseInt(e.target.value))}
        />
        <p className="preference-description">
          Day of month when your budget cycle starts
        </p>
      </div>
    </div>
  );
};

export default BudgetPreferences;
```

---

## Step 11: Update Bottom Navigation

Update the bottom navigation in App.js to include Reports:

```javascript
<div className="bottom-nav">
  <button 
    className={activeTab === 'envelopes' ? 'active' : ''} 
    onClick={() => setActiveTab('envelopes')}
  >
    <span className="nav-icon">📦</span>
    <span>Envelopes</span>
  </button>
  <button 
    className={activeTab === 'dashboard' ? 'active' : ''} 
    onClick={() => setActiveTab('dashboard')}
  >
    <span className="nav-icon">📊</span>
    <span>Dashboard</span>
  </button>
  <button 
    className={activeTab === 'reports' ? 'active' : ''} 
    onClick={() => setActiveTab('reports')}
  >
    <span className="nav-icon">📈</span>
    <span>Reports</span>
  </button>
  <button 
    className={activeTab === 'transactions' ? 'active' : ''} 
    onClick={() => setActiveTab('transactions')}
  >
    <span className="nav-icon">💳</span>
    <span>Transactions</span>
  </button>
  <button 
    className={showMenu ? 'active' : ''} 
    onClick={() => setShowMenu(!showMenu)}
  >
    <span className="nav-icon">⚙️</span>
    <span>Menu</span>
  </button>
</div>
```

---

## Step 12: Add Cloud Storage for Recurring & Templates

Add to `src/services/cloudStorage.js`:

```javascript
// ==================== RECURRING TRANSACTIONS ====================

async saveRecurringTransactions(recurring) {
  const recurringRef = this.getUserCollection('recurring');
  const docRef = doc(recurringRef, 'current');
  
  await setDoc(docRef, {
    data: recurring,
    updatedAt: serverTimestamp()
  });
  
  return recurring;
}

async getRecurringTransactions() {
  const recurringRef = this.getUserCollection('recurring');
  const docRef = doc(recurringRef, 'current');
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data().data;
  }
  return [];
}

// ==================== BUDGET TEMPLATES ====================

async saveTemplate(template) {
  const templatesRef = this.getUserCollection('templates');
  const docRef = doc(templatesRef, template.id);
  
  await setDoc(docRef, {
    ...template,
    updatedAt: serverTimestamp()
  });
  
  return template;
}

async getTemplates() {
  const templatesRef = this.getUserCollection('templates');
  const snapshot = await getDocs(templatesRef);
  
  return snapshot.docs.map(doc => doc.data());
}

async deleteTemplate(templateId) {
  const templatesRef = this.getUserCollection('templates');
  const docRef = doc(templatesRef, templateId);
  
  await deleteDoc(docRef);
  return templateId;
}
```

---

## Step 13: Sync Recurring & Templates on Load

Add to App.js useEffect for Firebase subscriptions:

```javascript
// Subscribe to recurring transactions
const unsubRecurring = cloudStorage.subscribeToRecurring((data) => {
  setRecurring(data || []);
});

// Load templates
cloudStorage.getTemplates().then(data => {
  setTemplates(data || []);
});

// Add to cleanup
return () => {
  // ... existing cleanup
  unsubRecurring();
};
```

---

## Step 14: Test the Integration

1. **Start the app:**
   ```bash
   npm start
   ```

2. **Test Onboarding:**
   - Clear localStorage: `localStorage.clear()`
   - Refresh page
   - Complete onboarding flow

3. **Test Recurring Transactions:**
   - Go to Settings → Recurring
   - Add a recurring transaction
   - Restart app to see processing prompt

4. **Test Reports:**
   - Add some transactions
   - Go to Reports tab
   - Check all report types

5. **Test Fill Envelopes:**
   - Go to Envelopes tab
   - Click "Fill Envelopes"
   - Test rollover (if previous month has unused budget)
   - Test templates

6. **Test Strict Mode:**
   - Go to Settings → Preferences
   - Enable "Block overspending"
   - Try to add expense over budget
   - Should be blocked

---

## Step 15: Deploy to Firebase

Once everything works:

```bash
npm run build
firebase deploy
```

---

## 🎉 Congratulations!

You've successfully integrated:
- ✅ Reusable components (Modal, EmptyState, LoadingSpinner)
- ✅ Custom hooks (useTransactions, useBudgets, useEnvelopes)
- ✅ Settings hub with envelope & payment method management
- ✅ Enhanced transaction modal with strict enforcement
- ✅ Preferences system with cloud sync
- ✅ Recurring transactions
- ✅ Budget rollover
- ✅ Budget templates (partial)
- ✅ Onboarding flow
- ✅ Reports & insights

---

## 🐛 Troubleshooting

### Issue: "Cannot find module"
**Solution:** Check import paths are correct

### Issue: "hooks can only be called inside function components"
**Solution:** Ensure hooks are used at top level of components

### Issue: Firebase permission denied
**Solution:** Check firestore.rules allows user access

### Issue: Recurring transactions not processing
**Solution:** Check recurring state is loaded before processing

### Issue: Onboarding shows every time
**Solution:** Check localStorage.setItem('onboardingComplete', 'true') is called

---

## 📚 Next Steps

1. **Add Tests:**
   - Unit tests for utils
   - Integration tests for components
   - E2E tests for critical flows

2. **Performance Optimization:**
   - Add React.memo to expensive components
   - Implement virtual scrolling for long lists
   - Optimize Firebase queries

3. **Additional Features:**
   - Export to PDF
   - Advanced search
   - Budget goals
   - Debt tracking

4. **Polish:**
   - Add animations
   - Improve error messages
   - Add tooltips
   - Enhance mobile experience

---

**Last Updated:** April 6, 2026
**Status:** Ready for Integration
**Estimated Time:** 2-3 hours
