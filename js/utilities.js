import { getCurrentOutlineData, setCurrentOutlineData, getBoardData } from './core-data.js';
import { getEntity } from './entity-core.js';

/**
 * GridFlow - Utilities Module
 * Common utility functions and event handling
 */

// Status message functionality
export function showStatusMessage(message, type = 'info') {
    const statusMessage = document.getElementById('statusMessage');
    
    // Remove any existing alert classes
    statusMessage.className = 'alert fixed top-4 right-4 w-auto max-w-md z-50';
    
    // Add the appropriate DaisyUI alert type class
    switch(type) {
        case 'success':
            statusMessage.classList.add('alert-success');
            break;
        case 'error':
            statusMessage.classList.add('alert-error');
            break;
        case 'warning':
            statusMessage.classList.add('alert-warning');
            break;
        default:
            statusMessage.classList.add('alert-info');
    }
    
    // Set the message text
    statusMessage.textContent = message;
    
    // Show the message
    statusMessage.classList.remove('hidden');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        statusMessage.classList.add('hidden');
    }, 3000);
}

// ============================================
// OUTLINE FUNCTIONS
// ============================================

/**
 * Copy outline as formatted HTML/text
 */
export async function copyOutlineAsFormatted() {
    try {
        // Try to copy as HTML if supported
        if (navigator.clipboard && navigator.clipboard.write) {
            const htmlBlob = new Blob([getCurrentOutlineData().html], { type: 'text/html' });
            const textBlob = new Blob([getCurrentOutlineData().plain], { type: 'text/plain' });
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': htmlBlob,
                    'text/plain': textBlob
                })
            ]);
        } else {
            // Fallback to plain text
            await copyToClipboard(getCurrentOutlineData().plain);
        }
        showStatusMessage('Formatted outline copied to clipboard!', 'success');
    } catch (err) {
        console.error('Failed to copy formatted outline:', err);
        showStatusMessage('Failed to copy outline', 'error');
    }
}

/**
 * Copy outline as plain text
 */
export async function copyOutlineAsPlain() {
    try {
        await copyToClipboard(getCurrentOutlineData().plain);
        showStatusMessage('Plain text outline copied to clipboard!', 'success');
    } catch (err) {
        console.error('Failed to copy plain outline:', err);
        showStatusMessage('Failed to copy outline', 'error');
    }
}

/**
 * Copy outline as markdown
 */
