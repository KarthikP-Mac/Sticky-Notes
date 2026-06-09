import React, { useState } from 'react';
import { X, Lock, Unlock, Trash2, Plus } from 'lucide-react';

export default function ManageCategoriesModal({
  isOpen,
  onClose,
  tags,
  privateCategories,
  onTogglePrivacy,
  onCreateTag,
  onDeleteTag
}) {
  const [newTagInput, setNewTagInput] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanTag = newTagInput.trim().toLowerCase();
    if (!cleanTag) {
      setError('');
      return;
    }
    if (tags.includes(cleanTag)) {
      setError(`Category "#${cleanTag}" already exists!`);
      return;
    }
    onCreateTag(cleanTag);
    setNewTagInput('');
    setError('');
  };

  const isDefaultCategory = (tag) => {
    return ['tutorial', 'welcome', 'personal', 'work', 'ideas'].includes(tag);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content categories-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manage Categories & Privacy</h2>
          <button className="close-btn" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        <p className="modal-description">
          Toggle privacy on categories to instantly encrypt their notes. Private category notes are hidden from logged-out views.
        </p>

        {/* Add Category Form inside Modal */}
        <form onSubmit={handleSubmit} className="modal-tag-form">
          <input
            type="text"
            className="modal-tag-input"
            placeholder="Create a new category label..."
            value={newTagInput}
            onChange={(e) => { setNewTagInput(e.target.value); setError(''); }}
          />
          <button type="submit" className="modal-add-tag-btn">
            <Plus size={16} /> Add
          </button>
        </form>
        {error && <span className="modal-error-msg">{error}</span>}

        <div className="categories-list-container">
          {tags.map(tag => {
            const isPrivate = privateCategories.includes(tag);
            return (
              <div key={tag} className="category-item-row">
                <span className="category-name-label">
                  <span className="category-hash">#</span>{tag}
                  {isDefaultCategory(tag) && <span className="default-badge">default</span>}
                </span>

                <div className="category-action-buttons">
                  {/* Privacy Toggle Button */}
                  <button
                    type="button"
                    className={`privacy-toggle-btn ${isPrivate ? 'private' : 'public'}`}
                    onClick={() => onTogglePrivacy(tag)}
                    title={isPrivate ? "Click to make public (Unlock)" : "Click to encrypt & make private (Lock)"}
                  >
                    {isPrivate ? (
                      <>
                        <Lock size={14} />
                        <span>Private</span>
                      </>
                    ) : (
                      <>
                        <Unlock size={14} />
                        <span>Public</span>
                      </>
                    )}
                  </button>

                  {/* Delete Button (Only for custom tags) */}
                  {!isDefaultCategory(tag) && (
                    <button
                      type="button"
                      className="category-delete-btn"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete category "#${tag}"? This will remove it from all notes.`)) {
                          onDeleteTag(tag);
                        }
                      }}
                      title="Delete category"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
