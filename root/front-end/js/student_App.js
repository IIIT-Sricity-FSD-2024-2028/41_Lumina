async function initStudentApp() {
  if (!window._studentAppCache) window._studentAppCache = {};
  var session = localStorage.getItem('Lumina_Session');
  var role = session ? JSON.parse(session).Role : 'Student';
  var headers = { 'x-role': role };

  try {
    var [coursesRes, regsRes, sectionsRes, termsRes] = await Promise.all([
      fetch('http://localhost:3000/courses', { headers }),
      fetch('http://localhost:3000/registrations', { headers }),
      fetch('http://localhost:3000/sections', { headers }),
      fetch('http://localhost:3000/enrollment-phases', { headers }),
    ]);
    if (coursesRes.ok) {
      var courses = await coursesRes.json();
      window._studentAppCache['Course_Catalog'] = courses.map(c => ({ Course_ID: c.courseId, Course_Name: c.courseName, Credits: c.credits, Dept_ID: c.deptId, Status: c.status }));
    }
    if (regsRes.ok) {
      var regs = await regsRes.json();
      window._studentAppCache['Registration'] = regs.map(r => ({ Enrollment_ID: r.enrollmentId, Student_ID: r.studentId, Course_ID: r.courseId, Term_ID: r.termId, Section_ID: r.sectionId, Status: r.status, Final_Grade: r.finalGrade }));
    }
    if (sectionsRes.ok) {
      var secs = await sectionsRes.json();
      window._studentAppCache['Section'] = secs.map(s => ({ Section_ID: s.sectionId, Course_ID: s.courseId, Term_ID: s.termId, Section_Name: s.sectionName }));
    }
    /* Derive Academic_Term from registrations — use SPRING2026 as active term */
    window._studentAppCache['Academic_Term'] = [
      { Term_ID: 'SPRING2026', Term_Name: 'Spring 2026', Start_Timestamp: '2026-01-15T00:00:00Z', End_Timestamp: '2026-05-30T23:59:59Z' }
    ];
  } catch (e) {
    console.error('Failed to init student app cache', e);
  }

  loadDashboardCourses();
  syncCurrentStudentContext();
}

initStudentApp();

/* ── Redirect to Course Registration → My Courses sub-section ── */
function goToMyCourses() {
  /* Store intent so registration page can auto-navigate to the right sub-section */
  sessionStorage.setItem('reg_goto', 'view-selection');
  window.location.href = 'student_registration.html';
}



/* ==========================================
   DB HELPERS — reads from API cache
========================================== */
function getTable(name) {
  // Legacy getTable now uses cached API data
  return window._studentAppCache ? (window._studentAppCache[name] || []) : [];
}

var _appSession = localStorage.getItem('Lumina_Session');
var _appUser = _appSession ? JSON.parse(_appSession) : null;
var CURRENT_STUDENT_ID = _appUser ? _appUser.User_ID : 'S2024002';

/* ── Pull student + user info ── */
var _users = getTable('Users');
var _students = getTable('Students');
var _depts = getTable('Department');

var currentUser = _users.find(function (u) { return u.User_ID === CURRENT_STUDENT_ID; }) || {};
var currentStudent = _students.find(function (s) { return s.Student_ID === CURRENT_STUDENT_ID; }) || {};

function syncCurrentStudentContext() {
  CURRENT_STUDENT_ID = _appUser ? _appUser.User_ID : 'S2024002';
  _users = getTable('Users');
  _students = getTable('Students');
  _depts = getTable('Department');
  currentUser = _users.find(function (u) { return u.User_ID === CURRENT_STUDENT_ID; }) || {};
  currentStudent = _students.find(function (s) { return s.Student_ID === CURRENT_STUDENT_ID; }) || {};
}

function getCurrentSemesterCourseIds() {
  var degreeReqs = getTable('Degree_Requirements');
  var semNum = currentStudent.Current_Semester || 4;
  var deptId = currentUser.Dept_ID || '';

  return degreeReqs
    .filter(function (req) {
      return req.Target_Semester === semNum && (!deptId || req.Dept_ID === deptId);
    })
    .map(function (req) { return req.Course_ID; });
}

