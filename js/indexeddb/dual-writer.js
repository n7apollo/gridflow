/**
 * GridFlow - Dual Write Service
 * Writes data to both localStorage and IndexedDB during transition period
 */

import featureFlags, { FLAGS } from '../feature-flags.js';
import { entityAdapter } from './adapters.js';
import entityIndexedDBService from './entity-indexeddb-service.js';
import { showStatusMessage } from '../utilities.js';

class DualWriteService {
  constructor() {
    this.legacyService = null; // Will be injected
    this.indexedDBService = null; // Will be injected
    this.errorCount = 0;
    this.maxErrors = 5; // Max IndexedDB errors before disabling
  }

  /**
   * Initialize the dual write service
   * @param {Object} legacyService - Legacy localStorage service
   * @param {Object} indexedDBService - IndexedDB service
   */
  init(legacyService, indexedDBService) {
    this.legacyService = legacyService;
    this.indexedDBService = indexedDBService;
    console.log('Dual write service initialized');
  }

  /**
   * Check if dual write is enabled
   * @returns {boolean} Dual write status
   */
  isDualWriteEnabled() {
    return featureFlags.isEnabled(FLAGS.DUAL_WRITE) && 
           featureFlags.isEnabled(FLAGS.INDEXEDDB_ENABLED);
  }

  /**
   * Save entity to both storage systems
   * @param {Object} entity - Entity to save
   * @returns {Promise<Object>} Saved entity
   */
  async saveEntity(entity) {
    // Always save to localStorage first (primary storage during transition)
    let savedEntity;
    try {
      savedEntity = await this.legacyService.saveEntity(entity);
    } catch (error) {
      console.error('Legacy save failed:', error);
      throw error; // Legacy save failure is critical
    }

    // Also save to IndexedDB if dual write is enabled
    if (this.isDualWriteEnabled()) {
      try {
        await entityIndexedDBService.saveEntity(savedEntity);
        console.log(`Entity ${entity.id} saved to both storage systems`);
      } catch (error) {
        this.handleIndexedDBError('saveEntity', error, entity);
      }
    }

    return savedEntity;
  }

  /**
   * Delete entity from both storage systems
   * @param {string} entityId - Entity ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteEntity(entityId) {
    // Delete from localStorage first
    let success;
    try {
      success = await this.legacyService.deleteEntity(entityId);
    } catch (error) {
      console.error('Legacy delete failed:', error);
      throw error;
    }

    // Also delete from IndexedDB if dual write is enabled
    if (this.isDualWriteEnabled()) {
      try {
        await entityIndexedDBService.deleteEntity(entityId);
        console.log(`Entity ${entityId} deleted from both storage systems`);
      } catch (error) {
        this.handleIndexedDBError('deleteEntity', error, { entityId });
      }
    }

    return success;
  }

  /**
   * Save board to both storage systems
   * @param {Object} board - Board to save
   * @returns {Promise<Object>} Saved board
   */
  async saveBoard(board) {
    // Save to localStorage first
    let savedBoard;
    try {
      savedBoard = await this.legacyService.saveBoard(board);
    } catch (error) {
      console.error('Legacy board save failed:', error);
      throw error;
    }

    // Also save to IndexedDB if dual write is enabled
    if (this.isDualWriteEnabled()) {
      try {
        await entityIndexedDBService.saveBoard(savedBoard);
        console.log(`Board ${board.id} saved to both storage systems`);
      } catch (error) {
        this.handleIndexedDBError('saveBoard', error, board);
      }
    }

    return savedBoard;
  }

  /**
   * Handle IndexedDB errors gracefully
   * @param {string} operation - Operation that failed
   * @param {Error} error - Error object
   * @param {Object} data - Data that failed to save
   */
  handleIndexedDBError(operation, error, data) {
    this.errorCount++;
    console.error(`IndexedDB ${operation} failed (error ${this.errorCount}/${this.maxErrors}):`, error);
    
    // Log error details for debugging
    console.error('Failed data:', data);
    console.error('Error stack:', error.stack);

    // Disable dual write if too many errors
    if (this.errorCount >= this.maxErrors) {
      console.warn('Too many IndexedDB errors, disabling dual write');
      featureFlags.disable(FLAGS.DUAL_WRITE);
      showStatusMessage(
        'IndexedDB experiencing issues, falling back to localStorage only', 
        'warning'
      );
    }

    // Store error for later analysis
    this.logError(operation, error, data);
  }

  /**
   * Log error for analysis
   * @param {string} operation - Failed operation
   * @param {Error} error - Error object
   * @param {Object} data - Failed data
   */
  logError(operation, error, data) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      operation,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      data: data ? { id: data.id, type: data.type } : null,
      userAgent: navigator.userAgent
    };

    // Store in localStorage for later analysis
    const errors = JSON.parse(localStorage.getItem('gridflow_indexeddb_errors') || '[]');
    errors.push(errorLog);
    
    // Keep only last 50 errors
    if (errors.length > 50) {
      errors.splice(0, errors.length - 50);
    }
    
    localStorage.setItem('gridflow_indexeddb_errors', JSON.stringify(errors));
  }

  /**
   * Get error log for debugging
   * @returns {Array} Error log entries
   */
  getErrorLog() {
    return JSON.parse(localStorage.getItem('gridflow_indexeddb_errors') || '[]');
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    localStorage.removeItem('gridflow_indexeddb_errors');
    this.errorCount = 0;
    console.log('IndexedDB error log cleared');
  }

  /**
   * Get dual write statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const errors = this.getErrorLog();
    return {
      isDualWriteEnabled: this.isDualWriteEnabled(),
      errorCount: this.errorCount,
      totalErrors: errors.length,
      lastError: errors[errors.length - 1] || null,
      isDisabled: this.errorCount >= this.maxErrors
    };
  }

  /**
   * Reset error count and re-enable dual write
   */
  reset() {
    this.errorCount = 0;
    featureFlags.enable(FLAGS.DUAL_WRITE);
    console.log('Dual write service reset');
  }
}

// Create singleton instance
const dualWriteService = new DualWriteService();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.dualWriteService = dualWriteService;
}

export default dualWriteService;