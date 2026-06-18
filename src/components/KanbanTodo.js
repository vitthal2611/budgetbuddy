import React, { useState, useEffect, useCallback, useRef } from 'react';
import todoService from '../services/todoService';
import './KanbanTodo.css';

const PRIORITY_COLOR = { high: '#E24B4A', medium: '#F59E0B', low: '#639922' };
const PRIORITY_LABEL = { high: 'High', medium: 'Medium', low: 'Low' };
const PRIORITIES = ['high', 'medium', 'low'];
const COLUMNS = [
  { id: 'todo',        label: 'To Do',      short: 'To Do',  emoji: '📋' },
  { id: 'in-progress', label: 'In Progress', short: 'Doing',  emoji: '⚡' },
  { id: 'done',        label: 'Done',        short: 'Done',   emoji: '✅' },
];
const VALID_STATUSES = ['todo', 'in-progress', 'done'];
const SWIPE_THRESHOLD = 40;

const migrateTask = (t) => {
  const status = VALID_STATUSES.includes(t.status)
    ? t.status
    : (t.completed ? 'done' : 'todo');
  return { ...t, status };
};

const genId = () => 'task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

// ── Add modal ────────────────────────────────────────────────────────────────
const AddModal = ({ defaultCol, onSave, onClose }) => {
  const [title,    setTitle]    = useState('');
  const [priority, setPriority] = useState('medium');
  const [col,      setCol]      = useState(defaultCol);
  const [err,      setErr]      = useState(false);

  const handleSave = () => {
    if (!title.trim()) { setErr(true); return; }
    onSave({ title: title.trim(), priority, status: col });
  };

  return (
    <div className="kb-overlay" onClick={onClose}>
      <div className="kb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="kb-modal-hd">
          <span className="kb-modal-title">New task</span>
          <button className="kb-modal-close" onClick={onClose}>✕</button>
        </div>

        <label className="kb-label">Task *</label>
        <input
          className={`kb-input${err ? ' err' : ''}`}
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setErr(false); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />

        <label className="kb-label">Add to column</label>
        <div className="kb-chips">
          {COLUMNS.map((c) => (
            <button
              key={c.id}
              className={`kb-chip${col === c.id ? ' active' : ''}`}
              onClick={() => setCol(c.id)}
            >
              {c.emoji} {c.short}
            </button>
          ))}
        </div>

        <label className="kb-label">Priority</label>
        <div className="kb-chips">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              className={`kb-chip${priority === p ? ' active' : ''}`}
              style={priority === p
                ? { color: PRIORITY_COLOR[p], borderColor: PRIORITY_COLOR[p], background: PRIORITY_COLOR[p] + '18' }
                : {}}
              onClick={() => setPriority(p)}
            >
              {PRIORITY_LABEL[p]}
            </button>
          ))}
        </div>

        <div className="kb-modal-actions">
          <button className="kb-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="kb-btn-save" onClick={handleSave}>Add task</button>
        </div>
      </div>
    </div>
  );
};

