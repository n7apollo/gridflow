/**
 * GridFlow - Entity Migration System
 * 
 * Migrates existing card-based data to the new unified entity system
 */

import { getAppData, setAppData, saveData } from './core-data.js';
import { createEntity, ENTITY_TYPES } from './entity-core.js';
import { showStatusMessage } from './utilities.js';

/**
 * Migrate all existing data to unified entity system
 * @returns {Object} Migration results
 */
export function migrateToEntitySystem() {
    console.log('Starting migration to unified entity system...');
    
    // Create backup before migration
    const backupCreated = createMigrationBackup();
    if (!backupCreated) {
        console.warn('Failed to create backup, but continuing with migration');
    }
    
    const appData = getAppData();
    const results = {
        cardsConverted: 0,
        weeklyItemsConverted: 0,
        entitiesCreated: 0,
        errors: [],
        backupCreated: backupCreated
    };
    
    try {
        // Initialize entities structure
        if (!appData.entities) {
            appData.entities = {};
        }
        
        // Migrate board cards to entities
        results.cardsConverted = migrateBoardCards(appData, results);
        
        // Migrate weekly items to entity references
        results.weeklyItemsConverted = migrateWeeklyItems(appData, results);
        
        // Save migrated data
        setAppData(appData);
        saveData();
        
        console.log('Migration completed:', results);
        showStatusMessage(`Migration completed: ${results.entitiesCreated} entities created`, 'success');
        
        return results;
        
    } catch (error) {
        console.error('Migration failed:', error);
        results.errors.push(error.message);
        showStatusMessage('Migration failed: ' + error.message, 'error');
        return results;
    }
}

/**
 * Migrate board cards to entities
 * @param {Object} appData - Application data
 * @param {Object} results - Migration results object
 * @returns {number} Number of cards converted
 */
function migrateBoardCards(appData, results) {
    let cardsConverted = 0;
    
    Object.keys(appData.boards).forEach(boardId => {
        const board = appData.boards[boardId];
        
        if (!board.rows) return;
        
        board.rows.forEach(row => {
            if (!row.cards) return;
            
            Object.keys(row.cards).forEach(columnKey => {
                const cards = row.cards[columnKey];
                const newCardList = [];
                
                cards.forEach(card => {
                    try {
                        // Skip if already an entity ID
                        if (typeof card === 'string' && card.startsWith('entity_')) {
                            newCardList.push(card);
                            return;
                        }
                        
                        // Convert card object to entity
                        const entityType = determineEntityType(card);
                        const entityData = convertCardToEntityData(card);
                        
                        // Create entity
                        const entity = createEntity(entityType, entityData);
                        results.entitiesCreated++;
                        
                        // Replace card with entity ID
                        newCardList.push(entity.id);
                        cardsConverted++;
                        
                        console.log(`Converted card to entity:`, card.id || 'unnamed', '→', entity.id);
                        
                    } catch (error) {
                        console.error('Failed to convert card:', card, error);
                        results.errors.push(`Card conversion failed: ${error.message}`);
                        
                        // Keep original card as fallback
                        newCardList.push(card);
                    }
                });
                
                // Replace card list with entity IDs
                row.cards[columnKey] = newCardList;
            });
        });
    });
    
    return cardsConverted;
}

/**
 * Migrate weekly items to entity references
 * @param {Object} appData - Application data
 * @param {Object} results - Migration results object
 * @returns {number} Number of weekly items converted
 */
