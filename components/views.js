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
                            <div class="form-control">
                                <div class="input-group">
                                    <span class="bg-base-200">
                                        <i data-lucide="search" class="w-4 h-4"></i>
                                    </span>
                                    <input type="text" id="taskSearchInput" placeholder="Search tasks..." 
                                           class="input input-bordered w-full task-search-input" data-action="filterTasks">
                                </div>
                            </div>
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
                    <div class="flex flex-wrap gap-2 mb-4">
                        <div class="badge badge-ghost badge-lg quick-filter-badge" data-filter="all" id="filterAll">
                            All Tasks
                        </div>
                        <div class="badge badge-primary badge-lg quick-filter-badge" data-filter="today" id="filterToday">
                            Due Today
                        </div>
                        <div class="badge badge-warning badge-lg quick-filter-badge" data-filter="overdue" id="filterOverdue">
                            Overdue
                        </div>
                        <div class="badge badge-success badge-lg quick-filter-badge" data-filter="completed" id="filterCompleted">
                            Completed
                        </div>
                    </div>

                    <!-- Task List Grid -->
                    <div class="task-list grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4" id="taskList">
                        <!-- Tasks will be populated here -->
                    </div>

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
            <div class="people-container card bg-base-100 shadow-lg p-4 mt-4 hidden" id="peopleContainer">
                <div class="people-header mb-4">
                    <div class="people-controls flex flex-wrap gap-2 items-end">
                        <div class="form-control">
                            <label class="label" for="peopleSearch">Search People:</label>
                            <input type="text" id="peopleSearch" placeholder="Search by name, email, or company..." 
                                   class="input input-bordered w-64" data-action="searchPeople">
                        </div>
                        <div class="form-control">
                            <label class="label" for="relationshipFilter">Relationship:</label>
                            <select id="relationshipFilter" data-action="filterPeopleByRelationship" class="select select-bordered min-w-[8rem]">
                                <option value="">All Relationships</option>
                                <option value="coworker">Coworkers</option>
                                <option value="friend">Friends</option>
                                <option value="family">Family</option>
                                <option value="partner">Partner</option>
                                <option value="contact">Contacts</option>
                            </select>
                        </div>
                        <div class="form-control">
                            <label class="label" for="followUpFilter">Follow-ups:</label>
                            <select id="followUpFilter" data-action="filterPeopleByFollowUp" class="select select-bordered min-w-[8rem]">
                                <option value="">All People</option>
                                <option value="overdue">Overdue</option>
                                <option value="soon">Due Soon</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" data-action="showCreatePersonModal">
                            <i data-lucide="user-plus"></i> Add Person
                        </button>
                    </div>
                </div>

                <!-- People Grid -->
                <div class="people-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4" id="peopleGrid">
                    <!-- People cards will be populated here -->
                </div>

                <!-- Person Detail Panel (Initially Hidden) -->
                <div class="person-detail-panel card bg-base-200 p-4 mt-4 hidden" id="personDetailPanel">
                    <div class="person-detail-header flex items-center justify-between mb-4">
                        <h3 class="text-xl font-bold" id="personDetailName">Person Name</h3>
                        <div class="person-detail-actions flex gap-2">
                            <button class="btn btn-sm btn-secondary" data-action="editPerson" id="editPersonBtn">
                                <i data-lucide="edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-error" data-action="deletePerson" id="deletePersonBtn">
                                <i data-lucide="trash-2"></i> Delete
                            </button>
                            <button class="btn btn-sm btn-neutral" data-action="closePeopleDetail">
                                <i data-lucide="x"></i> Close
                            </button>
                        </div>
                    </div>

                    <!-- Person Info -->
                    <div class="person-info grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div class="person-basic-info">
                            <h4 class="font-semibold mb-2">Contact Information</h4>
                            <div class="space-y-1 text-sm">
                                <div id="personEmail"></div>
                                <div id="personPhone"></div>
                                <div id="personCompany"></div>
                                <div id="personRole"></div>
                            </div>
                        </div>
                        <div class="person-relationship-info">
                            <h4 class="font-semibold mb-2">Relationship</h4>
                            <div class="space-y-1 text-sm">
                                <div id="personRelationshipType"></div>
                                <div id="personInteractionFrequency"></div>
                                <div id="personLastInteraction"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Person Timeline -->
                    <div class="person-timeline">
                        <div class="timeline-header flex items-center justify-between mb-2">
                            <h4 class="font-semibold">Timeline</h4>
                            <div class="timeline-filters flex gap-2">
                                <select id="timelineTypeFilter" class="select select-sm select-bordered">
                                    <option value="">All Types</option>
                                    <option value="task">Tasks</option>
                                    <option value="note">Notes</option>
                                    <option value="checklist">Checklists</option>
                                    <option value="project">Projects</option>
                                </select>
                                <button class="btn btn-sm btn-primary" data-action="addNoteForPerson">
                                    <i data-lucide="plus"></i> Add Note
                                </button>
                            </div>
                        </div>
                        <div class="timeline-content space-y-2 max-h-96 overflow-y-auto" id="personTimeline">
                            <!-- Timeline items will be populated here -->
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