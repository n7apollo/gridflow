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
                modal.style.display = 'none';
            }
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
                    window[action]();
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
                window[action]();
            }
        }
    }

    getTemplate() {
        return `
            <!-- Card Modal -->
            <div class="modal" id="cardModal">
                <div class="modal-content">
                    <span class="close" data-action="closeModal">&times;</span>
                    <h2 id="cardModalTitle">Add Card</h2>
                    <form id="cardForm">
                        <div class="form-group">
                            <label for="cardTitle">Title:</label>
                            <input type="text" id="cardTitle" name="cardTitle" required>
                        </div>
                        <div class="form-group">
                            <label for="cardDescription">Description:</label>
                            <textarea id="cardDescription" name="cardDescription"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="cardRow">Row:</label>
                            <select id="cardRow" name="cardRow" required></select>
                        </div>
                        <div class="form-group">
                            <label for="cardColumn">Column:</label>
                            <select id="cardColumn" name="cardColumn" required></select>
                        </div>
                        <div class="form-group">
                            <label for="cardPriority">Priority:</label>
                            <select id="cardPriority" name="cardPriority">
                                <option value="low">Low</option>
                                <option value="medium" selected>Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="cardDueDate">Due Date:</label>
                            <input type="date" id="cardDueDate" name="cardDueDate">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary" data-action="saveCard">Save Card</button>
                            <button type="button" class="btn btn-secondary" data-action="closeModal">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Task Modal -->
            <div class="modal" id="taskModal">
                <div class="modal-content">
                    <span class="close" data-action="closeTaskModal">&times;</span>
                    <h2 id="taskModalTitle">Add Task</h2>
                    <form id="taskForm">
                        <div class="form-group">
                            <label for="taskTitle">Title:</label>
                            <input type="text" id="taskTitle" name="taskTitle" required>
                        </div>
                        <div class="form-group">
                            <label for="taskDescription">Description:</label>
                            <textarea id="taskDescription" name="taskDescription"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="taskBoard">Board:</label>
                            <select id="taskBoard" name="taskBoard" required></select>
                        </div>
                        <div class="form-group">
                            <label for="taskRow">Row:</label>
                            <select id="taskRow" name="taskRow" required></select>
                        </div>
                        <div class="form-group">
                            <label for="taskColumn">Column:</label>
                            <select id="taskColumn" name="taskColumn" required></select>
                        </div>
                        <div class="form-group">
                            <label for="taskPriority">Priority:</label>
                            <select id="taskPriority" name="taskPriority">
                                <option value="low">Low</option>
                                <option value="medium" selected>Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="taskDueDate">Due Date:</label>
                            <input type="date" id="taskDueDate" name="taskDueDate">
                        </div>
                        <div class="form-group">
                            <label for="taskCompleted">
                                <input type="checkbox" id="taskCompleted" name="taskCompleted">
                                Mark as completed
                            </label>
                        </div>
                        <div class="form-actions">
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
    <div class="modal-content">
        <span class="close" data-action="closeBoardModal">&times;</span>
        <h2 id="boardModalTitle">Boards</h2>
        <div id="boardsList"></div>
    </div>
</div>

            <!-- Board Edit Modal -->
            <div class="modal" id="boardEditModal">
    <div class="modal-content">
        <span class="close" data-action="closeBoardEditModal">&times;</span>
        <h2 id="boardEditModalTitle">Edit Board</h2>
        <form id="boardEditForm">
            <div class="form-group">
                <label for="editBoardName">Board Name:</label>
                <input type="text" id="editBoardName" name="editBoardName" required>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary" data-action="saveBoardEdit">Save</button>
                <button type="button" class="btn btn-secondary" data-action="closeBoardEditModal">Cancel</button>
            </div>
        </form>
    </div>
</div>

            <!-- Group Modal -->
            <div class="modal" id="groupModal">
    <div class="modal-content">
        <span class="close" data-action="closeGroupModal">&times;</span>
        <h2 id="groupModalTitle">Group</h2>
        <form id="groupForm">
            <div class="form-group">
                <label for="groupName">Group Name:</label>
                <input type="text" id="groupName" name="groupName" required>
            </div>
            <div class="form-group">
                <label for="groupColor">Color:</label>
                <input type="color" id="groupColor" name="groupColor">
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary" data-action="saveGroup">Save</button>
                <button type="button" class="btn btn-secondary" data-action="closeGroupModal">Cancel</button>
            </div>
        </form>
    </div>
</div>

            <!-- Column Modal -->
            <div class="modal" id="columnModal">
    <div class="modal-content">
        <span class="close" data-action="closeColumnModal">&times;</span>
        <h2 id="columnModalTitle">Column</h2>
        <form id="columnForm">
            <div class="form-group">
                <label for="columnName">Column Name:</label>
                <input type="text" id="columnName" name="columnName" required>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary" data-action="saveColumn">Save</button>
                <button type="button" class="btn btn-secondary" data-action="closeColumnModal">Cancel</button>
            </div>
        </form>
    </div>
</div>

            <!-- Row Modal -->
            <div class="modal" id="rowModal">
    <div class="modal-content">
        <span class="close" data-action="closeRowModal">&times;</span>
        <h2 id="rowModalTitle">Row</h2>
        <form id="rowForm">
            <div class="form-group">
                <label for="rowName">Row Name:</label>
                <input type="text" id="rowName" name="rowName" required>
            </div>
            <div class="form-group">
                <label for="rowDescription">Description:</label>
                <textarea id="rowDescription" name="rowDescription"></textarea>
            </div>
            <div class="form-group">
                <label for="rowGroup">Group:</label>
                <select id="rowGroup" name="rowGroup">
                    <option value="">No Group</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary" data-action="saveRow">Save</button>
                <button type="button" class="btn btn-secondary" data-action="closeRowModal">Cancel</button>
            </div>
        </form>
    </div>
</div>

            <!-- Card Detail Modal -->
            <div class="modal" id="cardDetailModal">
    <div class="modal-content">
        <span class="close" data-action="closeCardDetailModal">&times;</span>
        <h2 id="cardDetailModalTitle">Card Details</h2>
        <div id="cardDetailModalContent"></div>
    </div>
</div>

            <!-- Weekly Item Modal -->
            <div class="modal" id="weeklyItemModal">
    <div class="modal-content">
        <span class="close" data-action="closeWeeklyItemModal">&times;</span>
        <h2 id="weeklyItemModalTitle">Weekly Item</h2>
        <form id="weeklyItemForm">
            <div class="form-group">
                <label for="weeklyItemType">Type:</label>
                <select id="weeklyItemType" name="weeklyItemType">
                    <option value="note">Note</option>
                    <option value="task">Task</option>
                    <option value="checklist">Checklist</option>
                </select>
            </div>
            <div class="form-group">
                <label for="weeklyItemTitle">Title:</label>
                <input type="text" id="weeklyItemTitle" name="weeklyItemTitle" required>
            </div>
            <div class="form-group">
                <label for="weeklyItemContent">Content:</label>
                <textarea id="weeklyItemContent" name="weeklyItemContent"></textarea>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary" data-action="saveWeeklyItem">Save</button>
                <button type="button" class="btn btn-secondary" data-action="closeWeeklyItemModal">Cancel</button>
            </div>
        </form>
    </div>
</div>

            <!-- Save As Template Modal -->
            <div class="modal" id="saveAsTemplateModal">
    <div class="modal-content">
        <span class="close" data-action="closeSaveAsTemplateModal">&times;</span>
        <h2 id="saveAsTemplateModalTitle">Save as Template</h2>
        <form id="saveAsTemplateForm">
            <div class="form-group">
                <label for="saveTemplateName">Template Name:</label>
                <input type="text" id="saveTemplateName" name="saveTemplateName" required>
            </div>
            <div class="form-group">
                <label for="saveTemplateDescription">Description:</label>
                <textarea id="saveTemplateDescription" name="saveTemplateDescription"></textarea>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary" data-action="saveAsTemplate">Save</button>
                <button type="button" class="btn btn-secondary" data-action="closeSaveAsTemplateModal">Cancel</button>
            </div>
        </form>
    </div>
</div>

            <!-- Create Template Modal -->
            <div class="modal" id="createTemplateModal">
    <div class="modal-content">
        <span class="close" data-action="closeCreateTemplateModal">&times;</span>
        <h2 id="createTemplateModalTitle">Create Template</h2>
        <form id="createTemplateForm">
            <div class="form-group">
                <label for="createTemplateName">Template Name:</label>
                <input type="text" id="createTemplateName" name="createTemplateName" required>
            </div>
            <div class="form-group">
                <label for="createTemplateDescription">Description:</label>
                <textarea id="createTemplateDescription" name="createTemplateDescription"></textarea>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary" data-action="createTemplate">Create</button>
                <button type="button" class="btn btn-secondary" data-action="closeCreateTemplateModal">Cancel</button>
            </div>
        </form>
    </div>
</div>

            <!-- Apply Template Modal -->
            <div class="modal" id="applyTemplateModal">
    <div class="modal-content">
        <span class="close" data-action="closeApplyTemplateModal">&times;</span>
        <h2 id="applyTemplateModalTitle">Apply Template</h2>
        <form id="applyTemplateForm">
            <div class="form-group">
                <label for="applyTemplateSelect">Select Template:</label>
                <select id="applyTemplateSelect" name="applyTemplateSelect"></select>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary" data-action="applySelectedTemplate">Apply</button>
                <button type="button" class="btn btn-secondary" data-action="closeApplyTemplateModal">Cancel</button>
            </div>
        </form>
    </div>
</div>

            <!-- Outline Modal -->
            <div class="modal" id="outlineModal">
    <div class="modal-content">
        <span class="close" data-action="closeOutlineModal">&times;</span>
        <h2 id="outlineModalTitle">Outline</h2>
        <div id="outlineModalContent"></div>
    </div>
</div>

            <!-- Groups List Modal -->
            <div class="modal" id="groupsListModal">
    <div class="modal-content">
        <span class="close" data-action="closeGroupsListModal">&times;</span>
        <h2 id="groupsListModalTitle">Groups List</h2>
        <div id="groupsListModalContent"></div>
    </div>
</div>

            <!-- Columns List Modal -->
            <div class="modal" id="columnsListModal">
    <div class="modal-content">
        <span class="close" data-action="closeColumnsListModal">&times;</span>
        <h2 id="columnsListModalTitle">Columns List</h2>
        <div id="columnsListModalContent"></div>
    </div>
</div>

            <!-- Data Management Modal -->
            <div class="modal" id="dataManagementModal">
                <div class="modal-content">
                    <span class="close" data-action="closeDataManagementModal">&times;</span>
                    <h2>Data Management</h2>
                    
                    <div class="data-section">
                        <h3>📤 Backup Data</h3>
                        <p>Export all your GridFlow data as a JSON backup file:</p>
                        <button class="btn btn-primary export-btn" data-action="exportToJSON">💾 Download Backup (JSON)</button>
                    </div>
                    
                    <div class="import-section">
                        <h3>📥 Import Data</h3>
                        <p>Select a JSON backup file to import:</p>
                        <div class="file-input-wrapper">
                            <input type="file" id="importFile" accept=".json" onchange="importFromJSON()">
                            <label for="importFile" class="btn btn-secondary">Choose File</label>
                        </div>
                        <p class="file-note">
                            <strong>Note:</strong> Importing will merge data with your current workspace. 
                            Export your current data first if you want to preserve it.
                        </p>
                    </div>
                    
                    <div class="danger-section">
                        <h3>⚠️ Danger Zone</h3>
                        <p>Clear all data and start fresh. This action cannot be undone.</p>
                        <button class="btn btn-danger" data-action="clearAllData">🗑️ Clear All Data</button>
                    </div>
                </div>
            </div>

            <!-- Import Progress Modal -->
            <div class="modal" id="importProgressModal">
                <div class="modal-content import-progress-content">
                    <h2>Import Progress</h2>
                    <div class="import-progress-container">
                        <div class="progress-section">
                            <div class="progress-header">
                                <span class="progress-label">Analyzing file...</span>
                                <span class="progress-percentage">0%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" id="importProgressFill"></div>
                            </div>
                        </div>
                        
                        <div class="import-steps">
                            <div class="import-step" id="step-parse">
                                <span class="step-icon">⏳</span>
                                <span class="step-text">Parsing JSON file</span>
                                <span class="step-status"></span>
                            </div>
                            <div class="import-step" id="step-validate">
                                <span class="step-icon">⏳</span>
                                <span class="step-text">Validating data structure</span>
                                <span class="step-status"></span>
                            </div>
                            <div class="import-step" id="step-migrate">
                                <span class="step-icon">⏳</span>
                                <span class="step-text">Migrating data format</span>
                                <span class="step-status"></span>
                            </div>
                            <div class="import-step" id="step-merge">
                                <span class="step-icon">⏳</span>
                                <span class="step-text">Merging with existing data</span>
                                <span class="step-status"></span>
                            </div>
                            <div class="import-step" id="step-save">
                                <span class="step-icon">⏳</span>
                                <span class="step-text">Saving to storage</span>
                                <span class="step-status"></span>
                            </div>
                        </div>
                        
                        <!-- Import Mode Choice (shown when needed) -->
                        <div class="import-choice-section" id="importChoiceSection" style="display: none;">
                            <h4>Import Mode</h4>
                            <p>You have existing data. How would you like to import?</p>
                            <div class="import-choice-options">
                                <label class="choice-option">
                                    <input type="radio" name="importMode" value="merge" checked>
                                    <div class="choice-content">
                                        <div class="choice-title">🔄 Merge Data</div>
                                        <div class="choice-description">Add imported boards and preserve existing ones. Recommended for most cases.</div>
                                    </div>
                                </label>
                                <label class="choice-option">
                                    <input type="radio" name="importMode" value="replace">
                                    <div class="choice-content">
                                        <div class="choice-title">🔄 Replace All Data</div>
                                        <div class="choice-description">Delete all existing data and replace with imported data. Cannot be undone!</div>
                                    </div>
                                </label>
                            </div>
                            <div class="import-choice-actions">
                                <button class="btn btn-primary" id="continueImportBtn">Continue Import</button>
                                <button class="btn btn-secondary" id="cancelImportBtn">Cancel</button>
                            </div>
                        </div>
                        
                        <div class="import-details">
                            <div class="detail-section">
                                <h4>Import Summary</h4>
                                <div class="import-stats" id="importStats">
                                    <div class="stat-item">
                                        <span class="stat-label">Boards:</span>
                                        <span class="stat-value" id="stat-boards">-</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Cards:</span>
                                        <span class="stat-value" id="stat-cards">-</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Templates:</span>
                                        <span class="stat-value" id="stat-templates">-</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Weekly Items:</span>
                                        <span class="stat-value" id="stat-weekly">-</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Entities:</span>
                                        <span class="stat-value" id="stat-entities">-</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Migration Details</h4>
                                <div class="migration-log" id="migrationLog">
                                    <!-- Migration details will be added here -->
                                </div>
                            </div>
                        </div>
                        
                        <div class="import-actions" style="display: none;" id="importActions">
                            <button class="btn btn-primary" data-action="closeImportProgress">Close</button>
                            <button class="btn btn-secondary" data-action="refreshAfterImport">Refresh Page</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Settings Modal -->
            <div class="modal" id="settingsModal">
                <div class="modal-content">
                    <span class="close" data-action="closeSettingsModal">&times;</span>
                    <h2>Settings</h2>
                    <!-- Settings content will be populated by JavaScript -->
                    <div class="settings-container">
                        <!-- Content managed by ui-management.js -->
                    </div>
                </div>
            </div>

            <!-- Mobile Menu Overlay -->
            <div class="mobile-menu-overlay" id="mobileMenuOverlay" data-action="closeMobileMenu"></div>
            
            <!-- Mobile Menu -->
            <div class="mobile-menu" id="mobileMenu">
                <div class="mobile-menu-header">
                    <h3>Menu</h3>
                    <button class="mobile-menu-close" data-action="closeMobileMenu">×</button>
                </div>
                
                <div class="mobile-menu-content">
                    <div class="mobile-menu-section">
                        <h4>Actions</h4>
                        <button class="mobile-menu-item" data-action="addRow" data-close-menu="true">
                            <span class="menu-icon">➕</span>
                            <span class="menu-text">Add Row</span>
                        </button>
                        <button class="mobile-menu-item" data-action="addGroup" data-close-menu="true">
                            <span class="menu-icon">📁</span>
                            <span class="menu-text">Add Group</span>
                        </button>
                    </div>
                    
                    <div class="mobile-menu-section">
                        <h4>Templates</h4>
                        <button class="mobile-menu-item" data-action="showApplyTemplateModal" data-close-menu="true">
                            <span class="menu-icon">📥</span>
                            <span class="menu-text">Apply Template</span>
                        </button>
                        <button class="mobile-menu-item" data-action="showSaveAsTemplateModal" data-close-menu="true">
                            <span class="menu-icon">💾</span>
                            <span class="menu-text">Save as Template</span>
                        </button>
                    </div>
                    
                    <div class="mobile-menu-section">
                        <h4>Settings</h4>
                        <button class="mobile-menu-item" data-action="showSettingsModal" data-close-menu="true">
                            <span class="menu-icon">⚙️</span>
                            <span class="menu-text">Settings</span>
                        </button>
                        <button class="mobile-menu-item" data-action="showExportModal" data-close-menu="true">
                            <span class="menu-icon">📤</span>
                            <span class="menu-text">Export</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Register the custom element
customElements.define('gridflow-modals', GridFlowModals);