/**
 * GridFlow - Board Management Module
 * Handles board operations, switching, and board-level settings
 */

import { getAppData, getBoardData, setAppData, setBoardData, saveData } from './core-data.js';
import { showStatusMessage } from './utilities.js';

// Current editing state
let currentEditingBoard = null;

/**
 * Update board title in document and UI
 */
export function updateBoardTitle() {
    const appData = getAppData();
    const currentBoard = appData.boards[appData.currentBoardId];
    if (currentBoard) {
        document.title = `${currentBoard.name} - GridFlow`;
    }
    updateBoardSelector();
}

/**
 * Update board selector dropdown
 */
export function updateBoardSelector() {
    const appData = getAppData();
    
    // Update legacy board selector if it exists
    const legacySelector = document.getElementById('boardSelect');
    if (legacySelector) {
        legacySelector.innerHTML = '';
        
        Object.entries(appData.boards).forEach(([boardId, board]) => {
            const option = document.createElement('option');
            option.value = boardId;
            option.textContent = board.name;
            option.selected = boardId === appData.currentBoardId;
            legacySelector.appendChild(option);
        });
    }
    
    // Update enhanced board selector display
    updateCurrentBoardDisplay();
}

/**
 * Switch to a different board
 * @param {string} boardId - ID of board to switch to
 */
export function switchBoard(boardId) {
    const appData = getAppData();
    
    if (appData.boards[boardId]) {
        appData.currentBoardId = boardId;
        const newBoardData = appData.boards[boardId];
        
        // Update data references
        setAppData(appData);
        setBoardData(newBoardData);
        
        // Update UI
        updateBoardTitle();
        if (window.renderBoard) window.renderBoard();
        if (window.updateSettingsUI) window.updateSettingsUI();
        
        // Add to recent boards
        addToRecentBoards(boardId);
        
        // Save changes
        saveData();
    }
}

/**
 * Show board management modal
 */
export function showBoardModal() {
    renderBoardsList();
    document.getElementById('boardModal').style.display = 'block';
}

/**
 * Close board management modal
 */
export function closeBoardModal() {
    document.getElementById('boardModal').style.display = 'none';
}

/**
 * Render list of boards in management modal
 */
export function renderBoardsList() {
    const appData = getAppData();
    const container = document.getElementById('boardsList');
    container.innerHTML = '';
    
    Object.entries(appData.boards).forEach(([boardId, board]) => {
        const boardItem = document.createElement('div');
        boardItem.className = `board-item ${boardId === appData.currentBoardId ? 'current' : ''}`;
        
        const rowCount = board.rows ? board.rows.length : 0;
        const cardCount = board.rows ? board.rows.reduce((total, row) => {
            return total + Object.values(row.cards || {}).reduce((rowTotal, cards) => rowTotal + cards.length, 0);
        }, 0) : 0;
        
        boardItem.innerHTML = `
            <div class="board-item-info">
                <div class="board-item-name">${board.name}</div>
                <div class="board-item-meta">${rowCount} rows, ${cardCount} cards</div>
            </div>
            <div class="board-item-actions">
                ${boardId === appData.currentBoardId ? '<span class="btn btn-small btn-primary">Current</span>' : `<button class="btn btn-small btn-secondary" onclick="window.boardManagement.switchBoard('${boardId}'); window.boardManagement.closeBoardModal();">Switch</button>`}
                <button class="btn btn-small btn-secondary" onclick="window.boardManagement.editBoard('${boardId}')" title="Edit board">✏️</button>
                ${Object.keys(appData.boards).length > 1 ? `<button class="btn btn-small btn-danger" onclick="window.boardManagement.deleteBoard('${boardId}')" title="Delete board">🗑️</button>` : ''}
            </div>
        `;
        
        container.appendChild(boardItem);
    });
}

/**
 * Create a new board
 */
