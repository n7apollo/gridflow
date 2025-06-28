# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GridFlow is a web-based project management tool that combines Kanban boards with hierarchical row organization and weekly planning. It features three main views:

- **Board View**: Matrix layout with groups, rows, columns, and cards
- **Task View**: Unified task list across all boards with filtering
- **Weekly Planning**: Focused weekly planning with daily columns and progress tracking

## UI Framework & Design System

GridFlow uses a modern, responsive design stack:

- **DaisyUI + Tailwind CSS**: Component-based design system with utility-first styling
- **Lucide Icons**: SVG icon library for consistent iconography
- **Responsive Design**: Mobile-first approach with progressive enhancement
- **Component Architecture**: Custom HTML elements for modular UI

### Styling Guidelines
- Use DaisyUI component classes (e.g., `btn`, `card`, `modal`) for consistency
- Leverage Tailwind utilities for custom styling and spacing
- Icons should use Lucide SVG elements with proper rendering (avoid `textContent` for SVG)
- Follow mobile-first responsive breakpoints (768px, 480px)

### Core Concepts
- **Groups**: Top-level categories (e.g., "Communications", "Development", "Marketing") with custom colors
- **Rows**: Specific projects within groups with names and optional descriptions (e.g., "Launch updated website version")
- **Columns**: Workflow stages (customizable, default: "To Do", "In Progress", "Done")
- **Cards**: Individual tasks that can move between any columns across any rows
- **Templates**: Reusable board structures for common workflows (grant applications, onboarding, etc.)
- **Weekly Planning**: Anti-overwhelm weekly focus system with mixed content types

## Architecture

### Core Data Structure (v5.0)
The application state is stored in a multi-board `appData` object with unified entity system:
```javascript
appData = {
    currentBoardId: 'default',
    boards: {
        'boardId': {
            name: 'Board Name',
            groups: [{ id, name, color, collapsed }],
            rows: [{ id, name, description, groupId, cards: { columnKey: ['entity_123', 'note_1'] } }],
            columns: [{ id, name, key }],
            settings: { showCheckboxes, showSubtaskProgress },
            nextRowId, nextCardId, nextColumnId, nextGroupId
        }
    },
    entities: {
        'task_1': { id, type: 'task', title, content, completed, priority, dueDate, tags, ... },
        'note_1': { id, type: 'note', title, content, completed, tags, ... },
        'checklist_1': { id, type: 'checklist', title, content, items, tags, ... },
        'project_1': { id, type: 'project', title, content, status, team, milestones, ... }
    },
    templates: [{ id, name, description, category, groups, rows, columns }],
    templateLibrary: {
        categories: ['Project Management', 'Personal', 'Business', 'Education'],
        featured: [],
        taskSets: {},
        checklists: {},
        noteTemplates: {}
    },
    weeklyPlans: {
        'YYYY-Www': {
            weekStart: ISO_DATE,
            goal: 'Weekly focus goal',
            items: [{ id, entityId: 'note_1', day, addedAt }],
            reflection: { wins, challenges, learnings, nextWeekFocus }
        }
    },
    collections: {},
    tags: {},
    relationships: {
        entityTasks: {},
        cardToWeeklyPlans: {},
        weeklyPlanToCards: {},
        entityTags: {},
        collectionEntities: {},
        templateUsage: {}
    },
    nextTemplateId: 1,
    nextTemplateLibraryId: 1,
    nextWeeklyItemId: 1,
    nextTaskId: 1,
    nextNoteId: 1,
    nextChecklistId: 1,
    nextProjectId: 1,
    nextCollectionId: 1,
    nextTagId: 1,
    version: '5.0'
}
```

### Key Technical Components

**Unified Entity System**: Single source of truth for all content (tasks, notes, checklists, projects):
- Entities stored in flat `appData.entities` structure with consistent IDs (`task_1`, `note_2`, etc.)
- Context-aware rendering in boards, weekly planning, and task views
- Cross-context synchronization using custom events
- Entity-based references replace object-based storage

**Modular Architecture**: ES6 modules with clear separation of concerns:
- `js/core-data.js` → Data persistence, migration, state management
- `js/entity-core.js` → Entity CRUD operations and context management
- `js/entity-renderer.js` → Unified rendering system for different contexts
- `js/entity-migration.js` → Automatic data migration to entity system
- `js/entity-sync.js` → Cross-context synchronization with custom events
- `js/import-export.js` → Enhanced import/export with progress tracking
- Component-based UI system with `components/` directory

**Data Persistence**: Uses localStorage with key `gridflow_data`. All changes auto-save via `saveData()` function.

**Multi-View System**: Three main views with entity-aware rendering:
1. **Board View**: Matrix grid layout with entity-based cards and drag-and-drop
2. **Task View**: Unified task list across all boards with filtering
3. **Weekly View**: Entity-linked weekly planning with cross-context updates

**Enhanced Import/Export**: Professional import experience with progress tracking:
- Real-time progress modal with step-by-step feedback
- Integrated merge/replace choice UI (no popups)
- Migration logging and error handling
- Statistics display and completion actions
- Clear data functionality with safety confirmations

