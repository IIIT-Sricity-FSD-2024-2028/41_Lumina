/**
 * Lumina Course Enrollment & Academic Planning System
 * Super User Console - Client Controller
 * File: js/super_user.js
 */

const API_BASE = window.location.protocol === 'file:' || window.location.port !== '3000'
    ? 'http://localhost:3000'
    : window.location.origin;

document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // --- 1. SESSION PROTECTION & ROLE GUARD ---
    // =========================================================================
    let sessionData = localStorage.getItem('Lumina_Session');
    let currentUser = null;
    try {
        currentUser = sessionData ? JSON.parse(sessionData) : null;
    } catch (e) {
        localStorage.removeItem('Lumina_Session');
        window.location.href = 'login.html';
        return;
    }

    if (!currentUser || currentUser.Role !== 'Super_User') {
        window.location.href = 'login.html';
        return;
    }


    const headers = {
        'Content-Type': 'application/json',
        ...(currentUser && currentUser.accessToken ? { 'Authorization': `Bearer ${currentUser.accessToken}` } : {}),
        'x-role': currentUser.Role,
    };


    // Populate Top Navigation User Info
    const userNameEl = document.getElementById('user-full-name');
    const userRoleEl = document.getElementById('user-role-display');
    if (userNameEl) userNameEl.textContent = currentUser.Full_Name || 'Super User';
    if (userRoleEl) userRoleEl.textContent = `Role: ${currentUser.Role} (${currentUser.Dept_ID || 'General'})`;

    // Logout Action
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('Lumina_Session');
        window.location.href = 'login.html';
    });


    // =========================================================================
    // --- 2. ENTITY DATA STORE & SCHEMAS ---
    // =========================================================================
    let currentActiveTab = 'overview';
    let currentSelectedEntity = 'users';

    // Cached Entity Datasets (all records returned camelCase from backend)
    const entityCache = {
        users: [],
        courses: [],
        sections: [],
        'course-slots': [],
        registrations: [],
        overrides: [],
        'enrollment-phases': [],
        announcements: [],
    };

    // Entity Configuration Map
    const ENTITY_CONFIGS = {
        users: {
            title: 'Users',
            singular: 'User',
            endpoint: '/users',
            idKey: 'userId',
            canCreate: true,
            canEdit: true,
            canDelete: true,
            columns: ['User ID', 'Full Name', 'Email', 'Role', 'Department', 'Actions'],
            filterOptions: [
                { value: 'ALL', label: 'All Roles' },
                { value: 'Student', label: 'Students' },
                { value: 'Faculty', label: 'Faculty' },
                { value: 'Dean', label: 'Deans' },
                { value: 'Admin', label: 'Admins' },
            ],
            filterFn: (item, filterVal) => (filterVal === 'ALL' ? true : item.role === filterVal),
            searchFields: ['userId', 'fullName', 'email', 'role', 'deptId'],
        },
        courses: {
            title: 'Courses',
            singular: 'Course',
            endpoint: '/courses',
            idKey: 'courseId',
            canCreate: true,
            canEdit: true,
            canDelete: false, // Prompt rule: no delete endpoint for courses
            columns: ['Course ID', 'Course Name', 'Credits', 'Capacity', 'Status', 'Department', 'Actions'],
            filterOptions: [
                { value: 'ALL', label: 'All Statuses' },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
            ],
            filterFn: (item, filterVal) => (filterVal === 'ALL' ? true : item.status === filterVal),
            searchFields: ['courseId', 'courseName', 'deptId', 'status'],
        },
        sections: {
            title: 'Sections',
            singular: 'Section',
            endpoint: '/sections',
            idKey: 'sectionId',
            canCreate: true,
            canEdit: true,
            canDelete: true,
            columns: ['Section ID', 'Course ID', 'Term', 'Instructor', 'Capacity', 'Actions'],
            filterOptions: [
                { value: 'ALL', label: 'All Terms' },
                { value: 'Fall 2026', label: 'Fall 2026' },
                { value: 'Spring 2026', label: 'Spring 2026' },
                { value: 'Summer 2026', label: 'Summer 2026' },
            ],
            filterFn: (item, filterVal) => (filterVal === 'ALL' ? true : item.term === filterVal),
            searchFields: ['sectionId', 'courseId', 'term', 'instructor'],
        },
        'course-slots': {
            title: 'Course Slots',
            singular: 'Course Slot',
            endpoint: '/course-slots',
            idKey: 'slotId',
            canCreate: true,
            canEdit: true,
            canDelete: true,
            columns: ['Slot ID', 'Section ID', 'Day', 'Time', 'Room', 'Actions'],
            filterOptions: [
                { value: 'ALL', label: 'All Days' },
                { value: 'Monday', label: 'Monday' },
                { value: 'Tuesday', label: 'Tuesday' },
                { value: 'Wednesday', label: 'Wednesday' },
                { value: 'Thursday', label: 'Thursday' },
                { value: 'Friday', label: 'Friday' },
            ],
            filterFn: (item, filterVal) => (filterVal === 'ALL' ? true : item.day === filterVal),
            searchFields: ['slotId', 'sectionId', 'day', 'time', 'room'],
        },
        registrations: {
            title: 'Registrations',
            singular: 'Registration',
            endpoint: '/registrations',
            idKey: 'enrollmentId',
            canCreate: false, // Prompt rule: Create ❌
            canEdit: true,    // Prompt rule: Edit ✅ (grade only)
            canDelete: false, // Prompt rule: Delete ❌
            columns: ['Enrollment ID', 'Student ID', 'Course ID', 'Term', 'Status', 'Final Grade', 'Actions'],
            filterOptions: [
                { value: 'ALL', label: 'All Statuses' },
                { value: 'Enrolled', label: 'Enrolled' },
                { value: 'Pending_Allocation', label: 'Pending Allocation' },
                { value: 'Waitlisted', label: 'Waitlisted' },
                { value: 'Dropped', label: 'Dropped' },
            ],
            filterFn: (item, filterVal) => (filterVal === 'ALL' ? true : item.status === filterVal),
            searchFields: ['enrollmentId', 'studentId', 'courseId', 'term', 'status', 'finalGrade'],
        },
        overrides: {
            title: 'Override Requests',
            singular: 'Override Request',
            endpoint: '/overrides',
            idKey: 'requestId',
            canCreate: false, // Prompt rule: Create ❌
            canEdit: true,    // Prompt rule: Edit ✅ (status only: approve/reject)
            canDelete: false, // Prompt rule: Delete ❌
            columns: ['Request ID', 'Student ID', 'Course ID', 'Reason', 'Status', 'Created At', 'Actions'],
            filterOptions: [
                { value: 'ALL', label: 'All Statuses' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Approved', label: 'Approved' },
                { value: 'Rejected', label: 'Rejected' },
            ],
            filterFn: (item, filterVal) => (filterVal === 'ALL' ? true : item.status === filterVal),
            searchFields: ['requestId', 'studentId', 'courseId', 'reason', 'status'],
        },
        'enrollment-phases': {
            title: 'Enrollment Phases',
            singular: 'Enrollment Phase',
            endpoint: '/enrollment-phases',
            idKey: 'id',
            canCreate: true,
            canEdit: true,
            canDelete: true,
            columns: ['Phase ID', 'Phase Name', 'Eligible Groups', 'Timeline', 'Status', 'Actions'],
            filterOptions: [
                { value: 'ALL', label: 'All Statuses' },
                { value: 'Active', label: 'Active' },
                { value: 'Upcoming', label: 'Upcoming' },
                { value: 'Completed', label: 'Completed' },
            ],
            filterFn: (item, filterVal) => (filterVal === 'ALL' ? true : item.status === filterVal),
            searchFields: ['id', 'name', 'eligibleGroups', 'timeline', 'status'],
        },
        announcements: {
            title: 'Announcements',
            singular: 'Announcement',
            endpoint: '/announcements',
            idKey: 'announcementId',
            canCreate: true,
            canEdit: true,
            canDelete: true,
            columns: ['ID', 'Course', 'Title', 'Message', 'Posted By', 'Date', 'Actions'],
            filterOptions: [
                { value: 'ALL', label: 'All Announcements' },
            ],
            filterFn: () => true,
            searchFields: ['announcementId', 'id', 'courseId', 'title', 'message', 'facultyId', 'createdAt'],
        },
    };


    // =========================================================================
    // --- 3. OVERVIEW TAB: CRUD ENGINE & DATA FETCHERS ---
    // =========================================================================

    /**
     * Generic loader mapping per entity
     */
    async function loadEntityData(entityKey) {
        const config = ENTITY_CONFIGS[entityKey];
        if (!config) return;

        showTableLoading(true);
        hideTableError();

        try {
            const response = await fetch(`${API_BASE}${config.endpoint}`, {
                method: 'GET',
                headers: headers,
            });

            if (!response.ok) {
                throw new Error(`Server returned HTTP ${response.status} (${response.statusText})`);
            }

            const data = await response.json();
            entityCache[entityKey] = Array.isArray(data) ? data : [];

            renderTable(entityKey);
            updateStatStrip();
        } catch (err) {
            console.error(`Failed to load ${entityKey}:`, err);
            showTableError(`Failed to load ${config.title}`, err.message || 'Network error or backend route unavailable.');
            entityCache[entityKey] = [];
            renderTable(entityKey);
        } finally {
            showTableLoading(false);
        }
    }

    // Specific entity loader wrappers
    window.loadUsers = () => loadEntityData('users');
    window.loadCourses = () => loadEntityData('courses');
    window.loadSections = () => loadEntityData('sections');
    window.loadCourseSlots = () => loadEntityData('course-slots');
    window.loadRegistrations = () => loadEntityData('registrations');
    window.loadOverrides = () => loadEntityData('overrides');
    window.loadEnrollmentPhases = () => loadEntityData('enrollment-phases');
    window.loadAnnouncements = () => loadEntityData('announcements');

    /**
     * Renders table columns and rows for current entity
     * Following the exact row-building pattern from dean.js's renderTable()
     */
    function renderTable(entityKey) {
        const config = ENTITY_CONFIGS[entityKey];
        if (!config) return;

        const thead = document.getElementById('crud-table-head');
        const tbody = document.getElementById('crud-table-body');
        const emptyState = document.getElementById('table-empty-state');
        const countBadge = document.getElementById('records-count-badge');
        const addBtn = document.getElementById('add-entity-btn');
        const addBtnLabel = document.getElementById('add-entity-btn-label');
        const searchInput = document.getElementById('table-search-input');
        const filterSelect = document.getElementById('table-filter-select');

        // Configure Add Button visibility
        if (config.canCreate) {
            addBtn.style.display = 'inline-flex';
            addBtnLabel.textContent = `+ Add New ${config.singular}`;
        } else {
            addBtn.style.display = 'none';
        }

        // Configure Search Placeholder
        searchInput.placeholder = `Search in ${config.title}...`;

        // Render Table Headers
        thead.innerHTML = `
            <tr>
                ${config.columns.map(col => `<th>${col}</th>`).join('')}
            </tr>
        `;

        // Filter and Search Records
        const searchTerm = (searchInput.value || '').trim().toLowerCase();
        const activeFilter = filterSelect.value || 'ALL';

        const rawList = entityCache[entityKey] || [];
        const filteredList = rawList.filter(item => {
            // Apply Entity Filter
            if (config.filterFn && !config.filterFn(item, activeFilter)) {
                return false;
            }
            // Apply Search Query
            if (searchTerm) {
                const match = config.searchFields.some(field => {
                    const val = item[field];
                    return val !== undefined && val !== null && String(val).toLowerCase().includes(searchTerm);
                });
                if (!match) return false;
            }
            return true;
        });

        // Update Record Count
        countBadge.textContent = `${filteredList.length} ${filteredList.length === 1 ? 'record' : 'records'}`;

        // Clear existing rows
        tbody.innerHTML = '';

        if (filteredList.length === 0) {
            emptyState.style.display = 'block';
            return;
        } else {
            emptyState.style.display = 'none';
        }

        // Build Rows using template-literal row string + insertAdjacentHTML('beforeend', ...)
        filteredList.forEach(item => {
            const rowHtml = buildRowTemplate(entityKey, item);
            tbody.insertAdjacentHTML('beforeend', rowHtml);
        });

        // Attach action handlers for newly rendered rows
        attachRowActionListeners(entityKey);
    }

    /**
     * Builds individual table row HTML according to entity schema
     */
    function buildRowTemplate(entityKey, item) {
        switch (entityKey) {
            case 'users':
                return `
                    <tr data-id="${escapeHtml(item.userId)}">
                        <td><strong>${escapeHtml(item.userId)}</strong></td>
                        <td>${escapeHtml(item.fullName || '—')}</td>
                        <td>${escapeHtml(item.email || '—')}</td>
                        <td><span class="badge ${getRoleBadgeClass(item.role)}">${escapeHtml(item.role || 'Student')}</span></td>
                        <td>${escapeHtml(item.deptId || '—')}</td>
                        <td>
                            <div class="row-actions">
                                <button class="action-btn-edit" data-action="edit" data-id="${escapeHtml(item.userId)}" title="Edit User">
                                    <img src="assets/icons/edit.svg" alt="" width="13" height="13" />
                                    <span>Edit</span>
                                </button>
                                <button class="action-btn-delete" data-action="delete" data-id="${escapeHtml(item.userId)}" title="Delete User">
                                    <img src="assets/icons/trash.svg" alt="" width="13" height="13" />
                                    <span>Delete</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;

            case 'courses':
                return `
                    <tr data-id="${escapeHtml(item.courseId)}">
                        <td><strong>${escapeHtml(item.courseId)}</strong></td>
                        <td>${escapeHtml(item.courseName || '—')}</td>
                        <td>${item.credits !== undefined ? item.credits : '—'}</td>
                        <td>${item.capacity !== undefined ? item.capacity : '—'}</td>
                        <td><span class="badge ${getStatusBadgeClass(item.status)}">${escapeHtml(item.status || 'Active')}</span></td>
                        <td>${escapeHtml(item.deptId || '—')}</td>
                        <td>
                            <div class="row-actions">
                                <button class="action-btn-edit" data-action="edit" data-id="${escapeHtml(item.courseId)}" title="Edit Course">
                                    <img src="assets/icons/edit.svg" alt="" width="13" height="13" />
                                    <span>Edit</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;

            case 'sections':
                return `
                    <tr data-id="${escapeHtml(item.sectionId)}">
                        <td><strong>${escapeHtml(item.sectionId)}</strong></td>
                        <td>${escapeHtml(item.courseId || '—')}</td>
                        <td>${escapeHtml(item.term || '—')}</td>
                        <td>${escapeHtml(item.instructor || '—')}</td>
                        <td>${item.capacity !== undefined ? item.capacity : '—'}</td>
                        <td>
                            <div class="row-actions">
                                <button class="action-btn-edit" data-action="edit" data-id="${escapeHtml(item.sectionId)}" title="Edit Section">
                                    <img src="assets/icons/edit.svg" alt="" width="13" height="13" />
                                    <span>Edit</span>
                                </button>
                                <button class="action-btn-delete" data-action="delete" data-id="${escapeHtml(item.sectionId)}" title="Delete Section">
                                    <img src="assets/icons/trash.svg" alt="" width="13" height="13" />
                                    <span>Delete</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;

            case 'course-slots':
                return `
                    <tr data-id="${escapeHtml(item.slotId)}">
                        <td><strong>${escapeHtml(item.slotId)}</strong></td>
                        <td>${escapeHtml(item.sectionId || '—')}</td>
                        <td>${escapeHtml(item.day || '—')}</td>
                        <td>${escapeHtml(item.time || '—')}</td>
                        <td>${escapeHtml(item.room || '—')}</td>
                        <td>
                            <div class="row-actions">
                                <button class="action-btn-edit" data-action="edit" data-id="${escapeHtml(item.slotId)}" title="Edit Slot">
                                    <img src="assets/icons/edit.svg" alt="" width="13" height="13" />
                                    <span>Edit</span>
                                </button>
                                <button class="action-btn-delete" data-action="delete" data-id="${escapeHtml(item.slotId)}" title="Delete Slot">
                                    <img src="assets/icons/trash.svg" alt="" width="13" height="13" />
                                    <span>Delete</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;

            case 'registrations':
                return `
                    <tr data-id="${escapeHtml(item.enrollmentId)}">
                        <td><strong>${escapeHtml(item.enrollmentId)}</strong></td>
                        <td>${escapeHtml(item.studentId || '—')}</td>
                        <td>${escapeHtml(item.courseId || '—')}</td>
                        <td>${escapeHtml(item.term || '—')}</td>
                        <td><span class="badge ${getStatusBadgeClass(item.status)}">${escapeHtml(item.status || 'Enrolled')}</span></td>
                        <td><strong>${escapeHtml(item.finalGrade || 'N/A')}</strong></td>
                        <td>
                            <div class="row-actions">
                                <button class="action-btn-edit" data-action="edit-grade" data-id="${escapeHtml(item.enrollmentId)}" title="Update Final Grade">
                                    <img src="assets/icons/edit.svg" alt="" width="13" height="13" />
                                    <span>Edit Grade</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;

            case 'overrides':
                const isPending = (item.status === 'Pending');
                return `
                    <tr data-id="${escapeHtml(item.requestId)}">
                        <td><strong>${escapeHtml(item.requestId)}</strong></td>
                        <td>${escapeHtml(item.studentId || '—')}</td>
                        <td>${escapeHtml(item.courseId || '—')}</td>
                        <td title="${escapeHtml(item.reason || '')}">${truncateText(item.reason || '—', 36)}</td>
                        <td><span class="badge ${getStatusBadgeClass(item.status)}">${escapeHtml(item.status || 'Pending')}</span></td>
                        <td>${formatDate(item.createdAt)}</td>
                        <td>
                            <div class="row-actions">
                                ${isPending ? `
                                    <button class="action-btn-approve" data-action="override-approve" data-id="${escapeHtml(item.requestId)}" title="Approve Request">
                                        ✓ Approve
                                    </button>
                                    <button class="action-btn-reject" data-action="override-reject" data-id="${escapeHtml(item.requestId)}" title="Reject Request">
                                        ✕ Reject
                                    </button>
                                ` : `
                                    <span style="font-size:0.75rem; color:var(--text-muted);">Decided</span>
                                `}
                            </div>
                        </td>
                    </tr>
                `;

            case 'enrollment-phases': {
                const id = item.id || item.phaseId;
                return `
                    <tr data-id="${escapeHtml(id)}">
                        <td><strong>${escapeHtml(id)}</strong></td>
                        <td><strong>${escapeHtml(item.name || item.phaseName || '—')}</strong></td>
                        <td>${escapeHtml(item.eligibleGroups || 'All Students')}</td>
                        <td>${escapeHtml(item.timeline || (item.startDate ? `${item.startDate} – ${item.endDate}` : '—'))}</td>
                        <td><span class="${getStatusBadgeClass(item.status)}">${escapeHtml(item.status || 'Active')}</span></td>
                        <td>
                            <div class="row-actions">
                                <button class="action-btn-edit" data-action="edit" data-id="${escapeHtml(id)}" title="Edit Phase">
                                    <img src="assets/icons/edit.svg" alt="" width="13" height="13" />
                                    <span>Edit</span>
                                </button>
                                <button class="action-btn-delete" data-action="delete" data-id="${escapeHtml(id)}" title="Delete Phase">
                                    <img src="assets/icons/trash.svg" alt="" width="13" height="13" />
                                    <span>Delete</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }

            case 'announcements': {
                const id = item.announcementId || item.id;
                return `
                    <tr data-id="${escapeHtml(id)}">
                        <td><strong>${escapeHtml(id)}</strong></td>
                        <td><span class="badge-active">${escapeHtml(item.courseId || 'ALL')}</span></td>
                        <td><strong>${escapeHtml(item.title || '—')}</strong></td>
                        <td title="${escapeHtml(item.message || item.body || '')}">${truncateText(item.message || item.body || '—', 48)}</td>
                        <td>${escapeHtml(item.facultyId || item.authorId || item.postedBy || 'Admin')}</td>
                        <td>${formatDate(item.createdAt || item.date)}</td>
                        <td>
                            <div class="row-actions">
                                <button class="action-btn-edit" data-action="edit" data-id="${escapeHtml(id)}" title="Edit Announcement">
                                    <img src="assets/icons/edit.svg" alt="" width="13" height="13" />
                                    <span>Edit</span>
                                </button>
                                <button class="action-btn-delete" data-action="delete" data-id="${escapeHtml(id)}" title="Delete Announcement">
                                    <img src="assets/icons/trash.svg" alt="" width="13" height="13" />
                                    <span>Delete</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }


            default:
                return '';
        }
    }

    /**
     * Attaches listeners for row action buttons
     */
    function attachRowActionListeners(entityKey) {
        const tbody = document.getElementById('crud-table-body');
        const buttons = tbody.querySelectorAll('button[data-action]');

        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.getAttribute('data-action');
                const id = btn.getAttribute('data-id');
                const item = (entityCache[entityKey] || []).find(r => String(r[ENTITY_CONFIGS[entityKey].idKey]) === String(id));

                if (action === 'edit') {
                    openEditModal(entityKey, item);
                } else if (action === 'delete') {
                    openDeleteModal(entityKey, id);
                } else if (action === 'edit-grade') {
                    openGradeModal(item);
                } else if (action === 'override-approve') {
                    handleOverrideDecision(id, 'Approved');
                } else if (action === 'override-reject') {
                    handleOverrideDecision(id, 'Rejected');
                }
            });
        });
    }

    // =========================================================================
    // --- 4. MODALS & FORMS CONTROLLER (Shared #crud-modal) ---
    // =========================================================================
    let currentModalMode = 'create'; // 'create' | 'edit' | 'edit-grade'
    let currentModalEntity = 'users';
    let currentEditingRecordId = null;

    const modalBackdrop = document.getElementById('crud-modal-backdrop');
    const modalTitle = document.getElementById('modal-title');
    const modalSubtitle = document.getElementById('modal-subtitle');
    const modalFields = document.getElementById('modal-form-fields');
    const modalErrorAlert = document.getElementById('modal-error-alert');
    const modalErrorText = document.getElementById('modal-error-text');
    const modalSaveBtnText = document.getElementById('modal-save-btn-text');
    const crudForm = document.getElementById('crud-form');

    function openCreateModal(entityKey) {
        const config = ENTITY_CONFIGS[entityKey];
        if (!config || !config.canCreate) return;

        currentModalMode = 'create';
        currentModalEntity = entityKey;
        currentEditingRecordId = null;

        modalTitle.textContent = `Add New ${config.singular}`;
        modalSubtitle.textContent = `Provide details to register a new ${config.singular.toLowerCase()} in Lumina`;
        modalSaveBtnText.textContent = `Create ${config.singular}`;
        modalErrorAlert.style.display = 'none';

        renderFormFields(entityKey, null);
        modalBackdrop.style.display = 'flex';
    }

    function openEditModal(entityKey, item) {
        const config = ENTITY_CONFIGS[entityKey];
        if (!config || !item) return;

        currentModalMode = 'edit';
        currentModalEntity = entityKey;
        currentEditingRecordId = item[config.idKey];

        modalTitle.textContent = `Edit ${config.singular}`;
        modalSubtitle.textContent = `Modify record attributes for ID: ${currentEditingRecordId}`;
        modalSaveBtnText.textContent = `Save Changes`;
        modalErrorAlert.style.display = 'none';

        renderFormFields(entityKey, item);
        modalBackdrop.style.display = 'flex';
    }

    function openGradeModal(item) {
        if (!item) return;
        currentModalMode = 'edit-grade';
        currentModalEntity = 'registrations';
        currentEditingRecordId = item.enrollmentId;

        modalTitle.textContent = `Update Final Grade`;
        modalSubtitle.textContent = `Enrollment ${item.enrollmentId} • Student: ${item.studentId} • Course: ${item.courseId}`;
        modalSaveBtnText.textContent = `Submit Grade`;
        modalErrorAlert.style.display = 'none';

        modalFields.innerHTML = `
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Student ID</label>
                    <input type="text" class="form-control" value="${escapeHtml(item.studentId)}" disabled />
                </div>
                <div class="form-group">
                    <label class="form-label">Course ID</label>
                    <input type="text" class="form-control" value="${escapeHtml(item.courseId)}" disabled />
                </div>
                <div class="form-group-full form-group">
                    <label class="form-label" for="field-finalGrade">Final Letter Grade <span class="required">*</span></label>
                    <select id="field-finalGrade" name="finalGrade" class="form-control" required>
                        <option value="">Select Grade</option>
                        <option value="A+" ${item.finalGrade === 'A+' ? 'selected' : ''}>A+ (4.0)</option>
                        <option value="A" ${item.finalGrade === 'A' ? 'selected' : ''}>A (4.0)</option>
                        <option value="A-" ${item.finalGrade === 'A-' ? 'selected' : ''}>A- (3.7)</option>
                        <option value="B+" ${item.finalGrade === 'B+' ? 'selected' : ''}>B+ (3.3)</option>
                        <option value="B" ${item.finalGrade === 'B' ? 'selected' : ''}>B (3.0)</option>
                        <option value="B-" ${item.finalGrade === 'B-' ? 'selected' : ''}>B- (2.7)</option>
                        <option value="C+" ${item.finalGrade === 'C+' ? 'selected' : ''}>C+ (2.3)</option>
                        <option value="C" ${item.finalGrade === 'C' ? 'selected' : ''}>C (2.0)</option>
                        <option value="D" ${item.finalGrade === 'D' ? 'selected' : ''}>D (1.0)</option>
                        <option value="F" ${item.finalGrade === 'F' ? 'selected' : ''}>F (0.0)</option>
                        <option value="I" ${item.finalGrade === 'I' ? 'selected' : ''}>I (Incomplete)</option>
                        <option value="W" ${item.finalGrade === 'W' ? 'selected' : ''}>W (Withdrawn)</option>
                    </select>
                </div>
            </div>
        `;

        modalBackdrop.style.display = 'flex';
    }

    function closeModal() {
        modalBackdrop.style.display = 'none';
        crudForm.reset();
        modalErrorAlert.style.display = 'none';
    }

    /**
     * Swaps form fields dynamically based on entity schema
     */
    function renderFormFields(entityKey, data) {
        const isEdit = Boolean(data);

        switch (entityKey) {
            case 'users':
                modalFields.innerHTML = `
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label" for="field-userId">User ID <span class="required">*</span></label>
                            <input type="text" id="field-userId" name="userId" class="form-control" value="${escapeHtml(data?.userId || '')}" ${isEdit ? 'disabled' : 'required'} placeholder="e.g. U10294" />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-fullName">Full Name <span class="required">*</span></label>
                            <input type="text" id="field-fullName" name="fullName" class="form-control" value="${escapeHtml(data?.fullName || '')}" required placeholder="e.g. Alice Chen" />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-email">Email Address <span class="required">*</span></label>
                            <input type="email" id="field-email" name="email" class="form-control" value="${escapeHtml(data?.email || '')}" required placeholder="e.g. a.chen@lumina.edu" />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-role">User Role <span class="required">*</span></label>
                            <select id="field-role" name="role" class="form-control" required>
                                <option value="Student" ${data?.role === 'Student' ? 'selected' : ''}>Student</option>
                                <option value="Faculty" ${data?.role === 'Faculty' ? 'selected' : ''}>Faculty</option>
                                <option value="Dean" ${data?.role === 'Dean' ? 'selected' : ''}>Dean</option>
                                <option value="Admin" ${data?.role === 'Admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-deptId">Department ID</label>
                            <input type="text" id="field-deptId" name="deptId" class="form-control" value="${escapeHtml(data?.deptId || '')}" placeholder="e.g. CS" />
                        </div>
                        ${!isEdit ? `
                            <div class="form-group">
                                <label class="form-label" for="field-password">Initial Password <span class="required">*</span></label>
                                <input type="password" id="field-password" name="password" class="form-control" required placeholder="Temporary password" />
                            </div>
                        ` : ''}
                    </div>
                `;
                break;

            case 'courses':
                modalFields.innerHTML = `
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label" for="field-courseId">Course ID <span class="required">*</span></label>
                            <input type="text" id="field-courseId" name="courseId" class="form-control" value="${escapeHtml(data?.courseId || '')}" ${isEdit ? 'disabled' : 'required'} placeholder="e.g. CS-301" />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-courseName">Course Title <span class="required">*</span></label>
                            <input type="text" id="field-courseName" name="courseName" class="form-control" value="${escapeHtml(data?.courseName || '')}" required placeholder="e.g. Operating Systems" />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-credits">Credits <span class="required">*</span></label>
                            <input type="number" id="field-credits" name="credits" min="1" max="12" class="form-control" value="${data?.credits || 3}" required />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-capacity">Capacity <span class="required">*</span></label>
                            <input type="number" id="field-capacity" name="capacity" min="1" max="500" class="form-control" value="${data?.capacity || 60}" required />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-status">Course Status <span class="required">*</span></label>
                            <select id="field-status" name="status" class="form-control" required>
                                <option value="Active" ${data?.status === 'Active' ? 'selected' : ''}>Active</option>
                                <option value="Inactive" ${data?.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-deptId">Department ID <span class="required">*</span></label>
                            <input type="text" id="field-deptId" name="deptId" class="form-control" value="${escapeHtml(data?.deptId || '')}" required placeholder="e.g. CS" />
                        </div>
                    </div>
                `;
                break;

            case 'sections':
                modalFields.innerHTML = `
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label" for="field-sectionId">Section ID <span class="required">*</span></label>
                            <input type="text" id="field-sectionId" name="sectionId" class="form-control" value="${escapeHtml(data?.sectionId || '')}" ${isEdit ? 'disabled' : 'required'} placeholder="e.g. SEC-CS301-A" />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-courseId">Course ID <span class="required">*</span></label>
                            <input type="text" id="field-courseId" name="courseId" class="form-control" value="${escapeHtml(data?.courseId || '')}" required placeholder="e.g. CS-301" />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-term">Term <span class="required">*</span></label>
                            <input type="text" id="field-term" name="term" class="form-control" value="${escapeHtml(data?.term || 'Fall 2026')}" required placeholder="e.g. Fall 2026" />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-instructor">Instructor Name <span class="required">*</span></label>
                            <input type="text" id="field-instructor" name="instructor" class="form-control" value="${escapeHtml(data?.instructor || '')}" required placeholder="e.g. Prof. Alan Turing" />
                        </div>
                        <div class="form-group-full form-group">
                            <label class="form-label" for="field-capacity">Section Capacity <span class="required">*</span></label>
                            <input type="number" id="field-capacity" name="capacity" min="1" max="500" class="form-control" value="${data?.capacity || 40}" required />
                        </div>
                    </div>
                `;
                break;

            case 'course-slots':
                modalFields.innerHTML = `
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label" for="field-slotId">Slot ID <span class="required">*</span></label>
                            <input type="text" id="field-slotId" name="slotId" class="form-control" value="${escapeHtml(data?.slotId || '')}" ${isEdit ? 'disabled' : 'required'} placeholder="e.g. SLOT-01" />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-sectionId">Section ID <span class="required">*</span></label>
                            <input type="text" id="field-sectionId" name="sectionId" class="form-control" value="${escapeHtml(data?.sectionId || '')}" required placeholder="e.g. SEC-CS301-A" />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-day">Day of Week <span class="required">*</span></label>
                            <select id="field-day" name="day" class="form-control" required>
                                <option value="Monday" ${data?.day === 'Monday' ? 'selected' : ''}>Monday</option>
                                <option value="Tuesday" ${data?.day === 'Tuesday' ? 'selected' : ''}>Tuesday</option>
                                <option value="Wednesday" ${data?.day === 'Wednesday' ? 'selected' : ''}>Wednesday</option>
                                <option value="Thursday" ${data?.day === 'Thursday' ? 'selected' : ''}>Thursday</option>
                                <option value="Friday" ${data?.day === 'Friday' ? 'selected' : ''}>Friday</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-time">Time Slot <span class="required">*</span></label>
                            <input type="text" id="field-time" name="time" class="form-control" value="${escapeHtml(data?.time || '10:00 AM - 11:30 AM')}" required placeholder="e.g. 10:00 AM - 11:30 AM" />
                        </div>
                        <div class="form-group-full form-group">
                            <label class="form-label" for="field-room">Room / Lecture Hall <span class="required">*</span></label>
                            <input type="text" id="field-room" name="room" class="form-control" value="${escapeHtml(data?.room || 'Hall B-201')}" required placeholder="e.g. Hall B-201" />
                        </div>
                    </div>
                `;
                break;

            case 'enrollment-phases':
                modalFields.innerHTML = `
                    <div class="form-grid">
                        <div class="form-group-full form-group">
                            <label class="form-label" for="field-phaseName">Phase Name <span class="required">*</span></label>
                            <input type="text" id="field-phaseName" name="name" class="form-control" value="${escapeHtml(data?.name || data?.phaseName || '')}" required placeholder="e.g. Phase 1 - Final Year Priority" />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-eligibleGroups">Eligible Groups <span class="required">*</span></label>
                            <input type="text" id="field-eligibleGroups" name="eligibleGroups" class="form-control" value="${escapeHtml(data?.eligibleGroups || 'All Students')}" required placeholder="e.g. Final Year, 3rd Year" />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-status">Status <span class="required">*</span></label>
                            <select id="field-status" name="status" class="form-control" required>
                                <option value="Upcoming" ${data?.status === 'Upcoming' ? 'selected' : ''}>Upcoming</option>
                                <option value="Active" ${data?.status === 'Active' ? 'selected' : ''}>Active</option>
                                <option value="Completed" ${data?.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            </select>
                        </div>
                        <div class="form-group-full form-group">
                            <label class="form-label" for="field-timeline">Timeline / Duration <span class="required">*</span></label>
                            <input type="text" id="field-timeline" name="timeline" class="form-control" value="${escapeHtml(data?.timeline || 'Aug 1 – Aug 5, 2026')}" required placeholder="e.g. Aug 1 – Aug 5, 2026" />
                        </div>
                    </div>
                `;
                break;

            case 'announcements':
                modalFields.innerHTML = `
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label" for="field-courseId">Target Course ID <span class="required">*</span></label>
                            <input type="text" id="field-courseId" name="courseId" class="form-control" value="${escapeHtml(data?.courseId || 'ALL')}" required placeholder="e.g. PC402 or ALL" />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-title">Headline / Title <span class="required">*</span></label>
                            <input type="text" id="field-title" name="title" class="form-control" value="${escapeHtml(data?.title || '')}" required placeholder="e.g. Midterm Examination Schedule" />
                        </div>
                        <div class="form-group-full form-group">
                            <label class="form-label" for="field-message">Announcement Message <span class="required">*</span></label>
                            <textarea id="field-message" name="message" class="form-control" rows="4" required placeholder="Enter announcement text...">${escapeHtml(data?.message || data?.body || '')}</textarea>
                        </div>
                    </div>
                `;
                break;


            default:
                modalFields.innerHTML = '';
        }
    }

    /**
     * Normalizes entity form payloads to match backend NestJS DTO validation schemas
     */
    function normalizePayloadForBackend(entityKey, raw) {
        if (entityKey === 'users') {
            const role = raw.role || raw.Role || 'Student';
            return {
                User_ID: raw.userId || raw.User_ID || '',
                Full_Name: raw.fullName || raw.Full_Name || '',
                Email: raw.email || raw.Email || '',
                Password: raw.password || raw.Password || 'password123',
                Role: role === 'Admin' ? 'Dean' : role,
                Dept_ID: raw.deptId || raw.Dept_ID || 'CSE'
            };
        }
        if (entityKey === 'courses') {
            return {
                courseId: raw.courseId || '',
                courseName: raw.courseName || '',
                credits: Number(raw.credits) || 3,
                courseCapacity: Number(raw.capacity || raw.courseCapacity) || 60,
                status: raw.status || 'Active',
                deptId: raw.deptId || 'CSE'
            };
        }
        if (entityKey === 'sections') {
            return {
                sectionId: raw.sectionId || '',
                sectionName: raw.sectionName || (raw.sectionId ? raw.sectionId.split('-').pop() : 'S1'),
                courseId: raw.courseId || '',
                termId: raw.termId || raw.term || 'SPRING2026'
            };
        }
        if (entityKey === 'course-slots') {
            const timeParts = (raw.time || '').split('-');
            return {
                sectionId: raw.sectionId || '',
                facultyId: raw.facultyId || 'F2024001',
                roomNumber: raw.room || raw.roomNumber || 'G01',
                dayOfWeek: raw.day || raw.dayOfWeek || 'Monday',
                startTime: raw.startTime || (timeParts[0] ? timeParts[0].trim() : '08:45'),
                endTime: raw.endTime || (timeParts[1] ? timeParts[1].trim() : '09:45'),
                syllabus: null
            };
        }
        if (entityKey === 'enrollment-phases') {
            return {
                name: raw.name || raw.phaseName || 'Phase 1 - General Registration',
                eligibleGroups: raw.eligibleGroups || 'All Students',
                timeline: raw.timeline || `${raw.startDate || 'Aug 1'} – ${raw.endDate || 'Aug 5, 2026'}`,
                status: raw.status || 'Upcoming'
            };
        }
        if (entityKey === 'announcements') {
            return {
                courseId: raw.courseId || 'ALL',
                title: raw.title || '',
                message: raw.body || raw.message || ''
            };
        }
        return raw;
    }

    /**
     * Submit Form: Handles Create (POST) and Edit (PUT/PATCH)
     */
    crudForm.addEventListener('submit', async (e) => {

        e.preventDefault();
        modalErrorAlert.style.display = 'none';

        const formData = new FormData(crudForm);
        const rawPayload = {};
        for (let [key, val] of formData.entries()) {
            if (key === 'credits' || key === 'capacity') {
                rawPayload[key] = parseInt(val, 10);
            } else {
                rawPayload[key] = val;
            }
        }

        const payload = normalizePayloadForBackend(currentModalEntity, rawPayload);

        try {
            let url = '';
            let method = 'POST';

            if (currentModalMode === 'create') {
                const config = ENTITY_CONFIGS[currentModalEntity];
                url = `${API_BASE}${config.endpoint}`;
                method = 'POST';
            } else if (currentModalMode === 'edit') {
                const config = ENTITY_CONFIGS[currentModalEntity];
                url = `${API_BASE}${config.endpoint}/${encodeURIComponent(currentEditingRecordId)}`;
                method = 'PUT';
            } else if (currentModalMode === 'edit-grade') {
                url = `${API_BASE}/registrations/${encodeURIComponent(currentEditingRecordId)}/grade`;
                method = 'PATCH';
            }

            const response = await fetch(url, {
                method: method,
                headers: headers,
                body: JSON.stringify(currentModalMode === 'edit-grade' ? { finalGrade: rawPayload.finalGrade } : payload),
            });


            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || `Server responded with ${response.status}`);
            }

            showToast(`Successfully ${currentModalMode === 'create' ? 'created' : 'updated'} record.`, 'success');
            closeModal();

            // Re-call entity data loader to refresh UI
            await loadEntityData(currentModalEntity);
        } catch (err) {
            console.error('Failed to save form record:', err);
            modalErrorText.textContent = err.message || 'An unexpected error occurred while saving.';
            modalErrorAlert.style.display = 'flex';
        }
    });

    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);

    // Override Fast Decision (Approve / Reject)
    async function handleOverrideDecision(requestId, newStatus) {
        try {
            const response = await fetch(`${API_BASE}/overrides/${encodeURIComponent(requestId)}/status`, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error(`Failed to update override status (${response.status})`);
            }

            showToast(`Override ${requestId} marked as ${newStatus}`, 'success');
            await loadEntityData('overrides');
        } catch (err) {
            console.error('Override decision failed:', err);
            showToast(`Failed to update override: ${err.message}`, 'error');
        }
    }

    // =========================================================================
    // --- 5. DELETE FLOW CONTROLLER (Confirmation Dialog) ---
    // =========================================================================
    let currentDeleteEntity = null;
    let currentDeleteTargetId = null;

    const deleteModalBackdrop = document.getElementById('delete-modal-backdrop');
    const deleteTargetIdDisplay = document.getElementById('delete-target-id-display');
    const deleteConfirmInput = document.getElementById('delete-confirm-input');
    const deleteConfirmBtn = document.getElementById('delete-confirm-btn');
    const deleteModalError = document.getElementById('delete-modal-error');
    const deleteModalErrorText = document.getElementById('delete-modal-error-text');

    function openDeleteModal(entityKey, recordId) {
        currentDeleteEntity = entityKey;
        currentDeleteTargetId = recordId;

        deleteTargetIdDisplay.textContent = recordId;
        deleteConfirmInput.value = '';
        deleteConfirmBtn.disabled = true;
        deleteModalError.style.display = 'none';

        deleteModalBackdrop.style.display = 'flex';
        setTimeout(() => deleteConfirmInput.focus(), 50);
    }

    function closeDeleteModal() {
        deleteModalBackdrop.style.display = 'none';
        currentDeleteEntity = null;
        currentDeleteTargetId = null;
        deleteConfirmInput.value = '';
    }

    // Enable delete button only when user types exact record ID
    deleteConfirmInput.addEventListener('input', () => {
        const typed = deleteConfirmInput.value.trim();
        deleteConfirmBtn.disabled = (typed !== String(currentDeleteTargetId));
    });

    deleteConfirmBtn.addEventListener('click', async () => {
        if (!currentDeleteEntity || !currentDeleteTargetId) return;

        try {
            deleteConfirmBtn.disabled = true;
            const config = ENTITY_CONFIGS[currentDeleteEntity];
            const response = await fetch(`${API_BASE}${config.endpoint}/${encodeURIComponent(currentDeleteTargetId)}`, {
                method: 'DELETE',
                headers: headers,
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || `Failed to delete record (${response.status})`);
            }

            showToast(`Record ${currentDeleteTargetId} permanently deleted.`, 'success');
            closeDeleteModal();
            await loadEntityData(currentDeleteEntity);
        } catch (err) {
            console.error('Delete action failed:', err);
            deleteModalErrorText.textContent = err.message || 'Error executing delete request.';
            deleteModalError.style.display = 'flex';
            deleteConfirmBtn.disabled = false;
        }
    });

    document.getElementById('delete-modal-close-btn').addEventListener('click', closeDeleteModal);
    document.getElementById('delete-cancel-btn').addEventListener('click', closeDeleteModal);

    // =========================================================================
    // --- 6. STAT STRIP ENGINE (Computed Client-Side) ---
    // =========================================================================
    function updateStatStrip() {
        const usersCount = (entityCache.users || []).length;
        const coursesCount = (entityCache.courses || []).length;
        const registrationsCount = (entityCache.registrations || []).length;
        const pendingOverridesCount = (entityCache.overrides || []).filter(o => o.status === 'Pending').length;

        const statUsers = document.getElementById('stat-val-users');
        const statCourses = document.getElementById('stat-val-courses');
        const statRegs = document.getElementById('stat-val-registrations');
        const statOverrides = document.getElementById('stat-val-overrides');

        if (statUsers) statUsers.textContent = entityCache.users.length > 0 ? usersCount : '—';
        if (statCourses) statCourses.textContent = entityCache.courses.length > 0 ? coursesCount : '—';
        if (statRegs) statRegs.textContent = entityCache.registrations.length > 0 ? registrationsCount : '—';
        if (statOverrides) statOverrides.textContent = entityCache.overrides.length > 0 ? pendingOverridesCount : '—';
    }

    // =========================================================================
    // --- 7. SYSTEM LOGS TAB (Live Monospace Console Engine) ---
    // =========================================================================

    // Structured mock logs covering real Lumina services
    const MOCK_LOGS = [
        { timestamp: '2026-08-26T09:00:01.120Z', level: 'INFO', module: 'DatabaseService', message: 'Database pool initialized (PostgreSQL cluster connected, latency 1.4ms)' },
        { timestamp: '2026-08-26T09:00:02.450Z', level: 'INFO', module: 'AuthService', message: 'JWT Signing key validated with algorithm RS256' },
        { timestamp: '2026-08-26T09:01:14.302Z', level: 'INFO', module: 'EnrollmentPhasesService', message: 'Loaded active enrollment phase: "Phase 1 - Priority Window"' },
        { timestamp: '2026-08-26T09:02:40.812Z', level: 'DEBUG', module: 'UsersService', message: 'Cache sync completed for 12 faculty member records' },
        { timestamp: '2026-08-26T09:03:15.900Z', level: 'INFO', module: 'CoursesService', message: 'Fetched catalogue definition for 48 active departmental courses' },
        { timestamp: '2026-08-26T09:05:22.110Z', level: 'WARN', module: 'RegistrationsService', message: 'Section SEC-CS301-A reaching capacity limit (38/40 enrolled)' },
        { timestamp: '2026-08-26T09:06:50.045Z', level: 'INFO', module: 'OverridesService', message: 'New override request submitted by student S10091 for CS-401' },
        { timestamp: '2026-08-26T09:08:12.780Z', level: 'ERROR', module: 'CourseSlotsService', message: 'Room collision detected: Hall B-201 requested for conflicting time slot' },
        { timestamp: '2026-08-26T09:09:44.200Z', level: 'INFO', module: 'AnnouncementsService', message: 'Broadcast dispatched to 1,420 registered student devices' },
        { timestamp: '2026-08-26T09:10:05.612Z', level: 'DEBUG', module: 'DatabaseService', message: 'Executing vacuum analyze on table "registrations"' },
        { timestamp: '2026-08-26T09:11:18.910Z', level: 'WARN', module: 'AuthService', message: 'Failed authentication attempt for user ID "admin_temp" from IP 192.168.1.104' },
        { timestamp: '2026-08-26T09:12:00.005Z', level: 'INFO', module: 'SectionsService', message: 'Allocated 6 new lecture slots for Spring 2026 timetable' },
    ];

    let logBuffer = [];
    let isLiveStreaming = false;
    let liveStreamInterval = null;
    let activeLogLevelFilter = 'ALL';
    let activeLogModuleFilter = 'ALL';
    let activeLogSearchText = '';

    /**
     * Fetches real logs from backend access, error, and auth log streams
     */
    async function fetchLogs() {
        try {
            const [accessRes, errorRes, authRes] = await Promise.all([
                fetch(`${API_BASE}/super-user/logs?type=access&lines=150`, { headers }).then(r => r.ok ? r.json() : { logs: [] }).catch(() => ({ logs: [] })),
                fetch(`${API_BASE}/super-user/logs?type=error&lines=150`, { headers }).then(r => r.ok ? r.json() : { logs: [] }).catch(() => ({ logs: [] })),
                fetch(`${API_BASE}/super-user/logs?type=auth&lines=150`, { headers }).then(r => r.ok ? r.json() : { logs: [] }).catch(() => ({ logs: [] })),
            ]);

            const combined = [
                ...(accessRes.logs || []),
                ...(errorRes.logs || []),
                ...(authRes.logs || [])
            ].filter(rawLine => !rawLine.includes('/super-user/logs'));

            if (combined.length === 0) {
                return [];
            }


            const parsed = combined.map(rawLine => {
                const parts = rawLine.split('|').map(s => s.trim());
                let timestamp = new Date().toISOString();
                let level = 'INFO';
                let module = 'HttpRoute';
                let message = rawLine;

                if (parts.length >= 2) {
                    if (!isNaN(Date.parse(parts[0]))) {
                        timestamp = parts[0];
                    }
                    const rawLevel = (parts[1] || '').toUpperCase();
                    if (rawLevel.includes('ERR')) level = 'ERROR';
                    else if (rawLevel.includes('WARN')) level = 'WARN';
                    else if (rawLevel.includes('DEBUG')) level = 'DEBUG';
                    else level = 'INFO';
                }

                // Associate module with target domain
                if (rawLine.includes('/users')) module = 'UsersService';
                else if (rawLine.includes('/courses')) module = 'CoursesService';
                else if (rawLine.includes('/sections')) module = 'SectionsService';
                else if (rawLine.includes('/course-slots')) module = 'CourseSlotsService';
                else if (rawLine.includes('/registrations')) module = 'RegistrationsService';
                else if (rawLine.includes('/overrides')) module = 'OverridesService';
                else if (rawLine.includes('/enrollment-phases')) module = 'EnrollmentPhasesService';
                else if (rawLine.includes('/announcements')) module = 'AnnouncementsService';
                else if (rawLine.includes('/auth') || rawLine.includes('login') || rawLine.includes('AuthService')) module = 'AuthService';
                else if (rawLine.includes('Database') || rawLine.includes('pool')) module = 'DatabaseService';
                else module = 'SystemService';

                return { timestamp, level, module, message: rawLine };
            });

            // Sort newest at the bottom
            parsed.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            return parsed;
        } catch (err) {
            console.error('Error fetching logs from backend:', err);
            return [];
        }
    }

    const terminalOutput = document.getElementById('terminal-output');
    const terminalViewport = document.getElementById('terminal-viewport');
    const logCounter = document.getElementById('log-counter');
    const liveToggleBtn = document.getElementById('live-toggle-btn');
    const connectionStatusPill = document.getElementById('connection-status-pill');
    const connectionStatusText = document.getElementById('connection-status-text');
    const jumpLatestBtn = document.getElementById('jump-latest-btn');
    const logSearchInput = document.getElementById('log-search-input');
    const logModuleSelect = document.getElementById('log-module-select');
    const logLevelPills = document.querySelectorAll('.level-pill');

    function renderLogs() {
        if (!terminalOutput) return;

        const filtered = logBuffer.filter(log => {
            // Level Filter
            if (activeLogLevelFilter !== 'ALL' && log.level !== activeLogLevelFilter) {
                return false;
            }
            // Module Filter
            if (activeLogModuleFilter !== 'ALL' && log.module !== activeLogModuleFilter) {
                return false;
            }
            // Text or Regex Search
            if (activeLogSearchText) {
                try {
                    const regex = new RegExp(activeLogSearchText, 'i');
                    const fullLine = `${log.timestamp} ${log.level} ${log.module} ${log.message}`;
                    if (!regex.test(fullLine)) return false;
                } catch {
                    const fullLine = `${log.timestamp} ${log.level} ${log.module} ${log.message}`.toLowerCase();
                    if (!fullLine.includes(activeLogSearchText.toLowerCase())) return false;
                }
            }
            return true;
        });

        // Update Log Counter
        logCounter.textContent = `${filtered.length} / ${logBuffer.length} lines`;

        // Format terminal lines: [timestamp] [LEVEL] [Module] message
        const linesHtml = filtered.map(log => `
            <div class="log-line level-${log.level.toLowerCase()}">
                <span class="log-time">[${formatLogTimestamp(log.timestamp)}]</span>
                <span class="log-tag log-tag-${log.level.toLowerCase()}">[${log.level}]</span>
                <span class="log-module">[${escapeHtml(log.module)}]</span>
                <span class="log-msg">${escapeHtml(log.message)}</span>
            </div>
        `).join('');

        terminalOutput.innerHTML = linesHtml || `<div style="color:#8b949e; padding:12px;">No log records match the current filter criteria.</div>`;

        // Check if user is near bottom to auto-scroll
        if (isLiveStreaming) {
            scrollToBottom();
        }
    }

    function scrollToBottom() {
        terminalViewport.scrollTop = terminalViewport.scrollHeight;
        jumpLatestBtn.style.display = 'none';
    }

    // Scroll listener for "Jump to latest" button
    terminalViewport.addEventListener('scroll', () => {
        const isNearBottom = terminalViewport.scrollHeight - terminalViewport.scrollTop - terminalViewport.clientHeight < 40;
        if (!isNearBottom && logBuffer.length > 5) {
            jumpLatestBtn.style.display = 'block';
        } else {
            jumpLatestBtn.style.display = 'none';
        }
    });

    jumpLatestBtn.addEventListener('click', scrollToBottom);

    // Live Streaming Toggle (Real Live Backend Polling)
    liveToggleBtn.addEventListener('click', async () => {
        isLiveStreaming = !isLiveStreaming;

        if (isLiveStreaming) {
            liveToggleBtn.classList.add('active');
            connectionStatusPill.classList.add('connected');
            connectionStatusText.textContent = 'Live backend polling active (3s)';

            logBuffer = await fetchLogs();
            renderLogs();

            // Poll real backend logs periodically
            liveStreamInterval = setInterval(async () => {
                const fresh = await fetchLogs();
                if (fresh && fresh.length > 0) {
                    logBuffer = fresh;
                    renderLogs();
                }
            }, 3000);
        } else {
            liveToggleBtn.classList.remove('active');
            connectionStatusPill.classList.remove('connected');
            connectionStatusText.textContent = 'Live streaming paused';

            if (liveStreamInterval) {
                clearInterval(liveStreamInterval);
                liveStreamInterval = null;
            }
        }
    });


    // Log Level Filter Pills
    logLevelPills.forEach(pill => {
        pill.addEventListener('click', () => {
            logLevelPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeLogLevelFilter = pill.getAttribute('data-level');
            renderLogs();
        });
    });

    // Module Filter Dropdown
    logModuleSelect.addEventListener('change', (e) => {
        activeLogModuleFilter = e.target.value;
        renderLogs();
    });

    // Search Input
    logSearchInput.addEventListener('input', (e) => {
        activeLogSearchText = e.target.value.trim();
        renderLogs();
    });

    // Clear Console Action
    document.getElementById('log-clear-btn').addEventListener('click', () => {
        logBuffer = [];
        renderLogs();
        showToast('Console buffer cleared.', 'info');
    });

    // Download .log Action
    document.getElementById('log-download-btn').addEventListener('click', () => {
        const textContent = logBuffer.map(l => `[${l.timestamp}] [${l.level}] [${l.module}] ${l.message}`).join('\n');
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lumina_system_logs_${new Date().toISOString().slice(0, 10)}.log`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Downloaded log file.', 'success');
    });

    // =========================================================================
    // --- 8. TOOLBAR, SEARCH & EXPORT CSV CONTROLLER ---
    // =========================================================================
    const searchInput = document.getElementById('table-search-input');
    const searchClearBtn = document.getElementById('search-clear-btn');
    const filterSelect = document.getElementById('table-filter-select');
    const refreshBtn = document.getElementById('table-refresh-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const addEntityBtn = document.getElementById('add-entity-btn');

    searchInput.addEventListener('input', () => {
        searchClearBtn.style.display = searchInput.value ? 'flex' : 'none';
        renderTable(currentSelectedEntity);
    });

    searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchClearBtn.style.display = 'none';
        renderTable(currentSelectedEntity);
        searchInput.focus();
    });

    filterSelect.addEventListener('change', () => {
        renderTable(currentSelectedEntity);
    });

    refreshBtn.addEventListener('click', () => {
        loadEntityData(currentSelectedEntity);
        showToast(`Refreshed ${ENTITY_CONFIGS[currentSelectedEntity].title}`, 'info');
    });

    addEntityBtn.addEventListener('click', () => {
        openCreateModal(currentSelectedEntity);
    });

    // Export Table to CSV
    exportCsvBtn.addEventListener('click', () => {
        const config = ENTITY_CONFIGS[currentSelectedEntity];
        const data = entityCache[currentSelectedEntity] || [];

        if (data.length === 0) {
            showToast('No data available to export.', 'info');
            return;
        }

        const headersRow = config.columns.filter(c => c !== 'Actions');
        const rows = data.map(item => {
            return headersRow.map(col => {
                let cellVal = '';
                // Map column header to corresponding camelCase property
                switch (col) {
                    case 'User ID': cellVal = item.userId; break;
                    case 'Full Name': cellVal = item.fullName; break;
                    case 'Email': cellVal = item.email; break;
                    case 'Role': cellVal = item.role; break;
                    case 'Department': cellVal = item.deptId; break;
                    case 'Course ID': cellVal = item.courseId; break;
                    case 'Course Name': cellVal = item.courseName; break;
                    case 'Credits': cellVal = item.credits; break;
                    case 'Capacity': cellVal = item.capacity; break;
                    case 'Status': cellVal = item.status; break;
                    case 'Section ID': cellVal = item.sectionId; break;
                    case 'Term': cellVal = item.term; break;
                    case 'Instructor': cellVal = item.instructor; break;
                    case 'Slot ID': cellVal = item.slotId; break;
                    case 'Day': cellVal = item.day; break;
                    case 'Time': cellVal = item.time; break;
                    case 'Room': cellVal = item.room; break;
                    case 'Enrollment ID': cellVal = item.enrollmentId; break;
                    case 'Student ID': cellVal = item.studentId; break;
                    case 'Final Grade': cellVal = item.finalGrade; break;
                    case 'Request ID': cellVal = item.requestId; break;
                    case 'Reason': cellVal = item.reason; break;
                    case 'Created At': cellVal = item.createdAt; break;
                    case 'Phase ID': cellVal = item.phaseId; break;
                    case 'Phase Name': cellVal = item.phaseName; break;
                    case 'Start Date': cellVal = item.startDate; break;
                    case 'End Date': cellVal = item.endDate; break;
                    case 'Announcement ID': cellVal = item.announcementId; break;
                    case 'Title': cellVal = item.title; break;
                    case 'Body': cellVal = item.body; break;
                    case 'Posted By': cellVal = item.postedBy; break;
                    case 'Date': cellVal = item.date; break;
                    default: cellVal = '';
                }
                const formatted = `"${String(cellVal || '').replace(/"/g, '""')}"`;
                return formatted;
            }).join(',');
        });

        const csvContent = [headersRow.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `lumina_${currentSelectedEntity}_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast(`Exported ${currentSelectedEntity}.csv`, 'success');
    });

    // =========================================================================
    // --- 9. TAB SWITCHER & ENTITY CHIPS NAVIGATION ---
    // =========================================================================
    const tabBtnOverview = document.getElementById('tab-btn-overview');
    const tabBtnInstitutes = document.getElementById('tab-btn-institutes');
    const tabBtnSpocs = document.getElementById('tab-btn-spocs');
    const tabBtnQueue = document.getElementById('tab-btn-queue');
    const tabBtnLogs = document.getElementById('tab-btn-logs');

    const tabPaneOverview = document.getElementById('overview-tab');
    const tabPaneInstitutes = document.getElementById('institutes-tab');
    const tabPaneSpocs = document.getElementById('spocs-tab');
    const tabPaneQueue = document.getElementById('queue-tab');
    const tabPaneLogs = document.getElementById('logs-tab');

    const allTabBtns = [tabBtnOverview, tabBtnInstitutes, tabBtnSpocs, tabBtnQueue, tabBtnLogs];
    const allTabPanes = [tabPaneOverview, tabPaneInstitutes, tabPaneSpocs, tabPaneQueue, tabPaneLogs];

    function switchTab(tabKey) {
        currentActiveTab = tabKey;
        allTabBtns.forEach(b => b && b.classList.remove('active'));
        allTabPanes.forEach(p => p && (p.style.display = 'none'));

        if (tabKey === 'overview') {
            if (tabBtnOverview) tabBtnOverview.classList.add('active');
            if (tabPaneOverview) tabPaneOverview.style.display = 'block';
        } else if (tabKey === 'institutes') {
            if (tabBtnInstitutes) tabBtnInstitutes.classList.add('active');
            if (tabPaneInstitutes) tabPaneInstitutes.style.display = 'block';
            loadInstitutesAndSpocs();
        } else if (tabKey === 'spocs') {
            if (tabBtnSpocs) tabBtnSpocs.classList.add('active');
            if (tabPaneSpocs) tabPaneSpocs.style.display = 'block';
            loadInstitutesAndSpocs();
        } else if (tabKey === 'queue') {
            if (tabBtnQueue) tabBtnQueue.classList.add('active');
            if (tabPaneQueue) tabPaneQueue.style.display = 'block';
            renderOnboardingDockets();
        } else if (tabKey === 'logs') {
            if (tabBtnLogs) tabBtnLogs.classList.add('active');
            if (tabPaneLogs) tabPaneLogs.style.display = 'block';
            renderLogs();
        }
    }

    allTabBtns.forEach(btn => {
        if (btn) btn.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(btn.dataset.tab);
        });
    });


    // Entity Chips Click Handlers
    const entityChips = document.querySelectorAll('.entity-chip:not(:disabled)');
    entityChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const entityKey = chip.getAttribute('data-entity');
            if (!entityKey || entityKey === currentSelectedEntity) return;

            entityChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            currentSelectedEntity = entityKey;

            // Populate filter select options for selected entity
            populateFilterOptions(entityKey);

            // Reset search input
            searchInput.value = '';
            searchClearBtn.style.display = 'none';

            // Load data for entity
            loadEntityData(entityKey);
        });
    });

    function populateFilterOptions(entityKey) {
        const config = ENTITY_CONFIGS[entityKey];
        if (!config) return;

        filterSelect.innerHTML = config.filterOptions.map(opt => `
            <option value="${opt.value}">${opt.label}</option>
        `).join('');
    }

    // =========================================================================
    // --- 10. ERROR & LOADING STATES & TOAST UTILITIES ---
    // =========================================================================
    const tableLoading = document.getElementById('table-loading');
    const tableContainer = document.getElementById('table-container');
    const tableErrorBanner = document.getElementById('table-error-banner');
    const errorBannerTitle = document.getElementById('error-banner-title');
    const errorBannerMessage = document.getElementById('error-banner-message');
    const errorRetryBtn = document.getElementById('error-retry-btn');

    function showTableLoading(isLoading) {
        if (isLoading) {
            tableLoading.style.display = 'flex';
            tableContainer.style.opacity = '0.4';
        } else {
            tableLoading.style.display = 'none';
            tableContainer.style.opacity = '1';
        }
    }

    function showTableError(title, message) {
        errorBannerTitle.textContent = title;
        errorBannerMessage.textContent = message;
        tableErrorBanner.style.display = 'flex';
    }

    function hideTableError() {
        tableErrorBanner.style.display = 'none';
    }

    errorRetryBtn.addEventListener('click', () => {
        hideTableError();
        loadEntityData(currentSelectedEntity);
    });

    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let iconSrc = 'assets/icons/check.svg';
        if (type === 'error') iconSrc = 'assets/icons/alert-triangle.svg';

        toast.innerHTML = `
            <img src="${iconSrc}" alt="" width="16" height="16" style="filter: brightness(0) invert(1);" />
            <span>${escapeHtml(message)}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.2s ease';
            setTimeout(() => toast.remove(), 250);
        }, 3200);
    }

    // =========================================================================
    // --- 11. STRING & FORMATTING HELPERS ---
    // =========================================================================
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function truncateText(text, maxLen) {
        if (!text) return '';
        if (text.length <= maxLen) return escapeHtml(text);
        return escapeHtml(text.slice(0, maxLen)) + '...';
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return escapeHtml(dateStr);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return escapeHtml(dateStr);
        }
    }

    function formatInputDate(dateStr) {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toISOString().split('T')[0];
        } catch {
            return '';
        }
    }

    function formatLogTimestamp(ts) {
        if (!ts) return new Date().toLocaleTimeString();
        try {
            const d = new Date(ts);
            return d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0');
        } catch {
            return ts;
        }
    }

    function getRoleBadgeClass(role) {
        switch (role) {
            case 'Admin': return 'badge-role-admin';
            case 'Dean': return 'badge-role-dean';
            case 'Faculty': return 'badge-role-faculty';
            case 'Student': return 'badge-role-student';
            default: return 'badge-role-student';
        }
    }

    function getStatusBadgeClass(status) {
        switch (status) {
            case 'Active':
            case 'Enrolled':
            case 'Approved':
                return 'badge-active';
            case 'Inactive':
            case 'Dropped':
            case 'Rejected':
                return 'badge-inactive';
            case 'Pending':
            case 'Pending_Allocation':
            case 'Waitlisted':
                return 'badge-pending';
            default:
                return 'badge-active';
        }
    }

    // =========================================================================
    // --- 13. MULTI-COLLEGE SAAS OPERATIONS & SPOC MANAGEMENT ---
    // =========================================================================
    const DEFAULT_INSTITUTES = [
        {
            instituteId: 'INST-IIITS',
            name: 'Indian Institute of Information Technology Sri City',
            tier: 'Enterprise',
            spocAdminId: 'SPOC-001',
            spocName: 'Arjun Verma',
            deanName: 'Dr. K Divyabramham',
            deanEmail: 'dean@iiits.in',
            studentCount: 1250,
            status: 'Active',
            annualContractValue: 107988,
        },
        {
            instituteId: 'INST-IITB',
            name: 'Indian Institute of Technology Bombay',
            tier: 'Campus',
            spocAdminId: 'SPOC-002',
            spocName: 'Eswar Prasad',
            deanName: 'Dr. Himangshu Sarma',
            deanEmail: 'dean@iitb.ac.in',
            studentCount: 4800,
            status: 'Active',
            annualContractValue: 47988,
        },
        {
            instituteId: 'INST-BITS',
            name: 'Birla Institute of Technology and Science, Pilani',
            tier: 'Starter',
            spocAdminId: 'SPOC-003',
            spocName: 'Priya Sharma',
            deanName: 'Prof. Sudhirkumar Barai',
            deanEmail: 'dean@pilani.bits-pilani.ac.in',
            studentCount: 3500,
            status: 'Active',
            annualContractValue: 17988,
        },
    ];

    const DEFAULT_ADMIN_TEAM = [
        {
            adminId: 'SPOC-001',
            fullName: 'Arjun Verma',
            email: 'arjun.spoc@lumina.edu',
            phone: '+91 98765 43210',
            assignedInstituteId: 'INST-IIITS',
            assignedInstituteName: 'IIIT Sri City',
            status: 'Active',
            slaHealth: '99.99% SLA (Dedicated)',
        },
        {
            adminId: 'SPOC-002',
            fullName: 'Eswar Prasad',
            email: 'eswar.spoc@lumina.edu',
            phone: '+91 98765 43211',
            assignedInstituteId: 'INST-IITB',
            assignedInstituteName: 'IIT Bombay',
            status: 'Active',
            slaHealth: '99.95% SLA (Portfolio)',
        },
        {
            adminId: 'SPOC-003',
            fullName: 'Priya Sharma',
            email: 'priya.spoc@lumina.edu',
            phone: '+91 98765 43212',
            assignedInstituteId: 'INST-BITS',
            assignedInstituteName: 'BITS Pilani',
            status: 'Active',
            slaHealth: '99.90% SLA (Standard)',
        },
    ];


    let cachedInstitutes = [...DEFAULT_INSTITUTES];
    let cachedAdminTeam = [...DEFAULT_ADMIN_TEAM];

    async function loadInstitutesAndSpocs() {
        try {
            const [instRes, teamRes] = await Promise.all([
                fetch(`${API_BASE}/super-user/institutes`, { headers }).catch(() => null),
                fetch(`${API_BASE}/super-user/admin-team`, { headers }).catch(() => null)
            ]);

            if (instRes && instRes.ok) {
                const data = await instRes.json();
                if (Array.isArray(data) && data.length > 0) cachedInstitutes = data;
            }
            if (teamRes && teamRes.ok) {
                const data = await teamRes.json();
                if (Array.isArray(data) && data.length > 0) cachedAdminTeam = data;
            }

            // Update stats
            const totalArr = cachedInstitutes.reduce((sum, i) => sum + (i.annualContractValue || 0), 0);
            const totalStudents = cachedInstitutes.reduce((sum, i) => sum + (i.studentCount || 0), 0);

            const countEl = document.getElementById('stat-inst-count');
            const spocEl = document.getElementById('stat-spoc-count');
            const arrEl = document.getElementById('stat-saas-arr');
            const studEl = document.getElementById('stat-inst-students');

            if (countEl) countEl.textContent = cachedInstitutes.length;
            if (spocEl) spocEl.textContent = cachedAdminTeam.length;
            if (arrEl) arrEl.textContent = `$${totalArr.toLocaleString()}`;
            if (studEl) studEl.textContent = totalStudents.toLocaleString();

            renderInstitutesTable();
            renderSpocRoster();
            renderOnboardingDockets();
        } catch (error) {
            console.error('Failed to load institutes and SPOCs:', error);
            renderInstitutesTable();
            renderSpocRoster();
            renderOnboardingDockets();
        }
    }


    // Sub-Tab Switcher for Tenancy & Operations Domain
    window.switchTenancySubTab = function (subtab) {
        const subtabs = ['institutes', 'staff', 'queue'];
        subtabs.forEach(tab => {
            const btn = document.getElementById(`subtab-btn-${tab}`);
            const pane = document.getElementById(`pane-tenancy-${tab}`);
            if (btn) {
                if (tab === subtab) btn.classList.add('active');
                else btn.classList.remove('active');
            }
            if (pane) {
                pane.style.display = (tab === subtab) ? 'block' : 'none';
            }
        });
    };

    function getTierBadgeClass(tier) {
        if (tier === 'Enterprise') return 'badge-active';
        if (tier === 'Campus') return 'badge-completed';
        return 'badge-pending';
    }

    function renderInstitutesTable() {
        const tbody = document.getElementById('institutes-table-body');
        if (!tbody) return;

        const badgeInst = document.getElementById('subtab-badge-inst');
        if (badgeInst) badgeInst.textContent = cachedInstitutes.length;

        if (cachedInstitutes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #94a3b8; padding: 32px;">No client universities found.</td></tr>`;
            return;
        }

        tbody.innerHTML = cachedInstitutes.map(inst => `
            <tr>
                <td>
                    <div style="font-weight: 700; color: #0f172a; font-size: 0.92rem;">${escapeHtml(inst.name)}</div>
                    <code style="font-size: 0.72rem; color: #64748b; font-family: monospace;">${escapeHtml(inst.instituteId)}</code>
                </td>
                <td>
                    <span class="status-badge ${getTierBadgeClass(inst.tier)}">${escapeHtml(inst.tier)} Tier</span>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <img src="assets/icons/shield.svg" alt="" width="14" height="14" style="opacity: 0.65;" />
                        <span style="font-weight: 600; color: #0f172a;">${escapeHtml(inst.spocName)}</span>
                    </div>
                </td>
                <td>
                    <div style="font-weight: 600; color: #334155;">${escapeHtml(inst.deanName)}</div>
                    <a href="mailto:${escapeHtml(inst.deanEmail)}" style="font-size: 0.78rem; color: #0284c7;">${escapeHtml(inst.deanEmail)}</a>
                </td>
                <td>
                    <span style="font-weight: 700; color: #0f172a;">${inst.studentCount.toLocaleString()}</span>
                </td>
                <td>
                    <span style="font-weight: 700; color: #166534;">$${(inst.annualContractValue || 0).toLocaleString()} / yr</span>
                </td>
                <td>
                    <span class="status-badge badge-active" style="display: inline-flex; align-items: center; gap: 5px;">
                        <span style="width: 6px; height: 6px; border-radius: 50%; background: #16a34a; display: inline-block;"></span>
                        99.99% SLA
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 6px;">
                        <button class="btn btn-outline btn-xs" onclick="openReassignSpocModal('${escapeHtml(inst.instituteId)}', '${escapeHtml(inst.name)}', '${escapeHtml(inst.spocAdminId)}')">
                            Reassign SPOC
                        </button>
                        <button class="btn btn-outline btn-xs" onclick="openChangeTierModal('${escapeHtml(inst.instituteId)}', '${escapeHtml(inst.name)}', '${escapeHtml(inst.tier)}')">
                            Change Tier
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function renderSpocRoster() {
        const grid = document.getElementById('spoc-cards-grid');
        if (!grid) return;

        const badgeStaff = document.getElementById('subtab-badge-staff');
        if (badgeStaff) badgeStaff.textContent = cachedAdminTeam.length;

        if (cachedAdminTeam.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #94a3b8; padding: 32px;">No Lumina SPOCs currently employed.</div>`;
            return;
        }

        grid.innerHTML = cachedAdminTeam.map(spoc => {
            const initials = spoc.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            return `
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: transform 0.15s ease, box-shadow 0.15s ease;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 42px; height: 42px; border-radius: 50%; background: #f1f5f9; border: 1px solid #cbd5e1; color: #0f172a; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.95rem; letter-spacing: 0.5px;">
                            ${initials}
                        </div>
                        <div>
                            <div style="font-weight: 700; color: #0f172a; font-size: 1rem;">${escapeHtml(spoc.fullName)}</div>
                            <code style="font-size: 0.75rem; color: #64748b; font-family: monospace;">${escapeHtml(spoc.adminId)}</code>
                        </div>
                    </div>
                    <span class="status-badge badge-active">${escapeHtml(spoc.status)}</span>
                </div>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                    <div style="color: #64748b; font-size: 0.72rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px;">Assigned University Tenant</div>
                    <div style="font-weight: 700; color: #0f172a; font-size: 0.9rem; display: flex; align-items: center; gap: 6px;">
                        <img src="assets/icons/layers.svg" alt="" width="14" height="14" style="opacity: 0.7;" />
                        <span>${escapeHtml(spoc.assignedInstituteName)}</span>
                    </div>
                </div>

                <div style="font-size: 0.82rem; color: #475569; display: flex; flex-direction: column; gap: 6px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <img src="assets/icons/mail.svg" alt="" width="14" height="14" style="opacity: 0.6;" />
                        <a href="mailto:${escapeHtml(spoc.email)}" style="color: #0284c7; text-decoration: none;">${escapeHtml(spoc.email)}</a>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <img src="assets/icons/telephone.svg" alt="" width="14" height="14" style="opacity: 0.6;" />
                        <span>${escapeHtml(spoc.phone)}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                        <span class="status-badge badge-active" style="padding: 3px 10px; font-size: 0.75rem;">${escapeHtml(spoc.slaHealth)}</span>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    }

    function renderOnboardingDockets() {
        const tbody = document.getElementById('dockets-table-body');
        if (!tbody) return;

        const dockets = JSON.parse(localStorage.getItem('Lumina_Onboard_Dockets') || '[]');
        const badgeQueue = document.getElementById('subtab-badge-queue');
        if (badgeQueue) badgeQueue.textContent = dockets.length;

        if (dockets.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 32px;">No pending inbound onboarding requests in queue.</td></tr>`;
            return;
        }

        tbody.innerHTML = dockets.map(docket => `
            <tr>
                <td>
                    <div style="font-weight: 700; color: #0f172a; font-size: 0.92rem;">${escapeHtml(docket.instituteName)}</div>
                </td>
                <td>
                    <span class="status-badge badge-pending">${escapeHtml(docket.plan)}</span>
                </td>
                <td>
                    <div style="font-weight: 600; color: #334155;">${escapeHtml(docket.repName)}</div>
                    <div style="font-size: 0.78rem; color: #64748b;">${escapeHtml(docket.email)}</div>
                </td>
                <td>
                    <span style="font-weight: 700; color: #0f172a;">${Number(docket.students || 0).toLocaleString()}</span>
                </td>
                <td>
                    <span style="font-size: 0.8rem; color: #64748b;">${new Date(docket.submittedAt).toLocaleDateString()}</span>
                </td>
                <td>
                    <button class="btn btn-primary btn-xs" onclick="onboardFromDocket('${escapeHtml(docket.id)}')">
                        Assign SPOC & Onboard
                    </button>
                </td>
            </tr>
        `).join('');
    }


    // Modal Control Functions (Exposed to window for HTML onclicks)
    window.openReassignSpocModal = function (instId, instName, currentSpocId) {
        document.getElementById('spoc-modal-inst-id').value = instId;
        document.getElementById('spoc-modal-inst-name').textContent = instName;

        const select = document.getElementById('spoc-select-dropdown');
        select.innerHTML = cachedAdminTeam.map(spoc => `
            <option value="${spoc.adminId}" ${spoc.adminId === currentSpocId ? 'selected' : ''}>
                ${spoc.fullName} (${spoc.adminId}) — Currently: ${spoc.assignedInstituteName}
            </option>
        `).join('');

        document.getElementById('spoc-modal-backdrop').style.display = 'flex';
    };

    window.closeSpocModal = function () {
        document.getElementById('spoc-modal-backdrop').style.display = 'none';
    };

    window.confirmSpocAssignment = async function () {
        const instId = document.getElementById('spoc-modal-inst-id').value;
        const spocAdminId = document.getElementById('spoc-select-dropdown').value;

        try {
            const res = await fetch(`${API_BASE}/super-user/institutes/${instId}/assign-spoc`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ spocAdminId })
            });

            if (!res.ok) throw new Error('Failed to reassign SPOC.');
            const data = await res.json();
            showToast(data.message || 'SPOC assigned successfully!', 'success');
            closeSpocModal();
            loadInstitutesAndSpocs();
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    window.openChangeTierModal = function (instId, instName, currentTier) {
        document.getElementById('tier-modal-inst-id').value = instId;
        document.getElementById('tier-modal-inst-name').textContent = instName;
        document.getElementById('tier-select-dropdown').value = currentTier;
        document.getElementById('tier-modal-backdrop').style.display = 'flex';
    };

    window.closeTierModal = function () {
        document.getElementById('tier-modal-backdrop').style.display = 'none';
    };

    window.confirmTierUpdate = async function () {
        const instId = document.getElementById('tier-modal-inst-id').value;
        const tier = document.getElementById('tier-select-dropdown').value;

        try {
            const res = await fetch(`${API_BASE}/super-user/institutes/${instId}/tier`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ tier })
            });

            if (!res.ok) throw new Error('Failed to update tier.');

            // Sync active tier globally for all role dashboards
            localStorage.setItem('Lumina_Active_Tier', tier);
            fetch(`${API_BASE}/revenue/tier`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ tier })
            }).catch(() => null);

            showToast(`Updated ${instId} to ${tier} Tier!`, 'success');
            closeTierModal();
            loadInstitutesAndSpocs();
        } catch (error) {
            showToast(error.message, 'error');
        }
    };


    window.openEmploySpocModal = function () {
        document.getElementById('employ-spoc-form').reset();
        document.getElementById('employ-modal-backdrop').style.display = 'flex';
    };

    window.closeEmploySpocModal = function () {
        document.getElementById('employ-modal-backdrop').style.display = 'none';
    };

    window.submitEmploySpoc = async function (e) {
        e.preventDefault();
        const payload = {
            fullName: document.getElementById('employ-spoc-name').value,
            email: document.getElementById('employ-spoc-email').value,
            phone: document.getElementById('employ-spoc-phone').value,
        };

        try {
            const res = await fetch(`${API_BASE}/super-user/admin-team`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to employ SPOC.');
            showToast(`Employed ${payload.fullName} to Lumina Admin Staff!`, 'success');
            closeEmploySpocModal();
            loadInstitutesAndSpocs();
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    window.openOnboardModalSuperUser = function () {
        document.getElementById('super-onboard-form').reset();
        const spocSelect = document.getElementById('onboard-spoc-select');
        spocSelect.innerHTML = cachedAdminTeam.map(spoc => `
            <option value="${spoc.adminId}">${spoc.fullName} (${spoc.adminId})</option>
        `).join('');
        document.getElementById('onboard-modal-backdrop').style.display = 'flex';
    };

    window.closeOnboardModalSuperUser = function () {
        document.getElementById('onboard-modal-backdrop').style.display = 'none';
    };

    window.submitSuperUserOnboard = async function (e) {
        e.preventDefault();
        const payload = {
            name: document.getElementById('onboard-name-input').value,
            deanName: document.getElementById('onboard-dean-input').value,
            deanEmail: document.getElementById('onboard-email-input').value,
            studentCount: Number(document.getElementById('onboard-students-input').value),
            tier: document.getElementById('onboard-tier-select').value,
            spocAdminId: document.getElementById('onboard-spoc-select').value,
        };

        try {
            const res = await fetch(`${API_BASE}/super-user/institutes`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to onboard institute.');
            showToast(`Onboarded ${payload.name} on ${payload.tier} Tier!`, 'success');
            closeOnboardModalSuperUser();
            loadInstitutesAndSpocs();
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    window.onboardFromDocket = function (docketId) {
        const dockets = JSON.parse(localStorage.getItem('Lumina_Onboard_Dockets') || '[]');
        const docket = dockets.find(d => d.id === docketId);
        if (!docket) return;

        openOnboardModalSuperUser();
        document.getElementById('onboard-name-input').value = docket.instituteName;
        document.getElementById('onboard-dean-input').value = docket.repName;
        document.getElementById('onboard-email-input').value = docket.email;
        document.getElementById('onboard-students-input').value = docket.students;

        // Remove from pending dockets
        const remaining = dockets.filter(d => d.id !== docketId);
        localStorage.setItem('Lumina_Onboard_Dockets', JSON.stringify(remaining));
        renderOnboardingDockets();
    };

    // =========================================================================
    // --- 14. INITIALIZATION ---
    // =========================================================================
    async function initPage() {
        populateFilterOptions('users');

        // Initial data fetch: Load default entity (Users)
        await loadEntityData('users');

        // Preload other entity datasets asynchronously for fast stat strip counters
        Promise.allSettled([
            fetch(`${API_BASE}/courses`, { headers }).then(r => r.ok ? r.json() : []).then(d => { entityCache.courses = Array.isArray(d) ? d : []; }),
            fetch(`${API_BASE}/registrations`, { headers }).then(r => r.ok ? r.json() : []).then(d => { entityCache.registrations = Array.isArray(d) ? d : []; }),
            fetch(`${API_BASE}/overrides`, { headers }).then(r => r.ok ? r.json() : []).then(d => { entityCache.overrides = Array.isArray(d) ? d : []; }),
            loadInstitutesAndSpocs(),
        ]).then(() => {
            updateStatStrip();
        });

        try {
            logBuffer = await fetchLogs();
            renderLogs();
            connectionStatusPill.classList.add('connected');
            connectionStatusText.textContent = 'Connected to log service';
        } catch (error) {
            console.warn('Failed to load system logs:', error);
        }
    }

    initPage();
});

