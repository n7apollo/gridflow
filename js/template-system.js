/**
 * GridFlow - Template System Module
 * Handles template creation, application, and library management
 */

import { getAppData, setAppData, saveData, createDefaultBoard } from './core-data.js';
import { showStatusMessage } from './utilities.js';
import { templateAdapter } from './indexeddb/adapters.js';

// Template selection state
let selectedTemplateId = null;

/**
 * Show save as template modal
 */
export function showSaveAsTemplateModal() {
    document.getElementById('saveAsTemplateModal').style.display = 'block';
    updateTemplatePreview();
    document.getElementById('saveAsTemplateForm').onsubmit = saveAsTemplate;
}

/**
 * Close save as template modal
 */
export function closeSaveAsTemplateModal() {
    document.getElementById('saveAsTemplateModal').style.display = 'none';
    document.getElementById('saveAsTemplateForm').reset();
}

/**
 * Update template preview
 */
export function updateTemplatePreview() {
    const boardData = window.boardData;
    const preview = document.getElementById('templatePreview');
    
    if (!preview || !boardData) return;
    
    const groupCount = boardData.groups.length;
    const rowCount = boardData.rows.length;
    const cardCount = boardData.rows.reduce((total, row) => {
        return total + Object.values(row.cards).reduce((rowTotal, cards) => rowTotal + cards.length, 0);
    }, 0);
    
    preview.innerHTML = `
        <div class="preview-stats">
            <div class="preview-item">
                <strong>${groupCount}</strong> groups: ${boardData.groups.map(g => g.name).join(', ') || 'None'}
            </div>
            <div class="preview-item">
                <strong>${rowCount}</strong> rows: ${boardData.rows.map(r => r.name).slice(0, 3).join(', ')}${rowCount > 3 ? '...' : ''}
            </div>
            <div class="preview-item">
                <strong>${cardCount}</strong> tasks will be included as template structure
            </div>
        </div>
    `;
}

/**
 * Save current board as template
 * @param {Event} event - Form submit event
 */
export async function saveAsTemplate(event) {
    event.preventDefault();
    
    const name = document.getElementById('saveTemplateName').value.trim();
    const description = document.getElementById('saveTemplateDescription').value.trim();
    const category = document.getElementById('saveTemplateCategory').value;
    const includeStructure = document.getElementById('saveTemplateIncludeStructure').checked;
    const includeContent = document.getElementById('saveTemplateIncludeContent').checked;
    
    if (!name) {
        showStatusMessage('Please enter a template name', 'error');
        return;
    }
    
    const boardData = window.boardData;
    
    const newTemplate = {
        name,
        description,
        category,
        groups: includeStructure ? JSON.parse(JSON.stringify(boardData.groups)) : [],
        rows: [],
        columns: JSON.parse(JSON.stringify(boardData.columns))
    };
    
    // Process rows and cards based on selection
    if (includeStructure) {
        newTemplate.rows = boardData.rows.map(row => {
            const newRow = {
                id: row.id,
                name: row.name,
                description: row.description,
                groupId: row.groupId,
                cards: {}
            };
            
            // Initialize card arrays for each column
            boardData.columns.forEach(column => {
                newRow.cards[column.key] = [];
            });
            
            // Include cards if requested
            if (includeContent) {
                Object.keys(row.cards).forEach(columnKey => {
                    if (row.cards[columnKey]) {
                        newRow.cards[columnKey] = row.cards[columnKey].map(card => ({
                            title: card.title,
                            description: card.description || '',
                            priority: card.priority || 'medium',
                            completed: false,
                            subtasks: card.subtasks ? JSON.parse(JSON.stringify(card.subtasks)) : []
                        }));
                    }
                });
            }
            
            return newRow;
        });
    }
    
    try {
        await templateAdapter.createTemplate(newTemplate);
    } catch (error) {
        console.error('Failed to save template:', error);
        showStatusMessage('Failed to save template', 'error');
        return;
    }
    
    closeSaveAsTemplateModal();
    await updateTemplatesUI();
    
    showStatusMessage('Template saved successfully', 'success');
}

