/**
 * GridFlow - Entity Service (Dexie)
 * Handles entities, positioning, and board relationships
 */

import { db } from './db.js';

export class EntityService {
  constructor() {
    this.db = db;
  }

  /**
   * Core CRUD Operations
   */
  async save(entity) {
    const now = new Date().toISOString();
    entity.updatedAt = now;
    if (!entity.createdAt) entity.createdAt = now;
    
    // Ensure entity has required fields
    if (!entity.id) {
      throw new Error('Entity must have an ID');
    }
    if (!entity.type) {
      throw new Error('Entity must have a type');
    }
    
    return await this.db.entities.put(entity);
  }

  async getById(id) {
    return await this.db.entities.get(id);
  }

  async delete(id) {
    // Clean up related data when deleting entity
    await this.db.transaction('rw', [this.db.entities, this.db.entityPositions, this.db.entityRelationships, this.db.weeklyItems], async () => {
      // Delete the entity
      await this.db.entities.delete(id);
      
      // Delete entity positions
      await this.db.entityPositions.where('entityId').equals(id).delete();
      
      // Delete entity relationships
      await this.db.entityRelationships.where('entityId').equals(id).delete();
      await this.db.entityRelationships.where('relatedId').equals(id).delete();
      
      // Delete weekly plan items
      await this.db.weeklyItems.where('entityId').equals(id).delete();
    });
    
    return true;
  }

  async getAll() {
    return await this.db.entities.toArray();
  }

  /**
   * Entity Queries
   */
  async getByType(type) {
    return await this.db.entities.where('type').equals(type).toArray();
  }

  async getByBoard(boardId) {
    // Get entities through their positions on the board
    const positions = await this.db.entityPositions
      .where('boardId').equals(boardId)
      .and(pos => pos.context === 'board')
      .toArray();
    
    const entityIds = positions.map(pos => pos.entityId);
    if (entityIds.length === 0) return [];
    
    return await this.db.entities.where('id').anyOf(entityIds).toArray();
  }

  async getByTags(tags) {
    if (!Array.isArray(tags)) tags = [tags];
    return await this.db.entities.where('tags').anyOf(tags).toArray();
  }

  async getByPeople(peopleIds) {
    if (!Array.isArray(peopleIds)) peopleIds = [peopleIds];
    return await this.db.entities.where('people').anyOf(peopleIds).toArray();
  }

  async search(searchTerm) {
    const term = searchTerm.toLowerCase();
    return await this.db.entities.filter(entity => 
      entity.title?.toLowerCase().includes(term) ||
      entity.content?.toLowerCase().includes(term)
    ).toArray();
  }

  async getCompleted() {
    return await this.db.entities.where('completed').equals(true).toArray();
  }

  async getPending() {
    return await this.db.entities.where('completed').equals(false).toArray();
  }

  async getByPriority(priority) {
    return await this.db.entities.where('priority').equals(priority).toArray();
  }

