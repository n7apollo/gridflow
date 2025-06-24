// Application state
let appData = {
    currentBoardId: 'default',
    boards: {
        'default': {
            name: 'My Board',
            groups: [],
            rows: [],
            columns: [],
            nextRowId: 1,
            nextCardId: 1,
            nextColumnId: 1,
            nextGroupId: 1,
            settings: {
                showCheckboxes: false,
                showSubtaskProgress: true
            }
        }
    }
};

// Current board reference for backward compatibility
let boardData = appData.boards[appData.currentBoardId];

let currentEditingCard = null;
let currentEditingRow = null;
let currentEditingColumn = null;
let currentEditingGroup = null;
let currentDetailCard = null; // Track card in detail modal
// SortableJS handles all drag state - no global variables needed

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
});

// Data persistence functions
function saveData() {
    try {
        localStorage.setItem('gridflow_data', JSON.stringify(appData));
        showStatusMessage('Data saved successfully', 'success');
    } catch (error) {
        console.error('Failed to save data:', error);
        showStatusMessage('Failed to save data', 'error');
    }
}

function loadData() {
    try {
        const saved = localStorage.getItem('gridflow_data');
        if (saved) {
            const savedData = JSON.parse(saved);
            
            // Check if it's old single-board format
            if (savedData.rows && !savedData.boards) {
                // Migrate old format to new multi-board format
                appData = {
                    currentBoardId: 'default',
                    boards: {
                        'default': {
                            name: 'My Board',
                            ...savedData
                        }
                    }
                };
            } else {
                appData = savedData;
            }
            
            // Ensure current board exists
            if (!appData.boards[appData.currentBoardId]) {
                appData.currentBoardId = Object.keys(appData.boards)[0] || 'default';
            }
            
            boardData = appData.boards[appData.currentBoardId];
            
            // Ensure all required properties exist
            if (!boardData.groups) boardData.groups = [];
            if (!boardData.columns) boardData.columns = [];
            if (!boardData.settings) boardData.settings = { showCheckboxes: false, showSubtaskProgress: true };
            if (!boardData.nextColumnId) boardData.nextColumnId = 1;
            if (!boardData.nextGroupId) boardData.nextGroupId = 1;
            
            // Migrate existing cards to include new fields
            Object.values(appData.boards).forEach(board => {
                if (board.rows) {
                    board.rows.forEach(row => {
                        if (row.cards) {
                            Object.keys(row.cards).forEach(columnKey => {
                                row.cards[columnKey].forEach(card => {
                                    if (card.dueDate === undefined) card.dueDate = null;
                                    if (card.priority === undefined) card.priority = 'medium';
                                    if (card.subtasks === undefined) card.subtasks = [];
                                });
                            });
                        }
                    });
                }
            });
        } else {
            initializeSampleData();
        }
        updateBoardTitle();
        renderBoard();
        updateSettingsUI();
    } catch (error) {
        console.error('Failed to load data:', error);
        initializeSampleData();
        renderBoard();
    }
}

// Initialize with sample data
function initializeSampleData() {
    appData = {
        currentBoardId: 'default',
        boards: {
            'default': {
                name: 'My Board',
        groups: [
            { id: 1, name: 'Communications', color: '#0079bf', collapsed: false },
            { id: 2, name: 'Development', color: '#61bd4f', collapsed: false },
            { id: 3, name: 'Marketing', color: '#eb5a46', collapsed: false }
        ],
        columns: [
            { id: 1, name: 'To Do', key: 'todo' },
            { id: 2, name: 'In Progress', key: 'inprogress' },
            { id: 3, name: 'Done', key: 'done' }
        ],
        rows: [
            {
                id: 1,
                name: 'Launch updated website version',
                description: 'Coordinate the public release of our redesigned company website with updated branding and improved user experience',
                groupId: 1,
                cards: {
                    todo: [
                        { id: 1, title: 'Create press release', description: 'Draft announcement for website launch', completed: false, subtasks: [
                            { text: 'Write initial draft', completed: true },
                            { text: 'Review with marketing team', completed: false },
                            { text: 'Get legal approval', completed: false }
                        ] },
                        { id: 2, title: 'Social media campaign', description: 'Plan social media posts', completed: false, subtasks: [] }
                    ],
                    inprogress: [
                        { id: 3, title: 'Update marketing materials', description: 'Refresh brochures and presentations', completed: false, subtasks: [
                            { text: 'Update company logo', completed: true },
                            { text: 'Revise product descriptions', completed: false }
                        ] }
                    ],
                    done: [
                        { id: 4, title: 'Website testing', description: 'Complete QA testing', completed: true, subtasks: [
                            { text: 'Cross-browser testing', completed: true },
                            { text: 'Mobile responsiveness', completed: true },
                            { text: 'Performance testing', completed: true }
                        ] }
                    ]
                }
            },
            {
                id: 2,
                name: 'Mobile App Development',
                description: 'Build cross-platform mobile application with user authentication, push notifications, and offline capabilities',
                groupId: 2,
                cards: {
                    todo: [
                        { id: 5, title: 'User authentication', description: 'Implement login and signup features', completed: false, subtasks: [
                            { text: 'Set up OAuth providers', completed: false },
                            { text: 'Create login form', completed: false },
                            { text: 'Add password reset', completed: false }
                        ] },
                        { id: 6, title: 'Push notifications', description: 'Set up notification system', completed: false, subtasks: [] }
                    ],
                    inprogress: [
                        { id: 7, title: 'Database setup', description: 'Configure backend database', completed: false, subtasks: [
                            { text: 'Design schema', completed: true },
                            { text: 'Set up migrations', completed: false }
                        ] }
                    ],
                    done: []
                }
            },
            {
                id: 3,
                name: 'API Documentation',
                description: 'Create comprehensive developer documentation for our REST API including examples and interactive testing',
                groupId: 2,
                cards: {
                    todo: [
                        { id: 8, title: 'Write API specs', description: 'Document all endpoints', completed: false, subtasks: [
                            { text: 'List all endpoints', completed: true },
                            { text: 'Document request/response', completed: false }
                        ] }
                    ],
                    inprogress: [],
                    done: [
                        { id: 9, title: 'Set up documentation site', description: 'Configure docs hosting', completed: true, subtasks: [] }
                    ]
                }
            },
            {
                id: 4,
                name: 'Q4 Campaign Planning',
                description: 'Develop marketing strategy and campaigns for Q4 including holiday promotions and year-end sales initiatives',
                groupId: 3,
                cards: {
                    todo: [
                        { id: 10, title: 'Market research', description: 'Analyze Q3 performance and trends', completed: false, subtasks: [
                            { text: 'Gather Q3 data', completed: true },
                            { text: 'Analyze trends', completed: false },
                            { text: 'Create report', completed: false }
                        ] },
                        { id: 11, title: 'Budget allocation', description: 'Plan Q4 marketing spend', completed: false, subtasks: [] }
                    ],
                    inprogress: [],
                    done: []
                }
            }
                ],
                nextRowId: 5,
                nextCardId: 12,
                nextColumnId: 4,
                nextGroupId: 4,
                settings: {
                    showCheckboxes: false,
                    showSubtaskProgress: true
                }
            }
        }
    };
    boardData = appData.boards[appData.currentBoardId];
}

// Render the entire board
function renderBoard() {
    renderColumnHeaders();
    renderGroupsAndRows();
    updateCSSGridColumns();
    
    // Initialize SortableJS for all columns after rendering
    setTimeout(() => {
        initializeAllSorting();
    }, 100);
    
    saveData();
}

function initializeAllSorting() {
    // Initialize sorting for all cards containers (desktop)
    document.querySelectorAll('.cards-container').forEach(cardsContainer => {
        const rowId = parseInt(cardsContainer.dataset.rowId);
        const columnKey = cardsContainer.dataset.columnKey;
        if (rowId && columnKey) {
            setupColumnSorting(cardsContainer, rowId, columnKey);
        }
    });
    
    // Initialize sorting for all mobile column content (mobile)
    document.querySelectorAll('.mobile-column-content').forEach(mobileColumn => {
        const rowId = parseInt(mobileColumn.dataset.rowId);
        const columnKey = mobileColumn.dataset.columnKey;
        if (rowId && columnKey) {
            setupColumnSorting(mobileColumn, rowId, columnKey);
        }
    });
}

