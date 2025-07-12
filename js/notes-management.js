/**
 * GridFlow - Notes Management System
 * Handles notes list, editor, relationships, and all notes functionality
 */

import { createEntity, updateEntity, deleteEntity, getEntity, ENTITY_TYPES, addEntityToContext, removeEntityFromContext, CONTEXT_TYPES } from './entity-core.js';
import { showStatusMessage } from './utilities.js';
import { db } from './db.js';
import { metaService } from './meta-service.js';

class NotesManager {
    constructor() {
        this.currentNote = null;
        this.notes = [];
        this.isInitialized = false;
        this.searchQuery = '';
        this.filterBy = 'all';
        this.sortBy = 'updated';
        this.autoSaveTimeout = null;
        this.autoSaveDelay = 2000; // 2 seconds
    }

    /**
     * Initialize the Notes management system
     */
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            await this.loadAllNotes();
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('✅ Notes management initialized');
        } catch (error) {
            console.error('❌ Failed to initialize notes management:', error);
            showStatusMessage('Failed to initialize notes', 'error');
        }
    }

    /**
     * Load all notes from the database
     */
    async loadAllNotes() {
        try {
            const allNotes = await db.entities.where('type').equals(ENTITY_TYPES.NOTE).toArray();
            this.notes = allNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            this.renderNotesList();
            this.updateNotesStats();
        } catch (error) {
            console.error('Failed to load notes:', error);
            showStatusMessage('Failed to load notes', 'error');
        }
    }

    /**
     * Set up event listeners for the notes interface
     */
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('notesSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.renderNotesList();
            });
        }

        // Filter and sort selectors
        const filterBy = document.getElementById('notesFilterBy');
        const sortBy = document.getElementById('notesSortBy');
        
        if (filterBy) {
            filterBy.addEventListener('change', (e) => {
                this.filterBy = e.target.value;
                this.renderNotesList();
            });
        }
        
        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.renderNotesList();
            });
        }

        // Note title and content editors
        const noteTitle = document.getElementById('noteTitle');
        const noteContent = document.getElementById('noteContent');
        
        if (noteTitle) {
            noteTitle.addEventListener('input', () => {
                this.scheduleAutoSave();
                this.updateWordCount();
            });
        }
        
        if (noteContent) {
            noteContent.addEventListener('input', () => {
                this.scheduleAutoSave();
                this.updateWordCount();
            });
        }
    }

    /**
     * Create a new note
     */
    async createNewNote() {
        try {
            const noteData = {
                title: 'Untitled Note',
                content: '',
                isPrivate: false,
                attachments: [],
                tags: []
            };

            const newNote = await createEntity(ENTITY_TYPES.NOTE, noteData);
            this.notes.unshift(newNote);
            this.renderNotesList();
            this.openNote(newNote);
            this.updateNotesStats();
            
            // Focus on title for immediate editing
            setTimeout(() => {
                const titleInput = document.getElementById('noteTitle');
                if (titleInput) {
                    titleInput.select();
                }
            }, 100);

            showStatusMessage('New note created', 'success');
        } catch (error) {
            console.error('Failed to create note:', error);
            showStatusMessage('Failed to create note', 'error');
        }
    }

    /**
     * Open a note in the editor
     */
    async openNote(note) {
        try {
            this.currentNote = note;
            
            // Update active state in list
            this.updateActiveNoteInList(note.id);
            
            // Show editor and hide welcome state
            document.getElementById('notesWelcomeState').classList.add('hidden');
            document.getElementById('noteEditor').classList.remove('hidden');
            
            // Populate editor fields
            document.getElementById('noteTitle').value = note.title || '';
            document.getElementById('noteContent').value = note.content || '';
            
            // Update metadata
            document.getElementById('noteCreatedDate').textContent = `Created: ${this.formatDate(note.createdAt)}`;
            document.getElementById('noteUpdatedDate').textContent = `Updated: ${this.formatDate(note.updatedAt)}`;
            
            // Update private toggle
            this.updatePrivateToggle(note.isPrivate);
            
            // Load tags
            this.renderNoteTags(note.tags || []);
            
            // Load relationships
            await this.loadNoteRelationships(note.id);
            
            // Update word count
            this.updateWordCount();
            
        } catch (error) {
            console.error('Failed to open note:', error);
            showStatusMessage('Failed to open note', 'error');
        }
    }

    /**
     * Save the current note
     */
    async saveCurrentNote() {
        if (!this.currentNote) return;

        try {
            const title = document.getElementById('noteTitle').value.trim() || 'Untitled Note';
            const content = document.getElementById('noteContent').value;
            
            const updatedNote = await updateEntity(this.currentNote.id, {
                title: title,
                content: content,
                updatedAt: new Date().toISOString()
            });
            
            // Update current note and notes list
            this.currentNote = updatedNote;
            const noteIndex = this.notes.findIndex(n => n.id === updatedNote.id);
            if (noteIndex !== -1) {
                this.notes[noteIndex] = updatedNote;
            }
            
            // Re-render list to show updated title and timestamp
            this.renderNotesList();
            
            // Update editor metadata
            document.getElementById('noteUpdatedDate').textContent = `Updated: ${this.formatDate(updatedNote.updatedAt)}`;
            
            showStatusMessage('Note saved', 'success');
        } catch (error) {
            console.error('Failed to save note:', error);
            showStatusMessage('Failed to save note', 'error');
        }
    }

    /**
     * Delete the current note
     */
    async deleteCurrentNote() {
        if (!this.currentNote) return;

        const confirmDelete = await metaService.getSetting('confirmDelete');
        if (confirmDelete !== false) {
            if (!confirm(`Are you sure you want to delete "${this.currentNote.title}"?`)) {
                return;
            }
        }

        try {
            await deleteEntity(this.currentNote.id);
            
            // Remove from notes list
            this.notes = this.notes.filter(n => n.id !== this.currentNote.id);
            
            // Clear editor and show welcome state
            this.currentNote = null;
            document.getElementById('noteEditor').classList.add('hidden');
            document.getElementById('notesWelcomeState').classList.remove('hidden');
            
            // Re-render list and stats
            this.renderNotesList();
            this.updateNotesStats();
            
            showStatusMessage('Note deleted', 'success');
        } catch (error) {
            console.error('Failed to delete note:', error);
            showStatusMessage('Failed to delete note', 'error');
        }
    }

    /**
     * Toggle note privacy
     */
    async toggleNotePrivate() {
        if (!this.currentNote) return;

        try {
            const newPrivateState = !this.currentNote.isPrivate;
            
            const updatedNote = await updateEntity(this.currentNote.id, {
                isPrivate: newPrivateState,
                updatedAt: new Date().toISOString()
            });
            
            this.currentNote = updatedNote;
            this.updatePrivateToggle(newPrivateState);
            
            showStatusMessage(`Note ${newPrivateState ? 'made private' : 'made public'}`, 'success');
        } catch (error) {
            console.error('Failed to toggle note privacy:', error);
            showStatusMessage('Failed to update note privacy', 'error');
        }
    }

    /**
     * Schedule auto-save
     */
    scheduleAutoSave() {
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        this.autoSaveTimeout = setTimeout(() => {
            this.saveCurrentNote();
        }, this.autoSaveDelay);
    }

    /**
     * Filter and sort notes based on current criteria
     */
    getFilteredAndSortedNotes() {
        let filteredNotes = [...this.notes];

        // Apply search filter
        if (this.searchQuery) {
            filteredNotes = filteredNotes.filter(note => 
                note.title.toLowerCase().includes(this.searchQuery) ||
                note.content.toLowerCase().includes(this.searchQuery)
            );
        }

        // Apply category filter
        switch (this.filterBy) {
            case 'recent':
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                filteredNotes = filteredNotes.filter(note => 
                    new Date(note.updatedAt) > oneWeekAgo
                );
                break;
            case 'linked':
                // Notes that have relationships (we'll implement this when relationships are done)
                filteredNotes = filteredNotes.filter(note => 
                    (note.tags && note.tags.length > 0) || 
                    (note.people && note.people.length > 0)
                );
                break;
            case 'unlinked':
                filteredNotes = filteredNotes.filter(note => 
                    (!note.tags || note.tags.length === 0) && 
                    (!note.people || note.people.length === 0)
                );
                break;
            case 'private':
                filteredNotes = filteredNotes.filter(note => note.isPrivate);
                break;
        }

        // Apply sorting
        switch (this.sortBy) {
            case 'created':
                filteredNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'title':
                filteredNotes.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title-desc':
                filteredNotes.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'updated':
            default:
                filteredNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                break;
        }

        return filteredNotes;
    }

    /**
     * Render the notes list
     */
    renderNotesList() {
        const notesList = document.getElementById('notesList');
        if (!notesList) return;

        const filteredNotes = this.getFilteredAndSortedNotes();

        if (filteredNotes.length === 0) {
            notesList.innerHTML = `
                <li class="text-center text-base-content/50 py-8">
                    <div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-plus mx-auto mb-2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12h4"/><path d="M12 10v4"/></svg>
                        <p class="text-sm">${this.searchQuery || this.filterBy !== 'all' ? 'No matching notes' : 'No notes yet'}</p>
                        <p class="text-xs">${this.searchQuery || this.filterBy !== 'all' ? 'Try adjusting your search or filter' : 'Create your first note to get started'}</p>
                    </div>
                </li>
            `;
            return;
        }

        notesList.innerHTML = filteredNotes.map(note => {
            const isActive = this.currentNote && this.currentNote.id === note.id;
            const previewText = note.content.substring(0, 100);
            const hasLinks = (note.tags && note.tags.length > 0) || (note.people && note.people.length > 0);
            
            return `
                <li class="note-item ${isActive ? 'bg-primary/10 border-l-4 border-primary' : ''}" data-note-id="${note.id}">
                    <a href="#" class="block p-3 hover:bg-base-200 transition-colors">
                        <div class="flex items-start justify-between mb-1">
                            <h4 class="font-medium text-sm truncate flex-1">${this.escapeHtml(note.title)}</h4>
                            <div class="flex items-center gap-1 ml-2">
                                ${note.isPrivate ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lock text-base-content/50"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' : ''}
                                ${hasLinks ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link text-primary"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' : ''}
                            </div>
                        </div>
                        <p class="text-xs text-base-content/60 truncate mb-1">${this.escapeHtml(previewText)}</p>
                        <p class="text-xs text-base-content/50">${this.formatTimeAgo(note.updatedAt)}</p>
                    </a>
                </li>
            `;
        }).join('');

        // Add click listeners to note items
        notesList.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const noteId = item.dataset.noteId;
                const note = this.notes.find(n => n.id === noteId);
                if (note) {
                    this.openNote(note);
                }
            });
        });
    }

    /**
     * Update active note styling in list
     */
    updateActiveNoteInList(noteId) {
        const noteItems = document.querySelectorAll('.note-item');
        noteItems.forEach(item => {
            item.classList.remove('bg-primary/10', 'border-l-4', 'border-primary');
            if (item.dataset.noteId === noteId) {
                item.classList.add('bg-primary/10', 'border-l-4', 'border-primary');
            }
        });
    }

    /**
     * Update notes statistics
     */
    updateNotesStats() {
        const totalCount = document.getElementById('notesTotalCount');
        if (totalCount) {
            totalCount.textContent = this.notes.length;
        }
    }

    /**
     * Update private toggle button
     */
    updatePrivateToggle(isPrivate) {
        const toggle = document.getElementById('notePrivateToggle');
        if (!toggle) return;

        const icon = toggle.querySelector('svg');
        const text = toggle.querySelector('span:last-child') || toggle.childNodes[toggle.childNodes.length - 1];
        
        if (isPrivate) {
            toggle.classList.add('btn-warning');
            toggle.classList.remove('btn-ghost');
            icon.innerHTML = '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>';
            if (text) text.textContent = 'Private';
        } else {
            toggle.classList.remove('btn-warning');
            toggle.classList.add('btn-ghost');
            icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
            if (text) text.textContent = 'Public';
        }
    }

    /**
     * Update word count
     */
    updateWordCount() {
        const content = document.getElementById('noteContent')?.value || '';
        const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
        const wordCountElement = document.getElementById('noteWordCount');
        if (wordCountElement) {
            wordCountElement.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Render note tags
     */
    renderNoteTags(tags) {
        const container = document.getElementById('noteTagsContainer');
        if (!container) return;

        if (!tags || tags.length === 0) {
            container.innerHTML = '<span class="text-xs text-base-content/50">No tags</span>';
            return;
        }

        container.innerHTML = tags.map(tag => `
            <span class="badge badge-primary badge-sm">
                ${this.escapeHtml(tag)}
                <button class="ml-1 hover:text-error" onclick="window.removeNoteTag('${tag}')" title="Remove tag">×</button>
            </span>
        `).join('');
    }

    /**
     * Load and display note relationships
     */
    async loadNoteRelationships(noteId) {
        try {
            // Load board positions for this note
            await this.loadBoardRelationships(noteId);
            
            // Load weekly plan associations
            await this.loadWeeklyRelationships(noteId);
            
            // Load people relationships
            await this.loadPeopleRelationships(noteId);
            
            // Load collection memberships
            await this.loadCollectionRelationships(noteId);
            
            // Load related notes (via tags for now)
            await this.loadRelatedNotes(noteId);
            
            // Load attachments
            await this.loadAttachments(noteId);
            
        } catch (error) {
            console.error('Failed to load note relationships:', error);
        }
    }

    /**
     * Load board relationships
     */
    async loadBoardRelationships(noteId) {
        try {
            const positions = await db.entityPositions.where('entityId').equals(noteId).toArray();
            const boardPositions = positions.filter(p => p.context === 'board');
            
            const container = document.getElementById('noteBoardLinks');
            if (!container) return;
            
            if (boardPositions.length === 0) {
                container.innerHTML = '<p class="text-xs text-base-content/50">No board links</p>';
                return;
            }
            
            // Get board information for each position
            const boardLinks = await Promise.all(boardPositions.map(async position => {
                const board = await db.boards.get(position.boardId);
                if (!board) return null;
                
                const boardObj = typeof board.groups === 'string' ? JSON.parse(board.groups) : board;
                const row = boardObj.rows?.find(r => r.id.toString() === position.rowId);
                const column = boardObj.columns?.find(c => c.key === position.columnKey);
                
                return {
                    board: board,
                    row: row,
                    column: column,
                    position: position
                };
            }));
            
            container.innerHTML = boardLinks.filter(Boolean).map(link => `
                <div class="relationship-item flex items-center justify-between p-2 bg-base-100 rounded text-xs">
                    <div>
                        <div class="font-medium">${this.escapeHtml(link.board.name)}</div>
                        <div class="text-base-content/60">${link.row?.name || 'Unknown'} → ${link.column?.name || 'Unknown'}</div>
                    </div>
                    <button class="btn btn-ghost btn-xs" onclick="notesManager.removeBoardLink('${link.position.id}')" title="Remove">×</button>
                </div>
            `).join('') || '<p class="text-xs text-base-content/50">No board links</p>';
            
        } catch (error) {
            console.error('Failed to load board relationships:', error);
            document.getElementById('noteBoardLinks').innerHTML = '<p class="text-xs text-base-content/50">Error loading board links</p>';
        }
    }

    /**
     * Load weekly plan relationships
     */
    async loadWeeklyRelationships(noteId) {
        try {
            const weeklyItems = await db.weeklyItems.where('entityId').equals(noteId).toArray();
            
            const container = document.getElementById('noteWeeklyLinks');
            if (!container) return;
            
            if (weeklyItems.length === 0) {
                container.innerHTML = '<p class="text-xs text-base-content/50">No weekly links</p>';
                return;
            }
            
            container.innerHTML = weeklyItems.map(item => `
                <div class="relationship-item flex items-center justify-between p-2 bg-base-100 rounded text-xs">
                    <div>
                        <div class="font-medium">Week ${item.weekKey}</div>
                        <div class="text-base-content/60">Day: ${item.day || 'Unscheduled'}</div>
                    </div>
                    <button class="btn btn-ghost btn-xs" onclick="notesManager.removeWeeklyLink('${item.id}')" title="Remove">×</button>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Failed to load weekly relationships:', error);
            document.getElementById('noteWeeklyLinks').innerHTML = '<p class="text-xs text-base-content/50">Error loading weekly links</p>';
        }
    }

    /**
     * Load people relationships
     */
    async loadPeopleRelationships(noteId) {
        try {
            const note = await db.entities.get(noteId);
            const container = document.getElementById('notePeopleLinks');
            if (!container) return;
            
            if (!note.people || note.people.length === 0) {
                container.innerHTML = '<p class="text-xs text-base-content/50">No people links</p>';
                return;
            }
            
            const people = await Promise.all(note.people.map(personId => db.people.get(personId)));
            
            container.innerHTML = people.filter(Boolean).map(person => `
                <div class="relationship-item flex items-center justify-between p-2 bg-base-100 rounded text-xs">
                    <div>
                        <div class="font-medium">${this.escapeHtml(person.name)}</div>
                        <div class="text-base-content/60">${person.company || person.role || 'Contact'}</div>
                    </div>
                    <button class="btn btn-ghost btn-xs" onclick="notesManager.removePersonLink('${person.id}')" title="Remove">×</button>
                </div>
            `).join('') || '<p class="text-xs text-base-content/50">No people links</p>';
            
        } catch (error) {
            console.error('Failed to load people relationships:', error);
            document.getElementById('notePeopleLinks').innerHTML = '<p class="text-xs text-base-content/50">Error loading people links</p>';
        }
    }

    /**
     * Load collection relationships
     */
    async loadCollectionRelationships(noteId) {
        try {
            // Find collections that contain this note
            const collections = await db.collections.filter(collection => 
                collection.items && collection.items.includes(noteId)
            ).toArray();
            
            const container = document.getElementById('noteCollectionLinks');
            if (!container) return;
            
            if (collections.length === 0) {
                container.innerHTML = '<p class="text-xs text-base-content/50">No collection links</p>';
                return;
            }
            
            container.innerHTML = collections.map(collection => `
                <div class="relationship-item flex items-center justify-between p-2 bg-base-100 rounded text-xs">
                    <div>
                        <div class="font-medium">${this.escapeHtml(collection.name)}</div>
                        <div class="text-base-content/60">${collection.type} · ${collection.itemCount || 0} items</div>
                    </div>
                    <button class="btn btn-ghost btn-xs" onclick="notesManager.removeCollectionLink('${collection.id}')" title="Remove">×</button>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Failed to load collection relationships:', error);
            document.getElementById('noteCollectionLinks').innerHTML = '<p class="text-xs text-base-content/50">Error loading collection links</p>';
        }
    }

    /**
     * Load related notes (based on shared tags)
     */
    async loadRelatedNotes(noteId) {
        try {
            const currentNote = await db.entities.get(noteId);
            const container = document.getElementById('noteRelatedLinks');
            if (!container) return;
            
            if (!currentNote.tags || currentNote.tags.length === 0) {
                container.innerHTML = '<p class="text-xs text-base-content/50">No related notes</p>';
                return;
            }
            
            // Find other notes with shared tags
            const relatedNotes = await db.entities
                .where('type').equals('note')
                .and(note => note.id !== noteId && note.tags && note.tags.some(tag => currentNote.tags.includes(tag)))
                .limit(5)
                .toArray();
            
            if (relatedNotes.length === 0) {
                container.innerHTML = '<p class="text-xs text-base-content/50">No related notes</p>';
                return;
            }
            
            container.innerHTML = relatedNotes.map(note => `
                <div class="relationship-item flex items-center justify-between p-2 bg-base-100 rounded text-xs cursor-pointer hover:bg-base-200" 
                     onclick="notesManager.openNote(window.notesManager.notes.find(n => n.id === '${note.id}'))">
                    <div>
                        <div class="font-medium">${this.escapeHtml(note.title)}</div>
                        <div class="text-base-content/60">${this.formatTimeAgo(note.updatedAt)}</div>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Failed to load related notes:', error);
            document.getElementById('noteRelatedLinks').innerHTML = '<p class="text-xs text-base-content/50">Error loading related notes</p>';
        }
    }

    /**
     * Load attachments
     */
    async loadAttachments(noteId) {
        try {
            const note = await db.entities.get(noteId);
            const container = document.getElementById('noteAttachments');
            if (!container) return;
            
            if (!note.attachments || note.attachments.length === 0) {
                container.innerHTML = '<p class="text-xs text-base-content/50">No attachments</p>';
                return;
            }
            
            container.innerHTML = note.attachments.map(attachment => `
                <div class="relationship-item flex items-center justify-between p-2 bg-base-100 rounded text-xs">
                    <div>
                        <div class="font-medium">${this.escapeHtml(attachment.name)}</div>
                        <div class="text-base-content/60">${attachment.type || 'File'} · ${attachment.size || 'Unknown size'}</div>
                    </div>
                    <button class="btn btn-ghost btn-xs" onclick="notesManager.removeAttachment('${attachment.id}')" title="Remove">×</button>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Failed to load attachments:', error);
            document.getElementById('noteAttachments').innerHTML = '<p class="text-xs text-base-content/50">Error loading attachments</p>';
        }
    }

    /**
     * Add a tag to the current note
     */
    async addTag() {
        if (!this.currentNote) return;

        const tag = prompt('Enter a tag name:');
        if (!tag || !tag.trim()) return;

        const tagName = tag.trim().toLowerCase();

        try {
            // Update note tags
            const currentTags = this.currentNote.tags || [];
            if (currentTags.includes(tagName)) {
                showStatusMessage('Tag already exists', 'warning');
                return;
            }

            const updatedTags = [...currentTags, tagName];
            const updatedNote = await updateEntity(this.currentNote.id, {
                tags: updatedTags,
                updatedAt: new Date().toISOString()
            });

            this.currentNote = updatedNote;
            
            // Update notes list
            const noteIndex = this.notes.findIndex(n => n.id === updatedNote.id);
            if (noteIndex !== -1) {
                this.notes[noteIndex] = updatedNote;
            }

            // Re-render tags and list
            this.renderNoteTags(updatedTags);
            this.renderNotesList();
            
            // Increment tag usage if tag exists in meta system
            try {
                const existingTag = await metaService.getTagByName(tagName);
                if (existingTag) {
                    await metaService.incrementTagUsage(existingTag.id);
                } else {
                    // Create new tag
                    await metaService.createTag(tagName, 'user');
                }
            } catch (error) {
                console.warn('Could not update tag usage:', error);
            }

            showStatusMessage('Tag added', 'success');
        } catch (error) {
            console.error('Failed to add tag:', error);
            showStatusMessage('Failed to add tag', 'error');
        }
    }

    /**
     * Remove a tag from the current note
     */
    async removeTag(tagName) {
        if (!this.currentNote) return;

        try {
            const currentTags = this.currentNote.tags || [];
            const updatedTags = currentTags.filter(tag => tag !== tagName);

            const updatedNote = await updateEntity(this.currentNote.id, {
                tags: updatedTags,
                updatedAt: new Date().toISOString()
            });

            this.currentNote = updatedNote;
            
            // Update notes list
            const noteIndex = this.notes.findIndex(n => n.id === updatedNote.id);
            if (noteIndex !== -1) {
                this.notes[noteIndex] = updatedNote;
            }

            // Re-render tags and list
            this.renderNoteTags(updatedTags);
            this.renderNotesList();

            showStatusMessage('Tag removed', 'success');
        } catch (error) {
            console.error('Failed to remove tag:', error);
            showStatusMessage('Failed to remove tag', 'error');
        }
    }

    /**
     * Show board linking modal
     */
    async showBoardLinkModal() {
        if (!this.currentNote) {
            showStatusMessage('Please select a note first', 'warning');
            return;
        }

        try {
            const boards = await db.boards.toArray();
            if (boards.length === 0) {
                showStatusMessage('No boards available to link to', 'warning');
                return;
            }

            // Create a simple modal using prompt for now
            const boardNames = boards.map((board, index) => `${index + 1}. ${board.name}`).join('\n');
            const selection = prompt(`Select a board to link this note to:\n\n${boardNames}\n\nEnter the number (1-${boards.length}):`);
            
            if (selection && !isNaN(selection)) {
                const boardIndex = parseInt(selection) - 1;
                if (boardIndex >= 0 && boardIndex < boards.length) {
                    const selectedBoard = boards[boardIndex];
                    
                    // Show row selection
                    const boardData = typeof selectedBoard.groups === 'string' ? JSON.parse(selectedBoard.groups) : selectedBoard;
                    const rows = boardData.rows || [];
                    
                    if (rows.length === 0) {
                        showStatusMessage('Selected board has no rows', 'warning');
                        return;
                    }

                    const rowNames = rows.map((row, index) => `${index + 1}. ${row.name}`).join('\n');
                    const rowSelection = prompt(`Select a row:\n\n${rowNames}\n\nEnter the number (1-${rows.length}):`);
                    
                    if (rowSelection && !isNaN(rowSelection)) {
                        const rowIndex = parseInt(rowSelection) - 1;
                        if (rowIndex >= 0 && rowIndex < rows.length) {
                            const selectedRow = rows[rowIndex];
                            
                            // Show column selection
                            const columns = boardData.columns || [];
                            const columnNames = columns.map((col, index) => `${index + 1}. ${col.name}`).join('\n');
                            const colSelection = prompt(`Select a column:\n\n${columnNames}\n\nEnter the number (1-${columns.length}):`);
                            
                            if (colSelection && !isNaN(colSelection)) {
                                const colIndex = parseInt(colSelection) - 1;
                                if (colIndex >= 0 && colIndex < columns.length) {
                                    const selectedColumn = columns[colIndex];
                                    
                                    // Link the note to the board
                                    const success = await addEntityToContext(this.currentNote.id, CONTEXT_TYPES.BOARD, {
                                        boardId: selectedBoard.id,
                                        rowId: selectedRow.id,
                                        columnKey: selectedColumn.key
                                    });
                                    
                                    if (success) {
                                        showStatusMessage(`Note linked to ${selectedBoard.name} → ${selectedRow.name} → ${selectedColumn.name}`, 'success');
                                        await this.loadNoteRelationships(this.currentNote.id);
                                    } else {
                                        showStatusMessage('Failed to link note to board', 'error');
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to show board link modal:', error);
            showStatusMessage('Failed to load boards', 'error');
        }
    }

    /**
     * Show weekly planning link modal
     */
    async showWeeklyLinkModal() {
        if (!this.currentNote) {
            showStatusMessage('Please select a note first', 'warning');
            return;
        }

        try {
            // Get current week or let user choose
            const weekKeys = await db.weeklyItems.orderBy('weekKey').uniqueKeys();
            
            let selectedWeekKey;
            if (weekKeys.length === 0) {
                // Create current week
                const now = new Date();
                const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                selectedWeekKey = `${weekStart.getFullYear()}-W${Math.ceil((weekStart - new Date(weekStart.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000))}`;
            } else {
                // Let user select a week
                const weekOptions = weekKeys.map((key, index) => `${index + 1}. Week ${key}`).join('\n');
                const selection = prompt(`Select a week to link this note to:\n\n${weekOptions}\n\nEnter the number (1-${weekKeys.length}):`);
                
                if (selection && !isNaN(selection)) {
                    const weekIndex = parseInt(selection) - 1;
                    if (weekIndex >= 0 && weekIndex < weekKeys.length) {
                        selectedWeekKey = weekKeys[weekIndex];
                    } else {
                        return;
                    }
                } else {
                    return;
                }
            }

            // Select day
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const dayOptions = days.map((day, index) => `${index + 1}. ${day.charAt(0).toUpperCase() + day.slice(1)}`).join('\n');
            const daySelection = prompt(`Select a day:\n\n${dayOptions}\n\nEnter the number (1-7):`);
            
            if (daySelection && !isNaN(daySelection)) {
                const dayIndex = parseInt(daySelection) - 1;
                if (dayIndex >= 0 && dayIndex < days.length) {
                    const selectedDay = days[dayIndex];
                    
                    // Link the note to weekly planning
                    const success = await addEntityToContext(this.currentNote.id, CONTEXT_TYPES.WEEKLY, {
                        weekKey: selectedWeekKey,
                        day: selectedDay
                    });
                    
                    if (success) {
                        showStatusMessage(`Note linked to ${selectedWeekKey} - ${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}`, 'success');
                        await this.loadNoteRelationships(this.currentNote.id);
                    } else {
                        showStatusMessage('Failed to link note to weekly plan', 'error');
                    }
                }
            }
        } catch (error) {
            console.error('Failed to show weekly link modal:', error);
            showStatusMessage('Failed to show weekly planning options', 'error');
        }
    }

    /**
     * Show people linking modal
     */
    async showPeopleLinkModal() {
        if (!this.currentNote) {
            showStatusMessage('Please select a note first', 'warning');
            return;
        }

        try {
            const people = await db.people.toArray();
            if (people.length === 0) {
                showStatusMessage('No people available to link to', 'warning');
                return;
            }

            const peopleNames = people.map((person, index) => `${index + 1}. ${person.name}${person.company ? ` (${person.company})` : ''}`).join('\n');
            const selection = prompt(`Select a person to link this note to:\n\n${peopleNames}\n\nEnter the number (1-${people.length}):`);
            
            if (selection && !isNaN(selection)) {
                const personIndex = parseInt(selection) - 1;
                if (personIndex >= 0 && personIndex < people.length) {
                    const selectedPerson = people[personIndex];
                    
                    // Link the note to the person
                    const success = await addEntityToContext(this.currentNote.id, CONTEXT_TYPES.PEOPLE, {
                        personId: selectedPerson.id
                    });
                    
                    if (success) {
                        showStatusMessage(`Note linked to ${selectedPerson.name}`, 'success');
                        await this.loadNoteRelationships(this.currentNote.id);
                    } else {
                        showStatusMessage('Failed to link note to person', 'error');
                    }
                }
            }
        } catch (error) {
            console.error('Failed to show people link modal:', error);
            showStatusMessage('Failed to load people', 'error');
        }
    }

    /**
     * Show collection linking modal
     */
    async showCollectionLinkModal() {
        if (!this.currentNote) {
            showStatusMessage('Please select a note first', 'warning');
            return;
        }

        try {
            const collections = await db.collections.toArray();
            if (collections.length === 0) {
                showStatusMessage('No collections available to link to', 'warning');
                return;
            }

            const collectionNames = collections.map((collection, index) => `${index + 1}. ${collection.name} (${collection.type})`).join('\n');
            const selection = prompt(`Select a collection to link this note to:\n\n${collectionNames}\n\nEnter the number (1-${collections.length}):`);
            
            if (selection && !isNaN(selection)) {
                const collectionIndex = parseInt(selection) - 1;
                if (collectionIndex >= 0 && collectionIndex < collections.length) {
                    const selectedCollection = collections[collectionIndex];
                    
                    // Link the note to the collection
                    const success = await addEntityToContext(this.currentNote.id, CONTEXT_TYPES.COLLECTION, {
                        collectionId: selectedCollection.id
                    });
                    
                    if (success) {
                        showStatusMessage(`Note linked to collection "${selectedCollection.name}"`, 'success');
                        await this.loadNoteRelationships(this.currentNote.id);
                    } else {
                        showStatusMessage('Failed to link note to collection', 'error');
                    }
                }
            }
        } catch (error) {
            console.error('Failed to show collection link modal:', error);
            showStatusMessage('Failed to load collections', 'error');
        }
    }

    /**
     * Show note-to-note linking modal
     */
    async showNoteLinkModal() {
        if (!this.currentNote) {
            showStatusMessage('Please select a note first', 'warning');
            return;
        }

        try {
            const allNotes = await db.entities.where('type').equals(ENTITY_TYPES.NOTE).toArray();
            const otherNotes = allNotes.filter(note => note.id !== this.currentNote.id);
            
            if (otherNotes.length === 0) {
                showStatusMessage('No other notes available to link to', 'warning');
                return;
            }

            const noteNames = otherNotes.map((note, index) => `${index + 1}. ${note.title}`).join('\n');
            const selection = prompt(`Select a note to link to:\n\n${noteNames}\n\nEnter the number (1-${otherNotes.length}):`);
            
            if (selection && !isNaN(selection)) {
                const noteIndex = parseInt(selection) - 1;
                if (noteIndex >= 0 && noteIndex < otherNotes.length) {
                    const selectedNote = otherNotes[noteIndex];
                    
                    // Add bidirectional relationship via shared tags or reference system
                    const currentTags = this.currentNote.tags || [];
                    const linkTag = `linked-to-${selectedNote.id}`;
                    
                    if (!currentTags.includes(linkTag)) {
                        const updatedTags = [...currentTags, linkTag];
                        await updateEntity(this.currentNote.id, {
                            tags: updatedTags,
                            updatedAt: new Date().toISOString()
                        });
                        
                        showStatusMessage(`Note linked to "${selectedNote.title}"`, 'success');
                        await this.loadNoteRelationships(this.currentNote.id);
                    } else {
                        showStatusMessage('Note is already linked', 'warning');
                    }
                }
            }
        } catch (error) {
            console.error('Failed to show note link modal:', error);
            showStatusMessage('Failed to load notes', 'error');
        }
    }

    /**
     * Utility functions
     */
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return this.formatDate(dateString);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create and export global instance
export const notesManager = new NotesManager();

// Make globally available for button actions
if (typeof window !== 'undefined') {
    window.notesManager = notesManager;
    
    // Action functions for button data-action attributes
    window.createNewNote = () => notesManager.createNewNote();
    window.saveCurrentNote = () => notesManager.saveCurrentNote();
    window.deleteCurrentNote = () => notesManager.deleteCurrentNote();
    window.toggleNotePrivate = () => notesManager.toggleNotePrivate();
    
    // Linking functions for notes
    window.linkNoteToBoard = () => notesManager.showBoardLinkModal();
    window.linkNoteToWeekly = () => notesManager.showWeeklyLinkModal();
    window.linkNoteToPerson = () => notesManager.showPeopleLinkModal();
    window.linkNoteToCollection = () => notesManager.showCollectionLinkModal();
    window.linkNoteToNote = () => notesManager.showNoteLinkModal();
    window.addNoteAttachment = () => showStatusMessage('Attachments coming soon', 'info');
    window.addNoteTag = () => notesManager.addTag();
    window.removeNoteTag = (tag) => notesManager.removeTag(tag);
}