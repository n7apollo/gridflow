/**
 * GridFlow - IndexedDB Entity Service
 * Provides IndexedDB-based entity operations that mirror the localStorage entity-core system
 */

import { entityAdapter, boardAdapter, weeklyPlanAdapter, weeklyItemAdapter } from './adapters.js';
import { ENTITY_TYPES } from '../entity-core.js';
import featureFlags, { FLAGS } from '../feature-flags.js';

class EntityIndexedDBService {
  constructor() {
    this.isEnabled = false;
  }

  /**
   * Check if IndexedDB entity operations are enabled
   * @returns {boolean} Service status
   */
  isIndexedDBEnabled() {
    return featureFlags.isEnabled(FLAGS.INDEXEDDB_ENABLED) || 
           featureFlags.isEnabled(FLAGS.DUAL_WRITE);
  }

  /**
   * Save entity to IndexedDB
   * @param {Object} entity - Entity to save
   * @returns {Promise<Object>} Saved entity
   */
  async saveEntity(entity) {
    if (!this.isIndexedDBEnabled()) {
      return entity; // No-op if not enabled
    }

    try {
      // Ensure entity has required IndexedDB fields
      const indexedDBEntity = {
        ...entity,
        updatedAt: new Date().toISOString(),
        // Add IndexedDB-specific fields if needed
        version: 1
      };

      await entityAdapter.save(indexedDBEntity);
      console.log(`IndexedDB: Saved entity ${entity.id}`);
      return indexedDBEntity;
      
    } catch (error) {
      console.error(`IndexedDB: Failed to save entity ${entity.id}:`, error);
      throw error;
    }
  }

  /**
   * Get entity from IndexedDB
   * @param {string} entityId - Entity ID
   * @returns {Promise<Object|null>} Entity or null
   */
  async getEntity(entityId) {
    if (!this.isIndexedDBEnabled()) {
      return null;
    }

    try {
      const entity = await entityAdapter.getById(entityId);
      return entity || null;
    } catch (error) {
      console.error(`IndexedDB: Failed to get entity ${entityId}:`, error);
      return null;
    }
  }

  /**
   * Delete entity from IndexedDB
   * @param {string} entityId - Entity ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteEntity(entityId) {
    if (!this.isIndexedDBEnabled()) {
      return true; // No-op if not enabled
    }

    try {
      await entityAdapter.delete(entityId);
      console.log(`IndexedDB: Deleted entity ${entityId}`);
      return true;
    } catch (error) {
      console.error(`IndexedDB: Failed to delete entity ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Get all entities from IndexedDB
   * @returns {Promise<Array>} All entities
   */
  async getAllEntities() {
    if (!this.isIndexedDBEnabled()) {
      return [];
    }

    try {
      const entities = await entityAdapter.getAll();
      return entities;
    } catch (error) {
      console.error('IndexedDB: Failed to get all entities:', error);
      return [];
    }
  }

  /**
   * Get entities by type
   * @param {string} type - Entity type
   * @returns {Promise<Array>} Entities of specified type
   */
  async getEntitiesByType(type) {
    if (!this.isIndexedDBEnabled()) {
      return [];
    }

    try {
      const entities = await entityAdapter.getByType(type);
      return entities;
    } catch (error) {
      console.error(`IndexedDB: Failed to get entities by type ${type}:`, error);
      return [];
    }
  }

  /**
   * Get entities by board
   * @param {string} boardId - Board ID
   * @returns {Promise<Array>} Entities in specified board
   */
  async getEntitiesByBoard(boardId) {
    if (!this.isIndexedDBEnabled()) {
      return [];
    }

    try {
      const entities = await entityAdapter.getByBoard(boardId);
      return entities;
    } catch (error) {
      console.error(`IndexedDB: Failed to get entities by board ${boardId}:`, error);
      return [];
    }
  }

  /**
   * Search entities by text
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Matching entities
   */
  async searchEntities(searchTerm) {
    if (!this.isIndexedDBEnabled()) {
      return [];
    }

    try {
      const entities = await entityAdapter.search(searchTerm);
      return entities;
    } catch (error) {
      console.error(`IndexedDB: Failed to search entities:`, error);
      return [];
    }
  }

  /**
   * Save board to IndexedDB
   * @param {Object} board - Board to save
   * @returns {Promise<Object>} Saved board
   */
  async saveBoard(board) {
    if (!this.isIndexedDBEnabled()) {
      return board;
    }

    try {
      // Prepare board for IndexedDB (remove cards arrays since entities are stored separately)
      const indexedDBBoard = {
        ...board,
        updatedAt: new Date().toISOString(),
        // Remove cards from rows since they're stored as entity references
        rows: board.rows ? board.rows.map(row => ({
          ...row,
          cards: undefined // Don't store card arrays in IndexedDB
        })) : []
      };

      await boardAdapter.save(indexedDBBoard);
      console.log(`IndexedDB: Saved board ${board.id}`);
      return indexedDBBoard;
      
    } catch (error) {
      console.error(`IndexedDB: Failed to save board ${board.id}:`, error);
      throw error;
    }
  }

  /**
   * Get board from IndexedDB
   * @param {string} boardId - Board ID
   * @returns {Promise<Object|null>} Board or null
   */
  async getBoard(boardId) {
    if (!this.isIndexedDBEnabled()) {
      return null;
    }

    try {
      const board = await boardAdapter.getById(boardId);
      return board || null;
    } catch (error) {
      console.error(`IndexedDB: Failed to get board ${boardId}:`, error);
      return null;
    }
  }

