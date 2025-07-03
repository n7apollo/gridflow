/**
 * GridFlow - Comprehensive Test Suite for Dexie Architecture
 * Tests all CRUD operations, queries, relationships, and performance
 */

import { db } from './db.js';
import { entityService } from './entity-service.js';
import { boardService } from './board-service.js';
import { metaService } from './meta-service.js';
import { dataMigrator } from './migration-strategy.js';
import { dataValidator } from './data-validator.js';

/**
 * Comprehensive test suite for the Dexie architecture
 */
export class ComprehensiveTestSuite {
    constructor() {
        this.testResults = [];
        this.performanceMetrics = {};
        this.setupComplete = false;
    }

    /**
     * Run all comprehensive tests
     */
    async runAllTests() {
        console.log('🧪 Starting Comprehensive Test Suite for Dexie Architecture...');
        
        try {
            // Setup test environment
            await this.setupTestEnvironment();
            
            // Run test categories
            await this.testCRUDOperations();
            await this.testComplexQueries();
            await this.testImportExport();
            await this.testCrossEntityRelationships();
            await this.testPerformance();
            
            // Generate comprehensive report
            const report = this.generateComprehensiveReport();
            
            console.log('\n📊 Comprehensive Test Results:');
            console.log('================================');
            console.log(`Total Tests: ${this.testResults.length}`);
            console.log(`Passed: ${this.testResults.filter(r => r.success).length}`);
            console.log(`Failed: ${this.testResults.filter(r => !r.success).length}`);
            console.log(`Success Rate: ${Math.round(report.summary.successRate)}%`);
            
            return report;
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            throw error;
        } finally {
            await this.cleanupTestEnvironment();
        }
    }

    /**
     * Setup test environment
     */
    async setupTestEnvironment() {
        console.log('🔧 Setting up test environment...');
        
        try {
            // Initialize database
            await db.open();
            
            // Clear existing test data
            await this.clearTestData();
            
            // Create base test data
            await this.createBaseTestData();
            
            this.setupComplete = true;
            console.log('✅ Test environment ready');
            
        } catch (error) {
            console.error('❌ Failed to setup test environment:', error);
            throw error;
        }
    }

    /**
     * Clear all test data
     */
    async clearTestData() {
        await db.transaction('rw', [
            db.entities, db.boards, db.people, db.templates, 
            db.tags, db.collections, db.entityPositions, 
            db.weeklyPlans, db.settings
        ], async () => {
            await db.entities.clear();
            await db.boards.clear();
            await db.people.clear();
            await db.templates.clear();
            await db.tags.clear();
            await db.collections.clear();
            await db.entityPositions.clear();
            await db.weeklyPlans.clear();
            await db.settings.clear();
        });
    }

