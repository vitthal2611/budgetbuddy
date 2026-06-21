import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCategories([]);
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const categoriesRef = collection(db, 'expenseTracker', user.uid, 'categories');
    const transactionsRef = collection(db, 'expenseTracker', user.uid, 'transactions');

    const unsubCategories = onSnapshot(categoriesRef, (snapshot) => {
      setCategories(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubTransactions = onSnapshot(transactionsRef, (snapshot) => {
      setTransactions(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubCategories();
      unsubTransactions();
    };
  }, [user]);

  const addCategory = ({ name, monthlyBudget }) => {
    const categoriesRef = collection(db, 'expenseTracker', user.uid, 'categories');
    return addDoc(categoriesRef, {
      name,
      monthlyBudget: Number(monthlyBudget),
      createdAt: serverTimestamp()
    });
  };

  const updateCategory = (id, { name, monthlyBudget }) => {
    const ref = doc(db, 'expenseTracker', user.uid, 'categories', id);
    return updateDoc(ref, { name, monthlyBudget: Number(monthlyBudget) });
  };

  const deleteCategory = (id) => {
    const ref = doc(db, 'expenseTracker', user.uid, 'categories', id);
    return deleteDoc(ref);
  };

  const addTransaction = ({ type, amount, categoryId, date, note }) => {
    const transactionsRef = collection(db, 'expenseTracker', user.uid, 'transactions');
    return addDoc(transactionsRef, {
      type,
      amount: Number(amount),
      categoryId: type === 'expense' ? categoryId : null,
      date,
      note: note || '',
      createdAt: serverTimestamp()
    });
  };

  const deleteTransaction = (id) => {
    const ref = doc(db, 'expenseTracker', user.uid, 'transactions', id);
    return deleteDoc(ref);
  };

  const value = {
    categories,
    transactions,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    addTransaction,
    deleteTransaction
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}
