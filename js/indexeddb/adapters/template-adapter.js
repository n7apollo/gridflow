/**
 * GridFlow - Template Adapter
 * Handles template storage and retrieval in IndexedDB
 */

import { BaseAdapter } from '../base-adapter.js';

class TemplateAdapter extends BaseAdapter {
  constructor() {
    super('templates');
  }

  /**
   * Create a new template
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Created template
   */
  async createTemplate(templateData) {
    try {
      const template = {
        id: templateData.id || `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: templateData.name || 'Untitled Template',
        description: templateData.description || '',
        category: templateData.category || 'General',
        
        // Board structure
        groups: templateData.groups || [],
        rows: templateData.rows || [],
        columns: templateData.columns || [],
        
        // Template metadata
        isPublic: templateData.isPublic || false,
        usageCount: 0,
        tags: templateData.tags || [],
        
        // Timestamps
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.save(template);
      console.log('Created template:', template.id);
      return template;
    } catch (error) {
      console.error('Failed to create template:', error);
      throw error;
    }
  }

  /**
   * Get templates by category
   * @param {string} category - Template category
   * @returns {Promise<Array>} Templates in category
   */
  async getByCategory(category) {
    return this.getByIndex('category', category);
  }

  /**
   * Search templates by name
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Matching templates
   */
  async searchByName(searchTerm) {
    const allTemplates = await this.getAll();
    const term = searchTerm.toLowerCase();
    
    return allTemplates.filter(template =>
      template.name.toLowerCase().includes(term) ||
      (template.description && template.description.toLowerCase().includes(term))
    );
  }

  /**
   * Get popular templates (by usage count)
   * @param {number} limit - Maximum number of templates to return
   * @returns {Promise<Array>} Popular templates
   */
  async getPopular(limit = 10) {
    const allTemplates = await this.getAll();
    return allTemplates
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, limit);
  }

  /**
   * Get recent templates
   * @param {number} limit - Maximum number of templates to return
   * @returns {Promise<Array>} Recent templates
   */
  async getRecent(limit = 10) {
    const allTemplates = await this.getAll();
    return allTemplates
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  /**
   * Increment usage count for a template
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>} Updated template
   */
  async incrementUsage(templateId) {
    try {
      const template = await this.getById(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      template.usageCount = (template.usageCount || 0) + 1;
      template.lastUsed = new Date().toISOString();
      template.updatedAt = new Date().toISOString();

      await this.save(template);
      return template;
    } catch (error) {
      console.error('Failed to increment template usage:', error);
      throw error;
    }
  }

  /**
   * Update template
   * @param {string} templateId - Template ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated template
   */
  async updateTemplate(templateId, updates) {
    try {
      const template = await this.getById(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      const updatedTemplate = {
        ...template,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await this.save(updatedTemplate);
      return updatedTemplate;
    } catch (error) {
      console.error('Failed to update template:', error);
      throw error;
    }
  }

  /**
   * Get templates with filters
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Filtered templates
   */
  async getFiltered(filters = {}) {
    try {
      let templates = await this.getAll();

      // Apply category filter
      if (filters.category) {
        templates = templates.filter(t => t.category === filters.category);
      }

      // Apply tag filter
      if (filters.tags && filters.tags.length > 0) {
        templates = templates.filter(t =>
          filters.tags.some(tag => t.tags && t.tags.includes(tag))
        );
      }

      // Apply public/private filter
      if (filters.isPublic !== undefined) {
        templates = templates.filter(t => t.isPublic === filters.isPublic);
      }

      // Apply text search
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        templates = templates.filter(t =>
          t.name.toLowerCase().includes(searchTerm) ||
          (t.description && t.description.toLowerCase().includes(searchTerm))
        );
      }

      // Apply sorting
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'name':
            templates.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'usage':
            templates.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
            break;
          case 'created':
            templates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
          case 'updated':
            templates.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            break;
        }
      }

      return templates;
    } catch (error) {
      console.error('Failed to get filtered templates:', error);
      return [];
    }
  }

  /**
   * Export template data for backup
   * @returns {Promise<Array>} All templates
   */
  async exportTemplates() {
    try {
      return await this.getAll();
    } catch (error) {
      console.error('Failed to export templates:', error);
      return [];
    }
  }

  /**
   * Import templates from backup
   * @param {Array} templates - Templates to import
   * @returns {Promise<Object>} Import results
   */
  async importTemplates(templates) {
    try {
      let imported = 0;
      let skipped = 0;
      let errors = 0;

      for (const template of templates) {
        try {
          // Check if template already exists
          const existing = await this.getById(template.id);
          if (existing) {
            skipped++;
            continue;
          }

          // Ensure required fields
          const templateToImport = {
            ...template,
            createdAt: template.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await this.save(templateToImport);
          imported++;
        } catch (error) {
          console.error(`Failed to import template ${template.id}:`, error);
          errors++;
        }
      }

      return { imported, skipped, errors, total: templates.length };
    } catch (error) {
      console.error('Failed to import templates:', error);
      throw error;
    }
  }

  /**
   * Get template statistics
   * @returns {Promise<Object>} Template statistics
   */
  async getStatistics() {
    try {
      const templates = await this.getAll();
      
      const stats = {
        total: templates.length,
        byCategory: {},
        totalUsage: 0,
        mostUsed: null,
        recentCount: 0
      };

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      templates.forEach(template => {
        // Category stats
        const category = template.category || 'Uncategorized';
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

        // Usage stats
        const usage = template.usageCount || 0;
        stats.totalUsage += usage;
        
        if (!stats.mostUsed || usage > (stats.mostUsed.usageCount || 0)) {
          stats.mostUsed = template;
        }

        // Recent templates
        if (new Date(template.createdAt) > thirtyDaysAgo) {
          stats.recentCount++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Failed to get template statistics:', error);
      return { total: 0, byCategory: {}, totalUsage: 0, mostUsed: null, recentCount: 0 };
    }
  }
}

// Create singleton instance
const templateAdapter = new TemplateAdapter();

export default templateAdapter;
export { TemplateAdapter };