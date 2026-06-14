import React, { useState, useEffect, useRef, useCallback } from 'react';
import todoService from '../services/todoService';
import './HabitTracker.css';
import './TodoMatrix.css';

const PRIORITIES = [
  { id: 'high',   label: 'High',   icon: '🔴', color: '#EF4444' },
  { id: 'medium', label: 'Medium', icon: '🟡', color: '#F59E0B' },
  { id: 'low',    label: 'Low',    icon: '🟢', color: '#10B981' },
];

const CATEGORIES = ['Work', 'Personal', 'Health', 'Finance', 'Learning', 'Home', 'Other'];
const PRIORITY_COLOR = { high: '#EF4444', medium: '#F59E0B', low: '#10B981' };
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'high', label: 'High' },
  { id: 'completed', label: 'Done' },
];

const todayStr = () => new Date().toISOString().split('T')[0];

const dueDateLabel = (dueDate) => {
  if (!dueDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(dueDate + 'T00:00:00'); due.setHours(0, 0, 0, 0);
  const diff  = Math.round((due - today) / 86400000);
  if (diff < 0)   return { text: 'Overdue',  cls: 'overdue'  };
  if (diff === 0) return { text: 'Today',    cls: 'today'    };
  if (diff === 1) return { text: 'Tomorrow', cls: 'tomorrow' };
  return { text: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), cls: 'future' };
};

const getDueClass = (dueDate) => dueDateLabel(dueDate)?.cls || 'none';

const sortTasks = (items) => [...items].sort((a, b) => {
  const dueA = getDueClass(a.dueDate);
  const dueB = getDueClass(b.dueDate);
  const dueRank = { overdue: 0, today: 1, tomorrow: 2, future: 3, none: 4 };
  if (dueRank[dueA] !== dueRank[dueB]) return dueRank[dueA] - dueRank[dueB];

  const pa = PRIORITY_ORDER[a.priority] ?? 1;
  const pb = PRIORITY_ORDER[b.priority] ?? 1;
  if (pa !== pb) return pa - pb;

  if (!a.dueDate && !b.dueDate) return 0;
  if (!a.dueDate) return 1;
  if (!b.dueDate) return -1;
  return a.dueDate.localeCompare(b.dueDate);
});

