/**
 * GridFlow - Comprehensive Data Migration Strategy (Dexie)
 * Handles migration from multiple data formats to Dexie architecture
 */

import { db } from './db.js';
import { entityService } from './entity-service.js';
import { boardService } from './board-service.js';
import { metaService } from './meta-service.js';

/**
 * Version-aware data migration chain
 * Supports migration from v1.0 → v7.0 (Dexie)
 */
export class DataMigrator {
    constructor() {
        this.currentVersion = '7.0';
        this.supportedVersions = ['1.0', '2.0', '2.5', '3.0', '4.0', '5.0', '6.0', '7.0'];
        this.migrationLog = [];
    }

    /**
     * Auto-detect data version from structure
     * @param {Object} data - Raw imported data
     * @returns {string} Detected version
     */
    detectVersion(data) {
        // Version 7.0: Dexie architecture with exportFormat: 'dexie'
        if (data.version === '7.0' || data.exportFormat === 'dexie') {
            return '7.0';
        }

        // Version 6.0: IndexedDB architecture with exportFormat: 'indexeddb'
        if (data.version === '6.0' || data.exportFormat === 'indexeddb') {
            return '6.0';
        }

        // Version 5.0: Unified entity system
        if (data.version === '5.0' || (data.entities && !data.boards)) {
            return '5.0';
        }

        // Version 4.0: Entity relationships
        if (data.version === '4.0' || data.relationships) {
            return '4.0';
        }

        // Version 3.0: Weekly planning
        if (data.version === '3.0' || data.weeklyPlans) {
            return '3.0';
        }

        // Version 2.5: Templates
        if (data.version === '2.5' || data.templates) {
            return '2.5';
        }

        // Version 2.0: Multi-board format
        if (data.version === '2.0' || data.boards) {
            return '2.0';
        }

        // Version 1.0: Single board format (legacy)
        if (data.groups || data.rows) {
            return '1.0';
        }

        // Default to current version if unrecognizable
        return this.currentVersion;
    }

    /**
     * Main migration entry point
     * @param {Object} rawData - Raw imported data
     * @returns {Object} Migrated data ready for Dexie
     */
    async migrateData(rawData) {
        const detectedVersion = this.detectVersion(rawData);
        this.log(`Detected data version: ${detectedVersion}`, 'info');

        let data = { ...rawData };

        // Apply migration chain
        if (detectedVersion === '1.0') {
            data = this.migrateFromV1(data);
            data = this.migrateFromV2(data);
            data = this.migrateFromV2_5(data);
            data = this.migrateFromV3(data);
            data = this.migrateFromV4(data);
            data = this.migrateFromV5(data);
            data = this.migrateFromV6(data);
        } else if (detectedVersion === '2.0') {
            data = this.migrateFromV2(data);
            data = this.migrateFromV2_5(data);
            data = this.migrateFromV3(data);
            data = this.migrateFromV4(data);
            data = this.migrateFromV5(data);
            data = this.migrateFromV6(data);
        } else if (detectedVersion === '2.5') {
            data = this.migrateFromV2_5(data);
            data = this.migrateFromV3(data);
            data = this.migrateFromV4(data);
            data = this.migrateFromV5(data);
            data = this.migrateFromV6(data);
        } else if (detectedVersion === '3.0') {
            data = this.migrateFromV3(data);
            data = this.migrateFromV4(data);
            data = this.migrateFromV5(data);
            data = this.migrateFromV6(data);
        } else if (detectedVersion === '4.0') {
            data = this.migrateFromV4(data);
            data = this.migrateFromV5(data);
            data = this.migrateFromV6(data);
        } else if (detectedVersion === '5.0') {
            data = this.migrateFromV5(data);
            data = this.migrateFromV6(data);
        } else if (detectedVersion === '6.0') {
            data = this.migrateFromV6(data);
        }
        // Version 7.0 needs no migration

        // Final validation and structure preparation
        data = this.validateAndPrepareForDexie(data);

        this.log(`Migration complete: ${detectedVersion} → ${this.currentVersion}`, 'success');
        return data;
    }

    /**
     * Migrate from v1.0 (single board) to v2.0 (multi-board)
     */
    migrateFromV1(data) {
        this.log('Migrating v1.0 → v2.0: Single board to multi-board format', 'info');

        const migratedData = {
            currentBoardId: 'default',
            boards: {
                default: {
                    id: 'default',
                    name: 'Main Board',
                    groups: data.groups || [],
                    rows: data.rows || [],
                    columns: data.columns || [
                        { id: 1, name: 'To Do', key: 'todo' },
                        { id: 2, name: 'In Progress', key: 'inprogress' },
                        { id: 3, name: 'Done', key: 'done' }
                    ],
                    settings: data.settings || {},
                    nextRowId: data.nextRowId || 1,
                    nextCardId: data.nextCardId || 1,
                    nextColumnId: data.nextColumnId || 4,
                    nextGroupId: data.nextGroupId || 1,
                    createdAt: new Date().toISOString()
                }
            },
            version: '2.0'
        };

        return migratedData;
    }

