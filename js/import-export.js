/**
 * GridFlow - Import/Export Module
 * Handles all import/export functionality including PDF, PNG, Excel, and JSON formats
 */

import { showStatusMessage } from './utilities.js';
import { saveData, appData, boardData, migrateData, detectVersion } from './core-data.js';

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
    document.getElementById('dataManagementModal').style.display = 'block';
}

/**
 * Close data management modal
 */
export function closeDataManagementModal() {
    document.getElementById('dataManagementModal').style.display = 'none';
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
export function exportToJSON() {
    try {
        // Export all boards with metadata
        const exportData = {
            ...appData,
            exportedAt: new Date().toISOString(),
            exportedFrom: 'GridFlow',
            version: appData.version || '3.0' // Use current version
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        
        // Create filename with timestamp for easier cloud storage organization
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const boardCount = Object.keys(appData.boards).length;
        a.download = `gridflow-backup-${boardCount}boards-${timestamp}.json`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        // Store last export time in localStorage
        localStorage.setItem('gridflow_last_export', new Date().toISOString());
        
        showStatusMessage(`JSON backup saved (${boardCount} boards)! Upload to your cloud storage to sync across devices.`, 'success');
    } catch (error) {
        console.error('JSON export failed:', error);
        showStatusMessage('JSON export failed', 'error');
    }
    closeDataManagementModal();
}

/**
 * Import data from JSON file
 */
export function importFromJSON() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (!file) return;
    
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
        modal.style.display = 'block';
        resetImportProgress();
    }
}

/**
 * Close the import progress modal
 */
export function closeImportProgress() {
    const modal = document.getElementById('importProgressModal');
    if (modal) {
        modal.style.display = 'none';
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
 * Perform import with progress updates
 */
async function performImportWithProgress(fileContent, fileName) {
    addMigrationLog(`Starting import of ${fileName}`);
    
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
        const originalVersion = importedData.version || detectVersion(importedData);
        migratedData = migrateData(importedData);
        updateImportStep('migrate', 'completed', 'Migrated');
        addMigrationLog(`Migrated from version ${originalVersion} to ${migratedData.version}`, 'success');
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
        const hasExistingData = Object.keys(appData.boards).length > 0;
        
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
        // Ensure current board exists and is set
        if (!appData.boards[appData.currentBoardId]) {
            appData.currentBoardId = Object.keys(appData.boards)[0] || 'default';
        }
        
        // Update boardData reference
        const currentBoard = appData.boards[appData.currentBoardId];
        Object.assign(boardData, currentBoard);
        
        // Save data
        saveData();
        
        updateImportStep('save', 'completed', 'Saved');
        addMigrationLog('Data saved to localStorage', 'success');
    } catch (error) {
        updateImportStep('save', 'error', 'Failed');
        addMigrationLog(`Save failed: ${error.message}`, 'error');
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
    
    // Merge templates (avoid duplicates by name)
    if (importedData.templates) {
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
        // Clear localStorage
        localStorage.removeItem('gridflow_data');
        
        // Clear any backup data
        localStorage.removeItem('gridflow_data_pre_entity_migration');
        
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