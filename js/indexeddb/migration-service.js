/**
 * GridFlow - Migration Service
 * Handles migration from localStorage to IndexedDB
 */

import { getAppData, setAppData, saveData } from '../core-data.js';
import { entityAdapter, boardAdapter, weeklyPlanAdapter, weeklyItemAdapter } from './adapters.js';
import { showStatusMessage } from '../utilities.js';
import featureFlags, { FLAGS } from '../feature-flags.js';

class MigrationService {
  constructor() {
    this.migrationState = {
      inProgress: false,
      currentStep: null,
      progress: 0,
      totalSteps: 0,
      errors: [],
      startTime: null,
      estimatedCompletion: null
    };
  }

  /**
   * Main migration function - migrates all data from localStorage to IndexedDB
   * @returns {Promise<Object>} Migration results
   */
  async migrateFromLocalStorage() {
    if (this.migrationState.inProgress) {
      throw new Error('Migration already in progress');
    }

    console.log('🔄 Starting localStorage to IndexedDB migration...');
    this.migrationState.inProgress = true;
    this.migrationState.startTime = Date.now();
    
    const results = {
      startTime: new Date().toISOString(),
      steps: [],
      entitiesMigrated: 0,
      boardsMigrated: 0,
      weeklyPlansMigrated: 0,
      weeklyItemsMigrated: 0,
      errors: [],
      duration: 0,
      success: false
    };

    let backupData = null;

    try {
      // Create backup before migration
      backupData = this.createBackup();
      this.updateProgress('Creating backup', 0, 6);
      
      // Step 1: Migrate entities
      this.updateProgress('Migrating entities', 1, 6);
      const entityResults = await this.migrateEntities();
      results.entitiesMigrated = entityResults.count;
      results.steps.push(entityResults);
      
      // Step 2: Migrate boards
      this.updateProgress('Migrating boards', 2, 6);
      const boardResults = await this.migrateBoards();
      results.boardsMigrated = boardResults.count;
      results.steps.push(boardResults);
      
      // Step 3: Migrate weekly plans
      this.updateProgress('Migrating weekly plans', 3, 6);
      const weeklyPlanResults = await this.migrateWeeklyPlans();
      results.weeklyPlansMigrated = weeklyPlanResults.count;
      results.steps.push(weeklyPlanResults);
      
      // Step 4: Migrate weekly items
      this.updateProgress('Migrating weekly items', 4, 6);
      const weeklyItemResults = await this.migrateWeeklyItems();
      results.weeklyItemsMigrated = weeklyItemResults.count;
      results.steps.push(weeklyItemResults);
      
      // Step 5: Validate migration
      this.updateProgress('Validating migration', 5, 6);
      const validationResults = await this.validateMigration();
      results.steps.push(validationResults);
      
      if (!validationResults.valid) {
        throw new Error('Migration validation failed');
      }
      
      // Step 6: Complete migration
      this.updateProgress('Completing migration', 6, 6);
      results.success = true;
      results.duration = Date.now() - this.migrationState.startTime;
      
      console.log('✅ Migration completed successfully:', results);
      this.safeShowStatusMessage(
        `Migration completed: ${results.entitiesMigrated} entities, ${results.boardsMigrated} boards migrated`, 
        'success'
      );
      
      // Enable dual-write mode after successful migration
      featureFlags.enable(FLAGS.DUAL_WRITE);
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      results.errors.push(error.message);
      results.success = false;
      results.duration = Date.now() - this.migrationState.startTime;
      
      // Attempt rollback
      try {
        await this.rollback(backupData);
        this.safeShowStatusMessage('Migration failed and rolled back successfully', 'error');
      } catch (rollbackError) {
        console.error('Rollback also failed:', rollbackError);
        this.safeShowStatusMessage('Migration failed and rollback also failed - manual intervention required', 'error');
      }
      
      throw error;
    } finally {
      this.migrationState.inProgress = false;
      this.migrationState.currentStep = null;
      this.migrationState.progress = 0;
    }

    return results;
  }

