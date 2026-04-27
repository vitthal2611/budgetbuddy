import React, { useState, useEffect } from 'react';
import habitService from '../services/habitService';
import './HabitTracker.css';

const ATOMIC_QUOTES = [
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", law: "Systems > Goals" },
  { text: "Every action you take is a vote for the type of person you wish to become.", law: "Identity" },
  { text: "The most effective way to change your behavior is to focus on who you wish to become, not what you want to achieve.", law: "Identity" },
  { text: "Habits are the compound interest of self-improvement.", law: "Core Principle" },
  { text: "Time magnifies the margin between success and failure. It will multiply whatever you feed it.", law: "Core Principle" },
  { text: "The purpose of setting goals is to win the game. The purpose of building systems is to continue playing the game.", law: "Systems > Goals" },
  { text: "You should be far more concerned with your current trajectory than with your current results.", law: "Core Principle" },
  { text: "Make it obvious.", law: "Law 1" },
  { text: "Make it attractive.", law: "Law 2" },
  { text: "Make it easy.", law: "Law 3" },
  { text: "Make it satisfying.", law: "Law 4" },
  { text: "The secret to getting results that last is to never stop making improvements.", law: "Core Principle" },
  { text: "Success is the product of daily habits—not once-in-a-lifetime transformations.", law: "Core Principle" },
  { text: "Never miss twice. Missing once is an accident. Missing twice is the start of a new habit.", law: "Law 4" }
];

const HABIT_TEMPLATES = [
  {
    category: "Health & Fitness",
    templates: [
      { emoji: "💪", name: "Do 1 pushup", identity: "I am a person who exercises daily", time: "07:00", location: "Bedroom", difficulty: "easy" },
      { emoji: "🏃", name: "Put on running shoes", identity: "I am a runner", time: "06:30", location: "Home", difficulty: "easy" },
      { emoji: "🥗", name: "Eat one vegetable", identity: "I am a healthy eater", time: "12:00", location: "Kitchen", difficulty: "easy" },
      { emoji: "💧", name: "Drink one glass of water", identity: "I am someone who stays hydrated", time: "08:00", location: "Kitchen", difficulty: "easy" }
    ]
  },
  {
    category: "Learning & Growth",
    templates: [
      { emoji: "📖", name: "Read one page", identity: "I am a reader", time: "21:00", location: "Bedroom", difficulty: "easy" },
      { emoji: "✍️", name: "Write one sentence", identity: "I am a writer", time: "09:00", location: "Office", difficulty: "easy" },
      { emoji: "🧠", name: "Learn one word", identity: "I am a lifelong learner", time: "10:00", location: "Office", difficulty: "easy" },
      { emoji: "🎨", name: "Draw for 2 minutes", identity: "I am creative", time: "19:00", location: "Living Room", difficulty: "easy" }
    ]
  },
  {
    category: "Mindfulness",
    templates: [
      { emoji: "🧘", name: "Take one deep breath", identity: "I am calm and centered", time: "07:30", location: "Bedroom", difficulty: "easy" },
      { emoji: "🙏", name: "Write one gratitude", identity: "I am grateful", time: "22:00", location: "Bedroom", difficulty: "easy" },
      { emoji: "📝", name: "Journal one thought", identity: "I am self-aware", time: "21:30", location: "Bedroom", difficulty: "easy" },
      { emoji: "🌅", name: "Watch the sunrise", identity: "I am present", time: "06:00", location: "Outdoors", difficulty: "easy" }
    ]
  },
  {
    category: "Productivity",
    templates: [
      { emoji: "🛏️", name: "Make your bed", identity: "I am organized", time: "07:00", location: "Bedroom", difficulty: "easy" },
      { emoji: "📧", name: "Clear one email", identity: "I am on top of things", time: "09:00", location: "Office", difficulty: "easy" },
      { emoji: "🧹", name: "Clean one surface", identity: "I am tidy", time: "20:00", location: "Home", difficulty: "easy" },
      { emoji: "📱", name: "Put phone in drawer", identity: "I am focused", time: "22:00", location: "Bedroom", difficulty: "easy" }
    ]
  }
];

