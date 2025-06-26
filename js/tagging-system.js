/**
 * GridFlow - Tagging System Module
 * Handles tag creation, management, and entity relationships
 * Part of the Phase 2 architecture for enhanced organization and filtering
 */

import { appData, saveData } from './core-data.js';

/**
 * Create a new tag with metadata
 * @param {string} name - Tag name (will be normalized to lowercase)
 * @param {string} color - Tag color (hex code)
 * @param {string} category - Tag category for organization
 * @param {string} description - Optional tag description
 * @returns {string} New tag ID
 */
export function createTag(name, color, category, description = '') {
    const tagId = `tag_${appData.nextTagId++}`;
    
    appData.tags[tagId] = {
        id: tagId,
        name: name.toLowerCase().trim(),
        color: color,
        category: category,
        description: description,
        usageCount: 0,
        createdAt: new Date().toISOString()
    };
    
    saveData();
    return tagId;
}

/**
 * Add a tag to an entity (card, row, board, etc.)
 * @param {string} entityType - Type of entity (card, row, board, etc.)
 * @param {string} entityId - Entity ID
 * @param {string} tagId - Tag ID to add
 * @returns {boolean} Success status
 */
export function addTagToEntity(entityType, entityId, tagId) {
    const tag = appData.tags[tagId];
    if (!tag) return false;
    
    const entityKey = `${entityType}:${entityId}`;
    
    if (!appData.relationships.entityTags[entityKey]) {
        appData.relationships.entityTags[entityKey] = [];
    }
    
    // Avoid duplicates
    if (!appData.relationships.entityTags[entityKey].includes(tagId)) {
        appData.relationships.entityTags[entityKey].push(tagId);
        tag.usageCount++;
        saveData();
    }
    
    return true;
}

/**
 * Remove a tag from an entity
 * @param {string} entityType - Type of entity (card, row, board, etc.)
 * @param {string} entityId - Entity ID
 * @param {string} tagId - Tag ID to remove
 * @returns {boolean} Success status
 */
export function removeTagFromEntity(entityType, entityId, tagId) {
    const entityKey = `${entityType}:${entityId}`;
    
    if (appData.relationships.entityTags[entityKey]) {
        const index = appData.relationships.entityTags[entityKey].indexOf(tagId);
        if (index > -1) {
            appData.relationships.entityTags[entityKey].splice(index, 1);
            
            // Decrease usage count
            if (appData.tags[tagId]) {
                appData.tags[tagId].usageCount = Math.max(0, appData.tags[tagId].usageCount - 1);
            }
            
            // Clean up empty arrays
            if (appData.relationships.entityTags[entityKey].length === 0) {
                delete appData.relationships.entityTags[entityKey];
            }
            
            saveData();
            return true;
        }
    }
    
    return false;
}

/**
 * Get tags by category, or all tags sorted by usage
 * @param {string|null} category - Optional category filter 
 * @returns {Array} Array of tag objects
 */
export function getTagsByCategory(category = null) {
    const tags = Object.values(appData.tags);
    
    if (category) {
        return tags.filter(tag => tag.category === category);
    }
    
    return tags.sort((a, b) => b.usageCount - a.usageCount);
}

/**
 * Find a tag by its name
 * @param {string} name - Tag name to search for (case-insensitive)
 * @returns {Object|undefined} Tag object if found, undefined otherwise
 */
export function findTagByName(name) {
    return Object.values(appData.tags).find(tag => tag.name === name.toLowerCase());
}

/**
 * Get all tags associated with a specific entity
 * @param {string} entityType - Type of entity (card, row, board, etc.)
 * @param {string} entityId - Entity ID
 * @returns {Array} Array of tag objects
 */
export function getEntityTags(entityType, entityId) {
    const entityKey = `${entityType}:${entityId}`;
    const tagIds = appData.relationships.entityTags[entityKey] || [];
    return tagIds.map(tagId => appData.tags[tagId]).filter(Boolean);
}

/**
 * Get all entities with a specific tag
 * @param {string} tagId - Tag ID to search for
 * @returns {Array} Array of entity references {type, id}
 */
export function getEntitiesWithTag(tagId) {
    const entities = [];
    
    Object.keys(appData.relationships.entityTags).forEach(entityKey => {
        if (appData.relationships.entityTags[entityKey].includes(tagId)) {
            const [type, id] = entityKey.split(':');
            entities.push({ type, id });
        }
    });
    
    return entities;
}

/**
 * Delete a tag completely from the system
 * @param {string} tagId - Tag ID to delete
 * @returns {boolean} Success status
 */
export function deleteTag(tagId) {
    if (!appData.tags[tagId]) return false;
    
    // Remove tag from all entities
    const entities = getEntitiesWithTag(tagId);
    entities.forEach(entity => {
        removeTagFromEntity(entity.type, entity.id, tagId);
    });
    
    // Delete the tag itself
    delete appData.tags[tagId];
    saveData();
    return true;
}

/**
 * Update tag properties
 * @param {string} tagId - Tag ID to update
 * @param {Object} updates - Object with properties to update
 * @returns {boolean} Success status
 */
export function updateTag(tagId, updates) {
    if (!appData.tags[tagId]) return false;
    
    const allowedUpdates = ['name', 'color', 'category', 'description'];
    allowedUpdates.forEach(key => {
        if (updates.hasOwnProperty(key)) {
            if (key === 'name') {
                appData.tags[tagId][key] = updates[key].toLowerCase().trim();
            } else {
                appData.tags[tagId][key] = updates[key];
            }
        }
    });
    
    saveData();
    return true;
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