// UI Management Module
// Handles all UI-related functions including modals, menus, navigation, and settings

// ============================================
// MODAL MANAGEMENT
// ============================================

function closeModal() {
    document.getElementById('cardModal').style.display = 'none';
    currentEditingCard = null;
}

// ============================================
// SETTINGS MODAL MANAGEMENT
// ============================================

function showSettingsModal() {
    const modal = document.getElementById('settingsModal');
    modal.style.display = 'block';
    
    // Render content for all tabs
    renderColumnsListModal();
    renderGroupsListModal();
    updateModalSettingsUI();
    updateBoardInfo();
    
    // Check if mobile and initialize accordingly
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        // Start with tab list on mobile
        showMobileTabList();
    } else {
        // Show first tab by default on desktop
        switchTab('columns');
    }
}

function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
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
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }
}

function showMobileTabContent(tabName) {
    const settingsTabs = document.querySelector('.settings-tabs');
    const contentArea = document.querySelector('.settings-content-area');
    
    // Hide tab list and show content area
    settingsTabs.classList.add('mobile-hidden');
    contentArea.classList.add('mobile-active');
    
    // Show only the selected tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('mobile-current');
    });
    document.getElementById(`${tabName}-tab`).classList.add('mobile-current');
    
    // Update active tab button
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

function showMobileTabList() {
    const settingsTabs = document.querySelector('.settings-tabs');
    const contentArea = document.querySelector('.settings-content-area');
    
    // Show tab list and hide content area
    settingsTabs.classList.remove('mobile-hidden');
    contentArea.classList.remove('mobile-active');
    
    // Clear current mobile content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('mobile-current');
    });
}

// Handle window resize to switch between mobile and desktop modes
function handleSettingsResize() {
    const modal = document.getElementById('settingsModal');
    if (modal.style.display !== 'block') return;
    
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
    
    boardData.settings.showCheckboxes = checked;
    
    // Sync both checkboxes
    if (oldCheckbox) oldCheckbox.checked = checked;
    if (modalCheckbox) modalCheckbox.checked = checked;
    
    renderBoard();
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
    
    boardData.settings.showSubtaskProgress = checked;
    
    // Sync both checkboxes
    if (oldCheckbox) oldCheckbox.checked = checked;
    if (modalCheckbox) modalCheckbox.checked = checked;
    
    renderBoard();
}

function updateSettingsUI() {
    const checkbox = document.getElementById('showCheckboxes');
    if (checkbox) {
        checkbox.checked = boardData.settings.showCheckboxes;
    }
    
    const subtaskCheckbox = document.getElementById('showSubtaskProgress');
    if (subtaskCheckbox) {
        subtaskCheckbox.checked = boardData.settings.showSubtaskProgress;
    }
    
    // Update templates UI
    updateTemplatesUI();
}

function updateModalSettingsUI() {
    const checkboxModal = document.getElementById('showCheckboxesModal');
    if (checkboxModal) {
        checkboxModal.checked = boardData.settings.showCheckboxes;
    }
    
    const subtaskCheckboxModal = document.getElementById('showSubtaskProgressModal');
    if (subtaskCheckboxModal) {
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
    closeBoardDropdown();
    closeTemplatesMenu();
    closeMoreMenu();
}

// ============================================
// MOBILE MENU MANAGEMENT
// ============================================

function toggleMobileMenu() {
    const overlay = document.getElementById('mobileMenuOverlay');
    const menu = document.getElementById('mobileMenu');
    const button = document.getElementById('mobileMenuBtn');
    
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
    
    overlay.classList.remove('active');
    menu.classList.remove('active');
    button.classList.remove('active');
    
    // Restore body scroll
    document.body.style.overflow = '';
}

// ============================================
// ENHANCED NAVIGATION MANAGEMENT
// ============================================

function initializeEnhancedNavigation() {
    // Update current board display
    updateCurrentBoardDisplay();
    
    // Add click outside listeners to close dropdowns
    document.addEventListener('click', function(event) {
        const boardSelector = document.querySelector('.board-selector-enhanced');
        const templatesMenu = document.querySelector('.templates-menu');
        const moreMenu = document.querySelector('.more-menu');
        
        // Close board dropdown if clicked outside
        if (!boardSelector.contains(event.target)) {
            closeBoardDropdown();
        }
        
        // Close templates dropdown if clicked outside
        if (!templatesMenu.contains(event.target)) {
            closeTemplatesMenu();
        }
        
        // Close more dropdown if clicked outside
        if (!moreMenu.contains(event.target)) {
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
    
    goalForm.style.display = 'none';
    goalText.style.display = 'block';
}

function addDailyItem(day) {
    currentEditingWeeklyItem = { day: day };
    document.getElementById('weeklyItemModalTitle').textContent = `Add ${day.charAt(0).toUpperCase() + day.slice(1)} Item`;
    
    // Reset form
    document.getElementById('weeklyItemForm').reset();
    document.querySelector('input[value="note"]').checked = true;
    showItemForm('note');
    
    document.getElementById('weeklyItemModal').style.display = 'block';
}

function showItemForm(type) {
    // Hide all forms
    document.getElementById('noteForm').style.display = 'none';
    document.getElementById('checklistForm').style.display = 'none';
    document.getElementById('cardForm').style.display = 'none';
    
    // Show selected form
    if (type === 'note') {
        document.getElementById('noteForm').style.display = 'block';
    } else if (type === 'checklist') {
        document.getElementById('checklistForm').style.display = 'block';
    } else if (type === 'card') {
        document.getElementById('cardForm').style.display = 'block';
        populateCardOptions();
    }
}

function toggleChecklistItem(itemId, checkIndex) {
    const currentPlan = appData.weeklyPlans[currentWeekKey];
    if (!currentPlan) return;
    
    const item = currentPlan.items.find(i => i.id === itemId);
    if (!item) return;
    
    if (item.type === 'checklist' && item.checklist && item.checklist[checkIndex]) {
        item.checklist[checkIndex].completed = !item.checklist[checkIndex].completed;
        saveData();
        renderWeeklyPlan();
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

// Make functions globally available for onclick handlers
if (typeof window !== 'undefined') {
    window.updateSettingsUI = updateSettingsUI;
    window.closeSettingsModal = closeSettingsModal;
    window.showSettingsModal = showSettingsModal;
}