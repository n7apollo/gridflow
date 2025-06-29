Think through the implementation, with existing data structure (boards, board organization - groups, rows, columns, entities - cards, tasks, subtasks, notes, checklists, weekly plans, weekly plan items - linked to entities, the ability to move entities around - reposition on a board, add to a weekly plan as an item, etc.). Also think about adding people, which could be an entity (my idea is that I could then lookup a specific person and see all of the notes, tasks, cards, etc. which I have tagged that person to - this would not be used to share things with those people, it is purely for the end user to keep track of people in their life). I would also like a collections view, saved searches, and tags, which I think we started doing some of but never finished, where we can create custom collections of entities based on filters. My overall idea for this app is for it to be a life planner app that works how my brain works (simple systems that can be powerful when I need them to be, visual, somewhat gamified, nudging me in the right direction but not overwhelming me, helping me remember things and not let things slip through the cracks).

✻ Thinking…

This is a really interesting and comprehensive request. The user wants to think through implementing IndexedDB with their existing data structure, but also wants to expand the functionality significantly to include:

1. People as entities
2. Collections view with saved searches  
3. Tags system (partially implemented)
4. A life planner app approach

Let me think through this systematically:

Current Data Structure

- Boards (with groups, rows, columns)
- Entities (tasks, notes, checklists, projects)
- Weekly plans with entity references
- Templates
- Some collections/tags started

New Requirements

- People as entities
- Lookup people to see all related content
- Collections view (saved searches)
- Tags system completion
- Life planner philosophy

IndexedDB Schema Design

I need to think about how to structure this for:

1. Performance (indexed queries)
2. Relationships (people to entities)
3. Collections/saved searches
4. Tags
5. Cross-references

Key Design Decisions

1. People as Entities: Should people be entities like tasks/notes, or a separate concept?
- I think entities make sense - they can have titles, content, tags, etc.
- But they need special handling for relationships
2. Relationships: How to handle many-to-many relationships?
- Entity ↔ People (tagged relationships)
- Entity ↔ Tags  
- Entity ↔ Collections
- Entity ↔ Board positions
- Entity ↔ Weekly plan items
3. Collections: Saved searches with filters
- Need to store filter criteria
- Need to execute dynamic queries
- Should update automatically as entities change
4. Tags: Simple tagging system
- Many-to-many with entities
- Hierarchical tags possible?
- Tag suggestions/autocomplete

Let me design a comprehensive IndexedDB schema and implementation plan.

⏺ Excellent vision! A life planner that adapts to how your brain works - visual, flexible, powerful but not overwhelming. Let me design a comprehensive IndexedDB implementation that supports your expanded functionality.

# IndexedDB Schema Design

## Object Stores Structure

```javascript
  const SCHEMA = {
    // Core Data
    entities: {
      keyPath: 'id',
      indexes: {
        type: ['type'],
        boardId: ['boardId'],
        completed: ['completed'],
        priority: ['priority'],
        dueDate: ['dueDate'],
        tags: ['tags', { multiEntry: true }],
        people: ['people', { multiEntry: true }],
        createdAt: ['createdAt'],
        updatedAt: ['updatedAt']
      }
    },

    // Board Structure
    boards: { keyPath: 'id' },
    groups: { keyPath: 'id', indexes: { boardId: ['boardId'] } },
    rows: { keyPath: 'id', indexes: { boardId: ['boardId'], groupId: ['groupId'] } },
    columns: { keyPath: 'id', indexes: { boardId: ['boardId'] } },

    // Positioning & Context
    entityPositions: {
      keyPath: 'id',
      indexes: {
        entityId: ['entityId'],
        boardId: ['boardId'],
        context: ['context'] // 'board', 'weekly', 'collection'
      }
    },

    // People & Relationships
    people: {
      keyPath: 'id',
      indexes: {
        name: ['name'],
        tags: ['tags', { multiEntry: true }],
        lastInteraction: ['lastInteraction']
      }
    },

    entityRelationships: {
      keyPath: 'id',
      indexes: {
        entityId: ['entityId'],
        relatedId: ['relatedId'],
        relationshipType: ['relationshipType'] // 'tagged', 'subtask', 'reference'
      }
    },

    // Collections & Saved Searches
    collections: {
      keyPath: 'id',
      indexes: {
        type: ['type'], // 'saved_search', 'manual', 'smart'
        category: ['category']
      }
    },

    // Tags System
    tags: {
      keyPath: 'id',
      indexes: {
        category: ['category'],
        parent: ['parent'],
        usageCount: ['usageCount']
      }
    },

    // Weekly Planning
    weeklyPlans: { keyPath: 'weekKey' },
    weeklyItems: {
      keyPath: 'id',
      indexes: {
        weekKey: ['weekKey'],
        entityId: ['entityId'],
        day: ['day']
      }
    }
  };
```

