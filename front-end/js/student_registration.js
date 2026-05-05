/* ==========================================
   registration.js — Backend-Driven
   All data fetched from http://localhost:3000
========================================== */

var API_BASE = 'http://localhost:3000';

/* ── SESSION & HEADERS ── */
var sessionData = localStorage.getItem('Lumina_Session');
var currentUser = sessionData ? JSON.parse(sessionData) : null;
var CURRENT_STUDENT_ID = currentUser ? currentUser.User_ID : 'S2024002';

var headers = {
  'Content-Type': 'application/json',
  'x-role': currentUser ? currentUser.Role : 'Student',
};

/* ── IN-MEMORY DATA (populated from API) ── */
var courses = [];
var studentCourseItems = []; // [{course, sections, courseType, studentSemester}] from /courses/for-student/
var registrations = [];
var overrides = [];
var currentSemester = null;
var activeTermName = '';

var searchQuery = '';
var typeFilter = 'All';
var creditFilter = 'All';

/* ── NAVIGATION ── */
function navigate(viewId) {
  document.querySelectorAll('.reg-view').forEach(function (v) {
    v.classList.remove('active');
  });
  var target = document.getElementById(viewId);
  if (target) target.classList.add('active');

  document.querySelectorAll('.sub-nav-btn').forEach(function (btn) {
    btn.classList.remove('active');
    if (btn.dataset.target === viewId) btn.classList.add('active');
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* Sub-nav buttons */
document.querySelectorAll('.sub-nav-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    navigate(btn.dataset.target);
  });
});

/* ── BUILD COURSE CARDS FROM API DATA ── */
/* Uses studentCourseItems fetched from /courses/for-student/:id          */
/* Only courses for the student's current semester that have sections     */
function buildCoursesData() {
  var typeTagMap = {
    'Institute Core': 'tag-core',
    'Program Core': 'tag-prog',
    'Elective': 'tag-elec',
    'Program Elective': 'tag-elec',
    'Institute Elective': 'tag-elec',
    'Open Elective': 'tag-elec',
    'SEED': 'tag-seed',
    'Core': 'tag-core',
  };

  return studentCourseItems.map(function (item) {
    var course = item.course;
    var courseType = item.courseType;
    var sections = item.sections; // [{sectionId, sectionName, courseId, termId}]

    var enrolled = registrations.filter(function (r) {
      return r.courseId === course.courseId && r.status === 'Enrolled';
    }).length;
    var seatsLeft = course.courseCapacity - enrolled;

    var studentReg = registrations.find(function (r) {
      return r.studentId === CURRENT_STUDENT_ID && r.courseId === course.courseId &&
        (r.status === 'Enrolled' || r.status === 'Waitlisted' || r.status === 'Pending_Allocation');
    });

    var sectionLabel = sections.map(function (s) { return s.sectionName; }).join(', ');

    return {
      id: course.courseId,
      code: course.courseId,
      title: course.courseName,
      type: courseType,
      typeTag: typeTagMap[courseType] || 'tag-core',
      prof: '—',
      credits: course.credits,
      sectionIds: sections.map(function (s) { return s.sectionId; }),
      sectionLabel: sectionLabel,
      seats: seatsLeft + ' / ' + course.courseCapacity + ' seats left',
      prereq: null,
      prereqError: false,
      deptId: course.deptId,
      isEnrolled: !!studentReg,
      status: studentReg ? studentReg.status : null,
    };
  });
}

