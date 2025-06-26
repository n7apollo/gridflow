/**
 * GridFlow - Utilities Module
 * Cross-cutting utility functions for UI, clipboard, and event management
 */

// Current outline data for clipboard operations
let currentOutlineData = null;

/**
 * Display status messages to the user
 * @param {string} message - Message to display
 * @param {string} type - Message type ('info', 'success', 'error')
 */
export function showStatusMessage(message, type = 'info') {
    // Remove existing messages
    const existing = document.querySelector('.status-message');
    if (existing) {
        existing.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `status-message ${type}`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

/**
 * Set up global event listeners for the application
 */
export function setupEventListeners() {
    // Card form
    document.getElementById('cardForm').addEventListener('submit', window.saveCard);
    
    // Row form
    document.getElementById('rowForm').addEventListener('submit', window.saveRow);
    
    // Column form
    document.getElementById('columnForm').addEventListener('submit', window.saveColumn);
    
    // Group form
    document.getElementById('groupForm').addEventListener('submit', window.saveGroup);
    
    // Board edit form
    document.getElementById('boardEditForm').addEventListener('submit', window.saveBoardEdit);
    
    // Modal close on outside click
    window.addEventListener('click', function(event) {
        const cardModal = document.getElementById('cardModal');
        const rowModal = document.getElementById('rowModal');
        const columnModal = document.getElementById('columnModal');
        const groupModal = document.getElementById('groupModal');
        const exportModal = document.getElementById('exportModal');
        const outlineModal = document.getElementById('outlineModal');
        const boardModal = document.getElementById('boardModal');
        const boardEditModal = document.getElementById('boardEditModal');
        
        if (event.target === cardModal) window.closeModal();
        if (event.target === rowModal) window.closeRowModal();
        if (event.target === columnModal) window.closeColumnModal();
        if (event.target === groupModal) window.closeGroupModal();
        if (event.target === exportModal) window.closeExportModal();
        if (event.target === outlineModal) closeOutlineModal();
        if (event.target === boardModal) window.closeBoardModal();
        if (event.target === boardEditModal) window.closeBoardEditModal();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            window.closeModal();
            window.closeRowModal();
            window.closeColumnModal();
            window.closeGroupModal();
            window.closeExportModal();
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

/**
 * Sidebar functionality
 */
export function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    const toggleIcon = document.querySelector('.toggle-icon');
    
    if (window.innerWidth <= 600) {
        // Mobile: toggle sidebar visibility
        sidebar.classList.toggle('open');
    } else if (window.innerWidth <= 900) {
        // Tablet: sidebar is always collapsed but visible
        return;
    } else {
        // Desktop: toggle between full and collapsed
        if (sidebar.style.width === '64px') {
            sidebar.style.width = '260px';
            mainContent.style.marginLeft = '260px';
            toggleIcon.textContent = '‹';
        } else {
            sidebar.style.width = '64px';
            mainContent.style.marginLeft = '64px';
            toggleIcon.textContent = '›';
        }
    }
}

/**
 * Handle responsive sidebar behavior
 */
export function handleSidebarResize() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (window.innerWidth <= 600) {
        // Mobile: sidebar off-canvas
        sidebar.style.width = '';
        mainContent.style.marginLeft = '';
        sidebar.classList.remove('open');
    } else if (window.innerWidth <= 900) {
        // Tablet: collapsed sidebar
        sidebar.style.width = '';
        mainContent.style.marginLeft = '';
    } else {
        // Desktop: full sidebar (unless manually collapsed)
        if (sidebar.style.width !== '64px') {
            sidebar.style.width = '';
            mainContent.style.marginLeft = '';
        }
    }
}

/**
 * Initialize sidebar on page load
 */
export function initializeSidebar() {
    handleSidebarResize();
    window.addEventListener('resize', handleSidebarResize);
}

/**
 * Outline modal functions
 */
export function closeOutlineModal() {
    document.getElementById('outlineModal').style.display = 'none';
}

/**
 * Copy outline as formatted HTML/text
 */
export async function copyOutlineAsFormatted() {
    try {
        // Try to copy as HTML if supported
        if (navigator.clipboard && navigator.clipboard.write) {
            const htmlBlob = new Blob([currentOutlineData.html], { type: 'text/html' });
            const textBlob = new Blob([currentOutlineData.plain], { type: 'text/plain' });
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': htmlBlob,
                    'text/plain': textBlob
                })
            ]);
        } else {
            // Fallback to plain text
            await copyToClipboard(currentOutlineData.plain);
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
        await copyToClipboard(currentOutlineData.plain);
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
        await copyToClipboard(currentOutlineData.markdown);
        showStatusMessage('Markdown outline copied to clipboard!', 'success');
    } catch (err) {
        console.error('Failed to copy markdown outline:', err);
        showStatusMessage('Failed to copy outline', 'error');
    }
}

