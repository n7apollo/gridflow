/**
 * GridFlow - Enhanced Entity Core with IndexedDB Integration
 * Extends the existing entity-core.js with dual-write capabilities
 */

import * as originalEntityCore from '../entity-core.js';
import dualWriteService from './dual-writer.js';
import entityIndexedDBService from './entity-indexeddb-service.js';
import featureFlags, { FLAGS } from '../feature-flags.js';

// Re-export all original constants and functions
export const ENTITY_TYPES = originalEntityCore.ENTITY_TYPES;
export const CONTEXT_TYPES = originalEntityCore.CONTEXT_TYPES;

/**
 * Enhanced create entity with dual-write support
 * @param {string} type - Entity type
 * @param {Object} data - Entity data
 * @returns {Object} Created entity
 */
export function createEntity(type, data) {
  // Create entity using original method (saves to localStorage)
  const entity = originalEntityCore.createEntity(type, data);
  
  // If dual-write is enabled, also save to IndexedDB
  if (featureFlags.isEnabled(FLAGS.DUAL_WRITE)) {
    // Don't await - let it run async to avoid blocking UI
    entityIndexedDBService.saveEntity(entity).catch(error => {
      console.error('Failed to save entity to IndexedDB:', error);
    });
  }
  
  return entity;
}

/**
 * Enhanced update entity with dual-write support
 * @param {string} entityId - Entity ID
 * @param {Object} updates - Updates to apply
 * @returns {Object} Updated entity
 */
export function updateEntity(entityId, updates) {
  // Update entity using original method
  const entity = originalEntityCore.updateEntity(entityId, updates);
  
  // If dual-write is enabled, also update in IndexedDB
  if (featureFlags.isEnabled(FLAGS.DUAL_WRITE)) {
    entityIndexedDBService.saveEntity(entity).catch(error => {
      console.error('Failed to update entity in IndexedDB:', error);
    });
  }
  
  return entity;
}

/**
 * Enhanced delete entity with dual-write support
 * @param {string} entityId - Entity ID
 * @returns {boolean} Success status
 */
export function deleteEntity(entityId) {
  // Delete from localStorage using original method
  const success = originalEntityCore.deleteEntity(entityId);
  
  // If dual-write is enabled, also delete from IndexedDB
  if (featureFlags.isEnabled(FLAGS.DUAL_WRITE)) {
    entityIndexedDBService.deleteEntity(entityId).catch(error => {
      console.error('Failed to delete entity from IndexedDB:', error);
    });
  }
  
  return success;
}

/**
 * Enhanced get entity that can fallback to IndexedDB
 * @param {string} entityId - Entity ID
 * @returns {Object|null} Entity or null
 */
export function getEntity(entityId) {
  // First try localStorage (original method)
  const entity = originalEntityCore.getEntity(entityId);
  
  if (entity) {
    return entity;
  }
  
  // If not found and IndexedDB is enabled, could try IndexedDB as fallback
  // For now, just return null to maintain consistent behavior
  return null;
}

/**
 * Enhanced toggle entity completion with dual-write support
 * @param {string} entityId - Entity ID
 * @returns {Object} Updated entity
 */
export function toggleEntityCompletion(entityId) {
  // Toggle using original method
  const entity = originalEntityCore.toggleEntityCompletion(entityId);
  
  // If dual-write is enabled, also update in IndexedDB
  if (featureFlags.isEnabled(FLAGS.DUAL_WRITE)) {
    entityIndexedDBService.saveEntity(entity).catch(error => {
      console.error('Failed to update entity completion in IndexedDB:', error);
    });
  }
  
  return entity;
}

/**
 * Get enhanced statistics that include IndexedDB data
 * @returns {Promise<Object>} Enhanced statistics
 */
export async function getEnhancedStatistics() {
  // Get localStorage stats using original methods
  const localStorageStats = {
    localStorage: {
      enabled: true,
      // Add localStorage-specific stats here if needed
    }
  };
  
  // Get IndexedDB stats
  const indexedDBStats = await entityIndexedDBService.getStatistics();
  
  return {
    ...localStorageStats,
    indexedDB: indexedDBStats,
    dualWrite: {
      enabled: featureFlags.isEnabled(FLAGS.DUAL_WRITE),
      indexedDBEnabled: featureFlags.isEnabled(FLAGS.INDEXEDDB_ENABLED)
    }
  };
}

/**
 * Validate data consistency between localStorage and IndexedDB
 * @returns {Promise<Object>} Validation results
 */
export async function validateEntityConsistency() {
  if (!featureFlags.isEnabled(FLAGS.INDEXEDDB_ENABLED)) {
    return {
      enabled: false,
      message: 'IndexedDB not enabled'
    };
  }
  
  try {
    // Get all entities from both sources
    const localStorageEntities = originalEntityCore.getAllEntitiesAsArray ? 
      originalEntityCore.getAllEntitiesAsArray() : [];
    const indexedDBEntities = await entityIndexedDBService.getAllEntities();
    
    // Compare counts
    const localCount = localStorageEntities.length;
    const indexedDBCount = indexedDBEntities.length;
    
    return {
      enabled: true,
      localStorageCount: localCount,
      indexedDBCount: indexedDBCount,
      consistent: localCount === indexedDBCount,
      difference: Math.abs(localCount - indexedDBCount)
    };
    
  } catch (error) {
    return {
      enabled: true,
      error: error.message,
      consistent: false
    };
  }
}

// Re-export all other original functions
export const addEntityToContext = originalEntityCore.addEntityToContext;
export const removeEntityFromContext = originalEntityCore.removeEntityFromContext;
export const getEntitiesInContext = originalEntityCore.getEntitiesInContext;
export const moveEntityBetweenContexts = originalEntityCore.moveEntityBetweenContexts;
export const getEntityTypeIcon = originalEntityCore.getEntityTypeIcon;
export const validateEntityData = originalEntityCore.validateEntityData;
export const getTypeSpecificValidation = originalEntityCore.getTypeSpecificValidation;

// Make enhanced functions available globally
if (typeof window !== 'undefined') {
  window.enhancedEntityCore = {
    createEntity,
    updateEntity,
    deleteEntity,
    getEntity,
    toggleEntityCompletion,
    getEnhancedStatistics,
    validateEntityConsistency,
    ENTITY_TYPES,
    CONTEXT_TYPES
  };
}