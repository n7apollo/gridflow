// UI Management Module
// Handles all UI-related functions including modals, menus, navigation, and settings

// ============================================
// MODAL MANAGEMENT
// ============================================

function closeModal() {
    const cardModal = document.getElementById('cardModal');
    if (cardModal) cardModal.classList.remove('modal-open');
    if (window.coreData && window.coreData.setCurrentEditingCard) {
        window.coreData.setCurrentEditingCard(null);
    }
}

// ============================================
// SETTINGS MODAL MANAGEMENT
// ============================================

function showSettingsModal() {
    console.log('showSettingsModal called');
    const modal = document.getElementById('settingsModal');
    if (modal) {
        console.log('Settings modal found, opening...');
        modal.classList.add('modal-open');
        
        // Render content for all tabs
        if (window.renderColumnsListModal) window.renderColumnsListModal();
        if (window.renderGroupsListModal) window.renderGroupsListModal();
        updateModalSettingsUI();
        if (window.updateBoardInfo) window.updateBoardInfo();
        
        // Check if mobile and initialize accordingly
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            // Start with tab list on mobile
            showMobileTabList();
        } else {
            // Show first tab by default on desktop
            switchTab('columns');
        }
    } else {
        console.error('Settings modal not found!');
    }
}

function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.remove('modal-open');
    } else {
        console.warn('Settings modal not found');
    }
}

function switchTab(tabName) {
    // Check if we're on mobile
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Mobile navigation - show specific tab content
        showMobileTabContent(tabName);
    } else {
        // Desktop navigation - traditional tab switching
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add null checks to prevent errors
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        const tabContent = document.getElementById(`${tabName}-tab`);
        
        if (tabButton) {
            tabButton.classList.add('active');
        } else {
            console.warn(`Tab button not found for: ${tabName}`);
        }
        
        if (tabContent) {
            tabContent.classList.add('active');
        } else {
            console.warn(`Tab content not found for: ${tabName}-tab`);
        }
    }
}

function showMobileTabContent(tabName) {
    const settingsTabs = document.querySelector('.settings-tabs');
    const contentArea = document.querySelector('.settings-content-area');
    
    // Hide tab list and show content area (with null checks)
    if (settingsTabs) {
        settingsTabs.classList.add('mobile-hidden');
    }
    if (contentArea) {
        contentArea.classList.add('mobile-active');
    }
    
    // Show only the selected tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('mobile-current');
    });
    
    const targetTabContent = document.getElementById(`${tabName}-tab`);
    if (targetTabContent) {
        targetTabContent.classList.add('mobile-current');
    } else {
        console.warn(`Mobile tab content not found for: ${tabName}-tab`);
    }
    
    // Update active tab button
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    const activeTabButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTabButton) {
        activeTabButton.classList.add('active');
    } else {
        console.warn(`Mobile tab button not found for: ${tabName}`);
    }
}

function showMobileTabList() {
    const settingsTabs = document.querySelector('.settings-tabs');
    const contentArea = document.querySelector('.settings-content-area');
    
    // Show tab list and hide content area (with null checks)
    if (settingsTabs) {
        settingsTabs.classList.remove('mobile-hidden');
    }
    if (contentArea) {
        contentArea.classList.remove('mobile-active');
    }
    
    // Clear current mobile content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('mobile-current');
    });
}

// Handle window resize to switch between mobile and desktop modes
function handleSettingsResize() {
    const modal = document.getElementById('settingsModal');
    if (!modal.classList.contains('modal-open')) return;
    
    const isMobile = window.innerWidth <= 768;
    const settingsTabs = document.querySelector('.settings-tabs');
    const contentArea = document.querySelector('.settings-content-area');
    
    if (!isMobile) {
        // Switch to desktop mode
        settingsTabs.classList.remove('mobile-hidden');
        contentArea.classList.remove('mobile-active');
        
        // Reset mobile classes
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('mobile-current');
        });
        
        // Apply desktop active states
        const activeButton = document.querySelector('.tab-button.active');
        if (activeButton) {
            const tabName = activeButton.dataset.tab;
            document.getElementById(`${tabName}-tab`).classList.add('active');
        }
    } else {
        // Switch to mobile mode - show tab list by default
        showMobileTabList();
    }
}

