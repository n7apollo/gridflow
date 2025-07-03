/**
 * GridFlow Cloud Sync Module
 * Handles automatic syncing with jsonstorage.net
 * Optimized for free tier limits: 512 requests/day, 32kb max
 */

import { showStatusMessage } from './utilities.js';
import { saveData, appData } from './core-data.js';
import { metaService } from './meta-service.js';

export class CloudSync {
    constructor() {
        this.baseUrl = 'https://api.jsonstorage.net/v1/json';
        this.storageKey = 'gridflow_cloud_sync';
        this.usageKey = 'gridflow_sync_usage';
        
        // Free tier limits
        this.limits = {
            free: {
                dailyRequests: 512,
                maxSize: 32 * 1024, // 32kb
                tier: 'free'
            },
            paid: {
                dailyRequests: 1440,
                maxSize: 64 * 1024, // 64kb
                tier: 'paid'
            }
        };
        
        this.currentLimits = this.limits.free; // Default to free tier
        this.isEnabled = false;
        this.lastSyncTime = null;
        this.syncInterval = null;
        this.pendingChanges = false;
        this.initialized = false;
        
        // Don't initialize immediately - wait for explicit initialization
    }

    /**
     * Initialize cloud sync settings (called when first needed)
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            await this.loadSyncSettings();
            this.loadUsageStats();
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize cloud sync:', error);
        }
    }

    /**
     * Simple encryption for API key storage
     */
    encrypt(text) {
        // Simple XOR cipher - not cryptographically secure but obscures key
        const key = 'gridflow-security-key';
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(result);
    }

    decrypt(encrypted) {
        try {
            const text = atob(encrypted);
            const key = 'gridflow-security-key';
            let result = '';
            for (let i = 0; i < text.length; i++) {
                result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return result;
        } catch (error) {
            console.error('Failed to decrypt API key:', error);
            return null;
        }
    }

    /**
     * Set and store API key securely
     */
    async setApiKey(apiKey, tier = 'free') {
        if (!apiKey || typeof apiKey !== 'string') {
            throw new Error('Valid API key required');
        }
        
        const syncSettings = {
            apiKey: this.encrypt(apiKey),
            tier: tier,
            storageUri: null,
            enabled: true,
            autoSync: true,
            syncInterval: 5 * 60 * 1000 // 5 minutes
        };
        
        await metaService.setSetting('cloud_sync_settings', syncSettings, 'cloud_sync');
        this.currentLimits = this.limits[tier];
        await this.loadSyncSettings();
        
        showStatusMessage('Cloud sync configured successfully!', 'success');
        return true;
    }

    /**
     * Get decrypted API key
     */
    async getApiKey() {
        const settings = await this.getSyncSettings();
        if (settings && settings.apiKey) {
            return this.decrypt(settings.apiKey);
        }
        return null;
    }

    /**
     * Load sync settings from localStorage
     */
    async loadSyncSettings() {
        const settings = await this.getSyncSettings();
        if (settings) {
            this.isEnabled = settings.enabled || false;
            this.currentLimits = this.limits[settings.tier] || this.limits.free;
            
            if (this.isEnabled && settings.autoSync) {
                this.startAutoSync(settings.syncInterval || 5 * 60 * 1000);
            }
        }
    }

    /**
     * Get sync settings object
     */
    async getSyncSettings() {
        try {
            return await metaService.getSetting('cloud_sync_settings');
        } catch (error) {
            console.error('Failed to load sync settings:', error);
            return null;
        }
    }

    /**
     * Update sync settings
     */
    async updateSyncSettings(updates) {
        const current = await this.getSyncSettings() || {};
        const updated = { ...current, ...updates };
        await metaService.setSetting('cloud_sync_settings', updated, 'cloud_sync');
        await this.loadSyncSettings();
    }

    /**
     * Load and manage usage statistics
     */
    async loadUsageStats() {
        const today = new Date().toDateString();
        const stored = await metaService.getSetting('cloud_sync_usage_stats');
        
        if (stored) {
            // Reset daily counters if it's a new day
            if (stored.date !== today) {
                this.resetDailyUsage();
            } else {
                this.usageStats = stored;
            }
        } else {
            this.resetDailyUsage();
        }
    }

    /**
     * Reset daily usage counters
     */
    resetDailyUsage() {
        this.usageStats = {
            date: new Date().toDateString(),
            requestsUsed: 0,
            lastSyncTime: null,
            totalSyncs: 0,
            errors: 0
        };
        this.saveUsageStats();
    }

    /**
     * Save usage statistics
     */
    async saveUsageStats() {
        await metaService.setSetting('cloud_sync_usage_stats', this.usageStats, 'cloud_sync');
    }

    /**
     * Increment request counter
     */
    incrementRequestCount() {
        this.usageStats.requestsUsed += 1;
        this.saveUsageStats();
    }

    /**
     * Check if we can make another request today
     */
    canMakeRequest() {
        return this.usageStats.requestsUsed < this.currentLimits.dailyRequests;
    }

    /**
     * Prepare export data (reuse existing export logic)
     */
    prepareExportData() {
        const exportData = {
            ...appData,
            exportedAt: new Date().toISOString(),
            exportedFrom: 'GridFlow',
            syncVersion: '1.0',
            version: appData.version || '5.0'
        };
        
        // Update the original appData with the sync timestamp to maintain consistency
        appData.exportedAt = exportData.exportedAt;
        
        return exportData;
    }

    /**
     * Check if data exceeds size limits
     */
    isUnderSizeLimit(data) {
        const dataStr = JSON.stringify(data);
        const sizeBytes = new Blob([dataStr]).size;
        return sizeBytes <= this.currentLimits.maxSize;
    }

    /**
     * Get current data size in bytes
     */
    getDataSize(data = null) {
        const exportData = data || this.prepareExportData();
        const dataStr = JSON.stringify(exportData);
        return new Blob([dataStr]).size;
    }

    /**
     * Create new cloud storage (first sync)
     */
    async createCloudStorage(data) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('API key not configured');
        }

