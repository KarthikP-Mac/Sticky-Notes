import React, { useState, useEffect, useRef } from 'react';
import { 
  Pin, 
  Trash2, 
  Download, 
  Tag, 
  X, 
  GripHorizontal, 
  MoreVertical, 
  FileText, 
  Printer, 
  Code,
  SmilePlus
} from 'lucide-react';
import EmojiDropdown from './EmojiDropdown';
import { exportToTxt, printNotes, exportSingleJson } from '../utils/exportHelpers';

export const NOTE_COLORS = [
  { name: 'yellow', light: '#fef9c3', dark: '#1e1c0d', textLight: '#713f12', textDark: '#fef08a', borderLight: '#fef08a', borderDark: '#453e16', glow: 'rgba(254, 240, 138, 0.4)' },
  { name: 'green', light: '#dcfce7', dark: '#0a1d11', textLight: '#14532d', textDark: '#bbf7d0', borderLight: '#bbf7d0', borderDark: '#164e26', glow: 'rgba(187, 247, 208, 0.4)' },
  { name: 'blue', light: '#dbeafe', dark: '#0c162d', textLight: '#1e3a8a', textDark: '#bfdbfe', borderLight: '#bfdbfe', borderDark: '#1e3a8a', glow: 'rgba(191, 219, 254, 0.4)' },
  { name: 'pink', light: '#fce7f3', dark: '#240a1b', textLight: '#701a75', textDark: '#fbcfe8', borderLight: '#fbcfe8', borderDark: '#701a75', glow: 'rgba(251, 207, 232, 0.4)' },
  { name: 'purple', light: '#f3e8ff', dark: '#1c0a29', textLight: '#581c87', textDark: '#e9d5ff', borderLight: '#e9d5ff', borderDark: '#581c87', glow: 'rgba(233, 213, 255, 0.4)' },
  { name: 'orange', light: '#ffedd5', dark: '#261208', textLight: '#7c2d12', textDark: '#fed7aa', borderLight: '#fed7aa', borderDark: '#7c2d12', glow: 'rgba(254, 215, 170, 0.4)' },
  { name: 'slate', light: '#f1f5f9', dark: '#111827', textLight: '#334155', textDark: '#f1f5f9', borderLight: '#e2e8f0', borderDark: '#334155', glow: 'rgba(226, 232, 240, 0.4)' }
];

