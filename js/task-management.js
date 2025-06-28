/**
 * GridFlow - Task Management Module
 * Handles task view, filtering, and unified task operations
 */

import { getAppData, getBoardData, setAppData, setBoardData, saveData } from './core-data.js';
import { showStatusMessage } from './utilities.js';
import { getEntity } from './entity-core.js';

// Current editing state
let currentEditingTask = null;

// View switching functionality moved to js/navigation.js

/**
 * Initialize and populate the task view
 */
export function populateTaskView() {
    populateTaskBoardFilters();
    populateTaskFilters();
    renderTaskList();
}

/**
 * Populate board filter dropdown for task view
 */
export function populateTaskBoardFilters() {
    const appData = getAppData();
    const taskBoardFilter = document.getElementById('taskBoardFilter');
    const taskBoard = document.getElementById('taskBoard');
    
    if (taskBoardFilter) {
        // Clear existing options (except "All Boards")
        taskBoardFilter.innerHTML = '<option value="all">All Boards</option>';
        
        // Add boards
        Object.keys(appData.boards).forEach(boardId => {
            const board = appData.boards[boardId];
            
            // Add to filter dropdown
            const filterOption = document.createElement('option');
            filterOption.value = boardId;
            filterOption.textContent = board.name;
            taskBoardFilter.appendChild(filterOption);
        });
    }
    
    if (taskBoard) {
        taskBoard.innerHTML = '';
        
        // Add boards to task creation dropdown
        Object.keys(appData.boards).forEach(boardId => {
            const board = appData.boards[boardId];
            
            const taskOption = document.createElement('option');
            taskOption.value = boardId;
            taskOption.textContent = board.name;
            if (boardId === appData.currentBoardId) {
                taskOption.selected = true;
            }
            taskBoard.appendChild(taskOption);
        });
    }
}

/**
 * Populate task filters (groups, rows, columns)
 */
export function populateTaskFilters() {
    updateTaskGroupOptions();
    updateTaskRowOptions();
    updateTaskColumnOptions();
}

/**
 * Get all tasks from all boards
 * @returns {Array} Array of task objects with metadata
 */
export function getAllTasks() {
    const appData = getAppData();
    const tasks = [];
    
    Object.keys(appData.boards).forEach(boardId => {
        const board = appData.boards[boardId];
        if (board.rows) {
            board.rows.forEach(row => {
                if (row.cards) {
                    Object.keys(row.cards).forEach(columnKey => {
                        const column = board.columns.find(c => c.key === columnKey);
                        const group = board.groups.find(g => g.id === row.groupId);
                        
                        row.cards[columnKey].forEach(entityId => {
                            const entity = getEntity(entityId);
                            if (entity) {
                                tasks.push({
                                    ...entity,
                                    boardId,
                                    boardName: board.name,
                                    rowId: row.id,
                                    rowName: row.name,
                                    columnKey,
                                    columnName: column ? column.name : columnKey,
                                    groupId: row.groupId,
                                    groupName: group ? group.name : 'No Group',
                                    groupColor: group ? group.color : '#666'
                                });
                            }
                        });
                    });
                }
            });
        }
    });
    
    return tasks;
}

/**
 * Render the task list view
 */
export function renderTaskList() {
    const allTasks = getAllTasks();
    const filteredTasks = filterTaskList(allTasks);
    const sortedTasks = sortTaskList(filteredTasks);
    
    const container = document.getElementById('taskList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (sortedTasks.length === 0) {
        container.innerHTML = '<div class="no-tasks">No tasks found matching the current filters.</div>';
        return;
    }
    
    sortedTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        container.appendChild(taskElement);
    });
    
    // Update task count
    const taskCount = document.getElementById('taskCount');
    if (taskCount) {
        taskCount.textContent = `${sortedTasks.length} tasks`;
    }
}

/**
 * Filter task list based on current filter settings
 * @param {Array} tasks - Array of tasks to filter
 * @returns {Array} Filtered tasks
 */