// ============================================
// SETTINGS UI MANAGEMENT
// ============================================

function toggleCheckboxes() {
    // Handle both old and new checkboxes
    const oldCheckbox = document.getElementById('showCheckboxes');
    const modalCheckbox = document.getElementById('showCheckboxesModal');
    
    let checked = false;
    if (oldCheckbox && oldCheckbox.checked !== undefined) {
        checked = oldCheckbox.checked;
    } else if (modalCheckbox && modalCheckbox.checked !== undefined) {
        checked = modalCheckbox.checked;
    }
    
    // Access boardData through coreData module
    const boardData = window.coreData ? window.coreData.getBoardData() : null;
    if (boardData) {
        boardData.settings.showCheckboxes = checked;
    }
    
    // Sync both checkboxes
    if (oldCheckbox) oldCheckbox.checked = checked;
    if (modalCheckbox) modalCheckbox.checked = checked;
    
    if (window.renderBoard) window.renderBoard();
}

function toggleSubtaskProgress() {
    // Handle both old and new checkboxes
    const oldCheckbox = document.getElementById('showSubtaskProgress');
    const modalCheckbox = document.getElementById('showSubtaskProgressModal');
    
    let checked = false;
    if (oldCheckbox && oldCheckbox.checked !== undefined) {
        checked = oldCheckbox.checked;
    } else if (modalCheckbox && modalCheckbox.checked !== undefined) {
        checked = modalCheckbox.checked;
    }
    
    // Access boardData through coreData module
    const boardData = window.coreData ? window.coreData.getBoardData() : null;
    if (boardData) {
        boardData.settings.showSubtaskProgress = checked;
    }
    
    // Sync both checkboxes
    if (oldCheckbox) oldCheckbox.checked = checked;
    if (modalCheckbox) modalCheckbox.checked = checked;
    
    if (window.renderBoard) window.renderBoard();
}

function updateSettingsUI() {
    const checkbox = document.getElementById('showCheckboxes');
    const boardData = window.coreData ? window.coreData.getBoardData() : null;
    
    if (checkbox && boardData) {
        checkbox.checked = boardData.settings.showCheckboxes;
    }
    
    const subtaskCheckbox = document.getElementById('showSubtaskProgress');
    if (subtaskCheckbox && boardData) {
        subtaskCheckbox.checked = boardData.settings.showSubtaskProgress;
    }
    
    // Update templates UI
    if (window.updateTemplatesUI) {
        window.updateTemplatesUI();
    }
}

function updateModalSettingsUI() {
    const checkboxModal = document.getElementById('showCheckboxesModal');
    const boardData = window.coreData ? window.coreData.getBoardData() : null;
    
    if (checkboxModal && boardData) {
        checkboxModal.checked = boardData.settings.showCheckboxes;
    }
    
    const subtaskCheckboxModal = document.getElementById('showSubtaskProgressModal');
    if (subtaskCheckboxModal && boardData) {
        subtaskCheckboxModal.checked = boardData.settings.showSubtaskProgress;
    }
}

// ============================================
// DROPDOWN MENU MANAGEMENT
// ============================================

function toggleMoreMenu() {
    const dropdown = document.getElementById('moreDropdown');
    const button = document.getElementById('moreBtn');
    
    if (dropdown.classList.contains('active')) {
        closeMoreMenu();
    } else {
        closeAllDropdowns();
        dropdown.classList.add('active');
        button.classList.add('active');
    }
}

function closeMoreMenu() {
    const dropdown = document.getElementById('moreDropdown');
    const button = document.getElementById('moreBtn');
    
    dropdown.classList.remove('active');
    button.classList.remove('active');
}