// Render column headers
function renderColumnHeaders() {
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

// Render groups and rows with hierarchical structure
function renderGroupsAndRows() {
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

// Create group element
function createGroupElement(group) {
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

// Create row drop zone

// Create group drop zone

// Update CSS grid columns dynamically
function updateCSSGridColumns() {
    const columnCount = boardData.columns.length;
    document.documentElement.style.setProperty('--column-count', columnCount);
    
    const headers = document.getElementById('columnHeaders');
    const rows = document.querySelectorAll('.board-row');
    
    headers.style.gridTemplateColumns = `200px repeat(${columnCount}, 1fr)`;
    rows.forEach(row => {
        row.style.gridTemplateColumns = `200px repeat(${columnCount}, 1fr)`;
    });
}

// Create a row element
function createRowElement(row) {
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

// Create a column element
function createColumnElement(row, column) {
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

// Create a card element
function createCardElement(card, rowId, columnKey) {
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
    
    // Generate subtask progress
    let progressHtml = '';
    if (boardData.settings.showSubtaskProgress && card.subtasks && card.subtasks.length > 0) {
        const completed = card.subtasks.filter(st => st.completed).length;
        const total = card.subtasks.length;
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

// Toggle card completion
function toggleCardCompletion(cardId, rowId, columnKey) {
    const row = boardData.rows.find(r => r.id === rowId);
    if (!row || !row.cards[columnKey]) return;
    
    const card = row.cards[columnKey].find(c => c.id === cardId);
    if (card) {
        card.completed = !card.completed;
        renderBoard();
    }
}

// SortableJS setup functions
function setupColumnSorting(cardsContainer, rowId, columnKey) {
    new Sortable(cardsContainer, {
        group: {
            name: 'cards',
            pull: true,
            put: true
        },
        animation: 150,
        ghostClass: 'card-ghost',
        chosenClass: 'card-chosen',
        dragClass: 'card-drag',
        onEnd: function(evt) {
            const cardId = parseInt(evt.item.dataset.cardId);
            const fromRowId = parseInt(evt.from.dataset.rowId);
            const fromColumnKey = evt.from.dataset.columnKey;
            const toRowId = parseInt(evt.to.dataset.rowId);
            const toColumnKey = evt.to.dataset.columnKey;
            
            console.log('Card moved:', cardId, 'from', fromRowId, fromColumnKey, 'to', toRowId, toColumnKey);
            
            if (fromRowId !== toRowId || fromColumnKey !== toColumnKey) {
                moveCardBetweenRows(cardId, fromRowId, fromColumnKey, toRowId, toColumnKey);
            } else {
                // Just reorder within same column
                reorderCardsInColumn(toRowId, toColumnKey, evt.newIndex, evt.oldIndex);
            }
        }
    });
}

function setupRowSorting(container) {
    new Sortable(container, {
        group: 'rows',
        animation: 150,
        ghostClass: 'row-ghost',
        chosenClass: 'row-chosen',
        dragClass: 'row-drag',
        handle: '.row-label',
        onEnd: function(evt) {
            const rowId = parseInt(evt.item.dataset.rowId);
            console.log('Row moved:', rowId, 'from index', evt.oldIndex, 'to index', evt.newIndex);
            
            // Reorder rows in data structure
            const movedRow = boardData.rows.splice(evt.oldIndex, 1)[0];
            boardData.rows.splice(evt.newIndex, 0, movedRow);
            
            saveData();
        }
    });
}


function reorderCardsInColumn(rowId, columnKey, newIndex, oldIndex) {
    const row = boardData.rows.find(r => r.id === rowId);
    if (!row || !row.cards[columnKey]) return;
    
    const cards = row.cards[columnKey];
    const movedCard = cards.splice(oldIndex, 1)[0];
    cards.splice(newIndex, 0, movedCard);
    
    saveData();
}

// SortableJS handles all drop zone logic




// Move functions
function moveCard(cardId, rowId, fromColumn, toColumn) {
    const row = boardData.rows.find(r => r.id === rowId);
    if (!row) return;
    
    const cardIndex = row.cards[fromColumn].findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;
    
    const card = row.cards[fromColumn].splice(cardIndex, 1)[0];
    row.cards[toColumn].push(card);
    
    renderBoard();
}

function moveCardBetweenRows(cardId, fromRowId, fromColumn, toRowId, toColumn) {
    const fromRow = boardData.rows.find(r => r.id === fromRowId);
    const toRow = boardData.rows.find(r => r.id === toRowId);
    
    if (!fromRow || !toRow) {
        console.error('Row not found:', fromRowId, toRowId);
        return;
    }
    
    // Find and remove card from source
    const cardIndex = fromRow.cards[fromColumn].findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
        console.error('Card not found in source:', cardId, fromColumn);
        return;
    }
    
    const card = fromRow.cards[fromColumn].splice(cardIndex, 1)[0];
    
    // Ensure target column exists
    if (!toRow.cards[toColumn]) {
        toRow.cards[toColumn] = [];
    }
    
    // Add card to destination
    toRow.cards[toColumn].push(card);
    
    console.log('Moved card', cardId, 'from row', fromRowId, 'to row', toRowId);
    renderBoard();
}

function moveRow(rowId, targetGroupId, insertIndex) {
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
    renderBoard();
}

function moveRowToPosition(rowId, targetGroupId, insertIndex) {
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
    renderBoard();
}

function moveColumn(columnId, insertIndex) {
    const columnIndex = boardData.columns.findIndex(c => c.id === columnId);
    if (columnIndex === -1) return;
    
    const column = boardData.columns.splice(columnIndex, 1)[0];
    boardData.columns.splice(insertIndex, 0, column);
    
    renderBoard();
}

function moveColumnUp(index) {
    if (index <= 0) return;
    
    const column = boardData.columns.splice(index, 1)[0];
    boardData.columns.splice(index - 1, 0, column);
    
    renderBoard();
    renderColumnsList();
}

function moveColumnDown(index) {
    if (index >= boardData.columns.length - 1) return;
    
    const column = boardData.columns.splice(index, 1)[0];
    boardData.columns.splice(index + 1, 0, column);
    
    renderBoard();
    renderColumnsList();
}

function moveGroup(groupId, insertIndex) {
    const groupIndex = boardData.groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return;
    
    const group = boardData.groups.splice(groupIndex, 1)[0];
    boardData.groups.splice(insertIndex, 0, group);
    
    renderBoard();
}

function moveGroupUp(index) {
    if (index <= 0) return;
    
    const group = boardData.groups.splice(index, 1)[0];
    boardData.groups.splice(index - 1, 0, group);
    
    renderBoard();
    renderGroupsList();
    renderGroupsListModal();
}

function moveGroupDown(index) {
    if (index >= boardData.groups.length - 1) return;
    
    const group = boardData.groups.splice(index, 1)[0];
    boardData.groups.splice(index + 1, 0, group);
    
    renderBoard();
    renderGroupsList();
    renderGroupsListModal();
}

// Group functions
function toggleGroup(groupId) {
    const group = boardData.groups.find(g => g.id === groupId);
    if (group) {
        group.collapsed = !group.collapsed;
        renderBoard();
    }
}

function addGroup() {
    currentEditingGroup = null;
    document.getElementById('groupModalTitle').textContent = 'Add Group';
    document.getElementById('groupName').value = '';
    document.getElementById('groupColor').value = '#0079bf';
    document.getElementById('groupModal').style.display = 'block';
}

function editGroup(groupId) {
    const group = boardData.groups.find(g => g.id === groupId);
    if (!group) return;
    
    currentEditingGroup = group;
    document.getElementById('groupModalTitle').textContent = 'Edit Group';
    document.getElementById('groupName').value = group.name;
    document.getElementById('groupColor').value = group.color;
    document.getElementById('groupModal').style.display = 'block';
}

function deleteGroup(groupId) {
    const group = boardData.groups.find(g => g.id === groupId);
    if (!group) return;
    
    const groupRows = boardData.rows.filter(r => r.groupId === groupId);
    const message = groupRows.length > 0 
        ? `Are you sure you want to delete "${group.name}"? ${groupRows.length} rows will be moved to "No Group".`
        : `Are you sure you want to delete "${group.name}"?`;
    
    if (confirm(message)) {
        // Move rows out of group
        groupRows.forEach(row => {
            row.groupId = null;
        });
        
        // Remove group
        boardData.groups = boardData.groups.filter(g => g.id !== groupId);
        renderBoard();
        renderGroupsList();
    renderGroupsListModal();
    }
}

function saveGroup(event) {
    event.preventDefault();
    const name = document.getElementById('groupName').value.trim();
    const color = document.getElementById('groupColor').value;
    
    if (!name) return;
    
    if (currentEditingGroup) {
        currentEditingGroup.name = name;
        currentEditingGroup.color = color;
    } else {
        const newGroup = {
            id: boardData.nextGroupId++,
            name: name,
            color: color,
            collapsed: false
        };
        boardData.groups.push(newGroup);
    }
    
    closeGroupModal();
    renderBoard();
    renderGroupsList();
    renderGroupsListModal();
}

function closeGroupModal() {
    document.getElementById('groupModal').style.display = 'none';
    currentEditingGroup = null;
}

// Settings Modal functions
function showSettingsModal() {
    const modal = document.getElementById('settingsModal');
    modal.style.display = 'block';
    
    // Render content for all tabs
    renderColumnsListModal();
    renderGroupsListModal();
    updateModalSettingsUI();
    updateBoardInfo();
    
    // Check if mobile and initialize accordingly
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        // Start with tab list on mobile
        showMobileTabList();
    } else {
        // Show first tab by default on desktop
        switchTab('columns');
    }
}

function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

function switchTab(tabName) {
    // Check if we're on mobile
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Mobile navigation - show specific tab content
        showMobileTabContent(tabName);
    } else {
        // Desktop navigation - traditional tab switching
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }
}

function showMobileTabContent(tabName) {
    const settingsTabs = document.querySelector('.settings-tabs');
    const contentArea = document.querySelector('.settings-content-area');
    
    // Hide tab list and show content area
    settingsTabs.classList.add('mobile-hidden');
    contentArea.classList.add('mobile-active');
    
    // Show only the selected tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('mobile-current');
    });
    document.getElementById(`${tabName}-tab`).classList.add('mobile-current');
    
    // Update active tab button
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

function showMobileTabList() {
    const settingsTabs = document.querySelector('.settings-tabs');
    const contentArea = document.querySelector('.settings-content-area');
    
    // Show tab list and hide content area
    settingsTabs.classList.remove('mobile-hidden');
    contentArea.classList.remove('mobile-active');
    
    // Clear current mobile content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('mobile-current');
    });
}

// Handle window resize to switch between mobile and desktop modes
function handleSettingsResize() {
    const modal = document.getElementById('settingsModal');
    if (modal.style.display !== 'block') return;
    
    const isMobile = window.innerWidth <= 768;
    const settingsTabs = document.querySelector('.settings-tabs');
    const contentArea = document.querySelector('.settings-content-area');
    
    if (!isMobile) {
        // Switch to desktop mode
        settingsTabs.classList.remove('mobile-hidden');
        contentArea.classList.remove('mobile-active');
        
        // Reset mobile classes
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('mobile-current');
        });
        
        // Apply desktop active states
        const activeButton = document.querySelector('.tab-button.active');
        if (activeButton) {
            const tabName = activeButton.dataset.tab;
            document.getElementById(`${tabName}-tab`).classList.add('active');
        }
    } else {
        // Switch to mobile mode - show tab list by default
        showMobileTabList();
    }
}