# Enhanced Entity System

## People as Special Entities

``` javascript
  // js/people-service.js
  class PeopleService {
    async createPerson(personData) {
      const person = {
        id: `person_${await this.getNextId('person')}`,
        type: 'person',
        name: personData.name,
        title: personData.name, // For entity compatibility
        content: personData.bio || '',

        // Person-specific fields
        email: personData.email,
        phone: personData.phone,
        company: personData.company,
        role: personData.role,
        birthday: personData.birthday,
        lastInteraction: new Date().toISOString(),
        interactionFrequency: personData.frequency || 'monthly',

        // Standard entity fields
        tags: personData.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.db.saveEntity(person);
      return person;
    }

    async getPersonRelatedEntities(personId) {
      // Find all entities tagged with this person
      const relationships = await this.db.getRelationships({
        relatedId: personId,
        relationshipType: 'tagged'
      });

      const entityIds = relationships.map(r => r.entityId);
      const entities = await this.db.getEntitiesByIds(entityIds);

      return {
        tasks: entities.filter(e => e.type === 'task'),
        notes: entities.filter(e => e.type === 'note'),
        projects: entities.filter(e => e.type === 'project'),
        meetings: entities.filter(e => e.tags.includes('meeting')),
        lastInteraction: await this.getLastInteraction(personId)
      };
    }

    async suggestFollowUps() {
      const people = await this.getAllPeople();
      const overdue = [];

      for (const person of people) {
        const daysSinceContact = this.daysSince(person.lastInteraction);
        const expectedFrequency = this.getFrequencyDays(person.interactionFrequency);

        if (daysSinceContact > expectedFrequency) {
          overdue.push({
            person,
            daysSinceContact,
            suggestion: await this.generateFollowUpSuggestion(person)
          });
        }
      }

      return overdue.sort((a, b) => b.daysSinceContact - a.daysSinceContact);
    }
  }
```

# Advanced Entity Relationships

```javascript
  // js/relationship-service.js
  class RelationshipService {
    async tagEntityWithPerson(entityId, personId) {
      const relationship = {
        id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        entityId,
        relatedId: personId,
        relationshipType: 'tagged',
        createdAt: new Date().toISOString()
      };

      await this.db.saveRelationship(relationship);

      // Update person's last interaction
      await this.peopleService.updateLastInteraction(personId);
    }

    async createSubtaskRelationship(parentEntityId, subtaskEntityId) {
      const relationship = {
        id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        entityId: subtaskEntityId,
        relatedId: parentEntityId,
        relationshipType: 'subtask',
        createdAt: new Date().toISOString()
      };

      await this.db.saveRelationship(relationship);
    }

    async getEntityNetwork(entityId, depth = 2) {
      // Build a network graph of related entities
      const visited = new Set();
      const network = { nodes: [], edges: [] };

      await this.buildNetworkRecursive(entityId, depth, visited, network);
      return network;
    }
  }
```

# Collections & Saved Searches

## Smart Collections System

