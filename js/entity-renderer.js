/**
 * GridFlow - Unified Entity Renderer
 * 
 * This module handles rendering entities in different contexts (board cards, 
 * weekly items, task list items) while maintaining consistent behavior and
 * appearance based on entity type.
 */

import { getEntity, updateEntity, toggleEntityCompletion, removeEntityFromContext, ENTITY_TYPES, CONTEXT_TYPES } from './entity-core.js';
import { showStatusMessage } from './utilities.js';
import { db } from './db.js';

// Global variable to track entity being edited
let currentEditingEntity = null;

/**
 * Render an entity in a specific context
 * @param {string} entityId - Entity ID
 * @param {string} contextType - Context type (board, weekly, task_list)
 * @param {Object} contextData - Context-specific data
 * @returns {Promise<HTMLElement|null>} Rendered element
 */
export async function renderEntity(entityId, contextType, contextData = {}) {
    const entity = await getEntity(entityId);
    if (!entity) {
        console.warn('Entity not found for rendering:', entityId);
        return null;
    }
    
    console.log('Rendering entity:', entityId, 'in context:', contextType, entity);
    
    switch (contextType) {
        case CONTEXT_TYPES.BOARD:
            return renderEntityAsCard(entity, contextData);
            
        case CONTEXT_TYPES.WEEKLY:
            return renderEntityAsWeeklyItem(entity, contextData);
            
        case CONTEXT_TYPES.TASK_LIST:
            return renderEntityAsTaskItem(entity, contextData);
            
        case CONTEXT_TYPES.COLLECTION:
            return renderEntityAsCollectionItem(entity, contextData);
            
        case CONTEXT_TYPES.TAG:
            return renderEntityAsTagItem(entity, contextData);
            
        case CONTEXT_TYPES.PEOPLE:
            return renderEntityAsPeopleItem(entity, contextData);
            
        default:
            console.warn('Unknown context type for rendering:', contextType);
            return null;
    }
}

/**
 * Render entity as a board card
 * @param {Object} entity - Entity object
 * @param {Object} contextData - Board context data
 * @returns {HTMLElement} Card element
 */
function renderEntityAsCard(entity, contextData = {}) {
    const cardElement = document.createElement('div');
    cardElement.className = `card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow cursor-pointer ${entity.completed ? 'opacity-75' : ''}`;
    cardElement.dataset.entityId = entity.id;
    // SortableJS will handle draggable property
    
    // Build card content based on entity type
    let cardContent = '';
    
    // Card body with DaisyUI classes
    cardContent += `
        <div class="card-body p-4">
            <!-- Card Header -->
            <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2">
                    <span class="text-lg">${getEntityTypeIcon(entity.type, true)}</span>
                    ${entity.completed ? '<span class="badge badge-success badge-sm">✓</span>' : ''}
                    <div class="cross-context-indicators" id="crossContext${entity.id}">
                        <!-- Cross-context indicators will be added here -->
                    </div>
                </div>
                <span class="badge badge-outline badge-sm">${entity.type}</span>
            </div>
            
            <!-- Card Title -->
            <h3 class="card-title text-base font-semibold text-base-content mb-2 line-clamp-2">
                ${entity.title || 'Untitled'}
            </h3>
    `;
    
    // Type-specific content
    switch (entity.type) {
        case ENTITY_TYPES.TASK:
            cardContent += renderTaskCardContent(entity);
            break;
            
        case ENTITY_TYPES.NOTE:
            cardContent += renderNoteCardContent(entity);
            break;
            
        case ENTITY_TYPES.CHECKLIST:
            cardContent += renderChecklistCardContent(entity);
            break;
            
        case ENTITY_TYPES.PROJECT:
            cardContent += renderProjectCardContent(entity);
            break;
            
        default:
            if (entity.content) {
                cardContent += `<p class="text-sm text-base-content/70 line-clamp-3">${entity.content}</p>`;
            }
    }
    
    // Card actions
    cardContent += `
            <div class="card-actions justify-end mt-3 pt-2 border-t border-base-300">
                <button class="btn btn-xs btn-outline" onclick="event.stopPropagation(); entityRenderer.editEntity('${entity.id}')">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Edit
                </button>
                <button class="btn btn-xs ${entity.completed ? 'btn-warning' : 'btn-success'}" 
                        onclick="event.stopPropagation(); entityRenderer.toggleCompletion('${entity.id}')">
                    ${entity.completed ? 'Undo' : 'Done'}
                </button>
            </div>
        </div>
    `;
    
    cardElement.innerHTML = cardContent;
    
    // Add event listeners
    setupCardEventListeners(cardElement, entity);
    
    // Load cross-context indicators asynchronously
    loadCrossContextIndicators(entity.id);
    
    return cardElement;
}

/**
 * Render entity as a weekly planning item
 * @param {Object} entity - Entity object
 * @param {Object} contextData - Weekly context data
 * @returns {HTMLElement} Weekly item element
 */
function renderEntityAsWeeklyItem(entity, contextData) {
    const itemElement = document.createElement('div');
    itemElement.className = `card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow p-3 ${entity.completed ? 'opacity-60' : ''}`;
    itemElement.dataset.entityId = entity.id;
    
    // Add context data attributes
    if (contextData.weekKey) itemElement.dataset.weekKey = contextData.weekKey;
    if (contextData.day) itemElement.dataset.day = contextData.day;
    if (contextData.weeklyItemId) itemElement.dataset.weeklyItemId = contextData.weeklyItemId;
    
    let itemContent = '';
    
    // Different rendering based on entity type
    switch (entity.type) {
        case ENTITY_TYPES.TASK:
            const priorityColor = entity.priority === 'high' ? 'badge-error' : 
                                entity.priority === 'low' ? 'badge-info' : 'badge-neutral';
            
            // Check if this is a subtask
            const isSubtask = entity.parentEntityId;
            
            itemContent = `
                <div class="flex items-start gap-3">
                    ${isSubtask ? `
                        <!-- Subtask indicator -->
                        <div class="flex-shrink-0 mt-1">
                            <i data-lucide="corner-down-right" class="w-3 h-3 text-base-content/40"></i>
                        </div>
                    ` : ''}
                    <input type="checkbox" class="checkbox checkbox-sm mt-1" ${entity.completed ? 'checked' : ''} 
                           onchange="entityRenderer.toggleCompletion('${entity.id}')">
                    <div class="flex-1 min-w-0">
                        ${isSubtask ? `
                            <!-- Parent task context for subtasks -->
                            <div class="subtask-parent-context text-xs text-base-content/50 mb-1" id="parent-context-${entity.id}">
                                <i data-lucide="link" class="w-3 h-3 inline mr-1"></i>
                                <span>Loading parent...</span>
                            </div>
                        ` : ''}
                        <div class="font-medium text-sm mb-1 ${entity.completed ? 'line-through text-base-content/60' : ''}">${entity.title}</div>
                        <div class="flex flex-wrap gap-2 mb-2">
                            ${entity.priority !== 'medium' ? `<div class="badge ${priorityColor} badge-xs">${entity.priority}</div>` : ''}
                            ${entity.dueDate ? `<div class="badge badge-outline badge-xs">Due: ${formatDate(entity.dueDate)}</div>` : ''}
                            ${isSubtask ? '<div class="badge badge-ghost badge-xs">subtask</div>' : ''}
                        </div>
                        ${entity.content ? `<div class="text-xs text-base-content/70 ${entity.completed ? 'line-through' : ''}">${entity.content}</div>` : ''}
                    </div>
                    <div class="dropdown dropdown-end">
                        <label tabindex="0" class="btn btn-ghost btn-xs btn-circle">
                            <i data-lucide="more-horizontal" class="w-3 h-3"></i>
                        </label>
                        <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-32 text-sm">
                            <li><a onclick="entityRenderer.editEntity('${entity.id}')">Edit</a></li>
                            ${!isSubtask ? `<li><a onclick="entityRenderer.addSubtaskToWeekly('${entity.id}', '${contextData.weekKey}', '${contextData.day}')">Add Subtask</a></li>` : ''}
                            <li><a onclick="entityRenderer.removeFromWeekly('${entity.id}', '${contextData.weekKey}')">Remove</a></li>
                        </ul>
                    </div>
                </div>
            `;
            break;
            
        case ENTITY_TYPES.NOTE:
            itemContent = `
                <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 mt-1">
                        <i data-lucide="file-text" class="w-4 h-4 text-info"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-sm mb-1">${entity.title}</div>
                        ${entity.content ? `<div class="text-xs text-base-content/70 mt-1">${entity.content}</div>` : ''}
                    </div>
                    <div class="dropdown dropdown-end">
                        <label tabindex="0" class="btn btn-ghost btn-xs btn-circle">
                            <i data-lucide="more-horizontal" class="w-3 h-3"></i>
                        </label>
                        <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-32 text-sm">
                            <li><a onclick="entityRenderer.editEntity('${entity.id}')">Edit</a></li>
                            <li><a onclick="entityRenderer.removeFromWeekly('${entity.id}', '${contextData.weekKey}')">Remove</a></li>
                        </ul>
                    </div>
                </div>
            `;
            break;
            
        case ENTITY_TYPES.CHECKLIST:
            const completedCount = entity.items ? entity.items.filter(item => item.completed).length : 0;
            const totalCount = entity.items ? entity.items.length : 0;
            const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
            
            itemContent = `
                <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 mt-1">
                        <i data-lucide="check-square" class="w-4 h-4 text-warning"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-sm mb-2">${entity.title}</div>
                        <div class="flex items-center gap-2 mb-2">
                            <div class="progress progress-primary w-20 h-2">
                                <div class="progress-bar" style="width: ${progressPercent}%"></div>
                            </div>
                            <span class="text-xs text-base-content/60">${completedCount}/${totalCount}</span>
                        </div>
                        ${entity.content ? `<div class="text-xs text-base-content/70">${entity.content}</div>` : ''}
                    </div>
                    <div class="dropdown dropdown-end">
                        <label tabindex="0" class="btn btn-ghost btn-xs btn-circle">
                            <i data-lucide="more-horizontal" class="w-3 h-3"></i>
                        </label>
                        <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-32 text-sm">
                            <li><a onclick="entityRenderer.editEntity('${entity.id}')">Edit</a></li>
                            <li><a onclick="entityRenderer.removeFromWeekly('${entity.id}', '${contextData.weekKey}')">Remove</a></li>
                        </ul>
                    </div>
                </div>
            `;
            break;
            
        default:
            itemContent = `
                <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 mt-1">
                        <i data-lucide="file" class="w-4 h-4 text-base-content/60"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-sm mb-1">${entity.title}</div>
                        ${entity.content ? `<div class="text-xs text-base-content/70">${entity.content}</div>` : ''}
                    </div>
                    <div class="dropdown dropdown-end">
                        <label tabindex="0" class="btn btn-ghost btn-xs btn-circle">
                            <i data-lucide="more-horizontal" class="w-3 h-3"></i>
                        </label>
                        <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-32 text-sm">
                            <li><a onclick="entityRenderer.editEntity('${entity.id}')">Edit</a></li>
                            <li><a onclick="entityRenderer.removeFromWeekly('${entity.id}', '${contextData.weekKey}')">Remove</a></li>
                        </ul>
                    </div>
                </div>
            `;
    }
    
    itemElement.innerHTML = itemContent;
    
    // Load parent context asynchronously for subtasks
    if (entity.type === ENTITY_TYPES.TASK && entity.parentEntityId) {
        loadParentContextAsync(entity.parentEntityId, entity.id);
    }
    
    // Render Lucide icons
    if (window.lucide) {
        window.lucide.createIcons({ attrs: { class: 'lucide' } });
    }
    
    return itemElement;
}

