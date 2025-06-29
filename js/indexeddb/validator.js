/**
 * GridFlow - Data Validation Service
 * Validates data consistency between localStorage and IndexedDB
 */

import { entityAdapter, boardAdapter } from './adapters.js';
import { getAppData } from '../core-data.js';
import { showStatusMessage } from '../utilities.js';

class DataValidator {
  constructor() {
    this.validationResults = [];
    this.lastValidation = null;
  }

  /**
   * Validate data consistency between storage systems
   * @returns {Promise<Object>} Validation results
   */
  async validateConsistency() {
    console.log('Starting data consistency validation...');
    const startTime = performance.now();
    
    const results = {
      timestamp: new Date().toISOString(),
      entities: await this.validateEntities(),
      boards: await this.validateBoards(),
      // weeklyPlans: await this.validateWeeklyPlans(),
      // Add more validation as needed
    };

    results.duration = performance.now() - startTime;
    results.overallValid = this.isOverallValid(results);
    
    this.validationResults.push(results);
    this.lastValidation = results;
    
    console.log(`Validation completed in ${results.duration.toFixed(2)}ms`);
    console.log('Validation results:', results);
    
    return results;
  }

  /**
   * Validate entity consistency
   * @returns {Promise<Object>} Entity validation results
   */
  async validateEntities() {
    try {
      // Get entities from both storage systems
      const legacyData = getAppData();
      const legacyEntities = legacyData.entities || {};
      const indexedDBEntities = await entityAdapter.getAll();

      // Convert IndexedDB array to object for comparison
      const indexedDBEntitiesObj = {};
      indexedDBEntities.forEach(entity => {
        indexedDBEntitiesObj[entity.id] = entity;
      });

      return this.compareEntitySets(legacyEntities, indexedDBEntitiesObj);
      
    } catch (error) {
      console.error('Entity validation failed:', error);
      return {
        valid: false,
        error: error.message,
        legacyCount: 0,
        indexedDBCount: 0,
        matching: 0,
        missing: [],
        extra: [],
        different: []
      };
    }
  }

  /**
   * Validate board consistency
   * @returns {Promise<Object>} Board validation results
   */
  async validateBoards() {
    try {
      const legacyData = getAppData();
      const legacyBoards = legacyData.boards || {};
      const indexedDBBoards = await boardAdapter.getAll();

      // Convert IndexedDB array to object for comparison
      const indexedDBBoardsObj = {};
      indexedDBBoards.forEach(board => {
        indexedDBBoardsObj[board.id] = board;
      });

      return this.compareBoardSets(legacyBoards, indexedDBBoardsObj);
      
    } catch (error) {
      console.error('Board validation failed:', error);
      return {
        valid: false,
        error: error.message,
        legacyCount: 0,
        indexedDBCount: 0,
        matching: 0,
        missing: [],
        extra: [],
        different: []
      };
    }
  }

  /**
   * Compare two sets of entities
   * @param {Object} legacyEntities - Legacy entities object
   * @param {Object} indexedDBEntities - IndexedDB entities object
   * @returns {Object} Comparison results
   */
  compareEntitySets(legacyEntities, indexedDBEntities) {
    const legacyIds = new Set(Object.keys(legacyEntities));
    const indexedDBIds = new Set(Object.keys(indexedDBEntities));
    
    const missing = []; // In legacy but not in IndexedDB
    const extra = []; // In IndexedDB but not in legacy
    const different = []; // In both but different content
    const matching = []; // In both and identical

    // Check for missing entities (in legacy but not IndexedDB)
    for (const id of legacyIds) {
      if (!indexedDBIds.has(id)) {
        missing.push({
          id,
          entity: legacyEntities[id]
        });
      }
    }

    // Check for extra entities (in IndexedDB but not legacy)
    for (const id of indexedDBIds) {
      if (!legacyIds.has(id)) {
        extra.push({
          id,
          entity: indexedDBEntities[id]
        });
      }
    }

    // Check for differences in common entities
    for (const id of legacyIds) {
      if (indexedDBIds.has(id)) {
        const legacyEntity = legacyEntities[id];
        const indexedDBEntity = indexedDBEntities[id];
        
        if (this.areEntitiesEqual(legacyEntity, indexedDBEntity)) {
          matching.push(id);
        } else {
          different.push({
            id,
            legacy: legacyEntity,
            indexedDB: indexedDBEntity,
            differences: this.findEntityDifferences(legacyEntity, indexedDBEntity)
          });
        }
      }
    }

    return {
      valid: missing.length === 0 && extra.length === 0 && different.length === 0,
      legacyCount: legacyIds.size,
      indexedDBCount: indexedDBIds.size,
      matching: matching.length,
      missing: missing,
      extra: extra,
      different: different
    };
  }

