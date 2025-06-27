/**
 * Group Operations Module
 * 
 * Handles all group-related CRUD operations including:
 * - Creating, editing, deleting groups
 * - Group positioning and reordering (moveGroupUp, moveGroupDown)
 * - Group collapse/expand functionality
 * - Group list rendering for management interfaces
 * - Group modal management
 * 
 * Dependencies:
 * - appData, boardData from core-data.js
 * - saveData from core-data.js
 * - showStatusMessage from utilities.js
 * - renderBoard from main board rendering system
 */

// Import dependencies
import { appData, boardData, saveData } from './core-data.js';
import { showStatusMessage } from './utilities.js';

// Global state for group editing
let currentEditingGroup = null;

/**
 * Add a new group to the board
 * Opens the group modal for creating a new group
 */
function addGroup() {
    currentEditingGroup = null;
    
    const modalTitle = document.getElementById('groupModalTitle');
    const groupName = document.getElementById('groupName');
    const groupColor = document.getElementById('groupColor');
    const groupModal = document.getElementById('groupModal');
    
    if (modalTitle) modalTitle.textContent = 'Add Group';
    if (groupName) groupName.value = '';
    if (groupColor) groupColor.value = '#0079bf';
    if (groupModal) groupModal.classList.add('modal-open');
}

/**
 * Edit an existing group
 * Opens the group modal with the group's current data
 * @param {number} groupId - The ID of the group to edit
 */
function editGroup(groupId) {
    const group = boardData.groups.find(g => g.id === groupId);
    if (!group) return;
    
    currentEditingGroup = group;
    document.getElementById('groupModalTitle').textContent = 'Edit Group';
    document.getElementById('groupName').value = group.name;
    document.getElementById('groupColor').value = group.color;
    document.getElementById('groupModal').classList.add('modal-open');
}

/**
 * Save group changes (create new or update existing)
 * Handles both creation and editing of groups
 * @param {Event} event - Form submission event
 */
function saveGroup(event) {
    event.preventDefault();
    const groupNameElement = document.getElementById('groupName');
    const groupColorElement = document.getElementById('groupColor');
    
    if (!groupNameElement || !groupColorElement) return;
    
    const name = groupNameElement.value.trim();
    const color = groupColorElement.value;
    
    if (!name) return;
    
    if (currentEditingGroup) {
        currentEditingGroup.name = name;
        currentEditingGroup.color = color;
    } else {
        const newGroup = {
            id: boardData.nextGroupId++,
            name: name,
            color: color,
            collapsed: false
        };
        boardData.groups.push(newGroup);
    }
    
    closeGroupModal();
    if (window.renderBoard) window.renderBoard();
    renderGroupsList();
    renderGroupsListModal();
    saveData();
}

/**
 * Delete a group and handle associated rows
 * Moves all rows in the group to "No Group" before deletion
 * @param {number} groupId - The ID of the group to delete
 */
function deleteGroup(groupId) {
    const group = boardData.groups.find(g => g.id === groupId);
    if (!group) return;
    
    const groupRows = boardData.rows.filter(r => r.groupId === groupId);
    const message = groupRows.length > 0 
        ? `Are you sure you want to delete "${group.name}"? ${groupRows.length} rows will be moved to "No Group".`
        : `Are you sure you want to delete "${group.name}"?`;
    
    if (confirm(message)) {
        // Move rows out of group
        groupRows.forEach(row => {
            row.groupId = null;
        });
        
        // Remove group
        boardData.groups = boardData.groups.filter(g => g.id !== groupId);
        if (window.renderBoard) window.renderBoard();
        renderGroupsList();
        renderGroupsListModal();
        saveData();
    }
}

/**
 * Move a group to a specific position in the groups array
 * @param {number} groupId - The ID of the group to move
 * @param {number} insertIndex - The index where to insert the group
 */
function moveGroup(groupId, insertIndex) {
    const groupIndex = boardData.groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return;
    
    const group = boardData.groups.splice(groupIndex, 1)[0];
    boardData.groups.splice(insertIndex, 0, group);
    
    if (window.renderBoard) window.renderBoard();
    saveData();
}

/**
 * Move a group up one position in the list
 * @param {number} index - The current index of the group
 */
