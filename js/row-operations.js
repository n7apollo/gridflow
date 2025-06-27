/**
 * GridFlow - Row Operations Module
 * Handles all CRUD operations for rows including creation, editing, deletion, positioning, and group management
 */

import { appData, boardData, saveData } from './core-data.js';
import { showStatusMessage } from './utilities.js';

// Global state for current editing row
let currentEditingRow = null;

/**
 * Populate the group select dropdown with available groups
 */
export function populateGroupSelect() {
    const select = document.getElementById('rowGroup');
    if (!select) {
        console.warn('Row group select element not found');
        return;
    }
    
    select.innerHTML = '<option value="">No Group</option>';
    
    if (boardData && boardData.groups) {
        boardData.groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name;
            select.appendChild(option);
        });
    }
}

/**
 * Open the add row modal
 */
export function addRow() {
    currentEditingRow = null;
    
    const modalTitle = document.getElementById('rowModalTitle');
    const rowName = document.getElementById('rowName');
    const rowDescription = document.getElementById('rowDescription');
    const rowGroup = document.getElementById('rowGroup');
    const rowModal = document.getElementById('rowModal');
    
    if (modalTitle) modalTitle.textContent = 'Add Row';
    if (rowName) rowName.value = '';
    if (rowDescription) rowDescription.value = '';
    
    populateGroupSelect();
    
    if (rowGroup) rowGroup.value = '';
    if (rowModal) rowModal.style.display = 'block';
}

/**
 * Open the edit row modal for a specific row
 * @param {number} rowId - ID of the row to edit
 */
export function editRow(rowId) {
    const row = boardData.rows.find(r => r.id === rowId);
    if (!row) return;
    
    currentEditingRow = row;
    document.getElementById('rowModalTitle').textContent = 'Edit Row';
    document.getElementById('rowName').value = row.name;
    document.getElementById('rowDescription').value = row.description || '';
    populateGroupSelect();
    document.getElementById('rowGroup').value = row.groupId || '';
    document.getElementById('rowModal').style.display = 'block';
}

/**
 * Delete a row after confirmation
 * @param {number} rowId - ID of the row to delete
 */
export function deleteRow(rowId) {
    if (confirm('Are you sure you want to delete this row? All cards will be lost.')) {
        boardData.rows = boardData.rows.filter(r => r.id !== rowId);
        if (window.renderBoard) window.renderBoard();
        saveData();
    }
}

/**
 * Save row data (create new or update existing)
 * @param {Event} event - Form submit event
 */
export function saveRow(event) {
    event.preventDefault();
    const rowNameElement = document.getElementById('rowName');
    const rowDescriptionElement = document.getElementById('rowDescription');
    const rowGroupElement = document.getElementById('rowGroup');
    
    if (!rowNameElement || !rowDescriptionElement || !rowGroupElement) return;
    
    const name = rowNameElement.value.trim();
    const description = rowDescriptionElement.value.trim();
    const groupId = rowGroupElement.value ? parseInt(rowGroupElement.value) : null;
    
    if (!name) return;
    
    if (currentEditingRow) {
        currentEditingRow.name = name;
        currentEditingRow.description = description;
        currentEditingRow.groupId = groupId;
    } else {
        const newRow = {
            id: boardData.nextRowId++,
            name: name,
            description: description,
            groupId: groupId,
            cards: {}
        };
        
        // Initialize cards object with empty arrays for all columns
        boardData.columns.forEach(column => {
            newRow.cards[column.key] = [];
        });
        
        boardData.rows.push(newRow);
    }
    
    closeRowModal();
    if (window.renderBoard) window.renderBoard();
    saveData();
}

/**
 * Move a row to a different group and position
 * @param {number} rowId - ID of the row to move
 * @param {number} targetGroupId - ID of the target group (null for ungrouped)
 * @param {number} insertIndex - Position to insert the row
 */
export function moveRow(rowId, targetGroupId, insertIndex) {
    const rowIndex = boardData.rows.findIndex(r => r.id === rowId);
    if (rowIndex === -1) return;
    
    const row = boardData.rows.splice(rowIndex, 1)[0];
    row.groupId = targetGroupId;
    
    // Find the correct insertion point
    let targetIndex = 0;
    if (targetGroupId) {
        const groupRows = boardData.rows.filter(r => r.groupId === targetGroupId);
        targetIndex = insertIndex;
        for (let i = 0; i < boardData.rows.length; i++) {
            if (boardData.rows[i].groupId === targetGroupId) {
                targetIndex = i + insertIndex;
                break;
            }
        }
    } else {
        const ungroupedRows = boardData.rows.filter(r => !r.groupId);
        targetIndex = insertIndex;
    }
    
    boardData.rows.splice(targetIndex, 0, row);
    if (window.renderBoard) window.renderBoard();
    saveData();
}

/**
 * Move a row to a specific position within a group using reorganization approach
 * @param {number} rowId - ID of the row to move
 * @param {number} targetGroupId - ID of the target group (null for ungrouped)
 * @param {number} insertIndex - Position to insert the row
 */
export function moveRowToPosition(rowId, targetGroupId, insertIndex) {
    const rowIndex = boardData.rows.findIndex(r => r.id === rowId);
    if (rowIndex === -1) return;
    
    const row = boardData.rows[rowIndex];
    
    // Simple approach: reorganize rows by group structure
    boardData.rows.splice(rowIndex, 1); // Remove row
    row.groupId = targetGroupId; // Update group
    
    // Build new rows array in proper order
    const newRows = [];
    
    // Add ungrouped rows first
    const ungroupedRows = boardData.rows.filter(r => !r.groupId);
    if (!targetGroupId) {
        // Insert at specific position in ungrouped section
        ungroupedRows.splice(insertIndex, 0, row);
    }
    newRows.push(...ungroupedRows);
    
    // Add grouped rows in group order
    boardData.groups.forEach(group => {
        const groupRows = boardData.rows.filter(r => r.groupId === group.id);
        if (targetGroupId === group.id) {
            // Insert at specific position in this group
            groupRows.splice(insertIndex, 0, row);
        }
        newRows.push(...groupRows);
    });
    
    boardData.rows = newRows;
    if (window.renderBoard) window.renderBoard();
    saveData();
}

/**
 * Close the row modal
 */
export function closeRowModal() {
    const rowModal = document.getElementById('rowModal');
    if (rowModal) rowModal.style.display = 'none';
    currentEditingRow = null;
}

// Make functions available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.populateGroupSelect = populateGroupSelect;
    window.addRow = addRow;
    window.editRow = editRow;
    window.deleteRow = deleteRow;
    window.saveRow = saveRow;
    window.moveRow = moveRow;
    window.moveRowToPosition = moveRowToPosition;
    window.closeRowModal = closeRowModal;
}