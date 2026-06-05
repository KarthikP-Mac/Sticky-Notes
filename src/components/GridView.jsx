import React, { useState } from 'react';
import NoteCard from './NoteCard';

export default function GridView({
  notes,
  onUpdateNote,
  onDeleteNote,
  onPinNote,
  allTags,
  theme,
  onReorderNotes
}) {
  const [draggedId, setDraggedId] = useState(null);

  const handleDragStart = (e, noteId) => {
    setDraggedId(noteId);
  };

  const handleDragEnter = (e, targetId) => {
    if (draggedId && draggedId !== targetId) {
      onReorderNotes(draggedId, targetId);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  // Divide notes into Pinned and Unpinned
  const pinnedNotes = notes.filter(note => note.pinned);
  const unpinnedNotes = notes.filter(note => !note.pinned);

  const renderNoteGrid = (notesList, sectionTitle = '') => {
    if (notesList.length === 0) return null;
    
    return (
      <div className="grid-section">
        {sectionTitle && <h4 className="grid-section-title">{sectionTitle}</h4>}
        <div className="notes-grid">
          {notesList.map(note => (
            <div
              key={note.id}
              className={`note-grid-item-wrapper ${draggedId === note.id ? 'dragging' : ''}`}
              onDragEnter={(e) => handleDragEnter(e, note.id)}
            >
              <NoteCard
                note={note}
                onUpdate={onUpdateNote}
                onDelete={onDeleteNote}
                onPin={onPinNote}
                allTags={allTags}
                layoutMode="grid"
                theme={theme}
                onDragStart={(e) => handleDragStart(e, note.id)}
                onDragEnd={handleDragEnd}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="grid-view">
      {notes.length === 0 ? (
        <div className="grid-empty-state">
          <span className="empty-icon">📝</span>
          <h3>No notes found</h3>
          <p>Create a new note or change your search filter to get started.</p>
        </div>
      ) : (
        <>
          {/* Pinned Notes Section */}
          {renderNoteGrid(pinnedNotes, "📌 Pinned Notes")}

          {/* Other Notes Section */}
          {renderNoteGrid(unpinnedNotes, pinnedNotes.length > 0 ? "Others" : "")}
        </>
      )}
    </div>
  );
}
