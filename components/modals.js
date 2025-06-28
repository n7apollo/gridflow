/**
 * GridFlow Modals Component
 * Contains all application modals
 */
class GridFlowModals extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = this.getTemplate();
    }

    connectedCallback() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.addEventListener('click', this.handleClick.bind(this));
        this.addEventListener('submit', this.handleSubmit.bind(this));
    }

    handleClick(event) {
        // Handle close buttons
        if (event.target.classList.contains('close')) {
            event.preventDefault();
            const modal = event.target.closest('.modal');
            if (modal) {
                modal.classList.remove('modal-open');
            }
        }
        
        // Handle modal backdrop clicks
        if (event.target.classList.contains('modal') && event.target.classList.contains('modal-open')) {
            event.target.classList.remove('modal-open');
        }

        // Handle action buttons
        const button = event.target.closest('button');
        if (button && button.dataset.action) {
            const action = button.dataset.action;
            event.preventDefault();
            
            // Check if we should close mobile menu after action
            if (button.dataset.closeMenu === 'true' && window.closeMobileMenu) {
                window.closeMobileMenu();
            }
            
            if (window[action]) {
                if (button.dataset.params) {
                    window[action](button.dataset.params);
                } else {
                    // Only pass event to functions that expect it (save functions)
                    if (action.startsWith('save')) {
                        window[action](event);
                    } else {
                        window[action]();
                    }
                }
            }
        }

        // Handle overlay clicks
        if (event.target.classList.contains('mobile-menu-overlay')) {
            event.preventDefault();
            if (window.closeMobileMenu) {
                window.closeMobileMenu();
            }
        }
    }

    handleSubmit(event) {
        // Prevent default form submission and handle with JavaScript
        event.preventDefault();
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton && submitButton.dataset.action) {
            const action = submitButton.dataset.action;
            if (window[action]) {
                // Form submissions always need the event for preventDefault
                window[action](event);
            }
        }
    }

    getTemplate() {
        return `
            <!-- Entity Detail View Modal -->
            <div class="modal" id="entityDetailModal">
                <div class="modal-box w-11/12 max-w-5xl h-5/6 max-h-screen">
                    <!-- Modal Header -->
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center gap-4">
                            <div class="text-4xl" id="entityIcon">📋</div>
                            <div class="flex-1">
                                <h2 id="entityDetailTitle" class="text-2xl font-bold text-base-content" contenteditable="true">Entity Title</h2>
                                <div class="flex items-center gap-2 mt-1">
                                    <span class="badge badge-primary" id="entityTypeBadge">Task</span>
                                    <span class="text-xs text-base-content/60" id="entityIdDisplay">task_1</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-4">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" class="checkbox checkbox-primary" id="entityCompleted">
                                <span class="text-sm font-medium">Complete</span>
                            </label>
                            <button class="btn btn-sm btn-circle btn-ghost" data-action="closeEntityDetailModal">✕</button>
                        </div>
                    </div>

                    <!-- Modal Body -->
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-y-auto">
                        <!-- Left Column - Main Content (2/3 width) -->
                        <div class="lg:col-span-2 space-y-6">
                            <!-- Description Section -->
                            <div class="card bg-base-100 shadow-sm border border-base-300">
                                <div class="card-body">
                                    <h3 class="card-title text-lg">Description</h3>
                                    <textarea 
                                        id="entityDescription" 
                                        class="textarea textarea-bordered w-full h-32 resize-none" 
                                        placeholder="Add a description...">
                                    </textarea>
                                </div>
                            </div>

                            <!-- Task-specific section -->
                            <div class="card bg-base-100 shadow-sm border border-base-300 task-only" id="taskSpecificSection">
                                <div class="card-body">
                                    <h3 class="card-title text-lg">Task Details</h3>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div class="form-control">
                                            <label class="label">
                                                <span class="label-text font-medium">Priority</span>
                                            </label>
                                            <select id="entityPriority" class="select select-bordered">
                                                <option value="low">🟢 Low</option>
                                                <option value="medium">🟡 Medium</option>
                                                <option value="high">🔴 High</option>
                                            </select>
                                        </div>
                                        <div class="form-control">
                                            <label class="label">
                                                <span class="label-text font-medium">Due Date</span>
                                            </label>
                                            <input type="date" id="entityDueDate" class="input input-bordered">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Checklist-specific section -->
                            <div class="card bg-base-100 shadow-sm border border-base-300 checklist-only" id="checklistSection">
                                <div class="card-body">
                                    <div class="flex items-center justify-between">
                                        <h3 class="card-title text-lg">Checklist Items</h3>
                                        <button class="btn btn-sm btn-primary" data-action="addChecklistItem">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                            </svg>
                                            Add Item
                                        </button>
                                    </div>
                                    <div class="space-y-2 mt-4" id="checklistItems">
                                        <!-- Checklist items will be populated here -->
                                    </div>
                                </div>
                            </div>

                            <!-- Project-specific section -->
                            <div class="card bg-base-100 shadow-sm border border-base-300 project-only" id="projectSection">
                                <div class="card-body">
                                    <h3 class="card-title text-lg">Project Details</h3>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div class="form-control">
                                            <label class="label">
                                                <span class="label-text font-medium">Status</span>
                                            </label>
                                            <select id="projectStatus" class="select select-bordered">
                                                <option value="planning">📋 Planning</option>
                                                <option value="active">🚀 Active</option>
                                                <option value="on-hold">⏸️ On Hold</option>
                                                <option value="completed">✅ Completed</option>
                                            </select>
                                        </div>
                                        <div class="form-control">
                                            <label class="label">
                                                <span class="label-text font-medium">Team</span>
                                            </label>
                                            <input type="text" id="projectTeam" class="input input-bordered" placeholder="Team members...">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Subtasks Section -->
                            <div class="card bg-base-100 shadow-sm border border-base-300" id="subtasksSection">
                                <div class="card-body">
                                    <div class="flex items-center justify-between">
                                        <h3 class="card-title text-lg">Subtasks</h3>
                                        <button class="btn btn-sm btn-outline" data-action="addSubtask">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4m0 0l4 4m-4-4l4-4"></path>
                                            </svg>
                                            Add Subtask
                                        </button>
                                    </div>
                                    <div class="mt-4" id="subtasksList">
                                        <!-- Subtasks will be populated here -->
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Right Column - Sidebar (1/3 width) -->
                        <div class="space-y-4">
                            <!-- Actions Card -->
                            <div class="card bg-base-100 shadow-sm border border-base-300">
                                <div class="card-body">
                                    <h4 class="card-title text-base">Actions</h4>
                                    <div class="space-y-2">
                                        <button class="btn btn-primary btn-sm w-full" data-action="addToWeeklyPlan">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                            </svg>
                                            Add to Weekly Plan
                                        </button>
                                        <button class="btn btn-outline btn-sm w-full" data-action="duplicateEntity">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                            </svg>
                                            Duplicate
                                        </button>
                                        <button class="btn btn-outline btn-sm w-full" data-action="moveToBoard">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                                            </svg>
                                            Move to Board
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Weekly Planning Card -->
                            <div class="card bg-base-100 shadow-sm border border-base-300" id="weeklyPlanSection">
                                <div class="card-body">
                                    <h4 class="card-title text-base">Weekly Planning</h4>
                                    <div id="weeklyStatus">
                                        <div class="text-sm text-base-content/60">Not in any weekly plan</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Tags Card -->
                            <div class="card bg-base-100 shadow-sm border border-base-300">
                                <div class="card-body">
                                    <h4 class="card-title text-base">Tags</h4>
                                    <div class="flex flex-wrap gap-2 mb-2" id="entityTags">
                                        <!-- Tags will be populated here -->
                                    </div>
                                    <input type="text" id="newTagInput" class="input input-bordered input-sm w-full" placeholder="Add tag...">
                                </div>
                            </div>

                            <!-- Metadata Card -->
                            <div class="card bg-base-100 shadow-sm border border-base-300">
                                <div class="card-body">
                                    <h4 class="card-title text-base">Details</h4>
                                    <div class="space-y-2 text-sm">
                                        <div class="flex justify-between">
                                            <span class="text-base-content/60">Created:</span>
                                            <span id="entityCreated">-</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-base-content/60">Modified:</span>
                                            <span id="entityModified">-</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-base-content/60">Board:</span>
                                            <span id="entityBoard">-</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Danger Zone Card -->
                            <div class="card bg-error/10 shadow-sm border border-error/20">
                                <div class="card-body">
                                    <h4 class="card-title text-base text-error">Danger Zone</h4>
                                    <button class="btn btn-error btn-sm w-full" data-action="deleteEntity">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                        </svg>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Modal Footer -->
                    <div class="modal-action mt-6 pt-4 border-t border-base-300">
                        <button class="btn btn-primary" data-action="saveEntityChanges">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Save Changes
                        </button>
                        <button class="btn btn-ghost" data-action="closeEntityDetailModal">Close</button>
                    </div>
                </div>
                <div class="modal-backdrop" data-action="closeEntityDetailModal"></div>
            </div>

            <!-- Card Modal -->
            <div class="modal" id="cardModal">
                <div class="modal-box w-full max-w-lg">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" data-action="closeModal">✕</button>
                    <h2 id="cardModalTitle" class="text-xl font-bold mb-4">Add Card</h2>
                    <form id="cardForm" class="space-y-4">
                        <div class="form-control">
                            <label class="label" for="cardTitle">Title:</label>
                            <input type="text" id="cardTitle" name="cardTitle" required class="input input-bordered w-full">
                        </div>
                        <div class="form-control">
                            <label class="label" for="cardDescription">Description:</label>
                            <textarea id="cardDescription" name="cardDescription" class="textarea textarea-bordered w-full"></textarea>
                        </div>
                        <div class="form-control">
                            <label class="label" for="cardRow">Row:</label>
                            <select id="cardRow" name="cardRow" required class="select select-bordered w-full"></select>
                        </div>
                        <div class="form-control">
                            <label class="label" for="cardColumn">Column:</label>
                            <select id="cardColumn" name="cardColumn" required class="select select-bordered w-full"></select>
                        </div>
                        <div class="form-control">
                            <label class="label" for="cardPriority">Priority:</label>
                            <select id="cardPriority" name="cardPriority" class="select select-bordered w-full">
                                <option value="low">Low</option>
                                <option value="medium" selected>Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div class="form-control">
                            <label class="label" for="cardDueDate">Due Date:</label>
                            <input type="date" id="cardDueDate" name="cardDueDate" class="input input-bordered w-full">
                        </div>
                        <div class="modal-action flex gap-2 justify-end">
                            <button type="submit" class="btn btn-primary" data-action="saveCard">Save Card</button>
                            <button type="button" class="btn btn-secondary" data-action="closeModal">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Task Modal -->
            <div class="modal" id="taskModal">
                <div class="modal-box w-full max-w-lg">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" data-action="closeTaskModal">✕</button>
                    <h2 id="taskModalTitle" class="text-xl font-bold mb-4">Add Task</h2>
                    <form id="taskForm" class="space-y-4">
                        <div class="form-control">
                            <label class="label" for="taskTitle">Title:</label>
                            <input type="text" id="taskTitle" name="taskTitle" required class="input input-bordered w-full">
                        </div>
                        <div class="form-control">
                            <label class="label" for="taskDescription">Description:</label>
                            <textarea id="taskDescription" name="taskDescription" class="textarea textarea-bordered w-full"></textarea>
                        </div>
                        <div class="form-control">
                            <label class="label" for="taskBoard">Board:</label>
                            <select id="taskBoard" name="taskBoard" required class="select select-bordered w-full"></select>
                        </div>
                        <div class="form-control">
                            <label class="label" for="taskRow">Row:</label>
                            <select id="taskRow" name="taskRow" required class="select select-bordered w-full"></select>
                        </div>
                        <div class="form-control">
                            <label class="label" for="taskColumn">Column:</label>
                            <select id="taskColumn" name="taskColumn" required class="select select-bordered w-full"></select>
                        </div>
                        <div class="form-control">
                            <label class="label" for="taskPriority">Priority:</label>
                            <select id="taskPriority" name="taskPriority" class="select select-bordered w-full">
                                <option value="low">Low</option>
                                <option value="medium" selected>Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div class="form-control">
                            <label class="label" for="taskDueDate">Due Date:</label>
                            <input type="date" id="taskDueDate" name="taskDueDate" class="input input-bordered w-full">
                        </div>
                        <div class="form-control flex items-center gap-2">
                            <input type="checkbox" id="taskCompleted" name="taskCompleted" class="checkbox">
                            <label for="taskCompleted">Mark as completed</label>
                        </div>
                        <div class="modal-action flex gap-2 justify-end">
                            <button type="submit" class="btn btn-primary" data-action="saveTask">Save Task</button>
                            <button type="button" class="btn btn-secondary" data-action="closeTaskModal">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Weekly Reflection Modal -->
            <div class="modal" id="weeklyReflectionModal">
                <div class="modal-content">
                    <span class="close" data-action="closeWeeklyReflectionModal">&times;</span>
                    <h2>Weekly Reflection</h2>
                    <form id="weeklyReflectionForm">
                        <div class="form-group">
                            <label for="reflectionWins">What went well this week?</label>
                            <textarea id="reflectionWins" name="reflectionWins" rows="3" placeholder="Celebrate your wins, both big and small..."></textarea>
                        </div>
                        <div class="form-group">
                            <label for="reflectionChallenges">What challenges did you face?</label>
                            <textarea id="reflectionChallenges" name="reflectionChallenges" rows="3" placeholder="What obstacles or difficulties did you encounter?"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="reflectionLearnings">What did you learn?</label>
                            <textarea id="reflectionLearnings" name="reflectionLearnings" rows="3" placeholder="What insights, skills, or knowledge did you gain?"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="reflectionNextWeek">Focus for next week:</label>
                            <textarea id="reflectionNextWeek" name="reflectionNextWeek" rows="2" placeholder="What's your main priority or focus for next week?"></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary" data-action="saveWeeklyReflection">Save Reflection</button>
                            <button type="button" class="btn btn-secondary" data-action="closeWeeklyReflectionModal">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Board Modal -->
            <div class="modal" id="boardModal">
                <div class="modal-box w-full max-w-lg">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" data-action="closeBoardModal">✕</button>
                    <h2 id="boardModalTitle" class="text-xl font-bold mb-4">Boards</h2>
                    <div id="boardsList"></div>
                </div>
            </div>

            <!-- Board Edit Modal -->
            <div class="modal" id="boardEditModal">
                <div class="modal-box w-full max-w-lg">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" data-action="closeBoardEditModal">✕</button>
                    <h2 id="boardEditModalTitle" class="text-xl font-bold mb-4">Edit Board</h2>
                    <form id="boardEditForm" class="space-y-4">
                        <div class="form-control">
                            <label class="label" for="editBoardName">Board Name:</label>
                            <input type="text" id="editBoardName" name="editBoardName" required class="input input-bordered w-full">
                        </div>
                        <div class="modal-action flex gap-2 justify-end">
                            <button type="submit" class="btn btn-primary" data-action="saveBoardEdit">Save</button>
                            <button type="button" class="btn btn-secondary" data-action="closeBoardEditModal">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Group Modal -->
            <div class="modal" id="groupModal">
                <div class="modal-box w-full max-w-lg">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" data-action="closeGroupModal">✕</button>
                    <h2 id="groupModalTitle" class="text-xl font-bold mb-4">Group</h2>
                    <form id="groupForm" class="space-y-4">
                        <div class="form-control">
                            <label class="label" for="groupName">Group Name:</label>
                            <input type="text" id="groupName" name="groupName" required class="input input-bordered w-full">
                        </div>
                        <div class="form-control">
                            <label class="label" for="groupColor">Color:</label>
                            <input type="color" id="groupColor" name="groupColor" class="input input-bordered w-16">
                        </div>
                        <div class="modal-action flex gap-2 justify-end">
                            <button type="submit" class="btn btn-primary" data-action="saveGroup">Save</button>
                            <button type="button" class="btn btn-secondary" data-action="closeGroupModal">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Column Modal -->
            <div class="modal" id="columnModal">
                <div class="modal-box w-full max-w-lg">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" data-action="closeColumnModal">✕</button>
                    <h2 id="columnModalTitle" class="text-xl font-bold mb-4">Column</h2>
                    <form id="columnForm" class="space-y-4">
                        <div class="form-control">
                            <label class="label" for="columnName">Column Name:</label>
                            <input type="text" id="columnName" name="columnName" required class="input input-bordered w-full">
                        </div>
                        <div class="modal-action flex gap-2 justify-end">
                            <button type="submit" class="btn btn-primary" data-action="saveColumn">Save</button>
                            <button type="button" class="btn btn-secondary" data-action="closeColumnModal">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Row Modal -->
            <div class="modal" id="rowModal">
                <div class="modal-box w-full max-w-lg">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" data-action="closeRowModal">✕</button>
                    <h2 id="rowModalTitle" class="text-xl font-bold mb-4">Row</h2>
                    <form id="rowForm" class="space-y-4">
                        <div class="form-control">
                            <label class="label" for="rowName">Row Name:</label>
                            <input type="text" id="rowName" name="rowName" required class="input input-bordered w-full">
                        </div>
                        <div class="form-control">
                            <label class="label" for="rowDescription">Description:</label>
                            <textarea id="rowDescription" name="rowDescription" class="textarea textarea-bordered w-full"></textarea>
                        </div>
                        <div class="form-control">
                            <label class="label" for="rowGroup">Group:</label>
                            <select id="rowGroup" name="rowGroup" class="select select-bordered w-full">
                                <option value="">No Group</option>
                            </select>
                        </div>
                        <div class="modal-action flex gap-2 justify-end">
                            <button type="submit" class="btn btn-primary" data-action="saveRow">Save</button>
                            <button type="button" class="btn btn-secondary" data-action="closeRowModal">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Card Detail Modal -->
            <div class="modal" id="cardDetailModal">
                <div class="modal-box w-full max-w-lg">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" data-action="closeCardDetailModal">✕</button>
                    <h2 id="cardDetailModalTitle" class="text-xl font-bold mb-4">Card Details</h2>
                    <div id="cardDetailModalContent"></div>
                </div>
            </div>

            <!-- Weekly Item Modal -->
            <div class="modal" id="weeklyItemModal">
                <div class="modal-box w-full max-w-lg">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" data-action="closeWeeklyItemModal">✕</button>
                    <h2 id="weeklyItemModalTitle" class="text-xl font-bold mb-4">Weekly Item</h2>
                    <form id="weeklyItemForm" class="space-y-4">
                        <div class="form-control">
                            <label class="label" for="weeklyItemType">Type:</label>
                            <select id="weeklyItemType" name="weeklyItemType" class="select select-bordered w-full">
                                <option value="note">Note</option>
                                <option value="task">Task</option>
                                <option value="checklist">Checklist</option>
                            </select>
                        </div>
                        <div class="form-control">
                            <label class="label" for="weeklyItemTitle">Title:</label>
                            <input type="text" id="weeklyItemTitle" name="weeklyItemTitle" required class="input input-bordered w-full">
                        </div>
                        <div class="form-control">
                            <label class="label" for="weeklyItemContent">Content:</label>
                            <textarea id="weeklyItemContent" name="weeklyItemContent" class="textarea textarea-bordered w-full"></textarea>
                        </div>
                        <div class="modal-action flex gap-2 justify-end">
                            <button type="submit" class="btn btn-primary" data-action="saveWeeklyItem">Save</button>
                            <button type="button" class="btn btn-secondary" data-action="closeWeeklyItemModal">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Save As Template Modal -->
            <div class="modal" id="saveAsTemplateModal">
                <div class="modal-box w-full max-w-lg">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" data-action="closeSaveAsTemplateModal">✕</button>
                    <h2 id="saveAsTemplateModalTitle" class="text-xl font-bold mb-4">Save as Template</h2>
                    <form id="saveAsTemplateForm" class="space-y-4">
                        <div class="form-control">
                            <label class="label" for="saveTemplateName">Template Name:</label>
                            <input type="text" id="saveTemplateName" name="saveTemplateName" required class="input input-bordered w-full">
                        </div>
                        <div class="form-control">
                            <label class="label" for="saveTemplateDescription">Description:</label>
                            <textarea id="saveTemplateDescription" name="saveTemplateDescription" class="textarea textarea-bordered w-full"></textarea>
                        </div>
                        <div class="modal-action flex gap-2 justify-end">
                            <button type="submit" class="btn btn-primary" data-action="saveAsTemplate">Save</button>
                            <button type="button" class="btn btn-secondary" data-action="closeSaveAsTemplateModal">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Create Template Modal -->
            <div class="modal" id="createTemplateModal">
                <div class="modal-box w-full max-w-lg">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" data-action="closeCreateTemplateModal">✕</button>
                    <h2 id="createTemplateModalTitle" class="text-xl font-bold mb-4">Create Template</h2>
                    <form id="createTemplateForm" class="space-y-4">
                        <div class="form-control">
                            <label class="label" for="createTemplateName">Template Name:</label>
                            <input type="text" id="createTemplateName" name="createTemplateName" required class="input input-bordered w-full">
                        </div>
                        <div class="form-control">
                            <label class="label" for="createTemplateDescription">Description:</label>
                            <textarea id="createTemplateDescription" name="createTemplateDescription" class="textarea textarea-bordered w-full"></textarea>
                        </div>
                        <div class="modal-action flex gap-2 justify-end">
                            <button type="submit" class="btn btn-primary" data-action="createTemplate">Create</button>
                            <button type="button" class="btn btn-secondary" data-action="closeCreateTemplateModal">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Apply Template Modal -->
            <div class="modal" id="applyTemplateModal">
                <div class="modal-box w-full max-w-lg">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" data-action="closeApplyTemplateModal">✕</button>
                    <h2 id="applyTemplateModalTitle" class="text-xl font-bold mb-4">Apply Template</h2>
                    <form id="applyTemplateForm" class="space-y-4">
                        <div class="form-control">
                            <label class="label" for="applyTemplateSelect">Select Template:</label>
                            <select id="applyTemplateSelect" name="applyTemplateSelect" class="select select-bordered w-full"></select>
                        </div>
                        <div class="modal-action flex gap-2 justify-end">
                            <button type="submit" class="btn btn-primary" data-action="applySelectedTemplate">Apply</button>
                            <button type="button" class="btn btn-secondary" data-action="closeApplyTemplateModal">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Outline Modal -->
            <div class="modal" id="outlineModal">
                <div class="modal-box w-full max-w-lg">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" data-action="closeOutlineModal">✕</button>
                    <h2 id="outlineModalTitle" class="text-xl font-bold mb-4">Outline</h2>
                    <div id="outlineModalContent"></div>
                </div>
            </div>

            <!-- Groups List Modal -->
            <div class="modal" id="groupsListModal">
                <div class="modal-box w-full max-w-lg">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" data-action="closeGroupsListModal">✕</button>
                    <h2 id="groupsListModalTitle" class="text-xl font-bold mb-4">Groups List</h2>
                    <div id="groupsListModalContent"></div>
                </div>
            </div>

            <!-- Columns List Modal -->
            <div class="modal" id="columnsListModal">
                <div class="modal-box w-full max-w-lg">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" data-action="closeColumnsListModal">✕</button>
                    <h2 id="columnsListModalTitle" class="text-xl font-bold mb-4">Columns List</h2>
                    <div id="columnsListModalContent"></div>
                </div>
            </div>

            <!-- Data Management Modal -->
            <div class="modal" id="dataManagementModal">
                <div class="modal-box w-full max-w-lg">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" data-action="closeDataManagementModal">✕</button>
                    <h2 class="text-xl font-bold mb-4">Data Management</h2>
                    <div class="space-y-6">
                        <div class="card bg-base-100 border border-base-300">
                            <div class="card-body">
                                <h3 class="card-title text-base">📤 Backup Data</h3>
                                <p>Export all your GridFlow data as a JSON backup file:</p>
                                <button class="btn btn-primary w-full mt-2" data-action="exportToJSON">💾 Download Backup (JSON)</button>
                            </div>
                        </div>
                        <div class="card bg-base-100 border border-base-300">
                            <div class="card-body">
                                <h3 class="card-title text-base">📥 Import Data</h3>
                                <p>Select a JSON backup file to import:</p>
                                <div class="flex items-center gap-2 mt-2">
                                    <input type="file" id="importFile" accept=".json" class="file-input file-input-bordered file-input-sm w-full max-w-xs" onchange="importFromJSON()">
                                    <label for="importFile" class="btn btn-secondary">Choose File</label>
                                </div>
                                <p class="text-xs text-base-content/60 mt-2">
                                    <strong>Note:</strong> Importing will merge data with your current workspace. Export your current data first if you want to preserve it.
                                </p>
                            </div>
                        </div>
                        <div class="card bg-error/10 border border-error/20">
                            <div class="card-body">
                                <h3 class="card-title text-base text-error">⚠️ Danger Zone</h3>
                                <p>Clear all data and start fresh. This action cannot be undone.</p>
                                <button class="btn btn-error w-full mt-2" data-action="clearAllData">🗑️ Clear All Data</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Import Progress Modal -->
            <div class="modal" id="importProgressModal">
                <div class="modal-box w-full max-w-2xl">
                    <h2 class="text-xl font-bold mb-4">Import Progress</h2>
                    <div class="space-y-6">
                        <div class="card bg-base-100 border border-base-300">
                            <div class="card-body">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="font-medium">Analyzing file...</span>
                                    <span class="text-sm text-base-content/60 progress-percentage">0%</span>
                                </div>
                                <progress class="progress progress-primary w-full" value="0" max="100" id="importProgressFill"></progress>
                            </div>
                        </div>
                        <div class="card bg-base-100 border border-base-300">
                            <div class="card-body">
                                <h4 class="card-title text-base mb-2">Import Steps</h4>
                                <ul class="steps steps-vertical w-full">
                                    <li class="step step-neutral" id="step-parse">Parsing JSON file</li>
                                    <li class="step" id="step-validate">Validating data structure</li>
                                    <li class="step" id="step-migrate">Migrating data format</li>
                                    <li class="step" id="step-merge">Merging with existing data</li>
                                    <li class="step" id="step-save">Saving to storage</li>
                                </ul>
                            </div>
                        </div>
                        <div class="card bg-base-100 border border-base-300" id="importChoiceSection" style="display: none;">
                            <div class="card-body">
                                <h4 class="card-title text-base mb-2">Import Mode</h4>
                                <p class="mb-2">You have existing data. How would you like to import?</p>
                                <div class="flex flex-col gap-2">
                                    <label class="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="importMode" value="merge" class="radio radio-primary" checked>
                                        <span class="font-medium">🔄 Merge Data</span>
                                        <span class="text-xs text-base-content/60">Add imported boards and preserve existing ones. Recommended for most cases.</span>
                                    </label>
                                    <label class="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="importMode" value="replace" class="radio radio-error">
                                        <span class="font-medium">🗑️ Replace All Data</span>
                                        <span class="text-xs text-error">Delete all existing data and replace with imported data. Cannot be undone!</span>
                                    </label>
                                </div>
                                <div class="flex gap-2 mt-4">
                                    <button class="btn btn-primary" id="continueImportBtn">Continue Import</button>
                                    <button class="btn btn-secondary" id="cancelImportBtn">Cancel</button>
                                </div>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="card bg-base-100 border border-base-300">
                                <div class="card-body">
                                    <h4 class="card-title text-base mb-2">Import Summary</h4>
                                    <div class="stats stats-vertical w-full" id="importStats">
                                        <div class="stat">
                                            <div class="stat-title">Boards</div>
                                            <div class="stat-value" id="stat-boards">-</div>
                                        </div>
                                        <div class="stat">
                                            <div class="stat-title">Cards</div>
                                            <div class="stat-value" id="stat-cards">-</div>
                                        </div>
                                        <div class="stat">
                                            <div class="stat-title">Templates</div>
                                            <div class="stat-value" id="stat-templates">-</div>
                                        </div>
                                        <div class="stat">
                                            <div class="stat-title">Weekly Items</div>
                                            <div class="stat-value" id="stat-weekly">-</div>
                                        </div>
                                        <div class="stat">
                                            <div class="stat-title">Entities</div>
                                            <div class="stat-value" id="stat-entities">-</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="card bg-base-100 border border-base-300">
                                <div class="card-body">
                                    <h4 class="card-title text-base mb-2">Migration Details</h4>
                                    <div class="overflow-y-auto max-h-40 text-xs" id="migrationLog"></div>
                                </div>
                            </div>
                        </div>
                        <div class="flex gap-2 justify-end" id="importActions" style="display: none;">
                            <button class="btn btn-primary" data-action="closeImportProgress">Close</button>
                            <button class="btn btn-secondary" data-action="refreshAfterImport">Refresh Page</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Settings Modal -->
            <div class="modal" id="settingsModal">
                <div class="modal-box w-full max-w-lg">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" data-action="closeSettingsModal">✕</button>
                    <h2 class="text-xl font-bold mb-4">Settings</h2>
                    <div class="settings-container">
                        <!-- Content managed by ui-management.js -->
                    </div>
                </div>
            </div>

            <!-- Mobile Menu Overlay -->
            <div class="modal modal-open" id="mobileMenuOverlay" data-action="closeMobileMenu" style="background: rgba(0,0,0,0.4);"></div>
            <!-- Mobile Menu -->
            <div class="drawer-side" id="mobileMenu">
                <div class="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-bold">Menu</h3>
                        <button class="btn btn-sm btn-circle btn-ghost" data-action="closeMobileMenu">×</button>
                    </div>
                    <div class="mb-4">
                        <h4 class="font-semibold mb-2">Actions</h4>
                        <button class="btn btn-outline btn-block mb-2" data-action="addRow" data-close-menu="true">➕ Add Row</button>
                        <button class="btn btn-outline btn-block mb-2" data-action="addGroup" data-close-menu="true">📁 Add Group</button>
                    </div>
                    <div class="mb-4">
                        <h4 class="font-semibold mb-2">Templates</h4>
                        <button class="btn btn-outline btn-block mb-2" data-action="showApplyTemplateModal" data-close-menu="true">📥 Apply Template</button>
                        <button class="btn btn-outline btn-block mb-2" data-action="showSaveAsTemplateModal" data-close-menu="true">💾 Save as Template</button>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-2">Settings</h4>
                        <button class="btn btn-outline btn-block mb-2" data-action="showSettingsModal" data-close-menu="true">⚙️ Settings</button>
                        <button class="btn btn-outline btn-block" data-action="showExportModal" data-close-menu="true">📤 Export</button>
                    </div>
                </div>
            </div>

        `;
    }
}

// Register the custom element
customElements.define('gridflow-modals', GridFlowModals);