/**
 * Lumina — course-section.js
 * Course Section Allocation page controller (Refactored for 6-tier filtering & Modals).
 */

let appData;
let filteredStudents = [];
let displayedStudents = [];
let currentSelectedCourse = null;
let pendingConfirmAction = null;

const MAX_CAPACITY = 100;

function normalizeSectionValue(section) {
  return section === 'Unassigned' ? '' : (section || '');
}

function formatSectionLabel(section) {
  const normalized = normalizeSectionValue(section);
  return normalized ? normalized.replace('Section ', '') : 'Unassigned';
}

function getSemesterFromTerm(term) {
  return term && term.toLowerCase().includes('spring') ? 'Spring' : 'Monsoon';
}

document.addEventListener('DOMContentLoaded', async () => {
  appData = await loadData();

  renderNavbar('section');
  renderFooter();

  initFilters();
  initWorkspaceActions();
  initBottomActions();
  initModalActions();
  
  const filterTerm = document.getElementById('filterTerm');
  filterTerm.value = 'Spring 2026';

  updateDashboard();
});

/* ══════════════════════════════════════════
   FILTERS & DROPDOWNS
   ══════════════════════════════════════════ */

function initFilters() {
  const filterTerm   = document.getElementById('filterTerm');
  const filterUG     = document.getElementById('filterUG');
  const filterType   = document.getElementById('filterType');
  const filterDept   = document.getElementById('filterDept');
  const filterCourse = document.getElementById('filterCourse');
  const filterSection= document.getElementById('filterSection');

  // When UG or Type or Dept changes -> Update Course list
  function updateCourseOptions() {
    const term = filterTerm.value;
    const ug   = filterUG.value;
    const type = filterType.value;
    const dept = filterDept.value;
    const semester = getSemesterFromTerm(term);
    
    // Auto-handle Department based on Course Type
    if (type === 'Institute Core' || type === 'Seed Course') {
      filterDept.value = 'All Departments';
      filterDept.disabled = true;
    } else if (type === 'Program Core' || type === 'Elective') {
      if (filterDept.value === 'All Departments') filterDept.value = ''; // Reset if previously IC
      filterDept.disabled = false;
    }

    const currentDept = filterDept.value;
    
    filterCourse.innerHTML = '<option value="" disabled selected>Select Course</option>';
    
    // Only fetch courses if required fields are filled
    const readyToFetch = type === 'Institute Core' ? ug : (ug && currentDept);
    
    if (readyToFetch) {
      // Find matching courses
      let matching = appData.courses.filter(c => c.status === 'Active' && c.ugYear === ug && c.semester === semester);
      
      if (type === 'Institute Core') {
        matching = matching.filter(c => c.type === 'Institute Core');
      } else if (type === 'Seed Course') {
        matching = matching.filter(c => c.type === 'Seed Course');
      } else if (type === 'Program Core') {
        matching = matching.filter(c => c.type === 'Program Core' && c.dept === currentDept);
      } else if (type === 'Elective') {
        matching = matching.filter(c => c.type === 'Elective' && c.dept.includes(currentDept));
      }

      if (matching.length > 0) {
        matching.forEach(c => {
          filterCourse.innerHTML += `<option value="${c.code}">${c.code} — ${c.name}</option>`;
        });
        filterCourse.disabled = false;
      } else {
        if (type === 'Elective' && (ug === 'UG1' || ug === 'UG2')) {
          filterCourse.innerHTML = '<option value="" disabled selected>No electives available for this year</option>';
        } else {
          filterCourse.innerHTML = '<option value="" disabled selected>No courses available</option>';
        }
        filterCourse.disabled = true;
      }
    } else {
      filterCourse.disabled = true;
    }
    
    // Course changed, so naturally update Sections
    updateSectionOptions();
    updateDashboard();
  }

  // When Course changes -> Update Section list dynamically
  function updateSectionOptions() {
    const courseCode = filterCourse.value;
    filterSection.innerHTML = '<option value="" disabled selected>Select Section</option>';
    
    if (courseCode) {
      document.getElementById('configSectionsGroup').style.display = 'flex';
      const course = appData.courses.find(c => c.code === courseCode);
      if (course) {
        currentSelectedCourse = course;
        filterSection.innerHTML = '<option value="All Sections">All Sections</option>';
        const numSec = course.sections || 1;
        for (let i = 1; i <= numSec; i++) {
          filterSection.innerHTML += `<option value="Section ${i}">Section ${i}</option>`;
        }
        filterSection.disabled = false;
        filterSection.value = 'All Sections';
      }
    } else {
      document.getElementById('configSectionsGroup').style.display = 'none';
      currentSelectedCourse = null;
      filterSection.disabled = true;
    }
    updateDashboard();
  }

  filterTerm.addEventListener('change', updateCourseOptions);
  filterUG.addEventListener('change', updateCourseOptions);
  filterType.addEventListener('change', updateCourseOptions);
  filterDept.addEventListener('change', updateCourseOptions);
  
  filterCourse.addEventListener('change', () => {
    updateSectionOptions();
  });
  
  filterSection.addEventListener('change', updateDashboard);
}