  /**
   * Migrate entities from localStorage to IndexedDB
   * @returns {Promise<Object>} Migration results for entities
   */
  async migrateEntities() {
    const appData = getAppData();
    const entities = appData.entities || {};
    const entityIds = Object.keys(entities);
    
    // Get existing entities in IndexedDB to avoid duplicates
    const existingEntities = await entityAdapter.getAll();
    const existingEntityIds = new Set(existingEntities.map(e => e.id));
    
    // Filter out entities that already exist
    const entitiesToMigrate = entityIds.filter(id => !existingEntityIds.has(id));
    
    console.log(`Migrating ${entitiesToMigrate.length} entities (${entityIds.length - entitiesToMigrate.length} already exist)...`);
    
    const results = {
      step: 'entities',
      count: 0,
      skipped: entityIds.length - entitiesToMigrate.length,
      errors: [],
      duration: 0
    };
    
    const startTime = Date.now();
    
    try {
      // Migrate in batches for better performance
      const batchSize = 50;
      for (let i = 0; i < entitiesToMigrate.length; i += batchSize) {
        const batch = entitiesToMigrate.slice(i, i + batchSize);
        await this.migrateBatch(batch, entities, 'entity');
        results.count += batch.length;
        
        // Update progress within this step
        const stepProgress = Math.round((i / entitiesToMigrate.length) * 100);
        console.log(`Entity migration progress: ${stepProgress}%`);
      }
      
      results.duration = Date.now() - startTime;
      console.log(`✅ Migrated ${results.count} new entities (skipped ${results.skipped} existing) in ${results.duration}ms`);
      
    } catch (error) {
      results.errors.push(error.message);
      throw error;
    }
    
    return results;
  }

