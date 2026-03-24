import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDY-LZIb3RZlYAH1eBcTejzGdhZ-b5PEGg",
  authDomain: "budgetbuddy-9d7da.firebaseapp.com",
  projectId: "budgetbuddy-9d7da",
  storageBucket: "budgetbuddy-9d7da.firebasestorage.app",
  messagingSenderId: "52697566663",
  appId: "1:52697566663:web:c58b872b4ef3d3efac9de2",
  measurementId: "G-CYGL0PPSJV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with new cache API (supports multiple tabs)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Initialize Auth
export const auth = getAuth(app);

export default app;
