/**
 * GridFlow - Drag and Drop Module
 * Handles all drag and drop functionality using SortableJS for cards, rows, and columns
 */

import { saveData, appData, boardData } from './core-data.js';
import { entityService } from './entity-service.js';
import { showStatusMessage } from './utilities.js';

/**
 * Initialize sorting for all card containers on the board
 * Sets up SortableJS for both desktop and mobile layouts
 */
export function initializeAllSorting() {
    // Initialize sorting for all cards containers (desktop)
    document.querySelectorAll('.cards-container').forEach(cardsContainer => {
        const rowId = parseInt(cardsContainer.dataset.rowId);
        const columnKey = cardsContainer.dataset.columnKey;
        if (rowId && columnKey) {
            setupColumnSorting(cardsContainer, rowId, columnKey);
        }
    });
    
    // Initialize sorting for all mobile column content (mobile)
    document.querySelectorAll('.mobile-column-content').forEach(mobileColumn => {
        const rowId = parseInt(mobileColumn.dataset.rowId);
        const columnKey = mobileColumn.dataset.columnKey;
        if (rowId && columnKey) {
            setupColumnSorting(mobileColumn, rowId, columnKey);
        }
    });
}

/**
 * Setup SortableJS for a specific column/cards container
 * @param {HTMLElement} cardsContainer - The container element for cards
 * @param {number} rowId - The row ID this container belongs to
 * @param {string} columnKey - The column key this container belongs to
 */
export function setupColumnSorting(cardsContainer, rowId, columnKey) {
    new Sortable(cardsContainer, {
        group: {
            name: 'cards',
            pull: true,
            put: true
        },
        animation: 150,
        ghostClass: 'card-ghost',
        chosenClass: 'card-chosen',
        dragClass: 'card-drag',
        onEnd: function(evt) {
            console.log('Drag event item:', evt.item);
            console.log('Item dataset:', evt.item.dataset);
            console.log('Item classList:', evt.item.classList.toString());
            
            const cardId = evt.item.dataset.cardId; // Keep as string (entity ID)
            const fromRowId = parseInt(evt.from.dataset.rowId);
            const fromColumnKey = evt.from.dataset.columnKey;
            const toRowId = parseInt(evt.to.dataset.rowId);
            const toColumnKey = evt.to.dataset.columnKey;
            
            console.log('Card moved:', cardId, 'from', fromRowId, fromColumnKey, 'to', toRowId, toColumnKey);
            
            if (fromRowId !== toRowId || fromColumnKey !== toColumnKey) {
                moveCardBetweenRows(cardId, fromRowId, fromColumnKey, toRowId, toColumnKey);
            } else {
                // Just reorder within same column
                reorderCardsInColumn(toRowId, toColumnKey, evt.newIndex, evt.oldIndex);
            }
        }
    });
}

/**
 * Setup SortableJS for row sorting within a container
 * @param {HTMLElement} container - The container element for rows
 */
export function setupRowSorting(container) {
    new Sortable(container, {
        group: 'rows',
        animation: 150,
        ghostClass: 'row-ghost',
        chosenClass: 'row-chosen',
        dragClass: 'row-drag',
        handle: '.row-label',
        onEnd: function(evt) {
            const rowId = parseInt(evt.item.dataset.rowId);
            console.log('Row moved:', rowId, 'from index', evt.oldIndex, 'to index', evt.newIndex);
            
            // Reorder rows in data structure
            const movedRow = boardData.rows.splice(evt.oldIndex, 1)[0];
            boardData.rows.splice(evt.newIndex, 0, movedRow);
            
            saveData();
        }
    });
}

/**
 * Move a card within the same row between columns
 * @param {number} cardId - ID of the card to move
 * @param {number} rowId - ID of the row containing the card
 * @param {string} fromColumn - Source column key
 * @param {string} toColumn - Destination column key
 */
