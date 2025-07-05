/**
 * GridFlow - Unified Entity Core System (Dexie)
 * 
 * This module provides a unified entity system where all content (tasks, notes, 
 * checklists, etc.) are stored as entities that can exist in multiple contexts
 * (boards, weekly plans, task lists) while maintaining a single source of truth in Dexie.
 */

import { getAppData, setAppData, saveData, incrementNextId } from './core-data.js';
import { showStatusMessage } from './utilities.js';
import { db } from './db.js';
import { entityService } from './entity-service.js';
import { boardService } from './board-service.js';

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
    TASK_LIST: 'task_list',
    COLLECTION: 'collection',
    TAG: 'tag',
    PEOPLE: 'people'
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
        
        // Save to Dexie
        await entityService.save(entity);
        
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
                parentEntityId: data.parentEntityId || null,
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
                milestones: data.milestones || [],
                subtasks: data.subtasks || [],
                parentEntityId: data.parentEntityId || null
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
        
        // Load from Dexie
        const entity = await entityService.getById(entityId);
        
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
        
        // Save to Dexie
        await entityService.save(updatedEntity);
        
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
        
        // Delete from Dexie (includes cleanup of related data)
        await entityService.delete(entityId);
        
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
                
            case CONTEXT_TYPES.COLLECTION:
                return await addEntityToCollection(entityId, contextData.collectionId);
                
            case CONTEXT_TYPES.TAG:
                return await addEntityToTag(entityId, contextData.tagName || contextData.tagId);
                
            case CONTEXT_TYPES.PEOPLE:
                return await addEntityToPerson(entityId, contextData.personId);
                
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
                
            case CONTEXT_TYPES.COLLECTION:
                return await removeEntityFromCollection(entityId, contextData.collectionId);
                
            case CONTEXT_TYPES.TAG:
                return await removeEntityFromTag(entityId, contextData.tagName || contextData.tagId);
                
            case CONTEXT_TYPES.PEOPLE:
                return await removeEntityFromPerson(entityId, contextData.personId);
                
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
        // Use entity service to set position and board service for board updates
        await entityService.setPosition(entityId, boardId, 'board', rowId, columnKey);
        
        // Get board for row.cards structure update
        const board = await boardService.getById(boardId);
        if (!board) {
            console.warn('Board not found:', boardId);
            return false;
        }
        
        const row = board.rows.find(r => r.id == rowId);
        if (!row) {
            console.warn('Row not found:', rowId);
            return false;
        }
        
        // Initialize cards structure if needed
        if (!row.cards) row.cards = {};
        if (!row.cards[columnKey]) row.cards[columnKey] = [];
        
        // Add entity reference to board (for backward compatibility)
        if (!row.cards[columnKey].includes(entityId)) {
            row.cards[columnKey].push(entityId);
        }
        
        // Save updated board
        await boardService.save(board);
        
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
        // Remove entity position from Dexie
        await entityService.removePosition(entityId, boardId, 'board');
        
        // Get board for row.cards structure update
        const board = await boardService.getById(boardId);
        if (!board) return false;
        
        let removed = false;
        
        board.rows.forEach(row => {
            if (rowId && row.id != rowId) return;
            
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
            await boardService.save(board);
            
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
        // Use entity service to add to weekly plan
        await entityService.addToWeeklyPlan(entityId, weekKey, day);
        
        // Get or create weekly plan for local cache update
        let weeklyPlan = await db.weeklyPlans.get(weekKey);
        if (!weeklyPlan) {
            weeklyPlan = {
                weekKey,
                weekStart: new Date().toISOString(),
                goal: '',
                items: [],
                reflection: { wins: '', challenges: '', learnings: '', nextWeekFocus: '' }
            };
            await db.weeklyPlans.put(weeklyPlan);
        }
        
        // Update local cache
        const appData = getAppData();
        if (!appData.weeklyPlans) appData.weeklyPlans = {};
        
        // Reload weekly plan to get updated items
        const updatedPlan = await db.weeklyPlans.get(weekKey);
        if (updatedPlan) {
            appData.weeklyPlans[weekKey] = updatedPlan;
            setAppData(appData);
        }
        
        console.log('Added entity to weekly plan:', entityId, weekKey, day);
        return true;
        
    } catch (error) {
        console.error('Failed to add entity to weekly plan:', error);
        return false;
    }
}

/**
 * Add entity to collection context
 * @param {string} entityId - Entity ID
 * @param {string} collectionId - Collection ID
 * @returns {Promise<boolean>} Success
 */