```javascript
  // js/collections-service.js
  class CollectionsService {
    async createSavedSearch(name, filters, category = 'general') {
      const collection = {
        id: `collection_${await this.getNextId('collection')}`,
        name,
        type: 'saved_search',
        category,
        filters,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        autoUpdate: true
      };

      await this.db.saveCollection(collection);
      return collection;
    }

    async executeSearch(filters) {
      let entities = await this.db.getAllEntities();

      // Apply filters
      if (filters.type) {
        entities = entities.filter(e => e.type === filters.type);
      }

      if (filters.tags && filters.tags.length > 0) {
        entities = entities.filter(e =>
          filters.tags.some(tag => e.tags.includes(tag))
        );
      }

      if (filters.people && filters.people.length > 0) {
        const relationships = await this.db.getRelationships({
          relatedId: { $in: filters.people },
          relationshipType: 'tagged'
        });
        const entityIds = relationships.map(r => r.entityId);
        entities = entities.filter(e => entityIds.includes(e.id));
      }

      if (filters.priority) {
        entities = entities.filter(e => e.priority === filters.priority);
      }

      if (filters.completed !== undefined) {
        entities = entities.filter(e => e.completed === filters.completed);
      }

      if (filters.dateRange) {
        entities = entities.filter(e =>
          this.isInDateRange(e.dueDate || e.createdAt, filters.dateRange)
        );
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        entities = entities.filter(e =>
          e.title.toLowerCase().includes(searchLower) ||
          e.content.toLowerCase().includes(searchLower)
        );
      }

      return entities;
    }

    // Predefined smart collections
    async getSmartCollections() {
      return [
        {
          id: 'overdue_tasks',
          name: 'Overdue Tasks',
          icon: '⚠️',
          filters: {
            type: 'task',
            completed: false,
            dateRange: { before: new Date().toISOString() }
          }
        },
        {
          id: 'this_week',
          name: 'This Week',
          icon: '📅',
          filters: {
            dateRange: { thisWeek: true }
          }
        },
        {
          id: 'high_priority',
          name: 'High Priority',
          icon: '🔥',
          filters: {
            priority: 'high',
            completed: false
          }
        },
        {
          id: 'recent_notes',
          name: 'Recent Notes',
          icon: '📝',
          filters: {
            type: 'note',
            dateRange: { last7Days: true }
          }
        },
        {
          id: 'follow_ups_needed',
          name: 'Follow-ups Needed',
          icon: '👥',
          generateDynamic: () => this.peopleService.suggestFollowUps()
        }
      ];
    }
  }
```

# Enhanced Tags System

```javascript
  // js/tags-service.js
  class TagsService {
    async createTag(name, category = 'general', parent = null) {
      const tag = {
        id: `tag_${await this.getNextId('tag')}`,
        name,
        category,
        parent,
        color: this.generateTagColor(category),
        usageCount: 0,
        createdAt: new Date().toISOString()
      };

      await this.db.saveTag(tag);
      return tag;
    }

    async getTagSuggestions(input, context) {
      const allTags = await this.db.getAllTags();
      const recent = await this.getRecentlyUsedTags();
      const contextual = await this.getContextualTags(context);

      const suggestions = [
        ...this.filterTags(recent, input),
        ...this.filterTags(contextual, input),
        ...this.filterTags(allTags, input)
      ];

      return [...new Set(suggestions)].slice(0, 10);
    }

    async getTagHierarchy() {
      const allTags = await this.db.getAllTags();
      const hierarchy = {};

      // Build tree structure
      allTags.forEach(tag => {
        if (!tag.parent) {
          hierarchy[tag.id] = { ...tag, children: [] };
        }
      });

      allTags.forEach(tag => {
        if (tag.parent && hierarchy[tag.parent]) {
          hierarchy[tag.parent].children.push(tag);
        }
      });

      return hierarchy;
    }
  }
```

# Life Planner Features

## Gentle Nudging System