function getActiveRegistrationTerm() {
  var terms = getTable('Academic_Term');
  var now = new Date();
  /* Find the term whose window contains today */
  var active = terms.find(function (t) {
    return now >= new Date(t.Start_Timestamp) && now <= new Date(t.End_Timestamp);
  });
  if (active) return active;
  /* Fallback: most recent term */
  terms.sort(function (a, b) { return new Date(b.Start_Timestamp) - new Date(a.Start_Timestamp); });
  return terms[0] || {};
}
/* ── Semester label helpers ── */
function getSemLabel(semNum) {
  var ugYear = Math.ceil(semNum / 2);
  var isSpring = (semNum % 2 === 0);
  return 'UG–' + ugYear + ' · ' + (isSpring ? 'Spring Semester' : 'Monsoon Semester');
}

function getSemSubLabel(semNum) {
  var dates = {
    1: 'Aug 2024 – Dec 2024', 2: 'Jan 2025 – May 2025',
    3: 'Aug 2025 – Dec 2025', 4: 'Jan 2026 – May 2026',
    5: 'Aug 2026 – Dec 2026', 6: 'Jan 2027 – May 2027',
    7: 'Aug 2027 – Dec 2027', 8: 'Jan 2028 – May 2028',
  };
  return (dates[semNum] || '') + ' · Semester ' + semNum + ' of 8';
}

/* ── Get enrolled courses for current student from mock DB ── */
function getEnrolledFromDB() {
  var registrations = getTable('Registration');
  var catalog = getTable('Course_Catalog');
  var sections = getTable('Section');
  var slots = getTable('Course_Slot');
  var users = getTable('Users');
  var activeTerm = getActiveRegistrationTerm();

  return registrations
    .filter(function (r) {
      return r.Student_ID === CURRENT_STUDENT_ID && r.Term_ID === activeTerm.Term_ID;
    })
    .map(function (r) {
      var course = catalog.find(function (c) { return c.Course_ID === r.Course_ID; }) || {};
      var slot = slots.find(function (sl) { return sl.Section_ID === r.Section_ID; }) || {};
      var faculty = users.find(function (u) { return u.User_ID === slot.Faculty_ID; }) || {};
      return {
        id: r.Course_ID,
        title: course.Course_Name || r.Course_ID,
        credits: course.Credits || 0,
        prof: faculty.Full_Name || '—',
        room: slot.Room_Number || '—',
        day: slot.Day_of_Week || '—',
        start: slot.Start_Time || '—',
        end: slot.End_Time || '—',
        status: r.Status || 'Enrolled',
        syllabus: slot.Syllabus || 'Course syllabus',
      };
    });
}

var dashboardCourseModules = {
  IC241: ['OSI and TCP/IP Models', 'IP Addressing and Subnetting', 'Routing and Switching', 'Transport and Application Protocols'],
  PC241: ['Intelligent Agents', 'Problem Solving by Search', 'Knowledge Representation', 'Reasoning and Decision Making'],
  IC242: ['Regular Languages', 'Finite Automata', 'Context-Free Grammars', 'Turing Machines'],
  PC242: ['HTML CSS Foundations', 'JavaScript and DOM', 'Server APIs and Databases', 'Full Stack Integration'],
  EL241: ['Professional Writing', 'Presentation Practice', 'Group Communication', 'Interview Readiness'],
  SE241: ['Analytical Reasoning', 'Verbal Reasoning', 'Quantitative Aptitude', 'Problem Solving Drills'],
};
function openPopup(popupId) {
  var popup = document.getElementById(popupId);
  popup.classList.add('open');

  /* Stop the page behind from scrolling */
  document.body.style.overflow = 'hidden';
}

/* Closes a popup by its id */
function closePopup(popupId) {
  var popup = document.getElementById(popupId);
  popup.classList.remove('open');

  /* Allow the page to scroll again */
  document.body.style.overflow = '';
}

/* Closes all open popups at once */
function closeAllPopups() {
  var allPopups = document.querySelectorAll('.popup-bg');
  allPopups.forEach(function (popup) {
    popup.classList.remove('open');
  });
  document.body.style.overflow = '';
}


/* ==========================================
   COURSE DETAIL POPUP
   
   When you click "View" on a course,
   we update the popup title to that
   course's name, then open the popup.
========================================== */