// Add resize listener
window.addEventListener('resize', handleSettingsResize);

function toggleCheckboxes() {
    // Handle both old and new checkboxes
    const oldCheckbox = document.getElementById('showCheckboxes');
    const modalCheckbox = document.getElementById('showCheckboxesModal');
    
    let checked = false;
    if (oldCheckbox && oldCheckbox.checked !== undefined) {
        checked = oldCheckbox.checked;
    } else if (modalCheckbox && modalCheckbox.checked !== undefined) {
        checked = modalCheckbox.checked;
    }
    
    boardData.settings.showCheckboxes = checked;
    
    // Sync both checkboxes
    if (oldCheckbox) oldCheckbox.checked = checked;
    if (modalCheckbox) modalCheckbox.checked = checked;
    
    renderBoard();
}

function toggleSubtaskProgress() {
    // Handle both old and new checkboxes
    const oldCheckbox = document.getElementById('showSubtaskProgress');
    const modalCheckbox = document.getElementById('showSubtaskProgressModal');
    
    let checked = false;
    if (oldCheckbox && oldCheckbox.checked !== undefined) {
        checked = oldCheckbox.checked;
    } else if (modalCheckbox && modalCheckbox.checked !== undefined) {
        checked = modalCheckbox.checked;
    }
    
    boardData.settings.showSubtaskProgress = checked;
    
    // Sync both checkboxes
    if (oldCheckbox) oldCheckbox.checked = checked;
    if (modalCheckbox) modalCheckbox.checked = checked;
    
    renderBoard();
}

function updateSettingsUI() {
    const checkbox = document.getElementById('showCheckboxes');
    if (checkbox) {
        checkbox.checked = boardData.settings.showCheckboxes;
    }
    
    const subtaskCheckbox = document.getElementById('showSubtaskProgress');
    if (subtaskCheckbox) {
        subtaskCheckbox.checked = boardData.settings.showSubtaskProgress;
    }
}

function updateModalSettingsUI() {
    const checkboxModal = document.getElementById('showCheckboxesModal');
    if (checkboxModal) {
        checkboxModal.checked = boardData.settings.showCheckboxes;
    }
    
    const subtaskCheckboxModal = document.getElementById('showSubtaskProgressModal');
    if (subtaskCheckboxModal) {
        subtaskCheckboxModal.checked = boardData.settings.showSubtaskProgress;
    }
}

function saveBoardName() {
    const input = document.getElementById('boardNameInput');
    const newName = input.value.trim();
    
    if (!newName) {
        alert('Please enter a board name');
        return;
    }
    
    boardData.name = newName;
    saveData();
    updateBoardTitle();
    alert('Board name saved successfully!');
}

function updateBoardInfo() {
    // Set board name in input
    const nameInput = document.getElementById('boardNameInput');
    if (nameInput) {
        nameInput.value = boardData.name || 'My Board';
    }
    
    // Calculate and display stats
    const rowCount = boardData.rows ? boardData.rows.length : 0;
    const cardCount = boardData.rows ? boardData.rows.reduce((total, row) => {
        return total + Object.values(row.cards || {}).reduce((rowTotal, cards) => rowTotal + cards.length, 0);
    }, 0) : 0;
    
    document.getElementById('boardRowCount').textContent = rowCount;
    document.getElementById('boardCardCount').textContent = cardCount;
    
    // For now, we don't track creation date, so show when the board was initialized
    document.getElementById('boardCreatedDate').textContent = 'Not available';
}

// Column management
function renderColumnsList() {
    const container = document.getElementById('columnsList');
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

// Modal versions of list renderers
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

function renderGroupsListModal() {
    const container = document.getElementById('groupsListModal');
    if (!container) return;
    
    container.innerHTML = '';
    
    boardData.groups.forEach((group, index) => {
        const item = document.createElement('div');
        item.className = 'group-item';
        item.style.borderLeftColor = group.color;
        item.innerHTML = `
            <span class="group-item-name">${group.name}</span>
            <div class="group-item-actions">
                <div class="reorder-controls">
                    <button class="reorder-btn" onclick="moveGroupUp(${index})" ${index === 0 ? 'disabled' : ''} title="Move up">↑</button>
                    <button class="reorder-btn" onclick="moveGroupDown(${index})" ${index === boardData.groups.length - 1 ? 'disabled' : ''} title="Move down">↓</button>
                </div>
                <button class="btn btn-small btn-secondary" onclick="editGroup(${group.id})">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteGroup(${group.id})">Delete</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function renderGroupsList() {
    const container = document.getElementById('groupsList');
    container.innerHTML = '';
    
    boardData.groups.forEach((group, index) => {
        const item = document.createElement('div');
        item.className = 'group-item';
        item.style.borderLeftColor = group.color;
        item.innerHTML = `
            <span class="group-item-name">${group.name}</span>
            <div class="group-item-actions">
                <div class="reorder-controls">
                    <button class="reorder-btn" onclick="moveGroupUp(${index})" ${index === 0 ? 'disabled' : ''} title="Move up">↑</button>
                    <button class="reorder-btn" onclick="moveGroupDown(${index})" ${index === boardData.groups.length - 1 ? 'disabled' : ''} title="Move down">↓</button>
                </div>
                <button class="btn btn-small btn-secondary" onclick="editGroup(${group.id})">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteGroup(${group.id})">Delete</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function addColumn() {
    currentEditingColumn = null;
    document.getElementById('columnModalTitle').textContent = 'Add Column';
    document.getElementById('columnName').value = '';
    document.getElementById('columnModal').style.display = 'block';
}

function editColumn(columnId) {
    const column = boardData.columns.find(c => c.id === columnId);
    if (!column) return;
    
    currentEditingColumn = column;
    document.getElementById('columnModalTitle').textContent = 'Edit Column';
    document.getElementById('columnName').value = column.name;
    document.getElementById('columnModal').style.display = 'block';
}

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
            
            renderBoard();
            renderColumnsList();
            renderColumnsListModal();
        }
    }
}

