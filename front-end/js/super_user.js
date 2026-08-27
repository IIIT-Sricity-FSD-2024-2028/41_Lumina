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
    
    if (!sessionData) {
        window.location.href = 'login.html';
        return;
    }

    const currentUser = JSON.parse(sessionData);
    if (currentUser.Role !== 'Super_User') {
        window.location.href = 'login.html';
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'x-role': currentUser.Role,
    };

    // Populate Top Navigation User Info
    const userNameEl = document.getElementById('user-full-name');
    const userRoleEl = document.getElementById('user-role-display');
    if (userNameEl) userNameEl.textContent = currentUser.Full_Name || 'Super User';
    if (userRoleEl) userRoleEl.textContent = `Role: ${currentUser.Role} (${currentUser.Dept_ID || 'General'})`;

    // Logout Action
    document.getElementById('logout-btn').addEventListener('click', () => {
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
            idKey: 'phaseId',
            canCreate: true,
            canEdit: true,
            canDelete: true,
            columns: ['Phase ID', 'Term', 'Phase Name', 'Start Date', 'End Date', 'Actions'],
            filterOptions: [
                { value: 'ALL', label: 'All Terms' },
                { value: 'Fall 2026', label: 'Fall 2026' },
                { value: 'Spring 2026', label: 'Spring 2026' },
            ],
            filterFn: (item, filterVal) => (filterVal === 'ALL' ? true : item.term === filterVal),
            searchFields: ['phaseId', 'term', 'phaseName', 'startDate', 'endDate'],
        },
        announcements: {
            title: 'Announcements',
            singular: 'Announcement',
            endpoint: '/announcements',
            idKey: 'announcementId',
            canCreate: true,
            canEdit: false, // Prompt rule: Edit ❌
            canDelete: false, // Prompt rule: Delete ❌
            columns: ['Announcement ID', 'Title', 'Body', 'Posted By', 'Date', 'Actions'],
            filterOptions: [
                { value: 'ALL', label: 'All Announcements' },
            ],
            filterFn: () => true,
            searchFields: ['announcementId', 'title', 'body', 'postedBy', 'date'],
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

            case 'enrollment-phases':
                return `
                    <tr data-id="${escapeHtml(item.phaseId)}">
                        <td><strong>${escapeHtml(item.phaseId)}</strong></td>
                        <td>${escapeHtml(item.term || '—')}</td>
                        <td><strong>${escapeHtml(item.phaseName || '—')}</strong></td>
                        <td>${formatDate(item.startDate)}</td>
                        <td>${formatDate(item.endDate)}</td>
                        <td>
                            <div class="row-actions">
                                <button class="action-btn-edit" data-action="edit" data-id="${escapeHtml(item.phaseId)}" title="Edit Phase">
                                    <img src="assets/icons/edit.svg" alt="" width="13" height="13" />
                                    <span>Edit</span>
                                </button>
                                <button class="action-btn-delete" data-action="delete" data-id="${escapeHtml(item.phaseId)}" title="Delete Phase">
                                    <img src="assets/icons/trash.svg" alt="" width="13" height="13" />
                                    <span>Delete</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;

            case 'announcements':
                return `
                    <tr data-id="${escapeHtml(item.announcementId)}">
                        <td><strong>${escapeHtml(item.announcementId)}</strong></td>
                        <td><strong>${escapeHtml(item.title || '—')}</strong></td>
                        <td title="${escapeHtml(item.body || '')}">${truncateText(item.body || '—', 48)}</td>
                        <td>${escapeHtml(item.postedBy || '—')}</td>
                        <td>${formatDate(item.date)}</td>
                        <td>
                            <div class="row-actions">
                                <span style="font-size:0.75rem; color:var(--text-muted);">Broadcast only</span>
                            </div>
                        </td>
                    </tr>
                `;

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
                        <div class="form-group">
                            <label class="form-label" for="field-phaseId">Phase ID <span class="required">*</span></label>
                            <input type="text" id="field-phaseId" name="phaseId" class="form-control" value="${escapeHtml(data?.phaseId || '')}" ${isEdit ? 'disabled' : 'required'} placeholder="e.g. PHASE-F26-1" />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-term">Academic Term <span class="required">*</span></label>
                            <input type="text" id="field-term" name="term" class="form-control" value="${escapeHtml(data?.term || 'Fall 2026')}" required placeholder="e.g. Fall 2026" />
                        </div>
                        <div class="form-group-full form-group">
                            <label class="form-label" for="field-phaseName">Phase Name <span class="required">*</span></label>
                            <input type="text" id="field-phaseName" name="phaseName" class="form-control" value="${escapeHtml(data?.phaseName || '')}" required placeholder="e.g. Priority Enrollment Phase 1" />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-startDate">Start Date <span class="required">*</span></label>
                            <input type="date" id="field-startDate" name="startDate" class="form-control" value="${formatInputDate(data?.startDate)}" required />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-endDate">End Date <span class="required">*</span></label>
                            <input type="date" id="field-endDate" name="endDate" class="form-control" value="${formatInputDate(data?.endDate)}" required />
                        </div>
                    </div>
                `;
                break;

            case 'announcements':
                modalFields.innerHTML = `
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label" for="field-announcementId">Announcement ID <span class="required">*</span></label>
                            <input type="text" id="field-announcementId" name="announcementId" class="form-control" value="${escapeHtml(data?.announcementId || '')}" ${isEdit ? 'disabled' : 'required'} placeholder="e.g. ANN-901" />
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="field-postedBy">Posted By <span class="required">*</span></label>
                            <input type="text" id="field-postedBy" name="postedBy" class="form-control" value="${escapeHtml(data?.postedBy || currentUser.Full_Name || 'Dean Office')}" required />
                        </div>
                        <div class="form-group-full form-group">
                            <label class="form-label" for="field-title">Headline / Title <span class="required">*</span></label>
                            <input type="text" id="field-title" name="title" class="form-control" value="${escapeHtml(data?.title || '')}" required placeholder="e.g. Fall 2026 Enrollment Windows Announced" />
                        </div>
                        <div class="form-group-full form-group">
                            <label class="form-label" for="field-body">Announcement Body <span class="required">*</span></label>
                            <textarea id="field-body" name="body" class="form-control" rows="4" required placeholder="Enter full announcement notice...">${escapeHtml(data?.body || '')}</textarea>
                        </div>
                        <div class="form-group-full form-group">
                            <label class="form-label" for="field-date">Publication Date <span class="required">*</span></label>
                            <input type="date" id="field-date" name="date" class="form-control" value="${formatInputDate(data?.date) || new Date().toISOString().split('T')[0]}" required />
                        </div>
                    </div>
                `;
                break;

            default:
                modalFields.innerHTML = '';
        }
    }

    /**
     * Submit Form: Handles Create (POST) and Edit (PUT/PATCH)
     */
    crudForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        modalErrorAlert.style.display = 'none';

        const formData = new FormData(crudForm);
        const payload = {};
        for (let [key, val] of formData.entries()) {
            if (key === 'credits' || key === 'capacity') {
                payload[key] = parseInt(val, 10);
            } else {
                payload[key] = val;
            }
        }

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
                body: JSON.stringify(payload),
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

    let logBuffer = [...MOCK_LOGS];
    let isLiveStreaming = false;
    let liveStreamInterval = null;
    let activeLogLevelFilter = 'ALL';
    let activeLogModuleFilter = 'ALL';
    let activeLogSearchText = '';

    async function fetchLogs() {
        const response = await fetch(`${API_BASE}/super-user/logs?type=access&lines=200`, { headers });
        if (!response.ok) {
            throw new Error(`Server returned HTTP ${response.status}`);
        }

        const data = await response.json();
        return (data.logs || []).map((message, index) => ({
            timestamp: new Date(Date.now() - (data.logs.length - index) * 1000).toISOString(),
            level: message.includes('ERROR') ? 'ERROR' : message.includes('WARN') ? 'WARN' : 'INFO',
            module: 'ServerLog',
            message,
        }));
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

    // Live Streaming Toggle
    liveToggleBtn.addEventListener('click', () => {
        isLiveStreaming = !isLiveStreaming;

        if (isLiveStreaming) {
            liveToggleBtn.classList.add('active');
            connectionStatusPill.classList.add('connected');
            connectionStatusText.textContent = 'Simulating live log stream (3s)';

            // Append mock log periodically
            liveStreamInterval = setInterval(() => {
                const newEntry = generateMockLogEntry();
                logBuffer.push(newEntry);
                if (logBuffer.length > 500) logBuffer.shift(); // Keep buffer bounded
                renderLogs();
            }, 2500);
        } else {
            liveToggleBtn.classList.remove('active');
            connectionStatusPill.classList.remove('connected');
            connectionStatusText.textContent = 'Log service not configured';

            if (liveStreamInterval) {
                clearInterval(liveStreamInterval);
                liveStreamInterval = null;
            }
        }
    });

    // Generate realistic dynamic logs for live simulation
    const MOCK_MESSAGES = [
        { level: 'INFO', module: 'AuthService', message: 'Token refresh issued for student session' },
        { level: 'DEBUG', module: 'RegistrationsService', message: 'Evaluating prerequisites for enrollment request: pass' },
        { level: 'INFO', module: 'CoursesService', message: 'Capacity query returned 45 open seats in department' },
        { level: 'WARN', module: 'SectionsService', message: 'Instructor load factor exceeds 100% threshold for Fall term' },
        { level: 'INFO', module: 'OverridesService', message: 'Dean reviewed override request ID #REQ-8894' },
        { level: 'DEBUG', module: 'DatabaseService', message: 'PostgreSQL connection ping successful (0.8ms latency)' },
        { level: 'INFO', module: 'AnnouncementsService', message: 'Digest emails queued for delivery' },
        { level: 'ERROR', module: 'CourseSlotsService', message: 'Slot booking rejected: time conflict with instructor schedule' },
    ];

    function generateMockLogEntry() {
        const sample = MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)];
        return {
            timestamp: new Date().toISOString(),
            level: sample.level,
            module: sample.module,
            message: `${sample.message} (id: ${Math.floor(1000 + Math.random() * 9000)})`,
        };
    }

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
    const tabBtnLogs = document.getElementById('tab-btn-logs');
    const tabPaneOverview = document.getElementById('overview-tab');
    const tabPaneLogs = document.getElementById('logs-tab');

    function switchTab(tabKey) {
        currentActiveTab = tabKey;
        if (tabKey === 'overview') {
            tabBtnOverview.classList.add('active');
            tabBtnLogs.classList.remove('active');
            tabPaneOverview.style.display = 'block';
            tabPaneLogs.style.display = 'none';
        } else if (tabKey === 'logs') {
            tabBtnOverview.classList.remove('active');
            tabBtnLogs.classList.add('active');
            tabPaneOverview.style.display = 'none';
            tabPaneLogs.style.display = 'block';
            renderLogs();
        }
    }

    tabBtnOverview.addEventListener('click', () => switchTab('overview'));
    tabBtnLogs.addEventListener('click', () => switchTab('logs'));

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
    // --- 12. INITIALIZATION ---
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