const TodoMatrix = () => {
  const [tasks,      setTasks]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [undoState,  setUndoState]  = useState(null);
  const [filter,     setFilter]     = useState('all');

  const [showAdd,     setShowAdd]     = useState(false);
  const [addTitle,    setAddTitle]    = useState('');
  const [addPriority, setAddPriority] = useState('medium');
  const [addCategory, setAddCategory] = useState('');
  const [addDueDate,  setAddDueDate]  = useState('');
  const [addTitleErr, setAddTitleErr] = useState(false);

  const [showEdit,     setShowEdit]     = useState(false);
  const [editTask,     setEditTask]     = useState(null);
  const [editTitle,    setEditTitle]    = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  const [editCategory, setEditCategory] = useState('');
  const [editDueDate,  setEditDueDate]  = useState('');
  const [editTitleErr, setEditTitleErr] = useState(false);

  useEffect(() => {
    const unsub = todoService.subscribeToTasks(data => {
      setTasks(data || []);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openMenuId]);

  const save = useCallback(async (next) => {
    setTasks(next);
    await todoService.saveTasks(next);
  }, []);

  const updateField = useCallback(async (id, fields) => {
    await save(tasks.map(t => t.id === id ? { ...t, ...fields } : t));
  }, [tasks, save]);

  const activeTasks = sortTasks(tasks.filter(t => !t.completed));
  const completedTasks = sortTasks(tasks.filter(t => t.completed));
  const taskStats = {
    total: tasks.length,
    active: activeTasks.length,
    dueToday: tasks.filter(t => !t.completed && getDueClass(t.dueDate) === 'today').length,
    overdue: tasks.filter(t => !t.completed && getDueClass(t.dueDate) === 'overdue').length,
    completed: completedTasks.length,
  };

  const visibleTasks = activeTasks.filter(task => {
    const dueClass = getDueClass(task.dueDate);
    if (filter === 'today') return dueClass === 'today' || dueClass === 'overdue';
    if (filter === 'upcoming') return dueClass === 'tomorrow' || dueClass === 'future';
    if (filter === 'high') return (task.priority || 'medium') === 'high';
    return filter === 'all';
  });

  const handleAdd = async () => {
    if (!addTitle.trim()) { setAddTitleErr(true); setTimeout(() => setAddTitleErr(false), 500); return; }
    await save([...tasks, {
      id: `task_${Date.now()}`,
      title: addTitle.trim(),
      priority: addPriority,
      category: addCategory,
      dueDate: addDueDate,
      completed: false,
      createdAt: new Date().toISOString(),
    }]);
    setShowAdd(false);
    setAddTitle(''); setAddDueDate(''); setAddCategory(''); setAddPriority('medium');
  };

  const toggleComplete = useCallback(async (id) => {
    await save(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }, [tasks, save]);

  const openEdit = useCallback((task) => {
    setEditTask(task);
    setEditTitle(task.title);
    setEditPriority(task.priority || 'medium');
    setEditCategory(task.category || '');
    setEditDueDate(task.dueDate || '');
    setShowEdit(true);
    setOpenMenuId(null);
  }, []);

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) { setEditTitleErr(true); setTimeout(() => setEditTitleErr(false), 500); return; }
    await save(tasks.map(t => t.id === editTask.id
      ? { ...t, title: editTitle.trim(), priority: editPriority, category: editCategory, dueDate: editDueDate }
      : t
    ));
    setShowEdit(false);
  };

  const handleDelete = useCallback((task) => {
    const remaining = tasks.filter(t => t.id !== task.id);
    setTasks(remaining);
    if (undoState) clearTimeout(undoState.timer);
    const timer = setTimeout(async () => {
      await todoService.saveTasks(remaining);
      setUndoState(null);
    }, 4000);
    setUndoState({ task, timer });
  }, [tasks, undoState]);

  const handleUndo = () => {
    if (!undoState) return;
    clearTimeout(undoState.timer);
    setTasks(prev => prev.find(t => t.id === undoState.task.id) ? prev : [...prev, undoState.task]);
    setUndoState(null);
  };

  if (loading) return <div className="habit-loading">Loading tasks…</div>;

  return (
    <div className="habit-tracker">
      <div className="habit-header">
        <h1 className="habit-title">To-Do</h1>
        <button className="habit-add-btn" onClick={() => setShowAdd(true)}>+ Add</button>
      </div>

      <div className="todo-dashboard">
        <div className="todo-stat-card todo-stat-focus">
          <span className="todo-stat-value">{taskStats.active}</span>
          <span className="todo-stat-label">Open</span>
        </div>
        <div className="todo-stat-card">
          <span className="todo-stat-value">{taskStats.dueToday + taskStats.overdue}</span>
          <span className="todo-stat-label">Due now</span>
        </div>
        <div className="todo-stat-card">
          <span className="todo-stat-value">{taskStats.completed}</span>
          <span className="todo-stat-label">Done</span>
        </div>
      </div>

      <div className="todo-filter-bar" role="tablist" aria-label="Task filters">
        {FILTERS.map(item => (
          <button
            key={item.id}
            className={`todo-filter-chip${filter === item.id ? ' active' : ''}`}
            onClick={() => setFilter(item.id)}
            role="tab"
            aria-selected={filter === item.id}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="habit-list">
        {filter === 'completed' ? (
          completedTasks.length === 0 ? (
            <div className="habit-empty">
              <p>No completed tasks yet.</p>
            </div>
          ) : (
            <>
              <div className="todo-list-section">Completed ({completedTasks.length})</div>
              {completedTasks.map(task => (
                <TaskCard key={task.id} task={task}
                  onToggle={toggleComplete} onEdit={openEdit} onDelete={handleDelete}
                  onUpdateField={updateField}
                  openMenuId={openMenuId} setOpenMenuId={setOpenMenuId} />
              ))}
            </>
          )
        ) : visibleTasks.length === 0 ? (
          <div className="habit-empty">
            <p>No tasks match this view.</p>
          </div>
        ) : (
          <>
            {(taskStats.overdue > 0 || taskStats.dueToday > 0) && filter === 'all' && (
              <div className="todo-list-section">Needs attention</div>
            )}
            {visibleTasks.map(task => (
              <TaskCard key={task.id} task={task}
                onToggle={toggleComplete} onEdit={openEdit} onDelete={handleDelete}
                onUpdateField={updateField}
                openMenuId={openMenuId} setOpenMenuId={setOpenMenuId} />
            ))}
          </>
        )}
      </div>

      {undoState && (
        <div className="todo-undo-toast">
          <span>Task deleted</span>
          <button className="todo-undo-btn" onClick={handleUndo}>Undo</button>
        </div>
      )}

      {showAdd && (
        <TaskFormModal title="New Task"
          taskTitle={addTitle}    onTitleChange={setAddTitle}    titleError={addTitleErr}
          priority={addPriority}  onPriorityChange={setAddPriority}
          category={addCategory}  onCategoryChange={setAddCategory}
          dueDate={addDueDate}    onDueDateChange={setAddDueDate}
          onSave={handleAdd}
          onClose={() => { setShowAdd(false); setAddTitle(''); setAddDueDate(''); setAddCategory(''); setAddPriority('medium'); }}
        />
      )}

      {showEdit && (
        <TaskFormModal title="Edit Task"
          taskTitle={editTitle}    onTitleChange={setEditTitle}    titleError={editTitleErr}
          priority={editPriority}  onPriorityChange={setEditPriority}
          category={editCategory}  onCategoryChange={setEditCategory}
          dueDate={editDueDate}    onDueDateChange={setEditDueDate}
          onSave={handleSaveEdit}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
};

/* ── TaskCard ── Redesigned for task focus */
const TaskCard = ({ task, onToggle, onEdit, onDelete, onUpdateField, openMenuId, setOpenMenuId }) => {
  const menuOpen  = openMenuId === task.id;
  const touchRef  = useRef(null);
  const [swipeX,  setSwipeX]  = useState(0);
  const [swiping, setSwiping] = useState(false);

  const onTouchStart = (e) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setSwiping(false); setSwipeX(0);
  };
  const onTouchMove = (e) => {
    if (!touchRef.current) return;
    const dx = e.touches[0].clientX - touchRef.current.x;
    const dy = Math.abs(e.touches[0].clientY - touchRef.current.y);
    if (dy > 10 && Math.abs(dx) < dy) return;
    setSwiping(true); setSwipeX(dx);
  };
  const onTouchEnd = () => {
    if (swiping) {
      if (swipeX >  80) onToggle(task.id);
      if (swipeX < -80) onDelete(task);
    }
    setSwipeX(0); setSwiping(false); touchRef.current = null;
  };

  const dueInfo      = dueDateLabel(task.dueDate);
  const detailText   = dueInfo
    ? `${dueInfo.text}${task.category ? ` in ${task.category}` : ''}`
    : (task.category ? task.category : 'No due date');
  const priorityMeta = PRIORITIES.find(p => p.id === (task.priority || 'medium')) || PRIORITIES[1];
  const barColor     = PRIORITY_COLOR[task.priority] || '#F59E0B';

  const innerStyle = swiping
    ? { transform: `translateX(${swipeX}px)`, transition: 'none', opacity: Math.max(0.5, 1 - Math.abs(swipeX) / 200) }
    : { transform: 'translateX(0)', transition: 'transform 0.22s ease' };
  const bgHint = swipeX > 40 ? 'rgba(16,185,129,0.1)' : swipeX < -40 ? 'rgba(239,68,68,0.1)' : 'transparent';

  return (
    <div className={`habit-today-card todo-task-card${task.completed ? ' todo-task-card-completed' : ''}`}
      style={{ '--priority-color': barColor, background: bgHint }}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
    >
      {swiping && swipeX >  40 && <span className="todo-swipe-hint todo-swipe-hint-complete">✓</span>}
      {swiping && swipeX < -40 && <span className="todo-swipe-hint todo-swipe-hint-delete">🗑️</span>}

      <div style={innerStyle}>
        {/* Header */}
        <div className="habit-today-header" style={{ background: `${barColor}12`, borderBottom: `1px solid ${barColor}22` }}>
          <span className="habit-today-identity" style={{ color: barColor }}>
            {task.title}
            {task.category && <span className="todo-category-tag"> · {task.category}</span>}
          </span>
          <div className="todo-card-meta">
            <span className="todo-priority-tag">{priorityMeta.icon} {priorityMeta.label}</span>
            {dueInfo && <span className={`todo-due-badge todo-due-${dueInfo.cls}`}>{dueInfo.text}</span>}
            <div style={{ position: 'relative' }}>
              <button className="todo-menu-btn-inner"
                onClick={e => { e.stopPropagation(); setOpenMenuId(menuOpen ? null : task.id); }}
                aria-label="Options">⋯</button>
              {menuOpen && (
                <div className="habit-menu-dropdown" onClick={e => e.stopPropagation()}>
                  <button className="habit-menu-item" onClick={() => onEdit(task)}>✏️ Edit</button>
                  <button className="habit-menu-item habit-menu-delete" onClick={() => onDelete(task)}>🗑️ Delete</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="habit-today-body">
          <button className="habit-action-icon habit-complete-icon"
            onClick={() => onToggle(task.id)}
            aria-label={task.completed ? 'Mark active' : 'Mark complete'}>
            {task.completed ? 'Undo' : 'OK'}
          </button>

          <div className="habit-today-content">
            {task.category && <span className="todo-category-tag">{task.category}</span>}
            {task.description && <span className="todo-task-description">{task.description}</span>}
            <div className="todo-card-status-line">
              <span className={`todo-status-dot todo-status-${dueInfo?.cls || 'none'}`} />
              <span>{detailText}</span>
            </div>
            
            {/* Priority selector */}
            <div className="todo-priority-row">
              {PRIORITIES.map(p => (
                <button key={p.id}
                  className={`todo-priority-btn${(task.priority || 'medium') === p.id ? ' active' : ''}`}
                  style={(task.priority || 'medium') === p.id ? { background: p.color + '20', borderColor: p.color } : {}}
                  onClick={() => onUpdateField(task.id, { priority: p.id })}
                  title={p.label}>{p.label}</button>
              ))}
            </div>
          </div>

          <div className="habit-action-icon-placeholder" />
        </div>
      </div>
    </div>
  );
};

/* ── Form Modal ── */
const TaskFormModal = ({
  title, onClose, onSave,
  taskTitle, onTitleChange, titleError,
  priority, onPriorityChange,
  category, onCategoryChange,
  dueDate, onDueDateChange,
}) => (
  <>
    <div className="habit-modal-overlay" onClick={onClose} />
    <div className="todo-modal">
      <div className="todo-modal-handle" />
      <div className="habit-modal-header">
        <h3 className="habit-modal-title">{title}</h3>
        <button className="habit-modal-close" onClick={onClose}>✕</button>
      </div>

      <label className="todo-form-label">Task *</label>
      <input className={`todo-form-input${titleError ? ' error' : ''}`}
        placeholder="What needs to be done?"
        value={taskTitle} onChange={e => onTitleChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSave()}
        autoFocus />

      <label className="todo-form-label">Priority</label>
      <div className="todo-priority-chips">
        {PRIORITIES.map(p => (
          <button key={p.id}
            className={`todo-priority-chip${priority === p.id ? ' active' : ''}`}
            style={priority === p.id ? { background: p.color + '20', borderColor: p.color, color: p.color } : {}}
            onClick={() => onPriorityChange(p.id)}>
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      <label className="todo-form-label">Category</label>
      <div className="todo-category-chips">
        {CATEGORIES.map(c => (
          <button key={c}
            className={`todo-category-chip${category === c ? ' active' : ''}`}
            onClick={() => onCategoryChange(category === c ? '' : c)}>
            {c}
          </button>
        ))}
      </div>

      <label className="todo-form-label">Due date (optional)</label>
      <input type="date" className="todo-form-input"
        value={dueDate} min={todayStr()}
        onChange={e => onDueDateChange(e.target.value)}
        onFocus={e => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })} />

      <div className="todo-modal-actions">
        <button className="todo-btn-cancel" onClick={onClose}>Cancel</button>
        <button className="todo-btn-save" onClick={onSave}>Save</button>
      </div>
    </div>
  </>
);

export default TodoMatrix;
