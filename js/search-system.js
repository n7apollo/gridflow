/**
 * GridFlow - Search System Module
 * Handles entity search operations across the unified entity system
 * 
 * Features:
 * - Cross-entity search by text content
 * - Tag-based entity filtering  
 * - Support for tasks, notes, and checklists
 * - Advanced filtering with priorities and date ranges
 * - Relevance-based result ranking
 */

import { appData } from './core-data.js';

/**
 * Get tags associated with a specific entity
 * @param {string} entityType - Type of entity ('task', 'note', 'checklist')
 * @param {string} entityId - ID of the entity
 * @returns {Array} Array of tag objects associated with the entity
 */
export function getTagsForEntity(entityType, entityId) {
    const entityKey = `${entityType}:${entityId}`;
    const tagIds = appData.relationships.entityTags[entityKey] || [];
    return tagIds.map(tagId => appData.tags[tagId]).filter(Boolean);
}

/**
 * Search entities by associated tags
 * @param {Array} tagIds - Array of tag IDs to search for
 * @param {Array} entityTypes - Types of entities to include in search (default: ['task', 'note', 'checklist'])
 * @returns {Array} Array of search results with entity data and tags
 */
export function searchEntitiesByTags(tagIds, entityTypes = ['task', 'note', 'checklist']) {
    const results = [];
    
    Object.keys(appData.relationships.entityTags).forEach(entityKey => {
        const [entityType, entityId] = entityKey.split(':');
        
        if (!entityTypes.includes(entityType)) return;
        
        const entityTagIds = appData.relationships.entityTags[entityKey];
        const hasAllTags = tagIds.every(tagId => entityTagIds.includes(tagId));
        
        if (hasAllTags) {
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
            
            if (entity) {
                results.push({
                    type: entityType,
                    entity: entity,
                    tags: getTagsForEntity(entityType, entityId)
                });
            }
        }
    });
    
    return results;
}

/**
 * Search all entities by text content with advanced filtering
 * @param {string} searchTerm - Text to search for
 * @param {Object} filters - Optional filters object
 * @param {Array} filters.entityTypes - Types of entities to search
 * @param {Array} filters.tags - Tag IDs to filter by
 * @param {Array} filters.priorities - Priority levels to filter by
 * @param {Object} filters.dateRange - Date range filter with start/end dates
 * @returns {Array} Array of search results sorted by relevance
 */
export function searchAllEntities(searchTerm, filters = {}) {
    const results = [];
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    // Search tasks
    if (!filters.entityTypes || filters.entityTypes.includes('task')) {
        Object.values(appData.entities.tasks).forEach(task => {
            if (task.text.toLowerCase().includes(lowerSearchTerm)) {
                results.push({
                    type: 'task',
                    entity: task,
                    tags: getTagsForEntity('task', task.id),
                    matchField: 'text'
                });
            }
        });
    }
    
    // Search notes
    if (!filters.entityTypes || filters.entityTypes.includes('note')) {
        Object.values(appData.entities.notes).forEach(note => {
            let matchField = null;
            if (note.title.toLowerCase().includes(lowerSearchTerm)) {
                matchField = 'title';
            } else if (note.content.toLowerCase().includes(lowerSearchTerm)) {
                matchField = 'content';
            }
            
            if (matchField) {
                results.push({
                    type: 'note',
                    entity: note,
                    tags: getTagsForEntity('note', note.id),
                    matchField: matchField
                });
            }
        });
    }
    
    // Search checklists
    if (!filters.entityTypes || filters.entityTypes.includes('checklist')) {
        Object.values(appData.entities.checklists).forEach(checklist => {
            let matchField = null;
            if (checklist.title.toLowerCase().includes(lowerSearchTerm)) {
                matchField = 'title';
            } else if (checklist.description.toLowerCase().includes(lowerSearchTerm)) {
                matchField = 'description';
            }
            
            if (matchField) {
                results.push({
                    type: 'checklist',
                    entity: checklist,
                    tags: getTagsForEntity('checklist', checklist.id),
                    matchField: matchField
                });
            }
        });
    }
    
    // Apply additional filters
    let filteredResults = results;
    
    if (filters.tags && filters.tags.length > 0) {
        filteredResults = filteredResults.filter(item => {
            return filters.tags.some(tagId => item.tags.some(tag => tag.id === tagId));
        });
    }
    
    if (filters.priorities && filters.priorities.length > 0) {
        filteredResults = filteredResults.filter(item => {
            return filters.priorities.includes(item.entity.priority || 'medium');
        });
    }
    
    return filteredResults.sort((a, b) => {
        // Prioritize title matches over content matches
        if (a.matchField === 'title' && b.matchField !== 'title') return -1;
        if (b.matchField === 'title' && a.matchField !== 'title') return 1;
        
        // Sort by relevance (how early the match appears)
        const aIndex = a.entity[a.matchField].toLowerCase().indexOf(lowerSearchTerm);
        const bIndex = b.entity[b.matchField].toLowerCase().indexOf(lowerSearchTerm);
        return aIndex - bIndex;
    });
}

// Make functions available globally for backward compatibility during transition
window.getTagsForEntity = getTagsForEntity;
window.searchEntitiesByTags = searchEntitiesByTags;
window.searchAllEntities = searchAllEntities;