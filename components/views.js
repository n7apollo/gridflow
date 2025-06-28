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
            <div class="task-container card bg-base-100 shadow-lg p-4 mt-4 hidden" id="taskContainer">
                <div class="task-header mb-4">
                    <div class="task-controls flex flex-wrap gap-2 items-end">
                        <div class="form-control">
                            <label class="label" for="taskBoardFilter">Board:</label>
                            <select id="taskBoardFilter" data-action="filterTasksByBoard" class="select select-bordered min-w-[8rem]">
                                <option value="">All Boards</option>
                                <!-- Board options will be populated dynamically -->
                            </select>
                        </div>
                        <div class="form-control">
                            <label class="label" for="taskStatusFilter">Status:</label>
                            <select id="taskStatusFilter" data-action="filterTasks" class="select select-bordered min-w-[8rem]">
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div class="form-control">
                            <label class="label" for="taskPriorityFilter">Priority:</label>
                            <select id="taskPriorityFilter" data-action="filterTasks" class="select select-bordered min-w-[8rem]">
                                <option value="">All Priorities</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                        <div class="form-control">
                            <label class="label" for="taskSortBy">Sort by:</label>
                            <select id="taskSortBy" data-action="sortTasks" class="select select-bordered min-w-[8rem]">
                                <option value="title">Title</option>
                                <option value="priority">Priority</option>
                                <option value="dueDate">Due Date</option>
                                <option value="board">Board</option>
                            </select>
                        </div>
                        <button class="btn btn-primary ml-2" data-action="openTaskModal">+ Add Task</button>
                    </div>
                </div>
                <div class="task-list" id="taskList">
                    <!-- Tasks will be populated here -->
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
                    <div class="daily-planning-grid grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <div class="day-column card bg-base-200 p-2" id="mondayColumn">
                            <div class="day-header flex items-center justify-between mb-2">
                                <h3 class="font-semibold">Monday</h3>
                                <button class="btn btn-xs btn-secondary" data-action="addDailyItem" data-params="monday">+</button>
                            </div>
                            <div class="day-items" id="mondayItems">
                                <!-- Monday items will be populated -->
                            </div>
                        </div>
                        
                        <div class="day-column card bg-base-200 p-2" id="tuesdayColumn">
                            <div class="day-header flex items-center justify-between mb-2">
                                <h3 class="font-semibold">Tuesday</h3>
                                <button class="btn btn-xs btn-secondary" data-action="addDailyItem" data-params="tuesday">+</button>
                            </div>
                            <div class="day-items" id="tuesdayItems">
                                <!-- Tuesday items will be populated -->
                            </div>
                        </div>
                        
                        <div class="day-column card bg-base-200 p-2" id="wednesdayColumn">
                            <div class="day-header flex items-center justify-between mb-2">
                                <h3 class="font-semibold">Wednesday</h3>
                                <button class="btn btn-xs btn-secondary" data-action="addDailyItem" data-params="wednesday">+</button>
                            </div>
                            <div class="day-items" id="wednesdayItems">
                                <!-- Wednesday items will be populated -->
                            </div>
                        </div>
                        
                        <div class="day-column card bg-base-200 p-2" id="thursdayColumn">
                            <div class="day-header flex items-center justify-between mb-2">
                                <h3 class="font-semibold">Thursday</h3>
                                <button class="btn btn-xs btn-secondary" data-action="addDailyItem" data-params="thursday">+</button>
                            </div>
                            <div class="day-items" id="thursdayItems">
                                <!-- Thursday items will be populated -->
                            </div>
                        </div>
                        
                        <div class="day-column card bg-base-200 p-2" id="fridayColumn">
                            <div class="day-header flex items-center justify-between mb-2">
                                <h3 class="font-semibold">Friday</h3>
                                <button class="btn btn-xs btn-secondary" data-action="addDailyItem" data-params="friday">+</button>
                            </div>
                            <div class="day-items" id="fridayItems">
                                <!-- Friday items will be populated -->
                            </div>
                        </div>
                        
                        <div class="day-column card bg-base-200 p-2" id="saturdayColumn">
                            <div class="day-header flex items-center justify-between mb-2">
                                <h3 class="font-semibold">Saturday</h3>
                                <button class="btn btn-xs btn-secondary" data-action="addDailyItem" data-params="saturday">+</button>
                            </div>
                            <div class="day-items" id="saturdayItems">
                                <!-- Saturday items will be populated -->
                            </div>
                        </div>
                        
                        <div class="day-column card bg-base-200 p-2" id="sundayColumn">
                            <div class="day-header flex items-center justify-between mb-2">
                                <h3 class="font-semibold">Sunday</h3>
                                <button class="btn btn-xs btn-secondary" data-action="addDailyItem" data-params="sunday">+</button>
                            </div>
                            <div class="day-items" id="sundayItems">
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