    /**
     * Migrate from v2.0 to v2.5 (add templates)
     */
    migrateFromV2(data) {
        this.log('Migrating v2.0 → v2.5: Adding template system', 'info');

        return {
            ...data,
            templates: data.templates || [],
            templateLibrary: data.templateLibrary || {
                categories: ['Project Management', 'Personal', 'Business', 'Education'],
                featured: [],
                taskSets: {},
                checklists: {},
                noteTemplates: {}
            },
            nextTemplateId: data.nextTemplateId || 1,
            nextTemplateLibraryId: data.nextTemplateLibraryId || 1,
            version: '2.5'
        };
    }

    /**
     * Migrate from v2.5 to v3.0 (add weekly planning)
     */
    migrateFromV2_5(data) {
        this.log('Migrating v2.5 → v3.0: Adding weekly planning system', 'info');

        return {
            ...data,
            weeklyPlans: data.weeklyPlans || {},
            nextWeeklyItemId: data.nextWeeklyItemId || 1,
            version: '3.0'
        };
    }

    /**
     * Migrate from v3.0 to v4.0 (add entity relationships)
     */
    migrateFromV3(data) {
        this.log('Migrating v3.0 → v4.0: Adding entity relationships', 'info');

        return {
            ...data,
            relationships: data.relationships || {
                entityTasks: {},
                cardToWeeklyPlans: {},
                weeklyPlanToCards: {},
                entityTags: {},
                collectionEntities: {},
                templateUsage: {}
            },
            collections: data.collections || {},
            tags: data.tags || {},
            nextCollectionId: data.nextCollectionId || 1,
            nextTagId: data.nextTagId || 1,
            version: '4.0'
        };
    }

