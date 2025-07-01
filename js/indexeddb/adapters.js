/**
 * GridFlow - IndexedDB Data Adapters
 * Provides high-level data access methods for different entity types
 */

import { BaseAdapter } from './base-adapter.js';

// Re-export BaseAdapter for compatibility
export { BaseAdapter };

/**
 * Entity adapter with type-specific methods
 */
export class EntityAdapter extends BaseAdapter {
  constructor() {
    super('entities');
  }

  /**
   * Get entities by type
   * @param {string} type - Entity type
   * @returns {Promise<Array>} Entities of specified type
   */
  async getByType(type) {
    return this.getByIndex('type', type);
  }

  /**
   * Get entities by board
   * @param {string} boardId - Board ID
   * @returns {Promise<Array>} Entities in specified board
   */
  async getByBoard(boardId) {
    return this.getByIndex('boardId', boardId);
  }

  /**
   * Get completed entities
   * @param {boolean} completed - Completion status
   * @returns {Promise<Array>} Entities with specified completion status
   */
  async getByCompletion(completed) {
    return this.getByIndex('completed', completed);
  }

  /**
   * Get entities by priority
   * @param {string} priority - Priority level
   * @returns {Promise<Array>} Entities with specified priority
   */
  async getByPriority(priority) {
    return this.getByIndex('priority', priority);
  }

  /**
   * Get entities by tag
   * @param {string} tag - Tag name
   * @returns {Promise<Array>} Entities with specified tag
   */
  async getByTag(tag) {
    return this.getByIndex('tags', tag);
  }

  /**
   * Search entities by text
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Matching entities
   */
  async search(searchTerm) {
    const allEntities = await this.getAll();
    const term = searchTerm.toLowerCase();
    
    return allEntities.filter(entity => 
      (entity.title && entity.title.toLowerCase().includes(term)) ||
      (entity.content && entity.content.toLowerCase().includes(term))
    );
  }
}

/**
 * Board adapter
 */
export class BoardAdapter extends BaseAdapter {
  constructor() {
    super('boards');
  }
}

/**
 * Weekly plans adapter
 */
export class WeeklyPlanAdapter extends BaseAdapter {
  constructor() {
    super('weeklyPlans');
  }

  /**
   * Get current week plan
   * @returns {Promise<Object|null>} Current week plan
   */
  async getCurrentWeek() {
    const now = new Date();
    const year = now.getFullYear();
    const weekNumber = this.getWeekNumber(now);
    const weekKey = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
    
    return this.getById(weekKey);
  }

  /**
   * Get week number for a date
   * @param {Date} date - Date to get week number for
   * @returns {number} Week number
   */
  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }
}

/**
 * Weekly items adapter
 */
export class WeeklyItemAdapter extends BaseAdapter {
  constructor() {
    super('weeklyItems');
  }

  /**
   * Get items for a specific week
   * @param {string} weekKey - Week key
   * @returns {Promise<Array>} Weekly items
   */
  async getByWeek(weekKey) {
    return this.getByIndex('weekKey', weekKey);
  }

  /**
   * Get items by entity
   * @param {string} entityId - Entity ID
   * @returns {Promise<Array>} Weekly items for entity
   */
  async getByEntity(entityId) {
    return this.getByIndex('entityId', entityId);
  }
}

/**
 * People adapter
 */
export class PeopleAdapter extends BaseAdapter {
  constructor() {
    super('people');
  }

  /**
   * Search people by name
   * @param {string} searchTerm - Name search term
   * @returns {Promise<Array>} Matching people
   */
  async searchByName(searchTerm) {
    const allPeople = await this.getAll();
    const term = searchTerm.toLowerCase();
    
    return allPeople.filter(person =>
      person.name && person.name.toLowerCase().includes(term)
    );
  }

  /**
   * Get people by relationship type
   * @param {string} relationshipType - Type of relationship
   * @returns {Promise<Array>} People with specified relationship
   */
  async getByRelationshipType(relationshipType) {
    return this.getByIndex('relationshipType', relationshipType);
  }

  /**
   * Get people needing follow-up
   * @param {Date} cutoffDate - Date cutoff for last interaction
   * @returns {Promise<Array>} People needing follow-up
   */
  async getPeopleNeedingFollowUp(cutoffDate) {
    const allPeople = await this.getAll();
    return allPeople.filter(person => 
      new Date(person.lastInteraction) < cutoffDate
    );
  }
}

