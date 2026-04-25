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
// POLICIES PAGE
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

    function getPolicySettings() {
        const arr = DB.get('Policy_Settings');
        return (arr && arr[0]) ? arr[0] : {
            status: 'Validated', isLocked: false,
            minCredits: 12, maxCredits: 21, maxCourses: 6,
            enforcePrereq: true, allowConditional: false, allowAdvisorOverride: true,
            minGpa: 5.0, financialClearance: true, advisorApproval: true
        };
    }

    function savePolicySettings(settings) { DB.set('Policy_Settings', [settings]); }

    function getTermSettings() {
        const arr = DB.get('Academic_Term_Settings');
        return (arr && arr[0]) ? arr[0] : { academicYear: '', term: 'Spring', isLocked: false };
    }

    function saveTermSettings(settings) { DB.set('Academic_Term_Settings', [settings]); }

    function renderPolicyBanner(ps) {
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
        const logs = DB.get('Policy_Change_Log') || [];
        policyChangeLog.innerHTML = '';
        logs.slice(0, 6).forEach((log, i) => {
            policyChangeLog.insertAdjacentHTML('beforeend', `
                <div class="log-entry">
                    <div class="log-dot ${i === 0 ? 'latest' : ''}"></div>
                    <div class="log-msg">${log.message}</div>
                    <div class="log-meta">By ${log.by} &bull; ${log.time}</div>
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

    function refreshPoliciesUI() {
        const ps = getPolicySettings();
        const ts = getTermSettings();

        if (academicYearInput) academicYearInput.value = ts.academicYear || '';
        if (termSelect) termSelect.value = ts.term || 'Spring';

        if (ts.isLocked) {
            lockTermBtn.style.display = 'none';
            unlockTermBtn.style.display = '';
            termLockedBanner.classList.add('show');
            academicYearInput.disabled = true;
            termSelect.disabled = true;
        } else {
            lockTermBtn.style.display = '';
            unlockTermBtn.style.display = 'none';
            termLockedBanner.classList.remove('show');
            if (!ps.isLocked) {
                academicYearInput.disabled = false;
                termSelect.disabled = false;
            }
        }

        if (minCreditsInput)  minCreditsInput.value    = ps.minCredits;
        if (maxCreditsInput)  maxCreditsInput.value    = ps.maxCredits;
        if (maxCoursesInput)  maxCoursesInput.value    = ps.maxCourses;
        if (togglePrereq)     togglePrereq.checked     = ps.enforcePrereq;
        if (toggleCond)       toggleCond.checked       = ps.allowConditional;
        if (toggleAdvOver)    toggleAdvOver.checked    = ps.allowAdvisorOverride;
        if (minGpaInput)      minGpaInput.value        = ps.minGpa;
        if (toggleFinance)    toggleFinance.checked    = ps.financialClearance;
        if (toggleAdvApprove) toggleAdvApprove.checked = ps.advisorApproval;

        setPolicyFieldsDisabled(ps.isLocked);
        if (!ps.isLocked && ts.isLocked) {
            academicYearInput.disabled = true;
            termSelect.disabled = true;
        }

        renderPolicyBanner(ps);
        renderChangeLog();
    }

    lockTermBtn?.addEventListener('click', () => {
        const ts = getTermSettings();
        const year = academicYearInput.value;
        if (!year) { alert('Please select an Academic Year before locking the term.'); return; }
        ts.academicYear = year;
        ts.term = termSelect.value;
        ts.isLocked = true;
        saveTermSettings(ts);
        addPolicyLog(`Term Locked: ${computeTermLabel(year, ts.term)}`, 'Dr. Jenkins');
        refreshPoliciesUI();
    });

    unlockTermBtn?.addEventListener('click', () => {
        const ts = getTermSettings();
        ts.isLocked = false;
        saveTermSettings(ts);
        addPolicyLog('Term Unlocked', 'Dr. Jenkins');
        refreshPoliciesUI();
    });

    academicYearInput?.addEventListener('change', () => {
        const ts = getTermSettings();
        ts.academicYear = academicYearInput.value;
        saveTermSettings(ts);
        const ps = getPolicySettings();
        if (!ps.isLocked) {
            ps.status = 'Pending';
            savePolicySettings(ps);
            addPolicyLog(`Academic Year changed to ${ts.academicYear}`, 'Dr. Jenkins');
            refreshPoliciesUI();
        }
    });

    termSelect?.addEventListener('change', () => {
        const ts = getTermSettings();
        ts.term = termSelect.value;
        saveTermSettings(ts);
        const ps = getPolicySettings();
        if (!ps.isLocked) {
            ps.status = 'Pending';
            savePolicySettings(ps);
            addPolicyLog(`Term changed to ${ts.term}`, 'Dr. Jenkins');
            refreshPoliciesUI();
        }
    });

    function markPolicyPending(logMsg) {
        const ps = getPolicySettings();
        if (!ps.isLocked) {
            ps.status = 'Pending';
            savePolicySettings(ps);
            addPolicyLog(logMsg, 'Dr. Jenkins');
            renderPolicyBanner(ps);
            renderChangeLog();
        }
    }

    minCreditsInput?.addEventListener('change', () => { const ps = getPolicySettings(); ps.minCredits = parseInt(minCreditsInput.value) || 0; savePolicySettings(ps); markPolicyPending(`Min credits changed to ${minCreditsInput.value}`); });
    maxCreditsInput?.addEventListener('change', () => { const ps = getPolicySettings(); ps.maxCredits = parseInt(maxCreditsInput.value) || 0; savePolicySettings(ps); markPolicyPending(`Max credits changed to ${maxCreditsInput.value}`); });
    maxCoursesInput?.addEventListener('change', () => { const ps = getPolicySettings(); ps.maxCourses = parseInt(maxCoursesInput.value) || 0; savePolicySettings(ps); markPolicyPending(`Max courses changed to ${maxCoursesInput.value}`); });
    togglePrereq?.addEventListener('change', () => { const ps = getPolicySettings(); ps.enforcePrereq = togglePrereq.checked; savePolicySettings(ps); markPolicyPending(`Enforce Prerequisites ${togglePrereq.checked ? 'Enabled' : 'Disabled'}`); });
    toggleCond?.addEventListener('change', () => { const ps = getPolicySettings(); ps.allowConditional = toggleCond.checked; savePolicySettings(ps); markPolicyPending(`Allow Conditional Enrollment ${toggleCond.checked ? 'Enabled' : 'Disabled'}`); });
    toggleAdvOver?.addEventListener('change', () => { const ps = getPolicySettings(); ps.allowAdvisorOverride = toggleAdvOver.checked; savePolicySettings(ps); markPolicyPending(`Allow Advisor Override ${toggleAdvOver.checked ? 'Enabled' : 'Disabled'}`); });
    minGpaInput?.addEventListener('change', () => { const ps = getPolicySettings(); ps.minGpa = parseFloat(minGpaInput.value) || 0; savePolicySettings(ps); markPolicyPending(`Min GPA changed to ${minGpaInput.value}`); });
    toggleFinance?.addEventListener('change', () => { const ps = getPolicySettings(); ps.financialClearance = toggleFinance.checked; savePolicySettings(ps); markPolicyPending(`Financial Clearance ${toggleFinance.checked ? 'Enabled' : 'Disabled'}`); });
    toggleAdvApprove?.addEventListener('change', () => { const ps = getPolicySettings(); ps.advisorApproval = toggleAdvApprove.checked; savePolicySettings(ps); markPolicyPending(`Advisor Approval ${toggleAdvApprove.checked ? 'Enabled' : 'Disabled'}`); });

    validateBtn?.addEventListener('click', () => {
        const ps = getPolicySettings();
        if (ps.isLocked) { alert('Policies are locked. Unlock before validating.'); return; }
        ps.status = 'Validated';
        savePolicySettings(ps);
        addPolicyLog('Policies Validated', 'Dr. Jenkins');
        refreshPoliciesUI();
    });

    lockPoliciesBtn?.addEventListener('click', () => {
        const ps = getPolicySettings();
        ps.isLocked = true;
        savePolicySettings(ps);
        addPolicyLog('Policies Locked', 'Dr. Jenkins');
        refreshPoliciesUI();
    });

    unlockPoliciesBtn?.addEventListener('click', () => {
        const ps = getPolicySettings();
        ps.isLocked = false;
        savePolicySettings(ps);
        addPolicyLog('Policies Unlocked', 'Dr. Jenkins');
        refreshPoliciesUI();
    });

    refreshPoliciesUI();
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
                    <td>${phase.eligible}</td>
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

    function refreshEnrollmentUI() {
        const s = getSettings();
        const phases = DB.get('Enrollment_Phases') || [];

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
        if (activePhaseEligible) activePhaseEligible.textContent = activePhase ? activePhase.eligible + ' Students' : 'N/A';

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

        let phases = DB.get('Enrollment_Phases') || [];
        if (status === 'Active') phases.forEach(p => { if (p.status === 'Active') p.status = 'Upcoming'; });

        if (editingId !== null) {
            const idx = phases.findIndex(p => p.id === editingId);
            if (idx > -1) phases[idx] = { ...phases[idx], name, eligible: yr, timeline: tm, status };
        } else {
            phases.push({ id: Date.now(), name, eligible: yr, timeline: tm, status });
        }

        DB.set('Enrollment_Phases', phases);
        phaseModal.classList.remove('show');
        refreshEnrollmentUI();
    });

    phaseTableBody?.addEventListener('click', (e) => {
        const editBtn = e.target.closest('[data-edit]');
        const deleteBtn = e.target.closest('[data-delete]');

        if (deleteBtn) {
            const id = parseInt(deleteBtn.getAttribute('data-delete'));
            if (confirm('Delete this phase?')) {
                DB.set('Enrollment_Phases', DB.get('Enrollment_Phases').filter(p => p.id !== id));
                refreshEnrollmentUI();
            }
        }

        if (editBtn) {
            const id = parseInt(editBtn.getAttribute('data-edit'));
            const phase = (DB.get('Enrollment_Phases') || []).find(p => p.id === id);
            if (phase) {
                editingId = id;
                modalTitle.textContent = 'Edit Enrollment Phase';
                modalPhaseName.value = phase.name;
                modalYear.value = phase.eligible;
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
function initDashboardPage() {
    const settings  = (DB.get('Enrollment_Settings') || [])[0] || {};
    const phases    = DB.get('Enrollment_Phases') || [];
    const ts        = (DB.get('Academic_Term_Settings') || [])[0] || {};
    const ps        = (DB.get('Policy_Settings') || [])[0] || {};
    const overrides = DB.get('Override_Requests') || [];

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
        dashPendingOverrides.textContent = overrides.filter(r => r.status === 'Pending').length;
    }
}

// ==========================================
// OVERRIDES PAGE
// ==========================================
function initOverridesPage() {
    const defaultRequests = [
        { id: 'OR-1042', name: 'John Miller',   sid: 'S1023', dept: 'CSE',  year: '3rd Year', course: 'CSE302 (Data Structures)',  reason: 'Course Full (Needs seat override)',  date: 'August 12, 2025', status: 'Pending'  },
        { id: 'OR-1088', name: 'Alice Smith',   sid: 'S1045', dept: 'ECE',  year: '2nd Year', course: 'ECE201 (Signals & Systems)', reason: 'Missing Prerequisite (Math 101)',    date: 'August 11, 2025', status: 'Approved' },
        { id: 'OR-1102', name: 'Michael Brown', sid: 'S1089', dept: 'AIDS', year: '3rd Year', course: 'CS301 (Thermodynamics)',      reason: 'Schedule Time Conflict',            date: 'August 10, 2025', status: 'Rejected' },
        { id: 'OR-1105', name: 'Priya Sharma',  sid: 'S1101', dept: 'CSE',  year: '2nd Year', course: 'CSE201 (Algorithms)',         reason: 'Course Full (Needs seat override)',  date: 'August 13, 2025', status: 'Pending'  },
        { id: 'OR-1110', name: 'Rahul Verma',   sid: 'S1115', dept: 'ECE',  year: '4th Year', course: 'ECE401 (VLSI Design)',        reason: 'Missing Prerequisite (ECE301)',      date: 'August 13, 2025', status: 'Pending'  }
    ];

    const existing = DB.get('Override_Requests');
    if (!existing || existing.length === 0) DB.set('Override_Requests', defaultRequests);

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

    let activeRequestId = null;

    function getFilteredRequests() {
        let requests = DB.get('Override_Requests') || [];
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
        const all = DB.get('Override_Requests') || [];
        if (metricPending)  metricPending.textContent  = all.filter(r => r.status === 'Pending').length;
        if (metricApproved) metricApproved.textContent = all.filter(r => r.status === 'Approved').length;
        if (metricRejected) metricRejected.textContent = all.filter(r => r.status === 'Rejected').length;
    }

    function updateInsights() {
        const all = DB.get('Override_Requests') || [];
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

        sideReqId.textContent = req.id;
        sideReqId.className = 'badge ' + (req.status === 'Pending' ? 'badge-pending' : req.status === 'Approved' ? 'badge-active' : 'badge-rejected');

        sideName.textContent   = req.name;
        sideMeta.textContent   = `${req.sid} | ${req.dept} | ${req.year}`;
        sideCourse.textContent = req.course;
        sideReason.textContent = req.reason;
        sideDate.textContent   = req.date;

        if (req.status === 'Pending') {
            sideActions.style.display  = 'flex';
            sideResolved.style.display = 'block';
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
        const id  = btn.getAttribute('data-id');
        const req = (DB.get('Override_Requests') || []).find(r => r.id === id);
        if (req) showSidebar(req);
    });

    btnApprove?.addEventListener('click', () => {
        if (!activeRequestId) return;
        let requests = DB.get('Override_Requests') || [];
        const idx = requests.findIndex(r => r.id === activeRequestId);
        if (idx > -1) {
            requests[idx].status = 'Approved';
            DB.set('Override_Requests', requests);
            showSidebar(requests[idx]);
            refreshOverridesUI();
        }
    });

    btnReject?.addEventListener('click', () => {
        if (!activeRequestId) return;
        let requests = DB.get('Override_Requests') || [];
        const idx = requests.findIndex(r => r.id === activeRequestId);
        if (idx > -1) {
            requests[idx].status = 'Rejected';
            DB.set('Override_Requests', requests);
            showSidebar(requests[idx]);
            refreshOverridesUI();
        }
    });

    btnMoreInfo?.addEventListener('click', () => {
        if (!activeRequestId) return;
        alert(`📧 A request for more information has been sent to the student regarding ${activeRequestId}.`);
    });

    const lastSelected = localStorage.getItem('Lumina_LastOverrideSelected');
    if (lastSelected) {
        const req = (DB.get('Override_Requests') || []).find(r => r.id === lastSelected);
        if (req) showSidebar(req);
    }

    tableBody?.addEventListener('click', (e) => {
        const btn = e.target.closest('.view-btn');
        if (btn) localStorage.setItem('Lumina_LastOverrideSelected', btn.getAttribute('data-id'));
    });

    refreshOverridesUI();
}

// ==========================================
// ROUTER  ← only this section changed
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.includes('Dean2_policies.html')) {
        initPoliciesPage();
    } else if (path.includes('Dean2_enrollment.html')) {
        initEnrollmentPage();
    } else if (path.includes('Dean2_overrides.html')) {
        initOverridesPage();
    } else if (path.includes('Dean2_analytics.html')) {
        // Analytics is static, nothing to init
    } else {
        // Covers Dean2_index.html, Dean2_gradesheets.html, Dean2_gradesheets-detail.html
        initDashboardPage();
    }
}); 
