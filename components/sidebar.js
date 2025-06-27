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
            <aside class="w-64 min-h-screen bg-base-200 shadow-lg" id="sidebar">
                <div class="flex items-center justify-between p-4 border-b border-base-300">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">⚡</span>
                        <span class="font-bold text-lg">GridFlow</span>
                    </div>
                    <button class="btn btn-square btn-ghost lg:hidden" onclick="document.getElementById('drawer-toggle').checked = false" title="Close Sidebar">
                        <span class="text-xl">✕</span>
                    </button>
                </div>
                
                <div class="p-4 flex flex-col gap-6">
                    <div>
                        <div class="text-xs font-semibold text-base-content/60 mb-2">VIEWS</div>
                        <ul class="menu bg-base-200 rounded-box">
                            <li>
                                <a href="#" class="nav-link ${'active'}" id="sidebarBoardView" data-view="board">
                                    <span class="mr-2">📋</span>
                                    Board View
                                </a>
                            </li>
                            <li>
                                <a href="#" class="nav-link" id="sidebarTaskView" data-view="tasks">
                                    <span class="mr-2">✅</span>
                                    Task View
                                </a>
                            </li>
                            <li>
                                <a href="#" class="nav-link" id="sidebarWeeklyView" data-view="weekly">
                                    <span class="mr-2">📅</span>
                                    Weekly Plan
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <div class="text-xs font-semibold text-base-content/60 mb-2">SETTINGS</div>
                        <ul class="menu bg-base-200 rounded-box">
                            <li>
                                <a href="#" class="nav-link" data-action="showSettingsModal">
                                    <span class="mr-2">⚙️</span>
                                    Settings
                                </a>
                            </li>
                            <li>
                                <a href="#" class="nav-link" data-action="showDataManagementModal">
                                    <span class="mr-2">💾</span>
                                    Data Management
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </aside>
        `;
    }
}

// Register the custom element
customElements.define('gridflow-sidebar', GridFlowSidebar);