async function addEntityToCollection(entityId, collectionId) {
    try {
        // This would integrate with the collections system
        // For now, we'll use entity relationships to track collection membership
        const relationshipId = `collection_${collectionId}_${entityId}`;
        const relationship = {
            id: relationshipId,
            entityId: entityId,
            relatedId: collectionId,
            relationshipType: 'collection',
            createdAt: new Date().toISOString()
        };
        
        await db.entityRelationships.put(relationship);
        
        console.log('Added entity to collection:', entityId, collectionId);
        return true;
        
    } catch (error) {
        console.error('Failed to add entity to collection:', error);
        return false;
    }
}

/**
 * Remove entity from collection context
 * @param {string} entityId - Entity ID
 * @param {string} collectionId - Collection ID
 * @returns {Promise<boolean>} Success
 */
async function removeEntityFromCollection(entityId, collectionId) {
    try {
        await db.entityRelationships
            .where('entityId').equals(entityId)
            .and(rel => rel.relatedId === collectionId && rel.relationshipType === 'collection')
            .delete();
            
        console.log('Removed entity from collection:', entityId, collectionId);
        return true;
        
    } catch (error) {
        console.error('Failed to remove entity from collection:', error);
        return false;
    }
}

/**
 * Add entity to tag context
 * @param {string} entityId - Entity ID
 * @param {string} tagName - Tag name
 * @returns {Promise<boolean>} Success
 */
async function addEntityToTag(entityId, tagName) {
    try {
        // Get the entity and add the tag to its tags array
        const entity = await getEntity(entityId);
        if (!entity) {
            console.warn('Entity not found for tagging:', entityId);
            return false;
        }
        
        // Add tag to entity's tags array if not already present
        if (!entity.tags) entity.tags = [];
        if (!entity.tags.includes(tagName)) {
            entity.tags.push(tagName);
            await updateEntity(entityId, { tags: entity.tags });
        }
        
        console.log('Added tag to entity:', entityId, tagName);
        return true;
        
    } catch (error) {
        console.error('Failed to add tag to entity:', error);
        return false;
    }
}

/**
 * Remove entity from tag context
 * @param {string} entityId - Entity ID
 * @param {string} tagName - Tag name
 * @returns {Promise<boolean>} Success
 */
async function removeEntityFromTag(entityId, tagName) {
    try {
        // Get the entity and remove the tag from its tags array
        const entity = await getEntity(entityId);
        if (!entity || !entity.tags) {
            return true; // Already doesn't have the tag
        }
        
        // Remove tag from entity's tags array
        entity.tags = entity.tags.filter(tag => tag !== tagName);
        await updateEntity(entityId, { tags: entity.tags });
        
        console.log('Removed tag from entity:', entityId, tagName);
        return true;
        
    } catch (error) {
        console.error('Failed to remove tag from entity:', error);
        return false;
    }
}

/**
 * Add entity to people context (bidirectional linking)
 * @param {string} entityId - Entity ID
 * @param {string} personId - Person ID
 * @returns {Promise<boolean>} Success
 */
async function addEntityToPerson(entityId, personId) {
    try {
        // Use entity service's existing linkToPerson method if available
        if (entityService.linkToPerson) {
            await entityService.linkToPerson(entityId, personId);
        } else {
            // Fallback: Add person to entity's people array
            const entity = await getEntity(entityId);
            if (!entity) {
                console.warn('Entity not found for person linking:', entityId);
                return false;
            }
            
            // Add person to entity's people array if not already present
            if (!entity.people) entity.people = [];
            if (!entity.people.includes(personId)) {
                entity.people.push(personId);
                await updateEntity(entityId, { people: entity.people });
            }
        }
        
        console.log('Linked entity to person:', entityId, personId);
        return true;
        
    } catch (error) {
        console.error('Failed to link entity to person:', error);
        return false;
    }
}

/**
 * Remove entity from people context (bidirectional unlinking)
 * @param {string} entityId - Entity ID
 * @param {string} personId - Person ID
 * @returns {Promise<boolean>} Success
 */
