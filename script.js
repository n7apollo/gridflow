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
    },
    templates: [],
    nextTemplateId: 1,
    weeklyPlans: {},
    nextWeeklyItemId: 1,
    
    // Phase 1: Unified entity system
    entities: {
        tasks: {},      // Unified tasks (subtasks, checklist items, weekly tasks)
        notes: {},      // Centralized notes system  
        checklists: {}  // Reusable checklists
    },
    
    // Entity ID counters
    nextTaskId: 1,
    nextNoteId: 1,
    nextChecklistId: 1,
    
    // Relationship tracking for bidirectional sync
    relationships: {
        cardToWeeklyPlans: {},    // cardId -> [weekKeys]
        weeklyPlanToCards: {},    // weekKey -> [cardIds]
        entityNotes: {},          // entityId -> [noteIds]
        entityChecklists: {},     // entityId -> [checklistIds]
        entityTasks: {},          // entityId -> [taskIds]
        
        // Phase 2: Enhanced relationships
        entityTags: {},           // entityId -> [tagIds]
        collectionEntities: {},   // collectionId -> [entityIds]
        templateUsage: {}         // templateId -> [usageInstances]
    },
    
    // Phase 2: Template Library & Smart Collections
    templateLibrary: {
        checklists: {},           // Reusable checklist templates
        taskSets: {},            // Common task patterns
        notes: {}                // Note templates
    },
    
    collections: {},              // Smart collections/saved views
    tags: {},                    // Global tag definitions with metadata
    
    // Phase 2 ID counters
    nextTemplateLibraryId: 1,
    nextCollectionId: 1,
    nextTagId: 1,
    
    version: '5.0' // Phase 2 template library & smart collections
};

// Current board reference for backward compatibility
let boardData = appData.boards[appData.currentBoardId];

let currentEditingCard = null;
// currentEditingColumn moved to js/column-operations.js
// currentEditingGroup moved to js/group-operations.js
let currentDetailCard = null; // Track card in detail modal
// SortableJS handles all drag state - no global variables needed

// Application initialization moved to js/app.js
// This script.js file now contains the remaining non-modularized functions

// Data persistence functions moved to js/core-data.js

// loadData function moved to js/core-data.js

// Data migration functions moved to js/core-data.js

// TODO: Remove these functions once all modules are extracted - they're now handled by js/core-data.js

// Detect version from data structure

// Compare version strings (simple semantic versioning)

// Migration to v2.0 (single-board to multi-board)

// Migration to v2.5 (add templates)

// Migration to v3.0 (add weekly planning)

// Migration to v4.0 (unified entity system)

// Migration to v5.0 (template library & smart collections)

