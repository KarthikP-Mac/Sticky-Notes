import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  LayoutGrid, 
  Maximize2, 
  Sun, 
  Moon, 
  Download, 
  ChevronDown,
  FileText,
  Code,
  Printer,
  X,
  ArrowUpDown,
  Menu
} from 'lucide-react';
import { exportAllToTxt, exportToJson, exportToCsv, printNotes } from '../utils/exportHelpers';

export default function Toolbar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  layoutMode,
  onLayoutChange,
  theme,
  onThemeToggle,
  onAddNote,
  filteredNotes,
  onToggleSidebar
}) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportMenuRef = useRef(null);

  // Close export menu on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportOpen(false);
      }
    }
    if (isExportOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExportOpen]);

  return (
    <header className="app-toolbar">
      {/* Mobile Menu Toggle Button */}
      <button 
        type="button" 
        className="mobile-menu-btn" 
        onClick={onToggleSidebar}
        title="Toggle Sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Search Bar */}
      <div className="search-bar-wrapper">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          className="search-input"
          placeholder="Search notes, tags..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button 
            type="button" 
            className="clear-search-btn" 
            onClick={() => onSearchChange('')}
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Toolbar Actions */}
      <div className="toolbar-actions">
        {/* Sort Actions */}
        <div className="sort-selector-wrapper">
          <ArrowUpDown size={14} className="sort-icon" />
          <select 
            className="sort-select" 
            value={sortBy} 
            onChange={(e) => onSortChange(e.target.value)}
            title="Sort Notes"
          >
            <option value="updatedDesc">Last Updated (Newest)</option>
            <option value="createdDesc">Date Created (Newest)</option>
            <option value="createdAsc">Date Created (Oldest)</option>
            <option value="titleAsc">Title (A-Z)</option>
            <option value="color">Color</option>
          </select>
        </div>

        {/* Layout Toggle */}
        <div className="layout-toggle-group">
          <button
            type="button"
            className={`layout-toggle-btn ${layoutMode === 'grid' ? 'active' : ''}`}
            onClick={() => onLayoutChange('grid')}
            title="Grid Layout"
          >
            <LayoutGrid size={16} />
            <span className="layout-btn-text">Grid</span>
          </button>
          <button
            type="button"
            className={`layout-toggle-btn ${layoutMode === 'canvas' ? 'active' : ''}`}
            onClick={() => onLayoutChange('canvas')}
            title="Canvas Board (Free Positioning)"
          >
            <Maximize2 size={16} />
            <span className="layout-btn-text">Canvas</span>
          </button>
        </div>

        {/* Bulk Export Menu */}
        <div className="export-menu-container" ref={exportMenuRef}>
          <button
            type="button"
            className="export-dropdown-trigger"
            onClick={() => setIsExportOpen(!isExportOpen)}
            title="Export all filtered notes"
          >
            <Download size={16} />
            <span>Export</span>
            <ChevronDown size={14} />
          </button>

          {isExportOpen && (
            <div className="export-dropdown-menu">
              <button 
                type="button" 
                className="export-menu-item"
                onClick={() => { exportAllToTxt(filteredNotes); setIsExportOpen(false); }}
              >
                <FileText size={14} /> Export TXT
              </button>
              <button 
                type="button" 
                className="export-menu-item"
                onClick={() => { exportToJson(filteredNotes); setIsExportOpen(false); }}
              >
                <Code size={14} /> Export JSON
              </button>
              <button 
                type="button" 
                className="export-menu-item"
                onClick={() => { exportToCsv(filteredNotes); setIsExportOpen(false); }}
              >
                <Download size={14} /> Export CSV
              </button>
              <button 
                type="button" 
                className="export-menu-item"
                onClick={() => { printNotes(filteredNotes); setIsExportOpen(false); }}
              >
                <Printer size={14} /> Print / Save PDF
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={onThemeToggle}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Add Note Button */}
        <button
          type="button"
          className="add-note-btn-primary"
          onClick={onAddNote}
          title="Create New Note"
        >
          <Plus size={18} />
          <span>New Note</span>
        </button>
      </div>
    </header>
  );
}