```javascript
  // js/nudging-service.js
  class NudgingService {
    async generateDailyNudges() {
      const nudges = [];

      // Overdue tasks nudge
      const overdueTasks = await this.collectionsService.executeSearch({
        type: 'task',
        completed: false,
        dateRange: { before: new Date().toISOString() }
      });

      if (overdueTasks.length > 0) {
        nudges.push({
          type: 'gentle_reminder',
          title: `${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''} waiting for you`,
          message: `Would you like to tackle "${overdueTasks[0].title}" first?`,
          action: 'show_overdue_tasks',
          priority: overdueTasks.length > 5 ? 'high' : 'medium'
        });
      }

      // People follow-up nudge
      const followUps = await this.peopleService.suggestFollowUps();
      if (followUps.length > 0) {
        const person = followUps[0];
        nudges.push({
          type: 'social_nudge',
          title: `Haven't connected with ${person.person.name} lately`,
          message: `It's been ${person.daysSinceContact} days. ${person.suggestion}`,
          action: 'create_follow_up_task',
          data: { personId: person.person.id }
        });
      }

      // Weekly planning nudge
      const currentWeek = this.getCurrentWeekKey();
      const weeklyPlan = await this.db.getWeeklyPlan(currentWeek);
      if (!weeklyPlan || !weeklyPlan.goal) {
        nudges.push({
          type: 'planning_nudge',
          title: 'What\'s your focus this week?',
          message: 'Setting a weekly goal helps maintain direction',
          action: 'open_weekly_planning'
        });
      }

      return this.prioritizeNudges(nudges);
    }

    async generateGameification() {
      const today = new Date().toISOString().split('T')[0];
      const stats = await this.getStatsForPeriod(today);

      return {
        streaks: {
          daily_completion: await this.getDailyCompletionStreak(),
          weekly_goals: await this.getWeeklyGoalStreak()
        },
        achievements: await this.checkNewAchievements(stats),
        progress: {
          tasks_completed_today: stats.tasksCompleted,
          weekly_goal_progress: await this.getWeeklyProgress(),
          people_contacted_this_week: stats.peopleContacted
        }
      };
    }
  }
```

## Visual Dashboard

```javascript
  // js/dashboard-service.js
  class DashboardService {
    async generateDashboardData() {
      const [
        todayStats,
        weeklyProgress,
        recentActivity,
        upcomingItems,
        peopleInsights,
        collections
      ] = await Promise.all([
        this.getTodayStats(),
        this.getWeeklyProgress(),
        this.getRecentActivity(),
        this.getUpcomingItems(),
        this.getPeopleInsights(),
        this.collectionsService.getSmartCollections()
      ]);

      return {
        todayStats,
        weeklyProgress,
        recentActivity,
        upcomingItems,
        peopleInsights,
        collections,
        nudges: await this.nudgingService.generateDailyNudges(),
        gamification: await this.nudgingService.generateGameification()
      };
    }

    async getPeopleInsights() {
      const recentContacts = await this.getRecentContacts(7);
      const overdueFollowUps = await this.peopleService.suggestFollowUps();
      const birthdays = await this.getUpcomingBirthdays(30);

      return {
        recentContacts: recentContacts.slice(0, 5),
        overdueFollowUps: overdueFollowUps.slice(0, 3),
        upcomingBirthdays: birthdays
      };
    }
  }
```

# Data Migration Strategy

## Gradual Migration Path

```javascript
  // js/indexeddb-migration.js
  class LifePlannerMigration {
    async migrateToLifePlanner() {
      console.log('Migrating to Life Planner IndexedDB structure...');

      // Phase 1: Migrate existing entities
      await this.migrateExistingEntities();

      // Phase 2: Create people from existing tagged entities
      await this.extractPeopleFromTags();

      // Phase 3: Migrate board positioning
      await this.migrateEntityPositions();

      // Phase 4: Create smart collections
      await this.createInitialCollections();

      // Phase 5: Initialize tags system
      await this.initializeTagsSystem();
    }

    async extractPeopleFromTags() {
      const entities = await this.dataService.getAllEntities();
      const peopleNames = new Set();

      // Find potential people in tags and content
      entities.forEach(entity => {
        entity.tags.forEach(tag => {
          if (this.isPotentialPersonName(tag)) {
            peopleNames.add(tag);
          }
        });

        // Extract @mentions from content
        const mentions = this.extractMentions(entity.content);
        mentions.forEach(name => peopleNames.add(name));
      });

      // Create people entities
      for (const name of peopleNames) {
        await this.peopleService.createPerson({ name });
      }
    }
  }
