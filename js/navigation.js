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
 * Switch between different views (board, tasks, weekly, notes, people, collections, tags, settings)
 * @param {string} view - View to switch to ('board', 'tasks', 'weekly', 'notes', 'people', 'collections', 'tags', 'settings')
 */
export function switchToView(view) {
    // Hide all containers using CSS classes
    const boardContainer = document.getElementById('boardContainer');
    const taskContainer = document.getElementById('taskContainer');
    const weeklyContainer = document.getElementById('weeklyContainer');
    const notesContainer = document.getElementById('notesContainer');
    const peopleContainer = document.getElementById('peopleContainer');
    const collectionsContainer = document.getElementById('collectionsContainer');
    const tagsContainer = document.getElementById('tagsContainer');
    const settingsContainer = document.getElementById('settingsContainer');
    
    if (boardContainer) boardContainer.classList.add('hidden');
    if (taskContainer) taskContainer.classList.add('hidden');
    if (weeklyContainer) weeklyContainer.classList.add('hidden');
    if (notesContainer) notesContainer.classList.add('hidden');
    if (peopleContainer) peopleContainer.classList.add('hidden');
    if (collectionsContainer) collectionsContainer.classList.add('hidden');
    if (tagsContainer) tagsContainer.classList.add('hidden');
    if (settingsContainer) settingsContainer.classList.add('hidden');
    
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
    } else if (view === 'notes') {
        if (notesContainer) notesContainer.classList.remove('hidden');
        const sidebarNotesView = document.getElementById('sidebarNotesView');
        if (sidebarNotesView) sidebarNotesView.classList.add('active');
        if (window.notesManager && window.notesManager.initialize) {
            window.notesManager.initialize().catch(error => {
                console.error('Error initializing notes view:', error);
                if (window.showStatusMessage) {
                    window.showStatusMessage('Error loading notes view', 'error');
                }
            });
        }
    } else if (view === 'people') {
        if (peopleContainer) peopleContainer.classList.remove('hidden');
        const sidebarPeopleView = document.getElementById('sidebarPeopleView');
        if (sidebarPeopleView) sidebarPeopleView.classList.add('active');
        if (window.switchToPeopleView) {
            // Call async function without blocking
            window.switchToPeopleView().catch(error => {
                console.error('Error switching to people view:', error);
                if (window.showStatusMessage) {
                    window.showStatusMessage('Error loading people view', 'error');
                }
            });
        }
    } else if (view === 'collections') {
        if (collectionsContainer) collectionsContainer.classList.remove('hidden');
        const sidebarCollectionsView = document.getElementById('sidebarCollectionsView');
        if (sidebarCollectionsView) sidebarCollectionsView.classList.add('active');
        if (window.initializeCollectionsView) window.initializeCollectionsView();
    } else if (view === 'tags') {
        if (tagsContainer) tagsContainer.classList.remove('hidden');
        const sidebarTagsView = document.getElementById('sidebarTagsView');
        if (sidebarTagsView) sidebarTagsView.classList.add('active');
        if (window.initializeTagsView) window.initializeTagsView();
    } else if (view === 'settings') {
        if (settingsContainer) settingsContainer.classList.remove('hidden');
        const sidebarSettingsView = document.getElementById('sidebarSettingsView');
        if (sidebarSettingsView) sidebarSettingsView.classList.add('active');
        // Initialize the Dexie Cloud UI when settings view is opened
        if (window.initializeDexieCloudUI) window.initializeDexieCloudUI();
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
    const button = document.getElementById('currentBoardBtn');
    const dropdownContainer = button ? button.closest('.dropdown') : null;
    const dropdown = document.getElementById('boardDropdown');
    if (!dropdown || !dropdownContainer) return;
    
    // Check if app data is available
    const appData = window.appData;
    if (!appData || !appData.boards) {
        console.warn('toggleBoardDropdown: App data not available yet');
        if (window.showStatusMessage) {
            window.showStatusMessage('Loading boards...', 'info');
        }
        return;
    }
    
    // For DaisyUI dropdowns, we use the dropdown-open class
    const isOpen = dropdownContainer.classList.contains('dropdown-open');
    
    if (isOpen) {
        closeBoardDropdown();
    } else {
        // Populate dropdown with board list
        if (window.populateBoardDropdown) {
            window.populateBoardDropdown();
        } else {
            // Fallback to populate boards directly
            populateBoardList();
        }
        
        // Open the dropdown using DaisyUI classes
        dropdownContainer.classList.add('dropdown-open');
        
        // Focus search input and add event listener
        const searchInput = document.getElementById('boardSearchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.value = '';
            
            // Remove existing event listener and add new one
            searchInput.removeEventListener('input', filterBoards);
            searchInput.addEventListener('input', filterBoards);
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
    const button = document.getElementById('currentBoardBtn');
    const dropdownContainer = button ? button.closest('.dropdown') : null;
    if (dropdownContainer) {
        dropdownContainer.classList.remove('dropdown-open');
    }
    document.removeEventListener('click', handleBoardDropdownOutsideClick);
}

/**
 * Handle clicks outside board dropdown to close it
 * @param {Event} event - Click event
 */
function handleBoardDropdownOutsideClick(event) {
    const button = document.getElementById('currentBoardBtn');
    const dropdownContainer = button ? button.closest('.dropdown') : null;
    
    if (dropdownContainer && !dropdownContainer.contains(event.target)) {
        closeBoardDropdown();
    }
}

/**
 * Populate board list in dropdown (fallback function)
 */
function populateBoardList() {
    const appData = window.appData;
    if (!appData || !appData.boards) return;
    
    const boardList = document.getElementById('boardList');
    if (!boardList) return;
    
    boardList.innerHTML = '';
    
    const boardEntries = Object.entries(appData.boards);
    boardEntries.forEach(([boardId, board]) => {
        const item = document.createElement('div');
        item.className = `board-item p-2 hover:bg-base-200 rounded cursor-pointer ${boardId === appData.currentBoardId ? 'bg-base-200' : ''}`;
        
        const rowCount = board.rows ? board.rows.length : 0;
        const cardCount = board.rows ? board.rows.reduce((total, row) => {
            return total + Object.values(row.cards || {}).reduce((rowTotal, cards) => rowTotal + cards.length, 0);
        }, 0) : 0;
        
        item.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <div class="font-medium">${board.name}</div>
                    <div class="text-xs text-base-content/60">${rowCount} rows • ${cardCount} cards</div>
                </div>
                ${boardId === appData.currentBoardId ? '<span class="badge badge-primary badge-sm">Current</span>' : ''}
            </div>
        `;
        
        if (boardId !== appData.currentBoardId) {
            item.addEventListener('click', () => {
                if (window.switchBoard) {
                    window.switchBoard(boardId);
                    closeBoardDropdown();
                }
            });
        }
        
        boardList.appendChild(item);
    });
}

/**
 * Filter boards in dropdown based on search input
 */
export function filterBoards() {
    const searchInput = document.getElementById('boardSearchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const boardItems = document.querySelectorAll('#boardList .board-item');
    
    boardItems.forEach(item => {
        const boardName = item.textContent.toLowerCase();
        if (boardName.includes(searchTerm)) {
            item.style.display = '';
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
    const button = document.getElementById('templatesBtn');
    const dropdownContainer = button ? button.closest('.dropdown') : null;
    const dropdown = document.getElementById('templatesDropdown');
    
    if (!dropdown || !dropdownContainer) return;
    
    const isOpen = dropdownContainer.classList.contains('dropdown-open');
    
    // Close all other dropdowns first
    closeAllDropdowns();
    
    if (!isOpen) {
        dropdownContainer.classList.add('dropdown-open');
        
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
    const button = document.getElementById('templatesBtn');
    const dropdownContainer = button ? button.closest('.dropdown') : null;
    if (dropdownContainer) {
        dropdownContainer.classList.remove('dropdown-open');
    }
    document.removeEventListener('click', handleTemplatesOutsideClick);
}

/**
 * Handle clicks outside templates dropdown
 * @param {Event} event - Click event
 */
function handleTemplatesOutsideClick(event) {
    const button = document.getElementById('templatesBtn');
    const dropdownContainer = button ? button.closest('.dropdown') : null;
    
    if (dropdownContainer && !dropdownContainer.contains(event.target)) {
        closeTemplatesMenu();
    }
}

// ============================================
// MORE MENU (REPLACED BOARD EXPORT MENU)
// ============================================

/**
 * Toggle more menu dropdown
 */
export function toggleMoreMenu() {
    const button = event.target.closest('button');
    const dropdownContainer = button ? button.closest('.dropdown') : null;
    
    if (!dropdownContainer) return;
    
    const isOpen = dropdownContainer.classList.contains('dropdown-open');
    
    if (isOpen) {
        dropdownContainer.classList.remove('dropdown-open');
    } else {
        // Close all other dropdowns first
        closeAllDropdowns();
        dropdownContainer.classList.add('dropdown-open');
        
        // Close when clicking outside
        setTimeout(() => {
            document.addEventListener('click', handleMoreMenuOutsideClick);
        }, 0);
    }
}

/**
 * Close more menu dropdown
 */
export function closeMoreMenu() {
    // Close all dropdown-open classes since we might have multiple more menus
    document.querySelectorAll('.dropdown.dropdown-open').forEach(dropdown => {
        dropdown.classList.remove('dropdown-open');
    });
    document.removeEventListener('click', handleMoreMenuOutsideClick);
}

/**
 * Handle clicks outside more menu dropdown
 * @param {Event} event - Click event
 */
function handleMoreMenuOutsideClick(event) {
    const clickedDropdown = event.target.closest('.dropdown');
    if (!clickedDropdown) {
        closeMoreMenu();
    }
}

// Legacy functions for backward compatibility
export function toggleBoardExportMenu() {
    // Redirect to more menu functionality
    toggleMoreMenu();
}

export function closeBoardExportMenu() {
    closeMoreMenu();
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
    // Close all DaisyUI dropdowns by removing dropdown-open class
    document.querySelectorAll('.dropdown.dropdown-open').forEach(dropdown => {
        dropdown.classList.remove('dropdown-open');
    });
    
    // Remove all event listeners
    document.removeEventListener('click', handleBoardDropdownOutsideClick);
    document.removeEventListener('click', handleTemplatesOutsideClick);
    document.removeEventListener('click', handleMoreMenuOutsideClick);
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
        settingsPanel.classList.toggle('hidden');
        // Close the more menu when settings are toggled
        closeMoreMenu();
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
 * @returns {string} Current view ('board', 'tasks', 'weekly', 'people', 'collections', 'tags')
 */
export function getCurrentView() {
    const boardContainer = document.getElementById('boardContainer');
    const taskContainer = document.getElementById('taskContainer');
    const weeklyContainer = document.getElementById('weeklyContainer');
    const peopleContainer = document.getElementById('peopleContainer');
    const collectionsContainer = document.getElementById('collectionsContainer');
    const tagsContainer = document.getElementById('tagsContainer');
    
    if (boardContainer && !boardContainer.classList.contains('hidden')) {
        return 'board';
    } else if (taskContainer && !taskContainer.classList.contains('hidden')) {
        return 'tasks';
    } else if (weeklyContainer && !weeklyContainer.classList.contains('hidden')) {
        return 'weekly';
    } else if (peopleContainer && !peopleContainer.classList.contains('hidden')) {
        return 'people';
    } else if (collectionsContainer && !collectionsContainer.classList.contains('hidden')) {
        return 'collections';
    } else if (tagsContainer && !tagsContainer.classList.contains('hidden')) {
        return 'tags';
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
    window.toggleMoreMenu = toggleMoreMenu;
    window.closeMoreMenu = closeMoreMenu;
    window.navigateWeek = navigateWeek;
    window.closeAllDropdowns = closeAllDropdowns;
    window.toggleSettings = toggleSettings;
    window.hideSettings = hideSettings;
}