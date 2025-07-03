/**
 * GridFlow - Board Service (Dexie)
 * Handles board structure management and operations
 */

import { db } from './db.js';

export class BoardService {
  constructor() {
    this.db = db;
  }

  /**
   * Board CRUD Operations
   */
  async save(board) {
    const now = new Date().toISOString();
    board.updatedAt = now;
    if (!board.createdAt) board.createdAt = now;
    
    // Ensure board has required structure
    if (!board.id) {
      throw new Error('Board must have an ID');
    }
    if (!board.groups) board.groups = [];
    if (!board.rows) board.rows = [];
    if (!board.columns) board.columns = [];
    if (!board.settings) board.settings = { showCheckboxes: true, showSubtaskProgress: true };
    
    // Ensure ID counters exist
    if (!board.nextRowId) board.nextRowId = Math.max(...board.rows.map(r => parseInt(r.id) || 0), 0) + 1;
    if (!board.nextColumnId) board.nextColumnId = Math.max(...board.columns.map(c => parseInt(c.id) || 0), 0) + 1;
    if (!board.nextGroupId) board.nextGroupId = Math.max(...board.groups.map(g => parseInt(g.id) || 0), 0) + 1;
    
    return await this.db.boards.put(board);
  }

  async getById(id) {
    return await this.db.boards.get(id);
  }

  async delete(id) {
    await this.db.transaction('rw', [this.db.boards, this.db.entityPositions], async () => {
      // Delete the board
      await this.db.boards.delete(id);
      
      // Delete entity positions for this board
      await this.db.entityPositions.where('boardId').equals(id).delete();
    });
    
    return true;
  }

  async getAll() {
    return await this.db.boards.toArray();
  }

  async exists(id) {
    const board = await this.getById(id);
    return !!board;
  }

  /**
   * Board Structure Operations
   */
  async addGroup(boardId, name, color = '#3b82f6', collapsed = false) {
    const board = await this.getById(boardId);
    if (!board) throw new Error(`Board ${boardId} not found`);
    
    const newGroup = {
      id: board.nextGroupId || 1,
      name,
      color,
      collapsed
    };
    
    board.groups = board.groups || [];
    board.groups.push(newGroup);
    board.nextGroupId = (board.nextGroupId || 1) + 1;
    
    await this.save(board);
    return newGroup;
  }

  async updateGroup(boardId, groupId, updates) {
    const board = await this.getById(boardId);
    if (!board) throw new Error(`Board ${boardId} not found`);
    
    const groupIndex = board.groups.findIndex(g => g.id == groupId);
    if (groupIndex === -1) throw new Error(`Group ${groupId} not found`);
    
    board.groups[groupIndex] = { ...board.groups[groupIndex], ...updates };
    await this.save(board);
    return board.groups[groupIndex];
  }

  async deleteGroup(boardId, groupId) {
    const board = await this.getById(boardId);
    if (!board) throw new Error(`Board ${boardId} not found`);
    
    // Remove group
    board.groups = board.groups.filter(g => g.id != groupId);
    
    // Remove rows in this group or move them to no group
    board.rows = board.rows.map(row => 
      row.groupId == groupId ? { ...row, groupId: null } : row
    );
    
    await this.save(board);
    return true;
  }

  async addRow(boardId, name, description = '', groupId = null) {
    const board = await this.getById(boardId);
    if (!board) throw new Error(`Board ${boardId} not found`);
    
    const newRow = {
      id: board.nextRowId || 1,
      name,
      description,
      groupId: groupId ? parseInt(groupId) : null,
      cards: {} // Initialize empty cards object
    };
    
    // Initialize cards for each column
    board.columns = board.columns || [];
    board.columns.forEach(column => {
      newRow.cards[column.key] = [];
    });
    
    board.rows = board.rows || [];
    board.rows.push(newRow);
    board.nextRowId = (board.nextRowId || 1) + 1;
    
    await this.save(board);
    return newRow;
  }

  async updateRow(boardId, rowId, updates) {
    const board = await this.getById(boardId);
    if (!board) throw new Error(`Board ${boardId} not found`);
    
    const rowIndex = board.rows.findIndex(r => r.id == rowId);
    if (rowIndex === -1) throw new Error(`Row ${rowId} not found`);
    
    board.rows[rowIndex] = { ...board.rows[rowIndex], ...updates };
    await this.save(board);
    return board.rows[rowIndex];
  }

