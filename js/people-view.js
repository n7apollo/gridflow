/**
 * GridFlow - People View Management
 * Handles the people interface, timeline views, and person interactions
 */

import peopleService from './people-service.js';
import { ENTITY_TYPES } from './entity-core.js';
import { getEntityTypeIcon } from './entity-renderer.js';

let currentPersonId = null;
let currentFilters = {
    search: '',
    relationship: '',
    followUp: ''
};

/**
 * Initialize people view when switching to it
 */
export async function switchToPeopleView() {
    console.log('Switching to People view');
    await renderPeopleGrid();
    setupPeopleEventListeners();
}

/**
 * Render the people grid
 */
async function renderPeopleGrid() {
    const peopleGrid = document.getElementById('peopleGrid');
    if (!peopleGrid) return;

    const allPeople = await peopleService.getAllPeople();
    let filteredPeople = applyFilters(allPeople);

    if (filteredPeople.length === 0) {
        peopleGrid.innerHTML = `
            <div class="col-span-full text-center py-8">
                <div class="text-base-content/60">
                    <i data-lucide="users" class="w-12 h-12 mx-auto mb-4"></i>
                    <p class="text-lg mb-2">No people found</p>
                    <p class="text-sm">Add your first person to get started with relationship tracking</p>
                    <button class="btn btn-primary mt-4" onclick="showCreatePersonModal()">
                        <i data-lucide="user-plus"></i> Add Person
                    </button>
                </div>
            </div>
        `;
    } else {
        peopleGrid.innerHTML = filteredPeople.map(person => renderPersonCard(person)).join('');
    }

    // Re-render Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/**
 * Render a single person card
 * @param {Object} person - Person entity
 * @returns {string} HTML for person card
 */
function renderPersonCard(person) {
    const lastInteraction = new Date(person.lastInteraction);
    const daysSince = Math.floor((Date.now() - lastInteraction) / (1000 * 60 * 60 * 24));
    
    // Determine if follow-up is needed
    let followUpStatus = '';
    let expectedDays = getExpectedDays(person.interactionFrequency);
    if (daysSince > expectedDays) {
        followUpStatus = 'border-l-4 border-l-warning';
    }

    return `
        <div class="person-card card bg-base-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer ${followUpStatus}"
             onclick="showPersonDetail('${person.id}')">
            <div class="card-body p-4">
                <div class="flex items-center gap-3 mb-2">
                    <div class="avatar placeholder">
                        <div class="bg-primary text-primary-content rounded-full w-10">
                            <span class="text-sm">${getPersonInitials(person.name)}</span>
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="font-semibold text-base truncate">${person.name}</h3>
                        <p class="text-sm text-base-content/70 truncate">
                            ${person.role && person.company ? `${person.role} at ${person.company}` : 
                              person.company || person.role || person.relationshipType}
                        </p>
                    </div>
                </div>
                
                <div class="flex items-center justify-between text-xs text-base-content/60">
                    <span class="badge badge-${getRelationshipBadgeColor(person.relationshipType)} badge-sm">
                        ${person.relationshipType}
                    </span>
                    <span class="${daysSince > expectedDays ? 'text-warning' : ''}">
                        ${daysSince === 0 ? 'Today' : 
                          daysSince === 1 ? '1 day ago' : 
                          `${daysSince} days ago`}
                    </span>
                </div>
                
                ${daysSince > expectedDays ? `
                    <div class="alert alert-warning mt-2 p-2">
                        <i data-lucide="clock" class="w-4 h-4"></i>
                        <span class="text-xs">Follow-up needed</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Show person detail panel with timeline
 * @param {string} personId - Person ID
 */
async function showPersonDetail(personId) {
    currentPersonId = personId;
    const person = peopleService.getPerson(personId);
    if (!person) return;

    const detailPanel = document.getElementById('personDetailPanel');
    if (!detailPanel) return;

    // Show the panel
    detailPanel.classList.remove('hidden');

    // Update person info
    document.getElementById('personDetailName').textContent = person.name;
    
    // Update contact info
    document.getElementById('personEmail').innerHTML = person.email ? 
        `<strong>Email:</strong> <a href="mailto:${person.email}" class="link">${person.email}</a>` : '';
    document.getElementById('personPhone').innerHTML = person.phone ? 
        `<strong>Phone:</strong> <a href="tel:${person.phone}" class="link">${person.phone}</a>` : '';
    document.getElementById('personCompany').innerHTML = person.company ? 
        `<strong>Company:</strong> ${person.company}` : '';
    document.getElementById('personRole').innerHTML = person.role ? 
        `<strong>Role:</strong> ${person.role}` : '';

    // Update relationship info
    document.getElementById('personRelationshipType').innerHTML = 
        `<strong>Relationship:</strong> <span class="badge badge-${getRelationshipBadgeColor(person.relationshipType)}">${person.relationshipType}</span>`;
    document.getElementById('personInteractionFrequency').innerHTML = 
        `<strong>Contact Frequency:</strong> ${person.interactionFrequency}`;
    
    const lastInteraction = new Date(person.lastInteraction);
    const daysSince = Math.floor((Date.now() - lastInteraction) / (1000 * 60 * 60 * 24));
    document.getElementById('personLastInteraction').innerHTML = 
        `<strong>Last Contact:</strong> ${daysSince === 0 ? 'Today' : daysSince === 1 ? '1 day ago' : `${daysSince} days ago`}`;

    // Update edit and delete button data
    document.getElementById('editPersonBtn').dataset.personId = personId;
    document.getElementById('deletePersonBtn').dataset.personId = personId;

    // Load and render timeline
    await renderPersonTimeline(personId);

    // Scroll to detail panel
    detailPanel.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Render person timeline
 * @param {string} personId - Person ID
 */
async function renderPersonTimeline(personId) {
    const timelineContainer = document.getElementById('personTimeline');
    if (!timelineContainer) return;

    try {
        const timeline = await peopleService.getPersonTimeline(personId);
        
        if (timeline.length === 0) {
            timelineContainer.innerHTML = `
                <div class="text-center py-4 text-base-content/60">
                    <i data-lucide="file-text" class="w-8 h-8 mx-auto mb-2"></i>
                    <p>No interactions yet</p>
                    <p class="text-xs">Create a note or task to start tracking interactions</p>
                </div>
            `;
        } else {
            timelineContainer.innerHTML = timeline.map(item => renderTimelineItem(item)).join('');
        }

        // Re-render Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    } catch (error) {
        console.error('Failed to render person timeline:', error);
        timelineContainer.innerHTML = `
            <div class="alert alert-error">
                <span>Failed to load timeline</span>
            </div>
        `;
    }
}

/**
 * Render a timeline item
 * @param {Object} item - Timeline item (entity with relationship context)
 * @returns {string} HTML for timeline item
 */
function renderTimelineItem(item) {
    const date = new Date(item.updatedAt || item.createdAt);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const icon = getEntityTypeIcon(item.type, true);
    const typeColor = getEntityTypeColor(item.type);

    return `
        <div class="timeline-item border-l-2 border-${typeColor} pl-4 pb-4 hover:bg-base-200 rounded-r cursor-pointer"
             onclick="openEntity('${item.id}')">
            <div class="flex items-start gap-3">
                <div class="flex-shrink-0 w-8 h-8 bg-${typeColor} text-white rounded-full flex items-center justify-center text-sm">
                    ${icon}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                        <h4 class="font-medium text-sm truncate">${item.title}</h4>
                        <span class="text-xs text-base-content/60">${dateStr} ${timeStr}</span>
                    </div>
                    ${item.content ? `<p class="text-sm text-base-content/80 line-clamp-2">${item.content}</p>` : ''}
                    <div class="flex items-center gap-2 mt-1">
                        <span class="badge badge-${typeColor} badge-xs">${item.type}</span>
                        ${item.completed ? '<span class="badge badge-success badge-xs">✓ Completed</span>' : ''}
                        ${item.relationshipType && item.relationshipType !== 'mentions' ? 
                            `<span class="badge badge-outline badge-xs">${item.relationshipType}</span>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Apply current filters to people list
 * @param {Array} people - Array of people
 * @returns {Array} Filtered people
 */
function applyFilters(people) {
    let filtered = [...people];

    // Search filter
    if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        filtered = filtered.filter(person =>
            person.name.toLowerCase().includes(searchTerm) ||
            (person.email && person.email.toLowerCase().includes(searchTerm)) ||
            (person.company && person.company.toLowerCase().includes(searchTerm))
        );
    }

    // Relationship filter
    if (currentFilters.relationship) {
        filtered = filtered.filter(person => person.relationshipType === currentFilters.relationship);
    }

    // Follow-up filter
    if (currentFilters.followUp) {
        const now = Date.now();
        filtered = filtered.filter(person => {
            const lastInteraction = new Date(person.lastInteraction);
            const daysSince = Math.floor((now - lastInteraction) / (1000 * 60 * 60 * 24));
            const expectedDays = getExpectedDays(person.interactionFrequency);

            if (currentFilters.followUp === 'overdue') {
                return daysSince > expectedDays;
            } else if (currentFilters.followUp === 'soon') {
                return daysSince > (expectedDays * 0.8); // 80% of expected time
            }
            return true;
        });
    }

    return filtered;
}

/**
 * Setup event listeners for people view
 */
function setupPeopleEventListeners() {
    // Search input
    const searchInput = document.getElementById('peopleSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentFilters.search = e.target.value;
            renderPeopleGrid();
        });
    }

    // Relationship filter
    const relationshipFilter = document.getElementById('relationshipFilter');
    if (relationshipFilter) {
        relationshipFilter.addEventListener('change', (e) => {
            currentFilters.relationship = e.target.value;
            renderPeopleGrid();
        });
    }

    // Follow-up filter
    const followUpFilter = document.getElementById('followUpFilter');
    if (followUpFilter) {
        followUpFilter.addEventListener('change', (e) => {
            currentFilters.followUp = e.target.value;
            renderPeopleGrid();
        });
    }
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

function getPersonInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function getRelationshipBadgeColor(relationshipType) {
    const colors = {
        coworker: 'info',
        friend: 'success',
        family: 'secondary',
        partner: 'accent',
        contact: 'neutral'
    };
    return colors[relationshipType] || 'neutral';
}

function getExpectedDays(frequency) {
    const frequencies = {
        daily: 1,
        weekly: 7,
        monthly: 30,
        quarterly: 90,
        yearly: 365
    };
    return frequencies[frequency] || 30;
}

function getEntityTypeColor(type) {
    const colors = {
        task: 'primary',
        note: 'info',
        checklist: 'success',
        project: 'warning'
    };
    return colors[type] || 'neutral';
}

// ==============================================
// GLOBAL FUNCTIONS
// ==============================================

/**
 * Open entity in appropriate context
 * @param {string} entityId - Entity ID
 */
window.openEntity = function(entityId) {
    // This will be implemented to open entity modals or navigate to entity
    console.log('Opening entity:', entityId);
    // TODO: Implement entity opening logic
};

/**
 * Close person detail panel
 */
window.closePeopleDetail = function() {
    const detailPanel = document.getElementById('personDetailPanel');
    if (detailPanel) {
        detailPanel.classList.add('hidden');
    }
    currentPersonId = null;
};

/**
 * Show create person modal
 */
window.showCreatePersonModal = function() {
    const modal = document.getElementById('createPersonModal');
    if (modal) {
        // Reset form
        const form = document.getElementById('createPersonForm');
        if (form) form.reset();
        
        modal.classList.add('modal-open');
    }
};

/**
 * Close create person modal
 */
window.closeCreatePersonModal = function() {
    const modal = document.getElementById('createPersonModal');
    if (modal) {
        modal.classList.remove('modal-open');
    }
};

/**
 * Create person from modal form
 */
window.createPerson = async function() {
    const form = document.getElementById('createPersonForm');
    if (!form) return;

    const formData = new FormData(form);
    const personData = {};
    
    // Get all form fields
    for (const [key, value] of formData.entries()) {
        if (value.trim()) {
            personData[key] = value.trim();
        }
    }

    // Parse tags
    if (personData.tags) {
        personData.tags = personData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    // Validate required fields
    if (!personData.name) {
        alert('Name is required');
        return;
    }

    try {
        const person = await peopleService.createPerson(personData);
        console.log('Created person:', person);
        
        // Close modal
        closeCreatePersonModal();
        
        // Refresh people grid
        await renderPeopleGrid();
        
        // Show success message
        if (window.showStatusMessage) {
            window.showStatusMessage(`Added ${person.name} to your people`, 'success');
        }
        
        // Show the person detail
        showPersonDetail(person.id);
        
    } catch (error) {
        console.error('Failed to create person:', error);
        if (window.showStatusMessage) {
            window.showStatusMessage('Failed to create person', 'error');
        } else {
            alert('Failed to create person: ' + error.message);
        }
    }
};

/**
 * Edit person
 */
window.editPerson = function() {
    if (!currentPersonId) return;
    
    const person = peopleService.getPerson(currentPersonId);
    if (!person) return;

    // TODO: Implement edit person modal
    // For now, just show a message
    if (window.showStatusMessage) {
        window.showStatusMessage('Edit person functionality coming soon', 'info');
    } else {
        alert('Edit person functionality coming soon');
    }
};

/**
 * Delete person
 */
window.deletePerson = async function() {
    if (!currentPersonId) return;
    
    const person = peopleService.getPerson(currentPersonId);
    if (!person) return;

    const confirmed = confirm(`Are you sure you want to delete ${person.name}? This will also remove all their relationships.`);
    if (!confirmed) return;

    try {
        const success = await peopleService.deletePerson(currentPersonId);
        if (success) {
            // Close detail panel
            closePeopleDetail();
            
            // Refresh people grid
            await renderPeopleGrid();
            
            if (window.showStatusMessage) {
                window.showStatusMessage(`Deleted ${person.name}`, 'success');
            }
        } else {
            throw new Error('Delete operation failed');
        }
    } catch (error) {
        console.error('Failed to delete person:', error);
        if (window.showStatusMessage) {
            window.showStatusMessage('Failed to delete person', 'error');
        } else {
            alert('Failed to delete person: ' + error.message);
        }
    }
};

/**
 * Add note for person
 */
window.addNoteForPerson = function() {
    if (!currentPersonId) return;
    
    const person = peopleService.getPerson(currentPersonId);
    if (!person) return;

    // TODO: Implement add note for person
    // For now, just show a message
    if (window.showStatusMessage) {
        window.showStatusMessage('Add note functionality coming soon', 'info');
    } else {
        alert('Add note functionality coming soon');
    }
};

/**
 * Show person detail
 */
window.showPersonDetail = showPersonDetail;

// Export for module use
export { 
    renderPeopleGrid, 
    showPersonDetail, 
    renderPersonTimeline,
    currentPersonId 
};