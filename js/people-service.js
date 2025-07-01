/**
 * GridFlow - People Service
 * Provides high-level operations for managing people and their relationships
 */

import { createEntity, updateEntity, deleteEntity, getEntity, ENTITY_TYPES } from './entity-core.js';
import { getAppData } from './core-data.js';
import { peopleAdapter, relationshipAdapter } from './indexeddb/adapters.js';

class PeopleService {
  /**
   * Create a new person entity
   * @param {Object} personData - Person data
   * @returns {Object} Created person entity
   */
  async createPerson(personData) {
    // Ensure name is set as title for entity compatibility
    const enrichedData = {
      ...personData,
      title: personData.name || personData.title,
      name: personData.name || personData.title
    };

    const person = await createEntity(ENTITY_TYPES.PERSON, enrichedData);
    
    console.log('Created person:', person);
    return person;
  }

  /**
   * Update person entity
   * @param {string} personId - Person ID
   * @param {Object} updates - Update data
   * @returns {Object} Updated person entity
   */
  async updatePerson(personId, updates) {
    // Update last interaction time if not provided
    if (!updates.lastInteraction) {
      updates.lastInteraction = new Date().toISOString();
    }

    // Ensure name and title stay in sync
    if (updates.name && !updates.title) {
      updates.title = updates.name;
    } else if (updates.title && !updates.name) {
      updates.name = updates.title;
    }

    const updatedPerson = await updateEntity(personId, updates);
    
    return updatedPerson;
  }

  /**
   * Delete person and all their relationships
   * @param {string} personId - Person ID
   * @returns {boolean} Success status
   */
  async deletePerson(personId) {
    // Delete all relationships involving this person
    await this.removeAllRelationships(personId);
    
    // Delete the person entity
    const success = await deleteEntity(personId);
    
    return success;
  }

  /**
   * Get person by ID
   * @param {string} personId - Person ID
   * @returns {Object|null} Person entity or null
   */
  getPerson(personId) {
    return getEntity(personId);
  }

  /**
   * Get all people
   * @returns {Array} Array of person entities
   */
  getAllPeople() {
    const appData = getAppData();
    return Object.values(appData.entities || {}).filter(entity => 
      entity.type === ENTITY_TYPES.PERSON
    );
  }

  /**
   * Search people by name
   * @param {string} searchTerm - Search term
   * @returns {Array} Matching people
   */
  searchPeople(searchTerm) {
    const allPeople = this.getAllPeople();
    const term = searchTerm.toLowerCase();
    
    return allPeople.filter(person =>
      person.name.toLowerCase().includes(term) ||
      (person.email && person.email.toLowerCase().includes(term)) ||
      (person.company && person.company.toLowerCase().includes(term))
    );
  }