export function filterTaskList(tasks) {
    const boardFilter = document.getElementById('taskBoardFilter')?.value || 'all';
    const groupFilter = document.getElementById('taskGroupFilter')?.value || 'all';
    const rowFilter = document.getElementById('taskRowFilter')?.value || 'all';
    const columnFilter = document.getElementById('taskColumnFilter')?.value || 'all';
    const statusFilter = document.getElementById('taskStatusFilter')?.value || 'all';
    const priorityFilter = document.getElementById('taskPriorityFilter')?.value || 'all';
    const searchTerm = document.getElementById('taskSearch')?.value.toLowerCase() || '';
    
    return tasks.filter(task => {
        // Board filter
        if (boardFilter !== 'all' && task.boardId !== boardFilter) return false;
        
        // Group filter
        if (groupFilter !== 'all' && task.groupId?.toString() !== groupFilter) return false;
        
        // Row filter
        if (rowFilter !== 'all' && task.rowId?.toString() !== rowFilter) return false;
        
        // Column filter
        if (columnFilter !== 'all' && task.columnKey !== columnFilter) return false;
        
        // Status filter
        if (statusFilter !== 'all') {
            if (statusFilter === 'completed' && !task.completed) return false;
            if (statusFilter === 'pending' && task.completed) return false;
        }
        
        // Priority filter
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
        
        // Search filter
        if (searchTerm && !task.title.toLowerCase().includes(searchTerm) && 
            !task.description?.toLowerCase().includes(searchTerm)) return false;
        
        return true;
    });
}

/**
 * Sort task list based on current sort settings
 * @param {Array} tasks - Array of tasks to sort
 * @returns {Array} Sorted tasks
 */
export function sortTaskList(tasks) {
    const sortBy = document.getElementById('taskSort')?.value || 'title';
    const sortOrder = document.getElementById('taskSortOrder')?.value || 'asc';
    
    const sorted = [...tasks].sort((a, b) => {
        let valueA, valueB;
        
        switch (sortBy) {
            case 'title':
                valueA = (a.title || '').toLowerCase();
                valueB = (b.title || '').toLowerCase();
                break;
            case 'board':
                valueA = (a.boardName || '').toLowerCase();
                valueB = (b.boardName || '').toLowerCase();
                break;
            case 'group':
                valueA = (a.groupName || '').toLowerCase();
                valueB = (b.groupName || '').toLowerCase();
                break;
            case 'row':
                valueA = (a.rowName || '').toLowerCase();
                valueB = (b.rowName || '').toLowerCase();
                break;
            case 'column':
                valueA = (a.columnName || '').toLowerCase();
                valueB = (b.columnName || '').toLowerCase();
                break;
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                valueA = priorityOrder[a.priority] || 0;
                valueB = priorityOrder[b.priority] || 0;
                break;
            case 'status':
                valueA = a.completed ? 1 : 0;
                valueB = b.completed ? 1 : 0;
                break;
            default:
                valueA = (a.title || '').toLowerCase();
                valueB = (b.title || '').toLowerCase();
        }
        
        if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });
    
    return sorted;
}

/**
 * Create HTML element for a task
 * @param {Object} task - Task object
 * @returns {HTMLElement} Task element
 */
export function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
    
    const priorityClass = task.priority ? `priority-${task.priority}` : '';
    
    taskElement.innerHTML = `
        <div class="task-header">
            <div class="task-checkbox">
                <input type="checkbox" ${task.completed ? 'checked' : ''} 
                       onchange="window.taskManagement.toggleTaskCompletion('${task.id}', '${task.boardId}', '${task.rowId}', '${task.columnKey}')">
            </div>
            <div class="task-title ${priorityClass}">${task.title}</div>
            <div class="task-actions">
                <button class="btn btn-small btn-secondary" 
                        onclick="window.taskManagement.editTaskFromList('${task.id}', '${task.boardId}', '${task.rowId}', '${task.columnKey}')">Edit</button>
                <button class="btn btn-small btn-danger" 
                        onclick="window.taskManagement.deleteTaskFromList('${task.id}', '${task.boardId}', '${task.rowId}', '${task.columnKey}')">Delete</button>
            </div>
        </div>
        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
        <div class="task-metadata">
            <span class="task-board">${task.boardName}</span>
            <span class="task-group" style="color: ${task.groupColor}">${task.groupName}</span>
            <span class="task-row">${task.rowName}</span>
            <span class="task-column">${task.columnName}</span>
            ${task.priority ? `<span class="task-priority priority-${task.priority}">${task.priority}</span>` : ''}
        </div>
    `;
    
    return taskElement;
}

/**
 * Filter tasks by board
 */
export function filterTasksByBoard() {
    renderTaskList();
}

/**
 * Filter tasks based on current filters
 */
