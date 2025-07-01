/**
 * GridFlow - Unified Entity Core System (IndexedDB-Only)
 * 
 * This module provides a unified entity system where all content (tasks, notes, 
 * checklists, etc.) are stored as entities that can exist in multiple contexts
 * (boards, weekly plans, task lists) while maintaining a single source of truth in IndexedDB.
 */

import { getAppData, setAppData, saveData, incrementNextId } from './core-data.js';
import { showStatusMessage } from './utilities.js';
import { entityAdapter, boardAdapter, weeklyPlanAdapter } from './indexeddb/adapters.js';

/**
 * Entity Types and their schemas
 */
export const ENTITY_TYPES = {
    TASK: 'task',
    NOTE: 'note', 
    CHECKLIST: 'checklist',
    PROJECT: 'project',
    PERSON: 'person'
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
 * @returns {Promise<Object>} Created entity
 */
export async function createEntity(type, data) {
    try {
        // Generate unique ID using the incrementNextId system
        const nextId = await incrementNextId(type);
        const entityId = `${type}_${nextId}`;
        
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
        
        // Save to IndexedDB
        await entityAdapter.save(entity);
        
        // Update local appData cache
        const appData = getAppData();
        if (!appData.entities) appData.entities = {};
        appData.entities[entityId] = entity;
        setAppData(appData);
        
        console.log('Created entity:', entityId, entity);
        return entity;
        
    } catch (error) {
        console.error('Failed to create entity:', error);
        showStatusMessage('Failed to create entity', 'error');
        throw error;
    }
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
            
        case ENTITY_TYPES.PERSON:
            return {
                // Person-specific properties
                name: data.name || data.title || '',
                email: data.email || '',
                phone: data.phone || '',
                company: data.company || '',
                role: data.role || '',
                relationshipType: data.relationshipType || 'contact', // contact, friend, family, coworker, partner
                interactionFrequency: data.interactionFrequency || 'monthly', // daily, weekly, monthly, quarterly, yearly
                lastInteraction: data.lastInteraction || new Date().toISOString(),
                
                // Optional personal details
                birthday: data.birthday || null,
                location: data.location || '',
                timezone: data.timezone || '',
                
                // Social links
                socialLinks: data.socialLinks || {},
                
                // Relationship context
                notes: data.notes || '', // Additional notes about this person
                firstMet: data.firstMet || null,
                
                // Override completed for people (not applicable)
                completed: false
            };
            
        default:
            return {};
    }
}

/**
 * Get entity by ID
 * @param {string} entityId - Entity ID
 * @returns {Promise<Object|null>} Entity or null if not found
 */
export async function getEntity(entityId) {
    try {
        // First check local cache
        const appData = getAppData();
        if (appData.entities && appData.entities[entityId]) {
            return appData.entities[entityId];
        }
        
        // Load from IndexedDB
        const entity = await entityAdapter.getById(entityId);
        
        // Update local cache if found
        if (entity) {
            if (!appData.entities) appData.entities = {};
            appData.entities[entityId] = entity;
            setAppData(appData);
        }
        
        return entity;
        
    } catch (error) {
        console.error('Failed to get entity:', entityId, error);
        return null;
    }
}

/**
 * Update entity
 * @param {string} entityId - Entity ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object|null>} Updated entity or null if not found
 */
