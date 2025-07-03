/**
 * GridFlow - Template Library Module
 * Handles Phase 2 template library system with reusable task sets, 
 * checklist templates, and note templates for common workflows
 */

import { saveData, appData } from './core-data.js';
import { showStatusMessage } from './utilities.js';
import { metaService } from './meta-service.js';

/**
 * Create a reusable task set template for common task patterns
 * @param {string} name - Template name
 * @param {string} description - Template description
 * @param {Array} tasks - Array of task objects or strings
 * @param {string} category - Template category (default: 'general')
 * @param {Array} tags - Array of tags for organization
 * @returns {string} - Template ID
 */
export async function createTaskSet(name, description, tasks, category = 'general', tags = []) {
    try {
        const taskSet = await metaService.createTemplate(name, description, 'task_set', {
            tasks: tasks.map(task => ({
                text: task.text || task,
                priority: task.priority || 'medium',
                estimatedTime: task.estimatedTime || null,
                dependencies: task.dependencies || []
            })),
            tags,
            isPublic: false
        });
        
        return taskSet.id;
    } catch (error) {
        console.error('Failed to create task set:', error);
        throw error;
    }
}

/**
 * Apply a task set template to a specific card
 * @param {string} templateId - Template ID to apply
 * @param {number|string} cardId - Target card ID
 * @param {string} boardId - Board ID containing the card
 * @returns {Array|null} - Array of new task IDs or null if failed
 */
export async function applyTaskSetToCard(templateId, cardId, boardId) {
    
    const template = await metaService.getTemplate(templateId);
    if (!template) return null;
    
    const board = appData.boards[boardId];
    if (!board) return null;
    
    // Find the card
    let targetCard = null;
    board.rows.forEach(row => {
        Object.keys(row.cards).forEach(columnKey => {
            const card = row.cards[columnKey].find(c => c.id == cardId);
            if (card) targetCard = card;
        });
    });
    
    if (!targetCard) return null;
    
    // Ensure card has taskIds array
    if (!targetCard.taskIds) targetCard.taskIds = [];
    
    const newTaskIds = [];
    
    // Create task entities from template
    template.structure.tasks.forEach(taskTemplate => {
        const taskId = `task_${appData.nextTaskId++}`;
        
        appData.entities.tasks[taskId] = {
            id: taskId,
            text: taskTemplate.text,
            completed: false,
            dueDate: null,
            priority: taskTemplate.priority,
            parentType: 'card',
            parentId: cardId.toString(),
            tags: [...(template.structure.tags || [])],
            estimatedTime: taskTemplate.estimatedTime,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        newTaskIds.push(taskId);
        targetCard.taskIds.push(taskId);
    });
    
    // Update relationships
    const cardKey = cardId.toString();
    if (!appData.relationships.entityTasks[cardKey]) {
        appData.relationships.entityTasks[cardKey] = [];
    }
    appData.relationships.entityTasks[cardKey].push(...newTaskIds);
    
    // Track template usage
    if (!appData.relationships.templateUsage[templateId]) {
        appData.relationships.templateUsage[templateId] = [];
    }
    appData.relationships.templateUsage[templateId].push({
        entityType: 'card',
        entityId: cardId.toString(),
        usedAt: new Date().toISOString()
    });
    
    // Update usage count
    try {
        await metaService.incrementTemplateUsage(templateId);
    } catch (error) {
        console.error('Failed to update usage count:', error);
    }
    
    saveData();
    return newTaskIds;
}

/**
 * Initialize sample templates and collections for demonstration
 * Creates default checklist templates and task sets if none exist
 */
export async function initializeSampleTemplates() {
    
    // Sample Checklist Templates
    const existingChecklists = await metaService.getTemplatesByCategory('checklist');
    if (existingChecklists.length === 0) {
        // Project Planning Template
        await metaService.createTemplate(
            "Project Planning Checklist",
            "Essential steps for starting any new project",
            "checklist",
            {
                items: [
                    { text: "Define project scope and objectives", priority: "high" },
                    { text: "Identify key stakeholders", priority: "high" },
                    { text: "Create project timeline", priority: "medium" },
                    { text: "Set budget and resource requirements", priority: "medium" },
                    { text: "Establish communication channels", priority: "medium" },
                    { text: "Create risk management plan", priority: "low" }
                ],
                category: "project",
                tags: ["planning", "project"]
            }
        );
        
        // Code Review Template
        await metaService.createTemplate(
            "Code Review Checklist",
            "Quality assurance checklist for code reviews",
            "checklist",
            {
                items: [
                    { text: "Code follows style guidelines", priority: "medium" },
                    { text: "Functions are properly documented", priority: "medium" },
                    { text: "Edge cases are handled", priority: "high" },
                    { text: "Tests are written and passing", priority: "high" },
                    { text: "Performance considerations addressed", priority: "medium" },
                    { text: "Security vulnerabilities checked", priority: "high" }
                ],
                category: "development",
                tags: ["code", "review", "quality"]
            }
        );
        
        // Meeting Preparation Template
        await metaService.createTemplate(
            "Meeting Preparation",
            "Ensure meetings are productive and well-organized",
            "checklist",
            {
                items: [
                    { text: "Create agenda and share with attendees", priority: "high" },
                    { text: "Book meeting room or set up video call", priority: "medium" },
                    { text: "Prepare presentation materials", priority: "medium" },
                    { text: "Review previous meeting notes", priority: "low" },
                    { text: "Send reminder to participants", priority: "medium" }
                ],
                category: "meetings",
                tags: ["meeting", "preparation"]
            }
        );
    }
    
    // Sample Task Sets
    const existingTaskSets = await metaService.getTemplatesByCategory('task_set');
    if (existingTaskSets.length === 0) {
        // Website Launch Task Set
        await createTaskSet(
            "Website Launch Tasks",
            "Essential tasks for launching a new website",
            [
                { text: "Final content review and approval", priority: "high" },
                { text: "Cross-browser testing", priority: "high" },
                { text: "Performance optimization", priority: "medium" },
                { text: "SEO meta tags and descriptions", priority: "medium" },
                { text: "Set up analytics tracking", priority: "medium" },
                { text: "Configure backup systems", priority: "low" },
                { text: "Update DNS records", priority: "high" },
                { text: "Monitor launch for issues", priority: "high" }
            ],
            "web-development",
            ["website", "launch", "development"]
        );
        
        // Employee Onboarding Task Set
        await createTaskSet(
            "Employee Onboarding",
            "Standard onboarding tasks for new team members",
            [
                { text: "Send welcome email with first day details", priority: "high" },
                { text: "Prepare workspace and equipment", priority: "high" },
                { text: "Create accounts for all necessary systems", priority: "high" },
                { text: "Schedule introduction meetings", priority: "medium" },
                { text: "Provide company handbook and policies", priority: "medium" },
                { text: "Set up payroll and benefits", priority: "high" },
                { text: "Assign mentor or buddy", priority: "medium" }
            ],
            "hr",
            ["onboarding", "hr", "new-employee"]
        );
    }
}

// Make functions available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.createTaskSet = createTaskSet;
    window.applyTaskSetToCard = applyTaskSetToCard;
    window.initializeSampleTemplates = initializeSampleTemplates;
}