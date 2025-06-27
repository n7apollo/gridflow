/**
 * GridFlow - Entity Synchronization System
 * 
 * Handles automatic synchronization of entity changes across all contexts
 * (boards, weekly planning, task lists) to maintain consistency.
 */

import { CONTEXT_TYPES } from './entity-core.js';
import { renderEntity } from './entity-renderer.js';

/**
 * Initialize entity synchronization system
 */
export function initializeEntitySync() {
    // Listen for entity update events
    if (typeof window !== 'undefined') {
        window.addEventListener('entityUpdated', handleEntityUpdate);
        window.addEventListener('entityDeleted', handleEntityDelete);
        window.addEventListener('entityCreated', handleEntityCreate);
        
        console.log('Entity synchronization system initialized');
    }
}

/**
 * Handle entity update events
 * @param {CustomEvent} event - Entity update event
 */
function handleEntityUpdate(event) {
    const { entityId } = event.detail;
    console.log('Synchronizing entity update across all contexts:', entityId);
    
    // Find all DOM elements displaying this entity
    const elements = document.querySelectorAll(`[data-entity-id="${entityId}"]`);
    
    elements.forEach(element => {
        try {
            const contextType = getContextTypeFromElement(element);
            const contextData = getContextDataFromElement(element);
            
            // Re-render the entity in its current context
            const newElement = renderEntity(entityId, contextType, contextData);
            
            if (newElement) {
                // Preserve important attributes
                preserveElementState(element, newElement);
                
                // Replace the old element
                element.parentNode.replaceChild(newElement, element);
                
                console.log(`Updated entity ${entityId} in ${contextType} context`);
            }
        } catch (error) {
            console.error('Failed to update entity display:', entityId, error);
        }
    });
    
    // Update any summary displays (progress bars, counts, etc.)
    updateSummaryDisplays(entityId);
}

/**
 * Handle entity deletion events
 * @param {CustomEvent} event - Entity delete event
 */
function handleEntityDelete(event) {
    const { entityId } = event.detail;
    console.log('Removing deleted entity from all contexts:', entityId);
    
    // Find and remove all DOM elements displaying this entity
    const elements = document.querySelectorAll(`[data-entity-id="${entityId}"]`);
    
    elements.forEach(element => {
        // Add fade-out animation before removal
        element.style.opacity = '0.5';
        element.style.transition = 'opacity 0.3s ease';
        
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
                console.log(`Removed deleted entity ${entityId} from DOM`);
            }
        }, 300);
    });
    
    // Update summary displays
    updateSummaryDisplays(entityId);
}

/**
 * Handle entity creation events
 * @param {CustomEvent} event - Entity create event
 */
function handleEntityCreate(event) {
    const { entityId, contextType, contextData } = event.detail;
    console.log('Adding new entity to context:', entityId, contextType);
    
    // This is typically handled by the specific context's add function
    // but we can trigger a refresh of relevant containers
    refreshContextContainers(contextType, contextData);
}

/**
 * Determine context type from DOM element
 * @param {HTMLElement} element - DOM element
 * @returns {string} Context type
 */
function getContextTypeFromElement(element) {
    // Check parent containers to determine context
    if (element.closest('.board-container') || element.closest('.rows-container')) {
        return CONTEXT_TYPES.BOARD;
    }
    
    if (element.closest('.weekly-container') || element.closest('.daily-planning-grid')) {
        return CONTEXT_TYPES.WEEKLY;
    }
    
    if (element.closest('.task-container') || element.closest('.task-list')) {
        return CONTEXT_TYPES.TASK_LIST;
    }
    
    // Default fallback
    return CONTEXT_TYPES.BOARD;
}

/**
 * Extract context data from DOM element
 * @param {HTMLElement} element - DOM element
 * @returns {Object} Context data
 */
function getContextDataFromElement(element) {
    const contextData = {};
    
    // Extract data attributes
    if (element.dataset.boardId) contextData.boardId = element.dataset.boardId;
    if (element.dataset.rowId) contextData.rowId = element.dataset.rowId;
    if (element.dataset.columnKey) contextData.columnKey = element.dataset.columnKey;
    if (element.dataset.weekKey) contextData.weekKey = element.dataset.weekKey;
    if (element.dataset.day) contextData.day = element.dataset.day;
    if (element.dataset.weeklyItemId) contextData.weeklyItemId = element.dataset.weeklyItemId;
    
    // Try to determine from DOM structure
    const boardContainer = element.closest('[data-board-id]');
    if (boardContainer) {
        contextData.boardId = boardContainer.dataset.boardId;
    }
    
    const weeklyContainer = element.closest('[data-week-key]');
    if (weeklyContainer) {
        contextData.weekKey = weeklyContainer.dataset.weekKey;
    }
    
    const dayColumn = element.closest('[data-day]');
    if (dayColumn) {
        contextData.day = dayColumn.dataset.day;
    }
    
    return contextData;
}

/**
 * Preserve important element state when replacing
 * @param {HTMLElement} oldElement - Old element
 * @param {HTMLElement} newElement - New element
 */
