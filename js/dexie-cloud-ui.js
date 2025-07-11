/**
 * GridFlow Dexie Cloud UI Management
 * Handles UI interactions for Dexie Cloud sync functionality
 */

import { dexieCloudSync } from './dexie-cloud-sync.js';
import { showStatusMessage } from './utilities.js';

/**
 * Initialize Dexie Cloud (automatic configuration with hardcoded URL)
 */
export async function initializeDexieCloud() {
    try {
        await dexieCloudSync.initializeCloudSync();
        
        // Enable sync by default
        await dexieCloudSync.enableSync();
        
        // Refresh the status display
        refreshDexieSyncStatus();
        
        showStatusMessage('Dexie Cloud initialized and sync enabled!', 'success');
    } catch (error) {
        console.error('Failed to initialize Dexie Cloud:', error);
        showStatusMessage(`Initialization failed: ${error.message}`, 'error');
    }
}

/**
 * Login to Dexie Cloud
 */
export async function loginToDexieCloud() {
    const emailInput = document.getElementById('dexieCloudEmail');
    
    if (!emailInput) {
        showStatusMessage('Email input not found', 'error');
        return;
    }
    
    const email = emailInput.value.trim();
    
    if (!email) {
        showStatusMessage('Please enter your email address', 'error');
        return;
    }
    
    try {
        await dexieCloudSync.login(email);
        
        // Show OTP guidance
        showStatusMessage(
            `📧 Check your email! We sent a login code to ${email}. Click the link or enter the code when prompted.`,
            'info',
            8000 // Show for 8 seconds
        );
        
        // Clear the input
        emailInput.value = '';
        
        // Refresh the status display
        refreshDexieSyncStatus();
        
        // Show additional guidance in the UI
        showOTPGuidance(email);
    } catch (error) {
        console.error('Login failed:', error);
        showStatusMessage(`Login failed: ${error.message}`, 'error');
    }
}

/**
 * Show OTP guidance in the authentication section
 */