  async getDueSoon(days = 7) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    
    return await this.db.entities
      .where('dueDate')
      .between(now.toISOString(), futureDate.toISOString())
      .and(entity => !entity.completed)
      .toArray();
  }

  /**
   * Bidirectional Linking Queries
   */
  async getByPerson(personId) {
    // Get entities directly tagged with person
    const directEntities = await this.db.entities.where('people').equals(personId).toArray();
    
    // Get entities linked through relationships
    const relationships = await this.db.entityRelationships
      .where('relatedId').equals(personId)
      .and(rel => rel.relationshipType === 'tagged')
      .toArray();
    
    const relationshipEntityIds = relationships.map(rel => rel.entityId);
    const relationshipEntities = relationshipEntityIds.length > 0 
      ? await this.db.entities.where('id').anyOf(relationshipEntityIds).toArray()
      : [];
    
    // Combine and deduplicate
    const allEntities = [...directEntities, ...relationshipEntities];
    const uniqueEntities = allEntities.filter((entity, index, arr) => 
      arr.findIndex(e => e.id === entity.id) === index
    );
    
    return uniqueEntities;
  }

  async getPersonTimeline(personId) {
    const entities = await this.getByPerson(personId);
    return entities.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  async linkToPerson(entityId, personId) {
    const entity = await this.getById(entityId);
    if (!entity) throw new Error(`Entity ${entityId} not found`);
    
    // Add to entity.people array if not already there
    if (!entity.people) entity.people = [];
    if (!entity.people.includes(personId)) {
      entity.people.push(personId);
      await this.save(entity);
    }
    
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

  async unlinkFromPerson(entityId, personId) {
    const entity = await this.getById(entityId);
    if (entity && entity.people) {
      entity.people = entity.people.filter(id => id !== personId);
      await this.save(entity);
    }
    
    // Remove relationship
    await this.db.entityRelationships
      .where('entityId').equals(entityId)
      .and(rel => rel.relatedId === personId && rel.relationshipType === 'tagged')
      .delete();
  }

  /**
   * Entity Positioning System
   */
  async setPosition(entityId, boardId, context, rowId, columnKey, order = 0) {
    const positionId = `${entityId}_${boardId}_${context}`;
    const position = {
      id: positionId,
      entityId,
      boardId,
      context, // 'board', 'weekly', 'collection'
      rowId: rowId?.toString(),
      columnKey,
      order
    };
    
    return await this.db.entityPositions.put(position);
  }

  async getPosition(entityId, boardId, context = 'board') {
    const positionId = `${entityId}_${boardId}_${context}`;
    return await this.db.entityPositions.get(positionId);
  }

  async removePosition(entityId, boardId, context = 'board') {
    const positionId = `${entityId}_${boardId}_${context}`;
    return await this.db.entityPositions.delete(positionId);
  }

  async getEntitiesInPosition(boardId, rowId, columnKey, context = 'board') {
    const positions = await this.db.entityPositions
      .where('boardId').equals(boardId)
      .and(pos => 
        pos.context === context && 
        pos.rowId === rowId?.toString() && 
        pos.columnKey === columnKey
      )
      .sortBy('order');
    
    const entityIds = positions.map(pos => pos.entityId);
    if (entityIds.length === 0) return [];
    
    const entities = await this.db.entities.where('id').anyOf(entityIds).toArray();
    
    // Sort entities by their position order
    const sortedEntities = positions.map(pos => 
      entities.find(entity => entity.id === pos.entityId)
    ).filter(Boolean);
    
    return sortedEntities;
  }

  async moveEntity(entityId, fromBoardId, toBoardId, fromRowId, fromColumnKey, toRowId, toColumnKey, newOrder = 0) {
    await this.db.transaction('rw', [this.db.entityPositions], async () => {
      // Remove old position
      if (fromBoardId && fromRowId && fromColumnKey) {
        await this.removePosition(entityId, fromBoardId, 'board');
      }
      
      // Set new position
      await this.setPosition(entityId, toBoardId, 'board', toRowId, toColumnKey, newOrder);
    });
  }

  async getOrphanedEntities(boardId = null) {
    const allEntities = await this.getAll();
    const orphaned = [];
    
    for (const entity of allEntities) {
      // Check if entity has a board position
      const hasPosition = boardId 
        ? await this.getPosition(entity.id, boardId, 'board')
        : await this.db.entityPositions.where('entityId').equals(entity.id).first();
      
      // Check if entity is in a weekly plan
      const inWeeklyPlan = await this.db.weeklyItems
        .where('entityId').equals(entity.id)
        .first();
      
      // Check if entity is in a collection
      const inCollection = await this.db.entityRelationships
        .where('entityId').equals(entity.id)
        .and(rel => rel.relationshipType === 'collection')
        .first();
      
      // Only consider it orphaned if it has NO context at all
      if (!hasPosition && !inWeeklyPlan && !inCollection) {
        orphaned.push(entity);
      }
    }
    
    return orphaned;
  }

  async recoverOrphanedEntities(boardId) {
    const orphaned = await this.getOrphanedEntities(boardId);
    if (orphaned.length === 0) return { success: true, recoveredCount: 0 };
    
    // Get board to find first row and column
    const board = await this.db.boards.get(boardId);
    if (!board || !board.rows || !board.columns) {
      throw new Error('Board not found or invalid structure');
    }
    
    const firstRow = board.rows[0];
    const firstColumn = board.columns[0];
    
    if (!firstRow || !firstColumn) {
      throw new Error('Board has no rows or columns');
    }
    
    // Place all orphaned entities in first row, first column
    await this.db.transaction('rw', [this.db.entityPositions], async () => {
      for (let i = 0; i < orphaned.length; i++) {
        await this.setPosition(orphaned[i].id, boardId, 'board', firstRow.id, firstColumn.key, i);
      }
    });
    
    return {
      success: true,
      recoveredCount: orphaned.length,
      placementLocation: {
        rowName: firstRow.name,
        columnName: firstColumn.name
      }
    };
  }

  /**
   * Weekly Planning Integration
   */
  async addToWeeklyPlan(entityId, weekKey, day, order = 0) {
    const weeklyItem = {
      id: `weekly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      weekKey,
      entityId,
      day,
      addedAt: new Date().toISOString(),
      order
    };
    
    return await this.db.weeklyItems.put(weeklyItem);
  }

  async removeFromWeeklyPlan(entityId, weekKey) {
    return await this.db.weeklyItems
      .where('entityId').equals(entityId)
      .and(item => item.weekKey === weekKey)
      .delete();
  }

  async getWeeklyPlanEntities(weekKey, day = null) {
    let query = this.db.weeklyItems.where('weekKey').equals(weekKey);
    
    if (day) {
      query = query.and(item => item.day === day);
    }
    
    const weeklyItems = await query.sortBy('order');
    const entityIds = weeklyItems.map(item => item.entityId);
    
    if (entityIds.length === 0) return [];
    
    const entities = await this.db.entities.where('id').anyOf(entityIds).toArray();
    
    // Sort entities by their weekly plan order
    return weeklyItems.map(item => {
      const entity = entities.find(e => e.id === item.entityId);
      return entity ? { ...entity, weeklyItemId: item.id, day: item.day, order: item.order } : null;
    }).filter(Boolean);
  }

  /**
   * Batch Operations
   */
  async bulkSave(entities) {
    const now = new Date().toISOString();
    const processedEntities = entities.map(entity => ({
      ...entity,
      updatedAt: now,
      createdAt: entity.createdAt || now
    }));
    
    return await this.db.entities.bulkPut(processedEntities);
  }

  async bulkDelete(entityIds) {
    await this.db.transaction('rw', [this.db.entities, this.db.entityPositions, this.db.entityRelationships, this.db.weeklyItems], async () => {
      // Delete entities
      await this.db.entities.where('id').anyOf(entityIds).delete();
      
      // Delete related positions
      await this.db.entityPositions.where('entityId').anyOf(entityIds).delete();
      
      // Delete related relationships
      await this.db.entityRelationships.where('entityId').anyOf(entityIds).delete();
      await this.db.entityRelationships.where('relatedId').anyOf(entityIds).delete();
      
      // Delete weekly plan items
      await this.db.weeklyItems.where('entityId').anyOf(entityIds).delete();
    });
    
    return true;
  }

  /**
   * Statistics and Analytics
   */
  async getEntityStats() {
    const entities = await this.getAll();
    const stats = {
      total: entities.length,
      byType: {},
      byStatus: { completed: 0, pending: 0 },
      byPriority: { high: 0, medium: 0, low: 0 },
      withDueDate: 0,
      withPeople: 0,
      withTags: 0
    };
    
    entities.forEach(entity => {
      // Count by type
      stats.byType[entity.type] = (stats.byType[entity.type] || 0) + 1;
      
      // Count by status
      if (entity.completed) {
        stats.byStatus.completed++;
      } else {
        stats.byStatus.pending++;
      }
      
      // Count by priority
      if (entity.priority) {
        stats.byPriority[entity.priority] = (stats.byPriority[entity.priority] || 0) + 1;
      }
      
      // Count with metadata
      if (entity.dueDate) stats.withDueDate++;
      if (entity.people && entity.people.length > 0) stats.withPeople++;
      if (entity.tags && entity.tags.length > 0) stats.withTags++;
    });
    
    return stats;
  }
}

// Create and export singleton instance
export const entityService = new EntityService();

// Backward compatibility aliases
export const entityAdapter = entityService;