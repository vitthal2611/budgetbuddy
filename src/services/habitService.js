import { db } from '../config/firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const COLLECTION_NAME = 'habits';

class HabitService {
  getCurrentUserId() {
    const auth = getAuth();
    return auth.currentUser?.uid;
  }

  getUserDocRef() {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    return doc(db, COLLECTION_NAME, userId);
  }

  async loadHabits() {
    try {
      const docRef = this.getUserDocRef();
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      
      return this.getInitialSeedData();
    } catch (error) {
      console.error('Error loading habits:', error);
      throw error;
    }
  }

  async saveHabits(data) {
    try {
      const docRef = this.getUserDocRef();
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      console.error('Error saving habits:', error);
      throw error;
    }
  }

  subscribeToHabits(callback) {
    try {
      const docRef = this.getUserDocRef();
      
      return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data());
        } else {
          const seedData = this.getInitialSeedData();
          this.saveHabits(seedData).then(() => {
            callback(seedData);
          });
        }
      }, (error) => {
        console.error('Habits subscription error:', error);
      });
    } catch (error) {
      console.error('Error subscribing to habits:', error);
      return () => {};
    }
  }

  getInitialSeedData() {
    const today = new Date();
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Generate completions for the past 7 days for test habits
    const generateCompletions = (habitId, daysBack) => {
      const completions = {};
      for (let i = 0; i < daysBack; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = formatDate(date);
        if (!completions[dateStr]) {
          completions[dateStr] = [];
        }
        completions[dateStr].push(habitId);
      }
      return completions;
    };

    // Merge all completions
    const allCompletions = {
      ...generateCompletions('h_1', 5),
      ...generateCompletions('h_2', 3),
      ...generateCompletions('h_3', 7)
    };

    // Merge completion arrays for same dates
    const mergedCompletions = {};
    Object.keys(allCompletions).forEach(dateStr => {
      if (!mergedCompletions[dateStr]) {
        mergedCompletions[dateStr] = [];
      }
      allCompletions[dateStr].forEach(habitId => {
        if (!mergedCompletions[dateStr].includes(habitId)) {
          mergedCompletions[dateStr].push(habitId);
        }
      });
    });

    return {
      habits: [
        {
          id: 'h_1',
          trigger: 'After Wakeup',
          identity: 'I am a person who starts the day hydrated',
          action: 'I will drink half glass of water',
          twoMinVersion: 'Fill glass with water',
          time: '06:00',
          location: 'Bedroom',
          makeObvious: 'Put water bottle on nightstand before sleep',
          reward: 'Feel refreshed and energized',
          startDate: formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10)),
          createdAt: formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10)),
          review: 'This habit has been going well. I feel more energized in the morning.'
        },
        {
          id: 'h_2',
          trigger: 'After Breakfast',
          identity: 'I am a person who exercises daily',
          action: 'I will do 10 pushups',
          twoMinVersion: 'Get into pushup position',
          time: '08:00',
          location: 'Living Room',
          makeObvious: 'Place yoga mat in living room',
          reward: 'Check social media for 5 minutes',
          startDate: formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)),
          createdAt: formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)),
          review: 'Getting stronger each day. Need to focus on form.'
        },
        {
          id: 'h_3',
          trigger: 'Before Sleep',
          identity: 'I am a person who reads every day',
          action: 'I will read one page',
          twoMinVersion: 'Open book to bookmark',
          time: '22:00',
          location: 'Bedroom',
          makeObvious: 'Keep book on pillow',
          reward: 'Listen to favorite song',
          startDate: formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14)),
          createdAt: formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14)),
          review: 'Reading before bed helps me sleep better. Currently on chapter 5.'
        }
      ],
      completions: mergedCompletions
    };
  }
}

const habitServiceInstance = new HabitService();
export default habitServiceInstance;
