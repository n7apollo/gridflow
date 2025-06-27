/**
 * Column Operations Module
 * 
 * Handles all column-related CRUD operations including:
 * - Creating, editing, deleting columns
 * - Column positioning and reordering
 * - Column list rendering for management interfaces
 * - Column modal management
 * 
 * Dependencies:
 * - appData, boardData from core-data.js
 * - saveData from core-data.js
 * - showStatusMessage from utilities.js
 * - renderBoard from main board rendering system
 */

// Import dependencies
import { appData, boardData, saveData } from './core-data.js';
import { showStatusMessage } from './utilities.js';

// Global state for column editing
let currentEditingColumn = null;

/**
 * Add a new column to the board
 * Opens the column modal for creating a new column
 */
function addColumn() {
    currentEditingColumn = null;
    
    const modalTitle = document.getElementById('columnModalTitle');
    const columnName = document.getElementById('columnName');
    const columnModal = document.getElementById('columnModal');
    
    if (modalTitle) modalTitle.textContent = 'Add Column';
    if (columnName) columnName.value = '';
    if (columnModal) columnModal.style.display = 'block';
}

/**
 * Edit an existing column
 * Opens the column modal with the column's current data
 * @param {number} columnId - The ID of the column to edit
 */
function editColumn(columnId) {
    const column = boardData.columns.find(c => c.id === columnId);
    if (!column) return;
    
    currentEditingColumn = column;
    document.getElementById('columnModalTitle').textContent = 'Edit Column';
    document.getElementById('columnName').value = column.name;
    document.getElementById('columnModal').style.display = 'block';
}

/**
 * Save column changes (add or edit)
 * Handles both creating new columns and updating existing ones
 * @param {Event} event - The form submit event
 */
function saveColumn(event) {
    event.preventDefault();
    const columnNameElement = document.getElementById('columnName');
    if (!columnNameElement) return;
    
    const name = columnNameElement.value.trim();
    if (!name) return;
    
    if (currentEditingColumn) {
        currentEditingColumn.name = name;
    } else {
        const key = 'col_' + boardData.nextColumnId;
        const newColumn = {
            id: boardData.nextColumnId++,
            name: name,
            key: key
        };
        boardData.columns.push(newColumn);
        
        // Add empty card arrays for this column to all existing rows
        boardData.rows.forEach(row => {
            row.cards[key] = [];
        });
    }
    
    closeColumnModal();
    // Note: renderBoard will need to be called by the importing module
    if (typeof renderBoard === 'function') {
        renderBoard();
    }
    renderColumnsList();
    renderColumnsListModal();
    saveData();
}

/**
 * Delete a column from the board
 * Removes the column and all cards in that column from all rows
 * @param {number} columnId - The ID of the column to delete
 */
function deleteColumn(columnId) {
    if (boardData.columns.length <= 1) {
        showStatusMessage('Cannot delete the last column', 'error');
        return;
    }
    
    if (confirm('Are you sure you want to delete this column? All cards in this column will be lost.')) {
        const column = boardData.columns.find(c => c.id === columnId);
        if (column) {
            // Remove column from all rows
            boardData.rows.forEach(row => {
                delete row.cards[column.key];
            });
            
            // Remove column from columns array
            boardData.columns = boardData.columns.filter(c => c.id !== columnId);
            
            // Note: renderBoard will need to be called by the importing module
            if (typeof renderBoard === 'function') {
                renderBoard();
            }
            renderColumnsList();
            renderColumnsListModal();
            saveData();
        }
    }
}

/**
 * Move a column to a specific position
 * @param {number} columnId - The ID of the column to move
 * @param {number} insertIndex - The index to insert the column at
 */
function moveColumn(columnId, insertIndex) {
    const columnIndex = boardData.columns.findIndex(c => c.id === columnId);
    if (columnIndex === -1) return;
    
    const column = boardData.columns.splice(columnIndex, 1)[0];
    boardData.columns.splice(insertIndex, 0, column);
    
    // Note: renderBoard will need to be called by the importing module
    if (typeof renderBoard === 'function') {
        renderBoard();
    }
    saveData();
}