export async function updateEntity(entityId, updates) {
    try {
        // Get current entity
        const currentEntity = await getEntity(entityId);
        if (!currentEntity) {
            console.warn('Entity not found for update:', entityId);
            return null;
        }
        
        // Apply updates
        const updatedEntity = {
            ...currentEntity,
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        // Save to IndexedDB
        await entityAdapter.save(updatedEntity);
        
        // Update local cache
        const appData = getAppData();
        if (!appData.entities) appData.entities = {};
        appData.entities[entityId] = updatedEntity;
        setAppData(appData);
        
        // Trigger re-render in all contexts where this entity appears
        refreshEntityInAllContexts(entityId, updates);
        
        console.log('Updated entity:', entityId, updates);
        return updatedEntity;
        
    } catch (error) {
        console.error('Failed to update entity:', entityId, error);
        showStatusMessage('Failed to update entity', 'error');
        throw error;
    }
}

/**
 * Delete entity
 * @param {string} entityId - Entity ID
 * @returns {Promise<boolean>} Success
 */
export async function deleteEntity(entityId) {
    try {
        // Check if entity exists
        const entity = await getEntity(entityId);
        if (!entity) {
            console.warn('Entity not found for deletion:', entityId);
            return false;
        }
        
        // Remove from all contexts first
        await removeEntityFromAllContexts(entityId);
        
        // Delete from IndexedDB
        await entityAdapter.delete(entityId);
        
        // Remove from local cache
        const appData = getAppData();
        if (appData.entities && appData.entities[entityId]) {
            delete appData.entities[entityId];
            setAppData(appData);
        }
        
        // Trigger entity deletion event
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('entityDeleted', {
                detail: { entityId }
            }));
        }
        
        console.log('Deleted entity:', entityId);
        return true;
        
    } catch (error) {
        console.error('Failed to delete entity:', entityId, error);
        showStatusMessage('Failed to delete entity', 'error');
        throw error;
    }
}

/**
 * Toggle entity completion status
 * @param {string} entityId - Entity ID
 * @returns {Promise<Object|null>} Updated entity or null if not found
 */
export async function toggleEntityCompletion(entityId) {
    try {
        const entity = await getEntity(entityId);
        if (!entity) return null;
        
        const newCompleted = !entity.completed;
        
        // For checklists, also update completion based on items
        const updates = { completed: newCompleted };
        if (entity.type === ENTITY_TYPES.CHECKLIST && entity.items) {
            // If manually toggling, mark all items the same
            const updatedItems = entity.items.map(item => ({ ...item, completed: newCompleted }));
            updates.items = updatedItems;
        }
        
        return await updateEntity(entityId, updates);
        
    } catch (error) {
        console.error('Failed to toggle entity completion:', entityId, error);
        throw error;
    }
}

/**
 * Add entity to a context
 * @param {string} entityId - Entity ID
 * @param {string} contextType - Context type (board, weekly, task_list)
 * @param {Object} contextData - Context-specific data
 * @returns {Promise<boolean>} Success
 */
export async function addEntityToContext(entityId, contextType, contextData) {
    try {
        const entity = await getEntity(entityId);
        if (!entity) {
            console.warn('Entity not found for context addition:', entityId);
            return false;
        }
        
        switch (contextType) {
            case CONTEXT_TYPES.BOARD:
                return await addEntityToBoard(entityId, contextData.boardId, contextData.rowId, contextData.columnKey);
                
            case CONTEXT_TYPES.WEEKLY:
                return await addEntityToWeekly(entityId, contextData.weekKey, contextData.day);
                
            case CONTEXT_TYPES.TASK_LIST:
                // Task list doesn't need special storage - it's a view
                return true;
                
            default:
                console.warn('Unknown context type:', contextType);
                return false;
        }
        
    } catch (error) {
        console.error('Failed to add entity to context:', error);
        return false;
    }
}

/**
 * Remove entity from a context
 * @param {string} entityId - Entity ID
 * @param {string} contextType - Context type
 * @param {Object} contextData - Context-specific data
 * @returns {Promise<boolean>} Success
 */
export async function removeEntityFromContext(entityId, contextType, contextData) {
    try {
        switch (contextType) {
            case CONTEXT_TYPES.BOARD:
                return await removeEntityFromBoard(entityId, contextData.boardId, contextData.rowId, contextData.columnKey);
                
            case CONTEXT_TYPES.WEEKLY:
                return await removeEntityFromWeekly(entityId, contextData.weekKey);
                
            case CONTEXT_TYPES.TASK_LIST:
                return true;
                
            default:
                console.warn('Unknown context type:', contextType);
                return false;
        }
        
    } catch (error) {
        console.error('Failed to remove entity from context:', error);
        return false;
    }
}

/**
 * Add entity to board context
 * @param {string} entityId - Entity ID
 * @param {string} boardId - Board ID
 * @param {string} rowId - Row ID
 * @param {string} columnKey - Column key
 * @returns {Promise<boolean>} Success
 */
