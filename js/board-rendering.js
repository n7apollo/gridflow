/**
 * GridFlow - Board Rendering Module
 * Handles all board display and rendering logic including main board layout,
 * group/row/column/card rendering, CSS grid management, and content display for subtasks
 */

import { saveData, appData, boardData } from './core-data.js';
import { initializeAllSorting, setupColumnSorting, setupRowSorting } from './drag-drop.js';
import { getCurrentDetailCard } from './card-operations.js';
import { renderEntity } from './entity-renderer.js';
import { getEntity, CONTEXT_TYPES } from './entity-core.js';

/**
 * Render the entire board
 * Main orchestrator function that coordinates all board rendering
 */
export function renderBoard() {
    // Check if boardData is available before rendering
    if (!boardData || !boardData.columns) {
        console.warn('renderBoard: boardData not available, delaying render');
        // Try again after a short delay to allow for async data loading
        setTimeout(() => {
            if (boardData && boardData.columns) {
                renderBoard();
            } else {
                console.error('renderBoard: boardData still not available after delay');
            }
        }, 100);
        return;
    }
    
    renderColumnHeaders();
    renderGroupsAndRows();
    updateCSSGridColumns();
    
    // Initialize SortableJS for all columns after rendering
    setTimeout(() => {
        initializeAllSorting();
    }, 100);
    
    saveData();
}

/**
 * Render column headers
 * Creates the header row with column titles and actions
 */
export function renderColumnHeaders() {
    const container = document.getElementById('boardHeader');
    if (!container) {
        console.warn('boardHeader element not found');
        return;
    }
    
    // Check if boardData is available
    if (!boardData || !boardData.columns) {
        console.warn('boardData or columns not available, skipping render');
        container.innerHTML = '<div class="p-4 text-center text-base-content/70">Loading board data...</div>';
        return;
    }
    
    // Set a fixed width for kanban columns and enable horizontal scrolling if needed
    const columnCount = boardData.columns.length;
    container.innerHTML = '';
    container.className = 'kanban-header-scroll w-full overflow-x-auto';
    // Create a grid container inside for the actual columns
    const grid = document.createElement('div');
    grid.className = `grid grid-cols-[200px_repeat(${columnCount},240px)] min-w-full`;
    // Row label header
    const rowLabelHeader = document.createElement('div');
    rowLabelHeader.className = 'row-label-header font-bold flex items-center justify-center p-2 border-b border-base-300';
    rowLabelHeader.textContent = 'Projects';
    grid.appendChild(rowLabelHeader);
    // Column headers
    boardData.columns.forEach((column, index) => {
        const headerDiv = document.createElement('div');
        headerDiv.className = 'column-header font-semibold p-2 flex items-center justify-between border-b border-base-300 w-[240px] min-w-[240px] max-w-[240px]';
        headerDiv.dataset.columnId = column.id;
        headerDiv.dataset.columnIndex = index;
        headerDiv.innerHTML = `
            <span class="column-title">${column.name}</span>
            <div class="column-actions">
                <button class="btn btn-xs btn-outline btn-secondary" onclick="showColumnOutline('${column.key}')" title="Show outline for this column">📝 Outline</button>
            </div>
        `;
        grid.appendChild(headerDiv);
    });
    container.appendChild(grid);
}

/**
 * Render groups and rows with hierarchical structure
 * Handles the main board layout with grouped and ungrouped rows
 */
export function renderGroupsAndRows() {
    const container = document.getElementById('rowsContainer');
    container.innerHTML = '';
    // Set grid layout for rows to match column headers
    const columnCount = boardData.columns.length;
    container.className = `flex flex-col w-full`;
    // First render ungrouped rows
    const ungroupedRows = boardData.rows.filter(row => !row.groupId);
    ungroupedRows.forEach(row => {
        const rowElement = createRowElement(row, columnCount);
        container.appendChild(rowElement);
    });
    // Then render groups in their defined order
    boardData.groups.forEach(group => {
        const groupRows = boardData.rows.filter(row => row.groupId === group.id);
        if (groupRows.length > 0) {
            // Add group header
            const groupElement = createGroupElement(group);
            container.appendChild(groupElement);
            // Add all rows for this group
            groupRows.forEach(row => {
                const rowElement = createRowElement(row, columnCount);
                container.appendChild(rowElement);
            });
        }
    });
    // Setup row sorting for the entire container
    setupRowSorting(container);
}

