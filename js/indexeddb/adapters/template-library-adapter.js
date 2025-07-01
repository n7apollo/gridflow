/**
 * GridFlow - Template Library Adapter
 * Handles template library features like task sets, checklists, and note templates
 */

import { BaseAdapter } from '../base-adapter.js';

class TemplateLibraryAdapter extends BaseAdapter {
  constructor() {
    super('metadata'); // Store library data in metadata store
  }

  /**
   * Get template library configuration
   * @returns {Promise<Object>} Template library config
   */
  async getLibraryConfig() {
    try {
      const config = await this.getById('template_library_config');
      if (!config) {
        return this.createDefaultLibraryConfig();
      }
      return config.value;
    } catch (error) {
      console.error('Failed to get template library config:', error);
      return this.createDefaultLibraryConfig();
    }
  }

  /**
   * Update template library configuration
   * @param {Object} updates - Configuration updates
   * @returns {Promise<Object>} Updated configuration
   */
  async updateLibraryConfig(updates) {
    try {
      const currentConfig = await this.getLibraryConfig();
      const newConfig = {
        ...currentConfig,
        ...updates,
        lastUpdated: new Date().toISOString()
      };

      await this.save({
        key: 'template_library_config',
        category: 'template_library',
        value: newConfig,
        updatedAt: new Date().toISOString()
      });

      return newConfig;
    } catch (error) {
      console.error('Failed to update template library config:', error);
      throw error;
    }
  }