        if (!this.canMakeRequest()) {
            throw new Error('Daily request limit reached');
        }

        if (!this.isUnderSizeLimit(data)) {
            throw new Error(`Data size exceeds ${this.currentLimits.maxSize / 1024}kb limit`);
        }

        // Generate a descriptive name for the JSON item
        const itemName = `GridFlow-Backup-${new Date().toISOString().split('T')[0]}`;
        
        const response = await fetch(`${this.baseUrl}?apiKey=${apiKey}&name=${encodeURIComponent(itemName)}&isPublic=false`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        this.incrementRequestCount();

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create cloud storage: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        
        // Extract userId/itemId from the returned URI
        if (result.uri) {
            const uriMatch = result.uri.match(/\/v1\/json\/(.+)$/);
            if (uriMatch) {
                const storageUri = uriMatch[1];
                this.updateSyncSettings({ storageUri });
                return storageUri;
            }
        }
        
        throw new Error('Invalid response from jsonstorage.net');
    }

    /**
     * Update existing cloud storage
     */
    async updateCloudStorage(data) {
        const settings = this.getSyncSettings();
        const apiKey = this.getApiKey();
        
        if (!apiKey || !settings || !settings.storageUri) {
            throw new Error('Cloud storage not initialized');
        }

        if (!this.canMakeRequest()) {
            throw new Error('Daily request limit reached');
        }

        if (!this.isUnderSizeLimit(data)) {
            throw new Error(`Data size exceeds ${this.currentLimits.maxSize / 1024}kb limit`);
        }

        const response = await fetch(`${this.baseUrl}/${settings.storageUri}?apiKey=${apiKey}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        this.incrementRequestCount();

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update cloud storage: ${response.status} - ${errorText}`);
        }

