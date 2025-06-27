/**
 * GridFlow Component Loader
 * Dynamically loads all component modules
 */
class ComponentLoader {
    constructor() {
        this.components = [
            'sidebar.js',
            'views.js',
            'modals.js'
        ];
        this.loadedComponents = new Set();
    }

    async loadComponents() {
        const loadPromises = this.components.map(component => this.loadComponent(component));
        
        try {
            await Promise.all(loadPromises);
            console.log('All GridFlow components loaded successfully');
            this.initializeApp();
        } catch (error) {
            console.error('Failed to load components:', error);
        }
    }

    async loadComponent(componentFile) {
        try {
            await import(`../components/${componentFile}`);
            this.loadedComponents.add(componentFile);
            console.log(`Loaded component: ${componentFile}`);
        } catch (error) {
            console.error(`Failed to load component ${componentFile}:`, error);
            throw error;
        }
    }

    initializeApp() {
        // Wait for custom elements to be defined
        Promise.all([
            customElements.whenDefined('gridflow-sidebar'),
            customElements.whenDefined('gridflow-views'),
            customElements.whenDefined('gridflow-modals')
        ]).then(() => {
            console.log('All custom elements ready');
            
            // Initialize the navigation system now that components are loaded
            if (window.navigation && window.navigation.initializeNavigation) {
                window.navigation.initializeNavigation();
            }
            
            // Re-run setupEventListeners now that modals exist
            if (window.utilities && window.utilities.setupEventListeners) {
                window.utilities.setupEventListeners();
            }
        });
    }

    // Check if all components are loaded
    isReady() {
        return this.loadedComponents.size === this.components.length;
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const loader = new ComponentLoader();
    loader.loadComponents();
});

// Export for potential external use
window.ComponentLoader = ComponentLoader;