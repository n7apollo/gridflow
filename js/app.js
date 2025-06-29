/**
 * GridFlow - Main Application Module
 * Coordinates module loading and initialization
 */

import * as utilities from './utilities.js';
import * as coreData from './core-data.js';
import * as navigation from './navigation.js';
import * as boardManagement from './board-management.js';
import * as boardRendering from './board-rendering.js';
import * as taskManagement from './task-management.js';
import * as weeklyPlanning from './weekly-planning.js';
import * as templateSystem from './template-system.js';
import * as templateLibrary from './template-library.js';
import * as importExport from './import-export.js';
import * as searchSystem from './search-system.js';
import * as taggingSystem from './tagging-system.js';
import * as collections from './collections.js';
import * as cardOperations from './card-operations.js';
import * as rowOperations from './row-operations.js';
import * as columnOperations from './column-operations.js';
import * as groupOperations from './group-operations.js';
import * as subtaskManagement from './subtask-management.js';
import * as entitySystem from './entity-system.js';
import * as entityCore from './entity-core.js';
import * as entityRenderer from './entity-renderer.js';
import * as entityMigration from './entity-migration.js';
import * as entitySync from './entity-sync.js';
import * as dataMigration from './data-migration.js';
import * as dragDrop from './drag-drop.js';
import * as cloudSync from './cloud-sync.js';
import * as syncUI from './sync-ui.js';

// IndexedDB infrastructure (Phase 1)
import featureFlags, { FLAGS } from './feature-flags.js';
import database from './indexeddb/database.js';
import testRunner from './indexeddb/test-runner.js';
import dualWriteService from './indexeddb/dual-writer.js';
import dataValidator from './indexeddb/validator.js';
import migrationService from './indexeddb/migration-service.js';
import entityIndexedDBService from './indexeddb/entity-indexeddb-service.js';
import * as enhancedEntityCore from './indexeddb/entity-core-enhanced.js';

// Initialize the application
async function initializeGridFlow() {
    // Make modules available globally for backward compatibility
    window.utilities = utilities;
    window.coreData = coreData;
    window.navigation = navigation;
    window.boardManagement = boardManagement;
    window.boardRendering = boardRendering;
    window.taskManagement = taskManagement;
    window.weeklyPlanning = weeklyPlanning;
    window.templateSystem = templateSystem;
    window.templateLibrary = templateLibrary;
    window.importExport = importExport;
    window.searchSystem = searchSystem;
    window.taggingSystem = taggingSystem;
    window.collections = collections;
    window.cardOperations = cardOperations;
    window.rowOperations = rowOperations;
    window.columnOperations = columnOperations;
    window.groupOperations = groupOperations;
    window.subtaskManagement = subtaskManagement;
    window.entitySystem = entitySystem;
    window.entityCore = entityCore;
    window.entityRenderer = entityRenderer;
    window.entityMigration = entityMigration;
    window.entitySync = entitySync;
    window.dataMigration = dataMigration;
    window.dragDrop = dragDrop;
    window.cloudSync = cloudSync.cloudSync; // Export the instance
    window.syncUI = syncUI;
    
    // Make IndexedDB infrastructure available globally
    window.featureFlags = featureFlags;
    window.FLAGS = FLAGS;
    window.gridFlowDB = database;
    window.indexedDBTests = testRunner;
    window.dualWriteService = dualWriteService;
    window.dataValidator = dataValidator;
    window.migrationService = migrationService;
    window.entityIndexedDBService = entityIndexedDBService;
    window.enhancedEntityCore = enhancedEntityCore;
    
    // Initialize IndexedDB if enabled
    if (featureFlags.isEnabled(FLAGS.INDEXEDDB_ENABLED)) {
        try {
            console.log('🗄️ Initializing IndexedDB infrastructure...');
            await database.init();
            console.log('✅ IndexedDB initialized successfully');
            
            // Run basic tests in development
            if (featureFlags.isEnabled(FLAGS.PERFORMANCE_MONITORING)) {
                console.log('🧪 Running IndexedDB infrastructure tests...');
                const testResults = await testRunner.runAllTests();
                if (testResults.failed > 0) {
                    utilities.showStatusMessage(
                        `IndexedDB tests failed: ${testResults.failed}/${testResults.total}`, 
                        'warning'
                    );
                }
            }
        } catch (error) {
            console.error('Failed to initialize IndexedDB:', error);
            featureFlags.disable(FLAGS.INDEXEDDB_ENABLED);
            utilities.showStatusMessage('IndexedDB failed to initialize, using localStorage only', 'warning');
        }
    }
    
    // Load data first
    const { appData, boardData } = coreData.loadData();
    
    // Check if entity migration is needed
    if (entityMigration.isMigrationNeeded()) {
        console.log('Entity migration needed, starting migration...');
        const migrationResult = entityMigration.migrateToEntitySystem();
        console.log('Migration completed:', migrationResult);
        
        // Show migration status to user
        const status = entityMigration.getMigrationStatus();
        utilities.showStatusMessage(
            `Migration completed: ${status.entities.total} entities, ${status.cards.migrated} cards migrated`, 
            'success'
        );
    } else {
        console.log('Entity system already up to date');
    }
    
    // Initialize entity synchronization system
    entitySync.initializeEntitySync();
    
    // Initialize utilities (will now handle missing DOM elements gracefully)
    utilities.setupEventListeners();
    
    // Initialize navigation system (will be called by component loader)
    // navigation.initializeNavigation();
    
    // Initialize board management
    boardManagement.updateBoardTitle();
    boardManagement.updateCurrentBoardDisplay();
    
    // Initialize weekly planning
    weeklyPlanning.initializeWeeklyPlanning();
    weeklyPlanning.initializeWeeklyEventListeners();
    
    // Initialize templates (populate defaults if needed)
    templateSystem.populateDefaultTemplates();
    
    // Initialize template library (populate sample templates if needed)
    templateLibrary.initializeSampleTemplates();
    
    // Initialize collections (populate defaults if needed)
    collections.initializeSampleCollections();
    
    // Initialize cloud sync (load settings and start auto-sync if enabled)
    if (window.cloudSync) {
        window.cloudSync.loadSyncSettings();
        console.log('Cloud sync initialized');
    }
    
    // Update UI (will be called by navigation after components are ready)
    // if (window.renderBoard) window.renderBoard();
    // if (window.updateSettingsUI) window.updateSettingsUI();
}

// Initialize immediately for global scope setup
document.addEventListener('DOMContentLoaded', initializeGridFlow);

// Make initialization function available for component loader
window.initializeGridFlow = initializeGridFlow;

// Export for potential external use
export { utilities, coreData, navigation, boardManagement, boardRendering, taskManagement, weeklyPlanning, templateSystem, templateLibrary, importExport, searchSystem, taggingSystem, collections, cardOperations, rowOperations, columnOperations, groupOperations, subtaskManagement, entitySystem, dataMigration, dragDrop };