import React, { useState, useEffect } from 'react';
import todoService from '../services/todoService';
import './TodoMatrix.css';

const QUADRANTS = [
  { id: 'urgent-important', title: 'Do First', subtitle: 'Urgent & Important', color: '#EF4444', icon: '🔥' },
  { id: 'not-urgent-important', title: 'Schedule', subtitle: 'Not Urgent & Important', color: '#3B82F6', icon: '📅' },
  { id: 'urgent-not-important', title: 'Delegate', subtitle: 'Urgent & Not Important', color: '#F59E0B', icon: '👥' },
  { id: 'not-urgent-not-important', title: 'Eliminate', subtitle: 'Not Urgent & Not Important', color: '#6B7280', icon: '🗑️' }
];

const TodoMatrix = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuadrants, setExpandedQuadrants] = useState({
    'urgent-important': true,
    'not-urgent-important': true,
    'urgent-not-important': false,
    'not-urgent-not-important': false
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Form states
  const [selectedQuadrant, setSelectedQuadrant] = useState('urgent-important');
  const [taskTitle, setTaskTitle] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editQuadrant, setEditQuadrant] = useState('');
  const [deletingTask, setDeletingTask] = useState(null);
  const [titleError, setTitleError] = useState(false);

  useEffect(() => {
    const unsubscribe = todoService.subscribeToTasks((taskData) => {
      setTasks(taskData || []);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      // Reset states on unmount
      setShowAddModal(false);
      setShowEditModal(false);
      setShowDeleteModal(false);
    };
  }, []);

  const toggleQuadrant = (quadrantId) => {
    setExpandedQuadrants(prev => ({ ...prev, [quadrantId]: !prev[quadrantId] }));
  };

  const getTasksByQuadrant = (quadrantId) => {
    return tasks.filter(task => task.quadrant === quadrantId && !task.completed);
  };

  const getCompletedTasksByQuadrant = (quadrantId) => {
    return tasks.filter(task => task.quadrant === quadrantId && task.completed);
  };

  const addTask = async () => {
    if (!taskTitle.trim()) {
      setTitleError(true);
      setTimeout(() => setTitleError(false), 500);
      return;
    }

    const newTask = {
      id: `task_${Date.now()}`,
      title: taskTitle.trim(),
      description: '',
      dueDate: '',
      quadrant: selectedQuadrant,
      completed: false,
      createdAt: new Date().toISOString()
    };

    setTasks([...tasks, newTask]);
    await todoService.saveTasks([...tasks, newTask]);
    setShowAddModal(false);
    setTaskTitle('');
  };

  const toggleTaskComplete = async (taskId) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    await todoService.saveTasks(updatedTasks);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditQuadrant(task.quadrant);
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (!editTitle.trim()) {
      setTitleError(true);
      setTimeout(() => setTitleError(false), 500);
      return;
    }

    const updatedTasks = tasks.map(task =>
      task.id === editingTask.id
        ? { ...task, title: editTitle.trim(), quadrant: editQuadrant }
        : task
    );

    setTasks(updatedTasks);
    await todoService.saveTasks(updatedTasks);
    setShowEditModal(false);
  };

  const confirmDelete = async () => {
    const updatedTasks = tasks.filter(task => task.id !== deletingTask.id);
    setTasks(updatedTasks);
    await todoService.saveTasks(updatedTasks);
    setShowDeleteModal(false);
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    if (date < today) return 'Overdue';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dueDate) < today;
  };

  if (loading) {
    return <div className="matrix-loading">Loading tasks...</div>;
  }

  const totalTasks = tasks.filter(t => !t.completed).length;
  const completedTasks = tasks.filter(t => t.completed).length;

  return (
    <div className="matrix-container">
      {/* Header */}
      <div className="matrix-header">
        <div className="matrix-header-row">
          <h1>Eisenhower Matrix</h1>
          <button className="btn-add-task" onClick={() => setShowAddModal(true)}>
            + Add
          </button>
        </div>
        <div className="matrix-stats">
          <span>{totalTasks} active</span>
          <span>•</span>
          <span>{completedTasks} done</span>
        </div>
      </div>

      {/* Quadrants */}
      <div className="matrix-content">
        {QUADRANTS.map(quadrant => {
          const quadrantTasks = getTasksByQuadrant(quadrant.id);
          const completedQuadrantTasks = getCompletedTasksByQuadrant(quadrant.id);
          const isExpanded = expandedQuadrants[quadrant.id];

          return (
            <div key={quadrant.id} className="quadrant">
              <div className="quadrant-header" style={{ borderLeftColor: quadrant.color }}>
                <div className="quadrant-info" onClick={() => toggleQuadrant(quadrant.id)}>
                  <span className="quadrant-icon">{quadrant.icon}</span>
                  <div>
                    <h2>{quadrant.title}</h2>
                    <p>{quadrant.subtitle}</p>
                  </div>
                </div>
                <div className="quadrant-actions">
                  <span className="task-count">{quadrantTasks.length}</span>
                  <button className="btn-expand" onClick={() => toggleQuadrant(quadrant.id)}>
                    <span className={isExpanded ? 'expanded' : ''}>▼</span>
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="quadrant-tasks">
                  {quadrantTasks.length === 0 && completedQuadrantTasks.length === 0 ? (
                    <div className="empty-state">
                      <p className="empty-title">No tasks yet</p>
                      <p className="empty-hint">
                        {quadrant.id === 'urgent-important' && 'Add critical tasks with deadlines'}
                        {quadrant.id === 'not-urgent-important' && 'Plan long-term goals'}
                        {quadrant.id === 'urgent-not-important' && 'Tasks to delegate'}
                        {quadrant.id === 'not-urgent-not-important' && 'Time-wasters to eliminate'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {quadrantTasks.map(task => (
                        <div key={task.id} className="task" style={{ borderLeftColor: quadrant.color }}>
                          <div className="task-main">
                            <div className="task-checkbox" onClick={() => toggleTaskComplete(task.id)}>
                              {task.completed && <span>✓</span>}
                            </div>
                            <div className="task-info">
                              <div className="task-title">{task.title}</div>
                              {task.description && <div className="task-desc">{task.description}</div>}
                              {task.dueDate && (
                                <div className={`task-date ${isOverdue(task.dueDate) ? 'overdue' : ''}`}>
                                  📅 {formatDueDate(task.dueDate)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="task-actions">
                            <button className="btn-icon" onClick={() => openEditModal(task)}>✏️</button>
                            <button className="btn-icon" onClick={() => { setDeletingTask(task); setShowDeleteModal(true); }}>🗑️</button>
                          </div>
                        </div>
                      ))}

                      {completedQuadrantTasks.length > 0 && (
                        <div className="completed-section">
                          <div className="completed-header">Completed ({completedQuadrantTasks.length})</div>
                          {completedQuadrantTasks.map(task => (
                            <div key={task.id} className="task completed">
                              <div className="task-main">
                                <div className="task-checkbox checked" onClick={() => toggleTaskComplete(task.id)}>
                                  <span>✓</span>
                                </div>
                                <div className="task-info">
                                  <div className="task-title">{task.title}</div>
                                </div>
                              </div>
                              <div className="task-actions">
                                <button className="btn-icon" onClick={() => { setDeletingTask(task); setShowDeleteModal(true); }}>🗑️</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowAddModal(false)} />
          <div className="modal">
            <div className="modal-handle" />
            <h3>Add New Task</h3>
            
            <label>Task Title *</label>
            <input
              type="text"
              placeholder="What needs to be done?"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className={titleError ? 'error' : ''}
              autoFocus
            />
            
            <label>Select Quadrant *</label>
            <div className="quadrant-chips">
              {QUADRANTS.map(q => (
                <button
                  key={q.id}
                  className={`chip ${selectedQuadrant === q.id ? 'active' : ''}`}
                  style={selectedQuadrant === q.id ? { 
                    backgroundColor: q.color + '15',
                    borderColor: q.color,
                    color: q.color
                  } : {}}
                  onClick={() => setSelectedQuadrant(q.id)}
                >
                  <span>{q.icon}</span>
                  <span>{q.title}</span>
                </button>
              ))}
            </div>
            
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-save" onClick={addTask}>Add Task</button>
            </div>
          </div>
        </>
      )}

      {/* Edit Task Modal */}
      {showEditModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowEditModal(false)} />
          <div className="modal">
            <div className="modal-handle" />
            <h3>Edit Task</h3>
            
            <label>Task Title *</label>
            <input
              type="text"
              placeholder="What needs to be done?"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className={titleError ? 'error' : ''}
              autoFocus
            />
            
            <label>Move to Quadrant</label>
            <div className="quadrant-chips">
              {QUADRANTS.map(q => (
                <button
                  key={q.id}
                  className={`chip ${editQuadrant === q.id ? 'active' : ''}`}
                  style={editQuadrant === q.id ? { 
                    backgroundColor: q.color + '15',
                    borderColor: q.color,
                    color: q.color
                  } : {}}
                  onClick={() => setEditQuadrant(q.id)}
                >
                  <span>{q.icon}</span>
                  <span>{q.title}</span>
                </button>
              ))}
            </div>
            
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-save" onClick={saveEdit}>Save</button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)} />
          <div className="modal modal-delete">
            <h3>Delete Task?</h3>
            <p className="delete-warning">
              Are you sure you want to delete "{deletingTask?.title}"? This cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn-delete" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TodoMatrix;
