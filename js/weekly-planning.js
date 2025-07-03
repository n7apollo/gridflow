/**
 * GridFlow - Weekly Planning Module
 * Handles weekly planning view and anti-overwhelm productivity features
 */

import { getAppData, setAppData, saveData } from './core-data.js';
import { showStatusMessage } from './utilities.js';
import { renderEntity } from './entity-renderer.js';
import { getEntity, CONTEXT_TYPES } from './entity-core.js';

// Current week key
let currentWeekKey = null;
let currentEditingWeeklyItem = null;

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
    // Use consistent day array starting with Monday (to match getWeekStart which returns Monday)
    const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(day);
    const weekStart = getWeekStart(currentWeekKey);
    const targetDate = new Date(weekStart);
    targetDate.setDate(weekStart.getDate() + dayIndex);
    
    return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Update date badges for each day in the weekly view
 */
function updateDateBadges() {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const weekStart = getWeekStart(currentWeekKey);
    
    days.forEach((day, index) => {
        const dateElement = document.getElementById(`${day}Date`);
        if (!dateElement) return;
        
        // Calculate the date for this day (Monday = index 0, Sunday = index 6)
        // weekStart is already Monday, so we just add the index directly
        const targetDate = new Date(weekStart);
        targetDate.setDate(weekStart.getDate() + index);
        
        // Update the badge with the day number
        dateElement.textContent = targetDate.getDate();
        
        // Add today indicator
        const today = new Date();
        const isToday = targetDate.toDateString() === today.toDateString();
        
        if (isToday) {
            dateElement.classList.add('badge-primary');
            dateElement.classList.remove('badge-neutral', 'badge-secondary');
        } else if (day === 'saturday' || day === 'sunday') {
            dateElement.classList.add('badge-secondary');
            dateElement.classList.remove('badge-neutral', 'badge-primary');
        } else {
            dateElement.classList.add('badge-neutral');
            dateElement.classList.remove('badge-primary', 'badge-secondary');
        }
    });
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
export async function renderWeeklyPlan() {
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
    await renderWeeklyItems();
    
    // Update week progress
    updateWeekProgress();
    
    // Update navigation buttons
    updateWeekNavigation();
}

/**
 * Render weekly planning items
 */
export async function renderWeeklyItems() {
    const appData = getAppData();
    const currentWeek = appData.weeklyPlans[currentWeekKey] || {};
    const items = currentWeek.items || [];
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    // Update date badges first
    updateDateBadges();
    
    for (const day of days) {
        const dayItemsContainer = document.getElementById(`${day}Items`);
        if (!dayItemsContainer) continue;
        
        // Clear existing items (but keep the header structure from views.js)
        dayItemsContainer.innerHTML = '';
        
        // Filter and render items for this day
        const dayItems = items.filter(item => item.day === day);
        
        if (dayItems.length === 0) {
            // Add empty state for this day
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-day-state text-center py-6 text-base-content/40';
            emptyState.innerHTML = `
                <i data-lucide="calendar-plus" class="w-8 h-8 mx-auto mb-2"></i>
                <p class="text-sm">No plans yet</p>
                <p class="text-xs">Add notes, tasks, or goals</p>
            `;
            dayItemsContainer.appendChild(emptyState);
        } else {
            for (const item of dayItems) {
                const itemElement = await createWeeklyItemElement(item);
                dayItemsContainer.appendChild(itemElement);
            }
        }
        
        // Add "Add Item" button at the bottom
        const addButton = document.createElement('button');
        addButton.className = 'btn btn-sm btn-outline btn-ghost w-full mt-4 gap-2';
        addButton.innerHTML = '<i data-lucide="plus" class="w-4 h-4"></i> Add Item';
        addButton.onclick = () => addWeeklyNote(day);
        dayItemsContainer.appendChild(addButton);
        
        // Re-render Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
}

/**
 * Create weekly item element
 * @param {Object} item - Weekly item object
 * @returns {Promise<HTMLElement>} Item element
 */
export async function createWeeklyItemElement(item) {
    // DEBUG: Log the full item object to console
    console.log('Creating weekly item element for:', JSON.stringify(item, null, 2));
    
    // Handle both legacy items and new entity-based items
    if (item.entityId) {
        // New entity-based system
        const entity = await getEntity(item.entityId);
        if (!entity) {
            console.warn('Entity not found for weekly item:', item.entityId);
            // Create error element
            const errorElement = document.createElement('div');
            errorElement.className = 'weekly-item error-item';
            errorElement.innerHTML = '<div class="item-content">⚠️ Entity not found</div>';
            return errorElement;
        }
        
        // Use unified entity renderer for weekly context
        const contextData = {
            weekKey: currentWeekKey,
            day: item.day,
            weeklyItemId: item.id
        };
        
        const itemElement = await renderEntity(item.entityId, CONTEXT_TYPES.WEEKLY, contextData);
        
        if (!itemElement) {
            console.warn('Entity renderer failed for weekly item:', item.entityId);
            const errorElement = document.createElement('div');
            errorElement.className = 'weekly-item error-item';
            errorElement.innerHTML = '<div class="item-content">⚠️ Render failed</div>';
            return errorElement;
        }
        
        // Add weekly-specific data attributes
        itemElement.dataset.itemId = item.id;
        itemElement.dataset.entityId = item.entityId;
        itemElement.dataset.day = item.day;
        
        return itemElement;
        
    } else {
        // Legacy weekly item system (should be rare after migration)
        console.warn('Using legacy weekly item format:', item);
        
        // Handle migrated data: resolve entity references to get title/content
        if (item.entityId && !item.title && !item.content) {
            const appData = getAppData();
            const entity = appData.entities?.notes?.[item.entityId];
            if (entity) {
                // Temporarily add title/content to item for display
                item.title = entity.title;
                item.content = entity.content;
                console.log('Resolved entity data for item:', item.id, entity);
            }
        }
        
        const itemElement = document.createElement('div');
        itemElement.className = `weekly-item ${item.type} ${item.completed ? 'completed' : ''}`;
        itemElement.dataset.itemId = item.id;
        
        let content = '';
        
        if (item.type === 'note') {
            const noteTitle = item.title || '';
            const noteContent = item.content || '';
            const hasContent = noteTitle || noteContent;
            
            content = `
                <div class="item-content">
                    ${hasContent ? (
                        noteTitle ? `<div class="item-title">${noteTitle}</div>` : `<div class="item-text">${noteContent}</div>`
                    ) : '<div class="item-text"><em>(No content)</em></div>'}
                    ${noteTitle && noteContent && noteContent !== noteTitle ? `<div class="item-text">${noteContent}</div>` : ''}
                </div>
                <div class="item-actions">
                    <button class="btn btn-small" onclick="window.weeklyPlanning.editWeeklyItem('${item.id}')">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="window.weeklyPlanning.deleteWeeklyItem('${item.id}')">Delete</button>
                </div>
            `;
        } else if (item.type === 'checklist') {
            // Handle migrated checklist data
            if (item.entityId && !item.title && !item.content) {
                const appData = getAppData();
                const entity = appData.entities?.checklists?.[item.entityId];
                if (entity) {
                    item.title = entity.title;
                    item.content = entity.description || entity.content;
                    console.log('Resolved checklist entity data for item:', item.id, entity);
                }
            }
            
            const checklistTitle = item.title || '';
            const checklistContent = item.content || '';
            const displayText = checklistTitle || checklistContent || '<em>(No content)</em>';
            
            content = `
                <div class="item-content">
                    <div class="checklist-item">
                        <input type="checkbox" ${item.completed ? 'checked' : ''} 
                               onchange="window.weeklyPlanning.toggleWeeklyItem('${item.id}')">
                        <span class="checklist-text">${displayText}</span>
                    </div>
                    ${checklistTitle && checklistContent && checklistContent !== checklistTitle ? `<div class="item-description">${checklistContent}</div>` : ''}
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
    // Show inline input and Save/Cancel buttons in the weekly goal area
    const weeklyGoal = document.getElementById('weeklyGoal');
    const currentGoal = weeklyGoal ? weeklyGoal.textContent : '';
    if (!weeklyGoal) return;
    
    weeklyGoal.style.display = 'none';
    let form = document.getElementById('weeklyGoalForm');
    if (!form) {
        form = document.createElement('div');
        form.id = 'weeklyGoalForm';
        form.innerHTML = `
    <textarea id=\"weeklyGoalInput\" rows=\"3\" style=\"width:100%;resize:vertical;min-height:48px;\" placeholder=\"Enter your weekly focus goal...\">${currentGoal === 'Click to set your weekly focus goal...' ? '' : currentGoal}</textarea>
    <button class=\"btn btn-small btn-primary\" id=\"saveWeeklyGoalBtn\">Save</button>
    <button class=\"btn btn-small btn-secondary\" id=\"cancelWeeklyGoalBtn\">Cancel</button>
`;
        weeklyGoal.parentNode.insertBefore(form, weeklyGoal.nextSibling);
    } else {
        form.style.display = 'block';
        form.querySelector('#weeklyGoalInput').value = currentGoal === 'Click to set your weekly focus goal...' ? '' : currentGoal;
    }
    // Set handlers after DOM update
    const saveBtn = form.querySelector('#saveWeeklyGoalBtn');
    const cancelBtn = form.querySelector('#cancelWeeklyGoalBtn');
    if (!saveBtn || !cancelBtn) return;
    saveBtn.onclick = function() {
        const newGoal = form.querySelector('#weeklyGoalInput').value.trim();
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
        showStatusMessage('Weekly goal updated', 'success');
    };
    cancelBtn.onclick = function() {
        form.style.display = 'none';
        weeklyGoal.style.display = 'block';
    };
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
    // Open the weeklyItemModal and prefill the form
    const modal = document.getElementById('weeklyItemModal');
    if (!modal) return;
    document.getElementById('weeklyItemModalTitle').textContent = 'Add Note';
    const form = document.getElementById('weeklyItemForm');
    if (form) {
        form.reset();
        document.getElementById('weeklyItemType').value = type;
        document.getElementById('weeklyItemTitle').value = '';
        document.getElementById('weeklyItemContent').value = '';
        form.dataset.day = day;
    }
    modal.style.display = 'modal-open';
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
    
    // Handle migrated data: resolve entity references before editing
    if (item.entityId && !item.title && !item.content) {
        const entityType = item.type === 'checklist' ? 'checklists' : 'notes';
        const entity = appData.entities?.[entityType]?.[item.entityId];
        if (entity) {
            item.title = entity.title;
            item.content = entity.content || entity.description;
        }
    }
    
    // Set the current editing item for reference
    currentEditingWeeklyItem = item;
    
    // Open the modal and populate with current values
    const modal = document.getElementById('weeklyItemModal');
    if (!modal) return;
    
    // Update modal title
    document.getElementById('weeklyItemModalTitle').textContent = `Edit ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}`;
    
    // Populate form fields
    const typeSelect = document.getElementById('weeklyItemType');
    const titleInput = document.getElementById('weeklyItemTitle');
    const contentInput = document.getElementById('weeklyItemContent');
    const form = document.getElementById('weeklyItemForm');
    
    if (typeSelect) typeSelect.value = item.type;
    if (titleInput) titleInput.value = item.title || '';
    if (contentInput) contentInput.value = item.content || '';
    if (form) form.dataset.day = item.day;
    
    // Show modal
    modal.style.display = 'modal-open';
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
    
    // Populate modal with current reflection data (with null checks)
    const reflectionWins = document.getElementById('reflectionWins');
    if (reflectionWins) reflectionWins.value = reflection.wins || '';
    
    const reflectionChallenges = document.getElementById('reflectionChallenges');
    if (reflectionChallenges) reflectionChallenges.value = reflection.challenges || '';
    
    const reflectionLearnings = document.getElementById('reflectionLearnings');
    if (reflectionLearnings) reflectionLearnings.value = reflection.learnings || '';
    
    const reflectionNextWeek = document.getElementById('reflectionNextWeek');
    if (reflectionNextWeek) reflectionNextWeek.value = reflection.nextWeekFocus || '';
    
    const modal = document.getElementById('weeklyReflectionModal');
    if (modal) modal.style.display = 'modal-open';
}

/**
 * Close weekly reflection modal
 */
export function closeWeeklyReflectionModal() {
    const modal = document.getElementById('weeklyReflectionModal');
    if (modal) modal.style.display = 'none';
}

/**
 * Save weekly reflection
 */
export function saveWeeklyReflection() {
    const winsEl = document.getElementById('reflectionWins');
    const challengesEl = document.getElementById('reflectionChallenges');
    const learningsEl = document.getElementById('reflectionLearnings');
    const nextWeekEl = document.getElementById('reflectionNextWeek');
    
    if (!winsEl || !challengesEl || !learningsEl || !nextWeekEl) {
        console.warn('Weekly reflection form elements not found');
        return;
    }
    
    const wins = winsEl.value.trim();
    const challenges = challengesEl.value.trim();
    const learnings = learningsEl.value.trim();
    const nextWeekFocus = nextWeekEl.value.trim();
    
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
 * Save weekly item from modal
 */
export function saveWeeklyItem() {
    const typeInput = document.getElementById('weeklyItemType');
    const titleInput = document.getElementById('weeklyItemTitle');
    const contentInput = document.getElementById('weeklyItemContent');
    const form = document.getElementById('weeklyItemForm');
    
    if (!typeInput || !titleInput || !contentInput || !form) {
        console.error('Weekly item form elements not found');
        return;
    }
    
    const type = typeInput.value;
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const day = form.dataset.day || 'monday';
    
    if (!title && !content) {
        showStatusMessage('Please enter a title or content', 'error');
        return;
    }
    
    const appData = getAppData();
    
    if (!appData.weeklyPlans[currentWeekKey]) {
        appData.weeklyPlans[currentWeekKey] = {
            weekStart: getWeekStart(currentWeekKey).toISOString(),
            goal: '',
            items: [],
            reflection: { wins: '', challenges: '', learnings: '', nextWeekFocus: '' }
        };
    }
    
    // Check if we're editing an existing item
    if (currentEditingWeeklyItem) {
        // Update existing item
        currentEditingWeeklyItem.type = type;
        currentEditingWeeklyItem.title = title;
        currentEditingWeeklyItem.content = content;
        currentEditingWeeklyItem.day = day;
        
        // If this is a migrated item with an entity reference, update the entity too
        if (currentEditingWeeklyItem.entityId) {
            const entityType = type === 'checklist' ? 'checklists' : 'notes';
            const entity = appData.entities?.[entityType]?.[currentEditingWeeklyItem.entityId];
            if (entity) {
                entity.title = title;
                if (entityType === 'notes') {
                    entity.content = content;
                } else {
                    entity.description = content;
                }
                entity.updatedAt = new Date().toISOString();
                console.log('Updated entity for weekly item:', currentEditingWeeklyItem.entityId, entity);
            }
        }
        
        // Clear the editing reference
        currentEditingWeeklyItem = null;
        
        showStatusMessage('Weekly item updated', 'success');
    } else {
        // Create new item
        const newItem = {
            id: `weekly_${appData.nextWeeklyItemId++}`,
            type: type,
            day: day,
            title: title,
            content: content,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        appData.weeklyPlans[currentWeekKey].items.push(newItem);
        showStatusMessage('Weekly item saved', 'success');
    }
    
    setAppData(appData);
    saveData();
    
    closeWeeklyItemModal();
    renderWeeklyItems();
    updateWeekProgress();
}

/**
 * Close weekly item modal
 */
export function closeWeeklyItemModal() {
    const modal = document.getElementById('weeklyItemModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Clear the editing reference
    currentEditingWeeklyItem = null;
    
    // Reset modal title
    const modalTitle = document.getElementById('weeklyItemModalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'Add Weekly Item';
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
window.saveWeeklyItem = saveWeeklyItem;
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
    saveWeeklyItem,
    closeWeeklyItemModal,
    getCurrentWeek,
    setCurrentWeek,
    collectChecklistItems,
    addChecklistItem,
    removeChecklistItem,
    initializeWeeklyEventListeners,
    debugWeeklyData
};

// ============================================
// CHECKLIST HELPER FUNCTIONS
// ============================================

/**
 * Collect checklist items from the weekly item form
 */
export function collectChecklistItems() {
    const checklistBuilder = document.getElementById('checklistBuilder');
    const items = [];
    
    const previews = checklistBuilder.querySelectorAll('.checklist-item-preview');
    previews.forEach(preview => {
        const text = preview.querySelector('.checklist-item-text').textContent;
        if (text.trim()) {
            items.push({ text: text.trim(), completed: false });
        }
    });
    
    return items;
}

/**
 * Add checklist item to the weekly item form
 */
export function addChecklistItem() {
    const input = document.querySelector('.checklist-input');
    const text = input.value.trim();
    
    if (!text) return;
    
    const checklistBuilder = document.getElementById('checklistBuilder');
    const preview = document.createElement('div');
    preview.className = 'checklist-item-preview';
    preview.innerHTML = `
        <span class="checklist-item-text">${text}</span>
        <button type="button" class="remove-item-btn" onclick="removeChecklistItem(this)">×</button>
    `;
    
    // Insert before the input
    const inputDiv = checklistBuilder.querySelector('.checklist-item-input');
    checklistBuilder.insertBefore(preview, inputDiv);
    
    input.value = '';
    input.focus();
}

/**
 * Remove checklist item from the weekly item form
 */
export function removeChecklistItem(button) {
    button.parentElement.remove();
}

// ============================================
// WEEKLY PLANNING EVENT LISTENERS
// ============================================

/**
 * Initialize weekly planning event listeners
 */
export function initializeWeeklyEventListeners() {
    // Weekly item form submission
    const weeklyItemForm = document.getElementById('weeklyItemForm');
    if (weeklyItemForm) {
        weeklyItemForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const appData = getAppData();
            const itemType = document.querySelector('input[name="itemType"]:checked').value;
            const day = currentEditingWeeklyItem?.day || 'general';
            
            let newItem = {
                id: `weekly_${appData.nextWeeklyItemId++}`,
                type: itemType,
                day: day,
                completed: document.getElementById('itemCompleted').checked,
                createdAt: new Date().toISOString()
            };
            
            if (itemType === 'note') {
                newItem.content = document.getElementById('weeklyItemContent').value.trim();
            } else if (itemType === 'checklist') {
                newItem.title = document.getElementById('weeklyItemTitle').value.trim();
                // Optionally: newItem.content = document.getElementById('weeklyItemContent').value.trim();
                // Optionally: newItem.checklist = collectChecklistItems();
            } else if (itemType === 'card') {
                const cardSelect = document.getElementById('cardSelect');
                if (cardSelect && cardSelect.value) {
                    const [boardId, cardId] = cardSelect.value.split('|');
                    newItem.cardId = cardId;
                    newItem.boardId = boardId;
                }
            }
            
            // Add to current week
            if (!appData.weeklyPlans[currentWeekKey]) {
                appData.weeklyPlans[currentWeekKey] = {
                    weekStart: getWeekStart(currentWeekKey).toISOString(),
                    goal: '',
                    items: [],
                    reflection: { wins: '', challenges: '', learnings: '', nextWeekFocus: '' }
                };
            }
            
            appData.weeklyPlans[currentWeekKey].items.push(newItem);
            
            renderWeeklyItems();
            updateWeekProgress();
            closeWeeklyItemModal();
            saveData();
            
            showStatusMessage('Item added to weekly plan', 'success');
        });
    }

    // Weekly reflection form submission
    const weeklyReflectionForm = document.getElementById('weeklyReflectionForm');
    if (weeklyReflectionForm) {
        weeklyReflectionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const appData = getAppData();
            if (!appData.weeklyPlans[currentWeekKey]) {
                appData.weeklyPlans[currentWeekKey] = {
                    weekStart: getWeekStart(currentWeekKey).toISOString(),
                    goal: '',
                    items: [],
                    reflection: { wins: '', challenges: '', learnings: '', nextWeekFocus: '' }
                };
            }
            
            appData.weeklyPlans[currentWeekKey].reflection = {
                wins: document.getElementById('weeklyWins').value.trim(),
                challenges: document.getElementById('weeklyChallenges').value.trim(),
                learnings: document.getElementById('weeklyLearnings').value.trim(),
                nextWeekFocus: document.getElementById('nextWeekFocus').value.trim()
            };
            
            closeWeeklyReflectionModal();
            saveData();
            
            showStatusMessage('Weekly reflection saved', 'success');
        });
    }
}

/**
 * Debug function to show current weekly data in console
 */
export function debugWeeklyData() {
    const appData = getAppData();
    const currentWeek = appData.weeklyPlans[currentWeekKey];
    
    console.log('=== WEEKLY PLANNING DEBUG ===');
    console.log('Current week key:', currentWeekKey);
    console.log('Current week data:', JSON.stringify(currentWeek, null, 2));
    
    if (currentWeek && currentWeek.items) {
        console.log('=== INDIVIDUAL ITEMS ===');
        currentWeek.items.forEach((item, index) => {
            console.log(`Item ${index + 1}:`, JSON.stringify(item, null, 2));
        });
    }
    
    return currentWeek;
}

// Make functions globally available for onclick handlers
if (typeof window !== 'undefined') {
    window.collectChecklistItems = collectChecklistItems;
    window.addChecklistItem = addChecklistItem;
    window.removeChecklistItem = removeChecklistItem;
    window.debugWeeklyData = debugWeeklyData;
}