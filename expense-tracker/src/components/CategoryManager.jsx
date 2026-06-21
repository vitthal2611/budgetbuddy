import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';

export default function CategoryManager() {
  const { categories, addCategory, updateCategory, deleteCategory } = useData();
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [editingId, setEditingId] = useState(null);

  const resetForm = () => {
    setName('');
    setBudget('');
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !budget) return;

    if (editingId) {
      await updateCategory(editingId, { name: name.trim(), monthlyBudget: budget });
    } else {
      await addCategory({ name: name.trim(), monthlyBudget: budget });
    }
    resetForm();
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setName(cat.name);
    setBudget(cat.monthlyBudget);
  };

  return (
    <div className="panel">
      <h2>Categories</h2>

      <form className="inline-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Monthly budget"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          min="0"
          step="0.01"
          required
        />
        <button type="submit">{editingId ? 'Update' : 'Add'}</button>
        {editingId && (
          <button type="button" className="secondary" onClick={resetForm}>
            Cancel
          </button>
        )}
      </form>

      {categories.length === 0 ? (
        <p className="empty-hint">No categories yet. Add one above to start budgeting.</p>
      ) : (
        <ul className="category-list">
          {categories.map((cat) => (
            <li key={cat.id}>
              <span className="cat-name">{cat.name}</span>
              <span className="cat-budget">₹{cat.monthlyBudget.toLocaleString('en-IN')}/mo</span>
              <span className="row-actions">
                <button type="button" className="link-button" onClick={() => startEdit(cat)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="link-button danger"
                  onClick={() => deleteCategory(cat.id)}
                >
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
