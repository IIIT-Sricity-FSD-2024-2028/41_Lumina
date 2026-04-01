/**
 * Institutional Timetable Controller
 * Manages UI filtering, grid rendering, and Side Panel logic.
 */

let appData;
let editMode = false;

// Side panel contextual state
let panelDay = '';
let panelSlot = '';
let editingAlloc = null;

const TIME_SLOTS = [
  { key: '08:45-09:45', label: '08:45 AM -\n09:45 AM', type: 'slot' },
  { key: '09:45-10:45', label: '09:45 AM -\n10:45 AM', type: 'slot' },
  { key: '10:45-11:00', label: '10:45 - 11:00', type: 'short_break' },
  { key: '11:00-12:00', label: '11:00 AM -\n12:00 PM', type: 'slot' },
  { key: '12:00-13:00', label: '12:00 PM -\n01:00 PM', type: 'slot' },
  { key: '13:00-14:00', label: '01:00 - 02:00', type: 'lunch_break' },
  { key: '14:15-15:15', label: '02:15 PM -\n03:15 PM', type: 'slot' },
  { key: '15:15-16:15', label: '03:15 PM -\n04:15 PM', type: 'slot' },
  { key: '16:15-16:30', label: '04:15 - 04:30', type: 'short_break' },
  { key: '16:30-17:30', label: '04:30 PM -\n05:30 PM', type: 'slot' },
  { key: '17:30-18:30', label: '05:30 PM -\n06:30 PM', type: 'slot' }
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function getSemesterFromTerm(term) {
  return term && term.toLowerCase().includes('spring') ? 'Spring' : 'Monsoon';
}

function normalizeSectionValue(section) {
  if (!section) return '';
  return section.startsWith('Section') ? section : `Section ${section}`;
}

function getMatchingCoursesForTopFilters() {
  const semester = getSemesterFromTerm(document.getElementById('filterTerm').value);
  const ug = document.getElementById('filterUG').value;
  const type = document.getElementById('filterCourseType').value;
  const dept = document.getElementById('filterDept').value;

  let matchingCourses = appData.courses.filter(c => c.status === 'Active' && c.ugYear === ug && c.semester === semester && c.type === type);
  if (type === 'Program Core') {
    matchingCourses = matchingCourses.filter(c => c.dept === dept);
  } else if (type === 'Elective') {
    matchingCourses = matchingCourses.filter(c => c.dept.includes(dept));
  }

  return matchingCourses;
}

function updateCourseDropdown() {
  const filterCourse = document.getElementById('filterCourse');
  const prevVal = filterCourse.value;
  const matchingCourses = getMatchingCoursesForTopFilters();

  filterCourse.innerHTML = '<option value="">All Courses</option>' + matchingCourses
    .map(c => `<option value="${c.code}">${c.code} - ${c.name}</option>`)
    .join('');

  if (matchingCourses.some(c => c.code === prevVal)) {
    filterCourse.value = prevVal;
  } else {
    filterCourse.value = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  appData = typeof loadData === 'function' ? loadData() : [];

  if (typeof renderNavbar === 'function') renderNavbar('timetable');
  if (typeof renderFooter === 'function') renderFooter();

  initFilters();
  
  const editModeBtn = document.getElementById('editModeBtn');
  if (editModeBtn) editModeBtn.addEventListener('click', toggleEditMode);

  initSidePanel();

  renderTimetable();
});

/* ══════════════════════════════════════════
   FILTERS
   ══════════════════════════════════════════ */

function updateSectionDropdown() {
  const selectedCourseCode = document.getElementById('filterCourse').value;
  const filterSection = document.getElementById('filterSection');
  const filterSectionGroup = document.getElementById('filterSectionGroup');
  const type = document.getElementById('filterCourseType').value;
  const matchingCourses = getMatchingCoursesForTopFilters();

  // For Electives: each elective is a separate course with 1 section — section filter is not meaningful.
  // Hide the section group and default to "All Sections".
  if (type === 'Elective') {
    filterSection.innerHTML = '<option value="">All Sections</option>';
    filterSection.value = '';
    filterSection.disabled = true;
    if (filterSectionGroup) filterSectionGroup.style.display = 'none';
    return;
  }

  if (filterSectionGroup) filterSectionGroup.style.display = '';

  let maxSec = 0;
  const scopedCourses = selectedCourseCode
    ? matchingCourses.filter(c => c.code === selectedCourseCode)
    : matchingCourses;

  scopedCourses.forEach(c => {
    const s = parseInt(c.sections, 10) || 1;
    if (s > maxSec) maxSec = s;
  });

  if (maxSec === 0) maxSec = 1;

  let html = '<option value="">All Sections</option>';
  for (let i = 1; i <= maxSec; i++) {
    html += `<option value="Section ${i}">Section ${i}</option>`;
  }

  const prevVal = filterSection.value;
  filterSection.innerHTML = html;
  
  if (html.includes(`"${prevVal}"`)) {
    filterSection.value = prevVal;
  } else {
    filterSection.value = '';
  }
  
  filterSection.disabled = false;
}

function initFilters() {
  const filterTerm = document.getElementById('filterTerm');
  const filterUG = document.getElementById('filterUG');
  const filterType = document.getElementById('filterCourseType');
  const filterDept = document.getElementById('filterDept');
  const filterCourse = document.getElementById('filterCourse');
  const filterSection = document.getElementById('filterSection');

  const updateDerivedFilters = () => {
    const type = filterType.value;
    
    // Department logic
    if (type === 'Institute Core' || type === 'Seed Course') {
      filterDept.innerHTML = '<option value="All Departments">All Departments</option>';
      filterDept.value = 'All Departments';
      filterDept.disabled = true;
    } else {
      filterDept.innerHTML = `
        <option value="CSE">CSE</option>
        <option value="ECE">ECE</option>
        <option value="AIDS">AIDS</option>
      `;
      // Ensure current value still exists, otherwise reset to CSE
      if (!filterDept.value) filterDept.value = 'CSE';
      filterDept.disabled = false;
    }

    updateCourseDropdown();
    updateSectionDropdown();
    renderTimetable();
  };

  filterType.addEventListener('change', updateDerivedFilters);
  filterUG.addEventListener('change', updateDerivedFilters);
  filterDept.addEventListener('change', updateDerivedFilters);

  filterTerm.addEventListener('change', updateDerivedFilters);
  filterCourse.addEventListener('change', () => { updateSectionDropdown(); renderTimetable(); });
  filterSection.addEventListener('change', renderTimetable);

  // Manually trigger to initialize correct states based on default initial value
  updateDerivedFilters();
}

/* ══════════════════════════════════════════
   TIMETABLE RENDERING
   ══════════════════════════════════════════ */

function getCourseCategory(courseCode) {
  const course = appData.courses.find(c => c.code === courseCode);
  if (!course) return null;
  
  if (course.type === 'Institute Core') return 'institute_core';
  if (course.type === 'Seed Course') return 'seed_course';
  if (course.type === 'Program Core') return 'program_core';
  if (course.type === 'Elective') return 'elective';
  return null;
}

function getCardColorClass(courseCode) {
  const course = appData.courses.find(c => c.code === courseCode);
  if (!course) return 'card-institute';

  if (course.type === 'Institute Core') return 'card-institute';
  if (course.type === 'Seed Course') return 'card-seed';
  if (course.type === 'Elective') return 'card-elective';

  if (course.dept === 'CSE') return 'card-cse';
  if (course.dept === 'ECE') return 'card-ece';
  if (course.dept === 'AIDS') return 'card-aids';

  return 'card-institute';
}

function getFilteredAllocations() {
  const term = document.getElementById('filterTerm').value;
  const semester = getSemesterFromTerm(term);
  const ug = document.getElementById('filterUG').value;
  const type = document.getElementById('filterCourseType').value;
  const dept = document.getElementById('filterDept').value;
  const courseCodeFilter = document.getElementById('filterCourse').value;
  const sec = document.getElementById('filterSection').value;

  if (!term || !ug || !type) return [];

  return appData.timetable.filter(alloc => {
    const course = appData.courses.find(c => c.code === alloc.courseCode);
    if (!course) return false;

    // Filter by UG Year
    if (course.ugYear !== ug) return false;
    if (course.semester !== semester) return false;

    // Filter by Course Type
    if (course.type !== type) return false;

    // Filter by Department (If not Institute Core)
    if (type === 'Program Core' && course.dept !== dept) return false;
    if (type === 'Elective' && !course.dept.includes(dept)) return false;
    if (courseCodeFilter && alloc.courseCode !== courseCodeFilter) return false;

    // Filter by Section
    // Account for legacy data where section might be '1' instead of 'Section 1'
    if (sec) {
      const allocSec = normalizeSectionValue(alloc.section);
      if (allocSec !== sec) return false;
    }

    return true;
  });
}

function toggleEditMode() {
  editMode = !editMode;
  const btn = document.getElementById('editModeBtn');
  if (editMode) {
    btn.textContent = '✏️ Deactivate Edit Mode';
    btn.classList.add('is-active');
  } else {
    btn.innerHTML = '<span>✏️</span> Activate Edit Mode';
    btn.classList.remove('is-active');
    closeSidePanel();
  }
  renderTimetable();
}

function renderTimetable() {
  const tbody = document.getElementById('timetableBody');
  const allocs = getFilteredAllocations();
  
  // Need mapping: key="Day|TimeSlot" => elements: []
  const map = {};
  allocs.forEach(a => {
    const k = `${a.day}|${a.timeSlot}`;
    if (!map[k]) map[k] = [];
    map[k].push(a);
  });

  let html = '';

  TIME_SLOTS.forEach(ts => {
    if (ts.type === 'short_break') {
      html += `<tr class="tt-break-row">
        <td class="tt-grid__time-cell">${ts.label.replace('\n', '<br>')}</td>
        <td colspan="5"><div class="tt-break-label">S H O R T &nbsp; B R E A K</div></td>
      </tr>`;
      return;
    }
    if (ts.type === 'lunch_break') {
      html += `<tr class="tt-break-row tt-break-row--lunch">
        <td class="tt-grid__time-cell"><b>${ts.label}</b></td>
        <td colspan="5"><div class="tt-break-label">🍽 L U N C H &nbsp; B R E A K</div></td>
      </tr>`;
      return;
    }

    html += '<tr>';
    html += `<td class="tt-grid__time-cell">${ts.label.replace('\n', '<br>')}</td>`;

    DAYS.forEach(day => {
      const key = `${day}|${ts.key}`;
      const cells = map[key] || [];

      // Cell clickable class if edit mode
      const cellCls = editMode ? 'tt-slot--editable' : '';
      const cellOnClick = editMode ? `onclick="openSidePanel('${day}','${ts.key}',null)"` : '';

      const cardsHTML = cells.map(alloc => {
        const course = appData.courses.find(c => c.code === alloc.courseCode) || {};
        const colorCls = getCardColorClass(alloc.courseCode);
        const clickCls = editMode ? 'slot-card--clickable' : '';

        const escapedJson = JSON.stringify(alloc).replace(/"/g, '&quot;');
        const cardOnClick = editMode 
          ? `onclick="event.stopPropagation(); openSidePanel('${day}','${ts.key}','${escapedJson}')"`
          : '';

        return `
          <div class="slot-card ${colorCls} ${clickCls}" ${cardOnClick}>
            <div class="slot-card__header">
              <span class="slot-card__code">${alloc.courseCode}</span>
              <span class="slot-card__room">${alloc.room}</span>
            </div>
            <div class="slot-card__name">${course.name || ''}</div>
            <div class="slot-card__prof">${alloc.professor}</div>
          </div>
        `;
      }).join('');

      html += `<td class="${cellCls}" ${cellOnClick}>${cardsHTML}</td>`;
    });

    html += '</tr>';
  });

  tbody.innerHTML = html;
}

/* ══════════════════════════════════════════
   SIDE PANEL
   ══════════════════════════════════════════ */

function initSidePanel() {
  document.getElementById('sidePanelClose').addEventListener('click', closeSidePanel);
  document.getElementById('cancelPanelBtn').addEventListener('click', closeSidePanel);
  document.getElementById('sidePanelOverlay').addEventListener('click', closeSidePanel);
  document.getElementById('updateSlotBtn').addEventListener('click', handleUpdateSlot);
  document.getElementById('removeAllocationBtn').addEventListener('click', handleRemoveAllocation);

  ['panelCourse', 'panelSection', 'panelFaculty', 'panelRoom'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      updatePanelSectionVisibility();
      if (id === 'panelCourse' || id === 'panelSection') {
        applyExistingAllocationDefaults();
      }
      runPanelValidation();
    });
  });
}

