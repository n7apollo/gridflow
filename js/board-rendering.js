/**
 * GridFlow - Board Rendering Module
 * Handles all board display and rendering logic including main board layout,
 * group/row/column/card rendering, CSS grid management, and content display for subtasks
 */

import { saveData, appData, boardData } from './core-data.js';
import { initializeAllSorting, setupColumnSorting, setupRowSorting } from './drag-drop.js';
import { getCurrentDetailCard } from './card-operations.js';

/**
 * Render the entire board
 * Main orchestrator function that coordinates all board rendering
 */
export function renderBoard() {
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
    const container = document.getElementById('columnHeaders');
    container.innerHTML = '<div class="row-label-header">Projects</div>';
    
    boardData.columns.forEach((column, index) => {
        const headerDiv = document.createElement('div');
        headerDiv.className = 'column-header';
        headerDiv.dataset.columnId = column.id;
        headerDiv.dataset.columnIndex = index;
        
        headerDiv.innerHTML = `
            <span class="column-title">${column.name}</span>
            <div class="column-actions">
                <button class="btn btn-small btn-secondary" onclick="showColumnOutline('${column.key}')" title="Show outline for this column">📝 Outline</button>
            </div>
        `;
        
        container.appendChild(headerDiv);
    });
}

/**
 * Render groups and rows with hierarchical structure
 * Handles the main board layout with grouped and ungrouped rows
 */
