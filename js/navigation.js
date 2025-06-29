/**
 * GridFlow - Navigation Module
 * Centralized navigation, view switching, and UI state management
 */

import { getAppData, getBoardData, saveData } from './core-data.js';
import { showStatusMessage } from './utilities.js';

// ============================================
// CORE VIEW SWITCHING
// ============================================

/**
 * Switch between different views (board, tasks, weekly)
 * @param {string} view - View to switch to ('board', 'tasks', 'weekly')
 */
export function switchToView(view) {
    // Hide all containers using CSS classes
    const boardContainer = document.getElementById('boardContainer');
    const taskContainer = document.getElementById('taskContainer');
    const weeklyContainer = document.getElementById('weeklyContainer');
    const peopleContainer = document.getElementById('peopleContainer');
    
    if (boardContainer) boardContainer.classList.add('hidden');
    if (taskContainer) taskContainer.classList.add('hidden');
    if (weeklyContainer) weeklyContainer.classList.add('hidden');
    if (peopleContainer) peopleContainer.classList.add('hidden');
    
    // Remove active class from all view buttons (header) - check if they exist
    const boardViewBtn = document.getElementById('boardViewBtn');
    const taskViewBtn = document.getElementById('taskViewBtn');
    const weeklyViewBtn = document.getElementById('weeklyViewBtn');
    
    if (boardViewBtn) boardViewBtn.classList.remove('active');
    if (taskViewBtn) taskViewBtn.classList.remove('active');
    if (weeklyViewBtn) weeklyViewBtn.classList.remove('active');
    
    // Remove active class from sidebar nav links
    const sidebarLinks = document.querySelectorAll('.nav-link');
    sidebarLinks.forEach(link => link.classList.remove('active'));
    
    // Show selected view and activate buttons
    if (view === 'board') {
        if (boardContainer) boardContainer.classList.remove('hidden');
        if (boardViewBtn) boardViewBtn.classList.add('active');
        const sidebarBoardView = document.getElementById('sidebarBoardView');
        if (sidebarBoardView) sidebarBoardView.classList.add('active');
        if (window.renderBoard) {
            // Check if data is ready before rendering
            if (window.boardData && window.boardData.columns) {
                window.renderBoard();
            } else {
                console.log('switchToView: Board data not ready, deferring render');
                // Set up a check for when data becomes available
                const checkDataReady = () => {
                    if (window.boardData && window.boardData.columns) {
                        window.renderBoard();
                    } else {
                        setTimeout(checkDataReady, 50);
                    }
                };
                setTimeout(checkDataReady, 100);
            }
        }
    } else if (view === 'tasks') {
        if (taskContainer) taskContainer.classList.remove('hidden');
        if (taskViewBtn) taskViewBtn.classList.add('active');
        const sidebarTaskView = document.getElementById('sidebarTaskView');
        if (sidebarTaskView) sidebarTaskView.classList.add('active');
        if (window.populateTaskView) window.populateTaskView();
    } else if (view === 'weekly') {
        if (weeklyContainer) weeklyContainer.classList.remove('hidden');
        if (weeklyViewBtn) weeklyViewBtn.classList.add('active');
        const sidebarWeeklyView = document.getElementById('sidebarWeeklyView');
        if (sidebarWeeklyView) sidebarWeeklyView.classList.add('active');
        if (window.switchToWeeklyView) window.switchToWeeklyView();
    } else if (view === 'people') {
        if (peopleContainer) peopleContainer.classList.remove('hidden');
        const sidebarPeopleView = document.getElementById('sidebarPeopleView');
        if (sidebarPeopleView) sidebarPeopleView.classList.add('active');
        if (window.switchToPeopleView) window.switchToPeopleView();
    }
}

// ============================================
// SIDEBAR NAVIGATION
// ============================================

/**
 * Toggle sidebar visibility and collapsed state
 */
export function toggleSidebar() {
    // DaisyUI drawer handles sidebar toggling via the drawer-toggle checkbox
    const drawerToggle = document.getElementById('drawer-toggle');
    if (drawerToggle) {
        drawerToggle.checked = !drawerToggle.checked;
    }
}

/**
 * Handle responsive sidebar behavior
 * Note: DaisyUI drawer handles responsive behavior automatically
 */
