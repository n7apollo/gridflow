/**
 * Data Migration Module
 * 
 * Handles data migration and cleanup operations for transitioning between 
 * different versions of the GridFlow data schema, including:
 * - Phase 1: Unified entity system migration
 * - Phase 2: Template library and smart collections migration
 * - Legacy data format cleanup and normalization
 * 
 * Dependencies: core-data.js, utilities.js
 */

import { appData, saveData } from './core-data.js';
import { showStatusMessage } from './utilities.js';

/**
 * Convert existing checklist entities to reusable templates
 * Part of Phase 2 migration to template library system
 * @param {Object} data - The application data object
 */
function migrateChecklistsToTemplates(data) {
    Object.keys(data.entities.checklists).forEach(checklistId => {
        const checklist = data.entities.checklists[checklistId];
        
        // Create template from existing checklist if it has common patterns
        if (checklist.tasks && checklist.tasks.length > 0) {
            const templateId = `template_${data.nextTemplateLibraryId++}`;
            
            // Extract tasks for template
            const taskTemplates = checklist.tasks.map(taskId => {
                const task = data.entities.tasks[taskId];
                return {
                    text: task ? task.text : 'Untitled Task',
                    priority: task ? task.priority : 'medium',
                    estimatedTime: null
                };
            });
            
            data.templateLibrary.checklists[templateId] = {
                id: templateId,
                name: checklist.title || 'Checklist Template',
                description: checklist.description || 'Converted from existing checklist',
                category: 'general',
                tasks: taskTemplates,
                tags: ['converted'],
                isPublic: false,
                usageCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Track template usage
            data.relationships.templateUsage[templateId] = [{
                entityType: 'checklist',
                entityId: checklistId,
                usedAt: new Date().toISOString()
            }];
        }
    });
}

/**
 * Convert card subtasks to unified task entities
 * Part of Phase 1 migration to unified entity system
 * @param {Object} data - The application data object
 */
function migrateCardSubtasksToEntities(data) {
    Object.values(data.boards).forEach(board => {
        if (!board.rows) return;
        
        board.rows.forEach(row => {
            if (!row.cards) return;
            
            Object.keys(row.cards).forEach(columnKey => {
                row.cards[columnKey].forEach(card => {
                    if (card.subtasks && card.subtasks.length > 0) {
                        // Convert subtasks to unified tasks
                        const taskIds = [];
                        
                        card.subtasks.forEach(subtask => {
                            const taskId = `task_${data.nextTaskId++}`;
                            
                            data.entities.tasks[taskId] = {
                                id: taskId,
                                text: subtask.text,
                                completed: subtask.completed || false,
                                dueDate: null,
                                priority: 'medium',
                                parentType: 'card',
                                parentId: card.id.toString(),
                                tags: [],
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            };
                            
                            taskIds.push(taskId);
                        });
                        
                        // Update card to reference tasks instead of embedding them
                        card.taskIds = taskIds;
                        
                        // Add to relationship mapping
                        data.relationships.entityTasks[card.id.toString()] = taskIds;
                    }
                    
                    // Keep subtasks for backward compatibility during transition
                    // They will be deprecated later
                });
            });
        });
    });
}

/**
 * Convert weekly plan items to entities
 * Part of Phase 1 migration to unified entity system
 * @param {Object} data - The application data object
 */
function migrateWeeklyPlanItemsToEntities(data) {
    Object.keys(data.weeklyPlans).forEach(weekKey => {
        const weekPlan = data.weeklyPlans[weekKey];
        if (!weekPlan.items) return;
        
        const newItems = [];
        
        weekPlan.items.forEach(item => {
            // Handle different item types
            if (item.type === 'checklist' && item.checklist) {
                // Convert checklist items to unified tasks and checklist entity
                const checklistId = `checklist_${data.nextChecklistId++}`;
                const taskIds = [];
                
                item.checklist.forEach(checkItem => {
                    const taskId = `task_${data.nextTaskId++}`;
                    
                    data.entities.tasks[taskId] = {
                        id: taskId,
                        text: checkItem.text,
                        completed: checkItem.completed || false,
                        dueDate: null,
                        priority: 'medium',
                        parentType: 'checklist',
                        parentId: checklistId,
                        tags: [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    
                    taskIds.push(taskId);
                });
                
                data.entities.checklists[checklistId] = {
                    id: checklistId,
                    title: item.title || 'Checklist',
                    description: '',
                    tasks: taskIds,
                    attachedTo: { type: 'weekly', id: weekKey },
                    isTemplate: false,
                    tags: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                // Add to relationship mapping
                data.relationships.entityTasks[checklistId] = taskIds;
                
                // Update weekly plan item to reference entity
                newItems.push({
                    id: item.id,
                    type: 'checklist',
                    entityId: checklistId,
                    day: item.day,
                    completed: item.completed || false,
                    addedAt: item.createdAt || new Date().toISOString()
                });
                
            } else if (item.type === 'note') {
                // Convert note to note entity
                const noteId = `note_${data.nextNoteId++}`;
                
                data.entities.notes[noteId] = {
                    id: noteId,
                    title: item.title || 'Note',
                    content: item.content || item.description || '',
                    attachedTo: { type: 'weekly', id: weekKey },
                    tags: [],
                    createdAt: item.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                // Update weekly plan item to reference entity
                newItems.push({
                    id: item.id,
                    type: 'note',
                    entityId: noteId,
                    day: item.day,
                    completed: item.completed || false,
                    addedAt: item.createdAt || new Date().toISOString()
                });
                
            } else {
                // Keep existing items (cards, etc.) as-is for now
                newItems.push({
                    id: item.id,
                    type: item.type,
                    entityId: item.cardId || item.entityId,
                    day: item.day,
                    completed: item.completed || false,
                    addedAt: item.createdAt || new Date().toISOString()
                });
            }
        });
        
        // Update weekly plan with new item structure
        weekPlan.items = newItems;
    });
}

/**
 * Build relationship mappings between entities
 * Creates bidirectional relationships for data consistency
 * @param {Object} data - The application data object
 */
function buildRelationshipMappings(data) {
    // Build card to weekly plans mapping
    Object.keys(data.weeklyPlans).forEach(weekKey => {
        const weekPlan = data.weeklyPlans[weekKey];
        if (!weekPlan.items) return;
        
        const cardIds = [];
        
        weekPlan.items.forEach(item => {
            if (item.type === 'card' && item.entityId) {
                const cardId = item.entityId.toString();
                cardIds.push(cardId);
                
                // Add to cardToWeeklyPlans mapping
                if (!data.relationships.cardToWeeklyPlans[cardId]) {
                    data.relationships.cardToWeeklyPlans[cardId] = [];
                }
                if (!data.relationships.cardToWeeklyPlans[cardId].includes(weekKey)) {
                    data.relationships.cardToWeeklyPlans[cardId].push(weekKey);
                }
            }
        });
        
        // Add to weeklyPlanToCards mapping
        data.relationships.weeklyPlanToCards[weekKey] = cardIds;
    });
}

/**
 * Initialize default tag categories for organization
 * Part of Phase 2 migration to enhanced tagging system
 * @param {Object} data - The application data object
 */
function initializeDefaultTags(data) {
    const defaultTags = [
        { name: 'urgent', color: '#ff4444', category: 'priority' },
        { name: 'important', color: '#ff8800', category: 'priority' },
        { name: 'low-priority', color: '#00aa00', category: 'priority' },
        { name: 'work', color: '#0066cc', category: 'context' },
        { name: 'personal', color: '#9966cc', category: 'context' },
        { name: 'project', color: '#cc6600', category: 'context' },
        { name: 'review', color: '#888888', category: 'status' },
        { name: 'blocked', color: '#dd0000', category: 'status' },
        { name: 'waiting', color: '#ffaa00', category: 'status' }
    ];
    
    defaultTags.forEach(tagData => {
        const tagId = `tag_${data.nextTagId++}`;
        data.tags[tagId] = {
            id: tagId,
            name: tagData.name,
            color: tagData.color,
            category: tagData.category,
            description: `Default ${tagData.category} tag`,
            usageCount: 0,
            createdAt: new Date().toISOString()
        };
    });
}

// Export functions
export {
    migrateChecklistsToTemplates,
    migrateCardSubtasksToEntities,
    migrateWeeklyPlanItemsToEntities,
    buildRelationshipMappings,
    initializeDefaultTags
};

// Make functions available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.migrateChecklistsToTemplates = migrateChecklistsToTemplates;
    window.migrateCardSubtasksToEntities = migrateCardSubtasksToEntities;
    window.migrateWeeklyPlanItemsToEntities = migrateWeeklyPlanItemsToEntities;
    window.buildRelationshipMappings = buildRelationshipMappings;
    window.initializeDefaultTags = initializeDefaultTags;
}