/**
 * Show create template modal
 */
export function showCreateTemplateModal() {
    document.getElementById('createTemplateModal').style.display = 'block';
}

/**
 * Close create template modal
 */
export function closeCreateTemplateModal() {
    document.getElementById('createTemplateModal').style.display = 'none';
}

/**
 * Create new template from scratch
 * @param {Event} event - Form submit event
 */
export async function createTemplate(event) {
    event.preventDefault();
    
    const name = document.getElementById('templateName').value.trim();
    const description = document.getElementById('templateDescription').value.trim();
    const category = document.getElementById('templateCategory').value;
    
    if (!name) {
        showStatusMessage('Please enter a template name', 'error');
        return;
    }
    
    const newTemplate = {
        name,
        description,
        category,
        groups: [],
        rows: [],
        columns: [
            { id: 1, name: 'To Do', key: 'todo' },
            { id: 2, name: 'In Progress', key: 'inprogress' },
            { id: 3, name: 'Done', key: 'done' }
        ]
    };
    
    try {
        await templateAdapter.createTemplate(newTemplate);
    } catch (error) {
        console.error('Failed to create template:', error);
        showStatusMessage('Failed to create template', 'error');
        return;
    }
    
    closeCreateTemplateModal();
    await updateTemplatesUI();
    
    showStatusMessage('Template created successfully', 'success');
}

/**
 * Show apply template modal
 */
export function showApplyTemplateModal() {
    populateTemplateCategories();
    populateTemplateList();
    document.getElementById('applyTemplateModal').style.display = 'block';
}

/**
 * Close apply template modal
 */
export function closeApplyTemplateModal() {
    document.getElementById('applyTemplateModal').style.display = 'none';
    selectedTemplateId = null;
}

/**
 * Populate template categories dropdown
 */
export async function populateTemplateCategories() {
    const templates = await templateAdapter.getAll();
    const categories = ['All', ...new Set(templates.map(t => t.category).filter(Boolean))];
    
    const container = document.getElementById('templateCategories');
    if (!container) return;
    
    container.innerHTML = categories.map(category => `
        <button class="category-btn ${category === 'All' ? 'active' : ''}" 
                onclick="window.templateSystem.filterTemplatesByCategory('${category}')">
            ${category}
        </button>
    `).join('');
}

/**
 * Filter templates by category
 * @param {string} category - Category to filter by
 */
export function filterTemplatesByCategory(category) {
    // Update active category button
    document.querySelectorAll('#templateCategories .category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.trim() === category);
    });
    
    populateTemplateList(category);
}

/**
 * Populate template list
 * @param {string} filterCategory - Category to filter by
 */
export async function populateTemplateList(filterCategory = 'All') {
    const allTemplates = await templateAdapter.getAll();
    const templates = filterCategory === 'All' 
        ? allTemplates 
        : allTemplates.filter(t => t.category === filterCategory);
    
    const container = document.getElementById('templateList');
    if (!container) return;
    
    if (templates.length === 0) {
        container.innerHTML = '<div class="no-templates">No templates found in this category.</div>';
        return;
    }
    
    container.innerHTML = templates.map(template => `
        <div class="template-item ${selectedTemplateId === template.id ? 'selected' : ''}" 
             onclick="window.templateSystem.selectTemplate(${template.id})">
            <div class="template-header">
                <div class="template-name">${template.name}</div>
                <div class="template-category">${template.category}</div>
            </div>
            <div class="template-description">${template.description}</div>
            <div class="template-stats">
                <span>${template.groups?.length || 0} groups</span>
                <span>${template.rows?.length || 0} rows</span>
                <span>${template.columns?.length || 0} columns</span>
            </div>
            <div class="template-date">
                Created: ${new Date(template.createdAt).toLocaleDateString()}
            </div>
        </div>
    `).join('');
}

