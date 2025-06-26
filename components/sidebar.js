/**
 * GridFlow Sidebar Component
 * Self-contained sidebar with navigation and actions
 */
class GridFlowSidebar extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = this.getTemplate();
    }

    connectedCallback() {
        // Component is added to DOM
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Event delegation for sidebar interactions
        this.addEventListener('click', this.handleClick.bind(this));
    }

    handleClick(event) {
        const button = event.target.closest('button');
        if (button) {
            const action = button.dataset.action;
            if (action && window[action]) {
                window[action]();
            }
        }

        const navLink = event.target.closest('.nav-link');
        if (navLink) {
            const view = navLink.dataset.view;
            if (view && window.switchToView) {
                window.switchToView(view);
            }
        }
    }

    getTemplate() {
        return `
            <aside class="sidebar" id="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-logo">
                        <span class="logo-icon">⚡</span>
                        <span class="logo-text">GridFlow</span>
                    </div>
                    <button class="sidebar-toggle" data-action="toggleSidebar" title="Toggle Sidebar">
                        <span class="toggle-icon">‹</span>
                    </button>
                </div>
                
                <div class="sidebar-content">
                    <div class="sidebar-section">
                        <div class="sidebar-section-title">VIEWS</div>
                        <nav class="sidebar-nav">
                            <ul>
                                <li class="nav-item">
                                    <a href="#" class="nav-link active" id="sidebarBoardView" data-view="board">
                                        <span class="nav-icon">📋</span>
                                        <span class="nav-text">Board View</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#" class="nav-link" id="sidebarTaskView" data-view="tasks">
                                        <span class="nav-icon">✅</span>
                                        <span class="nav-text">Task View</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#" class="nav-link" id="sidebarWeeklyView" data-view="weekly">
                                        <span class="nav-icon">📅</span>
                                        <span class="nav-text">Weekly Plan</span>
                                    </a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                    
                    <div class="sidebar-section">
                        <div class="sidebar-section-title">ACTIONS</div>
                        <nav class="sidebar-nav">
                            <ul>
                                <li class="nav-item">
                                    <a href="#" class="nav-link" data-action="addRow">
                                        <span class="nav-icon">➕</span>
                                        <span class="nav-text">Add Row</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#" class="nav-link" data-action="addGroup">
                                        <span class="nav-icon">📁</span>
                                        <span class="nav-text">Add Group</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#" class="nav-link" data-action="showApplyTemplateModal">
                                        <span class="nav-icon">📋</span>
                                        <span class="nav-text">Templates</span>
                                    </a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                    
                    <div class="sidebar-section">
                        <div class="sidebar-section-title">SETTINGS</div>
                        <nav class="sidebar-nav">
                            <ul>
                                <li class="nav-item">
                                    <a href="#" class="nav-link" data-action="showSettingsModal">
                                        <span class="nav-icon">⚙️</span>
                                        <span class="nav-text">Settings</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#" class="nav-link" data-action="showExportModal">
                                        <span class="nav-icon">📤</span>
                                        <span class="nav-text">Export</span>
                                    </a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </aside>
        `;
    }
}

// Register the custom element
customElements.define('gridflow-sidebar', GridFlowSidebar);