  /**
   * Delete board from IndexedDB
   * @param {string} boardId - Board ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteBoard(boardId) {
    if (!this.isIndexedDBEnabled()) {
      return true;
    }

    try {
      await boardAdapter.delete(boardId);
      console.log(`IndexedDB: Deleted board ${boardId}`);
      return true;
    } catch (error) {
      console.error(`IndexedDB: Failed to delete board ${boardId}:`, error);
      throw error;
    }
  }

  /**
   * Get all boards from IndexedDB
   * @returns {Promise<Array>} All boards
   */
  async getAllBoards() {
    if (!this.isIndexedDBEnabled()) {
      return [];
    }

    try {
      const boards = await boardAdapter.getAll();
      return boards;
    } catch (error) {
      console.error('IndexedDB: Failed to get all boards:', error);
      return [];
    }
  }

  /**
   * Save weekly plan to IndexedDB
   * @param {Object} weeklyPlan - Weekly plan to save
   * @returns {Promise<Object>} Saved weekly plan
   */
  async saveWeeklyPlan(weeklyPlan) {
    if (!this.isIndexedDBEnabled()) {
      return weeklyPlan;
    }

    try {
      const indexedDBPlan = {
        ...weeklyPlan,
        updatedAt: new Date().toISOString()
      };

      await weeklyPlanAdapter.save(indexedDBPlan);
      console.log(`IndexedDB: Saved weekly plan ${weeklyPlan.weekKey}`);
      return indexedDBPlan;
      
    } catch (error) {
      console.error(`IndexedDB: Failed to save weekly plan ${weeklyPlan.weekKey}:`, error);
      throw error;
    }
  }

  /**
   * Get weekly plan by week key
   * @param {string} weekKey - Week key  
   * @returns {Promise<Object|null>} Weekly plan or null
   */
  async getWeeklyPlan(weekKey) {
    if (!this.isIndexedDBEnabled()) {
      return null;
    }

    try {
      const plan = await weeklyPlanAdapter.getById(weekKey);
      return plan;
    } catch (error) {
      console.error(`IndexedDB: Failed to get weekly plan ${weekKey}:`, error);
      throw error;
    }
  }

  /**
   * Get all weekly plans
   * @returns {Promise<Object[]>} Array of weekly plans
   */
  async getAllWeeklyPlans() {
    if (!this.isIndexedDBEnabled()) {
      return [];
    }

    try {
      const plans = await weeklyPlanAdapter.getAll();
      return plans;
    } catch (error) {
      console.error('IndexedDB: Failed to get all weekly plans:', error);
      throw error;
    }
  }

  /**
   * Get weekly items for a week
   * @param {string} weekKey - Week key
   * @returns {Promise<Object[]>} Array of weekly items
   */
  async getWeeklyItems(weekKey) {
    if (!this.isIndexedDBEnabled()) {
      return [];
    }

    try {
      const items = await weeklyItemAdapter.getByWeek(weekKey);
      return items;
    } catch (error) {
      console.error(`IndexedDB: Failed to get weekly items for ${weekKey}:`, error);
      throw error;
    }
  }

  /**
   * Add entity to weekly plan
   * @param {string} weekKey - Week key
   * @param {string} entityId - Entity ID
   * @param {string} day - Day of week
   * @returns {Promise<Object>} Created weekly item
   */
  async addEntityToWeeklyPlan(weekKey, entityId, day) {
    if (!this.isIndexedDBEnabled()) {
      return null;
    }

    try {
      const weeklyItem = {
        id: `weekly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        weekKey,
        entityId,
        day,
        addedAt: new Date().toISOString()
      };

      await weeklyItemAdapter.save(weeklyItem);
      console.log(`IndexedDB: Added entity ${entityId} to weekly plan ${weekKey}`);
      return weeklyItem;
      
    } catch (error) {
      console.error(`IndexedDB: Failed to add entity to weekly plan:`, error);
      throw error;
    }
  }

  /**
   * Get statistics about IndexedDB data
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics() {
    if (!this.isIndexedDBEnabled()) {
      return {
        enabled: false,
        entities: 0,
        boards: 0,
        tasks: 0,
        notes: 0,
        checklists: 0,
        projects: 0
      };
    }

    try {
      const [
        allEntities,
        allBoards,
        tasks,
        notes,
        checklists,
        projects
      ] = await Promise.all([
        this.getAllEntities(),
        this.getAllBoards(),
        this.getEntitiesByType(ENTITY_TYPES.TASK),
        this.getEntitiesByType(ENTITY_TYPES.NOTE),
        this.getEntitiesByType(ENTITY_TYPES.CHECKLIST),
        this.getEntitiesByType(ENTITY_TYPES.PROJECT)
      ]);

      return {
        enabled: true,
        entities: allEntities.length,
        boards: allBoards.length,
        tasks: tasks.length,
        notes: notes.length,
        checklists: checklists.length,
        projects: projects.length
      };
      
    } catch (error) {
      console.error('IndexedDB: Failed to get statistics:', error);
      return {
        enabled: true,
        error: error.message,
        entities: 0,
        boards: 0,
        tasks: 0,
        notes: 0,
        checklists: 0,
        projects: 0
      };
    }
  }
}

// Create singleton instance
const entityIndexedDBService = new EntityIndexedDBService();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.entityIndexedDBService = entityIndexedDBService;
}

export default entityIndexedDBService;