export function handleSidebarResize() {
    // DaisyUI drawer component handles responsive behavior automatically
    // No manual style manipulation needed
}

/**
 * Initialize sidebar on page load
 */
export function initializeSidebar() {
    handleSidebarResize();
    window.addEventListener('resize', handleSidebarResize);
}

// ============================================
// BOARD NAVIGATION
// ============================================

/**
 * Toggle board dropdown
 */
export function toggleBoardDropdown() {
    const dropdown = document.getElementById('boardDropdown');
    if (!dropdown) return; // Early return if element doesn't exist
    
    const isOpen = !dropdown.classList.contains('hidden');
    
    if (isOpen) {
        closeBoardDropdown();
    } else {
        if (window.populateBoardDropdown) window.populateBoardDropdown();
        dropdown.classList.remove('hidden');
        
        // Focus search input
        const searchInput = document.getElementById('boardSearchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.value = '';
        }
        
        // Close dropdown when clicking outside
        setTimeout(() => {
            document.addEventListener('click', handleBoardDropdownOutsideClick);
        }, 0);
    }
}

/**
 * Close board dropdown
 */
export function closeBoardDropdown() {
    const dropdown = document.getElementById('boardDropdown');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
    document.removeEventListener('click', handleBoardDropdownOutsideClick);
}

/**
 * Handle clicks outside board dropdown to close it
 * @param {Event} event - Click event
 */
function handleBoardDropdownOutsideClick(event) {
    const dropdown = document.getElementById('boardDropdown');
    const button = document.getElementById('currentBoardBtn');
    
    if (dropdown && button && !dropdown.contains(event.target) && !button.contains(event.target)) {
        closeBoardDropdown();
    }
}

/**
 * Filter boards in dropdown based on search input
 */
export function filterBoards() {
    const searchInput = document.getElementById('boardSearchInput');
    if (!searchInput) return; // Early return if element doesn't exist
    
    const searchTerm = searchInput.value.toLowerCase();
    const boardItems = document.querySelectorAll('.board-item');
    
    boardItems.forEach(item => {
        const boardName = item.textContent.toLowerCase();
        if (boardName.includes(searchTerm)) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
}

// ============================================
// TEMPLATES NAVIGATION
// ============================================

/**
 * Toggle templates menu dropdown
 */
export function toggleTemplatesMenu() {
    const dropdown = document.getElementById('templatesDropdown');
    const isOpen = !dropdown.classList.contains('hidden');
    
    // Close all other dropdowns first
    closeAllDropdowns();
    
    if (!isOpen) {
        dropdown.classList.remove('hidden');
        
        // Close when clicking outside
        setTimeout(() => {
            document.addEventListener('click', handleTemplatesOutsideClick);
        }, 0);
    }
}

/**
 * Close templates menu dropdown
 */
export function closeTemplatesMenu() {
    const dropdown = document.getElementById('templatesDropdown');
    if (dropdown) dropdown.classList.add('hidden');
    document.removeEventListener('click', handleTemplatesOutsideClick);
}

/**
 * Handle clicks outside templates dropdown
 * @param {Event} event - Click event
 */
function handleTemplatesOutsideClick(event) {
    const dropdown = document.getElementById('templatesDropdown');
    const button = document.getElementById('templatesBtn');
    
    if (!dropdown.contains(event.target) && !button.contains(event.target)) {
        closeTemplatesMenu();
    }
}

// ============================================
// BOARD EXPORT MENU
// ============================================

/**
 * Toggle board export menu dropdown
 */
export function toggleBoardExportMenu() {
    const dropdown = document.getElementById('boardExportDropdown');
    const isOpen = !dropdown.classList.contains('hidden');
    
    // Close all other dropdowns first
    closeAllDropdowns();
    
    if (!isOpen) {
        dropdown.classList.remove('hidden');
        
        // Close when clicking outside
        setTimeout(() => {
            document.addEventListener('click', handleBoardExportOutsideClick);
        }, 0);
    }
}

/**
 * Close board export menu dropdown
 */
export function closeBoardExportMenu() {
    const dropdown = document.getElementById('boardExportDropdown');
    if (dropdown) {
        dropdown.classList.add('hidden');
        document.removeEventListener('click', handleBoardExportOutsideClick);
    }
}

/**
 * Handle clicks outside board export dropdown
 * @param {Event} event - Click event
 */
function handleBoardExportOutsideClick(event) {
    const dropdown = document.getElementById('boardExportDropdown');
    const button = document.getElementById('boardExportBtn');
    
    if (dropdown && button && !dropdown.contains(event.target) && !button.contains(event.target)) {
        closeBoardExportMenu();
    }
}

// ============================================
// WEEKLY PLANNING NAVIGATION
// ============================================

/**
 * Navigate to previous or next week
 * @param {number} direction - -1 for previous, 1 for next
 */
export function navigateWeek(direction) {
    if (window.weeklyPlanning && window.weeklyPlanning.navigateWeek) {
        window.weeklyPlanning.navigateWeek(direction === -1 ? 'prev' : 'next');
    }
}

/**
 * Switch to weekly planning view
 */
export function switchToWeeklyView() {
    if (window.weeklyPlanning && window.weeklyPlanning.switchToWeeklyView) {
        window.weeklyPlanning.switchToWeeklyView();
    }
}

// ============================================
// DROPDOWN MANAGEMENT
// ============================================

/**
 * Close all open dropdowns
 */
export function closeAllDropdowns() {
    closeBoardDropdown();
    closeTemplatesMenu();
    closeBoardExportMenu();
    if (window.closeMoreMenu) window.closeMoreMenu();
}

// ============================================
// SETTINGS NAVIGATION
// ============================================

/**
 * Toggle board settings panel
 */
export function toggleSettings() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) {
        settingsPanel.classList.toggle('active');
    }
}

