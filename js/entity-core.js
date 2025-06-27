/**
 * GridFlow - Unified Entity Core System
 * 
 * This module provides a unified entity system where all content (tasks, notes, 
 * checklists, etc.) are stored as entities that can exist in multiple contexts
 * (boards, weekly plans, task lists) while maintaining a single source of truth.
 */

import { getAppData, setAppData, saveData } from './core-data.js';
import { showStatusMessage } from './utilities.js';

/**
 * Entity Types and their schemas
 */
export const ENTITY_TYPES = {
    TASK: 'task',
    NOTE: 'note', 
    CHECKLIST: 'checklist',
    PROJECT: 'project'
};

/**
 * Context Types where entities can appear
 */
export const CONTEXT_TYPES = {
    BOARD: 'board',
    WEEKLY: 'weekly',
    TASK_LIST: 'task_list'
};

/**
 * Create a new entity
 * @param {string} type - Entity type (task, note, checklist, project)
 * @param {Object} data - Entity data
 * @returns {Object} Created entity
 */
export function createEntity(type, data) {
    const appData = getAppData();
    
    // Ensure entities structure exists
    if (!appData.entities) {
        appData.entities = {};
    }
    
    // Generate unique ID using consistent format with other systems
    let entityId;
    switch (type) {
        case ENTITY_TYPES.TASK:
            if (!appData.nextTaskId) appData.nextTaskId = 1;
            entityId = `task_${appData.nextTaskId++}`;
            break;
        case ENTITY_TYPES.NOTE:
            if (!appData.nextNoteId) appData.nextNoteId = 1;
            entityId = `note_${appData.nextNoteId++}`;
            break;
        case ENTITY_TYPES.CHECKLIST:
            if (!appData.nextChecklistId) appData.nextChecklistId = 1;
            entityId = `checklist_${appData.nextChecklistId++}`;
            break;
        case ENTITY_TYPES.PROJECT:
            if (!appData.nextProjectId) appData.nextProjectId = 1;
            entityId = `project_${appData.nextProjectId++}`;
            break;
        default:
            // Fallback to timestamp-based ID for unknown types
            entityId = `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Base entity structure
    const entity = {
        id: entityId,
        type: type,
        title: data.title || '',
        content: data.content || data.description || '',
        completed: data.completed || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: data.tags || [],
        
        // Type-specific fields
        ...getTypeSpecificFields(type, data)
    };
    
    appData.entities[entityId] = entity;
    setAppData(appData);
    saveData();
    
    console.log('Created entity:', entityId, entity);
    return entity;
}

/**
 * Get type-specific fields for an entity
 * @param {string} type - Entity type
 * @param {Object} data - Input data
 * @returns {Object} Type-specific fields
 */
function getTypeSpecificFields(type, data) {
    switch (type) {
        case ENTITY_TYPES.TASK:
            return {
                priority: data.priority || 'medium',
                dueDate: data.dueDate || null,
                estimatedTime: data.estimatedTime || null,
                actualTime: data.actualTime || null,
                subtasks: data.subtasks || [],
                assignee: data.assignee || null
            };
            
        case ENTITY_TYPES.NOTE:
            return {
                attachments: data.attachments || [],
                isPrivate: data.isPrivate || false
            };
            
        case ENTITY_TYPES.CHECKLIST:
            return {
                items: data.items || [],
                allowReordering: data.allowReordering !== false,
                showProgress: data.showProgress !== false
            };
            
        case ENTITY_TYPES.PROJECT:
            return {
                status: data.status || 'planning',
                startDate: data.startDate || null,
                endDate: data.endDate || null,
                budget: data.budget || null,
                team: data.team || [],
                milestones: data.milestones || []
            };
            
        default:
            return {};
    }
}

/**
 * Get entity by ID
 * @param {string} entityId - Entity ID
 * @returns {Object|null} Entity or null if not found
 */
export function getEntity(entityId) {
    const appData = getAppData();
    return appData.entities?.[entityId] || null;
}

/**
 * Update entity
 * @param {string} entityId - Entity ID
 * @param {Object} updates - Updates to apply
 * @returns {Object|null} Updated entity or null if not found
 */
export function updateEntity(entityId, updates) {
    const appData = getAppData();
    const entity = appData.entities?.[entityId];
    
    if (!entity) {
        console.warn('Entity not found for update:', entityId);
        return null;
    }
    
    // Apply updates
    Object.assign(entity, updates, {
        updatedAt: new Date().toISOString()
    });
    
    setAppData(appData);
    saveData();
    
    // Trigger re-render in all contexts where this entity appears
    refreshEntityInAllContexts(entityId, updates);
    
    console.log('Updated entity:', entityId, updates);
    return entity;
}

/**
 * Delete entity
 * @param {string} entityId - Entity ID
 * @returns {boolean} Success
 */
export function deleteEntity(entityId) {
    const appData = getAppData();
    
    if (!appData.entities?.[entityId]) {
        console.warn('Entity not found for deletion:', entityId);
        return false;
    }
    
    // Remove from all contexts first
    removeEntityFromAllContexts(entityId);
    
    // Delete the entity
    delete appData.entities[entityId];
    
    setAppData(appData);
    saveData();
    
    // Trigger entity deletion event
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('entityDeleted', {
            detail: { entityId }
        }));
    }
    
    console.log('Deleted entity:', entityId);
    return true;
}

/**
 * Toggle entity completion status
 * @param {string} entityId - Entity ID
 * @returns {Object|null} Updated entity or null if not found
 */
export function toggleEntityCompletion(entityId) {
    const entity = getEntity(entityId);
    if (!entity) return null;
    
    const newCompleted = !entity.completed;
    
    // For checklists, also update completion based on items
    if (entity.type === ENTITY_TYPES.CHECKLIST && entity.items) {
        // If manually toggling, mark all items the same
        entity.items.forEach(item => item.completed = newCompleted);
    }
    
    return updateEntity(entityId, { completed: newCompleted });
}

/**
 * Add entity to a context
 * @param {string} entityId - Entity ID
 * @param {string} contextType - Context type (board, weekly, task_list)
 * @param {Object} contextData - Context-specific data
 * @returns {boolean} Success
 */
export function addEntityToContext(entityId, contextType, contextData) {
    const entity = getEntity(entityId);
    if (!entity) {
        console.warn('Entity not found for context addition:', entityId);
        return false;
    }
    
    const appData = getAppData();
    
    switch (contextType) {
        case CONTEXT_TYPES.BOARD:
            return addEntityToBoard(entityId, contextData.boardId, contextData.rowId, contextData.columnKey);
            
        case CONTEXT_TYPES.WEEKLY:
            return addEntityToWeekly(entityId, contextData.weekKey, contextData.day);
            
        case CONTEXT_TYPES.TASK_LIST:
            // Task list doesn't need special storage - it's a view
            return true;
            
        default:
            console.warn('Unknown context type:', contextType);
            return false;
    }
}

/**
 * Remove entity from a context
 * @param {string} entityId - Entity ID
 * @param {string} contextType - Context type
 * @param {Object} contextData - Context-specific data
 * @returns {boolean} Success
 */
export function removeEntityFromContext(entityId, contextType, contextData) {
    switch (contextType) {
        case CONTEXT_TYPES.BOARD:
            return removeEntityFromBoard(entityId, contextData.boardId, contextData.rowId, contextData.columnKey);
            
        case CONTEXT_TYPES.WEEKLY:
            return removeEntityFromWeekly(entityId, contextData.weekKey);
            
        case CONTEXT_TYPES.TASK_LIST:
            return true;
            
        default:
            console.warn('Unknown context type:', contextType);
            return false;
    }
}

/**
 * Add entity to board context
 * @param {string} entityId - Entity ID
 * @param {string} boardId - Board ID
 * @param {string} rowId - Row ID
 * @param {string} columnKey - Column key
 * @returns {boolean} Success
 */
function addEntityToBoard(entityId, boardId, rowId, columnKey) {
    const appData = getAppData();
    const board = appData.boards[boardId];
    
    if (!board) {
        console.warn('Board not found:', boardId);
        return false;
    }
    
    const row = board.rows.find(r => r.id === rowId);
    if (!row) {
        console.warn('Row not found:', rowId);
        return false;
    }
    
    // Initialize cards structure if needed
    if (!row.cards) row.cards = {};
    if (!row.cards[columnKey]) row.cards[columnKey] = [];
    
    // Add entity reference to board
    row.cards[columnKey].push(entityId);
    
    setAppData(appData);
    saveData();
    
    console.log('Added entity to board:', entityId, boardId, rowId, columnKey);
    return true;
}

/**
 * Remove entity from board context
 * @param {string} entityId - Entity ID
 * @param {string} boardId - Board ID
 * @param {string} rowId - Row ID (optional)
 * @param {string} columnKey - Column key (optional)
 * @returns {boolean} Success
 */
function removeEntityFromBoard(entityId, boardId, rowId = null, columnKey = null) {
    const appData = getAppData();
    const board = appData.boards[boardId];
    
    if (!board) return false;
    
    let removed = false;
    
    board.rows.forEach(row => {
        if (rowId && row.id !== rowId) return;
        
        if (row.cards) {
            Object.keys(row.cards).forEach(colKey => {
                if (columnKey && colKey !== columnKey) return;
                
                const cardIndex = row.cards[colKey].indexOf(entityId);
                if (cardIndex !== -1) {
                    row.cards[colKey].splice(cardIndex, 1);
                    removed = true;
                }
            });
        }
    });
    
    if (removed) {
        setAppData(appData);
        saveData();
        console.log('Removed entity from board:', entityId, boardId);
    }
    
    return removed;
}

/**
 * Add entity to weekly context
 * @param {string} entityId - Entity ID
 * @param {string} weekKey - Week key
 * @param {string} day - Day name (optional, for general week items)
 * @returns {boolean} Success
 */
function addEntityToWeekly(entityId, weekKey, day = null) {
    const appData = getAppData();
    
    // Ensure weekly plan exists
    if (!appData.weeklyPlans[weekKey]) {
        appData.weeklyPlans[weekKey] = {
            weekStart: new Date().toISOString(),
            goal: '',
            items: [],
            reflection: { wins: '', challenges: '', learnings: '', nextWeekFocus: '' }
        };
    }
    
    // Add entity reference to weekly plan
    const weeklyItem = {
        id: `weekly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        entityId: entityId,
        day: day,
        addedAt: new Date().toISOString()
    };
    
    appData.weeklyPlans[weekKey].items.push(weeklyItem);
    
    setAppData(appData);
    saveData();
    
    console.log('Added entity to weekly plan:', entityId, weekKey, day);
    return true;
}

