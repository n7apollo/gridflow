/**
 * GridFlow Header Component
 * Main navigation header with board selector and actions
 */
class GridFlowHeader extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = this.getTemplate();
    }

    connectedCallback() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.addEventListener('click', this.handleClick.bind(this));
        this.addEventListener('input', this.handleInput.bind(this));
    }

    handleClick(event) {
        const button = event.target.closest('button');
        if (button) {
            const action = button.dataset.action;
            if (action && window[action]) {
                event.preventDefault();
                if (button.dataset.params) {
                    window[action](button.dataset.params);
                } else {
                    window[action]();
                }
            }
        }
    }

    handleInput(event) {
        if (event.target.id === 'boardSearchInput') {
            if (window.filterBoards) {
                window.filterBoards();
            }
        }
    }

    getTemplate() {
        return `
            <header class="app-header">
                <div class="header-left">
                    <button class="mobile-menu-btn" data-action="toggleSidebar" title="Menu">☰</button>
                    
                    <div class="board-selector-enhanced">
                        <button class="current-board-btn" data-action="toggleBoardDropdown" id="currentBoardBtn">
                            <span class="current-board-name" id="currentBoardName">Loading...</span>
                            <span class="dropdown-arrow">▼</span>
                        </button>
                        <div class="board-dropdown" id="boardDropdown">
                            <div class="board-search">
                                <input type="text" placeholder="Search boards..." id="boardSearchInput">
                            </div>
                            <div class="board-list" id="boardList">
                                <!-- Populated dynamically -->
                            </div>
                            <div class="board-actions">
                                <button class="board-action-btn" data-action="createNewBoard">
                                    <span class="action-icon">+</span>
                                    <span class="action-text">New Board</span>
                                </button>
                                <button class="board-action-btn" data-action="showBoardModal">
                                    <span class="action-icon">⚙️</span>
                                    <span class="action-text">Manage Boards</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="header-center">
                    <div class="view-toggles">
                        <button class="btn btn-toggle active" id="boardViewBtn" data-action="switchToView" data-params="board" title="Board View">📋</button>
                        <button class="btn btn-toggle" id="taskViewBtn" data-action="switchToView" data-params="tasks" title="Task View">✅</button>
                        <button class="btn btn-toggle" id="weeklyViewBtn" data-action="switchToView" data-params="weekly" title="Weekly Plan">📅</button>
                    </div>
                    <button class="btn btn-primary" data-action="addRow">+ Add Row</button>
                </div>
                
                <div class="header-right">
                    <div class="secondary-actions">
                        <div class="templates-menu">
                            <button class="btn btn-secondary dropdown-trigger" data-action="toggleTemplatesMenu" id="templatesBtn">
                                📋 Templates
                                <span class="dropdown-arrow">▼</span>
                            </button>
                            <div class="dropdown-menu" id="templatesDropdown">
                                <button class="dropdown-item" data-action="showApplyTemplateModal">
                                    <span class="item-icon">📥</span>
                                    <span class="item-text">Apply Template</span>
                                </button>
                                <button class="dropdown-item" data-action="showSaveAsTemplateModal">
                                    <span class="item-icon">💾</span>
                                    <span class="item-text">Save as Template</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <button class="btn btn-secondary" data-action="addGroup">+ Group</button>
                    
                    <div class="tertiary-actions">
                        <div class="more-menu">
                            <button class="btn btn-secondary dropdown-trigger" data-action="toggleMoreMenu" id="moreBtn">
                                ⋯
                            </button>
                            <div class="dropdown-menu" id="moreDropdown">
                                <button class="dropdown-item" data-action="showSettingsModal">
                                    <span class="item-icon">⚙️</span>
                                    <span class="item-text">Settings</span>
                                </button>
                                <button class="dropdown-item" data-action="showExportModal">
                                    <span class="item-icon">📤</span>
                                    <span class="item-text">Export</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mobile-menu-container">
                        <button class="mobile-menu-toggle" data-action="toggleMobileMenu" id="mobileMenuBtn">
                            <span class="hamburger-line"></span>
                            <span class="hamburger-line"></span>
                            <span class="hamburger-line"></span>
                        </button>
                    </div>
                </div>
            </header>
        `;
    }
}

// Register the custom element
customElements.define('gridflow-header', GridFlowHeader);