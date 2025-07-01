/**
 * GridFlow - Settings Adapter
 * Handles application settings, preferences, and configuration in IndexedDB
 */

import { BaseAdapter } from '../base-adapter.js';

class SettingsAdapter extends BaseAdapter {
  constructor() {
    super('metadata'); // Use metadata store for settings
  }

  /**
   * Get a setting by key
   * @param {string} key - Setting key
   * @returns {Promise<*>} Setting value or null
   */
  async getSetting(key) {
    try {
      const setting = await this.getById(key);
      return setting ? setting.value : null;
    } catch (error) {
      console.error(`Failed to get setting ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a setting value
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   * @param {string} category - Setting category (default: 'general')
   * @returns {Promise<Object>} Saved setting
   */
  async setSetting(key, value, category = 'general') {
    try {
      const setting = {
        key,
        value,
        category,
        updatedAt: new Date().toISOString()
      };

      await this.save(setting);
      return setting;
    } catch (error) {
      console.error(`Failed to set setting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple settings by category
   * @param {string} category - Settings category
   * @returns {Promise<Object>} Settings object with key-value pairs
   */
  async getSettingsByCategory(category) {
    try {
      const settings = await this.getByIndex('category', category);
      const result = {};
      
      settings.forEach(setting => {
        result[setting.key] = setting.value;
      });
      
      return result;
    } catch (error) {
      console.error(`Failed to get settings for category ${category}:`, error);
      return {};
    }
  }

  /**
   * Set multiple settings at once
   * @param {Object} settings - Object with key-value pairs
   * @param {string} category - Settings category (default: 'general')
   * @returns {Promise<Array>} Array of saved settings
   */
  async setMultipleSettings(settings, category = 'general') {
    try {
      const savedSettings = [];
      
      for (const [key, value] of Object.entries(settings)) {
        const setting = await this.setSetting(key, value, category);
        savedSettings.push(setting);
      }
      
      return savedSettings;
    } catch (error) {
      console.error('Failed to set multiple settings:', error);
      throw error;
    }
  }

  /**
   * Delete a setting
   * @param {string} key - Setting key
   * @returns {Promise<boolean>} Success status
   */
  async deleteSetting(key) {
    try {
      await this.delete(key);
      return true;
    } catch (error) {
      console.error(`Failed to delete setting ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all settings in a category
   * @param {string} category - Category to clear
   * @returns {Promise<number>} Number of settings deleted
   */
  async clearCategory(category) {
    try {
      const settings = await this.getByIndex('category', category);
      let deleted = 0;
      
      for (const setting of settings) {
        await this.delete(setting.key);
        deleted++;
      }
      
      return deleted;
    } catch (error) {
      console.error(`Failed to clear category ${category}:`, error);
      return 0;
    }
  }

  /**
   * Get all settings grouped by category
   * @returns {Promise<Object>} Settings grouped by category
   */
  async getAllSettings() {
    try {
      const allSettings = await this.getAll();
      const grouped = {};
      
      allSettings.forEach(setting => {
        const category = setting.category || 'general';
        if (!grouped[category]) {
          grouped[category] = {};
        }
        grouped[category][setting.key] = setting.value;
      });
      
      return grouped;
    } catch (error) {
      console.error('Failed to get all settings:', error);
      return {};
    }
  }

  /**
   * Cloud sync settings methods
   */
  async getCloudSyncSettings() {
    return this.getSettingsByCategory('cloud_sync');
  }

  async setCloudSyncSettings(settings) {
    return this.setMultipleSettings(settings, 'cloud_sync');
  }

  async getCloudSyncUsageStats() {
    return this.getSetting('cloud_sync_usage_stats');
  }

  async setCloudSyncUsageStats(stats) {
    return this.setSetting('cloud_sync_usage_stats', stats, 'cloud_sync');
  }

  /**
   * Import/Export settings methods
   */
  async getLastExportTimestamp() {
    return this.getSetting('last_export_timestamp');
  }

  async setLastExportTimestamp(timestamp) {
    return this.setSetting('last_export_timestamp', timestamp, 'import_export');
  }

  /**
   * User preferences methods
   */
  async getUserPreferences() {
    return this.getSettingsByCategory('user_preferences');
  }

  async setUserPreferences(preferences) {
    return this.setMultipleSettings(preferences, 'user_preferences');
  }

  async getUserPreference(key) {
    return this.getSetting(`user_pref_${key}`);
  }

  async setUserPreference(key, value) {
    return this.setSetting(`user_pref_${key}`, value, 'user_preferences');
  }

  /**
   * Feature flags methods
   */
  async getFeatureFlags() {
    return this.getSettingsByCategory('feature_flags');
  }

  async setFeatureFlags(flags) {
    return this.setMultipleSettings(flags, 'feature_flags');
  }

  async getFeatureFlag(flag) {
    return this.getSetting(`feature_${flag}`);
  }

  async setFeatureFlag(flag, enabled) {
    return this.setSetting(`feature_${flag}`, enabled, 'feature_flags');
  }

  /**
   * Migrate settings from localStorage
   * @param {string} localStorageKey - localStorage key to migrate from
   * @param {string} category - IndexedDB category to migrate to
   * @returns {Promise<boolean>} Migration success status
   */
  async migrateFromLocalStorage(localStorageKey, category) {
    try {
      const data = localStorage.getItem(localStorageKey);
      if (!data) {
        return false; // Nothing to migrate
      }

      const parsed = JSON.parse(data);
      
      if (typeof parsed === 'object' && parsed !== null) {
        // Migrate object as multiple settings
        await this.setMultipleSettings(parsed, category);
      } else {
        // Migrate single value
        await this.setSetting(localStorageKey, parsed, category);
      }

      console.log(`Migrated ${localStorageKey} to IndexedDB category ${category}`);
      return true;
    } catch (error) {
      console.error(`Failed to migrate ${localStorageKey}:`, error);
      return false;
    }
  }

  /**
   * Export settings for backup
   * @returns {Promise<Object>} All settings for export
   */
  async exportSettings() {
    try {
      return await this.getAllSettings();
    } catch (error) {
      console.error('Failed to export settings:', error);
      return {};
    }
  }

  /**
   * Import settings from backup
   * @param {Object} settingsData - Settings data to import
   * @returns {Promise<Object>} Import results
   */
  async importSettings(settingsData) {
    try {
      let imported = 0;
      let errors = 0;

      for (const [category, settings] of Object.entries(settingsData)) {
        try {
          await this.setMultipleSettings(settings, category);
          imported += Object.keys(settings).length;
        } catch (error) {
          console.error(`Failed to import category ${category}:`, error);
          errors++;
        }
      }

      return { imported, errors, categories: Object.keys(settingsData).length };
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw error;
    }
  }
}

// Create singleton instance
const settingsAdapter = new SettingsAdapter();

export default settingsAdapter;
export { SettingsAdapter };