export function createNewBoard() {
    const appData = getAppData();
    const boardName = prompt('Enter board name:');
    
    if (boardName && boardName.trim()) {
        const newBoardId = generateUniqueBoardId('board');
        const newBoard = {
            name: boardName.trim(),
            groups: [],
            rows: [],
            columns: [
                { id: 1, name: 'To Do', key: 'todo' },
                { id: 2, name: 'In Progress', key: 'inprogress' },
                { id: 3, name: 'Done', key: 'done' }
            ],
            settings: {
                showCheckboxes: true,
                showSubtaskProgress: true
            },
            nextRowId: 1,
            nextCardId: 1,
            nextColumnId: 4,
            nextGroupId: 1,
            createdAt: new Date().toISOString()
        };
        
        appData.boards[newBoardId] = newBoard;
        setAppData(appData);
        
        // Switch to new board
        switchBoard(newBoardId);
        closeBoardModal();
        
        showStatusMessage(`Board "${boardName}" created successfully`, 'success');
    }
}

/**
 * Edit board settings
 * @param {string} boardId - ID of board to edit
 */
export function editBoard(boardId) {
    const appData = getAppData();
    const board = appData.boards[boardId];
    if (!board) return;
    
    currentEditingBoard = { ...board, id: boardId };
    document.getElementById('editBoardName').value = board.name;
    document.getElementById('boardEditModal').style.display = 'block';
    closeBoardModal();
}

/**
 * Delete a board
 * @param {string} boardId - ID of board to delete
 */
export function deleteBoard(boardId) {
    const appData = getAppData();
    
    if (Object.keys(appData.boards).length <= 1) {
        showStatusMessage('Cannot delete the last board', 'error');
        return;
    }
    
    const board = appData.boards[boardId];
    if (board && confirm(`Are you sure you want to delete "${board.name}"? This action cannot be undone.`)) {
        delete appData.boards[boardId];
        
        // If we deleted the current board, switch to another one
        if (appData.currentBoardId === boardId) {
            appData.currentBoardId = Object.keys(appData.boards)[0];
            setBoardData(appData.boards[appData.currentBoardId]);
        }
        
        setAppData(appData);
        saveData();
        
        // Update UI
        updateBoardTitle();
        if (window.renderBoard) window.renderBoard();
        renderBoardsList();
        
        showStatusMessage(`Board "${board.name}" deleted`, 'success');
    }
}

/**
 * Close board edit modal
 */
export function closeBoardEditModal() {
    document.getElementById('boardEditModal').style.display = 'none';
    currentEditingBoard = null;
}

/**
 * Save board edit changes
 * @param {Event} event - Form submit event
 */
export function saveBoardEdit(event) {
    event.preventDefault();
    
    if (!currentEditingBoard) return;
    
    const newName = document.getElementById('editBoardName').value.trim();
    if (!newName) {
        showStatusMessage('Please enter a board name', 'error');
        return;
    }
    
    const appData = getAppData();
    const board = appData.boards[currentEditingBoard.id];
    if (board) {
        board.name = newName;
        setAppData(appData);
        saveData();
        
        updateBoardTitle();
        renderBoardsList();
        closeBoardEditModal();
        
        showStatusMessage('Board updated successfully', 'success');
    }
}

/**
 * Save board name (legacy function)
 */
export function saveBoardName() {
    const input = document.getElementById('boardNameInput');
    const newName = input.value.trim();
    
    if (newName) {
        const boardData = getBoardData();
        boardData.name = newName;
        setBoardData(boardData);
        updateBoardTitle();
        saveData();
        showStatusMessage('Board name updated', 'success');
    }
}

/**
 * Update board info display
 */