export async function copyOutlineAsMarkdown() {
    try {
        await copyToClipboard(getCurrentOutlineData().markdown);
        showStatusMessage('Markdown outline copied to clipboard!', 'success');
    } catch (err) {
        console.error('Failed to copy markdown outline:', err);
        showStatusMessage('Failed to copy outline', 'error');
    }
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

// Make outline functions globally available for onclick handlers
if (typeof window !== 'undefined') {
    window.copyOutlineAsFormatted = copyOutlineAsFormatted;
    window.copyOutlineAsPlain = copyOutlineAsPlain;
    window.copyOutlineAsMarkdown = copyOutlineAsMarkdown;
}

/**
 * Display status messages to the user
 * @param {string} message - Message to display
 * @param {string} type - Message type ('info', 'success', 'error')
 */

/**
 * Set up global event listeners for the application
 */
export function setupEventListeners() {
    // Card form
    const cardForm = document.getElementById('cardForm');
    if (cardForm) {
        cardForm.addEventListener('submit', window.saveCard);
    }
    
    // Row form
    const rowForm = document.getElementById('rowForm');
    if (rowForm) {
        rowForm.addEventListener('submit', window.saveRow);
    }
    
    // Column form
    const columnForm = document.getElementById('columnForm');
    if (columnForm) {
        columnForm.addEventListener('submit', window.saveColumn);
    }
    
    // Group form
    const groupForm = document.getElementById('groupForm');
    if (groupForm) {
        groupForm.addEventListener('submit', window.saveGroup);
    }
    
    // Board edit form
    const boardEditForm = document.getElementById('boardEditForm');
    if (boardEditForm) {
        boardEditForm.addEventListener('submit', window.saveBoardEdit);
    }
    
    // Weekly reflection form
    const weeklyReflectionForm = document.getElementById('weeklyReflectionForm');
    if (weeklyReflectionForm) {
        weeklyReflectionForm.addEventListener('submit', window.saveWeeklyReflection);
    }
    
    // Modal close on outside click
    window.addEventListener('click', function(event) {
        const cardModal = document.getElementById('cardModal');
        const taskModal = document.getElementById('taskModal');
        const weeklyReflectionModal = document.getElementById('weeklyReflectionModal');
        const rowModal = document.getElementById('rowModal');
        const columnModal = document.getElementById('columnModal');
        const groupModal = document.getElementById('groupModal');
        const exportModal = document.getElementById('exportModal');
        const dataManagementModal = document.getElementById('dataManagementModal');
        const entityDetailModal = document.getElementById('entityDetailModal');
        const outlineModal = document.getElementById('outlineModal');
        const boardModal = document.getElementById('boardModal');
        const boardEditModal = document.getElementById('boardEditModal');
        
        // Close modals when clicking outside (on modal backdrop)
        if (event.target === cardModal && cardModal.classList.contains('modal-open')) window.closeModal();
        if (event.target === taskModal && taskModal.classList.contains('modal-open')) window.closeTaskModal();
        if (event.target === weeklyReflectionModal && weeklyReflectionModal.classList.contains('modal-open')) window.closeWeeklyReflectionModal();
        if (event.target === rowModal && rowModal.classList.contains('modal-open')) window.closeRowModal();
        if (event.target === columnModal && columnModal.classList.contains('modal-open')) window.closeColumnModal();
        if (event.target === groupModal && groupModal.classList.contains('modal-open')) window.closeGroupModal();
        if (event.target === exportModal && exportModal.classList.contains('modal-open')) window.closeExportModal();
        if (event.target === dataManagementModal && dataManagementModal.classList.contains('modal-open')) window.closeDataManagementModal();
        if (event.target === entityDetailModal && entityDetailModal.classList.contains('modal-open')) window.entityRenderer.closeEntityDetailModal();
        if (event.target === outlineModal && outlineModal.classList.contains('modal-open')) closeOutlineModal();
        if (event.target === boardModal && boardModal.classList.contains('modal-open')) window.closeBoardModal();
        if (event.target === boardEditModal && boardEditModal.classList.contains('modal-open')) window.closeBoardEditModal();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            window.closeModal();
            window.closeTaskModal();
            window.closeWeeklyReflectionModal();
            window.closeRowModal();
            window.closeColumnModal();
            window.closeGroupModal();
            window.closeExportModal();
            window.closeDataManagementModal();
            if (window.entityRenderer) window.entityRenderer.closeEntityDetailModal();
            closeOutlineModal();
            window.closeBoardModal();
            window.closeBoardEditModal();
            
            const settingsPanel = document.getElementById('settingsPanel');
            if (settingsPanel && settingsPanel.classList.contains('active')) {
                window.hideSettings();
            }
        }
    });
}

// Sidebar functionality moved to js/navigation.js

/**
 * Show column outline modal
 * @param {string} columnKey - Column key to generate outline for
 */
export async function showColumnOutline(columnKey) {
    const boardData = getBoardData();
    const column = boardData.columns.find(c => c.key === columnKey);
    if (!column) return;
    
    // Set modal title
    const modalTitle = document.getElementById('outlineModalTitle');
    if (modalTitle) {
        modalTitle.textContent = `${column.name} - Column Outline`;
    }
    
    // Generate outline data
    const outlineData = await generateColumnOutline(columnKey);
    setCurrentOutlineData(outlineData);
    
    // Display HTML outline
    const outlineContent = document.getElementById('outlineModalContent');
    if (outlineContent) {
        outlineContent.innerHTML = outlineData.html;
    }
    
    // Show modal using DaisyUI
    const modal = document.getElementById('outlineModal');
    if (modal) {
        modal.classList.add('modal-open');
    }
}

