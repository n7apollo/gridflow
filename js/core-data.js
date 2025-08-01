/**
 * GridFlow - Core Data Management Module
 * Handles data persistence, migration, and state management
 */

import { showStatusMessage } from './utilities.js';

// Central application state
export let appData = {};
export let boardData = {};

// Global editing state variables (formerly in script.js)
export let currentEditingCard = null;
export let currentDetailCard = null;
export let currentEditingBoard = null;
export let currentEditingTask = null;
export let selectedTemplateId = null;
export let currentWeekKey = null;
export let currentEditingWeeklyItem = null;
export let currentOutlineData = { html: '', plain: '', markdown: '' };

// Setters for global state management
export function setCurrentEditingCard(card) { currentEditingCard = card; }
export function setCurrentDetailCard(card) { currentDetailCard = card; }
export function setCurrentEditingBoard(board) { currentEditingBoard = board; }
export function setCurrentEditingTask(task) { currentEditingTask = task; }
export function setSelectedTemplateId(id) { selectedTemplateId = id; }
export function setCurrentWeekKey(key) { currentWeekKey = key; }
export function setCurrentEditingWeeklyItem(item) { currentEditingWeeklyItem = item; }
export function setCurrentOutlineData(data) { currentOutlineData = data; }

// Getters for global state management
export function getCurrentEditingCard() { return currentEditingCard; }
export function getCurrentDetailCard() { return currentDetailCard; }
export function getCurrentEditingBoard() { return currentEditingBoard; }
export function getCurrentEditingTask() { return currentEditingTask; }
export function getSelectedTemplateId() { return selectedTemplateId; }
export function getCurrentWeekKey() { return currentWeekKey; }
export function getCurrentEditingWeeklyItem() { return currentEditingWeeklyItem; }
export function getCurrentOutlineData() { return currentOutlineData; }

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
        
        // Mark changes for cloud sync
        if (window.cloudSync && window.cloudSync.isEnabled) {
            window.cloudSync.markChanges();
        }
        
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
        console.log('loadData: localStorage item exists:', !!saved);
        if (saved) {
            const savedData = JSON.parse(saved);
            console.log('loadData: Parsed data version:', savedData.version);
            console.log('loadData: Number of boards:', Object.keys(savedData.boards || {}).length);
            console.log('loadData: First board name:', Object.keys(savedData.boards || {})[0]);
            
            const migratedData = migrateData(savedData);
            console.log('loadData: After migration - version:', migratedData.version);
            console.log('loadData: After migration - boards:', Object.keys(migratedData.boards || {}).length);
            
            setAppData(migratedData);
            console.log('loadData: Data set successfully');
        } else {
            console.log('loadData: No saved data found, initializing sample data');
            initializeSampleData();
        }
        
        // Ensure current board exists and is set
        if (!appData.boards[appData.currentBoardId]) {
            appData.currentBoardId = Object.keys(appData.boards)[0] || 'default';
        }
        setBoardData(appData.boards[appData.currentBoardId]);
        
        // Initialize Phase 2 sample data for new v5.0 installations
        if (appData.version === '5.0') {
            try {
                if (window.initializeSampleTemplates) window.initializeSampleTemplates();
            } catch (error) {
                console.error('Failed to initialize sample templates:', error);
            }
            
            try {
                if (window.initializeSampleCollections) window.initializeSampleCollections();
            } catch (error) {
                console.error('Failed to initialize sample collections:', error);
            }
        }
        
        // Auto-save migrated data (but avoid infinite loop)
        try {
            localStorage.setItem('gridflow_data', JSON.stringify(appData));
        } catch (error) {
            console.error('Failed to save migrated data:', error);
        }
        
        console.log('loadData: Final appData check:', {
            version: appData.version,
            boardCount: Object.keys(appData.boards || {}).length,
            currentBoardId: appData.currentBoardId,
            firstBoardName: appData.boards ? Object.values(appData.boards)[0]?.name : 'none'
        });
        
        return { appData, boardData };
    } catch (error) {
        console.error('Failed to load data:', error);
        showStatusMessage('Failed to load data, initializing new board', 'error');
        initializeSampleData();
        return { appData, boardData };
    }
}

/**
 * Debug function to check localStorage content
 */