function openSidePanel(day, slot, allocJsonStr) {
  if (!editMode) return;

  panelDay = day;
  panelSlot = slot;

  if (allocJsonStr) {
    try {
      editingAlloc = JSON.parse(allocJsonStr);
    } catch {
      editingAlloc = null;
    }
  } else {
    editingAlloc = null;
  }

  const ts = TIME_SLOTS.find(t => t.key === slot);
  const labelText = ts ? ts.label.replace('\n', '') : slot;
  document.getElementById('panelSubtitle').textContent = `${day} | ${labelText}`;

  populatePanelDropdowns();

  if (editingAlloc) {
    document.getElementById('panelCourse').value = editingAlloc.courseCode;
    // Account for legacy section values (e.g., '1' vs 'Section 1') if needed. Defaults to option elements val.
    let secVal = editingAlloc.section;
    if (secVal && !secVal.startsWith('Section')) {
      secVal = 'Section ' + secVal; // standardize to match our UI
    }
    document.getElementById('panelSection').value = secVal || 'Section 1';
    
    document.getElementById('panelFaculty').value = editingAlloc.professor;
    document.getElementById('panelRoom').value = editingAlloc.room;
    document.getElementById('removeAllocationBtn').style.display = 'inline';
  } else {
    const topFilterCourse = document.getElementById('filterCourse').value;
    const panelCourse = document.getElementById('panelCourse');
    if (topFilterCourse && Array.from(panelCourse.options).some(option => option.value === topFilterCourse)) {
      panelCourse.value = topFilterCourse;
    } else if (panelCourse.options.length > 0) {
      panelCourse.value = panelCourse.options[0].value;
    }
    document.getElementById('panelSection').value = document.getElementById('filterSection').value || 'Section 1';
    document.getElementById('panelFaculty').value = '';
    document.getElementById('panelRoom').value = '';
    document.getElementById('removeAllocationBtn').style.display = 'none';
  }

  // Pre-validate
  updatePanelSectionVisibility();
  if (!editingAlloc) applyExistingAllocationDefaults();
  runPanelValidation();

  document.getElementById('sidePanel').classList.add('side-panel--open');
  document.getElementById('sidePanelOverlay').classList.add('side-panel-overlay--open');
}