export function filterTasks() {
    renderTaskList();
}

/**
 * Sort tasks based on current sort settings
 */
export function sortTasks() {
    renderTaskList();
}

/**
 * Open task modal for editing
 * @param {string} taskId - Task ID (null for new task)
 * @param {string} boardId - Board ID
 * @param {string} rowId - Row ID
 * @param {string} columnKey - Column key
 */
export function openTaskModal(taskId = null, boardId = null, rowId = null, columnKey = null) {
    const appData = getAppData();
    
    // Set defaults if not provided
    if (!boardId) boardId = appData.currentBoardId;
    
    const board = appData.boards[boardId];
    if (!board) return;
    
    if (taskId) {
        // Edit existing task
        const row = board.rows.find(r => r.id?.toString() === rowId?.toString());
        if (row && row.cards[columnKey]) {
            const task = row.cards[columnKey].find(c => c.id?.toString() === taskId?.toString());
            if (task) {
                currentEditingTask = { ...task, boardId, rowId, columnKey };
                document.getElementById('taskModalTitle').textContent = 'Edit Task';
                document.getElementById('taskTitle').value = task.title;
                document.getElementById('taskDescription').value = task.description || '';
                document.getElementById('taskPriority').value = task.priority || 'medium';
                document.getElementById('taskCompleted').checked = task.completed || false;
                document.getElementById('taskDueDate').value = task.dueDate || '';
            }
        }
    } else {
        // New task
        currentEditingTask = { boardId, rowId, columnKey };
        document.getElementById('taskModalTitle').textContent = 'Add Task';
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskPriority').value = 'medium';
        document.getElementById('taskCompleted').checked = false;
        document.getElementById('taskDueDate').value = '';
    }
    
    // Populate task modal dropdowns
    populateTaskModal(boardId, rowId, columnKey);
    
    document.getElementById('taskModal').style.display = 'block';
}

/**
 * Populate task modal dropdowns
 * @param {string} selectedBoardId - Selected board ID
 * @param {string} selectedRowId - Selected row ID
 * @param {string} selectedColumnKey - Selected column key
 */
function populateTaskModal(selectedBoardId, selectedRowId, selectedColumnKey) {
    const appData = getAppData();
    
    // Populate board dropdown
    const taskBoardSelect = document.getElementById('taskBoard');
    if (taskBoardSelect) {
        taskBoardSelect.innerHTML = '';
        Object.keys(appData.boards).forEach(boardId => {
            const board = appData.boards[boardId];
            const option = document.createElement('option');
            option.value = boardId;
            option.textContent = board.name;
            option.selected = boardId === selectedBoardId;
            taskBoardSelect.appendChild(option);
        });
    }
    
    // Update other dropdowns based on selected board
    updateTaskGroupOptions(selectedBoardId);
    updateTaskRowOptions(selectedBoardId, selectedRowId);
    updateTaskColumnOptions(selectedBoardId, selectedColumnKey);
}

/**
 * Close task modal
 */
export function closeTaskModal() {
    document.getElementById('taskModal').style.display = 'none';
    currentEditingTask = null;
}

/**
 * Save task changes
 * @param {Event} event - Form submit event
 */