export function debugLocalStorage() {
    const saved = localStorage.getItem('gridflow_data');
    if (saved) {
        const data = JSON.parse(saved);
        console.log('Debug localStorage:', {
            hasData: !!saved,
            version: data.version,
            boardCount: Object.keys(data.boards || {}).length,
            boardNames: Object.keys(data.boards || {}),
            currentBoardId: data.currentBoardId,
            firstBoardData: data.boards ? Object.values(data.boards)[0] : null
        });
        return data;
    } else {
        console.log('Debug localStorage: No data found');
        return null;
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
            weeklyPlanToCards: {},
            entityTags: {},
            collectionEntities: {},
            templateUsage: {}
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
            featured: [],
            taskSets: {},
            checklists: {},
            noteTemplates: {}
        };
    }
    
    // Ensure all template library sub-structures exist
    if (!data.templateLibrary.taskSets) data.templateLibrary.taskSets = {};
    if (!data.templateLibrary.checklists) data.templateLibrary.checklists = {};
    if (!data.templateLibrary.noteTemplates) data.templateLibrary.noteTemplates = {};
    if (!data.nextTemplateLibraryId) data.nextTemplateLibraryId = 1;
    
    // Initialize smart collections system
    if (!data.collections) {
        data.collections = {};
        data.nextCollectionId = 1;
    }
    
    // Migrate v4 entity structure to v5 unified entity structure
    if (data.entities && (data.entities.tasks || data.entities.notes || data.entities.checklists)) {
        console.log('Migrating v4 entity structure to v5 unified format...');
        
        const newEntities = {};
        
        // Migrate tasks
        if (data.entities.tasks) {
            Object.keys(data.entities.tasks).forEach(taskId => {
                const task = data.entities.tasks[taskId];
                // Skip if task is already a string (entity ID) or null/undefined
                if (typeof task !== 'object' || task === null) {
                    console.warn(`Skipping task ${taskId} - invalid or already migrated`);
                    return;
                }
                
                newEntities[taskId] = {
                    id: taskId,
                    type: 'task',
                    title: task.text || 'Untitled Task',
                    content: task.description || '',
                    completed: task.completed || false,
                    priority: task.priority || 'medium',
                    dueDate: task.dueDate || null,
                    tags: task.tags || [],
                    createdAt: task.createdAt || new Date().toISOString(),
                    updatedAt: task.updatedAt || new Date().toISOString(),
                    // Preserve task-specific fields
                    parentType: task.parentType,
                    parentId: task.parentId
                };
            });
        }
        
        // Migrate notes
        if (data.entities.notes) {
            Object.keys(data.entities.notes).forEach(noteId => {
                const note = data.entities.notes[noteId];
                // Skip if note is already a string (entity ID) or null/undefined
                if (typeof note !== 'object' || note === null) {
                    console.warn(`Skipping note ${noteId} - invalid or already migrated`);
                    return;
                }
                
                newEntities[noteId] = {
                    id: noteId,
                    type: 'note',
                    title: note.title || 'Untitled Note',
                    content: note.content || '',
                    completed: false,
                    tags: note.tags || [],
                    createdAt: note.createdAt || new Date().toISOString(),
                    updatedAt: note.updatedAt || new Date().toISOString(),
                    // Preserve note-specific fields
                    attachedTo: note.attachedTo
                };
            });
        }
        
        // Migrate checklists
        if (data.entities.checklists) {
            Object.keys(data.entities.checklists).forEach(checklistId => {
                const checklist = data.entities.checklists[checklistId];
                // Skip if checklist is already a string (entity ID) or null/undefined
                if (typeof checklist !== 'object' || checklist === null) {
                    console.warn(`Skipping checklist ${checklistId} - invalid or already migrated`);
                    return;
                }
                
                newEntities[checklistId] = {
                    id: checklistId,
                    type: 'checklist',
                    title: checklist.title || 'Untitled Checklist',
                    content: checklist.description || '',
                    completed: false,
                    items: checklist.items || [],
                    tags: checklist.tags || [],
                    createdAt: checklist.createdAt || new Date().toISOString(),
                    updatedAt: checklist.updatedAt || new Date().toISOString()
                };
            });
        }
        
        // Replace the old structure with the new unified structure
        data.entities = newEntities;
        
        console.log(`Migrated ${Object.keys(newEntities).length} entities to unified format`);
    }
    
    // Migrate board cards to entity references
    if (data.boards) {
        console.log('Converting board cards to entity references...');
        let cardsConverted = 0;
        
        // Ensure ID counters are set based on existing entities
        if (!data.nextTaskId && data.entities) {
            const existingTaskIds = Object.keys(data.entities).filter(id => id.startsWith('task_'))
                .map(id => parseInt(id.replace('task_', '')) || 0);
            data.nextTaskId = existingTaskIds.length > 0 ? Math.max(...existingTaskIds) + 1 : 1;
        }
        if (!data.nextNoteId && data.entities) {
            const existingNoteIds = Object.keys(data.entities).filter(id => id.startsWith('note_'))
                .map(id => parseInt(id.replace('note_', '')) || 0);
            data.nextNoteId = existingNoteIds.length > 0 ? Math.max(...existingNoteIds) + 1 : 1;
        }
        
        Object.keys(data.boards).forEach(boardId => {
            const board = data.boards[boardId];
            if (!board.rows) return;
            
            board.rows.forEach(row => {
                if (!row.cards) return;
                
                Object.keys(row.cards).forEach(columnKey => {
                    const cards = row.cards[columnKey];
                    const newCardList = [];
                    
                    cards.forEach(card => {
                        // Skip if already an entity ID
                        if (typeof card === 'string' && card.startsWith('entity_')) {
                            newCardList.push(card);
                            return;
                        }
                        
                        // Convert card object to entity
                        if (typeof card === 'object' && card.id) {
                            try {
                                // Determine entity type
                                let entityType = 'task'; // default
                                if (card.subtasks && card.subtasks.length > 0) {
                                    entityType = 'task';
                                } else if (card.priority || card.dueDate) {
                                    entityType = 'task';
                                } else {
                                    entityType = 'note';
                                }
                                
                                // Create entity ID using sequential format
                                let entityId;
                                if (entityType === 'task') {
                                    if (!data.nextTaskId) data.nextTaskId = 1;
                                    entityId = `task_${data.nextTaskId++}`;
                                } else if (entityType === 'note') {
                                    if (!data.nextNoteId) data.nextNoteId = 1;
                                    entityId = `note_${data.nextNoteId++}`;
                                } else {
                                    // Fallback
                                    entityId = `${entityType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                                }
                                
                                // Create entity
                                const entity = {
                                    id: entityId,
                                    type: entityType,
                                    title: card.title || 'Untitled',
                                    content: card.description || '',
                                    completed: card.completed || false,
                                    priority: card.priority || 'medium',
                                    dueDate: card.dueDate || null,
                                    tags: card.tags || [],
                                    createdAt: card.createdAt || new Date().toISOString(),
                                    updatedAt: new Date().toISOString()
                                };
                                
                                // Add task-specific fields
                                if (entityType === 'task' && card.subtasks) {
                                    entity.subtasks = card.subtasks;
                                }
                                
                                // Store entity
                                if (!data.entities) data.entities = {};
                                data.entities[entityId] = entity;
                                
                                // Replace card with entity ID
                                newCardList.push(entityId);
                                cardsConverted++;
                                
                                console.log(`Converted card "${card.title}" to entity ${entityId}`);
                                
                            } catch (error) {
                                console.error('Failed to convert card:', card, error);
                                // Keep original card as fallback
                                newCardList.push(card);
                            }
                        } else {
                            // Keep non-object cards as-is
                            newCardList.push(card);
                        }
                    });
                    
                    // Replace card list with entity IDs
                    row.cards[columnKey] = newCardList;
                });
            });
        });
        
        console.log(`Converted ${cardsConverted} board cards to entity references`);
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
            weeklyPlanToCards: {},
            entityTags: {},
            collectionEntities: {},
            templateUsage: {}
        };
    }
    if (!data.collections) data.collections = {};
    if (!data.tags) data.tags = {};
    
    // Ensure template library structure exists
    if (!data.templateLibrary) {
        data.templateLibrary = {
            categories: ['Project Management', 'Personal', 'Business', 'Education'],
            featured: [],
            taskSets: {},
            checklists: {},
            noteTemplates: {}
        };
    }
    if (!data.templateLibrary.taskSets) data.templateLibrary.taskSets = {};
    if (!data.templateLibrary.checklists) data.templateLibrary.checklists = {};
    if (!data.templateLibrary.noteTemplates) data.templateLibrary.noteTemplates = {};
    
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
                    // Skip entity ID strings (new unified system)
                    if (typeof card === 'string') {
                        return; // Entity IDs don't need ID validation
                    }
                    
                    // Handle legacy card objects
                    if (typeof card === 'object' && card !== null) {
                        if (!card.id) card.id = maxCardId + 1;
                        maxCardId = Math.max(maxCardId, card.id);
                    }
                });
            });
        });
        board.nextCardId = Math.max(board.nextCardId || 1, maxCardId + 1);
    });
    
    // Ensure global ID counters exist
    if (!data.nextTemplateId) data.nextTemplateId = Math.max(1, ...(data.templates.map(t => t.id || 0))) + 1;
    if (!data.nextTemplateLibraryId) data.nextTemplateLibraryId = 1;
    if (!data.nextWeeklyItemId) data.nextWeeklyItemId = 1;
    if (!data.nextTaskId) data.nextTaskId = Math.max(1, ...Object.keys(data.entities.tasks || {}).map(id => parseInt(id.replace('task_', '')) || 0)) + 1;
    if (!data.nextNoteId) data.nextNoteId = 1;
    if (!data.nextChecklistId) data.nextChecklistId = 1;
    if (!data.nextProjectId) data.nextProjectId = 1;
    if (!data.nextCollectionId) data.nextCollectionId = 1;
    if (!data.nextTagId) data.nextTagId = 1;
    
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
            weeklyPlanToCards: {},
            entityTags: {},
            collectionEntities: {},
            templateUsage: {}
        },
        collections: {},
        tags: {},
        templateLibrary: {
            categories: ['Project Management', 'Personal', 'Business', 'Education'],
            featured: [],
            taskSets: {},
            checklists: {},
            noteTemplates: {}
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
window.debugLocalStorage = debugLocalStorage;