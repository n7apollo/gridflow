/**
 * GridFlow - IndexedDB-First Entity Core
 * Phase 2.2: Entity operations with IndexedDB as primary storage and localStorage fallback
 * This module can be swapped in to replace entity-core.js for IndexedDB-first operations
 */

import * as originalEntityCore from '../entity-core.js';
import entityIndexedDBService from './entity-indexeddb-service.js';
import featureFlags, { FLAGS } from '../feature-flags.js';
import { getAppData, setAppData, saveData } from '../core-data.js';
import { safeShowStatusMessage } from './safe-utilities.js';

// Re-export constants
export const ENTITY_TYPES = originalEntityCore.ENTITY_TYPES;
export const CONTEXT_TYPES = originalEntityCore.CONTEXT_TYPES;

// Performance monitoring
let performanceStats = {
  indexedDBReads: 0,
  localStorageReads: 0,
  indexedDBWrites: 0,
  localStorageWrites: 0,
  indexedDBErrors: 0,
  readTimings: [],
  writeTimings: []
};

/**
 * Get performance statistics
 * @returns {Object} Performance stats
 */
export function getPerformanceStats() {
  return {
    ...performanceStats,
    averageReadTime: performanceStats.readTimings.length > 0 
      ? performanceStats.readTimings.reduce((a, b) => a + b, 0) / performanceStats.readTimings.length 
      : 0,
    totalOperations: performanceStats.indexedDBReads + performanceStats.localStorageReads + 
                    performanceStats.indexedDBWrites + performanceStats.localStorageWrites,
    indexedDBSuccessRate: performanceStats.indexedDBReads + performanceStats.indexedDBWrites > 0
      ? ((performanceStats.indexedDBReads + performanceStats.indexedDBWrites - performanceStats.indexedDBErrors) / 
         (performanceStats.indexedDBReads + performanceStats.indexedDBWrites)) * 100
      : 0
  };
}

/**
 * Reset performance statistics
 */
export function resetPerformanceStats() {
  performanceStats = {
    indexedDBReads: 0,
    localStorageReads: 0,
    indexedDBWrites: 0,
    localStorageWrites: 0,
    indexedDBErrors: 0,
    readTimings: [],
    writeTimings: []
  };
}

/**
 * Create entity with IndexedDB-first approach
 * @param {string} type - Entity type
 * @param {Object} data - Entity data
 * @returns {Object} Created entity
 */
export function createEntity(type, data) {
  const startTime = performance.now();
  
  try {
    // Always create in localStorage first for immediate availability
    const entity = originalEntityCore.createEntity(type, data);
    performanceStats.localStorageWrites++;
    
    // If IndexedDB is enabled, also save there
    if (featureFlags.isEnabled(FLAGS.INDEXEDDB_ENABLED)) {
      entityIndexedDBService.saveEntity(entity).then(() => {
        performanceStats.indexedDBWrites++;
        const endTime = performance.now();
        performanceStats.writeTimings.push(endTime - startTime);
      }).catch(error => {
        performanceStats.indexedDBErrors++;
        console.error('Failed to save entity to IndexedDB:', error);
      });
    }
    
    return entity;
    
  } catch (error) {
    console.error('Failed to create entity:', error);
    throw error;
  }
}

/**
 * Get entity with IndexedDB-first approach
 * @param {string} entityId - Entity ID
 * @returns {Promise<Object|null>} Entity or null
 */
export async function getEntity(entityId) {
  const startTime = performance.now();
  
  // If IndexedDB is enabled, try it first
  if (featureFlags.isEnabled(FLAGS.INDEXEDDB_ENABLED)) {
    try {
      const entity = await entityIndexedDBService.getEntity(entityId);
      if (entity) {
        performanceStats.indexedDBReads++;
        const endTime = performance.now();
        performanceStats.readTimings.push(endTime - startTime);
        return entity;
      }
    } catch (error) {
      performanceStats.indexedDBErrors++;
      console.warn('IndexedDB read failed, falling back to localStorage:', error);
    }
  }
  
  // Fallback to localStorage
  const entity = originalEntityCore.getEntity(entityId);
  performanceStats.localStorageReads++;
  return entity;
}

