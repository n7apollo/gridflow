/**
 * GridFlow - Subtask Management Module
 * Handles all subtask operations including creation, editing, deletion, completion toggling,
 * and form management for the subtask system within cards
 */

import { saveData } from './core-data.js';
import { showStatusMessage } from './utilities.js';

/**
 * Show the add subtask form
 * DEPRECATED: Use addSubtaskToEntity from entity-renderer.js instead
 */
/*
export function showAddSubtaskForm() {
    // Get the current entity being edited
    const currentEntity = window.currentEditingEntity;
    if (!currentEntity) {
        console.warn('No current entity found for showAddSubtaskForm');
        return;
    }
    
    const entityId = currentEntity.id;
    const form = document.getElementById(`addSubtaskForm-${entityId}`);
    const input = document.getElementById(`newSubtaskTitle-${entityId}`);
    const button = document.querySelector('[data-action="addSubtask"]');
    
    if (form && input && button) {
        form.style.display = 'block';
        button.style.display = 'none';
        input.value = '';
        input.focus();
    } else {
        console.warn('Add subtask elements not found:', {
            entityId,
            formExists: !!form,
            inputExists: !!input,
            buttonExists: !!button
        });
    }
}
*/

/**
 * Hide the add subtask form  
 * DEPRECATED: Use cancelAddSubtask from entity-renderer.js instead
 */
/*
export function hideAddSubtaskForm() {
    // Get the current entity being edited
    const currentEntity = window.currentEditingEntity;
    if (!currentEntity) {
        console.warn('No current entity found for hideAddSubtaskForm');
        return;
    }
    
    const entityId = currentEntity.id;
    const form = document.getElementById(`addSubtaskForm-${entityId}`);
    const button = document.querySelector('[data-action="addSubtask"]');
    
    if (form) form.style.display = 'none';
    if (button) button.style.display = 'inline-flex';
}
*/

/**
 * Save a new subtask to the current detail card
 * DEPRECATED: Use the saveNewSubtask function from entity-renderer.js instead
 */
// export async function saveNewSubtask() {
//     const currentEntity = window.currentEditingEntity;
//     if (!currentEntity) {
//         console.warn('No current entity found for saveNewSubtask');
//         return;
//     }
//     
//     const entityId = currentEntity.id;
//     const input = document.getElementById(`newSubtaskTitle-${entityId}`);
//     if (!input) {
//         console.warn('Subtask input not found:', `newSubtaskTitle-${entityId}`);
//         return;
//     }
//     
//     const text = input.value.trim();
//     
//     if (!text) {
//         input.focus();
//         return;
//     }
//     
//     try {
//         // Import necessary functions from entity-core
//         const { createEntity, ENTITY_TYPES } = await import('./entity-core.js');
//         
//         // Create new task entity using proper entity system
//         const subtaskData = {
//             title: text,
//             content: '',
//             completed: false,
//             dueDate: null,
//             priority: 'medium',
//             tags: []
//         };
//         
//         const subtaskId = createEntity(ENTITY_TYPES.TASK, subtaskData);
//         
//         if (subtaskId) {
//             // Add subtask to current entity's subtasks
//             if (!currentEntity.subtasks) {
//                 currentEntity.subtasks = [];
//             }
//             currentEntity.subtasks.push(subtaskId);
//             
//             // Update the entity
//             const { updateEntity } = await import('./entity-core.js');
//             updateEntity(currentEntity.id, { subtasks: currentEntity.subtasks });
//             
//             console.log('✅ Subtask created successfully:', subtaskId);
//             
//             // Clear form and hide it
//             input.value = '';
//             hideAddSubtaskForm();
//             
//             // Refresh the subtasks display
//             // Note: populateSubtasks expects an entity object, not just an ID
//             // We need to refresh by re-populating from the updated entity
//             const { getEntity } = await import('./entity-core.js');
//             const updatedEntity = await getEntity(currentEntity.id);
//             if (updatedEntity && window.populateSubtasks) {
//                 window.populateSubtasks(updatedEntity);
//             }
//             
//             // Show success message
//             if (window.showStatusMessage) {
//                 window.showStatusMessage('Subtask added successfully', 'success');
//             }
//         } else {
//             console.error('Failed to create subtask');
//             if (window.showStatusMessage) {
//                 window.showStatusMessage('Failed to create subtask', 'error');
//             }
//         }
//     } catch (error) {
//         console.error('Error saving subtask:', error);
//         if (window.showStatusMessage) {
//             window.showStatusMessage('Error saving subtask', 'error');
//         }
//     }
// }

