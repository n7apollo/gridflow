/**
 * GridFlow - Tags View Controller
 * Handles the tags UI interactions and data binding
 */

import { metaService } from './meta-service.js';
import { entityService } from './entity-service.js';
import { getTagsByCategory, getEntitiesWithTag, deleteTag, updateTag } from './tagging-system.js';
import { getEntityTypeIcon, renderEntity } from './entity-renderer.js';
import { CONTEXT_TYPES } from './entity-core.js';

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
 * Render tags list (updated for new layout)
 */
export async function renderTagsList() {
    try {
        const tags = await metaService.getAllTags();
        const tagsList = document.getElementById('tagsList');
        const totalTagsCount = document.getElementById('totalTagsCount');
        
        if (!tagsList) return;
        
        // Update count
        if (totalTagsCount) {
            totalTagsCount.textContent = tags.length;
        }
        
        if (tags.length === 0) {
            tagsList.innerHTML = `
                <li class="list-row">
                    <div class="text-center py-8">
                        <div class="text-base-content/60">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tag mx-auto mb-4"><path d="M12 2H2v10l9.293 9.293a1 1 0 0 0 1.414 0l8.586-8.586a1 1 0 0 0 0-1.414z"/><circle cx="7" cy="7" r="1"/></svg>
                            <p class="text-lg mb-2">No tags found</p>
                            <p class="text-sm mb-4">Create your first tag to organize and categorize content</p>
                            <button class="btn btn-primary" onclick="showCreateTagModal()">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                                Add Tag
                            </button>
                        </div>
                    </div>
                </li>
            `;
            return;
        }
        
        // Sort tags by usage count (descending)
        tags.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        
        tagsList.innerHTML = tags.map(tag => renderTagListItem(tag)).join('');
        
        // Reinitialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
    } catch (error) {
        console.error('Failed to render tags list:', error);
    }
}

/**
 * Render tags grid (backward compatibility)
 */
export async function renderTagsGrid() {
    return await renderTagsList();
}

/**
 * Render a single tag list item
 * @param {Object} tag - Tag object
 * @returns {string} HTML for tag list item
 */
function renderTagListItem(tag) {
    const usageCount = tag.usageCount || 0;
    const createdDate = new Date(tag.createdAt);
    const daysSince = Math.floor((Date.now() - createdDate) / (1000 * 60 * 60 * 24));
    
    return `
        <li class="list-row" onclick="showTagDetail('${tag.id}')">
            <div class="flex items-center gap-4 p-4 hover:bg-base-200 transition-colors cursor-pointer">
                <!-- Color Indicator -->
                <div class="avatar placeholder">
                    <div class="rounded-full w-12 h-12 flex items-center justify-center" style="background-color: ${tag.color}20; border: 2px solid ${tag.color}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${tag.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tag"><path d="M12 2H2v10l9.293 9.293a1 1 0 0 0 1.414 0l8.586-8.586a1 1 0 0 0 0-1.414z"/><circle cx="7" cy="7" r="1"/></svg>
                    </div>
                </div>
                
                <!-- Main Content -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <h3 class="font-semibold text-base truncate">${tag.name}</h3>
                        <span class="badge badge-outline badge-sm">${tag.category || 'general'}</span>
                        ${usageCount > 0 ? `
                            <span class="badge badge-info badge-sm">${usageCount} uses</span>
                        ` : ''}
                    </div>
                    <div class="text-sm text-base-content/70 mb-1">
                        ${tag.description || 'No description provided'}
                    </div>
                    <div class="text-xs text-base-content/60">
                        Created: ${daysSince === 0 ? 'Today' : 
                                 daysSince === 1 ? '1 day ago' : 
                                 `${daysSince} days ago`}
                    </div>
                </div>
                
                <!-- Usage Stats -->
                <div class="hidden sm:block text-right text-sm text-base-content/60">
                    <div class="font-medium">${usageCount}</div>
                    <div class="text-xs">uses</div>
                </div>
                
                <!-- Action Arrow -->
                <div class="tag-actions opacity-0 transition-opacity group-hover:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
                </div>
            </div>
        </li>
    `;
}

/**
 * Show tag detail view
 */