  /**
   * Create relationship between entity and person
   * @param {string} entityId - Entity ID
   * @param {string} personId - Person ID
   * @param {string} relationshipType - Type of relationship
   * @param {string} context - Optional context
   * @returns {Object} Created relationship
   */
  async createRelationship(entityId, personId, relationshipType = 'mentions', context = '') {
    // Update person's last interaction time
    await this.updatePerson(personId, {
      lastInteraction: new Date().toISOString()
    });

    // Create relationship in IndexedDB
    try {
      return await relationshipAdapter.createRelationship(entityId, personId, relationshipType, context);
    } catch (error) {
      console.error('Failed to create relationship in IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Remove relationship between entity and person
   * @param {string} entityId - Entity ID
   * @param {string} personId - Person ID
   * @returns {boolean} Success status
   */
  async removeRelationship(entityId, personId) {
    try {
      return await relationshipAdapter.removeRelationship(entityId, personId);
    } catch (error) {
      console.error('Failed to remove relationship from IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Remove all relationships for a person
   * @param {string} personId - Person ID
   * @returns {number} Number of relationships removed
   */
  async removeAllRelationships(personId) {
    try {
      const relationships = await relationshipAdapter.getByRelated(personId);
      for (const rel of relationships) {
        await relationshipAdapter.delete(rel.id);
      }
      return relationships.length;
    } catch (error) {
      console.error('Failed to remove relationships from IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Get all entities related to a person (chronological timeline)
   * @param {string} personId - Person ID
   * @returns {Array} Array of related entities with relationship context
   */
  async getPersonTimeline(personId) {
    // Get relationships from IndexedDB
    let relationships = [];
    try {
      relationships = await relationshipAdapter.getByRelated(personId);
    } catch (error) {
      console.error('Failed to get relationships from IndexedDB:', error);
      return [];
    }

    // Get all related entities
    const entityIds = relationships.map(rel => rel.entityId);
    const entities = entityIds.map(id => getEntity(id)).filter(Boolean);

    // Add relationship context and sort chronologically
    const timelineItems = entities.map(entity => {
      const relationship = relationships.find(rel => rel.entityId === entity.id);
      return {
        ...entity,
        relationshipContext: relationship,
        relationshipType: relationship?.relationshipType || 'mentions',
        relationshipCreatedAt: relationship?.createdAt
      };
    });

    // Sort by most recent update/creation
    return timelineItems.sort((a, b) => 
      new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );
  }

  /**
   * Get people who need follow-up based on interaction frequency
   * @returns {Array} People needing follow-up with suggestion context
   */
  async getPeopleNeedingFollowUp() {
    const allPeople = this.getAllPeople();
    const now = new Date();
    const followUps = [];

    for (const person of allPeople) {
      const lastInteraction = new Date(person.lastInteraction);
      const daysSince = Math.floor((now - lastInteraction) / (1000 * 60 * 60 * 24));
      
      let expectedFrequencyDays;
      switch (person.interactionFrequency) {
        case 'daily': expectedFrequencyDays = 1; break;
        case 'weekly': expectedFrequencyDays = 7; break;
        case 'monthly': expectedFrequencyDays = 30; break;
        case 'quarterly': expectedFrequencyDays = 90; break;
        case 'yearly': expectedFrequencyDays = 365; break;
        default: expectedFrequencyDays = 30; break;
      }

      if (daysSince > expectedFrequencyDays) {
        const timeline = await this.getPersonTimeline(person.id);
        const lastNote = timeline.find(item => item.type === 'note');
        
        followUps.push({
          person,
          daysSinceContact: daysSince,
          expectedFrequency: person.interactionFrequency,
          lastContext: lastNote?.title || lastNote?.content?.substring(0, 100),
          suggestion: this.generateFollowUpSuggestion(person, daysSince, lastNote)
        });
      }
    }

    return followUps.sort((a, b) => b.daysSinceContact - a.daysSinceContact);
  }

  /**
   * Generate follow-up suggestion for a person
   * @param {Object} person - Person entity
   * @param {number} daysSince - Days since last interaction
   * @param {Object} lastNote - Last note about this person
   * @returns {string} Follow-up suggestion
   */
  generateFollowUpSuggestion(person, daysSince, lastNote) {
    const name = person.name;
    
    if (person.relationshipType === 'coworker') {
      return `Check in with ${name} about recent projects or schedule a coffee chat`;
    } else if (person.relationshipType === 'friend') {
      return `Reach out to ${name} to see how they're doing`;
    } else if (person.relationshipType === 'family') {
      return `Call ${name} to catch up`;
    } else if (person.relationshipType === 'partner') {
      return `Plan quality time with ${name}`;
    } else if (lastNote && lastNote.content.includes('job')) {
      return `Follow up with ${name} about their job situation`;
    } else {
      return `Send ${name} a message to reconnect`;
    }
  }

  /**
   * Get people by relationship type
   * @param {string} relationshipType - Relationship type
   * @returns {Array} People with specified relationship type
   */
  getPeopleByRelationshipType(relationshipType) {
    return this.getAllPeople().filter(person => 
      person.relationshipType === relationshipType
    );
  }
}

// Create singleton instance
const peopleService = new PeopleService();

// Make available globally
if (typeof window !== 'undefined') {
  window.peopleService = peopleService;
}

export default peopleService;