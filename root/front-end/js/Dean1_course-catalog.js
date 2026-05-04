/**
 * Lumina — Course Catalog (Page 2)
 * Table rendering, search/filter, pagination, Add/Edit modals with validation.
 */

/* ══════════ State ══════════ */
const API_BASE = 'http://localhost:3000';
const sessionData = localStorage.getItem('Lumina_Session');
const currentUser = sessionData ? JSON.parse(sessionData) : null;
const API_HEADERS = {
    'Content-Type': 'application/json',
    'x-role': currentUser ? currentUser.Role : 'Assistant_Dean_1'
};
let appData;
let filteredCourses = [];
let currentPage = 1;
const PAGE_SIZE = 6;

// Tag arrays for prerequisite inputs
let addPrereqTags  = [];
let editPrereqTags = [];

// Track which course is being edited
let editingCourseCode = null;

/* ══════════ Init ══════════ */
document.addEventListener('DOMContentLoaded', async () => {

  appData = await loadData();

  renderNavbar('catalog');
  renderFooter();
  applyFiltersAndRender();

  // ── Filter / search listeners ──
  document.getElementById('searchInput').addEventListener('input', debounce(onFilterChange, 250));
  document.getElementById('filterUG').addEventListener('change', onFilterChange);
  document.getElementById('filterType').addEventListener('change', handleCourseTypeFilterChange);
  document.getElementById('filterDept').addEventListener('change', onFilterChange);
  document.getElementById('filterSemester').addEventListener('change', onFilterChange);
  document.getElementById('filterStatus').addEventListener('change', onFilterChange);
  document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);

  syncDepartmentFilterState();

  // ── Add modal ──
  document.getElementById('addCourseBtn').addEventListener('click', openAddModal);
  document.getElementById('addModalClose').addEventListener('click', closeAddModal);
  document.getElementById('addCancelBtn').addEventListener('click', closeAddModal);
  document.getElementById('addCourseForm').addEventListener('submit', handleAddCourse);
  document.getElementById('addType').addEventListener('change', handleAddTypeChange);
  initPrereqDropdown('add');

  // ── Edit modal ──
  document.getElementById('editModalClose').addEventListener('click', closeEditModal);
  document.getElementById('editCancelBtn').addEventListener('click', closeEditModal);
  document.getElementById('editCourseForm').addEventListener('submit', handleEditCourse);
  document.getElementById('editType').addEventListener('change', handleEditTypeChange);
  initPrereqDropdown('edit');

  // Close modals on overlay click
  document.getElementById('addModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeAddModal();
  });
  document.getElementById('editModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeEditModal();
  });
});


/* ══════════ Filter & Render ══════════ */

function onFilterChange() {
  currentPage = 1;
  applyFiltersAndRender();
}

function handleCourseTypeFilterChange() {
  syncDepartmentFilterState();
  onFilterChange();
}

function syncDepartmentFilterState() {
  const typeFilter = document.getElementById('filterType').value;
  const deptSelect = document.getElementById('filterDept');
  const defaultOption = deptSelect.querySelector('option[value=""]');

  if (typeFilter === 'Institute Core' || typeFilter === 'Seed Course') {
    if (defaultOption) defaultOption.textContent = 'All Departments';
    deptSelect.value = '';
    deptSelect.disabled = true;
    return;
  }

  if (defaultOption) defaultOption.textContent = 'Department';
  deptSelect.disabled = false;
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('filterUG').value = '';
  document.getElementById('filterType').value = '';
  document.getElementById('filterDept').value = '';
  document.getElementById('filterSemester').value = '';
  document.getElementById('filterStatus').value = '';
  syncDepartmentFilterState();
  onFilterChange();
}