function closeAllDropdowns() {
    // Access functions from navigation module via window object
    if (window.navigation?.closeBoardDropdown) {
        window.navigation.closeBoardDropdown();
    }
    if (window.navigation?.closeTemplatesMenu) {
        window.navigation.closeTemplatesMenu();
    }
    closeMoreMenu();
}

// ============================================
// MOBILE MENU MANAGEMENT
// ============================================

function toggleMobileMenu() {
    const overlay = document.getElementById('mobileMenuOverlay');
    const menu = document.getElementById('mobileMenu');
    const button = document.getElementById('mobileMenuBtn');
    
    // Early return if elements don't exist
    if (!menu || !overlay || !button) return;
    
    if (menu.classList.contains('active')) {
        closeMobileMenu();
    } else {
        overlay.classList.add('active');
        menu.classList.add('active');
        button.classList.add('active');
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }
}

function closeMobileMenu() {
    const overlay = document.getElementById('mobileMenuOverlay');
    const menu = document.getElementById('mobileMenu');
    const button = document.getElementById('mobileMenuBtn');
    
    if (overlay) overlay.classList.remove('active');
    if (menu) menu.classList.remove('active');
    if (button) button.classList.remove('active');
    
    // Restore body scroll
    document.body.style.overflow = '';
}

// ============================================
// ENHANCED NAVIGATION MANAGEMENT
// ============================================

function initializeEnhancedNavigation() {
    // Update current board display
    if (window.updateCurrentBoardDisplay) {
        window.updateCurrentBoardDisplay();
    }
    
    // Add click outside listeners to close dropdowns
    document.addEventListener('click', function(event) {
        const boardSelector = document.querySelector('.board-selector-enhanced');
        const templatesMenu = document.querySelector('.templates-menu');
        const moreMenu = document.querySelector('.more-menu');
        
        // Close board dropdown if clicked outside
        if (boardSelector && !boardSelector.contains(event.target)) {
            if (window.navigation?.closeBoardDropdown) {
                window.navigation.closeBoardDropdown();
            }
        }
        
        // Close templates dropdown if clicked outside
        if (templatesMenu && !templatesMenu.contains(event.target)) {
            if (window.navigation?.closeTemplatesMenu) {
                window.navigation.closeTemplatesMenu();
            }
        }
        
        // Close more dropdown if clicked outside
        if (moreMenu && !moreMenu.contains(event.target)) {
            closeMoreMenu();
        }
    });
    
    // Add keyboard navigation
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeAllDropdowns();
            closeMobileMenu();
        }
    });
    
    // Ensure mobile menu closes on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    });
}

// ============================================
// WEEKLY PLANNING UI MANAGEMENT
// ============================================

function cancelGoalEdit() {
    const goalText = document.getElementById('weeklyGoalText');
    const goalForm = document.getElementById('weeklyGoalForm');
    
    if (goalForm) goalForm.style.display = 'none';
    if (goalText) goalText.style.display = 'block';
}

function addDailyItem(day) {
    // Set current editing item through coreData module
    if (window.coreData && window.coreData.setCurrentEditingWeeklyItem) {
        window.coreData.setCurrentEditingWeeklyItem({ day: day });
    }
    
    // Update modal title with null check
    const modalTitle = document.getElementById('weeklyItemModalTitle');
    if (modalTitle) {
        modalTitle.textContent = `Add ${day.charAt(0).toUpperCase() + day.slice(1)} Item`;
    }
    
    // Reset form with null check
    const form = document.getElementById('weeklyItemForm');
    if (form) {
        form.reset();
    }
    
    // Set default note type with null check
    const noteRadio = document.querySelector('input[value="note"]');
    if (noteRadio) {
        noteRadio.checked = true;
    } else {
        console.warn('Note radio button not found');
    }
    
    showItemForm('note');
    
    // Show modal with null check
    const modal = document.getElementById('weeklyItemModal');
    if (modal) {
        modal.style.display = 'block';
    } else {
        console.warn('Weekly item modal not found');
    }
}

