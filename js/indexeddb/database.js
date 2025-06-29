/**
 * GridFlow - IndexedDB Database Manager
 * Core database wrapper for IndexedDB operations
 */

import { STORES, getAllStoreNames, validateStoreConfig } from './stores.js';
import { showStatusMessage } from '../utilities.js';

class GridFlowIndexedDB {
  constructor() {
    this.db = null;
    this.version = 1;
    this.dbName = 'GridFlowDB';
    this.isInitialized = false;
  }

  /**
   * Initialize the database connection
   * @returns {Promise<IDBDatabase>} Database instance
   */
  async init() {
    if (this.isInitialized && this.db) {
      return this.db;
    }

    console.log('Initializing GridFlow IndexedDB...');
    
    return new Promise((resolve, reject) => {
      // Check if IndexedDB is available
      if (!window.indexedDB) {
        reject(new Error('IndexedDB not supported in this browser'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        console.log('IndexedDB upgrade needed, creating object stores...');
        this.db = event.target.result;
        this.createObjectStores();
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.isInitialized = true;
        console.log('GridFlow IndexedDB initialized successfully');
        
        // Setup error handler
        this.db.onerror = (event) => {
          console.error('IndexedDB error:', event.target.error);
        };

        resolve(this.db);
      };

      request.onerror = (event) => {
        const error = event.target.error;
        console.error('Failed to initialize IndexedDB:', error);
        reject(error);
      };

      request.onblocked = (event) => {
        console.warn('IndexedDB upgrade blocked by another tab');
        showStatusMessage('Database upgrade blocked. Please close other tabs and refresh.', 'warning');
      };
    });
  }

  /**
   * Create all object stores and their indexes
   */
  createObjectStores() {
    const storeNames = getAllStoreNames();
    
    for (const storeName of storeNames) {
      try {
        const config = validateStoreConfig(storeName);
        
        // Skip if store already exists
        if (this.db.objectStoreNames.contains(storeName)) {
          console.log(`Store ${storeName} already exists, skipping...`);
          continue;
        }

        // Create the object store
        const store = this.db.createObjectStore(storeName, {
          keyPath: config.keyPath
        });

        // Create indexes
        if (config.indexes) {
          for (const index of config.indexes) {
            store.createIndex(index.name, index.keyPath, index.options || {});
            console.log(`Created index ${index.name} for store ${storeName}`);
          }
        }

        console.log(`Created object store: ${storeName}`);

      } catch (error) {
        console.error(`Failed to create store ${storeName}:`, error);
        throw error;
      }
    }
  }

  /**
   * Get a transaction for the specified stores
   * @param {string|string[]} storeNames - Store name(s)
   * @param {string} mode - Transaction mode ('readonly' or 'readwrite')
   * @returns {IDBTransaction} Transaction object
   */
  getTransaction(storeNames, mode = 'readonly') {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }

    const stores = Array.isArray(storeNames) ? storeNames : [storeNames];
    return this.db.transaction(stores, mode);
  }

  /**
   * Get an object store from a transaction
   * @param {string} storeName - Store name
   * @param {string} mode - Transaction mode
   * @returns {IDBObjectStore} Object store
   */
  getStore(storeName, mode = 'readonly') {
    const transaction = this.getTransaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  /**
   * Execute a transaction with proper error handling
   * @param {string|string[]} storeNames - Store name(s)
   * @param {string} mode - Transaction mode
   * @param {Function} callback - Function to execute in transaction
   * @returns {Promise} Transaction result
   */
  async executeTransaction(storeNames, mode, callback) {
    return new Promise((resolve, reject) => {
      const transaction = this.getTransaction(storeNames, mode);
      
      transaction.oncomplete = () => {
        resolve();
      };
      
      transaction.onerror = () => {
        reject(transaction.error);
      };
      
      transaction.onabort = () => {
        reject(new Error('Transaction aborted'));
      };

      try {
        // Execute the callback with the transaction
        const result = callback(transaction);
        
        // If callback returns a promise, handle it
        if (result && typeof result.then === 'function') {
          result.catch(error => {
            transaction.abort();
            reject(error);
          });
        }
      } catch (error) {
        transaction.abort();
        reject(error);
      }
    });
  }

  /**
   * Check if the database is initialized
   * @returns {boolean} Initialization status
   */
  isReady() {
    return this.isInitialized && this.db !== null;
  }

  /**
   * Get database information
   * @returns {Object} Database info
   */
  getInfo() {
    if (!this.db) {
      return null;
    }

    return {
      name: this.db.name,
      version: this.db.version,
      objectStoreNames: Array.from(this.db.objectStoreNames)
    };
  }

  /**
   * Close the database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      console.log('IndexedDB connection closed');
    }
  }

  /**
   * Delete the entire database (for testing/reset purposes)
   * @returns {Promise} Deletion result
   */
  static async deleteDatabase() {
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase('GridFlowDB');
      
      deleteRequest.onsuccess = () => {
        console.log('GridFlow database deleted successfully');
        resolve();
      };
      
      deleteRequest.onerror = () => {
        reject(deleteRequest.error);
      };
      
      deleteRequest.onblocked = () => {
        console.warn('Database deletion blocked');
        reject(new Error('Database deletion blocked'));
      };
    });
  }
}

// Create singleton instance
const database = new GridFlowIndexedDB();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.gridFlowDB = database;
}

export default database;