**Data Migration System**: Robust version-aware migration from v1.0 → v5.0:
- `migrateData()` → detects version and applies migration chain
- `validateAndCleanData()` → ensures data integrity after migration
- Automatic entity system migration for v4→v5 upgrades
- Backward compatibility for all export formats

**Template System**: Enhanced template library with reusable structures:
- Grant application templates, onboarding workflows, weekly planning templates
- Template library with categories and featured templates
- Smart instantiation with conflict resolution

**Weekly Planning System**: Entity-linked anti-overwhelm productivity features:
- Weekly goals, daily planning columns, entity references
- Progress tracking, historical navigation, weekly reflection prompts
- Cross-context updates when entities change

### File Structure
```
gridflow/
├── index.html                     # Main HTML structure with component system
├── style.css                      # Responsive CSS with import progress styles
├── js/
│   ├── app.js                     # Main application initialization
│   ├── core-data.js               # Data persistence and migration (v1.0→v5.0)
│   ├── entity-core.js             # Unified entity CRUD operations
│   ├── entity-renderer.js         # Context-aware entity rendering
│   ├── entity-migration.js        # Entity system migration (v4→v5)
│   ├── entity-sync.js             # Cross-context synchronization
│   ├── import-export.js           # Enhanced import/export with progress
│   ├── navigation.js              # Enhanced navigation system
│   ├── board-rendering.js         # Board view rendering
│   ├── weekly-planning.js         # Weekly planning functionality
│   ├── ui-management.js           # Modal and UI management
│   ├── utilities.js               # Shared utility functions
│   └── [other modules...]         # Additional feature modules
├── components/
│   ├── header.js                  # Navigation header component
│   ├── sidebar.js                 # Sidebar component
│   ├── views.js                   # Main view components
│   ├── modals.js                  # All modal dialogs
│   └── loader.js                  # Component system loader
└── CLAUDE.md                      # This documentation file
```

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

**UI Framework & Styling**:
- **DaisyUI**: Component library built on Tailwind CSS for consistent UI components
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide Icons**: SVG icon library for consistent iconography throughout the app

**CDN-loaded Libraries** (loaded in index.html):
- `html2canvas` (1.4.1): PNG export functionality
- `jsPDF` (2.5.1): PDF export functionality  
- `xlsx` (0.18.5): Excel export functionality
- `SortableJS` (1.15.0): Reliable drag-and-drop functionality

**Icon Rendering**: 
- Use `getEntityTypeIcon(type, asHTML)` for proper SVG rendering
- `asHTML = true` for template literals, `asHTML = false` for DOM appendChild
- Never use `textContent` with SVG elements (causes `[object SVGSVGElement]` display issue)

## Data Operations

### Enhanced Import/Export System
**Export Functions**:
- `exportToPDF()`: Renders board as multi-page PDF
- `exportToPNG()`: Captures board as high-res image
- `exportToExcel()`: Creates structured spreadsheet with group hierarchy
- `exportToJSON()`: Full data backup with version tracking
- `clearAllData()`: Safe data clearing with double confirmation

**Advanced Import Experience**:
- `importFromJSON()`: Professional import with progress modal
- Real-time progress tracking with step-by-step feedback
- Integrated merge/replace choice UI (no popups)
- Migration logging and error handling
- Import statistics and completion actions
- Automatic entity system migration for legacy data

### Migration System
Version-aware data migration handles all versions from v1.0 → v5.0:
- **v1.0**: Original single-board format
- **v2.0**: Multi-board format  
- **v2.5**: Added template system
- **v3.0**: Added weekly planning system
- **v4.0**: Added unified entity relationships
- **v5.0**: Unified entity system with flat storage

**Migration Functions**:
- `detectVersion()`: Auto-detect data version from structure
- `migrateToV2()` through `migrateToV5()`: Version-specific migrations
- `migrateToEntitySystem()`: Converts cards/items to entity references
- `mergeImportedData()`: Smart merging with conflict resolution
- `validateAndCleanData()`: Ensures data integrity with entity support

### Unified Entity System
**Core Entity Operations**:
- `createEntity(type, data)`: Create new entity with sequential ID
- `getEntity(entityId)`: Retrieve entity by ID
- `updateEntity(entityId, updates)`: Update entity properties
- `deleteEntity(entityId)`: Remove entity and cleanup references
- `toggleEntityCompletion(entityId)`: Toggle completion status

**Context Management**:
- `addEntityToContext()`: Link entity to board/weekly/task list
- `removeEntityFromContext()`: Remove entity from specific context
- `getEntitiesInContext()`: Retrieve entities in specific context
- `renderEntity(entityId, contextType, contextData)`: Context-aware rendering

**Cross-Context Synchronization**:
- Event-driven updates using custom events
- Automatic UI refresh when entities change
- Consistent display across board, weekly, and task views

