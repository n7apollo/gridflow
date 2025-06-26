/**
 * GridFlow - Subtask Management Module
 * Handles all subtask operations including creation, editing, deletion, completion toggling,
 * and form management for the subtask system within cards
 */

import { saveData } from './core-data.js';
import { showStatusMessage } from './utilities.js';

/**
 * Show the add subtask form
 */
export function showAddSubtaskForm() {
    const form = document.getElementById('addSubtaskForm');
    const input = document.getElementById('newSubtaskInput');
    const button = document.getElementById('addSubtaskBtn');
    
    form.style.display = 'block';
    button.style.display = 'none';
    input.value = '';
    input.focus();
}

/**
 * Hide the add subtask form
 */
export function hideAddSubtaskForm() {
    const form = document.getElementById('addSubtaskForm');
    const button = document.getElementById('addSubtaskBtn');
    
    if (form) form.style.display = 'none';
    if (button) button.style.display = 'inline-block';
}

/**
 * Save a new subtask to the current detail card
 */
export function saveNewSubtask() {
    if (!window.currentDetailCard) return;
    
    const input = document.getElementById('newSubtaskInput');
    const text = input.value.trim();
    
    if (!text) {
        input.focus();
        return;
    }
    
    // Create new task entity
    const taskId = `task_${window.appData.nextTaskId++}`;
    window.appData.entities.tasks[taskId] = {
        id: taskId,
        text: text,
        completed: false,
        dueDate: null,
        priority: 'medium',
        parentType: 'card',
        parentId: window.currentDetailCard.card.id.toString(),
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Add task to card's taskIds
    if (!window.currentDetailCard.card.taskIds) {
        window.currentDetailCard.card.taskIds = [];
    }
    window.currentDetailCard.card.taskIds.push(taskId);
    
    // Update relationship mapping
    const cardId = window.currentDetailCard.card.id.toString();
    if (!window.appData.relationships.entityTasks[cardId]) {
        window.appData.relationships.entityTasks[cardId] = [];
    }
    window.appData.relationships.entityTasks[cardId].push(taskId);
    
    saveData();
    hideAddSubtaskForm();
    if (window.renderSubtasks) window.renderSubtasks();
    if (window.renderBoard) window.renderBoard(); // Update progress on cards
}

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
window.showAddSubtaskForm = showAddSubtaskForm;
window.hideAddSubtaskForm = hideAddSubtaskForm;
window.saveNewSubtask = saveNewSubtask;
window.startEditSubtask = startEditSubtask;
window.saveEditSubtask = saveEditSubtask;
window.cancelEditSubtask = cancelEditSubtask;
window.deleteSubtask = deleteSubtask;
window.toggleSubtask = toggleSubtask;