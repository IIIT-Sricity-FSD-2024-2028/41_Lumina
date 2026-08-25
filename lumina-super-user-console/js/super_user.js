/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Lumina Academic Systems - Super User Console Controller
 * Coordinates elevated data management, CRUD operations, live log auditing, and session security.
 */

const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // --- 1. SESSION PROTECTION & SECURITY GUARD ---
    // =========================================================================

    const sessionData = localStorage.getItem('Lumina_Session');
    if (!sessionData) {
        window.location.href = 'login.html';
        return;
    }

    let currentUser;
    try {
        currentUser = JSON.parse(sessionData);
    } catch (e) {
        localStorage.removeItem('Lumina_Session');
        window.location.href = 'login.html';
        return;
    }

    // TEMP: gated on 'Dean' until Super_User role is added to backend RolesGuard
    if (currentUser.Role !== 'Dean' && currentUser.Role !== 'Super_User') {
        window.location.href = 'login.html';
        return;
    }

    // Standard headers for all elevated API calls (Required by backend RolesGuard)
    const headers = {
        'Content-Type': 'application/json',
        'x-role': currentUser.Role,
    };

    // Populate user profile info in top bar
    const userNameEl = document.getElementById('current-user-name');
    const userEmailEl = document.getElementById('current-user-email');
    if (userNameEl && currentUser.Full_Name) userNameEl.textContent = currentUser.Full_Name;
    if (userEmailEl && currentUser.Email) userEmailEl.textContent = currentUser.Email;

    // Sign out handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('Lumina_Session');
            window.location.href = 'login.html';
        });
    }

    // =========================================================================
    // --- 2. IN-MEMORY DATA ARRAYS & APP STATE ---
    // =========================================================================

    let currentTab = 'data'; // 'data' | 'logs'
    let currentEntity = 'users';
    let rawEntityData = [];
    let filteredEntityData = [];
    let currentPage = 1;
    const rowsPerPage = 10;
    let editingItemId = null;
    let deletingItemId = null;

    // Entity metadata configuration
    const ENTITY_CONFIG = {
        'users': {
            label: 'Users',
            singular: 'User',
            endpoint: '/users',
            allowCreate: true,
            allowEdit: true,
            allowDelete: true,
            idField: 'userId',
            columns: [
                { key: 'userId', label: 'ID', isMono: true },
                { key: 'fullName', label: 'Full Name' },
                { key: 'email', label: 'Email' },
                { key: 'role', label: 'Role', isRoleBadge: true },
                { key: 'department', label: 'Department' }
            ],
            searchKeys: ['userId', 'fullName', 'email', 'role', 'department']
        },
        'courses': {
            label: 'Courses',
            singular: 'Course',
            endpoint: '/courses',
            allowCreate: true,
            allowEdit: true,
            allowDelete: false, // Per prompt: no DELETE for courses
            idField: 'courseId',
            columns: [
                { key: 'courseCode', label: 'Course Code', isMono: true },
                { key: 'courseName', label: 'Course Title' },
                { key: 'credits', label: 'Credits' },
                { key: 'department', label: 'Department' },
                { key: 'description', label: 'Description' }
            ],
            searchKeys: ['courseId', 'courseCode', 'courseName', 'department']
        },
        'sections': {
            label: 'Sections',
            singular: 'Section',
            endpoint: '/sections',
            allowCreate: true,
            allowEdit: true,
            allowDelete: true,
            idField: 'sectionId',
            columns: [
                { key: 'sectionId', label: 'Section ID', isMono: true },
                { key: 'courseCode', label: 'Course' },
                { key: 'sectionNumber', label: 'Sec #' },
                { key: 'instructorName', label: 'Instructor' },
                { key: 'room', label: 'Room' },
                { key: 'capacity', label: 'Capacity' },
                { key: 'term', label: 'Term' }
            ],
            searchKeys: ['sectionId', 'courseCode', 'instructorName', 'room', 'term']
        },
        'course-slots': {
            label: 'Course Slots',
            singular: 'Course Slot',
            endpoint: '/course-slots',
            allowCreate: true,
            allowEdit: true,
            allowDelete: true,
            idField: 'slotId',
            columns: [
                { key: 'slotId', label: 'Slot ID', isMono: true },
                { key: 'dayOfWeek', label: 'Day' },
                { key: 'startTime', label: 'Start Time', isMono: true },
                { key: 'endTime', label: 'End Time', isMono: true },
                { key: 'slotType', label: 'Slot Type' },
                { key: 'room', label: 'Default Room' }
            ],
            searchKeys: ['slotId', 'dayOfWeek', 'slotType', 'room']
        },
        'registrations': {
            label: 'Registrations',
            singular: 'Registration',
            endpoint: '/registrations',
            allowCreate: false, // Read + grade-edit only
            allowEdit: true,
            allowDelete: false,
            idField: 'registrationId',
            editGradeOnly: true,
            columns: [
                { key: 'registrationId', label: 'Reg ID', isMono: true },
                { key: 'studentId', label: 'Student ID', isMono: true },
                { key: 'studentName', label: 'Student Name' },
                { key: 'courseCode', label: 'Course' },
                { key: 'sectionNumber', label: 'Section' },
                { key: 'grade', label: 'Grade', isGradeBadge: true },
                { key: 'status', label: 'Status', isStatusBadge: true }
            ],
            searchKeys: ['registrationId', 'studentId', 'studentName', 'courseCode', 'grade', 'status']
        },
        'overrides': {
            label: 'Override Requests',
            singular: 'Override Request',
            endpoint: '/overrides',
            allowCreate: false, // Read + status update only
            allowEdit: true,
            allowDelete: false,
            idField: 'overrideId',
            editStatusOnly: true,
            columns: [
                { key: 'overrideId', label: 'Req ID', isMono: true },
                { key: 'studentId', label: 'Student ID', isMono: true },
                { key: 'studentName', label: 'Student Name' },
                { key: 'courseCode', label: 'Course Code' },
                { key: 'reason', label: 'Reason' },
                { key: 'status', label: 'Status', isStatusBadge: true },
                { key: 'requestedAt', label: 'Requested At', isMono: true }
            ],
            searchKeys: ['overrideId', 'studentId', 'studentName', 'courseCode', 'reason', 'status']
        },
        'enrollment-phases': {
            label: 'Enrollment Phases',
            singular: 'Enrollment Phase',
            endpoint: '/enrollment-phases',
            allowCreate: true,
            allowEdit: true,
            allowDelete: true,
            idField: 'phaseId',
            columns: [
                { key: 'phaseId', label: 'Phase ID', isMono: true },
                { key: 'phaseName', label: 'Phase Name' },
                { key: 'startDate', label: 'Start Date', isMono: true },
                { key: 'endDate', label: 'End Date', isMono: true },
                { key: 'status', label: 'Status', isStatusBadge: true },
                { key: 'eligibleBatch', label: 'Eligible Batch' }
            ],
            searchKeys: ['phaseId', 'phaseName', 'status', 'eligibleBatch']
        },
        'announcements': {
            label: 'Announcements',
            singular: 'Announcement',
            endpoint: '/announcements',
            allowCreate: true,
            allowEdit: false, // Per prompt: read + create only
            allowDelete: false,
            idField: 'announcementId',
            columns: [
                { key: 'announcementId', label: 'ID', isMono: true },
                { key: 'title', label: 'Title' },
                { key: 'author', label: 'Author' },
                { key: 'targetAudience', label: 'Audience' },
                { key: 'createdAt', label: 'Date Posted', isMono: true }
            ],
            searchKeys: ['announcementId', 'title', 'content', 'author', 'targetAudience']
        }
    };

    // =========================================================================
    // --- 3. DATA FETCHING & ENTITY CONTROLLERS ---
    // =========================================================================

    /**
     * Generic loader for any active entity
     */
    async function loadEntityData(entityKey) {
        const config = ENTITY_CONFIG[entityKey];
        if (!config) return;

        showTableLoading();
        hideTableError();

        try {
            const response = await fetch(`${API_BASE}${config.endpoint}`, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server responded with status ${response.status}`);
            }

            const data = await response.json();
            rawEntityData = Array.isArray(data) ? data : (data.data || []);
            
            // Update chip count badge
            updateEntityCountBadge(entityKey, rawEntityData.length);

            // Apply active search filter
            applySearchFilter();

        } catch (error) {
            console.error(`Failed to load ${entityKey}:`, error);
            showTableError(`Failed to load ${config.label}. ${error.message}`);
            rawEntityData = [];
            filteredEntityData = [];
            renderTable();
        }
    }

    // Specialized load handlers for prompt specification adherence
    async function loadUsers() { return loadEntityData('users'); }
    async function loadCourses() { return loadEntityData('courses'); }
    async function loadSections() { return loadEntityData('sections'); }
    async function loadCourseSlots() { return loadEntityData('course-slots'); }
    async function loadRegistrations() { return loadEntityData('registrations'); }
    async function loadOverrides() { return loadEntityData('overrides'); }
    async function loadEnrollmentPhases() { return loadEntityData('enrollment-phases'); }
    async function loadAnnouncements() { return loadEntityData('announcements'); }

    /**
     * Refresh counts for all active entities in the background
     */
    async function refreshAllEntityCounts() {
        const entities = Object.keys(ENTITY_CONFIG);
        for (const entity of entities) {
            try {
                const res = await fetch(`${API_BASE}${ENTITY_CONFIG[entity].endpoint}`, {
                    method: 'GET',
                    headers: headers
                });
                if (res.ok) {
                    const d = await res.json();
                    const count = Array.isArray(d) ? d.length : (d.data ? d.data.length : 0);
                    updateEntityCountBadge(entity, count);
                }
            } catch (e) {
                // Silently ignore background count fetch failures
            }
        }
    }

    function updateEntityCountBadge(entityKey, count) {
        const badge = document.getElementById(`count-${entityKey}`);
        if (badge) {
            badge.textContent = count > 999 ? (count / 1000).toFixed(1) + 'k' : count;
        }
    }

    // =========================================================================
    // --- 4. TABLE RENDERING, PAGINATION & FORMATTERS ---
    // =========================================================================

    function renderTable() {
        const config = ENTITY_CONFIG[currentEntity];
        const thead = document.getElementById('table-head-row');
        const tbody = document.getElementById('table-body');
        const emptyState = document.getElementById('table-empty-state');
        const paginationInfo = document.getElementById('pagination-info');
        const prevBtn = document.getElementById('btn-prev-page');
        const nextBtn = document.getElementById('btn-next-page');

        if (!thead || !tbody || !config) return;

        // Render Table Headers
        let headerHtml = '';
        config.columns.forEach(col => {
            headerHtml += `<th class="px-4 py-2">${escapeHtml(col.label)}</th>`;
        });

        // Actions column
        const hasActions = config.allowEdit || config.allowDelete;
        if (hasActions) {
            headerHtml += `<th class="px-4 py-2 text-right">Actions</th>`;
        }
        thead.innerHTML = headerHtml;

        // Calculate pagination slices
        const totalItems = filteredEntityData.length;
        const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
        
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
        const pageItems = filteredEntityData.slice(startIndex, endIndex);

        // Clear existing body
        tbody.innerHTML = '';

        if (pageItems.length === 0) {
            if (emptyState) emptyState.style.display = 'flex';
        } else {
            if (emptyState) emptyState.style.display = 'none';

            // Build rows matching row-building pattern
            pageItems.forEach(item => {
                const itemId = item[config.idField] || item.id;
                let rowHtml = `<tr class="table-row group" data-id="${escapeHtml(String(itemId))}">`;

                config.columns.forEach(col => {
                    const rawVal = item[col.key];
                    const val = rawVal !== undefined && rawVal !== null ? String(rawVal) : '—';

                    if (col.isRoleBadge) {
                        rowHtml += `<td>${renderRoleBadge(val)}</td>`;
                    } else if (col.isStatusBadge) {
                        rowHtml += `<td>${renderStatusBadge(val)}</td>`;
                    } else if (col.isGradeBadge) {
                        rowHtml += `<td>${renderGradeBadge(val)}</td>`;
                    } else if (col.isMono) {
                        rowHtml += `<td class="font-mono">${escapeHtml(val)}</td>`;
                    } else {
                        rowHtml += `<td>${escapeHtml(val)}</td>`;
                    }
                });

                // Render action buttons
                if (hasActions) {
                    let actionsHtml = `<td class="table-actions">`;
                    if (config.allowEdit) {
                        actionsHtml += `
                            <button class="row-action-btn edit-btn" data-id="${escapeHtml(String(itemId))}" title="Edit record">
                                <span class="material-symbols-outlined" style="font-size: 18px;">edit</span>
                            </button>
                        `;
                    }
                    if (config.allowDelete) {
                        actionsHtml += `
                            <button class="row-action-btn delete-btn" data-id="${escapeHtml(String(itemId))}" title="Delete record">
                                <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
                            </button>
                        `;
                    }
                    actionsHtml += `</td>`;
                    rowHtml += actionsHtml;
                }

                rowHtml += `</tr>`;
                tbody.insertAdjacentHTML('beforeend', rowHtml);
            });

            // Wire row action button clicks
            tbody.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.getAttribute('data-id');
                    openCrudModal(id);
                });
            });

            tbody.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.getAttribute('data-id');
                    openDeleteConfirmModal(id);
                });
            });
        }

        // Update Pagination controls
        if (paginationInfo) {
            if (totalItems === 0) {
                paginationInfo.textContent = 'Showing 0 of 0 rows';
            } else {
                paginationInfo.textContent = `Showing ${startIndex + 1}-${endIndex} of ${totalItems} rows`;
            }
        }
        if (prevBtn) prevBtn.disabled = currentPage <= 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;

        // Update Add Button visibility & label
        const addBtn = document.getElementById('btn-add-entity');
        const addBtnLabel = document.getElementById('btn-add-entity-label');
        if (addBtn && addBtnLabel) {
            if (config.allowCreate) {
                addBtn.style.display = 'inline-flex';
                addBtnLabel.textContent = `Add New ${config.singular}`;
            } else {
                addBtn.style.display = 'none';
            }
        }
    }

    function renderRoleBadge(role) {
        const normalized = (role || '').trim();
        let cls = 'badge-gray';
        if (normalized === 'Student') cls = 'badge-student';
        else if (normalized === 'Faculty') cls = 'badge-faculty';
        else if (normalized === 'Dean') cls = 'badge-dean';
        else if (normalized.includes('Assistant_Dean')) cls = 'badge-assistant-dean';
        else if (normalized === 'Super_User') cls = 'badge-dean';

        return `<span class="badge ${cls}">${escapeHtml(normalized || 'Unknown')}</span>`;
    }

    function renderStatusBadge(status) {
        const s = (status || '').toLowerCase();
        let cls = 'badge-gray';
        if (s === 'active' || s === 'approved' || s === 'completed' || s === 'open') cls = 'badge-active';
        else if (s === 'pending' || s === 'in_progress' || s === 'scheduled') cls = 'badge-pending';
        else if (s === 'rejected' || s === 'cancelled' || s === 'closed' || s === 'dropped') cls = 'badge-rejected';

        return `<span class="badge ${cls}">${escapeHtml(status || '—')}</span>`;
    }

    function renderGradeBadge(grade) {
        const g = (grade || '').toUpperCase().trim();
        let cls = 'badge-gray';
        if (g.startsWith('A')) cls = 'badge-active';
        else if (g.startsWith('B') || g.startsWith('C')) cls = 'badge-student';
        else if (g === 'D' || g === 'F') cls = 'badge-rejected';
        else if (g === 'IP' || g === 'IN PROGRESS') cls = 'badge-pending';

        return `<span class="badge ${cls}">${escapeHtml(grade || 'IP')}</span>`;
    }

    function showTableLoading() {
        const tbody = document.getElementById('table-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <span class="material-symbols-outlined pulse-dot" style="display: inline-block; margin-right: 8px;"></span>
                        Loading ${ENTITY_CONFIG[currentEntity]?.label || 'data'}...
                    </td>
                </tr>
            `;
        }
    }

    function showTableError(message) {
        const errorContainer = document.getElementById('table-error-container');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="inline-error-banner">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="material-symbols-outlined" style="font-size: 20px;">error</span>
                        <span>${escapeHtml(message)}</span>
                    </div>
                    <button class="btn btn-outline" style="height: 28px; padding: 0 10px; font-size: 11px;" id="btn-retry-fetch">
                        Retry
                    </button>
                </div>
            `;
            errorContainer.style.display = 'block';

            const retryBtn = document.getElementById('btn-retry-fetch');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    loadEntityData(currentEntity);
                });
            }
        }
    }

    function hideTableError() {
        const errorContainer = document.getElementById('table-error-container');
        if (errorContainer) {
            errorContainer.innerHTML = '';
            errorContainer.style.display = 'none';
        }
    }

    // =========================================================================
    // --- 5. MODAL, FORMS & CRUD OPERATIONS ---
    // =========================================================================

    const crudModal = document.getElementById('crud-modal');
    const crudForm = document.getElementById('crud-form');
    const crudModalTitle = document.getElementById('crud-modal-title');
    const crudFieldsContainer = document.getElementById('crud-fields-container');
    const crudModalClose = document.getElementById('crud-modal-close');
    const btnCrudCancel = document.getElementById('btn-crud-cancel');

    const deleteModal = document.getElementById('delete-confirm-modal');
    const deleteItemLabel = document.getElementById('delete-item-label');
    const btnDeleteCancel = document.getElementById('btn-delete-cancel');
    const btnDeleteConfirm = document.getElementById('btn-delete-confirm');

    function openCrudModal(id = null) {
        editingItemId = id;
        const config = ENTITY_CONFIG[currentEntity];
        if (!config || !crudModal || !crudFieldsContainer) return;

        let existingItem = null;
        if (id !== null) {
            existingItem = rawEntityData.find(item => String(item[config.idField] || item.id) === String(id));
        }

        // Title update
        if (crudModalTitle) {
            if (id !== null) {
                crudModalTitle.textContent = config.editGradeOnly ? `Update Grade for Reg #${id}` :
                    (config.editStatusOnly ? `Update Status for Override #${id}` : `Edit ${config.singular} (${id})`);
            } else {
                crudModalTitle.textContent = `Add New ${config.singular}`;
            }
        }

        // Generate dynamic inputs based on entity
        crudFieldsContainer.innerHTML = buildFormFieldsHtml(currentEntity, existingItem);

        // Open modal
        crudModal.classList.add('open');
        crudModal.setAttribute('aria-hidden', 'false');
    }

    function closeCrudModal() {
        if (crudModal) {
            crudModal.classList.remove('open');
            crudModal.setAttribute('aria-hidden', 'true');
        }
        editingItemId = null;
    }

    function buildFormFieldsHtml(entityKey, item = null) {
        const isEdit = item !== null;

        switch (entityKey) {
            case 'users':
                return `
                    <div class="form-group">
                        <label class="form-label">User ID (Primary Key)</label>
                        <input type="text" class="form-input font-mono" name="userId" value="${escapeHtml(item?.userId || '')}" ${isEdit ? 'readonly' : 'required'} placeholder="e.g. S2024001">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Full Name</label>
                        <input type="text" class="form-input" name="fullName" value="${escapeHtml(item?.fullName || '')}" required placeholder="Enter full name">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-input" name="email" value="${escapeHtml(item?.email || '')}" required placeholder="user@lumina.edu">
                    </div>
                    ${!isEdit ? `
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" class="form-input" name="password" required placeholder="••••••••">
                    </div>` : ''}
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label">Role</label>
                            <select class="form-select" name="role" required>
                                <option value="Student" ${item?.role === 'Student' ? 'selected' : ''}>Student</option>
                                <option value="Faculty" ${item?.role === 'Faculty' ? 'selected' : ''}>Faculty</option>
                                <option value="Assistant_Dean_1" ${item?.role === 'Assistant_Dean_1' ? 'selected' : ''}>Assistant_Dean_1</option>
                                <option value="Assistant_Dean_2" ${item?.role === 'Assistant_Dean_2' ? 'selected' : ''}>Assistant_Dean_2</option>
                                <option value="Dean" ${item?.role === 'Dean' ? 'selected' : ''}>Dean</option>
                                <option value="Super_User" ${item?.role === 'Super_User' ? 'selected' : ''}>Super_User</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Department</label>
                            <select class="form-select" name="department" required>
                                <option value="CSE" ${item?.department === 'CSE' ? 'selected' : ''}>CSE</option>
                                <option value="ECE" ${item?.department === 'ECE' ? 'selected' : ''}>ECE</option>
                                <option value="AIDS" ${item?.department === 'AIDS' ? 'selected' : ''}>AIDS</option>
                                <option value="ASH" ${item?.department === 'ASH' ? 'selected' : ''}>ASH</option>
                            </select>
                        </div>
                    </div>
                `;

            case 'courses':
                return `
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label">Course Code</label>
                            <input type="text" class="form-input font-mono" name="courseCode" value="${escapeHtml(item?.courseCode || '')}" required placeholder="e.g. CS301">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Credits</label>
                            <input type="number" class="form-input" name="credits" value="${item?.credits || 4}" min="1" max="12" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Course Title</label>
                        <input type="text" class="form-input" name="courseName" value="${escapeHtml(item?.courseName || '')}" required placeholder="e.g. Operating Systems">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Department</label>
                        <select class="form-select" name="department" required>
                            <option value="CSE" ${item?.department === 'CSE' ? 'selected' : ''}>CSE</option>
                            <option value="ECE" ${item?.department === 'ECE' ? 'selected' : ''}>ECE</option>
                            <option value="AIDS" ${item?.department === 'AIDS' ? 'selected' : ''}>AIDS</option>
                            <option value="ASH" ${item?.department === 'ASH' ? 'selected' : ''}>ASH</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea class="form-textarea" name="description" placeholder="Course syllabus overview...">${escapeHtml(item?.description || '')}</textarea>
                    </div>
                `;

            case 'sections':
                return `
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label">Course Code</label>
                            <input type="text" class="form-input font-mono" name="courseCode" value="${escapeHtml(item?.courseCode || '')}" required placeholder="e.g. CS301">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Section Number</label>
                            <input type="text" class="form-input" name="sectionNumber" value="${escapeHtml(item?.sectionNumber || '1')}" required placeholder="e.g. 1">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Instructor Name</label>
                        <input type="text" class="form-input" name="instructorName" value="${escapeHtml(item?.instructorName || '')}" required placeholder="e.g. Dr. Arthur Pendelton">
                    </div>
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label">Room</label>
                            <input type="text" class="form-input" name="room" value="${escapeHtml(item?.room || '')}" required placeholder="e.g. LH-102">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Capacity</label>
                            <input type="number" class="form-input" name="capacity" value="${item?.capacity || 60}" min="1" max="500" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Academic Term</label>
                        <input type="text" class="form-input" name="term" value="${escapeHtml(item?.term || 'Fall 2026')}" required placeholder="e.g. Fall 2026">
                    </div>
                `;

            case 'course-slots':
                return `
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label">Day of Week</label>
                            <select class="form-select" name="dayOfWeek" required>
                                <option value="Monday" ${item?.dayOfWeek === 'Monday' ? 'selected' : ''}>Monday</option>
                                <option value="Tuesday" ${item?.dayOfWeek === 'Tuesday' ? 'selected' : ''}>Tuesday</option>
                                <option value="Wednesday" ${item?.dayOfWeek === 'Wednesday' ? 'selected' : ''}>Wednesday</option>
                                <option value="Thursday" ${item?.dayOfWeek === 'Thursday' ? 'selected' : ''}>Thursday</option>
                                <option value="Friday" ${item?.dayOfWeek === 'Friday' ? 'selected' : ''}>Friday</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Slot Type</label>
                            <select class="form-select" name="slotType" required>
                                <option value="Lecture" ${item?.slotType === 'Lecture' ? 'selected' : ''}>Lecture</option>
                                <option value="Lab" ${item?.slotType === 'Lab' ? 'selected' : ''}>Lab</option>
                                <option value="Tutorial" ${item?.slotType === 'Tutorial' ? 'selected' : ''}>Tutorial</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label">Start Time</label>
                            <input type="time" class="form-input font-mono" name="startTime" value="${escapeHtml(item?.startTime || '09:00')}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">End Time</label>
                            <input type="time" class="form-input font-mono" name="endTime" value="${escapeHtml(item?.endTime || '10:30')}" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Room</label>
                        <input type="text" class="form-input" name="room" value="${escapeHtml(item?.room || 'LH-101')}" placeholder="LH-101">
                    </div>
                `;

            case 'registrations':
                return `
                    <div class="form-group">
                        <label class="form-label">Student</label>
                        <input type="text" class="form-input" value="${escapeHtml(item?.studentName || '')} (${escapeHtml(item?.studentId || '')})" readonly disabled>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Course</label>
                        <input type="text" class="form-input" value="${escapeHtml(item?.courseCode || '')} (Sec ${escapeHtml(item?.sectionNumber || '1')})" readonly disabled>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Grade</label>
                        <select class="form-select font-mono" name="grade" required>
                            <option value="A" ${item?.grade === 'A' ? 'selected' : ''}>A (4.0)</option>
                            <option value="A-" ${item?.grade === 'A-' ? 'selected' : ''}>A- (3.7)</option>
                            <option value="B+" ${item?.grade === 'B+' ? 'selected' : ''}>B+ (3.3)</option>
                            <option value="B" ${item?.grade === 'B' ? 'selected' : ''}>B (3.0)</option>
                            <option value="B-" ${item?.grade === 'B-' ? 'selected' : ''}>B- (2.7)</option>
                            <option value="C+" ${item?.grade === 'C+' ? 'selected' : ''}>C+ (2.3)</option>
                            <option value="C" ${item?.grade === 'C' ? 'selected' : ''}>C (2.0)</option>
                            <option value="D" ${item?.grade === 'D' ? 'selected' : ''}>D (1.0)</option>
                            <option value="F" ${item?.grade === 'F' ? 'selected' : ''}>F (0.0)</option>
                            <option value="IP" ${item?.grade === 'IP' ? 'selected' : ''}>IP (In Progress)</option>
                        </select>
                    </div>
                `;

            case 'overrides':
                return `
                    <div class="form-group">
                        <label class="form-label">Student</label>
                        <input type="text" class="form-input" value="${escapeHtml(item?.studentName || '')} (${escapeHtml(item?.studentId || '')})" readonly disabled>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Reason</label>
                        <textarea class="form-textarea" readonly disabled>${escapeHtml(item?.reason || '')}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Override Decision Status</label>
                        <select class="form-select" name="status" required>
                            <option value="Approved" ${item?.status === 'Approved' ? 'selected' : ''}>Approved</option>
                            <option value="Rejected" ${item?.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                            <option value="Pending" ${item?.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        </select>
                    </div>
                `;

            case 'enrollment-phases':
                return `
                    <div class="form-group">
                        <label class="form-label">Phase Name</label>
                        <input type="text" class="form-input" name="phaseName" value="${escapeHtml(item?.phaseName || '')}" required placeholder="e.g. Senior Priority Window">
                    </div>
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label">Start Date & Time</label>
                            <input type="datetime-local" class="form-input font-mono" name="startDate" value="${escapeHtml(item?.startDate || '')}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">End Date & Time</label>
                            <input type="datetime-local" class="form-input font-mono" name="endDate" value="${escapeHtml(item?.endDate || '')}" required>
                        </div>
                    </div>
                    <div class="form-grid-2">
                        <div class="form-group">
                            <label class="form-label">Status</label>
                            <select class="form-select" name="status" required>
                                <option value="Active" ${item?.status === 'Active' ? 'selected' : ''}>Active</option>
                                <option value="Scheduled" ${item?.status === 'Scheduled' ? 'selected' : ''}>Scheduled</option>
                                <option value="Closed" ${item?.status === 'Closed' ? 'selected' : ''}>Closed</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Eligible Batch</label>
                            <input type="text" class="form-input" name="eligibleBatch" value="${escapeHtml(item?.eligibleBatch || 'All Batches')}" required placeholder="e.g. 2024, 2025">
                        </div>
                    </div>
                `;

            case 'announcements':
                return `
                    <div class="form-group">
                        <label class="form-label">Title</label>
                        <input type="text" class="form-input" name="title" required placeholder="Announcement title">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Target Audience</label>
                        <select class="form-select" name="targetAudience" required>
                            <option value="All">All Campus</option>
                            <option value="Students">Students Only</option>
                            <option value="Faculty">Faculty Only</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Content</label>
                        <textarea class="form-textarea" name="content" required placeholder="Write announcement details..." style="height: 100px;"></textarea>
                    </div>
                `;

            default:
                return '';
        }
    }

    // Form Save Handler
    if (crudForm) {
        crudForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const config = ENTITY_CONFIG[currentEntity];
            if (!config) return;

            const formData = new FormData(crudForm);
            const payload = {};
            formData.forEach((val, key) => {
                payload[key] = val;
            });

            // Convert numbers
            if (payload.credits) payload.credits = Number(payload.credits);
            if (payload.capacity) payload.capacity = Number(payload.capacity);

            const isEdit = editingItemId !== null;
            let url = `${API_BASE}${config.endpoint}`;
            let method = isEdit ? 'PUT' : 'POST';

            // Special endpoint paths
            if (isEdit) {
                if (config.editGradeOnly) {
                    url = `${API_BASE}/registrations/${editingItemId}/grade`;
                    method = 'PATCH';
                } else if (config.editStatusOnly) {
                    url = `${API_BASE}/overrides/${editingItemId}/status`;
                    method = 'PATCH';
                } else {
                    url = `${API_BASE}${config.endpoint}/${editingItemId}`;
                }
            }

            const saveBtn = document.getElementById('btn-crud-save');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.textContent = 'Saving...';
            }

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: headers,
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.message || `Save failed with status ${response.status}`);
                }

                closeCrudModal();
                await loadEntityData(currentEntity);

            } catch (err) {
                alert(`Error saving ${config.singular}: ${err.message}`);
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Save Changes';
                }
            }
        });
    }

    if (crudModalClose) crudModalClose.addEventListener('click', closeCrudModal);
    if (btnCrudCancel) btnCrudCancel.addEventListener('click', closeCrudModal);

    // Delete modal handlers
    function openDeleteConfirmModal(id) {
        deletingItemId = id;
        const config = ENTITY_CONFIG[currentEntity];
        if (!config || !deleteModal) return;

        if (deleteItemLabel) {
            deleteItemLabel.textContent = `${config.singular} #${id}`;
        }
        deleteModal.classList.add('open');
        deleteModal.setAttribute('aria-hidden', 'false');
    }

    function closeDeleteConfirmModal() {
        if (deleteModal) {
            deleteModal.classList.remove('open');
            deleteModal.setAttribute('aria-hidden', 'true');
        }
        deletingItemId = null;
    }

    if (btnDeleteCancel) btnDeleteCancel.addEventListener('click', closeDeleteConfirmModal);

    if (btnDeleteConfirm) {
        btnDeleteConfirm.addEventListener('click', async () => {
            if (!deletingItemId) return;
            const config = ENTITY_CONFIG[currentEntity];
            if (!config) return;

            btnDeleteConfirm.disabled = true;
            btnDeleteConfirm.textContent = 'Deleting...';

            try {
                const response = await fetch(`${API_BASE}${config.endpoint}/${deletingItemId}`, {
                    method: 'DELETE',
                    headers: headers
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.message || `Delete failed with status ${response.status}`);
                }

                closeDeleteConfirmModal();
                await loadEntityData(currentEntity);

            } catch (err) {
                alert(`Error deleting record: ${err.message}`);
            } finally {
                btnDeleteConfirm.disabled = false;
                btnDeleteConfirm.textContent = 'Delete Item';
            }
        });
    }

    // Add entity button handler
    const btnAddEntity = document.getElementById('btn-add-entity');
    if (btnAddEntity) {
        btnAddEntity.addEventListener('click', () => {
            openCrudModal(null);
        });
    }

    // =========================================================================
    // --- 6. SEARCH, FILTER & CSV EXPORT ---
    // =========================================================================

    const searchInput = document.getElementById('table-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applySearchFilter();
        });
    }

    function applySearchFilter() {
        const query = (searchInput?.value || '').trim().toLowerCase();
        const config = ENTITY_CONFIG[currentEntity];

        if (!query || !config) {
            filteredEntityData = [...rawEntityData];
        } else {
            filteredEntityData = rawEntityData.filter(item => {
                return config.searchKeys.some(key => {
                    const val = item[key];
                    return val && String(val).toLowerCase().includes(query);
                });
            });
        }

        currentPage = 1;
        renderTable();
    }

    // Export CSV Handler
    const exportCsvBtn = document.getElementById('export-csv-btn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => {
            exportCurrentTableToCsv();
        });
    }

    function exportCurrentTableToCsv() {
        const config = ENTITY_CONFIG[currentEntity];
        if (!config || filteredEntityData.length === 0) {
            alert('No data available to export.');
            return;
        }

        const headersRow = config.columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
        const rows = filteredEntityData.map(item => {
            return config.columns.map(c => {
                const val = item[c.key];
                const str = val !== undefined && val !== null ? String(val) : '';
                return `"${str.replace(/"/g, '""')}"`;
            }).join(',');
        });

        const csvContent = 'data:text/csv;charset=utf-8,' + [headersRow, ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `lumina_${currentEntity}_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Pagination Click Handlers
    const prevPageBtn = document.getElementById('btn-prev-page');
    const nextPageBtn = document.getElementById('btn-next-page');

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredEntityData.length / rowsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
            }
        });
    }

    // Active Entity Chip Click Handlers
    const entityChips = document.querySelectorAll('.entity-chip[data-entity]');
    entityChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const entity = chip.getAttribute('data-entity');
            if (entity && ENTITY_CONFIG[entity]) {
                entityChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                currentEntity = entity;
                if (searchInput) searchInput.value = '';
                loadEntityData(currentEntity);
            }
        });
    });

    // =========================================================================
    // --- 7. LOG CONSOLE & STREAMING CONTROLLER ---
    // =========================================================================

    // Realistic Mock Logs covering real backend services
    const MOCK_LOGS = [
        { timestamp: '2026-08-24 11:00:12.104', level: 'INFO', module: 'AuthService', message: 'User S2024001 successfully authenticated via OAuth SSO' },
        { timestamp: '2026-08-24 11:00:15.822', level: 'INFO', module: 'DatabaseService', message: 'Connection pool acquired 8 connections. Latency: 4ms' },
        { timestamp: '2026-08-24 11:00:22.450', level: 'WARN', module: 'RegistrationsService', message: 'Section CS301-1 reached 98% capacity threshold (59/60)' },
        { timestamp: '2026-08-24 11:00:35.019', level: 'INFO', module: 'EnrollmentPhasesService', message: 'Phase Senior Priority Window transition verification passed' },
        { timestamp: '2026-08-24 11:00:48.331', level: 'DEBUG', module: 'CourseSlotsService', message: 'Slot verification cache refreshed for Monday morning grid' },
        { timestamp: '2026-08-24 11:01:05.112', level: 'ERROR', module: 'OverridesService', message: 'Prerequisite validation failed for Student S2024045 on CS402 (Missing CS201)' },
        { timestamp: '2026-08-24 11:01:14.908', level: 'INFO', module: 'CoursesService', message: 'Catalog cache invalidated for department AIDS' },
        { timestamp: '2026-08-24 11:01:30.402', level: 'WARN', module: 'SectionsService', message: 'Instructor Dr. Arthur Pendelton assigned concurrent slots on Monday 09:00' },
        { timestamp: '2026-08-24 11:01:45.617', level: 'INFO', module: 'AnnouncementsService', message: 'Broadcast notification queued for target audience: Students' },
        { timestamp: '2026-08-24 11:02:01.218', level: 'INFO', module: 'AuthService', message: 'Elevated Super_User session initiated from 192.168.1.42' },
        { timestamp: '2026-08-24 11:02:18.773', level: 'DEBUG', module: 'DatabaseService', message: 'SELECT * FROM registrations WHERE student_id = ? [12ms]' },
        { timestamp: '2026-08-24 11:02:33.409', level: 'WARN', module: 'EnrollmentPhasesService', message: 'High concurrent transaction volume during registration spike' }
    ];

    let logBuffer = [...MOCK_LOGS];
    let filteredLogs = [...logBuffer];
    let isLiveStreaming = false;
    let liveStreamInterval = null;
    let selectedLogLevel = 'ALL';
    let selectedLogModule = 'ALL';
    let logSearchQuery = '';

    /**
     * Single function for fetching logs, structured for one-line swap to real API
     */
    async function fetchLogs() {
        // TODO: replace with real call once backend exposes GET /system/logs
        return MOCK_LOGS;
    }

    async function initLogs() {
        const initialLogs = await fetchLogs();
        logBuffer = [...initialLogs];
        updateLogCounts();
        applyLogFilters();
    }

    function renderLogs() {
        const terminalBody = document.getElementById('terminal-body');
        if (!terminalBody) return;

        terminalBody.innerHTML = '';

        if (filteredLogs.length === 0) {
            terminalBody.innerHTML = `<div style="color: #64748b; font-style: italic; padding: 20px 0;">No log entries match the current filter criteria.</div>`;
            return;
        }

        filteredLogs.forEach(entry => {
            const lineHtml = createLogLineHtml(entry);
            terminalBody.insertAdjacentHTML('beforeend', lineHtml);
        });

        // Auto scroll to bottom if streaming
        if (isLiveStreaming) {
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }
    }

    function createLogLineHtml(entry) {
        const lvlClass = `lvl-${entry.level.toLowerCase()}`;
        let messageText = escapeHtml(entry.message);

        // Highlight search query matches
        if (logSearchQuery) {
            const regex = new RegExp(`(${escapeRegex(logSearchQuery)})`, 'gi');
            messageText = messageText.replace(regex, '<mark>$1</mark>');
        }

        return `
            <div class="terminal-line">
                <span class="log-time">${escapeHtml(entry.timestamp.slice(11, 23))}</span>
                <span class="log-lvl ${lvlClass}">[${escapeHtml(entry.level)}]</span>
                <span class="log-mod">[${escapeHtml(entry.module)}]</span>
                <span class="log-msg">${messageText}</span>
            </div>
        `;
    }

    function applyLogFilters() {
        filteredLogs = logBuffer.filter(entry => {
            // Level filter
            if (selectedLogLevel !== 'ALL' && entry.level !== selectedLogLevel) return false;
            // Module filter
            if (selectedLogModule !== 'ALL' && entry.module !== selectedLogModule) return false;
            // Search text/regex filter
            if (logSearchQuery) {
                const combined = `${entry.timestamp} ${entry.level} ${entry.module} ${entry.message}`.toLowerCase();
                if (!combined.includes(logSearchQuery.toLowerCase())) return false;
            }
            return true;
        });

        renderLogs();
    }

    function updateLogCounts() {
        const countAll = logBuffer.length;
        const countInfo = logBuffer.filter(l => l.level === 'INFO').length;
        const countWarn = logBuffer.filter(l => l.level === 'WARN').length;
        const countError = logBuffer.filter(l => l.level === 'ERROR').length;
        const countDebug = logBuffer.filter(l => l.level === 'DEBUG').length;

        const elAll = document.getElementById('count-log-all');
        const elInfo = document.getElementById('count-log-info');
        const elWarn = document.getElementById('count-log-warn');
        const elError = document.getElementById('count-log-error');
        const elDebug = document.getElementById('count-log-debug');
        const bufferCountEl = document.getElementById('log-buffer-count');

        if (elAll) elAll.textContent = countAll;
        if (elInfo) elInfo.textContent = countInfo;
        if (elWarn) elWarn.textContent = countWarn;
        if (elError) elError.textContent = countError;
        if (elDebug) elDebug.textContent = countDebug;
        if (bufferCountEl) bufferCountEl.textContent = `${countAll} log entries buffered`;
    }

    // Live streaming mock generator
    const SAMPLE_MODULES = [
        'AuthService', 'CoursesService', 'RegistrationsService',
        'OverridesService', 'EnrollmentPhasesService', 'DatabaseService',
        'SectionsService', 'CourseSlotsService', 'AnnouncementsService'
    ];
    const SAMPLE_MESSAGES = [
        { lvl: 'INFO', mod: 'RegistrationsService', msg: 'Registration verified for student S2024001 in CS301-1' },
        { lvl: 'INFO', mod: 'DatabaseService', msg: 'Query executed: UPDATE sections SET enrolled = enrolled + 1 (3ms)' },
        { lvl: 'WARN', mod: 'SectionsService', msg: 'Capacity threshold reached for Section AIDS201-2 (45/45)' },
        { lvl: 'DEBUG', mod: 'CourseSlotsService', msg: 'Slot clash detector verified schedule matrix cleanly' },
        { lvl: 'INFO', mod: 'AuthService', msg: 'Token refreshed for session user D9920102' },
        { lvl: 'WARN', mod: 'OverridesService', msg: 'Prerequisite override requested for CS401 by Student S2024022' },
        { lvl: 'ERROR', mod: 'DatabaseService', msg: 'Connection timeout on secondary read replica (recovered)' },
        { lvl: 'INFO', mod: 'EnrollmentPhasesService', msg: 'Batch eligibility audit verified for upcoming window' }
    ];

    function toggleLiveStream() {
        const liveBtn = document.getElementById('btn-live-toggle');
        const liveText = document.getElementById('live-toggle-text');
        const liveDot = document.getElementById('live-pulse-dot');
        const connectionBadge = document.getElementById('log-connection-badge');
        const connectionText = document.getElementById('connection-status-text');

        isLiveStreaming = !isLiveStreaming;

        if (isLiveStreaming) {
            if (liveBtn) liveBtn.classList.add('is-live');
            if (liveText) liveText.textContent = 'PAUSE STREAM';
            if (liveDot) liveDot.style.display = 'inline-block';
            if (connectionBadge) {
                connectionBadge.className = 'connection-badge connected';
            }
            if (connectionText) {
                connectionText.textContent = 'Mock Streaming Active (1 event / 3s)';
            }

            liveStreamInterval = setInterval(() => {
                const sample = SAMPLE_MESSAGES[Math.floor(Math.random() * SAMPLE_MESSAGES.length)];
                const now = new Date();
                const timeStr = now.toISOString().replace('T', ' ').slice(0, 23);

                const newLog = {
                    timestamp: timeStr,
                    level: sample.lvl,
                    module: sample.mod,
                    message: sample.msg
                };

                logBuffer.push(newLog);
                updateLogCounts();
                applyLogFilters();
            }, 3000);

        } else {
            if (liveBtn) liveBtn.classList.remove('is-live');
            if (liveText) liveText.textContent = '● START LIVE STREAM';
            if (liveDot) liveDot.style.display = 'none';
            if (connectionBadge) {
                connectionBadge.className = 'connection-badge mock-mode';
            }
            if (connectionText) {
                connectionText.textContent = 'Log service not configured (Mock Mode)';
            }

            if (liveStreamInterval) {
                clearInterval(liveStreamInterval);
                liveStreamInterval = null;
            }
        }
    }

    // Log UI event listeners
    const liveToggleBtn = document.getElementById('btn-live-toggle');
    if (liveToggleBtn) liveToggleBtn.addEventListener('click', toggleLiveStream);

    const levelPills = document.querySelectorAll('.filter-pill[data-level]');
    levelPills.forEach(pill => {
        pill.addEventListener('click', () => {
            levelPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            selectedLogLevel = pill.getAttribute('data-level') || 'ALL';
            applyLogFilters();
        });
    });

    const moduleSelect = document.getElementById('log-module-select');
    if (moduleSelect) {
        moduleSelect.addEventListener('change', (e) => {
            selectedLogModule = e.target.value;
            applyLogFilters();
        });
    }

    const logSearchInput = document.getElementById('log-search-input');
    if (logSearchInput) {
        logSearchInput.addEventListener('input', (e) => {
            logSearchQuery = (e.target.value || '').trim();
            applyLogFilters();
        });
    }

    const clearLogsBtn = document.getElementById('btn-clear-logs');
    if (clearLogsBtn) {
        clearLogsBtn.addEventListener('click', () => {
            logBuffer = [];
            updateLogCounts();
            applyLogFilters();
        });
    }

    const scrollBottomBtn = document.getElementById('btn-scroll-bottom');
    if (scrollBottomBtn) {
        scrollBottomBtn.addEventListener('click', () => {
            const terminalBody = document.getElementById('terminal-body');
            if (terminalBody) {
                terminalBody.scrollTop = terminalBody.scrollHeight;
            }
        });
    }

    // Terminal Clock updater
    function updateTerminalClock() {
        const clockEl = document.getElementById('terminal-clock');
        if (clockEl) {
            const now = new Date();
            clockEl.textContent = now.toTimeString().split(' ')[0];
        }
    }
    setInterval(updateTerminalClock, 1000);
    updateTerminalClock();

    // =========================================================================
    // --- 8. TAB SWITCHER & NAVIGATION LOGIC ---
    // =========================================================================

    const tabBtnData = document.getElementById('tab-btn-data');
    const tabBtnLogs = document.getElementById('tab-btn-logs');
    const tabDataContent = document.getElementById('tab-data');
    const tabLogsContent = document.getElementById('tab-logs');

    const navOverview = document.getElementById('nav-overview');
    const navLogs = document.getElementById('nav-logs');

    function switchTab(targetTab) {
        currentTab = targetTab;
        if (targetTab === 'data') {
            tabBtnData?.classList.add('active');
            tabBtnLogs?.classList.remove('active');
            tabDataContent?.classList.remove('hidden');
            tabLogsContent?.classList.add('hidden');

            navOverview?.classList.add('active');
            navLogs?.classList.remove('active');
        } else {
            tabBtnLogs?.classList.add('active');
            tabBtnData?.classList.remove('active');
            tabLogsContent?.classList.remove('hidden');
            tabDataContent?.classList.add('hidden');

            navLogs?.classList.add('active');
            navOverview?.classList.remove('active');

            // Render logs when tab becomes visible
            renderLogs();
        }
    }

    if (tabBtnData) tabBtnData.addEventListener('click', () => switchTab('data'));
    if (tabBtnLogs) tabBtnLogs.addEventListener('click', () => switchTab('logs'));
    if (navOverview) {
        navOverview.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab('data');
        });
    }
    if (navLogs) {
        navLogs.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab('logs');
        });
    }

    // =========================================================================
    // --- 9. UTILITY HELPERS & INITIALIZATION ---
    // =========================================================================

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Initialize application data
    loadEntityData(currentEntity);
    refreshAllEntityCounts();
    initLogs();
});
