/**
 * GridFlow - Import/Export Module
 * Handles all import/export functionality including PDF, PNG, Excel, and JSON formats
 */

import { showStatusMessage } from './utilities.js';
import { saveData, appData, boardData, setAppData } from './core-data.js';
import { db } from './db.js';
import { entityService } from './entity-service.js';
import { boardService } from './board-service.js';
import { metaService } from './meta-service.js';
import { dataMigrator } from './migration-strategy.js';
import { dataValidator } from './data-validator.js';

/**
 * Detect data version for imported data
 * @param {Object} data - Data to detect version for
 * @returns {string} Version string
 */
function detectVersion(data) {
    if (data.version) return data.version;
    
    // Version detection based on structure
    if (data.rows && !data.boards) {
        return '1.0'; // Original single-board format
    } else if (data.boards && !data.templates) {
        return '2.0'; // Multi-board format without templates
    } else if (data.boards && data.templates && !data.weeklyPlans) {
        return '2.5'; // Has templates but no weekly planning
    } else if (data.boards && data.templates && data.weeklyPlans && !data.entities) {
        return '3.0'; // Has weekly planning but no entities
    } else if (data.boards && data.templates && data.weeklyPlans && data.entities) {
        return '4.0'; // Has entities but structured entities
    } else if (data.entities && Object.values(data.entities)[0]?.type) {
        return '5.0'; // Flat entity structure
    }
    
    return '6.0'; // Current IndexedDB-only version
}

/**
 * Simple migration for IndexedDB-only architecture
 * @param {Object} data - Data to migrate
 * @returns {Object} Migrated data
 */
async function migrateData(data) {
    console.log('🔄 Migrating imported data to Dexie architecture...');
    
    // Use comprehensive migration strategy
    const migratedData = await dataMigrator.migrateData(data);
    
    return migratedData;
}

/**
 * Create entity position records from board data structure
 * This converts localStorage format (entities in board.rows.cards) to IndexedDB positions
 */
async function createEntityPositionsFromBoardData() {
    try {
        console.log('🔄 Creating entity position records from board data...');
        
        const positions = [];
        let positionCount = 0;
        
        // Clear existing positions to avoid duplicates
        await db.entityPositions.clear();
        
        // Process each board
        for (const [boardId, board] of Object.entries(appData.boards)) {
            if (!board.rows) continue;
            
            // Process each row
            for (const row of board.rows) {
                if (!row.cards) continue;
                
                // Process each column in the row
                for (const [columnKey, cardList] of Object.entries(row.cards)) {
                    if (!Array.isArray(cardList)) continue;
                    
                    // Create position record for each entity
                    cardList.forEach((entityId, index) => {
                        if (typeof entityId === 'string' && entityId.includes('_')) {
                            positions.push({
                                id: `${boardId}_${row.id}_${columnKey}_${entityId}`, // Generate unique ID
                                entityId: entityId,
                                boardId: boardId,
                                context: 'board',
                                rowId: row.id.toString(),
                                columnKey: columnKey,
                                order: index
                            });
                            positionCount++;
                        }
                    });
                }
            }
        }
        
        // Batch create all positions
        if (positions.length > 0) {
            // Update order for all entities in batch
            for (const [boardId, board] of Object.entries(appData.boards)) {
                if (!board.rows) continue;
                for (const boardRow of board.rows) {
                    for (const [columnKey, entities] of Object.entries(boardRow.cards || {})) {
                        if (Array.isArray(entities)) {
                            for (let i = 0; i < entities.length; i++) {
                                const entityId = entities[i];
                                if (typeof entityId === 'string' && entityId.includes('_')) {
                                    await entityService.setPosition(entityId, boardId, 'board', boardRow.id, columnKey, i);
                                }
                            }
                        }
                    }
                }
            }
            console.log(`✅ Created ${positionCount} entity position records`);
            addMigrationLog(`Created ${positionCount} entity position records`, 'success');
        } else {
            console.log('ℹ️ No entity positions to create');
            addMigrationLog('No entity positions found in imported data', 'info');
        }
        
    } catch (error) {
        console.error('Failed to create entity positions:', error);
        addMigrationLog(`Entity position creation failed: ${error.message}`, 'warning');
        // Don't throw - this is not critical for import success
    }
}

/**
 * Generate a unique board ID when merging data
 * @param {string} originalId - The original board ID
 * @returns {string} - A unique board ID
 */
function generateUniqueBoardId(originalId) {
    let counter = 1;
    let newId = `${originalId}_imported`;
    
    while (appData.boards[newId]) {
        newId = `${originalId}_imported_${counter}`;
        counter++;
    }
    
    return newId;
}