/**
 * Select a template
 * @param {number} templateId - Template ID to select
 */
export function selectTemplate(templateId) {
    selectedTemplateId = templateId;
    
    // Update visual selection
    document.querySelectorAll('#templateList .template-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    const selectedItem = document.querySelector(`#templateList .template-item[onclick*="${templateId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }
    
    // Update apply button
    const applyBtn = document.getElementById('applyTemplateBtn');
    if (applyBtn) {
        applyBtn.disabled = false;
    }
}

/**
 * Apply selected template
 */
export async function applySelectedTemplate() {
    if (!selectedTemplateId) {
        showStatusMessage('Please select a template first', 'error');
        return;
    }
    
    const template = await templateAdapter.getById(selectedTemplateId);
    if (!template) {
        showStatusMessage('Template not found', 'error');
        return;
    }
    
    const applyMode = document.querySelector('input[name="applyMode"]:checked')?.value || 'current';
    
    if (applyMode === 'new') {
        const newBoardName = document.getElementById('newBoardName').value.trim();
        if (!newBoardName) {
            showStatusMessage('Please enter a name for the new board', 'error');
            return;
        }
        
        await createBoardFromTemplate(template, newBoardName);
    } else {
        await addTemplateToCurrentBoard(template);
    }
    
    closeApplyTemplateModal();
}

/**
 * Create new board from template
 * @param {Object} template - Template object
 * @param {string} boardName - Name for new board
 */
export async function createBoardFromTemplate(template, boardName) {
    const appData = getAppData();
    const newBoard = createDefaultBoard();
    
    newBoard.name = boardName;
    newBoard.createdAt = new Date().toISOString();
    
    // Apply template structure
    if (template.groups) {
        newBoard.groups = JSON.parse(JSON.stringify(template.groups));
        newBoard.nextGroupId = Math.max(1, ...newBoard.groups.map(g => g.id)) + 1;
    }
    
    if (template.columns) {
        newBoard.columns = JSON.parse(JSON.stringify(template.columns));
        newBoard.nextColumnId = Math.max(1, ...newBoard.columns.map(c => c.id)) + 1;
    }
    
    if (template.rows) {
        newBoard.rows = template.rows.map(templateRow => {
            const newRow = {
                id: newBoard.nextRowId++,
                name: templateRow.name,
                description: templateRow.description,
                groupId: templateRow.groupId,
                cards: {}
            };
            
            // Initialize card arrays for all columns
            newBoard.columns.forEach(column => {
                newRow.cards[column.key] = [];
            });
            
            // Add template cards
            if (templateRow.cards) {
                Object.keys(templateRow.cards).forEach(columnKey => {
                    if (newRow.cards[columnKey] && templateRow.cards[columnKey]) {
                        templateRow.cards[columnKey].forEach(templateCard => {
                            const newCard = {
                                id: newBoard.nextCardId++,
                                title: templateCard.title,
                                description: templateCard.description || '',
                                priority: templateCard.priority || 'medium',
                                completed: false,
                                dueDate: null,
                                taskIds: []
                            };
                            
                            // Convert subtasks to unified task system if they exist
                            if (templateCard.subtasks && templateCard.subtasks.length > 0) {
                                const taskIds = [];
                                templateCard.subtasks.forEach(subtask => {
                                    const taskId = `task_${appData.nextTaskId++}`;
                                    if (!appData.entities.tasks) appData.entities.tasks = {};
                                    
                                    appData.entities.tasks[taskId] = {
                                        id: taskId,
                                        text: subtask.text,
                                        completed: false,
                                        dueDate: null,
                                        priority: 'medium',
                                        parentType: 'card',
                                        parentId: newCard.id.toString(),
                                        tags: [],
                                        createdAt: new Date().toISOString(),
                                        updatedAt: new Date().toISOString()
                                    };
                                    taskIds.push(taskId);
                                });
                                
                                if (taskIds.length > 0) {
                                    newCard.taskIds = taskIds;
                                    if (!appData.relationships.entityTasks) appData.relationships.entityTasks = {};
                                    appData.relationships.entityTasks[newCard.id.toString()] = taskIds;
                                }
                            }
                            
                            newRow.cards[columnKey].push(newCard);
                        });
                    }
                });
            }
            
            return newRow;
        });
    }
    
    // Create new board and switch to it
    const newBoardId = `board_${Date.now()}`;
    appData.boards[newBoardId] = newBoard;
    appData.currentBoardId = newBoardId;
    
    setAppData(appData);
    window.boardData = newBoard;
    saveData();
    
    // Update UI
    if (window.boardManagement) {
        window.boardManagement.updateBoardTitle();
        window.boardManagement.updateCurrentBoardDisplay();
    }
    if (window.renderBoard) window.renderBoard();
    if (window.taskManagement) window.taskManagement.switchToView('board');
    
    showStatusMessage(`Board "${boardName}" created from template`, 'success');
}

/**
 * Add template to current board
 * @param {Object} template - Template object
 */
export async function addTemplateToCurrentBoard(template) {
    const appData = getAppData();
    const boardData = window.boardData;
    
    // Add template groups (avoid duplicates)
    if (template.groups) {
        template.groups.forEach(templateGroup => {
            const existingGroup = boardData.groups.find(g => g.name === templateGroup.name);
            if (!existingGroup) {
                const newGroup = { ...templateGroup, id: boardData.nextGroupId++ };
                boardData.groups.push(newGroup);
            }
        });
    }
    
    // Add template rows
    if (template.rows) {
        template.rows.forEach(templateRow => {
            const newRow = {
                id: boardData.nextRowId++,
                name: templateRow.name,
                description: templateRow.description,
                groupId: templateRow.groupId,
                cards: {}
            };
            
            // Initialize card arrays for all columns
            boardData.columns.forEach(column => {
                newRow.cards[column.key] = [];
            });
            
            // Add template cards
            if (templateRow.cards) {
                Object.keys(templateRow.cards).forEach(columnKey => {
                    if (newRow.cards[columnKey] && templateRow.cards[columnKey]) {
                        templateRow.cards[columnKey].forEach(templateCard => {
                            const newCard = {
                                id: boardData.nextCardId++,
                                title: templateCard.title,
                                description: templateCard.description || '',
                                priority: templateCard.priority || 'medium',
                                completed: false,
                                dueDate: null,
                                taskIds: []
                            };
                            
                            newRow.cards[columnKey].push(newCard);
                        });
                    }
                });
            }
            
            boardData.rows.push(newRow);
        });
    }
    
    setAppData(appData);
    saveData();
    
    // Update UI
    if (window.renderBoard) window.renderBoard();
    if (window.updateSettingsUI) window.updateSettingsUI();
    
    showStatusMessage('Template added to current board', 'success');
}

/**
 * Update templates UI display
 */
export async function updateTemplatesUI() {
    const templatesGrid = document.getElementById('templatesGrid');
    if (!templatesGrid) return;
    
    const templates = await templateAdapter.getAll();
    
    if (templates.length === 0) {
        templatesGrid.innerHTML = '<div class="no-templates">No templates created yet.</div>';
        return;
    }
    
    templatesGrid.innerHTML = templates.map(template => `
        <div class="template-card">
            <div class="template-card-header">
                <div class="template-card-name">${template.name}</div>
                <div class="template-card-category">${template.category}</div>
            </div>
            <div class="template-card-description">${template.description}</div>
            <div class="template-card-stats">
                <span>${template.groups?.length || 0} groups</span>
                <span>${template.rows?.length || 0} rows</span>
                <span>${template.columns?.length || 0} columns</span>
            </div>
            <div class="template-card-actions">
                <button class="btn btn-small btn-primary" onclick="window.templateSystem.applyTemplateQuick(${template.id})">
                    Apply
                </button>
                <button class="btn btn-small btn-danger" onclick="window.templateSystem.deleteTemplate(${template.id})">
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Apply template quickly (to current board)
 * @param {number} templateId - Template ID
 */
export async function applyTemplateQuick(templateId) {
    const template = await templateAdapter.getById(templateId);
    if (template) {
        await addTemplateToCurrentBoard(template);
    }
}

/**
 * Delete template
 * @param {number} templateId - Template ID to delete
 */
export async function deleteTemplate(templateId) {
    const template = await templateAdapter.getById(templateId);
    
    if (!template) {
        showStatusMessage('Template not found', 'error');
        return;
    }
    
    if (confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
        try {
            await templateAdapter.delete(templateId);
            await updateTemplatesUI();
            showStatusMessage('Template deleted', 'success');
        } catch (error) {
            console.error('Failed to delete template:', error);
            showStatusMessage('Failed to delete template', 'error');
        }
    }
}

/**
 * Populate default templates for new installations
 */
export async function populateDefaultTemplates() {
    const existingTemplates = await templateAdapter.getAll();
    
    if (existingTemplates.length > 0) return; // Already has templates
    
    const defaultTemplates = [
        {
            name: 'Grant Application Process',
            description: 'Complete workflow for managing grant applications from research to submission',
            category: 'Business',
            createdAt: new Date().toISOString(),
            groups: [
                { id: 1, name: 'Research & Planning', color: '#0079bf', collapsed: false },
                { id: 2, name: 'Application Development', color: '#d29034', collapsed: false },
                { id: 3, name: 'Review & Submission', color: '#519839', collapsed: false }
            ],
            rows: [
                {
                    id: 1,
                    name: 'Funding Opportunity Research',
                    description: 'Identify and research potential funding sources',
                    groupId: 1,
                    cards: {
                        todo: [
                            { title: 'Search grant databases', description: 'Use Foundation Directory Online, Grants.gov', priority: 'high' },
                            { title: 'Review eligibility criteria', description: 'Ensure organization meets all requirements', priority: 'high' }
                        ],
                        inprogress: [],
                        done: []
                    }
                },
                {
                    id: 2,
                    name: 'Proposal Writing',
                    description: 'Develop the grant proposal content',
                    groupId: 2,
                    cards: {
                        todo: [
                            { title: 'Draft project narrative', description: 'Write compelling project description', priority: 'high' },
                            { title: 'Prepare budget', description: 'Detail all project costs', priority: 'medium' },
                            { title: 'Gather supporting documents', description: 'Collect letters of support, certifications', priority: 'medium' }
                        ],
                        inprogress: [],
                        done: []
                    }
                }
            ],
            columns: [
                { id: 1, name: 'To Do', key: 'todo' },
                { id: 2, name: 'In Progress', key: 'inprogress' },
                { id: 3, name: 'Done', key: 'done' }
            ]
        },
        {
            name: 'Employee Onboarding',
            description: 'Comprehensive checklist for new employee onboarding process',
            category: 'HR',
            createdAt: new Date().toISOString(),
            groups: [
                { id: 1, name: 'Pre-boarding', color: '#eb5a46', collapsed: false },
                { id: 2, name: 'First Day', color: '#ff9f1a', collapsed: false },
                { id: 3, name: 'First Week', color: '#519839', collapsed: false }
            ],
            rows: [
                {
                    id: 1,
                    name: 'Documentation Setup',
                    description: 'Prepare all necessary paperwork and accounts',
                    groupId: 1,
                    cards: {
                        todo: [
                            { title: 'Prepare employment contract', description: 'Draft and review legal documents', priority: 'high' },
                            { title: 'Create IT accounts', description: 'Set up email, system access, etc.', priority: 'high' }
                        ],
                        inprogress: [],
                        done: []
                    }
                },
                {
                    id: 2,
                    name: 'Workspace Preparation',
                    description: 'Set up physical and digital workspace',
                    groupId: 2,
                    cards: {
                        todo: [
                            { title: 'Prepare desk and equipment', description: 'Set up computer, phone, supplies', priority: 'medium' },
                            { title: 'Schedule orientation meetings', description: 'Meet with team and key stakeholders', priority: 'medium' }
                        ],
                        inprogress: [],
                        done: []
                    }
                }
            ],
            columns: [
                { id: 1, name: 'To Do', key: 'todo' },
                { id: 2, name: 'In Progress', key: 'inprogress' },
                { id: 3, name: 'Done', key: 'done' }
            ]
        }
    ];
    
    try {
        for (const template of defaultTemplates) {
            await templateAdapter.createTemplate(template);
        }
    } catch (error) {
        console.error('Failed to populate default templates:', error);
    }
}

// Templates menu navigation functions moved to js/navigation.js

/**
 * Close all dropdown menus
 */
function closeAllDropdowns() {
    // Close templates dropdown
    const templatesDropdown = document.getElementById('templatesDropdown');
    if (templatesDropdown) templatesDropdown.style.display = 'none';
    
    // Close board dropdown
    if (window.boardManagement && window.boardManagement.closeBoardDropdown) {
        window.boardManagement.closeBoardDropdown();
    }
    
    // Remove event listeners
    document.removeEventListener('click', handleTemplatesOutsideClick);
}

// Checklist template system functions
/**
 * Create checklist template
 * @param {string} name - Template name
 * @param {string} description - Template description
 * @param {Array} tasks - Array of task objects
 * @param {string} category - Template category
 * @param {Array} tags - Array of tags
 * @returns {Object} Created template
 */
export function createChecklistTemplate(name, description, tasks, category = 'general', tags = []) {
    const appData = getAppData();
    
    const template = {
        id: appData.nextTemplateId++,
        name,
        description,
        category,
        tags,
        type: 'checklist',
        tasks: tasks.map(task => ({
            text: task.text || task,
            priority: task.priority || 'medium',
            estimated_time: task.estimated_time || null
        })),
        createdAt: new Date().toISOString(),
        usageCount: 0
    };
    
    appData.templates.push(template);
    setAppData(appData);
    saveData();
    
    return template;
}

/**
 * Apply checklist template to a target
 * @param {number} templateId - Template ID
 * @param {string} targetType - Type of target ('card', 'row')
 * @param {string} targetId - Target ID
 */
export function applyChecklistTemplate(templateId, targetType, targetId) {
    const appData = getAppData();
    const template = appData.templates.find(t => t.id === templateId && t.type === 'checklist');
    
    if (!template) {
        showStatusMessage('Checklist template not found', 'error');
        return;
    }
    
    if (targetType === 'card') {
        // Find the card and add tasks
        const boardData = window.boardData;
        let targetCard = null;
        let rowFound = false;
        
        for (const row of boardData.rows) {
            for (const columnKey of Object.keys(row.cards)) {
                targetCard = row.cards[columnKey].find(c => c.id?.toString() === targetId?.toString());
                if (targetCard) {
                    rowFound = true;
                    break;
                }
            }
            if (rowFound) break;
        }
        
        if (targetCard) {
            // Add template tasks to card
            const taskIds = [];
            template.tasks.forEach(task => {
                const taskId = `task_${appData.nextTaskId++}`;
                
                if (!appData.entities.tasks) appData.entities.tasks = {};
                appData.entities.tasks[taskId] = {
                    id: taskId,
                    text: task.text,
                    completed: false,
                    priority: task.priority,
                    parentType: 'card',
                    parentId: targetCard.id.toString(),
                    tags: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                taskIds.push(taskId);
            });
            
            // Update card with new tasks
            if (taskIds.length > 0) {
                if (!targetCard.taskIds) targetCard.taskIds = [];
                targetCard.taskIds.push(...taskIds);
                
                if (!appData.relationships.entityTasks) appData.relationships.entityTasks = {};
                if (!appData.relationships.entityTasks[targetCard.id.toString()]) {
                    appData.relationships.entityTasks[targetCard.id.toString()] = [];
                }
                appData.relationships.entityTasks[targetCard.id.toString()].push(...taskIds);
            }
            
            // Update usage count
            template.usageCount = (template.usageCount || 0) + 1;
            
            setAppData(appData);
            saveData();
            
            showStatusMessage(`Added ${template.tasks.length} tasks from template`, 'success');
        }
    }
}

/**
 * Get checklist templates
 * @param {string} category - Category filter
 * @returns {Array} Array of checklist templates
 */
export function getChecklistTemplates(category = null) {
    const appData = getAppData();
    const templates = appData.templates.filter(t => t.type === 'checklist');
    
    if (category) {
        return templates.filter(t => t.category === category);
    }
    
    return templates;
}

/**
 * Update checklist template
 * @param {number} templateId - Template ID
 * @param {Object} updates - Updates to apply
 */
export function updateChecklistTemplate(templateId, updates) {
    const appData = getAppData();
    const template = appData.templates.find(t => t.id === templateId);
    
    if (template) {
        Object.assign(template, updates);
        template.updatedAt = new Date().toISOString();
        setAppData(appData);
        saveData();
        return template;
    }
    
    return null;
}

/**
 * Delete checklist template
 * @param {number} templateId - Template ID
 */
export function deleteChecklistTemplate(templateId) {
    const appData = getAppData();
    appData.templates = appData.templates.filter(t => t.id !== templateId);
    setAppData(appData);
    saveData();
}

// Make functions available globally for backwards compatibility during transition
window.showSaveAsTemplateModal = showSaveAsTemplateModal;
window.closeSaveAsTemplateModal = closeSaveAsTemplateModal;
window.updateTemplatePreview = updateTemplatePreview;
window.saveAsTemplate = saveAsTemplate;
window.showCreateTemplateModal = showCreateTemplateModal;
window.closeCreateTemplateModal = closeCreateTemplateModal;
window.createTemplate = createTemplate;
window.showApplyTemplateModal = showApplyTemplateModal;
window.closeApplyTemplateModal = closeApplyTemplateModal;
window.populateTemplateCategories = populateTemplateCategories;
window.filterTemplatesByCategory = filterTemplatesByCategory;
window.populateTemplateList = populateTemplateList;
window.selectTemplate = selectTemplate;
window.applySelectedTemplate = applySelectedTemplate;
window.createBoardFromTemplate = createBoardFromTemplate;
window.addTemplateToCurrentBoard = addTemplateToCurrentBoard;
window.updateTemplatesUI = updateTemplatesUI;
window.applyTemplateQuick = applyTemplateQuick;
window.deleteTemplate = deleteTemplate;
window.populateDefaultTemplates = populateDefaultTemplates;
window.toggleTemplatesMenu = toggleTemplatesMenu;
window.closeTemplatesMenu = closeTemplatesMenu;
window.createChecklistTemplate = createChecklistTemplate;
window.applyChecklistTemplate = applyChecklistTemplate;
window.getChecklistTemplates = getChecklistTemplates;
window.updateChecklistTemplate = updateChecklistTemplate;
window.deleteChecklistTemplate = deleteChecklistTemplate;

// Export module for access by other modules
window.templateSystem = {
    showSaveAsTemplateModal,
    closeSaveAsTemplateModal,
    updateTemplatePreview,
    saveAsTemplate,
    showCreateTemplateModal,
    closeCreateTemplateModal,
    createTemplate,
    showApplyTemplateModal,
    closeApplyTemplateModal,
    populateTemplateCategories,
    filterTemplatesByCategory,
    populateTemplateList,
    selectTemplate,
    applySelectedTemplate,
    createBoardFromTemplate,
    addTemplateToCurrentBoard,
    updateTemplatesUI,
    applyTemplateQuick,
    deleteTemplate,
    populateDefaultTemplates,
    toggleTemplatesMenu,
    closeTemplatesMenu,
    createChecklistTemplate,
    applyChecklistTemplate,
    getChecklistTemplates,
    updateChecklistTemplate,
    deleteChecklistTemplate
};