/**
 * Remove entity from weekly context
 * @param {string} entityId - Entity ID
 * @param {string} weekKey - Week key
 * @returns {boolean} Success
 */
function removeEntityFromWeekly(entityId, weekKey) {
    const appData = getAppData();
    const weeklyPlan = appData.weeklyPlans[weekKey];
    
    if (!weeklyPlan) return false;
    
    const originalLength = weeklyPlan.items.length;
    weeklyPlan.items = weeklyPlan.items.filter(item => item.entityId !== entityId);
    
    const removed = weeklyPlan.items.length < originalLength;
    
    if (removed) {
        setAppData(appData);
        saveData();
        console.log('Removed entity from weekly plan:', entityId, weekKey);
    }
    
    return removed;
}

/**
 * Remove entity from all contexts
 * @param {string} entityId - Entity ID
 */
function removeEntityFromAllContexts(entityId) {
    const appData = getAppData();
    
    // Remove from all boards
    Object.keys(appData.boards).forEach(boardId => {
        removeEntityFromBoard(entityId, boardId);
    });
    
    // Remove from all weekly plans
    Object.keys(appData.weeklyPlans).forEach(weekKey => {
        removeEntityFromWeekly(entityId, weekKey);
    });
}

/**
 * Refresh entity display in all contexts
 * @param {string} entityId - Entity ID
 * @param {Object} changes - Changes made to entity
 */
