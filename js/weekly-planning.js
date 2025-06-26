/**
 * GridFlow - Weekly Planning Module
 * Handles weekly planning view and anti-overwhelm productivity features
 */

import { getAppData, setAppData, saveData } from './core-data.js';
import { showStatusMessage } from './utilities.js';

// Current week key
let currentWeekKey = null;

/**
 * Get current week key in format YYYY-Www
 * @returns {string} Current week key
 */
export function getCurrentWeekKey() {
    const now = new Date();
    const year = now.getFullYear();
    const weekNumber = getWeekNumber(now);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

/**
 * Get week number for a given date
 * @param {Date} date - Date to get week number for
 * @returns {number} Week number
 */
export function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

/**
 * Get the start date of a week
 * @param {string} weekKey - Week key in format YYYY-Www
 * @returns {Date} Week start date
 */
export function getWeekStart(weekKey) {
    const [year, week] = weekKey.split('-W');
    const yearStart = new Date(parseInt(year), 0, 1);
    const weekStart = new Date(yearStart);
    weekStart.setDate(yearStart.getDate() + (parseInt(week) - 1) * 7 - yearStart.getDay() + 1);
    return weekStart;
}

/**
 * Format week title for display
 * @param {string} weekKey - Week key
 * @returns {string} Formatted week title
 */
export function formatWeekTitle(weekKey) {
    const weekStart = getWeekStart(weekKey);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return `Week of ${weekStart.toLocaleDateString('en-US', options)}`;
}

/**
 * Format day date for display
 * @param {Date} date - Date object
 * @param {string} day - Day name
 * @returns {string} Formatted day date
 */
export function formatDayDate(date, day) {
    const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(day);
    const weekStart = getWeekStart(currentWeekKey);
    const targetDate = new Date(weekStart);
    targetDate.setDate(weekStart.getDate() + dayIndex);
    
    return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Initialize weekly planning system
 */
export function initializeWeeklyPlanning() {
    currentWeekKey = getCurrentWeekKey();
    const appData = getAppData();
    
    // Ensure current week exists in data
    if (!appData.weeklyPlans[currentWeekKey]) {
        appData.weeklyPlans[currentWeekKey] = {
            weekStart: getWeekStart(currentWeekKey).toISOString(),
            goal: '',
            items: [],
            reflection: {
                wins: '',
                challenges: '',
                learnings: '',
                nextWeekFocus: ''
            }
        };
        setAppData(appData);
        saveData();
    }
}

/**
 * Switch to weekly planning view
 */
export function switchToWeeklyView() {
    initializeWeeklyPlanning();
    renderWeeklyPlan();
}

/**
 * Render the weekly planning interface
 */
export function renderWeeklyPlan() {
    const appData = getAppData();
    const currentWeek = appData.weeklyPlans[currentWeekKey] || {};
    
    // Update week title
    const weekTitle = document.getElementById('weekTitle');
    if (weekTitle) {
        weekTitle.textContent = formatWeekTitle(currentWeekKey);
    }
    
    // Update weekly goal
    const weeklyGoal = document.getElementById('weeklyGoal');
    if (weeklyGoal) {
        weeklyGoal.textContent = currentWeek.goal || 'Click to set your weekly focus goal...';
        weeklyGoal.className = currentWeek.goal ? 'weekly-goal has-goal' : 'weekly-goal no-goal';
    }
    
    // Render weekly items
    renderWeeklyItems();
    
    // Update week progress
    updateWeekProgress();
    
    // Update navigation buttons
    updateWeekNavigation();
}

/**
 * Render weekly planning items
 */
export function renderWeeklyItems() {
    const appData = getAppData();
    const currentWeek = appData.weeklyPlans[currentWeekKey] || {};
    const items = currentWeek.items || [];
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach(day => {
        const dayColumn = document.getElementById(`${day}Items`);
        if (!dayColumn) return;
        
        dayColumn.innerHTML = '';
        
        // Add day header with date
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.innerHTML = `
            <h3>${day.charAt(0).toUpperCase() + day.slice(1)}</h3>
            <span class="day-date">${formatDayDate(new Date(), day)}</span>
        `;
        dayColumn.appendChild(dayHeader);
        
        // Filter and render items for this day
        const dayItems = items.filter(item => item.day === day);
        
        dayItems.forEach(item => {
            const itemElement = createWeeklyItemElement(item);
            dayColumn.appendChild(itemElement);
        });
        
        // Add "Add Item" button
        const addButton = document.createElement('button');
        addButton.className = 'btn btn-add-item';
        addButton.innerHTML = '+ Add Item';
        addButton.onclick = () => addWeeklyNote(day);
        dayColumn.appendChild(addButton);
    });
}

/**
 * Create weekly item element
 * @param {Object} item - Weekly item object
 * @returns {HTMLElement} Item element
 */
export function createWeeklyItemElement(item) {
    const itemElement = document.createElement('div');
    itemElement.className = `weekly-item ${item.type} ${item.completed ? 'completed' : ''}`;
    itemElement.dataset.itemId = item.id;
    
    let content = '';
    
    if (item.type === 'note') {
        content = `
            <div class="item-content">
                <div class="item-text">${item.content}</div>
            </div>
            <div class="item-actions">
                <button class="btn btn-small" onclick="window.weeklyPlanning.editWeeklyItem('${item.id}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="window.weeklyPlanning.deleteWeeklyItem('${item.id}')">Delete</button>
            </div>
        `;
    } else if (item.type === 'checklist') {
        content = `
            <div class="item-content">
                <div class="checklist-item">
                    <input type="checkbox" ${item.completed ? 'checked' : ''} 
                           onchange="window.weeklyPlanning.toggleWeeklyItem('${item.id}')">
                    <span class="checklist-text">${item.title}</span>
                </div>
                ${item.content ? `<div class="item-description">${item.content}</div>` : ''}
            </div>
            <div class="item-actions">
                <button class="btn btn-small" onclick="window.weeklyPlanning.editWeeklyItem('${item.id}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="window.weeklyPlanning.deleteWeeklyItem('${item.id}')">Delete</button>
            </div>
        `;
    } else if (item.type === 'card') {
        const card = findCardById(item.cardId, item.boardId);
        if (card) {
            content = `
                <div class="item-content">
                    <div class="linked-card">
                        <div class="card-title">${card.title}</div>
                        <div class="card-meta">
                            <span class="board-name">${item.boardName}</span>
                            <span class="row-name">${item.rowName}</span>
                        </div>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small btn-danger" onclick="window.weeklyPlanning.removeCardFromWeeklyPlan('${item.id}')">Remove</button>
                </div>
            `;
        } else {
            content = `
                <div class="item-content">
                    <div class="linked-card missing">
                        <div class="card-title">Card not found</div>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small btn-danger" onclick="window.weeklyPlanning.deleteWeeklyItem('${item.id}')">Remove</button>
                </div>
            `;
        }
    }
    
    itemElement.innerHTML = content;
    return itemElement;
}

/**
 * Navigate to previous or next week
 * @param {string} direction - 'prev' or 'next'
 */
export function navigateWeek(direction) {
    const currentWeekStart = getWeekStart(currentWeekKey);
    const newWeekStart = new Date(currentWeekStart);
    
    if (direction === 'prev') {
        newWeekStart.setDate(currentWeekStart.getDate() - 7);
    } else if (direction === 'next') {
        newWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    const year = newWeekStart.getFullYear();
    const weekNumber = getWeekNumber(newWeekStart);
    currentWeekKey = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
    
    // Initialize new week if it doesn't exist
    const appData = getAppData();
    if (!appData.weeklyPlans[currentWeekKey]) {
        appData.weeklyPlans[currentWeekKey] = {
            weekStart: newWeekStart.toISOString(),
            goal: '',
            items: [],
            reflection: {
                wins: '',
                challenges: '',
                learnings: '',
                nextWeekFocus: ''
            }
        };
        setAppData(appData);
        saveData();
    }
    
    renderWeeklyPlan();
}

/**
 * Update week navigation buttons
 */
function updateWeekNavigation() {
    const prevButton = document.getElementById('prevWeekBtn');
    const nextButton = document.getElementById('nextWeekBtn');
    const currentWeekBtn = document.getElementById('currentWeekBtn');
    
    // Always enable navigation buttons
    if (prevButton) prevButton.disabled = false;
    if (nextButton) nextButton.disabled = false;
    
    // Update current week button
    if (currentWeekBtn) {
        const isCurrentWeek = currentWeekKey === getCurrentWeekKey();
        currentWeekBtn.style.display = isCurrentWeek ? 'none' : 'inline-block';
    }
}

/**
 * Go to current week
 */
export function goToCurrentWeek() {
    currentWeekKey = getCurrentWeekKey();
    initializeWeeklyPlanning();
    renderWeeklyPlan();
}

/**
 * Edit weekly goal
 */
export function editWeeklyGoal() {
    const appData = getAppData();
    const currentWeek = appData.weeklyPlans[currentWeekKey] || {};
    const currentGoal = currentWeek.goal || '';
    
    const newGoal = prompt('Enter your weekly focus goal:', currentGoal);
    if (newGoal !== null) {
        if (!appData.weeklyPlans[currentWeekKey]) {
            appData.weeklyPlans[currentWeekKey] = {
                weekStart: getWeekStart(currentWeekKey).toISOString(),
                goal: '',
                items: [],
                reflection: { wins: '', challenges: '', learnings: '', nextWeekFocus: '' }
            };
        }
        
        appData.weeklyPlans[currentWeekKey].goal = newGoal.trim();
        setAppData(appData);
        saveData();
        renderWeeklyPlan();
        
        showStatusMessage('Weekly goal updated', 'success');
    }
}

/**
 * Save weekly goal from modal
 */
export function saveWeeklyGoal() {
    const goalInput = document.getElementById('weeklyGoalInput');
    if (!goalInput) return;
    
    const newGoal = goalInput.value.trim();
    const appData = getAppData();
    
    if (!appData.weeklyPlans[currentWeekKey]) {
        appData.weeklyPlans[currentWeekKey] = {
            weekStart: getWeekStart(currentWeekKey).toISOString(),
            goal: '',
            items: [],
            reflection: { wins: '', challenges: '', learnings: '', nextWeekFocus: '' }
        };
    }
    
    appData.weeklyPlans[currentWeekKey].goal = newGoal;
    setAppData(appData);
    saveData();
    renderWeeklyPlan();
    
    showStatusMessage('Weekly goal saved', 'success');
}

/**
 * Add weekly note/item
 * @param {string} day - Day to add item to
 * @param {string} type - Type of item ('note' or 'checklist')
 */
export function addWeeklyNote(day = 'monday', type = 'note') {
    const content = prompt(type === 'note' ? 'Enter note content:' : 'Enter checklist item:');
    if (!content || !content.trim()) return;
    
    const appData = getAppData();
    if (!appData.weeklyPlans[currentWeekKey]) {
        initializeWeeklyPlanning();
    }
    
    const newItem = {
        id: `item_${appData.nextWeeklyItemId++}`,
        type: type,
        day: day,
        title: type === 'checklist' ? content.trim() : undefined,
        content: type === 'note' ? content.trim() : undefined,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    appData.weeklyPlans[currentWeekKey].items.push(newItem);
    setAppData(appData);
    saveData();
    renderWeeklyItems();
    updateWeekProgress();
    
    showStatusMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} added`, 'success');
}

/**
 * Toggle weekly item completion
 * @param {string} itemId - Item ID to toggle
 */
export function toggleWeeklyItem(itemId) {
    const appData = getAppData();
    const currentWeek = appData.weeklyPlans[currentWeekKey];
    if (!currentWeek) return;
    
    const item = currentWeek.items.find(i => i.id === itemId);
    if (item) {
        item.completed = !item.completed;
        setAppData(appData);
        saveData();
        renderWeeklyItems();
        updateWeekProgress();
    }
}

/**
 * Edit weekly item
 * @param {string} itemId - Item ID to edit
 */
export function editWeeklyItem(itemId) {
    const appData = getAppData();
    const currentWeek = appData.weeklyPlans[currentWeekKey];
    if (!currentWeek) return;
    
    const item = currentWeek.items.find(i => i.id === itemId);
    if (!item) return;
    
    const currentContent = item.type === 'note' ? item.content : item.title;
    const newContent = prompt(`Edit ${item.type}:`, currentContent);
    
    if (newContent !== null && newContent.trim()) {
        if (item.type === 'note') {
            item.content = newContent.trim();
        } else {
            item.title = newContent.trim();
        }
        
        setAppData(appData);
        saveData();
        renderWeeklyItems();
        
        showStatusMessage('Item updated', 'success');
    }
}

/**
 * Delete weekly item
 * @param {string} itemId - Item ID to delete
 */
export function deleteWeeklyItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    const appData = getAppData();
    const currentWeek = appData.weeklyPlans[currentWeekKey];
    if (!currentWeek) return;
    
    currentWeek.items = currentWeek.items.filter(i => i.id !== itemId);
    setAppData(appData);
    saveData();
    renderWeeklyItems();
    updateWeekProgress();
    
    showStatusMessage('Item deleted', 'success');
}

/**
 * Update week progress display
 */
export function updateWeekProgress() {
    const appData = getAppData();
    const currentWeek = appData.weeklyPlans[currentWeekKey];
    if (!currentWeek) return;
    
    const items = currentWeek.items.filter(item => item.type === 'checklist');
    const completedItems = items.filter(item => item.completed);
    
    const progressElement = document.getElementById('weekProgress');
    if (progressElement) {
        const percentage = items.length > 0 ? Math.round((completedItems.length / items.length) * 100) : 0;
        progressElement.innerHTML = `
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
            <div class="progress-text">${completedItems.length} of ${items.length} tasks completed (${percentage}%)</div>
        `;
    }
}

/**
 * Show weekly reflection modal
 */
export function showWeeklyReflectionModal() {
    const appData = getAppData();
    const currentWeek = appData.weeklyPlans[currentWeekKey] || {};
    const reflection = currentWeek.reflection || {};
    
    // Populate modal with current reflection data
    document.getElementById('reflectionWins').value = reflection.wins || '';
    document.getElementById('reflectionChallenges').value = reflection.challenges || '';
    document.getElementById('reflectionLearnings').value = reflection.learnings || '';
    document.getElementById('reflectionNextWeek').value = reflection.nextWeekFocus || '';
    
    document.getElementById('weeklyReflectionModal').style.display = 'block';
}

/**
 * Close weekly reflection modal
 */
export function closeWeeklyReflectionModal() {
    document.getElementById('weeklyReflectionModal').style.display = 'none';
}

/**
 * Save weekly reflection
 */
export function saveWeeklyReflection() {
    const wins = document.getElementById('reflectionWins').value.trim();
    const challenges = document.getElementById('reflectionChallenges').value.trim();
    const learnings = document.getElementById('reflectionLearnings').value.trim();
    const nextWeekFocus = document.getElementById('reflectionNextWeek').value.trim();
    
    const appData = getAppData();
    if (!appData.weeklyPlans[currentWeekKey]) {
        initializeWeeklyPlanning();
    }
    
    appData.weeklyPlans[currentWeekKey].reflection = {
        wins,
        challenges,
        learnings,
        nextWeekFocus
    };
    
    setAppData(appData);
    saveData();
    closeWeeklyReflectionModal();
    
    showStatusMessage('Weekly reflection saved', 'success');
}

/**
 * Find card by ID across boards
 * @param {string} cardId - Card ID to find
 * @param {string} boardId - Board ID to search in
 * @returns {Object|null} Card object or null if not found
 */
export function findCardById(cardId, boardId) {
    const appData = getAppData();
    const board = appData.boards[boardId];
    if (!board || !board.rows) return null;
    
    for (const row of board.rows) {
        if (row.cards) {
            for (const columnKey of Object.keys(row.cards)) {
                const card = row.cards[columnKey].find(c => c.id?.toString() === cardId?.toString());
                if (card) {
                    return card;
                }
            }
        }
    }
    return null;
}

/**
 * Add card to weekly plan
 * @param {string} cardId - Card ID
 * @param {string} boardId - Board ID
 * @param {string} rowId - Row ID
 */
export function addCardToWeeklyPlan(cardId, boardId, rowId) {
    const appData = getAppData();
    const board = appData.boards[boardId];
    const row = board.rows.find(r => r.id?.toString() === rowId?.toString());
    const card = findCardById(cardId, boardId);
    
    if (!card || !row) {
        showStatusMessage('Card not found', 'error');
        return;
    }
    
    // Ask user which day to add to
    const day = prompt('Which day would you like to add this card to?', 'monday');
    if (!day) return;
    
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (!validDays.includes(day.toLowerCase())) {
        showStatusMessage('Invalid day. Please use monday, tuesday, etc.', 'error');
        return;
    }
    
    if (!appData.weeklyPlans[currentWeekKey]) {
        initializeWeeklyPlanning();
    }
    
    const newItem = {
        id: `item_${appData.nextWeeklyItemId++}`,
        type: 'card',
        day: day.toLowerCase(),
        cardId: cardId,
        boardId: boardId,
        boardName: board.name,
        rowName: row.name,
        createdAt: new Date().toISOString()
    };
    
    appData.weeklyPlans[currentWeekKey].items.push(newItem);
    setAppData(appData);
    saveData();
    renderWeeklyItems();
    
    showStatusMessage('Card added to weekly plan', 'success');
}

/**
 * Remove card from weekly plan
 * @param {string} itemId - Weekly item ID
 */
export function removeCardFromWeeklyPlan(itemId) {
    deleteWeeklyItem(itemId);
}

/**
 * Close weekly item modal
 */
export function closeWeeklyItemModal() {
    const modal = document.getElementById('weeklyItemModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Get current week key (for external access)
 * @returns {string} Current week key
 */
export function getCurrentWeek() {
    return currentWeekKey;
}

/**
 * Set current week key (for external access)
 * @param {string} weekKey - Week key to set
 */
export function setCurrentWeek(weekKey) {
    currentWeekKey = weekKey;
}

// Make functions available globally for backwards compatibility during transition
window.getCurrentWeekKey = getCurrentWeekKey;
window.getWeekNumber = getWeekNumber;
window.getWeekStart = getWeekStart;
window.formatWeekTitle = formatWeekTitle;
window.formatDayDate = formatDayDate;
window.initializeWeeklyPlanning = initializeWeeklyPlanning;
window.switchToWeeklyView = switchToWeeklyView;
window.renderWeeklyPlan = renderWeeklyPlan;
window.renderWeeklyItems = renderWeeklyItems;
window.createWeeklyItemElement = createWeeklyItemElement;
window.navigateWeek = navigateWeek;
window.goToCurrentWeek = goToCurrentWeek;
window.editWeeklyGoal = editWeeklyGoal;
window.saveWeeklyGoal = saveWeeklyGoal;
window.addWeeklyNote = addWeeklyNote;
window.toggleWeeklyItem = toggleWeeklyItem;
window.editWeeklyItem = editWeeklyItem;
window.deleteWeeklyItem = deleteWeeklyItem;
window.updateWeekProgress = updateWeekProgress;
window.showWeeklyReflectionModal = showWeeklyReflectionModal;
window.closeWeeklyReflectionModal = closeWeeklyReflectionModal;
window.saveWeeklyReflection = saveWeeklyReflection;
window.findCardById = findCardById;
window.addCardToWeeklyPlan = addCardToWeeklyPlan;
window.removeCardFromWeeklyPlan = removeCardFromWeeklyPlan;
window.closeWeeklyItemModal = closeWeeklyItemModal;

// Export module for access by other modules
window.weeklyPlanning = {
    getCurrentWeekKey,
    getWeekNumber,
    getWeekStart,
    formatWeekTitle,
    formatDayDate,
    initializeWeeklyPlanning,
    switchToWeeklyView,
    renderWeeklyPlan,
    renderWeeklyItems,
    createWeeklyItemElement,
    navigateWeek,
    goToCurrentWeek,
    editWeeklyGoal,
    saveWeeklyGoal,
    addWeeklyNote,
    toggleWeeklyItem,
    editWeeklyItem,
    deleteWeeklyItem,
    updateWeekProgress,
    showWeeklyReflectionModal,
    closeWeeklyReflectionModal,
    saveWeeklyReflection,
    findCardById,
    addCardToWeeklyPlan,
    removeCardFromWeeklyPlan,
    closeWeeklyItemModal,
    getCurrentWeek,
    setCurrentWeek
};