  async deleteRow(boardId, rowId) {
    const board = await this.getById(boardId);
    if (!board) throw new Error(`Board ${boardId} not found`);
    
    // Remove row
    board.rows = board.rows.filter(r => r.id != rowId);
    
    // Delete entity positions for this row
    await this.db.entityPositions
      .where('boardId').equals(boardId)
      .and(pos => pos.rowId === rowId.toString())
      .delete();
    
    await this.save(board);
    return true;
  }

  async addColumn(boardId, name, key = null) {
    const board = await this.getById(boardId);
    if (!board) throw new Error(`Board ${boardId} not found`);
    
    // Generate key if not provided
    if (!key) {
      key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      // Ensure key is unique
      const existingKeys = board.columns.map(c => c.key);
      let counter = 1;
      let baseKey = key;
      while (existingKeys.includes(key)) {
        key = `${baseKey}${counter}`;
        counter++;
      }
    }
    
    const newColumn = {
      id: board.nextColumnId || 1,
      name,
      key
    };
    
    board.columns = board.columns || [];
    board.columns.push(newColumn);
    board.nextColumnId = (board.nextColumnId || 1) + 1;
    
    // Add column to all existing rows
    board.rows = board.rows || [];
    board.rows.forEach(row => {
      if (!row.cards) row.cards = {};
      row.cards[key] = [];
    });
    
    await this.save(board);
    return newColumn;
  }

  async updateColumn(boardId, columnId, updates) {
    const board = await this.getById(boardId);
    if (!board) throw new Error(`Board ${boardId} not found`);
    
    const columnIndex = board.columns.findIndex(c => c.id == columnId);
    if (columnIndex === -1) throw new Error(`Column ${columnId} not found`);
    
    const oldColumn = board.columns[columnIndex];
    const newColumn = { ...oldColumn, ...updates };
    
    // If key changed, update all row cards and entity positions
    if (updates.key && updates.key !== oldColumn.key) {
      // Update row cards
      board.rows.forEach(row => {
        if (row.cards && row.cards[oldColumn.key]) {
          row.cards[updates.key] = row.cards[oldColumn.key];
          delete row.cards[oldColumn.key];
        }
      });
      
      // Update entity positions
      await this.db.entityPositions
        .where('boardId').equals(boardId)
        .and(pos => pos.columnKey === oldColumn.key)
        .modify({ columnKey: updates.key });
    }
    
    board.columns[columnIndex] = newColumn;
    await this.save(board);
    return newColumn;
  }

  async deleteColumn(boardId, columnId) {
    const board = await this.getById(boardId);
    if (!board) throw new Error(`Board ${boardId} not found`);
    
    const column = board.columns.find(c => c.id == columnId);
    if (!column) throw new Error(`Column ${columnId} not found`);
    
    // Remove column
    board.columns = board.columns.filter(c => c.id != columnId);
    
    // Remove column from all rows
    board.rows.forEach(row => {
      if (row.cards && row.cards[column.key]) {
        delete row.cards[column.key];
      }
    });
    
    // Delete entity positions for this column
    await this.db.entityPositions
      .where('boardId').equals(boardId)
      .and(pos => pos.columnKey === column.key)
      .delete();
    
    await this.save(board);
    return true;
  }

  /**
   * Board Settings
   */
  async updateSettings(boardId, settings) {
    const board = await this.getById(boardId);
    if (!board) throw new Error(`Board ${boardId} not found`);
    
    board.settings = { ...board.settings, ...settings };
    await this.save(board);
    return board.settings;
  }

  async getSetting(boardId, key) {
    const board = await this.getById(boardId);
    if (!board) return null;
    
    return board.settings ? board.settings[key] : null;
  }

