/**
 * GridFlow - Collections View Controller
 * Handles the collections UI interactions and data binding
 */

import { metaService } from './meta-service.js';
import { createCollection, getCollectionItems, updateCollectionItems } from './collections.js';
import { getEntityTypeIcon, renderEntity } from './entity-renderer.js';
import { CONTEXT_TYPES } from './entity-core.js';

/**
 * Initialize collections view
 */
export async function initializeCollectionsView() {
    try {
        await renderCollectionsGrid();
        setupCollectionsEventListeners();
    } catch (error) {
        console.error('Failed to initialize collections view:', error);
    }
}

/**
 * Render collections list (updated for new layout)
 */
export async function renderCollectionsList() {
    try {
        const collections = await metaService.getAllCollections();
        const collectionsList = document.getElementById('collectionsList');
        const totalCollectionsCount = document.getElementById('totalCollectionsCount');
        
        if (!collectionsList) return;
        
        // Update count
        if (totalCollectionsCount) {
            totalCollectionsCount.textContent = collections.length;
        }
        
        if (collections.length === 0) {
            collectionsList.innerHTML = `
                <li class="list-row">
                    <div class="text-center py-8">
                        <div class="text-base-content/60">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder mx-auto mb-4"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
                            <p class="text-lg mb-2">No collections found</p>
                            <p class="text-sm mb-4">Create your first collection to organize related content</p>
                            <button class="btn btn-primary" onclick="showCreateCollectionModal()">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                Add Collection
                            </button>
                        </div>
                    </div>
                </li>
            `;
            return;
        }
        
        collectionsList.innerHTML = collections.map(collection => renderCollectionListItem(collection)).join('');
        
        // Reinitialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
    } catch (error) {
        console.error('Failed to render collections list:', error);
    }
}

/**
 * Render collections grid (backward compatibility)
 */
export async function renderCollectionsGrid() {
    return await renderCollectionsList();
}

/**
 * Render a single collection list item
 * @param {Object} collection - Collection object
 * @returns {string} HTML for collection list item
 */
function renderCollectionListItem(collection) {
    const itemCount = collection.itemCount || 0;
    const typeColor = getCollectionTypeColor(collection.type);
    const lastUpdated = new Date(collection.lastUpdated || collection.createdAt);
    const daysSince = Math.floor((Date.now() - lastUpdated) / (1000 * 60 * 60 * 24));
    
    return `
        <li class="list-row" onclick="showCollectionDetail('${collection.id}')">
            <div class="flex items-center gap-4 p-4 hover:bg-base-200 transition-colors cursor-pointer">
                <!-- Icon -->
                <div class="avatar placeholder">
                    <div class="bg-${typeColor} text-${typeColor}-content rounded-full w-12">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
                    </div>
                </div>
                
                <!-- Main Content -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <h3 class="font-semibold text-base truncate">${collection.name}</h3>
                        <span class="badge badge-${typeColor} badge-sm">${collection.type}</span>
                        ${collection.category ? `
                            <span class="badge badge-outline badge-sm">${collection.category}</span>
                        ` : ''}
                    </div>
                    <div class="text-sm text-base-content/70 mb-1">
                        ${collection.description || 'No description provided'}
                    </div>
                    <div class="text-xs text-base-content/60">
                        ${itemCount} items • Last updated: ${daysSince === 0 ? 'Today' : 
                                                            daysSince === 1 ? '1 day ago' : 
                                                            `${daysSince} days ago`}
                    </div>
                </div>
                
                <!-- Stats -->
                <div class="hidden sm:block text-right text-sm text-base-content/60">
                    <div class="font-medium">${itemCount}</div>
                    <div class="text-xs">items</div>
                </div>
                
                <!-- Action Arrow -->
                <div class="collection-actions opacity-0 transition-opacity group-hover:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
                </div>
            </div>
        </li>
    `;
}

/**
 * Show collection detail view
 */