  /**
   * Create default template library configuration
   * @returns {Object} Default configuration
   */
  createDefaultLibraryConfig() {
    return {
      categories: ['Project Management', 'Personal', 'Business', 'Education'],
      featured: [],
      taskSets: {},
      checklists: {},
      noteTemplates: {},
      nextTaskSetId: 1,
      nextChecklistId: 1,
      nextNoteTemplateId: 1,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Create a task set template
   * @param {Object} taskSetData - Task set data
   * @returns {Promise<Object>} Created task set
   */
  async createTaskSet(taskSetData) {
    try {
      const config = await this.getLibraryConfig();
      const taskSetId = `taskset_${config.nextTaskSetId}`;
      
      const taskSet = {
        id: taskSetId,
        name: taskSetData.name || 'Untitled Task Set',
        description: taskSetData.description || '',
        category: taskSetData.category || 'general',
        tasks: taskSetData.tasks?.map(task => ({
          text: task.text || task,
          priority: task.priority || 'medium',
          estimatedTime: task.estimatedTime || null,
          dependencies: task.dependencies || []
        })) || [],
        tags: taskSetData.tags || [],
        isPublic: taskSetData.isPublic || false,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to task sets
      config.taskSets[taskSetId] = taskSet;
      config.nextTaskSetId++;

      // Update library config
      await this.updateLibraryConfig(config);

      console.log('Created task set:', taskSetId);
      return taskSet;
    } catch (error) {
      console.error('Failed to create task set:', error);
      throw error;
    }
  }

  /**
   * Get task set by ID
   * @param {string} taskSetId - Task set ID
   * @returns {Promise<Object|null>} Task set or null
   */
  async getTaskSet(taskSetId) {
    try {
      const config = await this.getLibraryConfig();
      return config.taskSets[taskSetId] || null;
    } catch (error) {
      console.error('Failed to get task set:', error);
      return null;
    }
  }

  /**
   * Get all task sets
   * @returns {Promise<Array>} Array of task sets
   */
  async getAllTaskSets() {
    try {
      const config = await this.getLibraryConfig();
      return Object.values(config.taskSets || {});
    } catch (error) {
      console.error('Failed to get all task sets:', error);
      return [];
    }
  }

  /**
   * Create a checklist template
   * @param {Object} checklistData - Checklist data
   * @returns {Promise<Object>} Created checklist
   */
  async createChecklist(checklistData) {
    try {
      const config = await this.getLibraryConfig();
      const checklistId = `checklist_${config.nextChecklistId}`;
      
      const checklist = {
        id: checklistId,
        name: checklistData.name || 'Untitled Checklist',
        description: checklistData.description || '',
        category: checklistData.category || 'general',
        items: checklistData.items?.map(item => ({
          text: item.text || item,
          required: item.required !== false,
          category: item.category || 'default'
        })) || [],
        tags: checklistData.tags || [],
        isPublic: checklistData.isPublic || false,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to checklists
      config.checklists[checklistId] = checklist;
      config.nextChecklistId++;

      // Update library config
      await this.updateLibraryConfig(config);

      console.log('Created checklist:', checklistId);
      return checklist;
    } catch (error) {
      console.error('Failed to create checklist:', error);
      throw error;
    }
  }

  /**
   * Get checklist by ID
   * @param {string} checklistId - Checklist ID
   * @returns {Promise<Object|null>} Checklist or null
   */
  async getChecklist(checklistId) {
    try {
      const config = await this.getLibraryConfig();
      return config.checklists[checklistId] || null;
    } catch (error) {
      console.error('Failed to get checklist:', error);
      return null;
    }
  }

  /**
   * Get all checklists
   * @returns {Promise<Array>} Array of checklists
   */
  async getAllChecklists() {
    try {
      const config = await this.getLibraryConfig();
      return Object.values(config.checklists || {});
    } catch (error) {
      console.error('Failed to get all checklists:', error);
      return [];
    }
  }

  /**
   * Create a note template
   * @param {Object} noteTemplateData - Note template data
   * @returns {Promise<Object>} Created note template
   */
  async createNoteTemplate(noteTemplateData) {
    try {
      const config = await this.getLibraryConfig();
      const noteTemplateId = `notetemplate_${config.nextNoteTemplateId}`;
      
      const noteTemplate = {
        id: noteTemplateId,
        name: noteTemplateData.name || 'Untitled Note Template',
        description: noteTemplateData.description || '',
        category: noteTemplateData.category || 'general',
        content: noteTemplateData.content || '',
        structure: noteTemplateData.structure || {
          sections: [],
          prompts: [],
          format: 'markdown'
        },
        tags: noteTemplateData.tags || [],
        isPublic: noteTemplateData.isPublic || false,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to note templates
      config.noteTemplates[noteTemplateId] = noteTemplate;
      config.nextNoteTemplateId++;

      // Update library config
      await this.updateLibraryConfig(config);

      console.log('Created note template:', noteTemplateId);
      return noteTemplate;
    } catch (error) {
      console.error('Failed to create note template:', error);
      throw error;
    }
  }

  /**
   * Get note template by ID
   * @param {string} noteTemplateId - Note template ID
   * @returns {Promise<Object|null>} Note template or null
   */
  async getNoteTemplate(noteTemplateId) {
    try {
      const config = await this.getLibraryConfig();
      return config.noteTemplates[noteTemplateId] || null;
    } catch (error) {
      console.error('Failed to get note template:', error);
      return null;
    }
  }

  /**
   * Get all note templates
   * @returns {Promise<Array>} Array of note templates
   */
  async getAllNoteTemplates() {
    try {
      const config = await this.getLibraryConfig();
      return Object.values(config.noteTemplates || {});
    } catch (error) {
      console.error('Failed to get all note templates:', error);
      return [];
    }
  }

  /**
   * Increment usage count for any library item
   * @param {string} itemType - Type of item (taskSets, checklists, noteTemplates)
   * @param {string} itemId - Item ID
   * @returns {Promise<Object>} Updated item
   */
  async incrementUsage(itemType, itemId) {
    try {
      const config = await this.getLibraryConfig();
      
      if (!config[itemType] || !config[itemType][itemId]) {
        throw new Error(`${itemType} item ${itemId} not found`);
      }

      config[itemType][itemId].usageCount = (config[itemType][itemId].usageCount || 0) + 1;
      config[itemType][itemId].lastUsed = new Date().toISOString();
      config[itemType][itemId].updatedAt = new Date().toISOString();

      await this.updateLibraryConfig(config);
      return config[itemType][itemId];
    } catch (error) {
      console.error('Failed to increment usage:', error);
      throw error;
    }
  }

  /**
   * Get featured templates
   * @returns {Promise<Array>} Featured template IDs
   */
  async getFeatured() {
    try {
      const config = await this.getLibraryConfig();
      return config.featured || [];
    } catch (error) {
      console.error('Failed to get featured templates:', error);
      return [];
    }
  }

  /**
   * Set featured templates
   * @param {Array} featuredIds - Array of template IDs to feature
   * @returns {Promise<Array>} Updated featured list
   */
  async setFeatured(featuredIds) {
    try {
      const config = await this.getLibraryConfig();
      config.featured = featuredIds;
      await this.updateLibraryConfig(config);
      return featuredIds;
    } catch (error) {
      console.error('Failed to set featured templates:', error);
      throw error;
    }
  }

  /**
   * Get library statistics
   * @returns {Promise<Object>} Library statistics
   */
  async getStatistics() {
    try {
      const config = await this.getLibraryConfig();
      
      const taskSets = Object.values(config.taskSets || {});
      const checklists = Object.values(config.checklists || {});
      const noteTemplates = Object.values(config.noteTemplates || {});

      return {
        taskSets: {
          total: taskSets.length,
          totalUsage: taskSets.reduce((sum, ts) => sum + (ts.usageCount || 0), 0),
          byCategory: this.groupByCategory(taskSets)
        },
        checklists: {
          total: checklists.length,
          totalUsage: checklists.reduce((sum, cl) => sum + (cl.usageCount || 0), 0),
          byCategory: this.groupByCategory(checklists)
        },
        noteTemplates: {
          total: noteTemplates.length,
          totalUsage: noteTemplates.reduce((sum, nt) => sum + (nt.usageCount || 0), 0),
          byCategory: this.groupByCategory(noteTemplates)
        },
        featured: config.featured?.length || 0
      };
    } catch (error) {
      console.error('Failed to get library statistics:', error);
      return {
        taskSets: { total: 0, totalUsage: 0, byCategory: {} },
        checklists: { total: 0, totalUsage: 0, byCategory: {} },
        noteTemplates: { total: 0, totalUsage: 0, byCategory: {} },
        featured: 0
      };
    }
  }

  /**
   * Group items by category
   * @param {Array} items - Items to group
   * @returns {Object} Items grouped by category
   */
  groupByCategory(items) {
    return items.reduce((groups, item) => {
      const category = item.category || 'Uncategorized';
      groups[category] = (groups[category] || 0) + 1;
      return groups;
    }, {});
  }

  /**
   * Export library data
   * @returns {Promise<Object>} Complete library export
   */
  async exportLibrary() {
    try {
      return await this.getLibraryConfig();
    } catch (error) {
      console.error('Failed to export library:', error);
      return this.createDefaultLibraryConfig();
    }
  }

  /**
   * Import library data
   * @param {Object} libraryData - Library data to import
   * @returns {Promise<Object>} Import results
   */
  async importLibrary(libraryData) {
    try {
      const currentConfig = await this.getLibraryConfig();
      
      // Merge imported data with current config
      const mergedConfig = {
        ...currentConfig,
        ...libraryData,
        lastUpdated: new Date().toISOString()
      };

      await this.updateLibraryConfig(mergedConfig);
      
      const imported = {
        taskSets: Object.keys(libraryData.taskSets || {}).length,
        checklists: Object.keys(libraryData.checklists || {}).length,
        noteTemplates: Object.keys(libraryData.noteTemplates || {}).length
      };

      return { 
        success: true, 
        imported,
        total: imported.taskSets + imported.checklists + imported.noteTemplates
      };
    } catch (error) {
      console.error('Failed to import library:', error);
      throw error;
    }
  }
}

// Create singleton instance
const templateLibraryAdapter = new TemplateLibraryAdapter();

export default templateLibraryAdapter;
export { TemplateLibraryAdapter };