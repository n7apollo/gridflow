/**
 * GridFlow - IndexedDB Test Runner
 * Basic tests to verify IndexedDB infrastructure works correctly
 */

import database from './database.js';
import { entityAdapter, boardAdapter } from './adapters.js';
import featureFlags, { FLAGS } from '../feature-flags.js';
import dualWriteService from './dual-writer.js';
import dataValidator from './validator.js';

class IndexedDBTestRunner {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  /**
   * Run all tests
   * @returns {Promise<Object>} Test results
   */
  async runAllTests() {
    console.log('🧪 Starting IndexedDB Infrastructure Tests...');
    const startTime = performance.now();
    
    this.results = [];
    this.passed = 0;
    this.failed = 0;

    // Test database initialization
    await this.test('Database Initialization', () => this.testDatabaseInit());
    
    // Test entity operations
    await this.test('Entity CRUD Operations', () => this.testEntityOperations());
    
    // Test board operations  
    await this.test('Board CRUD Operations', () => this.testBoardOperations());
    
    // Test feature flags
    await this.test('Feature Flags System', () => this.testFeatureFlags());
    
    // Test data validation
    await this.test('Data Validation', () => this.testDataValidation());

    const duration = performance.now() - startTime;
    const summary = {
      passed: this.passed,
      failed: this.failed,
      total: this.passed + this.failed,
      duration: duration,
      results: this.results
    };

    console.log(`🧪 Tests completed: ${this.passed}/${summary.total} passed in ${duration.toFixed(2)}ms`);
    
    if (this.failed > 0) {
      console.error('❌ Some tests failed. Check results for details.');
    } else {
      console.log('✅ All tests passed!');
    }

    return summary;
  }

  /**
   * Test database initialization
   */
  async testDatabaseInit() {
    // Test database initialization
    await database.init();
    
    if (!database.isReady()) {
      throw new Error('Database not ready after initialization');
    }

    // Test database info
    const info = database.getInfo();
    if (!info || !info.name || !info.objectStoreNames) {
      throw new Error('Database info incomplete');
    }

    // Verify all stores were created
    const expectedStores = [
      'entities', 'boards', 'groups', 'rows', 'columns',
      'entityPositions', 'people', 'entityRelationships',
      'collections', 'tags', 'weeklyPlans', 'weeklyItems',
      'templates', 'metadata'
    ];

    for (const storeName of expectedStores) {
      if (!info.objectStoreNames.includes(storeName)) {
        throw new Error(`Store ${storeName} not created`);
      }
    }

    return 'Database initialized with all required stores';
  }

  /**
   * Test entity CRUD operations
   */
  async testEntityOperations() {
    // Create test entity
    const testEntity = {
      id: 'test_entity_1',
      type: 'task',
      title: 'Test Entity',
      content: 'This is a test entity',
      completed: false,
      priority: 'medium',
      tags: ['test', 'automated'],
      createdAt: new Date().toISOString()
    };

    // Test save
    const savedEntity = await entityAdapter.save(testEntity);
    if (savedEntity.id !== testEntity.id) {
      throw new Error('Entity save failed - ID mismatch');
    }

    // Test retrieve
    const retrievedEntity = await entityAdapter.getById(testEntity.id);
    if (!retrievedEntity || retrievedEntity.id !== testEntity.id) {
      throw new Error('Entity retrieve failed');
    }

    // Test get by type
    const taskEntities = await entityAdapter.getByType('task');
    if (!taskEntities.some(e => e.id === testEntity.id)) {
      throw new Error('Get by type failed');
    }

    // Test get by tag
    const taggedEntities = await entityAdapter.getByTag('test');
    if (!taggedEntities.some(e => e.id === testEntity.id)) {
      throw new Error('Get by tag failed');
    }

    // Test search
    const searchResults = await entityAdapter.search('Test Entity');
    if (!searchResults.some(e => e.id === testEntity.id)) {
      throw new Error('Search failed');
    }

    // Test count
    const count = await entityAdapter.count();
    if (count < 1) {
      throw new Error('Count failed');
    }

    // Test delete
    const deleted = await entityAdapter.delete(testEntity.id);
    if (!deleted) {
      throw new Error('Entity delete failed');
    }

    // Verify deletion
    const deletedEntity = await entityAdapter.getById(testEntity.id);
    if (deletedEntity) {
      throw new Error('Entity not properly deleted');
    }

    return 'All entity CRUD operations successful';
  }

