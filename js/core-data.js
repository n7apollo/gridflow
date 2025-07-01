/**
 * GridFlow - Core Data Management Module (IndexedDB-Only)
 * Handles data persistence, migration, and state management using IndexedDB exclusively
 */

import { showStatusMessage } from './utilities.js';
import { 
    entityAdapter, 
    boardAdapter, 
    weeklyPlanAdapter, 
    weeklyItemAdapter,
    appMetadataAdapter,
    entityPositionsAdapter
} from './indexeddb/adapters.js';

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
 * Save application data to IndexedDB
 */
export async function saveData() {
    try {
        // Update app metadata
        await appMetadataAdapter.updateAppConfig({
            currentBoardId: appData.currentBoardId,
            version: appData.version || '6.0',
            lastUpdated: new Date().toISOString()
        });

        // Save all boards
        if (appData.boards) {
            for (const [boardId, board] of Object.entries(appData.boards)) {
                await boardAdapter.save({
                    id: boardId,
                    ...board,
                    updatedAt: new Date().toISOString()
                });
            }
        }

        // Save all entities
        if (appData.entities) {
            for (const [entityId, entity] of Object.entries(appData.entities)) {
                await entityAdapter.save({
                    id: entityId,
                    ...entity,
                    updatedAt: new Date().toISOString()
                });
            }
        }

        // Save weekly plans
        if (appData.weeklyPlans) {
            for (const [weekKey, weeklyPlan] of Object.entries(appData.weeklyPlans)) {
                await weeklyPlanAdapter.save({
                    weekKey,
                    ...weeklyPlan,
                    updatedAt: new Date().toISOString()
                });
            }
        }

        // Mark changes for cloud sync
        if (window.cloudSync && window.cloudSync.isEnabled) {
            window.cloudSync.markChanges();
        }
        
        showStatusMessage('Data saved successfully', 'success');
    } catch (error) {
        console.error('Failed to save data:', error);
        showStatusMessage('Failed to save data', 'error');
        throw error;
    }
}

/**
 * Load application data from IndexedDB
 */