/**
 * Load parent context asynchronously for subtasks
 * @param {string} parentEntityId - Parent entity ID
 * @param {string} subtaskEntityId - Subtask entity ID
 */
async function loadParentContextAsync(parentEntityId, subtaskEntityId) {
    try {
        const parentEntity = await getEntity(parentEntityId);
        const contextElement = document.getElementById(`parent-context-${subtaskEntityId}`);
        
        if (parentEntity && contextElement) {
            contextElement.innerHTML = `
                <i data-lucide="link" class="w-3 h-3 inline mr-1"></i>
                <span>Subtask of: <strong>${parentEntity.title}</strong></span>
            `;
            
            // Re-render icons
            if (window.lucide) {
                window.lucide.createIcons({ attrs: { class: 'lucide' } });
            }
        }
    } catch (error) {
        console.error('Failed to load parent context:', error);
        const contextElement = document.getElementById(`parent-context-${subtaskEntityId}`);
        if (contextElement) {
            contextElement.innerHTML = `
                <i data-lucide="alert-circle" class="w-3 h-3 inline mr-1"></i>
                <span class="text-error">Failed to load parent</span>
            `;
        }
    }
}

/**
 * Render entity as a task list item
 * @param {Object} entity - Entity object
 * @param {Object} contextData - Task list context data
 * @returns {HTMLElement} Task list item element
 */