/* ── Module data (static) ── */
var courseModules = {
  'CS101': ['Intro to Python', 'Control Flow', 'Functions & Recursion', 'File I/O'],
  'CS201': ['Sorting & Searching', 'Trees & Graphs', 'Dynamic Programming', 'Advanced Graph Algorithms'],
  'CS301': ['Process Management', 'Memory Management', 'File Systems', 'Scheduling Algorithms'],
  'CS302': ['Relational Model', 'SQL & Query Optimization', 'Normalization', 'Transactions & Concurrency'],
  'CS401': ['Network Layers', 'TCP/IP', 'Routing Algorithms', 'Network Security'],
  'CS405': ['Regular Languages', 'Context-Free Grammars', 'Pushdown Automata', 'Turing Machines'],
  'CS440': ['ML Fundamentals', 'Neural Networks', 'Deep Learning', 'Applied AI Projects'],
  'EC101': ['Boolean Algebra', 'Combinational Circuits', 'Sequential Circuits', 'Memory & PLDs'],
  'EC201': ['Continuous Signals', 'Discrete Signals', 'Fourier Transform', 'Z-Transform'],
  'EC301': ['8085 Architecture', 'Assembly Programming', 'Interfacing Techniques', 'Embedded Applications'],
  'EC402': ['MOS Transistors', 'CMOS Logic Design', 'Static Timing Analysis', 'Physical Design'],
  'AD101': ['Data Wrangling', 'Exploratory Analysis', 'Visualization', 'Statistical Inference'],
  'AD201': ['Supervised Learning', 'Unsupervised Learning', 'Model Evaluation', 'Feature Engineering'],
  'AD301': ['Neural Networks', 'CNN & RNN', 'Transformers', 'Generative Models'],
  'AD405': ['Hadoop & Spark', 'NoSQL Databases', 'Stream Processing', 'Data Pipelines'],
  'SE101': ['Design Thinking', 'Ideation Techniques', 'Prototyping', 'Innovation Frameworks'],
};

/* ── ENROLLED COURSES (from registrations array) ── */
function loadEnrolled() {
  return registrations
    .filter(function (r) {
      return r.studentId === CURRENT_STUDENT_ID &&
        (r.status === 'Enrolled' || r.status === 'Waitlisted') &&
        courses.some(function (c) { return c.courseId === r.courseId; });
    })
    .map(function (r) {
      var course = courses.find(function (c) { return c.courseId === r.courseId; });
      return {
        id: r.courseId,
        title: course ? course.courseName : r.courseId,
        prof: '—',
        credits: course ? course.credits : 0,
        type: course ? course.deptId : '',
        status: r.status,
      };
    });
}

/* ── FILTER SETUP ── */
function setupFilters() {
  document.getElementById('searchInput').addEventListener('input', function () {
    searchQuery = this.value.toLowerCase();
    renderGrid();
  });

  document.querySelectorAll('[data-filter="type"]').forEach(function (pill) {
    pill.addEventListener('click', function () {
      document.querySelectorAll('[data-filter="type"]').forEach(function (p) {
        p.classList.remove('active');
      });
      pill.classList.add('active');
      typeFilter = pill.dataset.value;
      renderGrid();
    });
  });

  document.querySelectorAll('[data-filter="credit"]').forEach(function (pill) {
    pill.addEventListener('click', function () {
      if (pill.classList.contains('active')) {
        pill.classList.remove('active');
        creditFilter = 'All';
      } else {
        document.querySelectorAll('[data-filter="credit"]').forEach(function (p) {
          p.classList.remove('active');
        });
        pill.classList.add('active');
        creditFilter = pill.dataset.value;
      }
      renderGrid();
    });
  });
}

/* ── RENDER COURSE GRID ── */
var coursesData = [];