function openCourseDetail(courseRef) {
  var enrolled = getEnrolledFromDB();
  var course = typeof courseRef === 'string'
    ? enrolled.find(function (item) { return item.id === courseRef || item.title === courseRef; })
    : courseRef;

  if (!course) return;

  document.getElementById('courseDetailTitle').textContent = course.id + ': ' + course.title;

  var popupBody = document.querySelector('#courseDetailPopup .popup-body');
  var modules = dashboardCourseModules[course.id] || ['Module 1', 'Module 2', 'Module 3', 'Module 4'];
  popupBody.innerHTML = '';

  var rows = [
    { label: 'Syllabus', downloadLabel: course.syllabus || 'Course syllabus overview' },
    { label: 'Module 1', downloadLabel: modules[0] || 'Module 1' },
    { label: 'Module 2', downloadLabel: modules[1] || 'Module 2' },
    { label: 'Module 3', downloadLabel: modules[2] || 'Module 3' },
    { label: 'Module 4', downloadLabel: modules[3] || 'Module 4' }
  ];

  rows.forEach(function (item) {
    var row = document.createElement('div');
    row.className = 'module-row';
    row.innerHTML =
      '<div class="module-bar"></div>' +
      '<span class="module-name">' + item.label + ': ' + item.downloadLabel + '</span>' +
      '<button class="dark-btn small-btn">Download</button>';
    row.querySelector('button').addEventListener('click', function () {
      showToast();
    });
    popupBody.appendChild(row);
  });

  /* Close the courses list popup first */
  closePopup('coursesPopup');

  /* Wait a tiny moment, then open the detail popup */
  setTimeout(function () {
    openPopup('courseDetailPopup');
  }, 80);
}


/* ==========================================
   CLOSE POPUP WHEN CLICKING OUTSIDE
   
   If someone clicks on the dark background
   (not on the white popup box), close it.
========================================== */

var allPopupBgs = document.querySelectorAll('.popup-bg');

allPopupBgs.forEach(function (bg) {
  bg.addEventListener('click', function (event) {
    /* event.target = the element that was actually clicked */
    /* If the click was directly on the dark background (not inside the popup) */
    if (event.target === bg) {
      bg.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
});


/* ==========================================
   CLOSE POPUP WITH ESCAPE KEY
   
   Press the Escape key on keyboard
   to close any open popup.
========================================== */

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    closeAllPopups();
  }
});


/* ==========================================
   BUTTON CLICK HANDLERS
   
   These run when the user clicks
   specific buttons on the page.
========================================== */

/* "View all 5 courses" button → open courses popup */
document.getElementById('viewAllBtn').addEventListener('click', function () {
  loadDashboardCourses();
  openPopup('coursesPopup');
});

/* "Full Schedule" button → open timetable popup */
document.getElementById('fullScheduleBtn').addEventListener('click', function () {
  openPopup('timetablePopup');
});

/* "Download pdf" button in gradesheets card */
document.getElementById('downloadGradeBtn').addEventListener('click', function () {
  showToast();
});

/* All "Download" buttons inside the Course Detail popup */
var moduleDownloadBtns = document.querySelectorAll('#courseDetailPopup .dark-btn');
moduleDownloadBtns.forEach(function (btn) {
  btn.addEventListener('click', function () {
    showToast();
  });
});

/* "Download PDF" button inside the Timetable popup */
var timetableDownloadBtn = document.querySelector('.tt-footer .dark-btn');
timetableDownloadBtn.addEventListener('click', function () {
  showToast();
});


/* ==========================================
   BELL / NOTIFICATION DROPDOWN

   Clicking the bell toggles a small dropdown
   that appears directly below the bell button.
   Clicking anywhere else on the page closes it.
========================================== */

var bellBtn = document.getElementById('bellBtn');
var notifDropdown = document.getElementById('notifDropdown');

/* Toggle the dropdown open/closed when bell is clicked */
if (bellBtn && notifDropdown) {
  bellBtn.addEventListener('click', function (event) {
    /* Stop this click from immediately closing the dropdown
       (because the document click listener below would catch it) */
    event.stopPropagation();

    notifDropdown.classList.toggle('open');
  });
}

