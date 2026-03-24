# Data Flow Diagram - Import with Cloud Sync

## Before Fix (Data Loss Issue)

```
┌─────────────────────────────────────────────────────────────┐
│                    IMPORT PROCESS                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Parse CSV File   │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Create Envelopes │
                    │ Create Methods   │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Dispatch Event   │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Update State     │
                    │ (in memory)      │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Save to          │
                    │ localStorage     │ ✅ Saved locally
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ ❌ NO CLOUD SYNC │ ⚠️ Problem!
                    └──────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   BROWSER REFRESH                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Auth Check       │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Cloud Subscribe  │
                    │ (loads old data) │ ⚠️ No imported data!
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Set State        │
                    │ (cloud data)     │ 💥 Overwrites!
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Load localStorage│
                    │ (too late!)      │ ❌ Ignored
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ ❌ DATA LOST     │
                    └──────────────────┘
```

---

## After Fix (Data Persists)

```
┌─────────────────────────────────────────────────────────────┐
│                    IMPORT PROCESS                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Parse CSV File   │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Create Envelopes │ ──────┐
                    │ Create Methods   │       │
                    └──────────────────┘       │
                              │                │
                              ▼                ▼
                    ┌──────────────────┐  ┌──────────────┐
                    │ Dispatch Event   │  │ DataContext  │
                    └──────────────────┘  │ Auto-Sync    │
                              │           └──────────────┘
                              ▼                │
                    ┌──────────────────┐       │
                    │ Update State     │       │
                    │ (in memory)      │       │
                    └──────────────────┘       │
                              │                │
                              ▼                ▼
                    ┌──────────────────┐  ┌──────────────┐
                    │ Save to          │  │ Sync to      │
                    │ localStorage     │  │ Firestore    │
                    └──────────────────┘  └──────────────┘
                              │                │
                              ▼                ▼
                    ┌──────────────────────────────────┐
                    │ ✅ SYNC TRANSACTIONS TO CLOUD   │
                    │    (background process)          │
                    └──────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Show Sync        │
                    │ Indicator        │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ ✅ ALL DATA      │
                    │    IN CLOUD      │
                    └──────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   BROWSER REFRESH                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Auth Check       │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Cloud Subscribe  │
                    │ (loads all data) │ ✅ Includes imports!
                    └──────────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │Transact. │  │Envelopes │  │ Methods  │
        └──────────┘  └──────────┘  └──────────┘
                │             │             │
                └─────────────┼─────────────┘
                              ▼
                    ┌──────────────────┐
                    │ Set State        │
                    │ (complete data)  │ ✅ All data present
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Update UI        │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ ✅ DATA PERSISTS │
                    └──────────────────┘
```

---

## Component Communication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  ImportTransactions.js                       │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 1. Parse CSV                                        │    │
│  │ 2. Create envelopes via DataContext.addEnvelope()  │    │
│  │ 3. Create methods via DataContext.addPaymentMethod()│   │
│  │ 4. Dispatch 'importTransactions' event             │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ window.dispatchEvent()
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DataContext.js                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │ addEnvelope() called                                │    │
│  │   ├─> Update state                                  │    │
│  │   ├─> Save to localStorage                          │    │
│  │   └─> Trigger useEffect                             │    │
│  │         └─> syncEnvelopesToCloud()                  │    │
│  │               └─> cloudStorage.saveEnvelopes()      │    │
│  │                                                      │    │
│  │ addPaymentMethod() called                           │    │
│  │   ├─> Update state                                  │    │
│  │   ├─> Save to localStorage                          │    │
│  │   └─> Trigger useEffect                             │    │
│  │         └─> syncPaymentMethodsToCloud()             │    │
│  │               └─> cloudStorage.savePaymentMethods() │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ window.addEventListener()
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         App.js                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │ handleImportEvent() triggered                       │    │
│  │   ├─> Update transactions state (immediate)        │    │
│  │   └─> Async cloud sync loop:                       │    │
│  │         for each transaction:                       │    │
│  │           └─> cloudStorage.addTransaction()         │    │
│  │                 └─> Firestore write                 │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ All writes complete
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Firestore Cloud                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │ users/{userId}/transactions/{id}                    │    │
│  │ users/{userId}/envelopes/current                    │    │
│  │ users/{userId}/paymentMethods/current               │    │
│  │ users/{userId}/budgets/current                      │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Sync Indicator States