function getActiveFilters() {
  return {
    term: document.getElementById('filterTerm').value,
    ugYear: document.getElementById('filterUG').value,
    type: document.getElementById('filterType').value,
    dept: document.getElementById('filterDept').value,
    courseCode: document.getElementById('filterCourse').value,
    section: document.getElementById('filterSection').value
  };
}

/* ══════════════════════════════════════════
   DASHBOARD UPDATE PIPELINE
   ══════════════════════════════════════════ */

function updateDashboard() {
  const f = getActiveFilters();
  const messagesContainer = document.getElementById('messagesContainer');
  messagesContainer.innerHTML = '';
  document.getElementById('sectionCardsWrapper').style.display = 'none';

  if (!f.term || !f.ugYear || !f.type || (!f.dept && f.type !== 'Institute Core') || !f.courseCode || !f.section) {
    document.getElementById('studentTableBody').innerHTML = 
      '<tr><td colspan="6" class="table-empty">Please select all filters to load students.</td></tr>';
    renderStats({ total: 0, sections: 0, assigned: 0 });
    updateWorkspaceUtility();
    return;
  }

  // Filter students BY COURSE specifically (per prompt requirement)
  let roster = appData.students.filter(s => s.course === f.courseCode);

  if (roster.length === 0) {
    messagesContainer.innerHTML = `<div class="msg-alert msg-alert--warning"><span>⚠️</span> No students found for Course ${f.courseCode}.</div>`;
    document.getElementById('studentTableBody').innerHTML = '<tr><td colspan="6" class="table-empty">No students found for this course. Try importing a roster.</td></tr>';
    renderStats({ total: 0, sections: currentSelectedCourse ? currentSelectedCourse.sections : 0, assigned: 0 });
    
    // Even if empty, show section cards based on course definition
    const emptyCounts = {};
    for(let i=1; i<=(currentSelectedCourse.sections||1); i++) emptyCounts[`Section ${i}`] = 0;
    renderSectionCards(emptyCounts, currentSelectedCourse.sections || 1);
    document.getElementById('sectionCardsWrapper').style.display = 'block';
    updateWorkspaceUtility();
    return;
  }

  // Calculate Section Stats from FULL roster for this course
  const sectionCounts = {};
  const numSec = currentSelectedCourse ? currentSelectedCourse.sections : 1;
  for (let i = 1; i <= numSec; i++) {
    sectionCounts[`Section ${i}`] = 0;
  }
  
  let totalAssigned = 0;
  roster.forEach(s => {
    const normalizedSection = normalizeSectionValue(s.section);
    if (normalizedSection && normalizedSection.startsWith('Section')) {
      // normalize section string for count mapping if needed
      const secKey = normalizedSection;
      if (sectionCounts[secKey] !== undefined) {
        sectionCounts[secKey]++;
      } else {
        sectionCounts[secKey] = 1; // edge case if assigning out of bounds
      }
      totalAssigned++;
    }
  });

  const totalStudents = roster.length;
  // Render Stats
  renderStats({
    total: totalStudents, // Enrolled in Course
    sections: numSec,
    assigned: totalAssigned
  });

  // Render Section Cards (Overview) - Always show ALL sections of THAT course
  renderSectionCards(sectionCounts, numSec);
  document.getElementById('sectionCardsWrapper').style.display = 'block';

  // Apply Section Filter for the table view
  filteredStudents = roster;
  if (f.section !== 'All Sections') {
    filteredStudents = roster.filter(s => s.section === f.section);
  }

  updateWorkspaceUtility();
  applySearchAndPagination();
}

