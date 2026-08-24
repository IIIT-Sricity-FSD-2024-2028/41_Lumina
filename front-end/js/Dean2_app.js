const API_BASE = 'http://localhost:3000';
const sessionData = localStorage.getItem('Lumina_Session');
const currentUser = sessionData ? JSON.parse(sessionData) : null;
const API_HEADERS = {
    'Content-Type': 'application/json',
    'x-role': currentUser ? currentUser.Role : 'Assistant_Dean_2'
};

// ==========================================
// DB MOCK FOR AD2 SETTINGS
// ==========================================
const DB = {
    get: function(key) {
        try {
            const data = localStorage.getItem('Lumina_AD2_' + key);
            return data ? JSON.parse(data) : null;
        } catch(e) { return null; }
    },
    set: function(key, value) {
        localStorage.setItem('Lumina_AD2_' + key, JSON.stringify(value));
    }
};

// ==========================================
// HELPERS
// ==========================================

function computeTermLabel(academicYear, term) {
    if (!academicYear || !term) return '—';
    const parts = academicYear.split('-');
    if (parts.length !== 2) return `${term} ${academicYear}`;
    const startYear = parts[0].trim();
    const endYear = parts[1].trim();
    if (term === 'Spring' || term === 'Summer') return `${term} ${endYear}`;
    if (term === 'Monsoon' || term === 'Fall') return `${term} ${startYear}`;
    return `${term} ${endYear}`;
}

function addPolicyLog(message, by) {
    const logs = DB.get('Policy_Change_Log') || [];
    logs.unshift({ message, by: by || 'Dr. Jenkins', time: 'Just now' });
    DB.set('Policy_Change_Log', logs);
}

