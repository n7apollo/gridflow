/**
 * GridFlow - People Service (Dexie)
 * Provides high-level operations for managing people and their relationships
 */

import { createEntity, updateEntity, deleteEntity, getEntity, ENTITY_TYPES } from './entity-core.js';
import { metaService } from './meta-service.js';
import { entityService } from './entity-service.js';

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
   * @returns {Promise<Object|null>} Person entity or null
   */
  async getPerson(personId) {
    return await getEntity(personId);
  }

  /**
   * Get all people
   * @returns {Array} Array of person entities
   */
  async getAllPeople() {
    try {
      return await metaService.getAllPeople();
    } catch (error) {
      console.error('Failed to get all people:', error);
      return [];
    }
  }

  /**
   * Search people by name
   * @param {string} searchTerm - Search term
   * @returns {Array} Matching people
   */
  async searchPeople(searchTerm) {
    try {
      return await metaService.searchPeople(searchTerm);
    } catch (error) {
      console.error('Failed to search people:', error);
      return [];
    }
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
    try {
      // Link entity to person using entity service
      await entityService.linkToPerson(entityId, personId);
      
      // Update person's last interaction time
      await metaService.updateLastInteraction(personId);
      
      return { entityId, personId, relationshipType, context };
    } catch (error) {
      console.error('Failed to create relationship:', error);
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
      await entityService.unlinkFromPerson(entityId, personId);
      return true;
    } catch (error) {
      console.error('Failed to remove relationship:', error);
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
      // Get all entities linked to this person
      const linkedEntities = await entityService.getByPerson(personId);
      
      // Remove the person from each entity
      for (const entity of linkedEntities) {
        await entityService.unlinkFromPerson(entity.id, personId);
      }
      
      return linkedEntities.length;
    } catch (error) {
      console.error('Failed to remove relationships:', error);
      throw error;
    }
  }

  /**
   * Get all entities related to a person (chronological timeline)
   * @param {string} personId - Person ID
   * @returns {Array} Array of related entities with relationship context
   */
  async getPersonTimeline(personId) {
    try {
      // Use entity service to get person timeline
      return await entityService.getPersonTimeline(personId);
    } catch (error) {
      console.error('Failed to get person timeline:', error);
      return [];
    }
  }

  /**
   * Get people who need follow-up based on interaction frequency
   * @returns {Array} People needing follow-up with suggestion context
   */
  async getPeopleNeedingFollowUp() {
    try {
      const allPeople = await this.getAllPeople();
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
    } catch (error) {
      console.error('Failed to get people needing follow-up:', error);
      return [];
    }
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
  async getPeopleByRelationshipType(relationshipType) {
    try {
      const allPeople = await this.getAllPeople();
      return allPeople.filter(person => 
        person.relationshipType === relationshipType
      );
    } catch (error) {
      console.error('Failed to get people by relationship type:', error);
      return [];
    }
  }
}

// Create singleton instance
const peopleService = new PeopleService();

// Make available globally
if (typeof window !== 'undefined') {
  window.peopleService = peopleService;
}

export default peopleService;