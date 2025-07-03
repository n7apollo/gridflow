/**
 * One-time migration script to move people from entities table to people table
 * Run this in the browser console after the app loads
 */

async function migratePeopleFromEntitiesToPeopleTable() {
    console.log('Starting people migration...');
    
    try {
        // Get all person entities from the entities table
        const personEntities = await window.gridFlowDB.entities
            .where('type').equals('person')
            .toArray();
        
        console.log(`Found ${personEntities.length} person entities to migrate`);
        
        if (personEntities.length === 0) {
            console.log('No people to migrate');
            return;
        }
        
        // Migrate each person to the people table
        for (const entity of personEntities) {
            console.log('Migrating person:', entity.name || entity.title);
            
            // Transform entity to people table format
            const person = {
                id: entity.id,
                name: entity.name || entity.title || '',
                email: entity.email || '',
                company: entity.company || '',
                role: entity.role || '',
                relationshipType: entity.relationshipType || 'contact',
                tags: entity.tags || [],
                notes: entity.notes || entity.content || '',
                lastInteraction: entity.lastInteraction || entity.updatedAt || new Date().toISOString(),
                interactionFrequency: entity.interactionFrequency || 'monthly',
                createdAt: entity.createdAt || new Date().toISOString(),
                updatedAt: entity.updatedAt || new Date().toISOString(),
                
                // Additional fields from entity if they exist
                phone: entity.phone || '',
                birthday: entity.birthday || null,
                location: entity.location || '',
                timezone: entity.timezone || '',
                socialLinks: entity.socialLinks || {},
                firstMet: entity.firstMet || null
            };
            
            // Save to people table
            await window.gridFlowDB.people.put(person);
            console.log(`Migrated person: ${person.name}`);
        }
        
        console.log(`Migration complete! Migrated ${personEntities.length} people.`);
        console.log('You can now delete the person entities from the entities table if desired.');
        
        // Optionally remove from entities table (uncomment if you want to clean up)
        // for (const entity of personEntities) {
        //     await window.gridFlowDB.entities.delete(entity.id);
        //     console.log(`Deleted entity: ${entity.id}`);
        // }
        
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

// Run the migration
console.log('People migration script loaded. Run migratePeopleFromEntitiesToPeopleTable() to start migration.');