/**
 * Copy text to clipboard with fallback for older browsers
 * @param {string} text - Text to copy
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

/**
 * Set current outline data for clipboard operations
 * @param {Object} outlineData - Outline data object with html, plain, markdown properties
 */
export function setCurrentOutlineData(outlineData) {
    currentOutlineData = outlineData;
}

/**
 * Get current outline data
 * @returns {Object} Current outline data
 */
export function getCurrentOutlineData() {
    return currentOutlineData;
}

/**
 * Show column outline modal
 * @param {string} columnKey - Column key to generate outline for
 */
export function showColumnOutline(columnKey) {
    const column = window.boardData.columns.find(c => c.key === columnKey);
    if (!column) return;
    
    // Set modal title
    document.getElementById('outlineModalTitle').textContent = `${column.name} - Column Outline`;
    
    // Generate outline data
    const outlineData = generateColumnOutline(columnKey);
    currentOutlineData = outlineData;
    
    // Display HTML outline
    document.getElementById('outlineContent').innerHTML = outlineData.html;
    
    // Show modal
    document.getElementById('outlineModal').style.display = 'block';
}

/**
 * Generate column outline data in multiple formats
 * @param {string} columnKey - Column key to generate outline for
 * @returns {Object} Outline data with html, plain, and markdown properties
 */
export function generateColumnOutline(columnKey) {
    let html = '<ul>';
    let plain = '';
    let markdown = '';
    
    // Sort rows by group if groups exist
    const sortedRows = [...window.boardData.rows].sort((a, b) => {
        const groupA = window.boardData.groups.find(g => g.id === a.groupId);
        const groupB = window.boardData.groups.find(g => g.id === b.groupId);
        
        if (groupA && groupB) {
            const groupAIndex = window.boardData.groups.findIndex(g => g.id === a.groupId);
            const groupBIndex = window.boardData.groups.findIndex(g => g.id === b.groupId);
            return groupAIndex - groupBIndex;
        } else if (groupA) {
            return -1;
        } else if (groupB) {
            return 1;
        } else {
            return 0;
        }
    });
    
    let currentGroup = null;
    
    sortedRows.forEach(row => {
        const cards = row.cards[columnKey] || [];
        if (cards.length === 0) return;
        
        // Check if we need a new group header
        const rowGroup = window.boardData.groups.find(g => g.id === row.groupId);
        if (rowGroup && rowGroup !== currentGroup) {
            currentGroup = rowGroup;
            html += `<li><strong style="color: ${rowGroup.color}">${rowGroup.name}</strong><ul>`;
            plain += `${rowGroup.name}\n`;
            markdown += `## ${rowGroup.name}\n\n`;
        }
        
        // Add row header
        html += `<li><strong>${row.name}</strong>`;
        plain += `  ${row.name}\n`;
        markdown += `### ${row.name}\n\n`;
        
        // Add cards
        if (cards.length > 0) {
            html += '<ul>';
            cards.forEach(card => {
                html += `<li>${card.title}`;
                plain += `    • ${card.title}`;
                markdown += `- ${card.title}`;
                
                if (card.description) {
                    html += ` - ${card.description}`;
                    plain += ` - ${card.description}`;
                    markdown += ` - ${card.description}`;
                }
                
                html += '</li>';
                plain += '\n';
                markdown += '\n';
            });
            html += '</ul>';
        }
        html += '</li>';
        
        if (rowGroup && currentGroup) {
            // We'll close the group when we switch to a different one or at the end
        }
    });
    
    // Close any open groups
    if (currentGroup) {
        html += '</ul></li>';
    }
    
    html += '</ul>';
    
    return { html, plain, markdown };
}

// Make functions available globally for backwards compatibility during transition
window.showStatusMessage = showStatusMessage;
window.setupEventListeners = setupEventListeners;
window.toggleSidebar = toggleSidebar;
window.initializeSidebar = initializeSidebar;
window.copyOutlineAsFormatted = copyOutlineAsFormatted;
window.copyOutlineAsPlain = copyOutlineAsPlain;
window.copyOutlineAsMarkdown = copyOutlineAsMarkdown;
window.closeOutlineModal = closeOutlineModal;
window.showColumnOutline = showColumnOutline;
window.generateColumnOutline = generateColumnOutline;