/**
 * Create group element
 * Creates a group header with toggle, name, count, and actions
 * @param {Object} group - The group object to render
 * @returns {HTMLElement} The group header element
 */
export function createGroupElement(group) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'group-header flex items-center gap-2 bg-base-100 border-b-2 px-4 py-2 mt-4 rounded-t-lg';
    groupDiv.style.borderBottomColor = group.color;
    groupDiv.dataset.groupId = group.id;
    
    const groupRows = boardData.rows.filter(row => row.groupId === group.id);
    const toggleIcon = group.collapsed ? '▶' : '▼';
    
    groupDiv.innerHTML = `
        <button class="btn btn-xs btn-ghost group-toggle" onclick="toggleGroup(${group.id})">${toggleIcon}</button>
        <span class="font-semibold">${group.name} <span class="badge badge-sm badge-outline ml-1">${groupRows.length}</span></span>
        <div class="group-actions ml-auto flex gap-1">
            <button class="btn btn-xs btn-outline btn-secondary" onclick="editGroup(${group.id})">Edit</button>
            <button class="btn btn-xs btn-outline btn-error" onclick="deleteGroup(${group.id})">Delete</button>
        </div>
    `;
    return groupDiv;
}

/**
 * Create a row element
 * Creates a complete row with label, columns, and mobile layout
 * @param {Object} row - The row object to render
 * @returns {HTMLElement} The row element
 */
export function createRowElement(row, columnCount) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'kanban-row-scroll w-full overflow-x-auto';
    // Create a grid container inside for the actual row
    const grid = document.createElement('div');
    grid.className = `board-row grid grid-cols-[200px_repeat(${columnCount},240px)] items-stretch bg-base-100 border-b border-base-200 hover:bg-base-200 transition-colors min-w-full`;
    rowDiv.dataset.rowId = row.id;
    if (row.groupId) {
        grid.classList.add('in-group');
        const group = boardData.groups.find(g => g.id === row.groupId);
        if (group) {
            grid.style.borderLeft = `4px solid ${group.color}`;
        }
    }
    // Row label
    const rowLabel = document.createElement('div');
    rowLabel.className = 'row-label flex flex-col justify-center min-w-[180px] max-w-[220px] p-2 border-r border-base-200 bg-base-100';
    const descriptionHtml = row.description ? `<div class="row-description text-xs text-base-content/60 mt-1">${row.description}</div>` : '';
    rowLabel.innerHTML = `
        <div class="row-title flex items-center gap-2">
            <div class="row-name font-semibold">${row.name}</div>
        </div>
        ${descriptionHtml}
        <div class="row-actions mt-2 flex gap-1">
            <button class="btn btn-xs btn-outline btn-secondary" onclick="editRow(${row.id})" title="Edit row">Edit</button>
            <button class="btn btn-xs btn-outline btn-error" onclick="deleteRow(${row.id})" title="Delete row">Delete</button>
        </div>
    `;
    grid.appendChild(rowLabel);
    // Columns
    boardData.columns.forEach(column => {
        const columnElement = createColumnElement(row, column);
        grid.appendChild(columnElement);
    });
    // Mobile columns (unchanged, but add DaisyUI classes)
    const mobileColumnsContainer = document.createElement('div');
    mobileColumnsContainer.className = 'mobile-columns-container flex flex-col gap-2 md:hidden w-full';
    boardData.columns.forEach(column => {
        const mobileColumnSection = document.createElement('div');
        mobileColumnSection.className = 'mobile-column-section card bg-base-100 p-2';
        // Mobile column header
        const mobileColumnHeader = document.createElement('div');
        mobileColumnHeader.className = 'mobile-column-header flex items-center justify-between mb-1';
        mobileColumnHeader.innerHTML = `
            <span class="mobile-column-title font-semibold">${column.name}</span>
            <div class="mobile-column-actions">
                <button class="btn btn-xs btn-outline btn-secondary" onclick="showColumnOutline('${column.key}')" title="Show outline for this column">📝 Outline</button>
            </div>
        `;
        // Mobile column content
        const mobileColumnContent = document.createElement('div');
        mobileColumnContent.className = 'mobile-column-content flex flex-col gap-2';
        mobileColumnContent.dataset.rowId = row.id;
        mobileColumnContent.dataset.columnKey = column.key;
        const cards = row.cards[column.key] || [];
        cards.forEach(card => {
            const cardElement = createCardElement(card, row.id, column.key);
            mobileColumnContent.appendChild(cardElement);
        });
        // Add mobile add button
        const mobileAddButton = document.createElement('button');
        mobileAddButton.className = 'btn btn-xs btn-outline btn-primary mt-2';
        mobileAddButton.textContent = '+ Add a card';
        mobileAddButton.onclick = () => openCardModal(row.id, column.key);
        mobileColumnContent.appendChild(mobileAddButton);
        // Setup SortableJS for mobile column
        setupColumnSorting(mobileColumnContent, row.id, column.key);
        mobileColumnSection.appendChild(mobileColumnHeader);
        mobileColumnSection.appendChild(mobileColumnContent);
        mobileColumnsContainer.appendChild(mobileColumnSection);
    });
    rowDiv.appendChild(grid);
    // ...mobile columns unchanged...
    return rowDiv;
}

