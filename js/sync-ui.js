/**
 * GridFlow Sync UI Management
 * Handles UI interactions for cloud sync functionality
 */

import { cloudSync } from './cloud-sync.js';
import { showStatusMessage } from './utilities.js';

/**
 * Configure sync API key from settings modal
 */
export async function configureSyncApiKey() {
    const apiKeyInput = document.getElementById('syncApiKey');
    const planSelect = document.getElementById('syncPlanType');
    
    if (!apiKeyInput || !planSelect) {
        showStatusMessage('Settings form not found', 'error');
        return;
    }
    
    const apiKey = apiKeyInput.value.trim();
    const planType = planSelect.value;
    
    if (!apiKey) {
        showStatusMessage('Please enter your API key', 'error');
        return;
    }
    
    try {
        cloudSync.setApiKey(apiKey, planType);
        
        // Clear the input for security
        apiKeyInput.value = '';
        
        // Enable auto-sync by default
        const autoSyncCheckbox = document.getElementById('autoSyncEnabled');
        if (autoSyncCheckbox) {
            autoSyncCheckbox.checked = true;
            cloudSync.updateSyncSettings({ autoSync: true });
            cloudSync.enable();
            cloudSync.startAutoSync();
        }
        
        // Refresh the status display
        refreshSyncStatus();
        
        // Perform initial sync to establish cloud storage
        try {
            await cloudSync.performFullSync();
        } catch (syncError) {
            console.warn('Initial sync failed, but configuration was successful:', syncError);
            showStatusMessage('Cloud sync configured! Initial sync will happen automatically.', 'success');
            return;
        }
        
        showStatusMessage('Cloud sync configured and synced successfully!', 'success');
    } catch (error) {
        console.error('Failed to configure sync:', error);
        showStatusMessage(`Configuration failed: ${error.message}`, 'error');
    }
}

/**
 * Update sync plan type
 */
export function updateSyncPlan() {
    const planSelect = document.getElementById('syncPlanType');
    if (!planSelect) return;
    
    const planType = planSelect.value;
    cloudSync.updateSyncSettings({ tier: planType });
    cloudSync.currentLimits = cloudSync.limits[planType];
    
    refreshSyncStatus();
    showStatusMessage(`Updated to ${planType} plan`, 'info');
}

/**
 * Toggle automatic sync
 */
export function toggleAutoSync() {
    const checkbox = document.getElementById('autoSyncEnabled');
    if (!checkbox) return;
    
    const enabled = checkbox.checked;
    cloudSync.updateSyncSettings({ autoSync: enabled });
    
    if (enabled && cloudSync.isEnabled) {
        cloudSync.startAutoSync();
        showStatusMessage('Auto-sync enabled', 'success');
    } else {
        cloudSync.stopAutoSync();
        showStatusMessage('Auto-sync disabled', 'info');
    }
    
    refreshSyncStatus();
}

/**
 * Perform manual sync
 */
export async function manualSync() {
    try {
        const button = document.querySelector('[data-action="manualSync"]');
        if (button) {
            button.disabled = true;
            button.textContent = '🔄 Syncing...';
        }
        
        await cloudSync.performFullSync();
        refreshSyncStatus();
        
        if (button) {
            button.disabled = false;
            button.textContent = '🔄 Sync Now';
        }
    } catch (error) {
        console.error('Manual sync failed:', error);
        
        const button = document.querySelector('[data-action="manualSync"]');
        if (button) {
            button.disabled = false;
            button.textContent = '🔄 Sync Now';
        }
        
        refreshSyncStatus();
    }
}

/**
 * Refresh sync status display
 */
export function refreshSyncStatus() {
    if (!cloudSync) return;
    
    const status = cloudSync.getStatus();
    
    // Update status indicators
    updateElement('syncStatus', getStatusText(status));
    updateElement('lastSyncTime', formatLastSync(status.lastSync));
    updateElement('requestsUsed', `${status.requestsUsed}/${status.tier === 'free' ? 512 : 1440}`);
    updateElement('dataSize', formatDataSize(status.dataSize));
    updateElement('totalSyncs', status.totalSyncs);
    updateElement('syncErrors', status.errors);
    updateElement('requestsRemaining', status.requestsRemaining);
    
    // Update form elements
    const planSelect = document.getElementById('syncPlanType');
    if (planSelect) {
        planSelect.value = status.tier;
    }
    
    const autoSyncCheckbox = document.getElementById('autoSyncEnabled');
    if (autoSyncCheckbox) {
        const settings = cloudSync.getSyncSettings();
        autoSyncCheckbox.checked = settings ? settings.autoSync : false;
    }
    
    // Update sync messages
    updateSyncMessages(status);
    
    // Update sync button state
    const syncButton = document.querySelector('[data-action="manualSync"]');
    if (syncButton) {
        syncButton.disabled = !status.canSync;
        if (!status.configured) {
            syncButton.textContent = '🔄 Configure API Key First';
        } else if (!status.canSync) {
            syncButton.textContent = '🔄 Daily Limit Reached';
        } else {
            syncButton.textContent = '🔄 Sync Now';
        }
    }
}