function renderGrid() {
  var container = document.getElementById('coursesGrid');
  container.innerHTML = '';

  var filtered = coursesData.filter(function (course) {
    var matchSearch = course.title.toLowerCase().includes(searchQuery) ||
      course.id.toLowerCase().includes(searchQuery);
    var matchType = typeFilter === 'All' || course.type === typeFilter;
    var matchCredit = creditFilter === 'All' || course.credits.toString() === creditFilter;
    return matchSearch && matchType && matchCredit;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state">No courses match your filters.</div>';
    return;
  }

  filtered.forEach(function (course) {
    var card = document.createElement('div');
    card.className = 'course-card';

    var btnLabel = course.isEnrolled ? '✓ ' + (course.status || 'Enrolled') : 'Enroll';
    var btnDisabled = course.isEnrolled ? 'disabled' : '';
    var sectionBadge = course.sectionLabel
      ? '<span style="font-size:0.75rem;color:#64748b;">📚 Section: ' + course.sectionLabel + '</span>'
      : '';

    card.innerHTML =
      '<div class="cc-top-row">' +
      '<span class="course-code-badge">' + course.code + '</span>' +
      '<span class="course-type-tag ' + course.typeTag + '">' + course.type + '</span>' +
      '</div>' +
      '<h3 class="course-title">' + course.title + '</h3>' +
      '<div class="course-meta">' +
      '<span>👨‍🏫 ' + course.prof + '</span>' +
      '<span>⭐ ' + course.credits + ' Credits</span>' +
      '<span class="seats">👥 ' + course.seats + '</span>' +
      '</div>' +
      (sectionBadge ? '<div style="margin:4px 0;">' + sectionBadge + '</div>' : '') +
      (course.prereq
        ? '<div class="prereq-warn">⚠ Prerequisite: ' + course.prereq + '</div>'
        : '') +
      '<div class="card-btns">' +
      '<button class="btn-enroll" ' + btnDisabled + '>' + btnLabel + '</button>' +
      '<button class="btn-details">Details</button>' +
      '</div>';

    /* Enroll button — sends POST to backend */
    if (!course.isEnrolled) {
      card.querySelector('.btn-enroll').addEventListener('click', function () {
        handleEnroll(course);
      });
    }

    /* Details button */
    card.querySelector('.btn-details').addEventListener('click', function () {
      openCourseDetail(course);
    });

    container.appendChild(card);
  });
}

/* ── HANDLE ENROLL (POST /registrations → backend) ── */
async function handleEnroll(course) {
  try {
    var res = await fetch(API_BASE + '/registrations', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        Student_ID: CURRENT_STUDENT_ID,
        Course_ID: course.id,
      }),
    });

    if (!res.ok) {
      var errData = await res.json();
      var errMsg = errData.message || 'Enrollment failed.';

      /* Show error view with backend message */
      document.getElementById('errorBadge').textContent = '⚠️ ENROLLMENT ERROR';
      document.getElementById('errorMsg').textContent = errMsg;

      /* Pre-fill the override form with the failed course */
      populateOverrideForm(course.id, errMsg);

      navigate('view-error');
      return;
    }

    /* Success — add the new registration to local array */
    var newReg = await res.json();
    registrations.push(newReg);

    /* Rebuild and re-render */
    coursesData = buildCoursesData();
    renderGrid();
    renderMyCoursesSection();

    /* Show success view */
    var successText = document.querySelector('#view-success p');
    if (successText) {
      successText.innerHTML =
        'Your enrollment has been processed. Course: <strong>' + course.title +
        '</strong> — Status: <strong>' + newReg.status + '</strong>.';
    }
    navigate('view-success');

  } catch (err) {
    console.error('Enrollment network error:', err);
    alert('Network error. Please check the backend connection.');
  }
}

/* ── POPULATE OVERRIDE FORM ── */
function populateOverrideForm(courseId, reason) {
  var courseSelect = document.querySelector('#overrideForm select');
  if (courseSelect) {
    courseSelect.innerHTML = '';
    var opt = document.createElement('option');
    opt.value = courseId;
    var c = courses.find(function (cc) { return cc.courseId === courseId; });
    opt.textContent = courseId + (c ? ' — ' + c.courseName : '');
    courseSelect.appendChild(opt);
  }
}

/* ── REMOVE COURSE (local only for now) ── */
function removeCourse(courseId) {
  registrations = registrations.filter(function (r) {
    return !(r.studentId === CURRENT_STUDENT_ID && r.courseId === courseId);
  });
  coursesData = buildCoursesData();
  renderGrid();
  renderMyCoursesSection();
}

/* ── UPDATE STATIC PAGE COPY ── */
function updateStaticPageCopy() {
  var studentIdEl = document.querySelector('.override-info .info-card .info-val');
  if (studentIdEl) {
    studentIdEl.textContent = CURRENT_STUDENT_ID;
  }
}

function updateSemesterBanner() {
  var semesterLabel = document.getElementById('currentSemesterLabel');
  var termLabel = document.getElementById('activeTermLabel');
  if (semesterLabel) {
    semesterLabel.textContent = currentSemester ? 'Semester ' + currentSemester : '—';
  }
  if (termLabel) {
    termLabel.textContent = activeTermName ? '(' + activeTermName + ')' : '';
  }
}

