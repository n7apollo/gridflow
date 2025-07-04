/**
 * Debug script to investigate weekly item contamination on boards
 * Run this in the browser console to understand the data structure
 */

async function debugWeeklyContamination() {
    console.log('🔍 Debugging weekly item contamination...');
    
    try {
        // 1. Check all weekly items
        const weeklyItems = await window.gridFlowDB.weeklyItems.toArray();
        console.log('📅 Weekly Items:', weeklyItems.length, weeklyItems);
        
        // 2. Check all entity positions  
        const entityPositions = await window.gridFlowDB.entityPositions.toArray();
        console.log('📍 Entity Positions:', entityPositions.length, entityPositions);
        
        // 3. Check current board structure
        const currentBoardId = await window.metaService.getCurrentBoardId();
        const currentBoard = await window.boardService.getById(currentBoardId);
        console.log('📋 Current Board:', currentBoardId, currentBoard);
        
        // 4. Check if weekly entities appear in board rows
        if (currentBoard && currentBoard.rows) {
            console.log('🔍 Checking board rows for weekly items...');
            
            const weeklyEntityIds = weeklyItems.map(item => item.entityId);
            let foundContamination = false;
            
            currentBoard.rows.forEach((row, rowIndex) => {
                if (row.cards) {
                    Object.entries(row.cards).forEach(([columnKey, cardIds]) => {
                        cardIds.forEach(cardId => {
                            if (weeklyEntityIds.includes(cardId)) {
                                console.log(`⚠️ CONTAMINATION FOUND: Weekly entity ${cardId} in row ${rowIndex} column ${columnKey}`);
                                foundContamination = true;
                            }
                        });
                    });
                }
            });
            
            if (!foundContamination) {
                console.log('✅ No weekly items found in board card arrays');
            }
        }
        
        // 5. Check app data structure
        console.log('🗂️ App Data Structure:');
        console.log('- Boards:', Object.keys(window.appData?.boards || {}));
        console.log('- Entities:', Object.keys(window.appData?.entities || {}).length);
        console.log('- Weekly Plans:', Object.keys(window.appData?.weeklyPlans || {}));
        
        // 6. Check for entities in both weekly and board contexts
        console.log('🔍 Cross-checking entities in multiple contexts...');
        
        for (const weeklyItem of weeklyItems) {
            const entityId = weeklyItem.entityId;
            
            // Check if this entity has board positions
            const boardPositions = await window.gridFlowDB.entityPositions
                .where('entityId').equals(entityId)
                .and(pos => pos.context === 'board')
                .toArray();
                
            if (boardPositions.length > 0) {
                console.log(`⚠️ Entity ${entityId} exists in both weekly plans AND board positions:`, boardPositions);
            }
            
            // Check if this entity appears in board card arrays
            if (currentBoard && currentBoard.rows) {
                for (const row of currentBoard.rows) {
                    if (row.cards) {
                        for (const [columnKey, cardIds] of Object.entries(row.cards)) {
                            if (cardIds.includes(entityId)) {
                                console.log(`⚠️ Entity ${entityId} appears in board row ${row.id} column ${columnKey} AND weekly plans`);
                            }
                        }
                    }
                }
            }
        }
        
        console.log('🔍 Debug complete!');
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

// Also create a cleanup function for board card arrays
async function cleanupWeeklyItemsFromBoardCardArrays() {
    console.log('🧹 Cleaning weekly items from board card arrays...');
    
    try {
        const currentBoardId = await window.metaService.getCurrentBoardId();
        const currentBoard = await window.boardService.getById(currentBoardId);
        const weeklyItems = await window.gridFlowDB.weeklyItems.toArray();
        const weeklyEntityIds = weeklyItems.map(item => item.entityId);
        
        let cleanedCount = 0;
        let modified = false;
        
        if (currentBoard && currentBoard.rows) {
            currentBoard.rows.forEach((row, rowIndex) => {
                if (row.cards) {
                    Object.entries(row.cards).forEach(([columnKey, cardIds]) => {
                        const filteredCards = cardIds.filter(cardId => {
                            if (weeklyEntityIds.includes(cardId)) {
                                console.log(`🧹 Removing weekly entity ${cardId} from row ${rowIndex} column ${columnKey}`);
                                cleanedCount++;
                                modified = true;
                                return false; // Remove it
                            }
                            return true; // Keep it
                        });
                        row.cards[columnKey] = filteredCards;
                    });
                }
            });
        }
        
        if (modified) {
            // Save the cleaned board
            await window.boardService.save(currentBoard);
            
            // Update app data
            window.appData.boards[currentBoardId] = currentBoard;
            window.boardData = currentBoard;
            
            // Re-render the board
            if (window.renderBoard) {
                window.renderBoard();
            }
            
            console.log(`✅ Cleaned ${cleanedCount} weekly items from board card arrays`);
        } else {
            console.log('✅ No weekly items found in board card arrays');
        }
        
        return { success: true, cleanedCount };
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        return { success: false, error: error.message };
    }
}

console.log('🔧 Weekly contamination debug tools loaded!');
console.log('Run: await debugWeeklyContamination()');
console.log('Run: await cleanupWeeklyItemsFromBoardCardArrays()');