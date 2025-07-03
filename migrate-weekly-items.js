/**
 * One-time migration script to convert legacy weekly items to entity-based format
 * Run this in the browser console after the app loads
 */

async function migrateWeeklyItemsToEntitySystem() {
    console.log('Starting weekly items migration...');
    
    try {
        if (!window.appData || !window.appData.weeklyPlans) {
            console.log('No weekly plans found');
            return;
        }
        
        const { createEntity, ENTITY_TYPES } = await import('./js/entity-core.js');
        let migratedCount = 0;
        
        // Iterate through all weekly plans
        for (const [weekKey, weeklyPlan] of Object.entries(window.appData.weeklyPlans)) {
            if (!weeklyPlan.items) continue;
            
            console.log(`Migrating weekly plan ${weekKey}...`);
            
            // Migrate each item
            for (const item of weeklyPlan.items) {
                // Skip if already has entityId (already migrated)
                if (item.entityId) {
                    console.log(`Item ${item.id} already migrated`);
                    continue;
                }
                
                // Skip card-type items (they reference board cards)
                if (item.type === 'card') {
                    console.log(`Skipping card-type item ${item.id}`);
                    continue;
                }
                
                // Only migrate note, task, checklist, project types
                if (!item.type || !['note', 'task', 'checklist', 'project'].includes(item.type)) {
                    console.log(`Skipping unknown type item ${item.id}:`, item.type);
                    continue;
                }
                
                console.log(`Migrating item ${item.id} of type ${item.type}`);
                
                try {
                    // Create entity for this weekly item
                    const entityData = {
                        title: item.title || '',
                        content: item.content || '',
                        completed: item.completed || false
                    };
                    
                    // Determine entity type
                    const entityType = item.type === 'checklist' ? ENTITY_TYPES.CHECKLIST : 
                                     item.type === 'project' ? ENTITY_TYPES.PROJECT :
                                     ENTITY_TYPES.NOTE; // Default to note for 'note' and 'task'
                    
                    // Create the entity
                    const entity = await createEntity(entityType, entityData);
                    
                    // Update the weekly item to reference the entity
                    item.entityId = entity.id;
                    item.addedAt = item.createdAt || new Date().toISOString();
                    
                    // Remove the old direct properties (they're now in the entity)
                    delete item.title;
                    delete item.content;
                    delete item.type;
                    delete item.completed;
                    delete item.createdAt;
                    
                    console.log(`Migrated item ${item.id} -> entity ${entity.id}`);
                    migratedCount++;
                    
                } catch (error) {
                    console.error(`Failed to migrate item ${item.id}:`, error);
                }
            }
        }
        
        // Save the updated data
        if (migratedCount > 0) {
            window.coreData.setAppData(window.appData);
            window.coreData.saveData();
            console.log(`Migration complete! Migrated ${migratedCount} weekly items.`);
            console.log('Please refresh the page to see the changes.');
        } else {
            console.log('No weekly items needed migration.');
        }
        
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

// Run the migration
console.log('Weekly items migration script loaded. Run migrateWeeklyItemsToEntitySystem() to start migration.');