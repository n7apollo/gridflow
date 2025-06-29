/**
 * GridFlow - Entity Core Switcher
 * Phase 2.2: Allows dynamic switching between entity-core implementations
 * This module provides a seamless way to test IndexedDB-first operations
 */

import * as originalEntityCore from '../entity-core.js';
import * as enhancedEntityCore from './entity-core-enhanced.js';
import * as indexedDBFirstEntityCore from './entity-core-indexeddb-first.js';
import featureFlags, { FLAGS } from '../feature-flags.js';

// Available implementations
const IMPLEMENTATIONS = {
  ORIGINAL: 'original',
  ENHANCED: 'enhanced', // Dual-write with localStorage primary
  INDEXEDDB_FIRST: 'indexeddb_first' // IndexedDB primary with localStorage fallback
};

// Current implementation
let currentImplementation = IMPLEMENTATIONS.ORIGINAL;

// Implementation modules
const implementations = {
  [IMPLEMENTATIONS.ORIGINAL]: originalEntityCore,
  [IMPLEMENTATIONS.ENHANCED]: enhancedEntityCore,
  [IMPLEMENTATIONS.INDEXEDDB_FIRST]: indexedDBFirstEntityCore
};

/**
 * Get the appropriate implementation based on feature flags
 * @returns {string} Implementation name
 */
function getRecommendedImplementation() {
  if (featureFlags.isEnabled(FLAGS.INDEXEDDB_ENABLED)) {
    // If we're testing IndexedDB as primary
    if (featureFlags.isEnabled('INDEXEDDB_PRIMARY_TEST')) {
      return IMPLEMENTATIONS.INDEXEDDB_FIRST;
    }
    // If dual-write is enabled
    if (featureFlags.isEnabled(FLAGS.DUAL_WRITE)) {
      return IMPLEMENTATIONS.ENHANCED;
    }
  }
  
  return IMPLEMENTATIONS.ORIGINAL;
}

/**
 * Switch to a specific entity core implementation
 * @param {string} implementationName - Implementation to switch to
 * @returns {boolean} Success status
 */
export function switchImplementation(implementationName) {
  if (!implementations[implementationName]) {
    console.error(`Unknown implementation: ${implementationName}`);
    return false;
  }
  
  const previousImplementation = currentImplementation;
  currentImplementation = implementationName;
  
  console.log(`🔄 Switched entity core from ${previousImplementation} to ${implementationName}`);
  
  // Update global exports
  updateGlobalExports();
  
  // Trigger custom event for components that need to know about the switch
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('entityCoreSwitch', {
      detail: { 
        from: previousImplementation, 
        to: implementationName,
        implementation: getCurrentImplementation()
      }
    }));
  }
  
  return true;
}

/**
 * Get current implementation module
 * @returns {Object} Current entity core implementation
 */
export function getCurrentImplementation() {
  return implementations[currentImplementation];
}

/**
 * Get current implementation name
 * @returns {string} Current implementation name
 */
export function getCurrentImplementationName() {
  return currentImplementation;
}

/**
 * Auto-switch to recommended implementation based on feature flags
 */
export function autoSwitch() {
  const recommended = getRecommendedImplementation();
  if (recommended !== currentImplementation) {
    switchImplementation(recommended);
  }
}

/**
 * Update global exports to use current implementation
 */
function updateGlobalExports() {
  const impl = getCurrentImplementation();
  
  // Update window.entityCore to point to current implementation
  if (typeof window !== 'undefined') {
    window.entityCore = impl;
    window.currentEntityCoreImplementation = currentImplementation;
  }
}

/**
 * Get implementation statistics and info
 * @returns {Object} Implementation info
 */
export function getImplementationInfo() {
  const impl = getCurrentImplementation();
  
  return {
    current: currentImplementation,
    available: Object.keys(IMPLEMENTATIONS),
    recommended: getRecommendedImplementation(),
    features: {
      hasPerformanceStats: typeof impl.getPerformanceStats === 'function',
      hasAsyncOperations: typeof impl.getEntityAsync === 'function',
      hasConsistencyValidation: typeof impl.validateDataConsistency === 'function',
      hasIndexedDBSupport: currentImplementation !== IMPLEMENTATIONS.ORIGINAL
    },
    flags: {
      indexedDBEnabled: featureFlags.isEnabled(FLAGS.INDEXEDDB_ENABLED),
      dualWriteEnabled: featureFlags.isEnabled(FLAGS.DUAL_WRITE),
      indexedDBPrimaryTest: featureFlags.isEnabled('INDEXEDDB_PRIMARY_TEST')
    }
  };
}