export function moveCard(cardId, rowId, fromColumn, toColumn) {
    const row = boardData.rows.find(r => r.id === rowId);
    if (!row) return;
    
    const cardIndex = row.cards[fromColumn].findIndex(entityId => entityId === cardId);
    if (cardIndex === -1) return;
    
    const entityId = row.cards[fromColumn].splice(cardIndex, 1)[0];
    row.cards[toColumn].push(entityId);
    
    // Update entity position in database
    const newOrder = row.cards[toColumn].length - 1; // Last position
    const boardId = appData.currentBoardId || 'default';
    entityService.setPosition(entityId, boardId, 'board', rowId, toColumn, newOrder)
        .catch(error => console.error('Failed to update entity position:', error));
    
    // Save changes to database
    saveData();
    
    // Re-render the board to reflect changes
    if (window.renderBoard) {
        window.renderBoard();
    }
}

/**
 * Move a card between different rows and columns
 * @param {number} cardId - ID of the card to move
 * @param {number} fromRowId - Source row ID
 * @param {string} fromColumn - Source column key
 * @param {number} toRowId - Destination row ID
 * @param {string} toColumn - Destination column key
 */
export function moveCardBetweenRows(cardId, fromRowId, fromColumn, toRowId, toColumn) {
    const fromRow = boardData.rows.find(r => r.id === fromRowId);
    const toRow = boardData.rows.find(r => r.id === toRowId);
    
    if (!fromRow || !toRow) {
        console.error('Row not found:', fromRowId, toRowId);
        return;
    }
    
    // Find and remove card from source (cards are now entity IDs)
    const cardIndex = fromRow.cards[fromColumn].findIndex(entityId => entityId === cardId);
    if (cardIndex === -1) {
        console.error('Card not found in source:', cardId, fromColumn);
        return;
    }
    
    const entityId = fromRow.cards[fromColumn].splice(cardIndex, 1)[0];
    
    // Ensure target column exists
    if (!toRow.cards[toColumn]) {
        toRow.cards[toColumn] = [];
    }
    
    // Add card to destination
    toRow.cards[toColumn].push(entityId);
    
    console.log('Moved card', cardId, 'from row', fromRowId, 'to row', toRowId);
    
    // Update entity position in database
    const newOrder = toRow.cards[toColumn].length - 1; // Last position
    const boardId = appData.currentBoardId || 'default';
    entityService.setPosition(entityId, boardId, 'board', toRowId, toColumn, newOrder)
        .catch(error => console.error('Failed to update entity position:', error));
    
    // Save changes to database
    saveData();
    
    // Re-render the board to reflect changes
    if (window.renderBoard) {
        window.renderBoard();
    }
}

/**
 * Reorder cards within the same column
 * @param {number} rowId - ID of the row containing the cards
 * @param {string} columnKey - Column key where reordering occurs
 * @param {number} newIndex - New position index
 * @param {number} oldIndex - Original position index
 */
export function reorderCardsInColumn(rowId, columnKey, newIndex, oldIndex) {
    const row = boardData.rows.find(r => r.id === rowId);
    if (!row || !row.cards[columnKey]) return;
    
    const cards = row.cards[columnKey];
    const movedEntityId = cards.splice(oldIndex, 1)[0];
    cards.splice(newIndex, 0, movedEntityId);
    
    // Update entity position in database with new order
    const boardId = appData.currentBoardId || 'default';
    entityService.setPosition(movedEntityId, boardId, 'board', rowId, columnKey, newIndex)
        .catch(error => console.error('Failed to update entity position:', error));
    
    saveData();
}

// Make functions available globally for backward compatibility
window.initializeAllSorting = initializeAllSorting;
window.setupColumnSorting = setupColumnSorting;
window.setupRowSorting = setupRowSorting;
window.moveCard = moveCard;
window.moveCardBetweenRows = moveCardBetweenRows;
window.reorderCardsInColumn = reorderCardsInColumn;