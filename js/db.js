/**
 * GridFlow - Dexie Database with Cloud Sync
 * Complete database setup with optimized schema for bidirectional linking and Dexie Cloud sync
 */

import { Dexie } from 'dexie';
import dexieCloudAddon from 'dexie-cloud-addon';

// GridFlow Database with Dexie and Cloud Sync
class GridFlowDB extends Dexie {
  constructor() {
    // Initialize with Dexie Cloud addon
    super('GridFlowDB', { addons: [dexieCloudAddon] });
    
    this.cloudAddonReady = true;
    this.pendingCloudConfig = null;
    
    console.log('🌤️ GridFlowDB initialized with Dexie Cloud addon');
    
    this.version(1).stores({
      // Core entities with bidirectional indexes (using @ for cloud sync)
      entities: '@id, type, boardId, completed, priority, dueDate, *tags, *people, createdAt, updatedAt',
      
      // Board structure (simplified - groups/rows/columns stored in boards object)
      boards: '@id, name, createdAt',
      entityPositions: '@id, entityId, boardId, context, rowId, columnKey, order',
      
      // Bidirectional people system
      people: '@id, name, email, company, *tags, lastInteraction',
      entityRelationships: '@id, entityId, relatedId, relationshipType, createdAt',
      
      // Collections & tags
      collections: '@id, name, type, category, createdAt',
      tags: '@id, name, category, parent, usageCount',
      
      // Weekly planning
      weeklyPlans: 'weekKey, weekStart, createdAt',
      weeklyItems: '@id, weekKey, entityId, day, addedAt',
      
      // Templates & settings
      templates: '@id, name, category, createdAt',
      settings: 'key, category, lastUpdated',
      metadata: 'key, lastUpdated'
    });
    
    // Add hooks for automatic relationship updates
    this.entityRelationships.hook('creating', this.updateBidirectionalLinks);
    this.entityRelationships.hook('deleting', this.cleanupBidirectionalLinks);
    
    // Add entity hooks for automatic people relationship tracking
    this.entities.hook('updating', this.trackEntityUpdates);
    
    // Configure Dexie Cloud after database is initialized
    // Configuration will be done in setCloudDatabase method when URL is provided
  }
  
  /**
   * Get the Dexie Cloud database URL (hardcoded for this app)
   */
  getDatabaseUrl() {
    return 'https://z87sp4xp5.dexie.cloud';
  }
  
  /**
   * Configure Dexie Cloud database URL
   */
  async setCloudDatabase() {
    const databaseUrl = this.getDatabaseUrl();
    
    if (!this.cloud) {
      throw new Error('Dexie Cloud addon not available. Please ensure dexie-cloud-addon is loaded.');
    }
    
    // Configure cloud connection as per Dexie Cloud documentation
    this.cloud.configure({
      databaseUrl: databaseUrl,
      requireAuth: false // optional - allows anonymous sync
    });
    
    console.log('✅ Dexie Cloud configured with URL:', databaseUrl);
  }
  
  /**
   * Enable cloud sync
   */
  async enableCloudSync() {
    if (!this.cloud) {
      throw new Error('Dexie Cloud addon not available');
    }
    
    if (!this.getDatabaseUrl()) {
      throw new Error('Database URL not configured. Please set cloud database URL first.');
    }
    
    try {
      await this.cloud.sync();
      console.log('✅ Cloud sync enabled');
      return true;
    } catch (error) {
      console.error('❌ Failed to enable cloud sync:', error);
      throw error;
    }
  }
  
  /**
   * Disable cloud sync (go to local-only mode)
   */
  async disableCloudSync() {
    this.cloud.configure({
      databaseUrl: null
    });
    console.log('✅ Cloud sync disabled - running in local-only mode');
  }
  