/* ══════════════════════════════════════════
   UI RENDERERS
   ══════════════════════════════════════════ */

function renderStats({ total, sections, assigned, unassigned }) {
  document.getElementById('statCards').innerHTML = `
    <div class="stat-card">
      <div class="stat-card__icon stat-card__icon--blue">👥</div>
      <div><div class="stat-card__label">Enrolled Students</div><div class="stat-card__value">${total}</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-card__icon stat-card__icon--amber">🏫</div>
      <div><div class="stat-card__label">Sections Created</div><div class="stat-card__value">${sections}</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-card__icon stat-card__icon--green">✅</div>
      <div><div class="stat-card__label">Students Assigned</div><div class="stat-card__value">${assigned}</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-card__icon stat-card__icon--red">⏳</div>
      <div><div class="stat-card__label">Unassigned</div><div class="stat-card__value">${unassigned}</div></div>
    </div>
  `;
}

function renderSectionCards(counts, numSec) {
  let html = '';
  for (let i = 1; i <= numSec; i++) {
    const secKey = `Section ${i}`;
    const assigned = counts[secKey] || 0;
    const pct = Math.round((assigned / MAX_CAPACITY) * 100);
    
    let stateClass = 'available';
    let statusText = 'AVAILABLE';
    
    if (assigned >= MAX_CAPACITY) {
      stateClass = 'full';
      statusText = 'FULL';
    } else if (assigned >= MAX_CAPACITY * 0.9) { // Above 90% is Red per prompt
      stateClass = 'full';
      statusText = 'FULL'; // Visual red
    } else if (assigned >= MAX_CAPACITY * 0.6) { // 60-90% is Orange
      stateClass = 'near-full';
      statusText = 'NEAR FULL';
    }

    html += `
      <div class="section-card">
        <div class="section-card__header">
          <div class="section-card__title">${secKey}</div>
          <div class="section-card__badge badge--${stateClass}">${statusText}</div>
        </div>
        <div class="section-card__stats">
          <span>${assigned} Assigned</span>
          <span>Max: ${MAX_CAPACITY}</span>
        </div>
        <div class="section-card__bar-bg">
          <div class="section-card__bar-fill fill--${stateClass}" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }
  document.getElementById('sectionCards').innerHTML = html;
}

function applySearchAndPagination() {
  const query = document.getElementById('searchStudent').value.toLowerCase();
  
  displayedStudents = filteredStudents.filter(s => 
    s.id.toLowerCase().includes(query) || 
    s.name.toLowerCase().includes(query)
  );

  renderTable(displayedStudents);
}

function renderTable(students) {
  const tbody = document.getElementById('studentTableBody');
  const pag = document.getElementById('paginationControls');

  if (students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No students match current filters/search.</td></tr>';
    pag.innerHTML = '';
    return;
  }

  let html = '';
  students.forEach(s => {
    const normalizedSection = normalizeSectionValue(s.section);
    const isAssigned = !!normalizedSection;
    const statusClass = isAssigned ? 'badge-status--assigned' : 'badge-status--unassigned';
    const statusText  = isAssigned ? 'Assigned' : 'Unassigned';
    
    html += `
      <tr>
        <td><input type="checkbox" class="student-checkbox" data-id="${s.id}"></td>
        <td style="font-weight:600">${s.id}</td>
        <td>${s.name}</td>
        <td>${s.program} / ${s.ugYear}</td>
        <td>
          <span class="section-text">${formatSectionLabel(s.section)}</span>
          <button class="edit-icon-btn" onclick="openEditModal('${s.id}')" title="Change Section">✏️</button>
        </td>
        <td><span class="badge-status ${statusClass}">${statusText}</span></td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
  pag.innerHTML = `Showing 1 - ${students.length} of ${students.length} students`;
}

/* ══════════════════════════════════════════
   EDIT MODAL LOGIC
   ══════════════════════════════════════════ */

let editingStudentId = null;

function initModalActions() {}

window.openEditModal = function(studentId) {
  const student = appData.students.find(s => s.id === studentId && s.course === currentSelectedCourse.code);
  if (!student || !currentSelectedCourse) return;
  const currentSection = normalizeSectionValue(student.section);
  
  editingStudentId = studentId;
  document.getElementById('modalStudentName').textContent = student.name;
  document.getElementById('modalStudentId').textContent = student.id;
  document.getElementById('modalCurrentSection').textContent = formatSectionLabel(student.section);
  
  // Show unassigned and all alternate sections except the current one.
  const sel = document.getElementById('modalSectionSelect');
  sel.innerHTML = '<option value="">Unassigned</option>';
  for (let i = 1; i <= (currentSelectedCourse.sections || 1); i++) {
    const sectionValue = `Section ${i}`;
    if (sectionValue !== currentSection) {
      sel.innerHTML += `<option value="${sectionValue}">${i}</option>`;
    }
  }
  sel.value = '';
  
  document.getElementById('modalWarning').style.display = 'none';
  document.getElementById('editSectionModal').style.display = 'flex';
};

function checkModalCapacityWarning() {
  const newSection = document.getElementById('modalSectionSelect').value;
  const warningDiv = document.getElementById('modalWarning');
  const warningText = document.getElementById('modalWarningText');
  
  if (!newSection) {
    warningDiv.style.display = 'none';
    return;
  }
  
  const currentCount = appData.students.filter(s => s.course === currentSelectedCourse.code && normalizeSectionValue(s.section) === newSection).length;
  
  // Exclude current student from count if they are already in this section
  const student = appData.students.find(s => s.id === editingStudentId && s.course === currentSelectedCourse.code);
  const adjustedCount = (student && normalizeSectionValue(student.section) === newSection) ? currentCount : currentCount + 1;
  
  if (adjustedCount > MAX_CAPACITY) {
    warningText.textContent = `Section ${newSection} is at full capacity (100 students)`;
    warningDiv.style.display = 'flex';
  } else {
    warningDiv.style.display = 'none';
  }
}

function closeEditModal() {
  document.getElementById('editSectionModal').style.display = 'none';
  editingStudentId = null;
}

function confirmEditSection() {
  if (!editingStudentId) return;
  const newSection = document.getElementById('modalSectionSelect').value;
  const student = appData.students.find(s => s.id === editingStudentId && s.course === currentSelectedCourse.code);
  if (!student) return;
  const isOvercap = document.getElementById('modalWarning').style.display === 'flex';
  
  student.section = newSection || '';
  saveData(appData);
  updateDashboard();
  showSyncStatus();
  closeEditModal();
  
  if (isOvercap) {
    showToast(`Warning: ${newSection} is over capacity`, 'warning');
  } else {
    showToast(`Student ${student.name} moved to ${formatSectionLabel(newSection)} successfully`, 'success');
  }
}

/* ══════════════════════════════════════════
   CONFIG SECTIONS MODAL LOGIC
   ══════════════════════════════════════════ */

window.openConfigModal = function() {
  if (!currentSelectedCourse) return;
  document.getElementById('configCourseName').textContent = `${currentSelectedCourse.code} — ${currentSelectedCourse.name}`;
  document.getElementById('configCurrentSections').value = currentSelectedCourse.sections || 1;
  document.getElementById('configNewSections').value = currentSelectedCourse.sections || 1;
  document.getElementById('configWarning').style.display = 'none';
  document.getElementById('configSectionModal').style.display = 'flex';
};

function closeConfigModal() {
  document.getElementById('configSectionModal').style.display = 'none';
}

function saveConfigSection() {
  const newSec = parseInt(document.getElementById('configNewSections').value, 10);
  const currSec = currentSelectedCourse.sections || 1;
  const warningDiv = document.getElementById('configWarning');
  const warningText = document.getElementById('configWarningText');

  if (isNaN(newSec) || newSec < 1 || newSec > 6) {
    warningText.textContent = "Please enter a valid number of sections between 1 and 6.";
    warningDiv.style.display = 'flex';
    return;
  }

  if (newSec < currSec) {
    // Check if any students are assigned to the sections being removed
    const roster = appData.students.filter(s => s.course === currentSelectedCourse.code);
    let violationSection = null;
    let violationCount = 0;

    for (let i = currSec; i > newSec; i--) {
      const secName = `Section ${i}`;
      const count = roster.filter(s => s.section === secName).length;
      if (count > 0) {
        violationSection = i;
        violationCount = count;
        break; // found highest violating section
      }
    }

    if (violationSection !== null) {
      warningText.textContent = `Cannot reduce sections — Section ${violationSection} has ${violationCount} students assigned. Please reassign them first.`;
      warningDiv.style.display = 'flex';
      return;
    }
  }

  // Save configuration
  currentSelectedCourse.sections = newSec;
  const courseIndex = appData.courses.findIndex(c => c.code === currentSelectedCourse.code);
  if (courseIndex !== -1) {
    appData.courses[courseIndex].sections = newSec;
  }
  saveData(appData);

  showToast(`Sections updated to ${newSec} for ${currentSelectedCourse.code}`, 'success');
  closeConfigModal();

  // Trigger update of section dropdown (this also triggers updateDashboard)
  // Must trigger globally so dropdown resets
  document.getElementById('filterCourse').dispatchEvent(new Event('change'));
}

/* ══════════════════════════════════════════
   TOAST NOTIFICATIONS
   ══════════════════════════════════════════ */

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'warning' ? 'toast--warning' : ''}`;
  toast.innerHTML = `<span>${type === 'warning' ? '⚠️' : '✅'}</span> <span>${message}</span>`;
  
  container.appendChild(toast);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('toast-hiding');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3000);
}

/* ══════════════════════════════════════════
   ACTIONS (Import, Balance, Clear)
   ══════════════════════════════════════════ */

function initWorkspaceActions() {}

/* ══════════════════════════════════════════
   BOTTOM ACTIONS
   ══════════════════════════════════════════ */

function initBottomActions() {}

function showSyncStatus() {
  const timeEl = document.getElementById('lastSavedTime');
  const now = new Date();
  timeEl.textContent = `Last saved: ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
}