/**
 * Hide board settings panel
 */
export function hideSettings() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) {
        settingsPanel.classList.remove('active');
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get current active view
 * @returns {string} Current view ('board', 'tasks', 'weekly')
 */
export function getCurrentView() {
    const boardContainer = document.getElementById('boardContainer');
    const taskContainer = document.getElementById('taskContainer');
    const weeklyContainer = document.getElementById('weeklyContainer');
    const peopleContainer = document.getElementById('peopleContainer');
    
    if (boardContainer && !boardContainer.classList.contains('hidden')) {
        return 'board';
    } else if (taskContainer && !taskContainer.classList.contains('hidden')) {
        return 'tasks';
    } else if (weeklyContainer && !weeklyContainer.classList.contains('hidden')) {
        return 'weekly';
    } else if (peopleContainer && !peopleContainer.classList.contains('hidden')) {
        return 'people';
    }
    return 'board'; // default
}

/**
 * Initialize navigation system
 */
export function initializeNavigation() {
    // Initialize sidebar
    initializeSidebar();
    
    // Listen for data loaded event to trigger initial render
    window.addEventListener('gridflow-data-loaded', () => {
        console.log('Navigation: Data loaded, triggering board render');
        if (getCurrentView() === 'board' && window.renderBoard) {
            window.renderBoard();
        }
    });
    
    // Set default view
    switchToView('board');
    
    // Add global keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey || event.metaKey) {
            switch(event.key) {
                case '1':
                    event.preventDefault();
                    switchToView('board');
                    break;
                case '2':
                    event.preventDefault();
                    switchToView('tasks');
                    break;
                case '3':
                    event.preventDefault();
                    switchToView('weekly');
                    break;
            }
        }
        
        // ESC key to close dropdowns
        if (event.key === 'Escape') {
            closeAllDropdowns();
        }
    });
}

// Export all functions for global access
if (typeof window !== 'undefined') {
    // Make functions globally available for onclick handlers
    window.switchToView = switchToView;
    window.toggleSidebar = toggleSidebar;
    window.toggleBoardDropdown = toggleBoardDropdown;
    window.closeBoardDropdown = closeBoardDropdown;
    window.filterBoards = filterBoards;
    window.toggleTemplatesMenu = toggleTemplatesMenu;
    window.closeTemplatesMenu = closeTemplatesMenu;
    window.toggleBoardExportMenu = toggleBoardExportMenu;
    window.closeBoardExportMenu = closeBoardExportMenu;
    window.navigateWeek = navigateWeek;
    window.closeAllDropdowns = closeAllDropdowns;
    window.toggleSettings = toggleSettings;
    window.hideSettings = hideSettings;
}