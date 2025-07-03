/**
 * GridFlow - Test Runner for Step 5.2 Comprehensive Testing
 * Orchestrates all testing phases for the Dexie architecture
 */

import { comprehensiveTestSuite } from './comprehensive-test-suite.js';
import { performanceComparison } from './performance-comparison.js';
import { migrationTester } from './migration-test.js';

/**
 * Main test runner for Step 5.2 comprehensive testing
 */
export class TestRunner {
    constructor() {
        this.testResults = {
            comprehensive: null,
            performance: null,
            migration: null,
            summary: {}
        };
        this.startTime = null;
        this.endTime = null;
    }

    /**
     * Run all Step 5.2 tests
     */
    async runAllTests() {
        console.log('🧪 GRIDFLOW STEP 5.2 COMPREHENSIVE TESTING');
        console.log('===========================================');
        console.log('Testing: CRUD operations, complex queries, import/export,');
        console.log('         cross-entity relationships, and performance');
        console.log('');

        this.startTime = new Date();

        try {
            // Phase 1: Comprehensive functionality testing
            console.log('📋 PHASE 1: Comprehensive Functionality Testing');
            console.log('──────────────────────────────────────────────');
            this.testResults.comprehensive = await comprehensiveTestSuite.runAllTests();

            // Phase 2: Performance comparison testing
            console.log('\n⚡ PHASE 2: Performance Comparison Testing');
            console.log('─────────────────────────────────────────');
            this.testResults.performance = await performanceComparison.runComparison();

            // Phase 3: Migration testing (if not already run)
            console.log('\n🔄 PHASE 3: Migration Compatibility Testing');
            console.log('──────────────────────────────────────────');
            this.testResults.migration = await migrationTester.runAllTests();

            // Generate final report
            this.endTime = new Date();
            this.generateFinalReport();

            return this.testResults;

        } catch (error) {
            console.error('❌ Test runner failed:', error);
            this.endTime = new Date();
            throw error;
        }
    }

    /**
     * Generate final comprehensive report
     */
    generateFinalReport() {
        console.log('\n📊 FINAL TEST REPORT - STEP 5.2 COMPREHENSIVE TESTING');
        console.log('======================================================');

        const duration = this.endTime - this.startTime;
        
        // Calculate overall statistics
        const stats = this.calculateOverallStatistics();
        
        // Print summary
        console.log('\n🎯 OVERALL SUMMARY:');
        console.log('─────────────────');
        console.log(`Total Testing Duration: ${Math.round(duration / 1000)}s`);
        console.log(`Total Tests Executed: ${stats.totalTests}`);
        console.log(`Overall Success Rate: ${Math.round(stats.successRate)}%`);
        console.log(`Performance Improvement: ${Math.round(stats.performanceImprovement)}%`);
        
        // Print phase results
        this.printPhaseResults();
        
        // Print recommendations
        this.printFinalRecommendations();
        
        // Store summary
        this.testResults.summary = {
            duration: duration,
            statistics: stats,
            timestamp: this.endTime.toISOString(),
            success: stats.successRate > 90,
            recommendations: this.generateFinalRecommendations()
        };

        console.log('\n✅ Step 5.2 Comprehensive Testing Completed');
        console.log('==========================================');
    }

    /**
     * Calculate overall statistics across all test phases
     */
    calculateOverallStatistics() {
        let totalTests = 0;
        let passedTests = 0;
        let performanceImprovement = 0;

        // Comprehensive tests
        if (this.testResults.comprehensive) {
            totalTests += this.testResults.comprehensive.summary.totalTests;
            passedTests += this.testResults.comprehensive.summary.passed;
        }

        // Migration tests
        if (this.testResults.migration) {
            totalTests += this.testResults.migration.length;
            passedTests += this.testResults.migration.filter(t => t.success).length;
        }

        // Performance improvement
        if (this.testResults.performance) {
            performanceImprovement = this.calculateAveragePerformanceImprovement();
        }

        return {
            totalTests,
            passedTests,
            failedTests: totalTests - passedTests,
            successRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
            performanceImprovement
        };
    }