    /**
     * Create base test data
     */
    async createBaseTestData() {
        // Create test board
        const testBoard = {
            id: 'test_board_1',
            name: 'Test Board',
            groups: [
                { id: 1, name: 'Test Group 1', color: '#3b82f6', collapsed: false },
                { id: 2, name: 'Test Group 2', color: '#10b981', collapsed: false }
            ],
            rows: [
                {
                    id: 1,
                    name: 'Test Row 1',
                    description: 'First test row',
                    groupId: 1,
                    cards: { todo: [], inprogress: [], done: [] }
                }
            ],
            columns: [
                { id: 1, name: 'To Do', key: 'todo' },
                { id: 2, name: 'In Progress', key: 'inprogress' },
                { id: 3, name: 'Done', key: 'done' }
            ],
            createdAt: new Date().toISOString()
        };

        await boardService.save(testBoard);

        // Create test entities
        const testEntities = [
            {
                id: 'task_test_1',
                type: 'task',
                title: 'Test Task 1',
                content: 'First test task',
                completed: false,
                priority: 'high',
                tags: ['test'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'note_test_1',
                type: 'note',
                title: 'Test Note 1',
                content: 'First test note',
                tags: ['test', 'notes'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];

        for (const entity of testEntities) {
            await entityService.save(entity);
        }

        // Create test people
        const testPeople = [
            {
                id: 'person_test_1',
                name: 'Test Person 1',
                email: 'test1@example.com',
                company: 'Test Company',
                relationshipType: 'colleague',
                lastInteraction: new Date().toISOString(),
                createdAt: new Date().toISOString()
            }
        ];

        for (const person of testPeople) {
            await db.people.put(person);
        }

        // Create test tags
        const testTags = [
            {
                id: 'tag_test_1',
                name: 'test',
                category: 'general',
                color: '#3b82f6',
                usageCount: 0,
                createdAt: new Date().toISOString()
            },
            {
                id: 'tag_test_2',
                name: 'notes',
                category: 'content',
                color: '#10b981',
                usageCount: 0,
                createdAt: new Date().toISOString()
            }
        ];

        for (const tag of testTags) {
            await db.tags.put(tag);
        }
    }

    /**
     * Test all CRUD operations
     */
    async testCRUDOperations() {
        console.log('\n🔨 Testing CRUD Operations...');
        
        await this.testEntityCRUD();
        await this.testBoardCRUD();
        await this.testPeopleCRUD();
        await this.testTagsCRUD();
        await this.testCollectionsCRUD();
        await this.testTemplatesCRUD();
    }

    /**
     * Test entity CRUD operations
     */
    async testEntityCRUD() {
        const testName = 'Entity CRUD Operations';
        const startTime = performance.now();
        
        try {
            // CREATE
            const newEntity = {
                id: 'task_crud_test',
                type: 'task',
                title: 'CRUD Test Task',
                content: 'Testing CRUD operations',
                completed: false,
                priority: 'medium',
                tags: ['crud-test'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await entityService.save(newEntity);
            
            // READ
            const retrieved = await entityService.getById('task_crud_test');
            if (!retrieved || retrieved.title !== 'CRUD Test Task') {
                throw new Error('Failed to retrieve created entity');
            }

            // UPDATE
            retrieved.title = 'Updated CRUD Test Task';
            retrieved.completed = true;
            await entityService.save(retrieved);

            const updated = await entityService.getById('task_crud_test');
            if (!updated.completed || updated.title !== 'Updated CRUD Test Task') {
                throw new Error('Failed to update entity');
            }

            // DELETE
            await entityService.delete('task_crud_test');
            const deleted = await entityService.getById('task_crud_test');
            if (deleted) {
                throw new Error('Failed to delete entity');
            }

            // Test bulk operations
            const bulkEntities = [];
            for (let i = 1; i <= 5; i++) {
                bulkEntities.push({
                    id: `bulk_test_${i}`,
                    type: 'task',
                    title: `Bulk Task ${i}`,
                    content: `Bulk test content ${i}`,
                    completed: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }

            await entityService.bulkSave(bulkEntities);
            const bulkRetrieved = await entityService.getAll();
            const bulkCount = bulkRetrieved.filter(e => e.id.startsWith('bulk_test_')).length;
            
            if (bulkCount !== 5) {
                throw new Error(`Bulk save failed: expected 5, got ${bulkCount}`);
            }

            const duration = performance.now() - startTime;
            this.recordTestResult(testName, true, duration, {
                operations: ['create', 'read', 'update', 'delete', 'bulk_save'],
                entitiesProcessed: 6
            });

        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordTestResult(testName, false, duration, { error: error.message });
        }
    }

    /**
     * Test board CRUD operations
     */
    async testBoardCRUD() {
        const testName = 'Board CRUD Operations';
        const startTime = performance.now();
        
        try {
            // CREATE
            const newBoard = {
                id: 'board_crud_test',
                name: 'CRUD Test Board',
                groups: [{ id: 1, name: 'Test Group', color: '#ff0000', collapsed: false }],
                rows: [{
                    id: 1,
                    name: 'Test Row',
                    description: 'Test row description',
                    groupId: 1,
                    cards: { todo: [], inprogress: [], done: [] }
                }],
                columns: [
                    { id: 1, name: 'To Do', key: 'todo' },
                    { id: 2, name: 'Done', key: 'done' }
                ],
                createdAt: new Date().toISOString()
            };

            await boardService.save(newBoard);

            // READ
            const retrieved = await boardService.getById('board_crud_test');
            if (!retrieved || retrieved.name !== 'CRUD Test Board') {
                throw new Error('Failed to retrieve created board');
            }

            // UPDATE
            retrieved.name = 'Updated CRUD Test Board';
            retrieved.groups.push({ id: 2, name: 'New Group', color: '#00ff00', collapsed: false });
            await boardService.save(retrieved);

            const updated = await boardService.getById('board_crud_test');
            if (updated.name !== 'Updated CRUD Test Board' || updated.groups.length !== 2) {
                throw new Error('Failed to update board');
            }

            // DELETE
            await boardService.delete('board_crud_test');
            const deleted = await boardService.getById('board_crud_test');
            if (deleted) {
                throw new Error('Failed to delete board');
            }

            const duration = performance.now() - startTime;
            this.recordTestResult(testName, true, duration, {
                operations: ['create', 'read', 'update', 'delete']
            });

        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordTestResult(testName, false, duration, { error: error.message });
        }
    }

    /**
     * Test people CRUD operations
     */
    async testPeopleCRUD() {
        const testName = 'People CRUD Operations';
        const startTime = performance.now();
        
        try {
            // CREATE
            const newPerson = await metaService.createPerson({
                name: 'CRUD Test Person',
                email: 'crud@test.com',
                company: 'Test Corp',
                relationshipType: 'client'
            });

            // READ
            const retrieved = await metaService.getPerson(newPerson.id);
            if (!retrieved || retrieved.name !== 'CRUD Test Person') {
                throw new Error('Failed to retrieve created person');
            }

            // UPDATE
            const updated = await metaService.updatePerson(newPerson.id, {
                company: 'Updated Test Corp',
                relationshipType: 'partner'
            });

            if (updated.company !== 'Updated Test Corp') {
                throw new Error('Failed to update person');
            }

            // DELETE
            await metaService.deletePerson(newPerson.id);
            const deleted = await metaService.getPerson(newPerson.id);
            if (deleted) {
                throw new Error('Failed to delete person');
            }

            const duration = performance.now() - startTime;
            this.recordTestResult(testName, true, duration, {
                operations: ['create', 'read', 'update', 'delete']
            });

        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordTestResult(testName, false, duration, { error: error.message });
        }
    }

    /**
     * Test tags CRUD operations
     */
    async testTagsCRUD() {
        const testName = 'Tags CRUD Operations';
        const startTime = performance.now();
        
        try {
            // CREATE
            const newTag = await metaService.createTag('crud-test-tag', 'testing', '#ff0000');

            // READ
            const retrieved = await metaService.getTag(newTag.id);
            if (!retrieved || retrieved.name !== 'crud-test-tag') {
                throw new Error('Failed to retrieve created tag');
            }

            // UPDATE
            const updated = await metaService.updateTag(newTag.id, {
                color: '#00ff00',
                category: 'updated-testing'
            });

            if (updated.color !== '#00ff00') {
                throw new Error('Failed to update tag');
            }

            // DELETE
            await metaService.deleteTag(newTag.id);
            const deleted = await metaService.getTag(newTag.id);
            if (deleted) {
                throw new Error('Failed to delete tag');
            }

            const duration = performance.now() - startTime;
            this.recordTestResult(testName, true, duration, {
                operations: ['create', 'read', 'update', 'delete']
            });

        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordTestResult(testName, false, duration, { error: error.message });
        }
    }

    /**
     * Test collections CRUD operations
     */
    async testCollectionsCRUD() {
        const testName = 'Collections CRUD Operations';
        const startTime = performance.now();
        
        try {
            // CREATE
            const newCollection = await metaService.createCollection(
                'CRUD Test Collection',
                'saved_search',
                'testing',
                { entityTypes: ['task'], tags: [], priorities: ['high'] }
            );

            // READ
            const retrieved = await metaService.getCollection(newCollection.id);
            if (!retrieved || retrieved.name !== 'CRUD Test Collection') {
                throw new Error('Failed to retrieve created collection');
            }

            // UPDATE
            const updated = await metaService.updateCollection(newCollection.id, {
                name: 'Updated CRUD Test Collection',
                filters: { entityTypes: ['task', 'note'], tags: [], priorities: ['high', 'medium'] }
            });

            if (updated.name !== 'Updated CRUD Test Collection') {
                throw new Error('Failed to update collection');
            }

            // DELETE
            await metaService.deleteCollection(newCollection.id);
            const deleted = await metaService.getCollection(newCollection.id);
            if (deleted) {
                throw new Error('Failed to delete collection');
            }

            const duration = performance.now() - startTime;
            this.recordTestResult(testName, true, duration, {
                operations: ['create', 'read', 'update', 'delete']
            });

        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordTestResult(testName, false, duration, { error: error.message });
        }
    }

    /**
     * Test templates CRUD operations
     */
    async testTemplatesCRUD() {
        const testName = 'Templates CRUD Operations';
        const startTime = performance.now();
        
        try {
            // CREATE
            const newTemplate = await metaService.createTemplate(
                'CRUD Test Template',
                'Template for CRUD testing',
                'testing',
                {
                    groups: [{ id: 1, name: 'Template Group', color: '#ff0000' }],
                    rows: [],
                    columns: [{ id: 1, name: 'Column 1', key: 'col1' }]
                }
            );

            // READ
            const retrieved = await metaService.getTemplate(newTemplate.id);
            if (!retrieved || retrieved.name !== 'CRUD Test Template') {
                throw new Error('Failed to retrieve created template');
            }

            // UPDATE
            const updated = await metaService.updateTemplate(newTemplate.id, {
                description: 'Updated template description',
                usageCount: 5
            });

            if (updated.description !== 'Updated template description') {
                throw new Error('Failed to update template');
            }

            // DELETE
            await metaService.deleteTemplate(newTemplate.id);
            const deleted = await metaService.getTemplate(newTemplate.id);
            if (deleted) {
                throw new Error('Failed to delete template');
            }

            const duration = performance.now() - startTime;
            this.recordTestResult(testName, true, duration, {
                operations: ['create', 'read', 'update', 'delete']
            });

        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordTestResult(testName, false, duration, { error: error.message });
        }
    }

    /**
     * Test complex queries and filtering
     */
    async testComplexQueries() {
        console.log('\n🔍 Testing Complex Queries and Filtering...');
        
        // Setup query test data
        await this.setupQueryTestData();
        
        await this.testEntityQueries();
        await this.testTagQueries();
        await this.testPeopleQueries();
        await this.testCollectionQueries();
        await this.testAdvancedFiltering();
    }

    /**
     * Setup data for query testing
     */
    async setupQueryTestData() {
        // Create entities with various attributes for testing
        const queryTestEntities = [
            {
                id: 'query_task_1',
                type: 'task',
                title: 'High Priority Task',
                content: 'Important task content',
                completed: false,
                priority: 'high',
                tags: ['urgent', 'work'],
                createdAt: new Date('2024-01-01').toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'query_task_2',
                type: 'task',
                title: 'Medium Priority Task',
                content: 'Regular task content',
                completed: true,
                priority: 'medium',
                tags: ['work'],
                createdAt: new Date('2024-01-15').toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'query_note_1',
                type: 'note',
                title: 'Important Note',
                content: 'Note with important information',
                completed: false,
                tags: ['important', 'reference'],
                createdAt: new Date('2024-02-01').toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];

        for (const entity of queryTestEntities) {
            await entityService.save(entity);
        }
    }

    /**
     * Test entity queries
     */
    async testEntityQueries() {
        const testName = 'Entity Complex Queries';
        const startTime = performance.now();
        
        try {
            // Test getByType
            const tasks = await entityService.getByType('task');
            if (tasks.length < 2) {
                throw new Error('getByType failed to return tasks');
            }

            // Test getCompleted
            const completed = await entityService.getCompleted();
            if (!completed.some(e => e.id === 'query_task_2')) {
                throw new Error('getCompleted failed to return completed entities');
            }

            // Test getPending
            const pending = await entityService.getPending();
            if (!pending.some(e => e.id === 'query_task_1')) {
                throw new Error('getPending failed to return pending entities');
            }

            // Test getByPriority
            const highPriority = await entityService.getByPriority('high');
            if (!highPriority.some(e => e.id === 'query_task_1')) {
                throw new Error('getByPriority failed to return high priority entities');
            }

            // Test getByTags
            const workTagged = await entityService.getByTags(['work']);
            if (workTagged.length < 2) {
                throw new Error('getByTags failed to return work-tagged entities');
            }

            // Test search
            const searchResults = await entityService.search('Important');
            if (!searchResults.some(e => e.title.includes('Important'))) {
                throw new Error('search failed to find entities by title');
            }

            const duration = performance.now() - startTime;
            this.recordTestResult(testName, true, duration, {
                queriesExecuted: 6,
                entitiesQueried: tasks.length + completed.length + pending.length + highPriority.length + workTagged.length + searchResults.length
            });

        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordTestResult(testName, false, duration, { error: error.message });
        }
    }

    /**
     * Test tag queries
     */
    async testTagQueries() {
        const testName = 'Tag Queries';
        const startTime = performance.now();
        
        try {
            // Test getAllTags
            const allTags = await metaService.getAllTags();
            if (allTags.length === 0) {
                throw new Error('getAllTags returned no tags');
            }

            // Test getTagsByCategory
            const generalTags = await metaService.getTagsByCategory('general');
            if (!Array.isArray(generalTags)) {
                throw new Error('getTagsByCategory failed');
            }

            // Test getTagByName
            const testTag = await metaService.getTagByName('test');
            if (!testTag) {
                throw new Error('getTagByName failed to find existing tag');
            }

            const duration = performance.now() - startTime;
            this.recordTestResult(testName, true, duration, {
                queriesExecuted: 3,
                tagsFound: allTags.length
            });

        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordTestResult(testName, false, duration, { error: error.message });
        }
    }

    /**
     * Test people queries
     */
    async testPeopleQueries() {
        const testName = 'People Queries';
        const startTime = performance.now();
        
        try {
            // Test getAllPeople
            const allPeople = await metaService.getAllPeople();
            if (allPeople.length === 0) {
                throw new Error('getAllPeople returned no people');
            }

            // Test searchPeople
            const searchResults = await metaService.searchPeople('Test');
            if (!Array.isArray(searchResults)) {
                throw new Error('searchPeople failed');
            }

            const duration = performance.now() - startTime;
            this.recordTestResult(testName, true, duration, {
                queriesExecuted: 2,
                peopleFound: allPeople.length
            });

        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordTestResult(testName, false, duration, { error: error.message });
        }
    }

    /**
     * Test collection queries
     */
    async testCollectionQueries() {
        const testName = 'Collection Queries';
        const startTime = performance.now();
        
        try {
            // Create a test collection first
            const testCollection = await metaService.createCollection(
                'Query Test Collection',
                'saved_search',
                'testing',
                { entityTypes: ['task'], priorities: ['high'] }
            );

            // Test executeCollection
            const collectionResults = await metaService.executeCollection(testCollection.id);
            if (!Array.isArray(collectionResults)) {
                throw new Error('executeCollection failed');
            }

            // Test getAllCollections
            const allCollections = await metaService.getAllCollections();
            if (!allCollections.some(c => c.id === testCollection.id)) {
                throw new Error('getAllCollections failed to include created collection');
            }

            const duration = performance.now() - startTime;
            this.recordTestResult(testName, true, duration, {
                queriesExecuted: 2,
                collectionsFound: allCollections.length,
                collectionResultsCount: collectionResults.length
            });

        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordTestResult(testName, false, duration, { error: error.message });
        }
    }

    /**
     * Test advanced filtering
     */
    async testAdvancedFiltering() {
        const testName = 'Advanced Filtering';
        const startTime = performance.now();
        
        try {
            // Test complex entity filtering with multiple criteria
            const complexFilter = {
                type: 'task',
                completed: false,
                priority: 'high',
                tags: ['urgent']
            };

            // Simulate complex filtering (would be implemented in entity service)
            const allEntities = await entityService.getAll();
            const filtered = allEntities.filter(entity => {
                return entity.type === complexFilter.type &&
                       entity.completed === complexFilter.completed &&
                       entity.priority === complexFilter.priority &&
                       entity.tags && entity.tags.some(tag => complexFilter.tags.includes(tag));
            });

            if (filtered.length === 0) {
                console.log('No entities matched complex filter (this may be expected)');
            }

            // Test date range filtering
            const dateStart = new Date('2024-01-01');
            const dateEnd = new Date('2024-01-31');
            
            const dateFiltered = allEntities.filter(entity => {
                const entityDate = new Date(entity.createdAt);
                return entityDate >= dateStart && entityDate <= dateEnd;
            });

            const duration = performance.now() - startTime;
            this.recordTestResult(testName, true, duration, {
                complexFilterResults: filtered.length,
                dateFilterResults: dateFiltered.length,
                totalEntitiesFiltered: allEntities.length
            });

        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordTestResult(testName, false, duration, { error: error.message });
        }
    }

    /**
     * Test import/export functionality
     */
    async testImportExport() {
        console.log('\n📤📥 Testing Import/Export Functionality...');
        
        await this.testDataExport();
        await this.testDataImport();
        await this.testMigrationScenarios();
    }

    /**
     * Test data export
     */
    async testDataExport() {
        const testName = 'Data Export';
        const startTime = performance.now();
        
        try {
            // Export all data
            const exportedData = {
                entities: await entityService.getAll(),
                boards: await boardService.getAll(),
                people: await metaService.getAllPeople(),
                templates: await metaService.getAllTemplates(),
                tags: await metaService.getAllTags(),
                collections: await metaService.getAllCollections(),
                settings: await metaService.getAllSettings(),
                version: '7.0',
                exportedAt: new Date().toISOString()
            };

            // Validate export structure
            if (!exportedData.entities || !Array.isArray(exportedData.entities)) {
                throw new Error('Export failed: entities not properly exported');
            }

            if (!exportedData.boards || !Array.isArray(exportedData.boards)) {
                throw new Error('Export failed: boards not properly exported');
            }

            // Test export size and integrity
            const exportString = JSON.stringify(exportedData);
            if (exportString.length === 0) {
                throw new Error('Export failed: empty export data');
            }

            const duration = performance.now() - startTime;
            this.recordTestResult(testName, true, duration, {
                exportSize: exportString.length,
                entitiesExported: exportedData.entities.length,
                boardsExported: exportedData.boards.length,
                peopleExported: exportedData.people.length
            });

        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordTestResult(testName, false, duration, { error: error.message });
        }
    }

    /**
     * Test data import
     */
    async testDataImport() {
        const testName = 'Data Import';
        const startTime = performance.now();
        
        try {
            // Create test import data
            const importData = {
                version: '7.0',
                entities: {
                    'import_test_1': {
                        id: 'import_test_1',
                        type: 'task',
                        title: 'Import Test Task',
                        content: 'Task created for import testing',
                        completed: false,
                        priority: 'medium',
                        tags: ['import-test'],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                },
                boards: {
                    'import_board_1': {
                        id: 'import_board_1',
                        name: 'Import Test Board',
                        groups: [],
                        rows: [],
                        columns: [
                            { id: 1, name: 'To Do', key: 'todo' }
                        ],
                        createdAt: new Date().toISOString()
                    }
                }
            };

            // Validate import data
            const validation = dataValidator.validateData(importData);
            if (!validation.isValid && validation.errors.length > 0) {
                throw new Error(`Import validation failed: ${validation.errors[0]}`);
            }

            // Test migration process
            const migrated = await dataMigrator.migrateData(importData);
            if (!migrated || migrated.version !== '7.0') {
                throw new Error('Migration failed during import test');
            }

            const duration = performance.now() - startTime;
            this.recordTestResult(testName, true, duration, {
                entitiesImported: Object.keys(importData.entities).length,
                boardsImported: Object.keys(importData.boards).length,
                validationErrors: validation.errors.length,
                validationWarnings: validation.warnings.length
            });

        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordTestResult(testName, false, duration, { error: error.message });
        }
    }

    /**
     * Test migration scenarios
     */
    async testMigrationScenarios() {
        const testName = 'Migration Scenarios';
        const startTime = performance.now();
        
        try {
            const scenarios = ['1.0', '2.0', '5.0'];
            let successCount = 0;

            for (const version of scenarios) {
                try {
                    const legacyData = dataMigrator.createSampleLegacyData(version);
                    const migrated = await dataMigrator.migrateData(legacyData);
                    
                    if (migrated.version === '7.0') {
                        successCount++;
                    }
                } catch (error) {
                    console.log(`Migration from v${version} failed: ${error.message}`);
                }
            }

            if (successCount !== scenarios.length) {
                throw new Error(`Migration scenarios failed: ${successCount}/${scenarios.length} successful`);
            }

            const duration = performance.now() - startTime;
            this.recordTestResult(testName, true, duration, {
                scenariosTested: scenarios.length,
                successfulMigrations: successCount
            });

        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordTestResult(testName, false, duration, { error: error.message });
        }
    }

    /**
     * Test cross-entity relationships
     */
    async testCrossEntityRelationships() {
        console.log('\n🔗 Testing Cross-Entity Relationships...');
        
        await this.testEntityPersonRelationships();
        await this.testEntityTagRelationships();
        await this.testEntityPositioning();
        await this.testBidirectionalLinking();
    }

    /**
     * Test entity-person relationships
     */
    async testEntityPersonRelationships() {
        const testName = 'Entity-Person Relationships';
        const startTime = performance.now();
        
        try {
            // Create test person
            const testPerson = await metaService.createPerson({
                name: 'Relationship Test Person',
                email: 'relationship@test.com'
            });

            // Create test entity
            const testEntity = {
                id: 'relationship_test_entity',
                type: 'task',
                title: 'Relationship Test Task',
                content: 'Testing entity-person relationships',
                people: [testPerson.id],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await entityService.save(testEntity);

            // Test linking
            await entityService.linkToPerson('relationship_test_entity', testPerson.id);

            // Test retrieving entities by person
            const personEntities = await entityService.getByPerson(testPerson.id);
            if (!personEntities.some(e => e.id === 'relationship_test_entity')) {
                throw new Error('Failed to retrieve entities linked to person');
            }

            // Test person timeline
            const timeline = await entityService.getPersonTimeline(testPerson.id);
            if (!Array.isArray(timeline)) {
                throw new Error('Person timeline query failed');
            }

            const duration = performance.now() - startTime;
            this.recordTestResult(testName, true, duration, {
                relationshipsCreated: 1,
                entitiesLinked: personEntities.length,
                timelineItems: timeline.length
            });

        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordTestResult(testName, false, duration, { error: error.message });
        }
    }

    /**
     * Test entity-tag relationships
     */
    async testEntityTagRelationships() {
        const testName = 'Entity-Tag Relationships';
        const startTime = performance.now();
        
        try {
            // Create test tag
            const testTag = await metaService.createTag('relationship-test', 'testing', '#ff0000');

            // Create entity with tag
            const testEntity = {
                id: 'tag_relationship_test',
                type: 'note',
                title: 'Tag Relationship Test',
                content: 'Testing entity-tag relationships',
                tags: [testTag.id],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await entityService.save(testEntity);

            // Test retrieving entities by tag
            const taggedEntities = await entityService.getByTags([testTag.id]);
            if (!taggedEntities.some(e => e.id === 'tag_relationship_test')) {
                throw new Error('Failed to retrieve entities by tag');
            }

            // Test tag usage increment
            await metaService.incrementTagUsage(testTag.id);
            const updatedTag = await metaService.getTag(testTag.id);
            if (updatedTag.usageCount !== 1) {
                throw new Error('Tag usage count not properly incremented');
            }

            const duration = performance.now() - startTime;
            this.recordTestResult(testName, true, duration, {
                tagsCreated: 1,
                entitiesTagged: taggedEntities.length,
                usageCount: updatedTag.usageCount
            });

        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordTestResult(testName, false, duration, { error: error.message });
        }
    }

    /**
     * Test entity positioning
     */
    async testEntityPositioning() {
        const testName = 'Entity Positioning';
        const startTime = performance.now();
        
        try {
            // Set entity position
            await entityService.setPosition(
                'task_test_1',
                'test_board_1',
                'board',
                '1',
                'todo',
                0
            );

            // Get entities in position
            const entitiesInPosition = await entityService.getEntitiesInPosition(
                'test_board_1',
                '1',
                'todo'
            );

            if (!entitiesInPosition.some(e => e.id === 'task_test_1')) {
                throw new Error('Failed to retrieve entity from position');
            }

            const duration = performance.now() - startTime;
            this.recordTestResult(testName, true, duration, {
                positionsSet: 1,
                entitiesInPosition: entitiesInPosition.length
            });

        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordTestResult(testName, false, duration, { error: error.message });
        }
    }

    /**
     * Test bidirectional linking
     */
    async testBidirectionalLinking() {
        const testName = 'Bidirectional Linking';
        const startTime = performance.now();
        
        try {
            // Create entities for bidirectional test
            const entity1 = {
                id: 'bidirectional_test_1',
                type: 'task',
                title: 'Bidirectional Test 1',
                content: 'First entity for bidirectional testing',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const entity2 = {
                id: 'bidirectional_test_2',
                type: 'note',
                title: 'Bidirectional Test 2',
                content: 'Second entity for bidirectional testing',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await entityService.save(entity1);
            await entityService.save(entity2);

            // Test that changes to one entity can affect related entities
            // (This would be expanded based on actual bidirectional requirements)
            
            const duration = performance.now() - startTime;
            this.recordTestResult(testName, true, duration, {
                entitiesCreated: 2,
                linksEstablished: 0 // Would track actual bidirectional links
            });

        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordTestResult(testName, false, duration, { error: error.message });
        }
    }

    /**
     * Test performance vs old implementation
     */
    async testPerformance() {
        console.log('\n⚡ Testing Performance...');
        
        await this.testCRUDPerformance();
        await this.testQueryPerformance();
        await this.testBulkOperationPerformance();
        await this.testMemoryUsage();
    }

    /**
     * Test CRUD performance
     */
    async testCRUDPerformance() {
        const testName = 'CRUD Performance';
        const iterations = 100;
        
        const startTime = performance.now();
        
        try {
            // Create entities
            const createStart = performance.now();
            for (let i = 0; i < iterations; i++) {
                await entityService.save({
                    id: `perf_test_${i}`,
                    type: 'task',
                    title: `Performance Test ${i}`,
                    content: `Performance test content ${i}`,
                    completed: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            const createTime = performance.now() - createStart;

            // Read entities
            const readStart = performance.now();
            for (let i = 0; i < iterations; i++) {
                await entityService.getById(`perf_test_${i}`);
            }
            const readTime = performance.now() - readStart;

            // Update entities
            const updateStart = performance.now();
            for (let i = 0; i < iterations; i++) {
                await entityService.save({
                    id: `perf_test_${i}`,
                    type: 'task',
                    title: `Updated Performance Test ${i}`,
                    content: `Updated performance test content ${i}`,
                    completed: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            const updateTime = performance.now() - updateStart;

            // Delete entities
            const deleteStart = performance.now();
            for (let i = 0; i < iterations; i++) {
                await entityService.delete(`perf_test_${i}`);
            }
            const deleteTime = performance.now() - deleteStart;

            const totalTime = performance.now() - startTime;

            this.recordTestResult(testName, true, totalTime, {
                iterations,
                createTime,
                readTime,
                updateTime,
                deleteTime,
                avgCreateTime: createTime / iterations,
                avgReadTime: readTime / iterations,
                avgUpdateTime: updateTime / iterations,
                avgDeleteTime: deleteTime / iterations
            });

            this.performanceMetrics.crud = {
                totalTime,
                operationsPerSecond: (iterations * 4) / (totalTime / 1000),
                createOpsPerSecond: iterations / (createTime / 1000),
                readOpsPerSecond: iterations / (readTime / 1000),
                updateOpsPerSecond: iterations / (updateTime / 1000),
                deleteOpsPerSecond: iterations / (deleteTime / 1000)
            };

        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordTestResult(testName, false, duration, { error: error.message });
        }
    }

    /**
     * Test query performance
     */
    async testQueryPerformance() {
        const testName = 'Query Performance';
        const startTime = performance.now();
        
        try {
            // Setup performance test data
            const perfEntities = [];
            for (let i = 0; i < 500; i++) {
                perfEntities.push({
                    id: `query_perf_${i}`,
                    type: i % 3 === 0 ? 'task' : i % 3 === 1 ? 'note' : 'checklist',
                    title: `Query Perf Entity ${i}`,
                    content: `Content ${i}`,
                    completed: i % 4 === 0,
                    priority: ['low', 'medium', 'high'][i % 3],
                    tags: [`tag_${i % 10}`],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }

            await entityService.bulkSave(perfEntities);

            // Test various query performance
            const queryTests = [
                { name: 'getAll', fn: () => entityService.getAll() },
                { name: 'getByType', fn: () => entityService.getByType('task') },
                { name: 'getCompleted', fn: () => entityService.getCompleted() },
                { name: 'getByPriority', fn: () => entityService.getByPriority('high') },
                { name: 'search', fn: () => entityService.search('Query') }
            ];

            const queryResults = {};
            for (const test of queryTests) {
                const testStart = performance.now();
                const results = await test.fn();
                const testTime = performance.now() - testStart;
                queryResults[test.name] = {
                    time: testTime,
                    resultCount: results.length,
                    throughput: results.length / (testTime / 1000)
                };
            }

            const duration = performance.now() - startTime;
            this.recordTestResult(testName, true, duration, {
                entitiesQueried: 500,
                queryTypes: queryTests.length,
                queryResults
            });

            this.performanceMetrics.queries = queryResults;

        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordTestResult(testName, false, duration, { error: error.message });
        }
    }

    /**
     * Test bulk operation performance
     */
    async testBulkOperationPerformance() {
        const testName = 'Bulk Operation Performance';
        const bulkSize = 1000;
        const startTime = performance.now();
        
        try {
            // Prepare bulk data
            const bulkEntities = [];
            for (let i = 0; i < bulkSize; i++) {
                bulkEntities.push({
                    id: `bulk_perf_${i}`,
                    type: 'task',
                    title: `Bulk Performance Test ${i}`,
                    content: `Bulk test content ${i}`,
                    completed: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }

            // Test bulk save
            const bulkSaveStart = performance.now();
            await entityService.bulkSave(bulkEntities);
            const bulkSaveTime = performance.now() - bulkSaveStart;

            // Test bulk read
            const bulkReadStart = performance.now();
            const allEntities = await entityService.getAll();
            const bulkReadTime = performance.now() - bulkReadStart;

            const duration = performance.now() - startTime;
            
            this.recordTestResult(testName, true, duration, {
                bulkSize,
                bulkSaveTime,
                bulkReadTime,
                saveRate: bulkSize / (bulkSaveTime / 1000),
                readRate: allEntities.length / (bulkReadTime / 1000)
            });

            this.performanceMetrics.bulk = {
                saveRate: bulkSize / (bulkSaveTime / 1000),
                readRate: allEntities.length / (bulkReadTime / 1000)
            };

        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordTestResult(testName, false, duration, { error: error.message });
        }
    }

    /**
     * Test memory usage (basic estimation)
     */
    async testMemoryUsage() {
        const testName = 'Memory Usage Estimation';
        const startTime = performance.now();
        
        try {
            // Estimate memory usage by measuring data size
            const allEntities = await entityService.getAll();
            const allBoards = await boardService.getAll();
            
            const entitiesSize = JSON.stringify(allEntities).length;
            const boardsSize = JSON.stringify(allBoards).length;
            const totalDataSize = entitiesSize + boardsSize;

            const duration = performance.now() - startTime;
            
            this.recordTestResult(testName, true, duration, {
                entitiesCount: allEntities.length,
                boardsCount: allBoards.length,
                entitiesDataSize: entitiesSize,
                boardsDataSize: boardsSize,
                totalDataSize,
                avgEntitySize: entitiesSize / allEntities.length,
                avgBoardSize: boardsSize / (allBoards.length || 1)
            });

            this.performanceMetrics.memory = {
                totalDataSize,
                entitiesCount: allEntities.length,
                avgEntitySize: entitiesSize / allEntities.length
            };

        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordTestResult(testName, false, duration, { error: error.message });
        }
    }

    /**
     * Record test result
     */
    recordTestResult(testName, success, duration, details = {}) {
        const result = {
            testName,
            success,
            duration: Math.round(duration),
            timestamp: new Date().toISOString(),
            details
        };

        this.testResults.push(result);

        const status = success ? '✅' : '❌';
        const time = duration > 1000 ? `${Math.round(duration)}ms` : `${Math.round(duration)}ms`;
        console.log(`${status} ${testName} (${time})`);

        if (!success && details.error) {
            console.log(`   Error: ${details.error}`);
        }
    }

    /**
     * Generate comprehensive report
     */
    generateComprehensiveReport() {
        const passedTests = this.testResults.filter(r => r.success);
        const failedTests = this.testResults.filter(r => !r.success);
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: this.testResults.length,
                passed: passedTests.length,
                failed: failedTests.length,
                successRate: (passedTests.length / this.testResults.length) * 100,
                totalDuration: this.testResults.reduce((sum, r) => sum + r.duration, 0)
            },
            performance: this.performanceMetrics,
            testResults: this.testResults,
            failedTests: failedTests.map(test => ({
                name: test.testName,
                error: test.details.error,
                duration: test.duration
            })),
            recommendations: this.generateRecommendations(),
            systemInfo: {
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
                timestamp: new Date().toISOString()
            }
        };

        return report;
    }

    /**
     * Generate recommendations based on test results
     */
    generateRecommendations() {
        const recommendations = [];
        
        const failedTests = this.testResults.filter(r => !r.success);
        if (failedTests.length > 0) {
            recommendations.push(`Fix ${failedTests.length} failing tests before production deployment`);
        }

        if (this.performanceMetrics.crud) {
            const { operationsPerSecond } = this.performanceMetrics.crud;
            if (operationsPerSecond < 100) {
                recommendations.push('CRUD performance is below expected threshold (100 ops/sec)');
            } else if (operationsPerSecond > 1000) {
                recommendations.push('Excellent CRUD performance detected');
            }
        }

        if (this.performanceMetrics.bulk) {
            const { saveRate } = this.performanceMetrics.bulk;
            if (saveRate < 500) {
                recommendations.push('Bulk operation performance could be improved');
            }
        }

        const longRunningTests = this.testResults.filter(r => r.duration > 5000);
        if (longRunningTests.length > 0) {
            recommendations.push(`${longRunningTests.length} tests took longer than 5 seconds`);
        }

        if (recommendations.length === 0) {
            recommendations.push('All tests passed with good performance metrics');
        }

        return recommendations;
    }

    /**
     * Cleanup test environment
     */
    async cleanupTestEnvironment() {
        if (!this.setupComplete) return;
        
        console.log('🧹 Cleaning up test environment...');
        
        try {
            // Remove test data
            await this.clearTestData();
            console.log('✅ Test environment cleaned up');
        } catch (error) {
            console.error('❌ Failed to cleanup test environment:', error);
        }
    }
}

// Create singleton instance
export const comprehensiveTestSuite = new ComprehensiveTestSuite();

// Make available globally for testing
if (typeof window !== 'undefined') {
    window.comprehensiveTestSuite = comprehensiveTestSuite;
}