export async function loadData() {
    try {
        console.log('loadData: Loading from IndexedDB...');
        
        // Load app configuration
        const appConfig = await appMetadataAdapter.getAppConfig();
        console.log('loadData: App config loaded:', appConfig);
        
        // Load all boards
        const boards = await boardAdapter.getAll();
        console.log('loadData: Boards loaded:', boards.length);
        
        // Load all entities
        const entities = await entityAdapter.getAll();
        console.log('loadData: Entities loaded:', entities.length);
        
        // Load weekly plans
        const weeklyPlans = await weeklyPlanAdapter.getAll();
        console.log('loadData: Weekly plans loaded:', weeklyPlans.length);
        
        // Construct appData object
        const boardsObj = {};
        boards.forEach(board => {
            // Ensure board rows have proper cards structure
            if (board.rows) {
                board.rows.forEach(row => {
                    if (!row.cards) {
                        console.warn(`Fixing missing cards for row ${row.id}:`, row);
                        row.cards = {};
                        // Initialize empty cards for each column
                        if (board.columns) {
                            board.columns.forEach(col => {
                                row.cards[col.key] = [];
                            });
                        }
                    }
                });
            }
            boardsObj[board.id] = board;
        });
        
        const entitiesObj = {};
        entities.forEach(entity => {
            entitiesObj[entity.id] = entity;
        });
        
        const weeklyPlansObj = {};
        weeklyPlans.forEach(plan => {
            weeklyPlansObj[plan.weekKey] = plan;
        });
        
        // Build complete appData structure
        const loadedAppData = {
            currentBoardId: appConfig.currentBoardId || 'default',
            version: appConfig.version || '6.0',
            boards: boardsObj,
            entities: entitiesObj,
            weeklyPlans: weeklyPlansObj,
            templates: [], // Will be loaded separately when template system is migrated
            templateLibrary: appConfig.templateLibrary || {
                categories: ['Project Management', 'Personal', 'Business', 'Education'],
                featured: [],
                taskSets: {},
                checklists: {},
                noteTemplates: {}
            },
            collections: {}, // Will be loaded separately when collections system is migrated
            tags: {}, // Will be loaded separately when tags system is migrated
            relationships: {
                entityTasks: {},
                cardToWeeklyPlans: {},
                weeklyPlanToCards: {},
                entityTags: {},
                collectionEntities: {},
                templateUsage: {}
            },
            // ID counters from app config
            nextTemplateId: appConfig.nextTemplateId || 1,
            nextTemplateLibraryId: appConfig.nextTemplateLibraryId || 1,
            nextWeeklyItemId: appConfig.nextWeeklyItemId || 1,
            nextTaskId: appConfig.nextTaskId || 1,
            nextNoteId: appConfig.nextNoteId || 1,
            nextChecklistId: appConfig.nextChecklistId || 1,
            nextProjectId: appConfig.nextProjectId || 1,
            nextPersonId: appConfig.nextPersonId || 1,
            nextCollectionId: appConfig.nextCollectionId || 1,
            nextTagId: appConfig.nextTagId || 1
        };
        
        // If no data found, initialize sample data
        if (boards.length === 0) {
            console.log('loadData: No data found, initializing sample data');
            await initializeSampleData();
            return { appData, boardData };
        }
        
        setAppData(loadedAppData);
        
        // Set current board
        if (!appData.boards[appData.currentBoardId]) {
            appData.currentBoardId = Object.keys(appData.boards)[0] || 'default';
        }
        
        // Ensure at least one board exists
        if (Object.keys(appData.boards).length === 0) {
            console.log('No boards found, creating default board');
            const defaultBoard = createDefaultBoard();
            await boardAdapter.save({
                id: 'default',
                ...defaultBoard
            });
            appData.boards.default = defaultBoard;
            appData.currentBoardId = 'default';
            await appMetadataAdapter.setCurrentBoardId('default');
        }
        
        setBoardData(appData.boards[appData.currentBoardId]);
        console.log('loadData: Final boardData set:', !!boardData, 'columns:', boardData?.columns?.length);
        
        console.log('loadData: Final appData check:', {
            version: appData.version,
            boardCount: Object.keys(appData.boards || {}).length,
            entityCount: Object.keys(appData.entities || {}).length,
            currentBoardId: appData.currentBoardId,
            firstBoardName: appData.boards ? Object.values(appData.boards)[0]?.name : 'none'
        });
        
        // Notify that data is ready for rendering
        if (typeof window !== 'undefined') {
            // Dispatch custom event that data is loaded
            window.dispatchEvent(new CustomEvent('gridflow-data-loaded', {
                detail: { appData, boardData }
            }));
        }
        
        return { appData, boardData };
    } catch (error) {
        console.error('Failed to load data:', error);
        showStatusMessage('Failed to load data, initializing new board', 'error');
        await initializeSampleData();
        return { appData, boardData };
    }
}

/**
 * Initialize sample data for new installations
 */