export async function showTagDetail(tagId) {
    try {
        const tag = await metaService.getTag(tagId);
        if (!tag) return;
        
        // Hide list view and show detail view
        const listView = document.getElementById('tagsListView');
        const detailView = document.getElementById('tagDetailView');
        
        if (!listView || !detailView) return;
        
        listView.classList.add('hidden');
        detailView.classList.remove('hidden');
        
        // Update tag info
        const nameElement = document.getElementById('tagDetailName');
        const subtitleElement = document.getElementById('tagDetailSubtitle');
        
        if (nameElement) nameElement.textContent = tag.name;
        if (subtitleElement) {
            subtitleElement.textContent = tag.description || `${tag.category || 'general'} tag`;
        }
        
        // Update tag details
        const categoryElement = document.getElementById('tagCategory');
        const usageCountElement = document.getElementById('tagUsageCount');
        const createdAtElement = document.getElementById('tagCreatedAt');
        const colorElement = document.getElementById('tagDetailColor');
        
        if (categoryElement) {
            categoryElement.innerHTML = tag.category ? 
                `<strong>Category:</strong> <span class="badge badge-outline">${tag.category}</span>` : 
                '<span class="text-base-content/50">No category</span>';
        }
        if (usageCountElement) {
            usageCountElement.innerHTML = `<strong>Usage:</strong> ${tag.usageCount || 0} items`;
        }
        
        const createdDate = new Date(tag.createdAt);
        const daysSince = Math.floor((Date.now() - createdDate) / (1000 * 60 * 60 * 24));
        if (createdAtElement) {
            createdAtElement.innerHTML = 
                `<strong>Created:</strong> ${daysSince === 0 ? 'Today' : daysSince === 1 ? '1 day ago' : `${daysSince} days ago`}`;
        }
        if (colorElement) {
            colorElement.innerHTML = `<strong>Color:</strong> <span class="inline-block w-4 h-4 rounded-full" style="background-color: ${tag.color}"></span> ${tag.color}`;
        }
        
        // Update stats
        const totalUsageElement = document.getElementById('totalUsage');
        const createdStatElement = document.getElementById('createdStat');
        
        if (totalUsageElement) {
            totalUsageElement.textContent = tag.usageCount || 0;
        }
        if (createdStatElement) {
            createdStatElement.textContent = daysSince === 0 ? 'Today' : 
                                           daysSince === 1 ? '1 day ago' : 
                                           `${daysSince} days ago`;
        }
        
        // Store current tag ID for actions
        detailView.dataset.tagId = tagId;
        
        // Load and display tagged entities
        await renderTaggedEntities(tagId);
        
    } catch (error) {
        console.error('Failed to show tag detail:', error);
    }
}

/**
 * Render tagged entities
 * @param {string} tagId - Tag ID
 */
async function renderTaggedEntities(tagId) {
    const entitiesContainer = document.getElementById('taggedEntities');
    if (!entitiesContainer) return;
    
    try {
        const entityRefs = await getEntitiesWithTag(tagId);
        const entities = [];
        
        for (const ref of entityRefs) {
            const entity = await entityService.getById(ref.id);
            if (entity) {
                entities.push({ type: entity.type, entity: entity });
            }
        }
        
        // Clear container
        entitiesContainer.innerHTML = '';
        
        if (entities.length === 0) {
            entitiesContainer.innerHTML = `
                <div class="text-center py-4 text-base-content/60">
                    <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2"></i>
                    <p>No items tagged with this tag yet</p>
                    <p class="text-xs">Items with this tag will appear here</p>
                </div>
            `;
        } else {
            // Render each entity using the unified entity renderer
            for (const item of entities) {
                // Add tag context to item
                const tag = await metaService.getTagById(tagId);
                item.tagName = tag?.name || '';
                item.tagId = tagId;
                const itemElement = await renderTaggedEntity(item);
                if (itemElement) {
                    entitiesContainer.appendChild(itemElement);
                }
            }
        }
        
        // Re-render Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    } catch (error) {
        console.error('Failed to render tagged entities:', error);
        entitiesContainer.innerHTML = `
            <div class="alert alert-error">
                <span>Failed to load tagged items</span>
            </div>
        `;
    }
}

/**
 * Render a tagged entity using unified entity renderer
 * @param {Object} item - Tagged entity item
 * @returns {Promise<HTMLElement>} Tagged entity element
 */
async function renderTaggedEntity(item) {
    // Use the unified entity renderer for tag context
    const contextData = {
        tagName: item.tagName, // Will be passed from the calling function
        tagId: item.tagId
    };
    
    return await renderEntity(item.entity.id, CONTEXT_TYPES.TAG, contextData);
}

/**
 * Setup event listeners for tags view
 */