/* ── RENDER SIDEBAR ── */


function renderMyCoursesSection() {
  var enrolled = loadEnrolled();
  var list = document.getElementById('myCoursesList');
  if (!list) return;

  list.innerHTML = '';
  if (enrolled.length === 0) {
    list.innerHTML = '<p style="font-size:12.5px;color:#94a3b8;padding:12px 0;">No courses enrolled yet. Click Enroll on a course to add it here.</p>';
    return;
  }

  enrolled.forEach(function (course) {
    var item = document.createElement('div');
    item.className = 'my-course-item';
    item.innerHTML =
      '<div class="my-course-code">' + course.id + '</div>' +
      '<div class="my-course-title">' + course.title + '</div>' +
      '<div class="my-course-status">' + course.credits + ' Credits · ' + course.status + '</div>';
    list.appendChild(item);
  });
}

/* ── COURSE DETAIL POPUP ── */
function openCourseDetail(course) {
  document.getElementById('courseDetailTitle').textContent = course.title;

  var body = document.getElementById('courseDetailBody');
  var modules = courseModules[course.id] || ['Module – 1', 'Module – 2', 'Module – 3', 'Module – 4'];

  body.innerHTML = '';

  var syllabusRow = document.createElement('div');
  syllabusRow.className = 'module-row';
  syllabusRow.innerHTML =
    '<div class="module-bar"></div>' +
    '<span class="module-name">Syllabus</span>' +
    '<button class="dark-btn small-btn">Download</button>';
  syllabusRow.querySelector('button').addEventListener('click', showToast);
  body.appendChild(syllabusRow);

  modules.forEach(function (moduleName, idx) {
    var row = document.createElement('div');
    row.className = 'module-row';
    row.innerHTML =
      '<div class="module-bar"></div>' +
      '<span class="module-name">Module – ' + (idx + 1) + ': ' + moduleName + '</span>' +
      '<button class="dark-btn small-btn">Download</button>';
    row.querySelector('button').addEventListener('click', showToast);
    body.appendChild(row);
  });

  document.getElementById('courseDetailPopup').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCourseDetail() {
  document.getElementById('courseDetailPopup').classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('courseDetailPopup').addEventListener('click', function (e) {
  if (e.target === this) closeCourseDetail();
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeCourseDetail();
});

/* ── TOAST ── */
var toastTimer = null;
function showToast() {
  var toast = document.getElementById('toast');
  if (toastTimer) clearTimeout(toastTimer);
  toast.classList.add('show');
  toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2500);
}

/* ── OVERRIDE FORM (POST /overrides → backend) ── */
document.getElementById('overrideForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  var courseSelect = this.querySelector('select');
  var courseId = courseSelect ? courseSelect.value : '';
  var justification = document.getElementById('justification').value.trim();

  if (!courseId || !justification) {
    alert('Please fill in all required fields.');
    return;
  }

  try {
    var res = await fetch(API_BASE + '/overrides', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        Student_ID: CURRENT_STUDENT_ID,
        Course_ID: courseId,
        Reason: justification,
      }),
    });

    if (!res.ok) {
      var errData = await res.json();
      alert('Override submission failed: ' + (errData.message || 'Unknown error'));
      return;
    }

    var newOverride = await res.json();
    overrides.push(newOverride);

    alert('Override Request Submitted Successfully! Request ID: ' + newOverride.requestId);
    e.target.reset();
    document.getElementById('charCount').textContent = '0 / 1500';
    navigate('view-selection');

  } catch (err) {
    console.error('Override submission error:', err);
    alert('Network error. Please check the backend connection.');
  }
});

/* Char counter for justification textarea */
document.getElementById('justification').addEventListener('input', function () {
  document.getElementById('charCount').textContent = this.value.length + ' / 1500';
});