    /**
     * Calculate average performance improvement
     */
    calculateAveragePerformanceImprovement() {
        if (!this.testResults.performance || !this.testResults.performance.comparison) {
            return 0;
        }

        const improvements = [];
        for (const [size, comparison] of Object.entries(this.testResults.performance.comparison)) {
            if (comparison && comparison.improvement && comparison.improvement.total) {
                improvements.push(comparison.improvement.total);
            }
        }

        return improvements.length > 0 
            ? improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length 
            : 0;
    }

    /**
     * Print results for each test phase
     */
    printPhaseResults() {
        console.log('\n📋 PHASE RESULTS:');
        console.log('────────────────');

        // Comprehensive testing results
        if (this.testResults.comprehensive) {
            const comp = this.testResults.comprehensive.summary;
            console.log(`\n✓ Comprehensive Tests: ${comp.passed}/${comp.totalTests} passed (${Math.round(comp.successRate)}%)`);
            
            if (comp.failed > 0) {
                console.log(`  ❌ Failed Tests: ${comp.failed}`);
                // Show first few failed tests
                const failedTests = this.testResults.comprehensive.failedTests.slice(0, 3);
                failedTests.forEach(test => {
                    console.log(`    - ${test.name}: ${test.error}`);
                });
                if (this.testResults.comprehensive.failedTests.length > 3) {
                    console.log(`    ... and ${this.testResults.comprehensive.failedTests.length - 3} more`);
                }
            }
        }

        // Performance testing results
        if (this.testResults.performance) {
            const avgImprovement = this.calculateAveragePerformanceImprovement();
            console.log(`\n⚡ Performance Tests: ${Math.round(avgImprovement)}% average improvement`);
            
            console.log('  Performance by dataset size:');
            for (const [size, comparison] of Object.entries(this.testResults.performance.comparison || {})) {
                if (comparison && comparison.improvement) {
                    console.log(`    - ${size}: ${Math.round(comparison.improvement.total)}% faster`);
                }
            }
        }

        // Migration testing results
        if (this.testResults.migration) {
            const migPassed = this.testResults.migration.filter(t => t.success).length;
            const migTotal = this.testResults.migration.length;
            console.log(`\n🔄 Migration Tests: ${migPassed}/${migTotal} passed (${Math.round((migPassed/migTotal)*100)}%)`);
            
            const failedMigrations = this.testResults.migration.filter(t => !t.success);
            if (failedMigrations.length > 0) {
                console.log(`  ❌ Failed Migrations:`);
                failedMigrations.forEach(test => {
                    console.log(`    - ${test.name}: ${test.error || 'Unknown error'}`);
                });
            }
        }
    }