function applyFiltersAndRender() {
  const search   = document.getElementById('searchInput').value.trim().toLowerCase();
  const ugFilter = document.getElementById('filterUG').value;
  const typeFilter = document.getElementById('filterType').value;
  const deptFilter = document.getElementById('filterDept').value;
  const semFilter  = document.getElementById('filterSemester').value;
  const statFilter = document.getElementById('filterStatus').value;

  filteredCourses = appData.courses.filter(c => {
    if (search && !c.code.toLowerCase().includes(search) && !c.name.toLowerCase().includes(search)) return false;
    if (ugFilter && c.ugYear !== ugFilter) return false;
    if (typeFilter && c.type !== typeFilter) return false;
    if (deptFilter && c.dept !== deptFilter) return false;
    if (semFilter && c.semester !== semFilter) return false;
    if (statFilter && c.status !== statFilter) return false;
    return true;
  });

  renderStatCards();
  renderTable();
  renderPagination();
}


/* ══════════ Stat Cards ══════════ */

function renderStatCards() {
  const all      = appData.courses;
  const total    = all.length;
  const active   = all.filter(c => c.status === 'Active').length;
  const inactive = all.filter(c => c.status === 'Inactive').length;
  const depts    = new Set(appData.departments).size;

  const cards = [
    { label: 'Total Courses',    value: total,    colorClass: 'stat-card__icon--blue'  },
    { label: 'Active Courses',   value: active,   colorClass: 'stat-card__icon--green' },
    { label: 'Inactive Courses', value: inactive, colorClass: 'stat-card__icon--red'   },
    { label: 'Departments',      value: depts,    colorClass: 'stat-card__icon--amber' },
  ];

  document.getElementById('statCards').innerHTML = cards.map(c => `
    <div class="stat-card">
      <div>
        <div class="stat-card__label">${c.label}</div>
        <div class="stat-card__value">${c.value}</div>
      </div>
    </div>
  `).join('');
}


/* ══════════ Course Table ══════════ */

function renderTable() {
  const start = (currentPage - 1) * PAGE_SIZE;
  const page  = filteredCourses.slice(start, start + PAGE_SIZE);
  const tbody = document.getElementById('courseTableBody');

  if (page.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--gray-400);">No courses found.</td></tr>`;
    return;
  }

  tbody.innerHTML = page.map(c => {
    // Type badge
    let typeClass = 'type-badge--institute';
    let typeLabel = 'INSTITUTE CORE';
    if (c.type === 'Program Core') {
      typeClass = 'type-badge--program';
      typeLabel = 'PROGRAM CORE';
    } else if (c.type === 'Seed Course') {
      typeClass = 'type-badge--seed';
      typeLabel = 'SEED COURSE';
    } else if (c.type === 'Elective' || c.type === 'Institute Elective' || c.type === 'Program Elective') {
      typeClass = 'type-badge--elective';
      typeLabel = c.type.toUpperCase();
    }

    // Department display
    const deptDisplay = (c.type === 'Institute Core' || c.type === 'Institute Elective')
      ? 'CSE, ECE, AIDS'
      : c.type === 'Seed Course'
      ? 'All Departments (CSE, ECE, AIDS)'
      : c.dept;

    // Prerequisites display
    const prereqDisplay = (!c.prerequisites || c.prerequisites.length === 0)
      ? 'None'
      : c.prerequisites.join(', ');

    // Status badge
    const statusClass = c.status === 'Active' ? 'badge--active' : 'badge--inactive';
    const dotClass    = c.status === 'Active' ? 'badge-dot--green' : 'badge-dot--red';

    return `
      <tr>
        <td>${c.code}</td>
        <td>${c.name}</td>
        <td>${deptDisplay}</td>
        <td>${c.credits}</td>
        <td><span class="type-badge ${typeClass}">${typeLabel}</span></td>
        <td>${prereqDisplay}</td>
        <td>${c.ugYear}</td>
        <td>${c.semester}</td>
        <td>
          <span class="badge ${statusClass}">
            <span class="badge-dot ${dotClass}"></span>
            ${c.status}
          </span>
        </td>
        <td>
          <button class="action-btn" title="Edit" onclick="openEditModal('${c.code}')">✏️</button>
        </td>
      </tr>
    `;
  }).join('');
}