function renderStats({ total, sections, assigned }) {
  document.getElementById('statCards').innerHTML = `
    <div class="stat-card">
      <div class="stat-card__icon stat-card__icon--amber">🏫</div>
      <div><div class="stat-card__label">Sections Created</div><div class="stat-card__value">${sections}</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-card__icon stat-card__icon--green">✅</div>
      <div><div class="stat-card__label">Students Assigned</div><div class="stat-card__value">${assigned}</div></div>
    </div>
  `;
}

function showMessage(message, type = 'warning') {
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
  document.getElementById('messagesContainer').innerHTML =
    `<div class="msg-alert msg-alert--${type}"><span>${icon}</span><span>${message}</span></div>`;
}

function clearMessage() {
  document.getElementById('messagesContainer').innerHTML = '';
}

function updateWorkspaceUtility() {
  const utilityText = document.getElementById('workspaceUtilityText');
  const clearBtn = document.getElementById('clearAssignmentsBtn');

  if (!currentSelectedCourse) {
    utilityText.textContent = 'Choose a course and section to review assignments and section load.';
    clearBtn.disabled = true;
    return;
  }

  utilityText.textContent = `Managing ${currentSelectedCourse.code}. Use the course-level clear action only when you want to remove every current assignment before reassigning students.`;
  clearBtn.disabled = false;
}