/**
 * Synchronous get entity (for backward compatibility)
 * @param {string} entityId - Entity ID
 * @returns {Object|null} Entity or null
 */
export function getEntitySync(entityId) {
  // For synchronous calls, use localStorage only
  performanceStats.localStorageReads++;
  return originalEntityCore.getEntity(entityId);
}

/**
 * Update entity with dual-write
 * @param {string} entityId - Entity ID
 * @param {Object} updates - Updates to apply
 * @returns {Object} Updated entity
 */
export function updateEntity(entityId, updates) {
  const startTime = performance.now();
  
  try {
    // Update in localStorage first
    const entity = originalEntityCore.updateEntity(entityId, updates);
    performanceStats.localStorageWrites++;
    
    // If IndexedDB is enabled, also update there
    if (featureFlags.isEnabled(FLAGS.INDEXEDDB_ENABLED)) {
      entityIndexedDBService.saveEntity(entity).then(() => {
        performanceStats.indexedDBWrites++;
        const endTime = performance.now();
        performanceStats.writeTimings.push(endTime - startTime);
      }).catch(error => {
        performanceStats.indexedDBErrors++;
        console.error('Failed to update entity in IndexedDB:', error);
      });
    }
    
    return entity;
    
  } catch (error) {
    console.error('Failed to update entity:', error);
    throw error;
  }
}

/**
 * Delete entity with dual-delete
 * @param {string} entityId - Entity ID
 * @returns {boolean} Success status
 */
export function deleteEntity(entityId) {
  try {
    // Delete from localStorage first
    const success = originalEntityCore.deleteEntity(entityId);
    performanceStats.localStorageWrites++;
    
    // If IndexedDB is enabled, also delete there
    if (featureFlags.isEnabled(FLAGS.INDEXEDDB_ENABLED)) {
      entityIndexedDBService.deleteEntity(entityId).then(() => {
        performanceStats.indexedDBWrites++;
      }).catch(error => {
        performanceStats.indexedDBErrors++;
        console.error('Failed to delete entity from IndexedDB:', error);
      });
    }
    
    return success;
    
  } catch (error) {
    console.error('Failed to delete entity:', error);
    throw error;
  }
}

/**
 * Toggle entity completion with dual-write
 * @param {string} entityId - Entity ID
 * @returns {Object} Updated entity
 */