function closeSidePanel() {
  document.getElementById('sidePanel').classList.remove('side-panel--open');
  document.getElementById('sidePanelOverlay').classList.remove('side-panel-overlay--open');
  editingAlloc = null;
}

function updatePanelSectionVisibility() {
  const code = document.getElementById('panelCourse').value;
  const course = code ? appData.courses.find(c => c.code === code) : null;
  const group = document.getElementById('panelSectionGroup');
  const panelSectionEl = document.getElementById('panelSection');
  
  if (!course) {
    group.style.display = 'none';
    return;
  }
  
  group.style.display = 'block';
  
  // Update the dropdown based on the course's section count
  const maxSec = parseInt(course.sections) || 1;
  const prevVal = panelSectionEl.value;
  
  let html = '';
  for (let i = 1; i <= maxSec; i++) {
    html += `<option value="Section ${i}">Section ${i}</option>`;
  }
  
  panelSectionEl.innerHTML = html;
  
  if (html.includes(`"${prevVal}"`)) {
    panelSectionEl.value = prevVal;
  } else {
    panelSectionEl.value = 'Section 1';
  }
}

function runPanelValidation() {
  const courseCode = document.getElementById('panelCourse').value;
  const faculty = document.getElementById('panelFaculty').value;
  const room = document.getElementById('panelRoom').value;
  
  const section = document.getElementById('panelSectionGroup').style.display !== 'none' 
    ? document.getElementById('panelSection').value 
    : '';

  const draft = {
    day: panelDay,
    timeSlot: panelSlot,
    professor: faculty,
    room: room,
    editingAlloc
  };

  const valRes = validateSlot(draft, appData);
  
  setValidItem('valFaculty', faculty ? (valRes.facultyOk ? 'ok' : 'error') : 'neutral', valRes.facultyMsg);
  setValidItem('valRoom', room ? (valRes.roomOk ? 'ok' : 'error') : 'neutral', valRes.roomMsg);

  const updateBtn = document.getElementById('updateSlotBtn');
  updateBtn.disabled = !(courseCode && faculty && room && valRes.facultyOk && valRes.roomOk);
}

