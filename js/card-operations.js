/**
 * GridFlow - Card Operations Module
 * Handles all card CRUD operations, modal management, and card-related functionality
 * Updated for unified entity system
 */

import { appData, boardData, saveData } from './core-data.js';
import { showStatusMessage } from './utilities.js';
import { createEntity, getEntity, updateEntity, deleteEntity, ENTITY_TYPES } from './entity-core.js';

// Current editing state
let currentEditingCard = null;
let currentDetailCard = null;

/**
 * Toggle card completion status
 * @param {string} entityId - ID of the entity to toggle
 * @param {number} rowId - ID of the row containing the card
 * @param {string} columnKey - Key of the column containing the card
 */
export async function toggleCardCompletion(entityId, rowId, columnKey) {
    const entity = await getEntity(entityId);
    if (!entity) {
        console.warn('Entity not found for toggle:', entityId);
        return;
    }
    
    // Update entity completion status
    updateEntity(entityId, { completed: !entity.completed });
    
    // Re-render board to reflect changes
    if (window.renderBoard) window.renderBoard();
}

/**
 * Open card modal for creating or editing a card
 * @param {number} rowId - ID of the row
 * @param {string} columnKey - Key of the column
 * @param {string|null} entityId - ID of the entity to edit (null for new card)
 */
export async function openCardModal(rowId, columnKey, entityId = null) {
    const row = boardData.rows.find(r => r.id === rowId);
    if (!row) return;
    
    if (entityId) {
        // Editing existing card/entity
        const entity = await getEntity(entityId);
        if (!entity) {
            console.warn('Entity not found for editing:', entityId);
            return;
        }
        
        currentEditingCard = { ...entity, rowId, columnKey, entityId };
        const modalTitle = document.getElementById('modalTitle');
        const cardTitle = document.getElementById('cardTitle');
        const cardDescription = document.getElementById('cardDescription');
        const cardCompleted = document.getElementById('cardCompleted');
        const cardDueDate = document.getElementById('cardDueDate');
        const cardPriority = document.getElementById('cardPriority');
        
        if (modalTitle) modalTitle.textContent = 'Edit Card';
        if (cardTitle) cardTitle.value = entity.title || '';
        if (cardDescription) cardDescription.value = entity.content || '';
        if (cardCompleted) cardCompleted.checked = entity.completed || false;
        if (cardDueDate) cardDueDate.value = entity.dueDate || '';
        if (cardPriority) cardPriority.value = entity.priority || 'medium';
    } else {
        // Creating new card
        currentEditingCard = { rowId, columnKey, entityId: null };
        const modalTitle = document.getElementById('modalTitle');
        const cardTitle = document.getElementById('cardTitle');
        const cardDescription = document.getElementById('cardDescription');
        const cardCompleted = document.getElementById('cardCompleted');
        const cardDueDate = document.getElementById('cardDueDate');
        const cardPriority = document.getElementById('cardPriority');
        
        if (modalTitle) modalTitle.textContent = 'Add Card';
        if (cardTitle) cardTitle.value = '';
        if (cardDescription) cardDescription.value = '';
        if (cardCompleted) cardCompleted.checked = false;
        if (cardDueDate) cardDueDate.value = '';
        if (cardPriority) cardPriority.value = 'medium';
    }
    
    const cardModal = document.getElementById('cardModal');
    if (cardModal) cardModal.classList.add('modal-open');
}

/**
 * Edit an existing card
 * @param {string} entityId - ID of the entity to edit
 * @param {number} rowId - ID of the row containing the card
 * @param {string} columnKey - Key of the column containing the card
 */
export function editCard(entityId, rowId, columnKey) {
    openCardModal(rowId, columnKey, entityId);
}

/**
 * Delete a card with all associated data
 * @param {string} entityId - ID of the entity to delete
 * @param {number} rowId - ID of the row containing the card
 * @param {string} columnKey - Key of the column containing the card
 */
export function deleteCard(entityId, rowId, columnKey) {
    if (confirm('Are you sure you want to delete this card?')) {
        const row = boardData.rows.find(r => r.id === rowId);
        if (!row || !row.cards[columnKey]) {
            console.warn('Row or column not found for deletion');
            return;
        }
        
        // Remove entity ID from board structure
        row.cards[columnKey] = row.cards[columnKey].filter(id => id !== entityId);
        
        // Delete the entity itself (this handles all cleanup)
        const success = deleteEntity(entityId);
        
        if (success) {
            saveData();
            if (window.renderBoard) window.renderBoard();
            showStatusMessage('Card deleted successfully', 'success');
        } else {
            // Re-add the entity ID if deletion failed
            row.cards[columnKey].push(entityId);
            showStatusMessage('Failed to delete card', 'error');
        }
    }
}

