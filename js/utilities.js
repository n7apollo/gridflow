import { getCurrentOutlineData } from './core-data.js';

/**
 * GridFlow - Utilities Module
 * Common utility functions and event handling
 */

// Status message functionality
export function showStatusMessage(message, type = 'info') {
    const statusMessage = document.getElementById('statusMessage');
    
    // Remove any existing status classes
    statusMessage.className = 'status-message';
    
    // Add the appropriate type class
    statusMessage.classList.add(type);
    
    // Set the message text
    statusMessage.textContent = message;
    
    // Show the message
    statusMessage.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        statusMessage.style.display = 'none';
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

// Sidebar functionality moved to js/navigation.js

/**
 * Outline modal functions
 */
export function closeOutlineModal() {
    document.getElementById('outlineModal').style.display = 'none';
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