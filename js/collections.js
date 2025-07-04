/**
 * GridFlow - Smart Collections System Module (Dexie)
 * Handles dynamic views and saved searches of entities based on tags, filters, and other criteria
 * Part of the Phase 2 architecture for enhanced organization and productivity
 */

import { findTagByName, getEntityTags } from './tagging-system.js';
import { metaService } from './meta-service.js';
import { ENTITY_TYPES } from './entity-core.js';

/**
 * Create a new smart collection with specified filters
 * @param {string} name - Collection name
 * @param {string} description - Collection description
 * @param {Object} filters - Filter criteria { tags: [], entityTypes: [], priorities: [], dateRange: null }
 * @param {boolean} isPublic - Whether collection is public (default: false)
 * @returns {string} New collection ID
 */
export async function createCollection(name, description, filters) {
    try {
        const collection = await metaService.createCollection(
            name,
            'saved_search',
            'general',
            filters,
            true
        );
        
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
        const collection = await metaService.getCollection(collectionId);
        if (!collection) return false;
        
        // Use metaService to execute collection filters
        const entities = await metaService.executeCollection(collectionId);
        
        return entities.map(entity => ({
            type: entity.type,
            entity: entity
        }));
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
        const entities = await metaService.executeCollection(collectionId);
        const items = [];
        
        for (const entity of entities) {
            const tags = await getEntityTags(entity.type, entity.id);
            items.push({
                type: entity.type,
                entity: entity,
                tags: tags
            });
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
        const collections = await metaService.getAllCollections();
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
    const existingCollections = await metaService.getAllCollections();
    if (existingCollections.length === 0) {
        // High Priority Items Collection
        await createCollection(
            "High Priority Items",
            "All high priority tasks, notes, and checklists across all projects",
            {
                entityTypes: [ENTITY_TYPES.TASK, ENTITY_TYPES.NOTE, ENTITY_TYPES.CHECKLIST],
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
                entityTypes: [ENTITY_TYPES.TASK, ENTITY_TYPES.NOTE, ENTITY_TYPES.CHECKLIST],
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
                entityTypes: [ENTITY_TYPES.TASK, ENTITY_TYPES.NOTE, ENTITY_TYPES.CHECKLIST],
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