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

// Initialize the application
function initializeGridFlow() {
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