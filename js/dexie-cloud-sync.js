/**
 * GridFlow Dexie Cloud Sync Module
 * Handles cloud synchronization using Dexie Cloud
 */

import { db } from './db.js';
import { showStatusMessage } from './utilities.js';

export class DexieCloudSync {
    constructor() {
        this.isInitialized = false;
        this.syncStatus = {
            configured: false,
            connected: false,
            user: null,
            databaseUrl: null,
            lastSync: null,
            syncState: null
        };
    }

    /**
     * Initialize Dexie Cloud sync
     */
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            console.log('🔧 Initializing Dexie Cloud sync...');
            console.log('🔍 Database cloud object available:', !!db.cloud);
            
            if (db.cloud) {
                console.log('🔍 Cloud object properties:', Object.keys(db.cloud));
                console.log('🔍 Events available:', !!db.cloud.events);
                if (db.cloud.events) {
                    console.log('🔍 Event types:', Object.keys(db.cloud.events));
                }
            }
            
            // Check if cloud database is configured
            await this.updateSyncStatus();
            this.isInitialized = true;
            console.log('✅ Dexie Cloud sync initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Dexie Cloud sync:', error);
            throw error;
        }
    }

    /**
     * Update sync status from Dexie Cloud
     */
    async updateSyncStatus() {
        try {
            console.log('🔍 Debugging cloud object structure:', {
                hasCloud: !!db.cloud,
                cloudKeys: db.cloud ? Object.keys(db.cloud) : 'no cloud',
                currentUser: db.cloud ? db.cloud.currentUser : 'no cloud',
                persistedSyncState: db.cloud ? db.cloud.persistedSyncState : 'no cloud'
            });
            
            const status = db.getCloudStatus();
            this.syncStatus = {
                ...status,
                lastSync: this.getLastSyncTime()
            };
            return this.syncStatus;
        } catch (error) {
            console.error('❌ Error updating sync status:', error);
            return this.syncStatus;
        }
    }

    /**
     * Initialize Dexie Cloud (automatic configuration)
     */
    async initializeCloudSync() {
        try {
            await db.setCloudDatabase();
            await this.updateSyncStatus();
            
            showStatusMessage('Dexie Cloud initialized successfully!', 'success');
            return true;
        } catch (error) {
            console.error('Failed to initialize Dexie Cloud:', error);
            showStatusMessage(`Initialization failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Enable cloud sync
     */
    async enableSync() {
        try {
            await db.enableCloudSync();
            await this.updateSyncStatus();
            
            showStatusMessage('Cloud sync enabled!', 'success');
            return true;
        } catch (error) {
            console.error('Failed to enable cloud sync:', error);
            showStatusMessage(`Failed to enable sync: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Disable cloud sync
     */
    async disableSync() {
        try {
            await db.disableCloudSync();
            await this.updateSyncStatus();
            
            showStatusMessage('Cloud sync disabled', 'info');
            return true;
        } catch (error) {
            console.error('Failed to disable cloud sync:', error);
            showStatusMessage(`Failed to disable sync: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Login to Dexie Cloud
     */
    async login(email) {
        if (!email || !email.includes('@')) {
            throw new Error('Please provide a valid email address');
        }

        try {
            await db.login(email);
            await this.updateSyncStatus();
            
            showStatusMessage(`Login email sent to ${email}. Check your inbox!`, 'success');
            return true;
        } catch (error) {
            console.error('Login failed:', error);
            showStatusMessage(`Login failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Logout from Dexie Cloud
     */
    async logout() {
        try {
            await db.logout();
            await this.updateSyncStatus();
            
            showStatusMessage('Logged out successfully', 'info');
            return true;
        } catch (error) {
            console.error('Logout failed:', error);
            showStatusMessage(`Logout failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Get sync status for UI
     */
    getStatus() {
        return {
            ...this.syncStatus,
            canSync: this.syncStatus.configured,
            pendingChanges: false, // Dexie Cloud handles this automatically
            dataSize: 'N/A', // Dexie Cloud manages data size
            maxSize: 'Unlimited', // Dexie Cloud doesn't have explicit size limits like JSONStorage
            requestsUsed: 'N/A',
            requestsRemaining: 'Unlimited',
            totalSyncs: 'Auto',
            errors: 0,
            tier: 'cloud'
        };
    }

    /**
     * Get last sync time (Dexie Cloud manages this automatically)
     */
    getLastSyncTime() {
        // Dexie Cloud doesn't expose explicit sync timestamps
        // It syncs continuously when connected
        return this.syncStatus.connected ? 'Continuous' : 'Not syncing';
    }

    /**
     * Manual sync (not needed with Dexie Cloud as it syncs automatically)
     */
    async performManualSync() {
        if (!this.syncStatus.configured) {
            throw new Error('Cloud sync not configured');
        }

        try {
            // Dexie Cloud syncs automatically, but we can trigger a sync
            await this.enableSync();
            showStatusMessage('Sync triggered - Dexie Cloud syncs automatically!', 'info');
        } catch (error) {
            console.error('Manual sync failed:', error);
            showStatusMessage(`Sync failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Clear sync data (logout and disable sync)
     */
    async clearSyncData() {
        try {
            await db.logout();
            await db.disableCloudSync();
            await this.updateSyncStatus();
            
            showStatusMessage('Logged out and sync disabled', 'info');
        } catch (error) {
            console.error('Failed to clear sync data:', error);
            showStatusMessage('Failed to logout', 'error');
            throw error;
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.syncStatus.user && 
               this.syncStatus.user.userId !== 'unauthorized' && 
               this.syncStatus.user.name !== 'Unauthorized';
    }

    /**
     * Get current user info
     */
    getCurrentUser() {
        return this.syncStatus.user;
    }

    /**
     * Setup sync event listeners
     */
    setupEventListeners() {
        // Listen for Dexie Cloud sync events
        if (db.cloud && db.cloud.events) {
            console.log('🔧 Setting up Dexie Cloud event listeners...');
            console.log('🔍 Available events:', Object.keys(db.cloud.events));
            
            try {
                if (db.cloud.events.ready) {
                    console.log('📡 Subscribing to ready events');
                    db.cloud.events.ready.subscribe(() => {
                        console.log('🌤️ Dexie Cloud is ready');
                        this.updateSyncStatus();
                    });
                }

                if (db.cloud.events.syncComplete) {
                    console.log('📡 Subscribing to syncComplete events');
                    db.cloud.events.syncComplete.subscribe(() => {
                        console.log('🔄 Dexie Cloud sync completed');
                        this.updateSyncStatus();
                    });
                }

                if (db.cloud.events.syncError) {
                    console.log('📡 Subscribing to syncError events');
                    db.cloud.events.syncError.subscribe((error) => {
                        console.error('❌ Dexie Cloud sync error:', error);
                        showStatusMessage(`Sync error: ${error.message}`, 'error');
                    });
                }

                // Listen for authentication changes
                if (db.cloud.events.userChange) {
                    console.log('📡 Subscribing to userChange events');
                    db.cloud.events.userChange.subscribe((user) => {
                        console.log('👤 User changed:', user);
                        this.updateSyncStatus();
                        
                        // Show success message when user logs in
                        if (user) {
                            import('./utilities.js').then(({ showStatusMessage }) => {
                                showStatusMessage('✅ Successfully logged in! Your data will now sync across devices.', 'success');
                            });
                        }
                    });
                }

                console.log('✅ Dexie Cloud event listeners setup complete');
            } catch (error) {
                console.error('❌ Failed to setup Dexie Cloud event listeners:', error);
            }
        } else {
            console.warn('⚠️ Dexie Cloud events not available - skipping event listener setup');
        }
    }
}

// Create global instance
export const dexieCloudSync = new DexieCloudSync();

// Make available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.dexieCloudSync = dexieCloudSync;
}