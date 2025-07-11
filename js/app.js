/**
 * GridFlow - Main Application Module (IndexedDB-Only)
 * Coordinates module loading and initialization with IndexedDB as exclusive data source
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
import * as entitySync from './entity-sync.js';
import * as dataMigration from './data-migration.js';
import * as dragDrop from './drag-drop.js';
// Dexie Cloud sync modules
import { dexieCloudSync } from './dexie-cloud-sync.js';
import * as dexieCloudUI from './dexie-cloud-ui.js';

// Debug tools for development
import './debug-data-source.js';

// People System
import peopleService from './people-service.js';
import * as peopleView from './people-view.js';

// Collections and Tags System
import * as collectionsView from './collections-view.js';
import * as tagsView from './tags-view.js';

// Dexie infrastructure (Dexie-only)
import { db } from './db.js';
import { entityService } from './entity-service.js';
import { boardService } from './board-service.js';
import { metaService } from './meta-service.js';

// Initialize the application
async function initializeGridFlow() {
    try {
        console.log('🚀 Initializing GridFlow (Dexie Architecture)...');
        
        // Initialize Dexie database (much simpler!)
        console.log('🗄️ Initializing Dexie database...');
        await db.initialize();
        console.log('✅ Dexie database initialized successfully');
        
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
        window.entitySync = entitySync;
        window.dataMigration = dataMigration;
        window.dragDrop = dragDrop;
        // Dexie Cloud sync modules
        window.dexieCloudSync = dexieCloudSync;
        window.dexieCloudUI = dexieCloudUI;
        
        // Make People System available globally
        window.peopleService = peopleService;
        window.peopleView = peopleView;
        window.switchToPeopleView = peopleView.switchToPeopleView;
        
        // Make Dexie services available globally for debugging
        window.gridFlowDB = db;
        window.entityService = entityService;
        window.entityAdapter = entityService; // Backward compatibility
        window.boardService = boardService;
        window.boardAdapter = boardService; // Backward compatibility
        window.metaService = metaService;
        window.appMetadataAdapter = metaService; // Backward compatibility
        
        // Load application data from Dexie
        console.log('📊 Loading application data from Dexie...');
        await coreData.loadData();
        console.log('✅ Application data loaded successfully');
        
        // Cloud sync disabled - no longer using jsonstorage.net
        // console.log('☁️ Initializing cloud sync...');
        // await cloudSync.cloudSync.initialize();
        // console.log('✅ Cloud sync initialized');
        
        // Initialize entity synchronization system
        console.log('🔄 Initializing entity synchronization...');
        entitySync.initializeEntitySync();
        
        // Initialize utilities (will handle missing DOM elements gracefully)
        console.log('⚙️ Setting up event listeners...');
        utilities.setupEventListeners();
        
        // Initialize navigation system (must be before data loaded event dispatch)
        console.log('🧭 Initializing navigation system...');
        navigation.initializeNavigation();
        
        // Initialize board management
        console.log('📋 Initializing board management...');
        boardManagement.updateBoardTitle();
        boardManagement.updateCurrentBoardDisplay();
        
        // Initialize weekly planning
        console.log('📅 Initializing weekly planning...');
        weeklyPlanning.initializeWeeklyPlanning();
        weeklyPlanning.initializeWeeklyEventListeners();
        
        // Initialize task management
        console.log('📝 Initializing task management...');
        taskManagement.initializeTaskManagement();
        
        // Initialize templates (populate defaults if needed)
        console.log('📄 Initializing template system...');
        templateSystem.populateDefaultTemplates();
        
        // Initialize template library (populate sample templates if needed)
        templateLibrary.initializeSampleTemplates();
        
        // Initialize collections (populate defaults if needed)
        collections.initializeSampleCollections();
        
        // Initialize Dexie Cloud sync
        if (window.dexieCloudSync) {
            console.log('☁️ Initializing Dexie Cloud sync...');
            await window.dexieCloudSync.initialize();
            console.log('✅ Dexie Cloud sync initialized');
        }
        
        // Verify data integrity
        await verifyDataIntegrity();
        
        // Signal that app initialization is complete
        window.appInitialized = true;
        window.dispatchEvent(new CustomEvent('gridflow-app-initialized'));
        console.log('🎉 GridFlow app initialization complete (Dexie Architecture)');
        
    } catch (error) {
        console.error('❌ Failed to initialize GridFlow:', error);
        utilities.showStatusMessage('Failed to initialize app. Please refresh the page.', 'error');
        throw error;
    }
}

/**
 * Verify data integrity in Dexie
 */
