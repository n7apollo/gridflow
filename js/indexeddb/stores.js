/**
 * GridFlow - IndexedDB Store Definitions
 * Defines the structure and indexes for all object stores
 */

export const STORES = {
  // Core entity storage
  entities: {
    keyPath: 'id',
    indexes: [
      { name: 'type', keyPath: 'type', options: { unique: false } },
      { name: 'boardId', keyPath: 'boardId', options: { unique: false } },
      { name: 'completed', keyPath: 'completed', options: { unique: false } },
      { name: 'priority', keyPath: 'priority', options: { unique: false } },
      { name: 'dueDate', keyPath: 'dueDate', options: { unique: false } },
      { name: 'tags', keyPath: 'tags', options: { multiEntry: true } },
      { name: 'people', keyPath: 'people', options: { multiEntry: true } },
      { name: 'createdAt', keyPath: 'createdAt', options: { unique: false } },
      { name: 'updatedAt', keyPath: 'updatedAt', options: { unique: false } }
    ]
  },

  // Board structure
  boards: {
    keyPath: 'id',
    indexes: [
      { name: 'name', keyPath: 'name', options: { unique: false } },
      { name: 'createdAt', keyPath: 'createdAt', options: { unique: false } }
    ]
  },

  groups: {
    keyPath: 'id',
    indexes: [
      { name: 'boardId', keyPath: 'boardId', options: { unique: false } },
      { name: 'name', keyPath: 'name', options: { unique: false } }
    ]
  },

  rows: {
    keyPath: 'id',
    indexes: [
      { name: 'boardId', keyPath: 'boardId', options: { unique: false } },
      { name: 'groupId', keyPath: 'groupId', options: { unique: false } },
      { name: 'name', keyPath: 'name', options: { unique: false } }
    ]
  },

  columns: {
    keyPath: 'id',
    indexes: [
      { name: 'boardId', keyPath: 'boardId', options: { unique: false } },
      { name: 'key', keyPath: 'key', options: { unique: false } },
      { name: 'name', keyPath: 'name', options: { unique: false } }
    ]
  },

  // Entity positioning and context
  entityPositions: {
    keyPath: 'id',
    indexes: [
      { name: 'entityId', keyPath: 'entityId', options: { unique: false } },
      { name: 'boardId', keyPath: 'boardId', options: { unique: false } },
      { name: 'context', keyPath: 'context', options: { unique: false } },
      { name: 'rowId', keyPath: 'rowId', options: { unique: false } },
      { name: 'columnKey', keyPath: 'columnKey', options: { unique: false } }
    ]
  },

  // People system
  people: {
    keyPath: 'id',
    indexes: [
      { name: 'name', keyPath: 'name', options: { unique: false } },
      { name: 'email', keyPath: 'email', options: { unique: false } },
      { name: 'company', keyPath: 'company', options: { unique: false } },
      { name: 'tags', keyPath: 'tags', options: { multiEntry: true } },
      { name: 'lastInteraction', keyPath: 'lastInteraction', options: { unique: false } },
      { name: 'interactionFrequency', keyPath: 'interactionFrequency', options: { unique: false } }
    ]
  },

  // Relationships between entities
  entityRelationships: {
    keyPath: 'id',
    indexes: [
      { name: 'entityId', keyPath: 'entityId', options: { unique: false } },
      { name: 'relatedId', keyPath: 'relatedId', options: { unique: false } },
      { name: 'relationshipType', keyPath: 'relationshipType', options: { unique: false } },
      { name: 'createdAt', keyPath: 'createdAt', options: { unique: false } }
    ]
  },

  // Collections and saved searches
  collections: {
    keyPath: 'id',
    indexes: [
      { name: 'name', keyPath: 'name', options: { unique: false } },
      { name: 'type', keyPath: 'type', options: { unique: false } },
      { name: 'category', keyPath: 'category', options: { unique: false } },
      { name: 'createdAt', keyPath: 'createdAt', options: { unique: false } }
    ]
  },

  // Tag system
  tags: {
    keyPath: 'id',
    indexes: [
      { name: 'name', keyPath: 'name', options: { unique: false } },
      { name: 'category', keyPath: 'category', options: { unique: false } },
      { name: 'parent', keyPath: 'parent', options: { unique: false } },
      { name: 'usageCount', keyPath: 'usageCount', options: { unique: false } },
      { name: 'createdAt', keyPath: 'createdAt', options: { unique: false } }
    ]
  },

  // Weekly planning
  weeklyPlans: {
    keyPath: 'weekKey',
    indexes: [
      { name: 'weekStart', keyPath: 'weekStart', options: { unique: false } },
      { name: 'createdAt', keyPath: 'createdAt', options: { unique: false } }
    ]
  },

  weeklyItems: {
    keyPath: 'id',
    indexes: [
      { name: 'weekKey', keyPath: 'weekKey', options: { unique: false } },
      { name: 'entityId', keyPath: 'entityId', options: { unique: false } },
      { name: 'day', keyPath: 'day', options: { unique: false } },
      { name: 'addedAt', keyPath: 'addedAt', options: { unique: false } }
    ]
  },

  // Templates
  templates: {
    keyPath: 'id',
    indexes: [
      { name: 'name', keyPath: 'name', options: { unique: false } },
      { name: 'category', keyPath: 'category', options: { unique: false } },
      { name: 'createdAt', keyPath: 'createdAt', options: { unique: false } }
    ]
  },

  // Application metadata
  metadata: {
    keyPath: 'key',
    indexes: [
      { name: 'category', keyPath: 'category', options: { unique: false } },
      { name: 'updatedAt', keyPath: 'updatedAt', options: { unique: false } }
    ]
  }
};

// Store version for migration tracking
export const STORE_VERSION = 1;

// Helper function to get all store names
export function getAllStoreNames() {
  return Object.keys(STORES);
}

// Helper function to validate store configuration
export function validateStoreConfig(storeName) {
  const config = STORES[storeName];
  if (!config) {
    throw new Error(`Store configuration not found: ${storeName}`);
  }
  
  if (!config.keyPath) {
    throw new Error(`Store ${storeName} missing keyPath`);
  }
  
  return config;
}