/* Close the dropdown if the user clicks anywhere else on the page */
document.addEventListener('click', function () {
  if (notifDropdown) notifDropdown.classList.remove('open');
});


/* ==========================================
   TOAST NOTIFICATION

   showToast() makes the green bar slide up,
   then automatically hides it after 2.5 seconds.
========================================== */

var toast = document.getElementById('toast');
var toastTimer = null;   /* we store the timer so we can reset it */

function showToast() {
  toast.textContent = 'Download started successfully.';
  /* If a toast is already showing, clear the old timer first */
  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  /* Show the toast by adding the "show" class */
  toast.classList.add('show');

  /* After 2.5 seconds, hide it again */
  toastTimer = setTimeout(function () {
    toast.classList.remove('show');
  }, 2500);
}

/* Sign out button */
var dashboardSignoutBtn = document.getElementById('signoutBtn');
if (dashboardSignoutBtn) {
  dashboardSignoutBtn.addEventListener('click', function () {
    if (window.clearCurrentStudentSession) {
      window.clearCurrentStudentSession();
    }
    window.location.href = 'login.html';
  });
}


/* ==========================================
   HAMBURGER MENU (mobile only)
   
   When the ☰ button is clicked,
   toggle the mobile menu open/closed.
========================================== */

var hamburgerBtn = document.getElementById('hamburgerBtn');
var mobileMenu = document.getElementById('mobileMenu');

if (hamburgerBtn && mobileMenu) {
  hamburgerBtn.addEventListener('click', function () {
    /* Toggle means: if open → close, if closed → open */
    mobileMenu.classList.toggle('open');

    /* Change the button icon to match the state */
    if (mobileMenu.classList.contains('open')) {
      hamburgerBtn.textContent = '✕';   /* show X when menu is open */
    } else {
      hamburgerBtn.textContent = '☰';   /* show hamburger when closed */
    }
  });

}

/* If the screen is resized to desktop width, close the mobile menu */
window.addEventListener('resize', function () {
  if (window.innerWidth > 680 && mobileMenu && hamburgerBtn) {
    mobileMenu.classList.remove('open');
    hamburgerBtn.textContent = '☰';
  }
});

