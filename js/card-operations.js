/**
 * GridFlow - Card Operations Module
 * Handles all card CRUD operations, modal management, and card-related functionality
 */

import { appData, boardData, saveData } from './core-data.js';
import { showStatusMessage } from './utilities.js';

// Current editing state
let currentEditingCard = null;
let currentDetailCard = null;

/**
 * Toggle card completion status
 * @param {number} cardId - ID of the card to toggle
 * @param {number} rowId - ID of the row containing the card
 * @param {string} columnKey - Key of the column containing the card
 */
export function toggleCardCompletion(cardId, rowId, columnKey) {
    const row = boardData.rows.find(r => r.id === rowId);
    if (!row || !row.cards[columnKey]) return;
    
    const card = row.cards[columnKey].find(c => c.id === cardId);
    if (card) {
        card.completed = !card.completed;
        if (window.renderBoard) window.renderBoard();
    }
}

/**
 * Open card modal for creating or editing a card
 * @param {number} rowId - ID of the row
 * @param {string} columnKey - Key of the column
 * @param {number|null} cardId - ID of the card to edit (null for new card)
 */
export function openCardModal(rowId, columnKey, cardId = null) {
    const row = boardData.rows.find(r => r.id === rowId);
    if (!row) return;
    
    if (cardId) {
        const card = row.cards[columnKey].find(c => c.id === cardId);
        if (!card) return;
        
        currentEditingCard = { ...card, rowId, columnKey };
        document.getElementById('modalTitle').textContent = 'Edit Card';
        document.getElementById('cardTitle').value = card.title;
        document.getElementById('cardDescription').value = card.description;
        document.getElementById('cardCompleted').checked = card.completed || false;
        document.getElementById('cardDueDate').value = card.dueDate || '';
        document.getElementById('cardPriority').value = card.priority || 'medium';
    } else {
        currentEditingCard = { rowId, columnKey };
        document.getElementById('modalTitle').textContent = 'Add Card';
        document.getElementById('cardTitle').value = '';
        document.getElementById('cardDescription').value = '';
        document.getElementById('cardCompleted').checked = false;
        document.getElementById('cardDueDate').value = '';
        document.getElementById('cardPriority').value = 'medium';
    }
    
    document.getElementById('cardModal').style.display = 'block';
}

/**
 * Edit an existing card
 * @param {number} cardId - ID of the card to edit
 * @param {number} rowId - ID of the row containing the card
 * @param {string} columnKey - Key of the column containing the card
 */
export function editCard(cardId, rowId, columnKey) {
    openCardModal(rowId, columnKey, cardId);
}

/**
 * Delete a card with all associated data
 * @param {number} cardId - ID of the card to delete
 * @param {number} rowId - ID of the row containing the card
 * @param {string} columnKey - Key of the column containing the card
 */
export function deleteCard(cardId, rowId, columnKey) {
    if (confirm('Are you sure you want to delete this card?')) {
        const row = boardData.rows.find(r => r.id === rowId);
        if (row) {
            const card = row.cards[columnKey].find(c => c.id === cardId);
            
            // Clean up task entities associated with this card
            if (card && card.taskIds) {
                card.taskIds.forEach(taskId => {
                    delete appData.entities.tasks[taskId];
                });
                
                // Clean up task relationships
                const cardKey = cardId.toString();
                delete appData.relationships.entityTasks[cardKey];
            }
            
            // Clean up notes attached to this card
            if (window.getNotesForEntity && window.deleteNote) {
                const cardNotes = window.getNotesForEntity('card', cardId);
                cardNotes.forEach(note => {
                    window.deleteNote(note.id);
                });
            }
            
            // Clean up weekly plan relationships
            const cardKey = `${appData.currentBoardId}:${cardId}`;
            if (appData.relationships && appData.relationships.cardToWeeklyPlans && appData.relationships.cardToWeeklyPlans[cardKey]) {
                const weeklyPlans = [...appData.relationships.cardToWeeklyPlans[cardKey]];
                
                // Remove card from all weekly plans
                weeklyPlans.forEach(weekKey => {
                    if (appData.weeklyPlans[weekKey] && appData.weeklyPlans[weekKey].items) {
                        appData.weeklyPlans[weekKey].items = appData.weeklyPlans[weekKey].items.filter(
                            item => !(item.type === 'card' && item.cardId == cardId && 
                                    item.boardId === appData.currentBoardId)
                        );
                    }
                    
                    // Clean up reverse relationship
                    if (appData.relationships.weeklyPlanToCards && appData.relationships.weeklyPlanToCards[weekKey]) {
                        appData.relationships.weeklyPlanToCards[weekKey] = 
                            appData.relationships.weeklyPlanToCards[weekKey].filter(key => key !== cardKey);
                        
                        if (appData.relationships.weeklyPlanToCards[weekKey].length === 0) {
                            delete appData.relationships.weeklyPlanToCards[weekKey];
                        }
                    }
                });
                
                delete appData.relationships.cardToWeeklyPlans[cardKey];
            }
            
            // Remove card from board
            row.cards[columnKey] = row.cards[columnKey].filter(c => c.id !== cardId);
            
            saveData();
            if (window.renderBoard) window.renderBoard();
            
            showStatusMessage('Card and all associated data deleted', 'success');
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
    
    if (!title) return;
    
    const row = boardData.rows.find(r => r.id === currentEditingCard.rowId);
    if (!row) return;
    
    if (currentEditingCard.id) {
        // Edit existing card
        const card = row.cards[currentEditingCard.columnKey].find(c => c.id === currentEditingCard.id);
        if (card) {
            card.title = title;
            card.description = description;
            card.completed = completed;
            card.dueDate = dueDate;
            card.priority = priority;
        }
    } else {
        // Add new card
        const newCard = {
            id: boardData.nextCardId++,
            title: title,
            description: description,
            completed: completed,
            taskIds: [],
            dueDate: dueDate,
            priority: priority
        };
        row.cards[currentEditingCard.columnKey].push(newCard);
    }
    
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
    document.getElementById('cardDetailTitle').textContent = card.title;
    document.getElementById('cardDetailDescription').textContent = card.description || 'No description provided';
    document.getElementById('cardDetailGroup').textContent = group ? group.name : 'No Group';
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
    document.getElementById('cardDetailModal').style.display = 'block';
}

/**
 * Close the card detail modal
 */
export function closeCardDetailModal() {
    document.getElementById('cardDetailModal').style.display = 'none';
    
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