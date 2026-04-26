---
inclusion: auto
---

# Budget Buddy - Project Overview

Budget Buddy is a React-based personal finance application with Firebase backend for cloud sync and real-time data management.

## Tech Stack

- **Frontend**: React 18.2.0
- **Backend**: Firebase 12.11.0 (Firestore, Authentication)
- **Build Tool**: Create React App (react-scripts 5.0.1)
- **Charts**: Recharts 3.8.1
- **Date Handling**: date-fns 2.30.0

## Core Features

1. **Envelope Budgeting System** - Zero-based budgeting with envelope allocation
2. **Transaction Management** - Income, expenses, and transfers with real-time sync
3. **Habit Tracker** - Personal habit tracking functionality
4. **Todo Matrix** - Task management with priority matrix
5. **Reports & Analytics** - Financial insights and visualizations
6. **Multi-Account Support** - Track multiple payment methods
7. **Cloud Sync** - Real-time Firebase synchronization with offline support

## Project Structure

```
src/
├── components/          # React components
│   ├── shared/         # Reusable UI components (Modal, Toast, LoadingSpinner, etc.)
│   ├── settings/       # Settings-related components
│   ├── reports/        # Analytics and reporting
│   ├── envelopes/      # Envelope budgeting UI
│   └── onboarding/     # User onboarding flow
├── contexts/           # React Context providers (DataContext, PreferencesContext)
├── services/           # Business logic and Firebase integration
├── hooks/              # Custom React hooks
├── utils/              # Helper functions and utilities
├── styles/             # Global CSS and design tokens
└── config/             # Firebase configuration
```

## Key Architectural Patterns

- **Context API** for global state management (DataContext, PreferencesContext)
- **Service Layer** for Firebase operations (cloudStorage, authService, habitService, etc.)
- **Real-time Subscriptions** for live data updates
- **Optimistic UI Updates** with error rollback
- **Local-first with Cloud Sync** - localStorage + Firebase
- **Component Composition** with shared UI components

## Development Commands

- `npm start` - Start development server (port 3000)
- `npm run build` - Production build
- `npm test` - Run tests