async function removeEntityFromPerson(entityId, personId) {
    try {
        // Use entity service's existing unlinkFromPerson method if available
        if (entityService.unlinkFromPerson) {
            await entityService.unlinkFromPerson(entityId, personId);
        } else {
            // Fallback: Remove person from entity's people array
            const entity = await getEntity(entityId);
            if (!entity || !entity.people) {
                return true; // Already not linked
            }
            
            // Remove person from entity's people array
            entity.people = entity.people.filter(id => id !== personId);
            await updateEntity(entityId, { people: entity.people });
        }
        
        console.log('Unlinked entity from person:', entityId, personId);
        return true;
        
    } catch (error) {
        console.error('Failed to unlink entity from person:', error);
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
        // Use entity service to remove from weekly plan
        const removed = await entityService.removeFromWeeklyPlan(entityId, weekKey);
        
        if (removed) {
            // Update local cache
            const appData = getAppData();
            if (appData.weeklyPlans && appData.weeklyPlans[weekKey]) {
                // Reload weekly plan to get updated items
                const updatedPlan = await db.weeklyPlans.get(weekKey);
                if (updatedPlan) {
                    appData.weeklyPlans[weekKey] = updatedPlan;
                    setAppData(appData);
                }
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
                // Use entity service to get entities by board
                return await entityService.getByBoard(contextData.boardId);
            }
            
            case CONTEXT_TYPES.WEEKLY: {
                // Use entity service to get weekly plan entities
                return await entityService.getWeeklyPlanEntities(contextData.weekKey);
            }
            
            case CONTEXT_TYPES.TASK_LIST: {
                // Return all task-type entities using Dexie query
                return await entityService.getByType(ENTITY_TYPES.TASK);
            }
            
            case CONTEXT_TYPES.COLLECTION: {
                // Get entities in a collection via relationships
                const relationships = await db.entityRelationships
                    .where('relatedId').equals(contextData.collectionId)
                    .and(rel => rel.relationshipType === 'collection')
                    .toArray();
                    
                const entityIds = relationships.map(rel => rel.entityId);
                if (entityIds.length === 0) return [];
                
                return await entityService.getByEntityIds ? 
                    await entityService.getByEntityIds(entityIds) : 
                    await db.entities.where('id').anyOf(entityIds).toArray();
            }
            
            case CONTEXT_TYPES.TAG: {
                // Get entities with a specific tag
                const tagName = contextData.tagName || contextData.tagId;
                return await entityService.getByTags ? 
                    await entityService.getByTags([tagName]) :
                    await db.entities.where('tags').equals(tagName).toArray();
            }
            
            case CONTEXT_TYPES.PEOPLE: {
                // Get entities linked to a specific person (reverse chronological order)
                const entities = await entityService.getByPerson ? 
                    await entityService.getByPerson(contextData.personId) :
                    await db.entities.where('people').equals(contextData.personId).toArray();
                    
                // Sort by updated date (newest first) for timeline view
                return entities.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
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
        // Use Dexie's optimized queries for better performance
        let entities = [];
        
        // If we have a type filter, use the indexed type query
        if (criteria.type) {
            entities = await entityService.getByType(criteria.type);
        } else if (criteria.completed !== undefined) {
            // Use completion index if available
            entities = criteria.completed ? await entityService.getCompleted() : await entityService.getPending();
        } else if (criteria.priority) {
            // Use priority index if available
            entities = await entityService.getByPriority(criteria.priority);
        } else if (criteria.tags && criteria.tags.length > 0) {
            // Use tag index for better performance
            entities = await entityService.getByTags(criteria.tags);
        } else if (criteria.search) {
            // Use entity service's optimized search
            return await entityService.search(criteria.search);
        } else {
            entities = await entityService.getAll();
        }
        
        // Apply remaining filters client-side (only if we need additional filtering)
        if (Object.keys(criteria).length <= 1) {
            // Single criterion already filtered by index
            return entities;
        }
        
        return entities.filter(entity => {
            // Completion filter (apply if not the primary filter)
            if (criteria.completed !== undefined && criteria.type && entity.completed !== criteria.completed) return false;
            
            // Priority filter (apply if not the primary filter)
            if (criteria.priority && criteria.type && entity.priority !== criteria.priority) return false;
            
            // Text search (apply if not the primary filter)
            if (criteria.search && (criteria.type || criteria.completed !== undefined || criteria.priority)) {
                const searchTerm = criteria.search.toLowerCase();
                const titleMatch = entity.title?.toLowerCase().includes(searchTerm);
                const contentMatch = entity.content?.toLowerCase().includes(searchTerm);
                if (!titleMatch && !contentMatch) return false;
            }
            
            // Tag filter (apply if not the primary filter)
            if (criteria.tags && criteria.tags.length > 0 && (criteria.type || criteria.completed !== undefined || criteria.priority || criteria.search)) {
                const hasTag = criteria.tags.some(tag => entity.tags?.includes(tag));
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
        return await entityService.getByType(type);
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
        return await entityService.getAll();
    } catch (error) {
        console.error('Failed to get all entities:', error);
        return [];
    }
}

/**
 * Add a subtask to a parent entity
 * @param {string} parentEntityId - Parent entity ID
 * @param {Object} subtaskData - Subtask data
 * @returns {Promise<Object|null>} Created subtask entity or null
 */
export async function addSubtask(parentEntityId, subtaskData) {
    try {
        // Get parent entity
        const parentEntity = await getEntity(parentEntityId);
        if (!parentEntity) {
            console.error('Parent entity not found:', parentEntityId);
            return null;
        }
        
        // Create subtask entity with parent reference
        const subtask = await createEntity(ENTITY_TYPES.TASK, {
            ...subtaskData,
            parentEntityId: parentEntityId
        });
        
        if (!subtask) {
            console.error('Failed to create subtask');
            return null;
        }
        
        // Update parent's subtasks array
        const parentSubtasks = parentEntity.subtasks || [];
        if (!parentSubtasks.includes(subtask.id)) {
            parentSubtasks.push(subtask.id);
            await updateEntity(parentEntityId, { subtasks: parentSubtasks });
        }
        
        console.log('Created subtask:', subtask.id, 'for parent:', parentEntityId);
        return subtask;
        
    } catch (error) {
        console.error('Failed to add subtask:', error);
        showStatusMessage('Failed to add subtask', 'error');
        return null;
    }
}

/**
 * Remove a subtask from a parent entity
 * @param {string} parentEntityId - Parent entity ID
 * @param {string} subtaskEntityId - Subtask entity ID
 * @returns {Promise<boolean>} Success status
 */
export async function removeSubtask(parentEntityId, subtaskEntityId) {
    try {
        // Get parent entity
        const parentEntity = await getEntity(parentEntityId);
        if (!parentEntity) {
            console.error('Parent entity not found:', parentEntityId);
            return false;
        }
        
        // Remove from parent's subtasks array
        const parentSubtasks = parentEntity.subtasks || [];
        const index = parentSubtasks.indexOf(subtaskEntityId);
        if (index > -1) {
            parentSubtasks.splice(index, 1);
            await updateEntity(parentEntityId, { subtasks: parentSubtasks });
        }
        
        // Update subtask to remove parent reference
        const subtask = await getEntity(subtaskEntityId);
        if (subtask && subtask.parentEntityId === parentEntityId) {
            await updateEntity(subtaskEntityId, { parentEntityId: null });
        }
        
        console.log('Removed subtask:', subtaskEntityId, 'from parent:', parentEntityId);
        return true;
        
    } catch (error) {
        console.error('Failed to remove subtask:', error);
        showStatusMessage('Failed to remove subtask', 'error');
        return false;
    }
}

/**
 * Get all subtasks for a parent entity
 * @param {string} parentEntityId - Parent entity ID
 * @returns {Promise<Array>} Array of subtask entities
 */
export async function getSubtasks(parentEntityId) {
    try {
        const parentEntity = await getEntity(parentEntityId);
        if (!parentEntity || !parentEntity.subtasks || parentEntity.subtasks.length === 0) {
            return [];
        }
        
        // Fetch all subtask entities
        const subtasks = [];
        for (const subtaskId of parentEntity.subtasks) {
            const subtask = await getEntity(subtaskId);
            if (subtask) {
                subtasks.push(subtask);
            }
        }
        
        return subtasks;
        
    } catch (error) {
        console.error('Failed to get subtasks:', error);
        return [];
    }
}

/**
 * Get parent entity for a subtask
 * @param {string} subtaskEntityId - Subtask entity ID
 * @returns {Promise<Object|null>} Parent entity or null
 */
export async function getParentEntity(subtaskEntityId) {
    try {
        const subtask = await getEntity(subtaskEntityId);
        if (!subtask || !subtask.parentEntityId) {
            return null;
        }
        
        return await getEntity(subtask.parentEntityId);
        
    } catch (error) {
        console.error('Failed to get parent entity:', error);
        return null;
    }
}

/**
 * Move a subtask to a different parent entity
 * @param {string} subtaskEntityId - Subtask entity ID
 * @param {string} newParentEntityId - New parent entity ID (null to make independent)
 * @returns {Promise<boolean>} Success status
 */
export async function moveSubtask(subtaskEntityId, newParentEntityId) {
    try {
        const subtask = await getEntity(subtaskEntityId);
        if (!subtask) {
            console.error('Subtask not found:', subtaskEntityId);
            return false;
        }
        
        // Remove from old parent if exists
        if (subtask.parentEntityId) {
            await removeSubtask(subtask.parentEntityId, subtaskEntityId);
        }
        
        // Add to new parent or make independent
        if (newParentEntityId) {
            const newParent = await getEntity(newParentEntityId);
            if (!newParent) {
                console.error('New parent entity not found:', newParentEntityId);
                return false;
            }
            
            // Update subtask's parent reference
            await updateEntity(subtaskEntityId, { parentEntityId: newParentEntityId });
            
            // Add to new parent's subtasks array
            const parentSubtasks = newParent.subtasks || [];
            if (!parentSubtasks.includes(subtaskEntityId)) {
                parentSubtasks.push(subtaskEntityId);
                await updateEntity(newParentEntityId, { subtasks: parentSubtasks });
            }
            
            console.log('Moved subtask:', subtaskEntityId, 'to new parent:', newParentEntityId);
        } else {
            // Make independent (no parent)
            await updateEntity(subtaskEntityId, { parentEntityId: null });
            console.log('Made subtask independent:', subtaskEntityId);
        }
        
        return true;
        
    } catch (error) {
        console.error('Failed to move subtask:', error);
        showStatusMessage('Failed to move subtask', 'error');
        return false;
    }
}

/**
 * Delete a subtask and clean up parent references
 * @param {string} subtaskEntityId - Subtask entity ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteSubtask(subtaskEntityId) {
    try {
        const subtask = await getEntity(subtaskEntityId);
        if (!subtask) {
            console.warn('Subtask not found for deletion:', subtaskEntityId);
            return false;
        }
        
        // Remove from parent if exists
        if (subtask.parentEntityId) {
            await removeSubtask(subtask.parentEntityId, subtaskEntityId);
        }
        
        // Delete the entity
        return await deleteEntity(subtaskEntityId);
        
    } catch (error) {
        console.error('Failed to delete subtask:', error);
        showStatusMessage('Failed to delete subtask', 'error');
        return false;
    }
}

/**
 * Calculate task progress based on subtask completion
 * @param {Object} taskEntity - Task entity object
 * @returns {Promise<number>} Progress percentage (0-100)
 */
export async function calculateTaskProgress(taskEntity) {
    try {
        // If no subtasks, progress is based on task completion
        if (!taskEntity.subtasks || taskEntity.subtasks.length === 0) {
            return taskEntity.completed ? 100 : 0;
        }
        
        // Get all subtasks
        const subtasks = await getSubtasks(taskEntity.id);
        if (subtasks.length === 0) {
            return taskEntity.completed ? 100 : 0;
        }
        
        // Calculate percentage of completed subtasks
        const completedCount = subtasks.filter(st => st.completed).length;
        const progress = Math.round((completedCount / subtasks.length) * 100);
        
        return progress;
        
    } catch (error) {
        console.error('Failed to calculate task progress:', error);
        return 0;
    }
}

/**
 * Check if entity can have subtasks
 * @param {Object} entity - Entity object
 * @returns {boolean} Whether entity can have subtasks
 */
export function canHaveSubtasks(entity) {
    // Currently only tasks and projects can have subtasks
    return entity && (entity.type === ENTITY_TYPES.TASK || entity.type === ENTITY_TYPES.PROJECT);
}

/**
 * Debug function to list all entities
 * @returns {Promise<Object>} Debug information about entities
 */
export async function debugEntities() {
    try {
        const entities = await entityService.getAll();
        const boards = await boardService.getAll();
        const weeklyPlans = await db.weeklyPlans.toArray();
        const entityStats = await entityService.getEntityStats();
        
        console.log('=== ENTITY DEBUG (Dexie) ===');
        console.log('Total entities:', entities.length);
        console.log('Entity stats:', entityStats);
        
        entities.forEach(entity => {
            console.log(`${entity.id}: ${entity.title || 'Untitled'} (${entity.type})`);
        });
        
        // Check weekly items
        console.log('\n=== WEEKLY ITEMS ===');
        for (const plan of weeklyPlans) {
            console.log(`Week ${plan.weekKey}:`);
            const weeklyEntities = await entityService.getWeeklyPlanEntities(plan.weekKey);
            weeklyEntities.forEach(entity => {
                console.log(`  ${entity.id}: ${entity.title || 'Untitled'} (${entity.type})`);
            });
        }
        
        // Check entity positions
        console.log('\n=== ENTITY POSITIONS ===');
        const positions = await db.entityPositions.toArray();
        console.log(`Total positions: ${positions.length}`);
        
        return { entities, boards, weeklyPlans, entityStats, positions };
        
    } catch (error) {
        console.error('Failed to debug entities:', error);
        return { entities: [], boards: [], weeklyPlans: [], entityStats: {}, positions: [] };
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
        // Subtask functions
        addSubtask,
        removeSubtask,
        getSubtasks,
        getParentEntity,
        moveSubtask,
        deleteSubtask,
        calculateTaskProgress,
        canHaveSubtasks,
        ENTITY_TYPES,
        CONTEXT_TYPES
    };
}