    /**
     * Print final recommendations
     */
    printFinalRecommendations() {
        const recommendations = this.generateFinalRecommendations();
        
        console.log('\n🎯 FINAL RECOMMENDATIONS:');
        console.log('────────────────────────');
        
        recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec}`);
        });
    }

    /**
     * Generate final recommendations based on all test results
     */
    generateFinalRecommendations() {
        const recommendations = [];
        const stats = this.calculateOverallStatistics();

        // Overall success assessment
        if (stats.successRate >= 95) {
            recommendations.push('🚀 Excellent test results - Dexie migration is production-ready');
        } else if (stats.successRate >= 90) {
            recommendations.push('✅ Good test results - Minor issues should be addressed before production');
        } else if (stats.successRate >= 80) {
            recommendations.push('⚠️ Acceptable test results - Several issues need resolution');
        } else {
            recommendations.push('❌ Poor test results - Significant issues must be fixed before deployment');
        }

        // Performance assessment
        if (stats.performanceImprovement >= 50) {
            recommendations.push('🏆 Outstanding performance improvements achieved');
        } else if (stats.performanceImprovement >= 25) {
            recommendations.push('📈 Good performance improvements justify migration');
        } else if (stats.performanceImprovement > 0) {
            recommendations.push('📊 Modest performance improvements with additional benefits');
        }

        // Specific recommendations based on test results
        if (this.testResults.comprehensive) {
            const comp = this.testResults.comprehensive.summary;
            if (comp.failed > 0) {
                recommendations.push(`🔧 Fix ${comp.failed} failing functionality tests before production`);
            }
        }

        if (this.testResults.migration) {
            const failedMigrations = this.testResults.migration.filter(t => !t.success);
            if (failedMigrations.length > 0) {
                recommendations.push(`🔄 Resolve ${failedMigrations.length} migration test failures`);
            } else {
                recommendations.push('✅ All migration scenarios tested successfully');
            }
        }

        // Next steps
        if (stats.successRate >= 90) {
            recommendations.push('🎯 Ready to proceed to Step 5.3 (Cleanup) and production deployment');
        } else {
            recommendations.push('🔄 Rerun tests after fixing identified issues');
        }

        return recommendations;
    }

    /**
     * Run individual test categories (for targeted testing)
     */
    async runCRUDTests() {
        console.log('🔨 Running CRUD Tests Only...');
        await comprehensiveTestSuite.setupTestEnvironment();
        await comprehensiveTestSuite.testCRUDOperations();
        await comprehensiveTestSuite.cleanupTestEnvironment();
        console.log('✅ CRUD Tests Completed');
    }

    async runQueryTests() {
        console.log('🔍 Running Query Tests Only...');
        await comprehensiveTestSuite.setupTestEnvironment();
        await comprehensiveTestSuite.testComplexQueries();
        await comprehensiveTestSuite.cleanupTestEnvironment();
        console.log('✅ Query Tests Completed');
    }

    async runPerformanceTests() {
        console.log('⚡ Running Performance Tests Only...');
        const results = await performanceComparison.runComparison();
        console.log('✅ Performance Tests Completed');
        return results;
    }

    async runMigrationTests() {
        console.log('🔄 Running Migration Tests Only...');
        const results = await migrationTester.runAllTests();
        console.log('✅ Migration Tests Completed');
        return results;
    }

    /**
     * Generate exportable test report
     */
    generateExportableReport() {
        return {
            metadata: {
                title: 'GridFlow Step 5.2 Comprehensive Testing Report',
                timestamp: this.endTime?.toISOString() || new Date().toISOString(),
                duration: this.endTime ? this.endTime - this.startTime : 0,
                version: '7.0',
                architecture: 'Dexie'
            },
            summary: this.testResults.summary,
            phases: {
                comprehensive: this.testResults.comprehensive,
                performance: this.testResults.performance,
                migration: this.testResults.migration
            },
            statistics: this.calculateOverallStatistics(),
            recommendations: this.generateFinalRecommendations(),
            conclusion: this.generateConclusion()
        };
    }

    /**
     * Generate final conclusion
     */
    generateConclusion() {
        const stats = this.calculateOverallStatistics();
        
        if (stats.successRate >= 95 && stats.performanceImprovement >= 25) {
            return 'The Dexie migration has been thoroughly tested and demonstrates excellent functionality and performance improvements. The implementation is ready for production deployment.';
        } else if (stats.successRate >= 90) {
            return 'The Dexie migration shows good test results with acceptable performance. Minor issues should be addressed before production deployment.';
        } else {
            return 'The Dexie migration requires additional work to resolve test failures before it can be considered production-ready.';
        }
    }
}

// Create singleton instance
export const testRunner = new TestRunner();

// Make available globally for testing
if (typeof window !== 'undefined') {
    window.testRunner = testRunner;
    
    // Global convenience functions
    window.runAllTests = () => testRunner.runAllTests();
    window.runCRUDTests = () => testRunner.runCRUDTests();
    window.runQueryTests = () => testRunner.runQueryTests();
    window.runPerformanceTests = () => testRunner.runPerformanceTests();
    window.runMigrationTests = () => testRunner.runMigrationTests();
}