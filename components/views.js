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

            <!-- Notes Management Interface -->
            <div class="notes-container min-h-screen flex" id="notesContainer">
                <!-- Notes List Pane -->
                <div class="notes-list-pane w-1/3 min-w-80 bg-base-200 border-r border-base-300" id="notesListPane">
                    <div class="p-4">
                        <!-- Notes Header -->
                        <div class="notes-header mb-6">
                            <div class="flex items-center justify-between mb-4">
                                <div class="flex items-center gap-3">
                                    <div class="p-2 bg-primary/20 rounded-xl">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text text-primary"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                                    </div>
                                    <div>
                                        <h2 class="text-xl font-bold text-base-content">Notes</h2>
                                        <p class="text-xs text-base-content/70">All your notes in one place</p>
                                    </div>
                                </div>
                                <button class="btn btn-primary btn-sm" data-action="createNewNote">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                    New Note
                                </button>
                            </div>

                            <!-- Search and Filter -->
                            <div class="space-y-3">
                                <div class="form-control">
                                    <input type="text" placeholder="Search notes..." class="input input-bordered input-sm w-full" id="notesSearchInput">
                                </div>
                                <div class="flex gap-2">
                                    <select class="select select-bordered select-sm flex-1" id="notesFilterBy">
                                        <option value="all">All Notes</option>
                                        <option value="recent">Recent</option>
                                        <option value="linked">Linked</option>
                                        <option value="unlinked">Unlinked</option>
                                        <option value="private">Private</option>
                                    </select>
                                    <select class="select select-bordered select-sm flex-1" id="notesSortBy">
                                        <option value="updated">Last Updated</option>
                                        <option value="created">Date Created</option>
                                        <option value="title">Title A-Z</option>
                                        <option value="title-desc">Title Z-A</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Notes Stats -->
                        <div class="stats stats-vertical w-full mb-4">
                            <div class="stat p-3">
                                <div class="stat-title text-xs">Total Notes</div>
                                <div class="stat-value text-lg" id="notesTotalCount">0</div>
                            </div>
                        </div>

                        <!-- Notes List -->
                        <div class="notes-list">
                            <ul class="menu bg-base-100 rounded-box p-0 space-y-1" id="notesList">
                                <!-- Notes will be populated here -->
                                <li class="text-center text-base-content/50 py-8">
                                    <div>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-plus mx-auto mb-2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12h4"/><path d="M12 10v4"/></svg>
                                        <p class="text-sm">No notes yet</p>
                                        <p class="text-xs">Create your first note to get started</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Notes Editor Pane -->
                <div class="notes-editor-pane flex-1 bg-base-100" id="notesEditorPane">
                    <!-- Welcome State -->
                    <div class="notes-welcome-state flex items-center justify-center h-full" id="notesWelcomeState">
                        <div class="text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text mx-auto mb-4 text-base-content/30"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                            <h3 class="text-lg font-semibold text-base-content/70 mb-2">Select a note to edit</h3>
                            <p class="text-sm text-base-content/50">Choose a note from the list or create a new one</p>
                        </div>
                    </div>

                    <!-- Note Editor -->
                    <div class="note-editor hidden h-full flex flex-col" id="noteEditor">
                        <!-- Editor Header -->
                        <div class="editor-header bg-base-200 border-b border-base-300 p-4">
                            <div class="flex items-start justify-between mb-3">
                                <div class="flex-1 mr-4">
                                    <input type="text" placeholder="Note title..." class="input input-ghost w-full text-xl font-bold p-0 border-none focus:outline-none" id="noteTitle">
                                    <div class="flex items-center gap-4 mt-2 text-xs text-base-content/60">
                                        <span id="noteCreatedDate">Created: --</span>
                                        <span id="noteUpdatedDate">Updated: --</span>
                                        <span id="noteWordCount">0 words</span>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <button class="btn btn-ghost btn-sm" id="notePrivateToggle" data-action="toggleNotePrivate">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-off"><path d="m15 18-.722-3.25"/><path d="m2 2 20 20"/><path d="m20 2-3.5 8.5"/><path d="m6.5 8.5L9.5 12"/><circle cx="12" cy="9" r="1"/></svg>
                                        Private
                                    </button>
                                    <button class="btn btn-ghost btn-sm" data-action="deleteCurrentNote">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-2 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                    </button>
                                    <button class="btn btn-primary btn-sm" data-action="saveCurrentNote">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-save"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>
                                        Save
                                    </button>
                                </div>
                            </div>

                            <!-- Tags and Links Bar -->
                            <div class="editor-metadata flex flex-wrap items-center gap-2">
                                <div class="flex items-center gap-2">
                                    <span class="text-xs font-medium text-base-content/70">Tags:</span>
                                    <div class="flex flex-wrap gap-1" id="noteTagsContainer">
                                        <!-- Tags will be added here -->
                                    </div>
                                    <button class="btn btn-ghost btn-xs" data-action="addNoteTag">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                        Add Tag
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Editor Content Area -->
                        <div class="editor-content flex-1 flex">
                            <!-- Main Content Editor -->
                            <div class="content-editor flex-1 p-4">
                                <textarea 
                                    class="textarea w-full h-full resize-none border-none focus:outline-none text-base leading-relaxed" 
                                    placeholder="Start writing your note..."
                                    id="noteContent"
                                ></textarea>
                            </div>

                            <!-- Relationships Sidebar -->
                            <div class="relationships-sidebar w-80 bg-base-50 border-l border-base-300 p-4" id="relationshipsSidebar">
                                <h4 class="font-semibold mb-3 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                                    Linked To
                                </h4>

                                <!-- Boards Section -->
                                <div class="relationship-section mb-4">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm font-medium">📋 Boards</span>
                                        <button class="btn btn-ghost btn-xs" data-action="linkNoteToBoard">Link</button>
                                    </div>
                                    <div class="relationship-items space-y-1" id="noteBoardLinks">
                                        <p class="text-xs text-base-content/50">No board links</p>
                                    </div>
                                </div>

                                <!-- Weekly Plans Section -->
                                <div class="relationship-section mb-4">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm font-medium">📅 Weekly Plans</span>
                                        <button class="btn btn-ghost btn-xs" data-action="linkNoteToWeekly">Link</button>
                                    </div>
                                    <div class="relationship-items space-y-1" id="noteWeeklyLinks">
                                        <p class="text-xs text-base-content/50">No weekly links</p>
                                    </div>
                                </div>

                                <!-- People Section -->
                                <div class="relationship-section mb-4">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm font-medium">👥 People</span>
                                        <button class="btn btn-ghost btn-xs" data-action="linkNoteToPerson">Link</button>
                                    </div>
                                    <div class="relationship-items space-y-1" id="notePeopleLinks">
                                        <p class="text-xs text-base-content/50">No people links</p>
                                    </div>
                                </div>

                                <!-- Collections Section -->
                                <div class="relationship-section mb-4">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm font-medium">📂 Collections</span>
                                        <button class="btn btn-ghost btn-xs" data-action="linkNoteToCollection">Link</button>
                                    </div>
                                    <div class="relationship-items space-y-1" id="noteCollectionLinks">
                                        <p class="text-xs text-base-content/50">No collection links</p>
                                    </div>
                                </div>

                                <!-- Related Notes Section -->
                                <div class="relationship-section mb-4">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm font-medium">📝 Related Notes</span>
                                        <button class="btn btn-ghost btn-xs" data-action="linkNoteToNote">Link</button>
                                    </div>
                                    <div class="relationship-items space-y-1" id="noteRelatedLinks">
                                        <p class="text-xs text-base-content/50">No related notes</p>
                                    </div>
                                </div>

                                <!-- Attachments Section -->
                                <div class="relationship-section">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm font-medium">📎 Attachments</span>
                                        <button class="btn btn-ghost btn-xs" data-action="addNoteAttachment">Add</button>
                                    </div>
                                    <div class="relationship-items space-y-1" id="noteAttachments">
                                        <p class="text-xs text-base-content/50">No attachments</p>
                                    </div>
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
                    <div class="container mx-auto max-w-6xl p-4">
                        <!-- Settings Header -->
                        <div class="settings-header bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-3xl p-8 mb-8 relative overflow-hidden">
                            <!-- Background Pattern -->
                            <div class="absolute inset-0 opacity-5">
                                <svg class="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                    <defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" stroke-width="1"/>
                                    </pattern></defs>
                                    <rect width="100" height="100" fill="url(#grid)"/>
                                </svg>
                            </div>
                            
                            <div class="relative flex items-center gap-6">
                                <!-- Mobile Menu Button -->
                                <button class="btn btn-square btn-ghost lg:hidden" onclick="document.getElementById('drawer-toggle').checked = true" title="Open Menu">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
                                </button>
                                
                                <!-- Settings Icon & Title -->
                                <div class="flex items-center gap-4">
                                    <div class="p-4 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                                    </div>
                                    <div>
                                        <h1 class="text-3xl font-bold text-base-content">Settings</h1>
                                        <p class="text-lg text-base-content/70">Customize your GridFlow experience and manage your data</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Settings Navigation Tabs -->
                        <div class="tabs tabs-boxed bg-base-200 p-1 mb-8 rounded-2xl">
                            <button class="tab tab-active" onclick="switchSettingsTab('sync')">☁️ Cloud Sync</button>
                            <button class="tab" onclick="switchSettingsTab('data')">📊 Data Management</button>
                            <button class="tab" onclick="switchSettingsTab('preferences')">⚙️ Preferences</button>
                        </div>

                        <!-- Settings Content -->
                        <div class="settings-content">
                            
                            <!-- Cloud Sync Tab -->
                            <div id="syncTab" class="settings-tab space-y-8">
                                <!-- Dexie Cloud Sync Configuration -->
                                <div class="card bg-gradient-to-br from-base-100 to-base-200/50 shadow-xl border border-base-300">
                                    <div class="card-body">
                                        <div class="flex items-center gap-3 mb-4">
                                            <div class="p-2 bg-info/20 rounded-xl">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud text-info"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
                                            </div>
                                            <h3 class="card-title text-xl">Dexie Cloud Sync</h3>
                                        </div>
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
                                <div class="card bg-gradient-to-br from-success/5 to-success/10 shadow-xl border border-success/20">
                                    <div class="card-body">
                                        <div class="flex items-center gap-3 mb-4">
                                            <div class="p-2 bg-success/20 rounded-xl">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-activity text-success"><path d="m22 12-4-4-6 6-2-2-4 4"/></svg>
                                            </div>
                                            <h3 class="card-title text-xl">Sync Status</h3>
                                        </div>
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
                                <div class="card bg-gradient-to-br from-info/10 to-info/5 border-2 border-info/30 shadow-lg">
                                    <div class="card-body">
                                        <div class="flex items-center gap-3 mb-4">
                                            <div class="p-2 bg-info/20 rounded-xl">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-help-circle text-info"><circle cx="12" cy="12" r="10"/><path d="m9 9 3-3 3 3"/><path d="m9 15 3 3 3-3"/></svg>
                                            </div>
                                            <h3 class="card-title text-xl text-info">How Dexie Cloud Works</h3>
                                        </div>
                                        <div class="text-sm space-y-3">
                                            <div class="flex items-start gap-3">
                                                <div class="p-1 bg-success/20 rounded-full mt-0.5">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap text-success"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
                                                </div>
                                                <p>Data syncs instantly in real-time across all your devices</p>
                                            </div>
                                            <div class="flex items-start gap-3">
                                                <div class="p-1 bg-info/20 rounded-full mt-0.5">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wifi-off text-info"><path d="M12 20h.01"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/><path d="M5 12.859a10 10 0 0 1 5.17-2.69"/><path d="M19 12.859a10 10 0 0 0-2.007-1.523"/><path d="M2 8.82a15 15 0 0 1 4.177-2.643"/><path d="M22 8.82a15 15 0 0 0-11.288-3.764"/><path d="m2 2 20 20"/></svg>
                                                </div>
                                                <p>Works offline - changes sync when you're back online</p>
                                            </div>
                                            <div class="flex items-start gap-3">
                                                <div class="p-1 bg-warning/20 rounded-full mt-0.5">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-infinity text-warning"><path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4s4-4 6-4a4 4 0 1 1 0 8c-2 0-4-1.33-6-4z"/></svg>
                                                </div>
                                                <p>No data size limits or request quotas</p>
                                            </div>
                                            <div class="flex items-start gap-3">
                                                <div class="p-1 bg-secondary/20 rounded-full mt-0.5">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mail text-secondary"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                                </div>
                                                <p>Passwordless authentication: we email you a login link</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Data Management Tab -->
                            <div id="dataTab" class="settings-tab space-y-8 hidden">
                                <!-- App Data Backup -->
                                <div class="card bg-gradient-to-br from-primary/5 to-primary/10 shadow-xl border border-primary/20">
                                    <div class="card-body">
                                        <div class="flex items-center gap-3 mb-4">
                                            <div class="p-2 bg-primary/20 rounded-xl">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-database text-primary"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/></svg>
                                            </div>
                                            <div>
                                                <h3 class="card-title text-xl">Complete App Backup</h3>
                                                <p class="text-sm text-base-content/60">Export all your GridFlow data</p>
                                            </div>
                                        </div>
                                        <p class="mb-4 text-base-content/80">Download a complete backup of all your boards, tasks, notes, people, collections, and settings as a JSON file:</p>
                                        <button class="btn btn-primary btn-lg w-full group" data-action="exportToJSON">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download group-hover:animate-bounce"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                            Download Complete Backup (JSON)
                                        </button>
                                    </div>
                                </div>

                                <!-- Import Data -->
                                <div class="card bg-gradient-to-br from-secondary/5 to-secondary/10 shadow-xl border border-secondary/20">
                                    <div class="card-body">
                                        <div class="flex items-center gap-3 mb-4">
                                            <div class="p-2 bg-secondary/20 rounded-xl">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-upload text-secondary"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                                            </div>
                                            <div>
                                                <h3 class="card-title text-xl">Import Backup Data</h3>
                                                <p class="text-sm text-base-content/60">Restore from a JSON backup file</p>
                                            </div>
                                        </div>
                                        <p class="mb-4 text-base-content/80">Select a GridFlow JSON backup file to import:</p>
                                        <div class="flex items-center gap-3">
                                            <input type="file" id="importFile" accept=".json" class="file-input file-input-bordered file-input-secondary flex-1">
                                            <button class="btn btn-secondary btn-lg" data-action="importFromJSON">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-upload"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                                                Import
                                            </button>
                                        </div>
                                        <div class="alert alert-warning mt-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="m12 17 .01 0"/></svg>
                                            <span class="text-sm"><strong>Note:</strong> Importing will merge data with your current workspace. Export your current data first if you want to preserve it.</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Data Statistics -->
                                <div class="card bg-gradient-to-br from-accent/5 to-accent/10 shadow-xl border border-accent/20">
                                    <div class="card-body">
                                        <div class="flex items-center gap-3 mb-4">
                                            <div class="p-2 bg-accent/20 rounded-xl">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bar-chart text-accent"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>
                                            </div>
                                            <div>
                                                <h3 class="card-title text-xl">Your Data Overview</h3>
                                                <p class="text-sm text-base-content/60">Current workspace statistics</p>
                                            </div>
                                        </div>
                                        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div class="stat">
                                                <div class="stat-title text-xs">Boards</div>
                                                <div class="stat-value text-lg" id="dataBoardCount">1</div>
                                            </div>
                                            <div class="stat">
                                                <div class="stat-title text-xs">Entities</div>
                                                <div class="stat-value text-lg" id="dataEntityCount">4</div>
                                            </div>
                                            <div class="stat">
                                                <div class="stat-title text-xs">People</div>
                                                <div class="stat-value text-lg" id="dataPeopleCount">0</div>
                                            </div>
                                            <div class="stat">
                                                <div class="stat-title text-xs">Collections</div>
                                                <div class="stat-value text-lg" id="dataCollectionCount">3</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Account Actions -->
                                <div class="card bg-gradient-to-br from-warning/10 to-warning/5 border-2 border-warning/30 shadow-lg">
                                    <div class="card-body">
                                        <div class="flex items-center gap-3 mb-4">
                                            <div class="p-2 bg-warning/20 rounded-xl">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-out text-warning"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                                            </div>
                                            <h3 class="card-title text-xl text-warning">Account Actions</h3>
                                        </div>
                                        <p class="text-sm text-base-content/70 mb-4">
                                            Logout from your Dexie Cloud account to switch users or stop syncing.
                                        </p>
                                        <button class="btn btn-warning w-full" data-action="clearDexieCloudData">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                                            Logout from Cloud Account
                                        </button>
                                    </div>
                                </div>

                                <!-- Danger Zone -->
                                <div class="card bg-gradient-to-br from-error/10 to-error/5 border-2 border-error/30 shadow-lg">
                                    <div class="card-body">
                                        <div class="flex items-center gap-3 mb-4">
                                            <div class="p-2 bg-error/20 rounded-xl">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2 text-error"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-2 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                            </div>
                                            <h3 class="card-title text-xl text-error">Danger Zone</h3>
                                        </div>
                                        <p class="text-sm text-base-content/70 mb-4">Clear all data and start fresh. This action cannot be undone.</p>
                                        <button class="btn btn-error w-full" data-action="clearAllData">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-2 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                            Clear All Data
                                        </button>
                                    </div>
                                </div>
                            </div>


                            <!-- Preferences Tab -->
                            <div id="preferencesTab" class="settings-tab space-y-8 hidden">
                                <!-- App-Wide Preferences -->
                                <div class="card bg-gradient-to-br from-primary/5 to-primary/10 shadow-xl border border-primary/20">
                                    <div class="card-body">
                                        <div class="flex items-center gap-3 mb-4">
                                            <div class="p-2 bg-primary/20 rounded-xl">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings text-primary"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                                            </div>
                                            <div>
                                                <h3 class="card-title text-xl">Application Preferences</h3>
                                                <p class="text-sm text-base-content/60">General app behavior and defaults</p>
                                            </div>
                                        </div>
                                        <div class="space-y-4">
                                            <div class="form-control">
                                                <label class="label cursor-pointer">
                                                    <span class="label-text font-medium">Auto-save changes</span>
                                                    <input type="checkbox" class="checkbox checkbox-primary" checked id="autoSavePref">
                                                </label>
                                                <div class="label">
                                                    <span class="label-text-alt text-base-content/60">Automatically save changes as you work</span>
                                                </div>
                                            </div>
                                            <div class="form-control">
                                                <label class="label cursor-pointer">
                                                    <span class="label-text font-medium">Remember last board</span>
                                                    <input type="checkbox" class="checkbox checkbox-primary" checked id="rememberLastBoardPref">
                                                </label>
                                                <div class="label">
                                                    <span class="label-text-alt text-base-content/60">Open the last board you were working on</span>
                                                </div>
                                            </div>
                                            <div class="form-control">
                                                <label class="label cursor-pointer">
                                                    <span class="label-text font-medium">Confirm before deleting</span>
                                                    <input type="checkbox" class="checkbox checkbox-primary" checked id="confirmDeletePref">
                                                </label>
                                                <div class="label">
                                                    <span class="label-text-alt text-base-content/60">Show confirmation dialogs for destructive actions</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Notification Settings -->
                                <div class="card bg-gradient-to-br from-accent/5 to-accent/10 shadow-xl border border-accent/20">
                                    <div class="card-body">
                                        <div class="flex items-center gap-3 mb-4">
                                            <div class="p-2 bg-accent/20 rounded-xl">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bell text-accent"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                                            </div>
                                            <div>
                                                <h3 class="card-title text-xl">Notifications & Alerts</h3>
                                                <p class="text-sm text-base-content/60">Control when and how you're notified</p>
                                            </div>
                                        </div>
                                        <div class="space-y-4">
                                            <div class="form-control">
                                                <label class="label cursor-pointer">
                                                    <span class="label-text font-medium">Show success messages</span>
                                                    <input type="checkbox" class="checkbox checkbox-accent" checked id="showSuccessMessages">
                                                </label>
                                            </div>
                                            <div class="form-control">
                                                <label class="label cursor-pointer">
                                                    <span class="label-text font-medium">Show sync notifications</span>
                                                    <input type="checkbox" class="checkbox checkbox-accent" checked id="showSyncNotifications">
                                                </label>
                                            </div>
                                            <div class="form-control">
                                                <label class="label cursor-pointer">
                                                    <span class="label-text font-medium">Auto-save confirmation</span>
                                                    <input type="checkbox" class="checkbox checkbox-accent" id="showAutoSaveConfirmation">
                                                </label>
                                            </div>
                                        </div>
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