/**
 * Move a column up in the order (decrease index)
 * @param {number} index - The current index of the column
 */
function moveColumnUp(index) {
    if (index <= 0) return;
    
    const column = boardData.columns.splice(index, 1)[0];
    boardData.columns.splice(index - 1, 0, column);
    
    // Note: renderBoard will need to be called by the importing module
    if (typeof renderBoard === 'function') {
        renderBoard();
    }
    renderColumnsList();
    saveData();
}

/**
 * Move a column down in the order (increase index)
 * @param {number} index - The current index of the column
 */
function moveColumnDown(index) {
    if (index >= boardData.columns.length - 1) return;
    
    const column = boardData.columns.splice(index, 1)[0];
    boardData.columns.splice(index + 1, 0, column);
    
    // Note: renderBoard will need to be called by the importing module
    if (typeof renderBoard === 'function') {
        renderBoard();
    }
    renderColumnsList();
    saveData();
}

/**
 * Close the column modal
 * Resets the editing state and hides the modal
 */
function closeColumnModal() {
    const columnModal = document.getElementById('columnModal');
    if (columnModal) columnModal.style.display = 'none';
    currentEditingColumn = null;
}

/**
 * Render the columns list in the main settings interface
 * Creates a list of all columns with edit/delete/reorder controls
 */
function renderColumnsList() {
    const container = document.getElementById('columnsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    boardData.columns.forEach((column, index) => {
        const item = document.createElement('div');
        item.className = 'column-item';
        item.innerHTML = `
            <span class="column-item-name">${column.name}</span>
            <div class="column-item-actions">
                <div class="reorder-controls">
                    <button class="reorder-btn" onclick="moveColumnUp(${index})" ${index === 0 ? 'disabled' : ''} title="Move up">↑</button>
                    <button class="reorder-btn" onclick="moveColumnDown(${index})" ${index === boardData.columns.length - 1 ? 'disabled' : ''} title="Move down">↓</button>
                </div>
                <button class="btn btn-small btn-secondary" onclick="editColumn(${column.id})">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteColumn(${column.id})" 
                        ${boardData.columns.length <= 1 ? 'disabled' : ''}>Delete</button>
            </div>
        `;
        container.appendChild(item);
    });
}

/**
 * Render the columns list in the modal interface
 * Creates a list of all columns with edit/delete/reorder controls for the modal
 */
function renderColumnsListModal() {
    const container = document.getElementById('columnsListModal');
    if (!container) return;
    
    container.innerHTML = '';
    
    boardData.columns.forEach((column, index) => {
        const item = document.createElement('div');
        item.className = 'column-item';
        item.innerHTML = `
            <span class="column-item-name">${column.name}</span>
            <div class="column-item-actions">
                <div class="reorder-controls">
                    <button class="reorder-btn" onclick="moveColumnUp(${index})" ${index === 0 ? 'disabled' : ''} title="Move up">↑</button>
                    <button class="reorder-btn" onclick="moveColumnDown(${index})" ${index === boardData.columns.length - 1 ? 'disabled' : ''} title="Move down">↓</button>
                </div>
                <button class="btn btn-small btn-secondary" onclick="editColumn(${column.id})">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteColumn(${column.id})" 
                        ${boardData.columns.length <= 1 ? 'disabled' : ''}>Delete</button>
            </div>
        `;
        container.appendChild(item);
    });
}

// Export functions for ES6 modules
export {
    addColumn,
    editColumn,
    saveColumn,
    deleteColumn,
    moveColumn,
    moveColumnUp,
    moveColumnDown,
    closeColumnModal,
    renderColumnsList,
    renderColumnsListModal,
    currentEditingColumn
};

// Make functions available globally for backward compatibility
window.addColumn = addColumn;
window.editColumn = editColumn;
window.saveColumn = saveColumn;
window.deleteColumn = deleteColumn;
window.moveColumn = moveColumn;
window.moveColumnUp = moveColumnUp;
window.moveColumnDown = moveColumnDown;
window.closeColumnModal = closeColumnModal;
window.renderColumnsList = renderColumnsList;
window.renderColumnsListModal = renderColumnsListModal;