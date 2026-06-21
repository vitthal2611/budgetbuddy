import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectAuthEmulator, getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDY-LZIb3RZlYAH1eBcTejzGdhZ-b5PEGg",
  authDomain: "budgetbuddy-9d7da.firebaseapp.com",
  projectId: "budgetbuddy-9d7da",
  storageBucket: "budgetbuddy-9d7da.firebasestorage.app",
  messagingSenderId: "52697566663",
  appId: "1:52697566663:web:c58b872b4ef3d3efac9de2"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
}

export default app;