// ── Task card ────────────────────────────────────────────────────────────────
const TaskCard = ({ task, onMove, onDelete, showSwipeHint, onSwiped }) => {
  const colIdx = COLUMNS.findIndex((c) => c.id === task.status);
  const pri    = task.priority || 'medium';
  const isDone = task.status === 'done';
  const touchX = useRef(null);
  const [swipeDir,   setSwipeDir]   = useState(null);
  const [confirming, setConfirming] = useState(false);

  const handleTouchStart = (e) => { touchX.current = e.touches[0].clientX; };

  const handleTouchMove = (e) => {
    if (touchX.current === null) return;
    const delta = e.touches[0].clientX - touchX.current;
    if (Math.abs(delta) > 12) setSwipeDir(delta > 0 ? 'right' : 'left');
  };

  const handleTouchEnd = (e) => {
    if (touchX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    setSwipeDir(null);
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    if (delta > 0 && colIdx > 0) {
      onSwiped && onSwiped();
      onMove(task.id, COLUMNS[colIdx - 1].id);
    } else if (delta < 0 && colIdx < COLUMNS.length - 1) {
      onSwiped && onSwiped();
      onMove(task.id, COLUMNS[colIdx + 1].id);
    }
  };

  return (
    <div
      className={`kb-card kb-card-pri-${pri}${isDone ? ' kb-card-done' : ''}${swipeDir ? ` kb-swiping-${swipeDir}` : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="kb-card-pri-bar" style={{ background: isDone ? '#ccc' : PRIORITY_COLOR[pri] }} />

      <div className="kb-card-body">
        <div className="kb-card-title">{task.title}</div>
        <div className="kb-card-meta">
          <span
            className="kb-pri-badge"
            style={{ color: isDone ? '#aaa' : PRIORITY_COLOR[pri], background: isDone ? '#f0f0f0' : PRIORITY_COLOR[pri] + '18' }}
          >
            {PRIORITY_LABEL[pri]}
          </span>
          {showSwipeHint && <span className="kb-swipe-hint">← swipe →</span>}
        </div>
      </div>

      {confirming ? (
        <div className="kb-confirm">
          <span className="kb-confirm-text">Delete?</span>
          <button className="kb-confirm-yes" onClick={() => onDelete(task.id)}>Yes</button>
          <button className="kb-confirm-no"  onClick={() => setConfirming(false)}>No</button>
        </div>
      ) : (
        <div className="kb-card-footer">
          <button
            className={`kb-move-btn${colIdx === 0 ? ' kb-move-hidden' : ''}`}
            onClick={() => colIdx > 0 && onMove(task.id, COLUMNS[colIdx - 1].id)}
            title={colIdx > 0 ? `Move to ${COLUMNS[colIdx - 1].label}` : ''}
            disabled={colIdx === 0}
          >‹</button>
          <button
            className="kb-action-btn kb-action-del"
            onClick={() => setConfirming(true)}
            title="Delete"
          >✕</button>
          <button
            className={`kb-move-btn${colIdx === COLUMNS.length - 1 ? ' kb-move-hidden' : ''}`}
            onClick={() => colIdx < COLUMNS.length - 1 && onMove(task.id, COLUMNS[colIdx + 1].id)}
            title={colIdx < COLUMNS.length - 1 ? `Move to ${COLUMNS[colIdx + 1].label}` : ''}
            disabled={colIdx === COLUMNS.length - 1}
          >›</button>
        </div>
      )}
    </div>
  );
};

// ── Main Kanban page ─────────────────────────────────────────────────────────
const KanbanTodo = () => {
  const [tasks,         setTasks]         = useState([]);
  const [addToCol,      setAddToCol]      = useState(null);
  const [showSwipeHint, setShowSwipeHint] = useState(
    () => !localStorage.getItem('kb_swiped')
  );

  const dismissSwipeHint = () => {
    localStorage.setItem('kb_swiped', '1');
    setShowSwipeHint(false);
  };

  useEffect(() => {
    const unsub = todoService.subscribeToTasks((raw) => {
      setTasks((raw || []).map(migrateTask));
    });
    return () => unsub();
  }, []);

  const save = useCallback((updated) => {
    todoService.saveTasks(updated);
  }, []);

  const addTask = ({ title, priority, status }) => {
    const newTask = {
      id: genId(),
      title,
      priority,
      status,
      completed: status === 'done',
      createdAt: new Date().toISOString(),
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    save(updated);
    setAddToCol(null);
  };

  const moveTask = (id, newStatus) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, status: newStatus, completed: newStatus === 'done' } : t
    );
    setTasks(updated);
    save(updated);
  };

  const deleteTask = (id) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    save(updated);
  };

  const colTasks = (colId) =>
    tasks
      .filter((t) => t.status === colId)
      .sort((a, b) => {
        const r = { high: 0, medium: 1, low: 2 };
        return (r[a.priority || 'medium'] ?? 1) - (r[b.priority || 'medium'] ?? 1);
      });

  const totalTasks = tasks.length;
  const doneTasks  = tasks.filter((t) => t.status === 'done').length;

  return (
    <div className="kb-page">
      {totalTasks > 0 && (
        <div className="kb-summary">
          <span className="kb-summary-text">
            {doneTasks}/{totalTasks} tasks complete
          </span>
          <div className="kb-summary-bar">
            <div
              className="kb-summary-fill"
              style={{ width: `${Math.round((doneTasks / totalTasks) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="kb-board">
        {COLUMNS.map((col) => {
          const cards = colTasks(col.id);
          return (
            <div key={col.id} className={`kb-col kb-col-${col.id}`}>
              <div className="kb-col-hd">
                <div className="kb-col-hd-left">
                  <span className="kb-col-emoji">{col.emoji}</span>
                  <span className="kb-col-label">{col.short}</span>
                  {cards.length > 0 && (
                    <span className="kb-col-count">{cards.length}</span>
                  )}
                </div>
                <button
                  className="kb-col-add"
                  onClick={() => setAddToCol(col.id)}
                  title={`Add to ${col.label}`}
                >+</button>
              </div>

              <div className="kb-col-cards">
                {cards.length === 0 ? (
                  <div className="kb-empty">
                    <span className="kb-empty-text">Empty</span>
                    <button className="kb-empty-add" onClick={() => setAddToCol(col.id)}>
                      + Add
                    </button>
                  </div>
                ) : (
                  cards.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onMove={moveTask}
                      onDelete={deleteTask}
                      showSwipeHint={showSwipeHint}
                      onSwiped={dismissSwipeHint}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {addToCol && (
        <AddModal
          defaultCol={addToCol}
          onSave={addTask}
          onClose={() => setAddToCol(null)}
        />
      )}
    </div>
  );
};

export default KanbanTodo;