function renderEntityAsTaskItem(entity, contextData = {}) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item ${entity.type}-task ${entity.completed ? 'completed' : ''}`;
    taskElement.dataset.entityId = entity.id;
    
    const taskContent = `
        <div class="task-item-content">
            <div class="task-checkbox">
                <input type="checkbox" ${entity.completed ? 'checked' : ''} 
                       onchange="entityRenderer.toggleCompletion('${entity.id}')">
            </div>
            <div class="task-details">
                <div class="task-title">${entity.title}</div>
                ${entity.content ? `<div class="task-description">${entity.content}</div>` : ''}
                <div class="task-meta">
                    <span class="entity-type">${entity.type}</span>
                    ${entity.priority ? `<span class="priority priority-${entity.priority}">${entity.priority}</span>` : ''}
                    ${entity.dueDate ? `<span class="due-date">Due: ${formatDate(entity.dueDate)}</span>` : ''}
                    ${entity.tags.length > 0 ? `<span class="tags">${entity.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</span>` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="btn btn-small" onclick="entityRenderer.editEntity('${entity.id}')">Edit</button>
            </div>
        </div>
    `;
    
    taskElement.innerHTML = taskContent;
    return taskElement;
}

/**
 * Render entity as a collection item
 * @param {Object} entity - Entity object
 * @param {Object} contextData - Collection context data
 * @returns {HTMLElement} Collection item element
 */
function renderEntityAsCollectionItem(entity, contextData = {}) {
    const itemElement = document.createElement('div');
    itemElement.className = `collection-item border-l-2 border-${getEntityTypeColor(entity.type)} pl-4 pb-4 hover:bg-base-200 rounded-r cursor-pointer`;
    itemElement.dataset.entityId = entity.id;
    itemElement.onclick = () => openEntity(entity.id);
    
    // Add context data attributes
    if (contextData.collectionId) itemElement.dataset.collectionId = contextData.collectionId;
    
    const itemContent = `
        <div class="flex items-start gap-3">
            <div class="flex-shrink-0 w-8 h-8 bg-${getEntityTypeColor(entity.type)} text-white rounded-full flex items-center justify-center text-sm">
                ${getEntityTypeIcon(entity.type, true)}
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                    <h4 class="font-medium text-sm truncate">${entity.title || 'Untitled'}</h4>
                    <span class="badge badge-outline badge-xs">${entity.type}</span>
                </div>
                ${entity.content ? `<p class="text-xs text-base-content/60 line-clamp-2 mb-2">${entity.content}</p>` : ''}
                <div class="flex items-center gap-2 text-xs text-base-content/50">
                    ${entity.completed ? '<span class="badge badge-success badge-xs">✓ Completed</span>' : ''}
                    ${entity.priority && entity.priority !== 'medium' ? `<span class="badge badge-outline badge-xs">${entity.priority}</span>` : ''}
                    ${entity.dueDate ? `<span class="badge badge-outline badge-xs">Due: ${formatDate(entity.dueDate)}</span>` : ''}
                </div>
            </div>
            <div class="dropdown dropdown-end">
                <label tabindex="0" class="btn btn-ghost btn-xs btn-circle">
                    <i data-lucide="more-horizontal" class="w-3 h-3"></i>
                </label>
                <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-32 text-sm">
                    <li><a onclick="event.stopPropagation(); entityRenderer.editEntity('${entity.id}')">Edit</a></li>
                    <li><a onclick="event.stopPropagation(); removeFromCollection('${entity.id}', '${contextData.collectionId}')">Remove</a></li>
                </ul>
            </div>
        </div>
    `;
    
    itemElement.innerHTML = itemContent;
    
    // Render Lucide icons
    if (window.lucide) {
        window.lucide.createIcons({ attrs: { class: 'lucide' } });
    }
    
    return itemElement;
}

/**
 * Render entity as a tag item
 * @param {Object} entity - Entity object
 * @param {Object} contextData - Tag context data
 * @returns {HTMLElement} Tag item element
 */
function renderEntityAsTagItem(entity, contextData = {}) {
    const itemElement = document.createElement('div');
    itemElement.className = `tagged-entity border-l-2 border-${getEntityTypeColor(entity.type)} pl-4 pb-4 hover:bg-base-200 rounded-r cursor-pointer`;
    itemElement.dataset.entityId = entity.id;
    itemElement.onclick = () => openEntity(entity.id);
    
    // Add context data attributes
    if (contextData.tagId) itemElement.dataset.tagId = contextData.tagId;
    if (contextData.tagName) itemElement.dataset.tagName = contextData.tagName;
    
    const itemContent = `
        <div class="flex items-start gap-3">
            <div class="flex-shrink-0 w-8 h-8 bg-${getEntityTypeColor(entity.type)} text-white rounded-full flex items-center justify-center text-sm">
                ${getEntityTypeIcon(entity.type, true)}
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                    <h4 class="font-medium text-sm truncate">${entity.title || 'Untitled'}</h4>
                    <span class="badge badge-outline badge-xs">${entity.type}</span>
                </div>
                ${entity.content ? `<p class="text-xs text-base-content/60 line-clamp-2 mb-2">${entity.content}</p>` : ''}
                <div class="flex items-center gap-2 text-xs text-base-content/50">
                    ${entity.completed ? '<span class="badge badge-success badge-xs">✓ Completed</span>' : ''}
                    ${entity.priority && entity.priority !== 'medium' ? `<span class="badge badge-outline badge-xs">${entity.priority}</span>` : ''}
                    ${entity.dueDate ? `<span class="badge badge-outline badge-xs">Due: ${formatDate(entity.dueDate)}</span>` : ''}
                    ${entity.tags && entity.tags.length > 0 ? `<span class="text-xs">+${entity.tags.length - 1} more tags</span>` : ''}
                </div>
            </div>
            <div class="dropdown dropdown-end">
                <label tabindex="0" class="btn btn-ghost btn-xs btn-circle">
                    <i data-lucide="more-horizontal" class="w-3 h-3"></i>
                </label>
                <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-32 text-sm">
                    <li><a onclick="event.stopPropagation(); entityRenderer.editEntity('${entity.id}')">Edit</a></li>
                    <li><a onclick="event.stopPropagation(); removeFromTag('${entity.id}', '${contextData.tagName}')">Remove Tag</a></li>
                </ul>
            </div>
        </div>
    `;
    
    itemElement.innerHTML = itemContent;
    
    // Render Lucide icons
    if (window.lucide) {
        window.lucide.createIcons({ attrs: { class: 'lucide' } });
    }
    
    return itemElement;
}

/**
 * Render entity as a people item (for person timeline view)
 * @param {Object} entity - Entity object
 * @param {Object} contextData - People context data
 * @returns {HTMLElement} People item element
 */
function renderEntityAsPeopleItem(entity, contextData = {}) {
    const itemElement = document.createElement('div');
    itemElement.className = `people-entity border-l-2 border-${getEntityTypeColor(entity.type)} pl-4 pb-4 mb-4 hover:bg-base-200 rounded-r cursor-pointer`;
    itemElement.dataset.entityId = entity.id;
    itemElement.onclick = () => openEntity(entity.id);
    
    // Add context data attributes
    if (contextData.personId) itemElement.dataset.personId = contextData.personId;
    
    // Format date for timeline
    const date = new Date(entity.updatedAt || entity.createdAt);
    const isToday = date.toDateString() === new Date().toDateString();
    const isYesterday = date.toDateString() === new Date(Date.now() - 86400000).toDateString();
    
    let dateStr;
    if (isToday) {
        dateStr = `Today, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    } else if (isYesterday) {
        dateStr = `Yesterday, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    } else {
        dateStr = date.toLocaleDateString() + ', ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
    
    const itemContent = `
        <div class="flex items-start gap-3">
            <div class="flex-shrink-0 w-8 h-8 bg-${getEntityTypeColor(entity.type)} text-white rounded-full flex items-center justify-center text-sm">
                ${getEntityTypeIcon(entity.type, true)}
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                    <h4 class="font-medium text-sm truncate">${entity.title || 'Untitled'}</h4>
                    <span class="text-xs text-base-content/50">${dateStr}</span>
                </div>
                <div class="flex items-center gap-2 mb-2">
                    <span class="badge badge-outline badge-xs">${entity.type}</span>
                    ${entity.completed ? '<span class="badge badge-success badge-xs">✓ Completed</span>' : ''}
                    ${entity.priority && entity.priority !== 'medium' ? `<span class="badge badge-outline badge-xs">${entity.priority}</span>` : ''}
                </div>
                ${entity.content ? `<p class="text-xs text-base-content/70 line-clamp-2 mb-2">${entity.content}</p>` : ''}
                ${entity.dueDate ? `<div class="text-xs text-base-content/50">Due: ${formatDate(entity.dueDate)}</div>` : ''}
            </div>
            <div class="dropdown dropdown-end">
                <label tabindex="0" class="btn btn-ghost btn-xs btn-circle">
                    <i data-lucide="more-horizontal" class="w-3 h-3"></i>
                </label>
                <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40 text-sm">
                    <li><a onclick="event.stopPropagation(); entityRenderer.editEntity('${entity.id}')">Edit</a></li>
                    <li><a onclick="event.stopPropagation(); unlinkFromPerson('${entity.id}', '${contextData.personId}')">Unlink from Person</a></li>
                    <li><a onclick="event.stopPropagation(); openEntityInContext('${entity.id}')">View in Context</a></li>
                </ul>
            </div>
        </div>
    `;
    
    itemElement.innerHTML = itemContent;
    
    // Render Lucide icons
    if (window.lucide) {
        window.lucide.createIcons({ attrs: { class: 'lucide' } });
    }
    
    return itemElement;
}

/**
 * Render task-specific card content
 */
function renderTaskCardContent(entity) {
    let content = '';
    
    if (entity.content) {
        content += `<p class="text-sm text-base-content/70 line-clamp-3 mb-3">${entity.content}</p>`;
    }
    
    // Task metadata badges
    const metadata = [];
    
    if (entity.priority && entity.priority !== 'medium') {
        const priorityClasses = {
            'high': 'badge-error',
            'low': 'badge-success'
        };
        const priorityIcons = {
            'high': '🔴',
            'low': '🟢'
        };
        metadata.push(`<span class="badge ${priorityClasses[entity.priority]} badge-sm">${priorityIcons[entity.priority]} ${entity.priority}</span>`);
    }
    
    if (entity.dueDate) {
        const dueDate = new Date(entity.dueDate);
        const isOverdue = dueDate < new Date() && !entity.completed;
        const isToday = dueDate.toDateString() === new Date().toDateString();
        
        let dueDateClass = 'badge-outline';
        if (isOverdue) dueDateClass = 'badge-error';
        else if (isToday) dueDateClass = 'badge-warning';
        
        metadata.push(`<span class="badge ${dueDateClass} badge-sm">📅 ${formatDate(entity.dueDate)}</span>`);
    }
    
    // Show subtask progress using the new subtask system
    if (entity.subtasks && entity.subtasks.length > 0) {
        // For now, use the simple subtasks array count
        // TODO: This could be enhanced to use calculateTaskProgress for more accurate async calculation
        const completedSubtasks = entity.subtasks.filter(subtaskId => {
            // This is a simplified check - in a real implementation you'd want to
            // fetch the actual subtask entities to check their completion status
            return false; // Placeholder
        }).length;
        
        const progress = entity.subtasks.length > 0 ? Math.round((completedSubtasks / entity.subtasks.length) * 100) : 0;
        metadata.push(`<span class="badge badge-outline badge-sm">📋 ${entity.subtasks.length} subtasks</span>`);
    }
    
    if (metadata.length > 0) {
        content += `<div class="flex flex-wrap gap-1 mb-2">${metadata.join('')}</div>`;
    }
    
    return content;
}

/**
 * Render note-specific card content
 */
function renderNoteCardContent(entity) {
    let content = '';
    
    if (entity.content) {
        content += `<p class="text-sm text-base-content/70 line-clamp-3 mb-3">${entity.content}</p>`;
    }
    
    if (entity.tags && entity.tags.length > 0) {
        content += `<div class="flex flex-wrap gap-1">${entity.tags.map(tag => `<span class="badge badge-outline badge-xs">${tag}</span>`).join('')}</div>`;
    }
    
    return content;
}

/**
 * Render checklist-specific card content
 */
function renderChecklistCardContent(entity) {
    let content = '';
    
    if (entity.content) {
        content += `<p class="text-sm text-base-content/70 mb-3">${entity.content}</p>`;
    }
    
    if (entity.items && entity.items.length > 0) {
        const completedItems = entity.items.filter(item => item.completed).length;
        const progress = (completedItems / entity.items.length) * 100;
        
        content += `
            <div class="mb-3">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-xs text-base-content/60">Progress</span>
                    <span class="text-xs font-medium">${completedItems}/${entity.items.length}</span>
                </div>
                <progress class="progress progress-primary w-full h-2" value="${progress}" max="100"></progress>
            </div>
        `;
        
        // Show first few items
        const previewItems = entity.items.slice(0, 3);
        content += '<div class="space-y-1">';
        previewItems.forEach(item => {
            content += `<div class="flex items-center gap-2 text-xs">
                            <input type="checkbox" class="checkbox checkbox-xs" ${item.completed ? 'checked' : ''} disabled>
                            <span class="${item.completed ? 'line-through text-base-content/50' : ''}">${item.text}</span>
                        </div>`;
        });
        if (entity.items.length > 3) {
            content += `<div class="text-xs text-base-content/50 italic">... and ${entity.items.length - 3} more items</div>`;
        }
        content += '</div>';
    }
    
    return content;
}

/**
 * Render project-specific card content
 */
function renderProjectCardContent(entity) {
    let content = '';
    
    if (entity.content) {
        content += `<p class="text-sm text-base-content/70 line-clamp-2 mb-3">${entity.content}</p>`;
    }
    
    content += '<div class="flex flex-wrap gap-2 mb-2">';
    
    if (entity.status) {
        const statusClass = entity.status === 'active' ? 'badge-success' : 
                           entity.status === 'planning' ? 'badge-warning' : 
                           entity.status === 'completed' ? 'badge-primary' : 'badge-outline';
        content += `<span class="badge ${statusClass} badge-sm">${entity.status}</span>`;
    }
    
    if (entity.team && entity.team.length > 0) {
        content += `<span class="badge badge-outline badge-sm">👥 ${entity.team.length}</span>`;
    }
    
    content += '</div>';
    
    if (entity.startDate && entity.endDate) {
        content += `<div class="text-xs text-base-content/60">
                        📅 ${formatDate(entity.startDate)} - ${formatDate(entity.endDate)}
                    </div>`;
    }
    
    return content;
}

/**
 * Get color class for entity type
 * @param {string} type - Entity type
 * @returns {string} DaisyUI color class
 */
function getEntityTypeColor(type) {
    const colors = {
        [ENTITY_TYPES.TASK]: 'primary',
        [ENTITY_TYPES.NOTE]: 'info', 
        [ENTITY_TYPES.CHECKLIST]: 'success',
        [ENTITY_TYPES.PROJECT]: 'warning'
    };
    return colors[type] || 'neutral';
}

/**
 * Get icon for entity type
 */
export function getEntityTypeIcon(type, asHTML = false) {
    const iconData = {
        [ENTITY_TYPES.TASK]: {
            class: "lucide lucide-check w-4 h-4",
            path: '<path d="M5 13l4 4L19 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        },
        [ENTITY_TYPES.NOTE]: {
            class: "lucide lucide-file-text w-4 h-4", 
            path: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="14 2 14 8 20 8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="16" y1="13" x2="8" y2="13" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="16" y1="17" x2="8" y2="17" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="10 9 9 9 8 9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        },
        [ENTITY_TYPES.CHECKLIST]: {
            class: "lucide lucide-list-checks w-4 h-4",
            path: '<path d="M3 17l2 2 4-4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 7l2 2 4-4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="13" y1="6" x2="21" y2="6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="13" y1="12" x2="21" y2="12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="13" y1="18" x2="21" y2="18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        },
        [ENTITY_TYPES.PROJECT]: {
            class: "lucide lucide-folder w-4 h-4",
            path: '<path d="M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        }
    };
    
    const icon = iconData[type] || {
        class: "lucide lucide-circle w-4 h-4",
        path: '<circle cx="12" cy="12" r="10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    };
    
    if (asHTML) {
        // Return HTML string for template literals
        return `<svg class="${icon.class}" viewBox="0 0 24 24" fill="none" stroke="currentColor">${icon.path}</svg>`;
    } else {
        // Return DOM element for appendChild
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", icon.class);
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "currentColor");
        svg.innerHTML = icon.path;
        return svg;
    }
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
    
    return date.toLocaleDateString();
}

/**
 * Load and display cross-context indicators for an entity
 * @param {string} entityId - Entity ID
 */
async function loadCrossContextIndicators(entityId) {
    try {
        const indicators = [];
        
        // Check if entity exists in weekly plans
        const weeklyItems = await db.weeklyItems.where('entityId').equals(entityId).toArray();
        if (weeklyItems.length > 0) {
            indicators.push({
                icon: '📅',
                title: `In ${weeklyItems.length} weekly plan${weeklyItems.length > 1 ? 's' : ''}`,
                class: 'badge-info'
            });
        }
        
        // Check if entity exists in other boards
        const positions = await db.entityPositions.where('entityId').equals(entityId).toArray();
        const boardPositions = positions.filter(p => p.context === 'board');
        if (boardPositions.length > 1) { // More than current board
            indicators.push({
                icon: '📋',
                title: `In ${boardPositions.length} board${boardPositions.length > 1 ? 's' : ''}`,
                class: 'badge-primary'
            });
        }
        
        // Check if entity is linked to people
        const entity = await db.entities.get(entityId);
        if (entity && entity.people && entity.people.length > 0) {
            indicators.push({
                icon: '👥',
                title: `Linked to ${entity.people.length} person${entity.people.length > 1 ? 's' : ''}`,
                class: 'badge-secondary'
            });
        }
        
        // Check if entity is in collections
        const collections = await db.collections.filter(collection => 
            collection.items && collection.items.includes(entityId)
        ).toArray();
        if (collections.length > 0) {
            indicators.push({
                icon: '📂',
                title: `In ${collections.length} collection${collections.length > 1 ? 's' : ''}`,
                class: 'badge-accent'
            });
        }
        
        // Check if entity has tags
        if (entity && entity.tags && entity.tags.length > 0) {
            indicators.push({
                icon: '🏷️',
                title: `${entity.tags.length} tag${entity.tags.length > 1 ? 's' : ''}`,
                class: 'badge-neutral'
            });
        }
        
        // Update the UI
        const indicatorContainer = document.getElementById(`crossContext${entityId}`);
        if (indicatorContainer && indicators.length > 0) {
            indicatorContainer.innerHTML = indicators.map(indicator => 
                `<span class="badge badge-xs ${indicator.class}" title="${indicator.title}">${indicator.icon}</span>`
            ).join('');
        }
        
    } catch (error) {
        console.error('Failed to load cross-context indicators:', error);
    }
}

/**
 * Setup event listeners for card elements
 */
function setupCardEventListeners(cardElement, entity) {
    // SortableJS handles drag and drop, so we don't need HTML5 drag events
    // Removed conflicting dragstart/dragend listeners
    
    // Add click handler for card detail view
    cardElement.addEventListener('click', async (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
            return; // Don't handle card click if button/input was clicked
        }
        
        // Open entity detail modal
        await showEntityDetail(entity.id);
    });
}

/**
 * Edit entity (opens appropriate modal)
 */
/**
 * Show comprehensive entity detail modal
 * @param {string} entityId - Entity ID to display
 */
export async function showEntityDetail(entityId) {
    const entity = await getEntity(entityId);
    if (!entity) {
        console.warn('Entity not found:', entityId);
        return;
    }
    
    const modal = document.getElementById('entityDetailModal');
    if (!modal) {
        console.warn('Entity detail modal not found');
        return;
    }
    
    // Store current entity for modal operations
    currentEditingEntity = entity;
    window.currentEditingEntity = entity; // Expose to window for subtask-management.js
    
    // Clear any existing subtasks content first to prevent stale data
    const subtasksList = document.getElementById('subtasksList');
    const addSubtaskFormContainer = document.getElementById('addSubtaskFormContainer');
    if (subtasksList) subtasksList.innerHTML = '';
    if (addSubtaskFormContainer) {
        addSubtaskFormContainer.innerHTML = '';
        addSubtaskFormContainer.style.display = 'none';
    }
    
    // Populate modal with entity data
    await populateEntityDetailModal(entity);
    
    // Show modal
    modal.classList.add('modal-open');
    
    // Add event listeners for modal interactions
    setupEntityDetailListeners();
}

/**
 * Legacy editEntity function for backward compatibility
 */
export async function editEntity(entityId) {
    await showEntityDetail(entityId);
}

/**
 * Set up modal for editing an entity
 * @param {HTMLElement} modal - Modal element
 * @param {Object} entity - Entity to edit
 */
function setupEntityEditModal(modal, entity) {
    currentEditingEntity = entity;
    window.currentEditingEntity = entity; // Expose to window for subtask-management.js
    
    // Update modal title
    const modalTitle = modal.querySelector('h2');
    if (modalTitle) {
        modalTitle.textContent = `Edit ${entity.type.charAt(0).toUpperCase() + entity.type.slice(1)}`;
    }
    
    // Populate form fields based on entity type
    const titleInput = modal.querySelector('#cardTitle, #weeklyItemTitle');
    const descriptionInput = modal.querySelector('#cardDescription, #weeklyItemContent');
    const typeSelect = modal.querySelector('#weeklyItemType');
    const prioritySelect = modal.querySelector('#cardPriority');
    const dueDateInput = modal.querySelector('#cardDueDate');
    
    if (titleInput) titleInput.value = entity.title || '';
    if (descriptionInput) descriptionInput.value = entity.content || '';
    if (typeSelect) typeSelect.value = entity.type;
    if (prioritySelect && entity.priority) prioritySelect.value = entity.priority;
    if (dueDateInput && entity.dueDate) dueDateInput.value = entity.dueDate;
    
    // Override the save function to handle entity updates
    const saveButton = modal.querySelector('button[data-action="saveCard"], button[data-action="saveWeeklyItem"]');
    if (saveButton) {
        // Store original onclick
        const originalOnClick = saveButton.onclick;
        
        saveButton.onclick = function() {
            saveEntityFromModal(modal);
        };
        
        // Restore original onclick when modal closes
        const closeButtons = modal.querySelectorAll('.close, button[data-action="closeModal"], button[data-action="closeWeeklyItemModal"]');
        closeButtons.forEach(btn => {
            const originalClose = btn.onclick;
            btn.onclick = function() {
                if (originalOnClick) saveButton.onclick = originalOnClick;
                currentEditingEntity = null;
                window.currentEditingEntity = null; // Clear window reference too
                if (originalClose) originalClose();
            };
        });
    }
    
    // Show modal
    modal.classList.add('modal-open');
}

/**
 * Save entity from modal form
 * @param {HTMLElement} modal - Modal element
 */
function saveEntityFromModal(modal) {
    if (!currentEditingEntity) return;
    
    const titleInput = modal.querySelector('#cardTitle, #weeklyItemTitle');
    const descriptionInput = modal.querySelector('#cardDescription, #weeklyItemContent');
    const prioritySelect = modal.querySelector('#cardPriority');
    const dueDateInput = modal.querySelector('#cardDueDate');
    
    const updates = {};
    
    if (titleInput && titleInput.value.trim()) {
        updates.title = titleInput.value.trim();
    }
    
    if (descriptionInput) {
        updates.content = descriptionInput.value.trim();
    }
    
    if (prioritySelect && prioritySelect.value) {
        updates.priority = prioritySelect.value;
    }
    
    if (dueDateInput && dueDateInput.value) {
        updates.dueDate = dueDateInput.value;
    }
    
    // Update the entity
    updateEntity(currentEditingEntity.id, updates);
    showStatusMessage(`${currentEditingEntity.type} updated`, 'success');
    
    // Close modal
    modal.classList.remove('modal-open');
    currentEditingEntity = null;
    window.currentEditingEntity = null; // Clear window reference too
    
    // Refresh displays
    refreshEntityDisplays(currentEditingEntity?.id);
}

/**
 * Toggle entity completion
 */
export function toggleCompletion(entityId) {
    const entity = toggleEntityCompletion(entityId);
    if (entity) {
        showStatusMessage(`${entity.type} ${entity.completed ? 'completed' : 'marked incomplete'}`, 'success');
        
        // Refresh UI
        refreshEntityDisplays(entityId);
    }
}


/**
 * Refresh all displays of an entity
 */
async function refreshEntityDisplays(entityId) {
    // Find all elements displaying this entity and re-render them
    const elements = document.querySelectorAll(`[data-entity-id="${entityId}"]`);
    
    for (const element of elements) {
        const contextType = getContextFromElement(element);
        const contextData = getContextDataFromElement(element);
        
        const newElement = await renderEntity(entityId, contextType, contextData);
        if (newElement) {
            element.parentNode.replaceChild(newElement, element);
        }
    }
}

/**
 * Determine context type from DOM element
 */
function getContextFromElement(element) {
    if (element.closest('.board-container')) return CONTEXT_TYPES.BOARD;
    if (element.closest('.weekly-container')) return CONTEXT_TYPES.WEEKLY;
    if (element.closest('.task-container')) return CONTEXT_TYPES.TASK_LIST;
    if (element.closest('.collection-container')) return CONTEXT_TYPES.COLLECTION;
    if (element.closest('.tag-container')) return CONTEXT_TYPES.TAG;
    if (element.closest('.people-container')) return CONTEXT_TYPES.PEOPLE;
    return CONTEXT_TYPES.BOARD; // default
}

/**
 * Get context data from DOM element
 */
function getContextDataFromElement(element) {
    const contextData = {};
    
    // Extract data attributes directly from element
    if (element.dataset.boardId) contextData.boardId = element.dataset.boardId;
    if (element.dataset.rowId) contextData.rowId = element.dataset.rowId;
    if (element.dataset.columnKey) contextData.columnKey = element.dataset.columnKey;
    if (element.dataset.weekKey) contextData.weekKey = element.dataset.weekKey;
    if (element.dataset.day) contextData.day = element.dataset.day;
    if (element.dataset.weeklyItemId) contextData.weeklyItemId = element.dataset.weeklyItemId;
    if (element.dataset.collectionId) contextData.collectionId = element.dataset.collectionId;
    if (element.dataset.tagId) contextData.tagId = element.dataset.tagId;
    if (element.dataset.tagName) contextData.tagName = element.dataset.tagName;
    if (element.dataset.personId) contextData.personId = element.dataset.personId;
    
    // Try to determine from parent containers
    const boardContainer = element.closest('[data-board-id]');
    if (boardContainer && !contextData.boardId) {
        contextData.boardId = boardContainer.dataset.boardId;
    }
    
    const rowContainer = element.closest('[data-row-id]');
    if (rowContainer && !contextData.rowId) {
        contextData.rowId = rowContainer.dataset.rowId;
    }
    
    const columnContainer = element.closest('[data-column-key]');
    if (columnContainer && !contextData.columnKey) {
        contextData.columnKey = columnContainer.dataset.columnKey;
    }
    
    const weeklyContainer = element.closest('[data-week-key]');
    if (weeklyContainer && !contextData.weekKey) {
        contextData.weekKey = weeklyContainer.dataset.weekKey;
    }
    
    const dayColumn = element.closest('[data-day]');
    if (dayColumn && !contextData.day) {
        contextData.day = dayColumn.dataset.day;
    }
    
    // For weekly planning, try to get current week from global state
    if (!contextData.weekKey && typeof window.weeklyPlanning?.getCurrentWeek === 'function') {
        contextData.weekKey = window.weeklyPlanning.getCurrentWeek();
    }
    
    // For board view, try to get current board from global state
    if (!contextData.boardId && typeof window.boardData?.id !== 'undefined') {
        contextData.boardId = window.boardData.id;
    }
    
    return contextData;
}

/**
 * Populate the entity detail modal with entity data
 * @param {Object} entity - Entity object
 */
async function populateEntityDetailModal(entity) {
    // Get all the modal elements
    const elements = {
        icon: document.getElementById('entityIcon'),
        title: document.getElementById('entityDetailTitle'),
        typeBadge: document.getElementById('entityTypeBadge'),
        idDisplay: document.getElementById('entityIdDisplay'),
        completed: document.getElementById('entityCompleted'),
        description: document.getElementById('entityDescription'),
        priority: document.getElementById('entityPriority'),
        dueDate: document.getElementById('entityDueDate'),
        projectStatus: document.getElementById('projectStatus'),
        projectTeam: document.getElementById('projectTeam'),
        created: document.getElementById('entityCreated'),
        modified: document.getElementById('entityModified'),
        board: document.getElementById('entityBoard')
    };
    
    // Populate basic information
    if (elements.icon) {
        // Clear existing content and append the SVG icon
        elements.icon.innerHTML = '';
        elements.icon.appendChild(getEntityTypeIcon(entity.type));
    }
    if (elements.title) elements.title.textContent = entity.title || 'Untitled';
    if (elements.typeBadge) elements.typeBadge.textContent = entity.type.charAt(0).toUpperCase() + entity.type.slice(1);
    if (elements.idDisplay) elements.idDisplay.textContent = entity.id;
    if (elements.completed) elements.completed.checked = entity.completed || false;
    if (elements.description) elements.description.value = entity.content || '';
    
    // Populate task-specific fields
    if (entity.type === ENTITY_TYPES.TASK) {
        if (elements.priority) elements.priority.value = entity.priority || 'medium';
        if (elements.dueDate) elements.dueDate.value = entity.dueDate || '';
    }
    
    // Populate project-specific fields
    if (entity.type === ENTITY_TYPES.PROJECT) {
        if (elements.projectStatus) elements.projectStatus.value = entity.status || 'planning';
        if (elements.projectTeam) elements.projectTeam.value = entity.team || '';
    }
    
    // Show/hide type-specific sections
    showTypeSpecificSections(entity.type);
    
    // Populate metadata
    if (elements.created) elements.created.textContent = formatDate(entity.createdAt) || 'Unknown';
    if (elements.modified) elements.modified.textContent = formatDate(entity.updatedAt) || 'Unknown';
    
    // Populate weekly planning status
    updateWeeklyPlanningStatus(entity);
    
    // Populate tags
    populateEntityTags(entity);
    
    // Populate subtasks
    await populateSubtasks(entity);
    
    // Populate checklist items if checklist
    if (entity.type === ENTITY_TYPES.CHECKLIST) {
        populateChecklistItems(entity);
    }
    
    // Populate linked people
    populateLinkedPeople(entity);
}

/**
 * Show/hide sections based on entity type
 * @param {string} entityType - Type of entity
 */
function showTypeSpecificSections(entityType) {
    // Hide all type-specific sections first
    const taskSection = document.getElementById('taskSpecificSection');
    const checklistSection = document.getElementById('checklistSection');
    const projectSection = document.getElementById('projectSection');
    
    if (taskSection) taskSection.style.display = 'none';
    if (checklistSection) checklistSection.style.display = 'none';
    if (projectSection) projectSection.style.display = 'none';
    
    // Show relevant section
    switch (entityType) {
        case ENTITY_TYPES.TASK:
            if (taskSection) taskSection.style.display = 'block';
            break;
        case ENTITY_TYPES.CHECKLIST:
            if (checklistSection) checklistSection.style.display = 'block';
            break;
        case ENTITY_TYPES.PROJECT:
            if (projectSection) projectSection.style.display = 'block';
            break;
    }
}

/**
 * Setup event listeners for entity detail modal
 */
function setupEntityDetailListeners() {
    // Remove existing listeners to prevent duplicates
    const modal = document.getElementById('entityDetailModal');
    if (!modal) return;
    
    // Clone and replace to remove all event listeners
    const newModal = modal.cloneNode(true);
    modal.parentNode.replaceChild(newModal, modal);
    
    // Add fresh event listeners
    newModal.addEventListener('click', handleEntityDetailClick);
    newModal.addEventListener('change', handleEntityDetailChange);
    newModal.addEventListener('input', handleEntityDetailInput);
}

/**
 * Handle clicks in entity detail modal
 * @param {Event} event - Click event
 */
async function handleEntityDetailClick(event) {
    const action = event.target.dataset.action;
    if (!action || !currentEditingEntity) return;
    
    event.preventDefault();
    
    switch (action) {
        case 'closeEntityDetailModal':
            closeEntityDetailModal();
            break;
        case 'saveEntityChanges':
            saveEntityChanges();
            break;
        case 'addToWeeklyPlan':
            await addEntityToWeeklyPlan(currentEditingEntity.id);
            break;
        case 'duplicateEntity':
            duplicateCurrentEntity();
            break;
        case 'deleteEntity':
            deleteCurrentEntity();
            break;
        case 'addSubtask':
            addSubtaskToEntity();
            break;
        case 'addChecklistItem':
            addChecklistItemToEntity();
            break;
    }
}

/**
 * Handle input changes in entity detail modal
 * @param {Event} event - Change event
 */
function handleEntityDetailChange(event) {
    if (!currentEditingEntity) return;
    
    const element = event.target;
    const id = element.id;
    
    // Auto-save certain changes
    switch (id) {
        case 'entityCompleted':
            toggleEntityCompletion(currentEditingEntity.id);
            break;
    }
}

/**
 * Handle text input in entity detail modal
 * @param {Event} event - Input event
 */
function handleEntityDetailInput(event) {
    // Could add auto-save functionality here
}

/**
 * Close entity detail modal
 */
export function closeEntityDetailModal() {
    const modal = document.getElementById('entityDetailModal');
    if (modal) modal.classList.remove('modal-open');
    currentEditingEntity = null;
    window.currentEditingEntity = null; // Clear window reference too
}

/**
 * Save changes from entity detail modal
 */
function saveEntityChanges() {
    if (!currentEditingEntity) return;
    
    const elements = {
        title: document.getElementById('entityDetailTitle'),
        description: document.getElementById('entityDescription'),
        priority: document.getElementById('entityPriority'),
        dueDate: document.getElementById('entityDueDate'),
        projectStatus: document.getElementById('projectStatus'),
        projectTeam: document.getElementById('projectTeam')
    };
    
    const updates = {};
    
    // Collect changes
    if (elements.title) updates.title = elements.title.textContent.trim();
    if (elements.description) updates.content = elements.description.value.trim();
    
    if (currentEditingEntity.type === ENTITY_TYPES.TASK) {
        if (elements.priority) updates.priority = elements.priority.value;
        if (elements.dueDate) updates.dueDate = elements.dueDate.value || null;
    }
    
    if (currentEditingEntity.type === ENTITY_TYPES.PROJECT) {
        if (elements.projectStatus) updates.status = elements.projectStatus.value;
        if (elements.projectTeam) updates.team = elements.projectTeam.value;
    }
    
    // Update entity
    updateEntity(currentEditingEntity.id, updates);
    refreshEntityDisplays(currentEditingEntity.id);
    showStatusMessage('Entity updated successfully', 'success');
    
    closeEntityDetailModal();
}

/**
 * Add entity to weekly plan
 * @param {string} entityId - Entity ID
 */
async function addEntityToWeeklyPlan(entityId) {
    if (window.weeklyPlanning && window.weeklyPlanning.addEntityToCurrentWeek) {
        window.weeklyPlanning.addEntityToCurrentWeek(entityId);
        updateWeeklyPlanningStatus(await getEntity(entityId));
        showStatusMessage('Added to weekly plan', 'success');
    } else {
        showStatusMessage('Weekly planning not available', 'warning');
    }
}

/**
 * Update weekly planning status in modal
 * @param {Object} entity - Entity object
 */
function updateWeeklyPlanningStatus(entity) {
    const statusContainer = document.getElementById('weeklyStatus');
    if (!statusContainer) return;
    
    // Check if entity is in weekly plans
    // This would need to be implemented based on your weekly planning system
    statusContainer.innerHTML = '<p class="no-weekly">Not in any weekly plan</p>';
}

/**
 * Populate entity tags
 * @param {Object} entity - Entity object
 */
function populateEntityTags(entity) {
    const tagsContainer = document.getElementById('entityTags');
    if (!tagsContainer) return;
    
    tagsContainer.innerHTML = '';
    
    if (entity.tags && entity.tags.length > 0) {
        entity.tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            tagElement.textContent = tag;
            tagsContainer.appendChild(tagElement);
        });
    }
}

/**
 * Populate subtasks using the new subtask infrastructure
 * @param {Object} entity - Entity object
 */
async function populateSubtasks(entity) {
    const subtasksList = document.getElementById('subtasksList');
    const subtasksSection = document.getElementById('subtasksSection');
    if (!subtasksList) return;
    
    // Import subtask functions
    const { getSubtasks, canHaveSubtasks, calculateTaskProgress } = await import('./entity-core.js');
    
    // Hide subtasks section for entities that can't have subtasks
    if (!canHaveSubtasks(entity)) {
        if (subtasksSection) subtasksSection.style.display = 'none';
        return;
    } else {
        if (subtasksSection) subtasksSection.style.display = 'block';
    }
    
    // Clear existing content in subtasks list (forms are now in separate container)
    subtasksList.innerHTML = '';
    
    try {
        const subtasks = await getSubtasks(entity.id);
        
        if (subtasks.length === 0) {
            subtasksList.innerHTML = `
                <div class="text-center py-8 text-base-content/60">
                    <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    <p class="text-sm">No subtasks yet</p>
                    <p class="text-xs mt-1">Break this ${entity.type} down into smaller tasks</p>
                </div>
            `;
            return;
        }
        
        // Show progress bar if there are subtasks
        const completedCount = subtasks.filter(st => st.completed).length;
        const progress = Math.round((completedCount / subtasks.length) * 100);
        
        // Create progress header
        const progressHeader = document.createElement('div');
        progressHeader.className = 'mb-4 p-3 bg-base-200 rounded-lg';
        progressHeader.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium">Progress</span>
                <span class="text-sm font-medium">${completedCount}/${subtasks.length} completed</span>
            </div>
            <div class="w-full bg-base-300 rounded-full h-2.5">
                <div class="bg-primary h-2.5 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
            </div>
            <div class="text-xs text-base-content/60 mt-1">${progress}% complete</div>
        `;
        subtasksList.appendChild(progressHeader);
        
        // Create subtasks list container
        const subtasksContainer = document.createElement('div');
        subtasksContainer.className = 'space-y-3';
        
        // Render each subtask
        for (const subtask of subtasks) {
            const subtaskElement = await createSubtaskElement(subtask, entity.id);
            subtasksContainer.appendChild(subtaskElement);
        }
        
        subtasksList.appendChild(subtasksContainer);
        
    } catch (error) {
        console.error('Failed to populate subtasks:', error);
        subtasksList.innerHTML = `
            <div class="alert alert-error">
                <span>Failed to load subtasks</span>
            </div>
        `;
    }
}

