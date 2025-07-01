/**
 * GridFlow - Collections View Controller
 * Handles the collections UI interactions and data binding
 */

import { collectionsAdapter } from './indexeddb/adapters.js';
import { createCollection, getCollectionItems, updateCollectionItems } from './collections.js';

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
 * Render collections grid
 */
export async function renderCollectionsGrid() {
    try {
        const collections = await collectionsAdapter.getAll();
        const collectionsGrid = document.getElementById('collectionsGrid');
        
        if (!collectionsGrid) return;
        
        if (collections.length === 0) {
            collectionsGrid.innerHTML = `
                <div class="col-span-full text-center p-8">
                    <div class="text-gray-500 mb-4">
                        <i data-lucide="folder" class="w-16 h-16 mx-auto mb-2"></i>
                        <p>No collections found</p>
                    </div>
                    <button class="btn btn-primary" data-action="showCreateCollectionModal">
                        <i data-lucide="plus"></i> Create Your First Collection
                    </button>
                </div>
            `;
            return;
        }
        
        collectionsGrid.innerHTML = collections.map(collection => `
            <div class="collection-card card bg-base-100 border border-base-300 hover:border-primary transition-colors cursor-pointer" 
                 data-collection-id="${collection.id}" onclick="showCollectionDetail('${collection.id}')">
                <div class="card-body p-4">
                    <div class="flex items-start justify-between mb-2">
                        <h3 class="card-title text-sm">${collection.name}</h3>
                        <div class="dropdown dropdown-end">
                            <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation()">
                                <i data-lucide="more-horizontal"></i>
                            </button>
                            <div class="dropdown-content menu shadow bg-base-100 rounded-box w-48">
                                <li><a onclick="editCollection('${collection.id}')"><i data-lucide="edit"></i> Edit</a></li>
                                <li><a onclick="refreshCollection('${collection.id}')"><i data-lucide="refresh-cw"></i> Refresh</a></li>
                                <li><a onclick="deleteCollection('${collection.id}')" class="text-error"><i data-lucide="trash-2"></i> Delete</a></li>
                            </div>
                        </div>
                    </div>
                    <p class="text-xs text-gray-500 mb-3">${collection.description || 'No description'}</p>
                    <div class="flex items-center justify-between text-xs">
                        <div class="flex gap-2">
                            <span class="badge badge-outline badge-xs">${collection.type}</span>
                            <span class="badge badge-outline badge-xs">${collection.category || 'general'}</span>
                        </div>
                        <span class="text-gray-400">${collection.itemCount || 0} items</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Reinitialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
    } catch (error) {
        console.error('Failed to render collections grid:', error);
    }
}

/**
 * Show collection detail panel
 */
export async function showCollectionDetail(collectionId) {
    try {
        const collection = await collectionsAdapter.getById(collectionId);
        if (!collection) return;
        
        const detailPanel = document.getElementById('collectionDetailPanel');
        const detailName = document.getElementById('collectionDetailName');
        const detailDescription = document.getElementById('collectionDescription');
        const detailType = document.getElementById('collectionType');
        const detailCategory = document.getElementById('collectionCategory');
        const detailItemCount = document.getElementById('collectionItemCount');
        const detailLastUpdated = document.getElementById('collectionLastUpdated');
        const itemsContainer = document.getElementById('collectionItems');
        
        if (!detailPanel) return;
        
        // Update detail panel content
        detailName.textContent = collection.name;
        detailDescription.textContent = collection.description || 'No description';
        detailType.textContent = `Type: ${collection.type}`;
        detailCategory.textContent = `Category: ${collection.category || 'general'}`;
        detailItemCount.textContent = `${collection.itemCount || 0} items`;
        detailLastUpdated.textContent = `Updated: ${new Date(collection.lastUpdated || collection.createdAt).toLocaleDateString()}`;
        
        // Store current collection ID for actions
        detailPanel.dataset.collectionId = collectionId;
        
        // Load and display collection items
        const items = await getCollectionItems(collectionId);
        itemsContainer.innerHTML = items.map(item => `
            <div class="collection-item card bg-base-200 p-3">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="badge badge-xs">${item.type}</span>
                            <h4 class="font-medium text-sm">${item.entity.title}</h4>
                        </div>
                        <p class="text-xs text-gray-500">${item.entity.content || ''}</p>
                        ${item.tags.length > 0 ? `
                            <div class="flex gap-1 mt-2">
                                ${item.tags.map(tag => `<span class="badge badge-xs" style="background-color: ${tag.color}20; color: ${tag.color}">${tag.name}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        // Show detail panel
        detailPanel.classList.remove('hidden');
        
    } catch (error) {
        console.error('Failed to show collection detail:', error);
    }
}

/**
 * Setup event listeners for collections view
 */
function setupCollectionsEventListeners() {
    const collectionsSearch = document.getElementById('collectionsSearch');
    const collectionTypeFilter = document.getElementById('collectionTypeFilter');
    const collectionCategoryFilter = document.getElementById('collectionCategoryFilter');
    
    if (collectionsSearch) {
        collectionsSearch.addEventListener('input', debounce(handleCollectionsSearch, 300));
    }
    
    if (collectionTypeFilter) {
        collectionTypeFilter.addEventListener('change', handleCollectionsFilter);
    }
    
    if (collectionCategoryFilter) {
        collectionCategoryFilter.addEventListener('change', handleCollectionsFilter);
    }
}

/**
 * Handle collections search
 */
async function handleCollectionsSearch() {
    const searchTerm = document.getElementById('collectionsSearch').value.toLowerCase();
    const collections = await collectionsAdapter.getAll();
    
    const filtered = collections.filter(collection => 
        collection.name.toLowerCase().includes(searchTerm) ||
        (collection.description && collection.description.toLowerCase().includes(searchTerm))
    );
    
    renderFilteredCollections(filtered);
}

/**
 * Handle collections filtering
 */
async function handleCollectionsFilter() {
    const typeFilter = document.getElementById('collectionTypeFilter').value;
    const categoryFilter = document.getElementById('collectionCategoryFilter').value;
    const searchTerm = document.getElementById('collectionsSearch').value.toLowerCase();
    
    let collections = await collectionsAdapter.getAll();
    
    // Apply filters
    if (typeFilter) {
        collections = collections.filter(c => c.type === typeFilter);
    }
    
    if (categoryFilter) {
        collections = collections.filter(c => c.category === categoryFilter);
    }
    
    if (searchTerm) {
        collections = collections.filter(collection => 
            collection.name.toLowerCase().includes(searchTerm) ||
            (collection.description && collection.description.toLowerCase().includes(searchTerm))
        );
    }
    
    renderFilteredCollections(collections);
}

/**
 * Render filtered collections
 */
function renderFilteredCollections(collections) {
    const collectionsGrid = document.getElementById('collectionsGrid');
    
    if (!collectionsGrid) return;
    
    if (collections.length === 0) {
        collectionsGrid.innerHTML = `
            <div class="col-span-full text-center p-8">
                <div class="text-gray-500">
                    <i data-lucide="search" class="w-12 h-12 mx-auto mb-2"></i>
                    <p>No collections match your filters</p>
                </div>
            </div>
        `;
        return;
    }
    
    collectionsGrid.innerHTML = collections.map(collection => `
        <div class="collection-card card bg-base-100 border border-base-300 hover:border-primary transition-colors cursor-pointer" 
             data-collection-id="${collection.id}" onclick="showCollectionDetail('${collection.id}')">
            <div class="card-body p-4">
                <div class="flex items-start justify-between mb-2">
                    <h3 class="card-title text-sm">${collection.name}</h3>
                    <div class="dropdown dropdown-end">
                        <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation()">
                            <i data-lucide="more-horizontal"></i>
                        </button>
                        <div class="dropdown-content menu shadow bg-base-100 rounded-box w-48">
                            <li><a onclick="editCollection('${collection.id}')"><i data-lucide="edit"></i> Edit</a></li>
                            <li><a onclick="refreshCollection('${collection.id}')"><i data-lucide="refresh-cw"></i> Refresh</a></li>
                            <li><a onclick="deleteCollection('${collection.id}')" class="text-error"><i data-lucide="trash-2"></i> Delete</a></li>
                        </div>
                    </div>
                </div>
                <p class="text-xs text-gray-500 mb-3">${collection.description || 'No description'}</p>
                <div class="flex items-center justify-between text-xs">
                    <div class="flex gap-2">
                        <span class="badge badge-outline badge-xs">${collection.type}</span>
                        <span class="badge badge-outline badge-xs">${collection.category || 'general'}</span>
                    </div>
                    <span class="text-gray-400">${collection.itemCount || 0} items</span>
                </div>
            </div>
        </div>
    `).join('');
    
    // Reinitialize Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/**
 * Close collection detail panel
 */
export function closeCollectionDetail() {
    const detailPanel = document.getElementById('collectionDetailPanel');
    if (detailPanel) {
        detailPanel.classList.add('hidden');
    }
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
        await collectionsAdapter.delete(collectionId);
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

// Make functions available globally
window.initializeCollectionsView = initializeCollectionsView;
window.renderCollectionsGrid = renderCollectionsGrid;
window.showCollectionDetail = showCollectionDetail;
window.closeCollectionDetail = closeCollectionDetail;
window.refreshCollection = refreshCollection;
window.deleteCollection = deleteCollection;