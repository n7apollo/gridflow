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
 * @returns {Promise<Array>} Array of task objects with metadata
 */
export async function getAllTasks() {
    const appData = getAppData();
    const tasks = [];
    
    for (const boardId of Object.keys(appData.boards)) {
        const board = appData.boards[boardId];
        if (board.rows) {
            for (const row of board.rows) {
                if (row.cards) {
                    for (const columnKey of Object.keys(row.cards)) {
                        const column = board.columns.find(c => c.key === columnKey);
                        const group = board.groups.find(g => g.id === row.groupId);
                        
                        for (const entityId of row.cards[columnKey]) {
                            const entity = await getEntity(entityId);
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
                        }
                    }
                }
            }
        }
    }
    
    return tasks;
}

/**
 * Render the task list view
 */
export async function renderTaskList() {
    const container = document.getElementById('taskList');
    const emptyState = document.getElementById('taskEmptyState');
    if (!container) return;
    
    // Show loading state
    showTaskLoadingState(container);
    
    try {
        const allTasks = await getAllTasks();
        const filteredTasks = filterTaskList(allTasks);
        const sortedTasks = sortTaskList(filteredTasks);
        
        // Update task statistics with animation
        updateTaskStats(allTasks, filteredTasks);
        
        // Hide loading state
        hideTaskLoadingState(container);
        
        // Show/hide empty state with animation
        if (sortedTasks.length === 0) {
            container.classList.add('hidden');
            if (emptyState) {
                emptyState.classList.remove('hidden');
                emptyState.classList.add('empty-state');
                
                // Update empty state based on whether there are any tasks at all
                const isFiltered = allTasks.length > 0;
                const emptyIcon = emptyState.querySelector('i[data-lucide]');
                const emptyTitle = emptyState.querySelector('h3');
                const emptyText = emptyState.querySelector('p');
                
                if (emptyIcon) emptyIcon.setAttribute('data-lucide', isFiltered ? 'search' : 'inbox');
                if (emptyTitle) emptyTitle.textContent = isFiltered ? 'No tasks match your filters' : 'No tasks found';
                if (emptyText) emptyText.textContent = isFiltered ? 'Try adjusting your filters or create a new task' : 'Create your first task or adjust your filters';
                
                // Re-render Lucide icons
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            }
            return;
        }
        
        // Hide empty state and show tasks
        if (emptyState) emptyState.classList.add('hidden');
        container.classList.remove('hidden');
        container.innerHTML = '';
        
        // Create task elements with enhanced staggered animation
        sortedTasks.forEach((task, index) => {
            const taskElement = createTaskElement(task);
            
            // Add enhanced animation classes
            taskElement.classList.add('stagger-item', 'task-card', 'filter-transition');
            taskElement.style.opacity = '0';
            taskElement.style.transform = 'translateY(20px)';
            container.appendChild(taskElement);
            
            // Animate in with staggered delay
            setTimeout(() => {
                taskElement.classList.add('animate-in');
                taskElement.style.opacity = '1';
                taskElement.style.transform = 'translateY(0)';
            }, index * 80 + 200); // Increased delay for better effect
        });
        
        // Re-render Lucide icons after all animations
        setTimeout(() => {
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }, sortedTasks.length * 80 + 500);
        
    } catch (error) {
        console.error('Error rendering task list:', error);
        hideTaskLoadingState(container);
        if (emptyState) {
            emptyState.classList.remove('hidden');
            const emptyTitle = emptyState.querySelector('h3');
            const emptyText = emptyState.querySelector('p');
            if (emptyTitle) emptyTitle.textContent = 'Error loading tasks';
            if (emptyText) emptyText.textContent = 'Please try refreshing the page';
        }
    }
}

/**
 * Update task statistics in the dashboard
 */
function updateTaskStats(allTasks, filteredTasks) {
    const stats = {
        total: allTasks.length,
        completed: allTasks.filter(t => t.completed).length,
        pending: allTasks.filter(t => !t.completed).length,
        highPriority: allTasks.filter(t => t.priority === 'high').length
    };
    
    // Update stat counters with animation
    updateStatCounter('totalTaskCount', stats.total);
    updateStatCounter('completedTaskCount', stats.completed);
    updateStatCounter('pendingTaskCount', stats.pending);
    updateStatCounter('highPriorityTaskCount', stats.highPriority);
}

/**
 * Animate counter updates
 */
