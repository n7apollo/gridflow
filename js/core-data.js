/**
 * GridFlow - Core Data Management Module
 * Handles data persistence, migration, and state management
 */

import { showStatusMessage } from './utilities.js';

// Central application state
export let appData = {};
export let boardData = {};

/**
 * Save application data to localStorage
 */
export function saveData() {
    try {
        // Update collections before saving (Phase 2 feature)
        if (appData.version === '5.0' && Object.keys(appData.collections || {}).length > 0) {
            // Call updateAllCollections if available (will be moved to collections module later)
            if (window.updateAllCollections) {
                window.updateAllCollections();
            }
        }
        
        localStorage.setItem('gridflow_data', JSON.stringify(appData));
        showStatusMessage('Data saved successfully', 'success');
    } catch (error) {
        console.error('Failed to save data:', error);
        showStatusMessage('Failed to save data', 'error');
    }
}

/**
 * Load application data from localStorage
 */
export function loadData() {
    try {
        const saved = localStorage.getItem('gridflow_data');
        if (saved) {
            const savedData = JSON.parse(saved);
            const migratedData = migrateData(savedData);
            setAppData(migratedData);
        } else {
            initializeSampleData();
        }
        
        // Ensure current board exists and is set
        if (!appData.boards[appData.currentBoardId]) {
            appData.currentBoardId = Object.keys(appData.boards)[0] || 'default';
        }
        setBoardData(appData.boards[appData.currentBoardId]);
        
        // Initialize Phase 2 sample data for new v5.0 installations
        if (appData.version === '5.0') {
            if (window.initializeSampleTemplates) window.initializeSampleTemplates();
            if (window.initializeSampleCollections) window.initializeSampleCollections();
        }
        
        // Auto-save migrated data (but avoid infinite loop)
        try {
            localStorage.setItem('gridflow_data', JSON.stringify(appData));
        } catch (error) {
            console.error('Failed to save migrated data:', error);
        }
        
        return { appData, boardData };
    } catch (error) {
        console.error('Failed to load data:', error);
        showStatusMessage('Failed to load data, initializing new board', 'error');
        initializeSampleData();
        return { appData, boardData };
    }
}

/**
 * Migrate data from older versions to current version
 * @param {Object} data - Raw data to migrate
 * @returns {Object} Migrated data
 */
export function migrateData(data) {
    console.log('Starting data migration...');
    const currentVersion = '5.0';
    const dataVersion = data.version || detectVersion(data);
    
    console.log(`Migrating from version ${dataVersion} to ${currentVersion}`);
    
    let migratedData = { ...data };
    
    // Migration chain - apply migrations in order
    if (compareVersions(dataVersion, '1.0') <= 0) {
        migratedData = migrateToV2(migratedData);
    }
    if (compareVersions(dataVersion, '2.0') <= 0) {
        migratedData = migrateToV2_5(migratedData);
    }
    if (compareVersions(dataVersion, '2.5') <= 0) {
        migratedData = migrateToV3(migratedData);
    }
    if (compareVersions(dataVersion, '3.0') <= 0) {
        migratedData = migrateToV4(migratedData);
    }
    if (compareVersions(dataVersion, '4.0') <= 0) {
        migratedData = migrateToV5(migratedData);
    }
    
    // Final validation and cleanup
    migratedData = validateAndCleanData(migratedData);
    migratedData.version = currentVersion;
    
    console.log('Data migration completed successfully');
    return migratedData;
}

/**
 * Detect version from data structure
 * @param {Object} data - Data to analyze
 * @returns {string} Version string
 */
export function detectVersion(data) {
    if (data.version) return data.version;
    
    // Version detection based on structure
    if (data.rows && !data.boards) {
        return '1.0'; // Original single-board format
    } else if (data.boards && !data.templates) {
        return '2.0'; // Multi-board format without templates
    } else if (data.boards && data.templates && !data.weeklyPlans) {
        return '2.5'; // Has templates but no weekly planning
    } else if (data.boards && data.templates && data.weeklyPlans && !data.entities) {
        return '3.0'; // Has weekly planning but no unified entities
    } else if (data.boards && data.templates && data.weeklyPlans && data.entities && !data.templateLibrary) {
        return '4.0'; // Has unified entities but no template library
    } else {
        return '5.0'; // Current template library & smart collections format
    }
}