function migrateWeeklyItems(appData, results) {
    let weeklyItemsConverted = 0;
    
    Object.keys(appData.weeklyPlans || {}).forEach(weekKey => {
        const weeklyPlan = appData.weeklyPlans[weekKey];
        
        if (!weeklyPlan.items) return;
        
        const newItems = [];
        
        weeklyPlan.items.forEach(item => {
            try {
                // Skip if already has entityId
                if (item.entityId) {
                    newItems.push(item);
                    return;
                }
                
                // Convert old weekly item to entity
                const entityType = item.type === 'checklist' ? ENTITY_TYPES.CHECKLIST : ENTITY_TYPES.NOTE;
                const entityData = convertWeeklyItemToEntityData(item);
                
                // Create entity
                const entity = createEntity(entityType, entityData);
                results.entitiesCreated++;
                
                // Create new weekly item with entity reference
                const newWeeklyItem = {
                    id: item.id,
                    entityId: entity.id,
                    day: item.day,
                    addedAt: item.createdAt || new Date().toISOString()
                };
                
                newItems.push(newWeeklyItem);
                weeklyItemsConverted++;
                
                console.log(`Converted weekly item to entity:`, item.id, '→', entity.id);
                
            } catch (error) {
                console.error('Failed to convert weekly item:', item, error);
                results.errors.push(`Weekly item conversion failed: ${error.message}`);
                
                // Keep original item as fallback
                newItems.push(item);
            }
        });
        
        // Replace items with entity references
        weeklyPlan.items = newItems;
    });
    
    return weeklyItemsConverted;
}

/**
 * Determine entity type from card data
 * @param {Object} card - Card data
 * @returns {string} Entity type
 */
function determineEntityType(card) {
    // Check for explicit type
    if (card.type) {
        switch (card.type.toLowerCase()) {
            case 'task':
            case 'todo':
                return ENTITY_TYPES.TASK;
            case 'note':
                return ENTITY_TYPES.NOTE;
            case 'checklist':
                return ENTITY_TYPES.CHECKLIST;
            case 'project':
                return ENTITY_TYPES.PROJECT;
        }
    }
    
    // Infer type from content
    if (card.subtasks && card.subtasks.length > 0) {
        return ENTITY_TYPES.TASK;
    }
    
    if (card.items && Array.isArray(card.items)) {
        return ENTITY_TYPES.CHECKLIST;
    }
    
    if (card.priority || card.dueDate || card.assignee) {
        return ENTITY_TYPES.TASK;
    }
    
    // Default to note
    return ENTITY_TYPES.NOTE;
}

/**
 * Convert card data to entity data format
 * @param {Object} card - Card data
 * @returns {Object} Entity data
 */
function convertCardToEntityData(card) {
    const entityData = {
        title: card.title || card.name || 'Untitled',
        content: card.description || card.content || '',
        completed: card.completed || false,
        tags: card.tags || [],
        createdAt: card.createdAt || new Date().toISOString()
    };
    
    // Add type-specific fields
    if (card.priority) entityData.priority = card.priority;
    if (card.dueDate) entityData.dueDate = card.dueDate;
    if (card.assignee) entityData.assignee = card.assignee;
    if (card.estimatedTime) entityData.estimatedTime = card.estimatedTime;
    if (card.actualTime) entityData.actualTime = card.actualTime;
    if (card.subtasks) entityData.subtasks = card.subtasks;
    if (card.items) entityData.items = card.items;
    if (card.attachments) entityData.attachments = card.attachments;
    
    // Project-specific fields
    if (card.status && ['planning', 'active', 'on-hold', 'completed'].includes(card.status)) {
        entityData.status = card.status;
    }
    if (card.startDate) entityData.startDate = card.startDate;
    if (card.endDate) entityData.endDate = card.endDate;
    if (card.budget) entityData.budget = card.budget;
    if (card.team) entityData.team = card.team;
    if (card.milestones) entityData.milestones = card.milestones;
    
    return entityData;
}

/**
 * Convert weekly item data to entity data format
 * @param {Object} item - Weekly item data
 * @returns {Object} Entity data
 */
function convertWeeklyItemToEntityData(item) {
    return {
        title: item.title || 'Weekly Item',
        content: item.content || item.description || '',
        completed: item.completed || false,
        tags: item.tags || [],
        items: item.items || [],
        createdAt: item.createdAt || new Date().toISOString()
    };
}

/**
 * Check if migration is needed
 * @returns {boolean} True if migration is needed
 */
export function isMigrationNeeded() {
    const appData = getAppData();
    
    // Check if entities structure exists
    if (!appData.entities) {
        return true;
    }
    
    // Check if any boards still have object cards instead of entity IDs
    const hasObjectCards = Object.values(appData.boards || {}).some(board => {
        return (board.rows || []).some(row => {
            if (!row.cards) return false;
            
            return Object.values(row.cards).some(cardList => {
                return cardList.some(card => {
                    return typeof card === 'object' && !card.entityId;
                });
            });
        });
    });
    
    if (hasObjectCards) {
        return true;
    }
    
    // Check if any weekly items don't have entityId references
    const hasNonEntityWeeklyItems = Object.values(appData.weeklyPlans || {}).some(plan => {
        return (plan.items || []).some(item => {
            return !item.entityId && (item.title || item.content);
        });
    });
    
    return hasNonEntityWeeklyItems;
}

