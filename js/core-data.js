/**
 * GridFlow - Core Data Management Module (Dexie)
 * Handles data persistence, migration, and state management using Dexie
 */

import { showStatusMessage } from './utilities.js';
import { db } from './db.js';
import { entityService } from './entity-service.js';
import { boardService } from './board-service.js';
import { metaService } from './meta-service.js';

// Entity type constants (to avoid circular dependency with entity-core.js)
const ENTITY_TYPES = {
    TASK: 'task',
    NOTE: 'note',
    CHECKLIST: 'checklist',
    PROJECT: 'project',
    PERSON: 'person'
};

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
 * Save application data to Dexie
 */
export async function saveData() {
    try {
        // Save current board metadata
        await metaService.setCurrentBoardId(appData.currentBoardId);
        await metaService.setMetadata('version', appData.version || '6.0');
        await metaService.setMetadata('lastUpdated', new Date().toISOString());

        // Save all boards
        if (appData.boards) {
            for (const [boardId, board] of Object.entries(appData.boards)) {
                await boardService.save({
                    id: boardId,
                    ...board,
                    updatedAt: new Date().toISOString()
                });
            }
        }

        // Save all entities (batch operation for better performance)
        if (appData.entities && Object.keys(appData.entities).length > 0) {
            const entities = Object.values(appData.entities).map(entity => ({
                ...entity,
                updatedAt: new Date().toISOString()
            }));
            await entityService.bulkSave(entities);
        }

        // Save weekly plans and their items
        if (appData.weeklyPlans) {
            for (const [weekKey, weeklyPlan] of Object.entries(appData.weeklyPlans)) {
                // Save the weekly plan metadata
                await db.weeklyPlans.put({
                    weekKey,
                    weekStart: weeklyPlan.weekStart,
                    goal: weeklyPlan.goal,
                    reflection: weeklyPlan.reflection,
                    updatedAt: new Date().toISOString()
                });
                
                // Save weekly items separately
                if (weeklyPlan.items && Array.isArray(weeklyPlan.items)) {
                    for (const item of weeklyPlan.items) {
                        await db.weeklyItems.put({
                            id: item.id,
                            weekKey: weekKey,
                            entityId: item.entityId,
                            day: item.day,
                            addedAt: item.addedAt || new Date().toISOString(),
                            order: item.order || 0
                        });
                    }
                }
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
 * Load application data from Dexie
 */
export async function loadData(retryCount = 0) {
    const maxRetries = 2;
    
    try {
        console.log(`loadData: Loading from Dexie database... (attempt ${retryCount + 1})`);
        
        // Ensure database is initialized
        console.log('loadData: Initializing database...');
        await db.initialize();
        console.log('loadData: Database initialization complete');
        
        // Load app configuration from metadata
        const currentBoardId = await metaService.getCurrentBoardId() || 'default';
        const version = await metaService.getMetadata('version') || '6.0';
        console.log('loadData: App config loaded:', { currentBoardId, version });
        
        // Load all boards with entity positions populated
        const boardsRaw = await boardService.getAll();
        console.log('loadData: Boards loaded:', boardsRaw.length);
        
        // Load all entities
        const entities = await entityService.getAll();
        console.log('loadData: Entities loaded:', entities.length);
        
        // Load weekly plans
        const weeklyPlans = await db.weeklyPlans.toArray();
        console.log('loadData: Weekly plans loaded:', weeklyPlans.length);
        
        // Populate boards with entity positions
        const boardsObj = {};
        for (const board of boardsRaw) {
            // Validate and repair board structure if needed
            boardService.validateBoard(board.id).catch(console.warn);
            
            // Get board with entities populated from positions
            const populatedBoard = await boardService.getBoardWithEntities(board.id);
            boardsObj[board.id] = populatedBoard;
            console.log(`loadData: Board ${board.id} populated with entity positions`);
        }
        
        const entitiesObj = {};
        entities.forEach(entity => {
            entitiesObj[entity.id] = entity;
        });
        
        // Load weekly items for each plan
        const weeklyPlansObj = {};
        for (const plan of weeklyPlans) {
            // Load items for this week
            const items = await db.weeklyItems
                .where('weekKey').equals(plan.weekKey)
                .toArray();
            
            weeklyPlansObj[plan.weekKey] = {
                ...plan,
                items: items
            };
        }
        
        // Load templates, collections, and tags from Dexie
        const templates = await metaService.getAllTemplates();
        const collections = await metaService.getAllCollections();
        const tags = await metaService.getAllTags();
        
        // Build complete appData structure
        const loadedAppData = {
            currentBoardId: currentBoardId,
            version: version,
            boards: boardsObj,
            entities: entitiesObj,
            weeklyPlans: weeklyPlansObj,
            templates: templates,
            templateLibrary: {
                categories: ['Project Management', 'Personal', 'Business', 'Education'],
                featured: [],
                taskSets: {},
                checklists: {},
                noteTemplates: {}
            },
            collections: collections.reduce((obj, col) => { obj[col.id] = col; return obj; }, {}),
            tags: tags.reduce((obj, tag) => { obj[tag.id] = tag; return obj; }, {}),
            relationships: {
                entityTasks: {},
                cardToWeeklyPlans: {},
                weeklyPlanToCards: {},
                entityTags: {},
                collectionEntities: {},
                templateUsage: {}
            },
            // ID counters (dynamically calculated from data)
            nextTemplateId: Math.max(...templates.map(t => parseInt(t.id.split('_')[1]) || 0), 0) + 1,
            nextTemplateLibraryId: 1,
            nextWeeklyItemId: 1,
            nextTaskId: Math.max(...entities.filter(e => e.type === ENTITY_TYPES.TASK).map(e => parseInt(e.id.split('_')[1]) || 0), 0) + 1,
            nextNoteId: Math.max(...entities.filter(e => e.type === ENTITY_TYPES.NOTE).map(e => parseInt(e.id.split('_')[1]) || 0), 0) + 1,
            nextChecklistId: Math.max(...entities.filter(e => e.type === ENTITY_TYPES.CHECKLIST).map(e => parseInt(e.id.split('_')[1]) || 0), 0) + 1,
            nextProjectId: Math.max(...entities.filter(e => e.type === ENTITY_TYPES.PROJECT).map(e => parseInt(e.id.split('_')[1]) || 0), 0) + 1,
            nextPersonId: 1,
            nextCollectionId: Math.max(...collections.map(c => parseInt(c.id.split('_')[1]) || 0), 0) + 1,
            nextTagId: Math.max(...tags.map(t => parseInt(t.id.split('_')[1]) || 0), 0) + 1
        };
        
        // If no data found, database will have already created initial data
        if (boardsRaw.length === 0) {
            console.log('loadData: No boards found after database initialization');
            if (retryCount < maxRetries) {
                console.log(`loadData: Retrying data load (${retryCount + 1}/${maxRetries})`);
                return await loadData(retryCount + 1);
            } else {
                console.error('loadData: Max retries reached, no boards found');
                throw new Error('No boards found after maximum retry attempts');
            }
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
            await boardService.save({
                id: 'default',
                ...defaultBoard
            });
            appData.boards.default = defaultBoard;
            appData.currentBoardId = 'default';
            await metaService.setCurrentBoardId('default');
        }
        
        setBoardData(appData.boards[appData.currentBoardId]);
        console.log('loadData: Final boardData set:', !!boardData, 'columns:', boardData?.columns?.length);
        console.log('loadData: BoardData structure check:', {
            hasBoardData: !!boardData,
            boardDataKeys: boardData ? Object.keys(boardData) : 'none',
            rowsCount: boardData?.rows?.length || 0,
            columnsCount: boardData?.columns?.length || 0,
            firstRowCards: boardData?.rows?.[0]?.cards ? Object.keys(boardData.rows[0].cards) : 'none'
        });
        
        console.log('loadData: Final appData check:', {
            version: appData.version,
            boardCount: Object.keys(appData.boards || {}).length,
            entityCount: Object.keys(appData.entities || {}).length,
            currentBoardId: appData.currentBoardId,
            firstBoardName: appData.boards ? Object.values(appData.boards)[0]?.name : 'none'
        });
        
        // Ensure global data access
        if (typeof window !== 'undefined') {
            window.appData = appData;
            window.boardData = boardData;
            
            // Dispatch custom event that data is loaded
            window.dispatchEvent(new CustomEvent('gridflow-data-loaded', {
                detail: { appData, boardData }
            }));
        }
        
        return { appData, boardData };
    } catch (error) {
        console.error('Failed to load data:', error);
        
        if (retryCount < maxRetries) {
            console.log(`loadData: Error occurred, retrying (${retryCount + 1}/${maxRetries})`);
            showStatusMessage(`Loading data (attempt ${retryCount + 2})...`, 'info');
            // Database should have created initial data, try to reload
            await db.initialize();
            return await loadData(retryCount + 1);
        } else {
            console.error('loadData: Max retries reached after error');
            showStatusMessage('Failed to load data after multiple attempts', 'error');
            throw error;
        }
    }
}

/**
 * Initialize sample data for new installations (deprecated - handled by database initialization)
 */
export async function initializeSampleData() {
    console.log('initializeSampleData: Delegating to database initialization...');
    
    // The database now handles initial data creation automatically
    await db.initialize();
    
    // Reload data from database
    return await loadData();
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
        
        // Update metadata
        await metaService.setCurrentBoardId(boardId);
        
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
    const key = `next${type.charAt(0).toUpperCase()}${type.slice(1)}Id`;
    return appData[key] || 1;
}

/**
 * Increment and get next ID for a specific type
 * @param {string} type - Type of entity (task, note, board, etc.)
 * @returns {Promise<number>} The ID to use
 */
export async function incrementNextId(type) {
    const key = `next${type.charAt(0).toUpperCase()}${type.slice(1)}Id`;
    const currentId = appData[key] || 1;
    const nextId = currentId + 1;
    
    // Update local appData cache
    appData[key] = nextId;
    
    // Save to metadata
    await metaService.setMetadata(key, nextId);
    
    return currentId;
}

/**
 * Debug function to check Dexie database content
 */
export async function debugIndexedDB() {
    try {
        const currentBoardId = await metaService.getCurrentBoardId();
        const boards = await boardService.getAll();
        const entities = await entityService.getAll();
        const weeklyPlans = await db.weeklyPlans.toArray();
        const people = await metaService.getAllPeople();
        const tags = await metaService.getAllTags();
        const collections = await metaService.getAllCollections();
        
        const debugInfo = {
            currentBoardId,
            boardCount: boards.length,
            boardNames: boards.map(b => b.name),
            entityCount: entities.length,
            weeklyPlanCount: weeklyPlans.length,
            peopleCount: people.length,
            tagsCount: tags.length,
            collectionsCount: collections.length,
            entityStats: await entityService.getEntityStats()
        };
        
        console.log('Debug Dexie Database:', debugInfo);
        return debugInfo;
    } catch (error) {
        console.error('Failed to debug Dexie database:', error);
        return null;
    }
}

/**
 * Clean up weekly items that were incorrectly placed on boards
 * @param {string} boardId - Board ID to clean (optional, defaults to current board)
 * @returns {Promise<Object>} Cleanup results
 */
export async function cleanupWeeklyItemsFromBoard(boardId = null) {
    try {
        const targetBoardId = boardId || appData.currentBoardId || 'default';
        console.log(`🧹 Starting cleanup of weekly items from board ${targetBoardId}...`);
        
        const result = await entityService.cleanupWeeklyItemsFromBoard(targetBoardId);
        
        if (result.success && result.cleanedCount > 0) {
            // Update the in-memory board data
            const board = await boardService.getById(targetBoardId);
            appData.boards[targetBoardId] = board;
            if (targetBoardId === appData.currentBoardId) {
                setBoardData(board);
            }
            
            console.log(`✅ Successfully cleaned ${result.cleanedCount} weekly items from board`);
            
            // Trigger a board re-render to show the changes
            if (window.renderBoard) {
                window.renderBoard();
            }
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Failed to clean weekly items from board:', error);
        return {
            success: false,
            cleanedCount: 0,
            error: error.message
        };
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
        
        // Use entity service's built-in recovery system
        const result = await entityService.recoverOrphanedEntities(targetBoardId);
        
        if (result.success && result.recoveredCount > 0) {
            // Update the in-memory board data
            const board = await boardService.getById(targetBoardId);
            appData.boards[targetBoardId] = board;
            if (targetBoardId === appData.currentBoardId) {
                setBoardData(board);
            }
            
            console.log(`✅ Successfully recovered ${result.recoveredCount} orphaned entities`);
        }
        
        return result;
        
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
window.cleanupWeeklyItemsFromBoard = cleanupWeeklyItemsFromBoard;