function openConfirmModal(title, message, onConfirm) {
  pendingConfirmAction = onConfirm;
  document.getElementById('confirmActionTitle').textContent = title;
  document.getElementById('confirmActionMessage').textContent = message;
  document.getElementById('confirmActionModal').style.display = 'flex';
}

function closeConfirmModal() {
  pendingConfirmAction = null;
  document.getElementById('confirmActionModal').style.display = 'none';
}

function confirmPendingAction() {
  if (typeof pendingConfirmAction === 'function') {
    pendingConfirmAction();
  }
  closeConfirmModal();
}

function initModalActions() {
  document.getElementById('closeEditModalBtn').addEventListener('click', closeEditModal);
  document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);
  document.getElementById('confirmEditBtn').addEventListener('click', confirmEditSection);
  document.getElementById('modalSectionSelect').addEventListener('change', checkModalCapacityWarning);

  const configBtn = document.getElementById('configureSectionsBtn');
  if (configBtn) configBtn.addEventListener('click', openConfigModal);
  document.getElementById('closeConfigModalBtn').addEventListener('click', closeConfigModal);
  document.getElementById('cancelConfigBtn').addEventListener('click', closeConfigModal);
  document.getElementById('saveConfigBtn').addEventListener('click', saveConfigSection);

  document.getElementById('closeConfirmModalBtn').addEventListener('click', closeConfirmModal);
  document.getElementById('cancelConfirmBtn').addEventListener('click', closeConfirmModal);
  document.getElementById('confirmActionBtn').addEventListener('click', confirmPendingAction);
}