/**
 * Compare version strings (simple semantic versioning)
 * @param {string} v1 - First version
 * @param {string} v2 - Second version
 * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
export function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const part1 = parts1[i] || 0;
        const part2 = parts2[i] || 0;
        
        if (part1 < part2) return -1;
        if (part1 > part2) return 1;
    }
    return 0;
}

/**
 * Migration to v2.0 (single-board to multi-board)
 * @param {Object} data - Data to migrate
 * @returns {Object} Migrated data
 */
export function migrateToV2(data) {
    console.log('Migrating to v2.0: Converting to multi-board format');
    
    if (data.rows && !data.boards) {
        return {
            currentBoardId: 'default',
            boards: {
                'default': {
                    name: data.name || 'My Board',
                    ...data
                }
            },
            version: '2.0'
        };
    }
    return data;
}

/**
 * Migration to v2.5 (add templates)
 * @param {Object} data - Data to migrate
 * @returns {Object} Migrated data
 */
export function migrateToV2_5(data) {
    console.log('Migrating to v2.5: Adding template system');
    
    // Ensure templates structure exists
    if (!data.templates) {
        data.templates = [];
        data.nextTemplateId = 1;
    }
    
    data.version = '2.5';
    return data;
}

/**
 * Migration to v3.0 (add weekly planning)
 * @param {Object} data - Data to migrate
 * @returns {Object} Migrated data
 */
export function migrateToV3(data) {
    console.log('Migrating to v3.0: Adding weekly planning system');
    
    // Ensure weekly planning structure exists
    if (!data.weeklyPlans) {
        data.weeklyPlans = {};
        data.nextWeeklyItemId = 1;
    }
    
    data.version = '3.0';
    return data;
}

/**
 * Migration to v4.0 (unified entity system)
 * @param {Object} data - Data to migrate
 * @returns {Object} Migrated data
 */
export function migrateToV4(data) {
    console.log('Migrating to v4.0: Implementing unified entity system');
    
    // Initialize unified entity system
    if (!data.entities) {
        data.entities = {
            tasks: {},
            notes: {},
            checklists: {}
        };
        data.relationships = {
            entityTasks: {},
            cardToWeeklyPlans: {},
            weeklyPlanToCards: {}
        };
        data.nextTaskId = 1;
        data.nextNoteId = 1;
        data.nextChecklistId = 1;
    }
    
    // Migrate existing subtasks to unified task system
    Object.keys(data.boards || {}).forEach(boardId => {
        const board = data.boards[boardId];
        if (board.rows) {
            board.rows.forEach(row => {
                Object.keys(row.cards || {}).forEach(columnKey => {
                    row.cards[columnKey].forEach(card => {
                        if (card.subtasks && card.subtasks.length > 0) {
                            const taskIds = [];
                            card.subtasks.forEach(subtask => {
                                const taskId = `task_${data.nextTaskId++}`;
                                data.entities.tasks[taskId] = {
                                    id: taskId,
                                    text: subtask.text,
                                    completed: subtask.completed || false,
                                    dueDate: null,
                                    priority: 'medium',
                                    parentType: 'card',
                                    parentId: card.id.toString(),
                                    tags: [],
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString()
                                };
                                taskIds.push(taskId);
                            });
                            
                            if (taskIds.length > 0) {
                                data.relationships.entityTasks[card.id.toString()] = taskIds;
                                card.taskIds = taskIds;
                            }
                            
                            // Keep original subtasks for now for compatibility
                            // delete card.subtasks; // Will remove in later version
                        }
                    });
                });
            });
        }
    });
    
    data.version = '4.0';
    return data;
}

/**
 * Migration to v5.0 (template library & smart collections)
 * @param {Object} data - Data to migrate
 * @returns {Object} Migrated data
 */
