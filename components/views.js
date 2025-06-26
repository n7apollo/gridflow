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
            <div class="board-container" id="boardContainer">
                <div class="settings-panel" id="settingsPanel">
                    <div class="settings-content">
                        <div class="settings-row">
                            <button class="btn btn-small btn-primary" data-action="addColumn">+ Add Column</button>
                        </div>
                    </div>
                    <div class="settings-content">
                        <div class="settings-row">
                            <button class="btn btn-small btn-primary" data-action="addGroup">+ Add Group</button>
                        </div>
                    </div>
                    <div class="settings-content">
                        <div class="settings-row">
                            <button class="btn btn-small btn-primary" data-action="showCreateTemplateModal">+ Create Template</button>
                            <button class="btn btn-small btn-secondary" data-action="showApplyTemplateModal">Apply Template</button>
                        </div>
                    </div>
                    <div class="settings-content">
                        <div class="settings-row">
                            <input type="checkbox" id="showCheckboxes" onchange="toggleCheckboxes()">
                            <label for="showCheckboxes">Show Checkboxes</label>
                        </div>
                        <div class="settings-row">
                            <input type="checkbox" id="showSubtaskProgress" onchange="toggleSubtaskProgress()">
                            <label for="showSubtaskProgress">Show Subtask Progress</label>
                        </div>
                    </div>
                    <button class="btn btn-secondary" data-action="toggleSettings">Close</button>
                </div>
                
                <div class="board-header" id="boardHeader">
                    <!-- Column headers will be dynamically generated -->
                </div>
                <div class="rows-container" id="rowsContainer">
                    <!-- Rows will be dynamically added here -->
                </div>
            </div>

            <!-- Task Management Interface -->
            <div class="task-container" id="taskContainer" style="display: none;">
                <div class="task-header">
                    <div class="task-controls">
                        <div class="filter-group">
                            <label for="taskBoardFilter">Board:</label>
                            <select id="taskBoardFilter" data-action="filterTasksByBoard">
                                <option value="">All Boards</option>
                                <!-- Board options will be populated dynamically -->
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="taskStatusFilter">Status:</label>
                            <select id="taskStatusFilter" data-action="filterTasks">
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="taskPriorityFilter">Priority:</label>
                            <select id="taskPriorityFilter" data-action="filterTasks">
                                <option value="">All Priorities</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="taskSortBy">Sort by:</label>
                            <select id="taskSortBy" data-action="sortTasks">
                                <option value="title">Title</option>
                                <option value="priority">Priority</option>
                                <option value="dueDate">Due Date</option>
                                <option value="board">Board</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" data-action="openTaskModal">+ Add Task</button>
                    </div>
                </div>
                <div class="task-list" id="taskList">
                    <!-- Tasks will be populated here -->
                </div>
            </div>

            <!-- Weekly Planning Interface -->
            <div class="weekly-container" id="weeklyContainer" style="display: none;">
                <div class="weekly-header">
                    <div class="weekly-navigation">
                        <button class="btn btn-secondary" data-action="navigateWeek" data-params="-1" id="prevWeekBtn">← Previous Week</button>
                        <div class="week-info">
                            <h2 class="week-title" id="weekTitle">Current Week</h2>
                            <div class="week-dates" id="weekDates">
                                <!-- Week dates will be populated -->
                            </div>
                        </div>
                        <button class="btn btn-secondary" data-action="navigateWeek" data-params="1" id="nextWeekBtn">Next Week →</button>
                    </div>
                    <div class="weekly-actions">
                        <button class="btn btn-secondary" data-action="showWeeklyReflectionModal">✍️ Reflection</button>
                        <button class="btn btn-primary" data-action="addWeeklyNote">+ Add Note</button>
                    </div>
                </div>
                
                <div class="weekly-content">
                    <!-- Weekly Goal Section -->
                    <div class="weekly-goal-section">
                        <div class="goal-header">
                            <h3>Weekly Focus Goal</h3>
                            <button class="btn btn-small btn-secondary" data-action="editWeeklyGoal" id="editGoalBtn">Edit</button>
                        </div>
                        <div class="goal-content">
                            <div class="weekly-goal" id="weeklyGoal">Click to set your weekly focus goal...</div>
                            <div class="weekly-goal-form" id="weeklyGoalForm" style="display: none;">
                                <input type="text" id="weeklyGoalInput" placeholder="Enter your weekly focus goal...">
                                <div class="goal-actions">
                                    <button class="btn btn-small btn-primary" data-action="saveWeeklyGoal">Save</button>
                                    <button class="btn btn-small btn-secondary" data-action="cancelGoalEdit">Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Daily Planning Grid -->
                    <div class="daily-planning-grid">
                        <div class="day-column" id="mondayColumn">
                            <div class="day-header">
                                <h3>Monday</h3>
                                <button class="btn btn-small btn-secondary" data-action="addDailyItem" data-params="monday">+</button>
                            </div>
                            <div class="day-items" id="mondayItems">
                                <!-- Monday items will be populated -->
                            </div>
                        </div>
                        
                        <div class="day-column" id="tuesdayColumn">
                            <div class="day-header">
                                <h3>Tuesday</h3>
                                <button class="btn btn-small btn-secondary" data-action="addDailyItem" data-params="tuesday">+</button>
                            </div>
                            <div class="day-items" id="tuesdayItems">
                                <!-- Tuesday items will be populated -->
                            </div>
                        </div>
                        
                        <div class="day-column" id="wednesdayColumn">
                            <div class="day-header">
                                <h3>Wednesday</h3>
                                <button class="btn btn-small btn-secondary" data-action="addDailyItem" data-params="wednesday">+</button>
                            </div>
                            <div class="day-items" id="wednesdayItems">
                                <!-- Wednesday items will be populated -->
                            </div>
                        </div>
                        
                        <div class="day-column" id="thursdayColumn">
                            <div class="day-header">
                                <h3>Thursday</h3>
                                <button class="btn btn-small btn-secondary" data-action="addDailyItem" data-params="thursday">+</button>
                            </div>
                            <div class="day-items" id="thursdayItems">
                                <!-- Thursday items will be populated -->
                            </div>
                        </div>
                        
                        <div class="day-column" id="fridayColumn">
                            <div class="day-header">
                                <h3>Friday</h3>
                                <button class="btn btn-small btn-secondary" data-action="addDailyItem" data-params="friday">+</button>
                            </div>
                            <div class="day-items" id="fridayItems">
                                <!-- Friday items will be populated -->
                            </div>
                        </div>
                        
                        <div class="day-column" id="saturdayColumn">
                            <div class="day-header">
                                <h3>Saturday</h3>
                                <button class="btn btn-small btn-secondary" data-action="addDailyItem" data-params="saturday">+</button>
                            </div>
                            <div class="day-items" id="saturdayItems">
                                <!-- Saturday items will be populated -->
                            </div>
                        </div>
                        
                        <div class="day-column" id="sundayColumn">
                            <div class="day-header">
                                <h3>Sunday</h3>
                                <button class="btn btn-small btn-secondary" data-action="addDailyItem" data-params="sunday">+</button>
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