export async function showCollectionDetail(collectionId) {
    try {
        const collection = await metaService.getCollection(collectionId);
        if (!collection) return;
        
        // Hide list view and show detail view
        const listView = document.getElementById('collectionsListView');
        const detailView = document.getElementById('collectionDetailView');
        
        if (!listView || !detailView) return;
        
        listView.classList.add('hidden');
        detailView.classList.remove('hidden');
        
        // Update collection info
        const nameElement = document.getElementById('collectionDetailName');
        const subtitleElement = document.getElementById('collectionDetailSubtitle');
        
        if (nameElement) nameElement.textContent = collection.name;
        if (subtitleElement) {
            subtitleElement.textContent = collection.description || `${collection.type} collection`;
        }
        
        // Update collection details
        const typeElement = document.getElementById('collectionType');
        const categoryElement = document.getElementById('collectionCategory');
        const itemCountElement = document.getElementById('collectionItemCount');
        const lastUpdatedElement = document.getElementById('collectionLastUpdated');
        
        if (typeElement) {
            typeElement.innerHTML = `<strong>Type:</strong> <span class="badge badge-${getCollectionTypeColor(collection.type)}">${collection.type}</span>`;
        }
        if (categoryElement) {
            categoryElement.innerHTML = collection.category ? 
                `<strong>Category:</strong> ${collection.category}` : 
                '<span class="text-base-content/50">No category</span>';
        }
        if (itemCountElement) {
            itemCountElement.innerHTML = `<strong>Items:</strong> ${collection.itemCount || 0}`;
        }
        
        const lastUpdated = new Date(collection.lastUpdated || collection.createdAt);
        const daysSince = Math.floor((Date.now() - lastUpdated) / (1000 * 60 * 60 * 24));
        if (lastUpdatedElement) {
            lastUpdatedElement.innerHTML = 
                `<strong>Last Updated:</strong> ${daysSince === 0 ? 'Today' : daysSince === 1 ? '1 day ago' : `${daysSince} days ago`}`;
        }
        
        // Update stats
        const totalItemsElement = document.getElementById('totalItems');
        const lastUpdateStatElement = document.getElementById('lastUpdateStat');
        
        if (totalItemsElement) {
            totalItemsElement.textContent = collection.itemCount || 0;
        }
        if (lastUpdateStatElement) {
            lastUpdateStatElement.textContent = daysSince === 0 ? 'Today' : 
                                              daysSince === 1 ? '1 day ago' : 
                                              `${daysSince} days ago`;
        }
        
        // Store current collection ID for actions
        detailView.dataset.collectionId = collectionId;
        
        // Load and display collection items
        await renderCollectionItems(collectionId);
        
    } catch (error) {
        console.error('Failed to show collection detail:', error);
    }
}

/**
 * Render collection items
 * @param {string} collectionId - Collection ID
 */
async function renderCollectionItems(collectionId) {
    const itemsContainer = document.getElementById('collectionItems');
    if (!itemsContainer) return;
    
    try {
        const items = await getCollectionItems(collectionId);
        
        // Clear container
        itemsContainer.innerHTML = '';
        
        if (items.length === 0) {
            itemsContainer.innerHTML = `
                <div class="text-center py-4 text-base-content/60">
                    <i data-lucide="folder-open" class="w-8 h-8 mx-auto mb-2"></i>
                    <p>No items in this collection yet</p>
                    <p class="text-xs">Items matching this collection's criteria will appear here</p>
                </div>
            `;
        } else {
            // Render each item using the unified entity renderer
            for (const item of items) {
                // Add collection context to item
                item.collectionId = collectionId;
                const itemElement = await renderCollectionItem(item);
                if (itemElement) {
                    itemsContainer.appendChild(itemElement);
                }
            }
        }
        
        // Re-render Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    } catch (error) {
        console.error('Failed to render collection items:', error);
        itemsContainer.innerHTML = `
            <div class="alert alert-error">
                <span>Failed to load collection items</span>
            </div>
        `;
    }
}

/**
 * Render a collection item using unified entity renderer
 * @param {Object} item - Collection item
 * @returns {Promise<HTMLElement>} Collection item element
 */
async function renderCollectionItem(item) {
    // Use the unified entity renderer for collection context
    const contextData = {
        collectionId: item.collectionId // Will be passed from the calling function
    };
    
    return await renderEntity(item.entity.id, CONTEXT_TYPES.COLLECTION, contextData);
}

/**
 * Setup event listeners for collections view
 */
function setupCollectionsEventListeners() {
    // Search input
    const searchInput = document.getElementById('collectionsSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            handleCollectionsSearch(e.target.value);
        });
        
        // Keyboard shortcut for search
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
            }
        });
    }
    
    // Quick filter menu
    const filterButtons = document.querySelectorAll('.collections-filter-menu');
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            const filter = button.getAttribute('data-filter');
            handleCollectionsFilter(filter);
        });
    });
    
    // Set default active filter
    const allFilter = document.querySelector('.collections-filter-menu[data-filter="all"]');
    if (allFilter) {
        allFilter.classList.add('active');
    }
}

/**
 * Handle collections search
 */
