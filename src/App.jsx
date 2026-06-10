import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import GridView from './components/GridView';
import CanvasBoard from './components/CanvasBoard';

// Security Utilities & Modal Components
import {
  encryptData,
  decryptData,
  createOfflineVault,
  decryptOfflineVault,
  decodeGoogleCredential
} from './utils/cryptoUtils';

import PinSetupModal from './components/PinSetupModal';
import UnlockOverlay from './components/UnlockOverlay';



const getInitialNotes = () => {
  const savedPublic = localStorage.getItem('public_notes');
  if (savedPublic) {
    try {
      const parsed = JSON.parse(savedPublic);
      const privateCategories = JSON.parse(localStorage.getItem('private_category_list') || '[]');
      return parsed.filter(n => !n.tags || !n.tags.some(t => privateCategories.includes(t)));
    } catch (e) {
      console.error("Failed to parse public notes from localStorage", e);
    }
  }

  // Legacy fallback migration
  const savedLegacy = localStorage.getItem('sticky_notes_data');
  if (savedLegacy) {
    try {
      const parsedLegacy = JSON.parse(savedLegacy);
      const privateCategories = JSON.parse(localStorage.getItem('private_category_list') || '[]');
      return parsedLegacy.filter(n => !n.tags || !n.tags.some(t => privateCategories.includes(t)));
    } catch (e) {
      console.error("Failed to parse legacy notes from localStorage", e);
    }
  }

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

const getInitialPrivateCategories = () => {
  const saved = localStorage.getItem('private_category_list');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse private categories list", e);
    }
  }
  return [];
};