```

This IndexedDB implementation would transform GridFlow into a comprehensive life planner that:

1. Scales: Handle thousands of entities efficiently
2. Connects: Link people to all related content
3. Organizes: Smart collections and saved searches
4. Nudges: Gentle reminders without overwhelming
5. Visualizes: Rich dashboard with insights
6. Gamifies: Progress tracking and achievements
7. Adapts: Flexible enough for different thinking styles

# Implementation Plan & Steps

## Pre-Transition Preparation

### 1. Create Development Branch
```bash
git checkout -b indexeddb-transition
git push -u origin indexeddb-transition
```

### 2. Backup & Testing Strategy
- [ ] Create comprehensive backup system
- [ ] Set up automated testing for data integrity
- [ ] Create sample data generators for testing at scale
- [ ] Implement rollback mechanism

### 3. Feature Flags System
```javascript
// js/feature-flags.js
class FeatureFlags {
  constructor() {
    this.flags = JSON.parse(localStorage.getItem('gridflow_feature_flags') || '{}');
  }
  
  isEnabled(flag) {
    return this.flags[flag] === true;
  }
  
  enable(flag) {
    this.flags[flag] = true;
    localStorage.setItem('gridflow_feature_flags', JSON.stringify(this.flags));
  }
}

const flags = {
  INDEXEDDB_ENABLED: 'indexeddb_enabled',
  PEOPLE_SYSTEM: 'people_system',
  COLLECTIONS_VIEW: 'collections_view',
  NUDGING_SYSTEM: 'nudging_system'
};
```

## Phase 1: IndexedDB Foundation (Week 1-2)

### Milestone 1.1: Basic IndexedDB Infrastructure
**Deliverables:**
- [ ] `js/indexeddb/database.js` - Core database wrapper
- [ ] `js/indexeddb/stores.js` - Object store definitions
- [ ] `js/indexeddb/adapters.js` - Data access adapters
- [ ] Basic unit tests

**Implementation Steps:**
1. **Create IndexedDB Database Class**
```javascript
// js/indexeddb/database.js
class GridFlowIndexedDB {
  constructor() {
    this.db = null;
    this.version = 1;
    this.dbName = 'GridFlowDB';
  }
  
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onupgradeneeded = (event) => {
        this.db = event.target.result;
        this.createObjectStores();
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };
      
      request.onerror = () => reject(request.error);
    });
  }
}
```

2. **Create Store Definitions**
```javascript
// js/indexeddb/stores.js
export const STORES = {
  entities: {
    keyPath: 'id',
    indexes: [
      { name: 'type', keyPath: 'type' },
      { name: 'boardId', keyPath: 'boardId' },
      { name: 'completed', keyPath: 'completed' },
      { name: 'tags', keyPath: 'tags', options: { multiEntry: true } }
    ]
  },
  // ... other stores
};
```

3. **Create Data Adapters**
```javascript
// js/indexeddb/adapters.js
class EntityAdapter {
  constructor(db) {
    this.db = db;
    this.storeName = 'entities';
  }
  
  async getById(id) {
    const transaction = this.db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    return store.get(id);
  }
  
  async save(entity) {
    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    return store.put(entity);
  }
}
```

### Milestone 1.2: Parallel Data System
**Deliverables:**
- [ ] Dual-write system (localStorage + IndexedDB)
- [ ] Data consistency validation
- [ ] Performance comparison tools

**Implementation Steps:**
1. **Create Dual-Write Service**
```javascript
// js/indexeddb/dual-writer.js
class DualWriteService {
  constructor(legacyService, indexedDBService) {
    this.legacy = legacyService;
    this.indexedDB = indexedDBService;
    this.enabled = window.featureFlags.isEnabled('INDEXEDDB_ENABLED');
  }
  
