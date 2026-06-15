import React, { useState, useEffect, useCallback, useRef } from 'react';
import habitService from '../services/habitService';
import todoService from '../services/todoService';
import './Dashboard.css';

const IST_TZ = 'Asia/Kolkata';
const PRIORITY_COLOR = { high: '#E24B4A', medium: '#F59E0B', low: '#639922' };
const PRIORITIES = [
  { id: 'high', label: 'High', color: '#E24B4A' },
  { id: 'medium', label: 'Medium', color: '#F59E0B' },
  { id: 'low', label: 'Low', color: '#639922' },
];
const CATEGORIES = ['Work', 'Personal', 'Health', 'Finance', 'Learning', 'Home', 'Other'];
const TODO_FILTERS = ['All', 'Today', 'Upcoming', 'High', 'Done'];

const getIstParts = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).reduce((a, p) => { a[p.type] = p.value; return a; }, {});
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
};

const formatDate = (d) => {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(d).reduce((a, p) => { a[p.type] = p.value; return a; }, {});
  return `${p.year}-${p.month}-${p.day}`;
};

const localDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const timeToMins = (t) => {
  if (!t || !t.includes(':')) return null;
  const [h, m] = t.split(':').map(Number);
  return Number.isNaN(h) || Number.isNaN(m) ? null : h * 60 + m;
};

const dueDateLabel = (dueDate) => {
  if (!dueDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00'); due.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / 86400000);
  if (diff < 0)   return { text: 'Overdue',  cls: 'overdue' };
  if (diff === 0) return { text: 'Today',    cls: 'today' };
  if (diff === 1) return { text: 'Tomorrow', cls: 'tomorrow' };
  return { text: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), cls: 'future' };
};

const getDueClass = (d) => dueDateLabel(d)?.cls || 'none';

const sortTasks = (items) => [...items].sort((a, b) => {
  const rank = { overdue: 0, today: 1, tomorrow: 2, future: 3, none: 4 };
  const ra = rank[getDueClass(a.dueDate)] ?? 4;
  const rb = rank[getDueClass(b.dueDate)] ?? 4;
  if (ra !== rb) return ra - rb;
  const pa = { high: 0, medium: 1, low: 2 }[a.priority] ?? 1;
  const pb = { high: 0, medium: 1, low: 2 }[b.priority] ?? 1;
  return pa - pb;
});

const badgeCls = (cls) => {
  if (cls === 'overdue') return 'db-badge db-badge-red';
  if (cls === 'today' || cls === 'tomorrow') return 'db-badge db-badge-amber';
  if (cls === 'future') return 'db-badge db-badge-green';
  return 'db-badge db-badge-gray';
};

const getDayLabel = (dateStr) => {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const date = new Date(y, mo - 1, d);
  const istToday = getIstParts().date;
  const [ty, tm, td] = istToday.split('-').map(Number);
  const today = new Date(ty, tm - 1, td);
  const diff = Math.round((date - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

const getHeroDate = () =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: IST_TZ });

// Time-aware greeting
const getGreeting = (minutes) => {
  if (minutes < 300)  return 'Good night';
  if (minutes < 720)  return 'Good morning';
  if (minutes < 1020) return 'Good afternoon';
  return 'Good evening';
};

const getMonthLabel = (offset) => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + offset, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const buildMonth = (offset) => {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + offset;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 1; i <= lastDay; i++) days.push(new Date(year, month, i));
  return days;
};

