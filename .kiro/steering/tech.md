# Tech Stack

## Frontend Framework
- React 18.2.0 with functional components and hooks
- Create React App (react-scripts 5.0.1)
- No TypeScript - pure JavaScript

## Backend & Database
- Firebase 12.11.0
  - Firestore for data storage with persistent local cache
  - Firebase Authentication for user management
  - Firebase Hosting for deployment
- Offline-first architecture with real-time sync

## Key Libraries
- `date-fns` (2.30.0) - Date manipulation and formatting
- No state management library - uses React Context API

## Build System

### Development
```bash
npm start
```
Runs the app in development mode on http://localhost:3000 with hot reload.

### Production Build
```bash
npm run build
```
Creates optimized production build in the `build/` directory.

### Testing
```bash
npm test
```
Launches the test runner in interactive watch mode.

### Deployment
```bash
firebase deploy
```
Deploys to Firebase Hosting (requires Firebase CLI).

## Code Conventions

### Component Structure
- Functional components only (no class components)
- Hooks for state management (`useState`, `useEffect`, `useContext`)
- Custom hooks in contexts (e.g., `useData`)

### State Management
- React Context API for global state (DataContext)
- Local component state for UI-specific state
- Firebase real-time listeners for server state
- localStorage for offline persistence

### Data Flow
1. User action triggers state update
2. Optimistic UI update (immediate feedback)
3. Background sync to Firebase
4. Real-time listeners update other devices
5. Rollback on error with user notification

### File Naming
- Components: PascalCase (e.g., `Dashboard.js`)
- Services: camelCase (e.g., `cloudStorage.js`)
- Utilities: camelCase (e.g., `safeStorage.js`)
- Styles: Match component name (e.g., `Dashboard.css`)

### Error Handling
- Try-catch blocks for async operations
- User-friendly alerts for errors
- Console logging for debugging
- Optimistic updates with rollback on failure

## Firebase Configuration

### Collections Structure
```
users/{userId}/
  ├── transactions/{transactionId}
  ├── budgets/current
  ├── envelopes/current
  └── paymentMethods/current
```

### Security
- User-scoped data (all data under `/users/{userId}`)
- Authentication required for all operations
- Firestore security rules enforce user isolation

### Offline Support
- Persistent local cache with multi-tab support
- Automatic sync when connection restored
- Pending writes queued during offline periods
