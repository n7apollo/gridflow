/**
 * GridFlow - Unified Entity Renderer
 * 
 * This module handles rendering entities in different contexts (board cards, 
 * weekly items, task list items) while maintaining consistent behavior and
 * appearance based on entity type.
 */

import { getEntity, updateEntity, toggleEntityCompletion, ENTITY_TYPES, CONTEXT_TYPES } from './entity-core.js';
import { showStatusMessage } from './utilities.js';

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
    cardElement.className = `card ${entity.type}-card ${entity.completed ? 'completed' : ''}`;
    cardElement.dataset.entityId = entity.id;
    cardElement.draggable = true;
    
    // Build card content based on entity type
    let cardContent = '';
    
    // Common header for all card types
    cardContent += `
        <div class="card-header">
            <div class="card-title-row">
                <h3 class="card-title">${entity.title || 'Untitled'}</h3>
                ${entity.completed ? '<span class="completion-badge">✓</span>' : ''}
            </div>
            ${getEntityTypeIcon(entity.type)}
        </div>
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
            cardContent += `<div class="card-content">${entity.content}</div>`;
    }
    
    // Common footer with actions
    cardContent += `
        <div class="card-actions">
            <button class="btn btn-small" onclick="entityRenderer.editEntity('${entity.id}')">Edit</button>
            <button class="btn btn-small ${entity.completed ? 'btn-secondary' : 'btn-primary'}" 
                    onclick="entityRenderer.toggleCompletion('${entity.id}')">
                ${entity.completed ? 'Mark Incomplete' : 'Mark Complete'}
            </button>
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
        content += `<div class="card-description">${entity.content}</div>`;
    }
    
    content += '<div class="task-metadata">';
    
    if (entity.priority && entity.priority !== 'medium') {
        content += `<span class="priority-badge priority-${entity.priority}">${entity.priority}</span>`;
    }
    
    if (entity.dueDate) {
        content += `<span class="due-date">Due: ${formatDate(entity.dueDate)}</span>`;
    }
    
    if (entity.subtasks && entity.subtasks.length > 0) {
        const completedSubtasks = entity.subtasks.filter(st => st.completed).length;
        content += `<span class="subtasks">${completedSubtasks}/${entity.subtasks.length} subtasks</span>`;
    }
    
    content += '</div>';
    
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
    
    // Add click handler for card selection
    cardElement.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
            return; // Don't handle card click if button/input was clicked
        }
        
        // Highlight selected card
        document.querySelectorAll('.card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        cardElement.classList.add('selected');
    });
}

/**
 * Edit entity (opens appropriate modal)
 */
export function editEntity(entityId) {
    const entity = getEntity(entityId);
    if (!entity) return;
    
    // TODO: Open entity edit modal
    // For now, use simple prompt
    const newTitle = prompt(`Edit ${entity.type} title:`, entity.title);
    if (newTitle !== null && newTitle.trim()) {
        updateEntity(entityId, { title: newTitle.trim() });
        showStatusMessage(`${entity.type} updated`, 'success');
        
        // Refresh UI
        refreshEntityDisplays(entityId);
    }
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
    // TODO: Implement removeEntityFromContext
    console.log('Remove from weekly:', entityId, weekKey);
    showStatusMessage('Removed from weekly plan', 'success');
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
function getContextDataFromElement() {
    // TODO: Extract context data from DOM
    return {};
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.entityRenderer = {
        renderEntity,
        editEntity,
        toggleCompletion,
        removeFromWeekly
    };
}