function setValidItem(id, status, msg) {
  const el = document.getElementById(id);
  el.className = 'validation-item';
  let iconHTML = '<img src="assets/icons/minus.svg" alt="" class="validation-icon">';
  if (status === 'ok') {
    iconHTML = '<img src="assets/icons/tick.svg" alt="" class="validation-icon">';
    el.classList.add('validation-item--ok');
  } else if (status === 'error') {
    iconHTML = '<img src="assets/icons/error.svg" alt="" class="validation-icon">';
    el.classList.add('validation-item--error');
  }
  el.innerHTML = `${iconHTML} <span>${msg}</span>`;
}
function handleUpdateSlot() {
  const courseCode = document.getElementById('panelCourse').value;
  const faculty = document.getElementById('panelFaculty').value;
  const room = document.getElementById('panelRoom').value;
  const section = document.getElementById('panelSectionGroup').style.display !== 'none' 
    ? document.getElementById('panelSection').value 
    : '';

  if (!courseCode || !faculty || !room) {
    alert('Please fill out all required fields.');
    return;
  }

  const newAlloc = {
    day: panelDay,
    timeSlot: panelSlot,
    courseCode,
    room,
    professor: faculty,
    section
  };

  if (editingAlloc) {
    updateAllocation(editingAlloc, newAlloc, appData);
  } else {
    addAllocation(newAlloc, appData);
  }

  closeSidePanel();
  renderTimetable();
}

