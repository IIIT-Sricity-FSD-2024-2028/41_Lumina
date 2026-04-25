/* ==========================================
   registration.js
   Data from mockData.js via localStorage
========================================== */

/* ── DB HELPERS ── */
function getTable(name) {
  try { return JSON.parse(localStorage.getItem('Lumina_' + name)) || []; }
  catch(e) { return []; }
}

function setTable(name, value) {
  localStorage.setItem('Lumina_' + name, JSON.stringify(value));
}

var CURRENT_STUDENT_ID = 'S2024002';
var currentStudent = null;
var currentUser = null;
var activeTerm = null;
var searchQuery = '';
var typeFilter = 'All';
var creditFilter = 'All';

function syncCurrentContext() {
  CURRENT_STUDENT_ID = 'S2024002';
  var users = getTable('Users');
  var students = getTable('Students');
  currentStudent = students.find(function(s) { return s.Student_ID === CURRENT_STUDENT_ID; }) || {};
  currentUser = users.find(function(u) { return u.User_ID === CURRENT_STUDENT_ID; }) || {};
  activeTerm = getActiveRegistrationTerm();
}

function getCurrentSemesterCourseIds() {
  var degreeReqs = getTable('Degree_Requirements');
  var semNum = currentStudent.Current_Semester || 4;
  var deptId = currentUser.Dept_ID || '';

  return degreeReqs
    .filter(function(req) {
      return req.Target_Semester === semNum && (!deptId || req.Dept_ID === deptId);
    })
    .map(function(req) { return req.Course_ID; });
}

function getActiveRegistrationTerm() {
  var terms = getTable('Academic_Term');
  var sections = getTable('Section');
  var semesterCourseIds = getCurrentSemesterCourseIds();
  var matchingTerms = terms.filter(function(term) {
    return sections.some(function(section) {
      return section.Term_ID === term.Term_ID && semesterCourseIds.indexOf(section.Course_ID) !== -1;
    });
  });

  matchingTerms.sort(function(a, b) {
    return new Date(a.Start_Timestamp) - new Date(b.Start_Timestamp);
  });

  return matchingTerms[0] || terms[0] || {};
}

/* ── Build coursesData from mock DB ── */
function buildCoursesData() {
  var catalog     = getTable('Course_Catalog');
  var prereqs     = getTable('Course_Prerequisite');
  var sections    = getTable('Section');
  var slots       = getTable('Course_Slot');
  var users       = getTable('Users');
  var registrations = getTable('Registration');
  var degreeReqs  = getTable('Degree_Requirements');
  var semesterCourseIds = getCurrentSemesterCourseIds();

  /* Count current enrollments per section for seat display */
  var enrollCount = {};
  registrations.forEach(function(r) {
    if (r.Term_ID === activeTerm.Term_ID) {
      enrollCount[r.Course_ID] = (enrollCount[r.Course_ID] || 0) + 1;
    }
  });

  /* Type tag map */
  var typeTagMap = {
    'Institute Core': 'tag-core',
    'Program Core':   'tag-prog',
    'Elective':       'tag-elec',
    'SEED':           'tag-seed',
  };

  return catalog
    .filter(function(c) {
      return c.Status === 'Active' && semesterCourseIds.indexOf(c.Course_ID) !== -1;
    })
    .map(function(course) {
      /* Find section for this course in active term */
      var section = sections.find(function(s) {
        return s.Course_ID === course.Course_ID && s.Term_ID === activeTerm.Term_ID;
      }) || {};

      /* Find slot */
      var slot = slots.find(function(sl) {
        return sl.Section_ID === section.Section_ID;
      }) || {};

      /* Faculty */
      var faculty = users.find(function(u) {
        return u.User_ID === slot.Faculty_ID;
      }) || {};

      /* Prereq */
      var prereqEntry = prereqs.find(function(p) {
        return p.Target_Course_ID === course.Course_ID;
      });
      var prereqCourse = prereqEntry
        ? catalog.find(function(c) { return c.Course_ID === prereqEntry.Required_Course_ID; })
        : null;

      /* Course type from degree requirements */
      var degReq = degreeReqs.find(function(d) { return d.Course_ID === course.Course_ID; });
      var courseType = degReq ? degReq.Course_Type : 'Elective';

      /* Seats */
      var enrolled = enrollCount[course.Course_ID] || 0;
      var seatsLeft = course.Course_Capacity - enrolled;

      return {
        id:          course.Course_ID,
        code:        course.Course_ID,
        title:       course.Course_Name,
        type:        courseType,
        typeTag:     typeTagMap[courseType] || 'tag-elec',
        prof:        faculty.Full_Name || '—',
        credits:     course.Credits,
        sectionId:   section.Section_ID || null,
        seats:       seatsLeft + ' / ' + course.Course_Capacity + ' seats left',
        prereq:      prereqCourse ? prereqCourse.Course_Name + ' (' + prereqCourse.Course_ID + ')' : null,
        prereqError: prereqEntry ? !hasCompletedCourse(prereqEntry.Required_Course_ID) : false,
        deptId:      course.Dept_ID,
      };
    })
    .filter(function(course) {
      return !!course.sectionId;
    });
}

