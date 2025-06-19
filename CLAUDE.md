# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GridFlow is a web-based project management tool that combines Kanban boards with hierarchical row organization. It features a matrix layout where:

- **Groups**: Top-level categories (e.g., "Communications", "Development", "Marketing") with custom colors
- **Rows**: Specific projects within groups with names and optional descriptions (e.g., "Launch updated website version")
- **Columns**: Workflow stages (customizable, default: "To Do", "In Progress", "Done")
- **Cards**: Individual tasks that can move between any columns across any rows

## Architecture

### Core Data Structure
The application state is stored in a single `boardData` object with the following hierarchy:
```
boardData = {
    groups: [{ id, name, color, collapsed }],
    rows: [{ id, name, description, groupId, cards: { columnKey: [cards] } }],
    columns: [{ id, name, key }],
    settings: { showCheckboxes }
}
```

### Key Technical Components

**Data Persistence**: Uses localStorage with key `gridflow_data`. All changes auto-save via `saveData()` function.

**Rendering Pipeline**: 
1. `renderBoard()` → orchestrates full re-render
2. `renderColumnHeaders()` → builds dynamic CSS grid headers
3. `renderGroupsAndRows()` → builds hierarchical structure with drop zones
4. `updateCSSGridColumns()` → adjusts CSS grid template dynamically

**Drag-and-Drop System**: Multi-type drag system supporting:
- Cards: move between any columns across any rows (full flexibility)
- Rows: move between groups or reorder within groups  
- Groups: reorder entire group hierarchy
- Uses `draggedType` variable to differentiate behavior

### File Structure
- `index.html`: Complete UI structure with modals for CRUD operations
- `script.js`: All application logic (~1300 lines)
- `style.css`: Responsive CSS with CSS Grid for matrix layout

## Development Commands

### Running the Application
```bash
# Start local development server
python3 -m http.server 8000
# Then open http://localhost:8000
```

### No Build Process
This is a vanilla HTML/CSS/JavaScript application with no build steps, package managers, or transpilation required.

## External Dependencies

CDN-loaded libraries (loaded in index.html):
- `html2canvas` (1.4.1): PNG export functionality
- `jsPDF` (2.5.1): PDF export functionality  
- `xlsx` (0.18.5): Excel export functionality

## Data Operations

### Import/Export Functions
- `exportToPDF()`: Renders board as multi-page PDF
- `exportToPNG()`: Captures board as high-res image
- `exportToExcel()`: Creates structured spreadsheet with group hierarchy
- `exportToJSON()`: Full data backup
- `importFromJSON()`: Restore from backup with data validation

### CRUD Pattern
All entities (groups, rows, columns, cards) follow the same pattern:
1. `add{Entity}()` → opens modal
2. `save{Entity}()` → validates and persists
3. `edit{Entity}()` → loads existing data into modal
4. `delete{Entity}()` → confirms and removes

### Reordering System
Two methods available:
1. **Drag-and-drop**: Direct manipulation with visual drop zones
2. **Settings UI**: Up/down arrow buttons in settings panel (more reliable)

## State Management

### Global Variables
- `boardData`: Main application state
- `currentEditing{Entity}`: Tracks modal state for each entity type
- `draggedElement`, `draggedType`: Drag-and-drop state

### ID Management
Auto-incrementing IDs via `next{Entity}Id` counters. When importing data, these are recalculated to prevent conflicts.

## CSS Grid Architecture

Dynamic grid system that adjusts to column count:
```css
grid-template-columns: 200px repeat(var(--column-count, 3), 1fr)
```

Column count is set via CSS custom property updated by `updateCSSGridColumns()`.

## Hierarchical Organization

Groups can be collapsed/expanded and contain multiple rows. Rows can be moved between groups or left ungrouped. The rendering maintains this hierarchy while supporting drag-and-drop reordering at all levels.

## Testing Considerations

No automated tests exist. Manual testing should cover:
- All CRUD operations for each entity type
- Drag-and-drop between all valid drop zones
- Export functionality with various data configurations
- Data persistence across browser sessions
- Responsive behavior on mobile devices