/**
 * Update sync messages area
 */
function updateSyncMessages(status) {
    const messagesEl = document.getElementById('syncMessages');
    if (!messagesEl) return;
    
    let message = '';
    
    if (!status.configured) {
        message = 'Configure your API key to enable cloud sync';
    } else if (!status.enabled) {
        message = 'Cloud sync is disabled';
    } else if (!status.canSync) {
        message = 'Daily request limit reached. Sync will resume tomorrow.';
    } else if (status.pendingChanges) {
        message = 'Changes pending sync...';
    } else if (status.dataSize > status.maxSize) {
        message = `⚠️ Data size (${formatDataSize(status.dataSize)}) exceeds ${status.tier} plan limit (${formatDataSize(status.maxSize)}). Consider upgrading.`;
    } else {
        message = `Sync ready • ${status.requestsRemaining} requests remaining today`;
    }
    
    messagesEl.textContent = message;
    
    // Add warning style if there are issues
    if (message.includes('⚠️') || message.includes('limit')) {
        messagesEl.className = 'text-xs text-warning';
    } else {
        messagesEl.className = 'text-xs text-base-content/60';
    }
}

/**
 * Get human-readable status text
 */
function getStatusText(status) {
    if (!status.configured) return 'Not configured';
    if (!status.enabled) return 'Disabled';
    if (!status.canSync) return 'Limit reached';
    if (status.pendingChanges) return 'Pending sync';
    return 'Ready';
}

/**
 * Format last sync time
 */
function formatLastSync(lastSync) {
    if (!lastSync) return 'Never';
    
    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
}

/**
 * Format data size in human-readable format
 */
function formatDataSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
}

/**
 * Clear all sync data
 */
export function clearSyncData() {
    const confirmed = confirm(
        'Are you sure you want to clear all sync data?\n\n' +
        'This will:\n' +
        '• Remove your stored API key\n' +
        '• Clear all usage statistics\n' +
        '• Disable automatic sync\n' +
        '• Reset sync configuration\n\n' +
        'Your local data will not be affected.'
    );
    
    if (confirmed) {
        try {
            cloudSync.clearSyncData();
            refreshSyncStatus();
            showStatusMessage('Sync data cleared successfully', 'info');
        } catch (error) {
            console.error('Failed to clear sync data:', error);
            showStatusMessage('Failed to clear sync data', 'error');
        }
    }
}

/**
 * Initialize sync UI when settings modal is opened
 */
export function initializeSyncUI() {
    // Load current status when modal opens
    refreshSyncStatus();
    
    // Mark data as changed when user makes local changes
    if (cloudSync.isEnabled) {
        cloudSync.markChanges();
    }
}

/**
 * Update data management modal sync status
 */
export function updateDataManagementSyncStatus() {
    if (!cloudSync) return;
    
    const status = cloudSync.getStatus();
    
    // Update status text
    const statusEl = document.getElementById('dataSyncStatus');
    if (statusEl) {
        statusEl.textContent = getStatusText(status);
    }
    
    // Update details text
    const detailsEl = document.getElementById('dataSyncDetails');
    if (detailsEl) {
        let details = '';
        if (!status.configured) {
            details = 'Configure cloud sync in Settings to automatically backup your data';
        } else if (!status.enabled) {
            details = 'Cloud sync is disabled';
        } else {
            const lastSync = status.lastSync ? formatLastSync(status.lastSync) : 'Never';
            details = `Last sync: ${lastSync} • ${status.requestsRemaining} requests remaining`;
        }
        detailsEl.textContent = details;
    }
    
    // Update sync button
    const buttonEl = document.getElementById('dataSyncButton');
    if (buttonEl) {
        buttonEl.disabled = !status.canSync;
        if (!status.configured) {
            buttonEl.textContent = '🔄 Configure First';
        } else if (!status.canSync) {
            buttonEl.textContent = '🔄 Limit Reached';
        } else {
            buttonEl.textContent = '🔄 Sync Now';
        }
    }
}

/**
 * Helper function to safely update element text
 */
function updateElement(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}

// Make functions available globally for event handlers
if (typeof window !== 'undefined') {
    window.configureSyncApiKey = configureSyncApiKey;
    window.updateSyncPlan = updateSyncPlan;
    window.toggleAutoSync = toggleAutoSync;
    window.manualSync = manualSync;
    window.refreshSyncStatus = refreshSyncStatus;
    window.clearSyncData = clearSyncData;
    window.initializeSyncUI = initializeSyncUI;
    window.updateDataManagementSyncStatus = updateDataManagementSyncStatus;
}