/**
 * GridFlow - Data Validation Utilities
 * Ensures data integrity during migration and import processes
 */

/**
 * Comprehensive data validator for GridFlow
 */
export class DataValidator {
    constructor() {
        this.validationLog = [];
        this.entityTypes = ['task', 'note', 'checklist', 'project', 'person'];
        this.requiredEntityFields = ['id', 'type', 'title', 'createdAt'];
        this.requiredBoardFields = ['id', 'name', 'groups', 'rows', 'columns'];
    }

    /**
     * Validate complete data structure for Dexie
     * @param {Object} data - Data to validate
     * @returns {Object} Validation result with errors and warnings
     */
    validateData(data) {
        this.clearLog();
        this.log('Starting comprehensive data validation...', 'info');

        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            stats: {},
            fixes: []
        };

        try {
            // Validate top-level structure
            this.validateTopLevelStructure(data, result);

            // Validate entities
            this.validateEntities(data.entities || {}, result);

            // Validate boards
            this.validateBoards(data.boards || {}, result);

            // Validate people
            this.validatePeople(data.people || [], result);

            // Validate templates
            this.validateTemplates(data.templates || [], result);

            // Validate tags
            this.validateTags(data.tags || [], result);

            // Validate collections
            this.validateCollections(data.collections || [], result);

            // Validate relationships
            this.validateRelationships(data, result);

            // Generate statistics
            this.generateStats(data, result);

            // Apply auto-fixes for common issues
            this.applyAutoFixes(data, result);

            result.isValid = result.errors.length === 0;

            if (result.isValid) {
                this.log('✅ Data validation completed successfully', 'success');
            } else {
                this.log(`❌ Data validation failed with ${result.errors.length} errors`, 'error');
            }

        } catch (error) {
            result.isValid = false;
            result.errors.push(`Validation process failed: ${error.message}`);
            this.log(`Validation error: ${error.message}`, 'error');
        }