export async function initializeSampleData() {
    console.log('Initializing sample data...');
    
    // Create default app configuration
    const defaultConfig = {
        currentBoardId: 'default',
        version: '6.0',
        nextTaskId: 1,
        nextNoteId: 1,
        nextChecklistId: 1,
        nextProjectId: 1,
        nextPersonId: 1,
        nextBoardId: 2,
        nextGroupId: 4,
        nextRowId: 3,
        nextColumnId: 4,
        nextTemplateId: 1,
        nextCollectionId: 1,
        nextTagId: 1,
        nextWeeklyItemId: 1,
        templateLibrary: {
            categories: ['Project Management', 'Personal', 'Business', 'Education'],
            featured: [],
            taskSets: {},
            checklists: {},
            noteTemplates: {}
        }
    };
    
    // Save app configuration
    await appMetadataAdapter.updateAppConfig(defaultConfig);
    
    // Create and save default board
    const defaultBoard = createDefaultBoard();
    await boardAdapter.save({
        id: 'default',
        ...defaultBoard
    });
    
    // Create sample entities from default board cards
    let entityIdCounter = 1;
    const sampleEntities = [];
    
    defaultBoard.rows.forEach(row => {
        Object.keys(row.cards).forEach(columnKey => {
            row.cards[columnKey].forEach(card => {
                const entityId = `task_${entityIdCounter++}`;
                const entity = {
                    id: entityId,
                    type: 'task',
                    title: card.title,
                    content: card.description || '',
                    completed: card.completed || false,
                    priority: card.priority || 'medium',
                    dueDate: card.dueDate || null,
                    tags: card.tags || [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                sampleEntities.push(entity);
                
                // Replace card object with entity ID in board
                const cardIndex = row.cards[columnKey].indexOf(card);
                row.cards[columnKey][cardIndex] = entityId;
            });
        });
    });
    
    // Save entities
    for (const entity of sampleEntities) {
        await entityAdapter.save(entity);
    }
    
    // Update board with entity references
    await boardAdapter.save({
        id: 'default',
        ...defaultBoard
    });
    
    // Update next entity ID counter
    await appMetadataAdapter.updateAppConfig({
        nextTaskId: entityIdCounter
    });
    
    // Build appData structure
    appData = {
        currentBoardId: 'default',
        boards: {
            'default': defaultBoard
        },
        entities: {},
        templates: [],
        weeklyPlans: {},
        templateLibrary: defaultConfig.templateLibrary,
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
        ...defaultConfig,
        version: '6.0'
    };
    
    // Add entities to appData
    sampleEntities.forEach(entity => {
        appData.entities[entity.id] = entity;
    });
    
    boardData = appData.boards.default;
    
    // Update global references for backward compatibility
    window.appData = appData;
    window.boardData = boardData;
    
    console.log('Sample data initialized in IndexedDB');
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

/**
 * Switch to a different board
 * @param {string} boardId - ID of board to switch to
 */
export async function switchBoard(boardId) {
    try {
        if (!appData.boards[boardId]) {
            throw new Error(`Board ${boardId} not found`);
        }
        
        appData.currentBoardId = boardId;
        setBoardData(appData.boards[boardId]);
        
        // Update app config
        await appMetadataAdapter.setCurrentBoardId(boardId);
        
        console.log(`Switched to board: ${boardId}`);
    } catch (error) {
        console.error('Failed to switch board:', error);
        showStatusMessage('Failed to switch board', 'error');
        throw error;
    }
}

/**
 * Get next ID for a specific type
 * @param {string} type - Type of entity (task, note, board, etc.)
 * @returns {Promise<number>} Next ID
 */
export async function getNextId(type) {
    return await appMetadataAdapter.getNextId(type);
}

/**
 * Increment and get next ID for a specific type
 * @param {string} type - Type of entity (task, note, board, etc.)
 * @returns {Promise<number>} The ID to use
 */
export async function incrementNextId(type) {
    const nextId = await appMetadataAdapter.incrementNextId(type);
    
    // Update local appData cache
    const key = `next${type.charAt(0).toUpperCase()}${type.slice(1)}Id`;
    if (appData[key] !== undefined) {
        appData[key] = nextId + 1;
    }
    
    return nextId;
}

/**
 * Debug function to check IndexedDB content
 */
export async function debugIndexedDB() {
    try {
        const appConfig = await appMetadataAdapter.getAppConfig();
        const boards = await boardAdapter.getAll();
        const entities = await entityAdapter.getAll();
        const weeklyPlans = await weeklyPlanAdapter.getAll();
        
        const debugInfo = {
            appConfig,
            boardCount: boards.length,
            boardNames: boards.map(b => b.name),
            entityCount: entities.length,
            weeklyPlanCount: weeklyPlans.length,
            currentBoardId: appConfig.currentBoardId
        };
        
        console.log('Debug IndexedDB:', debugInfo);
        return debugInfo;
    } catch (error) {
        console.error('Failed to debug IndexedDB:', error);
        return null;
    }
}

/**
 * Recover orphaned entities and place them in the first row, first column
 * @param {string} boardId - Board ID to recover entities for
 * @returns {Promise<Object>} Recovery results
 */
export async function recoverOrphanedEntities(boardId = null) {
    try {
        console.log('🔄 Starting orphaned entity recovery...');
        
        // Use current board if none specified
        const targetBoardId = boardId || appData.currentBoardId || 'default';
        const board = appData.boards[targetBoardId];
        
        if (!board) {
            throw new Error(`Board ${targetBoardId} not found`);
        }
        
        // Get all entities
        const allEntities = await entityAdapter.getAll();
        const allEntityIds = allEntities.map(e => e.id);
        
        console.log(`📊 Total entities found: ${allEntityIds.length}`);
        
        // Find orphaned entities (entities not positioned on this board)
        const orphanedEntityIds = await entityPositionsAdapter.getOrphanedEntities(
            allEntityIds, 
            targetBoardId, 
            'board'
        );
        
        console.log(`🏠 Orphaned entities found: ${orphanedEntityIds.length}`);
        
        if (orphanedEntityIds.length === 0) {
            return {
                success: true,
                orphanedCount: 0,
                recoveredCount: 0,
                message: 'No orphaned entities found'
            };
        }
        
        // Find the first row and first column for placement
        const firstRow = board.rows && board.rows.length > 0 ? board.rows[0] : null;
        const firstColumn = board.columns && board.columns.length > 0 ? board.columns[0] : null;
        
        if (!firstRow || !firstColumn) {
            throw new Error('Board has no rows or columns for entity placement');
        }
        
        console.log(`📍 Placing orphaned entities in row "${firstRow.name}" (${firstRow.id}), column "${firstColumn.name}" (${firstColumn.key})`);
        
        // Create positions for orphaned entities
        const positions = orphanedEntityIds.map((entityId, index) => ({
            entityId,
            boardId: targetBoardId,
            context: 'board',
            rowId: firstRow.id.toString(),
            columnKey: firstColumn.key,
            order: index
        }));
        
        // Batch create positions
        await entityPositionsAdapter.batchSetPositions(positions);
        
        // Update the board's cards structure to include these entities
        if (!firstRow.cards) {
            firstRow.cards = {};
        }
        if (!firstRow.cards[firstColumn.key]) {
            firstRow.cards[firstColumn.key] = [];
        }
        
        // Add entity references to the row's cards
        const entityReferences = orphanedEntityIds.map(entityId => {
            const entity = allEntities.find(e => e.id === entityId);
            return {
                id: entityId,
                title: entity?.title || 'Untitled',
                description: entity?.content || '',
                completed: entity?.completed || false,
                priority: entity?.priority || 'medium',
                entityId: entityId // Reference to the actual entity
            };
        });
        
        // Add to the beginning of the column to make them visible
        firstRow.cards[firstColumn.key].unshift(...entityReferences);
        
        // Save the updated board
        await boardAdapter.save(board);
        
        // Update the in-memory board data
        appData.boards[targetBoardId] = board;
        if (targetBoardId === appData.currentBoardId) {
            setBoardData(board);
        }
        
        console.log(`✅ Successfully recovered ${orphanedEntityIds.length} orphaned entities`);
        
        return {
            success: true,
            orphanedCount: orphanedEntityIds.length,
            recoveredCount: orphanedEntityIds.length,
            placementLocation: {
                rowName: firstRow.name,
                columnName: firstColumn.name
            },
            message: `Recovered ${orphanedEntityIds.length} orphaned entities to "${firstRow.name}" → "${firstColumn.name}"`
        };
        
    } catch (error) {
        console.error('❌ Failed to recover orphaned entities:', error);
        return {
            success: false,
            orphanedCount: 0,
            recoveredCount: 0,
            error: error.message
        };
    }
}

// Make functions available globally for backwards compatibility during transition
window.saveData = saveData;
window.loadData = loadData;
window.initializeSampleData = initializeSampleData;
window.createDefaultBoard = createDefaultBoard;
window.debugIndexedDB = debugIndexedDB;
window.switchBoard = switchBoard;
window.getNextId = getNextId;
window.incrementNextId = incrementNextId;
window.recoverOrphanedEntities = recoverOrphanedEntities;