function showItemForm(type) {
    // Hide all forms with null checks
    const noteForm = document.getElementById('noteForm');
    const checklistForm = document.getElementById('checklistForm');
    const cardForm = document.getElementById('cardForm');
    
    if (noteForm) noteForm.style.display = 'none';
    if (checklistForm) checklistForm.style.display = 'none';
    if (cardForm) cardForm.style.display = 'none';
    
    // Show selected form with null checks
    if (type === 'note' && noteForm) {
        noteForm.style.display = 'block';
    } else if (type === 'checklist' && checklistForm) {
        checklistForm.style.display = 'block';
    } else if (type === 'card' && cardForm) {
        cardForm.style.display = 'block';
        if (window.populateCardOptions) window.populateCardOptions();
    }
}

function toggleChecklistItem(itemId, checkIndex) {
    const appData = window.coreData ? window.coreData.getAppData() : null;
    const currentWeekKey = window.coreData ? window.coreData.getCurrentWeekKey() : null;
    
    if (!appData || !currentWeekKey) return;
    
    const currentPlan = appData.weeklyPlans[currentWeekKey];
    if (!currentPlan) return;
    
    const item = currentPlan.items.find(i => i.id === itemId);
    if (!item) return;
    
    if (item.type === 'checklist' && item.checklist && item.checklist[checkIndex]) {
        item.checklist[checkIndex].completed = !item.checklist[checkIndex].completed;
        if (window.coreData && window.coreData.saveData) {
            window.coreData.saveData();
        }
        if (window.renderWeeklyPlan) {
            window.renderWeeklyPlan();
        }
    }
}

// ============================================
// INITIALIZATION
// ============================================

// Add resize listener for settings modal
window.addEventListener('resize', handleSettingsResize);

// Initialize enhanced navigation on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // Add a small delay to ensure other initialization is complete
    setTimeout(initializeEnhancedNavigation, 100);
});

// Item type form switching event listener
document.addEventListener('change', function(e) {
    if (e.target.name === 'itemType') {
        showItemForm(e.target.value);
    }
});

// Export UI management functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        closeModal,
        showSettingsModal,
        closeSettingsModal,
        switchTab,
        showMobileTabContent,
        showMobileTabList,
        handleSettingsResize,
        toggleCheckboxes,
        toggleSubtaskProgress,
        updateSettingsUI,
        updateModalSettingsUI,
        toggleMoreMenu,
        closeMoreMenu,
        closeAllDropdowns,
        toggleMobileMenu,
        closeMobileMenu,
        initializeEnhancedNavigation,
        cancelGoalEdit,
        addDailyItem,
        showItemForm,
        toggleChecklistItem
    };
}

// Generic modal close functions
function closeTaskModal() {
    const modal = document.getElementById('taskModal');
    if (modal) modal.classList.remove('modal-open');
}

function closeBoardModal() {
    const modal = document.getElementById('boardModal');
    if (modal) modal.classList.remove('modal-open');
}

function closeBoardEditModal() {
    const modal = document.getElementById('boardEditModal');
    if (modal) modal.classList.remove('modal-open');
}

function closeExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) modal.classList.remove('modal-open');
}

// Make functions globally available for onclick handlers
if (typeof window !== 'undefined') {
    window.updateSettingsUI = updateSettingsUI;
    window.closeSettingsModal = closeSettingsModal;
    window.showSettingsModal = showSettingsModal;
    window.closeModal = closeModal;
    window.closeTaskModal = closeTaskModal;
    window.closeBoardModal = closeBoardModal;
    window.closeBoardEditModal = closeBoardEditModal;
    window.closeExportModal = closeExportModal;
    window.addDailyItem = addDailyItem;
    window.showItemForm = showItemForm;
    window.toggleChecklistItem = toggleChecklistItem;
    window.cancelGoalEdit = cancelGoalEdit;
}