/**
 * Create a subtask element for display in the subtasks list
 * @param {Object} subtask - Subtask entity object
 * @param {string} parentEntityId - Parent entity ID
 * @returns {Promise<HTMLElement>} Subtask element
 */
async function createSubtaskElement(subtask, parentEntityId) {
    const subtaskElement = document.createElement('div');
    subtaskElement.className = 'flex items-start gap-3 p-3 bg-base-100 border border-base-300 rounded-lg hover:bg-base-50 transition-colors';
    subtaskElement.dataset.subtaskId = subtask.id;
    
    // Due date indicator
    let dueDateIndicator = '';
    if (subtask.dueDate) {
        const dueDate = new Date(subtask.dueDate);
        const isOverdue = dueDate < new Date() && !subtask.completed;
        const isToday = dueDate.toDateString() === new Date().toDateString();
        
        let dueDateClass = 'badge-outline';
        if (isOverdue) dueDateClass = 'badge-error';
        else if (isToday) dueDateClass = 'badge-warning';
        
        dueDateIndicator = `<span class="badge ${dueDateClass} badge-xs">${formatDate(subtask.dueDate)}</span>`;
    }
    
    // Priority indicator
    let priorityIndicator = '';
    if (subtask.priority && subtask.priority !== 'medium') {
        const priorityClasses = {
            'high': 'badge-error',
            'low': 'badge-success'
        };
        priorityIndicator = `<span class="badge ${priorityClasses[subtask.priority]} badge-xs">${subtask.priority}</span>`;
    }
    
    subtaskElement.innerHTML = `
        <div class="flex-shrink-0 mt-1">
            <input type="checkbox" class="checkbox checkbox-sm" ${subtask.completed ? 'checked' : ''} 
                   onchange="toggleSubtaskCompletion('${subtask.id}', '${parentEntityId}')">
        </div>
        <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <h4 class="font-medium text-sm ${subtask.completed ? 'line-through text-base-content/60' : ''}" 
                        id="subtask-title-${subtask.id}">${subtask.title || 'Untitled Subtask'}</h4>
                    ${subtask.content ? `<p class="text-xs text-base-content/70 mt-1 ${subtask.completed ? 'line-through' : ''}">${subtask.content}</p>` : ''}
                    <div class="flex flex-wrap gap-1 mt-2">
                        ${priorityIndicator}
                        ${dueDateIndicator}
                        ${subtask.completed ? '<span class="badge badge-success badge-xs">✓ Complete</span>' : ''}
                    </div>
                </div>
                <div class="dropdown dropdown-end">
                    <label tabindex="0" class="btn btn-ghost btn-xs btn-circle">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                        </svg>
                    </label>
                    <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40 text-sm">
                        <li><a onclick="editSubtask('${subtask.id}', '${parentEntityId}')">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            Edit</a></li>
                        <li><a onclick="moveSubtaskToTopLevel('${subtask.id}', '${parentEntityId}')">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                            </svg>
                            Make Independent</a></li>
                        <li><a onclick="deleteSubtask('${subtask.id}', '${parentEntityId}')" class="text-error">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            Delete</a></li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    
    return subtaskElement;
}

/**
 * Create the add subtask form
 * @param {string} parentEntityId - Parent entity ID
 * @returns {HTMLElement} Add subtask form element
 */
function createAddSubtaskForm(parentEntityId) {
    const formElement = document.createElement('div');
    formElement.className = 'mt-4 p-3 bg-base-200 rounded-lg';
    formElement.id = `addSubtaskForm-${parentEntityId}`;
    formElement.style.display = 'none'; // Initially hidden
    
    formElement.innerHTML = `
        <div class="space-y-3">
            <div class="form-control">
                <input type="text" id="newSubtaskTitle-${parentEntityId}" class="input input-bordered input-sm w-full" 
                       placeholder="Enter subtask title..." maxlength="200"
                       onkeydown="if(event.key === 'Enter') saveNewSubtask('${parentEntityId}'); else if(event.key === 'Escape') cancelAddSubtask('${parentEntityId}');">
            </div>
            <div class="form-control">
                <textarea id="newSubtaskContent-${parentEntityId}" class="textarea textarea-bordered textarea-sm w-full h-16 resize-none" 
                          placeholder="Add description (optional)..." maxlength="500"></textarea>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="form-control">
                    <select id="newSubtaskPriority-${parentEntityId}" class="select select-bordered select-sm">
                        <option value="low">🟢 Low Priority</option>
                        <option value="medium" selected>🟡 Medium Priority</option>
                        <option value="high">🔴 High Priority</option>
                    </select>
                </div>
                <div class="form-control">
                    <input type="date" id="newSubtaskDueDate-${parentEntityId}" class="input input-bordered input-sm">
                </div>
            </div>
            <div class="flex justify-end gap-2">
                <button class="btn btn-ghost btn-sm" onclick="cancelAddSubtask('${parentEntityId}')">Cancel</button>
                <button class="btn btn-primary btn-sm" onclick="saveNewSubtask('${parentEntityId}')">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Add Subtask
                </button>
            </div>
        </div>
    `;
    
    // Initially hide the form
    formElement.style.display = 'none';
    
    return formElement;
}

/**
 * Populate checklist items
 * @param {Object} entity - Entity object
 */
function populateChecklistItems(entity) {
    const checklistItems = document.getElementById('checklistItems');
    if (!checklistItems || entity.type !== ENTITY_TYPES.CHECKLIST) return;
    
    checklistItems.innerHTML = '';
    
    if (entity.items && entity.items.length > 0) {
        entity.items.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'checklist-item';
            itemElement.innerHTML = `
                <input type="checkbox" ${item.completed ? 'checked' : ''} 
                       onchange="toggleChecklistItem('${entity.id}', ${index})">
                <span class="item-text ${item.completed ? 'completed' : ''}">${item.text}</span>
                <button class="btn btn-small btn-danger" onclick="removeChecklistItem('${entity.id}', ${index})">×</button>
            `;
            checklistItems.appendChild(itemElement);
        });
    } else {
        checklistItems.innerHTML = '<p class="empty-state">No items yet</p>';
    }
}

/**
 * Populate linked people section
 * @param {Object} entity - Entity object
 */
async function populateLinkedPeople(entity) {
    const linkedPeopleContainer = document.getElementById('linkedPeople');
    
    if (!linkedPeopleContainer) return;
    
    try {
        // Clear existing content
        linkedPeopleContainer.innerHTML = '';
        
        // Populate linked people
        if (entity.people && entity.people.length > 0) {
            for (const personId of entity.people) {
                const person = await window.peopleService?.getPerson(personId);
                if (person) {
                    const personElement = createLinkedPersonElement(person, entity.id);
                    linkedPeopleContainer.appendChild(personElement);
                }
            }
        } else {
            linkedPeopleContainer.innerHTML = '<p class="text-xs text-base-content/60">No people linked</p>';
        }
        
    } catch (error) {
        console.error('Failed to populate linked people:', error);
        linkedPeopleContainer.innerHTML = '<p class="text-xs text-error">Failed to load linked people</p>';
    }
}

/**
 * Create linked person element
 * @param {Object} person - Person object
 * @param {string} entityId - Entity ID
 * @returns {HTMLElement} Person element
 */
function createLinkedPersonElement(person, entityId) {
    const personElement = document.createElement('div');
    personElement.className = 'flex items-center justify-between p-2 bg-base-200 rounded';
    
    personElement.innerHTML = `
        <div class="flex items-center gap-2">
            <div class="avatar placeholder">
                <div class="bg-primary text-primary-content rounded-full w-6 h-6">
                    <span class="text-xs">${(person.name || person.title || 'P').charAt(0).toUpperCase()}</span>
                </div>
            </div>
            <span class="text-sm font-medium">${person.name || person.title || 'Unnamed'}</span>
        </div>
        <button class="btn btn-xs btn-ghost btn-circle" onclick="unlinkPersonFromEntity('${entityId}', '${person.id}')">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    `;
    
    return personElement;
}

/**
 * Populate person selector dropdown
 * @param {HTMLElement} selector - Select element
 * @param {Array} excludeIds - Person IDs to exclude (already linked)
 */
/**
 * Show people linking modal
 * @param {Object} entity - Current entity being edited
 */
async function showPeopleLinkingModal(entity) {
    const modal = document.getElementById('peopleLinkingModal');
    if (!modal) return;
    
    // Store current entity for linking
    window.currentEntityForLinking = entity;
    
    // Show modal
    modal.classList.add('modal-open');
    
    // Populate people list
    await populatePeopleSelectorModal(entity.people || []);
    
    // Setup search functionality
    setupPeopleModalSearch();
}

/**
 * Populate people selector modal
 * @param {Array} linkedIds - Array of person IDs already linked (should be pre-checked)
 */
async function populatePeopleSelectorModal(linkedIds = []) {
    const peopleSelectorList = document.getElementById('peopleSelectorList');
    if (!peopleSelectorList) return;
    
    try {
        // Get all people
        const people = await window.peopleService?.getAllPeople() || [];
        console.log('Loaded people for modal:', people);
        
        // Clear existing content
        peopleSelectorList.innerHTML = '';
        
        if (people.length === 0) {
            peopleSelectorList.innerHTML = `
                <div class="text-center py-8 text-base-content/60">
                    <p>No people found</p>
                    <p class="text-sm">Create people in the People view first</p>
                </div>
            `;
            return;
        }
        
        // Create person selection items for ALL people
        people.forEach(person => {
            const isLinked = linkedIds.includes(person.id);
            const personItem = createPersonSelectorItem(person, isLinked);
            peopleSelectorList.appendChild(personItem);
        });
        
        // Update selected people display to show currently linked
        updateSelectedPeople();
        
    } catch (error) {
        console.error('Failed to populate people selector modal:', error);
        peopleSelectorList.innerHTML = `
            <div class="alert alert-error">
                <span>Failed to load people</span>
            </div>
        `;
    }
}

/**
 * Create person selector item
 * @param {Object} person - Person object
 * @param {boolean} isLinked - Whether this person is already linked (pre-checked)
 * @returns {HTMLElement} Person selector item
 */
function createPersonSelectorItem(person, isLinked = false) {
    const personItem = document.createElement('div');
    personItem.className = 'flex items-center gap-3 p-3 rounded-lg border border-base-300 hover:bg-base-200 cursor-pointer';
    personItem.dataset.personId = person.id;
    
    const initials = (person.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    
    personItem.innerHTML = `
        <input type="checkbox" class="checkbox checkbox-primary" data-person-id="${person.id}" ${isLinked ? 'checked' : ''}>
        <div class="avatar placeholder">
            <div class="bg-primary text-primary-content rounded-full w-10 h-10">
                <span class="text-sm font-semibold">${initials}</span>
            </div>
        </div>
        <div class="flex-1">
            <div class="font-medium">${person.name || 'Unnamed'}</div>
            <div class="text-sm text-base-content/60">
                ${person.role && person.company ? `${person.role} at ${person.company}` : 
                  person.company || person.role || person.relationshipType || 'No details'}
            </div>
        </div>
        ${isLinked ? '<div class="badge badge-success badge-sm">Linked</div>' : ''}
    `;
    
    // Click handler to toggle checkbox
    personItem.addEventListener('click', (e) => {
        if (e.target.type !== 'checkbox') {
            const checkbox = personItem.querySelector('input[type="checkbox"]');
            checkbox.checked = !checkbox.checked;
            updateSelectedPeople();
        }
    });
    
    // Checkbox change handler
    const checkbox = personItem.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', updateSelectedPeople);
    
    return personItem;
}

/**
 * Update selected people display
 */
function updateSelectedPeople() {
    const selectedPeopleContainer = document.getElementById('selectedPeopleContainer');
    const selectedPeopleCount = document.getElementById('selectedPeopleCount');
    const checkboxes = document.querySelectorAll('#peopleSelectorList input[type="checkbox"]:checked');
    
    if (!selectedPeopleContainer || !selectedPeopleCount) return;
    
    selectedPeopleCount.textContent = checkboxes.length;
    selectedPeopleContainer.innerHTML = '';
    
    checkboxes.forEach(checkbox => {
        const personItem = checkbox.closest('[data-person-id]');
        if (!personItem) return; // Skip if no parent item found
        
        const personId = personItem.dataset.personId;
        const nameElement = personItem.querySelector('.font-medium');
        if (!nameElement) return; // Skip if name element not found
        
        const personName = nameElement.textContent;
        const initials = personName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        
        const selectedTag = document.createElement('div');
        selectedTag.className = 'badge badge-primary gap-2 p-3';
        selectedTag.dataset.personId = personId;
        selectedTag.innerHTML = `
            <div class="avatar placeholder">
                <div class="bg-primary-content text-primary rounded-full w-5 h-5">
                    <span class="text-xs">${initials}</span>
                </div>
            </div>
            <span>${personName}</span>
            <button class="btn btn-xs btn-ghost btn-circle" onclick="removeSelectedPerson('${personId}')">✕</button>
        `;
        selectedPeopleContainer.appendChild(selectedTag);
    });
}

/**
 * Remove selected person from selection
 * @param {string} personId - Person ID to remove
 */
function removeSelectedPerson(personId) {
    // Uncheck the checkbox in the people list
    const checkbox = document.querySelector(`#peopleSelectorList input[data-person-id="${personId}"]`);
    if (checkbox) {
        checkbox.checked = false;
    }
    
    // Update the selected people display
    updateSelectedPeople();
}