/**
 * Test different implementations with the same operations
 * @param {Array} testOperations - Array of operations to test
 * @returns {Promise<Object>} Test results
 */
export async function testImplementations(testOperations = []) {
  const results = {};
  
  // Default test operations if none provided
  if (testOperations.length === 0) {
    testOperations = [
      { type: 'create', entityType: 'task', data: { title: 'Test Task', content: 'Test content' } },
      { type: 'update', entityId: null, updates: { title: 'Updated Test Task' } },
      { type: 'delete', entityId: null }
    ];
  }
  
  for (const implName of Object.keys(implementations)) {
    console.log(`🧪 Testing implementation: ${implName}`);
    
    // Switch to this implementation
    const originalImpl = currentImplementation;
    switchImplementation(implName);
    
    const impl = getCurrentImplementation();
    const startTime = performance.now();
    const testResults = {
      implementation: implName,
      operations: [],
      errors: [],
      totalTime: 0
    };
    
    try {
      let testEntityId = null;
      
      for (const operation of testOperations) {
        const opStartTime = performance.now();
        
        try {
          switch (operation.type) {
            case 'create':
              const entity = impl.createEntity(operation.entityType, operation.data);
              testEntityId = entity.id;
              operation.entityId = testEntityId; // Update for subsequent operations
              testResults.operations.push({
                type: 'create',
                success: true,
                entityId: testEntityId,
                time: performance.now() - opStartTime
              });
              break;
              
            case 'update':
              const entityIdToUpdate = operation.entityId || testEntityId;
              if (entityIdToUpdate) {
                const updatedEntity = impl.updateEntity(entityIdToUpdate, operation.updates);
                testResults.operations.push({
                  type: 'update',
                  success: true,
                  entityId: entityIdToUpdate,
                  time: performance.now() - opStartTime
                });
              }
              break;
              
            case 'delete':
              const entityIdToDelete = operation.entityId || testEntityId;
              if (entityIdToDelete) {
                const success = impl.deleteEntity(entityIdToDelete);
                testResults.operations.push({
                  type: 'delete',
                  success: success,
                  entityId: entityIdToDelete,
                  time: performance.now() - opStartTime
                });
              }
              break;
          }
        } catch (opError) {
          testResults.errors.push({
            operation: operation.type,
            error: opError.message
          });
        }
      }
      
    } catch (error) {
      testResults.errors.push({
        operation: 'general',
        error: error.message
      });
    }
    
    testResults.totalTime = performance.now() - startTime;
    results[implName] = testResults;
    
    // Switch back to original implementation
    switchImplementation(originalImpl);
  }
  
  return results;
}

// Initialize with recommended implementation
autoSwitch();
updateGlobalExports();

// Re-export current implementation functions for direct use
export const ENTITY_TYPES = () => getCurrentImplementation().ENTITY_TYPES;
export const CONTEXT_TYPES = () => getCurrentImplementation().CONTEXT_TYPES;
export const createEntity = (...args) => getCurrentImplementation().createEntity(...args);
export const getEntity = (...args) => getCurrentImplementation().getEntity(...args);
export const updateEntity = (...args) => getCurrentImplementation().updateEntity(...args);
export const deleteEntity = (...args) => getCurrentImplementation().deleteEntity(...args);
export const toggleEntityCompletion = (...args) => getCurrentImplementation().toggleEntityCompletion(...args);

// Make switcher available globally
if (typeof window !== 'undefined') {
  window.entityCoreSwitcher = {
    switchImplementation,
    getCurrentImplementation,
    getCurrentImplementationName,
    autoSwitch,
    getImplementationInfo,
    testImplementations,
    IMPLEMENTATIONS
  };
}