export function renderGroupsAndRows() {
    const container = document.getElementById('rowsContainer');
    container.innerHTML = '';
    
    // First render ungrouped rows
    const ungroupedRows = boardData.rows.filter(row => !row.groupId);
    ungroupedRows.forEach(row => {
        const rowElement = createRowElement(row);
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
                const rowElement = createRowElement(row);
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
    groupDiv.className = 'group-header';
    groupDiv.style.borderBottomColor = group.color;
    // SortableJS will handle group dragging
    groupDiv.dataset.groupId = group.id;
    
    const groupRows = boardData.rows.filter(row => row.groupId === group.id);
    const toggleIcon = group.collapsed ? '▶' : '▼';
    
    groupDiv.innerHTML = `
        <button class="group-toggle" onclick="toggleGroup(${group.id})">${toggleIcon}</button>
        <span>${group.name} (${groupRows.length})</span>
        <div class="group-actions">
            <button class="btn btn-small btn-secondary" onclick="editGroup(${group.id})">Edit</button>
            <button class="btn btn-small btn-danger" onclick="deleteGroup(${group.id})">Delete</button>
        </div>
    `;
    
    // Group sorting will be setup separately
    return groupDiv;
}

/**
 * Create a row element
 * Creates a complete row with label, columns, and mobile layout
 * @param {Object} row - The row object to render
 * @returns {HTMLElement} The row element
 */
export function createRowElement(row) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'board-row';
    rowDiv.dataset.rowId = row.id;
    // SortableJS will handle row dragging
    
    if (row.groupId) {
        rowDiv.classList.add('in-group');
        const group = boardData.groups.find(g => g.id === row.groupId);
        if (group) {
            rowDiv.style.borderLeftColor = group.color;
        }
    }
    
    // Row label
    const rowLabel = document.createElement('div');
    rowLabel.className = 'row-label';
    
    const descriptionHtml = row.description ? `<div class="row-description">${row.description}</div>` : '';
    
    rowLabel.innerHTML = `
        <div class="row-title">
            <div class="row-name">${row.name}</div>
            ${descriptionHtml}
        </div>
        <div class="row-actions">
            <button class="btn btn-small btn-secondary" onclick="editRow(${row.id})" title="Edit row">Edit</button>
            <button class="btn btn-small btn-danger" onclick="deleteRow(${row.id})" title="Delete row">Delete</button>
        </div>
    `;
    rowDiv.appendChild(rowLabel);
    
    // Columns
    boardData.columns.forEach(column => {
        const columnElement = createColumnElement(row, column);
        rowDiv.appendChild(columnElement);
    });
    
    // Add mobile column headers (will be shown/hidden via CSS)
    const mobileColumnsContainer = document.createElement('div');
    mobileColumnsContainer.className = 'mobile-columns-container';
    
    boardData.columns.forEach(column => {
        const mobileColumnSection = document.createElement('div');
        mobileColumnSection.className = 'mobile-column-section';
        
        // Mobile column header
        const mobileColumnHeader = document.createElement('div');
        mobileColumnHeader.className = 'mobile-column-header';
        mobileColumnHeader.innerHTML = `
            <span class="mobile-column-title">${column.name}</span>
            <div class="mobile-column-actions">
                <button class="btn btn-small btn-secondary" onclick="showColumnOutline('${column.key}')" title="Show outline for this column">📝 Outline</button>
            </div>
        `;
        
        // Mobile column content
        const mobileColumnContent = document.createElement('div');
        mobileColumnContent.className = 'mobile-column-content';
        mobileColumnContent.dataset.rowId = row.id;
        mobileColumnContent.dataset.columnKey = column.key;
        
        // Add cards to mobile column
        const cards = row.cards[column.key] || [];
        cards.forEach(card => {
            const cardElement = createCardElement(card, row.id, column.key);
            mobileColumnContent.appendChild(cardElement);
        });
        
        // Add mobile add button
        const mobileAddButton = document.createElement('button');
        mobileAddButton.className = 'add-card-btn mobile-add-btn';
        mobileAddButton.textContent = '+ Add a card';
        mobileAddButton.onclick = () => openCardModal(row.id, column.key);
        mobileColumnContent.appendChild(mobileAddButton);
        
        // Setup SortableJS for mobile column
        setupColumnSorting(mobileColumnContent, row.id, column.key);
        
        mobileColumnSection.appendChild(mobileColumnHeader);
        mobileColumnSection.appendChild(mobileColumnContent);
        mobileColumnsContainer.appendChild(mobileColumnSection);
    });
    
    rowDiv.appendChild(mobileColumnsContainer);
    
    // Row sorting will be setup separately
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
    columnDiv.className = 'column';
    columnDiv.dataset.rowId = row.id;
    columnDiv.dataset.columnKey = column.key;
    
    // Create dedicated cards container
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'cards-container';
    cardsContainer.dataset.rowId = row.id;
    cardsContainer.dataset.columnKey = column.key;
    cardsContainer.style.cssText = 'flex: 1; min-height: 80px; display: flex; flex-direction: column; gap: 10px;';
    
    // Ensure cards array exists
    if (!row.cards[column.key]) {
        row.cards[column.key] = [];
    }
    
    // Add cards to the cards container
    const cards = row.cards[column.key] || [];
    cards.forEach(card => {
        const cardElement = createCardElement(card, row.id, column.key);
        cardsContainer.appendChild(cardElement);
    });
    
    columnDiv.appendChild(cardsContainer);
    
    // Add card button in separate footer
    const addButton = document.createElement('button');
    addButton.className = 'add-card-btn';
    addButton.textContent = '+ Add a card';
    addButton.onclick = () => openCardModal(row.id, column.key);
    
    const columnFooter = document.createElement('div');
    columnFooter.className = 'column-footer';
    columnFooter.appendChild(addButton);
    columnDiv.appendChild(columnFooter);
    
    // Setup SortableJS for the cards container only
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
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    // Remove draggable attribute - SortableJS will handle this
    cardDiv.dataset.cardId = card.id;
    cardDiv.dataset.rowId = rowId;
    cardDiv.dataset.columnKey = columnKey;
    
    if (card.completed) {
        cardDiv.classList.add('completed');
    }
    
    const checkboxHtml = boardData.settings.showCheckboxes ? `
        <div class="card-checkbox">
            <input type="checkbox" ${card.completed ? 'checked' : ''} 
                   onchange="toggleCardCompletion(${card.id}, ${rowId}, '${columnKey}')">
            <span>Completed</span>
        </div>
    ` : '';
    
    // Generate subtask progress using unified entity system
    let progressHtml = '';
    if (boardData.settings.showSubtaskProgress && card.taskIds && card.taskIds.length > 0) {
        const tasks = card.taskIds.map(taskId => appData.entities.tasks[taskId]).filter(Boolean);
        if (tasks.length > 0) {
            const completed = tasks.filter(task => task.completed).length;
            const total = tasks.length;
            const percentage = Math.round((completed / total) * 100);
            
            progressHtml = `
                <div class="card-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="progress-text">${completed}/${total} subtasks</span>
                </div>
            `;
        }
    }
    
    // Generate due date display
    let dueDateHtml = '';
    if (card.dueDate) {
        const dueDate = new Date(card.dueDate);
        const today = new Date();
        const isOverdue = dueDate < today;
        const isToday = dueDate.toDateString() === today.toDateString();
        
        let dueDateClass = 'card-due-date';
        if (isOverdue) dueDateClass += ' overdue';
        else if (isToday) dueDateClass += ' today';
        
        dueDateHtml = `
            <div class="${dueDateClass}">
                📅 ${dueDate.toLocaleDateString()}
            </div>
        `;
    }
    
    // Generate priority display
    let priorityHtml = '';
    if (card.priority && card.priority !== 'medium') {
        const priorityIcons = {
            'low': '🔵',
            'high': '🔴',
            'urgent': '⚡'
        };
        const priorityColors = {
            'low': '#4CAF50',
            'high': '#FF9800', 
            'urgent': '#F44336'
        };
        
        priorityHtml = `
            <div class="card-priority priority-${card.priority}" style="color: ${priorityColors[card.priority]}">
                ${priorityIcons[card.priority]} ${card.priority.toUpperCase()}
            </div>
        `;
    }

    cardDiv.innerHTML = `
        <div class="card-actions">
            <button onclick="editCard(${card.id}, ${rowId}, '${columnKey}')" title="Edit">✏️</button>
            <button onclick="deleteCard(${card.id}, ${rowId}, '${columnKey}')" title="Delete">🗑️</button>
        </div>
        <div class="card-content" onclick="showCardDetailModal(${card.id}, ${rowId}, '${columnKey}')">
            <div class="card-title">${card.title}</div>
            <div class="card-description">${card.description}</div>
            ${dueDateHtml}
            ${priorityHtml}
            ${progressHtml}
        </div>
        ${checkboxHtml}
    `;
    
    // SortableJS will handle drag events
    
    return cardDiv;
}

/**
 * Update CSS grid columns dynamically
 * Adjusts grid layout based on current number of columns
 */
export function updateCSSGridColumns() {
    const columnCount = boardData.columns.length;
    document.documentElement.style.setProperty('--column-count', columnCount);
    
    const headers = document.getElementById('columnHeaders');
    const rows = document.querySelectorAll('.board-row');
    
    headers.style.gridTemplateColumns = `200px repeat(${columnCount}, 1fr)`;
    rows.forEach(row => {
        row.style.gridTemplateColumns = `200px repeat(${columnCount}, 1fr)`;
    });
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
        subtasksList.innerHTML = '<div class="no-subtasks">No subtasks yet. Click "Add Subtask" to get started.</div>';
        return;
    }
    
    tasks.forEach((task, index) => {
        const subtaskElement = document.createElement('div');
        subtaskElement.className = `subtask-item ${task.completed ? 'completed' : ''}`;
        subtaskElement.dataset.taskId = task.id;
        subtaskElement.dataset.index = index;
        
        subtaskElement.innerHTML = `
            <div class="subtask-content">
                <input type="checkbox" ${task.completed ? 'checked' : ''} 
                       onchange="toggleSubtask('${task.id}')" class="subtask-checkbox">
                <span class="subtask-text ${task.completed ? 'completed' : ''}" 
                      onclick="startEditSubtask('${task.id}')">${task.text}</span>
            </div>
            <div class="subtask-edit-form" style="display: none;">
                <div class="subtask-input-group">
                    <input type="text" class="subtask-edit-input" value="${task.text}">
                    <div class="subtask-input-actions">
                        <button onclick="saveEditSubtask('${task.id}')" class="btn btn-small btn-primary">Save</button>
                        <button onclick="cancelEditSubtask('${task.id}')" class="btn btn-small btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>
            <div class="subtask-actions">
                <button onclick="startEditSubtask('${task.id}')" title="Edit subtask">✏️</button>
                <button onclick="deleteSubtask('${task.id}')" title="Delete subtask">🗑️</button>
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