async function addEntityToBoard(entityId, boardId, rowId, columnKey) {
    try {
        // Get board from IndexedDB
        const board = await boardAdapter.getById(boardId);
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
        
        // Save updated board
        await boardAdapter.save(board);
        
        // Update local cache
        const appData = getAppData();
        if (appData.boards && appData.boards[boardId]) {
            appData.boards[boardId] = board;
            setAppData(appData);
        }
        
        console.log('Added entity to board:', entityId, boardId, rowId, columnKey);
        return true;
        
    } catch (error) {
        console.error('Failed to add entity to board:', error);
        return false;
    }
}

/**
 * Remove entity from board context
 * @param {string} entityId - Entity ID
 * @param {string} boardId - Board ID
 * @param {string} rowId - Row ID (optional)
 * @param {string} columnKey - Column key (optional)
 * @returns {Promise<boolean>} Success
 */
async function removeEntityFromBoard(entityId, boardId, rowId = null, columnKey = null) {
    try {
        // Get board from IndexedDB
        const board = await boardAdapter.getById(boardId);
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
            // Save updated board
            await boardAdapter.save(board);
            
            // Update local cache
            const appData = getAppData();
            if (appData.boards && appData.boards[boardId]) {
                appData.boards[boardId] = board;
                setAppData(appData);
            }
            
            console.log('Removed entity from board:', entityId, boardId);
        }
        
        return removed;
        
    } catch (error) {
        console.error('Failed to remove entity from board:', error);
        return false;
    }
}

/**
 * Add entity to weekly context
 * @param {string} entityId - Entity ID
 * @param {string} weekKey - Week key
 * @param {string} day - Day name (optional, for general week items)
 * @returns {Promise<boolean>} Success
 */
