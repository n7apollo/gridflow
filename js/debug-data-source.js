/**
 * GridFlow - Data Source Debug Helper
 * Run these commands in browser console to check data source
 */

// Make functions available globally for debugging
window.debugDataSource = {
    
    /**
     * Quick check of current data source
     */
    async quickCheck() {
        try {
            const implName = window.entityCoreSwitcher?.getCurrentImplementationName() || 'unknown';
            const flags = {
                indexedDB: window.featureFlags?.isEnabled('INDEXEDDB_ENABLED') || false,
                dualWrite: window.featureFlags?.isEnabled('DUAL_WRITE') || false,
                indexedDBPrimary: window.featureFlags?.isEnabled('INDEXEDDB_PRIMARY_TEST') || false
            };
            
            console.log('🔍 Data Source Quick Check:');
            console.log(`📊 Implementation: ${implName}`);
            console.log(`🗄️ IndexedDB Enabled: ${flags.indexedDB}`);
            console.log(`🔄 Dual Write: ${flags.dualWrite}`);
            console.log(`🎯 IndexedDB Primary: ${flags.indexedDBPrimary}`);
            
            if (implName === 'indexeddb_first') {
                console.log('✅ App is using IndexedDB as primary data source');
            } else if (implName === 'enhanced') {
                console.log('🔄 App is using dual-write (localStorage + IndexedDB)');
            } else {
                console.log('⚠️ App is using localStorage only');
            }
            
            return { implName, flags };
        } catch (error) {
            console.error('❌ Debug check failed:', error);
            return null;
        }
    },
    
    /**
     * Test entity retrieval from different sources
     */
    async testEntityRetrieval(entityId) {
        if (!entityId) {
            const appData = window.getAppData();
            entityId = Object.keys(appData.entities || {})[0];
            if (!entityId) {
                console.log('❌ No entities found to test');
                return;
            }
        }
        
        console.log(`🧪 Testing entity retrieval for: ${entityId}`);
        
        try {
            // Test localStorage
            const appData = window.getAppData();
            const lsEntity = appData.entities?.[entityId];
            console.log(`📦 localStorage: ${lsEntity ? '✅ Found' : '❌ Not found'}`);
            
            // Test IndexedDB
            if (window.entityIndexedDBService) {
                const idbEntity = await window.entityIndexedDBService.getEntity(entityId);
                console.log(`🗄️ IndexedDB: ${idbEntity ? '✅ Found' : '❌ Not found'}`);
            }
            
            // Test current implementation
            const impl = window.entityCoreSwitcher?.getCurrentImplementation();
            if (impl?.getEntity) {
                const implEntity = impl.getEntity(entityId);
                console.log(`⚙️ Implementation: ${implEntity ? '✅ Found' : '❌ Not found'}`);
            }
            
        } catch (error) {
            console.error('❌ Entity test failed:', error);
        }
    },
    
    /**
     * Check data counts in both sources
     */
    async checkDataCounts() {
        try {
            const appData = window.getAppData();
            const lsEntityCount = Object.keys(appData.entities || {}).length;
            const lsBoardCount = Object.keys(appData.boards || {}).length;
            
            let idbEntityCount = 0;
            let idbBoardCount = 0;
            
            if (window.entityIndexedDBService) {
                try {
                    const idbEntities = await window.entityIndexedDBService.getAllEntities();
                    const idbBoards = await window.entityIndexedDBService.getAllBoards();
                    idbEntityCount = idbEntities.length;
                    idbBoardCount = idbBoards.length;
                } catch (error) {
                    console.warn('IndexedDB count failed:', error.message);
                }
            }
            
            console.log('📊 Data Count Comparison:');
            console.log(`📦 localStorage: ${lsEntityCount} entities, ${lsBoardCount} boards`);
            console.log(`🗄️ IndexedDB: ${idbEntityCount} entities, ${idbBoardCount} boards`);
            
            const synced = lsEntityCount === idbEntityCount && lsBoardCount === idbBoardCount;
            console.log(`🔄 Status: ${synced ? '✅ Synced' : '⚠️ Out of sync'}`);
            
            return { 
                localStorage: { entities: lsEntityCount, boards: lsBoardCount },
                indexedDB: { entities: idbEntityCount, boards: idbBoardCount },
                synced 
            };
        } catch (error) {
            console.error('❌ Count check failed:', error);
            return null;
        }
    },
    
    /**
     * Monitor data source for a few operations
     */
    async monitorOperations() {
        console.log('🔍 Monitoring data operations...');
        
        // Hook into entity operations to see where they go
        const originalCreateEntity = window.entityCoreSwitcher?.getCurrentImplementation()?.createEntity;
        const originalUpdateEntity = window.entityCoreSwitcher?.getCurrentImplementation()?.updateEntity;
        
        if (originalCreateEntity) {
            window.entityCoreSwitcher.getCurrentImplementation().createEntity = function(...args) {
                console.log('📝 Entity created via:', window.entityCoreSwitcher.getCurrentImplementationName());
                return originalCreateEntity.apply(this, args);
            };
        }
        
        if (originalUpdateEntity) {
            window.entityCoreSwitcher.getCurrentImplementation().updateEntity = function(...args) {
                console.log('✏️ Entity updated via:', window.entityCoreSwitcher.getCurrentImplementationName());
                return originalUpdateEntity.apply(this, args);
            };
        }
        
        console.log('✅ Monitoring active. Create/update entities to see data flow.');
        
        // Auto-restore after 30 seconds
        setTimeout(() => {
            if (originalCreateEntity) {
                window.entityCoreSwitcher.getCurrentImplementation().createEntity = originalCreateEntity;
            }
            if (originalUpdateEntity) {
                window.entityCoreSwitcher.getCurrentImplementation().updateEntity = originalUpdateEntity;
            }
            console.log('🔄 Monitoring disabled');
        }, 30000);
    }
};

// Quick access functions
window.checkDataSource = window.debugDataSource.quickCheck;
window.testEntity = window.debugDataSource.testEntityRetrieval;
window.checkCounts = window.debugDataSource.checkDataCounts;

console.log('🔧 Debug tools loaded! Use these commands:');
console.log('   debugDataSource.quickCheck() - Quick implementation check');
console.log('   debugDataSource.testEntityRetrieval() - Test entity access');
console.log('   debugDataSource.checkDataCounts() - Compare data counts');
console.log('   debugDataSource.monitorOperations() - Monitor data operations');
console.log('');
console.log('🚀 Quick commands:');
console.log('   checkDataSource() - Quick check');
console.log('   testEntity("entity_1") - Test specific entity');
console.log('   checkCounts() - Check data counts');