/**
 * Setup people modal search functionality
 */
function setupPeopleModalSearch() {
    const searchInput = document.getElementById('peopleSearchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const personItems = document.querySelectorAll('#peopleSelectorList [data-person-id]');
        
        personItems.forEach(item => {
            const name = item.querySelector('.font-medium').textContent.toLowerCase();
            const details = item.querySelector('.text-base-content\\/60').textContent.toLowerCase();
            const matches = name.includes(searchTerm) || details.includes(searchTerm);
            item.style.display = matches ? 'flex' : 'none';
        });
    });
    
    // Clear search when modal is opened
    searchInput.value = '';
}

/**
 * Duplicate current entity
 */
async function duplicateCurrentEntity() {
    if (!currentEditingEntity) {
        showStatusMessage('No entity selected for duplication', 'warning');
        return;
    }
    
    try {
        const { createEntity } = await import('./entity-core.js');
        
        // Create a copy of the entity data
        const entityData = { ...currentEditingEntity };
        delete entityData.id;
        delete entityData.createdAt;
        delete entityData.updatedAt;
        
        // Add " (Copy)" to the title if it exists
        if (entityData.title) {
            entityData.title = `${entityData.title} (Copy)`;
        }
        if (entityData.name) {
            entityData.name = `${entityData.name} (Copy)`;
        }
        
        // Create the duplicate entity
        const duplicatedEntity = await createEntity(currentEditingEntity.type, entityData);
        
        if (duplicatedEntity) {
            showStatusMessage(`${currentEditingEntity.type.charAt(0).toUpperCase() + currentEditingEntity.type.slice(1)} duplicated successfully`, 'success');
            
            // Refresh the current view to show the new entity
            if (window.renderBoard) window.renderBoard();
            if (window.populateTaskView) window.populateTaskView();
            if (window.renderWeeklyPlan) window.renderWeeklyPlan();
            if (window.notesManager && window.notesManager.loadAllNotes) window.notesManager.loadAllNotes();
        } else {
            showStatusMessage('Failed to duplicate entity', 'error');
        }
    } catch (error) {
        console.error('Failed to duplicate entity:', error);
        showStatusMessage('Failed to duplicate entity', 'error');
    }
}