export function saveTask(event) {
    event.preventDefault();
    
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const completed = document.getElementById('taskCompleted').checked;
    const dueDate = document.getElementById('taskDueDate').value || null;
    
    const selectedBoardId = document.getElementById('taskBoard').value;
    const selectedRowId = parseInt(document.getElementById('taskRow').value);
    const selectedColumnKey = document.getElementById('taskColumn').value;
    
    if (!title) {
        showStatusMessage('Please enter a task title', 'error');
        return;
    }
    
    const appData = getAppData();
    const board = appData.boards[selectedBoardId];
    const row = board.rows.find(r => r.id === selectedRowId);
    
    if (!row) {
        showStatusMessage('Selected row not found', 'error');
        return;
    }
    
    if (currentEditingTask.id) {
        // Edit existing task
        const oldBoard = appData.boards[currentEditingTask.boardId];
        const oldRow = oldBoard.rows.find(r => r.id?.toString() === currentEditingTask.rowId?.toString());
        const oldTask = oldRow.cards[currentEditingTask.columnKey].find(c => c.id?.toString() === currentEditingTask.id?.toString());
        
        if (oldTask) {
            // Update task properties
            oldTask.title = title;
            oldTask.description = description;
            oldTask.priority = priority;
            oldTask.completed = completed;
            oldTask.dueDate = dueDate;
            
            // If task moved to different location, move it
            if (selectedBoardId !== currentEditingTask.boardId || 
                selectedRowId?.toString() !== currentEditingTask.rowId?.toString() || 
                selectedColumnKey !== currentEditingTask.columnKey) {
                
                // Remove from old location
                oldRow.cards[currentEditingTask.columnKey] = oldRow.cards[currentEditingTask.columnKey].filter(c => c.id !== oldTask.id);
                
                // Add to new location
                if (!row.cards[selectedColumnKey]) row.cards[selectedColumnKey] = [];
                row.cards[selectedColumnKey].push(oldTask);
            }
        }
    } else {
        // Create new task
        const newTask = {
            id: board.nextCardId++,
            title,
            description,
            priority,
            completed,
            dueDate,
            taskIds: []
        };
        
        if (!row.cards[selectedColumnKey]) row.cards[selectedColumnKey] = [];
        row.cards[selectedColumnKey].push(newTask);
    }
    
    setAppData(appData);
    saveData();
    closeTaskModal();
    renderTaskList();
    
    // Update board view if visible
    if (window.renderBoard) window.renderBoard();
    
    showStatusMessage(currentEditingTask.id ? 'Task updated successfully' : 'Task created successfully', 'success');
}

/**
 * Update task group options dropdown
 * @param {string} selectedBoardId - Selected board ID
 */
export function updateTaskGroupOptions(selectedBoardId = null) {
    const appData = getAppData();
    const boardId = selectedBoardId || document.getElementById('taskBoardFilter')?.value || appData.currentBoardId;
    const board = appData.boards[boardId];
    
    const groupFilter = document.getElementById('taskGroupFilter');
    const taskGroup = document.getElementById('taskGroup');
    
    if (groupFilter) {
        const currentValue = groupFilter.value;
        groupFilter.innerHTML = '<option value="all">All Groups</option>';
        
        if (board && board.groups) {
            board.groups.forEach(group => {
                const option = document.createElement('option');
                option.value = group.id;
                option.textContent = group.name;
                if (option.value === currentValue) option.selected = true;
                groupFilter.appendChild(option);
            });
        }
    }
    
    if (taskGroup) {
        taskGroup.innerHTML = '<option value="">No Group</option>';
        if (board && board.groups) {
            board.groups.forEach(group => {
                const option = document.createElement('option');
                option.value = group.id;
                option.textContent = group.name;
                taskGroup.appendChild(option);
            });
        }
    }
}

/**
 * Update task row options dropdown
 * @param {string} selectedBoardId - Selected board ID
 * @param {string} selectedRowId - Selected row ID
 */
export function updateTaskRowOptions(selectedBoardId = null, selectedRowId = null) {
    const appData = getAppData();
    const boardId = selectedBoardId || document.getElementById('taskBoardFilter')?.value || appData.currentBoardId;
    const board = appData.boards[boardId];
    
    const rowFilter = document.getElementById('taskRowFilter');
    const taskRow = document.getElementById('taskRow');
    
    if (rowFilter) {
        const currentValue = rowFilter.value;
        rowFilter.innerHTML = '<option value="all">All Rows</option>';
        
        if (board && board.rows) {
            board.rows.forEach(row => {
                const option = document.createElement('option');
                option.value = row.id;
                option.textContent = row.name;
                if (option.value === currentValue) option.selected = true;
                rowFilter.appendChild(option);
            });
        }
    }
    
    if (taskRow) {
        taskRow.innerHTML = '';
        if (board && board.rows) {
            board.rows.forEach(row => {
                const option = document.createElement('option');
                option.value = row.id;
                option.textContent = row.name;
                if (selectedRowId && row.id?.toString() === selectedRowId?.toString()) {
                    option.selected = true;
                }
                taskRow.appendChild(option);
            });
        }
    }
}

/**
 * Update task column options dropdown
 * @param {string} selectedBoardId - Selected board ID
 * @param {string} selectedColumnKey - Selected column key
 */
