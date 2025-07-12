/**
 * GridFlow - Meta Service (Dexie)
 * Handles people, tags, collections, templates, settings, and metadata
 */

import { db } from './db.js';

export class MetaService {
  constructor() {
    this.db = db;
  }

  /**
   * People Operations with Relationship Tracking
   */
  async createPerson(personData) {
    const person = {
      id: personData.id || `person_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: personData.name,
      email: personData.email || '',
      company: personData.company || '',
      role: personData.role || '',
      relationshipType: personData.relationshipType || 'contact',
      tags: personData.tags || [],
      notes: personData.notes || '',
      lastInteraction: new Date().toISOString(),
      interactionFrequency: personData.interactionFrequency || 'occasional',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await this.db.people.put(person);
    return person;
  }

  async getPerson(personId) {
    return await this.db.people.get(personId);
  }

  async updatePerson(personId, updates) {
    const person = await this.getPerson(personId);
    if (!person) throw new Error(`Person ${personId} not found`);
    
    const updatedPerson = {
      ...person,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await this.db.people.put(updatedPerson);
    return updatedPerson;
  }

  async deletePerson(personId) {
    await this.db.transaction('rw', [this.db.people, this.db.entityRelationships, this.db.entities], async () => {
      // Delete the person
      await this.db.people.delete(personId);
      
      // Remove person from entity relationships
      await this.db.entityRelationships
        .where('relatedId').equals(personId)
        .delete();
      
      // Remove person from entity.people arrays
      const entitiesWithPerson = await this.db.entities
        .where('people').equals(personId)
        .toArray();
      
      for (const entity of entitiesWithPerson) {
        entity.people = entity.people.filter(id => id !== personId);
        await this.db.entities.put(entity);
      }
    });
    
    return true;
  }

  async getAllPeople() {
    return await this.db.people.toArray();
  }

  async searchPeople(searchTerm) {
    const term = searchTerm.toLowerCase();
    return await this.db.people.filter(person =>
      person.name.toLowerCase().includes(term) ||
      person.email.toLowerCase().includes(term) ||
      person.company.toLowerCase().includes(term)
    ).toArray();
  }

  async getPeopleByTag(tag) {
    return await this.db.people.where('tags').equals(tag).toArray();
  }

  async updateLastInteraction(personId) {
    return await this.updatePerson(personId, {
      lastInteraction: new Date().toISOString()
    });
  }

  async linkEntityToPerson(entityId, personId) {
    // Update lastInteraction for person
    await this.updateLastInteraction(personId);
    
    // Create bidirectional relationship
    const relationship = {
      id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entityId,
      relatedId: personId,
      relationshipType: 'tagged',
      createdAt: new Date().toISOString()
    };
    
    await this.db.entityRelationships.put(relationship);
    return relationship;
  }

  async unlinkEntityFromPerson(entityId, personId) {
    return await this.db.entityRelationships
      .where('entityId').equals(entityId)
      .and(rel => rel.relatedId === personId && rel.relationshipType === 'tagged')
      .delete();
  }

  /**
   * Tag Operations with Usage Tracking
   */
  async createTag(name, category = 'general', color = null, parent = null) {
    const tag = {
      id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.toLowerCase().trim(),
      category,
      color,
      parent,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await this.db.tags.put(tag);
    return tag;
  }

  async getTag(tagId) {
    return await this.db.tags.get(tagId);
  }

  async getTagByName(name) {
    const normalizedName = name.toLowerCase().trim();
    return await this.db.tags.where('name').equals(normalizedName).first();
  }

  async updateTag(tagId, updates) {
    const tag = await this.getTag(tagId);
    if (!tag) throw new Error(`Tag ${tagId} not found`);
    
    const updatedTag = {
      ...tag,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await this.db.tags.put(updatedTag);
    return updatedTag;
  }

  async deleteTag(tagId) {
    await this.db.transaction('rw', [this.db.tags, this.db.entities, this.db.people], async () => {
      // Delete the tag
      await this.db.tags.delete(tagId);
      
      // Remove tag from entities
      const entitiesWithTag = await this.db.entities.where('tags').equals(tagId).toArray();
      for (const entity of entitiesWithTag) {
        entity.tags = entity.tags.filter(id => id !== tagId);
        await this.db.entities.put(entity);
      }
      
      // Remove tag from people
      const peopleWithTag = await this.db.people.where('tags').equals(tagId).toArray();
      for (const person of peopleWithTag) {
        person.tags = person.tags.filter(id => id !== tagId);
        await this.db.people.put(person);
      }
    });
    
    return true;
  }

  async getAllTags() {
    return await this.db.tags.orderBy('name').toArray();
  }

  async getTagsByCategory(category) {
    return await this.db.tags.where('category').equals(category).toArray();
  }

  async getPopularTags(limit = 10) {
    return await this.db.tags.orderBy('usageCount').reverse().limit(limit).toArray();
  }

  async incrementTagUsage(tagId) {
    const tag = await this.getTag(tagId);
    if (tag) {
      tag.usageCount = (tag.usageCount || 0) + 1;
      tag.updatedAt = new Date().toISOString();
      await this.db.tags.put(tag);
    }
    return tag;
  }

  async findOrCreateTag(name, category = 'general') {
    let tag = await this.getTagByName(name);
    if (!tag) {
      tag = await this.createTag(name, category);
    }
    return tag;
  }

  /**
   * Collections (Saved Searches)
   */
  async createCollection(name, type = 'saved_search', category = 'general', filters = {}, autoUpdate = true) {
    const collection = {
      id: `cll${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type, // 'saved_search', 'manual', 'smart'
      category,
      filters,
      items: [], // For manual collections
      autoUpdate,
      itemCount: 0,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await this.db.collections.put(collection);
    return collection;
  }

  async getCollection(collectionId) {
    return await this.db.collections.get(collectionId);
  }

  async updateCollection(collectionId, updates) {
    const collection = await this.getCollection(collectionId);
    if (!collection) throw new Error(`Collection ${collectionId} not found`);
    
    const updatedCollection = {
      ...collection,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await this.db.collections.put(updatedCollection);
    return updatedCollection;
  }

  async deleteCollection(collectionId) {
    return await this.db.collections.delete(collectionId);
  }

  async getAllCollections() {
    return await this.db.collections.toArray();
  }

  async getCollectionsByCategory(category) {
    return await this.db.collections.where('category').equals(category).toArray();
  }

  async executeCollection(collectionId) {
    const collection = await this.getCollection(collectionId);
    if (!collection) return [];
    
    if (collection.type === 'manual') {
      // Return manually added items
      if (collection.items && collection.items.length > 0) {
        return await this.db.entities.where('id').anyOf(collection.items).toArray();
      }
      return [];
    }
    
    // Execute smart/saved search filters
    let query = this.db.entities;
    const filters = collection.filters || {};
    
    // Apply filters
    if (filters.type) {
      query = query.where('type').equals(filters.type);
    } else if (filters.completed !== undefined) {
      query = query.where('completed').equals(filters.completed);
    } else if (filters.priority) {
      query = query.where('priority').equals(filters.priority);
    } else if (filters.tags && filters.tags.length > 0) {
      query = query.where('tags').anyOf(filters.tags);
    } else if (filters.people && filters.people.length > 0) {
      query = query.where('people').anyOf(filters.people);
    } else {
      query = query.toCollection();
    }
    
    let results = await query.toArray();
    
    // Apply additional filters that can't be done with indexes
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      results = results.filter(entity => {
        const date = new Date(entity.createdAt);
        return date >= new Date(start) && date <= new Date(end);
      });
    }
    
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      results = results.filter(entity =>
        entity.title?.toLowerCase().includes(term) ||
        entity.content?.toLowerCase().includes(term)
      );
    }
    
    // Update collection stats
    if (collection.autoUpdate) {
      await this.updateCollection(collectionId, {
        itemCount: results.length,
        lastUpdated: new Date().toISOString()
      });
    }
    
    return results;
  }

  async addToCollection(collectionId, entityId) {
    const collection = await this.getCollection(collectionId);
    if (!collection) throw new Error(`Collection ${collectionId} not found`);
    
    if (!collection.items) collection.items = [];
    if (!collection.items.includes(entityId)) {
      collection.items.push(entityId);
      collection.itemCount = collection.items.length;
      collection.updatedAt = new Date().toISOString();
      await this.db.collections.put(collection);
    }
    
    return collection;
  }

  async removeFromCollection(collectionId, entityId) {
    const collection = await this.getCollection(collectionId);
    if (!collection) throw new Error(`Collection ${collectionId} not found`);
    
    if (collection.items) {
      collection.items = collection.items.filter(id => id !== entityId);
      collection.itemCount = collection.items.length;
      collection.updatedAt = new Date().toISOString();
      await this.db.collections.put(collection);
    }
    
    return collection;
  }

  /**
   * Templates
   */
  async createTemplate(name, description = '', category = 'general', structure = {}) {
    const template = {
      id: `tmp${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      category,
      structure, // Board structure: groups, rows, columns, entities
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await this.db.templates.put(template);
    return template;
  }

  async getTemplate(templateId) {
    return await this.db.templates.get(templateId);
  }

  async updateTemplate(templateId, updates) {
    const template = await this.getTemplate(templateId);
    if (!template) throw new Error(`Template ${templateId} not found`);
    
    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await this.db.templates.put(updatedTemplate);
    return updatedTemplate;
  }

  async deleteTemplate(templateId) {
    return await this.db.templates.delete(templateId);
  }

  async getAllTemplates() {
    return await this.db.templates.toArray();
  }

  async getTemplatesByCategory(category) {
    return await this.db.templates.where('category').equals(category).toArray();
  }

  async incrementTemplateUsage(templateId) {
    const template = await this.getTemplate(templateId);
    if (template) {
      template.usageCount = (template.usageCount || 0) + 1;
      template.updatedAt = new Date().toISOString();
      await this.db.templates.put(template);
    }
    return template;
  }

  /**
   * Settings
   */
  async getSetting(key) {
    const setting = await this.db.settings.get(key);
    return setting ? setting.value : null;
  }

  async setSetting(key, value, category = 'general') {
    const setting = {
      key,
      value,
      category,
      lastUpdated: new Date().toISOString()
    };
    
    await this.db.settings.put(setting);
    return setting;
  }

  async deleteSetting(key) {
    return await this.db.settings.delete(key);
  }

  async getAllSettings() {
    return await this.db.settings.toArray();
  }

  async getSettingsByCategory(category) {
    return await this.db.settings.where('category').equals(category).toArray();
  }

  /**
   * Metadata
   */
  async getMetadata(key) {
    const metadata = await this.db.metadata.get(key);
    return metadata ? metadata.value : null;
  }

  async setMetadata(key, value) {
    const metadata = {
      key,
      value,
      lastUpdated: new Date().toISOString()
    };
    
    await this.db.metadata.put(metadata);
    return metadata;
  }

  async deleteMetadata(key) {
    return await this.db.metadata.delete(key);
  }

  async getAllMetadata() {
    return await this.db.metadata.toArray();
  }

  async getCurrentBoardId() {
    return await this.getMetadata('currentBoardId');
  }

  async setCurrentBoardId(boardId) {
    return await this.setMetadata('currentBoardId', boardId);
  }

  /**
   * Weekly Planning
   */
  async createWeeklyPlan(weekKey, weekStart, goal = '') {
    const weeklyPlan = {
      weekKey,
      weekStart,
      goal,
      items: [],
      reflection: {
        wins: '',
        challenges: '',
        learnings: '',
        nextWeekFocus: ''
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await this.db.weeklyPlans.put(weeklyPlan);
    return weeklyPlan;
  }

  async getWeeklyPlan(weekKey) {
    return await this.db.weeklyPlans.get(weekKey);
  }

  async updateWeeklyPlan(weekKey, updates) {
    const plan = await this.getWeeklyPlan(weekKey);
    if (!plan) throw new Error(`Weekly plan ${weekKey} not found`);
    
    const updatedPlan = {
      ...plan,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await this.db.weeklyPlans.put(updatedPlan);
    return updatedPlan;
  }

  async deleteWeeklyPlan(weekKey) {
    await this.db.transaction('rw', [this.db.weeklyPlans, this.db.weeklyItems], async () => {
      await this.db.weeklyPlans.delete(weekKey);
      await this.db.weeklyItems.where('weekKey').equals(weekKey).delete();
    });
    
    return true;
  }

  async getAllWeeklyPlans() {
    return await this.db.weeklyPlans.orderBy('weekStart').reverse().toArray();
  }

  /**
   * Statistics and Analytics
   */
  async getMetaStats() {
    const [people, tags, collections, templates] = await Promise.all([
      this.getAllPeople(),
      this.getAllTags(),
      this.getAllCollections(),
      this.getAllTemplates()
    ]);
    
    return {
      people: people.length,
      tags: tags.length,
      collections: collections.length,
      templates: templates.length,
      popularTags: await this.getPopularTags(5),
      recentPeople: people
        .sort((a, b) => new Date(b.lastInteraction) - new Date(a.lastInteraction))
        .slice(0, 5)
    };
  }

  /**
   * Search Across All Meta Objects
   */
  async globalSearch(searchTerm) {
    const term = searchTerm.toLowerCase();
    
    const [people, tags, collections, templates] = await Promise.all([
      this.searchPeople(term),
      this.db.tags.filter(tag => tag.name.includes(term)).toArray(),
      this.db.collections.filter(collection => 
        collection.name.toLowerCase().includes(term)
      ).toArray(),
      this.db.templates.filter(template => 
        template.name.toLowerCase().includes(term) ||
        template.description.toLowerCase().includes(term)
      ).toArray()
    ]);
    
    return {
      people,
      tags,
      collections,
      templates
    };
  }
}

// Create and export singleton instance
export const metaService = new MetaService();

// Backward compatibility aliases
export const peopleService = metaService;
export const tagsService = metaService;
export const collectionsService = metaService;
export const templatesService = metaService;
export const settingsService = metaService;
export const metadataService = metaService;