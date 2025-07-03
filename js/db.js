/**
 * GridFlow - Dexie Database
 * Complete database setup with optimized schema for bidirectional linking
 */

// GridFlow Database with Dexie
class GridFlowDB extends Dexie {
  constructor() {
    super('GridFlowDB');
    
    this.version(1).stores({
      // Core entities with bidirectional indexes
      entities: 'id, type, boardId, completed, priority, dueDate, *tags, *people, createdAt, updatedAt',
      
      // Board structure (simplified - groups/rows/columns stored in boards object)
      boards: 'id, name, createdAt',
      entityPositions: 'id, entityId, boardId, context, rowId, columnKey, order',
      
      // Bidirectional people system
      people: 'id, name, email, company, *tags, lastInteraction',
      entityRelationships: 'id, entityId, relatedId, relationshipType, createdAt',
      
      // Collections & tags
      collections: 'id, name, type, category, createdAt',
      tags: 'id, name, category, parent, usageCount',
      
      // Weekly planning
      weeklyPlans: 'weekKey, weekStart, createdAt',
      weeklyItems: 'id, weekKey, entityId, day, addedAt',
      
      // Templates & settings
      templates: 'id, name, category, createdAt',
      settings: 'key, category, lastUpdated',
      metadata: 'key, lastUpdated'
    });
    
    // Add hooks for automatic relationship updates
    this.entityRelationships.hook('creating', this.updateBidirectionalLinks);
    this.entityRelationships.hook('deleting', this.cleanupBidirectionalLinks);
    
    // Add entity hooks for automatic people relationship tracking
    this.entities.hook('updating', this.trackEntityUpdates);
  }
  
  // Automatic bidirectional relationship maintenance
  updateBidirectionalLinks = (primKey, obj, trans) => {
    // Auto-update lastInteraction for people when entities are linked
    if (obj.relationshipType === 'tagged' && obj.relatedId.startsWith('person_')) {
      trans.table('people').update(obj.relatedId, { 
        lastInteraction: new Date().toISOString() 
      });
    }
  };
  
  // Cleanup bidirectional relationships when deleted
  cleanupBidirectionalLinks = (primKey, obj, trans) => {
    // Could add cleanup logic here if needed
    console.log('Relationship deleted:', obj);
  };
  
  // Track entity updates to maintain people relationships
  trackEntityUpdates = (modifications, primKey, obj, trans) => {
    // Auto-update lastInteraction for related people when entities are modified
    if (obj.people && obj.people.length > 0) {
      obj.people.forEach(personId => {
        if (personId.startsWith('person_')) {
          trans.table('people').update(personId, { 
            lastInteraction: new Date().toISOString() 
          });
        }
      });
    }
  };
  
  /**
   * Initialize the database and create sample data if needed
   */
  async initialize() {
    try {
      await this.open();
      console.log('✅ Dexie database opened successfully');
      
      // Check if we need to create initial data
      const boardCount = await this.boards.count();
      if (boardCount === 0) {
        console.log('🏗️ Creating initial board and sample data...');
        await this.createInitialData();
      }
      
      return this;
    } catch (error) {
      console.error('❌ Failed to initialize Dexie database:', error);
      throw error;
    }
  }
  
  /**
   * Create initial board and sample data
   */
  async createInitialData() {
    const now = new Date().toISOString();
    
    // Create default board
    const defaultBoard = {
      id: 'default',
      name: 'Getting Started',
      groups: [
        { id: 1, name: 'Personal', color: '#3b82f6', collapsed: false },
        { id: 2, name: 'Work', color: '#10b981', collapsed: false }
      ],
      rows: [
        { id: 1, name: 'Quick Tasks', description: 'Simple tasks to get started', groupId: 1 },
        { id: 2, name: 'Projects', description: 'Larger ongoing projects', groupId: 2 }
      ],
      columns: [
        { id: 1, name: 'To Do', key: 'todo' },
        { id: 2, name: 'In Progress', key: 'inprogress' },
        { id: 3, name: 'Done', key: 'done' }
      ],
      settings: {
        showCheckboxes: true,
        showSubtaskProgress: true
      },
      nextRowId: 3,
      nextColumnId: 4,
      nextGroupId: 3,
      createdAt: now
    };
    
    await this.boards.add(defaultBoard);
    
    // Create sample entities
    const sampleEntities = [
      {
        id: 'task_1',
        type: 'task',
        title: 'Welcome to GridFlow!',
        content: 'This is your first task. You can edit it by clicking on it.',
        completed: false,
        priority: 'medium',
        tags: ['welcome'],
        people: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'note_1',
        type: 'note',
        title: 'Getting Started Guide',
        content: 'GridFlow helps you organize tasks, notes, and projects visually. Try dragging cards between columns!',
        completed: false,
        tags: ['guide'],
        people: [],
        createdAt: now,
        updatedAt: now
      }
    ];
    
    await this.entities.bulkAdd(sampleEntities);
    
    // Create entity positions
    const positions = [
      {
        id: 'task_1_default_board',
        entityId: 'task_1',
        boardId: 'default',
        context: 'board',
        rowId: '1',
        columnKey: 'todo',
        order: 0
      },
      {
        id: 'note_1_default_board',
        entityId: 'note_1',
        boardId: 'default',
        context: 'board',
        rowId: '2',
        columnKey: 'todo',
        order: 0
      }
    ];
    
    await this.entityPositions.bulkAdd(positions);
    
    // Create sample tags
    const sampleTags = [
      { id: 'tag_1', name: 'welcome', category: 'system', usageCount: 1, createdAt: now },
      { id: 'tag_2', name: 'guide', category: 'system', usageCount: 1, createdAt: now }
    ];
    
    await this.tags.bulkAdd(sampleTags);
    
    // Set current board in metadata
    await this.metadata.add({
      key: 'currentBoardId',
      value: 'default',
      lastUpdated: now
    });
    
    console.log('✅ Initial data created successfully');
  }
}

// Create and export the database instance
export const db = new GridFlowDB();

// Make database available globally for debugging
if (typeof window !== 'undefined') {
  window.gridFlowDB = db;
}