function saveColumn(event) {
    event.preventDefault();
    const name = document.getElementById('columnName').value.trim();
    
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
    renderBoard();
    renderColumnsList();
    renderColumnsListModal();
}

function closeColumnModal() {
    document.getElementById('columnModal').style.display = 'none';
    currentEditingColumn = null;
}

// CRUD Operations for Rows
function populateGroupSelect() {
    const select = document.getElementById('rowGroup');
    select.innerHTML = '<option value="">No Group</option>';
    
    boardData.groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        select.appendChild(option);
    });
}

function addRow() {
    currentEditingRow = null;
    document.getElementById('rowModalTitle').textContent = 'Add Row';
    document.getElementById('rowName').value = '';
    document.getElementById('rowDescription').value = '';
    populateGroupSelect();
    document.getElementById('rowGroup').value = '';
    document.getElementById('rowModal').style.display = 'block';
}

function editRow(rowId) {
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

function deleteRow(rowId) {
    if (confirm('Are you sure you want to delete this row? All cards will be lost.')) {
        boardData.rows = boardData.rows.filter(r => r.id !== rowId);
        renderBoard();
    }
}

function saveRow(event) {
    event.preventDefault();
    const name = document.getElementById('rowName').value.trim();
    const description = document.getElementById('rowDescription').value.trim();
    const groupId = document.getElementById('rowGroup').value ? parseInt(document.getElementById('rowGroup').value) : null;
    
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
    renderBoard();
}

function closeRowModal() {
    document.getElementById('rowModal').style.display = 'none';
    currentEditingRow = null;
}

// CRUD Operations for Cards
function openCardModal(rowId, columnKey, cardId = null) {
    const row = boardData.rows.find(r => r.id === rowId);
    if (!row) return;
    
    if (cardId) {
        const card = row.cards[columnKey].find(c => c.id === cardId);
        if (!card) return;
        
        currentEditingCard = { ...card, rowId, columnKey };
        document.getElementById('modalTitle').textContent = 'Edit Card';
        document.getElementById('cardTitle').value = card.title;
        document.getElementById('cardDescription').value = card.description;
        document.getElementById('cardCompleted').checked = card.completed || false;
        document.getElementById('cardDueDate').value = card.dueDate || '';
        document.getElementById('cardPriority').value = card.priority || 'medium';
    } else {
        currentEditingCard = { rowId, columnKey };
        document.getElementById('modalTitle').textContent = 'Add Card';
        document.getElementById('cardTitle').value = '';
        document.getElementById('cardDescription').value = '';
        document.getElementById('cardCompleted').checked = false;
        document.getElementById('cardDueDate').value = '';
        document.getElementById('cardPriority').value = 'medium';
    }
    
    document.getElementById('cardModal').style.display = 'block';
}

function editCard(cardId, rowId, columnKey) {
    openCardModal(rowId, columnKey, cardId);
}

function deleteCard(cardId, rowId, columnKey) {
    if (confirm('Are you sure you want to delete this card?')) {
        const row = boardData.rows.find(r => r.id === rowId);
        if (row) {
            row.cards[columnKey] = row.cards[columnKey].filter(c => c.id !== cardId);
            renderBoard();
        }
    }
}

function saveCard(event) {
    event.preventDefault();
    const title = document.getElementById('cardTitle').value.trim();
    const description = document.getElementById('cardDescription').value.trim();
    const completed = document.getElementById('cardCompleted').checked;
    const dueDate = document.getElementById('cardDueDate').value || null;
    const priority = document.getElementById('cardPriority').value;
    
    if (!title) return;
    
    const row = boardData.rows.find(r => r.id === currentEditingCard.rowId);
    if (!row) return;
    
    if (currentEditingCard.id) {
        // Edit existing card
        const card = row.cards[currentEditingCard.columnKey].find(c => c.id === currentEditingCard.id);
        if (card) {
            card.title = title;
            card.description = description;
            card.completed = completed;
            card.dueDate = dueDate;
            card.priority = priority;
        }
    } else {
        // Add new card
        const newCard = {
            id: boardData.nextCardId++,
            title: title,
            description: description,
            completed: completed,
            subtasks: [],
            dueDate: null,
            priority: 'medium'
        };
        row.cards[currentEditingCard.columnKey].push(newCard);
    }
    
    closeModal();
    renderBoard();
}

function closeModal() {
    document.getElementById('cardModal').style.display = 'none';
    currentEditingCard = null;
}

// Card detail modal functions
function showCardDetailModal(cardId, rowId, columnKey) {
    const row = boardData.rows.find(r => r.id === rowId);
    if (!row) return;
    
    const card = row.cards[columnKey].find(c => c.id === cardId);
    if (!card) return;
    
    const column = boardData.columns.find(c => c.key === columnKey);
    if (!column) return;
    
    // Store current card reference
    currentDetailCard = { card, rowId, columnKey };
    
    // Ensure subtasks array exists
    if (!card.subtasks) card.subtasks = [];
    
    // Find group information
    const group = row.groupId ? boardData.groups.find(g => g.id === row.groupId) : null;
    
    // Populate modal content
    document.getElementById('cardDetailTitle').textContent = card.title;
    document.getElementById('cardDetailDescription').textContent = card.description || 'No description provided';
    document.getElementById('cardDetailGroup').textContent = group ? group.name : 'No Group';
    document.getElementById('cardDetailRow').textContent = row.name;
    document.getElementById('cardDetailColumn').textContent = column.name;
    
    // Update status badge
    const statusElement = document.getElementById('cardDetailCompletionStatus');
    if (card.completed) {
        statusElement.textContent = 'Completed';
        statusElement.className = 'status-badge completed';
    } else {
        statusElement.textContent = 'Pending';
        statusElement.className = 'status-badge pending';
    }
    
    // Set up action buttons
    const editBtn = document.getElementById('editCardFromDetailBtn');
    const deleteBtn = document.getElementById('deleteCardFromDetailBtn');
    
    editBtn.onclick = () => {
        closeCardDetailModal();
        editCard(cardId, rowId, columnKey);
    };
    
    deleteBtn.onclick = () => {
        closeCardDetailModal();
        deleteCard(cardId, rowId, columnKey);
    };
    
    // Setup add subtask button and form
    const addSubtaskBtn = document.getElementById('addSubtaskBtn');
    const saveSubtaskBtn = document.getElementById('saveSubtaskBtn');
    const cancelSubtaskBtn = document.getElementById('cancelSubtaskBtn');
    const newSubtaskInput = document.getElementById('newSubtaskInput');
    
    addSubtaskBtn.onclick = () => showAddSubtaskForm();
    saveSubtaskBtn.onclick = () => saveNewSubtask();
    cancelSubtaskBtn.onclick = () => hideAddSubtaskForm();
    
    // Handle enter key in input
    newSubtaskInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveNewSubtask();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            hideAddSubtaskForm();
        }
    };
    
    // Render subtasks
    renderSubtasks();
    
    // Show modal
    document.getElementById('cardDetailModal').style.display = 'block';
}

function closeCardDetailModal() {
    document.getElementById('cardDetailModal').style.display = 'none';
    
    // Hide add subtask form if it's open
    hideAddSubtaskForm();
    
    currentDetailCard = null;
}

