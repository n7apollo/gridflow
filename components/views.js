/**
 * GridFlow Views Component
 * Contains the main application views (board, tasks, weekly)
 */

import { ENTITY_TYPES } from '../js/entity-core.js';
class GridFlowViews extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = this.getTemplate();
    }

    connectedCallback() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.addEventListener('click', this.handleClick.bind(this));
        this.addEventListener('change', this.handleChange.bind(this));
    }

    handleClick(event) {
        const button = event.target.closest('button');
        if (button && button.dataset.action) {
            const action = button.dataset.action;
            if (window[action]) {
                event.preventDefault();
                if (button.dataset.params) {
                    window[action](button.dataset.params);
                } else {
                    window[action]();
                }
            }
        }
    }

    handleChange(event) {
        const select = event.target.closest('select');
        if (select && select.dataset.action) {
            const action = select.dataset.action;
            if (window[action]) {
                window[action]();
            }
        }
    }

    getTemplate() {
        return `
            <!-- Board View -->
            <div class="board-container container mx-auto p-4" id="boardContainer">
                <!-- Streamlined Board Header -->
                <div class="board-header bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-4 mb-4">
                    <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                        <!-- Left Section: Board Selector & Info -->
                        <div class="flex items-center gap-3 w-full lg:w-auto">
                            <!-- Mobile Menu Button -->
                            <button class="btn btn-square btn-ghost lg:hidden" onclick="document.getElementById('drawer-toggle').checked = true" title="Open Menu">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
                            </button>
                            
                            <!-- Board Icon & Selector -->
                            <div class="flex items-center gap-3 flex-1">
                                <div class="p-2 bg-primary/20 rounded-xl hidden sm:block">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-dashboard text-primary"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                                </div>
                                <div class="dropdown dropdown-bottom">
                                    <button class="btn btn-sm btn-ghost p-0 h-auto font-normal text-left hover:bg-transparent" data-action="toggleBoardDropdown" id="currentBoardBtn">
                                        <div>
                                            <div class="text-lg font-semibold text-base-content flex items-center gap-2">
                                                <span class="current-board-name" id="currentBoardName">Loading...</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>
                                            </div>
                                            <div class="text-xs text-base-content/70">Kanban Board</div>
                                        </div>
                                    </button>
                                    <div class="dropdown-content z-[1] menu p-2 shadow-xl bg-base-100 rounded-box w-64 mt-2" id="boardDropdown">
                                        <div class="mb-2">
                                            <input type="text" placeholder="Search boards..." id="boardSearchInput" class="input input-bordered input-sm w-full" />
                                        </div>
                                        <div class="board-list max-h-40 overflow-y-auto mb-2" id="boardList">
                                            <!-- Populated dynamically -->
                                        </div>
                                        <div class="flex gap-2">
                                            <button class="btn btn-success btn-sm flex-1" data-action="createNewBoard">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                                <span>New Board</span>
                                            </button>
                                            <button class="btn btn-outline btn-sm flex-1" data-action="showBoardModal">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                                                <span>Manage</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Right Section: Actions -->
                        <div class="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                            <!-- Primary Actions -->
                            <div class="flex gap-2 mr-2">
                                <button class="btn btn-primary btn-sm shadow-lg" data-action="addRow">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                    Add Row
                                </button>
                                <div class="dropdown dropdown-bottom dropdown-end">
                                    <button class="btn btn-ghost btn-sm" tabindex="0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>
                                    </button>
                                    <div class="dropdown-content menu p-2 shadow-xl bg-base-100 rounded-box w-40 mt-1">
                                        <button class="btn btn-ghost btn-sm justify-start" data-action="addGroup">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-plus"><path d="M12 10v6"/><path d="M9 13h6"/><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
                                            Add Group
                                        </button>
                                        <button class="btn btn-ghost btn-sm justify-start" data-action="addColumn">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-columns-2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 3v18"/></svg>
                                            Add Column
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Secondary Actions -->
                            <div class="flex gap-1">
                                <div class="dropdown dropdown-bottom dropdown-end">
                                    <button class="btn btn-ghost btn-sm" data-action="toggleTemplatesMenu" id="templatesBtn">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-template"><rect width="18" height="7" x="3" y="3" rx="1"/><rect width="9" height="7" x="3" y="14" rx="1"/><rect width="5" height="7" x="15" y="14" rx="1"/></svg>
                                        <span class="hidden sm:inline">Templates</span>
                                    </button>
                                    <div class="dropdown-content z-[1] menu p-2 shadow-xl bg-base-100 rounded-box w-52 mt-1" id="templatesDropdown">
                                        <button class="btn btn-ghost btn-sm justify-start" data-action="showApplyTemplateModal">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                            Apply Template
                                        </button>
                                        <button class="btn btn-ghost btn-sm justify-start" data-action="showSaveAsTemplateModal">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-save"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg>
                                            Save as Template
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="dropdown dropdown-bottom dropdown-end">
                                    <button class="btn btn-ghost btn-sm" tabindex="0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-more-vertical"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                    </button>
                                    <div class="dropdown-content menu p-2 shadow-xl bg-base-100 rounded-box w-52 mt-1">
                                        <li class="menu-title">
                                            <span>Export Options</span>
                                        </li>
                                        <button class="btn btn-ghost btn-sm justify-start" data-action="exportToPDF">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                                            Export as PDF
                                        </button>
                                        <button class="btn btn-ghost btn-sm justify-start" data-action="exportToPNG">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                            Export as PNG
                                        </button>
                                        <button class="btn btn-ghost btn-sm justify-start" data-action="exportToExcel">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-table"><path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>
                                            Export as Excel
                                        </button>
                                        <li class="divider my-1"></li>
                                        <button class="btn btn-ghost btn-sm justify-start" data-action="toggleSettings">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings-2"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
                                            Board Settings
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Compact Settings Panel -->
                <div class="settings-panel bg-base-200 rounded-lg p-3 mb-3 hidden" id="settingsPanel">
                    <div class="flex flex-wrap items-center gap-4">
                        <label class="label cursor-pointer gap-2 flex-1">
                            <input type="checkbox" id="showCheckboxes" class="checkbox checkbox-sm" onchange="toggleCheckboxes()">
                            <span class="label-text">Show Checkboxes</span>
                        </label>
                        <label class="label cursor-pointer gap-2 flex-1">
                            <input type="checkbox" id="showSubtaskProgress" class="checkbox checkbox-sm" onchange="toggleSubtaskProgress()">
                            <span class="label-text">Show Subtask Progress</span>
                        </label>
                        <button class="btn btn-ghost btn-xs" data-action="toggleSettings">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                    </div>
                </div>
                
                <div class="board-header" id="boardHeader">
                    <!-- Column headers will be dynamically generated -->
                </div>
                <div class="rows-container" id="rowsContainer">
                    <!-- Rows will be dynamically added here -->
                </div>
            </div>

            <!-- Task Management Interface -->
            <div class="task-container w-full max-w-none hidden" id="taskContainer">
                <!-- Task Header with Search and Actions -->
                <div class="task-header bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-6 mb-6">
                    <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                        <div class="flex items-center gap-3">
                            <div class="p-3 bg-primary/20 rounded-xl">
                                <i data-lucide="check-square" class="w-6 h-6 text-primary"></i>
                            </div>
                            <div>
                                <h2 class="text-2xl font-bold text-base-content">Task Management</h2>
                                <p class="text-sm text-base-content/70">Organize and track all your tasks across boards</p>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button class="btn btn-primary shadow-lg" data-action="openTaskModal">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                                Add Task
                            </button>
                            <div class="dropdown dropdown-end">
                                <button class="btn btn-ghost" tabindex="0">
                                    <i data-lucide="filter" class="w-4 h-4"></i>
                                </button>
                                <div class="dropdown-content menu p-2 shadow-xl bg-base-100 rounded-box w-52 mt-1">
                                    <button class="btn btn-ghost btn-sm justify-start" data-action="clearAllFilters">
                                        <i data-lucide="x" class="w-4 h-4"></i>
                                        Clear Filters
                                    </button>
                                    <button class="btn btn-ghost btn-sm justify-start" data-action="exportTasks">
                                        <i data-lucide="download" class="w-4 h-4"></i>
                                        Export Tasks
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Search and Filters -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        <!-- Search -->
                        <div class="lg:col-span-2">
                            <label class="input input-bordered flex items-center gap-2">
                                <svg class="h-4 w-4 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                    <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <path d="m21 21-4.3-4.3"></path>
                                    </g>
                                </svg>
                                <input type="search" id="taskSearchInput" placeholder="Search tasks..." 
                                       class="grow task-search-input" data-action="filterTasks">
                                <kbd class="kbd kbd-sm opacity-50">⌘</kbd>
                                <kbd class="kbd kbd-sm opacity-50">K</kbd>
                            </label>
                        </div>

                        <!-- Board Filter -->
                        <div class="form-control">
                            <select id="taskBoardFilter" data-action="filterTasksByBoard" class="select select-bordered">
                                <option value="all">All Boards</option>
                                <!-- Board options will be populated dynamically -->
                            </select>
                        </div>

                        <!-- Status Filter -->
                        <div class="form-control">
                            <select id="taskStatusFilter" data-action="filterTasks" class="select select-bordered">
                                <option value="all">All Statuses</option>
                                <option value="pending">📋 Pending</option>
                                <option value="completed">✅ Completed</option>
                            </select>
                        </div>

                        <!-- Priority Filter -->
                        <div class="form-control">
                            <select id="taskPriorityFilter" data-action="filterTasks" class="select select-bordered">
                                <option value="all">All Priorities</option>
                                <option value="high">🔴 High</option>
                                <option value="medium">🟡 Medium</option>
                                <option value="low">🟢 Low</option>
                            </select>
                        </div>

                        <!-- Sort Options -->
                        <div class="form-control">
                            <div class="join">
                                <select id="taskSortBy" data-action="sortTasks" class="select select-bordered join-item">
                                    <option value="title">Title</option>
                                    <option value="priority">Priority</option>
                                    <option value="dueDate">Due Date</option>
                                    <option value="board">Board</option>
                                    <option value="status">Status</option>
                                </select>
                                <button class="btn btn-square join-item" id="taskSortOrder" data-action="toggleSortOrder" title="Toggle sort order">
                                    <i data-lucide="arrow-down" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Task Stats -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div class="stat bg-base-100/50 rounded-xl stat-card">
                            <div class="stat-figure text-primary">
                                <i data-lucide="list-todo" class="w-8 h-8"></i>
                            </div>
                            <div class="stat-title text-xs">Total Tasks</div>
                            <div class="stat-value text-lg stat-counter" id="totalTaskCount">0</div>
                        </div>
                        <div class="stat bg-base-100/50 rounded-xl stat-card">
                            <div class="stat-figure text-success">
                                <i data-lucide="check-circle" class="w-8 h-8"></i>
                            </div>
                            <div class="stat-title text-xs">Completed</div>
                            <div class="stat-value text-lg stat-counter" id="completedTaskCount">0</div>
                        </div>
                        <div class="stat bg-base-100/50 rounded-xl stat-card">
                            <div class="stat-figure text-warning">
                                <i data-lucide="clock" class="w-8 h-8"></i>
                            </div>
                            <div class="stat-title text-xs">Pending</div>
                            <div class="stat-value text-lg stat-counter" id="pendingTaskCount">0</div>
                        </div>
                        <div class="stat bg-base-100/50 rounded-xl stat-card">
                            <div class="stat-figure text-error">
                                <i data-lucide="alert-circle" class="w-8 h-8"></i>
                            </div>
                            <div class="stat-title text-xs">High Priority</div>
                            <div class="stat-value text-lg stat-counter" id="highPriorityTaskCount">0</div>
                        </div>
                    </div>
                </div>

                <!-- Task List -->
                <div class="task-list-container">
                    <!-- Quick Filters -->
                    <div class="mb-6">
                        <div class="flex items-center gap-3 mb-3">
                            <h4 class="text-sm font-medium text-base-content/70">Quick Filters:</h4>
                            <button class="btn btn-ghost btn-xs" onclick="window.taskManagement.clearTaskFilters()" title="Clear all filters">
                                <i data-lucide="x" class="w-3 h-3"></i>
                                Clear
                            </button>
                        </div>
                        <ul class="menu menu-horizontal bg-base-200 rounded-box p-2 gap-1 shadow-sm">
                            <li>
                                <a class="quick-filter-menu active" data-filter="all" id="filterAll">
                                    <i data-lucide="list" class="w-4 h-4"></i>
                                    All Tasks
                                </a>
                            </li>
                            <li>
                                <a class="quick-filter-menu" data-filter="today" id="filterToday">
                                    <i data-lucide="calendar-days" class="w-4 h-4"></i>
                                    Due Today
                                </a>
                            </li>
                            <li>
                                <a class="quick-filter-menu" data-filter="overdue" id="filterOverdue">
                                    <i data-lucide="clock" class="w-4 h-4"></i>
                                    Overdue
                                </a>
                            </li>
                            <li>
                                <a class="quick-filter-menu" data-filter="completed" id="filterCompleted">
                                    <i data-lucide="check-circle" class="w-4 h-4"></i>
                                    Completed
                                </a>
                            </li>
                            <li>
                                <a class="quick-filter-menu" data-filter="high-priority" id="filterHighPriority">
                                    <i data-lucide="alert-circle" class="w-4 h-4"></i>
                                    High Priority
                                </a>
                            </li>
                        </ul>
                    </div>

                    <!-- Task List -->
                    <ul class="list bg-base-100 rounded-box shadow-md" id="taskList">
                        <!-- Tasks will be populated here -->
                    </ul>

                    <!-- Empty State -->
                    <div class="task-empty-state text-center py-12 hidden" id="taskEmptyState">
                        <div class="mb-4">
                            <i data-lucide="inbox" class="w-16 h-16 mx-auto text-base-content/30"></i>
                        </div>
                        <h3 class="text-xl font-semibold text-base-content/70 mb-2">No tasks found</h3>
                        <p class="text-base-content/50 mb-4">Create your first task or adjust your filters</p>
                        <button class="btn btn-primary" data-action="openTaskModal">
                            <i data-lucide="plus" class="w-4 h-4"></i>
                            Create Task
                        </button>
                    </div>
                </div>
            </div>

            <!-- People Management Interface -->
            <div class="people-container min-h-screen" id="peopleContainer">
                <!-- People List View -->
                <div class="people-list-view" id="peopleListView">
                    <div class="task-container min-h-screen p-4">
                        <!-- People Header with Search and Actions -->
                        <div class="people-header bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-6 mb-6">
                            <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                                <div class="flex items-center gap-3">
                                    <div class="p-3 bg-primary/20 rounded-xl">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                    </div>
                                    <div>
                                        <h2 class="text-2xl font-bold text-base-content">People Management</h2>
                                        <p class="text-sm text-base-content/70">Track relationships and interactions with your contacts</p>
                                    </div>
                                </div>
                                <div class="flex gap-2">
                                    <button class="btn btn-primary shadow-lg" onclick="showCreatePersonModal()">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-plus"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
                                        Add Person
                                    </button>
                                    <div class="dropdown dropdown-end">
                                        <button class="btn btn-ghost" tabindex="0">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-more-vertical"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                        </button>
                                        <div class="dropdown-content menu p-2 shadow-xl bg-base-100 rounded-box w-52 mt-1">
                                            <button class="btn btn-ghost btn-sm justify-start" onclick="exportPeople()">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                                Export People
                                            </button>
                                            <button class="btn btn-ghost btn-sm justify-start" onclick="importPeople()">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-upload"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                                                Import People
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Search and Quick Filters -->
                            <div class="search-section">
                                <label class="input input-bordered flex items-center gap-2 mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                                    <input type="text" id="peopleSearch" class="grow people-search-input" placeholder="Search people by name, email, or company..." />
                                    <kbd class="kbd kbd-sm">⌘</kbd>
                                    <kbd class="kbd kbd-sm">K</kbd>
                                </label>

                                <!-- Quick Filters -->
                            <ul class="menu menu-horizontal bg-base-200 rounded-box p-2 gap-1 shadow-sm">
                                <li><a class="quick-filter-menu" data-filter="all">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                    All People
                                </a></li>
                                <li><a class="quick-filter-menu" data-filter="coworker">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-briefcase"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                                    Coworkers
                                </a></li>
                                <li><a class="quick-filter-menu" data-filter="friend">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                    Friends
                                </a></li>
                                <li><a class="quick-filter-menu" data-filter="family">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-home"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
                                    Family
                                </a></li>
                                <li><a class="quick-filter-menu" data-filter="overdue">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                                    Follow-up Needed
                                </a></li>
                            </ul>
                            </div>
                        </div>

                        <!-- People Stats -->
                        <div class="flex justify-between items-center mb-4">
                            <div class="people-stats">
                                <span class="text-base-content/70">
                                    Showing <span id="totalPeopleCount">0</span> people
                                </span>
                            </div>
                        </div>

                        <!-- People List -->
                        <ul class="list bg-base-100 rounded-box shadow-md" id="peopleList">
                            <!-- People list items will be populated here -->
                        </ul>
                    </div>
                </div>

                <!-- Person Detail View -->
                <div class="person-detail-view hidden" id="personDetailView">
                    <div class="task-container min-h-screen p-4">
                        <!-- Header with Back Button -->
                        <div class="detail-header flex items-center gap-4 mb-6">
                            <button class="btn btn-ghost btn-circle" onclick="showPeopleList()">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                            </button>
                            <div class="flex-1">
                                <h1 class="text-2xl font-bold" id="personDetailName">Person Name</h1>
                                <div class="text-base-content/70" id="personDetailSubtitle">Subtitle</div>
                            </div>
                            <div class="person-detail-actions flex gap-2">
                                <button class="btn btn-secondary" onclick="editPerson()">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 1 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    Edit
                                </button>
                                <button class="btn btn-error" onclick="deletePerson()">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-2 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                    Delete
                                </button>
                            </div>
                        </div>

                        <!-- Person Info Cards -->
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                            <!-- Contact Information -->
                            <div class="card bg-base-100 shadow-md">
                                <div class="card-body">
                                    <h3 class="card-title text-lg">Contact Information</h3>
                                    <div class="space-y-3">
                                        <div id="personEmail"></div>
                                        <div id="personPhone"></div>
                                        <div id="personCompany"></div>
                                        <div id="personRole"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Relationship Information -->
                            <div class="card bg-base-100 shadow-md">
                                <div class="card-body">
                                    <h3 class="card-title text-lg">Relationship</h3>
                                    <div class="space-y-3">
                                        <div id="personRelationshipType"></div>
                                        <div id="personInteractionFrequency"></div>
                                        <div id="personLastInteraction"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Quick Stats -->
                            <div class="card bg-base-100 shadow-md">
                                <div class="card-body">
                                    <h3 class="card-title text-lg">Activity</h3>
                                    <div class="space-y-3">
                                        <div class="stat">
                                            <div class="stat-title">Total Interactions</div>
                                            <div class="stat-value text-lg" id="totalInteractions">0</div>
                                        </div>
                                        <div class="stat">
                                            <div class="stat-title">Last Contact</div>
                                            <div class="stat-value text-lg" id="lastContactStat">Never</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Timeline Section -->
                        <div class="card bg-base-100 shadow-md">
                            <div class="card-body">
                                <div class="timeline-header flex items-center justify-between mb-4">
                                    <h3 class="card-title text-lg">Timeline</h3>
                                    <div class="timeline-actions flex gap-2">
                                        <select id="timelineTypeFilter" class="select select-sm select-bordered">
                                            <option value="">All Types</option>
                                            <option value="${ENTITY_TYPES.TASK}">Tasks</option>
                                            <option value="${ENTITY_TYPES.NOTE}">Notes</option>
                                            <option value="${ENTITY_TYPES.CHECKLIST}">Checklists</option>
                                            <option value="${ENTITY_TYPES.PROJECT}">Projects</option>
                                        </select>
                                        <button class="btn btn-sm btn-primary" onclick="addNoteForPerson()">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                            Add Note
                                        </button>
                                    </div>
                                </div>
                                <div class="timeline-content max-h-96 overflow-y-auto" id="personTimeline">
                                    <!-- Timeline items will be populated here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Collections Management Interface -->
            <div class="collections-container min-h-screen" id="collectionsContainer">
                <!-- Collections List View -->
                <div class="collections-list-view" id="collectionsListView">
                    <div class="task-container min-h-screen p-4">
                        <!-- Collections Header with Search and Actions -->
                        <div class="collections-header bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-6 mb-6">
                            <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                                <div class="flex items-center gap-3">
                                    <div class="p-3 bg-primary/20 rounded-xl">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-open text-primary"><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/></svg>
                                    </div>
                                    <div>
                                        <h2 class="text-2xl font-bold text-base-content">Collections</h2>
                                        <p class="text-sm text-base-content/70">Organize and save your searches and entity groups</p>
                                    </div>
                                </div>
                                <div class="flex gap-2">
                                    <button class="btn btn-primary shadow-lg" onclick="showCreateCollectionModal()">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-plus"><path d="M12 10v6"/><path d="M9 13h6"/><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                                        Create Collection
                                    </button>
                                    <div class="dropdown dropdown-end">
                                        <button class="btn btn-ghost" tabindex="0">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-more-vertical"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                        </button>
                                        <div class="dropdown-content menu p-2 shadow-xl bg-base-100 rounded-box w-52 mt-1">
                                            <button class="btn btn-ghost btn-sm justify-start" onclick="exportCollections()">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                                Export Collections
                                            </button>
                                            <button class="btn btn-ghost btn-sm justify-start" onclick="importCollections()">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-upload"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                                                Import Collections
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Search and Filters -->
                            <div class="search-section">
                                <label class="input input-bordered flex items-center gap-2 mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                                    <input type="text" id="collectionsSearch" class="grow collections-search-input" placeholder="Search collections by name or description..." />
                                    <kbd class="kbd kbd-sm">⌘</kbd>
                                    <kbd class="kbd kbd-sm">K</kbd>
                                </label>

                                <!-- Quick Filters -->
                                <ul class="menu menu-horizontal bg-base-200 rounded-box p-2 gap-1 shadow-sm">
                                    <li><a class="quick-filter-menu" data-filter="all">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                                        All Collections
                                    </a></li>
                                    <li><a class="quick-filter-menu" data-filter="saved_search">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                                        Saved Searches
                                    </a></li>
                                    <li><a class="quick-filter-menu" data-filter="manual">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hand"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
                                        Manual
                                    </a></li>
                                    <li><a class="quick-filter-menu" data-filter="smart">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
                                        Smart
                                    </a></li>
                                </ul>
                            </div>
                        </div>

                        <!-- Collections Stats -->
                        <div class="flex justify-between items-center mb-4">
                            <div class="collections-stats">
                                <span class="text-base-content/70">
                                    Showing <span id="totalCollectionsCount">0</span> collections
                                </span>
                            </div>
                        </div>

                        <!-- Collections List -->
                        <ul class="list bg-base-100 rounded-box shadow-md" id="collectionsList">
                            <!-- Collections list items will be populated here -->
                        </ul>
                    </div>
                </div>

                <!-- Collection Detail View -->
                <div class="collection-detail-view hidden" id="collectionDetailView">
                    <div class="task-container min-h-screen p-4">
                        <!-- Header with Back Button -->
                        <div class="detail-header flex items-center gap-4 mb-6">
                            <button class="btn btn-ghost btn-circle" onclick="showCollectionsList()">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                            </button>
                            <div class="flex-1">
                                <h1 class="text-2xl font-bold" id="collectionDetailName">Collection Name</h1>
                                <div class="text-base-content/70" id="collectionDetailSubtitle">Subtitle</div>
                            </div>
                            <div class="collection-detail-actions flex gap-2">
                                <button class="btn btn-secondary" onclick="editCollection()">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 1 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    Edit
                                </button>
                                <button class="btn btn-error" onclick="deleteCollection()">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-2 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                    Delete
                                </button>
                            </div>
                        </div>

                        <!-- Collection Info Cards -->
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                            <!-- Collection Details -->
                            <div class="card bg-base-100 shadow-md col-span-2">
                                <div class="card-body">
                                    <h3 class="card-title text-lg">Details</h3>
                                    <div class="space-y-3">
                                        <div id="collectionDescription"></div>
                                        <div class="flex gap-4 text-sm">
                                            <span id="collectionType"></span>
                                            <span id="collectionCategory"></span>
                                            <span id="collectionLastUpdated"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Stats -->
                            <div class="card bg-base-100 shadow-md">
                                <div class="card-body">
                                    <h3 class="card-title text-lg">Stats</h3>
                                    <div class="space-y-3">
                                        <div class="stat">
                                            <div class="stat-title">Items</div>
                                            <div class="stat-value text-lg" id="collectionItemCount">0</div>
                                        </div>
                                        <button class="btn btn-sm btn-primary w-full" onclick="refreshCollectionItems()">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-cw"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                                            Refresh
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Collection Items -->
                        <div class="card bg-base-100 shadow-md">
                            <div class="card-body">
                                <h3 class="card-title text-lg mb-4">Items</h3>
                                <div class="items-content max-h-96 overflow-y-auto" id="collectionItems">
                                    <!-- Collection items will be populated here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tags Management Interface -->
            <div class="tags-container min-h-screen" id="tagsContainer">
                <!-- Tags List View -->
                <div class="tags-list-view" id="tagsListView">
                    <div class="task-container min-h-screen p-4">
                        <!-- Tags Header with Search and Actions -->
                        <div class="tags-header bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-6 mb-6">
                            <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                                <div class="flex items-center gap-3">
                                    <div class="p-3 bg-primary/20 rounded-xl">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tags text-primary"><path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5Z"/><path d="M6 9.01V9"/><path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19"/></svg>
                                    </div>
                                    <div>
                                        <h2 class="text-2xl font-bold text-base-content">Tags</h2>
                                        <p class="text-sm text-base-content/70">Organize and categorize your entities with tags</p>
                                    </div>
                                </div>
                                <div class="flex gap-2">
                                    <button class="btn btn-primary shadow-lg" onclick="showCreateTagModal()">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tag-plus"><path d="M12 9v6"/><path d="M9 12h6"/><path d="M21.42 10.922a1 1 0 0 0-.019-1.394L12.83 1.077a1 1 0 0 0-1.414 0L3.025 9.466A4 4 0 0 0 2 12.378V19a2 2 0 0 0 2 2h6.621a4 4 0 0 0 2.912-1.025L21.42 12.09a1 1 0 0 0 0-1.167Z"/></svg>
                                        Create Tag
                                    </button>
                                    <div class="dropdown dropdown-end">
                                        <button class="btn btn-ghost" tabindex="0">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-more-vertical"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                        </button>
                                        <div class="dropdown-content menu p-2 shadow-xl bg-base-100 rounded-box w-52 mt-1">
                                            <button class="btn btn-ghost btn-sm justify-start" onclick="exportTags()">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                                Export Tags
                                            </button>
                                            <button class="btn btn-ghost btn-sm justify-start" onclick="importTags()">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-upload"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                                                Import Tags
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Search and Filters -->
                            <div class="search-section">
                                <label class="input input-bordered flex items-center gap-2 mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                                    <input type="text" id="tagsSearch" class="grow tags-search-input" placeholder="Search tags by name..." />
                                    <kbd class="kbd kbd-sm">⌘</kbd>
                                    <kbd class="kbd kbd-sm">K</kbd>
                                </label>

                                <!-- Quick Filters -->
                                <ul class="menu menu-horizontal bg-base-200 rounded-box p-2 gap-1 shadow-sm">
                                    <li><a class="quick-filter-menu" data-filter="all">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tags"><path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5Z"/><path d="M6 9.01V9"/><path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19"/></svg>
                                        All Tags
                                    </a></li>
                                    <li><a class="quick-filter-menu" data-filter="work">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-briefcase"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                                        Work
                                    </a></li>
                                    <li><a class="quick-filter-menu" data-filter="personal">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                        Personal
                                    </a></li>
                                    <li><a class="quick-filter-menu" data-filter="priority">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                                        Priority
                                    </a></li>
                                    <li><a class="quick-filter-menu" data-filter="popular">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-up"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/><polyline points="16,7 22,7 22,13"/></svg>
                                        Most Used
                                    </a></li>
                                </ul>
                            </div>
                        </div>

                        <!-- Tags Stats -->
                        <div class="flex justify-between items-center mb-4">
                            <div class="tags-stats">
                                <span class="text-base-content/70">
                                    Showing <span id="totalTagsCount">0</span> tags
                                </span>
                            </div>
                        </div>

                        <!-- Tags List -->
                        <ul class="list bg-base-100 rounded-box shadow-md" id="tagsList">
                            <!-- Tags list items will be populated here -->
                        </ul>
                    </div>
                </div>

                <!-- Tag Detail View -->
                <div class="tag-detail-view hidden" id="tagDetailView">
                    <div class="task-container min-h-screen p-4">
                        <!-- Header with Back Button -->
                        <div class="detail-header flex items-center gap-4 mb-6">
                            <button class="btn btn-ghost btn-circle" onclick="showTagsList()">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                            </button>
                            <div class="flex-1 flex items-center gap-3">
                                <div class="tag-color-indicator w-6 h-6 rounded-full" id="tagDetailColorIndicator"></div>
                                <div>
                                    <h1 class="text-2xl font-bold" id="tagDetailName">Tag Name</h1>
                                    <div class="text-base-content/70" id="tagDetailSubtitle">Category</div>
                                </div>
                            </div>
                            <div class="tag-detail-actions flex gap-2">
                                <button class="btn btn-secondary" onclick="editTag()">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 1 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    Edit
                                </button>
                                <button class="btn btn-error" onclick="deleteTag()">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-2 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                    Delete
                                </button>
                            </div>
                        </div>

                        <!-- Tag Info Cards -->
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                            <!-- Tag Details -->
                            <div class="card bg-base-100 shadow-md">
                                <div class="card-body">
                                    <h3 class="card-title text-lg">Details</h3>
                                    <div class="space-y-3">
                                        <div id="tagDescription"></div>
                                        <div class="divider"></div>
                                        <div class="text-sm space-y-2">
                                            <div id="tagCategory"></div>
                                            <div id="tagCreatedAt"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Usage Stats -->
                            <div class="card bg-base-100 shadow-md">
                                <div class="card-body">
                                    <h3 class="card-title text-lg">Usage</h3>
                                    <div class="space-y-3">
                                        <div class="stat">
                                            <div class="stat-title">Total Uses</div>
                                            <div class="stat-value text-lg" id="tagUsageCount">0</div>
                                        </div>
                                        <div class="stat">
                                            <div class="stat-title">Last Used</div>
                                            <div class="stat-value text-sm" id="tagLastUsed">Never</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Related Tags -->
                            <div class="card bg-base-100 shadow-md">
                                <div class="card-body">
                                    <h3 class="card-title text-lg">Related Tags</h3>
                                    <div class="space-y-2" id="relatedTags">
                                        <!-- Related tags will be populated here -->
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Tagged Items -->
                        <div class="card bg-base-100 shadow-md">
                            <div class="card-body">
                                <h3 class="card-title text-lg mb-4">Tagged Items</h3>
                                <div class="items-content max-h-96 overflow-y-auto" id="taggedItems">
                                    <!-- Tagged items will be populated here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
                    </div>

                    <!-- Tagged Entities -->
                    <div class="tagged-entities">
                        <div class="entities-header flex items-center justify-between mb-2">
                            <h4 class="font-semibold">Tagged Items</h4>
                            <div class="entities-filters flex gap-2">
                                <select id="taggedEntitiesTypeFilter" class="select select-sm select-bordered">
                                    <option value="">All Types</option>
                                    <option value="${ENTITY_TYPES.TASK}">Tasks</option>
                                    <option value="${ENTITY_TYPES.NOTE}">Notes</option>
                                    <option value="${ENTITY_TYPES.CHECKLIST}">Checklists</option>
                                    <option value="${ENTITY_TYPES.PROJECT}">Projects</option>
                                </select>
                            </div>
                        </div>
                        <div class="entities-content space-y-2 max-h-96 overflow-y-auto" id="taggedEntities">
                            <!-- Tagged entities will be populated here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Weekly Planning Interface -->
            <div class="weekly-container card bg-base-100 shadow-lg p-4 mt-4 hidden" id="weeklyContainer">
                <div class="weekly-header mb-4">
                    <div class="weekly-navigation flex items-center justify-between gap-2">
                        <button class="btn btn-secondary" data-action="navigateWeek" data-params="prev" id="prevWeekBtn">← Previous Week</button>
                        <div class="week-info text-center">
                            <h2 class="week-title text-lg font-bold" id="weekTitle">Current Week</h2>
                            <div class="week-dates text-sm text-gray-500" id="weekDates">
                                <!-- Week dates will be populated -->
                            </div>
                        </div>
                        <button class="btn btn-secondary" data-action="navigateWeek" data-params="next" id="nextWeekBtn">Next Week →</button>
                    </div>
                    <div class="weekly-actions flex gap-2 mt-2">
                        <button class="btn btn-secondary" data-action="showWeeklyReflectionModal">✍️ Reflection</button>
                        <button class="btn btn-primary" data-action="addWeeklyNote" data-params="monday">+ Add Note</button>
                    </div>
                </div>
                
                <div class="weekly-content">
                    <!-- Weekly Goal Section -->
                    <div class="weekly-goal-section card bg-base-200 p-4 mb-4">
                        <div class="goal-header flex items-center justify-between mb-2">
                            <h3 class="font-semibold">Weekly Focus Goal</h3>
                            <button class="btn btn-xs btn-secondary" data-action="editWeeklyGoal" id="editGoalBtn">Edit</button>
                        </div>
                        <div class="goal-content">
                            <div class="weekly-goal cursor-pointer" id="weeklyGoal">Click to set your weekly focus goal...</div>
                            <div class="weekly-goal-form flex gap-2 mt-2" id="weeklyGoalForm" style="display: none;">
                                <input type="text" id="weeklyGoalInput" placeholder="Enter your weekly focus goal..." class="input input-bordered flex-1" />
                                <div class="goal-actions flex gap-2">
                                    <button class="btn btn-xs btn-primary" data-action="saveWeeklyGoal">Save</button>
                                    <button class="btn btn-xs btn-secondary" data-action="cancelGoalEdit">Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Daily Planning Grid -->
                    <div class="daily-planning-grid grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[600px]">
                        <div class="day-column card bg-base-100 shadow-sm border border-base-300 p-4 min-w-0" id="mondayColumn">
                            <div class="day-header flex items-center justify-between mb-4 pb-2 border-b border-base-300">
                                <div class="flex items-center gap-3">
                                    <div class="badge badge-neutral badge-lg font-bold text-lg min-w-[2.5rem]" id="mondayDate">1</div>
                                    <h3 class="font-semibold text-base">Monday</h3>
                                </div>
                                <button class="btn btn-sm btn-ghost btn-circle" data-action="addDailyItem" data-params="monday" title="Add item">
                                    <i data-lucide="plus" class="w-4 h-4"></i>
                                </button>
                            </div>
                            <div class="day-items space-y-2" id="mondayItems">
                                <!-- Monday items will be populated -->
                            </div>
                        </div>
                        
                        <div class="day-column card bg-base-100 shadow-sm border border-base-300 p-4 min-w-0" id="tuesdayColumn">
                            <div class="day-header flex items-center justify-between mb-4 pb-2 border-b border-base-300">
                                <div class="flex items-center gap-3">
                                    <div class="badge badge-neutral badge-lg font-bold text-lg min-w-[2.5rem]" id="tuesdayDate">2</div>
                                    <h3 class="font-semibold text-base">Tuesday</h3>
                                </div>
                                <button class="btn btn-sm btn-ghost btn-circle" data-action="addDailyItem" data-params="tuesday" title="Add item">
                                    <i data-lucide="plus" class="w-4 h-4"></i>
                                </button>
                            </div>
                            <div class="day-items space-y-2" id="tuesdayItems">
                                <!-- Tuesday items will be populated -->
                            </div>
                        </div>
                        
                        <div class="day-column card bg-base-100 shadow-sm border border-base-300 p-4 min-w-0" id="wednesdayColumn">
                            <div class="day-header flex items-center justify-between mb-4 pb-2 border-b border-base-300">
                                <div class="flex items-center gap-3">
                                    <div class="badge badge-neutral badge-lg font-bold text-lg min-w-[2.5rem]" id="wednesdayDate">3</div>
                                    <h3 class="font-semibold text-base">Wednesday</h3>
                                </div>
                                <button class="btn btn-sm btn-ghost btn-circle" data-action="addDailyItem" data-params="wednesday" title="Add item">
                                    <i data-lucide="plus" class="w-4 h-4"></i>
                                </button>
                            </div>
                            <div class="day-items space-y-2" id="wednesdayItems">
                                <!-- Wednesday items will be populated -->
                            </div>
                        </div>
                        
                        <div class="day-column card bg-base-100 shadow-sm border border-base-300 p-4 min-w-0" id="thursdayColumn">
                            <div class="day-header flex items-center justify-between mb-4 pb-2 border-b border-base-300">
                                <div class="flex items-center gap-3">
                                    <div class="badge badge-neutral badge-lg font-bold text-lg min-w-[2.5rem]" id="thursdayDate">4</div>
                                    <h3 class="font-semibold text-base">Thursday</h3>
                                </div>
                                <button class="btn btn-sm btn-ghost btn-circle" data-action="addDailyItem" data-params="thursday" title="Add item">
                                    <i data-lucide="plus" class="w-4 h-4"></i>
                                </button>
                            </div>
                            <div class="day-items space-y-2" id="thursdayItems">
                                <!-- Thursday items will be populated -->
                            </div>
                        </div>
                        
                        <div class="day-column card bg-base-100 shadow-sm border border-base-300 p-4 min-w-0" id="fridayColumn">
                            <div class="day-header flex items-center justify-between mb-4 pb-2 border-b border-base-300">
                                <div class="flex items-center gap-3">
                                    <div class="badge badge-neutral badge-lg font-bold text-lg min-w-[2.5rem]" id="fridayDate">5</div>
                                    <h3 class="font-semibold text-base">Friday</h3>
                                </div>
                                <button class="btn btn-sm btn-ghost btn-circle" data-action="addDailyItem" data-params="friday" title="Add item">
                                    <i data-lucide="plus" class="w-4 h-4"></i>
                                </button>
                            </div>
                            <div class="day-items space-y-2" id="fridayItems">
                                <!-- Friday items will be populated -->
                            </div>
                        </div>
                        
                        <div class="day-column weekend-column card bg-secondary/5 shadow-sm border border-secondary/20 p-4 min-w-0" id="saturdayColumn">
                            <div class="day-header flex items-center justify-between mb-4 pb-2 border-b border-secondary/30">
                                <div class="flex items-center gap-3">
                                    <div class="badge badge-secondary badge-lg font-bold text-lg min-w-[2.5rem]" id="saturdayDate">6</div>
                                    <h3 class="font-semibold text-base text-secondary">Saturday</h3>
                                </div>
                                <button class="btn btn-sm btn-ghost btn-circle hover:btn-secondary" data-action="addDailyItem" data-params="saturday" title="Add item">
                                    <i data-lucide="plus" class="w-4 h-4"></i>
                                </button>
                            </div>
                            <div class="day-items space-y-2" id="saturdayItems">
                                <!-- Saturday items will be populated -->
                            </div>
                        </div>
                        
                        <div class="day-column weekend-column card bg-secondary/5 shadow-sm border border-secondary/20 p-4 min-w-0" id="sundayColumn">
                            <div class="day-header flex items-center justify-between mb-4 pb-2 border-b border-secondary/30">
                                <div class="flex items-center gap-3">
                                    <div class="badge badge-secondary badge-lg font-bold text-lg min-w-[2.5rem]" id="sundayDate">7</div>
                                    <h3 class="font-semibold text-base text-secondary">Sunday</h3>
                                </div>
                                <button class="btn btn-sm btn-ghost btn-circle hover:btn-secondary" data-action="addDailyItem" data-params="sunday" title="Add item">
                                    <i data-lucide="plus" class="w-4 h-4"></i>
                                </button>
                            </div>
                            <div class="day-items space-y-2" id="sundayItems">
                                <!-- Sunday items will be populated -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Settings View -->
            <div class="settings-container min-h-screen hidden" id="settingsContainer">
                <div class="settings-view" id="settingsView">
                    <div class="container mx-auto max-w-4xl p-4">
                        <!-- Settings Header -->
                        <div class="settings-header bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-6 mb-6">
                            <div class="flex items-center gap-4">
                                <!-- Mobile Menu Button -->
                                <button class="btn btn-square btn-ghost lg:hidden" onclick="document.getElementById('drawer-toggle').checked = true" title="Open Menu">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
                                </button>
                                
                                <!-- Settings Icon & Title -->
                                <div class="flex items-center gap-3">
                                    <div class="p-3 bg-primary/20 rounded-xl">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings text-primary"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                                    </div>
                                    <div>
                                        <h1 class="text-2xl font-bold text-base-content">Settings</h1>
                                        <p class="text-base-content/70">Manage your GridFlow preferences and data</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Settings Content -->
                        <div class="settings-content grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            <!-- Cloud Sync Section -->
                            <div class="space-y-6">
                                <!-- Dexie Cloud Sync Configuration -->
                                <div class="card bg-base-100 shadow-md">
                                    <div class="card-body">
                                        <h3 class="card-title text-lg">☁️ Dexie Cloud Sync</h3>
                                        <div class="space-y-4">
                                            <div class="form-control">
                                                <label class="label">
                                                    <span class="label-text font-medium">Database URL</span>
                                                    <a href="https://dexie.org/cloud/#getting-started" target="_blank" class="link link-primary text-xs">Learn more →</a>
                                                </label>
                                                <div class="bg-base-200 rounded p-3">
                                                    <code class="text-xs">https://z87sp4xp5.dexie.cloud</code>
                                                    <p class="text-xs text-base-content/60 mt-1">
                                                        Built-in database URL - no configuration needed
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <!-- Authentication Section -->
                                            <div id="dexieAuthSection" class="space-y-3">
                                                <!-- Login Section (shown when not authenticated) -->
                                                <div id="dexieLoginSection" class="form-control">
                                                    <label class="label">
                                                        <span class="label-text font-medium">Email Authentication (Optional)</span>
                                                        <span class="label-text-alt text-xs">For cross-device sync</span>
                                                    </label>
                                                    <div class="flex gap-2">
                                                        <input type="email" id="dexieCloudEmail" class="input input-bordered flex-1" placeholder="your@email.com">
                                                        <button class="btn btn-secondary" data-action="loginToDexieCloud">Login</button>
                                                    </div>
                                                    <p class="text-xs text-base-content/60 mt-1">
                                                        We'll send you a login link via email (no password needed). Data syncs anonymously without login.
                                                    </p>
                                                </div>
                                                
                                                <!-- User Section (shown when authenticated) -->
                                                <div id="dexieUserSection" class="bg-base-200 rounded-lg p-3" style="display: none;">
                                                    <div class="flex items-center justify-between">
                                                        <div>
                                                            <div class="font-medium">Logged in as:</div>
                                                            <div class="text-sm text-base-content/70 user-email">user@example.com</div>
                                                        </div>
                                                        <button class="btn btn-ghost btn-sm" data-action="logoutFromDexieCloud">Logout</button>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div class="form-control">
                                                <label class="label cursor-pointer">
                                                    <span class="label-text">Enable cloud sync</span>
                                                    <input type="checkbox" id="dexieCloudEnabled" class="checkbox" data-action="toggleDexieCloudSync">
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Sync Status -->
                                <div class="card bg-base-100 shadow-md">
                                    <div class="card-body">
                                        <h3 class="card-title text-lg">📊 Sync Status</h3>
                                        <div class="grid grid-cols-2 gap-3" id="dexieSyncStatusGrid">
                                            <div class="stat">
                                                <div class="stat-title">Status</div>
                                                <div class="stat-value text-sm" id="dexieSyncStatus">Not configured</div>
                                            </div>
                                            <div class="stat">
                                                <div class="stat-title">Last Sync</div>
                                                <div class="stat-value text-sm" id="dexieLastSync">Never</div>
                                            </div>
                                            <div class="stat">
                                                <div class="stat-title">Current User</div>
                                                <div class="stat-value text-sm" id="dexieCurrentUser">Not logged in</div>
                                            </div>
                                            <div class="stat">
                                                <div class="stat-title">Database URL</div>
                                                <div class="stat-value text-sm" id="dexieDatabaseUrl">Not configured</div>
                                            </div>
                                        </div>
                                        <div class="mt-4 space-y-2">
                                            <button class="btn btn-primary btn-sm w-full" data-action="manualDexieSync">🔄 Auto-Syncing</button>
                                            <div id="dexieSyncMessages" class="text-xs text-base-content/60">
                                                Dexie Cloud syncs automatically in real-time
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Help -->
                                <div class="card bg-info/10 border border-info/20">
                                    <div class="card-body">
                                        <h3 class="card-title text-lg text-info">💡 How Dexie Cloud works</h3>
                                        <div class="text-sm space-y-2">
                                            <p>• Data syncs instantly in real-time across all your devices</p>
                                            <p>• Works offline - changes sync when you're back online</p>
                                            <p>• No data size limits or request quotas</p>
                                            <p>• Passwordless authentication: we email you a login link</p>
                                            <p>• Login sessions last for months (no repeated logins)</p>
                                            <p>• Data can sync anonymously without login</p>
                                            <p>• Built-in shared database for all users</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Data Management Section -->
                            <div class="space-y-6">
                                <!-- Manual Backup -->
                                <div class="card bg-base-100 shadow-md">
                                    <div class="card-body">
                                        <h3 class="card-title text-lg">📤 Manual Backup</h3>
                                        <p class="mb-4">Export all your GridFlow data as a JSON backup file:</p>
                                        <button class="btn btn-primary w-full" data-action="exportToJSON">💾 Download Backup (JSON)</button>
                                    </div>
                                </div>

                                <!-- Import Data -->
                                <div class="card bg-base-100 shadow-md">
                                    <div class="card-body">
                                        <h3 class="card-title text-lg">📥 Import Data</h3>
                                        <p class="mb-4">Select a JSON backup file to import:</p>
                                        <div class="flex items-center gap-2">
                                            <input type="file" id="importFile" accept=".json" class="file-input file-input-bordered flex-1">
                                            <button class="btn btn-primary" data-action="importFromJSON">📤 Upload</button>
                                        </div>
                                        <p class="text-xs text-base-content/60 mt-2">
                                            <strong>Note:</strong> Importing will merge data with your current workspace. Export your current data first if you want to preserve it.
                                        </p>
                                    </div>
                                </div>

                                <!-- Export Options -->
                                <div class="card bg-base-100 shadow-md">
                                    <div class="card-body">
                                        <h3 class="card-title text-lg">📊 Export Options</h3>
                                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <button class="btn btn-outline" data-action="exportToPDF">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                                                Export to PDF
                                            </button>
                                            <button class="btn btn-outline" data-action="exportToPNG">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                                Export to PNG
                                            </button>
                                            <button class="btn btn-outline" data-action="exportToExcel">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-table"><path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>
                                                Export to Excel
                                            </button>
                                            <button class="btn btn-outline" data-action="exportToJSON">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                                Export to JSON
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Account Actions -->
                                <div class="card bg-warning/10 border border-warning/20">
                                    <div class="card-body">
                                        <h3 class="card-title text-lg text-warning">⚠️ Account Actions</h3>
                                        <p class="text-sm text-base-content/60 mb-4">
                                            Logout from your Dexie Cloud account to switch users.
                                        </p>
                                        <button class="btn btn-warning btn-sm w-full" data-action="clearDexieCloudData">🚪 Logout</button>
                                    </div>
                                </div>

                                <!-- Danger Zone -->
                                <div class="card bg-error/10 border border-error/20">
                                    <div class="card-body">
                                        <h3 class="card-title text-lg text-error">⚠️ Danger Zone</h3>
                                        <p class="text-sm text-base-content/60 mb-4">Clear all data and start fresh. This action cannot be undone.</p>
                                        <button class="btn btn-error w-full" data-action="clearAllData">🗑️ Clear All Data</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Register the custom element
customElements.define('gridflow-views', GridFlowViews);