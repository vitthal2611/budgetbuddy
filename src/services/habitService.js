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
      
      // Return initial seed data on first load
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
          // First time - initialize with seed data
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

    const generateStreak = (habitId, days, skipYesterday = false) => {
      const dates = [];
      const startDay = skipYesterday ? 2 : 1;
      for (let i = days; i >= startDay; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dates.push({ date: formatDate(d), habitId });
      }
      return dates;
    };

    const generateWeeklyStreak = (habitId, weeks) => {
      const dates = [];
      for (let i = weeks; i >= 1; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - (i * 7));
        dates.push({ date: formatDate(d), habitId });
      }
      return dates;
    };

    const allCompletions = [
      // Morning Routine Chain (06:00-07:30)
      ...generateStreak('h_1', 45), // 45-day streak - Make bed
      ...generateStreak('h_2', 45), // 45-day streak - Drink water (stacked after h_1)
      ...generateStreak('h_3', 30), // 30-day streak - Meditate
      ...generateStreak('h_4', 30), // 30-day streak - Journal (stacked after h_3)
      
      // Fitness Chain (08:00-09:00)
      ...generateStreak('h_5', 5, true), // 5-day streak, missed yesterday - Put on workout clothes
      ...generateStreak('h_6', 5, true), // 5-day streak, missed yesterday - Do 1 pushup (stacked)
      
      // Work/Productivity (09:00-17:00)
      ...generateStreak('h_7', 20), // 20-day streak - Review daily goals
      ...generateStreak('h_8', 15), // 15-day streak - Deep work 25min
      ...generateStreak('h_9', 3), // 3-day streak - No social media before lunch
      
      // Evening Routine (18:00-22:00)
      ...generateStreak('h_10', 12), // 12-day streak - Read one page
      ...generateStreak('h_11', 8), // 8-day streak - Plan tomorrow
      ...generateStreak('h_12', 8), // 8-day streak - Gratitude note (stacked after h_11)
      
      // Weekly habits
      ...generateWeeklyStreak('h_13', 4), // 4-week streak - Review finances
      ...generateWeeklyStreak('h_14', 3), // 3-week streak - Meal prep Sunday
      
      // Monthly habit
      { date: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)), habitId: 'h_15' }
    ];

    const completions = {};
    allCompletions.forEach(({ date, habitId }) => {
      if (!completions[date]) completions[date] = [];
      if (!completions[date].includes(habitId)) {
        completions[date].push(habitId);
      }
    });

    return {
      habits: [
        // Morning Routine Chain (06:00-07:30)
        {
          id: 'h_1',
          name: 'Make bed',
          identity: 'I am an organized person',
          time: '06:00',
          location: 'Bedroom',
          reward: 'Feel accomplished',
          stackAfter: '',
          frequency: 'daily',
          habitType: 'positive',
          difficulty: 'easy',
          createdAt: formatDate(new Date(today.getFullYear(), today.getMonth() - 2, 1))
        },
        {
          id: 'h_2',
          name: 'Drink one glass of water',
          identity: 'I am a healthy person',
          time: '06:00',
          location: 'Kitchen',
          reward: 'Start day hydrated',
          stackAfter: 'h_1',
          frequency: 'daily',
          habitType: 'positive',
          difficulty: 'easy',
          createdAt: formatDate(new Date(today.getFullYear(), today.getMonth() - 2, 1))
        },
        {
          id: 'h_3',
          name: 'Meditate 2 minutes',
          identity: 'I am a calm and mindful person',
          time: '07:00',
          location: 'Living Room',
          reward: 'Enjoy breakfast',
          stackAfter: '',
          frequency: 'daily',
          habitType: 'positive',
          difficulty: 'easy',
          createdAt: formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 1))
        },
        {
          id: 'h_4',
          name: 'Journal 1 sentence',
          identity: 'I am a reflective person',
          time: '07:00',
          location: 'Living Room',
          reward: 'Check phone',
          stackAfter: 'h_3',
          frequency: 'daily',
          habitType: 'positive',
          difficulty: 'easy',
          createdAt: formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 1))
        },
        
        // Fitness Chain (08:00-09:00)
        {
          id: 'h_5',
          name: 'Put on workout clothes',
          identity: 'I am an athlete',
          time: '08:00',
          location: 'Bedroom',
          reward: 'Listen to favorite song',
          stackAfter: '',
          frequency: 'daily',
          habitType: 'positive',
          difficulty: 'easy',
          createdAt: formatDate(new Date(today.getFullYear(), today.getMonth(), 1))
        },
        {
          id: 'h_6',
          name: 'Do 1 pushup',
          identity: 'I am strong',
          time: '08:00',
          location: 'Living Room',
          reward: 'Protein shake',
          stackAfter: 'h_5',
          frequency: 'daily',
          habitType: 'positive',
          difficulty: 'easy',
          createdAt: formatDate(new Date(today.getFullYear(), today.getMonth(), 1))
        },
        
        // Work/Productivity (09:00-17:00)
        {
          id: 'h_7',
          name: 'Review daily goals',
          identity: 'I am focused and intentional',
          time: '09:00',
          location: 'Office',
          reward: 'Coffee break',
          stackAfter: '',
          frequency: 'daily',
          habitType: 'positive',
          difficulty: 'easy',
          createdAt: formatDate(new Date(today.getFullYear(), today.getMonth(), 10))
        },
        {
          id: 'h_8',
          name: 'Deep work 25 minutes',
          identity: 'I am productive',
          time: '10:00',
          location: 'Office',
          reward: '5 min break',
          stackAfter: '',
          frequency: 'daily',
          habitType: 'positive',
          difficulty: 'medium',
          createdAt: formatDate(new Date(today.getFullYear(), today.getMonth(), 15))
        },
        {
          id: 'h_9',
          name: 'No social media before lunch',
          identity: 'I am disciplined',
          time: '12:00',
          location: 'Office',
          reward: 'Guilt-free scrolling',
          stackAfter: '',
          frequency: 'daily',
          habitType: 'negative',
          difficulty: 'easy',
          createdAt: formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5))
        },
        
        // Evening Routine (18:00-22:00)
        {
          id: 'h_10',
          name: 'Read one page',
          identity: 'I am a reader',
          time: '20:00',
          location: 'Living Room',
          reward: 'Watch TV',
          stackAfter: '',
          frequency: 'daily',
          habitType: 'positive',
          difficulty: 'easy',
          createdAt: formatDate(new Date(today.getFullYear(), today.getMonth(), 18))
        },
        {
          id: 'h_11',
          name: 'Plan tomorrow (2 min)',
          identity: 'I am prepared',
          time: '21:00',
          location: 'Office',
          reward: 'Relax guilt-free',
          stackAfter: '',
          frequency: 'daily',
          habitType: 'positive',
          difficulty: 'easy',
          createdAt: formatDate(new Date(today.getFullYear(), today.getMonth(), 22))
        },
        {
          id: 'h_12',
          name: 'Write 1 gratitude note',
          identity: 'I am grateful',
          time: '21:00',
          location: 'Office',
          reward: 'Sleep peacefully',
          stackAfter: 'h_11',
          frequency: 'daily',
          habitType: 'positive',
          difficulty: 'easy',
          createdAt: formatDate(new Date(today.getFullYear(), today.getMonth(), 22))
        },
        
        // Weekly Habits
        {
          id: 'h_13',
          name: 'Review finances 10 min',
          identity: 'I am financially responsible',
          time: '10:00',
          location: 'Office',
          reward: 'Order takeout',
          stackAfter: '',
          frequency: 'weekly',
          habitType: 'neutral',
          difficulty: 'medium',
          createdAt: formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 1))
        },
        {
          id: 'h_14',
          name: 'Meal prep 1 container',
          identity: 'I am healthy and prepared',
          time: '14:00',
          location: 'Kitchen',
          reward: 'Easy meals all week',
          stackAfter: '',
          frequency: 'weekly',
          habitType: 'positive',
          difficulty: 'medium',
          createdAt: formatDate(new Date(today.getFullYear(), today.getMonth(), 1))
        },
        
        // Monthly Habit
        {
          id: 'h_15',
          name: 'Deep clean one room',
          identity: 'I am organized',
          time: '09:00',
          location: 'Home',
          reward: 'Order pizza',
          stackAfter: '',
          frequency: 'monthly',
          habitType: 'neutral',
          difficulty: 'hard',
          createdAt: formatDate(new Date(today.getFullYear(), today.getMonth(), 1))
        }
      ],
      completions
    };
  }
}

const habitServiceInstance = new HabitService();
export default habitServiceInstance;
