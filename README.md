# GridFlow

A modern, web-based project management tool that combines Kanban boards with hierarchical row organization. GridFlow features a unique matrix layout that allows for flexible project organization and task management.

## Features

### Core Functionality
- **Kanban Board Layout**: Traditional column-based workflow management
- **Hierarchical Organization**: Group rows into colored categories for better project structure
- **Matrix View**: Cards can move between any columns across any rows for maximum flexibility
- **Multi-Board Support**: Create and manage multiple boards for different projects

### Advanced Task Management
- **Subtasks**: Break down cards into manageable subtasks with completion tracking
- **Progress Visualization**: Visual progress bars showing subtask completion on cards
- **Card Details**: Comprehensive card detail modal with inline editing
- **Completion Tracking**: Mark cards and subtasks as complete with visual indicators

### Organization Tools
- **Groups**: Color-coded categories to organize rows (e.g., "Development", "Marketing")
- **Custom Columns**: Create and reorder workflow stages to match your process
- **Drag & Drop**: Intuitive drag-and-drop for cards, rows, and groups
- **Collapsible Groups**: Expand/collapse groups to focus on specific areas

### Data Management
- **Auto-Save**: All changes are automatically saved to browser storage
- **Export Options**: Export to PDF, PNG, Excel, or JSON formats
- **Import/Export**: Backup and restore your data across devices
- **Cloud Sync**: Manual sync workflow using cloud storage services

### User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **iOS-Style Mobile Navigation**: Familiar mobile interface patterns
- **Dark/Light UI**: Professional interface with modern design principles
- **Keyboard Shortcuts**: Efficient keyboard navigation and shortcuts

## Technology Stack

- **Frontend**: Vanilla HTML, CSS, and JavaScript (no build process required)
- **Storage**: Browser localStorage with JSON export/import
- **Drag & Drop**: SortableJS library for reliable interactions
- **Export Libraries**: 
  - html2canvas (PNG export)
  - jsPDF (PDF export)  
  - xlsx (Excel export)

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone https://github.com/derekcampfield/gridflow.git
cd gridflow
```

2. Start a local server:
```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

3. Open your browser and navigate to `http://localhost:8000`

### No Build Process Required

GridFlow is built with vanilla web technologies and requires no compilation or build steps. Simply serve the files and start using the application.

## Data Structure

The application stores data in a hierarchical structure:

```javascript
{
  currentBoardId: 'default',
  boards: {
    'default': {
      name: 'My Board',
      groups: [
        { id: 1, name: 'Development', color: '#0079bf', collapsed: false }
      ],
      rows: [
        { 
          id: 1, 
          name: 'Website Redesign', 
          description: 'Update company website',
          groupId: 1,
          cards: {
            'todo': [
              {
                id: 1,
                title: 'Design mockups',
                description: 'Create wireframes and designs',
                completed: false,
                subtasks: [
                  { text: 'Research competitors', completed: true },
                  { text: 'Create wireframes', completed: false }
                ]
              }
            ]
          }
        }
      ],
      columns: [
        { id: 1, name: 'To Do', key: 'todo' },
        { id: 2, name: 'In Progress', key: 'inprogress' },
        { id: 3, name: 'Done', key: 'done' }
      ],
      settings: {
        showCheckboxes: false,
        showSubtaskProgress: true
      }
    }
  }
}
```

## Usage Guide

### Creating Your First Board

1. **Add Groups** (optional): Create colored categories to organize your work
2. **Add Rows**: Create project rows within groups or leave ungrouped
3. **Add Cards**: Create tasks within the workflow columns
4. **Add Subtasks**: Break down cards into smaller actionable items

### Managing Tasks

- **Move Cards**: Drag cards between columns to update their status
- **Edit Cards**: Click on any card to open the detail view
- **Add Subtasks**: Use the detail modal to add and manage subtasks
- **Track Progress**: Enable subtask progress bars in settings

### Organizing Projects

- **Group Rows**: Use groups to separate different types of work
- **Reorder Items**: Drag to reorder groups, rows, and columns
- **Collapse Groups**: Hide completed or inactive project groups
- **Custom Workflows**: Create columns that match your process

### Settings & Customization

Access settings through the ⚙️ Settings button:

- **Columns**: Manage workflow stages and their order
- **Groups**: Create and customize project categories
- **Display**: Toggle checkboxes and progress indicators
- **Board**: Rename boards and view statistics

## Mobile Experience

GridFlow provides a native-like mobile experience:

- **Responsive Layout**: Adapts to all screen sizes
- **Touch Interactions**: Optimized for touch devices
- **iOS-Style Navigation**: Familiar settings navigation patterns
- **Mobile Gestures**: Drag and drop works on touch screens

## Export & Sync

### Export Options

- **PDF**: High-quality document export for presentations
- **PNG**: Image export for sharing and documentation
- **Excel**: Structured spreadsheet with project hierarchy
- **JSON**: Complete data backup for restoration

### Cross-Device Sync

1. Export your data as JSON from the export modal
2. Save to your preferred cloud storage (iCloud, Google Drive, Dropbox)
3. Import the JSON file on other devices
4. Files are automatically named with timestamps

## Browser Compatibility

GridFlow works on all modern browsers:

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/derekcampfield/gridflow/issues) page
2. Create a new issue with a detailed description
3. Include your browser version and steps to reproduce

## Acknowledgments

- Built with [SortableJS](https://sortablejs.github.io/Sortable/) for drag & drop functionality
- Uses [html2canvas](https://html2canvas.hertzen.com/) for PNG export
- PDF export powered by [jsPDF](https://github.com/parallax/jsPDF)
- Excel export using [SheetJS](https://sheetjs.com/)

---

**GridFlow** - Organize your projects with clarity and flexibility.