function formatDateShort(dtStr) {
    if (!dtStr) return '';
    const d = new Date(dtStr);
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDateOnly(dtStr) {
    if (!dtStr) return '';
    const d = new Date(dtStr);
    return d.toLocaleString([], { month: 'short', day: 'numeric' });
}

// ==========================================
// ==========================================
// POLICIES PAGE — BACKEND-DRIVEN
// ==========================================
function initPoliciesPage() {
    const academicYearInput = document.getElementById('academicYearInput');
    const termSelect        = document.getElementById('termSelect');
    const lockTermBtn       = document.getElementById('lockTermBtn');
    const unlockTermBtn     = document.getElementById('unlockTermBtn');
    const termLockedBanner  = document.getElementById('termLockedBanner');

    const minCreditsInput   = document.getElementById('minCredits');
    const maxCreditsInput   = document.getElementById('maxCredits');
    const maxCoursesInput   = document.getElementById('maxCourses');
    const togglePrereq      = document.getElementById('togglePrereq');
    const toggleCond        = document.getElementById('toggleCond');
    const toggleAdvOver     = document.getElementById('toggleAdvOver');
    const minGpaInput       = document.getElementById('minGpa');
    const toggleFinance     = document.getElementById('toggleFinance');
    const toggleAdvApprove  = document.getElementById('toggleAdvApprove');

    const validateBtn       = document.getElementById('validatePolicies');
    const lockPoliciesBtn   = document.getElementById('lockPolicies');
    const unlockPoliciesBtn = document.getElementById('unlockPolicies');

    const policyStatusBanner = document.getElementById('policyStatusBanner');
    const policyStatusIcon   = document.getElementById('policyStatusIcon');
    const policyStatusTitle  = document.getElementById('policyStatusTitle');
    const policyStatusDesc   = document.getElementById('policyStatusDesc');
    const policyChangeLog    = document.getElementById('policyChangeLog');

    let currentSettings = {
        status: 'Validated', isLocked: false,
        minCredits: 12, maxCredits: 22, maxCourses: 6,
        enforcePrereq: true, allowConditional: false, allowAdvisorOverride: true,
        minGpa: 5.0, financialClearance: true, advisorApproval: true,
        academicYear: '2025-2026', term: 'Spring', termLocked: true
    };
    let currentLogs = [];

    async function fetchPoliciesFromAPI() {
        try {
            const res = await fetch(`${API_BASE}/policies`, { headers: API_HEADERS });
            if (res.ok) {
                const data = await res.json();
                currentSettings = data.settings || currentSettings;
                currentLogs = data.logs || [];
            }
        } catch (e) {
            console.error('Failed to fetch policies from API:', e);
        }
    }

    async function sendPolicyUpdate(payload) {
        try {
            const res = await fetch(`${API_BASE}/policies`, {
                method: 'PUT',
                headers: API_HEADERS,
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const data = await res.json();
                currentSettings = data.settings || currentSettings;
                currentLogs = data.logs || [];
                renderFormFields(currentSettings);
                renderPolicyBanner(currentSettings);
                renderChangeLog();
                return true;
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to update policy.');
                return false;
            }
        } catch (e) {
            console.error('Failed to update policy:', e);
            alert('Network error when updating policy.');
            return false;
        }
    }

    function renderPolicyBanner(ps) {
        if (!policyStatusBanner) return;
        if (ps.isLocked) {
            policyStatusBanner.style.background = '#EFF6FF';
            policyStatusBanner.style.borderColor = '#BFDBFE';
            policyStatusIcon.textContent = '🔒';
            policyStatusIcon.style.background = '#DBEAFE';
            policyStatusIcon.style.color = '#2563EB';
            policyStatusTitle.textContent = 'Policy Status – Locked';
            policyStatusTitle.style.color = '#1E40AF';
            policyStatusDesc.textContent = 'Policies are locked and cannot be modified.';
            policyStatusDesc.style.color = '#3B82F6';
        } else if (ps.status === 'Validated') {
            policyStatusBanner.style.background = '#F0FDF4';
            policyStatusBanner.style.borderColor = '#A7F3D0';
            policyStatusIcon.textContent = '✓';
            policyStatusIcon.style.background = '#059669';
            policyStatusIcon.style.color = 'white';
            policyStatusTitle.textContent = 'Policy Status – Validated';
            policyStatusTitle.style.color = '#065F46';
            policyStatusDesc.textContent = 'All current policies meet academic board standards.';
            policyStatusDesc.style.color = '#047857';
        } else {
            policyStatusBanner.style.background = '#FFFBEB';
            policyStatusBanner.style.borderColor = '#FDE68A';
            policyStatusIcon.textContent = '⚠';
            policyStatusIcon.style.background = '#F59E0B';
            policyStatusIcon.style.color = 'white';
            policyStatusTitle.textContent = 'Policy Status – Pending Validation';
            policyStatusTitle.style.color = '#92400E';
            policyStatusDesc.textContent = 'Policies have been modified. Please validate before locking.';
            policyStatusDesc.style.color = '#B45309';
        }
    }

    function renderChangeLog() {
        if (!policyChangeLog) return;
        policyChangeLog.innerHTML = '';
        currentLogs.slice(0, 6).forEach((log, i) => {
            const timeStr = log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';
            policyChangeLog.insertAdjacentHTML('beforeend', `
                <div class="log-entry">
                    <div class="log-dot ${i === 0 ? 'latest' : ''}"></div>
                    <div class="log-msg">${log.message}</div>
                    <div class="log-meta">By ${log.by} &bull; ${timeStr}</div>
                </div>
            `);
        });
    }

    function setPolicyFieldsDisabled(disabled) {
        [minCreditsInput, maxCreditsInput, maxCoursesInput,
         togglePrereq, toggleCond, toggleAdvOver,
         minGpaInput, toggleFinance, toggleAdvApprove].forEach(el => {
            if (el) el.disabled = disabled;
        });
    }

    function renderFormFields(ps) {
        if (academicYearInput) academicYearInput.value = ps.academicYear || '';
        if (termSelect) termSelect.value = ps.term || 'Spring';

        if (ps.termLocked) {
            if (lockTermBtn) lockTermBtn.style.display = 'none';
            if (unlockTermBtn) unlockTermBtn.style.display = '';
            if (termLockedBanner) termLockedBanner.classList.add('show');
            if (academicYearInput) academicYearInput.disabled = true;
            if (termSelect) termSelect.disabled = true;
        } else {
            if (lockTermBtn) lockTermBtn.style.display = '';
            if (unlockTermBtn) unlockTermBtn.style.display = 'none';
            if (termLockedBanner) termLockedBanner.classList.remove('show');
            if (!ps.isLocked) {
                if (academicYearInput) academicYearInput.disabled = false;
                if (termSelect) termSelect.disabled = false;
            }
        }

        if (minCreditsInput)  minCreditsInput.value    = ps.minCredits ?? 12;
        if (maxCreditsInput)  maxCreditsInput.value    = ps.maxCredits ?? 22;
        if (maxCoursesInput)  maxCoursesInput.value    = ps.maxCourses ?? 6;
        if (togglePrereq)     togglePrereq.checked     = !!ps.enforcePrereq;
        if (toggleCond)       toggleCond.checked       = !!ps.allowConditional;
        if (toggleAdvOver)    toggleAdvOver.checked    = !!ps.allowAdvisorOverride;
        if (minGpaInput)      minGpaInput.value        = ps.minGpa ?? 5.0;
        if (toggleFinance)    toggleFinance.checked    = !!ps.financialClearance;
        if (toggleAdvApprove) toggleAdvApprove.checked = !!ps.advisorApproval;

        setPolicyFieldsDisabled(ps.isLocked);
        if (!ps.isLocked && ps.termLocked) {
            if (academicYearInput) academicYearInput.disabled = true;
            if (termSelect) termSelect.disabled = true;
        }
    }

    function markPendingLocally() {
        if (!currentSettings.isLocked) {
            currentSettings.status = 'Pending';
            renderPolicyBanner(currentSettings);
        }
    }

    // Local change listeners — update UI state to Pending without firing network spam
    academicYearInput?.addEventListener('change', markPendingLocally);
    termSelect?.addEventListener('change', markPendingLocally);
    minCreditsInput?.addEventListener('input', markPendingLocally);
    maxCreditsInput?.addEventListener('input', markPendingLocally);
    maxCoursesInput?.addEventListener('input', markPendingLocally);
    togglePrereq?.addEventListener('change', markPendingLocally);
    toggleCond?.addEventListener('change', markPendingLocally);
    toggleAdvOver?.addEventListener('change', markPendingLocally);
    minGpaInput?.addEventListener('input', markPendingLocally);
    toggleFinance?.addEventListener('change', markPendingLocally);
    toggleAdvApprove?.addEventListener('change', markPendingLocally);

    // ── Button Actions ──

    lockTermBtn?.addEventListener('click', () => {
        const year = academicYearInput.value;
        if (!year) { alert('Please select an Academic Year before locking the term.'); return; }
        sendPolicyUpdate({ academicYear: year, term: termSelect.value, termLocked: true, logMessage: `Term Locked: ${computeTermLabel(year, termSelect.value)}` });
    });

    unlockTermBtn?.addEventListener('click', () => {
        sendPolicyUpdate({ termLocked: false, logMessage: 'Term Unlocked' });
    });

    validateBtn?.addEventListener('click', () => {
        if (currentSettings.isLocked) { alert('Policies are locked. Unlock before validating.'); return; }

        const minCr = parseInt(minCreditsInput.value, 10);
        const maxCr = parseInt(maxCreditsInput.value, 10);
        const maxCrs = parseInt(maxCoursesInput.value, 10);
        const gpa = parseFloat(minGpaInput.value);

        // Validation Checks
        if (isNaN(minCr) || minCr < 1 || minCr > 30) {
            alert('Please enter a valid Minimum Credit Limit (between 1 and 30).');
            minCreditsInput.focus();
            return;
        }
        if (isNaN(maxCr) || maxCr < 1 || maxCr > 30) {
            alert('Please enter a valid Maximum Credit Limit (between 1 and 30).');
            maxCreditsInput.focus();
            return;
        }
        if (minCr > maxCr) {
            alert(`Validation Error: Minimum credits (${minCr}) cannot be greater than Maximum credits (${maxCr}).`);
            minCreditsInput.focus();
            return;
        }
        if (isNaN(maxCrs) || maxCrs < 1 || maxCrs > 15) {
            alert('Please enter a valid Maximum Courses Limit (between 1 and 15).');
            maxCoursesInput.focus();
            return;
        }
        if (isNaN(gpa) || gpa < 0 || gpa > 10) {
            alert('Please enter a valid Minimum GPA (between 0.0 and 10.0).');
            minGpaInput.focus();
            return;
        }

        const payload = {
            minCredits: minCr,
            maxCredits: maxCr,
            maxCourses: maxCrs,
            minGpa: gpa,
            enforcePrereq: togglePrereq.checked,
            allowConditional: toggleCond.checked,
            allowAdvisorOverride: toggleAdvOver.checked,
            financialClearance: toggleFinance.checked,
            advisorApproval: toggleAdvApprove.checked,
            academicYear: academicYearInput.value || currentSettings.academicYear,
            term: termSelect.value || currentSettings.term,
            status: 'Validated',
            logMessage: 'Policies Validated'
        };

        sendPolicyUpdate(payload);
    });

    lockPoliciesBtn?.addEventListener('click', () => {
        sendPolicyUpdate({ isLocked: true, logMessage: 'Policies Locked' });
    });

    unlockPoliciesBtn?.addEventListener('click', () => {
        sendPolicyUpdate({ isLocked: false, logMessage: 'Policies Unlocked' });
    });

    fetchPoliciesFromAPI().then(() => {
        renderFormFields(currentSettings);
        renderPolicyBanner(currentSettings);
        renderChangeLog();
    });
}

// ==========================================
// ENROLLMENT PAGE
// ==========================================
function initEnrollmentPage() {
    const systemStatusBadge   = document.getElementById('systemStatusBadge');
    const windowStatusBadge   = document.getElementById('windowStatusBadge');
    const startDateInput      = document.getElementById('startDateInput');
    const endDateInput        = document.getElementById('endDateInput');
    const activePhaseName     = document.getElementById('activePhaseName');
    const activePhaseEligible = document.getElementById('activePhaseEligible');
    const globalEnrollDates   = document.getElementById('globalEnrollmentDates');
    const phaseTableBody      = document.getElementById('phaseTableBody');
    const phaseModal          = document.getElementById('phaseModal');
    const modalTitle          = document.getElementById('modalTitle');
    const modalPhaseName      = document.getElementById('modalPhaseName');
    const modalYear           = document.getElementById('modalYear');
    const modalSemester       = document.getElementById('modalSemester');
    const modalPhaseStatus    = document.getElementById('modalPhaseStatus');

    let editingId = null;

    function getSettings() {
        const arr = DB.get('Enrollment_Settings');
        return (arr && arr[0]) ? arr[0] : { systemStatus: 'Active', windowStatus: 'Open', startDate: '', endDate: '' };
    }

    function saveSettings(s) { DB.set('Enrollment_Settings', [s]); }

    function updateSetting(key, value) {
        const s = getSettings();
        s[key] = value;
        saveSettings(s);
        refreshEnrollmentUI();
    }

    function renderPhasesTable(phases) {
        if (!phaseTableBody) return;
        phaseTableBody.innerHTML = '';
        if (!phases || phases.length === 0) {
            phaseTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem;">No phases configured yet.</td></tr>`;
            return;
        }
        phases.forEach(phase => {
            const bc = phase.status === 'Completed' ? 'badge-completed' : phase.status === 'Active' ? 'badge-active' : 'badge-upcoming';
            phaseTableBody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td><strong>${phase.name}</strong></td>
                    <td>${phase.eligibleGroups || phase.eligible}</td>
                    <td>${phase.timeline}</td>
                    <td><span class="badge ${bc}">${phase.status}</span></td>
                    <td class="action-icons">
                        <span title="Edit" data-edit="${phase.id}">✏️</span>
                        <span title="Delete" data-delete="${phase.id}" style="color:var(--accent-red);">🗑️</span>
                    </td>
                </tr>
            `);
        });
    }

    async function refreshEnrollmentUI() {
        const s = getSettings();
        const phases = await fetch(API_BASE + '/enrollment-phases', {headers: API_HEADERS}).then(r=>r.json()).catch(()=>[]);

        if (startDateInput) startDateInput.value = s.startDate || '';
        if (endDateInput) endDateInput.value = s.endDate || '';

        if (systemStatusBadge) {
            systemStatusBadge.textContent = `● ${s.systemStatus || 'Active'}`;
            systemStatusBadge.className = s.systemStatus === 'Active' ? 'badge badge-active' : 'badge badge-completed';
        }

        if (windowStatusBadge) {
            const ws = s.windowStatus || 'Open';
            windowStatusBadge.textContent = ws.toUpperCase();
            windowStatusBadge.className = ws === 'Open' ? 'badge badge-active' : ws === 'Paused' ? 'badge badge-paused' : 'badge badge-closed';
        }

        const activePhase = phases.find(p => p.status === 'Active');
        if (activePhaseName) activePhaseName.textContent = activePhase ? activePhase.name : 'No Active Phase';
        if (activePhaseEligible) activePhaseEligible.textContent = activePhase ? (activePhase.eligibleGroups || activePhase.eligible) + ' Students' : 'N/A';

        if (globalEnrollDates) {
            globalEnrollDates.textContent = (s.startDate && s.endDate)
                ? `📅 ${formatDateShort(s.startDate)} – ${formatDateShort(s.endDate)}`
                : '📅 No dates set';
        }

        renderPhasesTable(phases);
    }

    document.getElementById('btnOpen')?.addEventListener('click', () => updateSetting('windowStatus', 'Open'));
    document.getElementById('btnPause')?.addEventListener('click', () => updateSetting('windowStatus', 'Paused'));
    document.getElementById('btnClose')?.addEventListener('click', () => updateSetting('windowStatus', 'Closed'));
    document.getElementById('btnActivate')?.addEventListener('click', () => updateSetting('systemStatus', 'Active'));
    document.getElementById('btnDeactivate')?.addEventListener('click', () => updateSetting('systemStatus', 'Deactivated'));
    startDateInput?.addEventListener('change', (e) => updateSetting('startDate', e.target.value));
    endDateInput?.addEventListener('change', (e) => updateSetting('endDate', e.target.value));

    document.getElementById('addPhaseBtn')?.addEventListener('click', () => {
        editingId = null;
        modalTitle.textContent = 'Add Enrollment Phase';
        modalPhaseName.value = '';
        modalYear.value = 'Final Year';
        modalSemester.value = '';
        modalPhaseStatus.value = 'Upcoming';
        phaseModal.classList.add('show');
    });

    document.getElementById('closeModal')?.addEventListener('click', () => phaseModal.classList.remove('show'));
    phaseModal?.addEventListener('click', (e) => { if (e.target === phaseModal) phaseModal.classList.remove('show'); });

    document.getElementById('savePhase')?.addEventListener('click', () => {
        const name = modalPhaseName.value.trim();
        const yr = modalYear.value;
        const tm = modalSemester.value.trim();
        const status = modalPhaseStatus.value;
        if (!name) { alert('Please enter a phase name.'); return; }
        if (!tm) { alert('Please enter a timeline.'); return; }

        let method = editingId !== null ? 'PUT' : 'POST';
        let url = API_BASE + '/enrollment-phases' + (editingId !== null ? '/' + editingId : '');
        fetch(url, {
            method: method,
            headers: API_HEADERS,
            body: JSON.stringify({ name, eligibleGroups: yr, timeline: tm, status })
        }).then(() => {
            phaseModal.classList.remove('show');
            refreshEnrollmentUI();
        });
    });

    phaseTableBody?.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('[data-edit]');
        const deleteBtn = e.target.closest('[data-delete]');

        if (deleteBtn) {
            const id = parseInt(deleteBtn.getAttribute('data-delete'));
            if (confirm('Delete this phase?')) {
                fetch(API_BASE + '/enrollment-phases/' + id, {method: 'DELETE', headers: API_HEADERS}).then(() => refreshEnrollmentUI());
            }
        }

        if (editBtn) {
            const id = parseInt(editBtn.getAttribute('data-edit'));
            const phases = await fetch(API_BASE + '/enrollment-phases', {headers: API_HEADERS}).then(r=>r.json()).catch(()=>[]);
            const phase = phases.find(p => p.id === id);
            if (phase) {
                editingId = id;
                modalTitle.textContent = 'Edit Enrollment Phase';
                modalPhaseName.value = phase.name;
                modalYear.value = phase.eligibleGroups || phase.eligible;
                modalSemester.value = phase.timeline;
                modalPhaseStatus.value = phase.status;
                phaseModal.classList.add('show');
            }
        }
    });

    refreshEnrollmentUI();
}

// ==========================================
// DASHBOARD PAGE
// ==========================================
async function initDashboardPage() {
    const settings  = (DB.get('Enrollment_Settings') || [])[0] || {};
    const phases = await fetch(API_BASE + '/enrollment-phases', {headers: API_HEADERS}).then(r=>r.json()).catch(()=>[]);
    
    let ps = {};
    let ts = {};
    try {
        const polRes = await fetch(`${API_BASE}/policies`, { headers: API_HEADERS });
        if (polRes.ok) {
            const data = await polRes.json();
            ps = data.settings || {};
            ts = { academicYear: ps.academicYear, term: ps.term, isLocked: ps.termLocked };
        }
    } catch (e) {
        console.error('Failed to fetch policies for dashboard:', e);
    }
    
    let overrides = [];
    try {
        const res = await fetch(`${API_BASE}/overrides`, { headers: API_HEADERS });
        if (res.ok) overrides = await res.json();
    } catch (err) {
        console.error('Failed to fetch overrides:', err);
    }

    const el = (id) => document.getElementById(id);

    const dashAcademicTerm     = el('dashAcademicTerm');
    const dashTermStatus       = el('dashTermStatus');
    const dashPolicyStatus     = el('dashPolicyStatus');
    const dashEnrollmentStatus = el('dashEnrollmentStatus');
    const dashWindowDates      = el('dashWindowDates');
    const dashActivePhase      = el('dashActivePhase');
    const dashPendingOverrides = el('dashPendingOverrides');

    if (dashAcademicTerm) {
        dashAcademicTerm.textContent = (ts.academicYear && ts.term) ? computeTermLabel(ts.academicYear, ts.term) : '—';
    }

    if (dashTermStatus) {
        dashTermStatus.textContent = ts.isLocked ? 'Locked' : 'Active';
        dashTermStatus.style.color = ts.isLocked ? '#D97706' : '#059669';
    }

    if (dashPolicyStatus) {
        if (ps.isLocked) { dashPolicyStatus.textContent = 'Locked'; dashPolicyStatus.style.color = '#2563EB'; }
        else if (ps.status) { dashPolicyStatus.textContent = ps.status; dashPolicyStatus.style.color = ps.status === 'Validated' ? '#059669' : '#D97706'; }
        else { dashPolicyStatus.textContent = '—'; }
    }

    if (dashEnrollmentStatus) {
        dashEnrollmentStatus.textContent = settings.windowStatus || '—';
        const c = { Open: '#059669', Paused: '#D97706', Closed: '#EF4444' };
        dashEnrollmentStatus.style.color = c[settings.windowStatus] || 'inherit';
    }

    if (dashWindowDates) {
        dashWindowDates.textContent = (settings.startDate && settings.endDate)
            ? `${formatDateOnly(settings.startDate)} – ${formatDateOnly(settings.endDate)}`
            : '—';
    }

    if (dashActivePhase) {
        const ap = phases.find(p => p.status === 'Active');
        dashActivePhase.textContent = ap ? ap.name : 'No Active Phase';
    }

    if (dashPendingOverrides) {
        dashPendingOverrides.textContent = overrides.filter(r => r.approvalStatus === 'Pending').length;
    }
}

// ==========================================
// OVERRIDES PAGE
// ==========================================
async function initOverridesPage() {
    const tableBody        = document.getElementById('overridesTableBody');
    const searchInput      = document.getElementById('searchInput');
    const deptFilter       = document.getElementById('deptFilter');
    const statusFilter     = document.getElementById('statusFilter');
    const filterBtn        = document.getElementById('filterBtn');
    const metricPending    = document.getElementById('metricPending');
    const metricApproved   = document.getElementById('metricApproved');
    const metricRejected   = document.getElementById('metricRejected');
    const quickInsights    = document.getElementById('quickInsights');
    const sideEmpty        = document.getElementById('sideEmpty');
    const sideDetail       = document.getElementById('sideDetail');
    const sideReqId        = document.getElementById('side-req-id');
    const sideName         = document.getElementById('side-name');
    const sideMeta         = document.getElementById('side-meta');
    const sideCourse       = document.getElementById('side-course');
    const sideReason       = document.getElementById('side-reason');
    const sideDate         = document.getElementById('side-date');
    const sideActions      = document.getElementById('side-actions');
    const sideResolved     = document.getElementById('side-resolved-banner');
    const btnApprove       = document.getElementById('btnApprove');
    const btnReject        = document.getElementById('btnReject');
    const btnMoreInfo      = document.getElementById('btnMoreInfo');

    let allMappedOverrides = [];
    let activeRequestId = null;

    try {
        const [ovRes, usrRes, crsRes] = await Promise.all([
            fetch(`${API_BASE}/overrides`, { headers: API_HEADERS }),
            fetch(`${API_BASE}/users`, { headers: API_HEADERS }),
            fetch(`${API_BASE}/courses`, { headers: API_HEADERS })
        ]);
        let backendOverrides = [];
        let usersMap = {};
        let coursesMap = {};

        if (ovRes.ok) backendOverrides = await ovRes.json();
        if (usrRes.ok) {
            const users = await usrRes.json();
            users.forEach(u => usersMap[u.userId] = u);
        }
        if (crsRes.ok) {
            const courses = await crsRes.json();
            courses.forEach(c => coursesMap[c.courseId] = c);
        }

        allMappedOverrides = backendOverrides.map(r => {
            const student = usersMap[r.studentId] || {};
            const course = coursesMap[r.courseId] || {};
            return {
                id: r.requestId,
                name: student.fullName || 'Unknown Student',
                sid: r.studentId,
                dept: student.deptId || 'Unknown',
                year: 'N/A',
                course: `${r.courseId} (${course.courseName || 'Unknown'})`,
                reason: r.reason,
                date: formatDateShort(r.createdAt),
                status: r.approvalStatus
            };
        });
        
        allMappedOverrides.sort((a, b) => b.id - a.id);
    } catch (err) {
        console.error('Failed to fetch data from backend:', err);
    }

    function getFilteredRequests() {
        let requests = allMappedOverrides;
        const search = (searchInput?.value || '').toLowerCase().trim();
        const dept   = deptFilter?.value || 'All Departments';
        const status = statusFilter?.value || 'All Status';
        if (search) requests = requests.filter(r => r.name.toLowerCase().includes(search) || r.sid.toLowerCase().includes(search));
        if (dept !== 'All Departments') requests = requests.filter(r => r.dept === dept);
        if (status !== 'All Status') requests = requests.filter(r => r.status === status);
        return requests;
    }

    function renderTable(requests) {
        tableBody.innerHTML = '';
        if (requests.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem;">No requests match your filters.</td></tr>`;
            return;
        }
        requests.forEach(req => {
            const statusClass = req.status === 'Pending' ? 'badge-pending' : req.status === 'Approved' ? 'badge-active' : 'badge-rejected';
            const btnLabel = req.status === 'Pending' ? 'Review' : 'View';
            const btnClass = req.status === 'Pending' ? 'btn-primary' : 'btn-outline';
            const isActive = req.id === activeRequestId ? 'style="background:#F8FAFF;"' : '';
            tableBody.insertAdjacentHTML('beforeend', `
                <tr ${isActive} data-id="${req.id}">
                    <td>
                        <div style="font-weight:600;">${req.name}</div>
                        <div style="font-size:0.8rem;color:var(--text-muted);">${req.sid}</div>
                    </td>
                    <td>
                        <div style="font-weight:600;">${req.dept}</div>
                        <div style="font-size:0.8rem;color:var(--text-muted);">${req.course.split(' ')[0]}</div>
                    </td>
                    <td style="color:var(--text-muted);font-size:0.88rem;">${req.reason.split('(')[0].trim()}</td>
                    <td><span class="badge ${statusClass}">${req.status}</span></td>
                    <td><button class="btn ${btnClass} btn-sm view-btn" data-id="${req.id}">${btnLabel}</button></td>
                </tr>
            `);
        });
    }

    function updateMetrics() {
        const all = allMappedOverrides;
        if (metricPending)  metricPending.textContent  = all.filter(r => r.status === 'Pending').length;
        if (metricApproved) metricApproved.textContent = all.filter(r => r.status === 'Approved').length;
        if (metricRejected) metricRejected.textContent = all.filter(r => r.status === 'Rejected').length;
    }

    function updateInsights() {
        const all = allMappedOverrides;
        const total = all.length;
        const cseCnt = all.filter(r => r.dept === 'CSE').length;
        const cfCnt  = all.filter(r => r.reason.toLowerCase().includes('course full')).length;
        const csePct = total > 0 ? Math.round((cseCnt / total) * 100) : 0;
        const cfPct  = total > 0 ? Math.round((cfCnt / total) * 100) : 0;
        const pending = all.filter(r => r.status === 'Pending').length;
        if (quickInsights) {
            quickInsights.innerHTML = `
                <li>CSE Department accounts for <strong>${csePct}%</strong> of all override requests (${cseCnt} of ${total}).</li>
                <li>'Course Full' is the top reason for override requests (<strong>${cfPct}%</strong> of total).</li>
                <li>There are currently <strong>${pending}</strong> pending requests awaiting review.</li>
            `;
        }
    }

    function showSidebar(req) {
        activeRequestId = req.id;
        sideEmpty.style.display  = 'none';
        sideDetail.style.display = 'block';

        sideReqId.textContent = 'OR-' + req.id;
        sideReqId.className = 'badge ' + (req.status === 'Pending' ? 'badge-pending' : req.status === 'Approved' ? 'badge-active' : 'badge-rejected');

        sideName.textContent   = req.name;
        sideMeta.textContent   = `${req.sid} | ${req.dept} | ${req.year}`;
        sideCourse.textContent = req.course;
        sideReason.textContent = req.reason;
        sideDate.textContent   = req.date;

        if (req.status === 'Pending') {
            sideActions.style.display  = 'flex';
            sideResolved.style.display = 'none';
        } else {
            sideActions.style.display  = 'none';
            sideResolved.style.display = 'block';
            if (req.status === 'Approved') {
                sideResolved.style.background   = '#D1FAE5';
                sideResolved.style.color        = '#065F46';
                sideResolved.style.borderColor  = '#A7F3D0';
                sideResolved.innerHTML = `<strong>✓ This request has been Approved.</strong>`;
            } else {
                sideResolved.style.background   = '#FEE2E2';
                sideResolved.style.color        = '#991B1B';
                sideResolved.style.borderColor  = '#FECACA';
                sideResolved.innerHTML = `<strong>✕ This request has been Rejected.</strong>`;
            }
        }

        renderTable(getFilteredRequests());
    }

    function refreshOverridesUI() {
        renderTable(getFilteredRequests());
        updateMetrics();
        updateInsights();
    }

    filterBtn?.addEventListener('click', refreshOverridesUI);
    searchInput?.addEventListener('input', refreshOverridesUI);

    tableBody?.addEventListener('click', (e) => {
        const btn = e.target.closest('.view-btn');
        if (!btn) return;
        const id  = parseInt(btn.getAttribute('data-id'), 10);
        const req = allMappedOverrides.find(r => r.id === id);
        if (req) showSidebar(req);
    });

    btnApprove?.addEventListener('click', async () => {
        if (!activeRequestId) return;
        try {
            const res = await fetch(`${API_BASE}/overrides/${activeRequestId}/status`, {
                method: 'PATCH',
                headers: API_HEADERS,
                body: JSON.stringify({ Approval_Status: 'Approved' })
            });
            if (res.ok) {
                const idx = allMappedOverrides.findIndex(r => r.id === activeRequestId);
                if (idx > -1) allMappedOverrides[idx].status = 'Approved';
                showSidebar(allMappedOverrides[idx]);
                refreshOverridesUI();
            } else {
                alert('Failed to approve request.');
            }
        } catch (err) {
            console.error('API Error:', err);
        }
    });

    btnReject?.addEventListener('click', async () => {
        if (!activeRequestId) return;
        try {
            const res = await fetch(`${API_BASE}/overrides/${activeRequestId}/status`, {
                method: 'PATCH',
                headers: API_HEADERS,
                body: JSON.stringify({ Approval_Status: 'Rejected' })
            });
            if (res.ok) {
                const idx = allMappedOverrides.findIndex(r => r.id === activeRequestId);
                if (idx > -1) allMappedOverrides[idx].status = 'Rejected';
                showSidebar(allMappedOverrides[idx]);
                refreshOverridesUI();
            } else {
                alert('Failed to reject request.');
            }
        } catch (err) {
            console.error('API Error:', err);
        }
    });

    btnMoreInfo?.addEventListener('click', () => {
        if (!activeRequestId) return;
        alert(`📧 A request for more information has been sent to the student regarding OR-${activeRequestId}.`);
    });

    const lastSelected = localStorage.getItem('Lumina_LastOverrideSelected');
    if (lastSelected) {
        const req = allMappedOverrides.find(r => r.id === parseInt(lastSelected, 10));
        if (req) showSidebar(req);
    }

    tableBody?.addEventListener('click', (e) => {
        const btn = e.target.closest('.view-btn');
        if (btn) localStorage.setItem('Lumina_LastOverrideSelected', btn.getAttribute('data-id'));
    });

    refreshOverridesUI();
}

// ==========================================
// ROUTER
// ==========================================

async function initGradesheetsPage() {
    try {
        const [courseRes, regRes] = await Promise.all([
            fetch(`${API_BASE}/courses`, { headers: API_HEADERS }),
            fetch(`${API_BASE}/registrations`, { headers: API_HEADERS })
        ]);
        if (!courseRes.ok || !regRes.ok) throw new Error('Failed to fetch data');
        const courses = await courseRes.json();
        const registrations = await regRes.json();

        const tbody = document.getElementById('gradesheetsTableBody');
        if (!tbody) return;

        let html = '';
        courses.forEach(c => {
            const courseRegs = registrations.filter(r => r.courseId === c.courseId && r.status === 'Enrolled');
            if (courseRegs.length === 0) return; // Skip courses with no enrollments
            
            const withGrades = courseRegs.filter(r => r.finalGrade !== null).length;
            let statusBadge = '<span class="badge badge-pending">Pending</span>';
            if (withGrades > 0) {
                statusBadge = `<span class="badge badge-active">Grades Submitted (${withGrades}/${courseRegs.length})</span>`;
            }

            const term = courseRegs[0].termId;
            
            html += `
                <tr>
                    <td><strong>${c.courseId}</strong></td>
                    <td>${c.courseName}</td>
                    <td><span class="badge badge-upcoming">${term}</span></td>
                    <td>${statusBadge}</td>
                    <td style="color: var(--text-muted);">Just now</td>
                    <td><a href="Dean2_gradesheets-detail.html?courseId=${c.courseId}&termId=${term}" class="btn-view-dark">View Grade Sheet →</a></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch (err) {
        console.error('Failed to load gradesheets:', err);
    }
}

async function initGradesheetsDetailPage() {
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('courseId');
    const termId = params.get('termId');
    
    if (!courseId) {
        document.getElementById('gradesDetailTableBody').innerHTML = '<tr><td colspan="5">No course selected</td></tr>';
        return;
    }

    try {
        const [courseRes, regRes, userRes] = await Promise.all([
            fetch(`${API_BASE}/courses/${courseId}`, { headers: API_HEADERS }),
            fetch(`${API_BASE}/registrations`, { headers: API_HEADERS }),
            fetch(`${API_BASE}/users`, { headers: API_HEADERS })
        ]);
        
        const course = await courseRes.json();
        const registrations = await regRes.json();
        const users = await userRes.json();
        
        document.getElementById('detailCourseTitle').textContent = `Grade Sheet Details: ${course.courseId} - ${course.courseName}`;
        document.getElementById('detailCourseMeta').innerHTML = `${termId} &nbsp;•&nbsp; <span class="badge-awaiting">REVIEW</span>`;
        document.getElementById('detailInnerTitle').textContent = `Grade Sheet Details - ${course.courseId}: ${course.courseName}`;
        document.getElementById('detailInnerMeta').innerHTML = `📅 Term: ${termId} &nbsp;&nbsp;•&nbsp;&nbsp; 🎓 Department of ${course.deptId}`;

        const courseRegs = registrations.filter(r => r.courseId === courseId && r.termId === termId && r.status === 'Enrolled');
        const tbody = document.getElementById('gradesDetailTableBody');
        
        let html = '';
        courseRegs.forEach(r => {
            const student = users.find(u => u.userId === r.studentId) || { fullName: 'Unknown' };
            const grade = r.finalGrade || '-';
            html += `
                <tr>
                    <td style="color:var(--text-muted);">${r.studentId}</td>
                    <td><strong>${student.fullName}</strong></td>
                    <td style="text-align:center; color:var(--text-muted);">${course.credits}</td>
                    <td style="text-align:center;"><span class="grade-badge grade-${grade.replace('+','-plus')}">${grade}</span></td>
                    <td style="text-align:center; color:var(--text-muted);">-</td>
                </tr>
            `;
        });
        tbody.innerHTML = html || '<tr><td colspan="5" style="text-align:center;">No enrollments found.</td></tr>';
    } catch (err) {
        console.error('Failed to load gradesheet details:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.includes('Dean2_policies.html')) {
        initPoliciesPage();
    } else if (path.includes('Dean2_enrollment.html')) {
        initEnrollmentPage();
    } else if (path.includes('Dean2_overrides.html')) {
        initOverridesPage();
    } else if (path.includes('Dean2_gradesheets-detail.html')) {
        initGradesheetsDetailPage();
    } else if (path.includes('Dean2_gradesheets.html')) {
        initGradesheetsPage();
    } else if (path.includes('Dean2_analytics.html')) {
        // Analytics is static, nothing to init
    } else {
        initDashboardPage();
    }
});
