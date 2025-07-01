/**
 * GridFlow - Base Adapter
 * Provides common CRUD operations for IndexedDB adapters
 */

import database from './database.js';

/**
 * Base adapter class with common CRUD operations
 */
export class BaseAdapter {
  constructor(storeName) {
    this.storeName = storeName;
    this.db = database;
  }

  /**
   * Ensure database is initialized
   * Note: Database should be initialized at app startup, this is a safety check
   */
  async ensureReady() {
    if (!this.db.isReady()) {
      console.warn(`Database not ready for store ${this.storeName}, initializing...`);
      await this.db.init();
    }
  }

  /**
   * Get item by ID
   * @param {string} id - Item ID
   * @returns {Promise<Object|null>} Item or null if not found
   */
  async getById(id) {
    await this.ensureReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.getTransaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Save (add or update) an item
   * @param {Object} item - Item to save
   * @returns {Promise<Object>} Saved item
   */
  async save(item) {
    await this.ensureReady();
    
    // Add timestamp if not present
    if (!item.updatedAt) {
      item.updatedAt = new Date().toISOString();
    }
    if (!item.createdAt) {
      item.createdAt = new Date().toISOString();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.getTransaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(item);
      
      request.onsuccess = () => {
        resolve(item);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Delete item by ID
   * @param {string} id - Item ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    await this.ensureReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.getTransaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get all items in the store
   * @returns {Promise<Array>} All items
   */
  async getAll() {
    await this.ensureReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.getTransaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get items by index
   * @param {string} indexName - Index name
   * @param {*} value - Value to search for
   * @returns {Promise<Array>} Matching items
   */
  async getByIndex(indexName, value) {
    await this.ensureReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.getTransaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Count items in store
   * @returns {Promise<number>} Item count
   */
  async count() {
    await this.ensureReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.getTransaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Clear all items from store
   * @returns {Promise<boolean>} Success status
   */
  async clear() {
    await this.ensureReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.getTransaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}