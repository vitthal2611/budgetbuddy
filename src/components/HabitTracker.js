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

const HabitTracker = () => {
  const [data, setData] = useState({ habits: [], completions: {} });
  const [activeTab, setActiveTab] = useState('today');
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formCustomLocation, setFormCustomLocation] = useState('');
  const [formIdentity, setFormIdentity] = useState('');
  const [formReward, setFormReward] = useState('');
  const [formFrequency, setFormFrequency] = useState('daily');
  const [formDifficulty, setFormDifficulty] = useState('easy');
  const [formStackAfter, setFormStackAfter] = useState('');
  
  // Modal state
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
  const [editStackAfter, setEditStackAfter] = useState('');
  
  // Validation
  const [nameError, setNameError] = useState(false);
  const [identityError, setIdentityError] = useState(false);
  const [twoMinuteWarning, setTwoMinuteWarning] = useState(false);
  
  // Weekly review
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);
  const [weeklyReviewData, setWeeklyReviewData] = useState(null);

  useEffect(() => {
    const unsubscribe = habitService.subscribeToHabits((habitData) => {
      setData(habitData);
      setLoading(false);
    });

    return () => unsubscribe();
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

  const isCompletedToday = (habitId) => {
    const habit = data.habits.find(h => h.id === habitId);
    if (!habit) return false;
    
    const today = getTodayString();
    const todayDate = new Date();
    
    // For daily habits, check today only
    if (habit.frequency === 'daily') {
      return data.completions[today]?.includes(habitId) || false;
    }
    
    // For weekly habits, check if completed anywhere this week
    if (habit.frequency === 'weekly') {
      const monday = new Date(todayDate);
      const day = monday.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      monday.setDate(monday.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      
      for (let d = new Date(monday); d <= todayDate; d.setDate(d.getDate() + 1)) {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (data.completions[dateStr]?.includes(habitId)) {
          return true;
        }
      }
      return false;
    }
    
    // For monthly habits, check if completed anywhere this month
    if (habit.frequency === 'monthly') {
      const firstDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
      for (let d = new Date(firstDay); d <= todayDate; d.setDate(d.getDate() + 1)) {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (data.completions[dateStr]?.includes(habitId)) {
          return true;
        }
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
    if (!habit) return 0;
    
    let streak = 0;
    const today = new Date();
    
    if (habit.frequency === 'daily') {
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (data.completions[dateStr]?.includes(habitId)) {
          streak++;
        } else {
          break;
        }
      }
    } else if (habit.frequency === 'weekly') {
      for (let i = 0; i < 52; i++) {
        const weekStart = new Date(today);
        const day = weekStart.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        weekStart.setDate(weekStart.getDate() + diff - (i * 7));
        
        let foundInWeek = false;
        for (let j = 0; j < 7; j++) {
          const d = new Date(weekStart);
          d.setDate(d.getDate() + j);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (data.completions[dateStr]?.includes(habitId)) {
            foundInWeek = true;
            break;
          }
        }
        if (foundInWeek) {
          streak++;
        } else {
          break;
        }
      }
    } else if (habit.frequency === 'monthly') {
      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
        
        let foundInMonth = false;
        for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (data.completions[dateStr]?.includes(habitId)) {
            foundInMonth = true;
            break;
          }
        }
        if (foundInMonth) {
          streak++;
        } else {
          break;
        }
      }
    }
    
    return streak;
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
    
    const today = getTodayString();
    const todayDate = new Date();
    const newCompletions = { ...data.completions };
    
    // Check if habit is currently completed (in this period)
    const isCurrentlyCompleted = isCompletedToday(habitId);
    
    if (isCurrentlyCompleted) {
      // Unchecking - remove completion from the period
      if (habit.frequency === 'daily') {
        // Remove from today only
        if (newCompletions[today]) {
          newCompletions[today] = newCompletions[today].filter(id => id !== habitId);
        }
      } else if (habit.frequency === 'weekly') {
        // Remove from all days this week
        const monday = new Date(todayDate);
        const day = monday.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        monday.setDate(monday.getDate() + diff);
        monday.setHours(0, 0, 0, 0);
        
        for (let d = new Date(monday); d <= todayDate; d.setDate(d.getDate() + 1)) {
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (newCompletions[dateStr]) {
            newCompletions[dateStr] = newCompletions[dateStr].filter(id => id !== habitId);
          }
        }
      } else if (habit.frequency === 'monthly') {
        // Remove from all days this month
        const firstDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
        for (let d = new Date(firstDay); d <= todayDate; d.setDate(d.getDate() + 1)) {
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (newCompletions[dateStr]) {
            newCompletions[dateStr] = newCompletions[dateStr].filter(id => id !== habitId);
          }
        }
      }
    } else {
      // Checking - add completion for today
      if (!newCompletions[today]) {
        newCompletions[today] = [];
      }
      newCompletions[today].push(habitId);
    }
    
    const newData = { ...data, completions: newCompletions };
    setData(newData);
    await habitService.saveHabits(newData);
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
      time: formTime.trim(),
      location: finalLocation,
      reward: formReward.trim(),
      stackAfter: formStackAfter,
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
    setFormReward('');
    setFormFrequency('daily');
    setFormDifficulty('easy');
    setFormStackAfter('');
  };

  const overrideTwoMinuteRule = async () => {
    setTwoMinuteWarning(false);
    
    const finalLocation = formLocation === 'custom' ? formCustomLocation.trim() : formLocation;
    
    const newHabit = {
      id: `h_${Date.now()}`,
      name: formName.trim(),
      identity: formIdentity.trim(),
      time: formTime.trim(),
      location: finalLocation,
      reward: formReward.trim(),
      stackAfter: formStackAfter,
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
    setFormReward('');
    setFormFrequency('daily');
    setFormDifficulty('easy');
    setFormStackAfter('');
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
    setEditStackAfter(habit.stackAfter || '');
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
            stackAfter: editStackAfter
          }
        : h
    );
    
    const newData = { ...data, habits: updatedHabits };
    setData(newData);
    await habitService.saveHabits(newData);
    setShowEditModal(false);
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

  const completedToday = todayHabits.filter(h => isCompletedToday(h.id)).length;
  const totalToday = todayHabits.length;
  const allDone = totalToday > 0 && completedToday === totalToday;
  const progressPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const quote = getDailyQuote();

  return (
    <div className="habit-tracker">
      <div className="habit-header">
        <h1>Atomic Streaks</h1>
        <div className="habit-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
      </div>

      <div className="habit-tabs">
        <button
          className={`habit-tab ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          Today
        </button>
        <button
          className={`habit-tab ${activeTab === 'habits' ? 'active' : ''}`}
          onClick={() => setActiveTab('habits')}
        >
          Habits
        </button>
        <button
          className={`habit-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Stats
        </button>
      </div>

      {activeTab === 'today' && (
        <div className="habit-content">
          <div className="daily-quote">
            <div className="quote-text">{quote.text}</div>
            <div className="quote-source">— Atomic Habits: {quote.law}</div>
          </div>

          {allDone && (
            <div className="celebration-banner">
              <span className="celebration-emoji">🎉</span>
              <div className="celebration-text">
                <div className="celebration-title">Perfect day!</div>
                <div className="celebration-subtitle">All {totalToday} habits done. You showed up today.</div>
              </div>
            </div>
          )}

          <div className="progress-section">
            <div className="progress-text">
              <span>{completedToday} of {totalToday} done</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>

          <div className="habit-list">
            {todayHabits.map(habit => {
              const completed = isCompletedToday(habit.id);
              const streak = getStreak(habit.id);
              const missed = missedYesterday(habit.id);
              const stackedHabit = habit.stackAfter ? data.habits.find(h => h.id === habit.stackAfter) : null;
              const isStacked = !!habit.stackAfter;
              
              return (
                <div 
                  key={habit.id} 
                  className={`habit-card ${completed ? 'completed' : ''} ${isStacked ? 'stacked' : ''}`}
                  onClick={() => toggleHabit(habit.id)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      toggleHabit(habit.id);
                    }
                  }}
                >
                  <div className="habit-card-header">
                    {isStacked && <div className="stack-connector"></div>}
                    <div
                      className={`habit-check ${completed ? 'checked' : ''}`}
                      aria-label={`${completed ? 'Completed' : 'Not completed'}: ${habit.name}`}
                    >
                      {completed && <span className="check-mark">✓</span>}
                    </div>
                    <div className="habit-main">
                      <div className="habit-title-row">
                        <span className={`habit-type-dot ${habit.habitType}`}></span>
                        <span className="habit-name">{habit.name}</span>
                        {habit.time && <span className="habit-time">🕐 {habit.time}</span>}
                        <span className="habit-badge">{habit.frequency === 'daily' ? 'Daily' : habit.frequency === 'weekly' ? 'Weekly' : 'Monthly'}</span>
                        <span className="habit-difficulty">{habit.difficulty === 'easy' ? '~2m' : habit.difficulty === 'medium' ? '~10m' : '30m+'}</span>
                      </div>
                      
                      {/* Identity Statement */}
                      {habit.identity && (
                        <div className="habit-identity">💭 {habit.identity}</div>
                      )}
                      
                      {/* Habit Stacking */}
                      {stackedHabit && (
                        <div className="habit-stack">🔗 After: {stackedHabit.name}</div>
                      )}
                      
                      {/* Implementation Intention */}
                      {habit.time && habit.location && (
                        <div className="habit-intention">
                          📍 I will {habit.name} at {habit.time} in {habit.location}
                        </div>
                      )}
                      
                      {/* Reward - Show after completion */}
                      {completed && habit.reward && (
                        <div className="habit-reward">🎉 Reward: {habit.reward}</div>
                      )}
                      
                      {/* 2-Minute Rule Enforcement */}
                      {!completed && habit.difficulty === 'hard' && (
                        <div className="habit-friction">💡 Can you make this easier? Start with 2 min.</div>
                      )}
                      
                      {/* Never Miss Twice Warning */}
                      {!completed && missed && (
                        <div className="habit-missed">⚠️ Missed yesterday — don't miss twice!</div>
                      )}
                      
                      {/* Streak Counter */}
                      <div className={`habit-streak ${completed ? 'streak-active' : ''}`}>
                        🔥 {streak}{habit.frequency === 'daily' ? 'd' : habit.frequency === 'weekly' ? 'w' : 'm'} streak
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'habits' && (
        <div className="habit-content">
          <div className="add-section">
            <h2>Add New Habit</h2>
            <div className="tip-box">
              Scale your habit down to something you can do in 2 minutes.
            </div>
            
            <div className="habit-form">
              <div className="form-section">
                <label className="form-label">What habit? (Keep it tiny!)</label>
                <input
                  type="text"
                  placeholder="e.g. Read one page, Do 1 pushup"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={nameError ? 'error' : ''}
                />
              </div>
              
              <div className="form-section identity-section">
                <label className="form-label required">Who are you becoming?</label>
                <input
                  type="text"
                  placeholder="I am a person who..."
                  value={formIdentity}
                  onChange={(e) => setFormIdentity(e.target.value)}
                  className={identityError ? 'error' : ''}
                />
                <div className="identity-hint">
                  💡 Focus on identity, not outcomes. "I am a reader" not "I want to read more"
                </div>
              </div>
              
              <div className="form-section">
                <label className="form-label">When & where? (Make it obvious)</label>
                <div className="intention-inputs">
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="time-input"
                  />
                  <select
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="location-select"
                  >
                    <option value="">Select location</option>
                    <option value="Home">Home</option>
                    <option value="Kitchen">Kitchen</option>
                    <option value="Bedroom">Bedroom</option>
                    <option value="Living Room">Living Room</option>
                    <option value="Bathroom">Bathroom</option>
                    <option value="Office">Office</option>
                    <option value="Gym">Gym</option>
                    <option value="Car">Car</option>
                    <option value="Outdoors">Outdoors</option>
                    <option value="custom">+ Custom location</option>
                  </select>
                </div>
                {formLocation === 'custom' && (
                  <input
                    type="text"
                    placeholder="Enter custom location"
                    value={formCustomLocation}
                    onChange={(e) => setFormCustomLocation(e.target.value)}
                    className="custom-location-input"
                  />
                )}
                {(formName || formTime || formLocation) && formLocation !== 'custom' && (
                  <div className="intention-preview">
                    📍 I will {formName || '[habit]'} at {formTime || '[time]'} in {formLocation || '[location]'}
                  </div>
                )}
                {formLocation === 'custom' && formCustomLocation && (
                  <div className="intention-preview">
                    📍 I will {formName || '[habit]'} at {formTime || '[time]'} in {formCustomLocation}
                  </div>
                )}
              </div>
              
              <div className="form-section">
                <label className="form-label">Stack after another habit?</label>
                <select
                  value={formStackAfter}
                  onChange={(e) => setFormStackAfter(e.target.value)}
                  className="stack-select"
                >
                  <option value="">No stacking</option>
                  {data.habits.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
                {formStackAfter && (
                  <div className="stack-hint">
                    🔗 This habit will appear right after "{data.habits.find(h => h.id === formStackAfter)?.name}"
                  </div>
                )}
              </div>
              
              <div className="form-section">
                <label className="form-label">Reward yourself (Make it satisfying)</label>
                <input
                  type="text"
                  placeholder="e.g. Check phone, Enjoy coffee"
                  value={formReward}
                  onChange={(e) => setFormReward(e.target.value)}
                />
              </div>
              
              <div className="form-section">
                <label className="form-label">How long does it take?</label>
                <div className="difficulty-selector">
                  <button
                    className={`difficulty-btn ${formDifficulty === 'easy' ? 'active' : ''}`}
                    onClick={() => setFormDifficulty('easy')}
                  >
                    <span className="difficulty-icon">⚡</span>
                    <span className="difficulty-label">~2 min</span>
                  </button>
                  <button
                    className={`difficulty-btn ${formDifficulty === 'medium' ? 'active' : ''}`}
                    onClick={() => setFormDifficulty('medium')}
                  >
                    <span className="difficulty-icon">⏱️</span>
                    <span className="difficulty-label">~10 min</span>
                  </button>
                  <button
                    className={`difficulty-btn ${formDifficulty === 'hard' ? 'active' : ''}`}
                    onClick={() => setFormDifficulty('hard')}
                  >
                    <span className="difficulty-icon">🏋️</span>
                    <span className="difficulty-label">30+ min</span>
                  </button>
                </div>
              </div>
              
              <div className="frequency-toggle">
                <button
                  className={formFrequency === 'daily' ? 'active' : ''}
                  onClick={() => setFormFrequency('daily')}
                >
                  Daily
                </button>
                <button
                  className={formFrequency === 'weekly' ? 'active' : ''}
                  onClick={() => setFormFrequency('weekly')}
                >
                  Weekly
                </button>
                <button
                  className={formFrequency === 'monthly' ? 'active' : ''}
                  onClick={() => setFormFrequency('monthly')}
                >
                  Monthly
                </button>
              </div>
              
              <button className="add-button" onClick={addHabit}>
                Add Habit
              </button>
            </div>
          </div>

          <div className="manage-section">
            <h2>Your Habits</h2>
            {data.habits.length === 0 ? (
              <div className="empty-habits">No habits yet. Add your first one above!</div>
            ) : (
              <div className="habit-manage-list">
                {data.habits.map(habit => (
                  <div key={habit.id} className="habit-manage-card">
                    <div className="habit-manage-header">
                      <span className={`habit-type-dot ${habit.habitType}`}></span>
                      <span className="habit-manage-name">{habit.name}</span>
                      <span className="habit-badge">{habit.frequency === 'daily' ? 'Daily' : habit.frequency === 'weekly' ? 'Weekly' : 'Monthly'}</span>
                      <span className="habit-difficulty">{habit.difficulty === 'easy' ? '~2m' : habit.difficulty === 'medium' ? '~10m' : '30m+'}</span>
                    </div>
                    <div className="habit-manage-meta">
                      {habit.time && habit.location && (
                        <>📍 {habit.time} in {habit.location} | </>
                      )}
                      🔥 {getStreak(habit.id)}{habit.frequency === 'daily' ? 'd' : habit.frequency === 'weekly' ? 'w' : 'm'}
                    </div>
                    <div className="habit-manage-actions">
                      <button className="edit-btn" onClick={() => openEditModal(habit)}>
                        ✏️ Edit Details
                      </button>
                      <button className="delete-btn" onClick={() => openDeleteModal(habit)}>
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            
            <label>Stack After</label>
            <select value={editStackAfter} onChange={(e) => setEditStackAfter(e.target.value)}>
              <option value="">None</option>
              {data.habits.filter(h => h.id !== editingHabit?.id).map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
            
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
