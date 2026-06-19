import React, { useState, useEffect, useCallback, useRef } from 'react';
import habitService from '../services/habitService';
import KanbanTodo from './KanbanTodo';
import './Dashboard.css';

const IST_TZ = 'Asia/Kolkata';
const PRIORITY_COLOR = { high: '#E24B4A', medium: '#F59E0B', low: '#639922' };
const PRIORITIES = [
  { id: 'high', label: 'High', color: '#E24B4A' },
  { id: 'medium', label: 'Medium', color: '#F59E0B' },
  { id: 'low', label: 'Low', color: '#639922' },
];
const CATEGORIES = ['Work', 'Personal', 'Health', 'Finance', 'Learning', 'Home', 'Other'];
const CONTEXTS = ['@home', '@work', '@phone', '@computer', '@outside', '@errands'];
const ENERGY_LEVELS = [{ id: 'high', label: '⚡ High energy' }, { id: 'low', label: '🌿 Low energy' }];
const DIFFICULTIES = [{ id: 'easy', label: 'Easy', color: '#16A34A' }, { id: 'medium', label: 'Medium', color: '#F59E0B' }, { id: 'hard', label: 'Hard', color: '#E24B4A' }];

const TIME_GROUPS = [
  { id: 'morning',   label: 'Morning',   icon: '🌅', accentColor: '#F59E0B' },
  { id: 'afternoon', label: 'Afternoon', icon: '☀️',  accentColor: '#3B82F6' },
  { id: 'evening',   label: 'Evening',   icon: '🌙', accentColor: '#6C63D5' },
];

const getTimeGroup = (time) => {
  const m = timeToMins(time);
  if (m === null || m < 720) return 'morning';
  if (m < 1020) return 'afternoon';
  return 'evening';
};

// Build linear chains from a flat habit list using afterHabitId links.
// Returns [{type:'chain'|'standalone', items:[habit,...]}]
const buildHabitChains = (habits) => {
  const map = new Map(habits.map(h => [h.id, h]));
  const hasParent = new Set(
    habits.filter(h => h.afterHabitId && map.has(h.afterHabitId)).map(h => h.id)
  );
  const isParent = new Set(
    habits.filter(h => h.afterHabitId && map.has(h.afterHabitId)).map(h => h.afterHabitId)
  );
  const visited = new Set();
  const groups = [];

  habits.forEach(h => {
    if (visited.has(h.id)) return;
    if (isParent.has(h.id) && !hasParent.has(h.id)) {
      // Chain root: build full chain by following afterHabitId links
      const chain = [];
      let cur = h;
      while (cur && !visited.has(cur.id)) {
        chain.push(cur);
        visited.add(cur.id);
        cur = habits.find(x => x.afterHabitId === cur.id);
      }
      groups.push({ type: 'chain', items: chain });
    } else if (!hasParent.has(h.id)) {
      // Standalone habit (not part of any chain)
      visited.add(h.id);
      groups.push({ type: 'standalone', items: [h] });
    }
  });

  return groups;
};

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


// ── Add Habit Wizard (Atoms sentence-builder flow) ───────────────────────────
const AHW_STEPS = [
  { key: 'action',    color: '#6C63D5', label: 'I will…',               placeholder: 'e.g. do 10 push-ups',           required: true  },
  { key: 'frequency', color: '#8B5CF6', label: 'How often?',            placeholder: '',                               required: true  },
  { key: 'time',      color: '#F59E0B', label: 'at…',                   placeholder: 'e.g. 7:00 AM',                  required: false },
  { key: 'location',  color: '#F59E0B', label: 'in…',                   placeholder: 'e.g. the living room',          required: false },
  { key: 'identity',  color: '#7C3AED', label: 'so that I can become…', placeholder: 'e.g. a healthy, active person', required: false },
  { key: 'stack',     color: '#0EA5E9', label: 'After…',                placeholder: 'After I…',                     required: false },
  { key: 'reward',    color: '#16A34A', label: 'Reward…',               placeholder: 'Afterwards I will…',            required: false },
];

