/**
 * GridFlow - Tagging System Module
 * Handles tag creation, management, and entity relationships
 * Part of the Phase 2 architecture for enhanced organization and filtering
 */

import { appData, saveData } from './core-data.js';
import { tagsAdapter, relationshipAdapter } from './indexeddb/adapters.js';

/**
 * Create a new tag with metadata
 * @param {string} name - Tag name (will be normalized to lowercase)
 * @param {string} color - Tag color (hex code)
 * @param {string} category - Tag category for organization
 * @param {string} description - Optional tag description
 * @returns {string} New tag ID
 */
export async function createTag(name, color, category, description = '') {
    try {
        const tag = await tagsAdapter.createTag({
            name,
            color,
            category,
            description
        });
        
        return tag.id;
    } catch (error) {
        console.error('Failed to create tag:', error);
        throw error;
    }
}

/**
 * Add a tag to an entity (card, row, board, etc.)
 * @param {string} entityType - Type of entity (card, row, board, etc.)
 * @param {string} entityId - Entity ID
 * @param {string} tagId - Tag ID to add
 * @returns {boolean} Success status
 */
export async function addTagToEntity(entityType, entityId, tagId) {
    try {
        const tag = await tagsAdapter.getById(tagId);
        if (!tag) return false;
        
        // Create relationship
        await relationshipAdapter.createRelationship(entityId, tagId, 'tagged');
        
        // Increment tag usage
        await tagsAdapter.incrementUsage(tagId);
        
        return true;
    } catch (error) {
        console.error('Failed to add tag to entity:', error);
        return false;
    }
}

/**
 * Remove a tag from an entity
 * @param {string} entityType - Type of entity (card, row, board, etc.)
 * @param {string} entityId - Entity ID
 * @param {string} tagId - Tag ID to remove
 * @returns {boolean} Success status
 */
export async function removeTagFromEntity(entityType, entityId, tagId) {
    try {
        // Remove relationship
        const removed = await relationshipAdapter.removeRelationship(entityId, tagId);
        
        if (removed) {
            // Decrement tag usage
            await tagsAdapter.decrementUsage(tagId);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Failed to remove tag from entity:', error);
        return false;
    }
}

/**
 * Get tags by category, or all tags sorted by usage
 * @param {string|null} category - Optional category filter 
 * @returns {Array} Array of tag objects
 */
export async function getTagsByCategory(category = null) {
    try {
        if (category) {
            return await tagsAdapter.getByCategory(category);
        }
        
        return await tagsAdapter.getByUsage();
    } catch (error) {
        console.error('Failed to get tags by category:', error);
        return [];
    }
}

/**
 * Find a tag by its name
 * @param {string} name - Tag name to search for (case-insensitive)
 * @returns {Object|undefined} Tag object if found, undefined otherwise
 */
export async function findTagByName(name) {
    try {
        return await tagsAdapter.findByName(name);
    } catch (error) {
        console.error('Failed to find tag by name:', error);
        return null;
    }
}

/**
 * Get all tags associated with a specific entity
 * @param {string} entityType - Type of entity (card, row, board, etc.)
 * @param {string} entityId - Entity ID
 * @returns {Array} Array of tag objects
 */
export async function getEntityTags(entityType, entityId) {
    try {
        const relationships = await relationshipAdapter.getByEntity(entityId);
        const tagRelationships = relationships.filter(rel => rel.relationshipType === 'tagged');
        
        const tags = [];
        for (const rel of tagRelationships) {
            const tag = await tagsAdapter.getById(rel.relatedId);
            if (tag) {
                tags.push(tag);
            }
        }
        
        return tags;
    } catch (error) {
        console.error('Failed to get entity tags:', error);
        return [];
    }
}

/**
 * Get all entities with a specific tag
 * @param {string} tagId - Tag ID to search for
 * @returns {Array} Array of entity references {type, id}
 */
export async function getEntitiesWithTag(tagId) {
    try {
        const relationships = await relationshipAdapter.getByRelated(tagId);
        const tagRelationships = relationships.filter(rel => rel.relationshipType === 'tagged');
        
        return tagRelationships.map(rel => ({
            type: 'entity', // Generic type since we store entity relationships
            id: rel.entityId
        }));
    } catch (error) {
        console.error('Failed to get entities with tag:', error);
        return [];
    }
}

/**
 * Delete a tag completely from the system
 * @param {string} tagId - Tag ID to delete
 * @returns {boolean} Success status
 */
export async function deleteTag(tagId) {
    try {
        const tag = await tagsAdapter.getById(tagId);
        if (!tag) return false;
        
        // Remove tag from all entities
        const entities = await getEntitiesWithTag(tagId);
        for (const entity of entities) {
            await removeTagFromEntity(entity.type, entity.id, tagId);
        }
        
        // Delete the tag itself
        await tagsAdapter.delete(tagId);
        return true;
    } catch (error) {
        console.error('Failed to delete tag:', error);
        return false;
    }
}

/**
 * Update tag properties
 * @param {string} tagId - Tag ID to update
 * @param {Object} updates - Object with properties to update
 * @returns {boolean} Success status
 */
export async function updateTag(tagId, updates) {
    try {
        const updatedTag = await tagsAdapter.updateTag(tagId, updates);
        return !!updatedTag;
    } catch (error) {
        console.error('Failed to update tag:', error);
        return false;
    }
}

// Make functions available globally for backward compatibility during transition
window.createTag = createTag;
window.addTagToEntity = addTagToEntity;
window.removeTagFromEntity = removeTagFromEntity;
window.getTagsByCategory = getTagsByCategory;
window.findTagByName = findTagByName;
window.getEntityTags = getEntityTags;
window.getTagsForEntity = getEntityTags; // Alias for backward compatibility
window.getEntitiesWithTag = getEntitiesWithTag;
window.deleteTag = deleteTag;
window.updateTag = updateTag;