/**
 * Create a column element
 * Creates a column with cards container, footer, and add button
 * @param {Object} row - The row this column belongs to
 * @param {Object} column - The column object to render
 * @returns {HTMLElement} The column element
 */
export function createColumnElement(row, column) {
    const columnDiv = document.createElement('div');
    columnDiv.className = 'column flex flex-col gap-2 p-2 w-[240px] min-w-[240px] max-w-[240px]';
    columnDiv.dataset.rowId = row.id;
    columnDiv.dataset.columnKey = column.key;
    // Cards container
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'cards-container flex flex-col gap-2';
    cardsContainer.dataset.rowId = row.id;
    cardsContainer.dataset.columnKey = column.key;
    cardsContainer.style.cssText = 'flex: 1; min-height: 80px;';
    if (!row.cards[column.key]) {
        row.cards[column.key] = [];
    }
    const cards = row.cards[column.key] || [];
    cards.forEach(card => {
        const cardElement = createCardElement(card, row.id, column.key);
        cardsContainer.appendChild(cardElement);
    });
    columnDiv.appendChild(cardsContainer);
    // Add card button in footer
    const addButton = document.createElement('button');
    addButton.className = 'btn btn-xs btn-outline btn-primary w-full mt-2';
    addButton.textContent = '+ Add a card';
    addButton.onclick = () => openCardModal(row.id, column.key);
    const columnFooter = document.createElement('div');
    columnFooter.className = 'column-footer mt-auto';
    columnFooter.appendChild(addButton);
    columnDiv.appendChild(columnFooter);
    setupColumnSorting(cardsContainer, row.id, column.key);
    return columnDiv;
}

/**
 * Create a card element
 * Creates a complete card with content, actions, and progress indicators
 * @param {Object} card - The card object to render
 * @param {number} rowId - The ID of the row this card belongs to
 * @param {string} columnKey - The key of the column this card belongs to
 * @returns {HTMLElement} The card element
 */