const FREQ_OPTIONS = [
  { key: 'daily',    label: 'Daily',    desc: 'Every day' },
  { key: 'weekdays', label: 'Weekdays', desc: 'Mon – Fri' },
  { key: 'weekly',   label: 'Weekly',   desc: 'Once a week' },
  { key: 'monthly',  label: 'Monthly',  desc: 'Once a month' },
];

const ACTION_SUGGESTIONS = [
  { icon: '💧', text: 'drink a glass of water' },
  { icon: '💪', text: 'do 10 push-ups' },
  { icon: '🧘', text: 'meditate for 2 minutes' },
  { icon: '📖', text: 'read one page' },
  { icon: '🚶', text: 'go for a 5-min walk' },
  { icon: '✍️', text: 'write in my journal' },
  { icon: '🌬️', text: 'take 5 deep breaths' },
  { icon: '🧹', text: 'tidy one small area' },
  { icon: '🍎', text: 'eat a piece of fruit' },
  { icon: '📵', text: 'put my phone face-down' },
];

const TIME_SUGGESTIONS = [
  { icon: '🌅', label: 'Early morning', value: '06:00' },
  { icon: '☀️', label: 'Morning',       value: '08:00' },
  { icon: '🌤️', label: 'Midday',        value: '12:00' },
  { icon: '🌇', label: 'Afternoon',     value: '15:00' },
  { icon: '🌆', label: 'Evening',       value: '18:00' },
  { icon: '🌙', label: 'Night',         value: '21:00' },
];

const LOCATION_SUGGESTIONS = [
  '🛏️ Bedroom', '🍳 Kitchen', '🪴 Living room',
  '🚿 Bathroom', '🏢 Office', '🏋️ Gym', '🌳 Outside',
];

const IDENTITY_SUGGESTIONS = [
  { icon: '💪', text: 'a healthy and active person' },
  { icon: '📚', text: 'someone who reads every day' },
  { icon: '🧘', text: 'a calm and mindful person' },
  { icon: '💰', text: 'someone who saves money' },
  { icon: '✍️', text: 'a consistent writer' },
  { icon: '🏃', text: 'a runner' },
  { icon: '🥦', text: 'someone who eats well' },
  { icon: '😴', text: 'someone who sleeps on time' },
  { icon: '🎯', text: 'a focused and disciplined person' },
  { icon: '🌱', text: 'someone who grows every day' },
];

const SentencePreview = ({ step, action, time, location, identity }) => {
  const blank = (val, fallback) =>
    val.trim()
      ? <span className="ahw-sentence-filled">{val.trim()}</span>
      : <span className="ahw-sentence-blank">{fallback}</span>;

  const cur = (key) => AHW_STEPS[step]?.key === key;

  return (
    <div className="ahw-sentence">
      <span className={`ahw-sentence-kw${cur('action') ? ' ahw-sentence-kw-active' : ''}`}>I will </span>
      {blank(action, '___')}
      {(step >= 1 || time) && (
        <><span className={`ahw-sentence-kw${cur('time') ? ' ahw-sentence-kw-active' : ''}`}> at </span>{blank(time, '___')}</>
      )}
      {(step >= 2 || location) && (
        <><span className={`ahw-sentence-kw${cur('location') ? ' ahw-sentence-kw-active' : ''}`}> in </span>{blank(location, '___')}</>
      )}
      {(step >= 3 || identity) && (
        <><span className={`ahw-sentence-kw${cur('identity') ? ' ahw-sentence-kw-active' : ''}`}> so that I can become </span>{blank(identity, '___')}</>
      )}
    </div>
  );
};