// Convert existing checklist entities to reusable templates
function migrateChecklistsToTemplates(data) {
    Object.keys(data.entities.checklists).forEach(checklistId => {
        const checklist = data.entities.checklists[checklistId];
        
        // Create template from existing checklist if it has common patterns
        if (checklist.tasks && checklist.tasks.length > 0) {
            const templateId = `template_${data.nextTemplateLibraryId++}`;
            
            // Extract tasks for template
            const taskTemplates = checklist.tasks.map(taskId => {
                const task = data.entities.tasks[taskId];
                return {
                    text: task ? task.text : 'Untitled Task',
                    priority: task ? task.priority : 'medium',
                    estimatedTime: null
                };
            });
            
            data.templateLibrary.checklists[templateId] = {
                id: templateId,
                name: checklist.title || 'Checklist Template',
                description: checklist.description || 'Converted from existing checklist',
                category: 'general',
                tasks: taskTemplates,
                tags: ['converted'],
                isPublic: false,
                usageCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Track template usage
            data.relationships.templateUsage[templateId] = [{
                entityType: 'checklist',
                entityId: checklistId,
                usedAt: new Date().toISOString()
            }];
        }
    });
}

// Initialize default tag categories for organization
function initializeDefaultTags(data) {
    const defaultTags = [
        { name: 'urgent', color: '#ff4444', category: 'priority' },
        { name: 'important', color: '#ff8800', category: 'priority' },
        { name: 'low-priority', color: '#00aa00', category: 'priority' },
        { name: 'work', color: '#0066cc', category: 'context' },
        { name: 'personal', color: '#9966cc', category: 'context' },
        { name: 'project', color: '#cc6600', category: 'context' },
        { name: 'review', color: '#888888', category: 'status' },
        { name: 'blocked', color: '#dd0000', category: 'status' },
        { name: 'waiting', color: '#ffaa00', category: 'status' }
    ];
    
    defaultTags.forEach(tagData => {
        const tagId = `tag_${data.nextTagId++}`;
        data.tags[tagId] = {
            id: tagId,
            name: tagData.name,
            color: tagData.color,
            category: tagData.category,
            description: `Default ${tagData.category} tag`,
            usageCount: 0,
            createdAt: new Date().toISOString()
        };
    });
}

// Convert card subtasks to unified task entities
function migrateCardSubtasksToEntities(data) {
    Object.values(data.boards).forEach(board => {
        if (!board.rows) return;
        
        board.rows.forEach(row => {
            if (!row.cards) return;
            
            Object.keys(row.cards).forEach(columnKey => {
                row.cards[columnKey].forEach(card => {
                    if (card.subtasks && card.subtasks.length > 0) {
                        // Convert subtasks to unified tasks
                        const taskIds = [];
                        
                        card.subtasks.forEach(subtask => {
                            const taskId = `task_${data.nextTaskId++}`;
                            
                            data.entities.tasks[taskId] = {
                                id: taskId,
                                text: subtask.text,
                                completed: subtask.completed || false,
                                dueDate: null,
                                priority: 'medium',
                                parentType: 'card',
                                parentId: card.id.toString(),
                                tags: [],
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            };
                            
                            taskIds.push(taskId);
                        });
                        
                        // Update card to reference tasks instead of embedding them
                        card.taskIds = taskIds;
                        
                        // Add to relationship mapping
                        data.relationships.entityTasks[card.id.toString()] = taskIds;
                    }
                    
                    // Keep subtasks for backward compatibility during transition
                    // They will be deprecated later
                });
            });
        });
    });
}

// Convert weekly plan items to entities
function migrateWeeklyPlanItemsToEntities(data) {
    Object.keys(data.weeklyPlans).forEach(weekKey => {
        const weekPlan = data.weeklyPlans[weekKey];
        if (!weekPlan.items) return;
        
        const newItems = [];
        
        weekPlan.items.forEach(item => {
            // Handle different item types
            if (item.type === 'checklist' && item.checklist) {
                // Convert checklist items to unified tasks and checklist entity
                const checklistId = `checklist_${data.nextChecklistId++}`;
                const taskIds = [];
                
                item.checklist.forEach(checkItem => {
                    const taskId = `task_${data.nextTaskId++}`;
                    
                    data.entities.tasks[taskId] = {
                        id: taskId,
                        text: checkItem.text,
                        completed: checkItem.completed || false,
                        dueDate: null,
                        priority: 'medium',
                        parentType: 'checklist',
                        parentId: checklistId,
                        tags: [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    
                    taskIds.push(taskId);
                });
                
                data.entities.checklists[checklistId] = {
                    id: checklistId,
                    title: item.title || 'Checklist',
                    description: '',
                    tasks: taskIds,
                    attachedTo: { type: 'weekly', id: weekKey },
                    isTemplate: false,
                    tags: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                // Add to relationship mapping
                data.relationships.entityTasks[checklistId] = taskIds;
                
                // Update weekly plan item to reference entity
                newItems.push({
                    id: item.id,
                    type: 'checklist',
                    entityId: checklistId,
                    day: item.day,
                    completed: item.completed || false,
                    addedAt: item.createdAt || new Date().toISOString()
                });
                
            } else if (item.type === 'note') {
                // Convert note to note entity
                const noteId = `note_${data.nextNoteId++}`;
                
                data.entities.notes[noteId] = {
                    id: noteId,
                    title: item.title || 'Note',
                    content: item.content || item.description || '',
                    attachedTo: { type: 'weekly', id: weekKey },
                    tags: [],
                    createdAt: item.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                // Update weekly plan item to reference entity
                newItems.push({
                    id: item.id,
                    type: 'note',
                    entityId: noteId,
                    day: item.day,
                    completed: item.completed || false,
                    addedAt: item.createdAt || new Date().toISOString()
                });
                
            } else {
                // Keep existing items (cards, etc.) as-is for now
                newItems.push({
                    id: item.id,
                    type: item.type,
                    entityId: item.cardId || item.entityId,
                    day: item.day,
                    completed: item.completed || false,
                    addedAt: item.createdAt || new Date().toISOString()
                });
            }
        });
        
        // Update weekly plan with new item structure
        weekPlan.items = newItems;
    });
}

// Build relationship mappings between entities
function buildRelationshipMappings(data) {
    // Build card to weekly plans mapping
    Object.keys(data.weeklyPlans).forEach(weekKey => {
        const weekPlan = data.weeklyPlans[weekKey];
        if (!weekPlan.items) return;
        
        const cardIds = [];
        
        weekPlan.items.forEach(item => {
            if (item.type === 'card' && item.entityId) {
                const cardId = item.entityId.toString();
                cardIds.push(cardId);
                
                // Add to cardToWeeklyPlans mapping
                if (!data.relationships.cardToWeeklyPlans[cardId]) {
                    data.relationships.cardToWeeklyPlans[cardId] = [];
                }
                if (!data.relationships.cardToWeeklyPlans[cardId].includes(weekKey)) {
                    data.relationships.cardToWeeklyPlans[cardId].push(weekKey);
                }
            }
        });
        
        // Add to weeklyPlanToCards mapping
        data.relationships.weeklyPlanToCards[weekKey] = cardIds;
    });
}

// Validate and ensure all required fields exist


// Initialize with sample data

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

// Toggle card completion function moved to js/card-operations.js

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



// moveColumn function moved to js/column-operations.js

// moveColumnUp function moved to js/column-operations.js

// moveColumnDown function moved to js/column-operations.js

// Group functions moved to js/group-operations.js

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
    
    // Update templates UI
    updateTemplatesUI();
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



// Column management
// renderColumnsList function moved to js/column-operations.js

// renderColumnsListModal function moved to js/column-operations.js

// renderGroupsListModal function moved to js/group-operations.js

// renderGroupsList function moved to js/group-operations.js

// addColumn function moved to js/column-operations.js

// editColumn function moved to js/column-operations.js

// deleteColumn function moved to js/column-operations.js

// saveColumn function moved to js/column-operations.js

// closeColumnModal function moved to js/column-operations.js

// CRUD Operations for Rows moved to js/row-operations.js






// CRUD Operations for Cards moved to js/card-operations.js

function closeModal() {
    document.getElementById('cardModal').style.display = 'none';
    currentEditingCard = null;
}

// Card detail modal functions moved to js/card-operations.js

// Subtask functions - updated for unified entity system
function renderSubtasks() {
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

// Add subtask form functions moved to js/subtask-management.js

// Edit subtask inline functions moved to js/subtask-management.js

// Centralized Notes System - for any entity attachment
function createNote(title, content, attachedToType, attachedToId, tags = []) {
    const noteId = `note_${appData.nextNoteId++}`;
    
    // Create note entity
    appData.entities.notes[noteId] = {
        id: noteId,
        title: title,
        content: content,
        attachedTo: { type: attachedToType, id: attachedToId },
        tags: tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Update relationship mapping
    const entityKey = `${attachedToType}:${attachedToId}`;
    if (!appData.relationships.entityNotes[entityKey]) {
        appData.relationships.entityNotes[entityKey] = [];
    }
    appData.relationships.entityNotes[entityKey].push(noteId);
    
    saveData();
    return noteId;
}

function getNotesForEntity(entityType, entityId) {
    const entityKey = `${entityType}:${entityId}`;
    const noteIds = appData.relationships.entityNotes[entityKey] || [];
    return noteIds.map(noteId => appData.entities.notes[noteId]).filter(Boolean);
}

function updateNote(noteId, title, content, tags = []) {
    if (!appData.entities.notes[noteId]) return false;
    
    appData.entities.notes[noteId].title = title;
    appData.entities.notes[noteId].content = content;
    appData.entities.notes[noteId].tags = tags;
    appData.entities.notes[noteId].updatedAt = new Date().toISOString();
    
    saveData();
    return true;
}

function deleteNote(noteId) {
    const note = appData.entities.notes[noteId];
    if (!note) return false;
    
    // Remove from relationship mapping
    const entityKey = `${note.attachedTo.type}:${note.attachedTo.id}`;
    if (appData.relationships.entityNotes[entityKey]) {
        appData.relationships.entityNotes[entityKey] = 
            appData.relationships.entityNotes[entityKey].filter(id => id !== noteId);
        
        // Clean up empty arrays
        if (appData.relationships.entityNotes[entityKey].length === 0) {
            delete appData.relationships.entityNotes[entityKey];
        }
    }
    
    // Remove note entity
    delete appData.entities.notes[noteId];
    
    saveData();
    return true;
}

function renderNotesForCard(cardId, containerId) {
    const notes = getNotesForEntity('card', cardId);
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (notes.length === 0) {
        container.innerHTML = '<div class="no-notes">No notes yet.</div>';
        return;
    }
    
    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-item';
        noteElement.innerHTML = `
            <div class="note-header">
                <h4 class="note-title">${note.title}</h4>
                <div class="note-actions">
                    <button onclick="editNote('${note.id}')" title="Edit note">✏️</button>
                    <button onclick="deleteNoteConfirm('${note.id}')" title="Delete note">🗑️</button>
                </div>
            </div>
            <div class="note-content">${note.content}</div>
            <div class="note-meta">
                <span class="note-date">Updated: ${new Date(note.updatedAt).toLocaleDateString()}</span>
                ${note.tags.length > 0 ? `<div class="note-tags">${note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
            </div>
        `;
        container.appendChild(noteElement);
    });
}

function addNoteToCard(cardId) {
    const title = prompt('Note title:');
    if (!title) return;
    
    const content = prompt('Note content:');
    if (!content) return;
    
    createNote(title, content, 'card', cardId);
    renderNotesForCard(cardId, 'cardNotesList');
    showStatusMessage('Note added to card', 'success');
}

function editNote(noteId) {
    const note = appData.entities.notes[noteId];
    if (!note) return;
    
    const title = prompt('Edit note title:', note.title);
    if (title === null) return;
    
    const content = prompt('Edit note content:', note.content);
    if (content === null) return;
    
    updateNote(noteId, title, content, note.tags);
    
    // Re-render notes for the attached entity
    if (note.attachedTo.type === 'card') {
        renderNotesForCard(note.attachedTo.id, 'cardNotesList');
    }
    
    showStatusMessage('Note updated', 'success');
}

function deleteNoteConfirm(noteId) {
    const note = appData.entities.notes[noteId];
    if (!note) return;
    
    if (confirm(`Delete note "${note.title}"?`)) {
        const attachedType = note.attachedTo.type;
        const attachedId = note.attachedTo.id;
        
        deleteNote(noteId);
        
        // Re-render notes for the attached entity
        if (attachedType === 'card') {
            renderNotesForCard(attachedId, 'cardNotesList');
        }
        
        showStatusMessage('Note deleted', 'success');
    }
}

// Phase 2: Template Library System
// Reusable Checklist Templates





// Task Templates for Common Patterns
function createTaskSet(name, description, tasks, category = 'general', tags = []) {
    const templateId = `taskset_${appData.nextTemplateLibraryId++}`;
    
    appData.templateLibrary.taskSets[templateId] = {
        id: templateId,
        name: name,
        description: description,
        category: category,
        tasks: tasks.map(task => ({
            text: task.text || task,
            priority: task.priority || 'medium',
            estimatedTime: task.estimatedTime || null,
            dependencies: task.dependencies || []
        })),
        tags: tags,
        isPublic: false,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    saveData();
    return templateId;
}

function applyTaskSetToCard(templateId, cardId, boardId) {
    const template = appData.templateLibrary.taskSets[templateId];
    if (!template) return null;
    
    const board = appData.boards[boardId];
    if (!board) return null;
    
    // Find the card
    let targetCard = null;
    board.rows.forEach(row => {
        Object.keys(row.cards).forEach(columnKey => {
            const card = row.cards[columnKey].find(c => c.id == cardId);
            if (card) targetCard = card;
        });
    });
    
    if (!targetCard) return null;
    
    // Ensure card has taskIds array
    if (!targetCard.taskIds) targetCard.taskIds = [];
    
    const newTaskIds = [];
    
    // Create task entities from template
    template.tasks.forEach(taskTemplate => {
        const taskId = `task_${appData.nextTaskId++}`;
        
        appData.entities.tasks[taskId] = {
            id: taskId,
            text: taskTemplate.text,
            completed: false,
            dueDate: null,
            priority: taskTemplate.priority,
            parentType: 'card',
            parentId: cardId.toString(),
            tags: [...template.tags],
            estimatedTime: taskTemplate.estimatedTime,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        newTaskIds.push(taskId);
        targetCard.taskIds.push(taskId);
    });
    
    // Update relationships
    const cardKey = cardId.toString();
    if (!appData.relationships.entityTasks[cardKey]) {
        appData.relationships.entityTasks[cardKey] = [];
    }
    appData.relationships.entityTasks[cardKey].push(...newTaskIds);
    
    // Track template usage
    if (!appData.relationships.templateUsage[templateId]) {
        appData.relationships.templateUsage[templateId] = [];
    }
    appData.relationships.templateUsage[templateId].push({
        entityType: 'card',
        entityId: cardId.toString(),
        usedAt: new Date().toISOString()
    });
    
    // Update usage count
    template.usageCount++;
    template.updatedAt = new Date().toISOString();
    
    saveData();
    return newTaskIds;
}

// Enhanced Tagging System functions moved to js/tagging-system.js






// Smart Collections System moved to js/collections.js





// Initialize Sample Templates and Collections (for demonstration)
// initializeSampleTemplates moved to js/template-system.js as populateDefaultTemplates
function initializeSampleTemplates() {
    // Sample Checklist Templates
    if (Object.keys(appData.templateLibrary.checklists).length === 0) {
        // Project Planning Template
        createChecklistTemplate(
            "Project Planning Checklist",
            "Essential steps for starting any new project",
            [
                { text: "Define project scope and objectives", priority: "high" },
                { text: "Identify key stakeholders", priority: "high" },
                { text: "Create project timeline", priority: "medium" },
                { text: "Set budget and resource requirements", priority: "medium" },
                { text: "Establish communication channels", priority: "medium" },
                { text: "Create risk management plan", priority: "low" }
            ],
            "project",
            ["planning", "project"]
        );
        
        // Code Review Template
        createChecklistTemplate(
            "Code Review Checklist",
            "Quality assurance checklist for code reviews",
            [
                { text: "Code follows style guidelines", priority: "medium" },
                { text: "Functions are properly documented", priority: "medium" },
                { text: "Edge cases are handled", priority: "high" },
                { text: "Tests are written and passing", priority: "high" },
                { text: "Performance considerations addressed", priority: "medium" },
                { text: "Security vulnerabilities checked", priority: "high" }
            ],
            "development",
            ["code", "review", "quality"]
        );
        
        // Meeting Preparation Template
        createChecklistTemplate(
            "Meeting Preparation",
            "Ensure meetings are productive and well-organized",
            [
                { text: "Create agenda and share with attendees", priority: "high" },
                { text: "Book meeting room or set up video call", priority: "medium" },
                { text: "Prepare presentation materials", priority: "medium" },
                { text: "Review previous meeting notes", priority: "low" },
                { text: "Send reminder to participants", priority: "medium" }
            ],
            "meetings",
            ["meeting", "preparation"]
        );
    }
    
    // Sample Task Sets
    if (Object.keys(appData.templateLibrary.taskSets).length === 0) {
        // Website Launch Task Set
        createTaskSet(
            "Website Launch Tasks",
            "Essential tasks for launching a new website",
            [
                { text: "Final content review and approval", priority: "high" },
                { text: "Cross-browser testing", priority: "high" },
                { text: "Performance optimization", priority: "medium" },
                { text: "SEO meta tags and descriptions", priority: "medium" },
                { text: "Set up analytics tracking", priority: "medium" },
                { text: "Configure backup systems", priority: "low" },
                { text: "Update DNS records", priority: "high" },
                { text: "Monitor launch for issues", priority: "high" }
            ],
            "web-development",
            ["website", "launch", "development"]
        );
        
        // Employee Onboarding Task Set
        createTaskSet(
            "Employee Onboarding",
            "Standard onboarding tasks for new team members",
            [
                { text: "Send welcome email with first day details", priority: "high" },
                { text: "Prepare workspace and equipment", priority: "high" },
                { text: "Create accounts for all necessary systems", priority: "high" },
                { text: "Schedule introduction meetings", priority: "medium" },
                { text: "Provide company handbook and policies", priority: "medium" },
                { text: "Set up payroll and benefits", priority: "high" },
                { text: "Assign mentor or buddy", priority: "medium" }
            ],
            "hr",
            ["onboarding", "hr", "new-employee"]
        );
    }
}

// initializeSampleCollections moved to js/collections.js


// Auto-update collections when entities change
function onEntityChange() {
    updateAllCollections();
}

// Export functions
// Show export modal function moved to js/import-export.js

// Close export modal function moved to js/import-export.js

// Export to PDF function moved to js/import-export.js

// Export to PNG function moved to js/import-export.js

// Export to Excel function moved to js/import-export.js

// Export to JSON function moved to js/import-export.js

// Import from JSON function moved to js/import-export.js

// Merge imported data function moved to js/import-export.js

// Generate unique board ID when merging

// Update ID counters function moved to js/import-export.js

// Utility functions moved to js/utilities.js

// Event listeners moved to js/utilities.js

// Placeholder for setupEventListeners - now handled by utilities module

// Column Outline Functions
let currentOutlineData = { html: '', plain: '', markdown: '' };





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

// Board Management Functions moved to js/board-management.js
let currentEditingBoard = null;

// TODO: Remove these functions once all modules are extracted - they're now handled by js/board-management.js











// Task Management Functions

// Task management functions moved to js/task-management.js
// TODO: Remove these functions once all modules are extracted








// Task filtering functions



// Task creation and editing functions
let currentEditingTask = null;










// Template Management Functions
let selectedTemplateId = null;

// Template system functions moved to js/template-system.js
// TODO: Remove these functions once all modules are extracted




















// ============================================
// ENHANCED NAVIGATION SYSTEM moved to js/board-management.js
// TODO: Remove these functions once all modules are extracted
// ============================================

// Enhanced Board Selector Functions







// Dropdown Menu Functions


function toggleMoreMenu() {
    const dropdown = document.getElementById('moreDropdown');
    const button = document.getElementById('moreBtn');
    
    if (dropdown.classList.contains('active')) {
        closeMoreMenu();
    } else {
        closeAllDropdowns();
        dropdown.classList.add('active');
        button.classList.add('active');
    }
}

function closeMoreMenu() {
    const dropdown = document.getElementById('moreDropdown');
    const button = document.getElementById('moreBtn');
    
    dropdown.classList.remove('active');
    button.classList.remove('active');
}

function closeAllDropdowns() {
    closeBoardDropdown();
    closeTemplatesMenu();
    closeMoreMenu();
}

// Mobile Menu Functions
function toggleMobileMenu() {
    const overlay = document.getElementById('mobileMenuOverlay');
    const menu = document.getElementById('mobileMenu');
    const button = document.getElementById('mobileMenuBtn');
    
    if (menu.classList.contains('active')) {
        closeMobileMenu();
    } else {
        overlay.classList.add('active');
        menu.classList.add('active');
        button.classList.add('active');
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }
}

function closeMobileMenu() {
    const overlay = document.getElementById('mobileMenuOverlay');
    const menu = document.getElementById('mobileMenu');
    const button = document.getElementById('mobileMenuBtn');
    
    overlay.classList.remove('active');
    menu.classList.remove('active');
    button.classList.remove('active');
    
    // Restore body scroll
    document.body.style.overflow = '';
}

// Enhanced Board Management

// Override existing switchBoard function to work with new UI

// Initialize enhanced navigation
function initializeEnhancedNavigation() {
    // Update current board display
    updateCurrentBoardDisplay();
    
    // Add click outside listeners to close dropdowns
    document.addEventListener('click', function(event) {
        const boardSelector = document.querySelector('.board-selector-enhanced');
        const templatesMenu = document.querySelector('.templates-menu');
        const moreMenu = document.querySelector('.more-menu');
        
        // Close board dropdown if clicked outside
        if (!boardSelector.contains(event.target)) {
            closeBoardDropdown();
        }
        
        // Close templates dropdown if clicked outside
        if (!templatesMenu.contains(event.target)) {
            closeTemplatesMenu();
        }
        
        // Close more dropdown if clicked outside
        if (!moreMenu.contains(event.target)) {
            closeMoreMenu();
        }
    });
    
    // Add keyboard navigation
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeAllDropdowns();
            closeMobileMenu();
        }
    });
    
    // Ensure mobile menu closes on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    });
}

// Call initialization when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Add a small delay to ensure other initialization is complete
    setTimeout(initializeEnhancedNavigation, 100);
});

// ============================================
// WEEKLY PLANNING SYSTEM
// ============================================

let currentWeekKey = null;
let currentEditingWeeklyItem = null;

// Weekly planning functions moved to js/weekly-planning.js
// TODO: Remove these functions once all modules are extracted





// Initialize weekly planning

// Main weekly plan renderer

// Render weekly items

// Create weekly item element

// Helper function to find card by ID

// Week navigation

// Weekly goal management


function cancelGoalEdit() {
    const goalText = document.getElementById('weeklyGoalText');
    const goalForm = document.getElementById('weeklyGoalForm');
    
    goalForm.style.display = 'none';
    goalText.style.display = 'block';
}

// Add weekly items

function addDailyItem(day) {
    currentEditingWeeklyItem = { day: day };
    document.getElementById('weeklyItemModalTitle').textContent = `Add ${day.charAt(0).toUpperCase() + day.slice(1)} Item`;
    
    // Reset form
    document.getElementById('weeklyItemForm').reset();
    document.querySelector('input[value="note"]').checked = true;
    showItemForm('note');
    
    document.getElementById('weeklyItemModal').style.display = 'block';
}

// Item type form switching
document.addEventListener('change', function(e) {
    if (e.target.name === 'itemType') {
        showItemForm(e.target.value);
    }
});

function showItemForm(type) {
    // Hide all forms
    document.getElementById('noteForm').style.display = 'none';
    document.getElementById('checklistForm').style.display = 'none';
    document.getElementById('cardForm').style.display = 'none';
    
    // Show selected form
    if (type === 'note') {
        document.getElementById('noteForm').style.display = 'block';
    } else if (type === 'checklist') {
        document.getElementById('checklistForm').style.display = 'block';
    } else if (type === 'card') {
        document.getElementById('cardForm').style.display = 'block';
        populateCardOptions();
    }
}

// Toggle weekly item completion

// Toggle checklist item completion
function toggleChecklistItem(itemId, checkIndex) {
    const currentPlan = appData.weeklyPlans[currentWeekKey];
    if (!currentPlan) return;
    
    const item = currentPlan.items.find(i => i.id === itemId);
    if (!item) return;
    
    // Handle new entity system or legacy format
    if (item.entityId && appData.entities.checklists[item.entityId]) {
        // New entity system
        const checklist = appData.entities.checklists[item.entityId];
        const taskIds = checklist.tasks || [];
        const taskId = taskIds[checkIndex];
        
        if (taskId && appData.entities.tasks[taskId]) {
            // Toggle task completion
            appData.entities.tasks[taskId].completed = !appData.entities.tasks[taskId].completed;
            appData.entities.tasks[taskId].updatedAt = new Date().toISOString();
            
            // Update overall item completion based on all tasks
            const allTasks = taskIds.map(id => appData.entities.tasks[id]).filter(Boolean);
            const allCompleted = allTasks.length > 0 && allTasks.every(task => task.completed);
            item.completed = allCompleted;
        }
    } else if (item.checklist && item.checklist[checkIndex]) {
        // Legacy format fallback
        item.checklist[checkIndex].completed = !item.checklist[checkIndex].completed;
        
        // Update overall item completion based on checklist
        const allCompleted = item.checklist.every(checkItem => checkItem.completed);
        item.completed = allCompleted;
    }
    
    renderWeeklyItems();
    updateWeekProgress();
    saveData();
}

// Update week progress

// Modal management



// Form submission handlers
document.getElementById('weeklyItemForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const itemType = document.querySelector('input[name="itemType"]:checked').value;
    const day = currentEditingWeeklyItem?.day || 'general';
    
    let newItem = {
        id: `weekly_${appData.nextWeeklyItemId++}`,
        type: itemType,
        day: day,
        completed: document.getElementById('itemCompleted').checked,
        createdAt: new Date().toISOString()
    };
    
    if (itemType === 'note') {
        newItem.title = document.getElementById('noteTitle').value.trim();
        newItem.content = document.getElementById('noteContent').value.trim();
    } else if (itemType === 'checklist') {
        newItem.title = document.getElementById('checklistTitle').value.trim();
        newItem.checklist = collectChecklistItems();
    } else if (itemType === 'card') {
        const cardSelect = document.getElementById('cardSelect');
        const [boardId, cardId] = cardSelect.value.split('|');
        newItem.cardId = cardId;
        newItem.boardId = boardId;
    }
    
    // Add to current week
    if (!appData.weeklyPlans[currentWeekKey]) {
        appData.weeklyPlans[currentWeekKey] = {
            weekStart: getWeekStart(currentWeekKey).toISOString(),
            goal: '',
            items: [],
            reflection: { wins: '', challenges: '', learnings: '', nextWeekFocus: '' }
        };
    }
    
    appData.weeklyPlans[currentWeekKey].items.push(newItem);
    
    renderWeeklyItems();
    updateWeekProgress();
    closeWeeklyItemModal();
    saveData();
    
    showStatusMessage('Item added to weekly plan', 'success');
});

document.getElementById('weeklyReflectionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!appData.weeklyPlans[currentWeekKey]) {
        appData.weeklyPlans[currentWeekKey] = {
            weekStart: getWeekStart(currentWeekKey).toISOString(),
            goal: '',
            items: [],
            reflection: { wins: '', challenges: '', learnings: '', nextWeekFocus: '' }
        };
    }
    
    appData.weeklyPlans[currentWeekKey].reflection = {
        wins: document.getElementById('weeklyWins').value.trim(),
        challenges: document.getElementById('weeklyChallenges').value.trim(),
        learnings: document.getElementById('weeklyLearnings').value.trim(),
        nextWeekFocus: document.getElementById('nextWeekFocus').value.trim()
    };
    
    closeWeeklyReflectionModal();
    saveData();
    
    showStatusMessage('Weekly reflection saved', 'success');
});

// Initialize weekly planning when switching to weekly view

// Helper functions for weekly planning
function collectChecklistItems() {
    const checklistBuilder = document.getElementById('checklistBuilder');
    const items = [];
    
    const previews = checklistBuilder.querySelectorAll('.checklist-item-preview');
    previews.forEach(preview => {
        const text = preview.querySelector('.checklist-item-text').textContent;
        if (text.trim()) {
            items.push({ text: text.trim(), completed: false });
        }
    });
    
    return items;
}

function addChecklistItem() {
    const input = document.querySelector('.checklist-input');
    const text = input.value.trim();
    
    if (!text) return;
    
    const checklistBuilder = document.getElementById('checklistBuilder');
    const preview = document.createElement('div');
    preview.className = 'checklist-item-preview';
    preview.innerHTML = `
        <span class="checklist-item-text">${text}</span>
        <button type="button" class="remove-item-btn" onclick="removeChecklistItem(this)">×</button>
    `;
    
    // Insert before the input
    const inputDiv = checklistBuilder.querySelector('.checklist-item-input');
    checklistBuilder.insertBefore(preview, inputDiv);
    
    input.value = '';
    input.focus();
}

function removeChecklistItem(button) {
    button.parentElement.remove();
}

// Card options functions moved to js/card-operations.js



// Integration with existing view system - switchToView function moved to js/task-management.js
// TODO: Remove this function once all modules are extracted

// Add "Add to Weekly Plan" functionality to cards