function hasCompletedCourse(courseId) {
  var registrations = getTable('Registration');
  return registrations.some(function(r) {
    return r.Student_ID === CURRENT_STUDENT_ID && r.Course_ID === courseId;
  });
}

/* ── Module data (static — not in mockDB) ── */
var courseModules = {
  'CS101': ['Intro to Python',        'Control Flow',           'Functions & Recursion',    'File I/O'],
  'CS201': ['Sorting & Searching',    'Trees & Graphs',         'Dynamic Programming',      'Advanced Graph Algorithms'],
  'CS301': ['Process Management',     'Memory Management',      'File Systems',             'Scheduling Algorithms'],
  'CS302': ['Relational Model',       'SQL & Query Optimization','Normalization',           'Transactions & Concurrency'],
  'CS401': ['Network Layers',         'TCP/IP',                 'Routing Algorithms',       'Network Security'],
  'CS405': ['Regular Languages',      'Context-Free Grammars',  'Pushdown Automata',        'Turing Machines'],
  'EC101': ['Boolean Algebra',        'Combinational Circuits', 'Sequential Circuits',      'Memory & PLDs'],
  'EC201': ['Continuous Signals',     'Discrete Signals',       'Fourier Transform',        'Z-Transform'],
  'EC301': ['8085 Architecture',      'Assembly Programming',   'Interfacing Techniques',   'Embedded Applications'],
  'EC402': ['MOS Transistors',        'CMOS Logic Design',      'Static Timing Analysis',   'Physical Design'],
  'AD101': ['Data Wrangling',         'Exploratory Analysis',   'Visualization',            'Statistical Inference'],
  'AD201': ['Supervised Learning',    'Unsupervised Learning',  'Model Evaluation',         'Feature Engineering'],
  'AD301': ['Neural Networks',        'CNN & RNN',              'Transformers',             'Generative Models'],
  'AD405': ['Hadoop & Spark',         'NoSQL Databases',        'Stream Processing',        'Data Pipelines'],
  'SE101': ['Design Thinking',        'Ideation Techniques',    'Prototyping',              'Innovation Frameworks'],
};

function loadEnrolled() {
  var registrations = getTable('Registration');
  var catalog       = getTable('Course_Catalog');
  var slots         = getTable('Course_Slot');
  var sections      = getTable('Section');
  var users         = getTable('Users');

  return registrations
    .filter(function(r) {
      return r.Student_ID === CURRENT_STUDENT_ID && r.Term_ID === activeTerm.Term_ID;
    })
    .map(function(r) {
      var course  = catalog.find(function(c) { return c.Course_ID === r.Course_ID; }) || {};
      var slot    = slots.find(function(sl) { return sl.Section_ID === r.Section_ID; }) || {};
      var faculty = users.find(function(u) { return u.User_ID === slot.Faculty_ID; }) || {};
      return {
        id:      r.Course_ID,
        title:   course.Course_Name || r.Course_ID,
        prof:    faculty.Full_Name  || '—',
        credits: course.Credits     || 0,
        type:    course.Dept_ID     || '',
        termId:  r.Term_ID,
        sectionId: r.Section_ID,
      };
    });
}

/* ── Build coursesData on load ── */
var coursesData = [];

/* ── NAVIGATION ── */
function navigate(viewId) {
  document.querySelectorAll('.reg-view').forEach(function(v) {
    v.classList.remove('active');
  });
  var target = document.getElementById(viewId);
  if (target) target.classList.add('active');

  document.querySelectorAll('.sub-nav-btn').forEach(function(btn) {
    btn.classList.remove('active');
    if (btn.dataset.target === viewId) btn.classList.add('active');
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* Sub-nav buttons */
document.querySelectorAll('.sub-nav-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    navigate(btn.dataset.target);
  });
});

