import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import GridView from './components/GridView';
import CanvasBoard from './components/CanvasBoard';

const getInitialNotes = () => {
  const saved = localStorage.getItem('sticky_notes_data');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse notes from localStorage", e);
    }
  }
  // Fallback default mockup/tutorial notes
  return [
    {
      id: '1',
      title: 'Welcome to StickyNotes! ✨',
      content: 'Here are some quick tips to get you started:\n\n• Double-click anywhere on the canvas in "Canvas Board" mode to spawn a new note at that exact spot!\n• Type tags like #work or #personal to automatically group notes.\n• Pin notes to top by clicking the pin icon.\n• Export notes using the toolbar or note card options.',
      emoji: '✨',
      color: 'yellow',
      tags: ['tutorial', 'welcome'],
      pinned: true,
      createdAt: Date.now() - 3600000 * 2,
      updatedAt: Date.now() - 3600000,
      x: 60,
      y: 60
    },
    {
      id: '2',
      title: 'Corkboard Canvas Board 🎨',
      content: 'Switch layout modes using the layout buttons in the toolbar!\n\nIn Canvas view, you can drag notes around freely. Your custom coordinates snap to a grid and are saved automatically.',
      emoji: '🎨',
      color: 'blue',
      tags: ['tutorial'],
      pinned: false,
      createdAt: Date.now() - 3600000,
      updatedAt: null,
      x: 380,
      y: 60
    },
    {
      id: '3',
      title: 'Drag and Drop features 🚀',
      content: 'In Grid view, try these drag gestures:\n\n• Drag a note card and drop it onto any tag in the sidebar to assign that tag!\n• Drag a card into the red "Trash Bin" at the bottom of the sidebar to delete it.\n• Drag and drop notes within the grid to reorder their priority.',
      emoji: '🚀',
      color: 'green',
      tags: ['tutorial'],
      pinned: false,
      createdAt: Date.now(),
      updatedAt: null,
      x: 60,
      y: 330
    }
  ];
};

const getInitialTags = () => {
  const saved = localStorage.getItem('sticky_notes_tags');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse tags", e);
    }
  }
  return ['tutorial', 'welcome', 'personal', 'work', 'ideas'];
};

