import { db } from '../config/firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const COLLECTION_NAME = 'todos';

class TodoService {
  getCurrentUserId() {
    const auth = getAuth();
    return auth.currentUser?.uid;
  }

  getUserDocRef() {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    return doc(db, COLLECTION_NAME, userId);
  }

  async loadTasks() {
    try {
      const docRef = this.getUserDocRef();
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data().tasks || [];
      }
      
      // Return initial seed data on first load
      return this.getInitialSeedData();
    } catch (error) {
      console.error('Error loading tasks:', error);
      throw error;
    }
  }

  async saveTasks(tasks) {
    try {
      const docRef = this.getUserDocRef();
      await setDoc(docRef, { tasks }, { merge: true });
    } catch (error) {
      console.error('Error saving tasks:', error);
      throw error;
    }
  }

  subscribeToTasks(callback) {
    try {
      const docRef = this.getUserDocRef();
      
      return onSnapshot(
        docRef,
        {
          includeMetadataChanges: false
        },
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            callback(data.tasks || []);
          } else {
            // First time - initialize with seed data
            const seedData = this.getInitialSeedData();
            this.saveTasks(seedData).then(() => {
              callback(seedData);
            }).catch((err) => {
              console.error('Error initializing tasks:', err);
              callback([]);
            });
          }
        },
        (error) => {
          console.error('Tasks subscription error:', error);
          // Return empty array on error to prevent app crash
          callback([]);
        }
      );
    } catch (error) {
      console.error('Error subscribing to tasks:', error);
      // Return empty array on error
      callback([]);
      return () => {};
    }
  }

  getInitialSeedData() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return [
      // Quadrant 1: Urgent & Important (Do First) - 8 tasks
      {
        id: 'task_1',
        title: 'Fix critical bug in production',
        description: 'Users reporting login issues - needs immediate attention',
        dueDate: formatDate(today),
        quadrant: 'urgent-important',
        completed: false,
        createdAt: new Date(today.getTime() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_2',
        title: 'Submit project proposal',
        description: 'Deadline is today at 5 PM',
        dueDate: formatDate(today),
        quadrant: 'urgent-important',
        completed: false,
        createdAt: new Date(today.getTime() - 5 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_3',
        title: 'Prepare for client meeting',
        description: 'Review presentation slides and demo',
        dueDate: formatDate(tomorrow),
        quadrant: 'urgent-important',
        completed: false,
        createdAt: new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_17',
        title: 'Complete tax filing',
        description: 'Deadline approaching',
        dueDate: formatDate(tomorrow),
        quadrant: 'urgent-important',
        completed: false,
        createdAt: new Date(today.getTime() - 12 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_18',
        title: 'Pay utility bills',
        description: 'Due today',
        dueDate: formatDate(today),
        quadrant: 'urgent-important',
        completed: false,
        createdAt: new Date(today.getTime() - 8 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_19',
        title: 'Doctor appointment follow-up',
        description: 'Call for test results',
        dueDate: formatDate(today),
        quadrant: 'urgent-important',
        completed: false,
        createdAt: new Date(today.getTime() - 6 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_20',
        title: 'Submit insurance claim',
        description: 'Deadline is tomorrow',
        dueDate: formatDate(tomorrow),
        quadrant: 'urgent-important',
        completed: false,
        createdAt: new Date(today.getTime() - 18 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_21',
        title: 'Renew car registration',
        description: 'Expires this week',
        dueDate: formatDate(tomorrow),
        quadrant: 'urgent-important',
        completed: false,
        createdAt: new Date(today.getTime() - 36 * 60 * 60 * 1000).toISOString()
      },

      // Quadrant 2: Not Urgent & Important (Schedule) - 10 tasks
      {
        id: 'task_4',
        title: 'Plan Q2 goals and objectives',
        description: 'Set strategic priorities for next quarter',
        dueDate: formatDate(nextWeek),
        quadrant: 'not-urgent-important',
        completed: false,
        createdAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_5',
        title: 'Learn new framework',
        description: 'Complete online course on React advanced patterns',
        dueDate: '',
        quadrant: 'not-urgent-important',
        completed: false,
        createdAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_6',
        title: 'Exercise 30 minutes',
        description: 'Maintain fitness routine',
        dueDate: formatDate(today),
        quadrant: 'not-urgent-important',
        completed: true,
        createdAt: new Date(today.getTime() - 10 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_22',
        title: 'Update resume and portfolio',
        description: 'Add recent projects',
        dueDate: '',
        quadrant: 'not-urgent-important',
        completed: false,
        createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_23',
        title: 'Read industry articles',
        description: 'Stay updated with trends',
        dueDate: '',
        quadrant: 'not-urgent-important',
        completed: false,
        createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_24',
        title: 'Network with colleagues',
        description: 'Schedule coffee meetings',
        dueDate: formatDate(nextWeek),
        quadrant: 'not-urgent-important',
        completed: false,
        createdAt: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_25',
        title: 'Plan vacation',
        description: 'Research destinations and book',
        dueDate: '',
        quadrant: 'not-urgent-important',
        completed: false,
        createdAt: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_26',
        title: 'Review financial goals',
        description: 'Check savings and investments',
        dueDate: formatDate(nextWeek),
        quadrant: 'not-urgent-important',
        completed: false,
        createdAt: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_27',
        title: 'Learn a new skill',
        description: 'Start online course',
        dueDate: '',
        quadrant: 'not-urgent-important',
        completed: false,
        createdAt: new Date(today.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_28',
        title: 'Organize home office',
        description: 'Improve workspace ergonomics',
        dueDate: '',
        quadrant: 'not-urgent-important',
        completed: false,
        createdAt: new Date(today.getTime() - 11 * 24 * 60 * 60 * 1000).toISOString()
      },

      // Quadrant 3: Urgent & Not Important (Delegate) - 8 tasks
      {
        id: 'task_7',
        title: 'Respond to non-critical emails',
        description: 'Clear inbox of routine correspondence',
        dueDate: formatDate(today),
        quadrant: 'urgent-not-important',
        completed: false,
        createdAt: new Date(today.getTime() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_8',
        title: 'Schedule team lunch',
        description: 'Find a date that works for everyone',
        dueDate: formatDate(tomorrow),
        quadrant: 'urgent-not-important',
        completed: false,
        createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_29',
        title: 'Order office supplies',
        description: 'Restock printer paper and pens',
        dueDate: formatDate(today),
        quadrant: 'urgent-not-important',
        completed: false,
        createdAt: new Date(today.getTime() - 3 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_30',
        title: 'RSVP to event invitation',
        description: 'Respond by today',
        dueDate: formatDate(today),
        quadrant: 'urgent-not-important',
        completed: false,
        createdAt: new Date(today.getTime() - 7 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_31',
        title: 'Return library books',
        description: 'Due tomorrow',
        dueDate: formatDate(tomorrow),
        quadrant: 'urgent-not-important',
        completed: false,
        createdAt: new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_32',
        title: 'Pick up dry cleaning',
        description: 'Store closes at 6 PM',
        dueDate: formatDate(today),
        quadrant: 'urgent-not-important',
        completed: false,
        createdAt: new Date(today.getTime() - 5 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_33',
        title: 'Call plumber for quote',
        description: 'Need estimate today',
        dueDate: formatDate(today),
        quadrant: 'urgent-not-important',
        completed: false,
        createdAt: new Date(today.getTime() - 9 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_34',
        title: 'Update phone contacts',
        description: 'Sync with new device',
        dueDate: formatDate(tomorrow),
        quadrant: 'urgent-not-important',
        completed: false,
        createdAt: new Date(today.getTime() - 15 * 60 * 60 * 1000).toISOString()
      },

      // Quadrant 4: Not Urgent & Not Important (Eliminate) - 6 tasks
      {
        id: 'task_9',
        title: 'Organize old files',
        description: 'Clean up desktop and downloads folder',
        dueDate: '',
        quadrant: 'not-urgent-not-important',
        completed: false,
        createdAt: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_10',
        title: 'Browse social media',
        description: 'Check latest updates',
        dueDate: '',
        quadrant: 'not-urgent-not-important',
        completed: true,
        createdAt: new Date(today.getTime() - 1 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_35',
        title: 'Watch random YouTube videos',
        description: 'Entertainment',
        dueDate: '',
        quadrant: 'not-urgent-not-important',
        completed: false,
        createdAt: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_36',
        title: 'Play mobile games',
        description: 'Time filler',
        dueDate: '',
        quadrant: 'not-urgent-not-important',
        completed: false,
        createdAt: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_37',
        title: 'Reorganize bookshelf',
        description: 'Alphabetize books',
        dueDate: '',
        quadrant: 'not-urgent-not-important',
        completed: false,
        createdAt: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'task_38',
        title: 'Browse online shopping',
        description: 'Window shopping',
        dueDate: '',
        quadrant: 'not-urgent-not-important',
        completed: false,
        createdAt: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }
}

const todoServiceInstance = new TodoService();
export default todoServiceInstance;
