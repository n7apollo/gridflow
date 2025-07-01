/**
 * GridFlow - Tags View Controller
 * Handles the tags UI interactions and data binding
 */

import { tagsAdapter, relationshipAdapter } from './indexeddb/adapters.js';
import { getTagsByCategory, getEntitiesWithTag, deleteTag, updateTag } from './tagging-system.js';

/**
 * Initialize tags view
 */
export async function initializeTagsView() {
    try {
        await renderTagsGrid();
        setupTagsEventListeners();
    } catch (error) {
        console.error('Failed to initialize tags view:', error);
    }
}

/**
 * Render tags grid
 */
export async function renderTagsGrid() {
    try {
        const tags = await tagsAdapter.getAll();
        const tagsGrid = document.getElementById('tagsGrid');
        
        if (!tagsGrid) return;
        
        if (tags.length === 0) {
            tagsGrid.innerHTML = `
                <div class="col-span-full text-center p-8">
                    <div class="text-gray-500 mb-4">
                        <i data-lucide="tag" class="w-16 h-16 mx-auto mb-2"></i>
                        <p>No tags found</p>
                    </div>
                    <button class="btn btn-primary" data-action="showCreateTagModal">
                        <i data-lucide="plus"></i> Create Your First Tag
                    </button>
                </div>
            `;
            return;
        }
        
        // Sort tags by usage count (descending)
        tags.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        
        tagsGrid.innerHTML = tags.map(tag => `
            <div class="tag-card card bg-base-100 border border-base-300 hover:border-primary transition-colors cursor-pointer" 
                 data-tag-id="${tag.id}" onclick="showTagDetail('${tag.id}')">
                <div class="card-body p-4">
                    <div class="flex items-start justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 rounded-full" style="background-color: ${tag.color}"></div>
                            <h3 class="card-title text-sm">${tag.name}</h3>
                        </div>
                        <div class="dropdown dropdown-end">
                            <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation()">
                                <i data-lucide="more-horizontal"></i>
                            </button>
                            <div class="dropdown-content menu shadow bg-base-100 rounded-box w-48">
                                <li><a onclick="editTag('${tag.id}')"><i data-lucide="edit"></i> Edit</a></li>
                                <li><a onclick="deleteTag('${tag.id}')" class="text-error"><i data-lucide="trash-2"></i> Delete</a></li>
                            </div>
                        </div>
                    </div>
                    <p class="text-xs text-gray-500 mb-3">${tag.description || 'No description'}</p>
                    <div class="flex items-center justify-between text-xs">
                        <span class="badge badge-outline badge-xs">${tag.category || 'general'}</span>
                        <span class="text-gray-400">${tag.usageCount || 0} uses</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Reinitialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
    } catch (error) {
        console.error('Failed to render tags grid:', error);
    }
}

/**
 * Show tag detail panel
 */
export async function showTagDetail(tagId) {
    try {
        const tag = await tagsAdapter.getById(tagId);
        if (!tag) return;
        
        const detailPanel = document.getElementById('tagDetailPanel');
        const detailName = document.getElementById('tagDetailName');
        const detailDescription = document.getElementById('tagDescription');
        const detailCategory = document.getElementById('tagCategory');
        const detailUsageCount = document.getElementById('tagUsageCount');
        const detailCreatedAt = document.getElementById('tagCreatedAt');
        const detailColorIndicator = document.getElementById('tagDetailColorIndicator');
        const entitiesContainer = document.getElementById('taggedEntities');
        
        if (!detailPanel) return;
        
        // Update detail panel content
        detailName.textContent = tag.name;
        detailDescription.textContent = tag.description || 'No description';
        detailCategory.textContent = `Category: ${tag.category || 'general'}`;
        detailUsageCount.textContent = `${tag.usageCount || 0} uses`;
        detailCreatedAt.textContent = `Created: ${new Date(tag.createdAt).toLocaleDateString()}`;
        detailColorIndicator.style.backgroundColor = tag.color;
        
        // Store current tag ID for actions
        detailPanel.dataset.tagId = tagId;
        
        // Load and display tagged entities
        const entityRefs = await getEntitiesWithTag(tagId);
        const entities = [];
        
        for (const ref of entityRefs) {
            const entity = await window.adapters.entity.getById(ref.id);
            if (entity) {
                entities.push({ type: entity.type, entity: entity });
            }
        }
        
        entitiesContainer.innerHTML = entities.map(item => `
            <div class="tagged-entity card bg-base-200 p-3">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="badge badge-xs">${item.type}</span>
                            <h4 class="font-medium text-sm">${item.entity.title}</h4>
                        </div>
                        <p class="text-xs text-gray-500">${item.entity.content || ''}</p>
                        <div class="flex items-center gap-2 mt-2 text-xs text-gray-400">
                            ${item.entity.priority ? `<span class="badge badge-xs badge-${item.entity.priority}">${item.entity.priority}</span>` : ''}
                            ${item.entity.completed ? '<span class="badge badge-xs badge-success">completed</span>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        if (entities.length === 0) {
            entitiesContainer.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2"></i>
                    <p>No items tagged with this tag</p>
                </div>
            `;
        }
        
        // Show detail panel
        detailPanel.classList.remove('hidden');
        
        // Reinitialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
    } catch (error) {
        console.error('Failed to show tag detail:', error);
    }
}

/**
 * Setup event listeners for tags view
 */
function setupTagsEventListeners() {
    const tagsSearch = document.getElementById('tagsSearch');
    const tagCategoryFilter = document.getElementById('tagCategoryFilter');
    const tagSortBy = document.getElementById('tagSortBy');
    
    if (tagsSearch) {
        tagsSearch.addEventListener('input', debounce(handleTagsSearch, 300));
    }
    
    if (tagCategoryFilter) {
        tagCategoryFilter.addEventListener('change', handleTagsFilter);
    }
    
    if (tagSortBy) {
        tagSortBy.addEventListener('change', handleTagsSort);
    }
}

/**
 * Handle tags search
 */
async function handleTagsSearch() {
    const searchTerm = document.getElementById('tagsSearch').value.toLowerCase();
    const tags = await tagsAdapter.getAll();
    
    const filtered = tags.filter(tag => 
        tag.name.toLowerCase().includes(searchTerm) ||
        (tag.description && tag.description.toLowerCase().includes(searchTerm))
    );
    
    renderFilteredTags(filtered);
}

/**
 * Handle tags filtering
 */
async function handleTagsFilter() {
    const categoryFilter = document.getElementById('tagCategoryFilter').value;
    const searchTerm = document.getElementById('tagsSearch').value.toLowerCase();
    
    let tags = await tagsAdapter.getAll();
    
    // Apply filters
    if (categoryFilter) {
        tags = tags.filter(tag => tag.category === categoryFilter);
    }
    
    if (searchTerm) {
        tags = tags.filter(tag => 
            tag.name.toLowerCase().includes(searchTerm) ||
            (tag.description && tag.description.toLowerCase().includes(searchTerm))
        );
    }
    
    renderFilteredTags(tags);
}

/**
 * Handle tags sorting
 */
async function handleTagsSort() {
    const sortBy = document.getElementById('tagSortBy').value;
    const categoryFilter = document.getElementById('tagCategoryFilter').value;
    const searchTerm = document.getElementById('tagsSearch').value.toLowerCase();
    
    let tags = await tagsAdapter.getAll();
    
    // Apply filters first
    if (categoryFilter) {
        tags = tags.filter(tag => tag.category === categoryFilter);
    }
    
    if (searchTerm) {
        tags = tags.filter(tag => 
            tag.name.toLowerCase().includes(searchTerm) ||
            (tag.description && tag.description.toLowerCase().includes(searchTerm))
        );
    }
    
    // Apply sorting
    switch (sortBy) {
        case 'usage':
            tags.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
            break;
        case 'name':
            tags.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'created':
            tags.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'updated':
            tags.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
            break;
    }
    
    renderFilteredTags(tags);
}

/**
 * Render filtered tags
 */
function renderFilteredTags(tags) {
    const tagsGrid = document.getElementById('tagsGrid');
    
    if (!tagsGrid) return;
    
    if (tags.length === 0) {
        tagsGrid.innerHTML = `
            <div class="col-span-full text-center p-8">
                <div class="text-gray-500">
                    <i data-lucide="search" class="w-12 h-12 mx-auto mb-2"></i>
                    <p>No tags match your filters</p>
                </div>
            </div>
        `;
        return;
    }
    
    tagsGrid.innerHTML = tags.map(tag => `
        <div class="tag-card card bg-base-100 border border-base-300 hover:border-primary transition-colors cursor-pointer" 
             data-tag-id="${tag.id}" onclick="showTagDetail('${tag.id}')">
            <div class="card-body p-4">
                <div class="flex items-start justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full" style="background-color: ${tag.color}"></div>
                        <h3 class="card-title text-sm">${tag.name}</h3>
                    </div>
                    <div class="dropdown dropdown-end">
                        <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation()">
                            <i data-lucide="more-horizontal"></i>
                        </button>
                        <div class="dropdown-content menu shadow bg-base-100 rounded-box w-48">
                            <li><a onclick="editTag('${tag.id}')"><i data-lucide="edit"></i> Edit</a></li>
                            <li><a onclick="deleteTag('${tag.id}')" class="text-error"><i data-lucide="trash-2"></i> Delete</a></li>
                        </div>
                    </div>
                </div>
                <p class="text-xs text-gray-500 mb-3">${tag.description || 'No description'}</p>
                <div class="flex items-center justify-between text-xs">
                    <span class="badge badge-outline badge-xs">${tag.category || 'general'}</span>
                    <span class="text-gray-400">${tag.usageCount || 0} uses</span>
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
 * Close tag detail panel
 */
export function closeTagDetail() {
    const detailPanel = document.getElementById('tagDetailPanel');
    if (detailPanel) {
        detailPanel.classList.add('hidden');
    }
}

/**
 * Delete a tag
 */
export async function deleteTagFromView(tagId) {
    if (!confirm('Are you sure you want to delete this tag? It will be removed from all tagged items.')) {
        return;
    }
    
    try {
        await deleteTag(tagId);
        await renderTagsGrid();
        closeTagDetail();
    } catch (error) {
        console.error('Failed to delete tag:', error);
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
window.initializeTagsView = initializeTagsView;
window.renderTagsGrid = renderTagsGrid;
window.showTagDetail = showTagDetail;
window.closeTagDetail = closeTagDetail;
window.deleteTagFromView = deleteTagFromView;