function refreshEntityInAllContexts(entityId, changes = {}) {
    console.log('Entity updated, refreshing in all contexts:', entityId, changes);
    
    // Trigger entity update event for synchronization system
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('entityUpdated', { 
            detail: { entityId, changes } 
        }));
    }
}

/**
 * Get all entities in a specific context
 * @param {string} contextType - Context type
 * @param {Object} contextData - Context-specific data
 * @returns {Array} Array of entities
 */
export function getEntitiesInContext(contextType, contextData) {
    const appData = getAppData();
    
    switch (contextType) {
        case CONTEXT_TYPES.BOARD: {
            const board = appData.boards[contextData.boardId];
            if (!board) return [];
            
            const entityIds = new Set();
            
            board.rows.forEach(row => {
                if (row.cards) {
                    Object.values(row.cards).forEach(cardList => {
                        cardList.forEach(id => entityIds.add(id));
                    });
                }
            });
            
            return Array.from(entityIds).map(id => getEntity(id)).filter(Boolean);
        }
        
        case CONTEXT_TYPES.WEEKLY: {
            const weeklyPlan = appData.weeklyPlans[contextData.weekKey];
            if (!weeklyPlan) return [];
            
            return weeklyPlan.items
                .map(item => getEntity(item.entityId))
                .filter(Boolean);
        }
        
        case CONTEXT_TYPES.TASK_LIST: {
            // Return all task-type entities
            return Object.values(appData.entities || {})
                .filter(entity => entity.type === ENTITY_TYPES.TASK);
        }
        
        default:
            return [];
    }
}