        return await response.json();
    }

    /**
     * Fetch data from cloud storage
     */
    async fetchCloudData() {
        const settings = this.getSyncSettings();
        
        if (!settings || !settings.storageUri) {
            throw new Error('Cloud storage not initialized');
        }

        if (!this.canMakeRequest()) {
            throw new Error('Daily request limit reached');
        }

        const response = await fetch(`${this.baseUrl}/${settings.storageUri}`);
        this.incrementRequestCount();

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Cloud data not found - may need to re-sync');
            }
            const errorText = await response.text();
            throw new Error(`Failed to fetch cloud data: ${response.status} - ${errorText}`);
        }

        return await response.json();
    }

    /**
     * Sync local data to cloud
     */
    async syncToCloud() {
        try {
            if (!this.isEnabled) {
                throw new Error('Cloud sync is disabled');
            }

            console.log('syncToCloud: Preparing export data...');
            const exportData = this.prepareExportData();
            const settings = this.getSyncSettings();
            
            console.log('syncToCloud: Export data size:', this.getDataSize(exportData), 'bytes');
            console.log('syncToCloud: Settings:', settings ? 'found' : 'not found', settings?.storageUri ? `(storageUri: ${settings.storageUri})` : '(no storageUri)');
            
            let result;
            if (settings && settings.storageUri) {
                // Update existing
                console.log('syncToCloud: Updating existing cloud storage...');
                result = await this.updateCloudStorage(exportData);
            } else {
                // Create new
                console.log('syncToCloud: Creating new cloud storage...');
                const storageUri = await this.createCloudStorage(exportData);
                result = { uri: `${this.baseUrl}/${storageUri}` };
                console.log('syncToCloud: Created new storage with URI:', storageUri);
            }

            this.usageStats.lastSyncTime = new Date().toISOString();
            this.usageStats.totalSyncs += 1;
            this.pendingChanges = false;
            this.saveUsageStats();

            return result;
        } catch (error) {
            this.usageStats.errors += 1;
            this.saveUsageStats();
            throw error;
        }
    }

    /**
     * Sync from cloud to local (replace local data)
     */
    async syncFromCloud() {
        try {
            if (!this.isEnabled) {
                throw new Error('Cloud sync is disabled');
            }

            const cloudData = await this.fetchCloudData();
            
            if (cloudData && cloudData.syncVersion) {
                // Replace local data with cloud data (sync should replace, not merge)
                console.log('syncFromCloud: Replacing local data with cloud data');
                Object.assign(appData, cloudData);
                saveData();
                
                this.usageStats.lastSyncTime = new Date().toISOString();
                this.saveUsageStats();
                
                return cloudData;
            }
            
            throw new Error('Invalid cloud data format');
        } catch (error) {
            this.usageStats.errors += 1;
            this.saveUsageStats();
            throw error;
        }
    }

    /**
     * Perform bidirectional sync
     */
    async performFullSync() {
        try {
            showStatusMessage('Syncing with cloud...', 'info');
            
            // Check if this is the first sync (no storageUri yet)
            const settings = this.getSyncSettings();
            if (!settings || !settings.storageUri) {
                // No cloud storage exists yet, this is the first sync
                console.log('First sync - creating cloud storage');
                await this.syncToCloud();
                showStatusMessage('Initial sync to cloud completed!', 'success');
                return;
            }
            
            // Try to fetch existing cloud data
            let cloudData = null;
            try {
                cloudData = await this.fetchCloudData();
            } catch (error) {
                if (error.message.includes('not found')) {
                    // Cloud data was deleted, recreate it
                    console.log('Cloud data not found - recreating');
                    await this.syncToCloud();
                    showStatusMessage('Recreated cloud storage!', 'success');
                    return;
                }
                throw error;
            }

            // Compare timestamps to determine sync direction
            const localTimestamp = new Date(appData.exportedAt || 0).getTime();
            const cloudTimestamp = new Date(cloudData.exportedAt || 0).getTime();

            if (cloudTimestamp > localTimestamp) {
                // Cloud is newer - sync from cloud
                await this.syncFromCloud();
                showStatusMessage('Synced from cloud successfully!', 'success');
            } else if (localTimestamp > cloudTimestamp) {
                // Local is newer - sync to cloud
                await this.syncToCloud();
                showStatusMessage('Synced to cloud successfully!', 'success');
            } else {
                // Same timestamp - no sync needed
                showStatusMessage('Data already in sync', 'info');
            }

        } catch (error) {
            console.error('Sync failed:', error);
            showStatusMessage(`Sync failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Mark that local data has changed
     */
    markChanges() {
        this.pendingChanges = true;
    }

    /**
     * Start automatic syncing
     */
    startAutoSync(interval = 5 * 60 * 1000) {
        this.stopAutoSync(); // Clear any existing interval
        
        this.syncInterval = setInterval(async () => {
            if (this.pendingChanges && this.canMakeRequest()) {
                try {
                    await this.performFullSync();
                } catch (error) {
                    console.error('Auto-sync failed:', error);
                }
            }
        }, interval);

        // Also sync on visibility change (when user returns to app)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.pendingChanges && this.canMakeRequest()) {
                this.performFullSync().catch(console.error);
            }
        });
    }

    /**
     * Stop automatic syncing
     */
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    /**
     * Enable cloud sync
     */
    enable() {
        this.isEnabled = true;
        this.updateSyncSettings({ enabled: true });
        
        const settings = this.getSyncSettings();
        if (settings && settings.autoSync) {
            this.startAutoSync();
        }
    }

    /**
     * Disable cloud sync
     */
    disable() {
        this.isEnabled = false;
        this.stopAutoSync();
        this.updateSyncSettings({ enabled: false });
    }

    /**
     * Get sync status for UI
     */
    getStatus() {
        // Ensure we have basic usage stats initialized
        if (!this.usageStats) {
            this.usageStats = {
                requestsUsed: 0,
                lastSyncTime: null,
                totalSyncs: 0,
                errors: 0
            };
        }
        
        return {
            enabled: this.isEnabled,
            configured: !!this.getApiKey(),
            tier: this.currentLimits.tier,
            requestsUsed: this.usageStats.requestsUsed,
            requestsRemaining: this.currentLimits.dailyRequests - this.usageStats.requestsUsed,
            lastSync: this.usageStats.lastSyncTime,
            totalSyncs: this.usageStats.totalSyncs,
            errors: this.usageStats.errors,
            pendingChanges: this.pendingChanges,
            dataSize: this.getDataSize(),
            maxSize: this.currentLimits.maxSize,
            canSync: this.canMakeRequest() && this.isEnabled
        };
    }

    /**
     * Clear all sync data (for testing or reset)
     */
    async clearSyncData() {
        // Clear all cloud sync settings
        const allSettings = await metaService.getAllSettings();
        const cloudSyncSettings = allSettings.filter(setting => setting.category === 'cloud_sync');
        for (const setting of cloudSyncSettings) {
            await metaService.deleteSetting(setting.key);
        }
        this.stopAutoSync();
        this.isEnabled = false;
        this.resetDailyUsage();
        showStatusMessage('Cloud sync data cleared', 'info');
    }
}

// Create global instance
export const cloudSync = new CloudSync();

// Make available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.cloudSync = cloudSync;
}