async function verifyDataIntegrity() {
    try {
        console.log('🔍 Verifying data integrity...');
        
        // Get data counts
        const entities = await entityService.getAll();
        const boards = await boardService.getAll();
        const currentBoardId = await metaService.getCurrentBoardId();
        
        console.log(`📊 Data verification: ${entities.length} entities, ${boards.length} boards, current board: ${currentBoardId}`);
        
        // Verify at least one board exists
        if (boards.length === 0) {
            console.log('⚠️ No boards found, sample data should be created during loadData()');
        }
        
        // Verify app config is valid
        if (!currentBoardId) {
            console.warn('⚠️ No current board ID set in metadata');
        }
        
        // Check for orphaned entities using new entity service (informational only)
        if (currentBoardId) {
            const orphanedEntities = await entityService.getOrphanedEntities(currentBoardId);
            
            if (orphanedEntities.length > 0) {
                console.log(`ℹ️ Found ${orphanedEntities.length} orphaned entities (not positioned on current board or in weekly plans/collections)`);
                console.log('💡 Orphaned entities are NOT automatically recovered to prevent adding weekly items to boards');
                
                // DISABLED: Automatic recovery was adding weekly items to boards
                // Only run recovery manually when needed
                // const recoveryResult = await entityService.recoverOrphanedEntities(currentBoardId);
                // if (recoveryResult.success) {
                //     console.log(`🔧 Recovered ${recoveryResult.recoveredCount} entities to ${recoveryResult.placementLocation.rowName} → ${recoveryResult.placementLocation.columnName}`);
                // } else {
                //     console.warn(`⚠️ Entity recovery failed`);
                // }
            }
        }
        
        console.log('✅ Data integrity verification complete');
        
    } catch (error) {
        console.error('❌ Data integrity verification failed:', error);
        // Don't throw - this is just a diagnostic
    }
}

/**
 * Get application health status
 * @returns {Promise<Object>} Health status information
 */
async function getAppHealthStatus() {
    try {
        const entities = await entityService.getAll();
        const boards = await boardService.getAll();
        const currentBoardId = await metaService.getCurrentBoardId();
        
        return {
            healthy: true,
            database: {
                name: 'GridFlowDB',
                type: 'Dexie',
                version: 1
            },
            data: {
                entities: entities.length,
                boards: boards.length,
                currentBoardId: currentBoardId
            },
            features: {
                peopleSystem: !!window.peopleService,
                dexieCloudSync: !!window.dexieCloudSync,
                weeklyPlanning: !!window.weeklyPlanning
            }
        };
        
    } catch (error) {
        return {
            healthy: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Emergency data recovery function
 * @returns {Promise<Object>} Recovery status
 */
async function emergencyDataRecovery() {
    try {
        console.log('🚨 Starting emergency data recovery...');
        
        // Try to load from Dexie
        const entities = await entityService.getAll();
        const boards = await boardService.getAll();
        
        if (boards.length === 0) {
            console.log('📋 No boards found, creating default board...');
            await coreData.initializeSampleData();
        }
        
        // Verify app config
        const currentBoardId = await metaService.getCurrentBoardId();
        if (!currentBoardId) {
            const firstBoard = boards[0] || { id: 'default' };
            await metaService.setCurrentBoardId(firstBoard.id);
            console.log(`📌 Set current board to ${firstBoard.id}`);
        }
        
        // Reload app data
        await coreData.loadData();
        
        console.log('✅ Emergency data recovery completed');
        return {
            success: true,
            entitiesRecovered: entities.length,
            boardsRecovered: boards.length
        };
        
    } catch (error) {
        console.error('❌ Emergency data recovery failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Initialize immediately for global scope setup
document.addEventListener('DOMContentLoaded', initializeGridFlow);

// Make functions available globally
window.initializeGridFlow = initializeGridFlow;
window.getAppHealthStatus = getAppHealthStatus;
window.emergencyDataRecovery = emergencyDataRecovery;

// Manual entity recovery function for debugging
window.recoverOrphanedEntities = async (boardId = null) => {
    const targetBoardId = boardId || await metaService.getCurrentBoardId() || 'default';
    const result = await entityService.recoverOrphanedEntities(targetBoardId);
    console.log('Recovery result:', result);
    if (result.success && window.renderBoard) {
        window.renderBoard(); // Re-render the board to show recovered entities
    }
    return result;
};

// Export for potential external use
export { 
    utilities, 
    coreData, 
    navigation, 
    boardManagement, 
    boardRendering, 
    taskManagement, 
    weeklyPlanning, 
    templateSystem, 
    templateLibrary, 
    importExport, 
    searchSystem, 
    taggingSystem, 
    collections, 
    cardOperations, 
    rowOperations, 
    columnOperations, 
    groupOperations, 
    subtaskManagement, 
    entitySystem, 
    dataMigration, 
    dragDrop, 
    peopleService, 
    peopleView,
    getAppHealthStatus,
    emergencyDataRecovery
};