// Subtask functions
function renderSubtasks() {
    if (!currentDetailCard) return;
    
    const subtasksList = document.getElementById('subtasksList');
    subtasksList.innerHTML = '';
    
    const subtasks = currentDetailCard.card.subtasks || [];
    
    if (subtasks.length === 0) {
        subtasksList.innerHTML = '<div class="no-subtasks">No subtasks yet. Click "Add Subtask" to get started.</div>';
        return;
    }
    
    subtasks.forEach((subtask, index) => {
        const subtaskElement = document.createElement('div');
        subtaskElement.className = `subtask-item ${subtask.completed ? 'completed' : ''}`;
        subtaskElement.dataset.index = index;
        
        subtaskElement.innerHTML = `
            <div class="subtask-content">
                <input type="checkbox" ${subtask.completed ? 'checked' : ''} 
                       onchange="toggleSubtask(${index})" class="subtask-checkbox">
                <span class="subtask-text ${subtask.completed ? 'completed' : ''}" 
                      onclick="startEditSubtask(${index})">${subtask.text}</span>
            </div>
            <div class="subtask-edit-form" style="display: none;">
                <div class="subtask-input-group">
                    <input type="text" class="subtask-edit-input" value="${subtask.text}">
                    <div class="subtask-input-actions">
                        <button onclick="saveEditSubtask(${index})" class="btn btn-small btn-primary">Save</button>
                        <button onclick="cancelEditSubtask(${index})" class="btn btn-small btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>
            <div class="subtask-actions">
                <button onclick="startEditSubtask(${index})" title="Edit subtask">✏️</button>
                <button onclick="deleteSubtask(${index})" title="Delete subtask">🗑️</button>
            </div>
        `;
        subtasksList.appendChild(subtaskElement);
    });
}

// Add subtask form functions
function showAddSubtaskForm() {
    const form = document.getElementById('addSubtaskForm');
    const input = document.getElementById('newSubtaskInput');
    const button = document.getElementById('addSubtaskBtn');
    
    form.style.display = 'block';
    button.style.display = 'none';
    input.value = '';
    input.focus();
}

function hideAddSubtaskForm() {
    const form = document.getElementById('addSubtaskForm');
    const button = document.getElementById('addSubtaskBtn');
    
    if (form) form.style.display = 'none';
    if (button) button.style.display = 'inline-block';
}

function saveNewSubtask() {
    if (!currentDetailCard) return;
    
    const input = document.getElementById('newSubtaskInput');
    const text = input.value.trim();
    
    if (!text) {
        input.focus();
        return;
    }
    
    if (!currentDetailCard.card.subtasks) {
        currentDetailCard.card.subtasks = [];
    }
    
    currentDetailCard.card.subtasks.push({
        text: text,
        completed: false
    });
    
    saveData();
    hideAddSubtaskForm();
    renderSubtasks();
    renderBoard(); // Update progress on cards
}

// Edit subtask inline functions
function startEditSubtask(index) {
    const subtaskItem = document.querySelector(`[data-index="${index}"]`);
    if (!subtaskItem) return;
    
    const content = subtaskItem.querySelector('.subtask-content');
    const editForm = subtaskItem.querySelector('.subtask-edit-form');
    const actions = subtaskItem.querySelector('.subtask-actions');
    const editInput = subtaskItem.querySelector('.subtask-edit-input');
    
    content.style.display = 'none';
    actions.style.display = 'none';
    editForm.style.display = 'block';
    editInput.focus();
    editInput.select();
    
    // Handle enter/escape keys
    editInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEditSubtask(index);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEditSubtask(index);
        }
    };
}

function saveEditSubtask(index) {
    if (!currentDetailCard || !currentDetailCard.card.subtasks[index]) return;
    
    const subtaskItem = document.querySelector(`[data-index="${index}"]`);
    const editInput = subtaskItem.querySelector('.subtask-edit-input');
    const newText = editInput.value.trim();
    
    if (!newText) {
        editInput.focus();
        return;
    }
    
    currentDetailCard.card.subtasks[index].text = newText;
    saveData();
    renderSubtasks();
    renderBoard(); // Update progress on cards
}

function cancelEditSubtask(index) {
    const subtaskItem = document.querySelector(`[data-index="${index}"]`);
    if (!subtaskItem) return;
    
    const content = subtaskItem.querySelector('.subtask-content');
    const editForm = subtaskItem.querySelector('.subtask-edit-form');
    const actions = subtaskItem.querySelector('.subtask-actions');
    
    editForm.style.display = 'none';
    content.style.display = 'flex';
    actions.style.display = 'flex';
}

function deleteSubtask(index) {
    if (!currentDetailCard || !currentDetailCard.card.subtasks[index]) return;
    
    if (confirm('Are you sure you want to delete this subtask?')) {
        currentDetailCard.card.subtasks.splice(index, 1);
        saveData();
        renderSubtasks();
        renderBoard(); // Update progress on cards
    }
}

function toggleSubtask(index) {
    if (!currentDetailCard || !currentDetailCard.card.subtasks[index]) return;
    
    currentDetailCard.card.subtasks[index].completed = !currentDetailCard.card.subtasks[index].completed;
    saveData();
    renderSubtasks();
    renderBoard(); // Update progress on cards
}

// Export functions
function showExportModal() {
    document.getElementById('exportModal').style.display = 'block';
}

function closeExportModal() {
    document.getElementById('exportModal').style.display = 'none';
}

