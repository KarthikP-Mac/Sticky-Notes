import React, { useState } from 'react';
import {
  Tags,
  Trash2,
  Layers,
  BarChart3,
  Pin,
  FolderOpen,
  X,
  Lock,
  Unlock
} from 'lucide-react';

export default function Sidebar({
  notes,
  tags,
  activeTag,
  onSelectTag,
  onAddTagToNote,
  onDeleteNote,
  onCreateTag,
  onDeleteTag,
  isSidebarOpen,
  privateCategories = [],
  onTogglePrivacy,
  isUnlocked
}) {
  const [isTrashHovered, setIsTrashHovered] = useState(false);
  const [hoveredTag, setHoveredTag] = useState(null);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagForm, setShowTagForm] = useState(false);
  const [tagError, setTagError] = useState('');

  // Stats calculation
  const totalNotes = notes.length;
  const pinnedNotesCount = notes.filter(n => n.pinned).length;
  const tagsCount = tags.length;

  // Calculate note counts per tag
  const getTagNoteCount = (tag) => {
    return notes.filter(n => n.tags && n.tags.includes(tag)).length;
  };

  // Drag over handlers
  const handleDragOverTag = (e, tag) => {
    e.preventDefault();
    setHoveredTag(tag);
  };

  const handleDragLeaveTag = () => {
    setHoveredTag(null);
  };

  const handleDropOnTag = (e, tag) => {
    e.preventDefault();
    setHoveredTag(null);
    const noteId = e.dataTransfer.getData('text/plain');
    if (noteId && onAddTagToNote) {
      onAddTagToNote(noteId, tag);
    }
  };

  // Trash Bin handlers
  const handleDragOverTrash = (e) => {
    e.preventDefault();
    setIsTrashHovered(true);
  };

  const handleDragLeaveTrash = () => {
    setIsTrashHovered(false);
  };

  const handleDropOnTrash = (e) => {
    e.preventDefault();
    setIsTrashHovered(false);
    const noteId = e.dataTransfer.getData('text/plain');
    if (noteId && onDeleteNote) {
      if (confirm("Are you sure you want to delete this note?")) {
        onDeleteNote(noteId);
      }
    }
  };

  const handleCreateTagSubmit = (e) => {
    e.preventDefault();
    const cleanTag = newTagInput.trim().toLowerCase();
    if (!cleanTag) {
      setNewTagInput('');
      setShowTagForm(false);
      setTagError('');
      return;
    }
    if (tags.includes(cleanTag)) {
      setTagError(`"${cleanTag}" already exists! Add a new name.`);
      return;
    }
    onCreateTag(cleanTag);
    setNewTagInput('');
    setShowTagForm(false);
    setTagError('');
  };

  const handleDeleteTagClick = (e, tag) => {
    e.stopPropagation(); // Don't trigger the filter button click
    if (confirm(`Delete category "#${tag}"? This will remove it from all notes.`)) {
      onDeleteTag(tag);
    }
  };

  return (
    <aside className={`app-sidebar ${isSidebarOpen ? 'mobile-open' : ''}`}>
      {/* App Branding */}
      <div className="sidebar-brand">
        <span className="brand-logo">✨</span>
        <h1 className="brand-name">StickyNotes</h1>
      </div>

      {/* Stats Section */}
      <div className="sidebar-section">
        <h3 className="section-title">
          <BarChart3 size={14} /> Stats
        </h3>
        <div className="stats-grid">
          <a
            href="#all"
            className={`stat-card ${activeTag === null ? 'active' : ''} no-underline`}
            title='Show all notes'
            onClick={(e) => {
              e.preventDefault();
              onSelectTag(null);
            }}
          >
            <span className="stat-value">{totalNotes}</span>
            <span className="stat-label">Total Notes</span>
          </a>
          <a
            href="#pinned"
            className={`stat-card ${activeTag === '__pinned__' ? 'active' : ''} no-underline`}
            title='Show pinned notes'
            onClick={(e) => {
              e.preventDefault();
              onSelectTag('__pinned__');
            }}
          >
            <span className="stat-value">{pinnedNotesCount}</span>
            <span className="stat-label">Pinned</span>
          </a>
          <a
            href="#categories"
            className="stat-card no-underline"
            title='View tag categories'
          >
            <span className="stat-value">{tagsCount}</span>
            <span className="stat-label">Tags</span>
          </a>
        </div>
      </div>

      {/* Categories/Tags Filter */}
      <div className="sidebar-section tags-section">
        <div className="section-header">
          <h3 className="section-title">
            <Tags size={14} /> Categories
          </h3>
          <button
            type="button"
            className="add-section-btn"
            onClick={() => setShowTagForm(!showTagForm)}
            title="Create Tag"
          >
            + New
          </button>
        </div>

        {showTagForm && (
          <form onSubmit={handleCreateTagSubmit} className="sidebar-tag-form">
            <input
              autoFocus
              type="text"
              className="sidebar-tag-input"
              placeholder="Tag name..."
              value={newTagInput}
              onChange={(e) => { setNewTagInput(e.target.value); setTagError(''); }}
              onBlur={() => setTimeout(() => { setShowTagForm(false); setTagError(''); }, 200)}
            />
            {tagError && (
              <span className="tag-error-msg">{tagError}</span>
            )}
          </form>
        )}

        <div className="tags-list">
          {/* "All" Notes Option */}
          <button
            type="button"
            className={`tag-filter-btn ${activeTag === null ? 'active' : ''}`}
            onClick={() => onSelectTag(null)}
          >
            <FolderOpen size={14} />
            <span className="tag-filter-label">All Notes</span>
            <span className="tag-filter-count">{totalNotes}</span>
          </button>

          {tags.map(tag => {
            const isPrivate = privateCategories.includes(tag);
            return (
              <div
                key={tag}
                className={`tag-filter-btn ${activeTag === tag ? 'active' : ''} ${hoveredTag === tag ? 'drag-over' : ''} ${isPrivate ? 'private-tag' : ''}`}
                onClick={() => onSelectTag(tag)}
                onDragOver={(e) => handleDragOverTag(e, tag)}
                onDragLeave={handleDragLeaveTag}
                onDrop={(e) => handleDropOnTag(e, tag)}
                title={isPrivate ? "Private locked category. Drag note here to tag and encrypt." : "Drag note here to tag"}
              >
                <span className="tag-hash">#</span>
                <span className="tag-filter-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {tag}
                  {isPrivate && <Lock size={11} className="tag-private-icon" />}
                </span>
                <span className="tag-filter-count">{getTagNoteCount(tag)}</span>
                {onTogglePrivacy && (
                  <button
                    type="button"
                    className={`tag-privacy-btn ${isPrivate ? 'is-private' : 'is-public'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePrivacy(tag);
                    }}
                    title={isPrivate ? 'Make public (unlock)' : 'Make private (lock & encrypt)'}
                  >
                    {isPrivate ? <Unlock size={12} /> : <Lock size={12} />}
                  </button>
                )}
                <button
                  type="button"
                  className="tag-delete-btn"
                  onClick={(e) => handleDeleteTagClick(e, tag)}
                  title={`Delete #${tag}`}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sidebar-spacer" />

      {/* Interactive Drag to Delete Zone */}
      <div
        className={`trash-drop-zone ${isTrashHovered ? 'hovered' : ''}`}
        onDragOver={handleDragOverTrash}
        onDragLeave={handleDragLeaveTrash}
        onDrop={handleDropOnTrash}
        title="Drag a note here to instantly delete it"
      >
        <Trash2 size={24} className="trash-icon" />
        <span className="trash-text">Drag here to Delete</span>
      </div>
    </aside>
  );
}