// Confetti burst — drops colored squares from the top
const Confetti = ({ active }) => {
  if (!active) return null;
  const pieces = Array.from({ length: 32 }, (_, i) => ({
    id: i,
    color: ['#6C63D5','#8B84E0','#FCD34D','#F87171','#34D399','#60A5FA'][i % 6],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.6}s`,
    size: `${6 + Math.random() * 8}px`,
    rotate: `${Math.random() * 360}deg`,
  }));
  return (
    <div className="db-confetti-wrap" aria-hidden="true">
      {pieces.map(p => (
        <div key={p.id} className="db-confetti-piece"
          style={{ left: p.left, animationDelay: p.delay, width: p.size, height: p.size,
            background: p.color, '--rotate': p.rotate }} />
      ))}
    </div>
  );
};

// Swipeable habit row
const SwipeHabitRow = ({ children, onSwipeRight, onSwipeLeft, className }) => {
  const startX = useRef(null);
  const el = useRef(null);
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; setSwiping(false); };
  const onTouchMove = (e) => {
    if (startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    if (Math.abs(dx) > 8) { setSwiping(true); setOffset(Math.max(-80, Math.min(80, dx))); }
  };
  const onTouchEnd = () => {
    if (offset > 55 && onSwipeRight) { onSwipeRight(); }
    else if (offset < -55 && onSwipeLeft) { onSwipeLeft(); }
    setOffset(0); setSwiping(false); startX.current = null;
  };

  return (
    <div className={`db-swipe-wrap ${className || ''}`} ref={el}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div className="db-swipe-hint-left" style={{ opacity: offset > 30 ? (offset - 30) / 50 : 0 }}>✓ Done</div>
      <div className="db-swipe-hint-right" style={{ opacity: offset < -30 ? (-offset - 30) / 50 : 0 }}>✗ Miss</div>
      <div className="db-swipe-inner" style={{ transform: `translateX(${offset}px)`, transition: swiping ? 'none' : 'transform .2s ease' }}>
        {children}
      </div>
    </div>
  );
};

const Dashboard = ({ user, onSignOut }) => {
  const [habitData, setHabitData] = useState({ habits: [], completions: {}, missed: {} });
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [istNow, setIstNow]       = useState(getIstParts);
  const [dayOffset, setDayOffset] = useState(0);
  const [todoFilter, setTodoFilter] = useState('All');
  const [view, setView]           = useState('today');
  const [monthOffset, setMonthOffset] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevAllDone = useRef(false);
  const [notifPerm, setNotifPerm] = useState(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );

  // Add habit modal
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [hAction, setHAction]     = useState('');
  const [hTime, setHTime]         = useState('');
  const [hTrigger, setHTrigger]   = useState('');
  const [hIdentity, setHIdentity] = useState('');
  const [hErr, setHErr]           = useState('');
  const [savingHabit, setSavingHabit] = useState(false);

  // Edit habit modal
  const [editingHabit, setEditingHabit] = useState(null);
  const [eHAction, setEHAction]   = useState('');
  const [eHTime, setEHTime]       = useState('');
  const [eHTrigger, setEHTrigger] = useState('');
  const [eHIdentity, setEHIdentity] = useState('');
  const [eHErr, setEHErr]         = useState('');

  // Add todo modal
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [tTitle, setTTitle]   = useState('');
  const [tPri, setTPri]       = useState('medium');
  const [tCat, setTCat]       = useState('');
  const [tDue, setTDue]       = useState('');
  const [tErr, setTErr]       = useState(false);

  // Edit todo modal
  const [editingTask, setEditingTask] = useState(null);
  const [eTitle, setETitle] = useState('');
  const [ePri, setEPri]   = useState('medium');
  const [eDue, setEDue]   = useState('');

  useEffect(() => {
    const unsub = habitService.subscribeToHabits((d) => {
      setHabitData(d || { habits: [], completions: {}, missed: {} });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = todoService.subscribeToTasks((d) => setTasks(d || []));
    return () => unsub();
  }, []);

  useEffect(() => {
    const tick = () => setIstNow(getIstParts());
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);

  // Notification check
  useEffect(() => {
    if (notifPerm !== 'granted' || loading) return;
    habitData.habits.forEach((habit) => {
      const sm = timeToMins(habit.time);
      if (sm === null) return;
      const todayCompletions = habitData.completions?.[istNow.date] || [];
      const todayMissed = habitData.missed?.[istNow.date] || [];
      if (todayCompletions.includes(habit.id) || todayMissed.includes(habit.id)) return;
      const diff = sm - istNow.minutes;
      if (diff > 0 || diff < -1) return;
      const key = `habit-notified-${habit.id}-${istNow.date}-${habit.time}`;
      if (localStorage.getItem(key)) return;
      const opts = { body: `${habit.action} at ${habit.time} IST`, tag: key };
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => reg.showNotification('Habit reminder', opts));
      } else {
        new Notification('Habit reminder', opts);
      }
      localStorage.setItem(key, 'sent');
    });
  }, [habitData, istNow, loading, notifPerm]);

  // ── Today view computed ──────────────────────────────────────────
  const currentDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  })();
  const currentDateStr = formatDate(currentDate);
  const isToday = dayOffset === 0;

  const completions = habitData.completions?.[currentDateStr] || [];
  const missed = habitData.missed?.[currentDateStr] || [];

  const scheduledHabits = habitData.habits.filter((h) => {
    if (!h.startDate) return true;
    const [y, m, d] = h.startDate.split('-').map(Number);
    return currentDate >= new Date(y, m - 1, d);
  });

  const incomplete = scheduledHabits.filter((h) => !completions.includes(h.id) && !missed.includes(h.id));
  const done       = scheduledHabits.filter((h) => completions.includes(h.id));
  const missedList = scheduledHabits.filter((h) => missed.includes(h.id));

  const total = scheduledHabits.length;
  const completedCount = done.length;
  const rate = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const circum = 2 * Math.PI * 28;
  const dash = (rate / 100) * circum;

  // Confetti: fire when ALL habits just became done
  const allDoneNow = total > 0 && incomplete.length === 0 && missedList.length === 0 && isToday;
  useEffect(() => {
    if (allDoneNow && !prevAllDone.current) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2800);
    }
    prevAllDone.current = allDoneNow;
  }, [allDoneNow]);

  // Streak at-risk: habit is incomplete and it's past 8pm IST
  const isAtRisk = (h) => isToday && istNow.minutes >= 1200 && incomplete.find(i => i.id === h.id);

  const getCurrentStreak = useCallback((id) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const habit = habitData.habits.find(h => h.id === id);
    if (!habit?.startDate) return 0;
    const [yr, mo, dy] = habit.startDate.split('-').map(Number);
    const startDate = new Date(yr, mo - 1, dy); startDate.setHours(0, 0, 0, 0);
    if (startDate > today) return 0;
    let streak = 0;
    const check = new Date(today);
    const todayStr = localDateStr(today);
    const todayDone = (habitData.completions?.[todayStr] || []).includes(id);
    if (!todayDone) check.setDate(check.getDate() - 1);
    while (check >= startDate) {
      const ds = localDateStr(check);
      if ((habitData.completions?.[ds] || []).includes(id)) { streak++; check.setDate(check.getDate() - 1); }
      else break;
    }
    return streak;
  }, [habitData]);

  const getBestStreak = useCallback((id) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const habit = habitData.habits.find(h => h.id === id);
    if (!habit?.startDate) return 0;
    const [yr, mo, dy] = habit.startDate.split('-').map(Number);
    const startDate = new Date(yr, mo - 1, dy); startDate.setHours(0, 0, 0, 0);
    if (startDate > today) return 0;
    let max = 0, cur = 0;
    const d = new Date(startDate);
    while (d <= today) {
      const ds = localDateStr(d);
      if ((habitData.completions?.[ds] || []).includes(id)) { cur++; max = Math.max(max, cur); }
      else cur = 0;
      d.setDate(d.getDate() + 1);
    }
    return max;
  }, [habitData]);

  const getMonthCompletions = useCallback((id) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const habit = habitData.habits.find(h => h.id === id);
    if (!habit?.startDate) return { completed: 0, total: 0 };
    const [yr, mo, dy] = habit.startDate.split('-').map(Number);
    const startDate = new Date(yr, mo - 1, dy); startDate.setHours(0, 0, 0, 0);
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1); firstDay.setHours(0, 0, 0, 0);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0); lastDay.setHours(0, 0, 0, 0);
    const countStart = startDate > firstDay ? startDate : firstDay;
    const countEnd = today < lastDay ? today : lastDay;
    if (countStart > countEnd) return { completed: 0, total: 0 };
    let completed = 0, total = 0;
    const d = new Date(countStart);
    while (d <= countEnd) {
      total++;
      if ((habitData.completions?.[localDateStr(d)] || []).includes(id)) completed++;
      d.setDate(d.getDate() + 1);
    }
    return { completed, total };
  }, [habitData, monthOffset]);

  const nextHabit = isToday
    ? [...incomplete]
        .filter((h) => timeToMins(h.time) !== null)
        .sort((a, b) => timeToMins(a.time) - timeToMins(b.time))[0] || incomplete[0]
    : null;

  const toggleCompletion = async (id) => {
    const newCompletions = { ...habitData.completions };
    const arr = [...(newCompletions[currentDateStr] || [])];
    const idx = arr.indexOf(id);
    if (idx === -1) arr.push(id); else arr.splice(idx, 1);
    newCompletions[currentDateStr] = arr;
    const next = { ...habitData, completions: newCompletions };
    setHabitData(next);
    await habitService.saveHabits(next);
  };

  const toggleMissed = async (id) => {
    const newMissed = { ...habitData.missed };
    const arr = [...(newMissed[currentDateStr] || [])];
    const idx = arr.indexOf(id);
    if (idx === -1) arr.push(id); else arr.splice(idx, 1);
    newMissed[currentDateStr] = arr;
    const next = { ...habitData, missed: newMissed };
    setHabitData(next);
    await habitService.saveHabits(next);
  };

  const toggleCalendarDay = async (habitId, date) => {
    const ds = localDateStr(date);
    const newCompletions = { ...habitData.completions };
    const arr = [...(newCompletions[ds] || [])];
    const idx = arr.indexOf(habitId);
    if (idx === -1) arr.push(habitId); else arr.splice(idx, 1);
    newCompletions[ds] = arr;
    const next = { ...habitData, completions: newCompletions };
    setHabitData(next);
    await habitService.saveHabits(next);
  };

  const deleteHabit = async (id) => {
    if (!window.confirm('Delete this habit?')) return;
    const next = { ...habitData, habits: habitData.habits.filter(h => h.id !== id) };
    setHabitData(next);
    await habitService.saveHabits(next);
  };

  const openEditHabit = (h) => {
    setEditingHabit(h);
    setEHAction(h.action || '');
    setEHTime(h.time || '');
    setEHTrigger(h.trigger || '');
    setEHIdentity(h.identity || '');
    setEHErr('');
  };

  const saveEditHabit = async () => {
    if (!eHAction.trim() || !eHTime) { setEHErr('Action and time are required.'); return; }
    const updated = { ...editingHabit, action: eHAction.trim(), time: eHTime, trigger: eHTrigger.trim(), identity: eHIdentity.trim() };
    const next = { ...habitData, habits: habitData.habits.map(h => h.id === editingHabit.id ? updated : h) };
    setHabitData(next);
    await habitService.saveHabits(next);
    setEditingHabit(null);
  };

  const saveTask = useCallback(async (next) => {
    setTasks(next);
    await todoService.saveTasks(next);
  }, []);

  const toggleTask = async (id) =>
    saveTask(tasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));

  const deleteTask = async (id) =>
    saveTask(tasks.filter((t) => t.id !== id));

  const [priPopupId, setPriPopupId] = useState(null);

  const setPriority = async (id, pri) => {
    setPriPopupId(null);
    await saveTask(tasks.map((t) => t.id === id ? { ...t, priority: pri } : t));
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setETitle(task.title || '');
    setEPri(task.priority || 'medium');
    setEDue(task.dueDate || '');
  };

  const saveEditTask = async () => {
    const title = eTitle.trim();
    if (!title) return;
    try {
      await saveTask(tasks.map((t) =>
        t.id === editingTask.id ? { ...t, title, priority: ePri, dueDate: eDue } : t
      ));
    } finally {
      setEditingTask(null);
    }
  };

  const addHabit = async () => {
    if (!hAction.trim() || !hTime) { setHErr('Action and time are required.'); return; }
    setSavingHabit(true);
    try {
      const today = getIstParts().date;
      const newHabit = {
        id: `habit_${Date.now()}`,
        action: hAction.trim(), time: hTime,
        trigger: hTrigger.trim(), identity: hIdentity.trim(),
        startDate: today, location: '', review: '',
      };
      const next = { ...habitData, habits: [...habitData.habits, newHabit] };
      setHabitData(next);
      await habitService.saveHabits(next);
      setShowAddHabit(false);
      setHAction(''); setHTime(''); setHTrigger(''); setHIdentity(''); setHErr('');
    } finally {
      setSavingHabit(false);
    }
  };

  const addTodo = async () => {
    if (!tTitle.trim()) { setTErr(true); setTimeout(() => setTErr(false), 500); return; }
    await saveTask([...tasks, {
      id: `task_${Date.now()}`,
      title: tTitle.trim(), priority: tPri, category: tCat, dueDate: tDue,
      completed: false, createdAt: new Date().toISOString(),
    }]);
    setShowAddTodo(false);
    setTTitle(''); setTPri('medium'); setTCat(''); setTDue('');
  };

  const enableNotifications = async () => {
    if (typeof Notification === 'undefined') return;
    const p = await Notification.requestPermission();
    setNotifPerm(p);
  };

  // Todo lists
  const activeTasks = sortTasks(tasks.filter((t) => !t.completed));
  const completedTasks = sortTasks(tasks.filter((t) => t.completed));
  const dueToday  = activeTasks.filter((t) => getDueClass(t.dueDate) === 'today').length;
  const overdue   = activeTasks.filter((t) => getDueClass(t.dueDate) === 'overdue').length;

  const visibleTasks = todoFilter === 'Done' ? completedTasks : activeTasks.filter((t) => {
    const dc = getDueClass(t.dueDate);
    if (todoFilter === 'Today') return dc === 'today' || dc === 'overdue';
    if (todoFilter === 'Upcoming') return dc === 'tomorrow' || dc === 'future';
    if (todoFilter === 'High') return (t.priority || 'medium') === 'high';
    return true;
  });

  // Weekly view
  const monthDays = buildMonth(monthOffset);
  const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
  const sortedHabits = [...habitData.habits].sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'));

  const weeklyOverallRate = (() => {
    let total = 0, comp = 0;
    habitData.habits.forEach(h => {
      const m = getMonthCompletions(h.id);
      total += m.total; comp += m.completed;
    });
    return total > 0 ? Math.round((comp / total) * 100) : 0;
  })();

  const displayName = user?.displayName?.split(' ')[0] || 'there';
  const greeting = getGreeting(istNow.minutes);

  if (loading) return <div className="db"><div className="habit-loading">Loading…</div></div>;

  const nextTimeTxt = nextHabit
    ? (() => {
        const sm = timeToMins(nextHabit.time);
        if (sm === null) return nextHabit.time;
        const diff = sm - istNow.minutes;
        if (diff <= 0) return `${nextHabit.time} IST · Due now`;
        if (diff < 60) return `${nextHabit.time} IST · In ${diff} min`;
        const h = Math.floor(diff / 60), m = diff % 60;
        return `${nextHabit.time} IST · In ${h}h${m ? ` ${m}m` : ''}`;
      })()
    : '';

  const renderCalendar = (habit) => {
    const firstDay = monthDays[0];
    const firstWeekday = firstDay.getDay();
    const startPad = firstWeekday === 0 ? 6 : firstWeekday - 1;
    const cells = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    monthDays.forEach(d => cells.push(d));
    while (cells.length % 7 !== 0) cells.push(null);

    const [yr, mo, dy] = (habit.startDate || '1970-01-01').split('-').map(Number);
    const habitStart = new Date(yr, mo - 1, dy); habitStart.setHours(0, 0, 0, 0);

    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    return (
      <div className="db-cal">
        <div className="db-cal-hd-row">
          {['M','T','W','T','F','S','S'].map((d, i) => <div key={i} className="db-cal-hd">{d}</div>)}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="db-cal-row">
            {week.map((date, di) => {
              if (!date) return <div key={di} className="db-cal-cell empty" />;
              const ds = localDateStr(date);
              const isComp = (habitData.completions?.[ds] || []).includes(habit.id);
              const isFuture = date > todayDate;
              const isBeforeStart = date < habitStart;
              const disabled = isFuture || isBeforeStart;
              const isItToday = localDateStr(date) === localDateStr(todayDate);
              return (
                <button
                  key={di}
                  className={`db-cal-cell${isComp ? ' done' : ''}${disabled ? ' dim' : ''}${isItToday ? ' cal-today' : ''}`}
                  onClick={() => !disabled && toggleCalendarDay(habit.id, date)}
                  disabled={disabled}
                  aria-label={`${ds}${isComp ? ' completed' : ''}`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="db">
      <Confetti active={showConfetti} />

      {/* Hero */}
      <div className="db-hero">
        <div className="db-hero-top-row">
          <div>
            <div className="db-hero-date">{getHeroDate()}</div>
            <div className="db-hero-greeting">{greeting}, {displayName} 👋</div>
          </div>
          {onSignOut && (
            <button className="db-signout-btn" onClick={onSignOut} title="Sign out">↪</button>
          )}
        </div>

        <div className="db-view-tabs">
          <button className={`db-view-tab${view === 'today' ? ' active' : ''}`} onClick={() => setView('today')}>Today</button>
          <button className={`db-view-tab${view === 'weekly' ? ' active' : ''}`} onClick={() => setView('weekly')}>Weekly</button>
        </div>

        {view === 'today' && (
          <div className="db-hero-today">
            {/* Centered ring */}
            <div className="db-ring-wrap">
              <svg viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="38" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="8" />
                <circle
                  cx="48" cy="48" r="38" fill="none" stroke="#fff" strokeWidth="8"
                  strokeDasharray={`${(rate / 100) * 2 * Math.PI * 38} ${2 * Math.PI * 38}`}
                  strokeDashoffset={2 * Math.PI * 38 / 4}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray .5s ease' }}
                />
              </svg>
              <div className="db-ring-center">
                <span className="db-ring-pct">{rate}%</span>
                <span className="db-ring-sub">complete</span>
              </div>
            </div>

            {/* Stat row below the ring */}
            <div className="db-hero-stat-row">
              <div className="db-hero-stat">
                <div className="db-hero-stat-val">{completedCount}</div>
                <div className="db-hero-stat-lbl">Done</div>
              </div>
              <div className="db-hero-stat-divider" />
              <div className="db-hero-stat">
                <div className="db-hero-stat-val">{incomplete.length}</div>
                <div className="db-hero-stat-lbl">Left</div>
              </div>
              <div className="db-hero-stat-divider" />
              <div className="db-hero-stat">
                <div className={`db-hero-stat-val${overdue > 0 ? ' warn' : ''}`}>{dueToday + overdue}</div>
                <div className="db-hero-stat-lbl">Tasks due</div>
              </div>
              <div className="db-hero-stat-divider" />
              <div className="db-hero-stat">
                <div className={`db-hero-stat-val${overdue > 0 ? ' danger' : ''}`}>{overdue}</div>
                <div className="db-hero-stat-lbl">Overdue</div>
              </div>
            </div>
          </div>
        )}

        {view === 'weekly' && (
          <div className="db-hero-weekly">
            <div className="db-hero-stat-grid">
              <div className="db-hero-grid-stat">
                <div className="db-hero-grid-val">{habitData.habits.length}</div>
                <div className="db-hero-grid-lbl">Total habits</div>
              </div>
              <div className="db-hero-grid-stat accent">
                <div className="db-hero-grid-val">{weeklyOverallRate}%</div>
                <div className="db-hero-grid-lbl">Month rate</div>
              </div>
              <div className="db-hero-grid-stat">
                <div className="db-hero-grid-val">
                  {habitData.habits.reduce((best, h) => Math.max(best, getCurrentStreak(h.id)), 0)}
                </div>
                <div className="db-hero-grid-lbl">🔥 Top streak</div>
              </div>
              <div className="db-hero-grid-stat">
                <div className="db-hero-grid-val">
                  {(() => {
                    let total = 0, comp = 0;
                    habitData.habits.forEach(h => { const m = getMonthCompletions(h.id); total += m.total; comp += m.completed; });
                    return `${comp}/${total}`;
                  })()}
                </div>
                <div className="db-hero-grid-lbl">This month</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="db-scroll" onClick={() => setPriPopupId(null)}>

        {/* ── TODAY VIEW ─────────────────────────────── */}
        {view === 'today' && (
          <>
            <div className="db-day-nav">
              <button className="db-day-arrow" onClick={() => setDayOffset((p) => p - 1)}>‹</button>
              <div className="db-day-label">
                <span>{getDayLabel(currentDateStr)}</span>
                {!isToday && <button className="db-today-btn" onClick={() => setDayOffset(0)}>Today</button>}
              </div>
              <button className="db-day-arrow" onClick={() => setDayOffset((p) => p + 1)}>›</button>
            </div>

            {/* Up Next */}
            {nextHabit && isToday && (
              <div className="db-section">
                <div className="db-section-hd">
                  <span className="db-section-title">Up next</span>
                  <span className="db-section-time">{istNow.time} IST</span>
                </div>
                <div className="db-next-card">
                  <div className="db-next-icon">⚡</div>
                  <div className="db-next-body">
                    <div className="db-next-kicker">Next habit</div>
                    <div className="db-next-title">{nextHabit.action}</div>
                    <div className="db-next-time">{nextTimeTxt}{nextHabit.trigger ? ` · ${nextHabit.trigger}` : ''}</div>
                  </div>
                  <button className="db-next-check" onClick={() => toggleCompletion(nextHabit.id)} aria-label="Mark as done">✓</button>
                </div>
              </div>
            )}

            {/* IST bell row */}
            <div className="db-ist-row">
              <span className="db-ist-copy">IST reminders · {istNow.time}</span>
              {notifPerm === 'default' && <button className="db-ist-btn" onClick={enableNotifications}>Enable alerts</button>}
              {notifPerm === 'granted' && <span className="db-ist-on">On</span>}
              {notifPerm === 'denied'  && <span className="db-ist-blocked">Blocked</span>}
            </div>

            {/* Habits section */}
            <div className="db-section" style={{ marginTop: 12 }}>
              <div className="db-section-hd">
                <span className="db-section-title">Habits</span>
                <button className="db-add-btn" onClick={() => setShowAddHabit(true)}>+ Add</button>
              </div>

              {scheduledHabits.length === 0 ? (
                <div className="db-empty-state">
                  <div className="db-empty-icon">🌱</div>
                  <div className="db-empty-title">No habits yet</div>
                  <div className="db-empty-sub">Start small — one habit changes everything.</div>
                  <button className="db-empty-btn" onClick={() => setShowAddHabit(true)}>Add your first habit</button>
                </div>
              ) : (
                <div className="db-habits">
                  {incomplete.map((h) => {
                    const atRisk = isAtRisk(h);
                    return (
                      <SwipeHabitRow key={h.id} onSwipeRight={() => toggleCompletion(h.id)} onSwipeLeft={() => toggleMissed(h.id)}>
                        <div className={`db-habit-row${atRisk ? ' at-risk' : ''}`}>
                          {h.trigger && (
                            <div className="db-habit-cue">
                              <span className="db-cue-label">After</span>
                              <span className="db-cue-text">{h.trigger.replace(/^after\s+/i, '')}</span>
                            </div>
                          )}
                          <div className="db-habit-action-row">
                            <button className="db-habit-check" onClick={() => toggleCompletion(h.id)} aria-label="Mark done">✓</button>
                            <div className="db-habit-action-body">
                              <div className="db-habit-name">
                                {h.action}
                                {atRisk && <span className="db-risk-tag">Don't break streak!</span>}
                              </div>
                              <div className="db-habit-meta">
                                {h.time}{h.identity ? ` · ${h.identity}` : ''}
                              </div>
                            </div>
                          </div>
                          <div className="db-habit-footer">
                            <span className="db-hf-streak">🔥 {getCurrentStreak(h.id)} day streak</span>
                            <button className="db-hf-btn db-hf-edit" onClick={() => openEditHabit(h)}>✎ Edit</button>
                            <button className="db-hf-btn db-hf-miss" onClick={() => toggleMissed(h.id)}>✗ Missed</button>
                          </div>
                        </div>
                      </SwipeHabitRow>
                    );
                  })}

                  {done.length > 0 && (
                    <div className="db-done-count">
                      ✓ {done.length} completed
                    </div>
                  )}

                  {missedList.map((h) => (
                    <div key={h.id} className="db-habit-row missed-row">
                      {h.trigger && (
                        <div className="db-habit-cue missed-cue">
                          <span className="db-cue-label">After</span>
                          <span className="db-cue-text">{h.trigger}</span>
                        </div>
                      )}
                      <div className="db-habit-action-row">
                        <button className="db-habit-check missed-check" onClick={() => toggleMissed(h.id)} aria-label="Undo missed">↶</button>
                        <div className="db-habit-action-body">
                          <div className="db-habit-name">{h.action}</div>
                          <div className="db-habit-meta">{h.time}</div>
                        </div>
                      </div>
                      <div className="db-habit-footer">
                        <span className="db-hf-streak db-hf-missed-label">✗ Missed</span>
                        <button className="db-hf-btn db-hf-edit" onClick={() => openEditHabit(h)}>✎ Edit</button>
                        <button className="db-hf-btn db-hf-undo" onClick={() => toggleCompletion(h.id)}>↶ Done</button>
                      </div>
                    </div>
                  ))}

                  {allDoneNow && (
                    <div className="db-all-done">
                      🎉 All habits done for today!
                    </div>
                  )}
                </div>
              )}
            </div>

            <hr className="db-divider" />

            {/* To-do section */}
            <div className="db-section" style={{ marginTop: 16 }}>
              <div className="db-section-hd">
                <span className="db-section-title">To-do</span>
                <button className="db-add-btn" onClick={() => setShowAddTodo(true)}>+ Add</button>
              </div>

              <div className="db-todo-stats">
                <div className="db-stat accent">
                  <div className="db-stat-val">{activeTasks.length}</div>
                  <div className="db-stat-lbl">Open tasks</div>
                </div>
                <div className="db-stat">
                  <div className="db-stat-val">{overdue}</div>
                  <div className="db-stat-lbl">Overdue</div>
                </div>
              </div>

              <div className="db-filters">
                {TODO_FILTERS.map((f) => (
                  <button key={f} className={`db-chip${todoFilter === f ? ' active' : ''}`} onClick={() => setTodoFilter(f)}>{f}</button>
                ))}
              </div>

              {tasks.length === 0 ? (
                <div className="db-empty-state">
                  <div className="db-empty-icon">✅</div>
                  <div className="db-empty-title">No tasks yet</div>
                  <div className="db-empty-sub">Add what's on your mind and get it done.</div>
                  <button className="db-empty-btn" onClick={() => setShowAddTodo(true)}>Add your first task</button>
                </div>
              ) : (
                <div className="db-tasks">
                  {visibleTasks.length === 0 ? (
                    <div className="db-empty">
                      {todoFilter === 'Done' ? 'No completed tasks yet.' : 'No tasks match this filter.'}
                    </div>
                  ) : (
                    (() => {
                      const renderTask = (task) => {
                        const di = dueDateLabel(task.dueDate);
                        const dc = getDueClass(task.dueDate);
                        return (
                          <div
                            key={task.id}
                            className={`db-task-row${dc === 'overdue' ? ' overdue-row' : ''}${task.completed ? ' done-task' : ''}`}
                          >
                            <div className="db-task-body">
                              <button
                                className={`db-task-chk${task.completed ? ' done-chk' : ''}`}
                                onClick={() => toggleTask(task.id)}
                                aria-label={task.completed ? 'Mark active' : 'Mark done'}
                              >
                                {task.completed ? '✓' : ''}
                              </button>
                              <div className="db-task-content">
                                <div className="db-task-title">{task.title}</div>
                                {(di || task.category) && (
                                  <div className="db-task-badges">
                                    {di && <span className={badgeCls(di.cls)}>{di.text}</span>}
                                    {task.category && <span className="db-badge db-badge-gray">{task.category}</span>}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="db-task-footer">
                              {(() => {
                                const pri = task.priority || 'medium';
                                const col = PRIORITY_COLOR[pri];
                                const isOpen = priPopupId === task.id;
                                return (
                                  <span className="db-pri-pill-wrap">
                                    <button
                                      className="db-pri-pill"
                                      style={{ color: col, background: col + '1A' }}
                                      onClick={(e) => { e.stopPropagation(); setPriPopupId(isOpen ? null : task.id); }}
                                      aria-label={`Priority: ${pri}`}
                                    >
                                      {pri.charAt(0).toUpperCase() + pri.slice(1)}
                                    </button>
                                    {isOpen && (
                                      <span className="db-pri-popup" onClick={(e) => e.stopPropagation()}>
                                        {PRIORITIES.map(p => (
                                          <button
                                            key={p.id}
                                            className={`db-pri-option${pri === p.id ? ' active' : ''}`}
                                            style={{ color: p.color }}
                                            onClick={(e) => { e.stopPropagation(); setPriority(task.id, p.id); }}
                                          >
                                            {p.label}
                                          </button>
                                        ))}
                                      </span>
                                    )}
                                  </span>
                                );
                              })()}
                              <button className="db-tf-btn db-tf-edit" onClick={() => openEditTask(task)}>✎ Edit</button>
                              <button className="db-tf-btn db-tf-delete" onClick={() => deleteTask(task.id)}>✕ Delete</button>
                            </div>
                          </div>
                        );
                      };

                      if (todoFilter === 'Done') {
                        return visibleTasks.map(renderTask);
                      }

                      const groups = [
                        { key: 'high',   label: 'High',   color: '#E24B4A', tasks: visibleTasks.filter(t => (t.priority || 'medium') === 'high') },
                        { key: 'medium', label: 'Medium', color: '#F59E0B', tasks: visibleTasks.filter(t => (t.priority || 'medium') === 'medium') },
                        { key: 'low',    label: 'Low',    color: '#639922', tasks: visibleTasks.filter(t => (t.priority || 'medium') === 'low') },
                      ].filter(g => g.tasks.length > 0);

                      return groups.map(g => (
                        <div key={g.key}>
                          <div className="db-priority-group-hd">
                            <span className="db-priority-dot" style={{ background: g.color }} />
                            <span className="db-priority-label">{g.label}</span>
                            <span className="db-priority-count">{g.tasks.length}</span>
                          </div>
                          {g.tasks.map(renderTask)}
                        </div>
                      ));
                    })()
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── WEEKLY VIEW ─────────────────────────────── */}
        {view === 'weekly' && (
          <>
            <div className="db-day-nav">
              <button className="db-day-arrow" onClick={() => setMonthOffset(p => p - 1)}>‹</button>
              <div className="db-day-label">
                <span>{getMonthLabel(monthOffset)}</span>
                {monthOffset !== 0 && <button className="db-today-btn" onClick={() => setMonthOffset(0)}>This month</button>}
              </div>
              <button className="db-day-arrow" onClick={() => setMonthOffset(p => p + 1)}>›</button>
            </div>

            <div className="db-section" style={{ marginTop: 4 }}>
              <div className="db-section-hd">
                <span className="db-section-title">All habits</span>
                <button className="db-add-btn" onClick={() => setShowAddHabit(true)}>+ Add</button>
              </div>
            </div>

            {sortedHabits.length === 0 ? (
              <div className="db-section">
                <div className="db-empty-state">
                  <div className="db-empty-icon">🌱</div>
                  <div className="db-empty-title">No habits yet</div>
                  <div className="db-empty-sub">Start small — one habit changes everything.</div>
                  <button className="db-empty-btn" onClick={() => setShowAddHabit(true)}>Add your first habit</button>
                </div>
              </div>
            ) : (
              sortedHabits.map(habit => {
                const mc = getMonthCompletions(habit.id);
                const cur = getCurrentStreak(habit.id);
                const best = getBestStreak(habit.id);
                return (
                  <div key={habit.id} className="db-week-card">
                    <div className="db-week-card-hd">
                      <div className="db-week-habit-info">
                        <div className="db-week-habit-name">{habit.action}</div>
                        {habit.time && <div className="db-week-habit-meta">{habit.time} IST{habit.identity ? ` · ${habit.identity}` : ''}</div>}
                      </div>
                      <button className="db-week-delete" onClick={() => openEditHabit(habit)} aria-label="Edit habit">✎</button>
                    </div>
                    <div className="db-week-stats">
                      <div className="db-week-stat">
                        <div className="db-week-stat-val">🔥 {cur}</div>
                        <div className="db-week-stat-lbl">Streak</div>
                      </div>
                      <div className="db-week-stat">
                        <div className="db-week-stat-val">{best}</div>
                        <div className="db-week-stat-lbl">Best</div>
                      </div>
                      <div className="db-week-stat">
                        <div className="db-week-stat-val">{mc.completed}/{mc.total}</div>
                        <div className="db-week-stat-lbl">This month</div>
                      </div>
                    </div>
                    {renderCalendar(habit)}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      {/* Edit Habit Modal */}
      {editingHabit && (
        <div className="db-modal-overlay" onClick={() => setEditingHabit(null)}>
          <div className="db-modal" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-hd">
              <span className="db-modal-title">Edit habit</span>
              <button className="db-modal-close" onClick={() => setEditingHabit(null)}>✕</button>
            </div>
            {eHErr && <div style={{ color: '#B91C1C', fontSize: 13, marginBottom: 8 }}>{eHErr}</div>}
            <label className="db-form-label">Habit *</label>
            <input className="db-form-input" placeholder="e.g. Morning run" value={eHAction}
              onChange={(e) => setEHAction(e.target.value)} autoFocus />
            <label className="db-form-label">Time (IST) *</label>
            <input className="db-form-input" type="time" value={eHTime}
              onChange={(e) => setEHTime(e.target.value)} />
            <label className="db-form-label">Trigger (after what?)</label>
            <input className="db-form-input" placeholder="e.g. morning alarm" value={eHTrigger}
              onChange={(e) => setEHTrigger(e.target.value)} />
            <label className="db-form-label">Identity (I am…)</label>
            <input className="db-form-input" placeholder="e.g. I am an athlete" value={eHIdentity}
              onChange={(e) => setEHIdentity(e.target.value)} />
            <div className="db-modal-actions" style={{ justifyContent: 'space-between' }}>
              <button className="db-modal-cancel" style={{ color: '#E24B4A' }}
                onClick={() => { deleteHabit(editingHabit.id); setEditingHabit(null); }}>
                Delete
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="db-modal-cancel" onClick={() => setEditingHabit(null)}>Cancel</button>
                <button className="db-modal-save" onClick={saveEditHabit}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Habit Modal */}
      {showAddHabit && (
        <div className="db-modal-overlay" onClick={() => setShowAddHabit(false)}>
          <div className="db-modal" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-hd">
              <span className="db-modal-title">New habit</span>
              <button className="db-modal-close" onClick={() => setShowAddHabit(false)}>✕</button>
            </div>
            {hErr && <div style={{ color: '#B91C1C', fontSize: 13, marginBottom: 8 }}>{hErr}</div>}
            <label className="db-form-label">What's the habit? *</label>
            <input className="db-form-input" placeholder="e.g. Morning run" value={hAction}
              onChange={(e) => setHAction(e.target.value)} autoFocus />
            <label className="db-form-label">Time (IST) *</label>
            <input className="db-form-input" type="time" value={hTime}
              onChange={(e) => setHTime(e.target.value)} />
            <label className="db-form-label">Trigger (after what?)</label>
            <input className="db-form-input" placeholder="e.g. After morning alarm" value={hTrigger}
              onChange={(e) => setHTrigger(e.target.value)} />
            <label className="db-form-label">Identity (I am…)</label>
            <input className="db-form-input" placeholder="e.g. I am an athlete" value={hIdentity}
              onChange={(e) => setHIdentity(e.target.value)} />
            <div className="db-modal-actions">
              <button className="db-modal-cancel" onClick={() => setShowAddHabit(false)}>Cancel</button>
              <button className="db-modal-save" onClick={addHabit} disabled={savingHabit}>
                {savingHabit ? 'Saving…' : 'Add habit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="db-modal-overlay" onClick={() => setEditingTask(null)}>
          <div className="db-modal" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-hd">
              <span className="db-modal-title">Edit task</span>
              <button className="db-modal-close" onClick={() => setEditingTask(null)}>✕</button>
            </div>
            <label className="db-form-label">Task name</label>
            <input className="db-form-input" type="text" value={eTitle}
              onChange={(e) => setETitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveEditTask()} />
            <label className="db-form-label">Priority</label>
            <div className="db-pri-chips">
              {PRIORITIES.map((p) => (
                <button key={p.id}
                  className={`db-pri-chip${ePri === p.id ? ' active' : ''}`}
                  style={ePri === p.id ? { color: p.color, borderColor: p.color, background: p.color + '18' } : {}}
                  onClick={() => setEPri(p.id)}>
                  {p.label}
                </button>
              ))}
            </div>
            <label className="db-form-label">Deadline</label>
            <input className="db-form-input" type="date" value={eDue}
              onChange={(e) => setEDue(e.target.value)} />
            {eDue && (
              <button className="db-clear-date" onClick={() => setEDue('')}>✕ Clear deadline</button>
            )}
            <div className="db-modal-actions">
              <button className="db-modal-cancel" onClick={() => setEditingTask(null)}>Cancel</button>
              <button className="db-modal-save" onClick={saveEditTask}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Todo Modal */}
      {showAddTodo && (
        <div className="db-modal-overlay" onClick={() => setShowAddTodo(false)}>
          <div className="db-modal" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-hd">
              <span className="db-modal-title">New task</span>
              <button className="db-modal-close" onClick={() => setShowAddTodo(false)}>✕</button>
            </div>
            <label className="db-form-label">Task *</label>
            <input className={`db-form-input${tErr ? ' err' : ''}`} placeholder="What needs to be done?"
              value={tTitle} onChange={(e) => setTTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTodo()} autoFocus />
            <label className="db-form-label">Priority</label>
            <div className="db-pri-chips">
              {PRIORITIES.map((p) => (
                <button key={p.id}
                  className={`db-pri-chip${tPri === p.id ? ' active' : ''}`}
                  style={tPri === p.id ? { color: p.color, borderColor: p.color, background: p.color + '18' } : {}}
                  onClick={() => setTPri(p.id)}>
                  {p.label}
                </button>
              ))}
            </div>
            <label className="db-form-label">Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CATEGORIES.map((c) => (
                <button key={c}
                  className={`db-pri-chip${tCat === c ? ' active' : ''}`}
                  style={tCat === c ? { color: '#6C63D5', borderColor: '#6C63D5', background: '#EEEDFE' } : {}}
                  onClick={() => setTCat(tCat === c ? '' : c)}>
                  {c}
                </button>
              ))}
            </div>
            <label className="db-form-label">Due date</label>
            <input className="db-form-input" type="date" value={tDue}
              onChange={(e) => setTDue(e.target.value)} />
            <div className="db-modal-actions">
              <button className="db-modal-cancel" onClick={() => setShowAddTodo(false)}>Cancel</button>
              <button className="db-modal-save" onClick={addTodo}>Add task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