  /**
   * Board Entity Management (Bridge to Entity Service)
   */
  async getEntitiesInCell(boardId, rowId, columnKey) {
    const positions = await this.db.entityPositions
      .where('boardId').equals(boardId)
      .and(pos => 
        pos.context === 'board' && 
        pos.rowId === rowId.toString() && 
        pos.columnKey === columnKey
      )
      .sortBy('order');
    
    const entityIds = positions.map(pos => pos.entityId);
    if (entityIds.length === 0) return [];
    
    const entities = await this.db.entities.where('id').anyOf(entityIds).toArray();
    
    // Sort entities by their position order
    return positions.map(pos => 
      entities.find(entity => entity.id === pos.entityId)
    ).filter(Boolean);
  }

  async moveEntityInBoard(boardId, entityId, fromRowId, fromColumnKey, toRowId, toColumnKey, newOrder = 0) {
    const positionId = `${entityId}_${boardId}_board`;
    
    await this.db.entityPositions.put({
      id: positionId,
      entityId,
      boardId,
      context: 'board',
      rowId: toRowId.toString(),
      columnKey: toColumnKey,
      order: newOrder
    });
    
    return true;
  }

  /**
   * Get board with entity positions populated
   */
  async getBoardWithEntities(boardId) {
    const board = await this.getById(boardId);
    if (!board) return null;
    
    // Populate cards from entity positions
    if (board.rows && board.columns) {
      for (const row of board.rows) {
        if (!row.cards) row.cards = {};
        
        for (const column of board.columns) {
          // Get entity IDs for this cell
          const positions = await this.db.entityPositions
            .where('boardId').equals(boardId)
            .and(pos => 
              pos.context === 'board' && 
              pos.rowId === row.id.toString() && 
              pos.columnKey === column.key
            )
            .sortBy('order');
            
          row.cards[column.key] = positions.map(pos => pos.entityId);
        }
      }
    }
    
    return board;
  }

  /**
   * Board Validation and Repair
   */
  async validateBoard(boardId) {
    const board = await this.getById(boardId);
    if (!board) return { valid: false, error: 'Board not found' };
    
    const issues = [];
    
    // Check required structure
    if (!board.groups) {
      board.groups = [];
      issues.push('Added missing groups array');
    }
    if (!board.rows) {
      board.rows = [];
      issues.push('Added missing rows array');
    }
    if (!board.columns) {
      board.columns = [];
      issues.push('Added missing columns array');
    }
    if (!board.settings) {
      board.settings = { showCheckboxes: true, showSubtaskProgress: true };
      issues.push('Added missing settings');
    }
    
    // Check ID counters
    if (!board.nextRowId) {
      board.nextRowId = Math.max(...board.rows.map(r => parseInt(r.id) || 0), 0) + 1;
      issues.push('Fixed nextRowId counter');
    }
    if (!board.nextColumnId) {
      board.nextColumnId = Math.max(...board.columns.map(c => parseInt(c.id) || 0), 0) + 1;
      issues.push('Fixed nextColumnId counter');
    }
    if (!board.nextGroupId) {
      board.nextGroupId = Math.max(...board.groups.map(g => parseInt(g.id) || 0), 0) + 1;
      issues.push('Fixed nextGroupId counter');
    }
    
    // Ensure all rows have cards for all columns
    board.rows.forEach((row, rowIndex) => {
      if (!row.cards) row.cards = {};
      board.columns.forEach(column => {
        if (!row.cards[column.key]) {
          row.cards[column.key] = [];
          issues.push(`Added missing cards array for row ${row.id}, column ${column.key}`);
        }
      });
    });
    
    // Save fixes if any
    if (issues.length > 0) {
      await this.save(board);
    }
    
    return {
      valid: true,
      issues,
      repaired: issues.length > 0
    };
  }

