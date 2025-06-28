/**
 * GridFlow - Smart Collections System Module
 * Handles dynamic views and saved searches of entities based on tags, filters, and other criteria
 * Part of the Phase 2 architecture for enhanced organization and productivity
 */

import { appData, saveData } from './core-data.js';
import { findTagByName, getEntityTags } from './tagging-system.js';

/**
 * Create a new smart collection with specified filters
 * @param {string} name - Collection name
 * @param {string} description - Collection description
 * @param {Object} filters - Filter criteria { tags: [], entityTypes: [], priorities: [], dateRange: null }
 * @param {boolean} isPublic - Whether collection is public (default: false)
 * @returns {string} New collection ID
 */
export function createCollection(name, description, filters, isPublic = false) {
    const collectionId = `collection_${appData.nextCollectionId++}`;
    
    appData.collections[collectionId] = {
        id: collectionId,
        name: name,
        description: description,
        filters: filters, // { tags: [], entityTypes: [], priorities: [], dateRange: null }
        isPublic: isPublic,
        itemCount: 0,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };
    
    // Initialize collection with current matching entities
    updateCollectionItems(collectionId);
    
    saveData();
    return collectionId;
}

/**
 * Update items in a collection based on its filter criteria
 * @param {string} collectionId - Collection ID to update
 * @returns {Array|boolean} Array of matching entities or false if collection doesn't exist
 */
export function updateCollectionItems(collectionId) {
    const collection = appData.collections[collectionId];
    if (!collection) return false;
    
    const filters = collection.filters;
    let entities = [];
    
    // Start with all entities
    if (!filters.entityTypes || filters.entityTypes.length === 0) {
        // Get all entity types - handle both old and new entity structure
        if (appData.entities && appData.entities.tasks) {
            entities.push(...Object.values(appData.entities.tasks).map(e => ({ type: 'task', entity: e })));
        }
        if (appData.entities && appData.entities.notes) {
            entities.push(...Object.values(appData.entities.notes).map(e => ({ type: 'note', entity: e })));
        }
        if (appData.entities && appData.entities.checklists) {
            entities.push(...Object.values(appData.entities.checklists).map(e => ({ type: 'checklist', entity: e })));
        }
        
        // Handle new flat entity structure (v5.0)
        if (appData.entities && !appData.entities.tasks) {
            Object.values(appData.entities).forEach(entity => {
                if (entity && entity.type) {
                    entities.push({ type: entity.type, entity: entity });
                }
            });
        }
    } else {
        // Get specific entity types
        filters.entityTypes.forEach(type => {
            if (type === 'task' && appData.entities && appData.entities.tasks) {
                entities.push(...Object.values(appData.entities.tasks).map(e => ({ type: 'task', entity: e })));
            } else if (type === 'note' && appData.entities && appData.entities.notes) {
                entities.push(...Object.values(appData.entities.notes).map(e => ({ type: 'note', entity: e })));
            } else if (type === 'checklist' && appData.entities && appData.entities.checklists) {
                entities.push(...Object.values(appData.entities.checklists).map(e => ({ type: 'checklist', entity: e })));
            } else if (appData.entities) {
                // Handle flat entity structure
                Object.values(appData.entities).forEach(entity => {
                    if (entity && entity.type === type) {
                        entities.push({ type: type, entity: entity });
                    }
                });
            }
        });
    }
    
    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
        entities = entities.filter(item => {
            const entityTags = window.getTagsForEntity ? window.getTagsForEntity(item.type, item.entity.id) : [];
            return filters.tags.some(tagId => entityTags.some(tag => tag.id === tagId));
        });
    }
    
    // Filter by priority
    if (filters.priorities && filters.priorities.length > 0) {
        entities = entities.filter(item => {
            return filters.priorities.includes(item.entity.priority || 'medium');
        });
    }
    
    // Filter by date range
    if (filters.dateRange) {
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        
        entities = entities.filter(item => {
            const entityDate = new Date(item.entity.createdAt);
            return entityDate >= startDate && entityDate <= endDate;
        });
    }
    
    // Update collection entity relationships
    if (!appData.relationships) {
        appData.relationships = {};
    }
    if (!appData.relationships.collectionEntities) {
        appData.relationships.collectionEntities = {};
    }
    appData.relationships.collectionEntities[collectionId] = entities.map(item => `${item.type}:${item.entity.id}`);
    
    // Update collection metadata
    collection.itemCount = entities.length;
    collection.lastUpdated = new Date().toISOString();
    
    return entities;
}

/**
 * Get all items in a collection with their metadata
 * @param {string} collectionId - Collection ID
 * @returns {Array} Array of items with type, entity, and tags
 */
export function getCollectionItems(collectionId) {
    const collection = appData.collections[collectionId];
    if (!collection) return [];
    
    const entityKeys = appData.relationships.collectionEntities[collectionId] || [];
    
    return entityKeys.map(entityKey => {
        const [entityType, entityId] = entityKey.split(':');
        let entity = null;
        
        switch (entityType) {
            case 'task':
                entity = appData.entities.tasks[entityId];
                break;
            case 'note':
                entity = appData.entities.notes[entityId];
                break;
            case 'checklist':
                entity = appData.entities.checklists[entityId];
                break;
        }
        
        return {
            type: entityType,
            entity: entity,
            tags: window.getTagsForEntity ? window.getTagsForEntity(entityType, entityId) : []
        };
    }).filter(item => item.entity); // Filter out deleted entities
}

/**
 * Update all collections to refresh their item lists
 * Called when entities change to maintain collection accuracy
 */
export function updateAllCollections() {
    Object.keys(appData.collections).forEach(collectionId => {
        updateCollectionItems(collectionId);
    });
    // Note: Don't call saveData() here to avoid infinite loop - caller will save
}

/**
 * Initialize sample collections for demonstration purposes
 * Creates helpful default collections if none exist
 */
export function initializeSampleCollections() {
    if (Object.keys(appData.collections).length === 0) {
        // High Priority Items Collection
        createCollection(
            "High Priority Items",
            "All high priority tasks, notes, and checklists across all projects",
            {
                entityTypes: ['task', 'note', 'checklist'],
                priorities: ['high', 'urgent'],
                tags: [],
                dateRange: null
            }
        );
        
        // Work Items Collection
        createCollection(
            "Work Items",
            "All work-related items tagged with 'work'",
            {
                entityTypes: ['task', 'note', 'checklist'],
                priorities: [],
                tags: [findTagByName('work')].filter(Boolean).map(tag => tag.id),
                dateRange: null
            }
        );
        
        // This Week's Items
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        createCollection(
            "This Week's Items",
            "All items created this week",
            {
                entityTypes: ['task', 'note', 'checklist'],
                priorities: [],
                tags: [],
                dateRange: {
                    start: weekStart.toISOString(),
                    end: weekEnd.toISOString()
                }
            }
        );
    }
}

// Make functions available globally for backward compatibility
window.createCollection = createCollection;
window.updateCollectionItems = updateCollectionItems;
window.getCollectionItems = getCollectionItems;
window.updateAllCollections = updateAllCollections;
window.initializeSampleCollections = initializeSampleCollections;