export function migrateToV5(data) {
    console.log('Migrating to v5.0: Adding template library and smart collections');
    
    // Initialize template library
    if (!data.templateLibrary) {
        data.templateLibrary = {
            categories: ['Project Management', 'Personal', 'Business', 'Education'],
            featured: []
        };
    }
    
    // Initialize smart collections system
    if (!data.collections) {
        data.collections = {};
        data.nextCollectionId = 1;
    }
    
    data.version = '5.0';
    return data;
}

/**
 * Validate and clean data structure
 * @param {Object} data - Data to validate
 * @returns {Object} Cleaned data
 */
export function validateAndCleanData(data) {
    console.log('Validating and cleaning data...');
    
    // Ensure basic structure exists
    if (!data.boards) data.boards = {};
    if (!data.currentBoardId) data.currentBoardId = 'default';
    if (!data.templates) data.templates = [];
    if (!data.weeklyPlans) data.weeklyPlans = {};
    if (!data.entities) {
        data.entities = {
            tasks: {},
            notes: {},
            checklists: {}
        };
    }
    if (!data.relationships) {
        data.relationships = {
            entityTasks: {},
            cardToWeeklyPlans: {},
            weeklyPlanToCards: {}
        };
    }
    if (!data.collections) data.collections = {};
    
    // Ensure board structure is valid
    Object.keys(data.boards).forEach(boardId => {
        const board = data.boards[boardId];
        if (!board.name) board.name = 'Untitled Board';
        if (!board.groups) board.groups = [];
        if (!board.rows) board.rows = [];
        if (!board.columns) board.columns = [
            { id: 1, name: 'To Do', key: 'todo' },
            { id: 2, name: 'In Progress', key: 'inprogress' },
            { id: 3, name: 'Done', key: 'done' }
        ];
        if (!board.settings) board.settings = { showCheckboxes: true, showSubtaskProgress: true };
        
        // Ensure ID counters exist
        if (!board.nextRowId) board.nextRowId = 1;
        if (!board.nextCardId) board.nextCardId = 1;
        if (!board.nextColumnId) board.nextColumnId = 4;
        if (!board.nextGroupId) board.nextGroupId = 1;
        
        // Validate and fix ID sequences
        if (board.rows.length > 0) {
            const maxRowId = Math.max(...board.rows.map(r => r.id || 0));
            board.nextRowId = Math.max(board.nextRowId || 1, maxRowId + 1);
        }
        
        if (board.columns.length > 0) {
            const maxColumnId = Math.max(...board.columns.map(c => c.id || 0));
            board.nextColumnId = Math.max(board.nextColumnId || 1, maxColumnId + 1);
        }
        
        if (board.groups.length > 0) {
            const maxGroupId = Math.max(...board.groups.map(g => g.id || 0));
            board.nextGroupId = Math.max(board.nextGroupId || 1, maxGroupId + 1);
        }
        
        // Fix card IDs and calculate next card ID
        let maxCardId = 0;
        board.rows.forEach(row => {
            if (!row.cards) row.cards = {};
            board.columns.forEach(column => {
                if (!row.cards[column.key]) row.cards[column.key] = [];
                row.cards[column.key].forEach(card => {
                    if (!card.id) card.id = maxCardId + 1;
                    maxCardId = Math.max(maxCardId, card.id);
                });
            });
        });
        board.nextCardId = Math.max(board.nextCardId || 1, maxCardId + 1);
    });
    
    // Ensure global ID counters exist
    if (!data.nextTemplateId) data.nextTemplateId = Math.max(1, ...(data.templates.map(t => t.id || 0))) + 1;
    if (!data.nextWeeklyItemId) data.nextWeeklyItemId = 1;
    if (!data.nextTaskId) data.nextTaskId = Math.max(1, ...Object.keys(data.entities.tasks || {}).map(id => parseInt(id.replace('task_', '')) || 0)) + 1;
    if (!data.nextNoteId) data.nextNoteId = 1;
    if (!data.nextChecklistId) data.nextChecklistId = 1;
    if (!data.nextCollectionId) data.nextCollectionId = 1;
    
    console.log('Data validation completed');
    return data;
}

/**
 * Initialize sample data for new installations
 */