async function exportToPDF() {
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

async function exportToPNG() {
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

function exportToExcel() {
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

function exportToJSON() {
    try {
        // Export all boards with metadata
        const exportData = {
            ...appData,
            exportedAt: new Date().toISOString(),
            exportedFrom: 'GridFlow',
            version: '2.0'
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

function importFromJSON() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Check if it's new multi-board format or old single-board format
            if (importedData.boards) {
                // New multi-board format
                appData = importedData;
                
                // Ensure current board exists
                if (!appData.boards[appData.currentBoardId]) {
                    appData.currentBoardId = Object.keys(appData.boards)[0] || 'default';
                }
                
                boardData = appData.boards[appData.currentBoardId];
                
                const boardCount = Object.keys(appData.boards).length;
                const importDate = importedData.exportedAt ? new Date(importedData.exportedAt).toLocaleDateString() : 'Unknown date';
                showStatusMessage(`${boardCount} boards imported successfully! (Backup from ${importDate})`, 'success');
            } else if (importedData.rows || importedData.columns) {
                // Old single-board format - import as new board or replace current
                const shouldReplace = confirm('This appears to be a single board backup. Replace current board or import as new board?\n\nOK = Replace current board\nCancel = Import as new board');
                
                if (shouldReplace) {
                    // Replace current board
                    appData.boards[appData.currentBoardId] = {
                        name: appData.boards[appData.currentBoardId].name,
                        ...importedData
                    };
                    boardData = appData.boards[appData.currentBoardId];
                } else {
                    // Import as new board
                    const newBoardId = 'imported_' + Date.now();
                    const boardName = prompt('Enter name for imported board:', 'Imported Board') || 'Imported Board';
                    appData.boards[newBoardId] = {
                        name: boardName,
                        ...importedData
                    };
                    appData.currentBoardId = newBoardId;
                    boardData = appData.boards[newBoardId];
                }
                
                const importDate = importedData.exportedAt ? new Date(importedData.exportedAt).toLocaleDateString() : 'Unknown date';
                showStatusMessage(`Board imported successfully! (Backup from ${importDate})`, 'success');
            } else {
                throw new Error('Invalid data format');
            }
            
            // Ensure all required properties exist on current board
            if (!boardData.groups) boardData.groups = [];
            if (!boardData.settings) boardData.settings = { showCheckboxes: false, showSubtaskProgress: true };
            if (!boardData.nextRowId) boardData.nextRowId = boardData.rows && boardData.rows.length > 0 ? Math.max(...boardData.rows.map(r => r.id)) + 1 : 1;
            if (!boardData.nextCardId) {
                let maxCardId = 0;
                if (boardData.rows) {
                    boardData.rows.forEach(row => {
                        Object.values(row.cards || {}).forEach(cards => {
                            cards.forEach(card => {
                                if (card.id > maxCardId) maxCardId = card.id;
                            });
                        });
                    });
                }
                boardData.nextCardId = maxCardId + 1;
            }
            if (!boardData.nextColumnId) boardData.nextColumnId = boardData.columns && boardData.columns.length > 0 ? Math.max(...boardData.columns.map(c => c.id)) + 1 : 1;
            if (!boardData.nextGroupId) boardData.nextGroupId = boardData.groups && boardData.groups.length > 0 ? Math.max(...boardData.groups.map(g => g.id)) + 1 : 1;
            
            updateBoardTitle();
            renderBoard();
            updateSettingsUI();
            saveData();
            fileInput.value = '';
        } catch (error) {
            console.error('Import failed:', error);
            showStatusMessage('Import failed: Invalid file format', 'error');
        }
    };
    reader.readAsText(file);
    closeExportModal();
}

// Utility functions
function showStatusMessage(message, type = 'info') {
    // Remove existing messages
    const existing = document.querySelector('.status-message');
    if (existing) {
        existing.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `status-message ${type}`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Setup event listeners
function setupEventListeners() {
    // Card form
    document.getElementById('cardForm').addEventListener('submit', saveCard);
    
    // Row form
    document.getElementById('rowForm').addEventListener('submit', saveRow);
    
    // Column form
    document.getElementById('columnForm').addEventListener('submit', saveColumn);
    
    // Group form
    document.getElementById('groupForm').addEventListener('submit', saveGroup);
    
    // Board edit form
    document.getElementById('boardEditForm').addEventListener('submit', saveBoardEdit);
    
    // Modal close on outside click
    window.addEventListener('click', function(event) {
        const cardModal = document.getElementById('cardModal');
        const rowModal = document.getElementById('rowModal');
        const columnModal = document.getElementById('columnModal');
        const groupModal = document.getElementById('groupModal');
        const exportModal = document.getElementById('exportModal');
        const outlineModal = document.getElementById('outlineModal');
        const boardModal = document.getElementById('boardModal');
        const boardEditModal = document.getElementById('boardEditModal');
        
        if (event.target === cardModal) closeModal();
        if (event.target === rowModal) closeRowModal();
        if (event.target === columnModal) closeColumnModal();
        if (event.target === groupModal) closeGroupModal();
        if (event.target === exportModal) closeExportModal();
        if (event.target === outlineModal) closeOutlineModal();
        if (event.target === boardModal) closeBoardModal();
        if (event.target === boardEditModal) closeBoardEditModal();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
            closeRowModal();
            closeColumnModal();
            closeGroupModal();
            closeExportModal();
            closeOutlineModal();
            closeBoardModal();
            closeBoardEditModal();
            
            const settingsPanel = document.getElementById('settingsPanel');
            if (settingsPanel.classList.contains('active')) {
                toggleSettings();
            }
        }
    });
}

// Column Outline Functions
let currentOutlineData = { html: '', plain: '', markdown: '' };

function showColumnOutline(columnKey) {
    const column = boardData.columns.find(c => c.key === columnKey);
    if (!column) return;
    
    // Set modal title
    document.getElementById('outlineModalTitle').textContent = `${column.name} - Column Outline`;
    
    // Generate outline data
    const outlineData = generateColumnOutline(columnKey);
    currentOutlineData = outlineData;
    
    // Display HTML outline
    document.getElementById('outlineContent').innerHTML = outlineData.html;
    
    // Show modal
    document.getElementById('outlineModal').style.display = 'block';
}

function generateColumnOutline(columnKey) {
    let html = '<ul>';
    let plain = '';
    let markdown = '';
    
    // First, add ungrouped rows
    const ungroupedRows = boardData.rows.filter(row => !row.groupId);
    ungroupedRows.forEach(row => {
        const cards = row.cards[columnKey] || [];
        if (cards.length > 0) {
            html += `<li>${escapeHtml(row.name)}`;
            plain += `• ${row.name}\n`;
            markdown += `- ${row.name}\n`;
            
            if (cards.length > 0) {
                html += '<ul>';
                cards.forEach(card => {
                    const cardText = card.completed ? `✓ ${card.title}` : card.title;
                    html += `<li>${escapeHtml(cardText)}</li>`;
                    plain += `  ○ ${cardText}\n`;
                    markdown += `  - ${cardText}\n`;
                });
                html += '</ul>';
            }
            html += '</li>';
        }
    });
    
    // Then, add grouped rows
    boardData.groups.forEach(group => {
        const groupRows = boardData.rows.filter(row => row.groupId === group.id);
        const groupHasCards = groupRows.some(row => {
            const cards = row.cards[columnKey] || [];
            return cards.length > 0;
        });
        
        if (groupHasCards) {
            html += `<li><strong>${escapeHtml(group.name)}</strong>`;
            plain += `• ${group.name}\n`;
            markdown += `- **${group.name}**\n`;
            
            html += '<ul>';
            groupRows.forEach(row => {
                const cards = row.cards[columnKey] || [];
                if (cards.length > 0) {
                    html += `<li>${escapeHtml(row.name)}`;
                    plain += `  ○ ${row.name}\n`;
                    markdown += `  - ${row.name}\n`;
                    
                    if (cards.length > 0) {
                        html += '<ul>';
                        cards.forEach(card => {
                            const cardText = card.completed ? `✓ ${card.title}` : card.title;
                            html += `<li>${escapeHtml(cardText)}</li>`;
                            plain += `    ■ ${cardText}\n`;
                            markdown += `    - ${cardText}\n`;
                        });
                        html += '</ul>';
                    }
                    html += '</li>';
                }
            });
            html += '</ul>';
            html += '</li>';
        }
    });
    
    html += '</ul>';
    
    return { html, plain, markdown };
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function closeOutlineModal() {
    document.getElementById('outlineModal').style.display = 'none';
}

async function copyOutlineAsFormatted() {
    try {
        // Try to copy as HTML if supported
        if (navigator.clipboard && navigator.clipboard.write) {
            const htmlBlob = new Blob([currentOutlineData.html], { type: 'text/html' });
            const textBlob = new Blob([currentOutlineData.plain], { type: 'text/plain' });
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': htmlBlob,
                    'text/plain': textBlob
                })
            ]);
        } else {
            // Fallback to plain text
            await copyToClipboard(currentOutlineData.plain);
        }
        showStatusMessage('Formatted outline copied to clipboard!', 'success');
    } catch (err) {
        console.error('Failed to copy formatted outline:', err);
        showStatusMessage('Failed to copy outline', 'error');
    }
}

async function copyOutlineAsPlain() {
    try {
        await copyToClipboard(currentOutlineData.plain);
        showStatusMessage('Plain text outline copied to clipboard!', 'success');
    } catch (err) {
        console.error('Failed to copy plain outline:', err);
        showStatusMessage('Failed to copy outline', 'error');
    }
}

async function copyOutlineAsMarkdown() {
    try {
        await copyToClipboard(currentOutlineData.markdown);
        showStatusMessage('Markdown outline copied to clipboard!', 'success');
    } catch (err) {
        console.error('Failed to copy markdown outline:', err);
        showStatusMessage('Failed to copy outline', 'error');
    }
}

async function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

// Board Management Functions
let currentEditingBoard = null;

function updateBoardTitle() {
    const currentBoard = appData.boards[appData.currentBoardId];
    if (currentBoard) {
        document.title = `${currentBoard.name} - GridFlow`;
    }
    updateBoardSelector();
}

function updateBoardSelector() {
    const selector = document.getElementById('boardSelect');
    selector.innerHTML = '';
    
    Object.entries(appData.boards).forEach(([boardId, board]) => {
        const option = document.createElement('option');
        option.value = boardId;
        option.textContent = board.name;
        option.selected = boardId === appData.currentBoardId;
        selector.appendChild(option);
    });
}

function switchBoard(boardId) {
    if (appData.boards[boardId]) {
        appData.currentBoardId = boardId;
        boardData = appData.boards[boardId];
        updateBoardTitle();
        renderBoard();
        updateSettingsUI();
        saveData();
    }
}

function showBoardModal() {
    renderBoardsList();
    document.getElementById('boardModal').style.display = 'block';
}

function closeBoardModal() {
    document.getElementById('boardModal').style.display = 'none';
}

function renderBoardsList() {
    const container = document.getElementById('boardsList');
    container.innerHTML = '';
    
    Object.entries(appData.boards).forEach(([boardId, board]) => {
        const boardItem = document.createElement('div');
        boardItem.className = `board-item ${boardId === appData.currentBoardId ? 'current' : ''}`;
        
        const rowCount = board.rows ? board.rows.length : 0;
        const cardCount = board.rows ? board.rows.reduce((total, row) => {
            return total + Object.values(row.cards || {}).reduce((rowTotal, cards) => rowTotal + cards.length, 0);
        }, 0) : 0;
        
        boardItem.innerHTML = `
            <div class="board-item-info">
                <div class="board-item-name">${board.name}</div>
                <div class="board-item-meta">${rowCount} rows, ${cardCount} cards</div>
            </div>
            <div class="board-item-actions">
                ${boardId === appData.currentBoardId ? '<span class="btn btn-small btn-primary">Current</span>' : `<button class="btn btn-small btn-secondary" onclick="switchBoard('${boardId}'); closeBoardModal();">Switch</button>`}
                <button class="btn btn-small btn-secondary" onclick="editBoard('${boardId}')" title="Edit board">✏️</button>
                ${Object.keys(appData.boards).length > 1 ? `<button class="btn btn-small btn-danger" onclick="deleteBoard('${boardId}')" title="Delete board">🗑️</button>` : ''}
            </div>
        `;
        
        container.appendChild(boardItem);
    });
}

function createNewBoard() {
    currentEditingBoard = null;
    document.getElementById('boardEditModalTitle').textContent = 'Create New Board';
    document.getElementById('boardEditName').value = '';
    document.getElementById('boardEditModal').style.display = 'block';
    closeBoardModal();
}

function editBoard(boardId) {
    const board = appData.boards[boardId];
    if (!board) return;
    
    currentEditingBoard = boardId;
    document.getElementById('boardEditModalTitle').textContent = 'Edit Board';
    document.getElementById('boardEditName').value = board.name;
    document.getElementById('boardEditModal').style.display = 'block';
    closeBoardModal();
}

function deleteBoard(boardId) {
    if (Object.keys(appData.boards).length <= 1) {
        showStatusMessage('Cannot delete the last board', 'error');
        return;
    }
    
    const board = appData.boards[boardId];
    if (!board) return;
    
    if (confirm(`Are you sure you want to delete "${board.name}"? This action cannot be undone.`)) {
        delete appData.boards[boardId];
        
        // Switch to another board if current board was deleted
        if (appData.currentBoardId === boardId) {
            appData.currentBoardId = Object.keys(appData.boards)[0];
            boardData = appData.boards[appData.currentBoardId];
            updateBoardTitle();
            renderBoard();
            updateSettingsUI();
        }
        
        saveData();
        renderBoardsList();
        showStatusMessage('Board deleted successfully', 'success');
    }
}

function closeBoardEditModal() {
    document.getElementById('boardEditModal').style.display = 'none';
    currentEditingBoard = null;
}

function saveBoardEdit(event) {
    event.preventDefault();
    const name = document.getElementById('boardEditName').value.trim();
    
    if (!name) return;
    
    if (currentEditingBoard) {
        // Edit existing board
        appData.boards[currentEditingBoard].name = name;
        showStatusMessage('Board updated successfully', 'success');
    } else {
        // Create new board
        const newBoardId = 'board_' + Date.now();
        appData.boards[newBoardId] = {
            name: name,
            groups: [],
            rows: [],
            columns: [
                { id: 1, name: 'To Do', key: 'todo' },
                { id: 2, name: 'In Progress', key: 'inprogress' },
                { id: 3, name: 'Done', key: 'done' }
            ],
            nextRowId: 1,
            nextCardId: 1,
            nextColumnId: 4,
            nextGroupId: 1,
            settings: {
                showCheckboxes: false,
                showSubtaskProgress: true
            }
        };
        
        // Switch to new board
        appData.currentBoardId = newBoardId;
        boardData = appData.boards[newBoardId];
        updateBoardTitle();
        renderBoard();
        updateSettingsUI();
        showStatusMessage('New board created successfully', 'success');
    }
    
    saveData();
    closeBoardEditModal();
}

// Task Management Functions
function switchToView(viewType) {
    const boardContainer = document.getElementById('boardContainer');
    const taskContainer = document.getElementById('taskContainer');
    const boardViewBtn = document.getElementById('boardViewBtn');
    const taskViewBtn = document.getElementById('taskViewBtn');
    
    if (viewType === 'board') {
        boardContainer.style.display = 'block';
        taskContainer.style.display = 'none';
        boardViewBtn.classList.add('active');
        taskViewBtn.classList.remove('active');
    } else if (viewType === 'tasks') {
        boardContainer.style.display = 'none';
        taskContainer.style.display = 'block';
        boardViewBtn.classList.remove('active');
        taskViewBtn.classList.add('active');
        
        // Initialize task view
        populateTaskView();
    }
}

function populateTaskView() {
    populateTaskBoardFilters();
    populateTaskFilters();
    renderTaskList();
}

function populateTaskBoardFilters() {
    const taskBoardFilter = document.getElementById('taskBoardFilter');
    const taskBoard = document.getElementById('taskBoard');
    
    // Clear existing options (except "All Boards")
    taskBoardFilter.innerHTML = '<option value="all">All Boards</option>';
    taskBoard.innerHTML = '';
    
    // Add boards
    Object.keys(appData.boards).forEach(boardId => {
        const board = appData.boards[boardId];
        
        // Add to filter dropdown
        const filterOption = document.createElement('option');
        filterOption.value = boardId;
        filterOption.textContent = board.name;
        taskBoardFilter.appendChild(filterOption);
        
        // Add to task creation dropdown
        const taskOption = document.createElement('option');
        taskOption.value = boardId;
        taskOption.textContent = board.name;
        if (boardId === appData.currentBoardId) {
            taskOption.selected = true;
        }
        taskBoard.appendChild(taskOption);
    });
}

function populateTaskFilters() {
    updateTaskGroupOptions();
    updateTaskRowOptions();
    updateTaskColumnOptions();
}

function getAllTasks() {
    const tasks = [];
    const selectedBoardId = document.getElementById('taskBoardFilter').value;
    
    const boardsToCheck = selectedBoardId === 'all' 
        ? Object.keys(appData.boards) 
        : [selectedBoardId];
    
    boardsToCheck.forEach(boardId => {
        const board = appData.boards[boardId];
        if (!board || !board.rows) return;
        
        board.rows.forEach(row => {
            if (!row || !row.cards) return;
            
            Object.keys(row.cards).forEach(columnKey => {
                if (!row.cards[columnKey] || !Array.isArray(row.cards[columnKey])) return;
                
                row.cards[columnKey].forEach(card => {
                    if (!card) return;
                    
                    // Ensure card has required properties
                    if (!card.subtasks) card.subtasks = [];
                    if (!card.dueDate) card.dueDate = null;
                    if (!card.priority) card.priority = 'medium';
                    
                    const group = board.groups ? board.groups.find(g => g.id === row.groupId) : null;
                    const column = board.columns ? board.columns.find(c => c.key === columnKey) : null;
                    
                    tasks.push({
                        ...card,
                        boardId: boardId,
                        boardName: board.name || 'Unnamed Board',
                        rowId: row.id,
                        rowName: row.name || 'Unnamed Row',
                        columnKey: columnKey,
                        columnName: column ? column.name : columnKey,
                        groupId: row.groupId,
                        groupName: group ? group.name : 'No Group'
                    });
                });
            });
        });
    });
    
    return tasks;
}

function renderTaskList() {
    const taskList = document.getElementById('taskList');
    const tasks = getAllTasks();
    
    console.log('All tasks:', tasks); // Debug log
    
    // Apply filters
    const filteredTasks = filterTaskList(tasks);
    
    console.log('Filtered tasks:', filteredTasks); // Debug log
    
    // Apply sorting
    const sortedTasks = sortTaskList(filteredTasks);
    
    console.log('Sorted tasks:', sortedTasks); // Debug log
    
    if (sortedTasks.length === 0) {
        taskList.innerHTML = '<div class="no-tasks">No tasks found matching your criteria.</div>';
        return;
    }
    
    taskList.innerHTML = sortedTasks.map(task => createTaskElement(task)).join('');
}

function filterTaskList(tasks) {
    const statusFilter = document.getElementById('taskStatusFilter').value;
    const priorityFilter = document.getElementById('taskPriorityFilter').value;
    
    return tasks.filter(task => {
        // Status filter
        if (statusFilter !== 'all') {
            if (statusFilter === 'completed' && !task.completed) return false;
            if (statusFilter === 'pending' && task.completed) return false;
        }
        
        // Priority filter
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
        
        return true;
    });
}

function sortTaskList(tasks) {
    const sortBy = document.getElementById('taskSortBy').value;
    
    return tasks.sort((a, b) => {
        switch (sortBy) {
            case 'priority':
                const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
                return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
            
            case 'dueDate':
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            
            case 'title':
                return a.title.localeCompare(b.title);
            
            case 'created':
                return a.id - b.id;
            
            default:
                return 0;
        }
    });
}

function createTaskElement(task) {
    // Ensure task has all required properties
    if (!task) return '';
    
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
    
    const subtasks = task.subtasks || [];
    const priority = task.priority || 'medium';
    const title = task.title || 'Untitled Task';
    const completed = task.completed || false;
    const description = task.description || '';
    
    const subtaskProgress = subtasks.length > 0 
        ? `${subtasks.filter(st => st.completed).length}/${subtasks.length}` 
        : '0';
    
    return `
        <div class="task-item ${completed ? 'completed' : ''}" data-task-id="${task.id || ''}" data-board-id="${task.boardId || ''}" data-row-id="${task.rowId || ''}" data-column-key="${task.columnKey || ''}">
            <div class="task-header">
                <div class="task-title-section">
                    <h3 class="task-title">${title}</h3>
                    <div class="task-badges">
                        <span class="task-priority priority-${priority}">${priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
                        ${completed ? '<span class="task-status completed">✓ Completed</span>' : '<span class="task-status pending">⏳ Pending</span>'}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-small btn-secondary" onclick="editTaskFromList('${task.id}', '${task.boardId}', '${task.rowId}', '${task.columnKey}')">✏️</button>
                    <button class="btn btn-small btn-danger" onclick="deleteTaskFromList('${task.id}', '${task.boardId}', '${task.rowId}', '${task.columnKey}')">🗑️</button>
                </div>
            </div>
            
            <div class="task-meta">
                <div class="task-location">
                    📍 ${task.boardName || 'Unknown Board'} → ${task.groupName || 'No Group'} → ${task.rowName || 'Unknown Row'} → ${task.columnName || 'Unknown Column'}
                </div>
                <div class="task-details">
                    <span class="task-due-date ${isOverdue ? 'overdue' : ''}">${dueDate}</span>
                    ${subtasks.length > 0 ? `<span class="task-subtasks">📋 ${subtaskProgress}</span>` : ''}
                </div>
            </div>
            
            ${description ? `<div class="task-description">${description}</div>` : ''}
            
            ${subtasks.length > 2 ? `
                <div class="task-subtasks-preview">
                    ${subtasks.slice(0, 2).map(subtask => `
                        <div class="subtask-preview ${subtask.completed ? 'completed' : ''}">
                            ${subtask.completed ? '✓' : '○'} ${subtask.text}
                        </div>
                    `).join('')}
                    ${subtasks.length > 2 ? `<div class="subtask-more">... +${subtasks.length - 2} more</div>` : ''}
                </div>
            ` : ''}
        </div>
    `;
}

// Task filtering functions
function filterTasksByBoard() {
    renderTaskList();
}

function filterTasks() {
    renderTaskList();
}

function sortTasks() {
    renderTaskList();
}

// Task creation and editing functions
let currentEditingTask = null;

function openTaskModal(taskId = null, boardId = null, rowId = null, columnKey = null) {
    if (taskId) {
        // Edit existing task
        const board = appData.boards[boardId];
        const row = board.rows.find(r => r.id === rowId);
        const card = row.cards[columnKey].find(c => c.id === taskId);
        
        if (!card) return;
        
        currentEditingTask = { id: taskId, boardId, rowId, columnKey };
        document.getElementById('taskModalTitle').textContent = 'Edit Task';
        document.getElementById('taskTitle').value = card.title;
        document.getElementById('taskDescription').value = card.description;
        document.getElementById('taskBoard').value = boardId;
        document.getElementById('taskDueDate').value = card.dueDate || '';
        document.getElementById('taskPriority').value = card.priority || 'medium';
        document.getElementById('taskCompleted').checked = card.completed || false;
        
        // Update dependent dropdowns
        updateTaskGroupOptions();
        document.getElementById('taskGroup').value = row.groupId || '';
        updateTaskRowOptions();
        document.getElementById('taskRow').value = rowId;
        updateTaskColumnOptions();
        document.getElementById('taskColumn').value = columnKey;
    } else {
        // Create new task
        currentEditingTask = null;
        document.getElementById('taskModalTitle').textContent = 'Add Task';
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskBoard').value = appData.currentBoardId;
        document.getElementById('taskDueDate').value = '';
        document.getElementById('taskPriority').value = 'medium';
        document.getElementById('taskCompleted').checked = false;
        
        // Update dependent dropdowns
        updateTaskGroupOptions();
        document.getElementById('taskGroup').value = '';
        updateTaskRowOptions();
        updateTaskColumnOptions();
    }
    
    document.getElementById('taskModal').style.display = 'block';
    document.getElementById('taskForm').onsubmit = saveTask;
}

function closeTaskModal() {
    document.getElementById('taskModal').style.display = 'none';
    currentEditingTask = null;
}

function saveTask(event) {
    event.preventDefault();
    
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const boardId = document.getElementById('taskBoard').value;
    const rowId = parseInt(document.getElementById('taskRow').value);
    const columnKey = document.getElementById('taskColumn').value;
    const dueDate = document.getElementById('taskDueDate').value || null;
    const priority = document.getElementById('taskPriority').value;
    const completed = document.getElementById('taskCompleted').checked;
    
    if (!title || !boardId || !rowId || !columnKey) {
        alert('Please fill in all required fields.');
        return;
    }
    
    const board = appData.boards[boardId];
    const row = board.rows.find(r => r.id === rowId);
    
    if (!row) {
        alert('Selected row not found.');
        return;
    }
    
    if (!row.cards[columnKey]) {
        row.cards[columnKey] = [];
    }
    
    if (currentEditingTask) {
        // Edit existing task
        const oldBoard = appData.boards[currentEditingTask.boardId];
        const oldRow = oldBoard.rows.find(r => r.id === currentEditingTask.rowId);
        const cardIndex = oldRow.cards[currentEditingTask.columnKey].findIndex(c => c.id === currentEditingTask.id);
        
        if (cardIndex !== -1) {
            const card = oldRow.cards[currentEditingTask.columnKey][cardIndex];
            
            // If moving to different location, remove from old location
            if (currentEditingTask.boardId !== boardId || 
                currentEditingTask.rowId !== rowId || 
                currentEditingTask.columnKey !== columnKey) {
                
                oldRow.cards[currentEditingTask.columnKey].splice(cardIndex, 1);
                
                // Update card and add to new location
                card.title = title;
                card.description = description;
                card.completed = completed;
                card.dueDate = dueDate;
                card.priority = priority;
                
                row.cards[columnKey].push(card);
            } else {
                // Just update in place
                card.title = title;
                card.description = description;
                card.completed = completed;
                card.dueDate = dueDate;
                card.priority = priority;
            }
        }
    } else {
        // Create new task
        const newCard = {
            id: board.nextCardId++,
            title: title,
            description: description,
            completed: completed,
            subtasks: [],
            dueDate: dueDate,
            priority: priority
        };
        
        row.cards[columnKey].push(newCard);
    }
    
    saveData();
    closeTaskModal();
    
    // Refresh the current view
    if (document.getElementById('taskContainer').style.display !== 'none') {
        renderTaskList();
    } else {
        renderBoard();
    }
    
    showStatusMessage('Task saved successfully', 'success');
}

function updateTaskGroupOptions() {
    const boardId = document.getElementById('taskBoard').value;
    const taskGroup = document.getElementById('taskGroup');
    
    if (!boardId) return;
    
    const board = appData.boards[boardId];
    taskGroup.innerHTML = '<option value="">No Group</option>';
    
    board.groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        taskGroup.appendChild(option);
    });
}

