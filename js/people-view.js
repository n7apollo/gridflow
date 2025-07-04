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
 * Render the people list
 */
async function renderPeopleList() {
    const peopleList = document.getElementById('peopleList');
    const totalPeopleCount = document.getElementById('totalPeopleCount');
    
    if (!peopleList) return;

    const allPeople = await peopleService.getAllPeople();
    let filteredPeople = applyFilters(allPeople);

    // Update count
    if (totalPeopleCount) {
        totalPeopleCount.textContent = filteredPeople.length;
    }

    if (filteredPeople.length === 0) {
        peopleList.innerHTML = `
            <li class="list-row">
                <div class="text-center py-8">
                    <div class="text-base-content/60">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users mx-auto mb-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        <p class="text-lg mb-2">No people found</p>
                        <p class="text-sm mb-4">Add your first person to get started with relationship tracking</p>
                        <button class="btn btn-primary" onclick="showCreatePersonModal()">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-plus"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
                            Add Person
                        </button>
                    </div>
                </div>
            </li>
        `;
    } else {
        peopleList.innerHTML = filteredPeople.map(person => renderPersonListItem(person)).join('');
    }

    // Re-render Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/**
 * Render the people grid (for backward compatibility)
 */
async function renderPeopleGrid() {
    return await renderPeopleList();
}

/**
 * Render a single person list item
 * @param {Object} person - Person entity
 * @returns {string} HTML for person list item
 */
function renderPersonListItem(person) {
    const lastInteraction = new Date(person.lastInteraction);
    const daysSince = Math.floor((Date.now() - lastInteraction) / (1000 * 60 * 60 * 24));
    
    // Determine if follow-up is needed
    let expectedDays = getExpectedDays(person.interactionFrequency);
    const needsFollowUp = daysSince > expectedDays;

    return `
        <li class="list-row" onclick="showPersonDetail('${person.id}')">
            <div class="flex items-center gap-4 p-4 hover:bg-base-200 transition-colors cursor-pointer">
                <!-- Avatar -->
                <div class="avatar placeholder">
                    <div class="bg-primary text-primary-content rounded-full w-12">
                        <span class="text-sm font-semibold">${getPersonInitials(person.name)}</span>
                    </div>
                </div>
                
                <!-- Main Content -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <h3 class="font-semibold text-base truncate">${person.name}</h3>
                        <span class="badge badge-${getRelationshipBadgeColor(person.relationshipType)} badge-sm">
                            ${person.relationshipType}
                        </span>
                        ${needsFollowUp ? `
                            <span class="badge badge-warning badge-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                                Follow-up
                            </span>
                        ` : ''}
                    </div>
                    <div class="text-sm text-base-content/70 mb-1">
                        ${person.role && person.company ? `${person.role} at ${person.company}` : 
                          person.company || person.role || 'No company specified'}
                    </div>
                    <div class="text-xs text-base-content/60">
                        Last contact: ${daysSince === 0 ? 'Today' : 
                                       daysSince === 1 ? '1 day ago' : 
                                       `${daysSince} days ago`}
                    </div>
                </div>
                
                <!-- Contact Info -->
                <div class="hidden sm:block text-right text-sm text-base-content/60">
                    ${person.email ? `<div>${person.email}</div>` : ''}
                    ${person.phone ? `<div>${person.phone}</div>` : ''}
                </div>
                
                <!-- Action Arrow -->
                <div class="person-actions opacity-0 transition-opacity group-hover:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
                </div>
            </div>
        </li>
    `;
}

/**
 * Render a single person card (for backward compatibility)
 * @param {Object} person - Person entity
 * @returns {string} HTML for person card
 */
function renderPersonCard(person) {
    return renderPersonListItem(person);
}

/**
 * Show person detail view
 * @param {string} personId - Person ID
 */
async function showPersonDetail(personId) {
    currentPersonId = personId;
    const person = await peopleService.getPerson(personId);
    if (!person) return;

    // Hide list view and show detail view
    const listView = document.getElementById('peopleListView');
    const detailView = document.getElementById('personDetailView');
    
    if (!listView || !detailView) return;
    
    listView.classList.add('hidden');
    detailView.classList.remove('hidden');

    // Update person info
    const nameElement = document.getElementById('personDetailName');
    const subtitleElement = document.getElementById('personDetailSubtitle');
    
    if (nameElement) nameElement.textContent = person.name;
    if (subtitleElement) {
        subtitleElement.textContent = person.role && person.company ? 
            `${person.role} at ${person.company}` : 
            person.company || person.role || person.relationshipType;
    }
    
    // Update contact info
    const emailElement = document.getElementById('personEmail');
    const phoneElement = document.getElementById('personPhone');
    const companyElement = document.getElementById('personCompany');
    const roleElement = document.getElementById('personRole');
    
    if (emailElement) {
        emailElement.innerHTML = person.email ? 
            `<strong>Email:</strong> <a href="mailto:${person.email}" class="link">${person.email}</a>` : 
            '<span class="text-base-content/50">No email provided</span>';
    }
    if (phoneElement) {
        phoneElement.innerHTML = person.phone ? 
            `<strong>Phone:</strong> <a href="tel:${person.phone}" class="link">${person.phone}</a>` : 
            '<span class="text-base-content/50">No phone provided</span>';
    }
    if (companyElement) {
        companyElement.innerHTML = person.company ? 
            `<strong>Company:</strong> ${person.company}` : 
            '<span class="text-base-content/50">No company provided</span>';
    }
    if (roleElement) {
        roleElement.innerHTML = person.role ? 
            `<strong>Role:</strong> ${person.role}` : 
            '<span class="text-base-content/50">No role provided</span>';
    }

    // Update relationship info
    const relationshipElement = document.getElementById('personRelationshipType');
    const frequencyElement = document.getElementById('personInteractionFrequency');
    const lastInteractionElement = document.getElementById('personLastInteraction');
    
    if (relationshipElement) {
        relationshipElement.innerHTML = 
            `<strong>Relationship:</strong> <span class="badge badge-${getRelationshipBadgeColor(person.relationshipType)}">${person.relationshipType}</span>`;
    }
    if (frequencyElement) {
        frequencyElement.innerHTML = 
            `<strong>Contact Frequency:</strong> ${person.interactionFrequency}`;
    }
    
    const lastInteraction = new Date(person.lastInteraction);
    const daysSince = Math.floor((Date.now() - lastInteraction) / (1000 * 60 * 60 * 24));
    if (lastInteractionElement) {
        lastInteractionElement.innerHTML = 
            `<strong>Last Contact:</strong> ${daysSince === 0 ? 'Today' : daysSince === 1 ? '1 day ago' : `${daysSince} days ago`}`;
    }

    // Update stats
    const timeline = await peopleService.getPersonTimeline(personId);
    const totalInteractionsElement = document.getElementById('totalInteractions');
    const lastContactStatElement = document.getElementById('lastContactStat');
    
    if (totalInteractionsElement) {
        totalInteractionsElement.textContent = timeline.length;
    }
    if (lastContactStatElement) {
        lastContactStatElement.textContent = daysSince === 0 ? 'Today' : 
                                            daysSince === 1 ? '1 day ago' : 
                                            `${daysSince} days ago`;
    }

    // Load and render timeline
    await renderPersonTimeline(personId);
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
 * Show people list view (go back from detail)
 */
function showPeopleList() {
    const listView = document.getElementById('peopleListView');
    const detailView = document.getElementById('personDetailView');
    
    if (listView && detailView) {
        detailView.classList.add('hidden');
        listView.classList.remove('hidden');
    }
    
    currentPersonId = null;
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
            renderPeopleList();
        });
        
        // Keyboard shortcut for search
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
            }
        });
    }

    // Quick filter menu
    const filterButtons = document.querySelectorAll('.quick-filter-menu');
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            const filter = button.getAttribute('data-filter');
            
            // Reset filters
            currentFilters.relationship = '';
            currentFilters.followUp = '';
            
            // Apply filter
            if (filter === 'all') {
                // No additional filters
            } else if (['coworker', 'friend', 'family', 'partner', 'contact'].includes(filter)) {
                currentFilters.relationship = filter;
            } else if (filter === 'overdue') {
                currentFilters.followUp = 'overdue';
            }
            
            renderPeopleList();
        });
    });
    
    // Set default active filter
    const allFilter = document.querySelector('.quick-filter-menu[data-filter="all"]');
    if (allFilter) {
        allFilter.classList.add('active');
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
 * Close person detail panel (for backward compatibility)
 */
window.closePeopleDetail = function() {
    showPeopleList();
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
        
        // Refresh people list
        await renderPeopleList();
        
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
            // Go back to people list
            showPeopleList();
            
            // Refresh people list
            await renderPeopleList();
            
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
 * Export people data
 */
window.exportPeople = async function() {
    try {
        const allPeople = await peopleService.getAllPeople();
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            people: allPeople
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gridflow-people-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (window.showStatusMessage) {
            window.showStatusMessage(`Exported ${allPeople.length} people`, 'success');
        }
    } catch (error) {
        console.error('Failed to export people:', error);
        if (window.showStatusMessage) {
            window.showStatusMessage('Failed to export people', 'error');
        }
    }
};

/**
 * Import people data
 */
window.importPeople = async function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (!data.people || !Array.isArray(data.people)) {
                throw new Error('Invalid people data format');
            }
            
            let imported = 0;
            for (const personData of data.people) {
                try {
                    // Remove ID to create new person
                    const { id, ...personWithoutId } = personData;
                    await peopleService.createPerson(personWithoutId);
                    imported++;
                } catch (error) {
                    console.error('Failed to import person:', personData.name, error);
                }
            }
            
            if (window.showStatusMessage) {
                window.showStatusMessage(`Imported ${imported} of ${data.people.length} people`, 'success');
            }
            
            // Refresh the people list
            await renderPeopleList();
            
        } catch (error) {
            console.error('Failed to import people:', error);
            if (window.showStatusMessage) {
                window.showStatusMessage('Failed to import people', 'error');
            }
        }
    };
    
    input.click();
};

/**
 * Show person detail
 */
window.showPersonDetail = showPersonDetail;

/**
 * Show people list
 */
window.showPeopleList = showPeopleList;

// Export for module use
export { 
    renderPeopleGrid,
    renderPeopleList,
    showPersonDetail,
    showPeopleList, 
    renderPersonTimeline,
    currentPersonId 
};