  /**
   * Board Duplication
   */
  async duplicateBoard(sourceBoardId, newName, newId = null) {
    const sourceBoard = await this.getById(sourceBoardId);
    if (!sourceBoard) throw new Error(`Source board ${sourceBoardId} not found`);
    
    const newBoard = {
      ...sourceBoard,
      id: newId || `board_${Date.now()}`,
      name: newName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Clear entity references from rows (don't duplicate entities, just structure)
    newBoard.rows.forEach(row => {
      if (row.cards) {
        Object.keys(row.cards).forEach(columnKey => {
          row.cards[columnKey] = [];
        });
      }
    });
    
    await this.save(newBoard);
    return newBoard;
  }

  /**
   * Board Search and Filtering
   */
  async searchBoards(searchTerm) {
    const term = searchTerm.toLowerCase();
    const boards = await this.getAll();
    
    return boards.filter(board =>
      board.name.toLowerCase().includes(term) ||
      board.description?.toLowerCase().includes(term)
    );
  }

  async getBoardsByDateRange(startDate, endDate) {
    const boards = await this.getAll();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return boards.filter(board => {
      const created = new Date(board.createdAt);
      return created >= start && created <= end;
    });
  }

  /**
   * Get board with entity positions populated in row.cards
   */
  async getBoardWithEntities(boardId) {
    const board = await this.getById(boardId);
    if (!board) throw new Error(`Board ${boardId} not found`);
    
    // Get all entity positions for this board
    const positions = await this.db.entityPositions
      .where('boardId').equals(boardId)
      .and(pos => pos.context === 'board')
      .toArray();
    
    console.log(`Loading ${positions.length} entity positions for board ${boardId}`);
    
    // Clear existing cards arrays and populate from positions
    board.rows.forEach(row => {
      if (!row.cards) row.cards = {};
      // Initialize all column arrays as empty
      board.columns.forEach(column => {
        row.cards[column.key] = [];
      });
    });
    
    // Group positions by row and column
    positions.forEach(pos => {
      const row = board.rows.find(r => r.id.toString() === pos.rowId.toString());
      if (row && row.cards && row.cards.hasOwnProperty(pos.columnKey)) {
        // Insert entity ID at the correct position
        if (!row.cards[pos.columnKey]) {
          row.cards[pos.columnKey] = [];
        }
        row.cards[pos.columnKey].push(pos.entityId);
      } else {
        console.warn(`Position references invalid row ${pos.rowId} or column ${pos.columnKey}`, pos);
      }
    });
    
    // Sort entities in each column by their order
    board.rows.forEach(row => {
      board.columns.forEach(column => {
        if (row.cards[column.key] && row.cards[column.key].length > 1) {
          // Sort by the order field from positions
          row.cards[column.key].sort((a, b) => {
            const posA = positions.find(p => p.entityId === a && p.rowId === row.id.toString() && p.columnKey === column.key);
            const posB = positions.find(p => p.entityId === b && p.rowId === row.id.toString() && p.columnKey === column.key);
            return (posA?.order || 0) - (posB?.order || 0);
          });
        }
      });
    });
    
    return board;
  }

  /**
   * Board Statistics
   */
  async getBoardStats(boardId) {
    const board = await this.getById(boardId);
    if (!board) throw new Error(`Board ${boardId} not found`);
    
    const entities = await this.db.entities.where('id').anyOf(
      (await this.db.entityPositions
        .where('boardId').equals(boardId)
        .and(pos => pos.context === 'board')
        .toArray())
      .map(pos => pos.entityId)
    ).toArray();
    
    const stats = {
      groups: board.groups.length,
      rows: board.rows.length,
      columns: board.columns.length,
      entities: entities.length,
      entitiesByType: {},
      entitiesByStatus: { completed: 0, pending: 0 },
      entitiesByColumn: {}
    };
    
    // Initialize column stats
    board.columns.forEach(column => {
      stats.entitiesByColumn[column.key] = 0;
    });
    
    entities.forEach(entity => {
      // Count by type
      stats.entitiesByType[entity.type] = (stats.entitiesByType[entity.type] || 0) + 1;
      
      // Count by status
      if (entity.completed) {
        stats.entitiesByStatus.completed++;
      } else {
        stats.entitiesByStatus.pending++;
      }
    });
    
    // Count entities by column
    const positions = await this.db.entityPositions
      .where('boardId').equals(boardId)
      .and(pos => pos.context === 'board')
      .toArray();
    
    positions.forEach(pos => {
      if (stats.entitiesByColumn.hasOwnProperty(pos.columnKey)) {
        stats.entitiesByColumn[pos.columnKey]++;
      }
    });
    
    return stats;
  }
}

// Create and export singleton instance
export const boardService = new BoardService();

// Backward compatibility alias
export const boardAdapter = boardService;