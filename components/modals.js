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

            <!-- Export Modal -->
            <div class="modal" id="exportModal">
                <div class="modal-content">
                    <span class="close" data-action="closeExportModal">&times;</span>
                    <h2>Export Options</h2>
                    <div class="export-options">
                        <button class="btn btn-primary export-btn" data-action="exportToPDF">📄 Export as PDF</button>
                        <button class="btn btn-primary export-btn" data-action="exportToPNG">🖼️ Export as PNG</button>
                        <button class="btn btn-primary export-btn" data-action="exportToExcel">📊 Export as Excel</button>
                        <button class="btn btn-secondary export-btn" data-action="exportToJSON">💾 Backup Data (JSON)</button>
                    </div>
                    
                    <div class="import-section">
                        <h3>Import Data</h3>
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