async function addEntityToWeekly(entityId, weekKey, day = null) {
    try {
        // Get or create weekly plan
        let weeklyPlan = await weeklyPlanAdapter.getById(weekKey);
        if (!weeklyPlan) {
            weeklyPlan = {
                weekKey,
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
        
        if (!weeklyPlan.items) weeklyPlan.items = [];
        weeklyPlan.items.push(weeklyItem);
        
        // Save updated weekly plan
        await weeklyPlanAdapter.save(weeklyPlan);
        
        // Update local cache
        const appData = getAppData();
        if (!appData.weeklyPlans) appData.weeklyPlans = {};
        appData.weeklyPlans[weekKey] = weeklyPlan;
        setAppData(appData);
        
        console.log('Added entity to weekly plan:', entityId, weekKey, day);
        return true;
        
    } catch (error) {
        console.error('Failed to add entity to weekly plan:', error);
        return false;
    }
}

/**
 * Remove entity from weekly context
 * @param {string} entityId - Entity ID
 * @param {string} weekKey - Week key
 * @returns {Promise<boolean>} Success
 */
async function removeEntityFromWeekly(entityId, weekKey) {
    try {
        const weeklyPlan = await weeklyPlanAdapter.getById(weekKey);
        if (!weeklyPlan) return false;
        
        const originalLength = weeklyPlan.items?.length || 0;
        if (!weeklyPlan.items) weeklyPlan.items = [];
        
        weeklyPlan.items = weeklyPlan.items.filter(item => item.entityId !== entityId);
        const removed = weeklyPlan.items.length < originalLength;
        
        if (removed) {
            // Save updated weekly plan
            await weeklyPlanAdapter.save(weeklyPlan);
            
            // Update local cache
            const appData = getAppData();
            if (appData.weeklyPlans && appData.weeklyPlans[weekKey]) {
                appData.weeklyPlans[weekKey] = weeklyPlan;
                setAppData(appData);
            }
            
            console.log('Removed entity from weekly plan:', entityId, weekKey);
        }
        
        return removed;
        
    } catch (error) {
        console.error('Failed to remove entity from weekly plan:', error);
        return false;
    }
}

/**
 * Remove entity from all contexts
 * @param {string} entityId - Entity ID
 */
async function removeEntityFromAllContexts(entityId) {
    try {
        const appData = getAppData();
        
        // Remove from all boards
        if (appData.boards) {
            for (const boardId of Object.keys(appData.boards)) {
                await removeEntityFromBoard(entityId, boardId);
            }
        }
        
        // Remove from all weekly plans
        if (appData.weeklyPlans) {
            for (const weekKey of Object.keys(appData.weeklyPlans)) {
                await removeEntityFromWeekly(entityId, weekKey);
            }
        }
        
    } catch (error) {
        console.error('Failed to remove entity from all contexts:', error);
    }
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
 * @returns {Promise<Array>} Array of entities
 */
export async function getEntitiesInContext(contextType, contextData) {
    try {
        switch (contextType) {
            case CONTEXT_TYPES.BOARD: {
                const board = await boardAdapter.getById(contextData.boardId);
                if (!board) return [];
                
                const entityIds = new Set();
                
                board.rows.forEach(row => {
                    if (row.cards) {
                        Object.values(row.cards).forEach(cardList => {
                            cardList.forEach(id => entityIds.add(id));
                        });
                    }
                });
                
                // Get all entities
                const entities = [];
                for (const entityId of entityIds) {
                    const entity = await getEntity(entityId);
                    if (entity) entities.push(entity);
                }
                
                return entities;
            }
            
            case CONTEXT_TYPES.WEEKLY: {
                const weeklyPlan = await weeklyPlanAdapter.getById(contextData.weekKey);
                if (!weeklyPlan) return [];
                
                const entities = [];
                for (const item of weeklyPlan.items || []) {
                    const entity = await getEntity(item.entityId);
                    if (entity) entities.push(entity);
                }
                
                return entities;
            }
            
            case CONTEXT_TYPES.TASK_LIST: {
                // Return all task-type entities
                const allEntities = await entityAdapter.getByType(ENTITY_TYPES.TASK);
                return allEntities;
            }
            
            default:
                return [];
        }
        
    } catch (error) {
        console.error('Failed to get entities in context:', error);
        return [];
    }
}

/**
 * Search entities by criteria
 * @param {Object} criteria - Search criteria
 * @returns {Promise<Array>} Matching entities
 */
export async function searchEntities(criteria = {}) {
    try {
        let entities = [];
        
        // If we have a type filter, use the type index
        if (criteria.type) {
            entities = await entityAdapter.getByType(criteria.type);
        } else {
            entities = await entityAdapter.getAll();
        }
        
        // Apply additional filters
        return entities.filter(entity => {
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
        
    } catch (error) {
        console.error('Failed to search entities:', error);
        return [];
    }
}

/**
 * Get all entities of a specific type
 * @param {string} type - Entity type
 * @returns {Promise<Array>} Array of entities
 */
export async function getEntitiesByType(type) {
    try {
        return await entityAdapter.getByType(type);
    } catch (error) {
        console.error('Failed to get entities by type:', error);
        return [];
    }
}

/**
 * Get all entities
 * @returns {Promise<Array>} Array of all entities
 */
export async function getAllEntities() {
    try {
        return await entityAdapter.getAll();
    } catch (error) {
        console.error('Failed to get all entities:', error);
        return [];
    }
}

/**
 * Debug function to list all entities
 * @returns {Promise<Object>} Debug information about entities
 */
export async function debugEntities() {
    try {
        const entities = await entityAdapter.getAll();
        const boards = await boardAdapter.getAll();
        const weeklyPlans = await weeklyPlanAdapter.getAll();
        
        console.log('=== ENTITY DEBUG (IndexedDB) ===');
        console.log('Total entities:', entities.length);
        
        entities.forEach(entity => {
            console.log(`${entity.id}: ${entity.title || 'Untitled'} (${entity.type})`);
        });
        
        // Check weekly items
        console.log('\n=== WEEKLY ITEMS ===');
        weeklyPlans.forEach(plan => {
            console.log(`Week ${plan.weekKey}:`);
            (plan.items || []).forEach(item => {
                const entity = entities.find(e => e.id === item.entityId);
                console.log(`  ${item.id}: entityId=${item.entityId} (${entity ? '✓' : '✗ MISSING'})`);
            });
        });
        
        return { entities, boards, weeklyPlans };
        
    } catch (error) {
        console.error('Failed to debug entities:', error);
        return { entities: [], boards: [], weeklyPlans: [] };
    }
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
        getEntitiesByType,
        getAllEntities,
        debugEntities,
        ENTITY_TYPES,
        CONTEXT_TYPES
    };
}