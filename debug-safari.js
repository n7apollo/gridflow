/**
 * Safari Debug Helper for GridFlow
 * Run this in Safari console to diagnose issues
 */

async function debugSafariIssues() {
    console.log('🔍 GridFlow Safari Debug Report');
    console.log('================================');
    
    // 1. Check basic browser support
    console.log('📱 Browser Support:');
    console.log('  - IndexedDB:', !!window.indexedDB);
    console.log('  - Dexie:', !!window.Dexie);
    console.log('  - ES6 Modules:', typeof import !== 'undefined');
    console.log('  - Async/Await:', typeof (async () => {}) === 'function');
    
    // 2. Check if GridFlow is loaded
    console.log('\n🚀 GridFlow Loading:');
    console.log('  - App initialized:', !!window.appInitialized);
    console.log('  - Database instance:', !!window.gridFlowDB);
    console.log('  - App data:', !!window.appData);
    console.log('  - Board data:', !!window.boardData);
    
    // 3. Check IndexedDB status
    console.log('\n🗄️ IndexedDB Status:');
    try {
        const databases = await indexedDB.databases();
        console.log('  - Available databases:', databases.map(db => db.name));
        
        if (window.gridFlowDB) {
            console.log('  - GridFlow DB open:', window.gridFlowDB.isOpen());
            if (window.gridFlowDB.isOpen()) {
                const tables = window.gridFlowDB.tables.map(t => t.name);
                console.log('  - Tables:', tables);
                
                // Check data counts
                for (const tableName of ['entities', 'boards', 'metadata']) {
                    try {
                        const count = await window.gridFlowDB[tableName].count();
                        console.log(`  - ${tableName} count:`, count);
                    } catch (e) {
                        console.log(`  - ${tableName} error:`, e.message);
                    }
                }
            }
        }
    } catch (error) {
        console.log('  - IndexedDB error:', error.message);
    }
    
    // 4. Check for common Safari issues
    console.log('\n🔧 Safari-Specific Checks:');
    console.log('  - Private browsing:', !window.indexedDB || window.indexedDB.toString().includes('disabled'));
    console.log('  - Service worker:', 'serviceWorker' in navigator);
    console.log('  - Local storage:', !!window.localStorage);
    
    // 5. Check module loading
    console.log('\n📦 Module Loading:');
    const modules = [
        'coreData', 'boardService', 'entityService', 'metaService',
        'navigation', 'boardManagement', 'boardRendering'
    ];
    
    modules.forEach(module => {
        console.log(`  - ${module}:`, !!window[module]);
    });
    
    // 6. Check DOM elements
    console.log('\n🎨 DOM Elements:');
    const elements = [
        'boardContainer', 'currentBoardName', 'boardHeader', 
        'rowsContainer', 'boardDropdown'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`  - #${id}:`, !!element);
    });
    
    // 7. Try to initialize manually
    console.log('\n🔄 Manual Initialization Test:');
    if (window.emergencyDataRecovery) {
        try {
            const result = await window.emergencyDataRecovery();
            console.log('  - Emergency recovery result:', result);
        } catch (error) {
            console.log('  - Emergency recovery failed:', error.message);
        }
    }
    
    console.log('\n✅ Debug report complete!');
    console.log('Copy this entire output and share it for detailed analysis.');
}

// Auto-run the debug check
debugSafariIssues().catch(error => {
    console.error('Debug script failed:', error);
});

// Also provide manual functions
window.safariDebug = {
    checkDB: async () => {
        if (window.gridFlowDB) {
            await window.gridFlowDB.open();
            console.log('Database opened successfully');
        }
    },
    clearAll: () => {
        localStorage.clear();
        indexedDB.deleteDatabase('GridFlowDB');
        console.log('Cleared all data - refresh the page');
    },
    forceInit: () => {
        if (window.initializeGridFlow) {
            window.initializeGridFlow();
        }
    }
};

console.log('🔧 Safari debug tools loaded!');
console.log('Available commands:');
console.log('  - safariDebug.checkDB() - Check database connection');
console.log('  - safariDebug.clearAll() - Clear all data');
console.log('  - safariDebug.forceInit() - Force re-initialization');