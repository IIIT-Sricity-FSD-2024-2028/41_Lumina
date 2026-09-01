/* ==========================================================================
   DEAN DASHBOARD LOGIC (dean.js) — Backend-Driven
   ========================================================================== */

const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SESSION PROTECTION ---
    const sessionData = localStorage.getItem('Lumina_Session');
    if (!sessionData) {
        window.location.href = 'login.html';
        return;
    }
    const currentUser = JSON.parse(sessionData);
    if (currentUser.Role !== 'Dean') {
        window.location.href = 'login.html';
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        ...(currentUser && currentUser.accessToken ? { 'Authorization': `Bearer ${currentUser.accessToken}` } : {}),
        'x-role': currentUser.Role,
    };


    // Logout logic
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('Lumina_Session');
        window.location.href = 'login.html';
    });

    // --- 2. IN-MEMORY DATA ARRAYS (populated from backend) ---
    let users = [];
    let courses = [];
    let registrations = [];

    // --- 3. SYSTEM DIRECTORY (FULL CRUD ENGINE) ---
    const tableBody = document.getElementById('user-table-body');
    const modal = document.getElementById('crud-modal');
    const crudForm = document.getElementById('crud-form');
    const modalTitle = document.getElementById('modal-title');
    const btnDelete = document.getElementById('delete-btn');

    const inputId = document.getElementById('modal-id');
    const inputName = document.getElementById('modal-name');
    const inputEmail = document.getElementById('modal-email');
    const inputRole = document.getElementById('modal-role');
    const inputDept = document.getElementById('modal-dept');

    let isEditing = false;

    // RENDER TABLE (uses camelCase keys from backend)
    function renderTable() {
        tableBody.innerHTML = '';
        users.forEach(user => {
            const rowHTML = `
                <tr style="border-bottom: 1px solid #e5e7eb; transition: background-color 0.2s;">
                    <td style="padding: 12px 8px; font-weight: 500; color: #111827;">${user.userId}</td>
                    <td style="padding: 12px 8px; color: #4b5563;">${user.fullName}</td>
                    <td style="padding: 12px 8px;">
                        <span style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; border: 1px solid #e5e7eb;">
                            ${user.role.replace(/_/g, ' ')}
                        </span>
                    </td>
                    <td style="padding: 12px 8px;">
                        <button class="btn-outline btn-sm" onclick="openModal('${user.userId}')">Manage</button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', rowHTML);
        });
    }

    // RENDER ASSISTANT DEANS
    function renderAssistantDeans() {
        const assistantDeans = users.filter(u => u.role && u.role.includes('Assistant_Dean'));
        const deansListContainer = document.getElementById('assistant-deans-list');
        deansListContainer.innerHTML = '';

        assistantDeans.forEach(dean => {
            const cleanRoleName = dean.role.replace(/_/g, ' ');
            deansListContainer.innerHTML += `
                <div class="dean-row">
                    <div class="dean-info">
                        <div class="dean-avatar"></div>
                        ${dean.fullName} (${cleanRoleName})
                    </div>
                    <span class="badge-active">ACTIVE</span>
                </div>
            `;
        });
    }

    // RENDER ENROLLMENT STATISTICS
    function renderStats() {
        const totalCourses = courses.length;
        const availableCourses = courses.filter(course => {
            const enrolledInCourse = registrations.filter(r => r.courseId === course.courseId).length;
            return enrolledInCourse < course.courseCapacity;
        });

        const availablePercent = totalCourses > 0
            ? Math.round((availableCourses.length / totalCourses) * 100)
            : 0;

        document.getElementById('course-availability-percent').innerText = `${availablePercent}%`;
        document.getElementById('course-bar').style.width = `${availablePercent}%`;
        document.getElementById('course-availability-text').innerText = `${availableCourses.length} of ${totalCourses} courses have open seats`;

        const uniqueStudentsEnrolled = new Set(registrations.map(r => r.studentId)).size;
        const instituteCap = 2000;
        const studentPercent = Math.round((uniqueStudentsEnrolled / instituteCap) * 100);

        document.getElementById('student-enrollment-count').innerText = `${uniqueStudentsEnrolled}/${instituteCap}`;
        document.getElementById('student-bar').style.width = `${studentPercent}%`;
        document.getElementById('student-enrollment-text').innerText = `${studentPercent}% of total university capacity reached`;
    }

    // OPEN MODAL
    window.openModal = function (userId = null) {

        inputRole.innerHTML = `
            <option value="Student">Student</option>
            <option value="Faculty">Faculty</option>
            <option value="Assistant_Dean_1">Assistant Dean 1</option>
            <option value="Assistant_Dean_2">Assistant Dean 2</option>
        `;

        if (userId) {
            isEditing = true;
            modalTitle.innerText = "Edit User Details";
            const targetUser = users.find(u => u.userId === userId);

            inputId.value = targetUser.userId;
            inputId.disabled = true;
            inputId.style.backgroundColor = "#f3f4f6";

            inputName.value = targetUser.fullName;
            inputEmail.value = targetUser.email;
            inputDept.value = targetUser.deptId;

            if (userId === currentUser.User_ID) {
                inputRole.innerHTML += `<option value="Dean">Dean</option>`;
                inputRole.value = "Dean";
                inputRole.disabled = true;
                inputRole.style.backgroundColor = "#f3f4f6";
                btnDelete.classList.add('hidden');
            } else {
                inputRole.value = targetUser.role;
                inputRole.disabled = false;
                inputRole.style.backgroundColor = "#ffffff";
                btnDelete.classList.remove('hidden');
            }
        } else {
            isEditing = false;
            modalTitle.innerText = "Add New User";
            crudForm.reset();

            inputId.disabled = false;
            inputId.style.backgroundColor = "#ffffff";
            inputRole.disabled = false;
            inputRole.style.backgroundColor = "#ffffff";
            btnDelete.classList.add('hidden');
        }

        modal.classList.remove('hidden');
    };

    // CLOSE MODAL
    function closeModal() {
        modal.classList.add('hidden');
    }

    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('cancel-btn').addEventListener('click', closeModal);
    document.getElementById('add-user-btn').addEventListener('click', () => openModal(null));

    // SAVE USER (POST for create, PUT for update → backend)
    crudForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            if (isEditing) {
                const res = await fetch(`${API_BASE}/users/${inputId.value.trim()}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({
                        Full_Name: inputName.value.trim(),
                        Email: inputEmail.value.trim(),
                        Role: inputRole.value,
                        Dept_ID: inputDept.value,
                    }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    alert(`Update failed: ${err.message}`);
                    return;
                }

                const updatedUser = await res.json();
                const idx = users.findIndex(u => u.userId === updatedUser.userId);
                if (idx !== -1) users[idx] = updatedUser;

                if (updatedUser.userId === currentUser.User_ID) {
                    currentUser.Full_Name = updatedUser.fullName;
                    localStorage.setItem('Lumina_Session', JSON.stringify(currentUser));
                }
            } else {
                const res = await fetch(`${API_BASE}/users`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        User_ID: inputId.value.trim(),
                        Full_Name: inputName.value.trim(),
                        Email: inputEmail.value.trim(),
                        Password: 'password123',
                        Role: inputRole.value,
                        Dept_ID: inputDept.value,
                    }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    alert(`Create failed: ${err.message}`);
                    return;
                }

                const newUser = await res.json();
                users.push(newUser);
            }

            renderTable();
            closeModal();
        } catch (err) {
            console.error('Save error:', err);
            alert('Network error. Please check the backend connection.');
        }
    });

    // DELETE USER (DELETE /users/:id → backend)
    btnDelete.addEventListener('click', async (e) => {
        e.preventDefault();

        if (inputId.value === currentUser.User_ID) {
            alert("You cannot delete your own active session.");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/users/${inputId.value}`, {
                method: 'DELETE',
                headers,
            });

            if (!res.ok) {
                const err = await res.json();
                alert(`Delete failed: ${err.message}`);
                return;
            }

            const index = users.findIndex(u => u.userId === inputId.value);
            if (index > -1) users.splice(index, 1);

            renderTable();
            closeModal();
        } catch (err) {
            console.error('Delete error:', err);
            alert('Network error. Please check the backend connection.');
        }
    });

    // --- 4. DOWNLOAD FORMS TOAST LOGIC ---
    const downloadLink = document.getElementById('download-forms-link');
    const downloadToast = document.getElementById('download-toast');
    const closeToastBtn = document.getElementById('close-download-toast');
    let toastTimeout;

    downloadLink.addEventListener('click', (e) => {
        e.preventDefault();
        downloadToast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => { downloadToast.classList.remove('show'); }, 4000);
    });

    closeToastBtn.addEventListener('click', () => {
        downloadToast.classList.remove('show');
        clearTimeout(toastTimeout);
    });

    // --- 5. IMPORT DATA BUTTON LOGIC ---
    const importBtn = document.getElementById('import-data-btn');
    const importToast = document.getElementById('import-toast');
    const closeImportToastBtn = document.getElementById('close-import-toast');
    let importToastTimeout;

    importBtn.addEventListener('click', (e) => {
        e.preventDefault();
        importToast.classList.add('show');
        clearTimeout(importToastTimeout);
        importToastTimeout = setTimeout(() => { importToast.classList.remove('show'); }, 4000);
    });

    closeImportToastBtn.addEventListener('click', () => {
        importToast.classList.remove('show');
        clearTimeout(importToastTimeout);
    });

    // --- 6. FETCH REVENUE DATA FROM BACKEND & RENDER ---
    let cachedClearanceRoster = [];
    let currentClearanceFilter = 'all';

    async function renderRevenueMetrics() {
        try {
            const res = await fetch(`${API_BASE}/revenue/summary`, { headers });
            if (!res.ok) return;
            const rev = await res.json();

            const billedEl = document.getElementById('revenue-total-billed');
            const collectedEl = document.getElementById('revenue-total-collected');
            const barEl = document.getElementById('revenue-bar');
            const textEl = document.getElementById('revenue-collection-text');
            const tierEl = document.getElementById('revenue-saas-tier');
            const mrrEl = document.getElementById('revenue-saas-mrr');

            const targetTuition = rev.totalTuitionTarget || rev.totalGrossRevenue || 3125000;
            if (billedEl) billedEl.textContent = `$${targetTuition.toLocaleString()}`;
            if (collectedEl) collectedEl.textContent = `$${rev.totalFeesCollected.toLocaleString()} (${rev.collectionRatePercent}%)`;
            if (barEl) barEl.style.width = `${Math.min(100, rev.collectionRatePercent)}%`;
            if (textEl) textEl.textContent = `${(rev.clearedStudentsCount || 0) + (rev.waivedStudentsCount || 0)} of ${rev.totalStudentsEnrolled} Students Cleared ($2,500 Flat Fee)`;

            const activePlan = rev.activeSaasPlan || {};
            const tierName = activePlan.tier || 'Enterprise';
            const mrr = activePlan.monthlyRecurringRevenue || 8999;
            const arr = activePlan.annualRecurringRevenue || (mrr * 12);

            if (tierEl) tierEl.textContent = `${tierName} Plan`;
            if (mrrEl) mrrEl.textContent = `$${mrr.toLocaleString()} / mo (ARR: $${arr.toLocaleString()})`;

            // Sync radio button in modal
            const radios = document.querySelectorAll('input[name="saas-tier-radio"]');
            radios.forEach(r => {
                if (r.value.toLowerCase() === tierName.toLowerCase()) {
                    r.checked = true;
                }
            });

            if (rev.studentClearanceRoster) {
                cachedClearanceRoster = rev.studentClearanceRoster;
                renderClearanceRosterTable();
            }
        } catch (err) {
            console.warn('Revenue metrics unavailable:', err);
        }
    }

    async function loadClearanceRoster() {
        try {
            const res = await fetch(`${API_BASE}/revenue/students/clearance-roster`, { headers });
            if (!res.ok) return;
            cachedClearanceRoster = await res.json();
            renderClearanceRosterTable();
        } catch (err) {
            console.warn('Could not load clearance roster:', err);
        }
    }

    function renderClearanceRosterTable() {
        const tbody = document.getElementById('clearance-table-body');
        if (!tbody) return;

        // Update counts on filter buttons
        const total = cachedClearanceRoster.length;
        const cleared = cachedClearanceRoster.filter(s => s.status === 'Cleared').length;
        const pending = cachedClearanceRoster.filter(s => s.status === 'Pending').length;
        const waived = cachedClearanceRoster.filter(s => s.status === 'Waived').length;

        const countAll = document.getElementById('count-all');
        const countCleared = document.getElementById('count-cleared');
        const countPending = document.getElementById('count-pending');
        const countWaived = document.getElementById('count-waived');

        if (countAll) countAll.textContent = total;
        if (countCleared) countCleared.textContent = cleared;
        if (countPending) countPending.textContent = pending;
        if (countWaived) countWaived.textContent = waived;

        let filtered = cachedClearanceRoster;
        if (currentClearanceFilter !== 'all') {
            filtered = cachedClearanceRoster.filter(s => s.status === currentClearanceFilter);
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: #94a3b8;">No student records found matching this filter.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(item => {
            let statusBadge = '';
            let actionHtml = '';

            if (item.status === 'Cleared') {
                statusBadge = `<span class="status-badge" style="background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0; font-weight:700;">✅ Cleared</span>`;
                actionHtml = `<span style="font-size:0.75rem; color:#059669; font-family:monospace;">${item.transactionId || 'PAID'}</span>`;
            } else if (item.status === 'Waived') {
                statusBadge = `<span class="status-badge" style="background:#f5f3ff; color:#6d28d9; border:1px solid #ddd6fe; font-weight:700;">🎓 Waived</span>`;
                actionHtml = `<span style="font-size:0.75rem; color:#7c3aed; font-weight:600;" title="${item.waiverReason || ''}">${item.waiverReason || 'Scholarship Waiver'}</span>`;
            } else {
                statusBadge = `<span class="status-badge" style="background:#fef2f2; color:#991b1b; border:1px solid #fecaca; font-weight:700;">⚠️ Fee Hold Active</span>`;
                actionHtml = `
                    <div style="display: flex; gap: 6px;">
                        <button type="button" class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem; color: #16a34a; border-color: #86efac; background: #f0fdf4; font-weight: 700; cursor: pointer;" onclick="recordStudentPayment('${item.studentId}', '${item.fullName.replace(/'/g, "\\'")}')">
                            💳 Mark Paid
                        </button>
                        <button type="button" class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem; color: #7c3aed; border-color: #c4b5fd; background: #f5f3ff; font-weight: 700; cursor: pointer;" onclick="grantHoldWaiver('${item.studentId}', '${item.fullName.replace(/'/g, "\\'")}')">
                            🎓 Waive Hold
                        </button>
                    </div>
                `;
            }

            return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 8px;">
                    <div style="font-weight: 700; color: #0f172a; font-size: 0.88rem;">${item.fullName}</div>
                    <code style="font-size: 0.72rem; color: #64748b; font-family: monospace;">${item.studentId}</code>
                </td>
                <td style="padding: 10px 8px; font-size: 0.85rem; color: #334155;">
                    <strong>${item.deptId}</strong> · Semester ${item.semester}
                </td>
                <td style="padding: 10px 8px; font-weight: 700; color: #0f172a;">
                    $${(item.totalSemesterFee || 2500).toLocaleString()}
                </td>
                <td style="padding: 10px 8px; font-weight: 700; color: #16a34a;">
                    $${item.amountPaid.toLocaleString()}
                </td>
                <td style="padding: 10px 8px; font-weight: 700; color: ${item.balanceDue > 0 ? '#b91c1c' : '#059669'};">
                    $${item.balanceDue.toLocaleString()}
                </td>
                <td style="padding: 10px 8px;">
                    ${statusBadge}
                </td>
                <td style="padding: 10px 8px;">
                    ${actionHtml}
                </td>
            </tr>
            `;
        }).join('');
    }

    window.filterClearanceRoster = function(filter) {
        currentClearanceFilter = filter;
        document.querySelectorAll('#clearance-filter-buttons button').forEach(btn => {
            if (btn.dataset.filter === filter) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        renderClearanceRosterTable();
    };

    window.recordStudentPayment = async function(studentId, studentName) {
        try {
            const res = await fetch(`${API_BASE}/revenue/student/${studentId}/pay`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ amount: 2500 }),
            });
            if (!res.ok) throw new Error('Failed to record payment');
            const receipt = await res.json();
            showSaasToast(`💳 Payment recorded for ${studentName} ($2,500)! Registration hold cleared.`);
            await renderRevenueMetrics();
            await loadClearanceRoster();
        } catch (err) {
            showSaasToast(`❌ Error recording payment: ${err.message}`, true);
        }
    };

    window.grantHoldWaiver = async function(studentId, studentName) {
        const reason = prompt(`Enter financial hold waiver reason for ${studentName}:`, 'Dean Academic Merit Scholarship Waiver');
        if (!reason) return;

        try {
            const res = await fetch(`${API_BASE}/revenue/student/${studentId}/waive-hold`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ waiverReason: reason }),
            });
            if (!res.ok) throw new Error('Failed to grant waiver');
            showSaasToast(`🎓 Financial hold waived for ${studentName} (${reason})!`);
            await renderRevenueMetrics();
            await loadClearanceRoster();
        } catch (err) {
            showSaasToast(`❌ Error granting waiver: ${err.message}`, true);
        }
    };

    // --- SaaS Modal & Proration Engine ---
    const saasModal = document.getElementById('saas-modal');
    const manageTierBtn = document.getElementById('manage-tier-btn');
    const closeSaasModalBtn = document.getElementById('close-saas-modal-btn');
    const cancelSaasBtn = document.getElementById('cancel-saas-btn');
    const saveSaasBtn = document.getElementById('save-saas-btn');
    const cancelSubBtn = document.getElementById('cancel-sub-btn');
    const btnCycleMonthly = document.getElementById('billing-cycle-monthly');
    const btnCycleAnnual = document.getElementById('billing-cycle-annual');
    let currentBillingCycle = 'annual';

    function setBillingCycle(cycle) {
        currentBillingCycle = cycle;
        if (cycle === 'annual') {
            if (btnCycleAnnual) {
                btnCycleAnnual.style.background = '#3b82f6';
                btnCycleAnnual.style.color = '#ffffff';
                btnCycleAnnual.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }
            if (btnCycleMonthly) {
                btnCycleMonthly.style.background = 'transparent';
                btnCycleMonthly.style.color = '#64748b';
                btnCycleMonthly.style.boxShadow = 'none';
            }
            document.getElementById('starter-price-desc').textContent = '$999 / mo ($11,988 / yr) — Core Course Slots & Registration';
            document.getElementById('campus-price-desc').textContent = '$2,499 / mo ($29,988 / yr) — Adds Prerequisites & Gradebook';
            document.getElementById('enterprise-price-desc').textContent = '$5,999 / mo ($71,988 / yr) — 99.99% SLA, SPOC & Audit Logs';
        } else {
            if (btnCycleMonthly) {
                btnCycleMonthly.style.background = '#3b82f6';
                btnCycleMonthly.style.color = '#ffffff';
                btnCycleMonthly.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }
            if (btnCycleAnnual) {
                btnCycleAnnual.style.background = 'transparent';
                btnCycleAnnual.style.color = '#64748b';
                btnCycleAnnual.style.boxShadow = 'none';
            }
            document.getElementById('starter-price-desc').textContent = '$1,499 / mo ($17,988 / yr) — Month-to-Month Flexibility';
            document.getElementById('campus-price-desc').textContent = '$3,499 / mo ($41,988 / yr) — Month-to-Month Flexibility';
            document.getElementById('enterprise-price-desc').textContent = '$8,999 / mo ($107,988 / yr) — Month-to-Month Flexibility';
        }
        const selected = document.querySelector('input[name="saas-tier-radio"]:checked');
        updateProrationPreview(selected ? selected.value : 'Enterprise');
    }

    if (btnCycleMonthly) btnCycleMonthly.addEventListener('click', () => setBillingCycle('monthly'));
    if (btnCycleAnnual) btnCycleAnnual.addEventListener('click', () => setBillingCycle('annual'));

    async function updateProrationPreview(targetTier) {
        try {
            const res = await fetch(`${API_BASE}/revenue/tier/proration-preview?targetTier=${targetTier}&billingCycle=${currentBillingCycle}`, { headers });
            if (!res.ok) return;
            const data = await res.json();

            const badgeEl = document.getElementById('proration-badge');
            const summaryBox = document.getElementById('proration-summary-box');
            const renewalFormatted = new Date(data.newRenewalDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            if (summaryBox) {
                if (data.action === 'DOWNGRADE') {
                    summaryBox.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                          <span style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: #475569; letter-spacing: 0.5px;">⚡ Subscription Schedule</span>
                          <span id="proration-badge" style="font-size: 0.75rem; background: #fef3c7; color: #92400e; font-weight: 700; padding: 2px 8px; border-radius: 4px;">SCHEDULED DOWNGRADE</span>
                        </div>
                        <div style="font-size: 0.85rem; color: #334155; margin-bottom: 6px;">
                          Your university retains full <strong>${data.currentPlanName}</strong> features until the current prepaid term ends on <strong>${renewalFormatted}</strong>.
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 0.95rem; font-weight: 700; color: #0f172a;">
                          <span>Amount Charged Today:</span>
                          <span style="font-size: 1.15rem; color: #16a34a;">$0.00 (No Charge)</span>
                        </div>
                        <div style="margin-top: 6px; font-size: 0.75rem; color: #64748b;">
                          New price ($${data.targetPrice.toLocaleString()}/mo) will apply starting on ${renewalFormatted}.
                        </div>
                    `;
                } else if (data.action === 'UPGRADE') {
                    summaryBox.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                          <span style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: #475569; letter-spacing: 0.5px;">⚡ Prorated Billing Calculation</span>
                          <span id="proration-badge" style="font-size: 0.75rem; background: #dbeafe; color: #1e40af; font-weight: 700; padding: 2px 8px; border-radius: 4px;">IMMEDIATE UPGRADE</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #334155; margin-bottom: 4px;">
                          <span>Unused Credit on Current Plan:</span>
                          <span style="color: #16a34a; font-weight: 600;">-$${data.unusedCredit.toLocaleString()}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">
                          <span>New Plan Charge (Remaining Days):</span>
                          <span style="font-weight: 600;">$${data.newPlanRemainingCost.toLocaleString()}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 0.95rem; font-weight: 700; color: #0f172a;">
                          <span>Net Amount Charged Today:</span>
                          <span style="font-size: 1.15rem; color: #2563eb;">$${data.netAmountToPay.toLocaleString()}</span>
                        </div>
                        <div style="margin-top: 6px; font-size: 0.75rem; color: #64748b;">
                          New ${currentBillingCycle === 'annual' ? 'Annual' : 'Monthly'} Renewal: ${renewalFormatted} (Unlocks immediately!)
                        </div>
                    `;
                } else {
                    summaryBox.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                          <span style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: #475569; letter-spacing: 0.5px;">⚡ Contract Term Renewal</span>
                          <span id="proration-badge" style="font-size: 0.75rem; background: #dcfce7; color: #166534; font-weight: 700; padding: 2px 8px; border-radius: 4px;">RENEWAL</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #334155; margin-bottom: 6px;">
                          <span>Plan Renewal Fee (${currentBillingCycle === 'annual' ? '1-Year' : '1-Month'} Term):</span>
                          <span style="font-weight: 600;">$${data.netAmountToPay.toLocaleString()}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 0.95rem; font-weight: 700; color: #0f172a;">
                          <span>Total Billed Today:</span>
                          <span style="font-size: 1.15rem; color: #2563eb;">$${data.netAmountToPay.toLocaleString()}</span>
                        </div>
                        <div style="margin-top: 6px; font-size: 0.75rem; color: #64748b;">
                          Extended Expiration Date: ${renewalFormatted}
                        </div>
                    `;
                }
            }

            if (saveSaasBtn) {
                if (data.action === 'UPGRADE') {
                    saveSaasBtn.textContent = `💳 Pay $${data.netAmountToPay.toLocaleString()} & Upgrade Immediately`;
                    saveSaasBtn.style.background = '#2563eb';
                } else if (data.action === 'DOWNGRADE') {
                    saveSaasBtn.textContent = `🗓️ Schedule Downgrade for ${renewalFormatted}`;
                    saveSaasBtn.style.background = '#0f172a';
                } else {
                    saveSaasBtn.textContent = `💳 Pay $${data.netAmountToPay.toLocaleString()} & Renew Subscription`;
                    saveSaasBtn.style.background = '#16a34a';
                }
            }

            // Highlight selected tier card
            ['starter', 'campus', 'enterprise'].forEach(t => {
                const label = document.getElementById(`tier-label-${t}`);
                if (label) {
                    if (t === targetTier.toLowerCase()) {
                        label.style.borderColor = '#3b82f6';
                        label.style.background = '#eff6ff';
                    } else {
                        label.style.borderColor = '#e2e8f0';
                        label.style.background = '#ffffff';
                    }
                }
            });
        } catch (err) {
            console.warn('Proration calculation unavailable:', err);
        }
    }

    // Attach change listener to radio buttons
    const tierRadios = document.querySelectorAll('input[name="saas-tier-radio"]');
    tierRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                updateProrationPreview(e.target.value);
            }
        });
    });

    if (manageTierBtn && saasModal) {
        manageTierBtn.addEventListener('click', () => {
            saasModal.classList.remove('hidden');
            const selected = document.querySelector('input[name="saas-tier-radio"]:checked');
            updateProrationPreview(selected ? selected.value : 'Enterprise');
        });
    }

    function closeSaasModal() {
        if (saasModal) saasModal.classList.add('hidden');
    }

    if (closeSaasModalBtn) closeSaasModalBtn.addEventListener('click', closeSaasModal);
    if (cancelSaasBtn) cancelSaasBtn.addEventListener('click', closeSaasModal);
    if (saasModal) {
        saasModal.addEventListener('click', (e) => {
            if (e.target === saasModal) closeSaasModal();
        });
    }

    if (saveSaasBtn) {
        saveSaasBtn.addEventListener('click', async () => {
            const selectedRadio = document.querySelector('input[name="saas-tier-radio"]:checked');
            if (!selectedRadio) return;
            const chosenTier = selectedRadio.value;

            try {
                saveSaasBtn.disabled = true;
                saveSaasBtn.textContent = 'Processing Payment with Gateway...';

                const res = await fetch(`${API_BASE}/revenue/tier`, {
                    method: 'POST',
                    headers: {
                        ...headers,
                        'Content-Type': 'application/json',
                        'x-role': 'Dean',
                    },
                    body: JSON.stringify({ tier: chosenTier, billingCycle: currentBillingCycle }),
                });

                if (!res.ok) throw new Error('Failed to process payment & update subscription');
                const receipt = await res.json();

                closeSaasModal();
                await renderRevenueMetrics();

                // Show custom toast notification with real Transaction ID
                const txnMsg = receipt.transactionId
                    ? `✅ Payment Confirmed (${receipt.transactionId})! Institutional subscription updated to the ${chosenTier} Plan!`
                    : `✅ Institutional SaaS Subscription updated to the ${chosenTier} Plan!`;
                showSaasToast(txnMsg);
            } catch (err) {
                console.error(err);
                showSaasToast(`❌ Error processing payment: ${err.message}`, true);
            } finally {
                saveSaasBtn.disabled = false;
                updateProrationPreview(chosenTier);
            }
        });
    }

    // --- Dedicated Cancel Modal & Grace Period Event Listeners ---
    const cancelModal = document.getElementById('cancel-modal');
    const openCancelModalBtn = document.getElementById('open-cancel-modal-btn');
    const closeCancelModalBtn = document.getElementById('close-cancel-modal-btn');
    const cancelModalBackBtn = document.getElementById('cancel-modal-back-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    const simulateGraceBtn = document.getElementById('simulate-grace-btn');
    const graceBanner = document.getElementById('grace-period-banner');
    const graceBannerText = document.getElementById('grace-banner-text');
    const downloadArchiveBtn = document.getElementById('download-archive-btn');
    const reactivateLicenseBtn = document.getElementById('reactivate-license-btn');

    if (openCancelModalBtn && cancelModal) {
        openCancelModalBtn.addEventListener('click', async () => {
            try {
                const res = await fetch(`${API_BASE}/revenue/tier`);
                if (res.ok) {
                    const data = await res.json();
                    const tierEl = document.getElementById('cancel-modal-tier');
                    if (tierEl && data.activeTier) tierEl.textContent = `${data.activeTier} Plan`;
                }
            } catch (err) {
                console.warn(err);
            }
            cancelModal.classList.remove('hidden');
        });
    }

    function closeCancelModal() {
        if (cancelModal) cancelModal.classList.add('hidden');
    }

    if (closeCancelModalBtn) closeCancelModalBtn.addEventListener('click', closeCancelModal);
    if (cancelModalBackBtn) cancelModalBackBtn.addEventListener('click', closeCancelModal);
    if (cancelModal) {
        cancelModal.addEventListener('click', (e) => {
            if (e.target === cancelModal) closeCancelModal();
        });
    }

    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', async () => {
            try {
                confirmCancelBtn.disabled = true;
                confirmCancelBtn.textContent = 'Processing Cancellation...';

                const res = await fetch(`${API_BASE}/revenue/tier/cancel`, {
                    method: 'POST',
                    headers: {
                        ...headers,
                        'Content-Type': 'application/json',
                        'x-role': 'Dean',
                    },
                });

                if (!res.ok) throw new Error('Failed to cancel subscription');
                const result = await res.json();

                closeCancelModal();
                await renderRevenueMetrics();

                showSaasToast(`⚠️ Subscription auto-renewal disabled. Access remains 100% active until period end.`);
            } catch (err) {
                showSaasToast(`❌ Error canceling subscription: ${err.message}`, true);
            } finally {
                confirmCancelBtn.disabled = false;
                confirmCancelBtn.textContent = '🚫 Confirm Cancellation';
            }
        });
    }

    // Viva Demo: Simulate 60-Day Grace Period
    if (simulateGraceBtn) {
        simulateGraceBtn.addEventListener('click', async () => {
            try {
                const res = await fetch(`${API_BASE}/revenue/simulate-grace-period`, {
                    method: 'POST',
                    headers: {
                        ...headers,
                        'Content-Type': 'application/json',
                        'x-role': 'Dean',
                    },
                    body: JSON.stringify({ enableGrace: true }),
                });
                if (!res.ok) throw new Error('Failed to toggle grace period simulation');
                closeCancelModal();
                await checkGracePeriodLifecycle();
                showSaasToast(`⚠️ 60-Day Read-Only Grace Period is now ACTIVE! Top banner displayed.`);
            } catch (err) {
                showSaasToast(`❌ Error simulating grace period: ${err.message}`, true);
            }
        });
    }

    // Reactivate License Button
    if (reactivateLicenseBtn) {
        reactivateLicenseBtn.addEventListener('click', async () => {
            try {
                reactivateLicenseBtn.disabled = true;
                reactivateLicenseBtn.textContent = 'Reactivating...';

                const res = await fetch(`${API_BASE}/revenue/simulate-grace-period`, {
                    method: 'POST',
                    headers: {
                        ...headers,
                        'Content-Type': 'application/json',
                        'x-role': 'Dean',
                    },
                    body: JSON.stringify({ enableGrace: false }),
                });

                if (!res.ok) throw new Error('Failed to reactivate license');
                await renderRevenueMetrics();
                await checkGracePeriodLifecycle();
                showSaasToast(`✅ Institutional License Reactivated to full Active mode!`);
            } catch (err) {
                showSaasToast(`❌ Error reactivating license: ${err.message}`, true);
            } finally {
                reactivateLicenseBtn.disabled = false;
                reactivateLicenseBtn.textContent = '🔄 Reactivate License';
            }
        });
    }

    // Download Institutional Academic Archive
    if (downloadArchiveBtn) {
        downloadArchiveBtn.addEventListener('click', async () => {
            try {
                downloadArchiveBtn.disabled = true;
                downloadArchiveBtn.textContent = 'Generating Archive...';

                const res = await fetch(`${API_BASE}/revenue/export/archive`, {
                    headers: {
                        ...headers,
                        'x-role': 'Dean',
                    },
                });

                if (!res.ok) throw new Error('Failed to export academic archive');
                const archiveData = await res.json();

                // Trigger client-side JSON file download
                const blob = new Blob([JSON.stringify(archiveData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `lumina_academic_archive_${archiveData.institutionInfo?.name?.replace(/\s+/g, '_') || 'IIIT_Sri_City'}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                showSaasToast(`📥 Institutional Academic Archive Downloaded Successfully!`);
            } catch (err) {
                showSaasToast(`❌ Error exporting archive: ${err.message}`, true);
            } finally {
                downloadArchiveBtn.disabled = false;
                downloadArchiveBtn.textContent = '📥 Export Academic Archive (JSON)';
            }
        });
    }

    // Helper to check and render Grace Period Banner
    async function checkGracePeriodLifecycle() {
        try {
            const res = await fetch(`${API_BASE}/revenue/lifecycle`, { headers: { ...headers, 'x-role': 'Dean' } });
            if (!res.ok) return;
            const lifecycle = await res.json();

            if (graceBanner) {
                if (lifecycle.status === 'Read_Only_Grace_Period') {
                    graceBanner.classList.remove('hidden');
                    if (graceBannerText) {
                        graceBannerText.textContent = `Contract expired. Operating in Read-Only mode (${lifecycle.daysRemainingInGrace} Days Remaining in Grace Period). Transcript export available.`;
                    }
                } else {
                    graceBanner.classList.add('hidden');
                }
            }
        } catch (err) {
            console.warn('Grace period lifecycle check failed:', err);
        }
    }

    // --- SaaS Toast Helper ---
    const saasToast = document.getElementById('saas-toast');
    const saasToastText = document.getElementById('saas-toast-text');
    const closeSaasToastBtn = document.getElementById('close-saas-toast');
    let saasToastTimeout;

    function showSaasToast(message, isError = false) {
        if (!saasToast || !saasToastText) return;
        saasToastText.textContent = message;
        if (isError) {
            saasToast.querySelector('.toast-icon-circle').style.background = '#ef4444';
        } else {
            saasToast.querySelector('.toast-icon-circle').style.background = '#10b981';
        }
        saasToast.classList.add('show');
        clearTimeout(saasToastTimeout);
        saasToastTimeout = setTimeout(() => {
            saasToast.classList.remove('show');
        }, 5000);
    }

    if (closeSaasToastBtn) {
        closeSaasToastBtn.addEventListener('click', () => {
            if (saasToast) saasToast.classList.remove('show');
            clearTimeout(saasToastTimeout);
        });
    }

    // --- 7. FETCH DATA FROM BACKEND & RENDER ---
    async function loadDashboard() {
        try {
            const [usersRes, coursesRes, registrationsRes] = await Promise.all([
                fetch(`${API_BASE}/users`, { headers }),
                fetch(`${API_BASE}/courses`, { headers }),
                fetch(`${API_BASE}/registrations`, { headers }),
            ]);

            if (!usersRes.ok) throw new Error(`Users API: ${usersRes.status}`);
            if (!coursesRes.ok) throw new Error(`Courses API: ${coursesRes.status}`);
            if (!registrationsRes.ok) throw new Error(`Registrations API: ${registrationsRes.status}`);

            users = await usersRes.json();
            courses = await coursesRes.json();
            registrations = await registrationsRes.json();
        } catch (err) {
            console.error('Failed to fetch data from backend:', err);
            document.getElementById('course-availability-text').innerText = 'Backend unavailable';
            document.getElementById('student-enrollment-text').innerText = 'Backend unavailable';
        }

        renderAssistantDeans();
        renderStats();
        renderTable();
        renderRevenueMetrics();
        checkGracePeriodLifecycle();
    }

    // Kick off data loading (non-blocking — UI is already interactive)
    loadDashboard();
});