/* ══════════ Pagination ══════════ */

function renderPagination() {
  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE));
  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end   = Math.min(currentPage * PAGE_SIZE, filteredCourses.length);

  document.getElementById('paginationInfo').textContent =
    filteredCourses.length > 0
      ? `Showing ${start} to ${end} of ${filteredCourses.length} courses`
      : 'No courses to display';

  let btns = `<button class="pagination__btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">Previous</button>`;

  // Show at most 5 page numbers
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage   = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons - 1) startPage = Math.max(1, endPage - maxButtons + 1);

  for (let i = startPage; i <= endPage; i++) {
    btns += `<button class="pagination__btn ${i === currentPage ? 'pagination__btn--active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }

  btns += `<button class="pagination__btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">Next</button>`;

  document.getElementById('paginationControls').innerHTML = btns;
}

function goToPage(page) {
  const totalPages = Math.ceil(filteredCourses.length / PAGE_SIZE);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderTable();
  renderPagination();
}


/* ══════════ Prerequisite Searchable Dropdown ══════════ */

/**
 * refreshPrereqDisplay(prefix)
 * Re-renders the selected-tags row for 'add' or 'edit' dropdown.
 * Called externally when openAddModal / openEditModal resets state.
 */
function refreshPrereqDisplay(prefix) {
  const tagsArray    = prefix === 'add' ? addPrereqTags : editPrereqTags;
  const tagsContainer = document.getElementById(`${prefix}PrereqTags`);
  if (!tagsContainer) return;

  tagsContainer.innerHTML = tagsArray.map((code, i) => `
    <span class="prereq-tag">
      <span class="prereq-tag-code">${code}</span>
      <button type="button" class="prereq-tag-remove" data-prefix="${prefix}" data-idx="${i}" title="Remove">&times;</button>
    </span>
  `).join('');

  tagsContainer.querySelectorAll('.prereq-tag-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const arr = btn.dataset.prefix === 'add' ? addPrereqTags : editPrereqTags;
      arr.splice(parseInt(btn.dataset.idx, 10), 1);
      refreshPrereqDisplay(btn.dataset.prefix);
    });
  });
}

/**
 * initPrereqDropdown(prefix)
 * Sets up the searchable dropdown for prerequisite selection.
 * Must be called after appData is loaded (DOMContentLoaded).
 */
function initPrereqDropdown(prefix) {
  const searchInput   = document.getElementById(`${prefix}PrereqSearch`);
  const dropdownList  = document.getElementById(`${prefix}PrereqList`);
  if (!searchInput || !dropdownList) return;

  const getTagsArray  = () => prefix === 'add' ? addPrereqTags : editPrereqTags;
  const getExcludeCode = () => prefix === 'edit' ? editingCourseCode : null;

  function renderOptions(query) {
    const arr = getTagsArray();
    const exclude = getExcludeCode();
    const q = (query || '').trim().toLowerCase();

    const matches = (appData ? appData.courses : []).filter(c =>
      c.code !== exclude &&
      !arr.includes(c.code) &&
      (q === '' || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
    );

    if (matches.length === 0) {
      dropdownList.innerHTML = `<div class="prereq-dropdown-empty">No matching courses found</div>`;
    } else {
      dropdownList.innerHTML = matches.map(c => `
        <div class="prereq-dropdown-item" data-code="${c.code}" data-prefix="${prefix}">
          <span class="prereq-item-code">${c.code}</span>
          <span class="prereq-item-name">${c.name}</span>
        </div>
      `).join('');

      dropdownList.querySelectorAll('.prereq-dropdown-item').forEach(item => {
        item.addEventListener('mousedown', (e) => {
          // Use mousedown so it fires before the input blur closes the dropdown
          e.preventDefault();
          const code = item.dataset.code;
          const arr = getTagsArray();
          if (!arr.includes(code)) {
            arr.push(code);
            refreshPrereqDisplay(prefix);
          }
          searchInput.value = '';
          renderOptions('');
          searchInput.focus();
        });
      });
    }
  }

  searchInput.addEventListener('focus', () => {
    renderOptions(searchInput.value);
    dropdownList.classList.add('prereq-dropdown-list--open');
  });

  searchInput.addEventListener('input', () => {
    renderOptions(searchInput.value);
    dropdownList.classList.add('prereq-dropdown-list--open');
  });

  searchInput.addEventListener('blur', () => {
    // Slight delay so mousedown on an item fires first
    setTimeout(() => dropdownList.classList.remove('prereq-dropdown-list--open'), 150);
  });

  // Close if click lands completely outside the wrapper
  document.addEventListener('click', (e) => {
    const wrapper = document.getElementById(`${prefix}PrereqWrapper`);
    if (wrapper && !wrapper.contains(e.target)) {
      dropdownList.classList.remove('prereq-dropdown-list--open');
    }
  });
}


/* ══════════ ADD COURSE MODAL ══════════ */

function openAddModal() {
  // Reset form
  document.getElementById('addCourseForm').reset();
  addPrereqTags.length = 0;
  refreshPrereqDisplay('add');
  clearValidation('add');
  document.getElementById('addDept').disabled = false;
  document.getElementById('addCredits').readOnly = false;

  document.getElementById('addModal').classList.add('modal-overlay--active');
  document.body.style.overflow = 'hidden';
}

function closeAddModal() {
  document.getElementById('addModal').classList.remove('modal-overlay--active');
  document.body.style.overflow = '';
}

function handleAddTypeChange() {
  const type = document.getElementById('addType').value;
  const deptSelect = document.getElementById('addDept');
  const creditsInput = document.getElementById('addCredits');
  if (type === 'Institute Core') {
    deptSelect.value = '';
    deptSelect.disabled = true;
    creditsInput.readOnly = false;
    if (creditsInput.value === '2') creditsInput.value = '';
  } else if (type === 'Seed Course') {
    deptSelect.value = 'All Departments (CSE, ECE, AIDS)';
    deptSelect.disabled = true;
    creditsInput.value = '2';
    creditsInput.readOnly = true;
  } else {
    deptSelect.disabled = false;
    creditsInput.readOnly = false;
  }
}

async function handleAddCourse(e) {
  e.preventDefault();
  clearValidation('add');

  const code     = document.getElementById('addCode').value.trim().toUpperCase();
  const name     = document.getElementById('addName').value.trim();
  const credits  = document.getElementById('addCredits').value.trim();
  const ugYear   = document.getElementById('addUG').value;
  const semester = document.querySelector('input[name="addSemester"]:checked')?.value || '';
  const type     = document.getElementById('addType').value;
  const dept     = document.getElementById('addDept').value;

  let valid = true;

  if (!code)    { setInvalid('addCodeGroup', 'addCodeError', 'Course code is required'); valid = false; }
  else if (!/[A-Za-z]/.test(code) || !/[0-9]/.test(code)) {
    setInvalid('addCodeGroup', 'addCodeError', 'Course code must contain both letters and numbers'); valid = false;
  }
  else if (appData.courses.some(c => c.code === code)) {
    setInvalid('addCodeGroup', 'addCodeError', 'Course code already exists'); valid = false;
  }
  if (!name)    { setInvalid('addNameGroup', 'addNameError', 'Course name is required'); valid = false; }
  else if (!/^[A-Za-z\s]+$/.test(name)) {
    setInvalid('addNameGroup', 'addNameError', 'Course name must contain only letters (a-z)'); valid = false;
  }
  if (!credits || credits < 1 || credits > 4) { setInvalid('addCreditsGroup', 'addCreditsError', 'Credits must be 1-4'); valid = false; }
  if (!ugYear)  { setInvalid('addUGGroup', 'addUGError', 'UG Year is required'); valid = false; }
  if (!semester){ setInvalid('addSemesterGroup', 'addSemesterError', 'Semester is required'); valid = false; }
  if (!type)    { setInvalid('addTypeGroup', 'addTypeError', 'Type is required'); valid = false; }
  if (type === 'Seed Course' && credits !== '2') { setInvalid('addCreditsGroup', 'addCreditsError', 'Seed Course credits must be 2'); valid = false; }
  if (type !== 'Institute Core' && type !== 'Seed Course' && !dept) { setInvalid('addDeptGroup', 'addDeptError', 'Department is required'); valid = false; }

  if (!valid) return;

  const newCourse = {
    code,
    name,
    credits: parseInt(credits, 10),
    ugYear,
    semester,
    type,
    dept: type === 'Institute Core' ? '-' : type === 'Seed Course' ? 'All Departments (CSE, ECE, AIDS)' : dept,
    prerequisites: [...addPrereqTags],
    status: 'Active',
    courseCapacity: 60
  };

  try {
      const res = await fetch(`${API_BASE}/courses`, {
          method: 'POST',
          headers: API_HEADERS,
          body: JSON.stringify({
              courseId: newCourse.code,
              courseName: newCourse.name,
              credits: newCourse.credits,
              courseCapacity: newCourse.courseCapacity,
              status: newCourse.status,
              deptId: newCourse.dept === '-' || newCourse.dept.startsWith('All') ? 'CSE' : newCourse.dept
          })
      });
      if (res.ok) {
          appData.courses.push(newCourse);
          closeAddModal();
          showToast('Course added successfully!');
          applyFiltersAndRender();
      } else {
          const err = await res.json();
          alert('Failed to add course: ' + (err.message || 'Unknown error'));
      }
  } catch (e) {
      console.error(e);
      alert('Network error while adding course.');
  }
}


/* ══════════ EDIT COURSE MODAL ══════════ */

function openEditModal(code) {
  const course = appData.courses.find(c => c.code === code);
  if (!course) return;

  editingCourseCode = code;
  clearValidation('edit');

  document.getElementById('editCode').value    = course.code;
  document.getElementById('editName').value    = course.name;
  document.getElementById('editCredits').value = course.credits;
  document.getElementById('editUG').value      = course.ugYear;
  document.getElementById('editType').value    = course.type;

  // Semester radio
  const semRadios = document.querySelectorAll('input[name="editSemester"]');
  semRadios.forEach(r => r.checked = r.value === course.semester);

  // Status radio
  const statRadios = document.querySelectorAll('input[name="editStatus"]');
  statRadios.forEach(r => r.checked = r.value === course.status);

  // Department
  const deptSelect = document.getElementById('editDept');
  const creditsInput = document.getElementById('editCredits');
  if (course.type === 'Institute Core' || course.type === 'Institute Elective') {
    deptSelect.value = '';
    deptSelect.disabled = true;
    creditsInput.readOnly = false;
  } else if (course.type === 'Seed Course') {
    deptSelect.value = 'All Departments (CSE, ECE, AIDS)';
    deptSelect.disabled = true;
    creditsInput.value = 2;
    creditsInput.readOnly = true;
  } else {
    deptSelect.disabled = false;
    deptSelect.value = course.dept;
    creditsInput.readOnly = false;
  }

  // Prerequisites tags
  editPrereqTags.length = 0;
  (course.prerequisites || []).forEach(p => editPrereqTags.push(p));
  refreshPrereqDisplay('edit');

  document.getElementById('editModal').classList.add('modal-overlay--active');
  document.body.style.overflow = 'hidden';
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('modal-overlay--active');
  document.body.style.overflow = '';
  document.getElementById('editCredits').readOnly = false;
  editingCourseCode = null;
}

function handleEditTypeChange() {
  const type = document.getElementById('editType').value;
  const deptSelect = document.getElementById('editDept');
  const creditsInput = document.getElementById('editCredits');
  if (type === 'Institute Core') {
    deptSelect.value = '';
    deptSelect.disabled = true;
    creditsInput.readOnly = false;
  } else if (type === 'Seed Course') {
    deptSelect.value = 'All Departments (CSE, ECE, AIDS)';
    deptSelect.disabled = true;
    creditsInput.value = 2;
    creditsInput.readOnly = true;
  } else {
    deptSelect.disabled = false;
    creditsInput.readOnly = false;
  }
}

async function handleEditCourse(e) {
  e.preventDefault();
  clearValidation('edit');

  const name     = document.getElementById('editName').value.trim();
  const credits  = document.getElementById('editCredits').value.trim();
  const ugYear   = document.getElementById('editUG').value;
  const semester = document.querySelector('input[name="editSemester"]:checked')?.value || '';
  const type     = document.getElementById('editType').value;
  const dept     = document.getElementById('editDept').value;
  const status   = document.querySelector('input[name="editStatus"]:checked')?.value || '';

  let valid = true;

  if (!name)    { setInvalid('editNameGroup', 'editNameError', 'Course name is required'); valid = false; }
  if (!credits || credits < 1 || credits > 6) { setInvalid('editCreditsGroup', 'editCreditsError', 'Credits must be 1-6'); valid = false; }
  if (!ugYear)  { setInvalid('editUGGroup', 'editUGError', 'UG Year is required'); valid = false; }
  if (!semester){ setInvalid('editSemesterGroup', 'editSemesterError', 'Semester is required'); valid = false; }
  if (!type)    { setInvalid('editTypeGroup', 'editTypeError', 'Type is required'); valid = false; }
  if (type === 'Seed Course' && credits !== '2') { setInvalid('editCreditsGroup', 'editCreditsError', 'Seed Course credits must be 2'); valid = false; }
  if (type !== 'Institute Core' && type !== 'Seed Course' && !dept) { setInvalid('editDeptGroup', 'editDeptError', 'Department is required'); valid = false; }
  if (!status)  { setInvalid('editStatusGroup', 'editStatusError', 'Status is required'); valid = false; }

  if (!valid) return;

  const idx = appData.courses.findIndex(c => c.code === editingCourseCode);
  if (idx === -1) return;

  const updatedCourse = {
    ...appData.courses[idx],
    name,
    credits: parseInt(credits, 10),
    ugYear,
    semester,
    type,
    dept: type === 'Institute Core' ? '-' : type === 'Seed Course' ? 'All Departments (CSE, ECE, AIDS)' : dept,
    prerequisites: [...editPrereqTags],
    status
  };

  try {
      const res = await fetch(`${API_BASE}/courses/${editingCourseCode}`, {
          method: 'PUT',
          headers: API_HEADERS,
          body: JSON.stringify({
              courseName: updatedCourse.name,
              credits: updatedCourse.credits,
              status: updatedCourse.status,
              deptId: updatedCourse.dept === '-' || updatedCourse.dept.startsWith('All') ? 'CSE' : updatedCourse.dept
          })
      });
      if (res.ok) {
          appData.courses[idx] = updatedCourse;
          closeEditModal();
          applyFiltersAndRender();
      } else {
          const err = await res.json();
          alert('Failed to edit course: ' + (err.message || 'Unknown error'));
      }
  } catch (e) {
      console.error(e);
      alert('Network error while editing course.');
  }
}


/* ══════════ Validation Helpers ══════════ */

function setInvalid(groupId, errorId, message) {
  document.getElementById(groupId).classList.add('form-group--invalid');
  const errEl = document.getElementById(errorId);
  if (errEl) errEl.textContent = message;
}

function clearValidation(prefix) {
  const modal = prefix === 'add'
    ? document.getElementById('addModal')
    : document.getElementById('editModal');
  modal.querySelectorAll('.form-group--invalid').forEach(g => g.classList.remove('form-group--invalid'));
}


/* ══════════ Utility ══════════ */

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function showToast(message) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toastMessage');
  msgEl.textContent = message;
  toast.classList.add('toast--visible');
  setTimeout(() => {
    toast.classList.remove('toast--visible');
  }, 3000);
}