export function updateBoardInfo() {
    const appData = getAppData();
    const board = appData.boards[appData.currentBoardId];
    if (!board) return;
    
    const boardNameInput = document.getElementById('boardNameInput');
    if (boardNameInput) {
        boardNameInput.value = board.name;
    }
    
    const boardCreatedDate = document.getElementById('boardCreatedDate');
    if (boardCreatedDate) {
        boardCreatedDate.textContent = board.createdAt ? new Date(board.createdAt).toLocaleDateString() : 'N/A';
    }
    
    const rowCount = board.rows ? board.rows.length : 0;
    const cardCount = board.rows ? board.rows.reduce((total, row) => {
        return total + Object.values(row.cards || {}).reduce((rowTotal, cards) => rowTotal + cards.length, 0);
    }, 0) : 0;
    
    const boardCardCount = document.getElementById('boardCardCount');
    const boardRowCount = document.getElementById('boardRowCount');
    
    if (boardCardCount) boardCardCount.textContent = cardCount;
    if (boardRowCount) boardRowCount.textContent = rowCount;
}

/**
 * Generate unique board ID
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Unique board ID
 */
export function generateUniqueBoardId(prefix = 'board') {
    const appData = getAppData();
    let counter = 1;
    let newId = `${prefix}_${counter}`;
    
    while (appData.boards[newId]) {
        counter++;
        newId = `${prefix}_${counter}`;
    }
    
    return newId;
}

// Enhanced navigation functions
/**
 * Toggle board dropdown
 */
export function toggleBoardDropdown() {
    const dropdown = document.getElementById('boardDropdown');
    const isOpen = dropdown.style.display === 'block';
    
    if (isOpen) {
        closeBoardDropdown();
    } else {
        populateBoardDropdown();
        dropdown.style.display = 'block';
        
        // Focus search input
        const searchInput = document.getElementById('boardSearchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.value = '';
        }
        
        // Close dropdown when clicking outside
        setTimeout(() => {
            document.addEventListener('click', handleOutsideClick);
        }, 0);
    }
}

/**
 * Close board dropdown
 */
export function closeBoardDropdown() {
    const dropdown = document.getElementById('boardDropdown');
    dropdown.style.display = 'none';
    document.removeEventListener('click', handleOutsideClick);
}

/**
 * Handle clicks outside dropdown to close it
 * @param {Event} event - Click event
 */
function handleOutsideClick(event) {
    const dropdown = document.getElementById('boardDropdown');
    const button = document.getElementById('currentBoardBtn');
    
    if (!dropdown.contains(event.target) && !button.contains(event.target)) {
        closeBoardDropdown();
    }
}

/**
 * Populate board dropdown with recent and all boards
 */
export function populateBoardDropdown() {
    const appData = getAppData();
    const recentBoards = getRecentBoards();
    
    // Populate recent boards
    const recentBoardsList = document.getElementById('recentBoardsList');
    if (recentBoardsList) {
        recentBoardsList.innerHTML = '';
        
        recentBoards.slice(0, 5).forEach(boardId => {
            if (appData.boards[boardId]) {
                const boardElement = createBoardItem(boardId, appData.boards[boardId]);
                recentBoardsList.appendChild(boardElement);
            }
        });
        
        if (recentBoards.length === 0) {
            recentBoardsList.innerHTML = '<div class="no-recent-boards">No recent boards</div>';
        }
    }
    
    // Populate all boards
    const allBoardsList = document.getElementById('allBoardsList');
    if (allBoardsList) {
        allBoardsList.innerHTML = '';
        
        Object.entries(appData.boards).forEach(([boardId, board]) => {
            const boardElement = createBoardItem(boardId, board);
            allBoardsList.appendChild(boardElement);
        });
    }
}

/**
 * Create board item element for dropdown
 * @param {string} boardId - Board ID
 * @param {Object} board - Board object
 * @returns {HTMLElement} Board item element
 */