// Settings Tab Management
window.switchSettingsTab = function(tabId) {
    // Map short names to actual element IDs
    const tabMapping = {
        'sync': 'syncTab',
        'cloudTab': 'syncTab', // Alternative mapping
        'data': 'dataTab', 
        'preferences': 'preferencesTab'
    };
    
    const actualTabId = tabMapping[tabId] || tabId;
    const originalTabId = tabId; // Keep original for button matching
    
    // Hide all tabs
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remove active state from all tab buttons
    document.querySelectorAll('.settings-tabs .tab').forEach(tab => {
        tab.classList.remove('tab-active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(actualTabId);
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
    }
    
    // Set active state on clicked tab button
    const activeButton = document.querySelector(`[onclick="switchSettingsTab('${originalTabId}')"]`);
    if (activeButton) {
        activeButton.classList.add('tab-active');
    }
    
    // Update data statistics when switching to data tab
    if (actualTabId === 'dataTab') {
        updateDataStatistics();
    }
};

// Update data statistics
window.updateDataStatistics = async function() {
    try {
        if (window.db) {
            const [boards, entities, people, collections] = await Promise.all([
                window.db.boards.count(),
                window.db.entities.count(),
                window.db.people.count(),
                window.db.collections.count()
            ]);
            
            document.getElementById('dataBoardCount').textContent = boards;
            document.getElementById('dataEntityCount').textContent = entities;
            document.getElementById('dataPeopleCount').textContent = people;
            document.getElementById('dataCollectionCount').textContent = collections;
        }
    } catch (error) {
        console.warn('Could not update data statistics:', error);
    }
};

// Load and save settings preferences
window.loadSettingsPreferences = async function() {
    try {
        if (window.metaService) {
            // Load app-wide preferences
            const autoSave = await window.metaService.getSetting('autoSave');
            const rememberLastBoard = await window.metaService.getSetting('rememberLastBoard');
            const confirmDelete = await window.metaService.getSetting('confirmDelete');
            const showSuccessMessages = await window.metaService.getSetting('showSuccessMessages');
            const showSyncNotifications = await window.metaService.getSetting('showSyncNotifications');
            const showAutoSaveConfirmation = await window.metaService.getSetting('showAutoSaveConfirmation');
            
            // Set checkbox states
            const autoSavePref = document.getElementById('autoSavePref');
            if (autoSavePref && autoSave !== null) {
                autoSavePref.checked = autoSave;
            }
            
            const rememberLastBoardPref = document.getElementById('rememberLastBoardPref');
            if (rememberLastBoardPref && rememberLastBoard !== null) {
                rememberLastBoardPref.checked = rememberLastBoard;
            }
            
            const confirmDeletePref = document.getElementById('confirmDeletePref');
            if (confirmDeletePref && confirmDelete !== null) {
                confirmDeletePref.checked = confirmDelete;
            }
            
            const showSuccessMessagesPref = document.getElementById('showSuccessMessages');
            if (showSuccessMessagesPref && showSuccessMessages !== null) {
                showSuccessMessagesPref.checked = showSuccessMessages;
            }
            
            const showSyncNotificationsPref = document.getElementById('showSyncNotifications');
            if (showSyncNotificationsPref && showSyncNotifications !== null) {
                showSyncNotificationsPref.checked = showSyncNotifications;
            }
            
            const showAutoSaveConfirmationPref = document.getElementById('showAutoSaveConfirmation');
            if (showAutoSaveConfirmationPref && showAutoSaveConfirmation !== null) {
                showAutoSaveConfirmationPref.checked = showAutoSaveConfirmation;
            }
        }
    } catch (error) {
        console.warn('Could not load settings preferences:', error);
    }
};

// Save settings preferences when changed
window.saveSettingsPreference = async function(key, value) {
    try {
        if (window.metaService) {
            await window.metaService.setSetting(key, value, 'preferences');
            
            // Show success message for important settings
            if (window.showStatusMessage && ['autoSave', 'rememberLastBoard', 'confirmDelete'].includes(key)) {
                window.showStatusMessage(`${key.replace(/([A-Z])/g, ' $1').toLowerCase()} ${value ? 'enabled' : 'disabled'}`, 'success');
            }
        }
    } catch (error) {
        console.warn('Could not save setting:', key, error);
    }
};

// Set up settings event listeners when settings panel is shown
window.setupSettingsEventListeners = function() {
    // App preference change handlers
    const appPrefCheckboxes = document.querySelectorAll('#preferencesTab input[type="checkbox"]');
    appPrefCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const key = this.id.replace('Pref', '');
            window.saveSettingsPreference(key, this.checked);
        });
    });
    
    // Load current preferences
    window.loadSettingsPreferences();
};