/**
 * Start editing a subtask inline
 * @param {string} taskId - The ID of the task to edit
 */
export function startEditSubtask(taskId) {
    const subtaskItem = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!subtaskItem) return;
    
    const content = subtaskItem.querySelector('.subtask-content');
    const editForm = subtaskItem.querySelector('.subtask-edit-form');
    const actions = subtaskItem.querySelector('.subtask-actions');
    const editInput = subtaskItem.querySelector('.subtask-edit-input');
    
    content.style.display = 'none';
    actions.style.display = 'none';
    editForm.style.display = 'block';
    editInput.focus();
    editInput.select();
    
    // Handle enter/escape keys
    editInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEditSubtask(taskId);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEditSubtask(taskId);
        }
    };
}

/**
 * Save the edited subtask
 * @param {string} taskId - The ID of the task to save
 */
export function saveEditSubtask(taskId) {
    if (!window.currentDetailCard || !window.appData.entities.tasks[taskId]) return;
    
    const subtaskItem = document.querySelector(`[data-task-id="${taskId}"]`);
    const editInput = subtaskItem.querySelector('.subtask-edit-input');
    const newText = editInput.value.trim();
    
    if (!newText) {
        editInput.focus();
        return;
    }
    
    window.appData.entities.tasks[taskId].text = newText;
    window.appData.entities.tasks[taskId].updatedAt = new Date().toISOString();
    
    saveData();
    if (window.renderSubtasks) window.renderSubtasks();
    if (window.renderBoard) window.renderBoard(); // Update progress on cards
}

/**
 * Cancel editing a subtask and restore original view
 * @param {string} taskId - The ID of the task being edited
 */
export function cancelEditSubtask(taskId) {
    const subtaskItem = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!subtaskItem) return;
    
    const content = subtaskItem.querySelector('.subtask-content');
    const editForm = subtaskItem.querySelector('.subtask-edit-form');
    const actions = subtaskItem.querySelector('.subtask-actions');
    
    editForm.style.display = 'none';
    content.style.display = 'flex';
    actions.style.display = 'flex';
}

/**
 * Delete a subtask with confirmation
 * @param {string} taskId - The ID of the task to delete
 */
export function deleteSubtask(taskId) {
    if (!window.currentDetailCard || !window.appData.entities.tasks[taskId]) return;
    
    if (confirm('Are you sure you want to delete this subtask?')) {
        // Remove from task entities
        delete window.appData.entities.tasks[taskId];
        
        // Remove from card's taskIds
        const taskIds = window.currentDetailCard.card.taskIds || [];
        const index = taskIds.indexOf(taskId);
        if (index > -1) {
            taskIds.splice(index, 1);
        }
        
        // Remove from relationship mapping
        const cardId = window.currentDetailCard.card.id.toString();
        if (window.appData.relationships.entityTasks[cardId]) {
            const relIndex = window.appData.relationships.entityTasks[cardId].indexOf(taskId);
            if (relIndex > -1) {
                window.appData.relationships.entityTasks[cardId].splice(relIndex, 1);
            }
        }
        
        saveData();
        if (window.renderSubtasks) window.renderSubtasks();
        if (window.renderBoard) window.renderBoard(); // Update progress on cards
    }
}

/**
 * Toggle the completion status of a subtask
 * @param {string} taskId - The ID of the task to toggle
 */
export function toggleSubtask(taskId) {
    if (!window.currentDetailCard || !window.appData.entities.tasks[taskId]) return;
    
    window.appData.entities.tasks[taskId].completed = !window.appData.entities.tasks[taskId].completed;
    window.appData.entities.tasks[taskId].updatedAt = new Date().toISOString();
    
    saveData();
    if (window.renderSubtasks) window.renderSubtasks();
    if (window.renderBoard) window.renderBoard(); // Update progress on cards
}

// Make functions available globally for backward compatibility
// window.showAddSubtaskForm = showAddSubtaskForm; // Commented out - use addSubtaskToEntity from entity-renderer.js
// window.hideAddSubtaskForm = hideAddSubtaskForm; // Commented out - use cancelAddSubtask from entity-renderer.js
// Note: saveNewSubtask is handled by entity-renderer.js for the new entity system
window.startEditSubtask = startEditSubtask;
window.saveEditSubtask = saveEditSubtask;
window.cancelEditSubtask = cancelEditSubtask;
window.deleteSubtask = deleteSubtask;
window.toggleSubtask = toggleSubtask;