function setupTagsEventListeners() {
    // Search input
    const searchInput = document.getElementById('tagsSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            handleTagsSearch(e.target.value);
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
    const filterButtons = document.querySelectorAll('.tags-filter-menu');
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            const filter = button.getAttribute('data-filter');
            handleTagsFilter(filter);
        });
    });
    
    // Set default active filter
    const allFilter = document.querySelector('.tags-filter-menu[data-filter="all"]');
    if (allFilter) {
        allFilter.classList.add('active');
    }
}

/**
 * Handle tags search
 */
async function handleTagsSearch(searchTerm = '') {
    const tags = await metaService.getAllTags();
    
    if (!searchTerm) {
        renderFilteredTags(tags);
        return;
    }
    
    const filtered = tags.filter(tag => 
        tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tag.description && tag.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    renderFilteredTags(filtered);
}

/**
 * Handle tags filtering
 */
async function handleTagsFilter(filter = 'all') {
    let tags = await metaService.getAllTags();
    
    // Apply filter
    if (filter !== 'all') {
        if (['priority', 'status', 'project', 'context'].includes(filter)) {
            tags = tags.filter(tag => tag.category === filter);
        } else if (filter === 'popular') {
            tags = tags.filter(tag => (tag.usageCount || 0) > 5);
        } else if (filter === 'recent') {
            const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            tags = tags.filter(tag => new Date(tag.createdAt) > weekAgo);
        }
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
    
    let tags = await metaService.getAllTags();
    
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
    const tagsList = document.getElementById('tagsList');
    const totalTagsCount = document.getElementById('totalTagsCount');
    
    if (!tagsList) return;
    
    // Update count
    if (totalTagsCount) {
        totalTagsCount.textContent = tags.length;
    }
    
    if (tags.length === 0) {
        tagsList.innerHTML = `
            <li class="list-row">
                <div class="text-center py-8">
                    <div class="text-base-content/60">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search mx-auto mb-2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                        <p>No tags match your filters</p>
                    </div>
                </div>
            </li>
        `;
        return;
    }
    
    // Sort tags by usage count (descending)
    tags.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    
    tagsList.innerHTML = tags.map(tag => renderTagListItem(tag)).join('');
    
    // Reinitialize Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/**
 * Show tags list view (go back from detail)
 */
function showTagsList() {
    const listView = document.getElementById('tagsListView');
    const detailView = document.getElementById('tagDetailView');
    
    if (listView && detailView) {
        detailView.classList.add('hidden');
        listView.classList.remove('hidden');
    }
}

/**
 * Close tag detail panel (backward compatibility)
 */
export function closeTagDetail() {
    showTagsList();
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

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

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
 * Export tags data
 */
window.exportTags = async function() {
    try {
        const allTags = await metaService.getAllTags();
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            tags: allTags
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gridflow-tags-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (window.showStatusMessage) {
            window.showStatusMessage(`Exported ${allTags.length} tags`, 'success');
        }
    } catch (error) {
        console.error('Failed to export tags:', error);
        if (window.showStatusMessage) {
            window.showStatusMessage('Failed to export tags', 'error');
        }
    }
};

/**
 * Import tags data
 */
window.importTags = async function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (!data.tags || !Array.isArray(data.tags)) {
                throw new Error('Invalid tags data format');
            }
            
            let imported = 0;
            for (const tagData of data.tags) {
                try {
                    // Remove ID to create new tag
                    const { id, ...tagWithoutId } = tagData;
                    await metaService.createTag(tagWithoutId);
                    imported++;
                } catch (error) {
                    console.error('Failed to import tag:', tagData.name, error);
                }
            }
            
            if (window.showStatusMessage) {
                window.showStatusMessage(`Imported ${imported} of ${data.tags.length} tags`, 'success');
            }
            
            // Refresh the tags list
            await renderTagsList();
            
        } catch (error) {
            console.error('Failed to import tags:', error);
            if (window.showStatusMessage) {
                window.showStatusMessage('Failed to import tags', 'error');
            }
        }
    };
    
    input.click();
};

/**
 * Show tags list
 */
window.showTagsList = showTagsList;

/**
 * Show tag detail
 */
window.showTagDetail = showTagDetail;

// Make functions available globally
window.initializeTagsView = initializeTagsView;
window.renderTagsGrid = renderTagsGrid;
window.renderTagsList = renderTagsList;
window.closeTagDetail = closeTagDetail;
window.deleteTagFromView = deleteTagFromView;