const AddHabitWizard = ({ habits, onSave, onClose, onDelete, saving, initialValues, isEdit }) => {
  // Strip saved prefixes so the wizard input shows just the bare value
  const stripPrefix = (str, prefix) =>
    str && str.startsWith(prefix) ? str.slice(prefix.length).trim() : (str || '');

  const [step, setStep]               = useState(0);
  const [action, setAction]           = useState(() => stripPrefix(initialValues?.action, 'I will'));
  const [frequency, setFrequency]     = useState(initialValues?.frequency || 'daily');
  const [time, setTime]               = useState(initialValues?.time || '');
  const [location, setLocation]       = useState(initialValues?.location || '');
  const [identity, setIdentity]       = useState(initialValues?.identity || '');
  const [trigger, setTrigger]         = useState(() => stripPrefix(initialValues?.trigger, 'After I'));
  const [afterHabitId, setAfterHabitId] = useState(initialValues?.afterHabitId || '');
  const [reward, setReward]           = useState(initialValues?.reward || '');
  const [err, setErr]                 = useState('');
  const inputRef = useRef(null);

  const cur = AHW_STEPS[step];
  const total = AHW_STEPS.length;
  const isLast = step === total - 1;

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 60); }, [step]);

  const getValue = () => {
    if (cur.key === 'action')    return action;
    if (cur.key === 'frequency') return frequency;
    if (cur.key === 'time')      return time;
    if (cur.key === 'location')  return location;
    if (cur.key === 'identity')  return identity;
    if (cur.key === 'stack')     return trigger;
    if (cur.key === 'reward')    return reward;
    return '';
  };

  const setValue = (val) => {
    setErr('');
    if (cur.key === 'action')   setAction(val);
    else if (cur.key === 'time')     setTime(val);
    else if (cur.key === 'location') setLocation(val);
    else if (cur.key === 'identity') setIdentity(val);
    else if (cur.key === 'stack')    setTrigger(val);
    else if (cur.key === 'reward')   setReward(val);
  };

  const handleNext = () => {
    if (cur.required && !getValue().trim()) {
      setErr('Please fill this in to continue.');
      return;
    }
    if (!isLast) { setStep(s => s + 1); return; }
    onSave({
      action: `I will ${action.trim().replace(/^I will\s+/i, '')}`,
      frequency,
      time, location, identity,
      trigger: trigger.trim() ? `After I ${trigger.trim().replace(/^After I\s+/i, '')}` : '',
      reward,
    });
  };

  const handleBack = () => {
    if (step === 0) { onClose(); return; }
    setErr('');
    setStep(s => s - 1);
  };

  const showSentence = step >= 2 && step <= 4;

  return (
    <div className="ahw-overlay" onClick={onClose}>
      <div className="ahw-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ahw-header">
          <button className="ahw-close" onClick={onClose}>✕</button>
          <div className="ahw-dots">
            {AHW_STEPS.map((_, i) => (
              <div key={i} className={`ahw-dot${i === step ? ' ahw-dot-active' : ''}${i < step ? ' ahw-dot-done' : ''}`}
                style={i === step ? { background: cur.color } : i < step ? { background: cur.color + '70' } : {}} />
            ))}
          </div>
          {isEdit
            ? <button className="ahw-hdr-delete" onClick={onDelete}>🗑</button>
            : <div className="ahw-step-num">{step + 1}/{total}</div>
          }
        </div>

        {/* Progress bar */}
        <div className="ahw-bar-track">
          <div className="ahw-bar-fill" style={{ width: `${((step + 1) / total) * 100}%`, background: cur.color }} />
        </div>

        {/* Body */}
        <div className="ahw-body">
          {/* Sentence preview for the core 4 steps */}
          {showSentence && (
            <SentencePreview
              step={step}
              action={action} time={time} location={location} identity={identity}
            />
          )}

          {/* Prompt label — hidden on step 0 since "I will" lives in the prefixed input */}
          {cur.key !== 'action' && (
            <div className="ahw-prompt-label" style={{ color: cur.color }}>
              {step === 5 ? 'Stack after a habit' : step === 6 ? 'Add a reward' : cur.label}
            </div>
          )}

          {/* Input */}
          {cur.key === 'stack' ? (
            <div className={`ahw-prefixed-wrap${err ? ' ahw-input-err' : ''}`}>
              <span className="ahw-prefix" style={{ color: cur.color }}>After I</span>
              <input
                ref={inputRef}
                className="ahw-prefixed-input"
                placeholder="wake up…"
                value={trigger}
                onChange={e => { setTrigger(e.target.value); setErr(''); }}
                onKeyDown={e => e.key === 'Enter' && handleNext()}
              />
            </div>
          ) : cur.key === 'action' ? (
            <div className={`ahw-prefixed-wrap${err ? ' ahw-input-err' : ''}`}>
              <span className="ahw-prefix" style={{ color: cur.color }}>I will</span>
              <input
                ref={inputRef}
                className="ahw-prefixed-input"
                placeholder="do 10 push-ups…"
                value={action}
                onChange={e => { setAction(e.target.value); setErr(''); }}
                onKeyDown={e => e.key === 'Enter' && handleNext()}
              />
            </div>
          ) : cur.key === 'time' ? (
            <input
              ref={inputRef}
              type="time"
              className={`ahw-input ahw-input-time${err ? ' ahw-input-err' : ''}`}
              value={time}
              onChange={e => { setTime(e.target.value); setErr(''); }}
            />
          ) : (
            <input
              ref={inputRef}
              className={`ahw-input${err ? ' ahw-input-err' : ''}`}
              placeholder={cur.placeholder}
              value={getValue()}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNext()}
            />
          )}

          {/* Frequency selector */}
          {cur.key === 'frequency' && (
            <div className="ahw-freq-grid">
              {FREQ_OPTIONS.map(f => (
                <button
                  key={f.key}
                  className={`ahw-freq-chip${frequency === f.key ? ' ahw-freq-active' : ''}`}
                  onClick={() => { setFrequency(f.key); setErr(''); }}
                >
                  <span className="ahw-freq-label">{f.label}</span>
                  <span className="ahw-freq-desc">{f.desc}</span>
                </button>
              ))}
            </div>
          )}

          {/* Action suggestions */}
          {cur.key === 'action' && (
            <div className="ahw-suggestions">
              {ACTION_SUGGESTIONS.map(s => (
                <button key={s.text} className={`ahw-sug-chip${action === s.text ? ' ahw-sug-active' : ''}`}
                  onClick={() => { setAction(s.text); setErr(''); inputRef.current?.focus(); }}>
                  {s.icon} {s.text}
                </button>
              ))}
            </div>
          )}

          {/* Time suggestions */}
          {cur.key === 'time' && (
            <div className="ahw-suggestions ahw-suggestions-time">
              {TIME_SUGGESTIONS.map(s => (
                <button key={s.value} className={`ahw-sug-chip ahw-sug-time${time === s.value ? ' ahw-sug-active' : ''}`}
                  onClick={() => { setTime(s.value); setErr(''); }}>
                  <span className="ahw-sug-time-icon">{s.icon}</span>
                  <span className="ahw-sug-time-label">{s.label}</span>
                  <span className="ahw-sug-time-val">{s.value}</span>
                </button>
              ))}
            </div>
          )}

          {/* Location suggestions */}
          {cur.key === 'location' && (
            <div className="ahw-suggestions">
              {LOCATION_SUGGESTIONS.map(s => {
                const val = s.replace(/^.{2}/, '').trim();
                return (
                  <button key={s} className={`ahw-sug-chip${location === val ? ' ahw-sug-active' : ''}`}
                    onClick={() => { setLocation(val); setErr(''); }}>
                    {s}
                  </button>
                );
              })}
            </div>
          )}

          {/* Identity suggestions */}
          {cur.key === 'identity' && (
            <div className="ahw-suggestions">
              {IDENTITY_SUGGESTIONS.map(s => (
                <button key={s.text} className={`ahw-sug-chip${identity === s.text ? ' ahw-sug-active' : ''}`}
                  onClick={() => { setIdentity(s.text); setErr(''); }}>
                  {s.icon} {s.text}
                </button>
              ))}
            </div>
          )}

          {err && <div className="ahw-err-msg">{err}</div>}

          {/* Skip hint for optional steps */}
          {!cur.required && (
            <button className="ahw-skip" onClick={() => { setValue(''); handleNext(); }}>
              Skip for now
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="ahw-footer">
          <button className="ahw-btn-back" onClick={handleBack}>
            {step === 0 ? 'Cancel' : '← Back'}
          </button>
          <button className="ahw-btn-next" style={{ background: cur.color }} onClick={handleNext} disabled={saving}>
            {isLast
              ? (saving ? 'Saving…' : isEdit ? 'Save changes ✓' : 'Add habit ✓')
              : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
};


const Dashboard = ({ user, onSignOut }) => {
  const [habitData, setHabitData] = useState({ habits: [], completions: {}, missed: {} });
  const [loading, setLoading]     = useState(true);
  const [istNow, setIstNow]       = useState(getIstParts);
  const [dayOffset, setDayOffset] = useState(0);
  const [view, setView]           = useState('today');
  const [monthOffset, setMonthOffset] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const prevAllDone = useRef(false);
  const [notifPerm, setNotifPerm] = useState(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );

  // Add habit wizard
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [savingHabit, setSavingHabit]   = useState(false);

  // Edit habit modal
  const [editingHabit, setEditingHabit] = useState(null);


  useEffect(() => {
    const unsub = habitService.subscribeToHabits((d) => {
      setHabitData(d || { habits: [], completions: {}, missed: {} });
      setLoading(false);
    });
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
    if (h.startDate) {
      const [y, m, d] = h.startDate.split('-').map(Number);
      if (currentDate < new Date(y, m - 1, d)) return false;
    }
    const freq = h.frequency || 'daily';
    const dow = currentDate.getDay(); // 0=Sun … 6=Sat
    if (freq === 'weekdays') return dow >= 1 && dow <= 5;
    if (freq === 'weekly') {
      if (!h.startDate) return true;
      const [sy, sm, sd] = h.startDate.split('-').map(Number);
      return dow === new Date(sy, sm - 1, sd).getDay();
    }
    if (freq === 'monthly') {
      if (!h.startDate) return true;
      return currentDate.getDate() === parseInt(h.startDate.split('-')[2], 10);
    }
    return true; // daily
  });

  const byTime = (a, b) => (timeToMins(a.time) ?? 9999) - (timeToMins(b.time) ?? 9999);
  const incomplete = scheduledHabits.filter((h) => !completions.includes(h.id) && !missed.includes(h.id)).sort(byTime);
  const done       = scheduledHabits.filter((h) => completions.includes(h.id)).sort(byTime);
  const missedList = scheduledHabits.filter((h) => missed.includes(h.id)).sort(byTime);

  const total = scheduledHabits.length;
  const completedCount = done.length;
  const rate = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const circum = 2 * Math.PI * 28;
  const _dash = (rate / 100) * circum; // kept for future ring SVG use

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

  const revertToIncomplete = async (id) => {
    const newMissed = { ...habitData.missed };
    newMissed[currentDateStr] = (newMissed[currentDateStr] || []).filter((x) => x !== id);
    const newCompletions = { ...habitData.completions };
    newCompletions[currentDateStr] = (newCompletions[currentDateStr] || []).filter((x) => x !== id);
    const next = { ...habitData, missed: newMissed, completions: newCompletions };
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

  const openEditHabit = (h) => setEditingHabit(h);




  const enableNotifications = async () => {
    if (typeof Notification === 'undefined') return;
    const p = await Notification.requestPermission();
    setNotifPerm(p);
  };


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

  // Week grid helper — Mon to Sun of the week containing currentDate
  const getWeekGrid = (habitId) => {
    const dow = currentDate.getDay();
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() - (dow === 0 ? 6 : dow - 1));
    monday.setHours(0, 0, 0, 0);
    const todayStr = formatDate(new Date());
    return ['M','T','W','T','F','S','S'].map((lbl, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const ds = formatDate(d);
      return {
        lbl,
        ds,
        isToday: ds === todayStr,
        isFuture: d > new Date(new Date().setHours(23, 59, 59)),
        isDone: (habitData.completions[ds] || []).includes(habitId),
        isMissedDay: (habitData.missed[ds] || []).includes(habitId),
      };
    });
  };

  const FREQ_LABELS = { daily: 'Daily', weekdays: 'Weekdays', weekly: 'Weekly', monthly: 'Monthly' };

  // Extracted habit card renderer
  const renderHabitCard = (h, accentColor) => {
    const isDone    = completions.includes(h.id);
    const isMissed  = missed.includes(h.id);
    const streak    = getCurrentStreak(h.id);
    const freqLabel = FREQ_LABELS[h.frequency || 'daily'];
    const weekGrid  = getWeekGrid(h.id);
    return (
      <div
        key={h.id}
        className={`db-hc${isDone ? ' db-hc--done' : ''}${isMissed ? ' db-hc--missed' : ''}`}
      >
        {/* Main row: check + content + edit */}
        <div className="db-hc-main" onClick={() => !isMissed && toggleCompletion(h.id)}>
          <div className={`db-hc-check${isDone ? ' done' : isMissed ? ' missed' : ''}`}>
            {isDone && <span>✓</span>}
            {isMissed && <span>✗</span>}
          </div>
          <div className="db-hc-content">
            {h.trigger && <p className="db-hc-trigger">{h.trigger}</p>}
            <p className="db-hc-action">{h.action}</p>
            <p className="db-hc-meta">
              <span className="db-hc-freq">{freqLabel}</span>
              <span className="db-hc-sep">·</span>
              <span className={`db-hc-streak-lbl${streak > 0 ? ' active' : ''}`}>
                {streak > 0 ? `🔥 ${streak}d streak` : 'start streak'}
              </span>
            </p>
          </div>
          <button
            className="db-hc-edit-btn"
            onClick={e => { e.stopPropagation(); openEditHabit(h); }}
            aria-label="Edit habit"
          >✎</button>
        </div>

        {/* Week grid row + skip/done/undo */}
        <div className="db-hc-week">
          <div className="db-hc-days">
            {weekGrid.map((day, i) => (
              <div key={i} className="db-hc-day">
                <div className={[
                  'db-hc-dot',
                  day.isDone      ? 'done'   : '',
                  day.isMissedDay ? 'missed' : '',
                  day.isToday     ? 'today'  : '',
                  day.isFuture    ? 'future' : '',
                ].filter(Boolean).join(' ')} />
                <span className={`db-hc-day-lbl${day.isToday ? ' today' : ''}`}>{day.lbl}</span>
              </div>
            ))}
          </div>
          <div className="db-hc-act">
            {!isDone && !isMissed && (
              <button className="db-hc-skip-btn" onClick={e => { e.stopPropagation(); toggleMissed(h.id); }}>Skip</button>
            )}
            {isDone && <span className="db-hc-done-tag">Done ✓</span>}
            {isMissed && (
              <button className="db-hc-undo-btn" onClick={e => { e.stopPropagation(); revertToIncomplete(h.id); }}>Undo</button>
            )}
          </div>
        </div>
      </div>
    );
  };

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
          <button className={`db-view-tab${view === 'tasks' ? ' active' : ''}`} onClick={() => setView('tasks')}>Tasks</button>
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

      <div className="db-scroll">

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
                  {(() => {
                    const chainGroups = buildHabitChains(incomplete);
                    // Sort groups by their first habit's time
                    chainGroups.sort((a, b) =>
                      (timeToMins(a.items[0]?.time) ?? 9999) - (timeToMins(b.items[0]?.time) ?? 9999)
                    );
                    return TIME_GROUPS.map((tg) => {
                      const tgGroups = chainGroups.filter(g => getTimeGroup(g.items[0]?.time) === tg.id);
                      if (tgGroups.length === 0) return null;
                      const totalCount = tgGroups.reduce((s, g) => s + g.items.length, 0);
                      return (
                        <div key={tg.id} className="db-time-group">
                          <div className="db-time-group-hd">
                            <span className="db-time-group-icon">{tg.icon}</span>
                            <span className="db-time-group-label">{tg.label}</span>
                            <span className="db-time-group-line" />
                            <span className="db-time-group-count">{totalCount}</span>
                          </div>

                          {tgGroups.map((group, gi) => {
                            if (group.type === 'chain') {
                              return (
                                <div key={gi} className="db-habit-stack">
                                  <div className="db-habit-stack-hd">
                                    <span className="db-habit-stack-icon">⛓</span>
                                    <span className="db-habit-stack-label">Habit Stack · {group.items.length} habits</span>
                                  </div>
                                  {group.items.map((h, idx) => (
                                    <React.Fragment key={h.id}>
                                      {renderHabitCard(h, tg.accentColor)}
                                      {idx < group.items.length - 1 && (
                                        <div className="db-stack-connector">
                                          <div className="db-stack-connector-line" />
                                          <span className="db-stack-then">THEN</span>
                                          <div className="db-stack-connector-line" />
                                        </div>
                                      )}
                                    </React.Fragment>
                                  ))}
                                </div>
                              );
                            }
                            return renderHabitCard(group.items[0], tg.accentColor);
                          })}
                        </div>
                      );
                    });
                  })()}

                  {(done.length > 0 || missedList.length > 0) && (
                    <div className="db-history-section">
                      <button className="db-history-toggle" onClick={() => setShowHistory((v) => !v)}>
                        <span className="db-history-toggle-line" />
                        <span className="db-history-toggle-label">
                          {done.length > 0 && `✓ ${done.length} done`}
                          {done.length > 0 && missedList.length > 0 && ' · '}
                          {missedList.length > 0 && `✗ ${missedList.length} missed`}
                        </span>
                        <span className="db-history-toggle-line" />
                        <span className={`db-history-chevron${showHistory ? ' open' : ''}`}>›</span>
                      </button>

                      {showHistory && (
                        <div className="db-history-list">
                          {done.map((h) => (
                            <div key={h.id} className="db-habit-log db-habit-log-done">
                              <span className="db-log-icon">✓</span>
                              <div className="db-log-body">
                                <span className="db-log-name">{h.action}</span>
                                <span className="db-log-time">{h.time}</span>
                              </div>
                              <span className="db-log-streak">🔥 {getCurrentStreak(h.id)}</span>
                              <button className="db-log-undo" onClick={() => toggleCompletion(h.id)}>↶ Undo</button>
                            </div>
                          ))}
                          {missedList.map((h) => (
                            <div key={h.id} className="db-habit-log db-habit-log-missed">
                              <span className="db-log-icon">✗</span>
                              <div className="db-log-body">
                                <span className="db-log-name">{h.action}</span>
                                <span className="db-log-time">{h.time}</span>
                              </div>
                              <button className="db-log-undo db-log-undo-missed" onClick={() => revertToIncomplete(h.id)}>↶ Undo</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {allDoneNow && (
                    <div className="db-all-done">
                      🎉 All habits done for today!
                    </div>
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

        {/* ── TASKS (KANBAN) VIEW ──────────────────────── */}
        {view === 'tasks' && <KanbanTodo />}
      </div>

      {/* Edit Habit Wiza