  /**
   * Migrate boards from localStorage to IndexedDB
   * @returns {Promise<Object>} Migration results for boards
   */
  async migrateBoards() {
    const appData = getAppData();
    const boards = appData.boards || {};
    const boardIds = Object.keys(boards);
    
    // Get existing boards in IndexedDB to avoid duplicates
    const existingBoards = await boardAdapter.getAll();
    const existingBoardIds = new Set(existingBoards.map(b => b.id));
    
    // Filter out boards that already exist
    const boardsToMigrate = boardIds.filter(id => !existingBoardIds.has(id));
    
    console.log(`Migrating ${boardsToMigrate.length} boards (${boardIds.length - boardsToMigrate.length} already exist)...`);
    
    const results = {
      step: 'boards',
      count: 0,
      skipped: boardIds.length - boardsToMigrate.length,
      errors: [],
      duration: 0
    };
    
    const startTime = Date.now();
    
    try {
      for (const boardId of boardsToMigrate) {
        const board = boards[boardId];
        
        // Prepare board for IndexedDB (remove cards arrays, keep references only)
        const migratedBoard = {
          id: boardId,
          name: board.name,
          groups: board.groups || [],
          rows: board.rows ? board.rows.map(row => ({
            ...row,
            cards: undefined // Remove cards array, entities are stored separately
          })) : [],
          columns: board.columns || [],
          settings: board.settings || {},
          createdAt: board.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await boardAdapter.save(migratedBoard);
        results.count++;
      }
      
      results.duration = Date.now() - startTime;
      console.log(`✅ Migrated ${results.count} new boards (skipped ${results.skipped} existing) in ${results.duration}ms`);
      
    } catch (error) {
      results.errors.push(error.message);
      throw error;
    }
    
    return results;
  }

  /**
   * Migrate weekly plans from localStorage to IndexedDB
   * @returns {Promise<Object>} Migration results for weekly plans
   */
  async migrateWeeklyPlans() {
    const appData = getAppData();
    const weeklyPlans = appData.weeklyPlans || {};
    const weekKeys = Object.keys(weeklyPlans);
    
    console.log(`Migrating ${weekKeys.length} weekly plans...`);
    
    const results = {
      step: 'weeklyPlans',
      count: 0,
      errors: [],
      duration: 0
    };
    
    const startTime = Date.now();
    
    try {
      for (const weekKey of weekKeys) {
        const weeklyPlan = weeklyPlans[weekKey];
        
        // Prepare weekly plan (remove items array, store separately)
        const migratedPlan = {
          weekKey,
          weekStart: weeklyPlan.weekStart,
          goal: weeklyPlan.goal || '',
          reflection: weeklyPlan.reflection || null,
          createdAt: weeklyPlan.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await weeklyPlanAdapter.save(migratedPlan);
        results.count++;
      }
      
      results.duration = Date.now() - startTime;
      console.log(`✅ Migrated ${results.count} weekly plans in ${results.duration}ms`);
      
    } catch (error) {
      results.errors.push(error.message);
      throw error;
    }
    
    return results;
  }

  /**
   * Migrate weekly items from localStorage to IndexedDB
   * @returns {Promise<Object>} Migration results for weekly items
   */
  async migrateWeeklyItems() {
    const appData = getAppData();
    const weeklyPlans = appData.weeklyPlans || {};
    
    let totalItems = 0;
    
    // Count total items first
    Object.values(weeklyPlans).forEach(plan => {
      if (plan.items) {
        totalItems += plan.items.length;
      }
    });
    
    console.log(`Migrating ${totalItems} weekly items...`);
    
    const results = {
      step: 'weeklyItems',
      count: 0,
      errors: [],
      duration: 0
    };
    
    const startTime = Date.now();
    
    try {
      for (const [weekKey, weeklyPlan] of Object.entries(weeklyPlans)) {
        if (weeklyPlan.items) {
          for (const item of weeklyPlan.items) {
            const migratedItem = {
              id: item.id,
              weekKey,
              entityId: item.entityId,
              day: item.day,
              addedAt: item.addedAt || new Date().toISOString()
            };
            
            await weeklyItemAdapter.save(migratedItem);
            results.count++;
          }
        }
      }
      
      results.duration = Date.now() - startTime;
      console.log(`✅ Migrated ${results.count} weekly items in ${results.duration}ms`);
      
    } catch (error) {
      results.errors.push(error.message);
      throw error;
    }
    
    return results;
  }

  /**
   * Migrate a batch of items
   * @param {Array} batch - Batch of item IDs
   * @param {Object} sourceData - Source data object
   * @param {string} type - Type of items being migrated
   */
  async migrateBatch(batch, sourceData, type) {
    for (const id of batch) {
      try {
        const item = sourceData[id];
        
        if (type === 'entity') {
          // Ensure entity has required fields
          const migratedEntity = {
            ...item,
            updatedAt: new Date().toISOString()
          };
          
          await entityAdapter.save(migratedEntity);
        }
        
      } catch (error) {
        console.error(`Failed to migrate ${type} ${id}:`, error);
        throw error;
      }
    }
  }

  /**
   * Validate the migration by comparing data
   * @returns {Promise<Object>} Validation results
   */
  async validateMigration() {
    console.log('Validating migration...');
    
    const results = {
      step: 'validation',
      valid: false,
      entityCheck: false,
      boardCheck: false,
      errors: [],
      duration: 0
    };
    
    const startTime = Date.now();
    
    try {
      const appData = getAppData();
      
      // Validate entities - check that all localStorage entities exist in IndexedDB
      const sourceEntities = appData.entities || {};
      const migratedEntities = await entityAdapter.getAll();
      const migratedEntitiesObj = {};
      migratedEntities.forEach(entity => {
        migratedEntitiesObj[entity.id] = entity;
      });
      
      const sourceEntityIds = Object.keys(sourceEntities);
      const missingEntities = sourceEntityIds.filter(id => !migratedEntitiesObj[id]);
      
      if (missingEntities.length === 0) {
        results.entityCheck = true;
        console.log(`✅ Entity validation passed: All ${sourceEntityIds.length} localStorage entities found in IndexedDB (IndexedDB has ${migratedEntities.length} total)`);
      } else {
        results.errors.push(`Missing entities in IndexedDB: ${missingEntities.length} entities not found`);
        console.error(`Missing entities:`, missingEntities);
      }
      
      // Validate boards - check that all localStorage boards exist in IndexedDB
      const sourceBoards = appData.boards || {};
      const migratedBoards = await boardAdapter.getAll();
      const migratedBoardsObj = {};
      migratedBoards.forEach(board => {
        migratedBoardsObj[board.id] = board;
      });
      
      const sourceBoardIds = Object.keys(sourceBoards);
      const missingBoards = sourceBoardIds.filter(id => !migratedBoardsObj[id]);
      
      if (missingBoards.length === 0) {
        results.boardCheck = true;
        console.log(`✅ Board validation passed: All ${sourceBoardIds.length} localStorage boards found in IndexedDB (IndexedDB has ${migratedBoards.length} total)`);
      } else {
        results.errors.push(`Missing boards in IndexedDB: ${missingBoards.length} boards not found`);
        console.error(`Missing boards:`, missingBoards);
      }
      
      results.valid = results.entityCheck && results.boardCheck;
      results.duration = Date.now() - startTime;
      
      if (results.valid) {
        console.log(`✅ Migration validation passed in ${results.duration}ms`);
      } else {
        console.error(`❌ Migration validation failed: ${results.errors.join(', ')}`);
      }
      
    } catch (error) {
      results.errors.push(error.message);
      console.error('Migration validation error:', error);
    }
    
    return results;
  }

  /**
   * Create a backup of current localStorage data
   * @returns {Object} Backup data
   */
  createBackup() {
    try {
      const currentData = localStorage.getItem('gridflow_data');
      if (!currentData) {
        console.warn('No data to backup');
        return null;
      }
      
      const backupKey = `gridflow_data_backup_${Date.now()}`;
      localStorage.setItem(backupKey, currentData);
      
      console.log(`✅ Created migration backup: ${backupKey}`);
      return { key: backupKey, data: currentData };
      
    } catch (error) {
      console.error('Failed to create backup:', error);
      return null;
    }
  }

  /**
   * Rollback migration by restoring backup
   * @param {Object} backupData - Backup data
   */
  async rollback(backupData) {
    if (!backupData) {
      throw new Error('No backup data available for rollback');
    }
    
    console.log('🔄 Rolling back migration...');
    
    try {
      // Clear IndexedDB data
      await entityAdapter.clear();
      await boardAdapter.clear();
      
      // Restore localStorage data
      localStorage.setItem('gridflow_data', backupData.data);
      
      // Disable IndexedDB flags
      featureFlags.disable(FLAGS.INDEXEDDB_ENABLED);
      featureFlags.disable(FLAGS.DUAL_WRITE);
      
      console.log('✅ Migration rolled back successfully');
      
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Update migration progress
   * @param {string} step - Current step description
   * @param {number} current - Current step number
   * @param {number} total - Total steps
   */
  updateProgress(step, current, total) {
    this.migrationState.currentStep = step;
    this.migrationState.progress = Math.round((current / total) * 100);
    this.migrationState.totalSteps = total;
    
    console.log(`📊 Migration progress: ${this.migrationState.progress}% - ${step}`);
    
    // Estimate completion time
    if (current > 0 && this.migrationState.startTime) {
      const elapsed = Date.now() - this.migrationState.startTime;
      const rate = current / elapsed;
      const remaining = total - current;
      this.migrationState.estimatedCompletion = remaining / rate;
    }
  }

  /**
   * Get current migration state
   * @returns {Object} Migration state
   */
  getMigrationState() {
    return { ...this.migrationState };
  }

  /**
   * Check if migration is currently in progress
   * @returns {boolean} Migration status
   */
  isMigrationInProgress() {
    return this.migrationState.inProgress;
  }

  /**
   * Safe status message that works in both main app and test environments
   * @param {string} message - Message to show
   * @param {string} type - Message type (success, error, warning, info)
   */
  safeShowStatusMessage(message, type) {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Try to use showStatusMessage if available (main app)
    try {
      if (typeof showStatusMessage === 'function') {
        showStatusMessage(message, type);
      }
    } catch (error) {
      // If showStatusMessage fails (test environment), just log
      console.warn('showStatusMessage not available, logged to console instead');
    }
  }
}

// Create singleton instance
const migrationService = new MigrationService();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.migrationService = migrationService;
}

export default migrationService;