```
┌─────────────────────────────────────────────────────────────┐
│                    USER EXPERIENCE                           │
└─────────────────────────────────────────────────────────────┘

1. Import Started
   ┌──────────────────────────────────┐
   │ 📊 Importing transactions...     │
   │ [Progress Bar: 0%]               │
   └──────────────────────────────────┘

2. Parsing Complete
   ┌──────────────────────────────────┐
   │ ✅ Import Complete!              │
   │ 50 transactions imported         │
   │ + 5 envelopes created            │
   │ + 3 payment methods created      │
   └──────────────────────────────────┘

3. Cloud Sync Started (Background)
   ┌──────────────────────────────────┐
   │ 🔄 Syncing...                    │  ← Top of screen
   └──────────────────────────────────┘

4. Cloud Sync Complete
   ┌──────────────────────────────────┐
   │ ✅ Synced                        │  ← Disappears after 2s
   └──────────────────────────────────┘

5. Error State (if sync fails)
   ┌──────────────────────────────────┐
   │ ⚠️ Cloud Sync Failed             │
   │ Data saved locally only          │
   │ [Retry] [Dismiss]                │
   └──────────────────────────────────┘
```

---

## Multi-Device Sync Flow

```
Device A                    Firestore Cloud              Device B
────────                    ───────────────              ────────

Import CSV
    │
    ├─> Parse
    │
    ├─> Create items
    │
    └─> Sync to cloud ──────────────────────────────────────┐
                                                             │
                                                             ▼
                                                    ┌────────────────┐
                                                    │ Write to       │
                                                    │ Firestore      │
                                                    └────────────────┘
                                                             │
                                                             │
                                                             │
                                                             ▼
                                                    ┌────────────────┐
                                                    │ Trigger        │
                                                    │ onSnapshot     │
                                                    └────────────────┘
                                                             │
                                                             │
                                                             ▼
                                                    Real-time update
                                                             │
                                                             │
                                                             ▼
                                                        Device B
                                                        receives
                                                        new data
                                                             │
                                                             ▼
                                                        UI updates
                                                        automatically
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    HAPPY PATH                                │
└─────────────────────────────────────────────────────────────┘

Import → Parse → Sync → Success → UI Update → Done ✅


┌─────────────────────────────────────────────────────────────┐
│                    ERROR PATHS                               │
└─────────────────────────────────────────────────────────────┘

1. Network Error During Sync
   Import → Parse → Sync → ❌ Network Error
                              │
                              ├─> Save to localStorage ✅
                              ├─> Show error message
                              └─> Retry on next refresh

2. Partial Sync Failure
   Import → Parse → Sync → 45/50 success, 5 failed
                              │
                              ├─> Save all to localStorage ✅
                              ├─> Show partial success message
                              └─> Log failed IDs for retry

3. Authentication Error
   Import → Parse → Sync → ❌ Not authenticated
                              │
                              ├─> Save to localStorage ✅
                              ├─> Show auth error
                              └─> Prompt re-login

4. Quota Exceeded
   Import → Parse → Sync → ❌ Firestore quota exceeded
                              │
                              ├─> Save to localStorage ✅
                              ├─> Show quota error
                              └─> Suggest export/cleanup
```

---

## State Management Timeline

```
Time →

T0: User clicks Import
    State: { transactions: [1,2,3], syncing: false }

T1: CSV parsed
    State: { transactions: [1,2,3], syncing: false }

T2: Event dispatched
    State: { transactions: [1,2,3], syncing: false }

T3: State updated (immediate)
    State: { transactions: [1,2,3,4,5,6], syncing: true }
    UI: Shows new transactions immediately ✅

T4: Cloud sync in progress
    State: { transactions: [1,2,3,4,5,6], syncing: true }
    UI: Shows sync indicator 🔄

T5: Cloud sync complete
    State: { transactions: [1,2,3,4,5,6], syncing: false }
    UI: Hides sync indicator ✅

T6: User refreshes browser
    State: { transactions: [], syncing: false }

T7: Cloud subscription loads
    State: { transactions: [1,2,3,4,5,6], syncing: false }
    UI: Shows all transactions including imports ✅
```