        return result;
    }

    /**
     * Validate top-level data structure
     */
    validateTopLevelStructure(data, result) {
        const requiredFields = ['version', 'currentBoardId', 'boards'];
        
        for (const field of requiredFields) {
            if (!data.hasOwnProperty(field)) {
                result.errors.push(`Missing required field: ${field}`);
            }
        }

        // Validate version
        if (data.version && !this.isValidVersion(data.version)) {
            result.warnings.push(`Unknown version: ${data.version}`);
        }

        // Validate currentBoardId exists in boards
        if (data.currentBoardId && data.boards && !data.boards[data.currentBoardId]) {
            result.errors.push(`Current board ID '${data.currentBoardId}' not found in boards`);
        }
    }

    /**
     * Validate entities structure
     */
    validateEntities(entities, result) {
        if (typeof entities !== 'object') {
            result.errors.push('Entities must be an object');
            return;
        }

        let validEntities = 0;
        for (const [entityId, entity] of Object.entries(entities)) {
            const entityResult = this.validateEntity(entityId, entity);
            
            if (entityResult.isValid) {
                validEntities++;
            } else {
                result.errors.push(...entityResult.errors.map(err => `Entity ${entityId}: ${err}`));
                result.warnings.push(...entityResult.warnings.map(warn => `Entity ${entityId}: ${warn}`));
            }
        }

        this.log(`Validated ${validEntities}/${Object.keys(entities).length} entities`, 'info');
    }

    /**
     * Validate single entity
     */
    validateEntity(entityId, entity) {
        const result = { isValid: true, errors: [], warnings: [] };

        // Check required fields
        for (const field of this.requiredEntityFields) {
            if (!entity.hasOwnProperty(field)) {
                result.errors.push(`Missing required field: ${field}`);
            }
        }

        // Validate entity ID consistency
        if (entity.id && entity.id !== entityId) {
            result.warnings.push(`Entity ID mismatch: key=${entityId}, entity.id=${entity.id}`);
        }

        // Validate entity type
        if (entity.type && !this.entityTypes.includes(entity.type)) {
            result.warnings.push(`Unknown entity type: ${entity.type}`);
        }

        // Validate dates
        if (entity.createdAt && !this.isValidDate(entity.createdAt)) {
            result.errors.push(`Invalid createdAt date: ${entity.createdAt}`);
        }

        if (entity.updatedAt && !this.isValidDate(entity.updatedAt)) {
            result.errors.push(`Invalid updatedAt date: ${entity.updatedAt}`);
        }

        // Validate priority
        if (entity.priority && !['low', 'medium', 'high', 'urgent'].includes(entity.priority)) {
            result.warnings.push(`Unknown priority level: ${entity.priority}`);
        }

        // Validate tags (should be array)
        if (entity.tags && !Array.isArray(entity.tags)) {
            result.errors.push('Tags must be an array');
        }

        result.isValid = result.errors.length === 0;
        return result;
    }

    /**
     * Validate boards structure
     */
    validateBoards(boards, result) {
        if (typeof boards !== 'object') {
            result.errors.push('Boards must be an object');
            return;
        }

        let validBoards = 0;
        for (const [boardId, board] of Object.entries(boards)) {
            const boardResult = this.validateBoard(boardId, board);
            
            if (boardResult.isValid) {
                validBoards++;
            } else {
                result.errors.push(...boardResult.errors.map(err => `Board ${boardId}: ${err}`));
                result.warnings.push(...boardResult.warnings.map(warn => `Board ${boardId}: ${warn}`));
            }
        }

        this.log(`Validated ${validBoards}/${Object.keys(boards).length} boards`, 'info');
    }

    /**
     * Validate single board
     */
    validateBoard(boardId, board) {
        const result = { isValid: true, errors: [], warnings: [] };

        // Check required fields
        for (const field of this.requiredBoardFields) {
            if (!board.hasOwnProperty(field)) {
                result.errors.push(`Missing required field: ${field}`);
            }
        }

        // Validate board ID consistency
        if (board.id && board.id !== boardId) {
            result.warnings.push(`Board ID mismatch: key=${boardId}, board.id=${board.id}`);
        }

        // Validate groups
        if (board.groups && !Array.isArray(board.groups)) {
            result.errors.push('Groups must be an array');
        }

        // Validate rows
        if (board.rows && !Array.isArray(board.rows)) {
            result.errors.push('Rows must be an array');
        }

        // Validate columns
        if (board.columns && !Array.isArray(board.columns)) {
            result.errors.push('Columns must be an array');
        }

        // Validate row-group relationships
        if (board.groups && board.rows) {
            const groupIds = new Set(board.groups.map(g => g.id));
            for (const row of board.rows) {
                if (row.groupId && !groupIds.has(row.groupId)) {
                    result.warnings.push(`Row ${row.id} references non-existent group ${row.groupId}`);
                }
            }
        }

        result.isValid = result.errors.length === 0;
        return result;
    }

    /**
     * Validate people array
     */
    validatePeople(people, result) {
        if (!Array.isArray(people)) {
            result.errors.push('People must be an array');
            return;
        }

        let validPeople = 0;
        for (const person of people) {
            if (person.id && person.name) {
                validPeople++;
            } else {
                result.warnings.push(`Person missing required fields: ${JSON.stringify(person)}`);
            }
        }

        this.log(`Validated ${validPeople}/${people.length} people`, 'info');
    }

    /**
     * Validate templates array
     */
    validateTemplates(templates, result) {
        if (!Array.isArray(templates)) {
            result.errors.push('Templates must be an array');
            return;
        }

        let validTemplates = 0;
        for (const template of templates) {
            if (template.id && template.name) {
                validTemplates++;
            } else {
                result.warnings.push(`Template missing required fields: ${JSON.stringify(template)}`);
            }
        }

        this.log(`Validated ${validTemplates}/${templates.length} templates`, 'info');
    }

    /**
     * Validate tags array
     */
    validateTags(tags, result) {
        if (!Array.isArray(tags)) {
            result.errors.push('Tags must be an array');
            return;
        }

        let validTags = 0;
        for (const tag of tags) {
            if (tag.id && tag.name) {
                validTags++;
            } else {
                result.warnings.push(`Tag missing required fields: ${JSON.stringify(tag)}`);
            }
        }

        this.log(`Validated ${validTags}/${tags.length} tags`, 'info');
    }

    /**
     * Validate collections array
     */
    validateCollections(collections, result) {
        if (!Array.isArray(collections)) {
            result.errors.push('Collections must be an array');
            return;
        }

        let validCollections = 0;
        for (const collection of collections) {
            if (collection.id && collection.name) {
                validCollections++;
            } else {
                result.warnings.push(`Collection missing required fields: ${JSON.stringify(collection)}`);
            }
        }

        this.log(`Validated ${validCollections}/${collections.length} collections`, 'info');
    }

    /**
     * Validate entity relationships and references
     */
    validateRelationships(data, result) {
        const entities = data.entities || {};
        const boards = data.boards || {};
        let invalidReferences = 0;

        // Check entity references in board cards
        for (const [boardId, board] of Object.entries(boards)) {
            if (!board.rows) continue;

            for (const row of board.rows) {
                if (!row.cards) continue;

                for (const [columnKey, cards] of Object.entries(row.cards)) {
                    if (!Array.isArray(cards)) continue;

                    for (const entityId of cards) {
                        if (typeof entityId === 'string' && !entities[entityId]) {
                            result.warnings.push(`Board ${boardId} references non-existent entity: ${entityId}`);
                            invalidReferences++;
                        }
                    }
                }
            }
        }

        if (invalidReferences > 0) {
            this.log(`Found ${invalidReferences} invalid entity references`, 'warning');
        }
    }

    /**
     * Generate validation statistics
     */
    generateStats(data, result) {
        result.stats = {
            entities: Object.keys(data.entities || {}).length,
            boards: Object.keys(data.boards || {}).length,
            people: (data.people || []).length,
            templates: (data.templates || []).length,
            tags: (data.tags || []).length,
            collections: (data.collections || []).length,
            entityPositions: (data.entityPositions || []).length,
            weeklyPlans: Object.keys(data.weeklyPlans || {}).length,
            settings: (data.settings || []).length
        };

        this.log(`Data statistics: ${JSON.stringify(result.stats)}`, 'info');
    }

    /**
     * Apply automatic fixes for common issues
     */
    applyAutoFixes(data, result) {
        let fixesApplied = 0;

        // Fix missing entity fields
        if (data.entities) {
            for (const [entityId, entity] of Object.entries(data.entities)) {
                if (!entity.id) {
                    entity.id = entityId;
                    fixesApplied++;
                    result.fixes.push(`Added missing ID to entity ${entityId}`);
                }

                if (!entity.type) {
                    entity.type = 'task';
                    fixesApplied++;
                    result.fixes.push(`Set default type 'task' for entity ${entityId}`);
                }

                if (!entity.title) {
                    entity.title = 'Untitled';
                    fixesApplied++;
                    result.fixes.push(`Set default title for entity ${entityId}`);
                }

                if (!entity.createdAt) {
                    entity.createdAt = new Date().toISOString();
                    fixesApplied++;
                    result.fixes.push(`Set default createdAt for entity ${entityId}`);
                }

                if (!entity.updatedAt) {
                    entity.updatedAt = entity.createdAt || new Date().toISOString();
                    fixesApplied++;
                    result.fixes.push(`Set default updatedAt for entity ${entityId}`);
                }
            }
        }

        // Fix missing board fields
        if (data.boards) {
            for (const [boardId, board] of Object.entries(data.boards)) {
                if (!board.id) {
                    board.id = boardId;
                    fixesApplied++;
                    result.fixes.push(`Added missing ID to board ${boardId}`);
                }

                if (!board.groups) {
                    board.groups = [];
                    fixesApplied++;
                    result.fixes.push(`Added empty groups array to board ${boardId}`);
                }

                if (!board.rows) {
                    board.rows = [];
                    fixesApplied++;
                    result.fixes.push(`Added empty rows array to board ${boardId}`);
                }

                if (!board.columns) {
                    board.columns = [
                        { id: 1, name: 'To Do', key: 'todo' },
                        { id: 2, name: 'In Progress', key: 'inprogress' },
                        { id: 3, name: 'Done', key: 'done' }
                    ];
                    fixesApplied++;
                    result.fixes.push(`Added default columns to board ${boardId}`);
                }
            }
        }

        if (fixesApplied > 0) {
            this.log(`Applied ${fixesApplied} automatic fixes`, 'success');
        }
    }

    /**
     * Utility: Check if version is valid
     */
    isValidVersion(version) {
        const validVersions = ['1.0', '2.0', '2.5', '3.0', '4.0', '5.0', '6.0', '7.0'];
        return validVersions.includes(version);
    }

    /**
     * Utility: Check if date string is valid
     */
    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    /**
     * Create a data integrity report
     */
    createIntegrityReport(data) {
        const validation = this.validateData(data);
        
        const report = {
            timestamp: new Date().toISOString(),
            dataVersion: data.version || 'unknown',
            validation: validation,
            recommendations: this.generateRecommendations(validation),
            summary: {
                totalErrors: validation.errors.length,
                totalWarnings: validation.warnings.length,
                totalFixes: validation.fixes.length,
                isHealthy: validation.isValid && validation.warnings.length < 10
            }
        };

        return report;
    }

    /**
     * Generate recommendations based on validation results
     */
    generateRecommendations(validation) {
        const recommendations = [];

        if (validation.errors.length > 0) {
            recommendations.push('Fix critical errors before importing data');
        }

        if (validation.warnings.length > 10) {
            recommendations.push('Consider cleaning up data to resolve warnings');
        }

        if (validation.stats.entities > 1000) {
            recommendations.push('Large dataset detected - consider incremental import');
        }

        if (validation.fixes.length > 0) {
            recommendations.push('Review automatically applied fixes');
        }

        return recommendations;
    }

    /**
     * Log validation messages
     */
    log(message, level = 'info') {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message
        };
        
        this.validationLog.push(logEntry);
        
        const emoji = level === 'error' ? '❌' : level === 'success' ? '✅' : level === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${emoji} [Validator] ${message}`);
    }

    /**
     * Get validation log
     */
    getValidationLog() {
        return this.validationLog;
    }

    /**
     * Clear validation log
     */
    clearLog() {
        this.validationLog = [];
    }
}

// Create singleton instance
export const dataValidator = new DataValidator();

// Make available globally for testing
if (typeof window !== 'undefined') {
    window.dataValidator = dataValidator;
}