  async saveEntity(entity) {
    // Always save to localStorage first (fallback)
    await this.legacy.saveEntity(entity);
    
    // Also save to IndexedDB if enabled
    if (this.enabled) {
      try {
        await this.indexedDB.saveEntity(entity);
      } catch (error) {
        console.error('IndexedDB save failed, using localStorage only:', error);
      }
    }
  }
}
```

2. **Create Validation Tools**
```javascript
// js/indexeddb/validator.js
class DataValidator {
  async validateConsistency() {
    const legacyData = await this.legacy.getAllEntities();
    const indexedDBData = await this.indexedDB.getAllEntities();
    
    return this.compareDataSets(legacyData, indexedDBData);
  }
}
```

## Phase 2: Core Data Migration (Week 3-4)

### Milestone 2.1: Entity Migration
**Deliverables:**
- [ ] Complete entity migration from localStorage
- [ ] Board structure migration
- [ ] Weekly plans migration
- [ ] Data integrity verification

**Implementation Steps:**
1. **Create Migration Service**
```javascript
// js/indexeddb/migration-service.js
class MigrationService {
  async migrateFromLocalStorage() {
    console.log('Starting IndexedDB migration...');
    
    const backupData = this.createBackup();
    
    try {
      await this.migrateEntities();
      await this.migrateBoards();
      await this.migrateWeeklyPlans();
      await this.migrateTemplates();
      
      await this.validateMigration();
      console.log('Migration completed successfully');
      
    } catch (error) {
      console.error('Migration failed, rolling back...', error);
      await this.rollback(backupData);
      throw error;
    }
  }
}
```

2. **Implement Batch Migration**
```javascript
async migrateBatch(entities, batchSize = 100) {
  for (let i = 0; i < entities.length; i += batchSize) {
    const batch = entities.slice(i, i + batchSize);
    await this.processBatch(batch);
    
    // Update progress
    const progress = Math.round((i / entities.length) * 100);
    this.updateMigrationProgress(progress);
  }
}
```

### Milestone 2.2: Switch to IndexedDB
**Deliverables:**
- [ ] Update all data access to use IndexedDB
- [ ] Remove localStorage dependencies
- [ ] Performance benchmarking

## Phase 3: People System (Week 5-6)

### Milestone 3.1: People Entity Framework
**Deliverables:**
- [ ] People entity type implementation
- [ ] Person creation/editing UI
- [ ] People relationship system

**Implementation Steps:**
1. **Create People Service**
```javascript
// js/people/people-service.js
class PeopleService {
  async createPerson(data) {
    const person = {
      id: `person_${await this.getNextPersonId()}`,
      type: 'person',
      name: data.name,
      title: data.name,
      ...data
    };
    
    return await this.entityService.saveEntity(person);
  }
}
```

2. **Create People UI Components**
```javascript
// components/people-view.js
class PeopleView extends HTMLElement {
  connectedCallback() {
    this.innerHTML = this.getTemplate();
    this.loadPeople();
  }
  