export function createCardElement(card, rowId, columnKey) {
    // Handle both old format (card objects) and new format (entity IDs)
    let entityId;
    let entity;
    
    if (typeof card === 'string') {
        // New format: card is an entity ID
        entityId = card;
        entity = getEntity(entityId);
        
        if (!entity) {
            console.warn('Entity not found for card:', entityId);
            // Create a placeholder card element
            const errorDiv = document.createElement('div');
            errorDiv.className = 'card bg-error text-error-content p-2';
            errorDiv.innerHTML = '<div class="card-body">⚠️ Entity not found</div>';
            return errorDiv;
        }
    } else {
        // Old format: card is an object - this shouldn't happen after migration
        console.warn('Using legacy card object format:', card);
        entity = card;
        entityId = card.id;
    }
    
    // Use the unified entity renderer for board context
    const contextData = {
        boardId: boardData.id,
        rowId: rowId,
        columnKey: columnKey,
        showCheckboxes: boardData.settings.showCheckboxes,
        showSubtaskProgress: boardData.settings.showSubtaskProgress
    };
    
    const cardElement = renderEntity(entityId, CONTEXT_TYPES.BOARD, contextData);
    
    if (!cardElement) {
        // Fallback if entity renderer fails
        const errorDiv = document.createElement('div');
        errorDiv.className = 'card bg-error text-error-content p-2';
        errorDiv.innerHTML = '<div class="card-body">⚠️ Render failed</div>';
        return errorDiv;
    }
    
    // Add board-specific data attributes
    cardElement.dataset.cardId = entityId;
    cardElement.dataset.rowId = rowId;
    cardElement.dataset.columnKey = columnKey;
    
    return cardElement;
}

/**
 * Update CSS grid columns dynamically
 * Adjusts grid layout based on current number of columns
 */
export function updateCSSGridColumns() {
    const columnCount = boardData.columns.length;
    document.documentElement.style.setProperty('--column-count', columnCount);
    // No need to update gridTemplateColumns, as grid classes and widths are now fixed
}

/**
 * Render subtasks for the current detail card
 * Updated for unified entity system
 */
export function renderSubtasks() {
    const currentDetailCard = getCurrentDetailCard();
    if (!currentDetailCard) return;
    
    const subtasksList = document.getElementById('subtasksList');
    subtasksList.innerHTML = '';
    
    const taskIds = currentDetailCard.card.taskIds || [];
    const tasks = taskIds.map(taskId => appData.entities.tasks[taskId]).filter(Boolean);
    
    if (tasks.length === 0) {
        subtasksList.innerHTML = '<div class="no-subtasks text-base-content/60 italic">No subtasks yet. Click "Add Subtask" to get started.</div>';
        return;
    }
    tasks.forEach((task, index) => {
        const subtaskElement = document.createElement('div');
        subtaskElement.className = `subtask-item flex items-center gap-2 p-2 rounded-lg ${task.completed ? 'bg-success/10' : 'bg-base-200'}`;
        subtaskElement.dataset.taskId = task.id;
        subtaskElement.dataset.index = index;
        subtaskElement.innerHTML = `
            <div class="subtask-content flex items-center gap-2 flex-1">
                <input type="checkbox" ${task.completed ? 'checked' : ''} 
                       onchange="toggleSubtask('${task.id}')" class="checkbox checkbox-xs">
                <span class="subtask-text ${task.completed ? 'line-through text-base-content/40' : ''} cursor-pointer" 
                      onclick="startEditSubtask('${task.id}')">${task.text}</span>
            </div>
            <div class="subtask-edit-form mt-2 hidden">
                <div class="subtask-input-group flex gap-2">
                    <input type="text" class="input input-bordered input-xs flex-1" value="${task.text}">
                    <div class="subtask-input-actions flex gap-1">
                        <button onclick="saveEditSubtask('${task.id}')" class="btn btn-xs btn-primary">Save</button>
                        <button onclick="cancelEditSubtask('${task.id}')" class="btn btn-xs btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>
            <div class="subtask-actions flex gap-1">
                <button onclick="startEditSubtask('${task.id}')" title="Edit subtask" class="btn btn-xs btn-ghost">✏️</button>
                <button onclick="deleteSubtask('${task.id}')" title="Delete subtask" class="btn btn-xs btn-ghost">🗑️</button>
            </div>
        `;
        subtasksList.appendChild(subtaskElement);
    });
}

// Make functions available globally for backward compatibility with existing onclick handlers
window.renderBoard = renderBoard;
window.renderColumnHeaders = renderColumnHeaders;
window.renderGroupsAndRows = renderGroupsAndRows;
window.createGroupElement = createGroupElement;
window.createRowElement = createRowElement;
window.createColumnElement = createColumnElement;
window.createCardElement = createCardElement;
window.updateCSSGridColumns = updateCSSGridColumns;
window.renderSubtasks = renderSubtasks;