/**
 * Relationship adapter for entity-person relationships
 */
export class RelationshipAdapter extends BaseAdapter {
  constructor() {
    super('entityRelationships');
  }

  /**
   * Get relationships by entity ID
   * @param {string} entityId - Entity ID
   * @returns {Promise<Array>} Relationships for entity
   */
  async getByEntity(entityId) {
    return this.getByIndex('entityId', entityId);
  }

  /**
   * Get relationships by related ID (person ID)
   * @param {string} relatedId - Related entity/person ID
   * @returns {Promise<Array>} Relationships for person
   */
  async getByRelated(relatedId) {
    return this.getByIndex('relatedId', relatedId);
  }

  /**
   * Get relationships by type
   * @param {string} relationshipType - Relationship type
   * @returns {Promise<Array>} Relationships of specified type
   */
  async getByType(relationshipType) {
    return this.getByIndex('relationshipType', relationshipType);
  }

  /**
   * Create relationship between entity and person
   * @param {string} entityId - Entity ID
   * @param {string} personId - Person ID
   * @param {string} relationshipType - Type of relationship (mentions, assigned, collaborates)
   * @param {string} context - Optional context
   * @returns {Promise<Object>} Created relationship
   */
  async createRelationship(entityId, personId, relationshipType = 'mentions', context = '') {
    const relationship = {
      id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entityId,
      relatedId: personId,
      relationshipType,
      context,
      createdAt: new Date().toISOString()
    };

    await this.save(relationship);
    return relationship;
  }

  /**
   * Remove relationship between entity and person
   * @param {string} entityId - Entity ID
   * @param {string} personId - Person ID
   * @returns {Promise<boolean>} Success status
   */
  async removeRelationship(entityId, personId) {
    const relationships = await this.getByEntity(entityId);
    const toRemove = relationships.filter(rel => rel.relatedId === personId);
    
    for (const rel of toRemove) {
      await this.delete(rel.id);
    }
    
    return toRemove.length > 0;
  }
}

/**
 * Import specialized adapters
 */
import appMetadataAdapter, { AppMetadataAdapter } from './adapters/app-metadata-adapter.js';
import templateAdapter, { TemplateAdapter } from './adapters/template-adapter.js';
import templateLibraryAdapter, { TemplateLibraryAdapter } from './adapters/template-library-adapter.js';
import settingsAdapter, { SettingsAdapter } from './adapters/settings-adapter.js';
import collectionsAdapter, { CollectionsAdapter } from './adapters/collections-adapter.js';
import tagsAdapter, { TagsAdapter } from './adapters/tags-adapter.js';
import entityPositionsAdapter, { EntityPositionsAdapter } from './adapters/entity-positions-adapter.js';

/**
 * Create adapter instances
 */
export const entityAdapter = new EntityAdapter();
export const boardAdapter = new BoardAdapter();
export const weeklyPlanAdapter = new WeeklyPlanAdapter();
export const weeklyItemAdapter = new WeeklyItemAdapter();
export const peopleAdapter = new PeopleAdapter();
export const relationshipAdapter = new RelationshipAdapter();
export { appMetadataAdapter, AppMetadataAdapter, templateAdapter, TemplateAdapter, templateLibraryAdapter, TemplateLibraryAdapter, settingsAdapter, SettingsAdapter, collectionsAdapter, CollectionsAdapter, tagsAdapter, TagsAdapter, entityPositionsAdapter, EntityPositionsAdapter };

// Make adapters available globally for debugging
if (typeof window !== 'undefined') {
  window.adapters = {
    entity: entityAdapter,
    board: boardAdapter,
    weeklyPlan: weeklyPlanAdapter,
    weeklyItem: weeklyItemAdapter,
    people: peopleAdapter,
    relationship: relationshipAdapter,
    appMetadata: appMetadataAdapter,
    template: templateAdapter,
    templateLibrary: templateLibraryAdapter,
    settings: settingsAdapter,
    collections: collectionsAdapter,
    tags: tagsAdapter,
    entityPositions: entityPositionsAdapter
  };
}