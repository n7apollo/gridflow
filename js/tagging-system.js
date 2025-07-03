/**
 * GridFlow - Tagging System Module (Dexie)
 * Handles tag creation, management, and entity relationships
 * Part of the Phase 2 architecture for enhanced organization and filtering
 */

import { metaService } from './meta-service.js';
import { entityService } from './entity-service.js';

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
        const tag = await metaService.createTag(name, category, color);
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
        const tag = await metaService.getTag(tagId);
        if (!tag) return false;
        
        // Get current entity and add tag to its tags array
        const entity = await entityService.getById(entityId);
        if (!entity) return false;
        
        if (!entity.tags) entity.tags = [];
        if (!entity.tags.includes(tagId)) {
            entity.tags.push(tagId);
            await entityService.save(entity);
        }
        
        // Increment tag usage
        await metaService.incrementTagUsage(tagId);
        
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
        // Get current entity and remove tag from its tags array
        const entity = await entityService.getById(entityId);
        if (!entity || !entity.tags) return false;
        
        const tagIndex = entity.tags.indexOf(tagId);
        if (tagIndex !== -1) {
            entity.tags.splice(tagIndex, 1);
            await entityService.save(entity);
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
            return await metaService.getTagsByCategory(category);
        }
        
        return await metaService.getPopularTags();
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
        return await metaService.getTagByName(name);
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
        const entity = await entityService.getById(entityId);
        if (!entity || !entity.tags) return [];
        
        const tags = [];
        for (const tagId of entity.tags) {
            const tag = await metaService.getTag(tagId);
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
        const entities = await entityService.getByTags([tagId]);
        return entities.map(entity => ({
            type: entity.type,
            id: entity.id
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
        const tag = await metaService.getTag(tagId);
        if (!tag) return false;
        
        // Remove tag from all entities (metaService handles this automatically)
        await metaService.deleteTag(tagId);
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
        const updatedTag = await metaService.updateTag(tagId, updates);
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