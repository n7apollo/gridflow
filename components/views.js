/**
 * GridFlow Views Component
 * Contains the main application views (board, tasks, weekly)
 */
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
                <!-- Board Header Section -->
                <div class="board-view-header flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
                    <div class="board-header-left flex items-center gap-2">
                        <!-- Mobile Menu Button -->
                        <button class="btn btn-square btn-ghost lg:hidden" onclick="document.getElementById('drawer-toggle').checked = true" title="Open Menu">
                            <span class="text-xl">☰</span>
                        </button>
                        <div class="dropdown dropdown-bottom">
                            <button class="btn btn-outline btn-primary flex items-center gap-2" data-action="toggleBoardDropdown" id="currentBoardBtn">
                                <span class="current-board-name" id="currentBoardName">Loading...</span>
                                <span class="ml-1">▼</span>
                            </button>
                            <div class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-64 mt-2" id="boardDropdown">
                                <div class="mb-2">
                                    <input type="text" placeholder="Search boards..." id="boardSearchInput" class="input input-bordered w-full" />
                                </div>
                                <div class="board-list max-h-40 overflow-y-auto mb-2" id="boardList">
                                    <!-- Populated dynamically -->
                                </div>
                                <div class="flex gap-2">
                                    <button class="btn btn-success flex-1" data-action="createNewBoard">
                                        <span class="mr-1">+</span>
                                        <span>New Board</span>
                                    </button>
                                    <button class="btn btn-outline flex-1" data-action="showBoardModal">
                                        <span class="mr-1">⚙️</span>
                                        <span>Manage Boards</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="board-header-center flex gap-2">
                        <button class="btn btn-primary" data-action="addRow">+ Add Row</button>
                        <button class="btn btn-secondary" data-action="addGroup">+ Add Group</button>
                        <button class="btn btn-secondary" data-action="addColumn">+ Add Column</button>
                    </div>
                    
                    <div class="board-header-right flex items-center gap-2">
                        <div class="dropdown dropdown-bottom">
                            <button class="btn btn-secondary flex items-center gap-1" data-action="toggleTemplatesMenu" id="templatesBtn">
                                📋 Templates
                                <span>▼</span>
                            </button>
                            <div class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-2" id="templatesDropdown">
                                <button class="btn btn-ghost w-full justify-start" data-action="showApplyTemplateModal">
                                    <span class="mr-2">📥</span>
                                    <span>Apply Template</span>
                                </button>
                                <button class="btn btn-ghost w-full justify-start" data-action="showSaveAsTemplateModal">
                                    <span class="mr-2">💾</span>
                                    <span>Save as Template</span>
                                </button>
                            </div>
                        </div>
                        <div class="dropdown dropdown-bottom">
                            <button class="btn btn-secondary flex items-center gap-1" data-action="toggleBoardExportMenu" id="boardExportBtn">
                                📤 Export Board
                                <span>▼</span>
                            </button>
                            <div class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-2" id="boardExportDropdown">
                                <button class="btn btn-ghost w-full justify-start" data-action="exportToPDF">
                                    <span class="mr-2">📄</span>
                                    <span>Export as PDF</span>
                                </button>
                                <button class="btn btn-ghost w-full justify-start" data-action="exportToPNG">
                                    <span class="mr-2">🖼️</span>
                                    <span>Export as PNG</span>
                                </button>
                                <button class="btn btn-ghost w-full justify-start" data-action="exportToExcel">
                                    <span class="mr-2">📊</span>
                                    <span>Export as Excel</span>
                                </button>
                            </div>
                        </div>
                        <div class="dropdown dropdown-bottom">
                            <button class="btn btn-secondary" data-action="toggleMoreMenu" id="moreBtn">
                                ⋯
                            </button>
                            <div class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-40 mt-2" id="moreDropdown">
                                <button class="btn btn-ghost w-full justify-start" data-action="toggleSettings">
                                    <span class="mr-2">🔧</span>
                                    <span>Board Settings</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="settings-panel card bg-base-200 shadow-lg p-4 mb-4 hidden" id="settingsPanel">
                    <div class="settings-content">
                        <div class="form-control mb-2">
                            <label class="label cursor-pointer">
                                <input type="checkbox" id="showCheckboxes" class="checkbox" onchange="toggleCheckboxes()">
                                <span class="label-text ml-2">Show Checkboxes</span>
                            </label>
                        </div>
                        <div class="form-control mb-2">
                            <label class="label cursor-pointer">
                                <input type="checkbox" id="showSubtaskProgress" class="checkbox" onchange="toggleSubtaskProgress()">
                                <span class="label-text ml-2">Show Subtask Progress</span>
                            </label>
                        </div>
                    </div>
                    <button class="btn btn-secondary mt-2" data-action="toggleSettings">Close</button>
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
                                            <option value="task">Tasks</option>
                                            <option value="note">Notes</option>
                                            <option value="checklist">Checklists</option>
                                            <option value="project">Projects</option>
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
            <div class="collections-container card bg-base-100 shadow-lg p-4 mt-4 hidden" id="collectionsContainer">
                <div class="collections-header mb-4">
                    <div class="collections-controls flex flex-wrap gap-2 items-end">
                        <div class="form-control">
                            <label class="label" for="collectionsSearch">Search Collections:</label>
                            <input type="text" id="collectionsSearch" placeholder="Search by name or description..." 
                                   class="input input-bordered w-64" data-action="searchCollections">
                        </div>
                        <div class="form-control">
                            <label class="label" for="collectionTypeFilter">Type:</label>
                            <select id="collectionTypeFilter" data-action="filterCollectionsByType" class="select select-bordered min-w-[8rem]">
                                <option value="">All Types</option>
                                <option value="saved_search">Saved Search</option>
                                <option value="manual">Manual</option>
                                <option value="smart">Smart</option>
                            </select>
                        </div>
                        <div class="form-control">
                            <label class="label" for="collectionCategoryFilter">Category:</label>
                            <select id="collectionCategoryFilter" data-action="filterCollectionsByCategory" class="select select-bordered min-w-[8rem]">
                                <option value="">All Categories</option>
                                <option value="productivity">Productivity</option>
                                <option value="work">Work</option>
                                <option value="personal">Personal</option>
                                <option value="time">Time</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" data-action="showCreateCollectionModal">
                            <i data-lucide="folder-plus"></i> Create Collection
                        </button>
                    </div>
                </div>

                <!-- Collections Grid -->
                <div class="collections-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4" id="collectionsGrid">
                    <!-- Collection cards will be populated here -->
                </div>

                <!-- Collection Detail Panel (Initially Hidden) -->
                <div class="collection-detail-panel card bg-base-200 p-4 mt-4 hidden" id="collectionDetailPanel">
                    <div class="collection-detail-header flex items-center justify-between mb-4">
                        <h3 class="text-xl font-bold" id="collectionDetailName">Collection Name</h3>
                        <div class="collection-detail-actions flex gap-2">
                            <button class="btn btn-sm btn-secondary" data-action="editCollection" id="editCollectionBtn">
                                <i data-lucide="edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-error" data-action="deleteCollection" id="deleteCollectionBtn">
                                <i data-lucide="trash-2"></i> Delete
                            </button>
                            <button class="btn btn-sm btn-neutral" data-action="closeCollectionDetail">
                                <i data-lucide="x"></i> Close
                            </button>
                        </div>
                    </div>

                    <!-- Collection Info -->
                    <div class="collection-info mb-4">
                        <div class="collection-description text-sm mb-2" id="collectionDescription"></div>
                        <div class="collection-metadata flex gap-4 text-sm text-gray-500">
                            <span id="collectionType"></span>
                            <span id="collectionCategory"></span>
                            <span id="collectionItemCount"></span>
                            <span id="collectionLastUpdated"></span>
                        </div>
                    </div>

                    <!-- Collection Items -->
                    <div class="collection-items">
                        <div class="items-header flex items-center justify-between mb-2">
                            <h4 class="font-semibold">Items</h4>
                            <button class="btn btn-sm btn-primary" data-action="refreshCollectionItems">
                                <i data-lucide="refresh-cw"></i> Refresh
                            </button>
                        </div>
                        <div class="items-content space-y-2 max-h-96 overflow-y-auto" id="collectionItems">
                            <!-- Collection items will be populated here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tags Management Interface -->
            <div class="tags-container card bg-base-100 shadow-lg p-4 mt-4 hidden" id="tagsContainer">
                <div class="tags-header mb-4">
                    <div class="tags-controls flex flex-wrap gap-2 items-end">
                        <div class="form-control">
                            <label class="label" for="tagsSearch">Search Tags:</label>
                            <input type="text" id="tagsSearch" placeholder="Search by name or description..." 
                                   class="input input-bordered w-64" data-action="searchTags">
                        </div>
                        <div class="form-control">
                            <label class="label" for="tagCategoryFilter">Category:</label>
                            <select id="tagCategoryFilter" data-action="filterTagsByCategory" class="select select-bordered min-w-[8rem]">
                                <option value="">All Categories</option>
                                <option value="work">Work</option>
                                <option value="personal">Personal</option>
                                <option value="priority">Priority</option>
                                <option value="general">General</option>
                                <option value="action">Action</option>
                            </select>
                        </div>
                        <div class="form-control">
                            <label class="label" for="tagSortBy">Sort by:</label>
                            <select id="tagSortBy" data-action="sortTags" class="select select-bordered min-w-[8rem]">
                                <option value="usage">Usage</option>
                                <option value="name">Name</option>
                                <option value="created">Created</option>
                                <option value="updated">Updated</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" data-action="showCreateTagModal">
                            <i data-lucide="tag"></i> Create Tag
                        </button>
                    </div>
                </div>

                <!-- Tags Grid -->
                <div class="tags-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4" id="tagsGrid">
                    <!-- Tag cards will be populated here -->
                </div>

                <!-- Tag Detail Panel (Initially Hidden) -->
                <div class="tag-detail-panel card bg-base-200 p-4 mt-4 hidden" id="tagDetailPanel">
                    <div class="tag-detail-header flex items-center justify-between mb-4">
                        <div class="flex items-center gap-2">
                            <div class="tag-color-indicator w-4 h-4 rounded-full" id="tagDetailColorIndicator"></div>
                            <h3 class="text-xl font-bold" id="tagDetailName">Tag Name</h3>
                        </div>
                        <div class="tag-detail-actions flex gap-2">
                            <button class="btn btn-sm btn-secondary" data-action="editTag" id="editTagBtn">
                                <i data-lucide="edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-error" data-action="deleteTag" id="deleteTagBtn">
                                <i data-lucide="trash-2"></i> Delete
                            </button>
                            <button class="btn btn-sm btn-neutral" data-action="closeTagDetail">
                                <i data-lucide="x"></i> Close
                            </button>
                        </div>
                    </div>

                    <!-- Tag Info -->
                    <div class="tag-info mb-4">
                        <div class="tag-description text-sm mb-2" id="tagDescription"></div>
                        <div class="tag-metadata flex gap-4 text-sm text-gray-500">
                            <span id="tagCategory"></span>
                            <span id="tagUsageCount"></span>
                            <span id="tagCreatedAt"></span>
                        </div>
                    </div>

                    <!-- Tagged Entities -->
                    <div class="tagged-entities">
                        <div class="entities-header flex items-center justify-between mb-2">
                            <h4 class="font-semibold">Tagged Items</h4>
                            <div class="entities-filters flex gap-2">
                                <select id="taggedEntitiesTypeFilter" class="select select-sm select-bordered">
                                    <option value="">All Types</option>
                                    <option value="task">Tasks</option>
                                    <option value="note">Notes</option>
                                    <option value="checklist">Checklists</option>
                                    <option value="project">Projects</option>
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
        `;
    }
}

// Register the custom element
customElements.define('gridflow-views', GridFlowViews);