  /**
   * Compare two sets of boards
   * @param {Object} legacyBoards - Legacy boards object
   * @param {Object} indexedDBBoards - IndexedDB boards object
   * @returns {Object} Comparison results
   */
  compareBoardSets(legacyBoards, indexedDBBoards) {
    // Similar logic to compareEntitySets but for boards
    const legacyIds = new Set(Object.keys(legacyBoards));
    const indexedDBIds = new Set(Object.keys(indexedDBBoards));
    
    const missing = [];
    const extra = [];
    const different = [];
    const matching = [];

    for (const id of legacyIds) {
      if (!indexedDBIds.has(id)) {
        missing.push({ id, board: legacyBoards[id] });
      }
    }

    for (const id of indexedDBIds) {
      if (!legacyIds.has(id)) {
        extra.push({ id, board: indexedDBBoards[id] });
      }
    }

    for (const id of legacyIds) {
      if (indexedDBIds.has(id)) {
        const legacyBoard = legacyBoards[id];
        const indexedDBBoard = indexedDBBoards[id];
        
        if (this.areBoardsEqual(legacyBoard, indexedDBBoard)) {
          matching.push(id);
        } else {
          different.push({
            id,
            legacy: legacyBoard,
            indexedDB: indexedDBBoard,
            differences: this.findBoardDifferences(legacyBoard, indexedDBBoard)
          });
        }
      }
    }

    return {
      valid: missing.length === 0 && extra.length === 0 && different.length === 0,
      legacyCount: legacyIds.size,
      indexedDBCount: indexedDBIds.size,
      matching: matching.length,
      missing: missing,
      extra: extra,
      different: different
    };
  }

  /**
   * Check if two entities are equal
   * @param {Object} entity1 - First entity
   * @param {Object} entity2 - Second entity
   * @returns {boolean} Equality status
   */
  areEntitiesEqual(entity1, entity2) {
    if (!entity1 || !entity2) return false;
    
    // Compare essential fields
    const fields = ['id', 'type', 'title', 'content', 'completed', 'priority', 'dueDate'];
    
    for (const field of fields) {
      if (entity1[field] !== entity2[field]) {
        return false;
      }
    }

    // Compare arrays (tags, etc.)
    if (!this.arraysEqual(entity1.tags || [], entity2.tags || [])) {
      return false;
    }

    return true;
  }

  /**
   * Check if two boards are equal
   * @param {Object} board1 - First board
   * @param {Object} board2 - Second board
   * @returns {boolean} Equality status
   */
  areBoardsEqual(board1, board2) {
    if (!board1 || !board2) return false;
    
    const fields = ['id', 'name'];
    
    for (const field of fields) {
      if (board1[field] !== board2[field]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Find differences between two entities
   * @param {Object} entity1 - First entity
   * @param {Object} entity2 - Second entity
   * @returns {Array} List of differences
   */
  findEntityDifferences(entity1, entity2) {
    const differences = [];
    const fields = ['id', 'type', 'title', 'content', 'completed', 'priority', 'dueDate'];
    
    for (const field of fields) {
      if (entity1[field] !== entity2[field]) {
        differences.push({
          field,
          legacy: entity1[field],
          indexedDB: entity2[field]
        });
      }
    }

    if (!this.arraysEqual(entity1.tags || [], entity2.tags || [])) {
      differences.push({
        field: 'tags',
        legacy: entity1.tags || [],
        indexedDB: entity2.tags || []
      });
    }

    return differences;
  }

  /**
   * Find differences between two boards
   * @param {Object} board1 - First board
   * @param {Object} board2 - Second board
   * @returns {Array} List of differences
   */
  findBoardDifferences(board1, board2) {
    const differences = [];
    const fields = ['id', 'name'];
    
    for (const field of fields) {
      if (board1[field] !== board2[field]) {
        differences.push({
          field,
          legacy: board1[field],
          indexedDB: board2[field]
        });
      }
    }

    return differences;
  }

  /**
   * Check if two arrays are equal
   * @param {Array} arr1 - First array
   * @param {Array} arr2 - Second array
   * @returns {boolean} Equality status
   */
  arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();
    
    return sorted1.every((val, i) => val === sorted2[i]);
  }

  /**
   * Check if overall validation passed
   * @param {Object} results - Validation results
   * @returns {boolean} Overall validity
   */
  isOverallValid(results) {
    return results.entities.valid && results.boards.valid;
  }

  /**
   * Get validation summary
   * @returns {Object} Validation summary
   */
  getValidationSummary() {
    if (!this.lastValidation) {
      return { hasValidation: false };
    }

    const results = this.lastValidation;
    
    return {
      hasValidation: true,
      timestamp: results.timestamp,
      duration: results.duration,
      overallValid: results.overallValid,
      entities: {
        valid: results.entities.valid,
        legacyCount: results.entities.legacyCount,
        indexedDBCount: results.entities.indexedDBCount,
        issues: results.entities.missing.length + results.entities.extra.length + results.entities.different.length
      },
      boards: {
        valid: results.boards.valid,
        legacyCount: results.boards.legacyCount,
        indexedDBCount: results.boards.indexedDBCount,
        issues: results.boards.missing.length + results.boards.extra.length + results.boards.different.length
      }
    };
  }

  /**
   * Get detailed validation results
   * @returns {Object} Last validation results
   */
  getLastValidation() {
    return this.lastValidation;
  }

  /**
   * Clear validation history
   */
  clearHistory() {
    this.validationResults = [];
    this.lastValidation = null;
    console.log('Validation history cleared');
  }
}

// Create singleton instance
const dataValidator = new DataValidator();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.dataValidator = dataValidator;
}

export default dataValidator;