async function handleCollectionsSearch(searchTerm = '') {
    const collections = await metaService.getAllCollections();
    
    if (!searchTerm) {
        renderFilteredCollections(collections);
        return;
    }
    
    const filtered = collections.filter(collection => 
        collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (collection.description && collection.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    renderFilteredCollections(filtered);
}

/**
 * Handle collections filtering
 */
async function handleCollectionsFilter(filter = 'all') {
    let collections = await metaService.getAllCollections();
    
    // Apply filter
    if (filter !== 'all') {
        if (['smart', 'manual', 'tag-based'].includes(filter)) {
            collections = collections.filter(c => c.type === filter);
        } else if (['work', 'personal', 'archived'].includes(filter)) {
            collections = collections.filter(c => c.category === filter);
        }
    }
    
    renderFilteredCollections(collections);
}

/**
 * Render filtered collections
 */
function renderFilteredCollections(collections) {
    const collectionsList = document.getElementById('collectionsList');
    const totalCollectionsCount = document.getElementById('totalCollectionsCount');
    
    if (!collectionsList) return;
    
    // Update count
    if (totalCollectionsCount) {
        totalCollectionsCount.textContent = collections.length;
    }
    
    if (collections.length === 0) {
        collectionsList.innerHTML = `
            <li class="list-row">
                <div class="text-center py-8">
                    <div class="text-base-content/60">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search mx-auto mb-2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                        <p>No collections match your filters</p>
                    </div>
                </div>
            </li>
        `;
        return;
    }
    
    collectionsList.innerHTML = collections.map(collection => renderCollectionListItem(collection)).join('');
    
    // Reinitialize Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/**
 * Show collections list view (go back from detail)
 */
function showCollectionsList() {
    const listView = document.getElementById('collectionsListView');
    const detailView = document.getElementById('collectionDetailView');
    
    if (listView && detailView) {
        detailView.classList.add('hidden');
        listView.classList.remove('hidden');
    }
}

/**
 * Close collection detail panel (backward compatibility)
 */
export function closeCollectionDetail() {
    showCollectionsList();
}

/**
 * Refresh a collection's items
 */
export async function refreshCollection(collectionId) {
    try {
        await updateCollectionItems(collectionId);
        await renderCollectionsGrid();
        
        // If detail panel is open for this collection, refresh it
        const detailPanel = document.getElementById('collectionDetailPanel');
        if (detailPanel && detailPanel.dataset.collectionId === collectionId) {
            await showCollectionDetail(collectionId);
        }
        
    } catch (error) {
        console.error('Failed to refresh collection:', error);
    }
}

/**
 * Delete a collection
 */
export async function deleteCollection(collectionId) {
    if (!confirm('Are you sure you want to delete this collection?')) {
        return;
    }
    
    try {
        await metaService.deleteCollection(collectionId);
        await renderCollectionsGrid();
        closeCollectionDetail();
    } catch (error) {
        console.error('Failed to delete collection:', error);
    }
}

/**
 * Utility function for debouncing search input
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

function getCollectionTypeColor(type) {
    const colors = {
        smart: 'info',
        manual: 'primary',
        'tag-based': 'secondary'
    };
    return colors[type] || 'neutral';
}

function getEntityTypeColor(type) {
    const colors = {
        task: 'primary',
        note: 'info',
        checklist: 'success',
        project: 'warning'
    };
    return colors[type] || 'neutral';
}

// ==============================================
// GLOBAL FUNCTIONS
// ==============================================

/**
 * Open entity in appropriate context
 * @param {string} entityId - Entity ID
 */
window.openEntity = function(entityId) {
    console.log('Opening entity:', entityId);
    // TODO: Implement entity opening logic
};

/**
 * Export collections data
 */
window.exportCollections = async function() {
    try {
        const allCollections = await metaService.getAllCollections();
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            collections: allCollections
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gridflow-collections-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (window.showStatusMessage) {
            window.showStatusMessage(`Exported ${allCollections.length} collections`, 'success');
        }
    } catch (error) {
        console.error('Failed to export collections:', error);
        if (window.showStatusMessage) {
            window.showStatusMessage('Failed to export collections', 'error');
        }
    }
};

/**
 * Import collections data
 */
window.importCollections = async function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (!data.collections || !Array.isArray(data.collections)) {
                throw new Error('Invalid collections data format');
            }
            
            let imported = 0;
            for (const collectionData of data.collections) {
                try {
                    // Remove ID to create new collection
                    const { id, ...collectionWithoutId } = collectionData;
                    await metaService.createCollection(collectionWithoutId);
                    imported++;
                } catch (error) {
                    console.error('Failed to import collection:', collectionData.name, error);
                }
            }
            
            if (window.showStatusMessage) {
                window.showStatusMessage(`Imported ${imported} of ${data.collections.length} collections`, 'success');
            }
            
            // Refresh the collections list
            await renderCollectionsList();
            
        } catch (error) {
            console.error('Failed to import collections:', error);
            if (window.showStatusMessage) {
                window.showStatusMessage('Failed to import collections', 'error');
            }
        }
    };
    
    input.click();
};

/**
 * Show collections list
 */
window.showCollectionsList = showCollectionsList;

/**
 * Show collection detail
 */
window.showCollectionDetail = showCollectionDetail;

// Make functions available globally
window.initializeCollectionsView = initializeCollectionsView;
window.renderCollectionsGrid = renderCollectionsGrid;
window.renderCollectionsList = renderCollectionsList;
window.closeCollectionDetail = closeCollectionDetail;
window.refreshCollection = refreshCollection;
window.deleteCollection = deleteCollection;