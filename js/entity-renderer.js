/**
 * GridFlow - Unified Entity Renderer
 * 
 * This module handles rendering entities in different contexts (board cards, 
 * weekly items, task list items) while maintaining consistent behavior and
 * appearance based on entity type.
 */

import { getEntity, updateEntity, toggleEntityCompletion, removeEntityFromContext, ENTITY_TYPES, CONTEXT_TYPES } from './entity-core.js';
import { showStatusMessage } from './utilities.js';

// Global variable to track entity being edited
let currentEditingEntity = null;

/**
 * Render an entity in a specific context
 * @param {string} entityId - Entity ID
 * @param {string} contextType - Context type (board, weekly, task_list)
 * @param {Object} contextData - Context-specific data
 * @returns {HTMLElement|null} Rendered element
 */
export function renderEntity(entityId, contextType, contextData = {}) {
    const entity = getEntity(entityId);
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
    cardElement.draggable = true;
    
    // Build card content based on entity type
    let cardContent = '';
    
    // Card body with DaisyUI classes
    cardContent += `
        <div class="card-body p-4">
            <!-- Card Header -->
            <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2">
                    <span class="text-lg">${getEntityTypeIcon(entity.type)}</span>
                    ${entity.completed ? '<span class="badge badge-success badge-sm">✓</span>' : ''}
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
    itemElement.className = `weekly-item ${entity.type}-item ${entity.completed ? 'completed' : ''}`;
    itemElement.dataset.entityId = entity.id;
    
    let itemContent = '';
    
    // Different rendering based on entity type
    switch (entity.type) {
        case ENTITY_TYPES.TASK:
            itemContent = `
                <div class="weekly-item-content">
                    <div class="weekly-task">
                        <input type="checkbox" ${entity.completed ? 'checked' : ''} 
                               onchange="entityRenderer.toggleCompletion('${entity.id}')">
                        <div class="task-info">
                            <span class="task-title">${entity.title}</span>
                            ${entity.priority !== 'medium' ? `<span class="priority-badge priority-${entity.priority}">${entity.priority}</span>` : ''}
                            ${entity.dueDate ? `<span class="due-date">Due: ${formatDate(entity.dueDate)}</span>` : ''}
                        </div>
                    </div>
                    ${entity.content ? `<div class="task-description">${entity.content}</div>` : ''}
                </div>
            `;
            break;
            
        case ENTITY_TYPES.NOTE:
            itemContent = `
                <div class="weekly-item-content">
                    <div class="note-content">
                        <div class="note-title">${entity.title}</div>
                        ${entity.content ? `<div class="note-text">${entity.content}</div>` : ''}
                    </div>
                </div>
            `;
            break;
            
        case ENTITY_TYPES.CHECKLIST:
            const completedCount = entity.items ? entity.items.filter(item => item.completed).length : 0;
            const totalCount = entity.items ? entity.items.length : 0;
            
            itemContent = `
                <div class="weekly-item-content">
                    <div class="checklist-summary">
                        <span class="checklist-title">${entity.title}</span>
                        <span class="checklist-progress">${completedCount}/${totalCount}</span>
                    </div>
                    ${totalCount > 0 ? `
                        <div class="checklist-progress-bar">
                            <div class="progress-fill" style="width: ${(completedCount/totalCount)*100}%"></div>
                        </div>
                    ` : ''}
                </div>
            `;
            break;
            
        default:
            itemContent = `
                <div class="weekly-item-content">
                    <div class="item-title">${entity.title}</div>
                    ${entity.content ? `<div class="item-text">${entity.content}</div>` : ''}
                </div>
            `;
    }
    
    // Add common weekly item actions
    itemContent += `
        <div class="weekly-item-actions">
            <button class="btn btn-small" onclick="entityRenderer.editEntity('${entity.id}')">Edit</button>
            <button class="btn btn-small btn-danger" onclick="entityRenderer.removeFromWeekly('${entity.id}', '${contextData.weekKey}')">Remove</button>
        </div>
    `;
    
    itemElement.innerHTML = itemContent;
    return itemElement;
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
    
    if (entity.subtasks && entity.subtasks.length > 0) {
        const completedSubtasks = entity.subtasks.filter(st => st.completed).length;
        const progress = Math.round((completedSubtasks / entity.subtasks.length) * 100);
        metadata.push(`<span class="badge badge-outline badge-sm">📋 ${completedSubtasks}/${entity.subtasks.length} (${progress}%)</span>`);
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
        content += `<div class="card-content">${entity.content}</div>`;
    }
    
    if (entity.tags && entity.tags.length > 0) {
        content += `<div class="note-tags">${entity.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>`;
    }
    
    return content;
}

/**
 * Render checklist-specific card content
 */
function renderChecklistCardContent(entity) {
    let content = '';
    
    if (entity.content) {
        content += `<div class="card-description">${entity.content}</div>`;
    }
    
    if (entity.items && entity.items.length > 0) {
        const completedItems = entity.items.filter(item => item.completed).length;
        const progress = (completedItems / entity.items.length) * 100;
        
        content += `
            <div class="checklist-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <span class="progress-text">${completedItems}/${entity.items.length} completed</span>
            </div>
        `;
        
        // Show first few items
        const previewItems = entity.items.slice(0, 3);
        content += '<ul class="checklist-preview">';
        previewItems.forEach(item => {
            content += `<li class="${item.completed ? 'completed' : ''}">${item.text}</li>`;
        });
        if (entity.items.length > 3) {
            content += `<li class="more-items">... and ${entity.items.length - 3} more</li>`;
        }
        content += '</ul>';
    }
    
    return content;
}

/**
 * Render project-specific card content
 */
function renderProjectCardContent(entity) {
    let content = '';
    
    if (entity.content) {
        content += `<div class="card-description">${entity.content}</div>`;
    }
    
    content += '<div class="project-metadata">';
    
    if (entity.status) {
        content += `<span class="status-badge status-${entity.status}">${entity.status}</span>`;
    }
    
    if (entity.startDate && entity.endDate) {
        content += `<span class="project-dates">${formatDate(entity.startDate)} - ${formatDate(entity.endDate)}</span>`;
    }
    
    if (entity.team && entity.team.length > 0) {
        content += `<span class="team-size">${entity.team.length} team members</span>`;
    }
    
    content += '</div>';
    
    return content;
}

/**
 * Get icon for entity type
 */
function getEntityTypeIcon(type) {
    const icons = {
        [ENTITY_TYPES.TASK]: '✓',
        [ENTITY_TYPES.NOTE]: '📝',
        [ENTITY_TYPES.CHECKLIST]: '☐',
        [ENTITY_TYPES.PROJECT]: '📁'
    };
    
    return `<span class="entity-type-icon">${icons[type] || '●'}</span>`;
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
 * Setup event listeners for card elements
 */
function setupCardEventListeners(cardElement, entity) {
    // Add drag and drop handlers
    cardElement.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', entity.id);
        e.dataTransfer.setData('application/x-entity-id', entity.id);
        cardElement.classList.add('dragging');
    });
    
    cardElement.addEventListener('dragend', () => {
        cardElement.classList.remove('dragging');
    });
    
    // Add click handler for card detail view
    cardElement.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
            return; // Don't handle card click if button/input was clicked
        }
        
        // Open entity detail modal
        showEntityDetail(entity.id);
    });
}

/**
 * Edit entity (opens appropriate modal)
 */
/**
 * Show comprehensive entity detail modal
 * @param {string} entityId - Entity ID to display
 */
export function showEntityDetail(entityId) {
    const entity = getEntity(entityId);
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
    
    // Populate modal with entity data
    populateEntityDetailModal(entity);
    
    // Show modal
    modal.style.display = 'block';
    
    // Add event listeners for modal interactions
    setupEntityDetailListeners();
}

/**
 * Legacy editEntity function for backward compatibility
 */
export function editEntity(entityId) {
    showEntityDetail(entityId);
}

/**
 * Set up modal for editing an entity
 * @param {HTMLElement} modal - Modal element
 * @param {Object} entity - Entity to edit
 */
function setupEntityEditModal(modal, entity) {
    currentEditingEntity = entity;
    
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
                if (originalClose) originalClose();
            };
        });
    }
    
    // Show modal
    modal.style.display = 'block';
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
    modal.style.display = 'none';
    currentEditingEntity = null;
    
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
 * Remove entity from weekly planning
 */
export function removeFromWeekly(entityId, weekKey) {
    const success = removeEntityFromContext(entityId, CONTEXT_TYPES.WEEKLY, { weekKey });
    
    if (success) {
        showStatusMessage('Removed from weekly plan', 'success');
        
        // Remove the DOM element
        const weeklyItem = document.querySelector(`[data-entity-id="${entityId}"][data-week-key="${weekKey}"]`);
        if (weeklyItem) {
            weeklyItem.style.opacity = '0.5';
            weeklyItem.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                if (weeklyItem.parentNode) {
                    weeklyItem.parentNode.removeChild(weeklyItem);
                }
            }, 300);
        }
        
        // Update weekly progress
        if (typeof window.weeklyPlanning?.updateWeekProgress === 'function') {
            window.weeklyPlanning.updateWeekProgress();
        }
    } else {
        showStatusMessage('Failed to remove from weekly plan', 'error');
    }
}

/**
 * Refresh all displays of an entity
 */
function refreshEntityDisplays(entityId) {
    // Find all elements displaying this entity and re-render them
    const elements = document.querySelectorAll(`[data-entity-id="${entityId}"]`);
    
    elements.forEach(element => {
        const contextType = getContextFromElement(element);
        const contextData = getContextDataFromElement(element);
        
        const newElement = renderEntity(entityId, contextType, contextData);
        if (newElement) {
            element.parentNode.replaceChild(newElement, element);
        }
    });
}

/**
 * Determine context type from DOM element
 */
function getContextFromElement(element) {
    if (element.closest('.board-container')) return CONTEXT_TYPES.BOARD;
    if (element.closest('.weekly-container')) return CONTEXT_TYPES.WEEKLY;
    if (element.closest('.task-container')) return CONTEXT_TYPES.TASK_LIST;
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
function populateEntityDetailModal(entity) {
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
    if (elements.icon) elements.icon.textContent = getEntityTypeIcon(entity.type);
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
    populateSubtasks(entity);
    
    // Populate checklist items if checklist
    if (entity.type === ENTITY_TYPES.CHECKLIST) {
        populateChecklistItems(entity);
    }
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
function handleEntityDetailClick(event) {
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
            addEntityToWeeklyPlan(currentEditingEntity.id);
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
    if (modal) modal.style.display = 'none';
    currentEditingEntity = null;
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
function addEntityToWeeklyPlan(entityId) {
    if (window.weeklyPlanning && window.weeklyPlanning.addEntityToCurrentWeek) {
        window.weeklyPlanning.addEntityToCurrentWeek(entityId);
        updateWeeklyPlanningStatus(getEntity(entityId));
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
 * Populate subtasks
 * @param {Object} entity - Entity object
 */
function populateSubtasks(entity) {
    const subtasksList = document.getElementById('subtasksList');
    if (!subtasksList) return;
    
    subtasksList.innerHTML = '';
    
    // This would integrate with the relationships system
    // For now, show placeholder
    subtasksList.innerHTML = '<p class="empty-state">No subtasks yet</p>';
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
 * Duplicate current entity
 */
function duplicateCurrentEntity() {
    if (!currentEditingEntity) return;
    
    // Implementation would depend on your entity creation system
    showStatusMessage('Duplicate functionality coming soon', 'info');
}

/**
 * Delete current entity
 */
function deleteCurrentEntity() {
    if (!currentEditingEntity) return;
    
    if (confirm(`Are you sure you want to delete this ${currentEditingEntity.type}?`)) {
        // Implementation would depend on your entity deletion system
        showStatusMessage('Delete functionality coming soon', 'info');
    }
}

// Placeholder functions for missing functionality
function addSubtaskToEntity() {
    showStatusMessage('Subtask functionality coming soon', 'info');
}

function addChecklistItemToEntity() {
    showStatusMessage('Add checklist item functionality coming soon', 'info');
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.entityRenderer = {
        renderEntity,
        editEntity,
        showEntityDetail,
        toggleCompletion,
        removeFromWeekly,
        closeEntityDetailModal
    };
}