function updateTaskRowOptions() {
    const boardId = document.getElementById('taskBoard').value;
    const groupId = document.getElementById('taskGroup').value;
    const taskRow = document.getElementById('taskRow');
    
    if (!boardId) return;
    
    const board = appData.boards[boardId];
    taskRow.innerHTML = '';
    
    board.rows.forEach(row => {
        // Filter by group if selected
        if (groupId && row.groupId != groupId) return;
        if (!groupId && row.groupId) return;
        
        const option = document.createElement('option');
        option.value = row.id;
        option.textContent = row.name;
        taskRow.appendChild(option);
    });
}

function updateTaskColumnOptions() {
    const boardId = document.getElementById('taskBoard').value;
    const taskColumn = document.getElementById('taskColumn');
    
    if (!boardId) return;
    
    const board = appData.boards[boardId];
    taskColumn.innerHTML = '';
    
    board.columns.forEach(column => {
        const option = document.createElement('option');
        option.value = column.key;
        option.textContent = column.name;
        taskColumn.appendChild(option);
    });
}

function editTaskFromList(taskId, boardId, rowId, columnKey) {
    openTaskModal(parseInt(taskId), boardId, parseInt(rowId), columnKey);
}

function deleteTaskFromList(taskId, boardId, rowId, columnKey) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    const board = appData.boards[boardId];
    const row = board.rows.find(r => r.id === parseInt(rowId));
    
    if (row && row.cards[columnKey]) {
        row.cards[columnKey] = row.cards[columnKey].filter(c => c.id !== parseInt(taskId));
        saveData();
        renderTaskList();
        showStatusMessage('Task deleted successfully', 'success');
    }
}