/**
 * Update ID counters to prevent conflicts after merging data
 */
function updateIdCounters() {
    // Update template ID counter
    if (appData.templates && appData.templates.length > 0) {
        const maxTemplateId = Math.max(...appData.templates.map(t => 
            parseInt(t.id.toString().replace(/\D/g, '')) || 0
        ));
        appData.nextTemplateId = Math.max(appData.nextTemplateId, maxTemplateId + 1);
    }
    
    // Update weekly item ID counter
    let maxWeeklyItemId = 0;
    if (appData.weeklyPlans) {
        Object.values(appData.weeklyPlans).forEach(plan => {
            if (plan.items) {
                plan.items.forEach(item => {
                    const itemIdNum = parseInt(item.id.toString().replace(/\D/g, '')) || 0;
                    if (itemIdNum > maxWeeklyItemId) maxWeeklyItemId = itemIdNum;
                });
            }
        });
    }
    appData.nextWeeklyItemId = Math.max(appData.nextWeeklyItemId, maxWeeklyItemId + 1);
    
    // Update board-specific counters
    Object.values(appData.boards).forEach(board => {
        if (board.rows && board.rows.length > 0) {
            const maxRowId = Math.max(...board.rows.map(r => r.id || 0));
            board.nextRowId = Math.max(board.nextRowId || 1, maxRowId + 1);
        }
        
        if (board.columns && board.columns.length > 0) {
            const maxColumnId = Math.max(...board.columns.map(c => c.id || 0));
            board.nextColumnId = Math.max(board.nextColumnId || 1, maxColumnId + 1);
        }
        
        if (board.groups && board.groups.length > 0) {
            const maxGroupId = Math.max(...board.groups.map(g => g.id || 0));
            board.nextGroupId = Math.max(board.nextGroupId || 1, maxGroupId + 1);
        }
        
        let maxCardId = 0;
        if (board.rows) {
            board.rows.forEach(row => {
                Object.values(row.cards || {}).forEach(cards => {
                    cards.forEach(card => {
                        if (card.id > maxCardId) maxCardId = card.id;
                    });
                });
            });
        }
        board.nextCardId = Math.max(board.nextCardId || 1, maxCardId + 1);
    });
}

/**
 * Show data management modal
 */
export function showDataManagementModal() {
    console.log('showDataManagementModal called - redirecting to settings view');
    
    // Switch to settings view instead of showing modal
    if (window.switchToView) {
        window.switchToView('settings');
    }
}

/**
 * Close data management modal
 */
export function closeDataManagementModal() {
    console.log('closeDataManagementModal called - switching back to board view');
    
    // Switch back to board view instead of closing modal
    if (window.switchToView) {
        window.switchToView('board');
    }
}

/**
 * Show export modal (legacy compatibility)
 */
export function showExportModal() {
    showDataManagementModal();
}

/**
 * Close export modal (legacy compatibility)
 */
export function closeExportModal() {
    closeDataManagementModal();
}

/**
 * Export board to PDF format
 */
export async function exportToPDF() {
    try {
        showStatusMessage('Generating PDF...', 'info');
        const { jsPDF } = window.jspdf;
        
        const boardContainer = document.querySelector('.board-container');
        const canvas = await html2canvas(boardContainer, {
            scale: 2,
            useCORS: true,
            allowTaint: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4');
        const imgWidth = 297;
        const pageHeight = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        pdf.save('gridflow-board.pdf');
        showStatusMessage('PDF exported successfully!', 'success');
    } catch (error) {
        console.error('PDF export failed:', error);
        showStatusMessage('PDF export failed', 'error');
    }
}

/**
 * Export board to PNG format
 */
export async function exportToPNG() {
    try {
        showStatusMessage('Generating PNG...', 'info');
        const boardContainer = document.querySelector('.board-container');
        const canvas = await html2canvas(boardContainer, {
            scale: 2,
            useCORS: true,
            allowTaint: true
        });
        
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'gridflow-board.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showStatusMessage('PNG exported successfully!', 'success');
        });
    } catch (error) {
        console.error('PNG export failed:', error);
        showStatusMessage('PNG export failed', 'error');
    }
}

/**
 * Export board to Excel format
 */
