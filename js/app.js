/**
 * GridFlow - Main Application Module
 * Coordinates module loading and initialization
 */

import * as utilities from './utilities.js';
import * as coreData from './core-data.js';
import * as boardManagement from './board-management.js';
import * as taskManagement from './task-management.js';
import * as weeklyPlanning from './weekly-planning.js';
import * as templateSystem from './template-system.js';
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

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Make modules available globally for backward compatibility
    window.utilities = utilities;
    window.coreData = coreData;
    window.boardManagement = boardManagement;
    window.taskManagement = taskManagement;
    window.weeklyPlanning = weeklyPlanning;
    window.templateSystem = templateSystem;
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
    
    // Load data first
    const { appData, boardData } = coreData.loadData();
    
    // Initialize utilities
    utilities.setupEventListeners();
    utilities.initializeSidebar();
    
    // Initialize board management
    boardManagement.updateBoardTitle();
    boardManagement.updateCurrentBoardDisplay();
    
    // Initialize weekly planning
    weeklyPlanning.initializeWeeklyPlanning();
    
    // Initialize templates (populate defaults if needed)
    templateSystem.populateDefaultTemplates();
    
    // Initialize collections (populate defaults if needed)
    collections.initializeSampleCollections();
    
    // Update UI
    if (window.renderBoard) window.renderBoard();
    if (window.updateSettingsUI) window.updateSettingsUI();
});

// Export for potential external use
export { utilities, coreData, boardManagement, taskManagement, weeklyPlanning, templateSystem, importExport, searchSystem, taggingSystem, collections, cardOperations, rowOperations, columnOperations, groupOperations, subtaskManagement };