### Template & Library System
**Template Operations**:
- Enhanced template library with categories and featured templates
- `createTemplate()`: Save current board structure as reusable template
- `applySelectedTemplate()`: Instantiate template with new IDs and smart mapping
- Template usage tracking and analytics

**Template Library**:
- Pre-built templates for common workflows
- Category-based organization and filtering
- Task sets and checklist templates for reuse

### Weekly Planning Integration
**Entity-Linked Planning**:
- `initializeWeeklyPlanning()`: Set up current week with entity support
- `renderWeeklyPlan()`: Render weekly interface with entity references
- `addEntityToWeeklyPlan()`: Link entities to weekly focus
- Cross-context updates when entities change in boards

**Weekly Planning Features**:
- Mixed content support: entity-linked notes, checklists, tasks
- Weekly reflection system and historical navigation
- Progress tracking with entity completion status

### CRUD Pattern
All entities and objects follow consistent patterns:
1. **Entity CRUD**: `createEntity()`, `updateEntity()`, `deleteEntity()`
2. **Board Objects**: `add{Object}()`, `save{Object}()`, `edit{Object}()`, `delete{Object}()`
3. **Context Management**: `addToContext()`, `removeFromContext()`, `moveInContext()`
4. **Validation**: Auto-ID assignment, conflict resolution, data integrity

### Cloud Sync System
**Automatic Cloud Backup**: Integration with jsonstorage.net for seamless data synchronization across devices.

**Core Sync Module** (`js/cloud-sync.js`):
- `CloudSync` class with smart sync scheduling and usage tracking
- Free tier optimization (512 requests/day, 32kb limit) with auto-upgrade prompts
- Secure API key storage with simple XOR encryption
- Automatic conflict resolution using existing merge logic
- Smart sync triggers: on data changes, app focus, manual triggers

**Sync UI Management** (`js/sync-ui.js`):
- Settings modal integration for API key configuration
- Real-time usage monitoring and limit warnings
- Status indicators in Data Management modal
- Manual sync controls with progress feedback

**Key Features**:
- **Offline-First**: Works perfectly without internet, syncs when available
- **Smart Limits**: Respects jsonstorage.net free tier limits, warns before hitting caps
- **User-Managed**: Each user provides their own API key and controls their data
- **Error Handling**: Graceful degradation with clear error messages and retry logic
- **First Sync**: Automatic cloud storage creation on initial sync
- **Cross-Device**: JSON export/import workflow enhanced with automatic cloud backup

**Configuration**:
1. User obtains API key from [app.jsonstorage.net](https://app.jsonstorage.net)
2. Configure in Settings → Cloud Sync → Enter API key
3. Auto-sync enabled by default (5-minute intervals when changes detected)
4. Manual sync available in Settings and Data Management modals

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
- Cross-context entity synchronization and updates
- Entity migration from legacy formats
- **Cloud sync functionality**: API key configuration, first sync, auto-sync, manual sync, error handling
- **Sync limit testing**: Free tier request limits, data size limits, error scenarios
- **Offline/online transitions**: Sync behavior when connectivity changes

## UI Components

**Component System**: HTML Custom Elements for modular UI:
- `<gridflow-header>`: Navigation header with board selector
- `<gridflow-sidebar>`: Collapsible sidebar navigation
- `<gridflow-views>`: Main content area with view switching
- `<gridflow-modals>`: All application modals and dialogs

**Modal Management**: Centralized modal system with event delegation:
- Form modals for entity creation/editing
- Import progress modal with real-time feedback
- Settings and configuration modals (including cloud sync configuration)
- Data management modal with cloud sync status
- Mobile-responsive overlay system using DaisyUI modal classes (`modal-open`)

**Responsive Design**: Mobile-first approach with progressive enhancement:
- CSS Grid for board layout with dynamic column count
- Touch-friendly interactions and gestures
- Responsive breakpoints at 768px and 480px
- Mobile menu with organized action sections

## Error Handling

**Import/Export Safety**:
- Comprehensive error handling with user feedback
- Progress tracking with rollback capability
- Data validation before migration
- Double confirmation for destructive actions

**Entity System Safety**:
- Null reference checks throughout rendering
- Graceful degradation for missing entities
- Context cleanup when entities are deleted
- ID conflict resolution during imports

## Performance Considerations

**Entity System Optimization**:
- Flat entity storage for O(1) lookups
- Event-driven updates minimize re-renders
- Context-aware rendering reduces DOM manipulation
- Lazy loading for large datasets

**Memory Management**:
- Cleanup of event listeners when entities deleted
- Efficient DOM updates with minimal reflows
- localStorage optimization with compression potential

# important-instruction-reminders
- Do what has been asked; nothing more, nothing less.
- NEVER create files unless they're absolutely necessary for achieving your goal.
- ALWAYS prefer editing an existing file to creating a new one.
- NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
- You run in an environment where `ast-grep` is available; whenever a search requires syntax-aware or structural matching, default to `ast-grep --lang js -p '<pattern>'` (or set `--lang` appropriately) and avoid falling back to text-only tools like `rg` or `grep` unless I explicitly request a plain-text search.