export function toggleEntityCompletion(entityId) {
  return updateEntity(entityId, { 
    completed: !getEntitySync(entityId)?.completed,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Get all entities from IndexedDB first, fallback to localStorage
 * @returns {Promise<Array>} Array of entities
 */
export async function getAllEntities() {
  if (featureFlags.isEnabled(FLAGS.INDEXEDDB_ENABLED)) {
    try {
      const entities = await entityIndexedDBService.getAllEntities();
      performanceStats.indexedDBReads++;
      return entities;
    } catch (error) {
      performanceStats.indexedDBErrors++;
      console.warn('IndexedDB getAllEntities failed, falling back to localStorage:', error);
    }
  }
  
  // Fallback to localStorage
  const appData = getAppData();
  performanceStats.localStorageReads++;
  return Object.values(appData.entities || {});
}

/**
 * Get entities by type with IndexedDB-first approach
 * @param {string} type - Entity type
 * @returns {Promise<Array>} Array of entities
 */
export async function getEntitiesByType(type) {
  if (featureFlags.isEnabled(FLAGS.INDEXEDDB_ENABLED)) {
    try {
      const entities = await entityIndexedDBService.getEntitiesByType(type);
      performanceStats.indexedDBReads++;
      return entities;
    } catch (error) {
      performanceStats.indexedDBErrors++;
      console.warn('IndexedDB getEntitiesByType failed, falling back to localStorage:', error);
    }
  }
  
  // Fallback to localStorage
  const allEntities = await getAllEntities();
  return allEntities.filter(entity => entity.type === type);
}

/**
 * Search entities with IndexedDB-first approach
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Array of matching entities
 */
export async function searchEntities(searchTerm) {
  if (featureFlags.isEnabled(FLAGS.INDEXEDDB_ENABLED)) {
    try {
      const entities = await entityIndexedDBService.searchEntities(searchTerm);
      performanceStats.indexedDBReads++;
      return entities;
    } catch (error) {
      performanceStats.indexedDBErrors++;
      console.warn('IndexedDB search failed, falling back to localStorage:', error);
    }
  }
  
  // Fallback to localStorage search
  const allEntities = await getAllEntities();
  const term = searchTerm.toLowerCase();
  return allEntities.filter(entity => 
    entity.title?.toLowerCase().includes(term) ||
    entity.content?.toLowerCase().includes(term)
  );
}

/**
 * Validate data consistency between storage systems
 * @returns {Promise<Object>} Validation results
 */
export async function validateDataConsistency() {
  if (!featureFlags.isEnabled(FLAGS.INDEXEDDB_ENABLED)) {
    return {
      enabled: false,
      message: 'IndexedDB not enabled'
    };
  }
  
  try {
    // Get entities from both sources
    const indexedDBEntities = await entityIndexedDBService.getAllEntities();
    const appData = getAppData();
    const localStorageEntities = Object.values(appData.entities || {});
    
    // Compare counts and IDs
    const indexedDBIds = new Set(indexedDBEntities.map(e => e.id));
    const localStorageIds = new Set(localStorageEntities.map(e => e.id));
    
    const onlyInIndexedDB = [...indexedDBIds].filter(id => !localStorageIds.has(id));
    const onlyInLocalStorage = [...localStorageIds].filter(id => !indexedDBIds.has(id));
    
    return {
      enabled: true,
      indexedDBCount: indexedDBEntities.length,
      localStorageCount: localStorageEntities.length,
      consistent: onlyInIndexedDB.length === 0 && onlyInLocalStorage.length === 0,
      onlyInIndexedDB,
      onlyInLocalStorage,
      performance: getPerformanceStats()
    };
    
  } catch (error) {
    return {
      enabled: true,
      error: error.message,
      consistent: false
    };
  }
}

/**
 * Sync missing entities from localStorage to IndexedDB
 * @returns {Promise<Object>} Sync results
 */
export async function syncToIndexedDB() {
  if (!featureFlags.isEnabled(FLAGS.INDEXEDDB_ENABLED)) {
    throw new Error('IndexedDB not enabled');
  }
  
  const validation = await validateDataConsistency();
  if (validation.consistent) {
    return { synced: 0, message: 'Already consistent' };
  }
  
  let syncedCount = 0;
  const appData = getAppData();
  
  // Sync entities that are only in localStorage
  for (const entityId of validation.onlyInLocalStorage) {
    const entity = appData.entities[entityId];
    if (entity) {
      try {
        await entityIndexedDBService.saveEntity(entity);
        syncedCount++;
      } catch (error) {
        console.error(`Failed to sync entity ${entityId}:`, error);
      }
    }
  }
  
  return { synced: syncedCount, total: validation.onlyInLocalStorage.length };
}

// Re-export all other original functions
export const addEntityToContext = originalEntityCore.addEntityToContext;
export const removeEntityFromContext = originalEntityCore.removeEntityFromContext;
export const getEntitiesInContext = originalEntityCore.getEntitiesInContext;
export const moveEntityBetweenContexts = originalEntityCore.moveEntityBetweenContexts;
export const getEntityTypeIcon = originalEntityCore.getEntityTypeIcon;
export const validateEntityData = originalEntityCore.validateEntityData;
export const getTypeSpecificValidation = originalEntityCore.getTypeSpecificValidation;

// Export backward compatibility getEntity (sync version)
// This maintains compatibility with existing code that expects synchronous behavior
const originalGetEntity = originalEntityCore.getEntity;
export { originalGetEntity as getEntityLegacy };

// Make enhanced functions available globally
if (typeof window !== 'undefined') {
  window.indexedDBFirstEntityCore = {
    createEntity,
    getEntity: getEntitySync, // Use sync version for backward compatibility
    getEntityAsync: getEntity, // Async version available separately
    updateEntity,
    deleteEntity,
    toggleEntityCompletion,
    getAllEntities,
    getEntitiesByType,
    searchEntities,
    validateDataConsistency,
    syncToIndexedDB,
    getPerformanceStats,
    resetPerformanceStats,
    ENTITY_TYPES,
    CONTEXT_TYPES
  };
}