/**
 * GridFlow - Data Source Debug Helper (IndexedDB-Only)
 * Run these commands in browser console to check IndexedDB data
 */

// Make functions available globally for debugging
window.debugDataSource = {
    
    /**
     * Quick check of current data source
     */
    async quickCheck() {
        try {
            console.log('🔍 Data Source Quick Check (IndexedDB-Only):');
            console.log('📊 Implementation: IndexedDB-Only Architecture');
            console.log('🗄️ IndexedDB Status: Always Enabled');
            console.log('✅ App is using IndexedDB as exclusive data source');
            
            // Check database status
            const dbInfo = window.gridFlowDB?.getInfo();
            if (dbInfo) {
                console.log(`📁 Database: ${dbInfo.name} (v${dbInfo.version})`);
                console.log(`🗂️ Object Stores: ${dbInfo.objectStoreNames.join(', ')}`);
            }
            
            // Check app health
            if (window.getAppHealthStatus) {
                const health = await window.getAppHealthStatus();
                console.log(`💚 App Health: ${health.healthy ? 'Healthy' : 'Unhealthy'}`);
                console.log(`📊 Data: ${health.data?.entities || 0} entities, ${health.data?.boards || 0} boards`);
            }
            
            return { 
                implementation: 'indexeddb-only',
                database: dbInfo,
                healthy: true
            };
        } catch (error) {
            console.error('❌ Debug check failed:', error);
            return null;
        }
    },
    
    /**
     * Test entity retrieval from IndexedDB
     */
    async testEntityRetrieval(entityId) {
        if (!entityId) {
            try {
                const entities = await window.entityAdapter?.getAll();
                entityId = entities?.[0]?.id;
                if (!entityId) {
                    console.log('❌ No entities found to test');
                    return;
                }
            } catch (error) {
                console.log('❌ Failed to get entities for testing');
                return;
            }
        }
        
        console.log(`🧪 Testing entity retrieval for: ${entityId}`);
        
        try {
            // Test IndexedDB directly
            if (window.entityAdapter) {
                const idbEntity = await window.entityAdapter.getById(entityId);
                console.log(`🗄️ IndexedDB Direct: ${idbEntity ? '✅ Found' : '❌ Not found'}`);
                if (idbEntity) {
                    console.log(`   📝 Title: ${idbEntity.title}`);
                    console.log(`   🏷️ Type: ${idbEntity.type}`);
                    console.log(`   ✅ Completed: ${idbEntity.completed}`);
                }
            }
            
            // Test through entity core
            if (window.entityCore?.getEntity) {
                const coreEntity = await window.entityCore.getEntity(entityId);
                console.log(`⚙️ Entity Core: ${coreEntity ? '✅ Found' : '❌ Not found'}`);
            }
            
            // Test appData cache
            const appData = window.getAppData?.();
            if (appData?.entities) {
                const cachedEntity = appData.entities[entityId];
                console.log(`💾 Cache: ${cachedEntity ? '✅ Found' : '❌ Not found'}`);
            }
            
        } catch (error) {
            console.error('❌ Entity test failed:', error);
        }
    },
    
    /**
     * Check data counts in IndexedDB and cache
     */
    async checkDataCounts() {
        try {
            // Get IndexedDB counts
            const entities = await window.entityAdapter?.getAll() || [];
            const boards = await window.boardAdapter?.getAll() || [];
            const weeklyPlans = await window.weeklyPlanAdapter?.getAll() || [];
            
            // Get cache counts
            const appData = window.getAppData?.() || {};
            const cacheEntityCount = Object.keys(appData.entities || {}).length;
            const cacheBoardCount = Object.keys(appData.boards || {}).length;
            const cacheWeeklyCount = Object.keys(appData.weeklyPlans || {}).length;
            
            console.log('📊 Data Count Report (IndexedDB-Only):');
            console.log(`🗄️ IndexedDB: ${entities.length} entities, ${boards.length} boards, ${weeklyPlans.length} weekly plans`);
            console.log(`💾 Cache: ${cacheEntityCount} entities, ${cacheBoardCount} boards, ${cacheWeeklyCount} weekly plans`);
            
            const synced = entities.length === cacheEntityCount && 
                          boards.length === cacheBoardCount &&
                          weeklyPlans.length === cacheWeeklyCount;
            console.log(`🔄 Cache Status: ${synced ? '✅ Synced' : '⚠️ Out of sync'}`);
            
            // Get app config info
            if (window.appMetadataAdapter) {
                const appConfig = await window.appMetadataAdapter.getAppConfig();
                console.log(`⚙️ App Version: ${appConfig.version}`);
                console.log(`📋 Current Board: ${appConfig.currentBoardId}`);
            }
            
            return { 
                indexedDB: { entities: entities.length, boards: boards.length, weeklyPlans: weeklyPlans.length },
                cache: { entities: cacheEntityCount, boards: cacheBoardCount, weeklyPlans: cacheWeeklyCount },
                synced 
            };
        } catch (error) {
            console.error('❌ Count check failed:', error);
            return null;
        }
    },
    
    /**
     * Monitor IndexedDB operations
     */
    async monitorOperations() {
        console.log('🔍 Monitoring IndexedDB operations...');
        
        // Hook into entity operations
        const originalCreateEntity = window.entityCore?.createEntity;
        const originalUpdateEntity = window.entityCore?.updateEntity;
        const originalDeleteEntity = window.entityCore?.deleteEntity;
        
        if (originalCreateEntity) {
            window.entityCore.createEntity = function(...args) {
                console.log('📝 Entity created via IndexedDB-only entity core');
                return originalCreateEntity.apply(this, args);
            };
        }
        
        if (originalUpdateEntity) {
            window.entityCore.updateEntity = function(...args) {
                console.log('✏️ Entity updated via IndexedDB-only entity core');
                return originalUpdateEntity.apply(this, args);
            };
        }
        
        if (originalDeleteEntity) {
            window.entityCore.deleteEntity = function(...args) {
                console.log('🗑️ Entity deleted via IndexedDB-only entity core');
                return originalDeleteEntity.apply(this, args);
            };
        }
        
        console.log('✅ Monitoring active. Create/update/delete entities to see IndexedDB flow.');
        
        // Auto-restore after 30 seconds
        setTimeout(() => {
            if (originalCreateEntity) {
                window.entityCore.createEntity = originalCreateEntity;
            }
            if (originalUpdateEntity) {
                window.entityCore.updateEntity = originalUpdateEntity;
            }
            if (originalDeleteEntity) {
                window.entityCore.deleteEntity = originalDeleteEntity;
            }
            console.log('🔄 Monitoring disabled');
        }, 30000);
    },
    
    /**
     * Test IndexedDB performance
     */
    async performanceTest() {
        console.log('⚡ Running IndexedDB performance test...');
        
        try {
            // Test entity retrieval speed
            const start = performance.now();
            const entities = await window.entityAdapter?.getAll() || [];
            const retrievalTime = performance.now() - start;
            
            console.log(`📊 Retrieved ${entities.length} entities in ${retrievalTime.toFixed(2)}ms`);
            console.log(`⚡ Average: ${(retrievalTime / entities.length).toFixed(2)}ms per entity`);
            
            // Test search speed if we have entities
            if (entities.length > 0) {
                const searchStart = performance.now();
                const searchResults = await window.entityCore?.searchEntities({ type: 'task' });
                const searchTime = performance.now() - searchStart;
                
                console.log(`🔍 Search completed in ${searchTime.toFixed(2)}ms (${searchResults?.length || 0} results)`);
            }
            
            return {
                entityCount: entities.length,
                retrievalTime: retrievalTime,
                avgPerEntity: retrievalTime / entities.length
            };
            
        } catch (error) {
            console.error('❌ Performance test failed:', error);
            return null;
        }
    }
};

// Quick access functions
window.checkDataSource = window.debugDataSource.quickCheck;
window.testEntity = window.debugDataSource.testEntityRetrieval;
window.checkCounts = window.debugDataSource.checkDataCounts;
window.perfTest = window.debugDataSource.performanceTest;

console.log('🔧 IndexedDB Debug Tools Loaded! Use these commands:');
console.log('   debugDataSource.quickCheck() - Check IndexedDB status');
console.log('   debugDataSource.testEntityRetrieval() - Test entity access');
console.log('   debugDataSource.checkDataCounts() - Check data counts');
console.log('   debugDataSource.monitorOperations() - Monitor IndexedDB operations');
console.log('   debugDataSource.performanceTest() - Test IndexedDB performance');
console.log('');
console.log('🚀 Quick commands:');
console.log('   checkDataSource() - Quick status check');
console.log('   testEntity("entity_1") - Test specific entity');
console.log('   checkCounts() - Check data counts');
console.log('   perfTest() - Performance test');