export function exportToExcel() {
    try {
        showStatusMessage('Generating Excel file...', 'info');
        const wb = XLSX.utils.book_new();
        
        // Create worksheet data with groups
        const wsData = [['Group', 'Project', ...boardData.columns.map(col => col.name)]];
        
        // Add ungrouped rows first
        const ungroupedRows = boardData.rows.filter(row => !row.groupId);
        ungroupedRows.forEach(row => {
            const maxCards = Math.max(...boardData.columns.map(col => (row.cards[col.key] || []).length));
            
            for (let i = 0; i < Math.max(1, maxCards); i++) {
                const rowData = [
                    i === 0 ? '(No Group)' : '',
                    i === 0 ? row.name : ''
                ];
                
                boardData.columns.forEach(col => {
                    const cards = row.cards[col.key] || [];
                    const card = cards[i];
                    if (card) {
                        const status = card.completed ? ' ✓' : '';
                        rowData.push(`${card.title}${status}\n${card.description}`);
                    } else {
                        rowData.push('');
                    }
                });
                
                wsData.push(rowData);
            }
        });
        
        // Add grouped rows
        boardData.groups.forEach(group => {
            const groupRows = boardData.rows.filter(row => row.groupId === group.id);
            
            groupRows.forEach(row => {
                const maxCards = Math.max(...boardData.columns.map(col => (row.cards[col.key] || []).length));
                
                for (let i = 0; i < Math.max(1, maxCards); i++) {
                    const rowData = [
                        i === 0 ? group.name : '',
                        i === 0 ? row.name : ''
                    ];
                    
                    boardData.columns.forEach(col => {
                        const cards = row.cards[col.key] || [];
                        const card = cards[i];
                        if (card) {
                            const status = card.completed ? ' ✓' : '';
                            rowData.push(`${card.title}${status}\n${card.description}`);
                        } else {
                            rowData.push('');
                        }
                    });
                    
                    wsData.push(rowData);
                }
            });
            
            // Add empty row between groups
            wsData.push([]);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Set column widths
        ws['!cols'] = [
            { width: 15 }, // Group column
            { width: 25 }, // Project column
            ...boardData.columns.map(() => ({ width: 30 }))
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, 'GridFlow Board');
        XLSX.writeFile(wb, 'gridflow-board.xlsx');
        showStatusMessage('Excel file exported successfully!', 'success');
    } catch (error) {
        console.error('Excel export failed:', error);
        showStatusMessage('Excel export failed', 'error');
    }
}

/**
 * Export application data to JSON format
 */
export async function exportToJSON() {
    try {
        console.log('🔄 Starting IndexedDB export...');
        
        // Export all data from IndexedDB
        const [
            entities,
            boards,
            entityPositions,
            weeklyPlans,
            people,
            templates,
            tags,
            collections,
            settings
        ] = await Promise.all([
            entityService.getAll(),
            boardService.getAll(),
            db.entityPositions.toArray(),
            db.weeklyPlans.toArray(),
            metaService.getAllPeople(),
            metaService.getAllTemplates(),
            metaService.getAllTags(),
            metaService.getAllCollections(),
            metaService.getAllSettings()
        ]);
        
        console.log('📊 Export data gathered:', {
            entities: entities.length,
            boards: boards.length,
            positions: entityPositions.length,
            weeklyPlans: weeklyPlans.length,
            people: people.length,
            templates: templates.length,
            tags: tags.length,
            collections: collections.length
        });
        
        // Convert arrays to objects for compatibility
        const boardsObj = {};
        boards.forEach(board => {
            boardsObj[board.id] = board;
        });
        
        const entitiesObj = {};
        entities.forEach(entity => {
            entitiesObj[entity.id] = entity;
        });
        
        const weeklyPlansObj = {};
        weeklyPlans.forEach(plan => {
            weeklyPlansObj[plan.weekKey] = plan;
        });
        
        // Create comprehensive export data
        const exportData = {
            // Core app data (localStorage compatible format)
            currentBoardId: appData.currentBoardId || 'default',
            version: '7.0', // Dexie architecture version
            boards: boardsObj,
            entities: entitiesObj,
            weeklyPlans: weeklyPlansObj,
            
            // Dexie-specific data
            entityPositions: entityPositions,
            people: people,
            templates: templates,
            tags: tags,
            collections: collections,
            settings: settings,
            
            // Metadata
            exportedAt: new Date().toISOString(),
            exportedFrom: 'GridFlow Dexie',
            exportFormat: 'dexie'
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        
        // Create filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const boardCount = boards.length;
        a.download = `gridflow-indexeddb-backup-${boardCount}boards-${timestamp}.json`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Store last export time in IndexedDB
        await metaService.setSetting('last_export_timestamp', new Date().toISOString(), 'import_export');
        
        showStatusMessage(`IndexedDB backup saved (${entities.length} entities, ${boards.length} boards)! Upload to your cloud storage to sync across devices.`, 'success');
    } catch (error) {
        console.error('IndexedDB export failed:', error);
        showStatusMessage('IndexedDB export failed: ' + error.message, 'error');
    }
    closeDataManagementModal();
}

/**
 * Import data from JSON file
 */
export function importFromJSON() {
    console.log('importFromJSON called');
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    console.log('File input found:', !!fileInput);
    console.log('File selected:', !!file, file ? file.name : 'none');
    
    if (!file) {
        showStatusMessage('Please select a JSON file first', 'error');
        return;
    }
    
    console.log('Closing data management modal and showing import progress modal');
    // Close data management modal and show progress modal
    closeDataManagementModal();
    showImportProgressModal();
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            await performImportWithProgress(e.target.result, file.name);
        } catch (error) {
            console.error('Import failed:', error);
            updateImportStep('parse', 'error', 'Failed');
            addMigrationLog(`Import failed: ${error.message}`, 'error');
        } finally {
            // Clear file input
            fileInput.value = '';
        }
    };
    reader.readAsText(file);
}

/**
 * Show the import progress modal
 */
export function showImportProgressModal() {
    const modal = document.getElementById('importProgressModal');
    if (modal) {
        modal.classList.add('modal-open');
        resetImportProgress();
    } else {
        console.error('Import progress modal not found!');
    }
}

/**
 * Close the import progress modal
 */
export function closeImportProgress() {
    const modal = document.getElementById('importProgressModal');
    if (modal) {
        modal.classList.remove('modal-open');
    }
}

/**
 * Refresh page after import
 */
export function refreshAfterImport() {
    window.location.reload();
}

/**
 * Reset import progress to initial state
 */
function resetImportProgress() {
    // Reset progress bar
    updateProgress(0, 'Analyzing file...');
    
    // Reset steps
    const steps = ['parse', 'validate', 'migrate', 'merge', 'save'];
    steps.forEach(step => {
        updateImportStep(step, 'pending', '');
    });
    
    // Reset stats
    updateImportStats({});
    
    // Clear migration log
    clearMigrationLog();
    
    // Hide actions and choice section
    const actions = document.getElementById('importActions');
    const choiceSection = document.getElementById('importChoiceSection');
    if (actions) actions.style.display = 'none';
    if (choiceSection) choiceSection.style.display = 'none';
}

/**
 * Update progress bar and label
 */
function updateProgress(percentage, label) {
    const progressFill = document.getElementById('importProgressFill');
    const progressLabel = document.querySelector('.progress-label');
    const progressPercentage = document.querySelector('.progress-percentage');
    
    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressLabel) progressLabel.textContent = label;
    if (progressPercentage) progressPercentage.textContent = `${Math.round(percentage)}%`;
}