/* ==========================================
   DASHBOARD — LIVE COURSE SYNC
   Pulls from mockDB + localStorage fallback
========================================== */
function loadDashboardCourses() {
  syncCurrentStudentContext();
  var semNum = currentStudent.Current_Semester || 3;

  /* ── Update navbar name + avatar ── */
  if (currentUser.Full_Name) {
    var parts = currentUser.Full_Name.split(' ');
    var initials = parts.map(function (p) { return p[0]; }).join('').slice(0, 2).toUpperCase();
    var unameEl = document.querySelector('.username');
    var avatarEl = document.querySelector('.avatar');
    if (unameEl) unameEl.textContent = currentUser.Full_Name;
    if (avatarEl) avatarEl.textContent = initials;
  }

  /* ── Semester badge ── */
  var badgeMain = document.getElementById('semBadgeMain');
  var badgeSub = document.getElementById('semBadgeSub');
  if (badgeMain) badgeMain.textContent = getSemLabel(semNum);
  if (badgeSub) badgeSub.textContent = getSemSubLabel(semNum);

  var enrolled = getEnrolledFromDB();

  /* ── Populate Academic Profile card ── */
  var session = localStorage.getItem('Lumina_Session');
  var sessUser = session ? JSON.parse(session) : null;
  var studentId = sessUser ? sessUser.User_ID : (currentUser.User_ID || CURRENT_STUDENT_ID);
  var ugYear = Math.ceil(semNum / 2);
  var semType = (semNum % 2 === 0) ? 'Spring' : 'Monsoon';

  var elId = document.getElementById('acadStudentId');
  var elUg = document.getElementById('acadUgYear');
  var elSem = document.getElementById('acadSemester');
  var elSec = document.getElementById('acadSection');
  var elDept = document.getElementById('acadDept');

  if (elId) elId.textContent = studentId || '—';
  if (elUg) elUg.textContent = 'UG ' + ugYear;
  if (elSem) elSem.textContent = semNum + ' (' + semType + ')';
  if (elDept) elDept.textContent = (currentUser.Dept_ID || sessUser && sessUser.Dept_ID || '—');

  /* Section: derive from active registrations (sectionId on registration) */
  var regsAll = getTable('Registration');
  var activeTerm2 = getActiveRegistrationTerm();
  var sectionIds = regsAll
    .filter(function (r) {
      return r.Student_ID === CURRENT_STUDENT_ID &&
        r.Term_ID === activeTerm2.Term_ID &&
        r.Section_ID;
    })
    .map(function (r) { return r.Section_ID; });
  var uniqueSections = sectionIds.filter(function (v, i, a) { return a.indexOf(v) === i; });
  if (elSec) elSec.textContent = uniqueSections.length > 0 ? uniqueSections.join(', ') : '—';

  /* ── Course preview (up to 2 rows) ── */
  var previewEl = document.getElementById('acadCoursePreview');
  var emptyEl = document.getElementById('acadCoursePreviewEmpty');
  var countEl = document.getElementById('acadCourseCount');

  if (countEl) countEl.textContent = '(' + enrolled.length + ')';

  if (previewEl) {
    /* Remove old dynamic previews */
    Array.from(previewEl.querySelectorAll('.acad-dyn-item')).forEach(function (el) { el.remove(); });

    if (enrolled.length === 0) {
      if (emptyEl) emptyEl.style.display = '';
    } else {
      if (emptyEl) emptyEl.style.display = 'none';
      enrolled.slice(0, 2).forEach(function (course) {
        var item = document.createElement('div');
        item.className = 'course-item acad-dyn-item';
        item.innerHTML =
          '<div class="course-name">' + course.id + ': ' + course.title + '</div>' +
          '<div class="course-prof">' + (course.prof || '—') + '</div>';
        previewEl.appendChild(item);
      });
      if (enrolled.length > 2) {
        var more = document.createElement('div');
        more.className = 'acad-dyn-item';
        more.style.cssText = 'font-size:0.78rem;color:#64748b;padding:3px 0;';
        more.textContent = '+ ' + (enrolled.length - 2) + ' more course' + (enrolled.length - 2 !== 1 ? 's' : '');
        previewEl.appendChild(more);
      }
    }
  }

  /* ── Next Class ── */
  populateNextClass(enrolled);
  if (window.populateNavbarIdentity) {
    window.populateNavbarIdentity();
  }
}

/* ── Next Class card from slot data ── */
function populateNextClass(enrolled) {
  if (!enrolled || enrolled.length === 0) return;

  /* Find the next upcoming class by day */
  var dayOrder = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
  var today = new Date().getDay(); /* 0=Sun,1=Mon... */
  var jsDayToName = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday' };
  var todayName = jsDayToName[today] || 'Monday';
  var todayOrder = dayOrder[todayName] || 1;

  /* Sort enrolled by day order, wrapping around the week */
  var withDay = enrolled.filter(function (c) { return c.day && c.day !== '—'; });
  withDay.sort(function (a, b) {
    var da = dayOrder[a.day] || 9;
    var db = dayOrder[b.day] || 9;
    /* Courses today or later in week first, then wrap */
    var adjA = da >= todayOrder ? da : da + 7;
    var adjB = db >= todayOrder ? db : db + 7;
    return adjA - adjB;
  });

  var next = withDay[0] || enrolled[0];
  if (!next) return;

  var ncTitle = document.querySelector('.next-class-info h3');
  var ncLines = document.querySelectorAll('.next-class-info p');
  next.room = 'G04';
  if (ncTitle) ncTitle.textContent = next.id + ': ' + next.title;
  if (ncLines[0]) ncLines[0].textContent = '📅 ' + (next.day || '—');
  if (ncLines[1]) ncLines[1].textContent = '🕐 ' + (next.start || '—') + ' – ' + (next.end || '—');
  if (ncLines[2]) ncLines[2].textContent = '📍 ' + (next.room || '—');
}

/* Listen for updates from registration page */
// Reload on navigation
window.addEventListener('focus', function () { loadDashboardCourses(); });

loadDashboardCourses();

window.addEventListener('RoadmapReady', loadSemesterHistory);