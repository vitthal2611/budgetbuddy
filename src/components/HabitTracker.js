import React, { useState, useEffect } from 'react';
import habitService from '../services/habitService';
import './HabitTracker.css';

const HabitTracker = () => {
  const [data, setData] = useState({ habits: [], completions: {} });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  
  const [formTrigger, setFormTrigger] = useState('');
  const [formAction, setFormAction] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formIdentity, setFormIdentity] = useState('');
  const [formTwoMinVersion, setFormTwoMinVersion] = useState('');
  const [formReward, setFormReward] = useState('');
  const [formMakeObvious, setFormMakeObvious] = useState('');
  
  const [showCustomIdentity, setShowCustomIdentity] = useState(false);
  const [customIdentity, setCustomIdentity] = useState('');
  const [showCustomLocation, setShowCustomLocation] = useState(false);
  const [customLocation, setCustomLocation] = useState('');
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingHabit, setReviewingHabit] = useState(null);
  const [review, setReview] = useState('');
  
  const [openMenuId, setOpenMenuId] = useState(null);

  const getWeek = (offset) => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(monday.getDate() + diff + (offset * 7));
    monday.setHours(0, 0, 0, 0);
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(date.getDate() + i);
      week.push(date);
    }
    return week;
  };

  const currentWeek = getWeek(weekOffset);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    const unsubscribe = habitService.subscribeToHabits((habitData) => {
      setData(habitData);
      setLoading(false);
    });

    const timeout = setTimeout(() => {
      if (loading) {
        console.error('Habit loading timeout');
        setLoading(false);
      }
    }, 3000);

    // Close menu when clicking outside
    const handleClickOutside = (e) => {
      if (!e.target.closest('.habit-menu-btn') && !e.target.closest('.habit-menu-dropdown')) {
        setOpenMenuId(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);

    return () => {
      clearTimeout(timeout);
      unsubscribe();
      document.removeEventListener('click', handleClickOutside);
    };
  }, [loading]);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDayLabel = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[date.getDay()]} ${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
  };

  const isCompleted = (habitId, date) => {
    const dateStr = formatDate(date);
    return data.completions[dateStr]?.includes(habitId) || false;
  };

  const toggleCompletion = async (habitId, date) => {
    const dateStr = formatDate(date);
    const newCompletions = { ...data.completions };
    
    if (!newCompletions[dateStr]) {
      newCompletions[dateStr] = [];
    }
    
    if (newCompletions[dateStr].includes(habitId)) {
      newCompletions[dateStr] = newCompletions[dateStr].filter(id => id !== habitId);
    } else {
      newCompletions[dateStr].push(habitId);
    }
    
    const newData = { ...data, completions: newCompletions };
    setData(newData);
    await habitService.saveHabits(newData);
  };

  const getCurrentStreak = (habitId) => {
    const habit = data.habits.find(h => h.id === habitId);
    if (!habit || !habit.startDate) return 0;
    
    const [year, month, day] = habit.startDate.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    startDate.setHours(0, 0, 0, 0);
    
    // Don't calculate streak if start date is in the future
    if (startDate > today) return 0;
    
    let streak = 0;
    let checkDate = new Date(today);
    
    while (checkDate >= startDate) {
      const dateStr = formatDate(checkDate);
      if (data.completions[dateStr]?.includes(habitId)) {
        streak++;
      } else {
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    return streak;
  };

  const getBestStreak = (habitId) => {
    const habit = data.habits.find(h => h.id === habitId);
    if (!habit || !habit.startDate) return 0;
    
    const [year, month, day] = habit.startDate.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    startDate.setHours(0, 0, 0, 0);
    
    // Don't calculate if start date is in the future
    if (startDate > today) return 0;
    
    let maxStreak = 0;
    let currentStreak = 0;
    let checkDate = new Date(startDate);
    
    while (checkDate <= today) {
      const dateStr = formatDate(checkDate);
      if (data.completions[dateStr]?.includes(habitId)) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }
    
    return maxStreak;
  };

  const getWeekCompletions = (habitId) => {
    const habit = data.habits.find(h => h.id === habitId);
    if (!habit || !habit.startDate) return 0;
    
    const [year, month, day] = habit.startDate.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    startDate.setHours(0, 0, 0, 0);
    
    let count = 0;
    currentWeek.forEach(date => {
      // Only count days after start date
      if (date >= startDate && isCompleted(habitId, date)) {
        count++;
      }
    });
    return count;
  };

  const getWeekPercentage = (habitId) => {
    const habit = data.habits.find(h => h.id === habitId);
    if (!habit || !habit.startDate) return 0;
    
    const [year, month, day] = habit.startDate.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    startDate.setHours(0, 0, 0, 0);
    
    // Count eligible days (days in current week that are after start date)
    let eligibleDays = 0;
    currentWeek.forEach(date => {
      if (date >= startDate) {
        eligibleDays++;
      }
    });
    
    if (eligibleDays === 0) return 0;
    
    const completions = getWeekCompletions(habitId);
    return Math.round((completions / eligibleDays) * 100);
  };

  const getDaysMissedThisWeek = (habitId) => {
    const habit = data.habits.find(h => h.id === habitId);
    if (!habit || !habit.startDate) return 0;
    
    const [year, month, day] = habit.startDate.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    startDate.setHours(0, 0, 0, 0);
    
    let missed = 0;
    currentWeek.forEach(date => {
      // Only count days that are: past/today AND after start date
      if (date <= today && date >= startDate && !isCompleted(habitId, date)) {
        missed++;
      }
    });
    return missed;
  };

  const parseTimeFromAction = (action) => {
    const timePatterns = [
      /(\d{1,2}):(\d{2})\s*(am|pm)/i,
      /(\d{1,2})\s*(am|pm)/i,
      /(\d{1,2}):(\d{2})/
    ];
    
    for (const pattern of timePatterns) {
      const match = action.match(pattern);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = match[2] ? parseInt(match[2]) : 0;
        const meridiem = match[3]?.toLowerCase();
        
        if (meridiem === 'pm' && hours !== 12) hours += 12;
        if (meridiem === 'am' && hours === 12) hours = 0;
        
        return hours * 60 + minutes;
      }
    }
    return 9999;
  };

  const getSortedHabits = () => {
    const filtered = data.habits.filter(habit => {
      if (!habit.startDate) return false;
      
      const [year, month, day] = habit.startDate.split('-').map(Number);
      const startDate = new Date(year, month - 1, day);
      startDate.setHours(0, 0, 0, 0);
      
      // Get the last day of the current viewing week
      const lastDayOfWeek = currentWeek[currentWeek.length - 1];
      
      // Only show habit if start date is on or before the last day of viewing week
      return startDate <= lastDayOfWeek;
    });
    
    return filtered.sort((a, b) => {
      const timeA = a.time || '23:59';
      const timeB = b.time || '23:59';
      return timeA.localeCompare(timeB);
    });
  };

  const getOverallInsights = () => {
    const totalHabits = data.habits.length;
    if (totalHabits === 0) return null;

    let totalPossible = 0;
    let totalCompleted = 0;
    let mostConsistent = { name: '', percentage: 0 };
    const atRisk = [];

    data.habits.forEach(habit => {
      // Only include habits that have started
      if (!habit.startDate) return;
      
      const [year, month, day] = habit.startDate.split('-').map(Number);
      const startDate = new Date(year, month - 1, day);
      startDate.setHours(0, 0, 0, 0);
      
      if (startDate > today) return;
      
      // Count eligible days for this habit in current week
      let eligibleDays = 0;
      currentWeek.forEach(date => {
        if (date >= startDate) {
          eligibleDays++;
        }
      });
      
      const weekCompletions = getWeekCompletions(habit.id);
      const weekPercentage = getWeekPercentage(habit.id);
      
      totalPossible += eligibleDays;
      totalCompleted += weekCompletions;

      if (weekPercentage > mostConsistent.percentage) {
        mostConsistent = { name: habit.trigger, percentage: weekPercentage };
      }

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Only mark at risk if habit was active yesterday
      if (yesterday >= startDate && !isCompleted(habit.id, yesterday) && !isCompleted(habit.id, today)) {
        atRisk.push(habit.trigger);
      }
    });

    const overallRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    return {
      totalHabits,
      overallRate,
      mostConsistent: mostConsistent.name || 'None',
      atRisk: atRisk.length > 0 ? atRisk : ['None']
    };
  };

  const handleAddHabit = async () => {
    if (!formTrigger.trim() || !formAction.trim()) {
      alert('Please fill in Trigger and Action fields');
      return;
    }

    const finalIdentity = showCustomIdentity ? customIdentity.trim() : formIdentity;
    if (!finalIdentity) {
      alert('Please fill in Identity Statement');
      return;
    }

    if (!formTwoMinVersion.trim()) {
      alert('Please fill in 2-Minute Version (make it easy to start)');
      return;
    }

    if (!formStartDate) {
      alert('Please select a start date');
      return;
    }

    if (!formTime) {
      alert('Please select a time');
      return;
    }

    const finalLocation = showCustomLocation ? customLocation.trim() : formLocation;
    if (!finalLocation) {
      alert('Please select a location');
      return;
    }

    const newHabit = {
      id: `h_${Date.now()}`,
      trigger: formTrigger.trim(),
      action: formAction.trim(),
      identity: finalIdentity,
      startDate: formStartDate,
      time: formTime,
      location: finalLocation,
      twoMinVersion: formTwoMinVersion.trim(),
      reward: formReward.trim(),
      makeObvious: formMakeObvious.trim(),
      createdAt: formatDate(new Date()),
      review: ''
    };

    const newData = {
      ...data,
      habits: [...data.habits, newHabit]
    };
    
    setData(newData);
    await habitService.saveHabits(newData);
    
    setFormTrigger('');
    setFormAction('');
    setFormIdentity('');
    setFormStartDate('');
    setFormTime('');
    setFormLocation('');
    setFormTwoMinVersion('');
    setFormReward('');
    setFormMakeObvious('');
    setShowCustomIdentity(false);
    setCustomIdentity('');
    setShowCustomLocation(false);
    setCustomLocation('');
    setShowAddModal(false);
  };

  const handleEditHabit = async () => {
    if (!formTrigger.trim() || !formAction.trim()) {
      alert('Please fill in Trigger and Action fields');
      return;
    }

    const finalIdentity = showCustomIdentity ? customIdentity.trim() : formIdentity;
    if (!finalIdentity) {
      alert('Please fill in Identity Statement');
      return;
    }

    if (!formTwoMinVersion.trim()) {
      alert('Please fill in 2-Minute Version (make it easy to start)');
      return;
    }

    if (!formStartDate) {
      alert('Please select a start date');
      return;
    }

    if (!formTime) {
      alert('Please select a time');
      return;
    }

    const finalLocation = showCustomLocation ? customLocation.trim() : formLocation;
    if (!finalLocation) {
      alert('Please select a location');
      return;
    }

    const updatedHabit = {
      ...editingHabit,
      trigger: formTrigger.trim(),
      action: formAction.trim(),
      identity: finalIdentity,
      startDate: formStartDate,
      time: formTime,
      location: finalLocation,
      twoMinVersion: formTwoMinVersion.trim(),
      reward: formReward.trim(),
      makeObvious: formMakeObvious.trim()
    };

    const newData = {
      ...data,
      habits: data.habits.map(h => h.id === editingHabit.id ? updatedHabit : h)
    };
    
    setData(newData);
    await habitService.saveHabits(newData);
    
    setShowEditModal(false);
    setEditingHabit(null);
    setFormTrigger('');
    setFormAction('');
    setFormIdentity('');
    setFormStartDate('');
    setFormTime('');
    setFormLocation('');
    setFormTwoMinVersion('');
    setFormReward('');
    setFormMakeObvious('');
    setShowCustomIdentity(false);
    setCustomIdentity('');
    setShowCustomLocation(false);
    setCustomLocation('');
  };

  const handleDeleteHabit = async (habitId) => {
    if (!window.confirm('Delete this habit?')) return;

    const newData = {
      ...data,
      habits: data.habits.filter(h => h.id !== habitId)
    };
    
    setData(newData);
    await habitService.saveHabits(newData);
    setOpenMenuId(null);
  };

  const openEditModal = (habit) => {
    setEditingHabit(habit);
    setFormTrigger(habit.trigger);
    setFormAction(habit.action);
    setFormStartDate(habit.startDate || '');
    setFormTime(habit.time || '');
    setFormTwoMinVersion(habit.twoMinVersion || '');
    setFormReward(habit.reward || '');
    setFormMakeObvious(habit.makeObvious || '');
    
    // Check if identity is a predefined option
    const predefinedIdentities = [
      'I am a person who exercises daily',
      'I am a person who eats healthy',
      'I am a person who reads daily',
      'I am a person who stays hydrated',
      'I am a person who meditates',
      'I am a person who sleeps well',
      'I am a person who learns continuously',
      'I am a person who stays organized'
    ];
    
    if (predefinedIdentities.includes(habit.identity)) {
      setFormIdentity(habit.identity);
      setShowCustomIdentity(false);
      setCustomIdentity('');
    } else {
      setFormIdentity('custom');
      setShowCustomIdentity(true);
      setCustomIdentity(habit.identity || '');
    }
    
    // Check if location is a predefined option
    const predefinedLocations = ['Bedroom', 'Kitchen', 'Living Room', 'Office', 'Gym', 'Bathroom', 'Outdoors', 'Car'];
    
    if (predefinedLocations.includes(habit.location)) {
      setFormLocation(habit.location);
      setShowCustomLocation(false);
      setCustomLocation('');
    } else {
      setFormLocation('custom');
      setShowCustomLocation(true);
      setCustomLocation(habit.location || '');
    }
    
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const openReviewModal = (habit) => {
    setReviewingHabit(habit);
    setReview(habit.review || '');
    setShowReviewModal(true);
    setOpenMenuId(null);
  };

  const toggleMenu = (habitId) => {
    setOpenMenuId(openMenuId === habitId ? null : habitId);
  };

  const handleSaveReview = async () => {
    if (!reviewingHabit) return;

    const updatedHabit = {
      ...reviewingHabit,
      review: review.trim()
    };

    const newData = {
      ...data,
      habits: data.habits.map(h => h.id === reviewingHabit.id ? updatedHabit : h)
    };

    setData(newData);
    await habitService.saveHabits(newData);

    setShowReviewModal(false);
    setReviewingHabit(null);
    setReview('');
  };

  const goToPreviousWeek = () => setWeekOffset(prev => prev - 1);
  const goToNextWeek = () => setWeekOffset(prev => prev + 1);
  const goToCurrentWeek = () => setWeekOffset(0);
  const isCurrentWeek = weekOffset === 0;

  const getWeekLabel = () => {
    if (weekOffset === 0) return 'This Week';
    if (weekOffset === -1) return 'Last Week';
    if (weekOffset === 1) return 'Next Week';
    
    const firstDay = currentWeek[0];
    const lastDay = currentWeek[6];
    const monthStart = firstDay.toLocaleString('default', { month: 'short' });
    const monthEnd = lastDay.toLocaleString('default', { month: 'short' });
    
    if (monthStart === monthEnd) {
      return `${monthStart} ${firstDay.getDate()}-${lastDay.getDate()}`;
    }
    return `${monthStart} ${firstDay.getDate()} - ${monthEnd} ${lastDay.getDate()}`;
  };

  if (loading) {
    return (
      <div className="habit-tracker">
        <div className="habit-loading">Loading habits...</div>
      </div>
    );
  }

  const sortedHabits = getSortedHabits();
  const insights = getOverallInsights();

  return (
    <div className="habit-tracker">
      <div className="habit-header">
        <h1 className="habit-title">Habit Tracker</h1>
        <button className="habit-add-btn" onClick={() => setShowAddModal(true)}>
          + Add
        </button>
      </div>

      <div className="habit-week-nav">
        <button className="habit-week-arrow" onClick={goToPreviousWeek}>‹</button>
        <div className="habit-week-label">
          <span>{getWeekLabel()}</span>
          {!isCurrentWeek && (
            <button className="habit-today-btn" onClick={goToCurrentWeek}>Today</button>
          )}
        </div>
        <button className="habit-week-arrow" onClick={goToNextWeek}>›</button>
      </div>

      {insights && (
        <div className="habit-insights-card">
          <div className="habit-insights-row">
            <div className="habit-insight-item">
              <span className="habit-insight-label">Total Habits</span>
              <span className="habit-insight-value">{insights.totalHabits}</span>
            </div>
            <div className="habit-insight-item">
              <span className="habit-insight-label">Completion Rate</span>
              <span className="habit-insight-value">{insights.overallRate}%</span>
            </div>
          </div>
          <div className="habit-insights-row">
            <div className="habit-insight-item">
              <span className="habit-insight-label">Most Consistent</span>
              <span className="habit-insight-value-small">{insights.mostConsistent}</span>
            </div>
            <div className="habit-insight-item">
              <span className="habit-insight-label">At Risk</span>
              <span className="habit-insight-value-small">{insights.atRisk.join(', ')}</span>
            </div>
          </div>
        </div>
      )}

      <div className="habit-list">
        {sortedHabits.length === 0 ? (
          <div className="habit-empty">
            <p>No habits yet. Tap "+ Add" to start tracking!</p>
          </div>
        ) : (
          sortedHabits.map(habit => (
            <div key={habit.id} className="habit-card">
              <button className="habit-menu-btn" onClick={() => toggleMenu(habit.id)}>
                ⋮
              </button>
              {openMenuId === habit.id && (
                <div className="habit-menu-dropdown">
                  <button className="habit-menu-item" onClick={() => openEditModal(habit)}>
                    ✏️ Edit
                  </button>
                  <button className="habit-menu-item" onClick={() => openReviewModal(habit)}>
                    📝 Review
                  </button>
                  <button className="habit-menu-item habit-menu-delete" onClick={() => handleDeleteHabit(habit.id)}>
                    🗑️ Delete
                  </button>
                </div>
              )}
              
              <div className="habit-info">
                <div className="habit-row">
                  <span className="habit-label">Identity</span>
                  <span className="habit-value identity-value">{habit.identity}</span>
                </div>
                <div className="habit-row">
                  <span className="habit-label">Trigger</span>
                  <span className="habit-value">{habit.trigger}</span>
                </div>
                <div className="habit-row">
                  <span className="habit-label">Action</span>
                  <span className="habit-value">{habit.action}</span>
                </div>
                {habit.twoMinVersion && (
                  <div className="habit-row">
                    <span className="habit-label">2-Min Start</span>
                    <span className="habit-value">{habit.twoMinVersion}</span>
                  </div>
                )}
                <div className="habit-row">
                  <span className="habit-label">Time & Place</span>
                  <span className="habit-value">{habit.time} at {habit.location}</span>
                </div>
                {habit.makeObvious && (
                  <div className="habit-row">
                    <span className="habit-label">Make Obvious</span>
                    <span className="habit-value">{habit.makeObvious}</span>
                  </div>
                )}
                {habit.reward && (
                  <div className="habit-row">
                    <span className="habit-label">Reward</span>
                    <span className="habit-value">{habit.reward}</span>
                  </div>
                )}
              </div>

              <div className="habit-stats">
                <div className="habit-stat">
                  <span className="habit-stat-label">Streak</span>
                  <span className="habit-stat-value">{getCurrentStreak(habit.id)}</span>
                </div>
                <div className="habit-stat">
                  <span className="habit-stat-label">This Week</span>
                  <span className="habit-stat-value">{getWeekCompletions(habit.id)}/7</span>
                </div>
                <div className="habit-stat">
                  <span className="habit-stat-label">Rate</span>
                  <span className="habit-stat-value">{getWeekPercentage(habit.id)}%</span>
                </div>
                <div className="habit-stat">
                  <span className="habit-stat-label">Best</span>
                  <span className="habit-stat-value">{getBestStreak(habit.id)}</span>
                </div>
                <div className="habit-stat">
                  <span className="habit-stat-label">Missed</span>
                  <span className="habit-stat-value">{getDaysMissedThisWeek(habit.id)}</span>
                </div>
              </div>

              <div className="habit-week-horizontal">
                {currentWeek.map((date, index) => {
                  const completed = isCompleted(habit.id, date);
                  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                  const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
                  const dayOfMonth = String(date.getDate()).padStart(2, '0');
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const dateLabel = `${dayOfMonth}/${month}`;
                  
                  // Check if date is before habit start date
                  const [year, month2, day] = habit.startDate.split('-').map(Number);
                  const startDate = new Date(year, month2 - 1, day);
                  startDate.setHours(0, 0, 0, 0);
                  const isBeforeStart = date < startDate;
                  
                  return (
                    <div key={index} className="habit-day-col">
                      <div className="habit-day-name">{dayNames[dayIndex]}</div>
                      <div className="habit-day-date">{dateLabel}</div>
                      <label className={`habit-checkbox-wrapper ${isBeforeStart ? 'disabled' : ''}`}>
                        <input
                          type="checkbox"
                          checked={completed}
                          onChange={() => !isBeforeStart && toggleCompletion(habit.id, date)}
                          className="habit-checkbox-input"
                          disabled={isBeforeStart}
                        />
                        <span className="habit-checkbox-custom"></span>
                      </label>
                    </div>
                  );
                })}
              </div>

            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="habit-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="habit-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="habit-modal-title">Add New Habit</h2>
            <div className="habit-form">
              <div className="habit-form-group">
                <label className="habit-form-label">Identity Statement *</label>
                <select
                  className="habit-form-input"
                  value={formIdentity}
                  onChange={(e) => {
                    setFormIdentity(e.target.value);
                    setShowCustomIdentity(e.target.value === 'custom');
                    if (e.target.value !== 'custom') {
                      setCustomIdentity('');
                    }
                  }}
                  required
                >
                  <option value="">Select identity...</option>
                  <option value="I am a person who exercises daily">I am a person who exercises daily</option>
                  <option value="I am a person who eats healthy">I am a person who eats healthy</option>
                  <option value="I am a person who reads daily">I am a person who reads daily</option>
                  <option value="I am a person who stays hydrated">I am a person who stays hydrated</option>
                  <option value="I am a person who meditates">I am a person who meditates</option>
                  <option value="I am a person who sleeps well">I am a person who sleeps well</option>
                  <option value="I am a person who learns continuously">I am a person who learns continuously</option>
                  <option value="I am a person who stays organized">I am a person who stays organized</option>
                  <option value="custom">Custom...</option>
                </select>
              </div>
              {showCustomIdentity && (
                <div className="habit-form-group">
                  <label className="habit-form-label">Custom Identity *</label>
                  <input
                    type="text"
                    className="habit-form-input"
                    placeholder="I am a person who..."
                    value={customIdentity}
                    onChange={(e) => setCustomIdentity(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="habit-form-group">
                <label className="habit-form-label">Trigger</label>
                <input
                  type="text"
                  className="habit-form-input"
                  placeholder="e.g., After Wakeup"
                  value={formTrigger}
                  onChange={(e) => setFormTrigger(e.target.value)}
                />
              </div>
              <div className="habit-form-group">
                <label className="habit-form-label">Action</label>
                <input
                  type="text"
                  className="habit-form-input"
                  placeholder="e.g., I will drink warm water"
                  value={formAction}
                  onChange={(e) => setFormAction(e.target.value)}
                />
              </div>
              <div className="habit-form-group">
                <label className="habit-form-label">2-Minute Version *</label>
                <input
                  type="text"
                  className="habit-form-input"
                  placeholder="e.g., Fill glass with water (make it easy to start)"
                  value={formTwoMinVersion}
                  onChange={(e) => setFormTwoMinVersion(e.target.value)}
                  required
                />
              </div>
              <div className="habit-form-group">
                <label className="habit-form-label">Time *</label>
                <input
                  type="time"
                  className="habit-form-input"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  required
                />
              </div>
              <div className="habit-form-group">
                <label className="habit-form-label">Location *</label>
                <select
                  className="habit-form-input"
                  value={formLocation}
                  onChange={(e) => {
                    setFormLocation(e.target.value);
                    setShowCustomLocation(e.target.value === 'custom');
                    if (e.target.value !== 'custom') {
                      setCustomLocation('');
                    }
                  }}
                  required
                >
                  <option value="">Select location</option>
                  <option value="Bedroom">Bedroom</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Living Room">Living Room</option>
                  <option value="Office">Office</option>
                  <option value="Gym">Gym</option>
                  <option value="Bathroom">Bathroom</option>
                  <option value="Outdoors">Outdoors</option>
                  <option value="Car">Car</option>
                  <option value="custom">Custom...</option>
                </select>
              </div>
              {showCustomLocation && (
                <div className="habit-form-group">
                  <label className="habit-form-label">Custom Location *</label>
                  <input
                    type="text"
                    className="habit-form-input"
                    placeholder="Enter custom location"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="habit-form-group">
                <label className="habit-form-label">Make It Obvious</label>
                <input
                  type="text"
                  className="habit-form-input"
                  placeholder="e.g., Put water bottle on nightstand"
                  value={formMakeObvious}
                  onChange={(e) => setFormMakeObvious(e.target.value)}
                />
              </div>
              <div className="habit-form-group">
                <label className="habit-form-label">Reward</label>
                <input
                  type="text"
                  className="habit-form-input"
                  placeholder="e.g., Check phone for 2 minutes"
                  value={formReward}
                  onChange={(e) => setFormReward(e.target.value)}
                />
              </div>
              <div className="habit-form-group">
                <label className="habit-form-label">Start Date *</label>
                <input
                  type="date"
                  className="habit-form-input"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="habit-modal-actions">
              <button className="habit-modal-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="habit-modal-save" onClick={handleAddHabit}>Add Habit</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="habit-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="habit-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="habit-modal-title">Edit Habit</h2>
            <div className="habit-form">
              <div className="habit-form-group">
                <label className="habit-form-label">Identity Statement *</label>
                <select
                  className="habit-form-input"
                  value={formIdentity}
                  onChange={(e) => {
                    setFormIdentity(e.target.value);
                    setShowCustomIdentity(e.target.value === 'custom');
                    if (e.target.value !== 'custom') {
                      setCustomIdentity('');
                    }
                  }}
                  required
                >
                  <option value="">Select identity...</option>
                  <option value="I am a person who exercises daily">I am a person who exercises daily</option>
                  <option value="I am a person who eats healthy">I am a person who eats healthy</option>
                  <option value="I am a person who reads daily">I am a person who reads daily</option>
                  <option value="I am a person who stays hydrated">I am a person who stays hydrated</option>
                  <option value="I am a person who meditates">I am a person who meditates</option>
                  <option value="I am a person who sleeps well">I am a person who sleeps well</option>
                  <option value="I am a person who learns continuously">I am a person who learns continuously</option>
                  <option value="I am a person who stays organized">I am a person who stays organized</option>
                  <option value="custom">Custom...</option>
                </select>
              </div>
              {showCustomIdentity && (
                <div className="habit-form-group">
                  <label className="habit-form-label">Custom Identity *</label>
                  <input
                    type="text"
                    className="habit-form-input"
                    placeholder="I am a person who..."
                    value={customIdentity}
                    onChange={(e) => setCustomIdentity(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="habit-form-group">
                <label className="habit-form-label">Trigger</label>
                <input
                  type="text"
                  className="habit-form-input"
                  value={formTrigger}
                  onChange={(e) => setFormTrigger(e.target.value)}
                />
              </div>
              <div className="habit-form-group">
                <label className="habit-form-label">Action</label>
                <input
                  type="text"
                  className="habit-form-input"
                  value={formAction}
                  onChange={(e) => setFormAction(e.target.value)}
                />
              </div>
              <div className="habit-form-group">
                <label className="habit-form-label">2-Minute Version *</label>
                <input
                  type="text"
                  className="habit-form-input"
                  placeholder="e.g., Fill glass with water (make it easy to start)"
                  value={formTwoMinVersion}
                  onChange={(e) => setFormTwoMinVersion(e.target.value)}
                  required
                />
              </div>
              <div className="habit-form-group">
                <label className="habit-form-label">Time *</label>
                <input
                  type="time"
                  className="habit-form-input"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  required
                />
              </div>
              <div className="habit-form-group">
                <label className="habit-form-label">Location *</label>
                <select
                  className="habit-form-input"
                  value={formLocation}
                  onChange={(e) => {
                    setFormLocation(e.target.value);
                    setShowCustomLocation(e.target.value === 'custom');
                    if (e.target.value !== 'custom') {
                      setCustomLocation('');
                    }
                  }}
                  required
                >
                  <option value="">Select location</option>
                  <option value="Bedroom">Bedroom</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Living Room">Living Room</option>
                  <option value="Office">Office</option>
                  <option value="Gym">Gym</option>
                  <option value="Bathroom">Bathroom</option>
                  <option value="Outdoors">Outdoors</option>
                  <option value="Car">Car</option>
                  <option value="custom">Custom...</option>
                </select>
              </div>
              {showCustomLocation && (
                <div className="habit-form-group">
                  <label className="habit-form-label">Custom Location *</label>
                  <input
                    type="text"
                    className="habit-form-input"
                    placeholder="Enter custom location"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="habit-form-group">
                <label className="habit-form-label">Make It Obvious</label>
                <input
                  type="text"
                  className="habit-form-input"
                  placeholder="e.g., Put water bottle on nightstand"
                  value={formMakeObvious}
                  onChange={(e) => setFormMakeObvious(e.target.value)}
                />
              </div>
              <div className="habit-form-group">
                <label className="habit-form-label">Reward</label>
                <input
                  type="text"
                  className="habit-form-input"
                  placeholder="e.g., Check phone for 2 minutes"
                  value={formReward}
                  onChange={(e) => setFormReward(e.target.value)}
                />
              </div>
              <div className="habit-form-group">
                <label className="habit-form-label">Start Date *</label>
                <input
                  type="date"
                  className="habit-form-input"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="habit-modal-actions">
              <button className="habit-modal-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="habit-modal-save" onClick={handleEditHabit}>Save Changes</button>
            </div>
            <div className="habit-modal-actions">
              <button className="habit-modal-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="habit-modal-save" onClick={handleEditHabit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="habit-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="habit-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="habit-modal-title">Review</h2>
            <p className="habit-modal-subtitle">{reviewingHabit?.identity}</p>
            <div className="habit-form">
              <div className="habit-form-group">
                <label className="habit-form-label">Notes & Reflections</label>
                <textarea
                  className="habit-form-textarea"
                  placeholder="Reflect on your progress, challenges, and wins..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows="5"
                />
              </div>
            </div>
            <div className="habit-modal-actions">
              <button className="habit-modal-cancel" onClick={() => setShowReviewModal(false)}>Cancel</button>
              <button className="habit-modal-save" onClick={handleSaveReview}>Save Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitTracker;