/**
 * Delete current entity
 */
async function deleteCurrentEntity() {
    if (!currentEditingEntity) {
        showStatusMessage('No entity selected for deletion', 'warning');
        return;
    }
    
    const entityTitle = currentEditingEntity.title || currentEditingEntity.name || 'this entity';
    const entityType = currentEditingEntity.type.charAt(0).toUpperCase() + currentEditingEntity.type.slice(1);
    
    if (confirm(`Are you sure you want to delete ${entityType} "${entityTitle}"?\n\nThis action cannot be undone and will remove it from all contexts (boards, weekly plans, etc.).`)) {
        try {
            const { deleteEntity } = await import('./entity-core.js');
            
            const success = await deleteEntity(currentEditingEntity.id);
            
            if (success) {
                showStatusMessage(`${entityType} deleted successfully`, 'success');
                
                // Close any open modals
                const modal = document.querySelector('.modal-open');
                if (modal) {
                    modal.classList.remove('modal-open');
                }
                
                // Refresh all views to remove the deleted entity
                if (window.renderBoard) window.renderBoard();
                if (window.populateTaskView) window.populateTaskView();
                if (window.renderWeeklyPlan) window.renderWeeklyPlan();
                if (window.notesManager && window.notesManager.loadAllNotes) window.notesManager.loadAllNotes();
                
                // Clear current editing entity
                currentEditingEntity = null;
            } else {
                showStatusMessage('Failed to delete entity', 'error');
            }
        } catch (error) {
            console.error('Failed to delete entity:', error);
            showStatusMessage('Failed to delete entity', 'error');
        }
    }
}

