/**
 * GridFlow - Collections Adapter
 * Handles smart collections and saved searches in IndexedDB
 */

import { BaseAdapter } from '../base-adapter.js';

class CollectionsAdapter extends BaseAdapter {
  constructor() {
    super('collections');
  }

  /**
   * Create a new collection
   * @param {Object} collectionData - Collection data
   * @returns {Promise<Object>} Created collection
   */
  async createCollection(collectionData) {
    try {
      const collection = {
        id: collectionData.id || `collection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: collectionData.name || 'Untitled Collection',
        description: collectionData.description || '',
        type: collectionData.type || 'saved_search', // 'saved_search', 'manual', 'smart'
        category: collectionData.category || 'general',
        
        // Filter criteria for saved searches
        filters: collectionData.filters || {
          tags: [],
          entityTypes: [],
          priorities: [],
          dateRange: null,
          search: ''
        },
        
        // Manual collection items (entity IDs)
        items: collectionData.items || [],
        
        // Collection metadata
        isPublic: collectionData.isPublic || false,
        itemCount: 0,
        autoUpdate: collectionData.autoUpdate !== false, // Default to true
        
        // Timestamps
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      await this.save(collection);
      console.log('Created collection:', collection.id);
      return collection;
    } catch (error) {
      console.error('Failed to create collection:', error);
      throw error;
    }
  }

  /**
   * Get collections by type
   * @param {string} type - Collection type ('saved_search', 'manual', 'smart')
   * @returns {Promise<Array>} Collections of specified type
   */
  async getByType(type) {
    return this.getByIndex('type', type);
  }

  /**
   * Get collections by category
   * @param {string} category - Category name
   * @returns {Promise<Array>} Collections in category
   */
  async getByCategory(category) {
    return this.getByIndex('category', category);
  }

  /**
   * Update collection
   * @param {string} collectionId - Collection ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated collection
   */
  async updateCollection(collectionId, updates) {
    try {
      const collection = await this.getById(collectionId);
      if (!collection) {
        throw new Error(`Collection ${collectionId} not found`);
      }

      const updatedCollection = {
        ...collection,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await this.save(updatedCollection);
      return updatedCollection;
    } catch (error) {
      console.error('Failed to update collection:', error);
      throw error;
    }
  }

  /**
   * Add item to manual collection
   * @param {string} collectionId - Collection ID
   * @param {string} entityId - Entity ID to add
   * @returns {Promise<Object>} Updated collection
   */
  async addItem(collectionId, entityId) {
    try {
      const collection = await this.getById(collectionId);
      if (!collection) {
        throw new Error(`Collection ${collectionId} not found`);
      }

      if (collection.type !== 'manual') {
        throw new Error('Can only add items to manual collections');
      }

      if (!collection.items.includes(entityId)) {
        collection.items.push(entityId);
        collection.itemCount = collection.items.length;
        collection.lastUpdated = new Date().toISOString();
        collection.updatedAt = new Date().toISOString();

        await this.save(collection);
      }

      return collection;
    } catch (error) {
      console.error('Failed to add item to collection:', error);
      throw error;
    }
  }

  /**
   * Remove item from manual collection
   * @param {string} collectionId - Collection ID
   * @param {string} entityId - Entity ID to remove
   * @returns {Promise<Object>} Updated collection
   */
  async removeItem(collectionId, entityId) {
    try {
      const collection = await this.getById(collectionId);
      if (!collection) {
        throw new Error(`Collection ${collectionId} not found`);
      }

      if (collection.type !== 'manual') {
        throw new Error('Can only remove items from manual collections');
      }

      const index = collection.items.indexOf(entityId);
      if (index > -1) {
        collection.items.splice(index, 1);
        collection.itemCount = collection.items.length;
        collection.lastUpdated = new Date().toISOString();
        collection.updatedAt = new Date().toISOString();

        await this.save(collection);
      }

      return collection;
    } catch (error) {
      console.error('Failed to remove item from collection:', error);
      throw error;
    }
  }

  /**
   * Update collection item count and last updated timestamp
   * @param {string} collectionId - Collection ID
   * @param {number} itemCount - New item count
   * @returns {Promise<Object>} Updated collection
   */
  async updateItemCount(collectionId, itemCount) {
    try {
      const collection = await this.getById(collectionId);
      if (!collection) {
        throw new Error(`Collection ${collectionId} not found`);
      }

      collection.itemCount = itemCount;
      collection.lastUpdated = new Date().toISOString();
      collection.updatedAt = new Date().toISOString();

      await this.save(collection);
      return collection;
    } catch (error) {
      console.error('Failed to update collection item count:', error);
      throw error;
    }
  }

  /**
   * Update collection items list (for saved search collections)
   * @param {string} collectionId - Collection ID
   * @param {Array} items - Array of entity IDs
   * @returns {Promise<Object>} Updated collection
   */
  async updateItems(collectionId, items) {
    try {
      const collection = await this.getById(collectionId);
      if (!collection) {
        throw new Error(`Collection ${collectionId} not found`);
      }

      collection.items = items || [];
      collection.itemCount = collection.items.length;
      collection.lastUpdated = new Date().toISOString();
      collection.updatedAt = new Date().toISOString();

      await this.save(collection);
      return collection;
    } catch (error) {
      console.error('Failed to update collection items:', error);
      throw error;
    }
  }

  /**
   * Search collections by name or description
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Matching collections
   */
  async searchCollections(searchTerm) {
    try {
      const allCollections = await this.getAll();
      const term = searchTerm.toLowerCase();
      
      return allCollections.filter(collection =>
        collection.name.toLowerCase().includes(term) ||
        (collection.description && collection.description.toLowerCase().includes(term))
      );
    } catch (error) {
      console.error('Failed to search collections:', error);
      return [];
    }
  }

  /**
   * Get collections with filters
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Filtered collections
   */
  async getFiltered(filters = {}) {
    try {
      let collections = await this.getAll();

      // Apply type filter
      if (filters.type) {
        collections = collections.filter(c => c.type === filters.type);
      }

      // Apply category filter
      if (filters.category) {
        collections = collections.filter(c => c.category === filters.category);
      }

      // Apply public/private filter
      if (filters.isPublic !== undefined) {
        collections = collections.filter(c => c.isPublic === filters.isPublic);
      }

      // Apply text search
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        collections = collections.filter(c =>
          c.name.toLowerCase().includes(searchTerm) ||
          (c.description && c.description.toLowerCase().includes(searchTerm))
        );
      }

      // Apply sorting
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'name':
            collections.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'itemCount':
            collections.sort((a, b) => (b.itemCount || 0) - (a.itemCount || 0));
            break;
          case 'created':
            collections.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
          case 'updated':
            collections.sort((a, b) => new Date(b.lastUpdated || b.updatedAt) - new Date(a.lastUpdated || a.updatedAt));
            break;
        }
      }

      return collections;
    } catch (error) {
      console.error('Failed to get filtered collections:', error);
      return [];
    }
  }

  /**
   * Get collection statistics
   * @returns {Promise<Object>} Collection statistics
   */
  async getStatistics() {
    try {
      const collections = await this.getAll();
      
      const stats = {
        total: collections.length,
        byType: {},
        byCategory: {},
        totalItems: 0,
        mostPopular: null,
        recentCount: 0
      };

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      collections.forEach(collection => {
        // Type stats
        const type = collection.type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;
        
        // Category stats
        const category = collection.category || 'Uncategorized';
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

        // Item stats
        const itemCount = collection.itemCount || 0;
        stats.totalItems += itemCount;
        
        if (!stats.mostPopular || itemCount > (stats.mostPopular.itemCount || 0)) {
          stats.mostPopular = collection;
        }

        // Recent collections
        if (new Date(collection.createdAt) > thirtyDaysAgo) {
          stats.recentCount++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Failed to get collection statistics:', error);
      return { total: 0, byType: {}, byCategory: {}, totalItems: 0, mostPopular: null, recentCount: 0 };
    }
  }

  /**
   * Export collections for backup
   * @returns {Promise<Array>} All collections
   */
  async exportCollections() {
    try {
      return await this.getAll();
    } catch (error) {
      console.error('Failed to export collections:', error);
      return [];
    }
  }

  /**
   * Import collections from backup
   * @param {Array} collections - Collections to import
   * @returns {Promise<Object>} Import results
   */
  async importCollections(collections) {
    try {
      let imported = 0;
      let skipped = 0;
      let errors = 0;

      for (const collection of collections) {
        try {
          // Check if collection already exists
          const existing = await this.getById(collection.id);
          if (existing) {
            skipped++;
            continue;
          }

          // Ensure required fields
          const collectionToImport = {
            ...collection,
            createdAt: collection.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await this.save(collectionToImport);
          imported++;
        } catch (error) {
          console.error(`Failed to import collection ${collection.id}:`, error);
          errors++;
        }
      }

      return { imported, skipped, errors, total: collections.length };
    } catch (error) {
      console.error('Failed to import collections:', error);
      throw error;
    }
  }

  /**
   * Create default sample collections
   * @returns {Promise<Array>} Created collections
   */
  async createSampleCollections() {
    try {
      const existingCollections = await this.getAll();
      if (existingCollections.length > 0) {
        return []; // Already has collections
      }

      const sampleCollections = [
        {
          name: "High Priority Items",
          description: "All high priority tasks, notes, and checklists across all projects",
          type: "saved_search",
          category: "productivity",
          filters: {
            priorities: ['high', 'urgent'],
            entityTypes: ['task', 'note', 'checklist'],
            tags: [],
            dateRange: null
          }
        },
        {
          name: "This Week's Items",
          description: "All items created this week",
          type: "saved_search", 
          category: "time",
          filters: {
            dateRange: {
              start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              end: new Date().toISOString()
            },
            entityTypes: ['task', 'note', 'checklist'],
            priorities: [],
            tags: []
          }
        },
        {
          name: "Completed Today",
          description: "All items completed today",
          type: "saved_search",
          category: "productivity",
          filters: {
            completed: true,
            dateRange: {
              start: new Date().toDateString(),
              end: new Date().toISOString()
            },
            entityTypes: ['task'],
            priorities: [],
            tags: []
          }
        }
      ];

      const createdCollections = [];
      for (const collectionData of sampleCollections) {
        const collection = await this.createCollection(collectionData);
        createdCollections.push(collection);
      }

      return createdCollections;
    } catch (error) {
      console.error('Failed to create sample collections:', error);
      return [];
    }
  }
}

// Create singleton instance
const collectionsAdapter = new CollectionsAdapter();

export default collectionsAdapter;
export { CollectionsAdapter };