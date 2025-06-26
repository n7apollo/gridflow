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
 * Show export modal
 */
export function showExportModal() {
    document.getElementById('exportModal').style.display = 'block';
}

/**
 * Close export modal
 */
export function closeExportModal() {
    document.getElementById('exportModal').style.display = 'none';
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
    closeExportModal();
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
    closeExportModal();
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
    closeExportModal();
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
    closeExportModal();
}

/**
 * Import data from JSON file
 */
export function importFromJSON() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Use the migration system to handle any version of data
            console.log('Starting import process...');
            const migratedData = migrateData(importedData);
            
            // Ask user if they want to merge or replace data
            const hasExistingData = Object.keys(appData.boards).length > 0;
            let shouldMerge = false;
            
            if (hasExistingData) {
                const choice = confirm(
                    'You have existing data. How would you like to import?\n\n' +
                    'OK = Merge with existing data\n' +
                    'Cancel = Replace all data\n\n' +
                    'Note: Merging will add new boards and preserve existing ones.'
                );
                shouldMerge = choice;
            }
            
            if (shouldMerge) {
                // Merge imported data with existing data
                mergeImportedData(migratedData);
            } else {
                // Replace all data
                Object.assign(appData, migratedData);
            }
            
            // Ensure current board exists and is set
            if (!appData.boards[appData.currentBoardId]) {
                appData.currentBoardId = Object.keys(appData.boards)[0] || 'default';
            }
            
            // Update boardData reference
            const currentBoard = appData.boards[appData.currentBoardId];
            Object.assign(boardData, currentBoard);
            
            // Update UI - these functions need to be called from window if they exist
            if (window.updateBoardTitle) window.updateBoardTitle();
            if (window.updateBoardSelector) window.updateBoardSelector();
            if (window.renderBoard) window.renderBoard();
            if (window.updateSettingsUI) window.updateSettingsUI();
            saveData();
            
            // Show success message
            const boardCount = Object.keys(appData.boards).length;
            const importDate = importedData.exportedAt ? 
                new Date(importedData.exportedAt).toLocaleDateString() : 'Unknown date';
            const importVersion = importedData.version || 'Unknown';
            
            showStatusMessage(
                `Import successful! ${boardCount} boards available. ` +
                `(Version ${importVersion} data from ${importDate})`, 
                'success'
            );
            
            fileInput.value = '';
            closeExportModal();
            
        } catch (error) {
            console.error('Import failed:', error);
            showStatusMessage(
                `Import failed: ${error.message || 'Invalid file format'}`, 
                'error'
            );
        }
    };
    reader.readAsText(file);
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

// Make functions available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.showExportModal = showExportModal;
    window.closeExportModal = closeExportModal;
    window.exportToPDF = exportToPDF;
    window.exportToPNG = exportToPNG;
    window.exportToExcel = exportToExcel;
    window.exportToJSON = exportToJSON;
    window.importFromJSON = importFromJSON;
    window.mergeImportedData = mergeImportedData;
}