/**
 * Show add subtask form
 */
function addSubtaskToEntity() {
    // Get the current entity ID from currentEditingEntity
    if (!currentEditingEntity) {
        console.error('No current editing entity found');
        return;
    }
    
    const entityId = currentEditingEntity.id;
    const formContainer = document.getElementById('addSubtaskFormContainer');
    const addSubtaskBtn = document.querySelector('[data-action="addSubtask"]');
    
    if (!formContainer) {
        console.error('Add subtask form container not found');
        return;
    }
    
    // Clear any existing form
    formContainer.innerHTML = '';
    
    // Create the form and insert it into the dedicated container
    const formElement = createAddSubtaskForm(entityId);
    formContainer.appendChild(formElement);
    
    // Show the container and hide the button
    formContainer.style.display = 'block';
    if (addSubtaskBtn) addSubtaskBtn.style.display = 'none';
    
    // Show the form itself
    formElement.style.display = 'block';
    
    // Focus on title input
    const titleInput = document.getElementById(`newSubtaskTitle-${entityId}`);
    if (titleInput) {
        titleInput.focus();
    }
    
    console.log('✅ Subtask form displayed successfully in dedicated container');
}

async function addChecklistItemToEntity() {
    if (!currentEditingEntity) {
        showStatusMessage('No entity selected', 'warning');
        return;
    }
    
    if (currentEditingEntity.type !== 'checklist') {
        showStatusMessage('This feature is only available for checklist entities', 'warning');
        return;
    }
    
    const newItem = prompt('Enter new checklist item:');
    if (!newItem || !newItem.trim()) {
        return;
    }
    
    try {
        const { updateEntity } = await import('./entity-core.js');
        
        // Add the new item to the checklist
        const currentItems = currentEditingEntity.items || [];
        const updatedItems = [...currentItems, {
            id: Date.now().toString(),
            text: newItem.trim(),
            completed: false
        }];
        
        const updatedEntity = await updateEntity(currentEditingEntity.id, {
            items: updatedItems,
            updatedAt: new Date().toISOString()
        });
        
        if (updatedEntity) {
            // Update the current editing entity
            currentEditingEntity = updatedEntity;
            showStatusMessage('Checklist item added', 'success');
            
            // Refresh views
            if (window.renderBoard) window.renderBoard();
            if (window.populateTaskView) window.populateTaskView();
            if (window.renderWeeklyPlan) window.renderWeeklyPlan();
        } else {
            showStatusMessage('Failed to add checklist item', 'error');
        }
    } catch (error) {
        console.error('Failed to add checklist item:', error);
        showStatusMessage('Failed to add checklist item', 'error');
    }
}

/**
 * Unlink entity from person
 * @param {string} entityId - Entity ID
 * @param {string} personId - Person ID
 */
async function unlinkFromPerson(entityId, personId) {
    try {
        const { removeEntityFromContext, CONTEXT_TYPES } = await import('./entity-core.js');
        const success = await removeEntityFromContext(entityId, CONTEXT_TYPES.PEOPLE, { personId });
        
        if (success) {
            showStatusMessage('Unlinked from person', 'success');
            
            // Remove the DOM element
            const peopleItem = document.querySelector(`[data-entity-id="${entityId}"][data-person-id="${personId}"]`);
            if (peopleItem) {
                peopleItem.style.opacity = '0.5';
                peopleItem.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    if (peopleItem.parentNode) {
                        peopleItem.parentNode.removeChild(peopleItem);
                    }
                }, 300);
            }
            
            // Refresh people view if available
            if (window.peopleView && typeof window.peopleView.refreshPersonDetail === 'function') {
                window.peopleView.refreshPersonDetail(personId);
            }
        } else {
            showStatusMessage('Failed to unlink from person', 'error');
        }
    } catch (error) {
        console.error('Failed to unlink from person:', error);
        showStatusMessage('Failed to unlink from person', 'error');
    }
}

/**
 * Open entity in its original context (board/weekly/etc)
 * @param {string} entityId - Entity ID
 */
async function openEntityInContext(entityId) {
    try {
        const { getEntity } = await import('./entity-core.js');
        const entity = await getEntity(entityId);
        
        if (!entity) {
            showStatusMessage('Entity not found', 'error');
            return;
        }
        
        // For now, just show the entity detail modal
        // TODO: Add logic to navigate to the entity's primary context
        await showEntityDetail(entityId);
        
    } catch (error) {
        console.error('Failed to open entity in context:', error);
        showStatusMessage('Failed to open entity', 'error');
    }
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.entityRenderer = {
        renderEntity,
        editEntity,
        showEntityDetail,
        toggleCompletion,
        closeEntityDetailModal,
        getEntityTypeIcon
    };
    
    // Make people context functions globally available
    window.unlinkFromPerson = unlinkFromPerson;
    window.openEntityInContext = openEntityInContext;
    window.linkPersonToEntity = linkPersonToEntity;
    window.unlinkPersonFromEntity = unlinkPersonFromEntity;
}

/**
 * Link a person to an entity (called from UI)
 * @param {string} entityId - Entity ID
 * @param {string} personId - Person ID
 */
async function linkPersonToEntity(entityId, personId) {
    try {
        const { addEntityToContext, CONTEXT_TYPES } = await import('./entity-core.js');
        const success = await addEntityToContext(entityId, CONTEXT_TYPES.PEOPLE, { personId });
        
        if (success) {
            showStatusMessage('Person linked successfully', 'success');
            
            // Refresh the linked people section
            const entity = await getEntity(entityId);
            if (entity) {
                await populateLinkedPeople(entity);
            }
        } else {
            showStatusMessage('Failed to link person', 'error');
        }
    } catch (error) {
        console.error('Failed to link person to entity:', error);
        showStatusMessage('Failed to link person', 'error');
    }
}

/**
 * Unlink a person from an entity (called from UI)
 * @param {string} entityId - Entity ID
 * @param {string} personId - Person ID
 */
async function unlinkPersonFromEntity(entityId, personId) {
    try {
        const { removeEntityFromContext, CONTEXT_TYPES } = await import('./entity-core.js');
        const success = await removeEntityFromContext(entityId, CONTEXT_TYPES.PEOPLE, { personId });
        
        if (success) {
            showStatusMessage('Person unlinked successfully', 'success');
            
            // Refresh the linked people section
            const entity = await getEntity(entityId);
            if (entity) {
                await populateLinkedPeople(entity);
            }
        } else {
            showStatusMessage('Failed to unlink person', 'error');
        }
    } catch (error) {
        console.error('Failed to unlink person from entity:', error);
        showStatusMessage('Failed to unlink person', 'error');
    }
}

/**
 * Show people linking modal (global function)
 */
async function showPeopleLinkingModalGlobal() {
    if (window.currentEntityForLinking) {
        await showPeopleLinkingModal(window.currentEntityForLinking);
    } else if (currentEditingEntity) {
        await showPeopleLinkingModal(currentEditingEntity);
    }
}

/**
 * Confirm people linking from modal
 */
async function confirmPeopleLinking() {
    const entity = window.currentEntityForLinking || currentEditingEntity;
    if (!entity) {
        showStatusMessage('No entity available for linking', 'error');
        return;
    }
    
    try {
        const { addEntityToContext, removeEntityFromContext, CONTEXT_TYPES } = await import('./entity-core.js');
        
        // Get current linked people and selected people
        const currentLinkedIds = entity.people || [];
        const allCheckboxes = document.querySelectorAll('#peopleSelectorList input[type="checkbox"]');
        const selectedPersonIds = Array.from(allCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.dataset.personId);
        
        // Find people to link (newly selected)
        const toLink = selectedPersonIds.filter(id => !currentLinkedIds.includes(id));
        
        // Find people to unlink (previously linked but now unchecked)
        const toUnlink = currentLinkedIds.filter(id => !selectedPersonIds.includes(id));
        
        let changes = 0;
        
        // Link new people
        for (const personId of toLink) {
            await addEntityToContext(entity.id, CONTEXT_TYPES.PEOPLE, { personId });
            changes++;
        }
        
        // Unlink removed people
        for (const personId of toUnlink) {
            await removeEntityFromContext(entity.id, CONTEXT_TYPES.PEOPLE, { personId });
            changes++;
        }
        
        if (changes === 0) {
            showStatusMessage('No changes made', 'info');
        } else {
            showStatusMessage(`Updated ${changes} people links successfully`, 'success');
        }
        
        // Close modal
        const modal = document.getElementById('peopleLinkingModal');
        if (modal) modal.classList.remove('modal-open');
        
        // Refresh the linked people section
        const updatedEntity = await getEntity(entity.id);
        if (updatedEntity) {
            await populateLinkedPeople(updatedEntity);
        }
        
    } catch (error) {
        console.error('Failed to update people links:', error);
        showStatusMessage('Failed to update people links', 'error');
    }
}

/**
 * Global subtask management functions
 */

/**
 * Toggle completion status of a subtask
 * @param {string} subtaskId - Subtask entity ID
 * @param {string} parentEntityId - Parent entity ID
 */