export function updateTaskColumnOptions(selectedBoardId = null, selectedColumnKey = null) {
    const appData = getAppData();
    const boardId = selectedBoardId || document.getElementById('taskBoardFilter')?.value || appData.currentBoardId;
    const board = appData.boards[boardId];
    
    const columnFilter = document.getElementById('taskColumnFilter');
    const taskColumn = document.getElementById('taskColumn');
    
    if (columnFilter) {
        const currentValue = columnFilter.value;
        columnFilter.innerHTML = '<option value="all">All Columns</option>';
        
        if (board && board.columns) {
            board.columns.forEach(column => {
                const option = document.createElement('option');
                option.value = column.key;
                option.textContent = column.name;
                if (option.value === currentValue) option.selected = true;
                columnFilter.appendChild(option);
            });
        }
    }
    
    if (taskColumn) {
        taskColumn.innerHTML = '';
        if (board && board.columns) {
            board.columns.forEach(column => {
                const option = document.createElement('option');
                option.value = column.key;
                option.textContent = column.name;
                if (selectedColumnKey && column.key === selectedColumnKey) {
                    option.selected = true;
                }
                taskColumn.appendChild(option);
            });
        }
    }
}

/**
 * Edit task from task list view
 * @param {string} taskId - Task ID
 * @param {string} boardId - Board ID
 * @param {string} rowId - Row ID
 * @param {string} columnKey - Column key
 */
export function editTaskFromList(taskId, boardId, rowId, columnKey) {
    openTaskModal(taskId, boardId, rowId, columnKey);
}

/**
 * Delete task from task list view
 * @param {string} taskId - Task ID
 * @param {string} boardId - Board ID
 * @param {string} rowId - Row ID
 * @param {string} columnKey - Column key
 */
export function deleteTaskFromList(taskId, boardId, rowId, columnKey) {
    if (confirm('Are you sure you want to delete this task?')) {
        const appData = getAppData();
        const board = appData.boards[boardId];
        const row = board.rows.find(r => r.id?.toString() === rowId?.toString());
        
        if (row && row.cards[columnKey]) {
            row.cards[columnKey] = row.cards[columnKey].filter(c => c.id?.toString() !== taskId?.toString());
            setAppData(appData);
            saveData();
            renderTaskList();
            
            // Update board view if visible
            if (window.renderBoard) window.renderBoard();
            
            showStatusMessage('Task deleted successfully', 'success');
        }
    }
}

/**
 * Toggle task completion status
 * @param {string} taskId - Task ID
 * @param {string} boardId - Board ID
 * @param {string} rowId - Row ID
 * @param {string} columnKey - Column key
 */
export function toggleTaskCompletion(taskId, boardId, rowId, columnKey) {
    const appData = getAppData();
    const board = appData.boards[boardId];
    const row = board.rows.find(r => r.id?.toString() === rowId?.toString());
    
    if (row && row.cards[columnKey]) {
        const task = row.cards[columnKey].find(c => c.id?.toString() === taskId?.toString());
        if (task) {
            task.completed = !task.completed;
            setAppData(appData);
            saveData();
            renderTaskList();
            
            // Update board view if visible
            if (window.renderBoard) window.renderBoard();
        }
    }
}

// Make functions available globally for backwards compatibility during transition
window.populateTaskView = populateTaskView;
window.populateTaskBoardFilters = populateTaskBoardFilters;
window.populateTaskFilters = populateTaskFilters;
window.getAllTasks = getAllTasks;
window.renderTaskList = renderTaskList;
window.filterTasksByBoard = filterTasksByBoard;
window.filterTasks = filterTasks;
window.sortTasks = sortTasks;
window.openTaskModal = openTaskModal;
window.closeTaskModal = closeTaskModal;
window.saveTask = saveTask;
window.updateTaskGroupOptions = updateTaskGroupOptions;
window.updateTaskRowOptions = updateTaskRowOptions;
window.updateTaskColumnOptions = updateTaskColumnOptions;
window.editTaskFromList = editTaskFromList;
window.deleteTaskFromList = deleteTaskFromList;
window.toggleTaskCompletion = toggleTaskCompletion;

// Export module for access by other modules
window.taskManagement = {
    switchToView,
    populateTaskView,
    populateTaskBoardFilters,
    populateTaskFilters,
    getAllTasks,
    renderTaskList,
    filterTasksByBoard,
    filterTasks,
    sortTasks,
    openTaskModal,
    closeTaskModal,
    saveTask,
    updateTaskGroupOptions,
    updateTaskRowOptions,
    updateTaskColumnOptions,
    editTaskFromList,
    deleteTaskFromList,
    toggleTaskCompletion
};