/**
 * GridFlow - Entity System Module
 * 
 * Phase 1: Unified entity system providing centralized management of notes, tasks, 
 * and other entities with relationship tracking for scalable data architecture.
 * 
 * This module handles:
 * - Centralized note management attached to any entity type
 * - Relationship mapping between entities (bidirectional sync)
 * - Entity change notifications for collection updates
 * - CRUD operations for notes system
 * 
 * Dependencies:
 * - appData from core-data.js (global application state)
 * - saveData from core-data.js (data persistence)
 * - showStatusMessage from utilities.js (user feedback)
 * - updateAllCollections from collections.js (smart collection updates)
 */

import { appData, saveData } from './core-data.js';
import { showStatusMessage } from './utilities.js';
import { updateAllCollections } from './collections.js';

// ============================================
// CENTRALIZED NOTES SYSTEM
// ============================================

/**
 * Create a new note entity attached to any type of parent entity
 * @param {string} title - Note title
 * @param {string} content - Note content  
 * @param {string} attachedToType - Type of parent entity ('card', 'weekly', etc.)
 * @param {string|number} attachedToId - ID of parent entity
 * @param {Array} tags - Optional tags array
 * @returns {string} - Generated note ID
 */
export function createNote(title, content, attachedToType, attachedToId, tags = []) {
    const noteId = `note_${appData.nextNoteId++}`;
    
    // Create note entity
    appData.entities.notes[noteId] = {
        id: noteId,
        title: title,
        content: content,
        attachedTo: { type: attachedToType, id: attachedToId },
        tags: tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Update relationship mapping
    const entityKey = `${attachedToType}:${attachedToId}`;
    if (!appData.relationships.entityNotes[entityKey]) {
        appData.relationships.entityNotes[entityKey] = [];
    }
    appData.relationships.entityNotes[entityKey].push(noteId);
    
    saveData();
    return noteId;
}

/**
 * Update an existing note entity
 * @param {string} noteId - Note ID to update
 * @param {string} title - New title
 * @param {string} content - New content
 * @param {Array} tags - New tags array
 * @returns {boolean} - Success status
 */
export function updateNote(noteId, title, content, tags = []) {
    if (!appData.entities.notes[noteId]) return false;
    
    appData.entities.notes[noteId].title = title;
    appData.entities.notes[noteId].content = content;
    appData.entities.notes[noteId].tags = tags;
    appData.entities.notes[noteId].updatedAt = new Date().toISOString();
    
    saveData();
    return true;
}

/**
 * Delete a note entity and clean up relationships
 * @param {string} noteId - Note ID to delete
 * @returns {boolean} - Success status
 */
export function deleteNote(noteId) {
    const note = appData.entities.notes[noteId];
    if (!note) return false;
    
    // Remove from relationship mapping
    const entityKey = `${note.attachedTo.type}:${note.attachedTo.id}`;
    if (appData.relationships.entityNotes[entityKey]) {
        appData.relationships.entityNotes[entityKey] = 
            appData.relationships.entityNotes[entityKey].filter(id => id !== noteId);
        
        // Clean up empty arrays
        if (appData.relationships.entityNotes[entityKey].length === 0) {
            delete appData.relationships.entityNotes[entityKey];
        }
    }
    
    // Remove note entity
    delete appData.entities.notes[noteId];
    
    saveData();
    return true;
}

/**
 * Delete note with user confirmation
 * @param {string} noteId - Note ID to delete
 */
export function deleteNoteConfirm(noteId) {
    const note = appData.entities.notes[noteId];
    if (!note) return;
    
    if (confirm(`Delete note "${note.title}"?`)) {
        const attachedType = note.attachedTo.type;
        const attachedId = note.attachedTo.id;
        
        deleteNote(noteId);
        
        // Re-render notes for the attached entity
        if (attachedType === 'card') {
            renderNotesForCard(attachedId, 'cardNotesList');
        }
        
        showStatusMessage('Note deleted', 'success');
    }
}

/**
 * Get all notes for a specific entity
 * @param {string} entityType - Type of entity
 * @param {string|number} entityId - Entity ID
 * @returns {Array} - Array of note entities
 */
export function getNotesForEntity(entityType, entityId) {
    const entityKey = `${entityType}:${entityId}`;
    const noteIds = appData.relationships.entityNotes[entityKey] || [];
    return noteIds.map(noteId => appData.entities.notes[noteId]).filter(Boolean);
}

/**
 * Add a note to a card with prompts for title and content
 * @param {string|number} cardId - Card ID to attach note to
 */
export function addNoteToCard(cardId) {
    const title = prompt('Note title:');
    if (!title) return;
    
    const content = prompt('Note content:');
    if (!content) return;
    
    createNote(title, content, 'card', cardId);
    renderNotesForCard(cardId, 'cardNotesList');
    showStatusMessage('Note added to card', 'success');
}

// ============================================
// ENTITY CHANGE NOTIFICATIONS
// ============================================

/**
 * Handle entity changes by updating smart collections
 * Called whenever entities are modified to keep collections in sync
 */
export function onEntityChange() {
    updateAllCollections();
}

// ============================================
// RENDER FUNCTIONS
// ============================================

/**
 * Render notes for a card in the specified container
 * @param {string|number} cardId - Card ID
 * @param {string} containerId - DOM container ID to render into
 */
export function renderNotesForCard(cardId, containerId) {
    const notes = getNotesForEntity('card', cardId);
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (notes.length === 0) {
        container.innerHTML = '<div class="no-notes">No notes yet.</div>';
        return;
    }
    
    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-item';
        noteElement.innerHTML = `
            <div class="note-header">
                <h4 class="note-title">${note.title}</h4>
                <div class="note-actions">
                    <button onclick="editNote('${note.id}')" title="Edit note">✏️</button>
                    <button onclick="deleteNoteConfirm('${note.id}')" title="Delete note">🗑️</button>
                </div>
            </div>
            <div class="note-content">${note.content}</div>
            <div class="note-meta">
                <span class="note-date">Updated: ${new Date(note.updatedAt).toLocaleDateString()}</span>
                ${note.tags.length > 0 ? `<div class="note-tags">${note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
            </div>
        `;
        container.appendChild(noteElement);
    });
}

/**
 * Edit a note with prompts for new title and content
 * @param {string} noteId - Note ID to edit
 */
export function editNote(noteId) {
    const note = appData.entities.notes[noteId];
    if (!note) return;
    
    const title = prompt('Edit note title:', note.title);
    if (title === null) return;
    
    const content = prompt('Edit note content:', note.content);
    if (content === null) return;
    
    updateNote(noteId, title, content, note.tags);
    
    // Re-render notes for the attached entity
    if (note.attachedTo.type === 'card') {
        renderNotesForCard(note.attachedTo.id, 'cardNotesList');
    }
    
    showStatusMessage('Note updated', 'success');
}

// ============================================
// GLOBAL WINDOW ASSIGNMENTS (Backward Compatibility)
// ============================================

// Make functions available globally for existing HTML onclick handlers
window.createNote = createNote;
window.updateNote = updateNote;
window.deleteNote = deleteNote;
window.deleteNoteConfirm = deleteNoteConfirm;
window.getNotesForEntity = getNotesForEntity;
window.addNoteToCard = addNoteToCard;
window.onEntityChange = onEntityChange;
window.renderNotesForCard = renderNotesForCard;
window.editNote = editNote;