  /**
   * Get cloud sync status
   */
  getCloudStatus() {
    const isConfigured = !!this.getDatabaseUrl();
    
    // Get current values from observables
    let isConnected = false;
    let currentUser = null;
    let syncState = null;
    
    if (this.cloud) {
      try {
        // persistedSyncState is a BehaviorSubject - get current value
        if (this.cloud.persistedSyncState && typeof this.cloud.persistedSyncState.value !== 'undefined') {
          syncState = this.cloud.persistedSyncState.value;
          isConnected = syncState && syncState.connected;
        }
        
        // currentUser is a BehaviorSubject - get current value  
        if (this.cloud.currentUser && typeof this.cloud.currentUser.value !== 'undefined') {
          currentUser = this.cloud.currentUser.value;
          // Debug log user object structure
          if (currentUser) {
            console.log('🔍 Current user object:', currentUser, 'Type:', typeof currentUser, 'Keys:', Object.keys(currentUser || {}));
          }
        }
      } catch (error) {
        console.warn('⚠️ Error accessing cloud observables:', error);
      }
    }
    
    return {
      configured: isConfigured,
      connected: isConnected,
      user: currentUser,
      databaseUrl: this.getDatabaseUrl(),
      syncState: syncState,
      cloudAddonAvailable: !!this.cloud
    };
  }
  
  /**
   * Login to Dexie Cloud
   */
  async login(email) {
    if (!this.cloud) {
      throw new Error('Dexie Cloud addon not available');
    }
    
    try {
      await this.cloud.login({ email });
      console.log('✅ Login initiated for:', email);
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }
  
  /**
   * Logout from Dexie Cloud
   */
  async logout() {
    try {
      if (this.cloud && this.cloud.logout) {
        await this.cloud.logout();
      }
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw error;
    }
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
      
      // Configure cloud automatically
      if (this.cloud) {
        try {
          await this.setCloudDatabase();
          console.log('☁️ Dexie Cloud configured automatically');
        } catch (cloudError) {
          console.warn('⚠️ Could not configure Dexie Cloud:', cloudError);
        }
      }
      
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
    
    try {
      console.log('🏗️ Creating initial data...');
      
      // Create default board (omit id completely for auto-generation)
      const defaultBoard = {
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
    
    const boardId = await this.boards.add(defaultBoard);
    
    // Create sample entities (omit id completely for auto-generation)
    const task1Id = await this.entities.add({
      type: 'task',
      title: 'Welcome to GridFlow!',
      content: 'This is your first task. You can edit it by clicking on it.',
      completed: false,
      priority: 'medium',
      tags: ['welcome'],
      people: [],
      createdAt: now,
      updatedAt: now
    });
    
    const note1Id = await this.entities.add({
      type: 'note',
      title: 'Getting Started Guide',
      content: 'GridFlow helps you organize tasks, notes, and projects visually. Try dragging cards between columns!',
      completed: false,
      tags: ['guide'],
      people: [],
      createdAt: now,
      updatedAt: now
    });
    
    // Create entity positions (omit id for auto-generation)
    await this.entityPositions.add({
      entityId: task1Id,
      boardId: boardId,
      context: 'board',
      rowId: '1',
      columnKey: 'todo',
      order: 0
    });
    
    await this.entityPositions.add({
      entityId: note1Id,
      boardId: boardId,
      context: 'board',
      rowId: '2',
      columnKey: 'todo',
      order: 0
    });
    
    // Create sample tags (omit id for auto-generation)
    await this.tags.add({ 
      name: 'welcome', 
      category: 'system', 
      usageCount: 1, 
      createdAt: now 
    });
    
    await this.tags.add({ 
      name: 'guide', 
      category: 'system', 
      usageCount: 1, 
      createdAt: now 
    });
    
      // Set current board in metadata
      await this.metadata.add({
        key: 'currentBoardId',
        value: boardId,
        lastUpdated: now
      });
      
      console.log('✅ Initial data created successfully with boardId:', boardId);
    } catch (error) {
      console.error('❌ Failed to create initial data:', error);
      throw error;
    }
  }

  /**
   * Clear all data and reinitialize (for debugging)
   */
  async clearAndReinitialize() {
    try {
      console.log('🗑️ Clearing database...');
      await this.delete();
      console.log('🔄 Reopening database...');
      await this.open();
      console.log('🏗️ Creating fresh initial data...');
      await this.createInitialData();
      console.log('✅ Database cleared and reinitialized');
    } catch (error) {
      console.error('❌ Failed to clear and reinitialize:', error);
      throw error;
    }
  }
}

// Create and export the database instance
export const db = new GridFlowDB();

// Make database available globally for debugging
if (typeof window !== 'undefined') {
  window.gridFlowDB = db;
  window.clearAndReinitializeDB = () => db.clearAndReinitialize();
}