async function toggleSubtaskCompletion(subtaskId, parentEntityId) {
    try {
        const { toggleEntityCompletion, getEntity } = await import('./entity-core.js');
        
        const subtask = await toggleEntityCompletion(subtaskId);
        if (subtask) {
            showStatusMessage(`Subtask ${subtask.completed ? 'completed' : 'marked incomplete'}`, 'success');
            
            // Refresh the subtasks display
            const parentEntity = await getEntity(parentEntityId);
            if (parentEntity && currentEditingEntity?.id === parentEntityId) {
                await populateSubtasks(parentEntity);
            }
            
            // Update any board displays showing progress
            refreshEntityDisplays(parentEntityId);
        }
    } catch (error) {
        console.error('Failed to toggle subtask completion:', error);
        showStatusMessage('Failed to update subtask', 'error');
    }
}

/**
 * Save a new subtask
 * @param {string} parentEntityId - Parent entity ID
 */
async function saveNewSubtask(parentEntityId) {
    try {
        const titleInput = document.getElementById(`newSubtaskTitle-${parentEntityId}`);
        const contentInput = document.getElementById(`newSubtaskContent-${parentEntityId}`);
        const prioritySelect = document.getElementById(`newSubtaskPriority-${parentEntityId}`);
        const dueDateInput = document.getElementById(`newSubtaskDueDate-${parentEntityId}`);
        
        if (!titleInput || !titleInput.value.trim()) {
            showStatusMessage('Please enter a subtask title', 'warning');
            if (titleInput) titleInput.focus();
            return;
        }
        
        const subtaskData = {
            title: titleInput.value.trim(),
            content: contentInput?.value.trim() || '',
            priority: prioritySelect?.value || 'medium',
            dueDate: dueDateInput?.value || null
        };
        
        const { addSubtask, getEntity } = await import('./entity-core.js');
        
        const subtask = await addSubtask(parentEntityId, subtaskData);
        if (subtask) {
            showStatusMessage('Subtask added successfully', 'success');
            
            // Clear form
            if (titleInput) titleInput.value = '';
            if (contentInput) contentInput.value = '';
            if (prioritySelect) prioritySelect.value = 'medium';
            if (dueDateInput) dueDateInput.value = '';
            
            // Hide form
            cancelAddSubtask(parentEntityId);
            
            // Refresh the subtasks display
            const parentEntity = await getEntity(parentEntityId);
            if (parentEntity && currentEditingEntity?.id === parentEntityId) {
                await populateSubtasks(parentEntity);
            }
            
            // Update any board displays showing progress
            refreshEntityDisplays(parentEntityId);
        }
    } catch (error) {
        console.error('Failed to save subtask:', error);
        showStatusMessage('Failed to add subtask', 'error');
    }
}

/**
 * Cancel adding a new subtask
 */
function cancelAddSubtask(parentEntityId) {
    // If no parentEntityId provided, get from currentEditingEntity
    if (!parentEntityId && currentEditingEntity) {
        parentEntityId = currentEditingEntity.id;
    }
    
    if (!parentEntityId) {
        console.error('No parent entity ID available for cancelAddSubtask');
        return;
    }
    
    const formContainer = document.getElementById('addSubtaskFormContainer');
    const addSubtaskBtn = document.querySelector('[data-action="addSubtask"]');
    
    // Hide the form container and show the button
    if (formContainer) formContainer.style.display = 'none';
    if (addSubtaskBtn) addSubtaskBtn.style.display = 'inline-flex';
    
    // Clear the form container
    if (formContainer) formContainer.innerHTML = '';
    
    console.log('✅ Subtask form cancelled and container cleared');
}

/**
 * Edit a subtask (opens entity detail modal)
 * @param {string} subtaskId - Subtask entity ID
 * @param {string} parentEntityId - Parent entity ID
 */
async function editSubtask(subtaskId, parentEntityId) {
    try {
        await showEntityDetail(subtaskId);
    } catch (error) {
        console.error('Failed to edit subtask:', error);
        showStatusMessage('Failed to open subtask for editing', 'error');
    }
}

/**
 * Move subtask to top level (make independent)
 * @param {string} subtaskId - Subtask entity ID
 * @param {string} parentEntityId - Parent entity ID
 */
async function moveSubtaskToTopLevel(subtaskId, parentEntityId) {
    try {
        const { moveSubtask, getEntity } = await import('./entity-core.js');
        
        if (confirm('Make this subtask an independent task?')) {
            const success = await moveSubtask(subtaskId, null); // null makes it independent
            
            if (success) {
                showStatusMessage('Subtask moved to top level', 'success');
                
                // Refresh the subtasks display
                const parentEntity = await getEntity(parentEntityId);
                if (parentEntity && currentEditingEntity?.id === parentEntityId) {
                    await populateSubtasks(parentEntity);
                }
                
                // Update any board displays
                refreshEntityDisplays(parentEntityId);
            }
        }
    } catch (error) {
        console.error('Failed to move subtask:', error);
        showStatusMessage('Failed to move subtask', 'error');
    }
}

/**
 * Delete a subtask
 * @param {string} subtaskId - Subtask entity ID
 * @param {string} parentEntityId - Parent entity ID
 */
async function deleteSubtask(subtaskId, parentEntityId) {
    try {
        const { deleteSubtask: deleteSubtaskCore, getEntity } = await import('./entity-core.js');
        
        if (confirm('Are you sure you want to delete this subtask?')) {
            const success = await deleteSubtaskCore(subtaskId);
            
            if (success) {
                showStatusMessage('Subtask deleted', 'success');
                
                // Refresh the subtasks display
                const parentEntity = await getEntity(parentEntityId);
                if (parentEntity && currentEditingEntity?.id === parentEntityId) {
                    await populateSubtasks(parentEntity);
                }
                
                // Update any board displays
                refreshEntityDisplays(parentEntityId);
            }
        }
    } catch (error) {
        console.error('Failed to delete subtask:', error);
        showStatusMessage('Failed to delete subtask', 'error');
    }
}

/**
 * Add a subtask to a weekly plan
 * @param {string} parentEntityId - Parent task entity ID
 * @param {string} weekKey - Week key
 * @param {string} day - Day of the week
 */
async function addSubtaskToWeekly(parentEntityId, weekKey, day) {
    try {
        // Import the entity core and weekly planning modules
        const { addSubtask } = await import('./entity-core.js');
        const { getCurrentWeekKey, addEntityToWeeklyPlan } = await import('./weekly-planning.js');
        
        // Create a modal for subtask details
        const modal = document.createElement('div');
        modal.className = 'modal modal-open';
        modal.innerHTML = `
            <div class="modal-box">
                <h3 class="font-bold text-lg">Add Subtask to Weekly Plan</h3>
                <form id="weeklySubtaskForm" class="space-y-4 mt-4">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Subtask Title *</span>
                        </label>
                        <input type="text" id="subtaskTitle" class="input input-bordered" placeholder="Enter subtask title" required>
                    </div>
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Description</span>
                        </label>
                        <textarea id="subtaskDescription" class="textarea textarea-bordered" placeholder="Optional description"></textarea>
                    </div>
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Priority</span>
                        </label>
                        <select id="subtaskPriority" class="select select-bordered">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Due Date</span>
                        </label>
                        <input type="date" id="subtaskDueDate" class="input input-bordered">
                    </div>
                    <div class="modal-action">
                        <button type="button" class="btn btn-ghost" onclick="closeWeeklySubtaskModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Add to Weekly Plan</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Focus the title input
        const titleInput = modal.querySelector('#subtaskTitle');
        if (titleInput) titleInput.focus();
        
        // Handle form submission
        const form = modal.querySelector('#weeklySubtaskForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const title = modal.querySelector('#subtaskTitle').value.trim();
                const description = modal.querySelector('#subtaskDescription').value.trim();
                const priority = modal.querySelector('#subtaskPriority').value;
                const dueDate = modal.querySelector('#subtaskDueDate').value || null;
                
                if (!title) {
                    showStatusMessage('Please enter a subtask title', 'error');
                    return;
                }
                
                // Create the subtask entity
                const subtaskEntity = await addSubtask(parentEntityId, {
                    title,
                    content: description,
                    priority,
                    dueDate
                });
                
                // Add to weekly plan
                await addEntityToWeeklyPlan(subtaskEntity.id, weekKey, day);
                
                // Close modal and refresh weekly view
                closeWeeklySubtaskModal();
                showStatusMessage('Subtask added to weekly plan successfully', 'success');
                
                // Refresh weekly planning view
                if (window.renderWeeklyPlan) {
                    window.renderWeeklyPlan();
                }
                
            } catch (error) {
                console.error('Failed to add subtask to weekly plan:', error);
                showStatusMessage('Failed to add subtask', 'error');
            }
        });
        
        // Handle Escape key
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeWeeklySubtaskModal();
            }
        });
        
        // Make close function available globally
        window.closeWeeklySubtaskModal = () => {
            modal.remove();
            delete window.closeWeeklySubtaskModal;
        };
        
    } catch (error) {
        console.error('Failed to create weekly subtask modal:', error);
        showStatusMessage('Failed to open subtask creation form', 'error');
    }
}

/**
 * Remove an entity from weekly plan
 * @param {string} entityId - Entity ID to remove
 * @param {string} weekKey - Week key
 */
async function removeFromWeekly(entityId, weekKey) {
    try {
        // Import the weekly planning module
        const { removeEntityFromWeeklyPlan } = await import('./weekly-planning.js');
        
        // Confirm removal
        if (confirm('Remove this item from the weekly plan?')) {
            await removeEntityFromWeeklyPlan(entityId, weekKey);
            showStatusMessage('Item removed from weekly plan', 'success');
            
            // Refresh weekly planning view
            if (window.renderWeeklyPlan) {
                window.renderWeeklyPlan();
            }
        }
        
    } catch (error) {
        console.error('Failed to remove from weekly plan:', error);
        showStatusMessage('Failed to remove item', 'error');
    }
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.entityRenderer = {
        ...window.entityRenderer,
        showPeopleLinkingModal: showPeopleLinkingModalGlobal,
        confirmPeopleLinking,
        updateSelectedPeople,
        setupPeopleModalSearch,
        removeSelectedPerson,
        addSubtaskToEntity,
        toggleSubtaskCompletion,
        saveNewSubtask,
        cancelAddSubtask,
        editSubtask,
        moveSubtaskToTopLevel,
        deleteSubtask,
        addSubtaskToWeekly,
        removeFromWeekly
    };
    
    // Individual global functions for backward compatibility
    window.showPeopleLinkingModal = showPeopleLinkingModalGlobal;
    window.confirmPeopleLinking = confirmPeopleLinking;
    window.updateSelectedPeople = updateSelectedPeople;
    window.removeSelectedPerson = removeSelectedPerson;
    
    // Subtask management functions
    window.addSubtaskToEntity = addSubtaskToEntity;
    window.addSubtask = addSubtaskToEntity; // Alias for the button data-action
    window.toggleSubtaskCompletion = toggleSubtaskCompletion;
    window.saveNewSubtask = saveNewSubtask;
    window.cancelAddSubtask = cancelAddSubtask;
    window.editSubtask = editSubtask;
    window.moveSubtaskToTopLevel = moveSubtaskToTopLevel;
    window.deleteSubtask = deleteSubtask;
    window.addSubtaskToWeekly = addSubtaskToWeekly;
    window.removeFromWeekly = removeFromWeekly;
    window.populateSubtasks = populateSubtasks; // Expose for subtask-management.js
}

