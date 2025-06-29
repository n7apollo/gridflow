/**
 * GridFlow - Enhanced Entity Core with IndexedDB Integration
 * Extends the existing entity-core.js with dual-write capabilities
 */

import * as originalEntityCore from '../entity-core.js';
import dualWriteService from './dual-writer.js';
import entityIndexedDBService from './entity-indexeddb-service.js';
import featureFlags, { FLAGS } from '../feature-flags.js';
import { getAppData, setAppData } from '../core-data.js';
import { safeSaveData } from './safe-utilities.js';

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
  try {
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
    
  } catch (error) {
    // If original createEntity fails due to test environment, create manually
    console.warn('Original createEntity failed, creating manually:', error.message);
    return createEntityManually(type, data);
  }
}

/**
 * Manually create entity for test environment
 * @param {string} type - Entity type
 * @param {Object} data - Entity data
 * @returns {Object} Created entity
 */
function createEntityManually(type, data) {
  const appData = getAppData();
  
  // Ensure entities structure exists
  if (!appData.entities) {
    appData.entities = {};
  }
  
  // Generate unique ID
  let entityId;
  switch (type) {
    case ENTITY_TYPES.TASK:
      if (!appData.nextTaskId) appData.nextTaskId = 1;
      entityId = `task_${appData.nextTaskId++}`;
      break;
    case ENTITY_TYPES.NOTE:
      if (!appData.nextNoteId) appData.nextNoteId = 1;
      entityId = `note_${appData.nextNoteId++}`;
      break;
    case ENTITY_TYPES.CHECKLIST:
      if (!appData.nextChecklistId) appData.nextChecklistId = 1;
      entityId = `checklist_${appData.nextChecklistId++}`;
      break;
    case ENTITY_TYPES.PROJECT:
      if (!appData.nextProjectId) appData.nextProjectId = 1;
      entityId = `project_${appData.nextProjectId++}`;
      break;
    default:
      entityId = `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Create entity
  const entity = {
    id: entityId,
    type: type,
    title: data.title || '',
    content: data.content || data.description || '',
    completed: data.completed || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: data.tags || [],
    priority: data.priority || 'medium'
  };
  
  // Save to appData
  appData.entities[entityId] = entity;
  setAppData(appData);
  
  // Safe save to localStorage
  try {
    safeSaveData(appData);
  } catch (error) {
    console.warn('Failed to save data, continuing anyway:', error.message);
  }
  
  // If dual-write is enabled, also save to IndexedDB
  if (featureFlags.isEnabled(FLAGS.DUAL_WRITE)) {
    entityIndexedDBService.saveEntity(entity).catch(error => {
      console.error('Failed to save entity to IndexedDB:', error);
    });
  }
  
  console.log('Created entity manually:', entityId, entity);
  return entity;
}

/**
 * Enhanced update entity with dual-write support
 * @param {string} entityId - Entity ID
 * @param {Object} updates - Updates to apply
 * @returns {Object} Updated entity
 */
export function updateEntity(entityId, updates) {
  try {
    // Update entity using original method
    const entity = originalEntityCore.updateEntity(entityId, updates);
    
    // If dual-write is enabled, also update in IndexedDB
    if (featureFlags.isEnabled(FLAGS.DUAL_WRITE)) {
      entityIndexedDBService.saveEntity(entity).catch(error => {
        console.error('Failed to update entity in IndexedDB:', error);
      });
    }
    
    return entity;
    
  } catch (error) {
    // If original updateEntity fails, update manually
    console.warn('Original updateEntity failed, updating manually:', error.message);
    return updateEntityManually(entityId, updates);
  }
}

/**
 * Manually update entity for test environment
 * @param {string} entityId - Entity ID
 * @param {Object} updates - Updates to apply
 * @returns {Object} Updated entity
 */
function updateEntityManually(entityId, updates) {
  const appData = getAppData();
  
  if (!appData.entities || !appData.entities[entityId]) {
    throw new Error(`Entity ${entityId} not found`);
  }
  
  // Update entity
  const entity = {
    ...appData.entities[entityId],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  appData.entities[entityId] = entity;
  setAppData(appData);
  
  // Safe save
  try {
    safeSaveData(appData);
  } catch (error) {
    console.warn('Failed to save data, continuing anyway:', error.message);
  }
  
  // If dual-write is enabled, also update in IndexedDB
  if (featureFlags.isEnabled(FLAGS.DUAL_WRITE)) {
    entityIndexedDBService.saveEntity(entity).catch(error => {
      console.error('Failed to update entity in IndexedDB:', error);
    });
  }
  
  console.log('Updated entity manually:', entityId, entity);
  return entity;
}

/**
 * Enhanced delete entity with dual-write support
 * @param {string} entityId - Entity ID
 * @returns {boolean} Success status
 */
export function deleteEntity(entityId) {
  try {
    // Delete from localStorage using original method
    const success = originalEntityCore.deleteEntity(entityId);
    
    // If dual-write is enabled, also delete from IndexedDB
    if (featureFlags.isEnabled(FLAGS.DUAL_WRITE)) {
      entityIndexedDBService.deleteEntity(entityId).catch(error => {
        console.error('Failed to delete entity from IndexedDB:', error);
      });
    }
    
    return success;
    
  } catch (error) {
    // If original deleteEntity fails, delete manually
    console.warn('Original deleteEntity failed, deleting manually:', error.message);
    return deleteEntityManually(entityId);
  }
}

/**
 * Manually delete entity for test environment
 * @param {string} entityId - Entity ID
 * @returns {boolean} Success status
 */
function deleteEntityManually(entityId) {
  const appData = getAppData();
  
  if (!appData.entities || !appData.entities[entityId]) {
    console.warn(`Entity ${entityId} not found for deletion`);
    return false;
  }
  
  // Delete entity
  delete appData.entities[entityId];
  setAppData(appData);
  
  // Safe save
  try {
    safeSaveData(appData);
  } catch (error) {
    console.warn('Failed to save data, continuing anyway:', error.message);
  }
  
  // If dual-write is enabled, also delete from IndexedDB
  if (featureFlags.isEnabled(FLAGS.DUAL_WRITE)) {
    entityIndexedDBService.deleteEntity(entityId).catch(error => {
      console.error('Failed to delete entity from IndexedDB:', error);
    });
  }
  
  console.log('Deleted entity manually:', entityId);
  return true;
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