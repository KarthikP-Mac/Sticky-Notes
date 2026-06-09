import React, { useRef, useEffect } from 'react';
import NoteCard from './NoteCard';

export default function CanvasBoard({
  notes,
  onUpdateNote,
  onDeleteNote,
  onPinNote,
  allTags,
  theme,
  onAddNoteAtPosition,
  isSelectMode = false,
  selectedNoteIds = [],
  onToggleSelect
}) {
  const boardRef = useRef(null);
  
  // Keep refs of latest props to avoid stale closures in window mouse listeners
  const notesRef = useRef(notes);
  const onUpdateNoteRef = useRef(onUpdateNote);
  
  useEffect(() => {
    notesRef.current = notes;
    onUpdateNoteRef.current = onUpdateNote;
  }, [notes, onUpdateNote]);

  const draggingRef = useRef(null); // stores { id, startX, startY, noteStartX, noteStartY }

  const handleCanvasDragStart = (e, noteId) => {
    const note = notesRef.current.find(n => n.id === noteId);
    if (!note) return;

    draggingRef.current = {
      id: noteId,
      startX: e.clientX,
      startY: e.clientY,
      noteStartX: note.x !== undefined ? note.x : 100,
      noteStartY: note.y !== undefined ? note.y : 100
    };

    window.addEventListener('mousemove', handleCanvasMouseMove);
    window.addEventListener('mouseup', handleCanvasMouseUp);
  };

  const handleCanvasMouseMove = (e) => {
    const dragInfo = draggingRef.current;
    if (!dragInfo) return;

    const dx = e.clientX - dragInfo.startX;
    const dy = e.clientY - dragInfo.startY;

    let newX = dragInfo.noteStartX + dx;
    let newY = dragInfo.noteStartY + dy;

    // Premium Snapping: Snaps notes to a clean 10px alignment grid
    newX = Math.round(newX / 10) * 10;
    newY = Math.round(newY / 10) * 10;

    // Boundaries: Prevent dragging notes outside the printable space (margin of 10px)
    newX = Math.max(10, newX);
    newY = Math.max(10, newY);

    const note = notesRef.current.find(n => n.id === dragInfo.id);
    if (note && (note.x !== newX || note.y !== newY)) {
      onUpdateNoteRef.current({
        ...note,
        x: newX,
        y: newY
      });
    }
  };

  const handleCanvasMouseUp = () => {
    const dragInfo = draggingRef.current;
    if (dragInfo) {
      // Trigger a final update to make sure the timestamp updates on drop finish
      const note = notesRef.current.find(n => n.id === dragInfo.id);
      if (note) {
        onUpdateNoteRef.current({
          ...note,
          updatedAt: Date.now()
        });
      }
    }
    draggingRef.current = null;
    window.removeEventListener('mousemove', handleCanvasMouseMove);
    window.removeEventListener('mouseup', handleCanvasMouseUp);
  };

  // Ensure window event listeners are removed if component unmounts mid-drag
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleCanvasMouseMove);
      window.removeEventListener('mouseup', handleCanvasMouseUp);
    };
  }, []);

  const handleDoubleClick = (e) => {
    if (e.target.classList.contains('canvas-board') || e.target.closest('.canvas-empty-state')) {
      const rect = boardRef.current.getBoundingClientRect();
      const x = Math.round((e.clientX - rect.left) / 10) * 10;
      const y = Math.round((e.clientY - rect.top) / 10) * 10;
      if (onAddNoteAtPosition) {
        onAddNoteAtPosition(x, y);
      }
    }
  };

  return (
    <div 
      className="canvas-board" 
      ref={boardRef} 
      onDoubleClick={handleDoubleClick}
      title="Double-click to create a note here"
    >
      {notes.length === 0 ? (
        <div className="canvas-empty-state">
          <span className="empty-icon">🎨</span>
          <h3>Canvas is empty</h3>
          <p>Click "New Note" in the toolbar to begin adding sticky notes.</p>
        </div>
      ) : (
        notes.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            onUpdate={onUpdateNote}
            onDelete={onDeleteNote}
            onPin={onPinNote}
            allTags={allTags}
            layoutMode="canvas"
            theme={theme}
            onCanvasDragStart={handleCanvasDragStart}
            isSelectMode={isSelectMode}
            isSelected={selectedNoteIds.includes(note.id)}
            onToggleSelect={onToggleSelect}
          />
        ))
      )}
    </div>
  );
}