/**
 * Search entities by criteria
 * @param {Object} criteria - Search criteria
 * @returns {Array} Matching entities
 */
export function searchEntities(criteria = {}) {
    const appData = getAppData();
    const entities = Object.values(appData.entities || {});
    
    return entities.filter(entity => {
        // Type filter
        if (criteria.type && entity.type !== criteria.type) return false;
        
        // Completion filter
        if (criteria.completed !== undefined && entity.completed !== criteria.completed) return false;
        
        // Priority filter
        if (criteria.priority && entity.priority !== criteria.priority) return false;
        
        // Text search
        if (criteria.search) {
            const searchTerm = criteria.search.toLowerCase();
            const titleMatch = entity.title.toLowerCase().includes(searchTerm);
            const contentMatch = entity.content.toLowerCase().includes(searchTerm);
            if (!titleMatch && !contentMatch) return false;
        }
        
        // Tag filter
        if (criteria.tags && criteria.tags.length > 0) {
            const hasTag = criteria.tags.some(tag => entity.tags.includes(tag));
            if (!hasTag) return false;
        }
        
        return true;
    });
}

/**
 * Debug function to list all entities
 * @returns {Object} Debug information about entities
 */
function debugEntities() {
    const appData = getAppData();
    const entities = appData.entities || {};
    
    console.log('=== ENTITY DEBUG ===');
    console.log('Total entities:', Object.keys(entities).length);
    
    Object.keys(entities).forEach(entityId => {
        const entity = entities[entityId];
        console.log(`${entityId}: ${entity.title || 'Untitled'} (${entity.type})`);
    });
    
    // Check weekly items
    const weeklyPlans = appData.weeklyPlans || {};
    console.log('\n=== WEEKLY ITEMS ===');
    Object.keys(weeklyPlans).forEach(weekKey => {
        const plan = weeklyPlans[weekKey];
        console.log(`Week ${weekKey}:`);
        (plan.items || []).forEach(item => {
            console.log(`  ${item.id}: entityId=${item.entityId} (${item.entityId ? (entities[item.entityId] ? '✓' : '✗ MISSING') : 'no entityId'})`);
        });
    });
    
    return { entities, weeklyPlans };
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
    window.entityCore = {
        createEntity,
        getEntity,
        updateEntity,
        deleteEntity,
        toggleEntityCompletion,
        addEntityToContext,
        removeEntityFromContext,
        getEntitiesInContext,
        searchEntities,
        debugEntities,
        ENTITY_TYPES,
        CONTEXT_TYPES
    };
}