const HabitTracker = () => {
  const [data, setData] = useState({ habits: [], completions: {} });
  const [activeTab, setActiveTab] = useState('today'); // Default to 'today' when Habits is opened
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [viewMode, setViewMode] = useState('day'); // 'day' or 'week' - MOVED UP

  const isViewingToday = (() => {
    const t = new Date(); 
    t.setHours(0,0,0,0);
    
    if (viewMode === 'week') {
      // Check if current week contains today
      const startOfWeek = new Date(viewDate);
      const day = startOfWeek.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      startOfWeek.setDate(startOfWeek.getDate() + diff);
      startOfWeek.setHours(0,0,0,0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23,59,59,999);
      
      return t >= startOfWeek && t <= endOfWeek;
    } else {
      return viewDate.getTime() === t.getTime();
    }
  })();

  const viewDateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth()+1).padStart(2,'0')}-${String(viewDate.getDate()).padStart(2,'0')}`;

  const goBack = () => setViewDate(d => { 
    const n = new Date(d); 
    if (viewMode === 'week') {
      n.setDate(n.getDate() - 7); // Go back 1 week
    } else {
      n.setDate(n.getDate() - 1); // Go back 1 day
    }
    return n; 
  });
  
  const goForward = () => { 
    if (!isViewingToday) {
      setViewDate(d => { 
        const n = new Date(d); 
        if (viewMode === 'week') {
          n.setDate(n.getDate() + 7); // Go forward 1 week
        } else {
          n.setDate(n.getDate() + 1); // Go forward 1 day
        }
        return n; 
      }); 
    }
  };
  
  const goToday = () => { const t = new Date(); t.setHours(0,0,0,0); setViewDate(t); };
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formCustomLocation, setFormCustomLocation] = useState('');
  const [formIdentity, setFormIdentity] = useState('');
  const [formReward, setFormReward] = useState('');
  const [formFrequency, setFormFrequency] = useState('daily');
  const [formDifficulty, setFormDifficulty] = useState('easy');
  const [formCustomTrigger, setFormCustomTrigger] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [deletingHabit, setDeletingHabit] = useState(null);
  
  // Edit form state
  const [editName, setEditName] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editIdentity, setEditIdentity] = useState('');
  const [editReward, setEditReward] = useState('');
  const [editFrequency, setEditFrequency] = useState('daily');
  const [editType, setEditType] = useState('positive');
  const [editDifficulty, setEditDifficulty] = useState('easy');
  const [editCustomTrigger, setEditCustomTrigger] = useState('');
  const [nameError, setNameError] = useState(false);
  const [identityError, setIdentityError] = useState(false);
  const [twoMinuteWarning, setTwoMinuteWarning] = useState(false);
  
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);
  const [weeklyReviewData, setWeeklyReviewData] = useState(null);
  const [lastCompletedHabit, setLastCompletedHabit] = useState(null);
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneData, setMilestoneData] = useState(null);
  const [swipedHabitId, setSwipedHabitId] = useState(null);
  const touchStartX = React.useRef(null);
  // viewMode moved up before navigation functions
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [completionTimes, setCompletionTimes] = useState({});
  const [editingInlineId, setEditingInlineId] = useState(null);
  const [formIdentityIcon, setFormIdentityIcon] = useState('💭');
  const [editIdentityIcon, setEditIdentityIcon] = useState('💭');
  const [showIdentityIconPicker, setShowIdentityIconPicker] = useState(false);
  const [showEditIdentityIconPicker, setShowEditIdentityIconPicker] = useState(false);
  const [customIconInput, setCustomIconInput] = useState('');
  const [showCustomIconInput, setShowCustomIconInput] = useState(false);
  const [editCustomIconInput, setEditCustomIconInput] = useState('');
  const [showEditCustomIconInput, setShowEditCustomIconInput] = useState(false);

  const IDENTITY_ICONS = [
    '💭', '🎯', '💪', '🧠', '❤️', '⭐', '🔥', '✨', '🌟', '💎',
    '🏆', '👑', '🎨', '📚', '🏃', '🧘', '🌱', '🦋', '🌈', '☀️',
    '🌙', '⚡', '🎵', '🎭', '🎪', '🎬', '📝', '✍️', '🖊️', '📖'
  ];

  useEffect(() => {
    const unsubscribe = habitService.subscribeToHabits((habitData) => {
      setData(habitData);
      setLoading(false);
    });

    // Set a timeout to stop loading if subscription fails
    const timeout = setTimeout(() => {
      if (loading) {
        console.error('Habit loading timeout - setting loading to false');
        setLoading(false);
      }
    }, 3000);

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  // Check for weekly review on mount
  useEffect(() => {
    const checkReview = () => {
      const lastReview = localStorage.getItem('lastWeeklyReview');
      const today = new Date();
      const dayOfWeek = today.getDay();
      
      // Show review on Sunday if not done this week
      if (dayOfWeek === 0 && data.habits.length > 0) {
        if (!lastReview) {
          generateWeeklyReview();
          return;
        }
        
        const lastReviewDate = new Date(lastReview);
        const daysSinceReview = Math.floor((today - lastReviewDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceReview >= 7) {
          generateWeeklyReview();
        }
      }
    };
    
    checkReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const generateWeeklyReview = () => {
    const today = new Date();
    const weekStart = new Date(today);
    const day = weekStart.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    weekStart.setDate(weekStart.getDate() + diff);
    
    let totalPossible = 0;
    let totalCompleted = 0;
    const habitStats = [];
    
    data.habits.forEach(habit => {
      if (habit.frequency === 'daily') {
        let completed = 0;
        for (let i = 0; i < 7; i++) {
          const d = new Date(weekStart);
          d.setDate(d.getDate() + i);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (data.completions[dateStr]?.includes(habit.id)) {
            completed++;
          }
        }
        totalPossible += 7;
        totalCompleted += completed;
        habitStats.push({
          name: habit.name,
          completed,
          total: 7,
          percentage: Math.round((completed / 7) * 100)
        });
      }
    });
    
    setWeeklyReviewData({
      totalCompleted,
      totalPossible,
      percentage: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
      habitStats
    });
    
    setShowWeeklyReview(true);
  };

  const dismissWeeklyReview = () => {
    localStorage.setItem('lastWeeklyReview', new Date().toISOString());
    setShowWeeklyReview(false);
  };

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getYesterdayString = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDailyQuote = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    return ATOMIC_QUOTES[dayOfYear % ATOMIC_QUOTES.length];
  };

  const getCueText = (habit) => {
    // Show identity (most important for Atomic Habits)
    if (habit.identity?.trim()) return `💭 ${habit.identity.trim()}`;
    return null;
  };

  const getImplementationIntention = (habit) => {
    // Show time + location as Implementation Intention
    if (habit.time && habit.location) return `📍 ${habit.time} · ${habit.location}`;
    if (habit.time) return `⏰ ${habit.time}`;
    if (habit.location) return `📍 ${habit.location}`;
    return null;
  };

  const getHabitDisplayName = (habit, stackedHabit) => {
    // Format: [Trigger] → [Habit Name]
    // More innovative and attractive display
    
    let trigger = '';
    let triggerIcon = '';
    
    // Priority 1: Stack relationship
    if (stackedHabit) {
      trigger = `After ${stackedHabit.name}`;
      triggerIcon = '🔗';
    }
    // Priority 2: Custom trigger
    else if (habit.customTrigger?.trim()) {
      trigger = habit.customTrigger.trim();
      triggerIcon = '⚡';
    }
    // Priority 3: Time
    else if (habit.time) {
      trigger = `${habit.time}`;
      triggerIcon = '⏰';
    }
    // Priority 4: Location
    else if (habit.location) {
      trigger = habit.location;
      triggerIcon = '📍';
    }
    
    // Return formatted name with trigger in a compact, attractive way
    if (trigger) {
      return (
        <div className="habit-name-container">
          <div className="habit-trigger-badge">
            <span className="trigger-icon">{triggerIcon}</span>
            <span className="trigger-text">{trigger}</span>
          </div>
          <div className="habit-action-text">{habit.name}</div>
        </div>
      );
    }
    
    // No trigger, just return habit name
    return <div className="habit-action-text">{habit.name}</div>;
  };

  const getStackCue = (habit, stackedHabit) => {
    // Show stack relationship if available
    if (stackedHabit) return `🔗 After: ${stackedHabit.name}`;
    // Otherwise show custom trigger
    if (habit.customTrigger?.trim()) return `⚡ ${habit.customTrigger.trim()}`;
    return null;
  };

  const isCompletedToday = (habitId) => {
    const habit = data.habits.find(h => h.id === habitId);
    if (!habit) return false;

    // For daily habits, check viewDate
    if (habit.frequency === 'daily') {
      return data.completions[viewDateStr]?.includes(habitId) || false;
    }

    // For weekly habits, check if completed anywhere in viewDate's week
    if (habit.frequency === 'weekly') {
      const monday = new Date(viewDate);
      const day = monday.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      monday.setDate(monday.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      for (let d = new Date(monday); d <= viewDate; d.setDate(d.getDate() + 1)) {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        if (data.completions[dateStr]?.includes(habitId)) return true;
      }
      return false;
    }

    // For monthly habits, check if completed anywhere in viewDate's month
    if (habit.frequency === 'monthly') {
      const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
      for (let d = new Date(firstDay); d <= viewDate; d.setDate(d.getDate() + 1)) {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        if (data.completions[dateStr]?.includes(habitId)) return true;
      }
      return false;
    }

    return false;
  };

  const isDueToday = (habit) => {
    // All habits should show in Today view regardless of completion status
    // The completion status is handled by isCompletedToday() for visual state
    
    // If no frequency is set, default to daily
    if (!habit.frequency) return true;
    
    if (habit.frequency === 'daily') return true;
    if (habit.frequency === 'weekly') return true;
    if (habit.frequency === 'monthly') return true;
    
    // Fallback: show any habit with unknown frequency
    return true;
  };

  const parseTime = (timeStr) => {
    if (!timeStr) return 9999; // No time = end of list
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const sortHabitsForToday = (habits) => {
    // Build dependency map
    const habitMap = {};
    habits.forEach(h => habitMap[h.id] = h);
    
    // Separate stacked and non-stacked habits
    const stacked = habits.filter(h => h.stackAfter);
    const nonStacked = habits.filter(h => !h.stackAfter);
    
    // Sort non-stacked by time, then difficulty
    const sortedNonStacked = nonStacked.sort((a, b) => {
      const timeA = parseTime(a.time);
      const timeB = parseTime(b.time);
      
      if (timeA !== timeB) return timeA - timeB;
      
      const diffOrder = { easy: 1, medium: 2, hard: 3 };
      return diffOrder[a.difficulty] - diffOrder[b.difficulty];
    });
    
    // Recursive function to find all habits stacked after a given habit
    const findStackedChildren = (parentId, visited = new Set()) => {
      // Prevent infinite loops
      if (visited.has(parentId)) return [];
      visited.add(parentId);
      
      const children = stacked.filter(h => h.stackAfter === parentId);
      const result = [];
      
      children.forEach(child => {
        result.push(child);
        // Recursively find habits stacked after this child
        const grandchildren = findStackedChildren(child.id, visited);
        result.push(...grandchildren);
      });
      
      return result;
    };
    
    // Insert stacked habits after their parents (supports multi-level stacking)
    const result = [];
    const processedStacked = new Set();
    
    sortedNonStacked.forEach(habit => {
      result.push(habit);
      // Find all habits stacked after this one (recursively)
      const children = findStackedChildren(habit.id);
      children.forEach(child => {
        if (!processedStacked.has(child.id)) {
          result.push(child);
          processedStacked.add(child.id);
        }
      });
    });
    
    // Add any orphaned stacked habits (stacked after non-existent parents)
    stacked.forEach(h => {
      if (!processedStacked.has(h.id)) {
        result.push(h);
      }
    });
    
    return result;
  };

  const getStreak = (habitId) => {
    const habit = data.habits.find(h => h.id === habitId);
    if (!habit || !habit.createdAt) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse the createdAt date string (format: YYYY-MM-DD)
    const [year, month, day] = habit.createdAt.split('-').map(Number);
    const createdDate = new Date(year, month - 1, day); // month is 0-indexed
    createdDate.setHours(0, 0, 0, 0);
    
    // Calculate total days since creation
    const diffTime = today - createdDate;
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include creation day
    
    let consecutiveStreak = 0;
    
    if (habit.frequency === 'daily') {
      // Check each day from creation date to today
      for (let i = 0; i < totalDays; i++) {
        const checkDate = new Date(createdDate);
        checkDate.setDate(checkDate.getDate() + i);
        const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        
        if (data.completions[dateStr]?.includes(habitId)) {
          consecutiveStreak++;
        } else {
          // Reset streak if a day is missed
          consecutiveStreak = 0;
        }
      }
    } else if (habit.frequency === 'weekly') {
      // Calculate weeks since creation
      const weeksSinceCreation = Math.ceil(totalDays / 7);
      
      for (let weekIndex = 0; weekIndex < weeksSinceCreation; weekIndex++) {
        const weekStartDate = new Date(createdDate);
        weekStartDate.setDate(weekStartDate.getDate() + (weekIndex * 7));
        
        let foundInWeek = false;
        
        // Check 7 days in this week (or until today)
        for (let dayInWeek = 0; dayInWeek < 7; dayInWeek++) {
          const checkDate = new Date(weekStartDate);
          checkDate.setDate(checkDate.getDate() + dayInWeek);
          
          // Don't check beyond today
          if (checkDate > today) break;
          
          const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
          
          if (data.completions[dateStr]?.includes(habitId)) {
            foundInWeek = true;
            break;
          }
        }
        
        if (foundInWeek) {
          consecutiveStreak++;
        } else {
          // Reset streak if a week is missed
          consecutiveStreak = 0;
        }
      }
    } else if (habit.frequency === 'monthly') {
      // Calculate months since creation
      const monthsSinceCreation = (today.getFullYear() - createdDate.getFullYear()) * 12 + 
                                   (today.getMonth() - createdDate.getMonth()) + 1;
      
      for (let monthIndex = 0; monthIndex < monthsSinceCreation; monthIndex++) {
        const checkMonth = new Date(createdDate.getFullYear(), createdDate.getMonth() + monthIndex, 1);
        const monthStart = new Date(Math.max(checkMonth.getTime(), createdDate.getTime()));
        const monthEnd = new Date(checkMonth.getFullYear(), checkMonth.getMonth() + 1, 0);
        const actualMonthEnd = new Date(Math.min(monthEnd.getTime(), today.getTime()));
        
        let foundInMonth = false;
        
        for (let d = new Date(monthStart); d <= actualMonthEnd; d.setDate(d.getDate() + 1)) {
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          
          if (data.completions[dateStr]?.includes(habitId)) {
            foundInMonth = true;
            break;
          }
        }
        
        if (foundInMonth) {
          consecutiveStreak++;
        } else {
          // Reset streak if a month is missed
          consecutiveStreak = 0;
        }
      }
    }
    
    return consecutiveStreak;
  };

  const missedYesterday = (habitId) => {
    const habit = data.habits.find(h => h.id === habitId);
    if (!habit || habit.frequency !== 'daily') return false;
    
    const yesterday = getYesterdayString();
    return !data.completions[yesterday]?.includes(habitId);
  };

  const toggleHabit = async (habitId) => {
    const habit = data.habits.find(h => h.id === habitId);
    if (!habit) return;

    const newCompletions = { ...data.completions };
    const isCurrentlyCompleted = isCompletedToday(habitId);

    if (isCurrentlyCompleted) {
      // Uncompleting - remove from completions
      if (habit.frequency === 'daily') {
        if (newCompletions[viewDateStr]) {
          newCompletions[viewDateStr] = newCompletions[viewDateStr].filter(id => id !== habitId);
        }
      } else if (habit.frequency === 'weekly') {
        const monday = new Date(viewDate);
        const day = monday.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        monday.setDate(monday.getDate() + diff);
        monday.setHours(0, 0, 0, 0);
        for (let d = new Date(monday); d <= viewDate; d.setDate(d.getDate() + 1)) {
          const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          if (newCompletions[dateStr]) newCompletions[dateStr] = newCompletions[dateStr].filter(id => id !== habitId);
        }
      } else if (habit.frequency === 'monthly') {
        const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        for (let d = new Date(firstDay); d <= viewDate; d.setDate(d.getDate() + 1)) {
          const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          if (newCompletions[dateStr]) newCompletions[dateStr] = newCompletions[dateStr].filter(id => id !== habitId);
        }
      }
      setLastCompletedHabit(null);
    } else {
      // Completing - add to completions
      if (!newCompletions[viewDateStr]) newCompletions[viewDateStr] = [];
      newCompletions[viewDateStr].push(habitId);
      
      // Store for undo
      setLastCompletedHabit({ habitId, date: viewDateStr });
      
      // Track completion time
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setCompletionTimes(prev => ({
        ...prev,
        [`${habitId}-${viewDateStr}`]: timeStr
      }));
      
      // Check for milestone
      const newStreak = getStreak(habitId) + 1;
      if ([7, 30, 50, 100, 365].includes(newStreak)) {
        setMilestoneData({
          habitName: habit.name,
          streak: newStreak,
          emoji: newStreak === 7 ? '🎯' : newStreak === 30 ? '🔥' : newStreak === 50 ? '⭐' : newStreak === 100 ? '💎' : '👑'
        });
        setShowMilestone(true);
        setTimeout(() => setShowMilestone(false), 4000);
      }
    }

    const newData = { ...data, completions: newCompletions };
    setData(newData);
    await habitService.saveHabits(newData);
  };

  const undoLastCompletion = async () => {
    if (!lastCompletedHabit) return;
    
    const newCompletions = { ...data.completions };
    if (newCompletions[lastCompletedHabit.date]) {
      newCompletions[lastCompletedHabit.date] = newCompletions[lastCompletedHabit.date].filter(
        id => id !== lastCompletedHabit.habitId
      );
    }
    
    const newData = { ...data, completions: newCompletions };
    setData(newData);
    await habitService.saveHabits(newData);
    setLastCompletedHabit(null);
  };

  const handleTouchStart = (e, habitId) => {
    touchStartX.current = e.touches[0].clientX;
    if (swipedHabitId && swipedHabitId !== habitId) setSwipedHabitId(null);
  };

  const handleTouchEnd = (e, habitId) => {
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 50) {
      toggleHabit(habitId);
      setSwipedHabitId(null);
    }
    touchStartX.current = null;
  };

  const exportData = (format) => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (format === 'json') {
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `atomic-streaks-${timestamp}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      let csv = 'Habit Name,Identity,Frequency,Difficulty,Current Streak,Total Completions\n';
      data.habits.forEach(habit => {
        const streak = getStreak(habit.id);
        const totalCompletions = Object.values(data.completions).flat().filter(id => id === habit.id).length;
        csv += `"${habit.name}","${habit.identity}","${habit.frequency}","${habit.difficulty}",${streak},${totalCompletions}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `atomic-streaks-${timestamp}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'text') {
      let text = `Atomic Streaks Report - ${timestamp}\n\n`;
      text += `Total Habits: ${data.habits.length}\n`;
      text += `Best Streak: ${Math.max(...data.habits.map(h => getStreak(h.id)), 0)} days\n\n`;
      text += `=== HABITS ===\n\n`;
      data.habits.forEach(habit => {
        const streak = getStreak(habit.id);
        const totalCompletions = Object.values(data.completions).flat().filter(id => id === habit.id).length;
        text += `${habit.name}\n`;
        text += `  Identity: ${habit.identity}\n`;
        text += `  Frequency: ${habit.frequency}\n`;
        text += `  Current Streak: ${streak} days\n`;
        text += `  Total Completions: ${totalCompletions}\n\n`;
      });
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `atomic-streaks-${timestamp}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    }
    
    setShowExportModal(false);
  };

  const addFromTemplate = async (template) => {
    const newHabit = {
      id: `h_${Date.now()}`,
      name: template.name,
      identity: template.identity,
      time: template.time,
      location: template.location,
      reward: '',
      stackAfter: '',
      customTrigger: '',
      frequency: 'daily',
      habitType: 'positive',
      difficulty: template.difficulty,
      createdAt: getTodayString()
    };
    
    const newData = {
      ...data,
      habits: [...data.habits, newHabit]
    };
    
    setData(newData);
    await habitService.saveHabits(newData);
    setShowTemplateModal(false);
  };

  const addHabit = async () => {
    // Validate name
    if (!formName.trim()) {
      setNameError(true);
      setTimeout(() => setNameError(false), 500);
      return;
    }
    
    // Validate identity (mandatory for Atomic Habits)
    if (!formIdentity.trim()) {
      setIdentityError(true);
      setTimeout(() => setIdentityError(false), 500);
      return;
    }
    
    // 2-Minute Rule enforcement
    if (formDifficulty !== 'easy') {
      setTwoMinuteWarning(true);
      return;
    }
    
    const finalLocation = formLocation === 'custom' ? formCustomLocation.trim() : formLocation;
    
    const newHabit = {
      id: `h_${Date.now()}`,
      name: formName.trim(),
      identity: formIdentity.trim(),
      identityIcon: formIdentityIcon,
      time: formTime.trim(),
      location: finalLocation,
      reward: formReward.trim(),
      customTrigger: formCustomTrigger.trim(),
      frequency: formFrequency,
      habitType: 'positive',
      difficulty: formDifficulty,
      createdAt: getTodayString()
    };
    
    const newData = {
      ...data,
      habits: [...data.habits, newHabit]
    };
    
    setData(newData);
    await habitService.saveHabits(newData);
    
    // Reset form
    setFormName('');
    setFormTime('');
    setFormLocation('');
    setFormCustomLocation('');
    setFormIdentity('');
    setFormIdentityIcon('💭');
    setFormReward('');
    setFormFrequency('daily');
    setFormDifficulty('easy');
    setFormCustomTrigger('');
    setShowAddModal(false);
  };

  const overrideTwoMinuteRule = async () => {
    setTwoMinuteWarning(false);
    
    const finalLocation = formLocation === 'custom' ? formCustomLocation.trim() : formLocation;
    
    const newHabit = {
      id: `h_${Date.now()}`,
      name: formName.trim(),
      identity: formIdentity.trim(),
      identityIcon: formIdentityIcon,
      time: formTime.trim(),
      location: finalLocation,
      reward: formReward.trim(),
      customTrigger: formCustomTrigger.trim(),
      frequency: formFrequency,
      habitType: 'positive',
      difficulty: formDifficulty,
      createdAt: getTodayString()
    };
    
    const newData = {
      ...data,
      habits: [...data.habits, newHabit]
    };
    
    setData(newData);
    await habitService.saveHabits(newData);
    
    // Reset form
    setFormName('');
    setFormTime('');
    setFormLocation('');
    setFormCustomLocation('');
    setFormIdentity('');
    setFormIdentityIcon('💭');
    setFormReward('');
    setFormFrequency('daily');
    setFormDifficulty('easy');
    setFormCustomTrigger('');
    setShowAddModal(false);
  };

  const openEditModal = (habit) => {
    setEditingHabit(habit);
    setEditName(habit.name);
    setEditTime(habit.time);
    setEditLocation(habit.location);
    setEditIdentity(habit.identity);
    setEditReward(habit.reward);
    setEditFrequency(habit.frequency);
    setEditType(habit.habitType);
    setEditDifficulty(habit.difficulty);
    setEditCustomTrigger(habit.customTrigger || '');
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (!editName.trim()) {
      setNameError(true);
      setTimeout(() => setNameError(false), 500);
      return;
    }
    
    const updatedHabits = data.habits.map(h => 
      h.id === editingHabit.id
        ? {
            ...h,
            name: editName.trim(),
            time: editTime.trim(),
            location: editLocation.trim(),
            identity: editIdentity.trim(),
            reward: editReward.trim(),
            frequency: editFrequency,
            habitType: editType,
            difficulty: editDifficulty,
            customTrigger: editCustomTrigger.trim()
          }
        : h
    );
    
    const newData = { ...data, habits: updatedHabits };
    setData(newData);
    await habitService.saveHabits(newData);
    setShowEditModal(false);
  };

  const startInlineEdit = (habit) => {
    setEditingInlineId(habit.id);
    setEditName(habit.name);
    setEditTime(habit.time || '');
    setEditLocation(habit.location || '');
    setEditIdentity(habit.identity || '');
    setEditIdentityIcon(habit.identityIcon || '💭');
    setEditReward(habit.reward || '');
    setEditFrequency(habit.frequency);
    setEditDifficulty(habit.difficulty);
    setEditCustomTrigger(habit.customTrigger || '');
  };

  const saveInlineEdit = async (habitId) => {
    if (!editName.trim()) {
      setNameError(true);
      setTimeout(() => setNameError(false), 500);
      return;
    }

    const updatedHabits = data.habits.map(h => 
      h.id === habitId
        ? {
            ...h,
            name: editName.trim(),
            time: editTime.trim(),
            location: editLocation.trim(),
            identity: editIdentity.trim(),
            identityIcon: editIdentityIcon,
            reward: editReward.trim(),
            frequency: editFrequency,
            difficulty: editDifficulty,
            customTrigger: editCustomTrigger.trim()
          }
        : h
    );
    
    const newData = { ...data, habits: updatedHabits };
    setData(newData);
    await habitService.saveHabits(newData);
    setEditingInlineId(null);
  };

  const cancelInlineEdit = () => {
    setEditingInlineId(null);
    setEditName('');
    setEditTime('');
    setEditLocation('');
    setEditIdentity('');
    setEditIdentityIcon('💭');
    setEditReward('');
    setEditFrequency('daily');
    setEditDifficulty('easy');
    setEditCustomTrigger('');
  };

  const openDeleteModal = (habit) => {
    setDeletingHabit(habit);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const updatedHabits = data.habits.filter(h => h.id !== deletingHabit.id);
    
    // Remove from all completions
    const updatedCompletions = {};
    Object.keys(data.completions).forEach(date => {
      updatedCompletions[date] = data.completions[date].filter(id => id !== deletingHabit.id);
    });
    
    const newData = { habits: updatedHabits, completions: updatedCompletions };
    setData(newData);
    await habitService.saveHabits(newData);
    setShowDeleteModal(false);
  };

  if (loading) {
    return <div className="habit-loading">Loading habits...</div>;
  }

  const todayHabits = sortHabitsForToday(data.habits);
  
  // Separate incomplete and completed habits
  const incompleteHabits = todayHabits.filter(h => !isCompletedToday(h.id));
  const completedHabits = todayHabits.filter(h => isCompletedToday(h.id));

  const completedToday = completedHabits.length;
  const totalToday = todayHabits.length;
  const allDone = totalToday > 0 && completedToday === totalToday;
  const progressPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const quote = getDailyQuote();

  return (
    <div className="habit-tracker">

      {/* ── HEADER ── */}
      <div className="habit-header">
        <div className="habit-brand">Atomic Streaks</div>

        {/* Date navigation with divider */}
        <div className="habit-date-nav">
          <button className="habit-date-arrow" onClick={goBack} aria-label={viewMode === 'week' ? 'Previous week' : 'Previous day'}>‹</button>
          <div className="habit-date-center">
            <span className="habit-date-label">
              {viewMode === 'week' ? (() => {
                const startOfWeek = new Date(viewDate);
                const day = startOfWeek.getDay();
                const diff = day === 0 ? -6 : 1 - day;
                startOfWeek.setDate(startOfWeek.getDate() + diff);
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(endOfWeek.getDate() + 6);
                
                return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
              })() : (
                isViewingToday
                  ? new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                  : viewDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
              )}
            </span>
            {!isViewingToday && (
              <button className="habit-today-chip" onClick={goToday}>Today</button>
            )}
          </div>
          <button
            className="habit-date-arrow"
            onClick={goForward}
            disabled={isViewingToday}
            aria-label={viewMode === 'week' ? 'Next week' : 'Next day'}
          >›</button>
        </div>

        {/* Metrics — inline below divider */}
        <div className="habit-metrics">
          <div className="habit-metric">
            <span className="habit-metric-value">{completedToday}/{totalToday}</span>
            <span className="habit-metric-label">Done</span>
          </div>
          <div className="habit-metric-div" />
          <div className="habit-metric">
            <span className="habit-metric-value">{progressPercent}%</span>
            <span className="habit-metric-label">Rate</span>
          </div>
          <div className="habit-metric-div" />
          <div className="habit-metric">
            <span className="habit-metric-value">
              {data.habits.length > 0 ? Math.max(...data.habits.map(h => getStreak(h.id)), 0) : 0}🔥
            </span>
            <span className="habit-metric-label">Best</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="habit-progress-bar-wrap">
          <div className="habit-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="habit-tabs">
        <button
          className={`habit-tab ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >Today</button>
        <button
          className={`habit-tab ${activeTab === 'habits' ? 'active' : ''}`}
          onClick={() => setActiveTab('habits')}
        >Habits</button>
        <button
          className={`habit-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >Stats</button>
        <button
          className={`habit-tab ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >🏆</button>
      </div>

      {activeTab === 'today' && (
        <>
          <div className="view-mode-tabs">
            <button
              className={`view-mode-tab ${viewMode === 'day' ? 'active' : ''}`}
              onClick={() => setViewMode('day')}
            >
              Day View
            </button>
            <button
              className={`view-mode-tab ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Week View
            </button>
          </div>

          {viewMode === 'day' ? (
            <div className="habit-content">

          {/* Daily Quote */}
          <div className="daily-quote">
            <div className="quote-text">"{quote.text}"</div>
            <div className="quote-source">— {quote.law}</div>
          </div>

          {allDone && totalToday > 0 && (
            <div className="celebration-banner">
              <span className="celebration-emoji">🎉</span>
              <div className="celebration-text">
                <div className="celebration-title">Perfect day!</div>
                <div className="celebration-subtitle">All {totalToday} habits done.</div>
              </div>
            </div>
          )}

          {/* Undo button */}
          {lastCompletedHabit && (
            <div className="undo-banner">
              <span>Habit completed</span>
              <button className="undo-btn" onClick={undoLastCompletion}>
                ↶ Undo
              </button>
            </div>
          )}

          <div className="habit-list">
            {incompleteHabits.map(habit => {
              const completed = isCompletedToday(habit.id);
              const streak = getStreak(habit.id);
              const missed = missedYesterday(habit.id);
              const isEditing = editingInlineId === habit.id;
              
              return (
                <div
                  key={habit.id}
                  className={`habit-card ${completed ? 'completed' : ''} ${isEditing ? 'editing' : ''}`}
                  role="button"
                  tabIndex={0}
                >
                  {/* Header: Identity + Streak */}
                  {!isEditing && habit.identity?.trim() && (
                    <div className="habit-card-header">
                      <div className="habit-identity-header">
                        <span>{habit.identityIcon || '💭'}</span>
                        <span>{habit.identity.trim()}</span>
                      </div>
                      <div className={`habit-streak-pill ${
                        streak >= 100 ? 'streak-legendary' : 
                        streak >= 50 ? 'streak-epic' : 
                        streak >= 30 ? 'streak-great' : 
                        streak >= 7 ? 'streak-good' : 
                        'streak-normal'
                      }`}>
                        {streak >= 100 ? '👑' : streak >= 50 ? '💎' : streak >= 30 ? '⭐' : '🔥'} {streak}{habit.frequency === 'daily' ? 'd' : habit.frequency === 'weekly' ? 'w' : 'm'}
                      </div>
                    </div>
                  )}

                  {isEditing ? (
                    /* Inline Edit Mode */
                    <div className="habit-inline-edit">
                      <div className="inline-edit-section">
                        <label className="inline-edit-label">Identity</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                          <button
                            type="button"
                            className="identity-icon-btn-inline"
                            onClick={() => setShowEditIdentityIconPicker(!showEditIdentityIconPicker)}
                            style={{
                              fontSize: '20px',
                              padding: '8px 10px',
                              border: '2px solid #c7d2fe',
                              borderRadius: '8px',
                              background: '#eef2ff',
                              cursor: 'pointer',
                              flexShrink: 0,
                              minWidth: '44px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {editIdentityIcon}
                          </button>
                          <input
                            type="text"
                            className="inline-edit-input"
                            placeholder="I am a person who..."
                            value={editIdentity}
                            onChange={(e) => setEditIdentity(e.target.value)}
                            style={{ flex: 1 }}
                          />
                        </div>
                        {showEditIdentityIconPicker && (
                          <div className="identity-icon-picker-inline" style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(6, 1fr)', 
                            gap: '6px', 
                            marginTop: '8px',
                            padding: '8px',
                            background: 'white',
                            borderRadius: '8px',
                            border: '2px solid #e2e8f0'
                          }}>
                            {IDENTITY_ICONS.map(icon => (
                              <button
                                key={icon}
                                type="button"
                                onClick={() => {
                                  setEditIdentityIcon(icon);
                                  setShowEditIdentityIconPicker(false);
                                  setShowEditCustomIconInput(false);
                                }}
                                style={{
                                  fontSize: '20px',
                                  padding: '6px',
                                  border: editIdentityIcon === icon ? '2px solid #6366f1' : '2px solid #e2e8f0',
                                  borderRadius: '6px',
                                  background: editIdentityIcon === icon ? '#eef2ff' : 'white',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                {icon}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setShowEditCustomIconInput(!showEditCustomIconInput)}
                              style={{
                                fontSize: '12px',
                                padding: '6px',
                                border: '2px solid #6366f1',
                                borderRadius: '6px',
                                background: '#eef2ff',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontWeight: 700,
                                color: '#6366f1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Add custom emoji"
                            >
                              ➕
                            </button>
                          </div>
                        )}
                        {showEditCustomIconInput && (
                          <div style={{ marginTop: '8px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <input
                                type="text"
                                placeholder="Paste emoji..."
                                value={editCustomIconInput}
                                onChange={(e) => setEditCustomIconInput(e.target.value)}
                                maxLength={2}
                                style={{
                                  flex: 1,
                                  padding: '8px 10px',
                                  border: '2px solid #c7d2fe',
                                  borderRadius: '6px',
                                  fontSize: '14px',
                                  textAlign: 'center'
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (editCustomIconInput.trim()) {
                                    setEditIdentityIcon(editCustomIconInput.trim());
                                    setEditCustomIconInput('');
                                    setShowEditCustomIconInput(false);
                                    setShowEditIdentityIconPicker(false);
                                  }
                                }}
                                style={{
                                  padding: '8px 12px',
                                  border: 'none',
                                  borderRadius: '6px',
                                  background: '#6366f1',
                                  color: 'white',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                Use
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="inline-edit-section">
                        <label className="inline-edit-label">Habit Name</label>
                        <input
                          type="text"
                          className="inline-edit-input"
                          placeholder="Habit name"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </div>

                      <div className="inline-edit-row">
                        <div className="inline-edit-section">
                          <label className="inline-edit-label">Time</label>
                          <input
                            type="time"
                            className="inline-edit-input"
                            value={editTime}
                            onChange={(e) => setEditTime(e.target.value)}
                          />
                        </div>
                        <div className="inline-edit-section">
                          <label className="inline-edit-label">Location</label>
                          <input
                            type="text"
                            className="inline-edit-input"
                            placeholder="Location"
                            value={editLocation}
                            onChange={(e) => setEditLocation(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="inline-edit-section">
                        <label className="inline-edit-label">Custom Trigger</label>
                        <input
                          type="text"
                          className="inline-edit-input"
                          placeholder="e.g. After I wake up, When I feel stressed..."
                          value={editCustomTrigger}
                          onChange={(e) => setEditCustomTrigger(e.target.value)}
                        />
                      </div>

                      <div className="inline-edit-row">
                        <div className="inline-edit-section">
                          <label className="inline-edit-label">Difficulty</label>
                          <select
                            className="inline-edit-input"
                            value={editDifficulty}
                            onChange={(e) => setEditDifficulty(e.target.value)}
                          >
                            <option value="easy">~2 min</option>
                            <option value="medium">~10 min</option>
                            <option value="hard">30+ min</option>
                          </select>
                        </div>
                        <div className="inline-edit-section">
                          <label className="inline-edit-label">Frequency</label>
                          <select
                            className="inline-edit-input"
                            value={editFrequency}
                            onChange={(e) => setEditFrequency(e.target.value)}
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                      </div>

                      <div className="inline-edit-actions">
                        <button 
                          className="inline-edit-cancel"
                          onClick={cancelInlineEdit}
                        >
                          Cancel
                        </button>
                        <button 
                          className="inline-edit-save"
                          onClick={() => saveInlineEdit(habit.id)}
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Body: Content only */}
                      <div className="habit-card-body">
                        <div 
                          className="habit-card-content"
                          onDoubleClick={() => startInlineEdit(habit)}
                          style={{ cursor: 'text' }}
                        >
                          {/* Trigger + Action in single row */}
                          <div className="habit-main-row">
                            {(() => {
                              let trigger = '';
                              let triggerIcon = '';
                              
                              if (habit.customTrigger?.trim()) {
                                trigger = habit.customTrigger.trim();
                                triggerIcon = '⚡';
                              } else if (habit.time) {
                                trigger = habit.time;
                                triggerIcon = '⏰';
                              } else if (habit.location) {
                                trigger = habit.location;
                                triggerIcon = '📍';
                              }
                              
                              return trigger ? (
                                <div className="habit-trigger-badge">
                                  <span>{triggerIcon}</span>
                                  <span>{trigger}</span>
                                </div>
                              ) : null;
                            })()}
                            
                            <div className="habit-action-text">{habit.name}</div>
                          </div>

                          {/* Implementation */}
                          {(() => {
                            const implIntention = getImplementationIntention(habit);
                            return implIntention ? (
                              <div className="habit-implementation">{implIntention}</div>
                            ) : null;
                          })()}

                          {/* Alerts */}
                          {!completed && missed && (
                            <div className="habit-alert missed">
                              <span>⚠️</span>
                              <span>Don't miss twice!</span>
                            </div>
                          )}
                          {completed && habit.reward && (
                            <div className="habit-alert reward">
                              <span>🎉</span>
                              <span>{habit.reward}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer: Badges + Check */}
                      <div className="habit-card-footer">
                        <div className="habit-badges-row">
                          <div className="habit-badge habit-badge-frequency">
                            {habit.frequency === 'daily' ? 'DAILY' : habit.frequency === 'weekly' ? 'WEEKLY' : 'MONTHLY'}
                          </div>
                          <div className="habit-badge habit-badge-difficulty">
                            {habit.difficulty === 'easy' ? '~2M' : habit.difficulty === 'medium' ? '~10M' : '30M+'}
                          </div>
                        </div>
                        
                        <div 
                          className={`habit-check ${completed ? 'checked' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleHabit(habit.id);
                          }}
                          aria-label={`${completed ? 'Completed' : 'Not completed'}: ${habit.name}`}
                          style={{ cursor: 'pointer' }}
                        >
                          {completed && <span className="check-mark">✓</span>}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {completedHabits.length > 0 && (
              <>
                <div className="completed-divider">
                  <span className="completed-divider-text">Completed ({completedHabits.length})</span>
                </div>
                {completedHabits.map(habit => {
                  const completed = isCompletedToday(habit.id);
                  const streak = getStreak(habit.id);
                  const missed = missedYesterday(habit.id);
                  const isEditing = editingInlineId === habit.id;
                  
                  return (
                    <div
                      key={habit.id}
                      className={`habit-card ${completed ? 'completed' : ''} ${isEditing ? 'editing' : ''}`}
                      role="button"
                      tabIndex={0}
                    >
                      {/* Header: Identity + Streak */}
                      {!isEditing && habit.identity?.trim() && (
                        <div className="habit-card-header">
                          <div className="habit-identity-header">
                            <span>{habit.identityIcon || '💭'}</span>
                            <span>{habit.identity.trim()}</span>
                          </div>
                          <div className={`habit-streak-pill ${
                            streak >= 100 ? 'streak-legendary' : 
                            streak >= 50 ? 'streak-epic' : 
                            streak >= 30 ? 'streak-great' : 
                            streak >= 7 ? 'streak-good' : 
                            'streak-normal'
                          }`}>
                            {streak >= 100 ? '👑' : streak >= 50 ? '💎' : streak >= 30 ? '⭐' : '🔥'} {streak}{habit.frequency === 'daily' ? 'd' : habit.frequency === 'weekly' ? 'w' : 'm'}
                          </div>
                        </div>
                      )}

                      {isEditing ? (
                        /* Inline Edit Mode */
                        <div className="habit-inline-edit" style={{ flex: 1 }}>
                          <div className="inline-edit-section">
                            <label className="inline-edit-label">Identity</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                              <button
                                type="button"
                                className="identity-icon-btn-inline"
                                onClick={() => setShowEditIdentityIconPicker(!showEditIdentityIconPicker)}
                                style={{
                                  fontSize: '20px',
                                  padding: '8px 10px',
                                  border: '2px solid #c7d2fe',
                                  borderRadius: '8px',
                                  background: '#eef2ff',
                                  cursor: 'pointer',
                                  flexShrink: 0,
                                  minWidth: '44px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                {editIdentityIcon}
                              </button>
                              <input
                                type="text"
                                className="inline-edit-input"
                                placeholder="I am a person who..."
                                value={editIdentity}
                                onChange={(e) => setEditIdentity(e.target.value)}
                                style={{ flex: 1 }}
                              />
                            </div>
                            {showEditIdentityIconPicker && (
                              <div className="identity-icon-picker-inline" style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(6, 1fr)', 
                                gap: '6px', 
                                marginTop: '8px',
                                padding: '8px',
                                background: 'white',
                                borderRadius: '8px',
                                border: '2px solid #e2e8f0'
                              }}>
                                {IDENTITY_ICONS.map(icon => (
                                  <button
                                    key={icon}
                                    type="button"
                                    onClick={() => {
                                      setEditIdentityIcon(icon);
                                      setShowEditIdentityIconPicker(false);
                                      setShowEditCustomIconInput(false);
                                    }}
                                    style={{
                                      fontSize: '20px',
                                      padding: '6px',
                                      border: editIdentityIcon === icon ? '2px solid #6366f1' : '2px solid #e2e8f0',
                                      borderRadius: '6px',
                                      background: editIdentityIcon === icon ? '#eef2ff' : 'white',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease'
                                    }}
                                  >
                                    {icon}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => setShowEditCustomIconInput(!showEditCustomIconInput)}
                                  style={{
                                    fontSize: '12px',
                                    padding: '6px',
                                    border: '2px solid #6366f1',
                                    borderRadius: '6px',
                                    background: '#eef2ff',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    fontWeight: 700,
                                    color: '#6366f1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  title="Add custom emoji"
                                >
                                  ➕
                                </button>
                              </div>
                            )}
                            {showEditCustomIconInput && (
                              <div style={{ marginTop: '8px' }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <input
                                    type="text"
                                    placeholder="Paste emoji..."
                                    value={editCustomIconInput}
                                    onChange={(e) => setEditCustomIconInput(e.target.value)}
                                    maxLength={2}
                                    style={{
                                      flex: 1,
                                      padding: '8px 10px',
                                      border: '2px solid #c7d2fe',
                                      borderRadius: '6px',
                                      fontSize: '14px',
                                      textAlign: 'center'
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (editCustomIconInput.trim()) {
                                        setEditIdentityIcon(editCustomIconInput.trim());
                                        setEditCustomIconInput('');
                                        setShowEditCustomIconInput(false);
                                        setShowEditIdentityIconPicker(false);
                                      }
                                    }}
                                    style={{
                                      padding: '8px 12px',
                                      border: 'none',
                                      borderRadius: '6px',
                                      background: '#6366f1',
                                      color: 'white',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    Use
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="inline-edit-section">
                            <label className="inline-edit-label">Habit Name</label>
                            <input
                              type="text"
                              className="inline-edit-input"
                              placeholder="Habit name"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          </div>

                          <div className="inline-edit-row">
                            <div className="inline-edit-section">
                              <label className="inline-edit-label">Time</label>
                              <input
                                type="time"
                                className="inline-edit-input"
                                value={editTime}
                                onChange={(e) => setEditTime(e.target.value)}
                              />
                            </div>
                            <div className="inline-edit-section">
                              <label className="inline-edit-label">Location</label>
                              <input
                                type="text"
                                className="inline-edit-input"
                                placeholder="Location"
                                value={editLocation}
                                onChange={(e) => setEditLocation(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="inline-edit-section">
                            <label className="inline-edit-label">Custom Trigger</label>
                            <input
                              type="text"
                              className="inline-edit-input"
                              placeholder="e.g. After I wake up, When I feel stressed..."
                              value={editCustomTrigger}
                              onChange={(e) => setEditCustomTrigger(e.target.value)}
                            />
                          </div>

                          <div className="inline-edit-row">
                            <div className="inline-edit-section">
                              <label className="inline-edit-label">Difficulty</label>
                              <select
                                className="inline-edit-input"
                                value={editDifficulty}
                                onChange={(e) => setEditDifficulty(e.target.value)}
                              >
                                <option value="easy">~2 min</option>
                                <option value="medium">~10 min</option>
                                <option value="hard">30+ min</option>
                              </select>
                            </div>
                            <div className="inline-edit-section">
                              <label className="inline-edit-label">Frequency</label>
                              <select
                                className="inline-edit-input"
                                value={editFrequency}
                                onChange={(e) => setEditFrequency(e.target.value)}
                              >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                              </select>
                            </div>
                          </div>

                          <div className="inline-edit-actions">
                            <button 
                              className="inline-edit-cancel"
                              onClick={cancelInlineEdit}
                            >
                              Cancel
                            </button>
                            <button 
                              className="inline-edit-save"
                              onClick={() => saveInlineEdit(habit.id)}
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Body: Content only */}
                          <div className="habit-card-body">
                            <div 
                              className="habit-card-content"
                              onDoubleClick={() => startInlineEdit(habit)}
                              style={{ cursor: 'text' }}
                            >
                              {/* Trigger + Action in single row */}
                              <div className="habit-main-row">
                                {(() => {
                                  let trigger = '';
                                  let triggerIcon = '';
                                  
                                  if (habit.customTrigger?.trim()) {
                                    trigger = habit.customTrigger.trim();
                                    triggerIcon = '⚡';
                                  } else if (habit.time) {
                                    trigger = habit.time;
                                    triggerIcon = '⏰';
                                  } else if (habit.location) {
                                    trigger = habit.location;
                                    triggerIcon = '📍';
                                  }
                                  
                                  return trigger ? (
                                    <div className="habit-trigger-badge">
                                      <span>{triggerIcon}</span>
                                      <span>{trigger}</span>
                                    </div>
                                  ) : null;
                                })()}
                                
                                <div className="habit-action-text">{habit.name}</div>
                              </div>

                              {/* Implementation */}
                              {(() => {
                                const implIntention = getImplementationIntention(habit);
                                return implIntention ? (
                                  <div className="habit-implementation">{implIntention}</div>
                                ) : null;
                              })()}

                              {/* Alerts */}
                              {!completed && missed && (
                                <div className="habit-alert missed">
                                  <span>⚠️</span>
                                  <span>Don't miss twice!</span>
                                </div>
                              )}
                              {completed && habit.reward && (
                                <div className="habit-alert reward">
                                  <span>🎉</span>
                                  <span>{habit.reward}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Footer: Badges + Check */}
                          <div className="habit-card-footer">
                            <div className="habit-badges-row">
                              <div className="habit-badge habit-badge-frequency">
                                {habit.frequency === 'daily' ? 'DAILY' : habit.frequency === 'weekly' ? 'WEEKLY' : 'MONTHLY'}
                              </div>
                              <div className="habit-badge habit-badge-difficulty">
                                {habit.difficulty === 'easy' ? '~2M' : habit.difficulty === 'medium' ? '~10M' : '30M+'}
                              </div>
                            </div>
                            {completionTimes[`${habit.id}-${viewDateStr}`] && (
                              <div className="habit-badge habit-badge-time">
                                ✓ {completionTimes[`${habit.id}-${viewDateStr}`]}
                              </div>
                            )}
                            
                            <div 
                              className={`habit-check ${completed ? 'checked' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleHabit(habit.id);
                              }}
                              aria-label={`${completed ? 'Completed' : 'Not completed'}: ${habit.name}`}
                              style={{ cursor: 'pointer' }}
                            >
                              {completed && <span className="check-mark">✓</span>}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
          ) : (
            <div className="habit-content">
              <div className="week-view">
              {(() => {
                const weekDays = [];
                const today = new Date();
                const startOfWeek = new Date(viewDate);
                const day = startOfWeek.getDay();
                const diff = day === 0 ? -6 : 1 - day;
                startOfWeek.setDate(startOfWeek.getDate() + diff);
                
                for (let i = 0; i < 7; i++) {
                  const currentDay = new Date(startOfWeek);
                  currentDay.setDate(currentDay.getDate() + i);
                  const dateStr = `${currentDay.getFullYear()}-${String(currentDay.getMonth() + 1).padStart(2, '0')}-${String(currentDay.getDate()).padStart(2, '0')}`;
                  const isToday = currentDay.toDateString() === today.toDateString();
                  
                  const dailyHabits = data.habits.filter(h => h.frequency === 'daily');
                  const completedHabits = data.completions[dateStr]?.filter(id => 
                    dailyHabits.some(h => h.id === id)
                  ) || [];
                  
                  const completionRate = dailyHabits.length > 0 
                    ? Math.round((completedHabits.length / dailyHabits.length) * 100) 
                    : 0;
                  
                  weekDays.push(
                    <div key={i} className="week-day-card">
                      <div className="week-day-header">
                        <div className={`week-day-label ${isToday ? 'today' : ''}`}>
                          {currentDay.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="week-day-stats">
                          {completedHabits.length}/{dailyHabits.length}
                        </div>
                      </div>
                      <div className="week-day-progress">
                        <div 
                          className="week-day-progress-fill" 
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                      <div className="week-day-habits">
                        {dailyHabits.map(habit => {
                          const isCompleted = completedHabits.includes(habit.id);
                          return (
                            <div 
                              key={habit.id}
                              className={`week-habit-dot ${isCompleted ? 'completed' : ''}`}
                              title={habit.name}
                            >
                              {isCompleted ? '✓' : habit.name.charAt(0)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                
                return weekDays;
              })()}
              </div>
            </div>
          )}
        </>
      )}
      {activeTab === 'habits' && (
        <div className="habit-content">
          {data.habits.length === 0 ? (
            <div className="empty-habits" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-tertiary)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No habits yet</div>
              <div style={{ fontSize: 14 }}>Tap ＋ to add your first habit</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: 'var(--primary-bg)',
                    color: 'var(--primary)',
                    border: '2px solid var(--primary-light)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  📚 Templates
                </button>
                <button
                  onClick={() => setShowExportModal(true)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: 'var(--info-bg)',
                    color: 'var(--info-text)',
                    border: '2px solid var(--info-light)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  📤 Export
                </button>
              </div>
            <div className="manage-section">
              <div className="habit-manage-list">
                {data.habits.map(habit => (
                  <div key={habit.id} className="habit-manage-card">
                    <div className="habit-manage-header">
                      <span className={`habit-type-dot ${habit.habitType}`} />
                      <span className="habit-manage-name">{habit.name}</span>
                      <span className="habit-badge">{habit.frequency === 'daily' ? 'Daily' : habit.frequency === 'weekly' ? 'Weekly' : 'Monthly'}</span>
                      <span className="habit-difficulty">{habit.difficulty === 'easy' ? '~2m' : habit.difficulty === 'medium' ? '~10m' : '30m+'}</span>
                    </div>
                    <div className="habit-manage-meta">
                      {habit.customTrigger?.trim()
                        ? `⚡ ${habit.customTrigger.trim()}`
                        : habit.stackAfter
                        ? `🔗 After: ${data.habits.find(h => h.id === habit.stackAfter)?.name || '—'}`
                        : (habit.time && habit.location)
                        ? `📍 ${habit.time} · ${habit.location}`
                        : ''
                      }
                      {' '}· 🔥 {getStreak(habit.id)}{habit.frequency === 'daily' ? 'd' : habit.frequency === 'weekly' ? 'w' : 'm'}
                    </div>
                    <div className="habit-manage-actions">
                      <button className="edit-btn" onClick={() => openEditModal(habit)}>✏️ Edit</button>
                      <button className="delete-btn" onClick={() => openDeleteModal(habit)}>🗑️ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </>
          )}
        </div>
      )}

      {/* ── FAB: Add Habit ── */}
      <button
        className="habit-fab"
        onClick={() => setShowAddModal(true)}
        aria-label="Add habit"
      >＋</button>

      {/* ── Add Habit Modal ── */}
      {showAddModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowAddModal(false)} />
          <div className="habit-modal add-habit-card-modal">
            <div className="modal-handle" />
            <h3>Create New Habit</h3>
            
            {/* Live Preview Card */}
            <div className="habit-preview-card">
              <div className="habit-card-header">
                <div className="habit-identity-header">
                  <span>{formIdentityIcon}</span>
                  <span>{formIdentity || 'Your identity...'}</span>
                </div>
                <div className="habit-streak-pill streak-normal">
                  🔥 0d
                </div>
              </div>
              
              <div className="habit-card-body">
                <div className="habit-check">
                  <span style={{ opacity: 0.3 }}>✓</span>
                </div>
                <div className="habit-card-content">
                  {(formCustomTrigger || formTime || formLocation) && (
                    <div className="habit-trigger-badge">
                      <span>{formCustomTrigger ? '⚡' : formTime ? '⏰' : '📍'}</span>
                      <span>{formCustomTrigger || formTime || formLocation || 'Trigger'}</span>
                    </div>
                  )}
                  <div className="habit-action-text">{formName || 'Your habit action...'}</div>
                  {(formTime || formLocation) && (
                    <div className="habit-implementation">
                      {formTime && `⏰ ${formTime}`} {formTime && formLocation && '·'} {formLocation && `📍 ${formLocation}`}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="habit-card-footer">
                <div className="habit-badges-row">
                  <div className="habit-badge habit-badge-frequency">
                    {formFrequency.toUpperCase()}
                  </div>
                  <div className="habit-badge habit-badge-difficulty">
                    {formDifficulty === 'easy' ? '~2M' : formDifficulty === 'medium' ? '~10M' : '30M+'}
                  </div>
                </div>
              </div>
            </div>

            {/* Card-based Input Form */}
            <div className="habit-card-form">
              
              {/* Identity Section */}
              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon">💭</span>
                  <span className="form-card-title">Identity</span>
                  <span className="form-card-required">*</span>
                </div>
                <div className="form-card-body">
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                    <button
                      type="button"
                      className="identity-icon-btn"
                      onClick={() => setShowIdentityIconPicker(!showIdentityIconPicker)}
                    >
                      {formIdentityIcon}
                    </button>
                    <input
                      type="text"
                      placeholder="I am a person who..."
                      value={formIdentity}
                      onChange={(e) => setFormIdentity(e.target.value)}
                      onFocus={(e) => {
                        if (!formIdentity) {
                          setFormIdentity('I am a person who ');
                          setTimeout(() => {
                            e.target.setSelectionRange(e.target.value.length, e.target.value.length);
                          }, 0);
                        }
                      }}
                      className={`form-card-input ${identityError ? 'error' : ''}`}
                    />
                  </div>
                  {showIdentityIconPicker && (
                    <div className="identity-icon-picker" style={{ marginTop: '12px' }}>
                      {IDENTITY_ICONS.map(icon => (
                        <button
                          key={icon}
                          type="button"
                          className="identity-icon-option"
                          onClick={() => {
                            setFormIdentityIcon(icon);
                            setShowIdentityIconPicker(false);
                            setShowCustomIconInput(false);
                          }}
                        >
                          {icon}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="identity-icon-option custom-icon-btn"
                        onClick={() => setShowCustomIconInput(!showCustomIconInput)}
                        title="Add custom emoji"
                      >
                        ➕
                      </button>
                    </div>
                  )}
                  {showCustomIconInput && (
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Paste emoji..."
                        value={customIconInput}
                        onChange={(e) => setCustomIconInput(e.target.value)}
                        maxLength={2}
                        className="form-card-input"
                        style={{ textAlign: 'center', flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customIconInput.trim()) {
                            setFormIdentityIcon(customIconInput.trim());
                            setCustomIconInput('');
                            setShowCustomIconInput(false);
                            setShowIdentityIconPicker(false);
                          }
                        }}
                        className="icon-use-btn"
                      >
                        Use
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Section */}
              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon">✅</span>
                  <span className="form-card-title">Action</span>
                  <span className="form-card-required">*</span>
                </div>
                <div className="form-card-body">
                  <input
                    type="text"
                    placeholder="e.g. Read one page, Do 1 pushup"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className={`form-card-input ${nameError ? 'error' : ''}`}
                  />
                  <div className="form-card-hint">Keep it tiny! Something you can do in ~2 minutes</div>
                </div>
              </div>

              {/* Trigger Section */}
              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon">⚡</span>
                  <span className="form-card-title">Trigger</span>
                </div>
                <div className="form-card-body">
                  <input
                    type="text"
                    placeholder="e.g. After I wake up, When I feel stressed..."
                    value={formCustomTrigger}
                    onChange={(e) => setFormCustomTrigger(e.target.value)}
                    className="form-card-input"
                  />
                </div>
              </div>

              {/* Time & Place Section */}
              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon">📍</span>
                  <span className="form-card-title">Time & Place</span>
                </div>
                <div className="form-card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input
                      type="time"
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="form-card-input"
                    />
                    <select
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      className="form-card-input"
                    >
                      <option value="">Location</option>
                      <option value="Home">Home</option>
                      <option value="Kitchen">Kitchen</option>
                      <option value="Bedroom">Bedroom</option>
                      <option value="Living Room">Living Room</option>
                      <option value="Bathroom">Bathroom</option>
                      <option value="Office">Office</option>
                      <option value="Gym">Gym</option>
                      <option value="Car">Car</option>
                      <option value="Outdoors">Outdoors</option>
                      <option value="custom">+ Custom</option>
                    </select>
                  </div>
                  {formLocation === 'custom' && (
                    <input
                      type="text"
                      placeholder="Enter custom location"
                      value={formCustomLocation}
                      onChange={(e) => setFormCustomLocation(e.target.value)}
                      className="form-card-input"
                      style={{ marginTop: '8px' }}
                    />
                  )}
                </div>
              </div>

              {/* Duration & Frequency Section */}
              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon">⏱️</span>
                  <span className="form-card-title">Duration & Frequency</span>
                </div>
                <div className="form-card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                    {[['easy','⚡','~2 min'],['medium','⏱️','~10 min'],['hard','🏋️','30+ min']].map(([val, icon, lbl]) => (
                      <button
                        key={val}
                        type="button"
                        className={`difficulty-btn ${formDifficulty === val ? 'active' : ''}`}
                        onClick={() => setFormDifficulty(val)}
                      >
                        <span className="difficulty-icon">{icon}</span>
                        <span className="difficulty-label">{lbl}</span>
                      </button>
                    ))}
                  </div>
                  <div className="frequency-toggle">
                    {['daily','weekly','monthly'].map(f => (
                      <button
                        key={f}
                        type="button"
                        className={formFrequency === f ? 'active' : ''}
                        onClick={() => setFormFrequency(f)}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reward Section */}
              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon">🎉</span>
                  <span className="form-card-title">Reward (Optional)</span>
                </div>
                <div className="form-card-body">
                  <input
                    type="text"
                    placeholder="e.g. Check phone, Enjoy coffee"
                    value={formReward}
                    onChange={(e) => setFormReward(e.target.value)}
                    className="form-card-input"
                  />
                </div>
              </div>

            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="save-btn" onClick={addHabit}>Create Habit</button>
            </div>
          </div>
        </>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="habit-content">
          <div className="achievements-section">
            <h3 className="stats-section-title">Your Achievements</h3>
            <div className="achievements-grid">
              {(() => {
                const achievements = [
                  { id: 'first', icon: '🎯', name: 'First Step', desc: 'Complete 1 habit', unlocked: data.habits.some(h => getStreak(h.id) >= 1) },
                  { id: 'week', icon: '📅', name: 'Week Warrior', desc: '7 day streak', unlocked: data.habits.some(h => getStreak(h.id) >= 7) },
                  { id: 'month', icon: '🔥', name: 'Month Master', desc: '30 day streak', unlocked: data.habits.some(h => getStreak(h.id) >= 30) },
                  { id: 'fifty', icon: '⭐', name: 'Star Player', desc: '50 day streak', unlocked: data.habits.some(h => getStreak(h.id) >= 50) },
                  { id: 'hundred', icon: '💎', name: 'Diamond', desc: '100 day streak', unlocked: data.habits.some(h => getStreak(h.id) >= 100) },
                  { id: 'year', icon: '👑', name: 'Legend', desc: '365 day streak', unlocked: data.habits.some(h => getStreak(h.id) >= 365) },
                  { id: 'multi', icon: '🎭', name: 'Multi-tasker', desc: '5+ habits', unlocked: data.habits.length >= 5 },
                  { id: 'perfect', icon: '💯', name: 'Perfectionist', desc: '7 perfect days', unlocked: (() => {
                    let perfectDays = 0;
                    const today = new Date();
                    for (let i = 0; i < 30; i++) {
                      const d = new Date(today);
                      d.setDate(d.getDate() - i);
                      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                      const dailyHabits = data.habits.filter(h => h.frequency === 'daily');
                      const completed = data.completions[dateStr]?.filter(id => dailyHabits.some(h => h.id === id)) || [];
                      if (dailyHabits.length > 0 && completed.length === dailyHabits.length) perfectDays++;
                    }
                    return perfectDays >= 7;
                  })() },
                  { id: 'early', icon: '🌅', name: 'Early Bird', desc: 'Habit before 7am', unlocked: data.habits.some(h => {
                    if (!h.time) return false;
                    const [hours] = h.time.split(':').map(Number);
                    return hours < 7;
                  }) }
                ];
                
                return achievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className={`achievement-badge ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                  >
                    <div className="achievement-icon">{achievement.icon}</div>
                    <div className="achievement-name">{achievement.name}</div>
                    <div className="achievement-desc">{achievement.desc}</div>
                  </div>
                ));
              })()}
            </div>
          </div>

          <div className="stats-boxes">
            <div className="stat-box">
              <div className="stat-value">{(() => {
                const achievements = [
                  data.habits.some(h => getStreak(h.id) >= 1),
                  data.habits.some(h => getStreak(h.id) >= 7),
                  data.habits.some(h => getStreak(h.id) >= 30),
                  data.habits.some(h => getStreak(h.id) >= 50),
                  data.habits.some(h => getStreak(h.id) >= 100),
                  data.habits.some(h => getStreak(h.id) >= 365),
                  data.habits.length >= 5,
                  data.habits.some(h => {
                    if (!h.time) return false;
                    const [hours] = h.time.split(':').map(Number);
                    return hours < 7;
                  })
                ];
                return achievements.filter(Boolean).length;
              })()}/9</div>
              <div className="stat-label">Unlocked</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{Math.max(...data.habits.map(h => getStreak(h.id)), 0)}</div>
              <div className="stat-label">Best Streak</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{(() => {
                let perfectDays = 0;
                const today = new Date();
                for (let i = 0; i < 30; i++) {
                  const d = new Date(today);
                  d.setDate(d.getDate() - i);
                  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  const dailyHabits = data.habits.filter(h => h.frequency === 'daily');
                  const completed = data.completions[dateStr]?.filter(id => dailyHabits.some(h => h.id === id)) || [];
                  if (dailyHabits.length > 0 && completed.length === dailyHabits.length) perfectDays++;
                }
                return perfectDays;
              })()}</div>
              <div className="stat-label">Perfect Days</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="habit-content">
          <div className="stats-boxes">
            <div className="stat-box">
              <div className="stat-value">{data.habits.length}</div>
              <div className="stat-label">Total Habits</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{completedToday}/{totalToday}</div>
              <div className="stat-label">Today</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{Math.max(...data.habits.map(h => getStreak(h.id)), 0)}</div>
              <div className="stat-label">Best Streak</div>
            </div>
          </div>

          <div className="scorecard-summary">
            {data.habits.filter(h => h.habitType === 'positive').length} positive · {data.habits.filter(h => h.habitType === 'negative').length} negative · {data.habits.filter(h => h.habitType === 'neutral').length} neutral
          </div>

          {/* Plateau of Latent Potential */}
          <div className="plateau-section">
            <h3 className="stats-section-title">The Plateau of Latent Potential</h3>
            <div className="plateau-chart">
              <svg viewBox="0 0 400 200" className="plateau-svg">
                {/* Valley of Disappointment */}
                <path
                  d="M 20 180 Q 100 170, 180 165 Q 260 160, 340 120"
                  fill="none"
                  stroke="var(--text-tertiary)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.5"
                />
                <text x="200" y="155" fontSize="11" fill="var(--text-tertiary)" textAnchor="middle">
                  Expected progress
                </text>
                
                {/* Actual Progress Curve */}
                <path
                  d="M 20 180 L 80 178 L 140 176 L 200 172 L 240 165 L 280 140 L 320 90 L 360 40"
                  fill="none"
                  stroke="var(--success)"
                  strokeWidth="3"
                />
                
                {/* Valley of Disappointment Label */}
                <text x="120" y="195" fontSize="10" fill="var(--danger-text)" textAnchor="middle" fontWeight="600">
                  Valley of Disappointment
                </text>
                
                {/* Breakthrough Line */}
                <line x1="240" y1="10" x2="240" y2="190" stroke="var(--primary)" strokeWidth="2" strokeDasharray="3,3" />
                <text x="245" y="25" fontSize="11" fill="var(--primary)" fontWeight="600">
                  Breakthrough
                </text>
                
                {/* Plateau Region */}
                <rect x="20" y="165" width="220" height="15" fill="var(--warning-bg)" opacity="0.3" rx="2" />
                <text x="130" y="177" fontSize="10" fill="var(--warning-text)" textAnchor="middle" fontWeight="600">
                  Plateau of Latent Potential
                </text>
                
                {/* Your Position Marker */}
                {(() => {
                  const longestStreak = Math.max(...data.habits.map(h => getStreak(h.id)), 0);
                  let xPos = 20;
                  if (longestStreak <= 7) xPos = 20 + (longestStreak * 8);
                  else if (longestStreak <= 21) xPos = 80 + ((longestStreak - 7) * 8);
                  else if (longestStreak <= 66) xPos = 200 + ((longestStreak - 21) * 3);
                  else xPos = 340;
                  
                  let yPos = 180;
                  if (longestStreak <= 7) yPos = 180 - (longestStreak * 0.3);
                  else if (longestStreak <= 21) yPos = 178 - ((longestStreak - 7) * 0.4);
                  else if (longestStreak <= 66) yPos = 172 - ((longestStreak - 21) * 2);
                  else yPos = 40;
                  
                  return (
                    <>
                      <circle cx={xPos} cy={yPos} r="6" fill="var(--primary)" />
                      <circle cx={xPos} cy={yPos} r="10" fill="var(--primary)" opacity="0.3" />
                      <text x={xPos} y={yPos - 15} fontSize="12" fill="var(--primary)" textAnchor="middle" fontWeight="700">
                        You
                      </text>
                    </>
                  );
                })()}
                
                {/* Axes */}
                <line x1="20" y1="190" x2="380" y2="190" stroke="var(--border-dark)" strokeWidth="1" />
                <text x="200" y="205" fontSize="11" fill="var(--text-secondary)" textAnchor="middle">
                  Time
                </text>
              </svg>
              
              <div className="plateau-explanation">
                <p className="plateau-text">
                  <strong>You're in the valley.</strong> Most habits feel useless at first. Results compound slowly, then suddenly. Keep going.
                </p>
                <p className="plateau-quote">
                  "Success is the product of daily habits—not once-in-a-lifetime transformations."
                </p>
              </div>
            </div>
          </div>

          {/* Weekly Comparison Chart */}
          <div className="weekly-comparison">
            <h3 className="stats-section-title">Weekly Comparison</h3>
            <div className="weekly-bars">
              {(() => {
                const weeks = [];
                const today = new Date();
                
                for (let i = 3; i >= 0; i--) {
                  const weekStart = new Date(today);
                  const day = weekStart.getDay();
                  const diff = day === 0 ? -6 : 1 - day;
                  weekStart.setDate(weekStart.getDate() + diff - (i * 7));
                  
                  let completedCount = 0;
                  let totalCount = 0;
                  
                  for (let j = 0; j < 7; j++) {
                    const d = new Date(weekStart);
                    d.setDate(d.getDate() + j);
                    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    
                    const dailyHabits = data.habits.filter(h => h.frequency === 'daily');
                    totalCount += dailyHabits.length;
                    
                    if (data.completions[dateStr]) {
                      completedCount += data.completions[dateStr].filter(id => 
                        dailyHabits.some(h => h.id === id)
                      ).length;
                    }
                  }
                  
                  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                  const isCurrentWeek = i === 0;
                  
                  const weekLabel = i === 0 ? 'This Week' : 
                                   i === 1 ? 'Last Week' : 
                                   i === 2 ? '2 Weeks Ago' : 
                                   '3 Weeks Ago';
                  
                  weeks.push(
                    <div key={i} className="weekly-bar-item">
                      <div className="weekly-bar-label">{weekLabel}</div>
                      <div className="weekly-bar-container">
                        <div 
                          className={`weekly-bar-fill ${isCurrentWeek ? 'current' : ''}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="weekly-bar-value">{percentage}%</div>
                    </div>
                  );
                }
                
                return weeks;
              })()}
            </div>
          </div>

          {/* Monthly Grid Calendar */}
          <div className="monthly-grid">
            <h3 className="stats-section-title">This Month</h3>
            <div className="month-calendar">
              {(() => {
                const today = new Date();
                const year = today.getFullYear();
                const month = today.getMonth();
                const firstDay = new Date(year, month, 1);
                const lastDay = new Date(year, month + 1, 0);
                const startDay = firstDay.getDay();
                const daysInMonth = lastDay.getDate();
                
                const days = [];
                const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                
                // Day headers
                dayNames.forEach((name, i) => {
                  days.push(
                    <div key={`header-${i}`} className="calendar-day-header">
                      {name}
                    </div>
                  );
                });
                
                // Empty cells before first day
                for (let i = 0; i < startDay; i++) {
                  days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
                }
                
                // Days of month
                for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(year, month, day);
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isToday = day === today.getDate();
                  const isFuture = date > today;
                  
                  const dailyHabits = data.habits.filter(h => h.frequency === 'daily');
                  const completedHabits = data.completions[dateStr]?.filter(id => 
                    dailyHabits.some(h => h.id === id)
                  ) || [];
                  
                  const totalHabits = dailyHabits.length;
                  const completionRate = totalHabits > 0 ? completedHabits.length / totalHabits : 0;
                  
                  let glowClass = '';
                  if (!isFuture && totalHabits > 0) {
                    if (completionRate === 1) glowClass = 'glow-perfect';
                    else if (completionRate >= 0.7) glowClass = 'glow-good';
                    else if (completionRate >= 0.4) glowClass = 'glow-okay';
                    else if (completionRate > 0) glowClass = 'glow-low';
                    else glowClass = 'glow-none';
                  }
                  
                  days.push(
                    <div 
                      key={`day-${day}`} 
                      className={`calendar-day ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''} ${glowClass}`}
                    >
                      <div className="calendar-day-number">{day}</div>
                      {!isFuture && totalHabits > 0 && (
                        <div className="calendar-day-dots">
                          {completedHabits.length > 0 && (
                            <div className="calendar-dot-count">{completedHabits.length}/{totalHabits}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
                
                return days;
              })()}
            </div>
            
            <div className="calendar-legend">
              <div className="legend-item">
                <div className="legend-dot glow-perfect"></div>
                <span>Perfect</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot glow-good"></div>
                <span>Good (70%+)</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot glow-okay"></div>
                <span>Okay (40%+)</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot glow-low"></div>
                <span>Low</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot glow-none"></div>
                <span>Missed</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}></div>
          <div className="habit-modal">
            <div className="modal-handle"></div>
            <h3>Edit Habit</h3>
            
            <label>Habit Name</label>
            <input
              type="text"
              placeholder="Habit name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className={nameError ? 'error' : ''}
            />
            
            <label>Implementation Intention</label>
            <div className="intention-inputs">
              <input
                type="text"
                placeholder="Time (e.g. 8am)"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
              />
              <input
                type="text"
                placeholder="Location (e.g. kitchen)"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
              />
            </div>
            
            <label>Identity Statement</label>
            <input
              type="text"
              placeholder="I am a person who..."
              value={editIdentity}
              onChange={(e) => setEditIdentity(e.target.value)}
            />
            
            <label>Reward (After Completion)</label>
            <input
              type="text"
              placeholder="e.g. 10 min social media"
              value={editReward}
              onChange={(e) => setEditReward(e.target.value)}
            />
            
            <label>Frequency</label>
            <div className="frequency-toggle">
              <button
                className={editFrequency === 'daily' ? 'active' : ''}
                onClick={() => setEditFrequency('daily')}
              >
                Daily
              </button>
              <button
                className={editFrequency === 'weekly' ? 'active' : ''}
                onClick={() => setEditFrequency('weekly')}
              >
                Weekly
              </button>
              <button
                className={editFrequency === 'monthly' ? 'active' : ''}
                onClick={() => setEditFrequency('monthly')}
              >
                Monthly
              </button>
            </div>
            
            <label>Type</label>
            <select value={editType} onChange={(e) => setEditType(e.target.value)}>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
            </select>
            
            <label>Difficulty (2-Minute Rule)</label>
            <select value={editDifficulty} onChange={(e) => setEditDifficulty(e.target.value)}>
              <option value="easy">Easy (~2m)</option>
              <option value="medium">Medium (~10m)</option>
              <option value="hard">Hard (30m+)</option>
            </select>
            
            <label>Custom Trigger</label>
            <input
              type="text"
              className="custom-trigger-input"
              placeholder="e.g. After I wake up, When I feel stressed..."
              value={editCustomTrigger}
              onChange={(e) => setEditCustomTrigger(e.target.value)}
            />
            
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="save-btn" onClick={saveEdit}>Save</button>
            </div>
          </div>
        </>
      )}

      {showDeleteModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}></div>
          <div className="habit-modal delete-modal">
            <h3>Delete '{deletingHabit?.name}'?</h3>
            <p className="delete-warning">This will remove all streak data. Cannot be undone.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="delete-confirm-btn" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </>
      )}

      {/* Milestone Celebration */}
      {showMilestone && milestoneData && (
        <div className="milestone-overlay">
          <div className="milestone-card">
            <div className="milestone-emoji">{milestoneData.emoji}</div>
            <div className="milestone-title">Milestone Reached!</div>
            <div className="milestone-streak">{milestoneData.streak} Day Streak</div>
            <div className="milestone-habit">{milestoneData.habitName}</div>
            <div className="milestone-message">
              {milestoneData.streak === 7 && "One week strong! You're building momentum."}
              {milestoneData.streak === 30 && "30 days! This is becoming part of who you are."}
              {milestoneData.streak === 50 && "50 days! You're in the top 1% of habit builders."}
              {milestoneData.streak === 100 && "100 days! You've mastered this habit."}
              {milestoneData.streak === 365 && "ONE YEAR! You are legendary!"}
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowExportModal(false)} />
          <div className="habit-modal export-modal">
            <div className="modal-handle" />
            <h3>Export Data</h3>
            <div className="export-options">
              <div className="export-option" onClick={() => exportData('json')}>
                <div className="export-option-left">
                  <span className="export-icon">📄</span>
                  <div className="export-option-text">
                    <div className="export-option-title">JSON Format</div>
                    <div className="export-option-desc">Complete data backup</div>
                  </div>
                </div>
                <span className="export-arrow">→</span>
              </div>
              <div className="export-option" onClick={() => exportData('csv')}>
                <div className="export-option-left">
                  <span className="export-icon">📊</span>
                  <div className="export-option-text">
                    <div className="export-option-title">CSV Format</div>
                    <div className="export-option-desc">Spreadsheet compatible</div>
                  </div>
                </div>
                <span className="export-arrow">→</span>
              </div>
              <div className="export-option" onClick={() => exportData('text')}>
                <div className="export-option-left">
                  <span className="export-icon">📝</span>
                  <div className="export-option-text">
                    <div className="export-option-title">Text Summary</div>
                    <div className="export-option-desc">Human-readable report</div>
                  </div>
                </div>
                <span className="export-arrow">→</span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn full-width" onClick={() => setShowExportModal(false)}>Close</button>
            </div>
          </div>
        </>
      )}

      {/* Template Library Modal */}
      {showTemplateModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowTemplateModal(false)} />
          <div className="habit-modal">
            <div className="modal-handle" />
            <h3>Habit Templates</h3>
            <div className="template-library">
              {HABIT_TEMPLATES.map(category => (
                <div key={category.category} className="template-category">
                  <div className="template-category-title">{category.category}</div>
                  {category.templates.map((template, idx) => (
                    <div key={idx} className="template-card">
                      <span className="template-emoji">{template.emoji}</span>
                      <div className="template-info">
                        <div className="template-name">{template.name}</div>
                        <div className="template-identity">{template.identity}</div>
                      </div>
                      <button
                        className="template-add-btn"
                        onClick={() => addFromTemplate(template)}
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="cancel-btn full-width" onClick={() => setShowTemplateModal(false)}>Close</button>
            </div>
          </div>
        </>
      )}

      {twoMinuteWarning && (
        <>
          <div className="modal-overlay" onClick={() => setTwoMinuteWarning(false)}></div>
          <div className="habit-modal two-minute-modal">
            <div className="modal-handle"></div>
            <h3>⚠️ 2-Minute Rule</h3>
            <div className="two-minute-content">
              <p className="two-minute-text">
                <strong>"{formName}"</strong> takes {formDifficulty === 'medium' ? '~10 minutes' : '30+ minutes'}.
              </p>
              <p className="two-minute-principle">
                James Clear's principle: <em>"A new habit should take less than 2 minutes to do."</em>
              </p>
              <div className="two-minute-examples">
                <div className="example-title">Can you scale it down?</div>
                <div className="example-item">📖 "Read 30 pages" → "Read 1 page"</div>
                <div className="example-item">🏃 "Run 5km" → "Put on running shoes"</div>
                <div className="example-item">🧘 "Meditate 20 min" → "Meditate 1 breath"</div>
              </div>
              <p className="two-minute-why">
                Start small. Master showing up. Scale up naturally.
              </p>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setTwoMinuteWarning(false)}>
                Let me revise
              </button>
              <button className="save-btn" onClick={overrideTwoMinuteRule}>
                I understand, add anyway
              </button>
            </div>
          </div>
        </>
      )}

      {showWeeklyReview && weeklyReviewData && (
        <>
          <div className="modal-overlay" onClick={dismissWeeklyReview}></div>
          <div className="habit-modal weekly-review-modal">
            <div className="modal-handle"></div>
            <h3>📊 Weekly Review</h3>
            <div className="weekly-review-content">
              <div className="review-header">
                <div className="review-score">
                  <div className="review-score-value">{weeklyReviewData.percentage}%</div>
                  <div className="review-score-label">Completion Rate</div>
                </div>
                <div className="review-summary">
                  {weeklyReviewData.totalCompleted} of {weeklyReviewData.totalPossible} habits completed this week
                </div>
              </div>
              
              <div className="review-habits">
                {weeklyReviewData.habitStats.map((stat, idx) => (
                  <div key={idx} className="review-habit-item">
                    <div className="review-habit-header">
                      <span className="review-habit-name">{stat.name}</span>
                      <span className="review-habit-score">{stat.completed}/{stat.total}</span>
                    </div>
                    <div className="review-habit-bar">
                      <div 
                        className="review-habit-fill" 
                        style={{ width: `${stat.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="review-insights">
                <div className="insight-title">💡 Reflection</div>
                {weeklyReviewData.percentage >= 80 && (
                  <p className="insight-text">
                    Excellent week! You're building strong systems. Consider adding a new habit or increasing difficulty.
                  </p>
                )}
                {weeklyReviewData.percentage >= 50 && weeklyReviewData.percentage < 80 && (
                  <p className="insight-text">
                    Good progress! Focus on consistency. Remember: never miss twice.
                  </p>
                )}
                {weeklyReviewData.percentage < 50 && (
                  <p className="insight-text">
                    Tough week? That's okay. Review your habits: Are they too hard? Too vague? Scale them down to 2 minutes.
                  </p>
                )}
              </div>
              
              <div className="review-quote">
                <p>"You do not rise to the level of your goals. You fall to the level of your systems."</p>
                <span>— James Clear</span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="save-btn full-width" onClick={dismissWeeklyReview}>
                Got it, thanks!
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HabitTracker;
