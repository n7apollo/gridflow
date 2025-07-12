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
        // Handle buttons with actions
        const button = event.target.closest('button');
        if (button && button.dataset.action) {
            const action = button.dataset.action;
            if (action && window[action]) {
                event.preventDefault();
                window[action]();
                return;
            }
        }

        // Handle anchor elements with actions
        const actionLink = event.target.closest('a[data-action]');
        if (actionLink) {
            const action = actionLink.dataset.action;
            if (action && window[action]) {
                event.preventDefault();
                window[action]();
                return;
            }
        }

        // Handle view navigation links
        const viewLink = event.target.closest('a[data-view]');
        if (viewLink) {
            const view = viewLink.dataset.view;
            if (view && window.switchToView) {
                event.preventDefault();
                window.switchToView(view);
                return;
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
                        <ul class="menu bg-base-200 rounded-box">
                            <li class="menu-title">Views</li>
                            <li>
                                <a href="#" id="sidebarBoardView" data-view="board">
                                    <span class="mr-2">📋</span>
                                    Board View
                                </a>
                            </li>
                            <li>
                                <a href="#" id="sidebarTaskView" data-view="tasks">
                                    <span class="mr-2">✅</span>
                                    Task View
                                </a>
                            </li>
                            <li>
                                <a href="#" id="sidebarWeeklyView" data-view="weekly">
                                    <span class="mr-2">📅</span>
                                    Weekly Plan
                                </a>
                            </li>
                            <li>
                                <a href="#" id="sidebarNotesView" data-view="notes">
                                    <span class="mr-2">📝</span>
                                    Notes
                                </a>
                            </li>
                            <li>
                                <a href="#" id="sidebarPeopleView" data-view="people">
                                    <span class="mr-2">👥</span>
                                    People
                                </a>
                            </li>
                            <li>
                                <a href="#" id="sidebarCollectionsView" data-view="collections">
                                    <span class="mr-2">📂</span>
                                    Collections
                                </a>
                            </li>
                            <li>
                                <a href="#" id="sidebarTagsView" data-view="tags">
                                    <span class="mr-2">🏷️</span>
                                    Tags
                                </a>
                            </li>
                            <li>
                                <a href="#" id="sidebarSettingsView" data-view="settings">
                                    <span class="mr-2">⚙️</span>
                                    Settings
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