function App() {
  // Core Sticky Notes State
  const [notes, setNotes] = useState(getInitialNotes);
  const [tags, setTags] = useState(getInitialTags);
  const [theme, setTheme] = useState(getInitialTheme);
  const [layoutMode, setLayoutMode] = useState(getInitialLayout);

  // Filtering & Sidebar State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [sortBy, setSortBy] = useState('updatedDesc');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Security & Privacy State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [googleUserId, setGoogleUserId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [privateCategories, setPrivateCategories] = useState(getInitialPrivateCategories);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Modals Open State
  const [isPinSetupOpen, setIsPinSetupOpen] = useState(false);

  // Multi-Selection State
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState([]);

  // Global Vault Unlock Screen State
  const [isGlobalUnlockOpen, setIsGlobalUnlockOpen] = useState(false);

  // Detect connection status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync basic states to localStorage
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

  useEffect(() => {
    localStorage.setItem('private_category_list', JSON.stringify(privateCategories));
  }, [privateCategories]);

  // Synchronized Storage Partitioning Loop
  useEffect(() => {
    if (isUnlocked && googleUserId) {
      // Split public and private notes
      const publicNotes = [];
      const secureNotes = [];

      notes.forEach(note => {
        const isPrivate = note.tags && note.tags.some(t => privateCategories.includes(t));
        if (isPrivate) {
          secureNotes.push(note);
        } else {
          publicNotes.push(note);
        }
      });

      localStorage.setItem('public_notes', JSON.stringify(publicNotes));
      try {
        const encrypted = encryptData(secureNotes, googleUserId);
        localStorage.setItem(`secure_notes_${googleUserId}`, encrypted);
      } catch (e) {
        console.error("Encryption sync error", e);
      }
    } else {
      // Locked: save ONLY if the notes in state do not contain any private notes (race condition protection)
      const hasPrivateNotes = notes.some(note => note.tags && note.tags.some(t => privateCategories.includes(t)));
      if (!hasPrivateNotes) {
        localStorage.setItem('public_notes', JSON.stringify(notes));
      }
    }
  }, [notes, privateCategories, googleUserId, isUnlocked]);

  // Google Identity Services Credential Handler
  useEffect(() => {
    window.handleCredentialResponse = (response) => {
      try {
        const decoded = decodeGoogleCredential(response.credential);
        const sub = decoded.sub;
        const userData = {
          name: decoded.name || decoded.email,
          picture: decoded.picture,
          email: decoded.email
        };
        handleLoginSuccess(sub, userData);
      } catch (err) {
        console.error("Failed to process Google sign-in response", err);
        alert("Google Authentication failed. Please check your network or try again.");
      }
    };

    const initGoogleGSI = () => {
      if (window.google?.accounts?.id) {
        if (!window.gsiInitialized) {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: window.handleCredentialResponse,
            auto_select: false
          });
          window.gsiInitialized = true;
        }
      }
    };


    if (window.google) {
      initGoogleGSI();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          initGoogleGSI();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isOnline]);

  const handleLoginSuccess = (sub, userData) => {
    setGoogleUserId(sub);
    setCurrentUser(userData);

    // Decrypt secure notes bucket for this Google User
    let decryptedSecureNotes = [];
    const encryptedData = localStorage.getItem(`secure_notes_${sub}`);
    if (encryptedData) {
      try {
        decryptedSecureNotes = decryptData(encryptedData, sub) || [];
      } catch (err) {
        console.error("Decryption error", err);
        alert("Failed to decrypt your secure notes vault. Key mismatch.");
      }
    }

    // Merge secure notes into active notes array
    setNotes(prevNotes => {
      // Find public notes currently in state
      const publicNotes = prevNotes.filter(n => !n.tags || !n.tags.some(t => privateCategories.includes(t)));
      // Merge secure notes avoiding duplicates
      const merged = [...publicNotes, ...decryptedSecureNotes.filter(sn => !publicNotes.some(pn => pn.id === sn.id))];
      return merged;
    });

    setIsUnlocked(true);
    setIsGlobalUnlockOpen(false);

    // Prompt for PIN setup on first authentication
    const hasPinVault = localStorage.getItem('offline_key_vault');
    if (!hasPinVault) {
      setIsPinSetupOpen(true);
    }
  };

  const handleLock = () => {
    setGoogleUserId(null);
    setCurrentUser(null);
    setIsUnlocked(false);
    setIsGlobalUnlockOpen(false);

    // Clear private notes from active state memory
    setNotes(prevNotes =>
      prevNotes.filter(n => !n.tags || !n.tags.some(t => privateCategories.includes(t)))
    );

    // Reset view tag if it was private
    if (activeTag && privateCategories.includes(activeTag)) {
      setActiveTag(null);
    }
  };

  // Offline Unlock PIN handler
  const handlePinUnlock = (pin) => {
    const vault = localStorage.getItem('offline_key_vault');
    if (!vault) return false;

    const sub = decryptOfflineVault(vault, pin);
    if (sub) {
      const userData = {
        name: "Offline User",
        email: "offline@local.pwa",
        picture: null
      };
      handleLoginSuccess(sub, userData);
      return true;
    }
    return false;
  };

  // Developer Bypass Simulation for Local Evaluation
  const handleSimulateGoogleLogin = () => {
    const mockSub = "109876543210987654321";
    const mockUserData = {
      name: "Demo Developer",
      picture: null,
      email: "developer@demo.local"
    };
    handleLoginSuccess(mockSub, mockUserData);
  };

  const handlePinSetupSubmit = (pin) => {
    if (googleUserId) {
      const vaultData = createOfflineVault(googleUserId, pin);
      localStorage.setItem('offline_key_vault', vaultData);
      setIsPinSetupOpen(false);
      alert("Offline backup PIN configured successfully!");
    }
  };

  // Handler for creating a note (optionally at a coordinates point)
  const handleAddNote = (x = null, y = null, category = null) => {
    const noteCategory = category || activeTag;

    // Clear search query so the new note is visible immediately
    setSearchQuery('');

    const finalX = x !== null ? x : 100 + Math.floor(Math.random() * 80);
    const finalY = y !== null ? y : 120 + Math.floor(Math.random() * 80);

    const newNote = {
      id: Date.now().toString(),
      title: '',
      content: '',
      emoji: null,
      color: 'yellow',
      tags: noteCategory && noteCategory !== '__pinned__' ? [noteCategory] : [],
      pinned: false,
      createdAt: Date.now(),
      updatedAt: null,
      x: finalX,
      y: finalY
    };

    setNotes(prevNotes => [newNote, ...prevNotes]);
  };

  // Clear selection if category or search query changes
  useEffect(() => {
    setSelectedNoteIds([]);
  }, [activeTag, searchQuery]);

  const handleToggleSelectMode = () => {
    setIsSelectMode(prev => {
      const next = !prev;
      if (!next) {
        setSelectedNoteIds([]);
      }
      return next;
    });
  };

  const handleToggleSelectNote = (noteId) => {
    setSelectedNoteIds(prev => {
      if (prev.includes(noteId)) {
        return prev.filter(id => id !== noteId);
      } else {
        return [...prev, noteId];
      }
    });
  };

  const handleSelectAll = () => {
    const visibleNoteIds = sortedNotes.map(n => n.id);
    setSelectedNoteIds(visibleNoteIds);
  };

  const handleDeselectAll = () => {
    setSelectedNoteIds([]);
  };

  const handleDeleteSelected = () => {
    if (selectedNoteIds.length === 0) return;
    if (confirm(`Are you sure you want to delete the ${selectedNoteIds.length} selected notes?`)) {
      setNotes(prevNotes => prevNotes.filter(n => !selectedNoteIds.includes(n.id)));
      setSelectedNoteIds([]);
      setIsSelectMode(false);
    }
  };

  const handleDeleteAll = () => {
    const visibleNotes = sortedNotes;
    if (visibleNotes.length === 0) {
      alert("No notes to delete.");
      return;
    }
    const count = visibleNotes.length;
    const message = activeTag
      ? `Are you sure you want to delete all ${count} notes in the current category ("#${activeTag}")?`
      : `Are you sure you want to delete all ${count} notes?`;

    if (confirm(message)) {
      const visibleIds = visibleNotes.map(n => n.id);
      setNotes(prevNotes => prevNotes.filter(n => !visibleIds.includes(n.id)));
      setSelectedNoteIds([]);
      setIsSelectMode(false);
    }
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
    setTags(prevTags => prevTags.filter(t => t !== tagToDelete));
    setPrivateCategories(prev => prev.filter(c => c !== tagToDelete));

    setNotes(prevNotes =>
      prevNotes.map(n => {
        if (n.tags && n.tags.includes(tagToDelete)) {
          return { ...n, tags: n.tags.filter(t => t !== tagToDelete), updatedAt: Date.now() };
        }
        return n;
      })
    );

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

  // Sync tags dynamically from inline note tagging
  useEffect(() => {
    const allNotesTags = notes.reduce((acc, note) => {
      if (note.tags) {
        note.tags.forEach(t => {
          if (!acc.includes(t)) acc.push(t);
        });
      }
      return acc;
    }, []);

    setTags(prevTags => {
      const merged = Array.from(new Set([...prevTags, ...allNotesTags]));
      if (merged.length !== prevTags.length) {
        return merged;
      }
      return prevTags;
    });
  }, [notes]);

  // Toggle Category Privacy (Locking/Unlocking)
  const handleToggleCategoryPrivacy = (categoryName) => {
    if (!isUnlocked) {
      alert("Please unlock your secure vault first to manage category privacy settings.");
      return;
    }

    setPrivateCategories(prev => {
      const isPrivate = prev.includes(categoryName);
      if (isPrivate) {
        return prev.filter(c => c !== categoryName);
      } else {
        return [...prev, categoryName];
      }
    });
  };

  // Check if viewing a private category while locked, OR if user explicitly clicked Unlock Vault
  const isViewLocked = (activeTag && privateCategories.includes(activeTag) && !isUnlocked) || (isGlobalUnlockOpen && !isUnlocked);

  const handleCancelUnlock = () => {
    setIsGlobalUnlockOpen(false);
    if (activeTag && privateCategories.includes(activeTag)) {
      setActiveTag(null);
    }
  };

  // Filter Notes: Strip out private notes if locked, otherwise filter by search and active category
  const filteredNotes = notes.filter(note => {
    // If locked, hide private notes from all views
    if (!isUnlocked) {
      const isPrivate = note.tags && note.tags.some(t => privateCategories.includes(t));
      if (isPrivate) return false;
    }

    const matchesSearch =
      !searchQuery ||
      (note.title && note.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (note.tags && note.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

    let matchesTag = false;
    if (activeTag === null) {
      matchesTag = true;
    } else if (activeTag === '__pinned__') {
      matchesTag = note.pinned;
    } else {
      matchesTag = note.tags && note.tags.includes(activeTag);
    }

    return matchesSearch && matchesTag;
  });

  // Sorting
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

  const hasPinVault = localStorage.getItem('offline_key_vault') !== null;

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
        privateCategories={privateCategories}
        onSelectTag={(tag) => {
          setActiveTag(tag);
          setIsSidebarOpen(false);
        }}
        onAddTagToNote={handleAddTagToNote}
        onDeleteNote={handleDeleteNote}
        onCreateTag={handleCreateTag}
        onDeleteTag={handleDeleteTag}
        onTogglePrivacy={handleToggleCategoryPrivacy}
        isUnlocked={isUnlocked}
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
          isUnlocked={isUnlocked}
          onLock={handleLock}
          onUnlock={() => {
            setIsGlobalUnlockOpen(true);
          }}
          isOnline={isOnline}
          currentUser={currentUser}
          isSelectMode={isSelectMode}
          onToggleSelectMode={handleToggleSelectMode}
        />

        {isSelectMode && (
          <div className="selection-action-bar">
            <div className="selection-count">
              {selectedNoteIds.length} of {sortedNotes.length} notes selected
            </div>
            <div className="selection-actions">
              <button type="button" className="selection-btn" onClick={handleSelectAll}>
                Select All
              </button>
              <button type="button" className="selection-btn" onClick={handleDeselectAll} disabled={selectedNoteIds.length === 0}>
                Deselect All
              </button>
              <button type="button" className="selection-btn delete-btn" onClick={handleDeleteSelected} disabled={selectedNoteIds.length === 0}>
                Delete Selected
              </button>
              <button type="button" className="selection-btn delete-btn" onClick={handleDeleteAll} disabled={sortedNotes.length === 0}>
                Delete All
              </button>
              <button type="button" className="selection-btn cancel-btn" onClick={handleToggleSelectMode}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="app-content-area">
          {isViewLocked ? (
            <UnlockOverlay
              categoryName={activeTag || "Secure Vault"}
              isOnline={isOnline}
              onUnlockPin={handlePinUnlock}
              onSimulateGoogleLogin={handleSimulateGoogleLogin}
              hasPinVault={hasPinVault}
              onCancel={handleCancelUnlock}
            />
          ) : layoutMode === 'grid' ? (
            <GridView
              notes={sortedNotes}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              onPinNote={handlePinNote}
              allTags={tags}
              theme={theme}
              onReorderNotes={handleReorderNotes}
              isSelectMode={isSelectMode}
              selectedNoteIds={selectedNoteIds}
              onToggleSelect={handleToggleSelectNote}
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
              isSelectMode={isSelectMode}
              selectedNoteIds={selectedNoteIds}
              onToggleSelect={handleToggleSelectNote}
            />
          )}
        </div>
      </main>

      {/* Modals & Dialogs */}
      <PinSetupModal
        isOpen={isPinSetupOpen}
        onSubmit={handlePinSetupSubmit}
      />
    </div>
  );
}

export default App;
