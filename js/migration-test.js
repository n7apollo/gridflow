/**
 * GridFlow - Migration Testing Suite
 * Tests data migration from various versions to Dexie architecture
 */

import { dataMigrator } from './migration-strategy.js';
import { dataValidator } from './data-validator.js';

/**
 * Migration test suite
 */
export class MigrationTester {
    constructor() {
        this.testResults = [];
    }

    /**
     * Run comprehensive migration tests
     */
    async runAllTests() {
        console.log('🧪 Starting comprehensive migration tests...');
        
        const tests = [
            { name: 'Version 1.0 Migration', version: '1.0' },
            { name: 'Version 2.0 Migration', version: '2.0' },
            { name: 'Version 5.0 Migration', version: '5.0' },
            { name: 'Corrupted Data Handling', version: 'corrupted' },
            { name: 'Large Dataset Migration', version: 'large' },
            { name: 'Empty Data Migration', version: 'empty' }
        ];

        for (const test of tests) {
            try {
                console.log(`\n🔍 Running test: ${test.name}`);
                const result = await this.runSingleTest(test.version);
                this.testResults.push({
                    name: test.name,
                    version: test.version,
                    success: result.success,
                    duration: result.duration,
                    errors: result.errors,
                    warnings: result.warnings,
                    stats: result.stats
                });
                
                const status = result.success ? '✅ PASSED' : '❌ FAILED';
                console.log(`${status} ${test.name} (${result.duration}ms)`);
                
            } catch (error) {
                console.error(`❌ Test failed: ${test.name}`, error);
                this.testResults.push({
                    name: test.name,
                    version: test.version,
                    success: false,
                    error: error.message
                });
            }
        }

        this.printTestSummary();
        return this.testResults;
    }

    /**
     * Run a single migration test
     */
    async runSingleTest(version) {
        const startTime = Date.now();
        
        // Create test data
        const testData = this.createTestData(version);
        
        // Clear migration log
        dataMigrator.clearLog();
        dataValidator.clearLog();
        
        // Test migration
        const migratedData = await dataMigrator.migrateData(testData);
        
        // Validate migrated data
        const validation = dataValidator.validateData(migratedData);
        
        const duration = Date.now() - startTime;
        
        return {
            success: validation.isValid,
            duration,
            errors: validation.errors,
            warnings: validation.warnings,
            stats: validation.stats,
            migrationLog: dataMigrator.getMigrationLog(),
            validationLog: dataValidator.getValidationLog()
        };
    }

    /**
     * Create test data for different versions
     */
    createTestData(version) {
        switch (version) {
            case '1.0':
                return dataMigrator.createSampleLegacyData('1.0');
                
            case '2.0':
                return dataMigrator.createSampleLegacyData('2.0');
                
            case '5.0':
                return dataMigrator.createSampleLegacyData('5.0');
                
            case 'corrupted':
                return {
                    // Missing required fields
                    boards: {
                        test: {
                            // Missing id, name, groups, rows, columns
                            someField: 'invalid'
                        }
                    },
                    entities: {
                        task_1: {
                            // Missing id, type, title, createdAt
                            content: 'Test task'
                        }
                    }
                };
                
            case 'large':
                return this.createLargeDataset();
                
            case 'empty':
                return {
                    version: '1.0'
                };
                
            default:
                return dataMigrator.createSampleLegacyData('1.0');
        }
    }

