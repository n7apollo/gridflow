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
    // Hide all containers
    document.getElementById('boardContainer').style.display = 'none';
    document.getElementById('taskContainer').style.display = 'none';
    document.getElementById('weeklyContainer').style.display = 'none';
    
    // Remove active class from all view buttons (header)
    document.getElementById('boardViewBtn').classList.remove('active');
    document.getElementById('taskViewBtn').classList.remove('active');
    document.getElementById('weeklyViewBtn').classList.remove('active');
    
    // Remove active class from sidebar nav links
    const sidebarLinks = document.querySelectorAll('.sidebar .nav-link');
    sidebarLinks.forEach(link => link.classList.remove('active'));
    
    // Show selected view and activate buttons
    if (view === 'board') {
        document.getElementById('boardContainer').style.display = 'block';
        document.getElementById('boardViewBtn').classList.add('active');
        document.getElementById('sidebarBoardView').classList.add('active');
        if (window.renderBoard) window.renderBoard();
    } else if (view === 'tasks') {
        document.getElementById('taskContainer').style.display = 'block';
        document.getElementById('taskViewBtn').classList.add('active');
        document.getElementById('sidebarTaskView').classList.add('active');
        if (window.populateTaskView) window.populateTaskView();
    } else if (view === 'weekly') {
        document.getElementById('weeklyContainer').style.display = 'block';
        document.getElementById('weeklyViewBtn').classList.add('active');
        document.getElementById('sidebarWeeklyView').classList.add('active');
        if (window.switchToWeeklyView) window.switchToWeeklyView();
    }
}

// ============================================
// SIDEBAR NAVIGATION
// ============================================

/**
 * Toggle sidebar visibility and collapsed state
 */
export function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    const toggleIcon = document.querySelector('.toggle-icon');
    
    if (window.innerWidth <= 600) {
        // Mobile: toggle sidebar visibility
        sidebar.classList.toggle('open');
    } else if (window.innerWidth <= 900) {
        // Tablet: sidebar is always collapsed but visible
        return;
    } else {
        // Desktop: toggle between full and collapsed
        if (sidebar.style.width === '64px') {
            sidebar.style.width = '260px';
            mainContent.style.marginLeft = '260px';
            toggleIcon.textContent = '‹';
        } else {
            sidebar.style.width = '64px';
            mainContent.style.marginLeft = '64px';
            toggleIcon.textContent = '›';
        }
    }
}

/**
 * Handle responsive sidebar behavior
 */
export function handleSidebarResize() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (window.innerWidth <= 600) {
        // Mobile: sidebar off-canvas
        sidebar.style.width = '';
        mainContent.style.marginLeft = '';
        sidebar.classList.remove('open');
    } else if (window.innerWidth <= 900) {
        // Tablet: collapsed sidebar
        sidebar.style.width = '';
        mainContent.style.marginLeft = '';
    } else {
        // Desktop: full sidebar (unless manually collapsed)
        if (sidebar.style.width !== '64px') {
            sidebar.style.width = '';
            mainContent.style.marginLeft = '';
        }
    }
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
    const isOpen = dropdown.style.display === 'block';
    
    if (isOpen) {
        closeBoardDropdown();
    } else {
        if (window.populateBoardDropdown) window.populateBoardDropdown();
        dropdown.style.display = 'block';
        
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
    dropdown.style.display = 'none';
    document.removeEventListener('click', handleBoardDropdownOutsideClick);
}

/**
 * Handle clicks outside board dropdown to close it
 * @param {Event} event - Click event
 */
function handleBoardDropdownOutsideClick(event) {
    const dropdown = document.getElementById('boardDropdown');
    const button = document.getElementById('currentBoardBtn');
    
    if (!dropdown.contains(event.target) && !button.contains(event.target)) {
        closeBoardDropdown();
    }
}

/**
 * Filter boards in dropdown based on search input
 */
export function filterBoards() {
    const searchInput = document.getElementById('boardSearchInput');
    const searchTerm = searchInput.value.toLowerCase();
    const boardItems = document.querySelectorAll('.board-item');
    
    boardItems.forEach(item => {
        const boardName = item.textContent.toLowerCase();
        if (boardName.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
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
    const isOpen = dropdown.style.display === 'block';
    
    // Close all other dropdowns first
    closeAllDropdowns();
    
    if (!isOpen) {
        dropdown.style.display = 'block';
        
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
    dropdown.style.display = 'none';
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
    const isOpen = dropdown.style.display === 'block';
    
    // Close all other dropdowns first
    closeAllDropdowns();
    
    if (!isOpen) {
        dropdown.style.display = 'block';
        
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
        dropdown.style.display = 'none';
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
    if (document.getElementById('boardContainer').style.display !== 'none') {
        return 'board';
    } else if (document.getElementById('taskContainer').style.display !== 'none') {
        return 'tasks';
    } else if (document.getElementById('weeklyContainer').style.display !== 'none') {
        return 'weekly';
    }
    return 'board'; // default
}

/**
 * Initialize navigation system
 */
export function initializeNavigation() {
    // Initialize sidebar
    initializeSidebar();
    
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