const getInitialTheme = () => {
  const saved = localStorage.getItem('sticky_notes_theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getInitialLayout = () => {
  return localStorage.getItem('sticky_notes_layout') || 'grid';
};

function App() {
  const [notes, setNotes] = useState(getInitialNotes);
  const [tags, setTags] = useState(getInitialTags);
  const [theme, setTheme] = useState(getInitialTheme);
  const [layoutMode, setLayoutMode] = useState(getInitialLayout);

  // Filtering & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [sortBy, setSortBy] = useState('updatedDesc');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('sticky_notes_data', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('sticky_notes_tags', JSON.stringify(tags));
  }, [tags]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sticky_notes_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('sticky_notes_layout', layoutMode);
  }, [layoutMode]);

  // Handler for adding a note (optionally at a coordinates point)
  const handleAddNote = (x = null, y = null) => {
    // Clear search query so the new note is visible immediately
    setSearchQuery('');
    
    // Generate simple randomized coordinates if not provided, to avoid overlay
    const finalX = x !== null ? x : 100 + Math.floor(Math.random() * 80);
    const finalY = y !== null ? y : 120 + Math.floor(Math.random() * 80);

    const newNote = {
      id: Date.now().toString(),
      title: '',
      content: '',
      emoji: null,
      color: 'yellow',
      tags: activeTag ? [activeTag] : [],
      pinned: false,
      createdAt: Date.now(),
      updatedAt: null,
      x: finalX,
      y: finalY
    };

    setNotes(prevNotes => [newNote, ...prevNotes]);
  };

  const handleUpdateNote = (updatedNote) => {
    setNotes(prevNotes =>
      prevNotes.map(n => (n.id === updatedNote.id ? updatedNote : n))
    );
  };

  const handleDeleteNote = (noteId) => {
    setNotes(prevNotes => prevNotes.filter(n => n.id !== noteId));
  };

  const handlePinNote = (noteId) => {
    setNotes(prevNotes =>
      prevNotes.map(n => (n.id === noteId ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n))
    );
  };

  const handleAddTagToNote = (noteId, tag) => {
    setNotes(prevNotes =>
      prevNotes.map(n => {
        if (n.id === noteId) {
          const noteTags = n.tags || [];
          if (!noteTags.includes(tag)) {
            return { ...n, tags: [...noteTags, tag], updatedAt: Date.now() };
          }
        }
        return n;
      })
    );
  };

  const handleCreateTag = (newTag) => {
    const cleanTag = newTag.trim().toLowerCase();
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags(prevTags => [...prevTags, cleanTag]);
    }
  };

  const handleDeleteTag = (tagToDelete) => {
    // Remove from the global tags list
    setTags(prevTags => prevTags.filter(t => t !== tagToDelete));
    // Strip this tag from every note that has it
    setNotes(prevNotes =>
      prevNotes.map(n => {
        if (n.tags && n.tags.includes(tagToDelete)) {
          return { ...n, tags: n.tags.filter(t => t !== tagToDelete), updatedAt: Date.now() };
        }
        return n;
      })
    );
    // If we were filtering by this tag, reset to All Notes
    if (activeTag === tagToDelete) {
      setActiveTag(null);
    }
  };

  const handleReorderNotes = (draggedId, targetId) => {
    setNotes(prevNotes => {
      const draggedIndex = prevNotes.findIndex(n => n.id === draggedId);
      const targetIndex = prevNotes.findIndex(n => n.id === targetId);
      if (draggedIndex === -1 || targetIndex === -1) return prevNotes;

      const newNotes = [...prevNotes];
      const [removed] = newNotes.splice(draggedIndex, 1);
      newNotes.splice(targetIndex, 0, removed);
      return newNotes;
    });
  };

  // Extract all active tags dynamically in case some notes have custom tags not in categories sidebar
  useEffect(() => {
    const allNotesTags = notes.reduce((acc, note) => {
      if (note.tags) {
        note.tags.forEach(t => {
          if (!acc.includes(t)) acc.push(t);
        });
      }
      return acc;
    }, []);

    // Auto add newly created inline tags to the sidebar tags state list
    setTags(prevTags => {
      const merged = Array.from(new Set([...prevTags, ...allNotesTags]));
      if (merged.length !== prevTags.length) {
        return merged;
      }
      return prevTags;
    });
  }, [notes]);

  // Filtering Notes
  const filteredNotes = notes.filter(note => {
    const matchesSearch =
      (note.title && note.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (note.tags && note.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesTag = activeTag === null || (note.tags && note.tags.includes(activeTag));

    return matchesSearch && matchesTag;
  });

  // Sorting Notes
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (sortBy === 'updatedDesc') {
      const timeA = a.updatedAt || a.createdAt;
      const timeB = b.updatedAt || b.createdAt;
      return timeB - timeA;
    }
    if (sortBy === 'createdDesc') {
      return b.createdAt - a.createdAt;
    }
    if (sortBy === 'createdAsc') {
      return a.createdAt - b.createdAt;
    }
    if (sortBy === 'titleAsc') {
      const titleA = a.title || 'Untitled';
      const titleB = b.title || 'Untitled';
      return titleA.localeCompare(titleB);
    }
    if (sortBy === 'color') {
      return a.color.localeCompare(b.color);
    }
    return 0;
  });

  const handleThemeToggle = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <div id="root" className={theme}>
      {/* Sidebar Overlay for Mobile/Tablet */}
      {isSidebarOpen && (
        <div className="sidebar-overlay active" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar (Navigation & Tags) */}
      <Sidebar
        notes={notes}
        tags={tags}
        activeTag={activeTag}
        onSelectTag={(tag) => {
          setActiveTag(tag);
          setIsSidebarOpen(false); // Close sidebar on mobile once a category is selected
        }}
        onAddTagToNote={handleAddTagToNote}
        onDeleteNote={handleDeleteNote}
        onCreateTag={handleCreateTag}
        onDeleteTag={handleDeleteTag}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Board Container */}
      <main className="app-main-panel">
        <Toolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          layoutMode={layoutMode}
          onLayoutChange={setLayoutMode}
          theme={theme}
          onThemeToggle={handleThemeToggle}
          onAddNote={() => handleAddNote()}
          filteredNotes={sortedNotes}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <div className="app-content-area">
          {layoutMode === 'grid' ? (
            <GridView
              notes={sortedNotes}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              onPinNote={handlePinNote}
              allTags={tags}
              theme={theme}
              onReorderNotes={handleReorderNotes}
            />
          ) : (
            <CanvasBoard
              notes={sortedNotes}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              onPinNote={handlePinNote}
              allTags={tags}
              theme={theme}
              onAddNoteAtPosition={handleAddNote}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