function updateStatCounter(elementId, newValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const currentValue = parseInt(element.textContent) || 0;
    if (currentValue === newValue) return;
    
    // Simple counter animation
    const increment = newValue > currentValue ? 1 : -1;
    const steps = Math.abs(newValue - currentValue);
    const stepDuration = Math.min(50, 300 / steps);
    
    let current = currentValue;
    const interval = setInterval(() => {
        current += increment;
        element.textContent = current;
        
        if (current === newValue) {
            clearInterval(interval);
        }
    }, stepDuration);
}

/**
 * Filter task list based on current filter settings
 * @param {Array} tasks - Array of tasks to filter
 * @returns {Array} Filtered tasks
 */
export function filterTaskList(tasks) {
    const boardFilter = document.getElementById('taskBoardFilter')?.value || 'all';
    const statusFilter = document.getElementById('taskStatusFilter')?.value || 'all';
    const priorityFilter = document.getElementById('taskPriorityFilter')?.value || 'all';
    const searchTerm = document.getElementById('taskSearchInput')?.value.toLowerCase() || '';
    
    // Get active quick filter
    const activeQuickFilter = document.querySelector('.badge[data-filter].badge-primary')?.dataset.filter;
    
    return tasks.filter(task => {
        // Board filter
        if (boardFilter !== 'all' && task.boardId !== boardFilter) return false;
        
        // Status filter
        if (statusFilter !== 'all') {
            if (statusFilter === 'completed' && !task.completed) return false;
            if (statusFilter === 'pending' && task.completed) return false;
        }
        
        // Priority filter
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
        
        // Search filter
        if (searchTerm && 
            !task.title.toLowerCase().includes(searchTerm) && 
            !task.description?.toLowerCase().includes(searchTerm) &&
            !task.boardName?.toLowerCase().includes(searchTerm) &&
            !task.groupName?.toLowerCase().includes(searchTerm) &&
            !task.rowName?.toLowerCase().includes(searchTerm)) return false;
        
        // Quick filters
        if (activeQuickFilter && activeQuickFilter !== 'all') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            switch (activeQuickFilter) {
                case 'today':
                    if (!task.dueDate) return false;
                    const dueDate = new Date(task.dueDate);
                    dueDate.setHours(0, 0, 0, 0);
                    if (dueDate.getTime() !== today.getTime()) return false;
                    break;
                case 'overdue':
                    if (!task.dueDate || task.completed) return false;
                    if (new Date(task.dueDate) >= today) return false;
                    break;
                case 'completed':
                    if (!task.completed) return false;
                    break;
            }
        }
        
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
 * Show loading state for task list
 */
function showTaskLoadingState(container) {
    container.classList.add('task-loading');
    container.innerHTML = `
        <div class="grid grid-cols-1 gap-4">
            ${Array(3).fill(0).map(() => `
                <div class="card bg-base-100 shadow-sm border-l-4 border-l-base-300 animate-pulse">
                    <div class="card-body p-4">
                        <div class="flex items-start gap-3 mb-3">
                            <div class="w-4 h-4 bg-base-300 rounded"></div>
                            <div class="flex-1">
                                <div class="h-4 bg-base-300 rounded w-3/4 mb-2"></div>
                                <div class="h-3 bg-base-300 rounded w-1/2"></div>
                            </div>
                            <div class="w-16 h-6 bg-base-300 rounded-full"></div>
                        </div>
                        <div class="flex gap-2 mb-3">
                            <div class="h-5 bg-base-300 rounded w-20"></div>
                            <div class="h-5 bg-base-300 rounded w-16"></div>
                            <div class="h-5 bg-base-300 rounded w-24"></div>
                        </div>
                        <div class="flex justify-end">
                            <div class="flex gap-1">
                                <div class="w-6 h-6 bg-base-300 rounded"></div>
                                <div class="w-6 h-6 bg-base-300 rounded"></div>
                                <div class="w-6 h-6 bg-base-300 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Hide loading state for task list
 */
function hideTaskLoadingState(container) {
    container.classList.remove('task-loading');
}

/**
 * Create HTML element for a task
 * @param {Object} task - Task object
 * @returns {HTMLElement} Task element
 */
export function createTaskElement(task) {
    const taskElement = document.createElement('div');
    
    // Priority colors and icons
    const priorityConfig = {
        high: { color: 'border-l-error', bg: 'bg-error/5', icon: '🔴', badge: 'badge-error' },
        medium: { color: 'border-l-warning', bg: 'bg-warning/5', icon: '🟡', badge: 'badge-warning' },
        low: { color: 'border-l-success', bg: 'bg-success/5', icon: '🟢', badge: 'badge-success' },
        default: { color: 'border-l-base-300', bg: 'bg-base-100', icon: '⚪', badge: 'badge-ghost' }
    };
    
    const priority = priorityConfig[task.priority] || priorityConfig.default;
    const isCompleted = task.completed;
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;
    const priorityClass = task.priority === 'high' ? 'priority-high' : '';
    
    // Format due date
    const formatDueDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        const today = new Date();
        const diffTime = date - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';
        if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
        if (diffDays < 7) return `In ${diffDays} days`;
        return date.toLocaleDateString();
    };
    
    taskElement.className = `card bg-base-100 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 ${priority.color} ${isCompleted ? 'opacity-60' : ''} ${priorityClass} group cursor-pointer task-card`;
    
    taskElement.innerHTML = `
        <div class="card-body p-4">
            <!-- Task Header -->
            <div class="flex items-start justify-between mb-3">
                <div class="flex items-start gap-3 flex-1">
                    <div class="form-control">
                        <label class="cursor-pointer">
                            <input type="checkbox" class="checkbox checkbox-sm task-checkbox ${isCompleted ? 'checkbox-success' : ''}" 
                                   ${isCompleted ? 'checked' : ''} 
                                   onchange="window.taskManagement.toggleTaskCompletion('${task.id}', '${task.boardId}', '${task.rowId}', '${task.columnKey}')">
                        </label>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="font-semibold text-base-content ${isCompleted ? 'line-through text-base-content/50' : ''} truncate">${task.title}</h3>
                        ${task.description ? `<p class="text-sm text-base-content/70 mt-1 line-clamp-2">${task.description}</p>` : ''}
                    </div>
                </div>
                
                <!-- Priority Badge -->
                <div class="badge ${priority.badge} badge-sm">
                    ${priority.icon} ${task.priority || 'normal'}
                </div>
            </div>
            
            <!-- Task Metadata -->
            <div class="flex flex-wrap gap-2 mb-3 text-xs">
                <div class="badge badge-outline badge-sm">
                    <i data-lucide="layers" class="w-3 h-3 mr-1"></i>
                    ${task.boardName}
                </div>
                ${task.groupName ? `
                    <div class="badge badge-outline badge-sm" style="border-color: ${task.groupColor}; color: ${task.groupColor}">
                        <i data-lucide="folder" class="w-3 h-3 mr-1"></i>
                        ${task.groupName}
                    </div>
                ` : ''}
                <div class="badge badge-outline badge-sm">
                    <i data-lucide="list" class="w-3 h-3 mr-1"></i>
                    ${task.rowName}
                </div>
                <div class="badge badge-outline badge-sm">
                    <i data-lucide="columns" class="w-3 h-3 mr-1"></i>
                    ${task.columnName}
                </div>
            </div>
            
            <!-- Due Date and Status -->
            ${task.dueDate || isCompleted ? `
                <div class="flex items-center gap-2 mb-3">
                    ${task.dueDate ? `
                        <div class="flex items-center gap-1 text-xs ${isOverdue ? 'text-error' : 'text-base-content/70'}">
                            <i data-lucide="calendar" class="w-3 h-3"></i>
                            <span>${formatDueDate(task.dueDate)}</span>
                            ${isOverdue ? '<i data-lucide="alert-triangle" class="w-3 h-3 text-error"></i>' : ''}
                        </div>
                    ` : ''}
                    ${isCompleted ? `
                        <div class="badge badge-success badge-sm">
                            <i data-lucide="check" class="w-3 h-3 mr-1"></i>
                            Completed
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            <!-- Task Actions -->
            <div class="card-actions justify-end">
                <div class="task-actions flex gap-1">
                    <button class="btn btn-ghost btn-xs task-action-btn" 
                            onclick="event.stopPropagation(); window.taskManagement.editTaskFromList('${task.id}', '${task.boardId}', '${task.rowId}', '${task.columnKey}')"
                            title="Edit task">
                        <i data-lucide="edit-2" class="w-3 h-3"></i>
                    </button>
                    <button class="btn btn-ghost btn-xs task-action-btn" 
                            onclick="event.stopPropagation(); window.taskManagement.duplicateTask('${task.id}', '${task.boardId}', '${task.rowId}', '${task.columnKey}')"
                            title="Duplicate task">
                        <i data-lucide="copy" class="w-3 h-3"></i>
                    </button>
                    <button class="btn btn-ghost btn-xs task-action-btn hover:btn-error" 
                            onclick="event.stopPropagation(); window.taskManagement.deleteTaskFromList('${task.id}', '${task.boardId}', '${task.rowId}', '${task.columnKey}')"
                            title="Delete task">
                        <i data-lucide="trash-2" class="w-3 h-3"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add click handler to open task details (optional feature)
    taskElement.addEventListener('click', (e) => {
        if (!e.target.closest('button') && !e.target.closest('input')) {
            // Could open a task detail modal here
            console.log('Task clicked:', task.id);
        }
    });
    
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

/**
 * Duplicate a task
 * @param {string} taskId - Task ID
 * @param {string} boardId - Board ID
 * @param {string} rowId - Row ID
 * @param {string} columnKey - Column key
 */
export function duplicateTask(taskId, boardId, rowId, columnKey) {
    const appData = getAppData();
    const board = appData.boards[boardId];
    const row = board.rows.find(r => r.id?.toString() === rowId?.toString());
    
    if (row && row.cards[columnKey]) {
        const originalTask = row.cards[columnKey].find(c => c.id?.toString() === taskId?.toString());
        if (originalTask) {
            const newTask = {
                ...originalTask,
                id: board.nextCardId++,
                title: `${originalTask.title} (Copy)`,
                completed: false
            };
            
            row.cards[columnKey].push(newTask);
            setAppData(appData);
            saveData();
            renderTaskList();
            
            // Update board view if visible
            if (window.renderBoard) window.renderBoard();
            
            showStatusMessage('Task duplicated successfully', 'success');
        }
    }
}

/**
 * Clear all task filters
 */
export function clearTaskFilters() {
    // Reset all filter dropdowns to default values
    const filters = [
        'taskBoardFilter',
        'taskStatusFilter',
        'taskPriorityFilter'
    ];
    
    filters.forEach(filterId => {
        const filterElement = document.getElementById(filterId);
        if (filterElement) {
            filterElement.value = filterElement.querySelector('option')?.value || '';
        }
    });
    
    // Clear search input
    const searchInput = document.getElementById('taskSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Reset quick filters
    document.querySelectorAll('.quick-filter-badge').forEach(badge => {
        badge.classList.remove('badge-primary');
        badge.classList.add('badge-ghost');
    });
    
    const allFilter = document.getElementById('filterAll');
    if (allFilter) {
        allFilter.classList.remove('badge-ghost');
        allFilter.classList.add('badge-primary');
    }
    
    // Re-render the task list
    renderTaskList();
}

/**
 * Setup enhanced task management event listeners
 */
export function setupTaskManagementEvents() {
    // Quick filter badge click handlers
    document.addEventListener('click', (event) => {
        const badge = event.target.closest('.quick-filter-badge');
        if (badge) {
            event.preventDefault();
            
            // Remove active state from all badges
            document.querySelectorAll('.quick-filter-badge').forEach(b => {
                b.classList.remove('badge-primary');
                b.classList.add('badge-ghost');
            });
            
            // Add active state to clicked badge
            badge.classList.remove('badge-ghost');
            badge.classList.add('badge-primary');
            
            // Trigger filter update
            renderTaskList();
        }
    });
    
    // Enhanced search input with debouncing
    let searchTimeout;
    const searchInput = document.getElementById('taskSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                renderTaskList();
            }, 300); // 300ms debounce
        });
        
        // Add focus animation
        searchInput.addEventListener('focus', (event) => {
            event.target.classList.add('input-primary');
        });
        
        searchInput.addEventListener('blur', (event) => {
            event.target.classList.remove('input-primary');
        });
    }
}

/**
 * Initialize task management with enhanced features
 */
export function initializeTaskManagement() {
    populateTaskView();
    setupTaskManagementEvents();
    
    // Set initial quick filter state
    const allFilter = document.getElementById('filterAll');
    if (allFilter) {
        allFilter.classList.remove('badge-ghost');
        allFilter.classList.add('badge-primary');
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
window.duplicateTask = duplicateTask;
window.clearTaskFilters = clearTaskFilters;
window.setupTaskManagementEvents = setupTaskManagementEvents;
window.initializeTaskManagement = initializeTaskManagement;

// Export module for access by other modules
window.taskManagement = {
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
    toggleTaskCompletion,
    duplicateTask,
    clearTaskFilters,
    setupTaskManagementEvents,
    initializeTaskManagement
};