    /**
     * Create a large dataset for performance testing
     */
    createLargeDataset() {
        const data = {
            currentBoardId: 'default',
            boards: {},
            entities: {},
            version: '5.0'
        };

        // Create 5 boards
        for (let b = 1; b <= 5; b++) {
            const boardId = `board_${b}`;
            data.boards[boardId] = {
                id: boardId,
                name: `Board ${b}`,
                groups: [
                    { id: 1, name: 'Group 1', color: '#3b82f6', collapsed: false },
                    { id: 2, name: 'Group 2', color: '#10b981', collapsed: false }
                ],
                rows: [],
                columns: [
                    { id: 1, name: 'To Do', key: 'todo' },
                    { id: 2, name: 'In Progress', key: 'inprogress' },
                    { id: 3, name: 'Done', key: 'done' }
                ]
            };

            // Create 10 rows per board
            for (let r = 1; r <= 10; r++) {
                const row = {
                    id: r,
                    name: `Row ${r}`,
                    description: `Description for row ${r}`,
                    groupId: (r % 2) + 1,
                    cards: {
                        todo: [],
                        inprogress: [],
                        done: []
                    }
                };

                // Create 20 entities per row (distributed across columns)
                for (let e = 1; e <= 20; e++) {
                    const entityId = `task_${b}_${r}_${e}`;
                    const columnKey = ['todo', 'inprogress', 'done'][e % 3];
                    
                    data.entities[entityId] = {
                        id: entityId,
                        type: 'task',
                        title: `Task ${b}-${r}-${e}`,
                        content: `Content for task ${b}-${r}-${e}`,
                        completed: e % 4 === 0,
                        priority: ['low', 'medium', 'high'][e % 3],
                        tags: [`tag_${e % 5}`],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    
                    row.cards[columnKey].push(entityId);
                }

                data.boards[boardId].rows.push(row);
            }
        }

        console.log(`Created large dataset: ${Object.keys(data.entities).length} entities across ${Object.keys(data.boards).length} boards`);
        return data;
    }

    /**
     * Test migration performance with timing
     */
    async testMigrationPerformance() {
        console.log('\n⏱️ Running performance tests...');
        
        const performanceTests = [
            { name: 'Small Dataset (v1.0)', data: dataMigrator.createSampleLegacyData('1.0') },
            { name: 'Medium Dataset (v2.0)', data: this.createMediumDataset() },
            { name: 'Large Dataset (v5.0)', data: this.createLargeDataset() }
        ];

        const results = [];

        for (const test of performanceTests) {
            const iterations = 3;
            const times = [];

            for (let i = 0; i < iterations; i++) {
                const startTime = performance.now();
                await dataMigrator.migrateData(test.data);
                const endTime = performance.now();
                times.push(endTime - startTime);
            }

            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            const entityCount = Object.keys(test.data.entities || {}).length;
            
            results.push({
                name: test.name,
                averageTime: Math.round(avgTime),
                entityCount,
                entitiesPerSecond: entityCount > 0 ? Math.round(entityCount / (avgTime / 1000)) : 0
            });

            console.log(`${test.name}: ${Math.round(avgTime)}ms avg (${entityCount} entities, ${Math.round(entityCount / (avgTime / 1000))} entities/sec)`);
        }

        return results;
    }

    /**
     * Create medium-sized dataset
     */
    createMediumDataset() {
        const baseData = dataMigrator.createSampleLegacyData('2.0');
        
        // Add more entities to existing board
        const board = baseData.boards.default;
        const entities = {};

        for (let i = 1; i <= 100; i++) {
            const entityId = `task_${i}`;
            entities[entityId] = {
                id: entityId,
                type: 'task',
                title: `Task ${i}`,
                content: `Content for task ${i}`,
                completed: i % 5 === 0,
                priority: ['low', 'medium', 'high'][i % 3],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Add to first row
            if (board.rows && board.rows[0]) {
                const columnKey = ['todo', 'inprogress', 'done'][i % 3];
                if (!board.rows[0].cards[columnKey]) {
                    board.rows[0].cards[columnKey] = [];
                }
                board.rows[0].cards[columnKey].push(entityId);
            }
        }

        return {
            ...baseData,
            entities
        };
    }

    /**
     * Test data validation edge cases
     */
    async testValidationEdgeCases() {
        console.log('\n🔬 Testing validation edge cases...');
        
        const edgeCases = [
            {
                name: 'Null Values',
                data: { entities: { task_1: { id: null, type: null, title: null } } }
            },
            {
                name: 'Circular References',
                data: this.createCircularReferenceData()
            },
            {
                name: 'Invalid Dates',
                data: { entities: { task_1: { id: 'task_1', createdAt: 'invalid-date' } } }
            },
            {
                name: 'Mismatched IDs',
                data: { entities: { task_1: { id: 'task_2', type: 'task', title: 'Test' } } }
            }
        ];

        const results = [];

        for (const testCase of edgeCases) {
            try {
                const validation = dataValidator.validateData(testCase.data);
                results.push({
                    name: testCase.name,
                    success: true,
                    isValid: validation.isValid,
                    errorCount: validation.errors.length,
                    warningCount: validation.warnings.length
                });
                
                console.log(`${testCase.name}: ${validation.errors.length} errors, ${validation.warnings.length} warnings`);
            } catch (error) {
                results.push({
                    name: testCase.name,
                    success: false,
                    error: error.message
                });
                console.log(`${testCase.name}: Failed with error - ${error.message}`);
            }
        }

        return results;
    }

    /**
     * Create data with circular references for testing
     */
    createCircularReferenceData() {
        const data = {
            entities: {
                task_1: { id: 'task_1', type: 'task', title: 'Task 1' },
                task_2: { id: 'task_2', type: 'task', title: 'Task 2' }
            }
        };

        // Create circular reference (this would be caught by JSON.stringify)
        data.entities.task_1.relatedTask = data.entities.task_2;
        data.entities.task_2.relatedTask = data.entities.task_1;

        return data;
    }

    /**
     * Print test summary
     */
    printTestSummary() {
        console.log('\n📊 Test Summary:');
        console.log('================');
        
        const passed = this.testResults.filter(r => r.success).length;
        const failed = this.testResults.filter(r => !r.success).length;
        
        console.log(`Total Tests: ${this.testResults.length}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success Rate: ${Math.round((passed / this.testResults.length) * 100)}%`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults.filter(r => !r.success).forEach(result => {
                console.log(`  - ${result.name}: ${result.error || 'Unknown error'}`);
            });
        }
        
        console.log('\n✅ Test suite completed');
    }

    /**
     * Generate test report
     */
    generateReport() {
        return {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: this.testResults.length,
                passed: this.testResults.filter(r => r.success).length,
                failed: this.testResults.filter(r => !r.success).length,
                successRate: Math.round((this.testResults.filter(r => r.success).length / this.testResults.length) * 100)
            },
            results: this.testResults,
            recommendations: this.generateTestRecommendations()
        };
    }

    /**
     * Generate recommendations based on test results
     */
    generateTestRecommendations() {
        const recommendations = [];
        
        const failedTests = this.testResults.filter(r => !r.success);
        if (failedTests.length > 0) {
            recommendations.push('Fix failing migration tests before production deployment');
        }
        
        const warningTests = this.testResults.filter(r => r.warnings && r.warnings.length > 5);
        if (warningTests.length > 0) {
            recommendations.push('Review and address migration warnings');
        }
        
        return recommendations;
    }
}

// Create singleton instance
export const migrationTester = new MigrationTester();

// Make available globally for testing
if (typeof window !== 'undefined') {
    window.migrationTester = migrationTester;
}