    /**
     * Migrate from v4.0 to v5.0 (unified entity system)
     */
    migrateFromV4(data) {
        this.log('Migrating v4.0 → v5.0: Converting to unified entity system', 'info');

        const entities = {};
        let nextTaskId = 1;
        let nextNoteId = 1;
        let nextChecklistId = 1;
        let nextProjectId = 1;

        // Convert cards to entities
        if (data.boards) {
            for (const board of Object.values(data.boards)) {
                if (board.rows) {
                    for (const row of board.rows) {
                        if (row.cards) {
                            for (const [columnKey, cards] of Object.entries(row.cards)) {
                                for (let i = 0; i < cards.length; i++) {
                                    const card = cards[i];
                                    if (typeof card === 'object' && card.id) {
                                        // Convert card to entity
                                        const entityId = `task_${nextTaskId++}`;
                                        entities[entityId] = {
                                            id: entityId,
                                            type: 'task',
                                            title: card.title || card.name || 'Untitled Task',
                                            content: card.description || card.content || '',
                                            completed: card.completed || false,
                                            priority: card.priority || 'medium',
                                            dueDate: card.dueDate || null,
                                            tags: card.tags || [],
                                            createdAt: card.createdAt || new Date().toISOString(),
                                            updatedAt: card.updatedAt || new Date().toISOString()
                                        };

                                        // Replace card reference with entity ID
                                        cards[i] = entityId;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return {
            ...data,
            entities,
            nextTaskId,
            nextNoteId,
            nextChecklistId,
            nextProjectId,
            version: '5.0'
        };
    }

    /**
     * Migrate from v5.0 to v6.0 (IndexedDB architecture preparation)
     */
    migrateFromV5(data) {
        this.log('Migrating v5.0 → v6.0: Preparing for IndexedDB architecture', 'info');

        return {
            ...data,
            exportedAt: new Date().toISOString(),
            exportedFrom: 'GridFlow Migration',
            exportFormat: 'indexeddb',
            version: '6.0'
        };
    }

    /**
     * Migrate from v6.0 to v7.0 (Dexie architecture)
     */
    migrateFromV6(data) {
        this.log('Migrating v6.0 → v7.0: Converting to Dexie architecture', 'info');

        // Ensure proper structure for Dexie
        const migratedData = {
            ...data,
            version: '7.0',
            exportedAt: new Date().toISOString(),
            exportedFrom: 'GridFlow Dexie Migration',
            exportFormat: 'dexie'
        };

        // Ensure entities exist
        if (!migratedData.entities) {
            migratedData.entities = {};
        }

        // Ensure other required structures exist
        if (!migratedData.people) {
            migratedData.people = [];
        }

        if (!migratedData.entityPositions) {
            migratedData.entityPositions = [];
        }

        if (!migratedData.settings) {
            migratedData.settings = [];
        }

        return migratedData;
    }

    /**
     * Validate and prepare data structure for Dexie
     */
    validateAndPrepareForDexie(data) {
        this.log('Validating and preparing data for Dexie storage', 'info');

        // Ensure all required top-level properties exist
        const validatedData = {
            version: '7.0',
            currentBoardId: data.currentBoardId || 'default',
            boards: data.boards || {},
            entities: data.entities || {},
            weeklyPlans: data.weeklyPlans || {},
            people: data.people || [],
            templates: data.templates || [],
            tags: data.tags || [],
            collections: data.collections || [],
            settings: data.settings || [],
            entityPositions: data.entityPositions || [],
            relationships: data.relationships || {},
            exportedAt: new Date().toISOString(),
            exportedFrom: 'GridFlow Migration Validator',
            exportFormat: 'dexie'
        };

        // Validate entities structure
        if (typeof validatedData.entities === 'object') {
            for (const [entityId, entity] of Object.entries(validatedData.entities)) {
                if (!entity.id) entity.id = entityId;
                if (!entity.type) entity.type = 'task';
                if (!entity.title) entity.title = 'Untitled';
                if (!entity.createdAt) entity.createdAt = new Date().toISOString();
                if (!entity.updatedAt) entity.updatedAt = new Date().toISOString();
            }
        }

        // Validate boards structure
        if (typeof validatedData.boards === 'object') {
            for (const [boardId, board] of Object.entries(validatedData.boards)) {
                if (!board.id) board.id = boardId;
                if (!board.name) board.name = 'Untitled Board';
                if (!board.groups) board.groups = [];
                if (!board.rows) board.rows = [];
                if (!board.columns) board.columns = [
                    { id: 1, name: 'To Do', key: 'todo' },
                    { id: 2, name: 'In Progress', key: 'inprogress' },
                    { id: 3, name: 'Done', key: 'done' }
                ];
                if (!board.createdAt) board.createdAt = new Date().toISOString();
            }
        }

        this.log(`Validation complete: ${Object.keys(validatedData.entities).length} entities, ${Object.keys(validatedData.boards).length} boards`, 'success');

        return validatedData;
    }

    /**
     * Import migrated data into Dexie database
     * @param {Object} migratedData - Data ready for Dexie
     * @returns {Object} Import statistics
     */
    async importToDexie(migratedData) {
        this.log('Starting Dexie database import...', 'info');

        const stats = {
            entities: 0,
            boards: 0,
            people: 0,
            templates: 0,
            tags: 0,
            collections: 0,
            settings: 0,
            entityPositions: 0,
            weeklyPlans: 0
        };

        try {
            // Use transaction for atomic import
            await db.transaction('rw', [
                db.entities,
                db.boards,
                db.people,
                db.templates,
                db.tags,
                db.collections,
                db.settings,
                db.entityPositions,
                db.weeklyPlans
            ], async () => {
                // Import entities
                if (migratedData.entities && Object.keys(migratedData.entities).length > 0) {
                    const entities = Object.values(migratedData.entities);
                    await entityService.bulkSave(entities);
                    stats.entities = entities.length;
                    this.log(`Imported ${entities.length} entities`, 'success');
                }

                // Import boards
                if (migratedData.boards && Object.keys(migratedData.boards).length > 0) {
                    const boards = Object.values(migratedData.boards);
                    await db.boards.bulkPut(boards);
                    stats.boards = boards.length;
                    this.log(`Imported ${boards.length} boards`, 'success');
                }

                // Import people
                if (migratedData.people && migratedData.people.length > 0) {
                    await db.people.bulkPut(migratedData.people);
                    stats.people = migratedData.people.length;
                    this.log(`Imported ${migratedData.people.length} people`, 'success');
                }

                // Import templates
                if (migratedData.templates && migratedData.templates.length > 0) {
                    await db.templates.bulkPut(migratedData.templates);
                    stats.templates = migratedData.templates.length;
                    this.log(`Imported ${migratedData.templates.length} templates`, 'success');
                }

                // Import tags
                if (migratedData.tags && migratedData.tags.length > 0) {
                    await db.tags.bulkPut(migratedData.tags);
                    stats.tags = migratedData.tags.length;
                    this.log(`Imported ${migratedData.tags.length} tags`, 'success');
                }

                // Import collections
                if (migratedData.collections && migratedData.collections.length > 0) {
                    await db.collections.bulkPut(migratedData.collections);
                    stats.collections = migratedData.collections.length;
                    this.log(`Imported ${migratedData.collections.length} collections`, 'success');
                }

                // Import settings
                if (migratedData.settings && migratedData.settings.length > 0) {
                    await db.settings.bulkPut(migratedData.settings);
                    stats.settings = migratedData.settings.length;
                    this.log(`Imported ${migratedData.settings.length} settings`, 'success');
                }

                // Import entity positions
                if (migratedData.entityPositions && migratedData.entityPositions.length > 0) {
                    await db.entityPositions.bulkPut(migratedData.entityPositions);
                    stats.entityPositions = migratedData.entityPositions.length;
                    this.log(`Imported ${migratedData.entityPositions.length} entity positions`, 'success');
                }

                // Import weekly plans
                if (migratedData.weeklyPlans && Object.keys(migratedData.weeklyPlans).length > 0) {
                    const weeklyPlans = Object.values(migratedData.weeklyPlans);
                    await db.weeklyPlans.bulkPut(weeklyPlans);
                    stats.weeklyPlans = weeklyPlans.length;
                    this.log(`Imported ${weeklyPlans.length} weekly plans`, 'success');
                }
            });

            this.log('Dexie import completed successfully', 'success');
            return stats;

        } catch (error) {
            this.log(`Dexie import failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Create sample legacy data for testing
     * @param {string} version - Target version to create
     * @returns {Object} Sample data in specified version format
     */
    createSampleLegacyData(version = '1.0') {
        switch (version) {
            case '1.0':
                return {
                    groups: [
                        { id: 1, name: 'General', color: '#3b82f6', collapsed: false }
                    ],
                    rows: [
                        {
                            id: 1,
                            name: 'Sample Project',
                            description: 'A sample project for testing migration',
                            groupId: 1,
                            cards: {
                                todo: [
                                    {
                                        id: 1,
                                        title: 'Plan project structure',
                                        description: 'Define the overall architecture',
                                        priority: 'high',
                                        completed: false,
                                        tags: ['planning']
                                    }
                                ],
                                inprogress: [],
                                done: []
                            }
                        }
                    ],
                    columns: [
                        { id: 1, name: 'To Do', key: 'todo' },
                        { id: 2, name: 'In Progress', key: 'inprogress' },
                        { id: 3, name: 'Done', key: 'done' }
                    ],
                    nextRowId: 2,
                    nextCardId: 2,
                    nextColumnId: 4,
                    nextGroupId: 2
                };

            case '2.0':
                const v1Data = this.createSampleLegacyData('1.0');
                return {
                    currentBoardId: 'default',
                    boards: {
                        default: {
                            id: 'default',
                            name: 'Main Board',
                            ...v1Data,
                            createdAt: new Date().toISOString()
                        }
                    },
                    version: '2.0'
                };

            case '5.0':
                return {
                    currentBoardId: 'default',
                    boards: {
                        default: {
                            id: 'default',
                            name: 'Main Board',
                            groups: [{ id: 1, name: 'General', color: '#3b82f6', collapsed: false }],
                            rows: [{
                                id: 1,
                                name: 'Sample Project',
                                description: 'A sample project for testing migration',
                                groupId: 1,
                                cards: {
                                    todo: ['task_1'],
                                    inprogress: [],
                                    done: []
                                }
                            }],
                            columns: [
                                { id: 1, name: 'To Do', key: 'todo' },
                                { id: 2, name: 'In Progress', key: 'inprogress' },
                                { id: 3, name: 'Done', key: 'done' }
                            ]
                        }
                    },
                    entities: {
                        task_1: {
                            id: 'task_1',
                            type: 'task',
                            title: 'Plan project structure',
                            content: 'Define the overall architecture',
                            completed: false,
                            priority: 'high',
                            tags: ['planning'],
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        }
                    },
                    version: '5.0'
                };

            default:
                return this.createSampleLegacyData('1.0');
        }
    }

    /**
     * Log migration messages
     */
    log(message, level = 'info') {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message
        };
        
        this.migrationLog.push(logEntry);
        
        const emoji = level === 'error' ? '❌' : level === 'success' ? '✅' : level === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${emoji} [Migration] ${message}`);
    }

    /**
     * Get migration log
     */
    getMigrationLog() {
        return this.migrationLog;
    }

    /**
     * Clear migration log
     */
    clearLog() {
        this.migrationLog = [];
    }
}

// Create singleton instance
export const dataMigrator = new DataMigrator();

// Make available globally for testing
if (typeof window !== 'undefined') {
    window.dataMigrator = dataMigrator;
}