/* ── FILTER SETUP ── */
function setupFilters() {
  /* Search */
  document.getElementById('searchInput').addEventListener('input', function() {
    searchQuery = this.value.toLowerCase();
    renderGrid();
  });

  /* Type pills */
  document.querySelectorAll('[data-filter="type"]').forEach(function(pill) {
    pill.addEventListener('click', function() {
      document.querySelectorAll('[data-filter="type"]').forEach(function(p) {
        p.classList.remove('active');
      });
      pill.classList.add('active');
      typeFilter = pill.dataset.value;
      renderGrid();
    });
  });

  /* Credit pills (toggle) */
  document.querySelectorAll('[data-filter="credit"]').forEach(function(pill) {
    pill.addEventListener('click', function() {
      if (pill.classList.contains('active')) {
        pill.classList.remove('active');
        creditFilter = 'All';
      } else {
        document.querySelectorAll('[data-filter="credit"]').forEach(function(p) {
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
function renderGrid() {
  var enrolled  = loadEnrolled();
  var container = document.getElementById('coursesGrid');
  container.innerHTML = '';

  var filtered = coursesData.filter(function(course) {
    var matchSearch = course.title.toLowerCase().includes(searchQuery) ||
                      course.id.toLowerCase().includes(searchQuery);
    var matchType   = typeFilter === 'All' || course.type === typeFilter;
    var matchCredit = creditFilter === 'All' || course.credits.toString() === creditFilter;
    return matchSearch && matchType && matchCredit;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state">No courses match your filters.</div>';
    return;
  }

  filtered.forEach(function(course) {
    var isEnrolled = enrolled.some(function(e) { return e.id === course.id; });

    var card = document.createElement('div');
    card.className = 'course-card';

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
      (course.prereq
        ? '<div class="prereq-warn">⚠ Prerequisite: ' + course.prereq + '</div>'
        : '') +
      '<div class="card-btns">' +
        '<button class="btn-enroll" ' + (isEnrolled ? 'disabled' : '') + '>' +
          (isEnrolled ? '✓ Enrolled' : 'Enroll') +
        '</button>' +
        '<button class="btn-details">Details</button>' +
      '</div>';

    /* Enroll button */
    if (!isEnrolled) {
      card.querySelector('.btn-enroll').addEventListener('click', function() {
        handleEnroll(course);
      });
    }

    /* Details button — opens course detail popup */
    card.querySelector('.btn-details').addEventListener('click', function() {
      openCourseDetail(course);
    });

    container.appendChild(card);
  });
}

/* ── HANDLE ENROLL ── */
function handleEnroll(course) {
  if (course.prereqError) {
    document.getElementById('errorBadge').textContent =
      '⚠️ MISSING: ' + course.prereq;
    document.getElementById('errorMsg').textContent =
      'You cannot enroll in "' + course.title + '" until you have completed ' + course.prereq + '.';
    navigate('view-error');
    return;
  }

  var registrations = getTable('Registration');
  var exists = registrations.some(function(r) {
    return r.Student_ID === CURRENT_STUDENT_ID &&
           r.Course_ID === course.id &&
           r.Term_ID === activeTerm.Term_ID;
  });
  if (!exists) {
    var nextEnrollmentId = registrations.reduce(function(max, item) {
      return Math.max(max, item.Enrollment_ID || 0);
    }, 0) + 1;

    registrations.push({
      Enrollment_ID: nextEnrollmentId,
      Student_ID: CURRENT_STUDENT_ID,
      Course_ID: course.id,
      Term_ID: activeTerm.Term_ID,
      Section_ID: course.sectionId,
      Status: 'Enrolled',
      Final_Grade: null,
    });
    setTable('Registration', registrations);
  }

  coursesData = buildCoursesData();
  renderGrid();
  renderSidebar();
  updateStatusCopy(course.title);
  navigate('view-success');
}

/* ── REMOVE COURSE ── */
function removeCourse(courseId) {
  var registrations = getTable('Registration').filter(function(r) {
    return !(r.Student_ID === CURRENT_STUDENT_ID &&
             r.Course_ID === courseId &&
             r.Term_ID === activeTerm.Term_ID);
  });
  setTable('Registration', registrations);
  coursesData = buildCoursesData();
  renderGrid();
  renderSidebar();
}

function updateStatusCopy(courseTitle) {
  var successText = document.querySelector('#view-success p');
  if (!successText) return;
  successText.innerHTML =
    'Your enrollment has been processed for <strong>' +
    (activeTerm.Term_Name || 'this term') +
    '</strong>: ' + courseTitle + '.';
}

function updateStaticPageCopy() {
  var successText = document.querySelector('#view-success p');
  var studentIdEl = document.querySelector('.override-info .info-card .info-val');
  var termInfoEls = document.querySelectorAll('.override-info .info-card .info-val');

  if (successText) {
    successText.innerHTML =
      'Your enrollment has been processed for <strong>' +
      (activeTerm.Term_Name || 'this term') +
      '</strong>.';
  }
  if (studentIdEl) {
    studentIdEl.textContent = CURRENT_STUDENT_ID;
  }
  if (termInfoEls[1]) {
    termInfoEls[1].textContent = activeTerm.Term_Name || 'Current Term';
  }
}

/* ── RENDER SIDEBAR ── */
function renderSidebar() {
  var enrolled    = loadEnrolled();
  var list        = document.getElementById('selectedList');
  var totalCredits = 0;

  list.innerHTML = '';

  if (enrolled.length === 0) {
    list.innerHTML = '<p style="font-size:12.5px;color:#94a3b8;padding:8px 0;">No courses selected yet.</p>';
  }

  enrolled.forEach(function(course) {
    totalCredits += course.credits;

    var item = document.createElement('div');
    item.className = 'selected-item';
    item.innerHTML =
      '<div>' +
        '<div class="si-code">' + course.id + '</div>' +
        '<div class="si-title">' + course.title + '</div>' +
        '<div class="si-credits">' + course.credits + ' Credits</div>' +
      '</div>' +
      '<button class="remove-btn" title="Remove">×</button>';

    item.querySelector('.remove-btn').addEventListener('click', function() {
      removeCourse(course.id);
    });

    list.appendChild(item);
  });

  document.getElementById('currentCredits').textContent =
    totalCredits < 10 ? '0' + totalCredits : totalCredits;

  var pct = Math.min((totalCredits / 22) * 100, 100);
  document.getElementById('progFill').style.width = pct + '%';
}

/* ── COURSE DETAIL POPUP ── */
function openCourseDetail(course) {
  document.getElementById('courseDetailTitle').textContent = course.title;

  var body    = document.getElementById('courseDetailBody');
  var modules = courseModules[course.id] || ['Module – 1', 'Module – 2', 'Module – 3', 'Module – 4'];

  body.innerHTML = '';

  /* Syllabus row */
  var syllabusRow = document.createElement('div');
  syllabusRow.className = 'module-row';
  syllabusRow.innerHTML =
    '<div class="module-bar"></div>' +
    '<span class="module-name">Syllabus</span>' +
    '<button class="dark-btn small-btn">Download</button>';
  syllabusRow.querySelector('button').addEventListener('click', showToast);
  body.appendChild(syllabusRow);

  /* Module rows */
  modules.forEach(function(moduleName, idx) {
    var row = document.createElement('div');
    row.className = 'module-row';
    row.innerHTML =
      '<div class="module-bar"></div>' +
      '<span class="module-name">Module – ' + (idx + 1) + ': ' + moduleName + '</span>' +
      '<button class="dark-btn small-btn">Download</button>';
    row.querySelector('button').addEventListener('click', showToast);
    body.appendChild(row);
  });

  /* Open popup */
  document.getElementById('courseDetailPopup').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCourseDetail() {
  document.getElementById('courseDetailPopup').classList.remove('open');
  document.body.style.overflow = '';
}

/* Close popup when clicking background */
document.getElementById('courseDetailPopup').addEventListener('click', function(e) {
  if (e.target === this) closeCourseDetail();
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeCourseDetail();
});

/* ── TOAST ── */
var toastTimer = null;
function showToast() {
  var toast = document.getElementById('toast');
  if (toastTimer) clearTimeout(toastTimer);
  toast.classList.add('show');
  toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 2500);
}

/* ── OVERRIDE FORM ── */
document.getElementById('overrideForm').addEventListener('submit', function(e) {
  e.preventDefault();
  alert('Override Request Submitted Successfully!');
  e.target.reset();
  navigate('view-selection');
});

/* Char counter for justification textarea */
document.getElementById('justification').addEventListener('input', function() {
  document.getElementById('charCount').textContent = this.value.length + ' / 1500';
});

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', function() {
  syncCurrentContext();
  coursesData = buildCoursesData();
  updateStaticPageCopy();
  setupFilters();
  renderGrid();
  renderSidebar();
});
