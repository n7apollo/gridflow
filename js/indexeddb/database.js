/**
 * GridFlow - IndexedDB Database Manager
 * Core database wrapper for IndexedDB operations
 */

import { STORES, getAllStoreNames, validateStoreConfig } from './stores.js';
import { showStatusMessage } from '../utilities.js';

class GridFlowIndexedDB {
  constructor() {
    this.db = null;
    this.version = 2; // Incremented for entityPositions store
    this.dbName = 'GridFlowDB';
    this.isInitialized = false;
    this.initPromise = null; // Track ongoing initialization
  }

  /**
   * Initialize the database connection
   * @returns {Promise<IDBDatabase>} Database instance
   */
  async init() {
    // If already initialized, return the database
    if (this.isInitialized && this.db) {
      return this.db;
    }

    // If initialization is already in progress, wait for it
    if (this.initPromise) {
      return this.initPromise;
    }

    console.log('Initializing GridFlow IndexedDB...');
    
    // Start initialization and cache the promise
    this.initPromise = this.performInit();
    
    try {
      const result = await this.initPromise;
      this.initPromise = null; // Clear the promise after success
      return result;
    } catch (error) {
      this.initPromise = null; // Clear the promise after failure
      throw error;
    }
  }

  /**
   * Perform the actual initialization
   * @returns {Promise<IDBDatabase>} Database instance
   */
  async performInit() {
    
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
        
        // Validate that all required stores exist
        const requiredStores = getAllStoreNames();
        const existingStores = Array.from(this.db.objectStoreNames);
        const missingStores = requiredStores.filter(name => !existingStores.includes(name));
        
        console.log('GridFlow IndexedDB opened successfully');
        console.log('Required stores:', requiredStores);
        console.log('Existing stores:', existingStores);
        
        if (missingStores.length > 0) {
          console.error('Missing stores detected:', missingStores);
          console.log('Database exists but stores are missing. This requires a version upgrade.');
          
          // Close the current connection
          this.db.close();
          
          // Force a version upgrade by incrementing version
          this.version += 1;
          console.log(`Forcing version upgrade to ${this.version} to create missing stores`);
          
          // Retry with higher version to trigger onupgradeneeded
          const retryRequest = indexedDB.open(this.dbName, this.version);
          
          retryRequest.onupgradeneeded = (retryEvent) => {
            console.log('Forced upgrade: creating missing object stores...');
            this.db = retryEvent.target.result;
            this.createObjectStores();
          };
          
          retryRequest.onsuccess = (retryEvent) => {
            this.db = retryEvent.target.result;
            this.isInitialized = true;
            console.log('GridFlow IndexedDB initialized successfully with forced upgrade');
            
            // Setup error handler
            this.db.onerror = (errorEvent) => {
              console.error('IndexedDB error:', errorEvent.target.error);
            };

            resolve(this.db);
          };
          
          retryRequest.onerror = (retryEvent) => {
            const error = retryEvent.target.error;
            console.error('Failed to initialize IndexedDB on retry:', error);
            reject(error);
          };
          
          return; // Exit early, wait for retry
        }
        
        // All stores exist, continue normally
        this.isInitialized = true;
        console.log('All required stores present, IndexedDB ready');
        
        // Setup error handler
        this.db.onerror = (errorEvent) => {
          console.error('IndexedDB error:', errorEvent.target.error);
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