/**
 * Save card data from the modal form
 * @param {Event} event - Form submit event
 */
export function saveCard(event) {
    event.preventDefault();
    const title = document.getElementById('cardTitle').value.trim();
    const description = document.getElementById('cardDescription').value.trim();
    const completed = document.getElementById('cardCompleted').checked;
    const dueDate = document.getElementById('cardDueDate').value || null;
    const priority = document.getElementById('cardPriority').value;
    
    if (!title) {
        showStatusMessage('Please enter a title', 'error');
        return;
    }
    
    const row = boardData.rows.find(r => r.id === currentEditingCard.rowId);
    if (!row) {
        showStatusMessage('Row not found', 'error');
        return;
    }
    
    if (currentEditingCard.entityId) {
        // Edit existing entity
        const success = updateEntity(currentEditingCard.entityId, {
            title: title,
            content: description,
            completed: completed,
            dueDate: dueDate,
            priority: priority
        });
        
        if (success) {
            showStatusMessage('Card updated successfully', 'success');
        } else {
            showStatusMessage('Failed to update card', 'error');
            return;
        }
    } else {
        // Create new entity
        const entityData = {
            title: title,
            content: description,
            completed: completed,
            dueDate: dueDate,
            priority: priority
        };
        
        const entityId = createEntity(ENTITY_TYPES.TASK, entityData);
        if (entityId) {
            // Add entity ID to board structure
            if (!row.cards[currentEditingCard.columnKey]) {
                row.cards[currentEditingCard.columnKey] = [];
            }
            row.cards[currentEditingCard.columnKey].push(entityId);
            showStatusMessage('Card created successfully', 'success');
        } else {
            showStatusMessage('Failed to create card', 'error');
            return;
        }
    }
    
    saveData();
    if (window.closeModal) window.closeModal();
    if (window.renderBoard) window.renderBoard();
}

/**
 * Show detailed card modal with all card information
 * @param {number} cardId - ID of the card to show
 * @param {number} rowId - ID of the row containing the card
 * @param {string} columnKey - Key of the column containing the card
 */
export function showCardDetailModal(cardId, rowId, columnKey) {
    const row = boardData.rows.find(r => r.id === rowId);
    if (!row) return;
    
    const card = row.cards[columnKey].find(c => c.id === cardId);
    if (!card) return;
    
    const column = boardData.columns.find(c => c.key === columnKey);
    if (!column) return;
    
    // Store current card reference
    currentDetailCard = { card, rowId, columnKey };
    
    // Ensure taskIds array exists for new entity system
    if (!card.taskIds) card.taskIds = [];
    
    // Backward compatibility: if old subtasks exist, convert them
    if (card.subtasks && card.subtasks.length > 0 && card.taskIds.length === 0) {
        if (window.migrateCardSubtasksToEntities) {
            window.migrateCardSubtasksToEntities({ boards: { [appData.currentBoardId]: boardData } });
            // Refresh reference after migration
            const currentBoard = appData.boards[appData.currentBoardId];
            if (currentBoard) {
                Object.assign(boardData, currentBoard);
            }
            saveData(); // persist migration
        }
    }
    
    // Find group information
    const group = row.groupId ? boardData.groups.find(g => g.id === row.groupId) : null;
    
    // Populate modal content
    const titleEl = document.getElementById('cardDetailTitle');
    const descEl = document.getElementById('cardDetailDescription');
    const groupEl = document.getElementById('cardDetailGroup');
    if (titleEl) titleEl.textContent = card.title;
    if (descEl) descEl.textContent = card.description || 'No description provided';
    if (groupEl) groupEl.textContent = group ? group.name : 'No Group';
    document.getElementById('cardDetailRow').textContent = row.name;
    document.getElementById('cardDetailColumn').textContent = column.name;
    
    // Update status badge
    const statusElement = document.getElementById('cardDetailCompletionStatus');
    if (card.completed) {
        statusElement.textContent = 'Completed';
        statusElement.className = 'status-badge completed';
    } else {
        statusElement.textContent = 'Pending';
        statusElement.className = 'status-badge pending';
    }
    
    // Set up action buttons
    const editBtn = document.getElementById('editCardFromDetailBtn');
    const deleteBtn = document.getElementById('deleteCardFromDetailBtn');
    
    editBtn.onclick = () => {
        closeCardDetailModal();
        editCard(cardId, rowId, columnKey);
    };
    
    deleteBtn.onclick = () => {
        closeCardDetailModal();
        deleteCard(cardId, rowId, columnKey);
    };
    
    // Setup add subtask button and form
    const addSubtaskBtn = document.getElementById('addSubtaskBtn');
    const saveSubtaskBtn = document.getElementById('saveSubtaskBtn');
    const cancelSubtaskBtn = document.getElementById('cancelSubtaskBtn');
    const newSubtaskInput = document.getElementById('newSubtaskInput');
    
    if (addSubtaskBtn) addSubtaskBtn.onclick = () => window.showAddSubtaskForm && window.showAddSubtaskForm();
    if (saveSubtaskBtn) saveSubtaskBtn.onclick = () => window.saveNewSubtask && window.saveNewSubtask();
    if (cancelSubtaskBtn) cancelSubtaskBtn.onclick = () => window.hideAddSubtaskForm && window.hideAddSubtaskForm();
    
    // Handle enter key in input
    if (newSubtaskInput) {
        newSubtaskInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (window.saveNewSubtask) window.saveNewSubtask();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                if (window.hideAddSubtaskForm) window.hideAddSubtaskForm();
            }
        };
    }
    
    // Render subtasks
    if (window.renderSubtasks) window.renderSubtasks();
    
    // Show modal
    document.getElementById('cardDetailModal').classList.add('modal-open');
}

