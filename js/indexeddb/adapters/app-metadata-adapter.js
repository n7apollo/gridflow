/**
 * GridFlow - App Metadata Adapter
 * Handles app-level configuration and metadata in IndexedDB
 */

import { BaseAdapter } from '../base-adapter.js';

class AppMetadataAdapter extends BaseAdapter {
  constructor() {
    super('metadata');
  }

  /**
   * Get app configuration
   * @returns {Promise<Object>} App configuration object
   */
  async getAppConfig() {
    try {
      const config = await this.getById('app_config');
      if (!config) {
        // Return default configuration
        return this.createDefaultConfig();
      }
      return config.value;
    } catch (error) {
      console.error('Failed to get app config:', error);
      return this.createDefaultConfig();
    }
  }

  /**
   * Update app configuration
   * @param {Object} updates - Configuration updates
   * @returns {Promise<Object>} Updated configuration
   */
  async updateAppConfig(updates) {
    try {
      const currentConfig = await this.getAppConfig();
      const newConfig = {
        ...currentConfig,
        ...updates,
        lastUpdated: new Date().toISOString()
      };

      await this.save({
        key: 'app_config',
        category: 'app',
        value: newConfig,
        updatedAt: new Date().toISOString()
      });

      return newConfig;
    } catch (error) {
      console.error('Failed to update app config:', error);
      throw error;
    }
  }

  /**
   * Get current board ID
   * @returns {Promise<string>} Current board ID
   */
  async getCurrentBoardId() {
    const config = await this.getAppConfig();
    return config.currentBoardId || 'default';
  }

  /**
   * Set current board ID
   * @param {string} boardId - Board ID to set as current
   * @returns {Promise<void>}
   */
  async setCurrentBoardId(boardId) {
    await this.updateAppConfig({ currentBoardId: boardId });
  }

  /**
   * Get next ID for a specific type
   * @param {string} type - Type of ID (task, note, board, etc.)
   * @returns {Promise<number>} Next ID number
   */
  async getNextId(type) {
    const config = await this.getAppConfig();
    const key = `next${type.charAt(0).toUpperCase()}${type.slice(1)}Id`;
    return config[key] || 1;
  }

  /**
   * Increment and get next ID for a specific type
   * @param {string} type - Type of ID (task, note, board, etc.)
   * @returns {Promise<number>} Next ID number
   */
  async incrementNextId(type) {
    const currentId = await this.getNextId(type);
    const newId = currentId + 1;
    const key = `next${type.charAt(0).toUpperCase()}${type.slice(1)}Id`;
    
    await this.updateAppConfig({ [key]: newId });
    return currentId; // Return the ID that should be used
  }

  /**
   * Get app version
   * @returns {Promise<string>} App version
   */
  async getVersion() {
    const config = await this.getAppConfig();
    return config.version || '6.0';
  }

  /**
   * Set app version
   * @param {string} version - Version to set
   * @returns {Promise<void>}
   */
  async setVersion(version) {
    await this.updateAppConfig({ version });
  }

  /**
   * Get user preferences
   * @returns {Promise<Object>} User preferences
   */
  async getUserPreferences() {
    const config = await this.getAppConfig();
    return config.userPreferences || {};
  }

  /**
   * Update user preferences
   * @param {Object} preferences - Preferences to update
   * @returns {Promise<void>}
   */
  async updateUserPreferences(preferences) {
    const currentPrefs = await this.getUserPreferences();
    const newPrefs = { ...currentPrefs, ...preferences };
    await this.updateAppConfig({ userPreferences: newPrefs });
  }

  /**
   * Get feature flags
   * @returns {Promise<Object>} Feature flags
   */
  async getFeatureFlags() {
    const config = await this.getAppConfig();
    return config.featureFlags || {};
  }

  /**
   * Update feature flags
   * @param {Object} flags - Feature flags to update
   * @returns {Promise<void>}
   */
  async updateFeatureFlags(flags) {
    const currentFlags = await this.getFeatureFlags();
    const newFlags = { ...currentFlags, ...flags };
    await this.updateAppConfig({ featureFlags: newFlags });
  }

  /**
   * Create default configuration
   * @returns {Object} Default configuration
   */
  createDefaultConfig() {
    return {
      currentBoardId: 'default',
      version: '6.0',
      nextTaskId: 1,
      nextNoteId: 1,
      nextChecklistId: 1,
      nextProjectId: 1,
      nextPersonId: 1,
      nextBoardId: 1,
      nextGroupId: 1,
      nextRowId: 1,
      nextColumnId: 1,
      nextTemplateId: 1,
      nextCollectionId: 1,
      nextTagId: 1,
      nextWeeklyItemId: 1,
      userPreferences: {
        theme: 'auto',
        defaultView: 'board',
        showCheckboxes: true,
        showSubtaskProgress: true
      },
      featureFlags: {
        // All localStorage-related flags removed
        indexedDBOnly: true,
        peopleSystem: true,
        weeklyPlanning: true,
        templates: true,
        collections: true,
        tags: true
      },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Reset app configuration to defaults
   * @returns {Promise<Object>} Reset configuration
   */
  async resetConfig() {
    const defaultConfig = this.createDefaultConfig();
    await this.save({
      key: 'app_config',
      category: 'app',
      value: defaultConfig,
      updatedAt: new Date().toISOString()
    });
    return defaultConfig;
  }

  /**
   * Export app metadata for backup
   * @returns {Promise<Object>} Exportable metadata
   */
  async exportMetadata() {
    try {
      const allMetadata = await this.getAll();
      return allMetadata.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {});
    } catch (error) {
      console.error('Failed to export metadata:', error);
      return {};
    }
  }

  /**
   * Import app metadata from backup
   * @param {Object} metadata - Metadata to import
   * @returns {Promise<void>}
   */
  async importMetadata(metadata) {
    try {
      for (const [key, value] of Object.entries(metadata)) {
        await this.save({
          key,
          category: 'app',
          value,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to import metadata:', error);
      throw error;
    }
  }
}

// Create singleton instance
const appMetadataAdapter = new AppMetadataAdapter();

export default appMetadataAdapter;
export { AppMetadataAdapter };