function showOTPGuidance(email) {
    const authSection = document.getElementById('dexieAuthSection');
    if (!authSection) return;
    
    // Remove any existing OTP guidance
    const existingGuidance = authSection.querySelector('.otp-guidance');
    if (existingGuidance) {
        existingGuidance.remove();
    }
    
    // Create OTP guidance element
    const otpGuidance = document.createElement('div');
    otpGuidance.className = 'otp-guidance bg-info/10 border border-info/20 rounded-lg p-3 space-y-2';
    otpGuidance.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-info">📧</span>
            <span class="font-medium text-info">Check your email</span>
        </div>
        <div class="text-sm space-y-1">
            <p>We sent a login link to <strong>${email}</strong></p>
            <p>• Click the link in your email to login automatically</p>
            <p>• Or enter the code if prompted by a popup</p>
            <p>• The login session will last for months</p>
        </div>
        <button class="btn btn-ghost btn-xs text-info" onclick="this.parentElement.remove()">
            Dismiss
        </button>
    `;
    
    // Insert after the login section
    const loginSection = document.getElementById('dexieLoginSection');
    if (loginSection) {
        loginSection.parentNode.insertBefore(otpGuidance, loginSection.nextSibling);
    }
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
        if (otpGuidance.parentNode) {
            otpGuidance.remove();
        }
    }, 30000);
}

/**
 * Hide OTP guidance (when user successfully logs in)
 */
function hideOTPGuidance() {
    const otpGuidance = document.querySelector('.otp-guidance');
    if (otpGuidance) {
        otpGuidance.remove();
    }
}

/**
 * Logout from Dexie Cloud
 */
export async function logoutFromDexieCloud() {
    try {
        await dexieCloudSync.logout();
        
        // Force multiple status refreshes to ensure UI updates
        setTimeout(() => refreshDexieSyncStatus(), 100);
        setTimeout(() => refreshDexieSyncStatus(), 500);
        setTimeout(() => refreshDexieSyncStatus(), 1000);
        
        showStatusMessage('Logged out successfully - you can now log in with a different email', 'success');
    } catch (error) {
        console.error('Logout failed:', error);
        showStatusMessage(`Logout failed: ${error.message}`, 'error');
    }
}

/**
 * Toggle Dexie Cloud sync
 */
export async function toggleDexieCloudSync() {
    const checkbox = document.getElementById('dexieCloudEnabled');
    if (!checkbox) return;
    
    const enabled = checkbox.checked;
    
    try {
        if (enabled) {
            await dexieCloudSync.enableSync();
        } else {
            await dexieCloudSync.disableSync();
        }
        
        refreshDexieSyncStatus();
    } catch (error) {
        console.error('Failed to toggle sync:', error);
        // Revert checkbox state
        checkbox.checked = !enabled;
    }
}

/**
 * Perform manual sync (though Dexie Cloud syncs automatically)
 */
export async function manualDexieSync() {
    try {
        const button = document.querySelector('[data-action="manualDexieSync"]');
        if (button) {
            button.disabled = true;
            button.textContent = '🔄 Syncing...';
        }
        
        await dexieCloudSync.performManualSync();
        refreshDexieSyncStatus();
        
        if (button) {
            button.disabled = false;
            button.textContent = '🔄 Sync Now';
        }
    } catch (error) {
        console.error('Manual sync failed:', error);
        
        const button = document.querySelector('[data-action="manualDexieSync"]');
        if (button) {
            button.disabled = false;
            button.textContent = '🔄 Sync Now';
        }
        
        refreshDexieSyncStatus();
    }
}

/**
 * Refresh Dexie Cloud sync status display
 */
export function refreshDexieSyncStatus() {
    if (!dexieCloudSync) return;
    
    const status = dexieCloudSync.getStatus();
    
    // Update status indicators
    updateElement('dexieSyncStatus', getStatusText(status));
    updateElement('dexieLastSync', status.lastSync);
    updateElement('dexieCurrentUser', getUserDisplayText(status.user));
    updateElement('dexieDatabaseUrl', 'https://z87sp4xp5.dexie.cloud (built-in)');
    
    // Update form elements
    const enabledCheckbox = document.getElementById('dexieCloudEnabled');
    if (enabledCheckbox) {
        enabledCheckbox.checked = status.configured && status.connected;
    }
    
    // No need to update database URL field since it's hardcoded
    
    // Update sync messages
    updateDexieSyncMessages(status);
    
    // Update sync button state
    const syncButton = document.querySelector('[data-action="manualDexieSync"]');
    if (syncButton) {
        syncButton.disabled = !status.canSync;
        if (!status.configured) {
            syncButton.textContent = '🔄 Configure Database First';
        } else if (!status.connected) {
            syncButton.textContent = '🔄 Not Connected';
        } else {
            syncButton.textContent = '🔄 Auto-Syncing';
        }
    }
    
    // Update auth section
    updateAuthSection(status);
}

/**
 * Update authentication section
 */
function updateAuthSection(status) {
    const authSection = document.getElementById('dexieAuthSection');
    const loginSection = document.getElementById('dexieLoginSection');
    const userSection = document.getElementById('dexieUserSection');
    
    if (!authSection) return;
    
    if (isUserAuthenticated(status.user)) {
        // User is logged in
        if (loginSection) loginSection.style.display = 'none';
        if (userSection) {
            userSection.style.display = 'block';
            const userEmail = userSection.querySelector('.user-email');
            if (userEmail) userEmail.textContent = getUserDisplayText(status.user);
        }
        
        // Remove OTP guidance when user is logged in
        hideOTPGuidance();
    } else {
        // User is not logged in (including "unauthorized" state)
        if (loginSection) loginSection.style.display = 'block';
        if (userSection) userSection.style.display = 'none';
    }
}

/**
 * Update sync messages area
 */
function updateDexieSyncMessages(status) {
    const messagesEl = document.getElementById('dexieSyncMessages');
    if (!messagesEl) return;
    
    let message = '';
    
    if (!status.configured) {
        message = 'Dexie Cloud is being configured automatically...';
    } else if (!status.connected) {
        message = 'Database configured but not connected. Check your database URL and internet connection.';
    } else if (isUserAuthenticated(status.user)) {
        message = `✅ Connected and syncing automatically as ${getUserDisplayText(status.user)}`;
    } else {
        message = '✅ Connected - data syncs automatically. Login for cross-device sync.';
    }
    
    messagesEl.textContent = message;
    
    // Add appropriate styling
    if (!status.configured || !status.connected) {
        messagesEl.className = 'text-xs text-warning';
    } else {
        messagesEl.className = 'text-xs text-success';
    }
}

/**
 * Get human-readable status text
 */
function getStatusText(status) {
    if (!status.configured) return 'Not configured';
    if (!status.connected) return 'Not connected';
    if (isUserAuthenticated(status.user)) {
        return 'Syncing (authenticated)';
    }
    return 'Syncing (anonymous)';
}

/**
 * Check if user is actually authenticated (not "unauthorized")
 */
function isUserAuthenticated(user) {
    return user && 
           user.userId !== 'unauthorized' && 
           user.name !== 'Unauthorized';
}

/**
 * Get user display text for email
 */
function getUserDisplayText(user) {
    if (!user) return 'Not logged in';
    
    // Handle "unauthorized" state from Dexie Cloud
    if (user.userId === 'unauthorized' || user.name === 'Unauthorized') {
        return 'Not logged in';
    }
    
    // Handle different possible user object structures
    if (typeof user === 'string') return user;
    if (user.email) return user.email;
    if (user.userId && user.userId.includes('@')) return user.userId;
    if (user.name && user.name !== 'Unauthorized') return user.name;
    
    // Debug log the user object structure to understand what we're getting
    console.log('🔍 User object structure:', user, typeof user, Object.keys(user || {}));
    
    return 'Authenticated User';
}

/**
 * Clear all Dexie Cloud sync data
 */
export async function clearDexieCloudData() {
    const confirmed = confirm(
        'Are you sure you want to logout from Dexie Cloud?\n\n' +
        'This will:\n' +
        '• Log you out of your account\n' +
        '• Allow you to login with a different email\n' +
        '• Keep sync enabled for anonymous use\n\n' +
        'Your local data will not be affected.'
    );
    
    if (confirmed) {
        try {
            await logoutFromDexieCloud();
            refreshDexieSyncStatus();
        } catch (error) {
            console.error('Failed to logout:', error);
            showStatusMessage('Failed to logout', 'error');
        }
    }
}

/**
 * Initialize Dexie Cloud UI when settings modal is opened
 */
export async function initializeDexieCloudUI() {
    try {
        await dexieCloudSync.initialize();
        refreshDexieSyncStatus();
        
        // Setup event listeners for real-time updates
        dexieCloudSync.setupEventListeners();
        
        // Setup real-time observable subscriptions for user changes
        setupUserObservables();
    } catch (error) {
        console.error('Failed to initialize Dexie Cloud UI:', error);
    }
}

/**
 * Setup observable subscriptions for real-time user status updates
 */
function setupUserObservables() {
    try {
        // Import db for direct access to observables
        import('./db.js').then(({ db }) => {
            if (db.cloud && db.cloud.currentUser) {
                // Subscribe to user changes for real-time UI updates
                db.cloud.currentUser.subscribe(user => {
                    console.log('👤 User status changed:', user);
                    // Refresh UI after a brief delay
                    setTimeout(() => refreshDexieSyncStatus(), 100);
                });
            }
            
            if (db.cloud && db.cloud.persistedSyncState) {
                // Subscribe to sync state changes
                db.cloud.persistedSyncState.subscribe(syncState => {
                    console.log('🔄 Sync state changed:', syncState);
                    setTimeout(() => refreshDexieSyncStatus(), 100);
                });
            }
        });
    } catch (error) {
        console.warn('⚠️ Could not setup user observables:', error);
    }
}

/**
 * Update data management modal sync status
 */
export function updateDataManagementDexieSyncStatus() {
    if (!dexieCloudSync) return;
    
    const status = dexieCloudSync.getStatus();
    
    // Update status text
    const statusEl = document.getElementById('dataDexieSyncStatus');
    if (statusEl) {
        statusEl.textContent = getStatusText(status);
    }
    
    // Update details text
    const detailsEl = document.getElementById('dataDexieSyncDetails');
    if (detailsEl) {
        let details = '';
        if (!status.configured) {
            details = 'Dexie Cloud is being configured automatically...';
        } else if (!status.connected) {
            details = 'Database configured but not connected';
        } else {
            details = `Connected • ${status.lastSync} • ${isUserAuthenticated(status.user) ? 'Authenticated' : 'Anonymous mode'}`;
        }
        detailsEl.textContent = details;
    }
    
    // Update sync button
    const buttonEl = document.getElementById('dataDexieSyncButton');
    if (buttonEl) {
        buttonEl.disabled = !status.canSync;
        if (!status.configured) {
            buttonEl.textContent = '🔄 Configure First';
        } else if (!status.connected) {
            buttonEl.textContent = '🔄 Not Connected';
        } else {
            buttonEl.textContent = '🔄 Auto-Syncing';
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
    window.initializeDexieCloud = initializeDexieCloud;
    window.loginToDexieCloud = loginToDexieCloud;
    window.logoutFromDexieCloud = logoutFromDexieCloud;
    window.toggleDexieCloudSync = toggleDexieCloudSync;
    window.manualDexieSync = manualDexieSync;
    window.refreshDexieSyncStatus = refreshDexieSyncStatus;
    window.clearDexieCloudData = clearDexieCloudData;
    window.initializeDexieCloudUI = initializeDexieCloudUI;
    window.updateDataManagementDexieSyncStatus = updateDataManagementDexieSyncStatus;
}