/**
 * Close the card detail modal
 */
export function closeCardDetailModal() {
    document.getElementById('cardDetailModal').classList.remove('modal-open');
    
    // Hide add subtask form if it's open
    if (window.hideAddSubtaskForm) window.hideAddSubtaskForm();
    
    currentDetailCard = null;
}

/**
 * Populate card options for dropdowns (used in weekly planning)
 */
export function populateCardOptions() {
    const boardSelect = document.getElementById('cardBoardSelect');
    const cardSelect = document.getElementById('cardSelect');
    
    if (!boardSelect || !cardSelect) return;
    
    // Populate boards
    boardSelect.innerHTML = '';
    Object.keys(appData.boards).forEach(boardId => {
        const option = document.createElement('option');
        option.value = boardId;
        option.textContent = appData.boards[boardId].name;
        boardSelect.appendChild(option);
    });
    
    // Trigger card update
    updateCardOptions();
}

/**
 * Update card options based on selected board
 */
export function updateCardOptions() {
    const boardSelect = document.getElementById('cardBoardSelect');
    const cardSelect = document.getElementById('cardSelect');
    
    if (!boardSelect || !cardSelect) return;
    
    const selectedBoardId = boardSelect.value;
    
    cardSelect.innerHTML = '<option value="">Select a card...</option>';
    
    if (!selectedBoardId) return;
    
    const board = appData.boards[selectedBoardId];
    if (!board) return;
    
    board.rows.forEach(row => {
        Object.keys(row.cards).forEach(columnKey => {
            row.cards[columnKey].forEach(card => {
                const option = document.createElement('option');
                option.value = `${selectedBoardId}|${card.id}`;
                option.textContent = `${card.title} (${row.name})`;
                cardSelect.appendChild(option);
            });
        });
    });
}

// Export current editing state getters for external access
export function getCurrentEditingCard() {
    return currentEditingCard;
}

export function getCurrentDetailCard() {
    return currentDetailCard;
}

export function setCurrentEditingCard(card) {
    currentEditingCard = card;
}

export function setCurrentDetailCard(card) {
    currentDetailCard = card;
}

// Window assignments for backward compatibility
window.toggleCardCompletion = toggleCardCompletion;
window.openCardModal = openCardModal;
window.editCard = editCard;
window.deleteCard = deleteCard;
window.saveCard = saveCard;
window.showCardDetailModal = showCardDetailModal;
window.closeCardDetailModal = closeCardDetailModal;
window.populateCardOptions = populateCardOptions;
window.updateCardOptions = updateCardOptions;

// Export current state access for backward compatibility
window.getCurrentEditingCard = getCurrentEditingCard;
window.getCurrentDetailCard = getCurrentDetailCard;
window.setCurrentEditingCard = setCurrentEditingCard;
window.setCurrentDetailCard = setCurrentDetailCard;