  /**
   * Test board operations
   */
  async testBoardOperations() {
    const testBoard = {
      id: 'test_board_1',
      name: 'Test Board',
      groups: [],
      rows: [],
      columns: [],
      createdAt: new Date().toISOString()
    };

    // Test save
    const savedBoard = await boardAdapter.save(testBoard);
    if (savedBoard.id !== testBoard.id) {
      throw new Error('Board save failed');
    }

    // Test retrieve
    const retrievedBoard = await boardAdapter.getById(testBoard.id);
    if (!retrievedBoard || retrievedBoard.id !== testBoard.id) {
      throw new Error('Board retrieve failed');
    }

    // Test get all
    const allBoards = await boardAdapter.getAll();
    if (!allBoards.some(b => b.id === testBoard.id)) {
      throw new Error('Get all boards failed');
    }

    // Clean up
    await boardAdapter.delete(testBoard.id);

    return 'All board operations successful';
  }

  /**
   * Test feature flags system
   */
  async testFeatureFlags() {
    // Test initial state
    if (featureFlags.isEnabled('nonexistent_flag')) {
      throw new Error('Nonexistent flag should not be enabled');
    }

    // Test enable
    featureFlags.enable(FLAGS.INDEXEDDB_ENABLED);
    if (!featureFlags.isEnabled(FLAGS.INDEXEDDB_ENABLED)) {
      throw new Error('Flag enable failed');
    }

    // Test disable
    featureFlags.disable(FLAGS.INDEXEDDB_ENABLED);
    if (featureFlags.isEnabled(FLAGS.INDEXEDDB_ENABLED)) {
      throw new Error('Flag disable failed');
    }

    // Test toggle
    featureFlags.toggle(FLAGS.INDEXEDDB_ENABLED);
    if (!featureFlags.isEnabled(FLAGS.INDEXEDDB_ENABLED)) {
      throw new Error('Flag toggle failed');
    }

    return 'Feature flags system working correctly';
  }

  /**
   * Test data validation
   */
  async testDataValidation() {
    // Create some test data in IndexedDB
    const testEntity = {
      id: 'validation_test_1',
      type: 'note',
      title: 'Validation Test',
      content: 'Test validation',
      completed: false,
      tags: [],
      createdAt: new Date().toISOString()
    };

    await entityAdapter.save(testEntity);

    // Since we don't have legacy data to compare against in tests,
    // just verify the validator can run without errors
    try {
      const results = await dataValidator.validateConsistency();
      if (!results || typeof results !== 'object') {
        throw new Error('Validation returned invalid results');
      }
    } catch (error) {
      // Clean up test data
      await entityAdapter.delete(testEntity.id);
      throw error;
    }

    // Clean up test data
    await entityAdapter.delete(testEntity.id);

    return 'Data validation system functional';
  }

  /**
   * Run a single test with error handling
   * @param {string} name - Test name
   * @param {Function} testFn - Test function
   */
  async test(name, testFn) {
    try {
      const result = await testFn();
      this.results.push({
        name,
        passed: true,
        result,
        error: null,
        duration: 0
      });
      this.passed++;
      console.log(`✅ ${name}: ${result}`);
    } catch (error) {
      this.results.push({
        name,
        passed: false,
        result: null,
        error: error.message,
        duration: 0
      });
      this.failed++;
      console.error(`❌ ${name}: ${error.message}`);
    }
  }

  /**
   * Get test summary
   * @returns {Object} Test summary
   */
  getSummary() {
    return {
      passed: this.passed,
      failed: this.failed,
      total: this.passed + this.failed,
      results: this.results
    };
  }
}

// Create singleton instance
const testRunner = new IndexedDBTestRunner();

// Make available globally for manual testing
if (typeof window !== 'undefined') {
  window.indexedDBTests = testRunner;
}

export default testRunner;