/* ── RENDER VALIDATION STATUS ── */
function renderValidationStatus() {
  // Enrollment statuses
  var enrollList = document.getElementById('enrollmentStatusList');
  var studentRegs = registrations.filter(function (r) {
    return r.studentId === CURRENT_STUDENT_ID &&
      courses.some(function (c) { return c.courseId === r.courseId; });
  });

  if (studentRegs.length === 0) {
    enrollList.innerHTML = '<p style="color:#94a3b8;text-align:center;">No enrollment records found.</p>';
  } else {
    enrollList.innerHTML = '';
    studentRegs.forEach(function (reg) {
      var course = courses.find(function (c) { return c.courseId === reg.courseId; }) || {};
      var statusColor = reg.status === 'Enrolled' ? '#10b981' :
        reg.status === 'Waitlisted' ? '#f59e0b' : '#6366f1';
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;';
      row.innerHTML =
        '<div>' +
        '<div style="font-weight:600;color:#1e293b;">' + (course.courseName || reg.courseId) + '</div>' +
        '<div style="font-size:0.8rem;color:#64748b;">' + reg.courseId + ' · ' + (reg.termId || '') + ' · ' + (course.credits || 0) + ' Credits</div>' +
        '</div>' +
        '<span style="padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:600;color:white;background:' + statusColor + ';">' + reg.status + '</span>';
      enrollList.appendChild(row);
    });
  }

  // Override statuses
  var overrideList = document.getElementById('overrideStatusList');
  if (overrides.length === 0) {
    overrideList.innerHTML = '<p style="color:#94a3b8;text-align:center;">No override requests submitted.</p>';
  } else {
    overrideList.innerHTML = '';
    overrides.forEach(function (ov) {
      var course = courses.find(function (c) { return c.courseId === ov.courseId; }) || {};
      var statusColor = ov.approvalStatus === 'Approved' ? '#10b981' :
        ov.approvalStatus === 'Rejected' ? '#ef4444' : '#f59e0b';
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;';
      row.innerHTML =
        '<div>' +
        '<div style="font-weight:600;color:#1e293b;">' + (course.courseName || ov.courseId) + ' Override</div>' +
        '<div style="font-size:0.8rem;color:#64748b;">Request #' + ov.requestId + ' · ' + (ov.reason || '').substring(0, 60) + (ov.reason && ov.reason.length > 60 ? '...' : '') + '</div>' +
        '</div>' +
        '<span style="padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:600;color:white;background:' + statusColor + ';">' + ov.approvalStatus + '</span>';
      overrideList.appendChild(row);
    });
  }
}

/* ── INIT: FETCH FROM BACKEND & RENDER ── */
document.addEventListener('DOMContentLoaded', async function () {
  try {
    /* Fetch courses for this student's semester (only those with sections in active term) */
    var fetchPromises = [
      fetch(API_BASE + '/courses/for-student/' + CURRENT_STUDENT_ID, { headers: headers }),
      fetch(API_BASE + '/registrations', { headers: { 'x-role': 'Dean' } }),
    ];

    if (CURRENT_STUDENT_ID) {
      fetchPromises.push(
        fetch(API_BASE + '/overrides/my/' + CURRENT_STUDENT_ID, { headers: headers })
      );
    }

    var results = await Promise.all(fetchPromises);

    if (results[0].ok) {
      var raw = await results[0].json();
      if (raw && raw.courses && Array.isArray(raw.courses)) {
        studentCourseItems = raw.courses;
        courses = raw.courses.map(function (item) { return item.course; });
        currentSemester = raw.currentSemester || currentSemester;
        activeTermName = raw.activeTerm || activeTermName;
      } else if (Array.isArray(raw) && raw.length > 0) {
        /* Plain course list fallback */
        courses = raw;
        studentCourseItems = raw.map(function (c) {
          return { course: c, sections: [], courseType: c.courseType || 'Program Core' };
        });
      }
    }
    if (results[1].ok) registrations = await results[1].json();
    if (results[2] && results[2].ok) overrides = await results[2].json();
  } catch (err) {
    console.error('Failed to fetch data from backend:', err);
  }

  updateStaticPageCopy();
  setupFilters();
  coursesData = buildCoursesData();
  renderGrid();
  renderMyCoursesSection();
  renderValidationStatus();
  updateSemesterBanner();

  /* ── Auto-navigate if coming from dashboard "My Courses" link ── */
  var regGoto = sessionStorage.getItem('reg_goto');
  if (regGoto) {
    sessionStorage.removeItem('reg_goto');
    navigate(regGoto);
  }
});