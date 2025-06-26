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

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Make modules available globally for backward compatibility
    window.utilities = utilities;
    window.coreData = coreData;
    window.boardManagement = boardManagement;
    window.taskManagement = taskManagement;
    window.weeklyPlanning = weeklyPlanning;
    window.templateSystem = templateSystem;
    
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
    
    // Update UI
    if (window.renderBoard) window.renderBoard();
    if (window.updateSettingsUI) window.updateSettingsUI();
});

// Export for potential external use
export { utilities, coreData, boardManagement, taskManagement, weeklyPlanning, templateSystem };