function preserveElementState(oldElement, newElement) {
    // Preserve selection state
    if (oldElement.classList.contains('selected')) {
        newElement.classList.add('selected');
    }
    
    // Preserve expanded/collapsed state
    if (oldElement.classList.contains('expanded')) {
        newElement.classList.add('expanded');
    }
    
    if (oldElement.classList.contains('collapsed')) {
        newElement.classList.add('collapsed');
    }
    
    // Preserve drag state
    if (oldElement.classList.contains('dragging')) {
        newElement.classList.add('dragging');
    }
    
    // Copy over any important data attributes
    ['cardId', 'rowId', 'columnKey', 'itemId', 'entityId', 'day'].forEach(attr => {
        if (oldElement.dataset[attr]) {
            newElement.dataset[attr] = oldElement.dataset[attr];
        }
    });
}

/**
 * Update summary displays that might be affected by entity changes
 * @param {string} entityId - Entity ID that was changed
 */
function updateSummaryDisplays(entityId) {
    // Update weekly progress bars
    updateWeeklyProgress();
    
    // Update board column counts
    updateBoardColumnCounts();
    
    // Update task list filters
    updateTaskListCounts();
    
    // Update any progress indicators
    updateProgressIndicators();
}

/**
 * Update weekly progress displays
 */
function updateWeeklyProgress() {
    if (typeof window.weeklyPlanning?.updateWeekProgress === 'function') {
        window.weeklyPlanning.updateWeekProgress();
    }
}

/**
 * Update board column counts
 */
function updateBoardColumnCounts() {
    // Update column headers with card counts
    const columnHeaders = document.querySelectorAll('.column-header');
    columnHeaders.forEach(header => {
        const columnKey = header.dataset.columnKey;
        if (columnKey) {
            const columnCards = document.querySelectorAll(`[data-column-key="${columnKey}"] .card`);
            const countElement = header.querySelector('.column-count');
            if (countElement) {
                countElement.textContent = columnCards.length;
            }
        }
    });
}

/**
 * Update task list counts
 */
function updateTaskListCounts() {
    // Update filter counts in task view
    const taskItems = document.querySelectorAll('.task-item');
    const completedTasks = document.querySelectorAll('.task-item.completed');
    
    // Update summary if elements exist
    const totalCount = document.getElementById('totalTaskCount');
    if (totalCount) {
        totalCount.textContent = taskItems.length;
    }
    
    const completedCount = document.getElementById('completedTaskCount');
    if (completedCount) {
        completedCount.textContent = completedTasks.length;
    }
}

/**
 * Update progress indicators
 */
function updateProgressIndicators() {
    // Update any progress bars, completion percentages, etc.
    const progressBars = document.querySelectorAll('.progress-bar');
    progressBars.forEach(progressBar => {
        // This would need specific logic based on what the progress bar represents
        // For now, just trigger a refresh if there's an update function
        const container = progressBar.closest('[data-update-function]');
        if (container && container.dataset.updateFunction) {
            const updateFunction = window[container.dataset.updateFunction];
            if (typeof updateFunction === 'function') {
                updateFunction();
            }
        }
    });
}

/**
 * Refresh containers for a specific context
 * @param {string} contextType - Context type
 * @param {Object} contextData - Context data
 */
function refreshContextContainers(contextType, contextData) {
    switch (contextType) {
        case CONTEXT_TYPES.BOARD:
            // Refresh board rendering
            if (typeof window.renderBoard === 'function') {
                window.renderBoard();
            }
            break;
            
        case CONTEXT_TYPES.WEEKLY:
            // Refresh weekly planning
            if (typeof window.weeklyPlanning?.renderWeeklyItems === 'function') {
                window.weeklyPlanning.renderWeeklyItems();
            }
            break;
            
        case CONTEXT_TYPES.TASK_LIST:
            // Refresh task list
            if (typeof window.taskManagement?.renderTaskList === 'function') {
                window.taskManagement.renderTaskList();
            }
            break;
    }
}

/**
 * Trigger entity update event
 * @param {string} entityId - Entity ID
 * @param {Object} changes - Changes made to entity
 */
export function triggerEntityUpdate(entityId, changes = {}) {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('entityUpdated', {
            detail: { entityId, changes }
        }));
    }
}

/**
 * Trigger entity deletion event
 * @param {string} entityId - Entity ID
 */
export function triggerEntityDelete(entityId) {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('entityDeleted', {
            detail: { entityId }
        }));
    }
}

/**
 * Trigger entity creation event
 * @param {string} entityId - Entity ID
 * @param {string} contextType - Context where entity was created
 * @param {Object} contextData - Context data
 */
export function triggerEntityCreate(entityId, contextType, contextData = {}) {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('entityCreated', {
            detail: { entityId, contextType, contextData }
        }));
    }
}

/**
 * Force refresh of all entity displays
 * Useful for debugging or after major data changes
 */
export function refreshAllEntityDisplays() {
    console.log('Refreshing all entity displays...');
    
    // Get all entities currently displayed
    const entityElements = document.querySelectorAll('[data-entity-id]');
    const entityIds = new Set();
    
    entityElements.forEach(element => {
        const entityId = element.dataset.entityId;
        if (entityId) {
            entityIds.add(entityId);
        }
    });
    
    // Trigger update for each unique entity
    entityIds.forEach(entityId => {
        triggerEntityUpdate(entityId);
    });
    
    console.log(`Refreshed ${entityIds.size} unique entities`);
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
    window.entitySync = {
        initializeEntitySync,
        triggerEntityUpdate,
        triggerEntityDelete,
        triggerEntityCreate,
        refreshAllEntityDisplays
    };
}