  getTemplate() {
    return `
      <div class="people-container">
        <div class="people-grid"></div>
        <div class="person-details-panel"></div>
      </div>
    `;
  }
}
```

### Milestone 3.2: People Relationships
**Deliverables:**
- [ ] Entity-person tagging system
- [ ] Person detail view showing related entities
- [ ] Follow-up suggestion system

## Phase 4: Collections & Smart Searches (Week 7-8)

### Milestone 4.1: Collections Framework
**Deliverables:**
- [ ] Collection creation and management
- [ ] Filter system implementation
- [ ] Saved search functionality

### Milestone 4.2: Smart Collections
**Deliverables:**
- [ ] Predefined smart collections
- [ ] Dynamic collection updates
- [ ] Collection sharing/export

## Phase 5: Life Planner Features (Week 9-10)

### Milestone 5.1: Dashboard System
**Deliverables:**
- [ ] Main dashboard implementation
- [ ] Widget system for different views
- [ ] Customizable dashboard layout

### Milestone 5.2: Nudging & Gamification
**Deliverables:**
- [ ] Gentle nudging system
- [ ] Progress tracking
- [ ] Achievement system

## Phase 6: Enhanced UI & Polish (Week 11-12)

### Milestone 6.1: Visual Improvements
**Deliverables:**
- [ ] Enhanced board view with performance improvements
- [ ] People view integration
- [ ] Collections view

### Milestone 6.2: Mobile & Responsive
**Deliverables:**
- [ ] Mobile-optimized interfaces
- [ ] Touch interaction improvements
- [ ] Progressive Web App features

## Testing Strategy

### Unit Tests
```javascript
// tests/indexeddb/entity-service.test.js
describe('EntityService', () => {
  beforeEach(async () => {
    this.db = await createTestDatabase();
    this.service = new EntityService(this.db);
  });
  
  it('should save and retrieve entities', async () => {
    const entity = createTestEntity();
    await this.service.save(entity);
    const retrieved = await this.service.getById(entity.id);
    expect(retrieved).toEqual(entity);
  });
});
```

### Integration Tests
```javascript
// tests/integration/migration.test.js
describe('Migration', () => {
  it('should migrate localStorage data to IndexedDB', async () => {
    // Setup localStorage with test data
    const originalData = createLegacyTestData();
    localStorage.setItem('gridflow_data', JSON.stringify(originalData));
    
    // Run migration
    await migrationService.migrateFromLocalStorage();
    
    // Verify IndexedDB contains migrated data
    const migratedData = await indexedDBService.getAllEntities();
    expect(migratedData).toMatchOriginalData(originalData);
  });
});
```

### Performance Tests
```javascript
// tests/performance/query-performance.test.js
describe('Query Performance', () => {
  it('should handle large datasets efficiently', async () => {
    await this.seedDatabase(10000); // 10k entities
    
    const startTime = performance.now();
    const results = await this.service.getEntitiesByType('task');
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(100); // < 100ms
  });
});
```

## Rollback Strategy

### Automatic Rollback Triggers
```javascript
class RollbackManager {
  async checkRollbackConditions() {
    const checks = [
      { name: 'dataIntegrity', fn: () => this.validateDataIntegrity() },
      { name: 'performance', fn: () => this.validatePerformance() },
      { name: 'userReports', fn: () => this.checkUserReports() }
    ];
    
    for (const check of checks) {
      if (!await check.fn()) {
        console.error(`Rollback triggered by: ${check.name}`);
        await this.initiateRollback();
        return;
      }
    }
  }
}
```

## Cloud Sync Adaptation

### Modified Sync Strategy
```javascript
// js/cloud-sync/indexeddb-sync.js
class IndexedDBCloudSync {
  async syncToCloud() {
    // Export IndexedDB to GridFlow JSON format
    const exportData = await this.exportForCloud();
    
    // Maintain compatibility with existing cloud sync
    return await this.legacyCloudSync.uploadData(exportData);
  }
  