function initWorkspaceActions() {
  document.getElementById('searchStudent').addEventListener('input', applySearchAndPagination);
  document.getElementById('searchBtn').addEventListener('click', applySearchAndPagination);

  document.getElementById('clearAssignmentsBtn').addEventListener('click', () => {
    if (!currentSelectedCourse) {
      showMessage('Select a course before clearing assignments.', 'warning');
      return;
    }

    openConfirmModal(
      'Clear Course Assignments',
      `Remove all current section assignments for ${currentSelectedCourse.code}? Students will remain in the roster and can be reassigned afterward.`,
      () => {
        appData.students.forEach(student => {
          if (student.course === currentSelectedCourse.code) {
            student.section = '';
          }
        });
        saveData(appData);
        clearMessage();
        updateDashboard();
        showSyncStatus();
        showToast(`Cleared all assignments for ${currentSelectedCourse.code}.`, 'success');
      }
    );
  });

  const fileInput = document.getElementById('importFile');
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      showMessage('Please upload a valid .xlsx or .csv file.', 'error');
      fileInput.value = '';
      return;
    }

    const f = getActiveFilters();
    if (!f.term || !f.ugYear || !f.type || (!f.dept && f.type !== 'Institute Core') || !f.courseCode) {
      showMessage('Please complete the required filters before importing students.', 'warning');
      fileInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(l => l.trim().length > 0);

      let importedCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length >= 5) {
          const id = parts[0].trim();
          const name = parts[1].trim();
          const program = parts[2].trim();
          const ugYear = parts[3].trim();
          const course = parts[4].trim();
          let section = (parts[5] || '').trim().replace(/section/i, 'Section');
          if (section && !section.includes(' ')) {
            section = section.replace('Section', 'Section ');
          }

          const existing = appData.students.find(s => s.id === id && s.course === course);
          if (existing) {
            existing.name = name;
            existing.program = program;
            existing.ugYear = ugYear;
            existing.section = section || '';
          } else {
            appData.students.push({ id, name, program, ugYear, course, section: section || '' });
          }
          importedCount++;
        }
      }

      saveData(appData);
      fileInput.value = '';

      if (importedCount === 0) {
        showMessage('No valid student rows were found for the selected course.', 'warning');
        return;
      }

      clearMessage();
      updateDashboard();
      showToast(`Imported ${importedCount} students successfully.`, 'success');
    };
    reader.readAsText(file);
  });
}

function initBottomActions() {
  document.getElementById('exportBtn').addEventListener('click', () => {
    if (filteredStudents.length === 0) {
      showMessage('No students are available to export for the current filters.', 'warning');
      return;
    }

    let csv = 'Student ID,Student Name,Program,Year,Course,Section\n';
    filteredStudents.forEach(s => {
      csv += `${s.id},${s.name},${s.program},${s.ugYear},${s.course},${s.section || 'Unassigned'}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Section_Allocation_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  });

  document.getElementById('resetChangesBtn').addEventListener('click', () => {
    window.location.reload();
  });

  document.getElementById('saveAssignmentBtn').addEventListener('click', () => {
    clearMessage();
    showSyncStatus();
    showToast('All section assignments have been saved.', 'success');
  });
}