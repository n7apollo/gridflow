# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GridFlow is a web-based project management tool that combines Kanban boards with hierarchical row organization and weekly planning. It features three main views:

- **Board View**: Matrix layout with groups, rows, columns, and cards
- **Task View**: Unified task list across all boards with filtering
- **Weekly Planning**: Focused weekly planning with daily columns and progress tracking

### Core Concepts
- **Groups**: Top-level categories (e.g., "Communications", "Development", "Marketing") with custom colors
- **Rows**: Specific projects within groups with names and optional descriptions (e.g., "Launch updated website version")
- **Columns**: Workflow stages (customizable, default: "To Do", "In Progress", "Done")
- **Cards**: Individual tasks that can move between any columns across any rows
- **Templates**: Reusable board structures for common workflows (grant applications, onboarding, etc.)
- **Weekly Planning**: Anti-overwhelm weekly focus system with mixed content types

## Architecture

### Core Data Structure (v3.0)
The application state is stored in a multi-board `appData` object:
```javascript
appData = {
    currentBoardId: 'default',
    boards: {
        'boardId': {
            name: 'Board Name',
            groups: [{ id, name, color, collapsed }],
            rows: [{ id, name, description, groupId, cards: { columnKey: [cards] } }],
            columns: [{ id, name, key }],
            settings: { showCheckboxes, showSubtaskProgress },
            nextRowId, nextCardId, nextColumnId, nextGroupId
        }
    },
    templates: [{ id, name, description, category, groups, rows, columns }],
    weeklyPlans: {
        'YYYY-Www': {
            weekStart: ISO_DATE,
            goal: 'Weekly focus goal',
            items: [{ id, type, day, title, content, completed, ... }],
            reflection: { wins, challenges, learnings, nextWeekFocus }
        }
    },
    nextTemplateId: 1,
    nextWeeklyItemId: 1,
    version: '3.0'
}
```

### Key Technical Components

**Data Persistence**: Uses localStorage with key `gridflow_data`. All changes auto-save via `saveData()` function.

**Multi-View System**: Three main views accessible via navigation toggle:
1. **Board View**: `renderBoard()` → matrix grid layout with drag-and-drop
2. **Task View**: `renderTaskList()` → unified task management across all boards
3. **Weekly View**: `renderWeeklyPlan()` → anti-overwhelm weekly planning interface

**Enhanced Navigation**: Scalable board selection with search, recent boards, and dropdown menus for actions.

**Data Migration System**: Robust version-aware migration from v1.0 → v3.0:
- `migrateData()` → detects version and applies migration chain
- `validateAndCleanData()` → ensures data integrity after migration
- Backward compatibility for all export formats

**Template System**: Reusable board structures with pre-built workflows:
- Grant application templates, onboarding workflows, weekly planning templates
- Category-based organization and smart instantiation

**Weekly Planning System**: Anti-overwhelm productivity features:
- Weekly goals, daily planning columns, mixed content types (notes, checklists, linked cards)
- Progress tracking, historical navigation, weekly reflection prompts

### File Structure
- `index.html`: Complete UI structure with modals (~1,100 lines)
- `script.js`: All application logic (~4,800 lines)
- `style.css`: Responsive CSS with CSS Grid and weekly planning styles (~3,800 lines)

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
- `SortableJS` (1.15.0): Reliable drag-and-drop functionality

## Data Operations

### Import/Export Functions
- `exportToPDF()`: Renders board as multi-page PDF
- `exportToPNG()`: Captures board as high-res image
- `exportToExcel()`: Creates structured spreadsheet with group hierarchy
- `exportToJSON()`: Full data backup with version tracking
- `importFromJSON()`: Smart import with migration, merge/replace options, and validation

### Migration System
Version-aware data migration handles:
- **v1.0**: Original single-board format
- **v2.0**: Multi-board format  
- **v2.5**: Added template system
- **v3.0**: Added weekly planning system

Migration functions:
- `detectVersion()`: Auto-detect data version from structure
- `migrateToV2()`, `migrateToV2_5()`, `migrateToV3()`: Version-specific migrations
- `mergeImportedData()`: Smart merging with conflict resolution

### Template System
- `populateDefaultTemplates()`: Adds pre-built templates (grant applications, onboarding, etc.)
- `createTemplate()`: Save current board structure as reusable template
- `applySelectedTemplate()`: Instantiate template with new IDs and smart mapping
- Category-based organization and filtering

### Weekly Planning
- `initializeWeeklyPlanning()`: Set up current week structure
- `renderWeeklyPlan()`: Render weekly interface with progress tracking
- `addCardToWeeklyPlan()`: Link project cards to weekly focus
- Mixed content support: notes, checklists, linked cards
- Weekly reflection system and historical navigation

### CRUD Pattern
All entities (groups, rows, columns, cards, templates, weekly items) follow consistent patterns:
1. `add{Entity}()` → opens modal with appropriate form
2. `save{Entity}()` → validates, assigns ID, and persists
3. `edit{Entity}()` → loads existing data into modal
4. `delete{Entity}()` → confirms and removes with cleanup

## State Management

### Global Variables
- `appData`: Main application state (multi-board, templates, weekly plans)
- `boardData`: Reference to current board for backward compatibility
- `currentEditing{Entity}`: Tracks modal state for each entity type
- `currentWeekKey`: Current week identifier for weekly planning
- Enhanced navigation state managed by dropdown/mobile menu functions

### ID Management
- Auto-incrementing IDs via `next{Entity}Id` counters at both app and board levels
- Smart ID conflict resolution during data import and merging
- Version-aware migration ensures ID consistency across data format changes

### Board Management
- `switchBoard()`: Change active board and update all UI components
- `updateCurrentBoardDisplay()`: Sync enhanced navigation with current board
- Recent boards tracking via localStorage for quick access

## CSS Grid Architecture

Dynamic grid system that adjusts to column count:
```css
grid-template-columns: 200px repeat(var(--column-count, 3), 1fr)
```

**Weekly Planning Layout**: Responsive grid for daily columns:
```css
.daily-planning-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}
```

## Navigation System

**Enhanced Header Navigation**:
- Scalable board selector with search and recent boards
- Responsive action grouping (primary, secondary, tertiary)
- Mobile-first design with hamburger menu
- Progressive disclosure for advanced features

**Mobile Optimization**:
- Touch-friendly interactions
- Slide-out mobile menu with organized sections
- Responsive breakpoints at 768px and 480px

## Testing Considerations

No automated tests exist. Manual testing should cover:
- All CRUD operations for each entity type (boards, cards, templates, weekly items)
- Data migration from different export versions
- Import/export functionality with merge and replace scenarios
- Multi-board navigation and switching
- Weekly planning workflow (goal setting, item management, progress tracking)
- Template creation and application
- Mobile responsiveness and touch interactions
- Cross-device data sync via JSON export/import