  async exportForCloud() {
    // Convert back to v5 format for cloud compatibility
    const [entities, boards, weeklyPlans] = await Promise.all([
      this.indexedDB.getAllEntities(),
      this.indexedDB.getAllBoards(),
      this.indexedDB.getAllWeeklyPlans()
    ]);
    
    return this.formatForLegacyCloud({ entities, boards, weeklyPlans });
  }
}
```

## Monitoring & Analytics

### Migration Monitoring
```javascript
class MigrationMonitor {
  trackMigrationStep(step, data) {
    const event = {
      step,
      timestamp: Date.now(),
      entityCount: data.entityCount,
      duration: data.duration,
      success: data.success
    };
    
    this.sendToAnalytics('migration_step', event);
  }
}
```

### Performance Monitoring
```javascript
class PerformanceMonitor {
  async trackQueryPerformance(operation, fn) {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    this.recordMetric(operation, duration);
    return result;
  }
}
```

## Success Metrics

### Technical Metrics
- [ ] Migration completion rate: 100%
- [ ] Data integrity: 100% match
- [ ] Query performance: <100ms for typical operations
- [ ] Storage efficiency: >50% reduction in data redundancy

### User Experience Metrics
- [ ] Page load time improvement: >30%
- [ ] Search responsiveness: <50ms
- [ ] Zero data loss incidents
- [ ] User satisfaction: >90% positive feedback

## Risk Mitigation

### Data Loss Prevention
1. **Multiple Backups**: Automated backups before each migration step
2. **Incremental Migration**: Migrate in small batches with validation
3. **Rollback Testing**: Regularly test rollback procedures
4. **User Communication**: Clear messaging about migration progress

### Performance Monitoring
1. **Real-time Monitoring**: Track performance during migration
2. **Automatic Rollback**: Trigger rollback on performance degradation
3. **Progressive Enhancement**: Enable features gradually based on performance

## Implementation Progress Log

### Phase 1: IndexedDB Foundation - STARTED ✅

**Date Started:** 2024-12-29

#### Milestone 1.1: Basic IndexedDB Infrastructure - COMPLETED ✅

**Files Created:**
- ✅ `js/feature-flags.js` - Feature toggle system with IndexedDB flags
- ✅ `js/indexeddb/stores.js` - Complete object store definitions with indexes
- ✅ `js/indexeddb/database.js` - Core database wrapper with error handling
- ✅ `js/indexeddb/adapters.js` - High-level data access adapters
- ✅ `js/indexeddb/dual-writer.js` - Dual-write service for safe transition
- ✅ `js/indexeddb/validator.js` - Data consistency validation
- ✅ `js/indexeddb/test-runner.js` - Infrastructure testing suite
- ✅ `js/app.js` - Updated to integrate IndexedDB system

**Key Features Implemented:**
- 14 object stores with proper indexes (entities, boards, people, relationships, etc.)
- Feature flag system for gradual rollout
- Dual-write capability (localStorage + IndexedDB)
- Comprehensive error handling and automatic fallback
- Data validation between storage systems
- Automated testing suite for infrastructure verification

**Technical Notes:**
- Database opens with upgrade handling for new installations
- All stores include proper indexes for performance (type, boardId, tags, etc.)
- Feature flags stored in localStorage for persistence
- Dual-write service includes error counting and auto-disable
- Validation compares entity and board data between systems
- Tests verify CRUD operations, feature flags, and validation

**Current Status:**
- IndexedDB infrastructure ready for testing
- Feature flags: INDEXEDDB_ENABLED (default: false)
- Integration points established in app.js
- All error handling and fallback mechanisms in place

#### Milestone 1.2: Parallel Data System - COMPLETED ✅

**Files Created:**
- ✅ `js/indexeddb/migration-service.js` - Complete data migration from localStorage
- ✅ `test-indexeddb.html` - Comprehensive test interface for manual verification

**Key Features Implemented:**
- Full data migration service with progress tracking
- Batch processing for large datasets (50 entities per batch)
- Automatic backup creation before migration
- Validation system to verify migration success
- Rollback capability if migration fails
- Integration with dual-write service activation

**Technical Implementation:**
- Migrates entities, boards, weekly plans, and weekly items separately
- Progress tracking with estimated completion times
- Error handling with detailed error collection
- Automatic feature flag management (enables dual-write on success)
- Comprehensive validation comparing source vs migrated data
- Backup system using timestamped localStorage keys

**Testing Infrastructure:**
- Created dedicated test page (`test-indexeddb.html`) with UI buttons
- Manual testing controls for all infrastructure components
- Real-time progress logging and status updates
- Feature flag management interface
- Data validation and migration controls

**Next Steps:**
1. ~~Enable IndexedDB flag and test infrastructure~~ ✅ DONE
2. ~~Begin implementing parallel data system (Milestone 1.2)~~ ✅ DONE  
3. ~~Create migration service for existing data~~ ✅ DONE
4. Begin Phase 2: Core Data Migration testing with real data
5. Implement entity system integration for dual-write mode

#### Issues Encountered:
- None - migration service implemented successfully with comprehensive error handling

#### Changes from Original Plan:
- Added comprehensive error logging system to dual-writer
- Enhanced test suite with more thorough validation  
- Added automatic feature flag disable on repeated failures
- Created dedicated test interface for manual verification
- Enhanced migration service with better progress tracking and rollback

---

The key is building it incrementally - start with IndexedDB migration, then add people, then collections, etc.

Each phase adds value while maintaining the simple, visual, brain-friendly approach you want.