/**
 * Generate outline data for a specific column
 * @param {string} columnKey - Column key
 * @returns {Promise<Object>} Outline data with html, plain, and markdown formats
 */
async function generateColumnOutline(columnKey) {
    const boardData = getBoardData();
    let html = '<ul class="list-disc pl-4 space-y-2">';
    let plain = '';
    let markdown = '';
    
    // First, add ungrouped rows
    const ungroupedRows = boardData.rows.filter(row => !row.groupId);
    for (const row of ungroupedRows) {
        const entityIds = row.cards[columnKey] || [];
        if (entityIds.length > 0) {
            html += `<li class="mb-2"><strong class="text-base-content">${escapeHtml(row.name)}</strong>`;
            plain += `• ${row.name}\n`;
            markdown += `- ${row.name}\n`;
            
            if (entityIds.length > 0) {
                html += '<ul class="list-circle pl-4 mt-1 space-y-1">';
                for (const entityId of entityIds) {
                    const entity = await getEntity(entityId);
                    if (entity) {
                        const entityText = entity.completed ? `✓ ${entity.title}` : entity.title;
                        html += `<li class="text-sm text-base-content/80">${escapeHtml(entityText)}</li>`;
                        plain += `  ○ ${entityText}\n`;
                        markdown += `  - ${entityText}\n`;
                    }
                }
                html += '</ul>';
            }
            html += '</li>';
        }
    }
    
    // Then, add grouped rows
    for (const group of boardData.groups) {
        const groupRows = boardData.rows.filter(row => row.groupId === group.id);
        const groupHasEntities = groupRows.some(row => {
            const entityIds = row.cards[columnKey] || [];
            return entityIds.length > 0;
        });
        
        if (groupHasEntities) {
            html += `<li class="mb-3"><strong class="text-lg text-primary">${escapeHtml(group.name)}</strong>`;
            plain += `• ${group.name}\n`;
            markdown += `- **${group.name}**\n`;
            
            html += '<ul class="list-disc pl-4 mt-1 space-y-2">';
            for (const row of groupRows) {
                const entityIds = row.cards[columnKey] || [];
                if (entityIds.length > 0) {
                    html += `<li><strong class="text-base-content">${escapeHtml(row.name)}</strong>`;
                    plain += `  ○ ${row.name}\n`;
                    markdown += `  - ${row.name}\n`;
                    
                    if (entityIds.length > 0) {
                        html += '<ul class="list-circle pl-4 mt-1 space-y-1">';
                        for (const entityId of entityIds) {
                            const entity = await getEntity(entityId);
                            if (entity) {
                                const entityText = entity.completed ? `✓ ${entity.title}` : entity.title;
                                html += `<li class="text-sm text-base-content/80">${escapeHtml(entityText)}</li>`;
                                plain += `    - ${entityText}\n`;
                                markdown += `    - ${entityText}\n`;
                            }
                        }
                        html += '</ul>';
                    }
                    html += '</li>';
                }
            }
            html += '</ul></li>';
        }
    }
    
    html += '</ul>';
    
    return { html, plain, markdown };
}

/**
 * Escape HTML characters for safe display
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Outline modal functions
 */
export function closeOutlineModal() {
    const modal = document.getElementById('outlineModal');
    if (modal) {
        modal.classList.remove('modal-open');
    }
}

// Make outline functions globally available for onclick handlers
if (typeof window !== 'undefined') {
    window.copyOutlineAsFormatted = copyOutlineAsFormatted;
    window.copyOutlineAsPlain = copyOutlineAsPlain;
    window.copyOutlineAsMarkdown = copyOutlineAsMarkdown;
}

// Make functions available globally for backwards compatibility during transition
window.showStatusMessage = showStatusMessage;
window.setupEventListeners = setupEventListeners;
window.closeOutlineModal = closeOutlineModal;
window.showColumnOutline = showColumnOutline;