export function createBoardItem(boardId, board) {
    const appData = getAppData();
    const item = document.createElement('div');
    item.className = `board-dropdown-item ${boardId === appData.currentBoardId ? 'current' : ''}`;
    
    const rowCount = board.rows ? board.rows.length : 0;
    const cardCount = board.rows ? board.rows.reduce((total, row) => {
        return total + Object.values(row.cards || {}).reduce((rowTotal, cards) => rowTotal + cards.length, 0);
    }, 0) : 0;
    
    item.innerHTML = `
        <div class="board-item-info">
            <div class="board-item-name">${board.name}</div>
            <div class="board-item-stats">${rowCount} rows • ${cardCount} cards</div>
        </div>
        ${boardId === appData.currentBoardId ? '<span class="current-indicator">Current</span>' : ''}
    `;
    
    if (boardId !== appData.currentBoardId) {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            switchBoard(boardId);
            closeBoardDropdown();
        });
    }
    
    return item;
}

/**
 * Get recent boards from localStorage
 * @returns {Array} Array of recent board IDs
 */
export function getRecentBoards() {
    try {
        const recent = localStorage.getItem('gridflow_recent_boards');
        return recent ? JSON.parse(recent) : [];
    } catch (error) {
        console.error('Error loading recent boards:', error);
        return [];
    }
}

/**
 * Add board to recent boards list
 * @param {string} boardId - Board ID to add
 */
export function addToRecentBoards(boardId) {
    const recentBoards = getRecentBoards();
    const filtered = recentBoards.filter(id => id !== boardId);
    filtered.unshift(boardId);
    
    // Keep only last 10 recent boards
    const updatedRecent = filtered.slice(0, 10);
    
    try {
        localStorage.setItem('gridflow_recent_boards', JSON.stringify(updatedRecent));
    } catch (error) {
        console.error('Error saving recent boards:', error);
    }
}

/**
 * Filter boards in dropdown based on search
 */
export function filterBoards() {
    const searchInput = document.getElementById('boardSearchInput');
    const searchTerm = searchInput.value.toLowerCase();
    
    const allBoardsList = document.getElementById('allBoardsList');
    const boardItems = allBoardsList.querySelectorAll('.board-dropdown-item');
    
    boardItems.forEach(item => {
        const boardName = item.querySelector('.board-item-name').textContent.toLowerCase();
        const matches = boardName.includes(searchTerm);
        item.style.display = matches ? 'flex' : 'none';
    });
}

/**
 * Update current board display in enhanced navigation
 */
export function updateCurrentBoardDisplay() {
    const appData = getAppData();
    const currentBoard = appData.boards[appData.currentBoardId];
    
    const currentBoardName = document.getElementById('currentBoardName');
    if (currentBoardName && currentBoard) {
        currentBoardName.textContent = currentBoard.name;
    }
}

// Make functions available globally for backwards compatibility during transition
window.updateBoardTitle = updateBoardTitle;
window.updateBoardSelector = updateBoardSelector;
window.switchBoard = switchBoard;
window.showBoardModal = showBoardModal;
window.closeBoardModal = closeBoardModal;
window.renderBoardsList = renderBoardsList;
window.createNewBoard = createNewBoard;
window.editBoard = editBoard;
window.deleteBoard = deleteBoard;
window.closeBoardEditModal = closeBoardEditModal;
window.saveBoardEdit = saveBoardEdit;
window.saveBoardName = saveBoardName;
window.updateBoardInfo = updateBoardInfo;
window.toggleBoardDropdown = toggleBoardDropdown;
window.closeBoardDropdown = closeBoardDropdown;
window.populateBoardDropdown = populateBoardDropdown;
window.filterBoards = filterBoards;
window.updateCurrentBoardDisplay = updateCurrentBoardDisplay;

// Export module for access by other modules
window.boardManagement = {
    updateBoardTitle,
    updateBoardSelector,
    switchBoard,
    showBoardModal,
    closeBoardModal,
    renderBoardsList,
    createNewBoard,
    editBoard,
    deleteBoard,
    closeBoardEditModal,
    saveBoardEdit,
    saveBoardName,
    updateBoardInfo,
    toggleBoardDropdown,
    closeBoardDropdown,
    populateBoardDropdown,
    filterBoards,
    updateCurrentBoardDisplay
};