function moveGroupUp(index) {
    if (index <= 0) return;
    
    const group = boardData.groups.splice(index, 1)[0];
    boardData.groups.splice(index - 1, 0, group);
    
    if (window.renderBoard) window.renderBoard();
    renderGroupsList();
    renderGroupsListModal();
    saveData();
}

/**
 * Move a group down one position in the list
 * @param {number} index - The current index of the group
 */
function moveGroupDown(index) {
    if (index >= boardData.groups.length - 1) return;
    
    const group = boardData.groups.splice(index, 1)[0];
    boardData.groups.splice(index + 1, 0, group);
    
    if (window.renderBoard) window.renderBoard();
    renderGroupsList();
    renderGroupsListModal();
    saveData();
}

/**
 * Toggle the collapsed/expanded state of a group
 * @param {number} groupId - The ID of the group to toggle
 */
function toggleGroup(groupId) {
    const group = boardData.groups.find(g => g.id === groupId);
    if (group) {
        group.collapsed = !group.collapsed;
        if (window.renderBoard) window.renderBoard();
        saveData();
    }
}

/**
 * Close the group modal and reset editing state
 */
function closeGroupModal() {
    const groupModal = document.getElementById('groupModal');
    if (groupModal) groupModal.classList.remove('modal-open');
    currentEditingGroup = null;
}

/**
 * Render the groups list in the settings modal
 * Shows all groups with edit/delete/reorder controls
 */
function renderGroupsListModal() {
    const container = document.getElementById('groupsListModal');
    if (!container) return;
    
    container.innerHTML = '';
    
    boardData.groups.forEach((group, index) => {
        const item = document.createElement('div');
        item.className = 'group-item';
        item.style.borderLeftColor = group.color;
        item.innerHTML = `
            <span class="group-item-name">${group.name}</span>
            <div class="group-item-actions">
                <div class="reorder-controls">
                    <button class="reorder-btn" onclick="moveGroupUp(${index})" ${index === 0 ? 'disabled' : ''} title="Move up">↑</button>
                    <button class="reorder-btn" onclick="moveGroupDown(${index})" ${index === boardData.groups.length - 1 ? 'disabled' : ''} title="Move down">↓</button>
                </div>
                <button class="btn btn-small btn-secondary" onclick="editGroup(${group.id})">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteGroup(${group.id})">Delete</button>
            </div>
        `;
        container.appendChild(item);
    });
}

/**
 * Render the groups list in the main interface
 * Shows all groups with edit/delete/reorder controls
 */
function renderGroupsList() {
    const container = document.getElementById('groupsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    boardData.groups.forEach((group, index) => {
        const item = document.createElement('div');
        item.className = 'group-item';
        item.style.borderLeftColor = group.color;
        item.innerHTML = `
            <span class="group-item-name">${group.name}</span>
            <div class="group-item-actions">
                <div class="reorder-controls">
                    <button class="reorder-btn" onclick="moveGroupUp(${index})" ${index === 0 ? 'disabled' : ''} title="Move up">↑</button>
                    <button class="reorder-btn" onclick="moveGroupDown(${index})" ${index === boardData.groups.length - 1 ? 'disabled' : ''} title="Move down">↓</button>
                </div>
                <button class="btn btn-small btn-secondary" onclick="editGroup(${group.id})">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteGroup(${group.id})">Delete</button>
            </div>
        `;
        container.appendChild(item);
    });
}

// Export functions for module system
export {
    addGroup,
    editGroup,
    saveGroup,
    deleteGroup,
    moveGroup,
    moveGroupUp,
    moveGroupDown,
    toggleGroup,
    closeGroupModal,
    renderGroupsList,
    renderGroupsListModal
};

// Make functions available globally for backward compatibility
window.addGroup = addGroup;
window.editGroup = editGroup;
window.saveGroup = saveGroup;
window.deleteGroup = deleteGroup;
window.moveGroup = moveGroup;
window.moveGroupUp = moveGroupUp;
window.moveGroupDown = moveGroupDown;
window.toggleGroup = toggleGroup;
window.closeGroupModal = closeGroupModal;
window.renderGroupsList = renderGroupsList;
window.renderGroupsListModal = renderGroupsListModal;