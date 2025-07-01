/**
 * GridFlow - Entity Positions Adapter
 * Handles entity positioning and context within boards
 */

import { BaseAdapter } from '../base-adapter.js';

export class EntityPositionsAdapter extends BaseAdapter {
  constructor() {
    super('entityPositions');
  }

  /**
   * Create or update entity position
   * @param {string} entityId - Entity ID
   * @param {string} boardId - Board ID
   * @param {string} context - Context (board, weekly, etc.)
   * @param {string} rowId - Row ID
   * @param {string} columnKey - Column key
   * @param {number} order - Order within the position
   * @returns {Promise<Object>} Position record
   */
  async setPosition(entityId, boardId, context, rowId, columnKey, order = 0) {
    try {
      const positionId = `${entityId}_${boardId}_${context}`;
      const position = {
        id: positionId,
        entityId,
        boardId,
        context,
        rowId,
        columnKey,
        order,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.save(position);
      return position;
    } catch (error) {
      console.error('Failed to set entity position:', error);
      throw error;
    }
  }

  /**
   * Get position for a specific entity in a board context
   * @param {string} entityId - Entity ID
   * @param {string} boardId - Board ID
   * @param {string} context - Context (board, weekly, etc.)
   * @returns {Promise<Object|null>} Position record or null if not found
   */
  async getPosition(entityId, boardId, context = 'board') {
    try {
      const positionId = `${entityId}_${boardId}_${context}`;
      return await this.getById(positionId);
    } catch (error) {
      console.error('Failed to get entity position:', error);
      return null;
    }
  }

  /**
   * Get all entities in a specific position
   * @param {string} boardId - Board ID
   * @param {string} context - Context (board, weekly, etc.)
   * @param {string} rowId - Row ID
   * @param {string} columnKey - Column key
   * @returns {Promise<Array>} Array of position records
   */
  async getEntitiesInPosition(boardId, context, rowId, columnKey) {
    try {
      const allPositions = await this.getAll();
      return allPositions.filter(pos => 
        pos.boardId === boardId &&
        pos.context === context &&
        pos.rowId === rowId &&
        pos.columnKey === columnKey
      ).sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      console.error('Failed to get entities in position:', error);
      return [];
    }
  }

  /**
   * Get all entities on a board
   * @param {string} boardId - Board ID
   * @param {string} context - Context (board, weekly, etc.)
   * @returns {Promise<Array>} Array of position records
   */
  async getEntitiesOnBoard(boardId, context = 'board') {
    try {
      return await this.getByIndex('boardId', boardId).then(positions =>
        positions.filter(pos => pos.context === context)
      );
    } catch (error) {
      console.error('Failed to get entities on board:', error);
      return [];
    }
  }

  /**
   * Remove entity position
   * @param {string} entityId - Entity ID
   * @param {string} boardId - Board ID
   * @param {string} context - Context (board, weekly, etc.)
   * @returns {Promise<boolean>} Success status
   */
  async removePosition(entityId, boardId, context = 'board') {
    try {
      const positionId = `${entityId}_${boardId}_${context}`;
      return await this.delete(positionId);
    } catch (error) {
      console.error('Failed to remove entity position:', error);
      return false;
    }
  }

  /**
   * Move entity to new position
   * @param {string} entityId - Entity ID
   * @param {string} boardId - Board ID
   * @param {string} context - Context
   * @param {string} newRowId - New row ID
   * @param {string} newColumnKey - New column key
   * @param {number} newOrder - New order
   * @returns {Promise<Object>} Updated position
   */
  async moveEntity(entityId, boardId, context, newRowId, newColumnKey, newOrder = 0) {
    try {
      return await this.setPosition(entityId, boardId, context, newRowId, newColumnKey, newOrder);
    } catch (error) {
      console.error('Failed to move entity:', error);
      throw error;
    }
  }

  /**
   * Get entities without positions (orphaned entities)
   * @param {Array} allEntityIds - Array of all entity IDs
   * @param {string} boardId - Board ID to check
   * @param {string} context - Context to check
   * @returns {Promise<Array>} Array of orphaned entity IDs
   */
  async getOrphanedEntities(allEntityIds, boardId, context = 'board') {
    try {
      const positionsOnBoard = await this.getEntitiesOnBoard(boardId, context);
      const positionedEntityIds = new Set(positionsOnBoard.map(pos => pos.entityId));
      
      return allEntityIds.filter(entityId => !positionedEntityIds.has(entityId));
    } catch (error) {
      console.error('Failed to get orphaned entities:', error);
      return allEntityIds; // Return all as orphaned on error to be safe
    }
  }

  /**
   * Batch set positions for multiple entities
   * @param {Array} positions - Array of position objects
   * @returns {Promise<Array>} Array of created positions
   */
  async batchSetPositions(positions) {
    try {
      const results = [];
      for (const pos of positions) {
        const result = await this.setPosition(
          pos.entityId,
          pos.boardId,
          pos.context,
          pos.rowId,
          pos.columnKey,
          pos.order
        );
        results.push(result);
      }
      return results;
    } catch (error) {
      console.error('Failed to batch set positions:', error);
      throw error;
    }
  }
}

// Create singleton instance
const entityPositionsAdapter = new EntityPositionsAdapter();

export default entityPositionsAdapter;