export function initializeSampleData() {
    console.log('Initializing sample data...');
    
    appData = {
        currentBoardId: 'default',
        boards: {
            'default': createDefaultBoard()
        },
        templates: [],
        weeklyPlans: {},
        entities: {
            tasks: {},
            notes: {},
            checklists: {}
        },
        relationships: {
            entityTasks: {},
            cardToWeeklyPlans: {},
            weeklyPlanToCards: {}
        },
        collections: {},
        nextTemplateId: 1,
        nextWeeklyItemId: 1,
        nextTaskId: 1,
        nextNoteId: 1,
        nextChecklistId: 1,
        nextCollectionId: 1,
        version: '5.0'
    };
    
    boardData = appData.boards.default;
    
    // Update global references for backward compatibility
    window.appData = appData;
    window.boardData = boardData;
    
    console.log('Sample data initialized');
}

/**
 * Create a default board structure
 * @returns {Object} Default board object
 */
export function createDefaultBoard() {
    return {
        name: 'My Board',
        groups: [
            { id: 1, name: 'Communications', color: '#0079bf', collapsed: false },
            { id: 2, name: 'Development', color: '#d29034', collapsed: false },
            { id: 3, name: 'Marketing', color: '#519839', collapsed: false }
        ],
        rows: [
            {
                id: 1,
                name: 'Launch updated website version',
                description: 'Coordinate the deployment of the new website features',
                groupId: 2,
                cards: {
                    todo: [
                        { id: 1, title: 'Finalize design review', description: 'Complete final review of new design elements', completed: false, priority: 'high', taskIds: [] },
                        { id: 2, title: 'Test on staging', description: 'Run comprehensive tests on staging environment', completed: false, priority: 'medium', taskIds: [] }
                    ],
                    inprogress: [
                        { id: 3, title: 'Update documentation', description: 'Update user guides and technical docs', completed: false, priority: 'medium', taskIds: [] }
                    ],
                    done: [
                        { id: 4, title: 'Setup deployment pipeline', description: 'Configure automated deployment process', completed: true, priority: 'high', taskIds: [] }
                    ]
                }
            },
            {
                id: 2,
                name: 'Q4 marketing campaign',
                description: 'Plan and execute marketing initiatives for Q4',
                groupId: 3,
                cards: {
                    todo: [
                        { id: 5, title: 'Create campaign assets', description: 'Design banners, social media content, and email templates', completed: false, priority: 'high', taskIds: [] },
                        { id: 6, title: 'Schedule social media posts', description: 'Plan and schedule posts across all platforms', completed: false, priority: 'medium', taskIds: [] }
                    ],
                    inprogress: [],
                    done: []
                }
            }
        ],
        columns: [
            { id: 1, name: 'To Do', key: 'todo' },
            { id: 2, name: 'In Progress', key: 'inprogress' },
            { id: 3, name: 'Done', key: 'done' }
        ],
        settings: {
            showCheckboxes: true,
            showSubtaskProgress: true
        },
        nextRowId: 3,
        nextCardId: 7,
        nextColumnId: 4,
        nextGroupId: 4,
        createdAt: new Date().toISOString()
    };
}

/**
 * Update application data reference
 * @param {Object} newAppData - New app data
 */
export function setAppData(newAppData) {
    appData = newAppData;
    window.appData = appData;
}

/**
 * Update board data reference
 * @param {Object} newBoardData - New board data
 */
export function setBoardData(newBoardData) {
    boardData = newBoardData;
    window.boardData = boardData;
}

/**
 * Get current app data
 * @returns {Object} Current app data
 */
export function getAppData() {
    return appData;
}

/**
 * Get current board data
 * @returns {Object} Current board data
 */
export function getBoardData() {
    return boardData;
}

// Make functions available globally for backwards compatibility during transition
window.saveData = saveData;
window.loadData = loadData;
window.migrateData = migrateData;
window.detectVersion = detectVersion;
window.compareVersions = compareVersions;
window.validateAndCleanData = validateAndCleanData;
window.initializeSampleData = initializeSampleData;
window.createDefaultBoard = createDefaultBoard;