/**
 * Get migration status report
 * @returns {Object} Migration status
 */
export function getMigrationStatus() {
    const appData = getAppData();
    
    let totalCards = 0;
    let entityCards = 0;
    let objectCards = 0;
    
    Object.values(appData.boards || {}).forEach(board => {
        (board.rows || []).forEach(row => {
            if (!row.cards) return;
            
            Object.values(row.cards).forEach(cardList => {
                cardList.forEach(card => {
                    totalCards++;
                    if (typeof card === 'string' && card.startsWith('entity_')) {
                        entityCards++;
                    } else {
                        objectCards++;
                    }
                });
            });
        });
    });
    
    let totalWeeklyItems = 0;
    let entityWeeklyItems = 0;
    let objectWeeklyItems = 0;
    
    Object.values(appData.weeklyPlans || {}).forEach(plan => {
        (plan.items || []).forEach(item => {
            totalWeeklyItems++;
            if (item.entityId) {
                entityWeeklyItems++;
            } else {
                objectWeeklyItems++;
            }
        });
    });
    
    return {
        entities: {
            total: Object.keys(appData.entities || {}).length
        },
        cards: {
            total: totalCards,
            migrated: entityCards,
            needsMigration: objectCards
        },
        weeklyItems: {
            total: totalWeeklyItems,
            migrated: entityWeeklyItems,
            needsMigration: objectWeeklyItems
        },
        needsMigration: isMigrationNeeded()
    };
}

/**
 * Rollback migration (restore from backup if available)
 * @returns {boolean} Success
 */
export function rollbackMigration() {
    try {
        // Check if there's a backup in localStorage
        const backupKey = 'gridflow_data_pre_entity_migration';
        const backup = localStorage.getItem(backupKey);
        
        if (!backup) {
            console.warn('No migration backup found');
            showStatusMessage('No backup available for rollback', 'error');
            return false;
        }
        
        // Confirm with user
        const confirmed = confirm(
            'This will restore your data to the state before entity migration. ' +
            'Any changes made after migration will be lost. Continue?'
        );
        
        if (!confirmed) {
            return false;
        }
        
        // Parse and restore backup data
        const backupData = JSON.parse(backup);
        
        // Validate backup data
        if (!backupData || typeof backupData !== 'object') {
            throw new Error('Invalid backup data format');
        }
        
        // Restore the data
        localStorage.setItem('gridflow_data', backup);
        
        // Remove the backup to prevent accidental multiple rollbacks
        localStorage.removeItem(backupKey);
        
        console.log('Successfully rolled back to pre-migration data');
        showStatusMessage('Data restored to pre-migration state. Please refresh the page.', 'success');
        
        // Suggest page refresh
        setTimeout(() => {
            if (confirm('Data has been restored. Refresh the page to see changes?')) {
                window.location.reload();
            }
        }, 2000);
        
        return true;
        
    } catch (error) {
        console.error('Rollback failed:', error);
        showStatusMessage('Rollback failed: ' + error.message, 'error');
        return false;
    }
}

/**
 * Create a backup before migration
 * @returns {boolean} Success
 */
export function createMigrationBackup() {
    try {
        const currentData = localStorage.getItem('gridflow_data');
        if (!currentData) {
            console.warn('No data to backup');
            return false;
        }
        
        const backupKey = 'gridflow_data_pre_entity_migration';
        localStorage.setItem(backupKey, currentData);
        
        console.log('Created migration backup');
        return true;
        
    } catch (error) {
        console.error('Failed to create backup:', error);
        return false;
    }
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
    window.entityMigration = {
        migrateToEntitySystem,
        isMigrationNeeded,
        getMigrationStatus,
        rollbackMigration
    };
}

export {
    isMigrationNeeded,
    getMigrationStatus,
    rollbackMigration,
    createMigrationBackup
};