export default function NoteCard({
  note,
  onUpdate,
  onDelete,
  onPin,
  allTags,
  layoutMode,
  theme,
  onDragStart, // used in grid view
  onDragEnd,   // used in grid view
  onCanvasDragStart // used in canvas view
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const menuRef = useRef(null);
  const textareaRef = useRef(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [note.content]);

  // Find current colors
  const colorSchema = NOTE_COLORS.find(c => c.name === note.color) || NOTE_COLORS[0];
  const cardBgColor = theme === 'dark' ? colorSchema.dark : colorSchema.light;
  const cardBorderColor = theme === 'dark' ? colorSchema.borderDark : colorSchema.borderLight;
  const cardTextColor = theme === 'dark' ? colorSchema.textDark : colorSchema.textLight;

  const handleTitleChange = (e) => {
    onUpdate({ ...note, title: e.target.value });
  };

  const handleContentChange = (e) => {
    onUpdate({ ...note, content: e.target.value });
  };

  // Blur triggers update of timestamp
  const handleBlur = () => {
    onUpdate({ ...note, updatedAt: Date.now() });
  };

  const handleColorChange = (colorName) => {
    onUpdate({ ...note, color: colorName, updatedAt: Date.now() });
    setIsMenuOpen(false);
  };

  const handleEmojiSelect = (emoji) => {
    onUpdate({ ...note, emoji: emoji, updatedAt: Date.now() });
  };

  const handleRemoveEmoji = () => {
    onUpdate({ ...note, emoji: null, updatedAt: Date.now() });
  };

  // Inserts emoji at cursor position inside body textarea
  const handleBodyEmojiSelect = (emoji) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    const newContent = before + emoji + after;
    onUpdate({
      ...note,
      content: newContent,
      updatedAt: Date.now()
    });

    // Reset cursor position after React re-renders
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    }, 50);
  };

  const handleAddTagSubmit = (e) => {
    e.preventDefault();
    const cleanTag = newTagInput.trim().toLowerCase();
    if (cleanTag && (!note.tags || !note.tags.includes(cleanTag))) {
      const updatedTags = note.tags ? [...note.tags, cleanTag] : [cleanTag];
      onUpdate({ ...note, tags: updatedTags, updatedAt: Date.now() });
    }
    setNewTagInput('');
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove) => {
    const updatedTags = note.tags.filter(t => t !== tagToRemove);
    onUpdate({ ...note, tags: updatedTags, updatedAt: Date.now() });
  };

  // Custom Mouse Dragging for Canvas View
  const handleCanvasMouseDown = (e) => {
    if (layoutMode !== 'canvas') return;
    
    // Ignore drags on input/textarea/buttons/dropdowns
    const targetTag = e.target.tagName.toLowerCase();
    if (
      targetTag === 'input' || 
      targetTag === 'textarea' || 
      targetTag === 'button' || 
      targetTag === 'svg' || 
      targetTag === 'path' ||
      e.target.closest('.emoji-dropdown-wrapper') ||
      e.target.closest('.card-menu-container') ||
      e.target.closest('.tag-item')
    ) {
      return;
    }

    e.preventDefault();
    if (onCanvasDragStart) {
      onCanvasDragStart(e, note.id);
    }
  };

  // HTML5 Drag and Drop Events for Grid View
  const handleGridDragStart = (e) => {
    if (layoutMode === 'canvas') return;
    e.dataTransfer.setData('text/plain', note.id);
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) onDragStart(e, note.id);
  };

  const handleExportSingleJson = () => {
    exportSingleJson(note);
    setIsMenuOpen(false);
  };

  return (
    <div
      className={`note-card ${note.pinned ? 'pinned' : ''} ${layoutMode}-mode`}
      style={{
        backgroundColor: cardBgColor,
        borderColor: cardBorderColor,
        color: cardTextColor,
        boxShadow: note.pinned ? `0 10px 25px -5px ${colorSchema.glow}, 0 8px 10px -6px ${colorSchema.glow}` : '',
        ...(layoutMode === 'canvas' ? { left: `${note.x}px`, top: `${note.y}px`, position: 'absolute' } : {})
      }}
      draggable={layoutMode === 'grid'}
      onDragStart={handleGridDragStart}
      onDragEnd={onDragEnd}
      onMouseDown={handleCanvasMouseDown}
    >
      {/* Drag handle visible only in Canvas View */}
      {layoutMode === 'canvas' && (
        <div className="canvas-drag-handle" title="Drag to move note">
          <GripHorizontal size={14} />
        </div>
      )}

      {/* Note Header */}
      <div className="note-card-header">
        <div className="note-emoji-title-row">
          {/* Note Emoji Selector */}
          <div className="note-header-emoji-container">
            {note.emoji ? (
              <span className="current-note-emoji" onClick={handleRemoveEmoji} title="Click to remove emoji">
                {note.emoji}
              </span>
            ) : (
              <EmojiDropdown 
                onSelect={handleEmojiSelect} 
                triggerClassName="add-note-emoji-btn" 
                placement="bottom-start"
              />
            )}
          </div>

          <input
            type="text"
            className="note-title-input"
            value={note.title}
            onChange={handleTitleChange}
            onBlur={handleBlur}
            placeholder="Untitled Note"
            style={{ color: cardTextColor }}
          />
        </div>

        <div className="note-header-actions">
          {/* Pin Button */}
          <button
            type="button"
            className={`note-action-btn pin-btn ${note.pinned ? 'active' : ''}`}
            onClick={() => onPin(note.id)}
            title={note.pinned ? "Unpin note" : "Pin note"}
            style={{ color: cardTextColor }}
          >
            <Pin size={16} fill={note.pinned ? 'currentColor' : 'transparent'} />
          </button>

          {/* More options menu */}
          <div className="card-menu-container" ref={menuRef}>
            <button
              type="button"
              className="note-action-btn menu-btn"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              title="More options"
              style={{ color: cardTextColor }}
            >
              <MoreVertical size={16} />
            </button>

            {isMenuOpen && (
              <div className="card-dropdown-menu">
                {/* Colors list */}
                <div className="menu-colors-section">
                  <span className="menu-section-label">Colors</span>
                  <div className="colors-picker-grid">
                    {NOTE_COLORS.map(c => (
                      <button
                        key={c.name}
                        type="button"
                        className={`color-dot ${note.color === c.name ? 'active' : ''}`}
                        style={{ backgroundColor: theme === 'dark' ? c.borderDark : c.borderLight }}
                        onClick={() => handleColorChange(c.name)}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="menu-divider" />

                {/* Individual Exports */}
                <button type="button" className="menu-item-btn" onClick={() => { exportToTxt(note); setIsMenuOpen(false); }}>
                  <FileText size={14} /> Export TXT
                </button>
                <button type="button" className="menu-item-btn" onClick={handleExportSingleJson}>
                  <Code size={14} /> Export JSON
                </button>
                <button type="button" className="menu-item-btn" onClick={() => { printNotes([note]); setIsMenuOpen(false); }}>
                  <Printer size={14} /> Print / PDF
                </button>

                <div className="menu-divider" />

                {/* Delete */}
                <button type="button" className="menu-item-btn delete-item-btn" onClick={() => { onDelete(note.id); setIsMenuOpen(false); }}>
                  <Trash2 size={14} /> Delete Note
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Note Body */}
      <div className="note-card-body">
        <textarea
          ref={textareaRef}
          className="note-content-textarea"
          value={note.content}
          onChange={handleContentChange}
          onBlur={handleBlur}
          placeholder="Start typing..."
          style={{ color: cardTextColor }}
        />
        
        {/* Insert emoji inside textarea */}
        <div className="body-emoji-helper">
          <EmojiDropdown 
            onSelect={handleBodyEmojiSelect} 
            triggerClassName="body-emoji-trigger-btn"
            placement="top-start"
          />
        </div>
      </div>

      {/* Note Footer: Tags and Timestamps */}
      <div className="note-card-footer">
        {/* Tags */}
        <div className="note-tags-container">
          {note.tags && note.tags.map(tag => (
            <span key={tag} className="tag-item">
              #{tag}
              <button type="button" className="remove-tag-btn" onClick={() => handleRemoveTag(tag)} title="Remove tag">
                <X size={10} />
              </button>
            </span>
          ))}

          {isAddingTag ? (
            <form onSubmit={handleAddTagSubmit} className="add-tag-form">
              <input
                autoFocus
                type="text"
                className="add-tag-input"
                placeholder="new tag..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onBlur={() => setTimeout(() => setIsAddingTag(false), 200)}
              />
            </form>
          ) : (
            <button
              type="button"
              className="add-tag-pill-btn"
              onClick={() => setIsAddingTag(true)}
              title="Add Tag"
              style={{ color: cardTextColor }}
            >
              <Tag size={12} />
              <span>+ Tag</span>
            </button>
          )}
        </div>

        {/* Timestamps */}
        <div className="note-timestamps">
          <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
          {note.updatedAt && (
            <span className="updated-timestamp" title={new Date(note.updatedAt).toLocaleString()}>
              • Updated
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
