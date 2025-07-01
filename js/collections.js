/**
 * GridFlow - Smart Collections System Module
 * Handles dynamic views and saved searches of entities based on tags, filters, and other criteria
 * Part of the Phase 2 architecture for enhanced organization and productivity
 */

import { appData, saveData } from './core-data.js';
import { findTagByName, getEntityTags } from './tagging-system.js';
import { collectionsAdapter } from './indexeddb/adapters.js';

/**
 * Create a new smart collection with specified filters
 * @param {string} name - Collection name
 * @param {string} description - Collection description
 * @param {Object} filters - Filter criteria { tags: [], entityTypes: [], priorities: [], dateRange: null }
 * @param {boolean} isPublic - Whether collection is public (default: false)
 * @returns {string} New collection ID
 */
export async function createCollection(name, description, filters, isPublic = false) {
    try {
        const collection = await collectionsAdapter.createCollection({
            name,
            description,
            filters,
            isPublic,
            type: 'saved_search'
        });
        
        // Initialize collection with current matching entities
        await updateCollectionItems(collection.id);
        
        return collection.id;
    } catch (error) {
        console.error('Failed to create collection:', error);
        throw error;
    }
}

/**
 * Update items in a collection based on its filter criteria
 * @param {string} collectionId - Collection ID to update
 * @returns {Array|boolean} Array of matching entities or false if collection doesn't exist
 */
export async function updateCollectionItems(collectionId) {
    try {
        const collection = await collectionsAdapter.getById(collectionId);
        if (!collection) return false;
        
        const filters = collection.filters;
        let entities = [];
        
        // Get entities from IndexedDB based on filter criteria
        if (!filters.entityTypes || filters.entityTypes.length === 0) {
            // Get all entities
            const allEntities = await window.adapters.entity.getAll();
            entities = allEntities.map(entity => ({ type: entity.type, entity: entity }));
        } else {
            // Get specific entity types
            for (const type of filters.entityTypes) {
                const typeEntities = await window.adapters.entity.getByType(type);
                entities.push(...typeEntities.map(entity => ({ type: type, entity: entity })));
            }
        }
        
        // Filter by tags
        if (filters.tags && filters.tags.length > 0) {
            const filteredEntities = [];
            for (const item of entities) {
                const entityTags = await getEntityTags(item.type, item.entity.id);
                if (filters.tags.some(tagId => entityTags.some(tag => tag.id === tagId))) {
                    filteredEntities.push(item);
                }
            }
            entities = filteredEntities;
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
        
        // Update collection with new item count and timestamp
        await collectionsAdapter.updateCollection(collectionId, {
            itemCount: entities.length,
            lastUpdated: new Date().toISOString()
        });
        
        // Store collection items in collection
        await collectionsAdapter.updateItems(collectionId, entities.map(item => `${item.type}:${item.entity.id}`));
        
        return entities;
    } catch (error) {
        console.error('Failed to update collection items:', error);
        return false;
    }
}

/**
 * Get all items in a collection with their metadata
 * @param {string} collectionId - Collection ID
 * @returns {Array} Array of items with type, entity, and tags
 */
export async function getCollectionItems(collectionId) {
    try {
        const collection = await collectionsAdapter.getById(collectionId);
        if (!collection) return [];
        
        const entityKeys = collection.items || [];
        const items = [];
        
        for (const entityKey of entityKeys) {
            const [entityType, entityId] = entityKey.split(':');
            const entity = await window.adapters.entity.getById(entityId);
            
            if (entity) {
                const tags = await getEntityTags(entityType, entityId);
                items.push({
                    type: entityType,
                    entity: entity,
                    tags: tags
                });
            }
        }
        
        return items;
    } catch (error) {
        console.error('Failed to get collection items:', error);
        return [];
    }
}

/**
 * Update all collections to refresh their item lists
 * Called when entities change to maintain collection accuracy
 */
export async function updateAllCollections() {
    try {
        const collections = await collectionsAdapter.getAll();
        for (const collection of collections) {
            await updateCollectionItems(collection.id);
        }
    } catch (error) {
        console.error('Failed to update all collections:', error);
    }
}

/**
 * Initialize sample collections for demonstration purposes
 * Creates helpful default collections if none exist
 */
export async function initializeSampleCollections() {
    const existingCollections = await collectionsAdapter.getAll();
    if (existingCollections.length === 0) {
        // High Priority Items Collection
        await createCollection(
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
        // Get work tag if it exists
        const workTag = await findTagByName('work');
        await createCollection(
            "Work Items",
            "All work-related items tagged with 'work'",
            {
                entityTypes: ['task', 'note', 'checklist'],
                priorities: [],
                tags: workTag ? [workTag.id] : [],
                dateRange: null
            }
        );
        
        // This Week's Items
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        await createCollection(
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