function handleRemoveAllocation() {
  if (!editingAlloc) return;
  if (!confirm('Are you sure you want to remove this course slot?')) return;
  removeAllocation(editingAlloc, appData);
  closeSidePanel();
  renderTimetable();
}


function applyExistingAllocationDefaults() {
  if (editingAlloc) return;

  const courseCode = document.getElementById('panelCourse').value;
  const section = document.getElementById('panelSection').value;
  if (!courseCode || !section) return;

  const existingAlloc = appData.timetable.find(alloc =>
    alloc.courseCode === courseCode &&
    normalizeSectionValue(alloc.section) === section
  );

  if (!existingAlloc) return;

  document.getElementById('panelFaculty').value = existingAlloc.professor || '';
}

function populatePanelDropdowns() {
  const topFilterCourse = document.getElementById('filterCourse').value;
  let matchingCourses = getMatchingCoursesForTopFilters();
  if (topFilterCourse) {
    matchingCourses = matchingCourses.filter(c => c.code === topFilterCourse);
  }

  const courseEl = document.getElementById('panelCourse');
  courseEl.innerHTML = matchingCourses
    .map(c => `<option value="${c.code}">${c.code} - ${c.name}</option>`)
    .join('');

  const facEl = document.getElementById('panelFaculty');
  facEl.innerHTML = '<option value="">Select Faculty</option>' + appData.faculty.map(f => {
    const mockDraft = { day: panelDay, timeSlot: panelSlot, professor: f.name, room: '', editingAlloc };
    const { facultyOk } = validateSlot(mockDraft, appData);
    const marker = !facultyOk ? ' [Conflict]' : '';
    return `<option value="${f.name}">${f.name} (${f.dept})${marker}</option>`;
  }).join('');

  const roomEl = document.getElementById('panelRoom');
  roomEl.innerHTML = '<option value="">Select Room</option>' + appData.rooms.map(r => {
    const mockDraft = { day: panelDay, timeSlot: panelSlot, professor: '', room: r.name, editingAlloc };
    const { roomOk } = validateSlot(mockDraft, appData);
    const marker = !roomOk ? ' [Booked]' : '';
    return `<option value="${r.name}">${r.name} (Cap: ${r.capacity})${marker}</option>`;
  }).join('');
}

