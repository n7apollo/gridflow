/**
 * GridFlow - Tags Adapter
 * Handles tag management and entity relationships in IndexedDB
 */

import { BaseAdapter } from '../base-adapter.js';

class TagsAdapter extends BaseAdapter {
  constructor() {
    super('tags');
  }

  /**
   * Create a new tag
   * @param {Object} tagData - Tag data
   * @returns {Promise<Object>} Created tag
   */
  async createTag(tagData) {
    try {
      const tag = {
        id: tagData.id || `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: (tagData.name || 'Untitled Tag').toLowerCase().trim(),
        color: tagData.color || '#0079bf',
        category: tagData.category || 'general',
        description: tagData.description || '',
        parent: tagData.parent || null, // For hierarchical tags
        
        // Usage tracking
        usageCount: 0,
        
        // Timestamps
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.save(tag);
      console.log('Created tag:', tag.id);
      return tag;
    } catch (error) {
      console.error('Failed to create tag:', error);
      throw error;
    }
  }

  /**
   * Get tags by category
   * @param {string} category - Category name
   * @returns {Promise<Array>} Tags in category
   */
  async getByCategory(category) {
    return this.getByIndex('category', category);
  }

  /**
   * Get tags by parent (for hierarchical tags)
   * @param {string} parentId - Parent tag ID
   * @returns {Promise<Array>} Child tags
   */
  async getByParent(parentId) {
    return this.getByIndex('parent', parentId);
  }

  /**
   * Get tags by usage count (most used first)
   * @param {number} limit - Maximum number of tags to return
   * @returns {Promise<Array>} Tags sorted by usage
   */
  async getByUsage(limit = 50) {
    try {
      const allTags = await this.getAll();
      return allTags
        .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get tags by usage:', error);
      return [];
    }
  }

  /**
   * Find tag by name
   * @param {string} name - Tag name (case-insensitive)
   * @returns {Promise<Object|null>} Tag or null if not found
   */
  async findByName(name) {
    try {
      const allTags = await this.getAll();
      return allTags.find(tag => tag.name === name.toLowerCase().trim()) || null;
    } catch (error) {
      console.error('Failed to find tag by name:', error);
      return null;
    }
  }

  /**
   * Search tags by name or description
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Matching tags
   */
  async searchTags(searchTerm) {
    try {
      const allTags = await this.getAll();
      const term = searchTerm.toLowerCase();
      
      return allTags.filter(tag =>
        tag.name.includes(term) ||
        (tag.description && tag.description.toLowerCase().includes(term))
      );
    } catch (error) {
      console.error('Failed to search tags:', error);
      return [];
    }
  }

  /**
   * Update tag
   * @param {string} tagId - Tag ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated tag
   */
  async updateTag(tagId, updates) {
    try {
      const tag = await this.getById(tagId);
      if (!tag) {
        throw new Error(`Tag ${tagId} not found`);
      }

      const allowedUpdates = ['name', 'color', 'category', 'description', 'parent'];
      const updatedTag = { ...tag };
      
      allowedUpdates.forEach(key => {
        if (updates.hasOwnProperty(key)) {
          if (key === 'name') {
            updatedTag[key] = updates[key].toLowerCase().trim();
          } else {
            updatedTag[key] = updates[key];
          }
        }
      });

      updatedTag.updatedAt = new Date().toISOString();

      await this.save(updatedTag);
      return updatedTag;
    } catch (error) {
      console.error('Failed to update tag:', error);
      throw error;
    }
  }

  /**
   * Increment tag usage count
   * @param {string} tagId - Tag ID
   * @returns {Promise<Object>} Updated tag
   */
  async incrementUsage(tagId) {
    try {
      const tag = await this.getById(tagId);
      if (!tag) {
        throw new Error(`Tag ${tagId} not found`);
      }

      tag.usageCount = (tag.usageCount || 0) + 1;
      tag.updatedAt = new Date().toISOString();

      await this.save(tag);
      return tag;
    } catch (error) {
      console.error('Failed to increment tag usage:', error);
      throw error;
    }
  }

  /**
   * Decrement tag usage count
   * @param {string} tagId - Tag ID
   * @returns {Promise<Object>} Updated tag
   */
  async decrementUsage(tagId) {
    try {
      const tag = await this.getById(tagId);
      if (!tag) {
        throw new Error(`Tag ${tagId} not found`);
      }

      tag.usageCount = Math.max(0, (tag.usageCount || 0) - 1);
      tag.updatedAt = new Date().toISOString();

      await this.save(tag);
      return tag;
    } catch (error) {
      console.error('Failed to decrement tag usage:', error);
      throw error;
    }
  }

  /**
   * Get tag hierarchy (parent-child relationships)
   * @returns {Promise<Object>} Tag hierarchy tree
   */
  async getTagHierarchy() {
    try {
      const allTags = await this.getAll();
      const hierarchy = {};

      // First, add all root tags (no parent)
      allTags.forEach(tag => {
        if (!tag.parent) {
          hierarchy[tag.id] = { ...tag, children: [] };
        }
      });

      // Then, add child tags to their parents
      allTags.forEach(tag => {
        if (tag.parent && hierarchy[tag.parent]) {
          hierarchy[tag.parent].children.push(tag);
        }
      });

      return hierarchy;
    } catch (error) {
      console.error('Failed to get tag hierarchy:', error);
      return {};
    }
  }

  /**
   * Get tags with filters
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Filtered tags
   */
  async getFiltered(filters = {}) {
    try {
      let tags = await this.getAll();

      // Apply category filter
      if (filters.category) {
        tags = tags.filter(t => t.category === filters.category);
      }

      // Apply parent filter
      if (filters.parent !== undefined) {
        tags = tags.filter(t => t.parent === filters.parent);
      }

      // Apply usage filter
      if (filters.minUsage !== undefined) {
        tags = tags.filter(t => (t.usageCount || 0) >= filters.minUsage);
      }

      // Apply text search
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        tags = tags.filter(t =>
          t.name.includes(searchTerm) ||
          (t.description && t.description.toLowerCase().includes(searchTerm))
        );
      }

      // Apply sorting
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'name':
            tags.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'usage':
            tags.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
            break;
          case 'created':
            tags.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
          case 'updated':
            tags.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            break;
        }
      }

      return tags;
    } catch (error) {
      console.error('Failed to get filtered tags:', error);
      return [];
    }
  }

  /**
   * Get tag statistics
   * @returns {Promise<Object>} Tag statistics
   */
  async getStatistics() {
    try {
      const tags = await this.getAll();
      
      const stats = {
        total: tags.length,
        byCategory: {},
        totalUsage: 0,
        mostUsed: null,
        recentCount: 0,
        hierarchical: 0
      };

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      tags.forEach(tag => {
        // Category stats
        const category = tag.category || 'Uncategorized';
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

        // Usage stats
        const usage = tag.usageCount || 0;
        stats.totalUsage += usage;
        
        if (!stats.mostUsed || usage > (stats.mostUsed.usageCount || 0)) {
          stats.mostUsed = tag;
        }

        // Recent tags
        if (new Date(tag.createdAt) > thirtyDaysAgo) {
          stats.recentCount++;
        }

        // Hierarchical tags
        if (tag.parent) {
          stats.hierarchical++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Failed to get tag statistics:', error);
      return { total: 0, byCategory: {}, totalUsage: 0, mostUsed: null, recentCount: 0, hierarchical: 0 };
    }
  }

  /**
   * Generate tag color based on category or name
   * @param {string} category - Tag category
   * @param {string} name - Tag name
   * @returns {string} Hex color code
   */
  generateTagColor(category, name) {
    const categoryColors = {
      work: '#0079bf',
      personal: '#d29034',
      project: '#519839',
      urgent: '#eb5a46',
      idea: '#c377e0',
      meeting: '#ff9f1a',
      general: '#838c91'
    };

    if (categoryColors[category]) {
      return categoryColors[category];
    }

    // Generate color based on name hash
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    const colors = ['#0079bf', '#d29034', '#519839', '#eb5a46', '#c377e0', '#ff9f1a', '#838c91'];
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Export tags for backup
   * @returns {Promise<Array>} All tags
   */
  async exportTags() {
    try {
      return await this.getAll();
    } catch (error) {
      console.error('Failed to export tags:', error);
      return [];
    }
  }

  /**
   * Import tags from backup
   * @param {Array} tags - Tags to import
   * @returns {Promise<Object>} Import results
   */
  async importTags(tags) {
    try {
      let imported = 0;
      let skipped = 0;
      let errors = 0;

      for (const tag of tags) {
        try {
          // Check if tag already exists (by name)
          const existing = await this.findByName(tag.name);
          if (existing) {
            skipped++;
            continue;
          }

          // Ensure required fields
          const tagToImport = {
            ...tag,
            createdAt: tag.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await this.save(tagToImport);
          imported++;
        } catch (error) {
          console.error(`Failed to import tag ${tag.name}:`, error);
          errors++;
        }
      }

      return { imported, skipped, errors, total: tags.length };
    } catch (error) {
      console.error('Failed to import tags:', error);
      throw error;
    }
  }

  /**
   * Create default sample tags
   * @returns {Promise<Array>} Created tags
   */
  async createSampleTags() {
    try {
      const existingTags = await this.getAll();
      if (existingTags.length > 0) {
        return []; // Already has tags
      }

      const sampleTags = [
        { name: 'work', category: 'work', color: '#0079bf', description: 'Work-related items' },
        { name: 'personal', category: 'personal', color: '#d29034', description: 'Personal tasks and notes' },
        { name: 'urgent', category: 'priority', color: '#eb5a46', description: 'Urgent items requiring immediate attention' },
        { name: 'meeting', category: 'work', color: '#ff9f1a', description: 'Meeting-related items' },
        { name: 'idea', category: 'general', color: '#c377e0', description: 'Ideas and brainstorming' },
        { name: 'project', category: 'work', color: '#519839', description: 'Project-related items' },
        { name: 'follow-up', category: 'action', color: '#838c91', description: 'Items requiring follow-up' }
      ];

      const createdTags = [];
      for (const tagData of sampleTags) {
        const tag = await this.createTag(tagData);
        createdTags.push(tag);
      }

      return createdTags;
    } catch (error) {
      console.error('Failed to create sample tags:', error);
      return [];
    }
  }
}

// Create singleton instance
const tagsAdapter = new TagsAdapter();

export default tagsAdapter;
export { TagsAdapter };