/**
 * Update import step status
 */
function updateImportStep(stepId, status, statusText) {
    const step = document.getElementById(`step-${stepId}`);
    if (!step) return;
    
    // Remove existing status classes
    step.classList.remove('pending', 'active', 'completed', 'error');
    
    // Add new status class
    step.classList.add(status);
    
    // Update icon based on status
    const icon = step.querySelector('.step-icon');
    const statusEl = step.querySelector('.step-status');
    
    if (icon) {
        switch (status) {
            case 'active':
                icon.textContent = '⏳';
                break;
            case 'completed':
                icon.textContent = '✅';
                break;
            case 'error':
                icon.textContent = '❌';
                break;
            default:
                icon.textContent = '⏳';
        }
    }
    
    if (statusEl) {
        statusEl.textContent = statusText;
    }
}

/**
 * Update import statistics
 */
function updateImportStats(stats) {
    const elements = {
        'stat-boards': stats.boards || '-',
        'stat-cards': stats.cards || '-',
        'stat-templates': stats.templates || '-',
        'stat-weekly': stats.weeklyItems || '-',
        'stat-entities': stats.entities || '-'
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });
}

/**
 * Add entry to migration log
 */
function addMigrationLog(message, type = 'info') {
    const log = document.getElementById('migrationLog');
    if (!log) return;
    
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

/**
 * Clear migration log
 */
function clearMigrationLog() {
    const log = document.getElementById('migrationLog');
    if (log) log.innerHTML = '';
}

/**
 * Ensure appData is properly initialized for import
 */
function ensureAppDataInitialized() {
    if (!appData || typeof appData !== 'object') {
        console.log('Initializing appData for import...');
        setAppData({
            currentBoardId: 'default',
            boards: {},
            entities: {},
            templates: [],
            weeklyPlans: {},
            templateLibrary: {
                categories: ['Project Management', 'Personal', 'Business', 'Education'],
                featured: [],
                taskSets: {},
                checklists: {},
                noteTemplates: {}
            },
            collections: {},
            tags: {},
            relationships: {
                entityTasks: {},
                cardToWeeklyPlans: {},
                weeklyPlanToCards: {},
                entityTags: {},
                collectionEntities: {},
                templateUsage: {}
            },
            nextTemplateId: 1,
            nextTemplateLibraryId: 1,
            nextWeeklyItemId: 1,
            nextTaskId: 1,
            nextNoteId: 1,
            nextChecklistId: 1,
            nextProjectId: 1,
            nextCollectionId: 1,
            nextTagId: 1,
            version: '6.0'
        });
    } else if (!appData.boards) {
        // Ensure boards object exists
        appData.boards = {};
    }
}

/**
 * Perform import with progress updates
 */
async function performImportWithProgress(fileContent, fileName) {
    addMigrationLog(`Starting import of ${fileName}`);
    
    // Ensure appData is properly initialized
    ensureAppDataInitialized();
    
    // Dexie should already be initialized by app startup
    addMigrationLog('Using existing Dexie database connection...', 'info');
    
    // Reduced timeout since Dexie operations are faster
    const forceCompletion = setTimeout(() => {
        console.warn('Import taking too long, forcing completion...');
        updateProgress(100, 'Import completed (with timeout)');
        addMigrationLog('Import completed with forced timeout', 'warning');
        
        // Show completion actions
        const actions = document.getElementById('importActions');
        if (actions) actions.style.display = 'flex';
        
        showStatusMessage('Import may have completed with issues. Check the migration log for details.', 'warning');
    }, 30000); // 30 second timeout for Dexie operations
    
    // Step 1: Parse JSON
    updateProgress(10, 'Parsing JSON file...');
    updateImportStep('parse', 'active', 'Processing...');
    
    await delay(300); // Give UI time to update
    
    let importedData;
    try {
        importedData = JSON.parse(fileContent);
        updateImportStep('parse', 'completed', 'Complete');
        addMigrationLog('JSON parsing successful', 'success');
    } catch (error) {
        updateImportStep('parse', 'error', 'Failed');
        addMigrationLog(`JSON parsing failed: ${error.message}`, 'error');
        throw error;
    }
    
    // Step 2: Validate data structure
    updateProgress(25, 'Validating data structure...');
    updateImportStep('validate', 'active', 'Checking...');
    
    await delay(200);
    
    try {
        const stats = analyzeImportData(importedData);
        updateImportStats(stats);
        updateImportStep('validate', 'completed', 'Valid');
        addMigrationLog(`Data validation complete: ${stats.boards} boards, ${stats.cards} cards`, 'success');
    } catch (error) {
        updateImportStep('validate', 'error', 'Invalid');
        addMigrationLog(`Data validation failed: ${error.message}`, 'error');
        throw error;
    }
    
    // Step 3: Migrate data format
    updateProgress(50, 'Migrating data format...');
    updateImportStep('migrate', 'active', 'Converting...');
    
    await delay(300);
    
    let migratedData;
    try {
        const originalVersion = importedData.version || dataMigrator.detectVersion(importedData);
        migratedData = await migrateData(importedData);
        updateImportStep('migrate', 'completed', 'Migrated');
        addMigrationLog(`Migrated from version ${originalVersion} to ${migratedData.version}`, 'success');
        
        // Add migration log details
        const migrationLog = dataMigrator.getMigrationLog();
        migrationLog.forEach(entry => {
            addMigrationLog(entry.message, entry.level);
        });

        // Validate migrated data
        addMigrationLog('Validating migrated data...', 'info');
        const validation = dataValidator.validateData(migratedData);
        
        if (!validation.isValid) {
            addMigrationLog(`Validation failed with ${validation.errors.length} errors`, 'error');
            validation.errors.forEach(error => addMigrationLog(error, 'error'));
        } else {
            addMigrationLog('Data validation passed', 'success');
        }
        
        if (validation.warnings.length > 0) {
            addMigrationLog(`${validation.warnings.length} warnings found`, 'warning');
            validation.warnings.slice(0, 5).forEach(warning => addMigrationLog(warning, 'warning'));
            if (validation.warnings.length > 5) {
                addMigrationLog(`... and ${validation.warnings.length - 5} more warnings`, 'warning');
            }
        }

        if (validation.fixes.length > 0) {
            addMigrationLog(`Applied ${validation.fixes.length} automatic fixes`, 'success');
        }
    } catch (error) {
        updateImportStep('migrate', 'error', 'Failed');
        addMigrationLog(`Migration failed: ${error.message}`, 'error');
        throw error;
    }
    
    // Step 4: Merge with existing data
    updateProgress(75, 'Merging with existing data...');
    updateImportStep('merge', 'active', 'Merging...');
    
    await delay(200);
    
    try {
        // Check if user needs to choose import mode
        const hasExistingData = appData && appData.boards && Object.keys(appData.boards).length > 0;
        
        if (hasExistingData) {
            // Show choice section and wait for user decision
            await showImportChoice();
        }
        
        // Get user's choice
        const shouldMerge = !hasExistingData || getImportChoice() === 'merge';
        
        if (shouldMerge) {
            mergeImportedData(migratedData);
            addMigrationLog('Data merged with existing workspace', 'success');
        } else {
            Object.assign(appData, migratedData);
            addMigrationLog('Data replaced existing workspace', 'success');
        }
        
        updateImportStep('merge', 'completed', 'Merged');
    } catch (error) {
        updateImportStep('merge', 'error', 'Failed');
        addMigrationLog(`Merge failed: ${error.message}`, 'error');
        throw error;
    }
    
    // Step 5: Save to storage
    updateProgress(90, 'Saving to storage...');
    updateImportStep('save', 'active', 'Saving...');
    
    await delay(200);
    
    try {
        addMigrationLog('Starting data save process...', 'info');
        
        // Ensure current board exists and is set
        if (!appData.boards[appData.currentBoardId]) {
            appData.currentBoardId = Object.keys(appData.boards)[0] || 'default';
            addMigrationLog(`Set current board to: ${appData.currentBoardId}`, 'info');
        }
        
        // Update boardData reference
        const currentBoard = appData.boards[appData.currentBoardId];
        if (currentBoard) {
            Object.assign(boardData, currentBoard);
            addMigrationLog('Updated boardData reference', 'info');
        } else {
            addMigrationLog('Warning: No current board found', 'warning');
        }
        
        // Save data directly using IndexedDB adapters (bypassing problematic saveData function)
        addMigrationLog('Saving data using IndexedDB adapters...', 'info');
        
        let savedEntities = 0, savedBoards = 0;
        
        // Save entities in batches
        if (appData.entities && Object.keys(appData.entities).length > 0) {
            addMigrationLog('Saving entities...', 'info');
            const entities = Object.values(appData.entities);
            for (const entity of entities) {
                try {
                    await entityService.save(entity);
                    savedEntities++;
                } catch (error) {
                    addMigrationLog(`Failed to save entity ${entity.id}: ${error.message}`, 'warning');
                }
            }
            addMigrationLog(`Saved ${savedEntities}/${entities.length} entities`, 'success');
        }
        
        // Save boards
        if (appData.boards && Object.keys(appData.boards).length > 0) {
            addMigrationLog('Saving boards...', 'info');
            const boards = Object.entries(appData.boards);
            for (const [boardId, board] of boards) {
                try {
                    await boardService.save({ id: boardId, ...board });
                    savedBoards++;
                } catch (error) {
                    addMigrationLog(`Failed to save board ${boardId}: ${error.message}`, 'warning');
                }
            }
            addMigrationLog(`Saved ${savedBoards}/${boards.length} boards`, 'success');
        }
        
        // Save app metadata
        try {
            addMigrationLog('Saving app metadata...', 'info');
            await metaService.setSetting('app_config', {
                currentBoardId: appData.currentBoardId,
                version: appData.version || '6.0'
            });
            addMigrationLog('App metadata saved', 'success');
        } catch (error) {
            addMigrationLog(`Failed to save app metadata: ${error.message}`, 'warning');
        }
        
        addMigrationLog(`Data save complete: ${savedEntities} entities, ${savedBoards} boards`, 'success');
        
        // Handle entity positions - create position records for all entities in boards
        addMigrationLog('Creating entity position records...', 'info');
        try {
            await createEntityPositionsFromBoardData();
            addMigrationLog('Entity positions created successfully', 'success');
        } catch (error) {
            addMigrationLog(`Entity positions creation failed: ${error.message}`, 'warning');
            // Don't throw - this is not critical for import success
        }
        
        updateImportStep('save', 'completed', 'Saved');
        addMigrationLog('Data saved to IndexedDB with position tracking', 'success');
    } catch (error) {
        console.error('Save step failed:', error);
        updateImportStep('save', 'error', 'Failed');
        addMigrationLog(`Save failed: ${error.message}`, 'error');
        addMigrationLog(`Error stack: ${error.stack}`, 'error');
        throw error;
    }
    
    // Complete!
    updateProgress(100, 'Import completed successfully!');
    addMigrationLog('Import process completed successfully', 'success');
    
    // Update UI
    try {
        if (window.updateBoardTitle) window.updateBoardTitle();
        if (window.updateBoardSelector) window.updateBoardSelector();
        if (window.renderBoard) window.renderBoard();
        if (window.updateSettingsUI) window.updateSettingsUI();
        
        addMigrationLog('UI updated successfully', 'success');
    } catch (error) {
        addMigrationLog(`UI update warning: ${error.message}`, 'warning');
    }
    
    // Recover any orphaned entities (entities not positioned in any board)
    try {
        if (window.recoverOrphanedEntities) {
            const recoveryResult = await window.recoverOrphanedEntities();
            if (recoveryResult.success && recoveryResult.recoveredCount > 0) {
                addMigrationLog(`Recovered ${recoveryResult.recoveredCount} orphaned entities to "${recoveryResult.placementLocation.rowName}" → "${recoveryResult.placementLocation.columnName}"`, 'success');
            }
        }
    } catch (error) {
        addMigrationLog(`Orphaned entity recovery warning: ${error.message}`, 'warning');
    }
    
    // Clear the force completion timeout
    clearTimeout(forceCompletion);
    
    // Show completion actions
    const actions = document.getElementById('importActions');
    if (actions) actions.style.display = 'flex';
    
    // Show final success message
    const boardCount = Object.keys(appData.boards).length;
    const importDate = importedData.exportedAt ? 
        new Date(importedData.exportedAt).toLocaleDateString() : 'Unknown date';
    const importVersion = importedData.version || 'Unknown';
    
    showStatusMessage(
        `Import successful! ${boardCount} boards available. ` +
        `(Version ${importVersion} data from ${importDate})`, 
        'success'
    );
    
    // Force a page refresh if needed to ensure data is visible
    addMigrationLog('Import completed successfully. Use "Refresh Page" if data is not visible.', 'success');
}

/**
 * Analyze import data to provide statistics
 */
function analyzeImportData(data) {
    const stats = {
        boards: 0,
        cards: 0,
        templates: 0,
        weeklyItems: 0,
        entities: 0
    };
    
    // Count boards and cards
    if (data.boards) {
        stats.boards = Object.keys(data.boards).length;
        
        Object.values(data.boards).forEach(board => {
            if (board.rows) {
                board.rows.forEach(row => {
                    if (row.cards) {
                        Object.values(row.cards).forEach(cardList => {
                            stats.cards += cardList.length;
                        });
                    }
                });
            }
        });
    }
    
    // Count templates
    if (data.templates) {
        stats.templates = data.templates.length;
    }
    
    // Count weekly items
    if (data.weeklyPlans) {
        Object.values(data.weeklyPlans).forEach(plan => {
            if (plan.items) {
                stats.weeklyItems += plan.items.length;
            }
        });
    }
    
    // Count entities
    if (data.entities) {
        if (typeof data.entities === 'object') {
            if (data.entities.tasks || data.entities.notes || data.entities.checklists) {
                // v4 format
                stats.entities = Object.keys(data.entities.tasks || {}).length +
                                Object.keys(data.entities.notes || {}).length +
                                Object.keys(data.entities.checklists || {}).length;
            } else {
                // v5 format
                stats.entities = Object.keys(data.entities).length;
            }
        }
    }
    
    return stats;
}

/**
 * Show import choice section and wait for user decision
 */
function showImportChoice() {
    return new Promise((resolve, reject) => {
        const choiceSection = document.getElementById('importChoiceSection');
        if (!choiceSection) {
            reject(new Error('Import choice section not found'));
            return;
        }
        
        // Show the choice section
        choiceSection.style.display = 'block';
        
        // Update progress to indicate waiting for user input
        updateProgress(65, 'Waiting for import mode selection...');
        updateImportStep('merge', 'active', 'Awaiting choice...');
        
        // Add event listeners
        const continueBtn = document.getElementById('continueImportBtn');
        const cancelBtn = document.getElementById('cancelImportBtn');
        
        const handleContinue = () => {
            // Hide choice section
            choiceSection.style.display = 'none';
            
            // Clean up listeners
            continueBtn.removeEventListener('click', handleContinue);
            cancelBtn.removeEventListener('click', handleCancel);
            
            // Resume import
            updateProgress(75, 'Merging with existing data...');
            resolve();
        };
        
        const handleCancel = () => {
            // Hide choice section
            choiceSection.style.display = 'none';
            
            // Clean up listeners
            continueBtn.removeEventListener('click', handleContinue);
            cancelBtn.removeEventListener('click', handleCancel);
            
            // Cancel import
            updateImportStep('merge', 'error', 'Cancelled');
            addMigrationLog('Import cancelled by user', 'warning');
            reject(new Error('Import cancelled by user'));
        };
        
        continueBtn.addEventListener('click', handleContinue);
        cancelBtn.addEventListener('click', handleCancel);
    });
}

/**
 * Get user's import choice
 */
function getImportChoice() {
    const mergeRadio = document.querySelector('input[name="importMode"][value="merge"]');
    const replaceRadio = document.querySelector('input[name="importMode"][value="replace"]');
    
    if (mergeRadio && mergeRadio.checked) {
        return 'merge';
    } else if (replaceRadio && replaceRadio.checked) {
        return 'replace';
    }
    
    // Default to merge
    return 'merge';
}

/**
 * Utility function to add delays for better UX
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Merge imported data with existing data
 * @param {Object} importedData - The imported data to merge
 */
export function mergeImportedData(importedData) {
    console.log('Merging imported data with existing data...');
    
    // Merge boards (rename if conflicts)
    Object.keys(importedData.boards).forEach(boardId => {
        let finalBoardId = boardId;
        
        // Handle board ID conflicts
        if (appData.boards[boardId]) {
            finalBoardId = generateUniqueBoardId(boardId);
            console.log(`Board ID conflict: renamed ${boardId} to ${finalBoardId}`);
        }
        
        appData.boards[finalBoardId] = importedData.boards[boardId];
    });
    
    // Merge entities
    if (importedData.entities) {
        // Ensure appData.entities exists
        if (!appData.entities || typeof appData.entities !== 'object') {
            appData.entities = {};
        }
        
        Object.keys(importedData.entities).forEach(entityId => {
            // Only merge if entity doesn't already exist
            if (!appData.entities[entityId]) {
                appData.entities[entityId] = importedData.entities[entityId];
            }
        });
    }
    
    // Merge templates (avoid duplicates by name)
    if (importedData.templates) {
        // Ensure appData.templates exists and is an array
        if (!appData.templates || !Array.isArray(appData.templates)) {
            appData.templates = [];
        }
        if (!appData.nextTemplateId) {
            appData.nextTemplateId = 1;
        }
        
        importedData.templates.forEach(template => {
            const existingTemplate = appData.templates.find(t => t.name === template.name);
            if (!existingTemplate) {
                template.id = appData.nextTemplateId++;
                appData.templates.push(template);
            }
        });
    }
    
    // Merge weekly plans (by week key)
    if (importedData.weeklyPlans) {
        // Ensure appData.weeklyPlans exists
        if (!appData.weeklyPlans || typeof appData.weeklyPlans !== 'object') {
            appData.weeklyPlans = {};
        }
        
        Object.keys(importedData.weeklyPlans).forEach(weekKey => {
            if (!appData.weeklyPlans[weekKey]) {
                appData.weeklyPlans[weekKey] = importedData.weeklyPlans[weekKey];
            }
        });
    }
    
    // Update ID counters to prevent conflicts
    updateIdCounters();
}

/**
 * Clear all application data and reset to default state
 */
export function clearAllData() {
    // Show confirmation dialog
    const confirmed = confirm(
        'Are you sure you want to clear ALL data?\n\n' +
        'This will delete:\n' +
        '• All boards and cards\n' +
        '• All templates\n' +
        '• All weekly plans\n' +
        '• All entities and tasks\n' +
        '• All settings\n\n' +
        'This action cannot be undone!\n\n' +
        'Consider exporting your data first as a backup.'
    );
    
    if (!confirmed) {
        return;
    }
    
    // Second confirmation for safety
    const doubleConfirmed = confirm(
        'FINAL WARNING: This will permanently delete all your data.\n\n' +
        'Are you absolutely sure you want to continue?'
    );
    
    if (!doubleConfirmed) {
        return;
    }
    
    try {
        // Clear legacy localStorage entries (cleanup only)
        localStorage.removeItem('gridflow_data');
        localStorage.removeItem('gridflow_data_pre_entity_migration');
        
        // Note: Actual data is now stored in IndexedDB and cleared by other mechanisms
        
        // Show success message
        showStatusMessage('All data cleared successfully. Refreshing page...', 'success');
        
        // Reload the page after a short delay to reinitialize with fresh data
        setTimeout(() => {
            window.location.reload();
        }, 1500);
        
    } catch (error) {
        console.error('Error clearing data:', error);
        showStatusMessage('Error clearing data: ' + error.message, 'error');
    }
}

// Make functions available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.showDataManagementModal = showDataManagementModal;
    window.closeDataManagementModal = closeDataManagementModal;
    window.showExportModal = showExportModal;
    window.closeExportModal = closeExportModal;
    window.exportToPDF = exportToPDF;
    window.exportToPNG = exportToPNG;
    window.exportToExcel = exportToExcel;
    window.exportToJSON = exportToJSON;
    window.importFromJSON = importFromJSON;
    window.mergeImportedData = mergeImportedData;
    window.clearAllData = clearAllData;
    window.showImportProgressModal = showImportProgressModal;
    window.closeImportProgress = closeImportProgress;
    window.refreshAfterImport = refreshAfterImport;
}