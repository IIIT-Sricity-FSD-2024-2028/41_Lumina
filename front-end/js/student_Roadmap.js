/* ==========================================
   roadmap.js – Academic Roadmap Generation
========================================== */
/* ── SEMESTER HISTORY DATA — from mockDB ── */
function buildSemHistory() {
  var registrations = getTable('Registration');
  var catalog       = getTable('Course_Catalog');
  var sections      = getTable('Section');
  var slots         = getTable('Course_Slot');
  var users         = getTable('Users');
  var students      = getTable('Students');

  var student  = students.find(function(s) { return s.Student_ID === CURRENT_STUDENT_ID; }) || {};
  var currentSemNum = student.Current_Semester || 3;

  /* Group registrations by term — approximate sem number by term order */
  var terms   = getTable('Academic_Term');
  var termIds = terms.map(function(t) { return t.Term_ID; });

  /* For each past semester build a history entry */
  var history = {};

  /* Sem 1 and 2 are hardcoded (pre-mockDB era) */
  history[1] = {
    title: 'Semester 1', date: 'Aug 2024 – Dec 2024', isCurrent: false,
    courses: [
      { name: 'Computer Programming',         credits: 4 },
      { name: 'Digital Logic Design',          credits: 4 },
      { name: 'Overview of Computer Workshop', credits: 4 },
      { name: 'Discrete Structures',           credits: 4 },
      { name: 'Essential English',             credits: 2 },
      { name: 'Human Values and Ethics',       credits: 2 },
    ],
    totalCredits: 20,
  };

  history[2] = {
    title: 'Semester 2', date: 'Jan 2025 – May 2025', isCurrent: false,
    courses: [
      { name: 'Data Structures & Algorithms', credits: 4 },
      { name: 'Computer Architecture',        credits: 4 },
      { name: 'Signals & Systems',            credits: 4 },
      { name: 'Probability & Statistics',     credits: 4 },
      { name: 'Operational Communication',    credits: 2 },
      { name: 'Energy & Environment',         credits: 2 },
    ],
    totalCredits: 20,
  };

  /* Sem 3 onwards — build from Registration table */
  /* Map term index to semester number */
  /* MONSOON2026 = sem 3 for S2024002 (enrolled 2024, sem 4 current means they did sem3 last term) */
  var termToSem = {};
  terms.forEach(function(t, idx) {
    termToSem[t.Term_ID] = idx + 3; /* offset: sem 3 = first term in DB */
  });

  /* Build sem 3 from mockDB (MONSOON2026 registrations) */
  var sem3Regs = registrations.filter(function(r) {
    return r.Student_ID === CURRENT_STUDENT_ID;
  });

  if (sem3Regs.length > 0) {
    var sem3Courses = sem3Regs.map(function(r) {
      var course = catalog.find(function(c) { return c.Course_ID === r.Course_ID; }) || {};
      return { name: course.Course_Name || r.Course_ID, credits: course.Credits || 4 };
    });
    var sem3Credits = sem3Courses.reduce(function(sum, c) { return sum + c.credits; }, 0);

    history[3] = {
      title: 'Semester 3',
      date: 'Aug 2025 – Dec 2025',
      isCurrent: (currentSemNum === 3),
      courses: sem3Courses,
      totalCredits: sem3Credits,
    };
  } else {
    history[3] = {
      title: 'Semester 3', date: 'Aug 2025 – Dec 2025',
      isCurrent: (currentSemNum === 3),
      courses: [
        { name: 'Advanced Data Structures & Algorithms', credits: 4 },
        { name: 'Operating Systems',                     credits: 4 },
        { name: 'Database Management Systems',           credits: 4 },
        { name: 'Object Oriented Programming',           credits: 4 },
        { name: 'Analysis and Calculus',                 credits: 4 },
        { name: 'Professional Communication',            credits: 2 },
      ],
      totalCredits: 22,
    };
  }

  return history;
}

/* DB helper for roadmap.js */
function getTable(name) {
  try { return JSON.parse(localStorage.getItem('Lumina_' + name)) || []; }
  catch(e) { return []; }
}

var CURRENT_STUDENT_ID = 'S2024002';
var currentRoadmapProfile = window.getCurrentStudentProfile ? window.getCurrentStudentProfile() : { user: {}, student: {} };
var semHistory = buildSemHistory();

/* ── ELECTIVE POOLS ── */
var allProgramElectives = [
  'Agent Based Modelling & Simulations',
  'Cloud Computing',
  'Compiler Design',
  'Computer Graphics and Multimedia',
  'Computer Vision',
  'Data Mining',
  'Distributed Computing',
  'High-Performance Computing',
  'Information Retrieval',
  'Introduction to Cyber Security',
  'Machine Learning',
  'Natural Language Processing',
  'Principles of Cyber Physical System Computation',
  'Soft Computing and Evolutionary AI',
];

var allInstituteElectives = [
  'Applied Stochastic Models',
  'Brain Computer Interaction',
  'Cryptography',
  'Digital Image Processing',
  'Introduction to Data Analytics',
];

var allSeedCourses = [
  'Energy and Environment',
  'Ethics in Everyday Life',
  'Skills for Employability',
  'Quantitative and Reasoning Aptitude',
  'Personal Growth Programme',
  'Macro-economics and Personal Finance',
  'IT Project Management',
  'Innovation and Entrepreneurship',
  'Climate Change and its Implications',
  'ICT for Development',
  'Startup 101',
  'Organizational Behavior',
];

/* ── FUTURE SEM CONFIG ── */
var futureSemesters = {
  4: {
    label: 'Semester 4', date: 'Spring 2026 – Summer 2026',
    limits: null,
    courses: [
      { name: 'Computer Communication Networks (CCN)', credits: 4, prereq: 'None',         type: 'core', warning: null },
      { name: 'Artificial Intelligence (AI)',          credits: 4, prereq: 'None',         type: 'core', warning: null },
      { name: 'Theory of Computation (TOC)',           credits: 4, prereq: 'OS',           type: 'core', warning: null },
      { name: 'Full Stack Dev (FFSD)',                 credits: 4, prereq: 'None',         type: 'core', warning: null },
      { name: 'Advanced Communication Skills (ACS)',        credits: 2, prereq: 'EE, OPC, PC',  type: 'core', warning: null },
      { name: 'Logical Reasoning (LR)',                credits: 2, prereq: 'None',         type: 'core', warning: null },
      { name: 'Deep Learning (DL)',                    credits: 4, prereq: 'ML',           type: 'core',
        warning: 'Prerequisite ML not met.' },
    ],
  },
  5: {
    label: 'Semester 5', date: 'Fall 2026 – Winter 2027',
    limits: { PE: 4, IE: 0, SEED: 2 },
    courses: [
      { name: 'Framework Driven Front-End Development (FDFED)', credits: 4, prereq: 'None', type: 'core', warning: null },
    ],
  },
  6: {
    label: 'Semester 6', date: 'Spring 2027 – Summer 2027',
    limits: { PE: 3, IE: 1, SEED: 1 },
    courses: [
      { name: 'Web Services and Backend Development (WBD)', credits: 4, prereq: 'None', type: 'core', warning: null },
    ],
  },
  7: {
    label: 'Semester 7', date: 'Fall 2027 – Winter 2028',
    limits: { PE: 1, IE: 1, SEED: 1 },
    courses: [],
  },
  8: {
    label: 'Semester 8', date: 'Spring 2028 – Summer 2028',
    limits: { PE: 1, IE: 1, SEED: 1 },
    courses: [],
  },
};

/* ── STATE ── */
/*
  selectedCourses[semNum] = {
    core: { idx: true },
    PE:   { idx: true },   idx = index into allProgramElectives
    IE:   { idx: true },   idx = index into allInstituteElectives
    SEED: { idx: true },   idx = index into allSeedCourses
  }
  
  A global "claimed" map tracks which elective indices are
  taken by which semester so we can hide them elsewhere.
  claimedPE[idx]   = semNum | null
  claimedIE[idx]   = semNum | null
  claimedSEED[idx] = semNum | null
*/
var selectedCourses = {};
var claimedPE   = {};   /* idx -> semNum */
var claimedIE   = {};
var claimedSEED = {};

[5,6,7,8].forEach(function(s) {
  selectedCourses[s] = { core: {}, PE: {}, IE: {}, SEED: {} };
});

var currentSem    = null;
var activePlanSem = null;

var semSequence = {
  5: [5],
  6: [5, 6],
  7: [5, 6, 7],
  8: [5, 6, 7, 8],
};

/* ── HELPERS: get electives not yet claimed by another sem ── */
function availablePool(pool, claimMap, currentSemNum) {
  /* Returns array of { originalIdx, name } that are either
     unclaimed or claimed by currentSemNum itself */
  var source = pool === 'PE' ? allProgramElectives
             : pool === 'IE' ? allInstituteElectives
             : allSeedCourses;
  var map    = pool === 'PE' ? claimedPE
             : pool === 'IE' ? claimedIE
             : claimedSEED;

  return source.map(function(name, idx) {
    return { originalIdx: idx, name: name };
  }).filter(function(item) {
    var claimedBy = map[item.originalIdx];
    /* Show if unclaimed OR claimed by this semester */
    return claimedBy === undefined || claimedBy === currentSemNum;
  });
}

/* ── DROPDOWN CHANGE ── */
function onSemChange() {
  var val = parseInt(document.getElementById('semSelect').value);
  if (!val) return;

  currentSem = val;

  /* Full reset */
  claimedPE   = {};
  claimedIE   = {};
  claimedSEED = {};
  [5,6,7,8].forEach(function(s) {
    selectedCourses[s] = { core: {}, PE: {}, IE: {}, SEED: {} };
  });
  /* Pre-select core courses */
  semSequence[val].forEach(function(s) {
    futureSemesters[s].courses.forEach(function(c, idx) {
      selectedCourses[s].core[idx] = true;
    });
  });

  document.getElementById('coursesSection').style.display = 'block';
  document.getElementById('stickyBar').style.display      = 'flex';
  document.getElementById('planHint').style.display       = 'none';

  activePlanSem = semSequence[val][0];
  renderCourseSection(activePlanSem);
  updateCredits();
}

/* ── RENDER COURSE SECTION ── */
function renderCourseSection(semNum) {
  var semData = futureSemesters[semNum];
  var seqs    = semSequence[currentSem];

  document.getElementById('coursesHeading').textContent =
    'Courses Offered (' + semData.label + ')';

  /* Tabs */
  var tabsContainer = document.getElementById('semTabs');
  tabsContainer.innerHTML = '';
  if (seqs.length > 1) {
    seqs.forEach(function(s) {
      var tab         = document.createElement('button');
      tab.className   = 'sem-tab' + (s === semNum ? ' active-tab' : '');
      tab.textContent = futureSemesters[s].label;
      tab.onclick     = function() { activePlanSem = s; renderCourseSection(s); };
      tabsContainer.appendChild(tab);
    });
  }

  var grid = document.getElementById('coursesGrid');
  grid.innerHTML = '';

  /* ── CORE ── */
  if (semData.courses.length > 0) {
    grid.appendChild(makeSectionHeader('Program Core', null, null));
    semData.courses.forEach(function(course, idx) {
      var isSelected = !!selectedCourses[semNum].core[idx];
      var card = makeCourseCard(course.name, course.credits, course.prereq, 'core', isSelected, !!course.warning, course.warning);
      card.addEventListener('click', function() {
        toggleCore(semNum, idx, card, course);
      });
      grid.appendChild(card);
    });
  }

  var limits = semData.limits;
  if (!limits) return;

  /* ── PROGRAM ELECTIVES ── */
  if (limits.PE > 0) {
    var peSelected = Object.keys(selectedCourses[semNum].PE).length;
    var peAvail    = availablePool('PE', claimedPE, semNum);
    grid.appendChild(makeSectionHeader('Program Electives', 'PE', limits.PE, peSelected, peAvail.length));

    peAvail.forEach(function(item) {
      var isSelected = !!selectedCourses[semNum].PE[item.originalIdx];
      var card = makeCourseCard(item.name, 3, 'None', 'PE', isSelected, false, null);
      card.addEventListener('click', function() {
        toggleElective(semNum, 'PE', item.originalIdx, card, limits.PE);
      });
      grid.appendChild(card);
    });

    if (peAvail.length === 0) {
      grid.appendChild(makeEmptyNote('All program electives have been selected in other semesters.'));
    }
  }

  /* ── INSTITUTE ELECTIVES ── */
  if (limits.IE > 0) {
    var ieSelected = Object.keys(selectedCourses[semNum].IE).length;
    var ieAvail    = availablePool('IE', claimedIE, semNum);
    grid.appendChild(makeSectionHeader('Institute Electives', 'IE', limits.IE, ieSelected, ieAvail.length));

    ieAvail.forEach(function(item) {
      var isSelected = !!selectedCourses[semNum].IE[item.originalIdx];
      var card = makeCourseCard(item.name, 3, 'None', 'IE', isSelected, false, null);
      card.addEventListener('click', function() {
        toggleElective(semNum, 'IE', item.originalIdx, card, limits.IE);
      });
      grid.appendChild(card);
    });

    if (ieAvail.length === 0) {
      grid.appendChild(makeEmptyNote('All institute electives have been selected in other semesters.'));
    }
  }

  /* ── SEED ── */
  if (limits.SEED > 0) {
    var seedSelected = Object.keys(selectedCourses[semNum].SEED).length;
    var seedAvail    = availablePool('SEED', claimedSEED, semNum);
    grid.appendChild(makeSectionHeader('SEED Courses', 'SEED', limits.SEED, seedSelected, seedAvail.length));

    seedAvail.forEach(function(item) {
      var isSelected = !!selectedCourses[semNum].SEED[item.originalIdx];
      var card = makeCourseCard(item.name, 2, 'None', 'SEED', isSelected, false, null);
      card.addEventListener('click', function() {
        toggleElective(semNum, 'SEED', item.originalIdx, card, limits.SEED);
      });
      grid.appendChild(card);
    });

    if (seedAvail.length === 0) {
      grid.appendChild(makeEmptyNote('All SEED courses have been selected in other semesters.'));
    }
  }
}

/* ── MAKE SECTION HEADER (with inline status) ── */

function makeSectionHeader(title, pool, limit, selected, available) {
  var el = document.createElement('div');
  el.className = 'elective-section-label';

  if (pool === null) {
    el.innerHTML = '<span>' + title + '</span>';
  } else {
    var statusClass = (selected === limit) ? 'sec-status ok' : 'sec-status pending';
    var statusText  = selected + ' / ' + limit + ' selected';

    var warningText = '';
    if (available < (limit - selected) && available >= 0) {
      warningText = ' &nbsp;⚠ Only ' + available + ' left in pool';
    }

    el.innerHTML =
      '<span>' + title + '</span>' +
      '<span class="' + statusClass + '" data-pool="' + pool + '">' +
        statusText + warningText +
      '</span>';
  }

  return el;
}

/* ── MAKE EMPTY NOTE ── */
function makeEmptyNote(text) {
  var el = document.createElement('div');
  el.className   = 'empty-pool-note';
  el.textContent = text;
  return el;
}

/* ── MAKE COURSE CARD ── */
function makeCourseCard(name, credits, prereq, type, isSelected, hasWarning, warningMsg) {
  var typeColors = { core: 'badge-core', PE: 'badge-pe', IE: 'badge-ie', SEED: 'badge-seed' };
  var typeLabels = { core: 'Core', PE: 'PE', IE: 'IE', SEED: 'SEED' };

  var card = document.createElement('div');
  card.className = 'course-card' +
    (isSelected ? ' selected' : '') +
    (isSelected && hasWarning ? ' warning-card' : '');

  card.innerHTML =
    '<div class="cc-top">' +
      '<div class="cc-left">' +
        '<div class="cc-checkbox"></div>' +
        '<div class="cc-name">' + name +
          ' <span class="type-tag ' + typeColors[type] + '">' + typeLabels[type] + '</span>' +
        '</div>' +
      '</div>' +
      '<span class="cc-credits-badge">' + credits + ' CR</span>' +
    '</div>' +
    '<div class="cc-prereq">Prerequisites: ' + prereq + '</div>' +
    (hasWarning
      ? '<div class="cc-warning-msg' + (isSelected ? ' show' : '') + '">⚠ ' + warningMsg + '</div>'
      : '');

  return card;
}

/* ── TOGGLE CORE ── */
function toggleCore(semNum, idx, card, course) {
  var isSelected = !!selectedCourses[semNum].core[idx];
  if (isSelected) {
    delete selectedCourses[semNum].core[idx];
    card.classList.remove('selected', 'warning-card');
    var w = card.querySelector('.cc-warning-msg');
    if (w) w.classList.remove('show');
  } else {
    selectedCourses[semNum].core[idx] = true;
    card.classList.add('selected');
    if (course.warning) {
      card.classList.add('warning-card');
      var w = card.querySelector('.cc-warning-msg');
      if (w) w.classList.add('show');
    }
  }
  updateCredits();
  clearError();
}

/* ── TOGGLE ELECTIVE ── */
function toggleElective(semNum, pool, originalIdx, card, limit) {
  var claimMap  = pool === 'PE' ? claimedPE : pool === 'IE' ? claimedIE : claimedSEED;
  var isSelected = !!selectedCourses[semNum][pool][originalIdx];

  if (isSelected) {
    /* Deselect — release the claim */
    delete selectedCourses[semNum][pool][originalIdx];
    delete claimMap[originalIdx];
    card.classList.remove('selected');

    /* Re-render ALL other sems so the course reappears there */
    rerenderOtherSems(semNum);

  } else {
    /* Check limit */
    var currentCount = Object.keys(selectedCourses[semNum][pool]).length;
    if (currentCount >= limit) {
      card.classList.add('blocked-flash');
      setTimeout(function() { card.classList.remove('blocked-flash'); }, 600);
      showInlineError(pool, semNum, limit);
      return;
    }

    /* Claim it */
    selectedCourses[semNum][pool][originalIdx] = true;
    claimMap[originalIdx] = semNum;
    card.classList.add('selected');

    /* Re-render ALL other sems so this course disappears there */
    rerenderOtherSems(semNum);
  }

  /* Re-render section headers on the current sem to update counts */
  renderCourseSection(semNum);
  updateCredits();
  clearError();
}

/* Re-renders the course section for every sem EXCEPT the one being edited.
   This keeps other tabs in sync without switching away from the current tab. */
function rerenderOtherSems(editedSem) {
  /* We don't actually re-render invisible tabs — we just store state.
     The re-render happens naturally when the user switches tabs,
     because renderCourseSection always reads live state.
     BUT we DO need to update the current tab's section headers. */
  /* Nothing extra needed — renderCourseSection at the end of toggleElective handles it */
}


/* ── SHOW INLINE POOL ERROR ── */
function showInlineError(pool, semNum, limit) {
  /* Find the section header for this pool and flash its status badge */
  var headers = document.querySelectorAll('.elective-section-label');
  headers.forEach(function(header) {
    var badge = header.querySelector('.sec-status');
    if (!badge) return;

    /* Match by checking if the header text contains the pool name */
    var headerText = header.querySelector('span:first-child').textContent;
    var matches =
      (pool === 'PE'   && headerText.includes('Program Electives')) ||
      (pool === 'IE'   && headerText.includes('Institute Electives')) ||
      (pool === 'SEED' && headerText.includes('SEED'));

    if (!matches) return;

    /* Store original content and flash red */
    var original      = badge.textContent;
    var originalClass = badge.className;

    badge.textContent = '⚠ Max ' + limit + ' allowed. Deselect one first.';
    badge.className   = 'sec-status error';

    setTimeout(function() {
      badge.textContent = original;
      badge.className   = originalClass;
    }, 3000);
  });
}

/* ── UPDATE CREDITS ── */
function updateCredits() {
  if (currentSem === null) return;
  var total = 0;
  semSequence[currentSem].forEach(function(s) {
    var sd = futureSemesters[s];
    Object.keys(selectedCourses[s].core).forEach(function(idx) {
      total += sd.courses[parseInt(idx)].credits;
    });
    Object.keys(selectedCourses[s].PE).forEach(function()   { total += 3; });
    Object.keys(selectedCourses[s].IE).forEach(function()   { total += 3; });
    Object.keys(selectedCourses[s].SEED).forEach(function() { total += 2; });
  });
  document.getElementById('totalCredits').textContent = total;
  document.getElementById('creditWarning').style.display = 'none';
}

/* ── VALIDATE ── */
function validateSelections() {
  var errors = [];
  semSequence[currentSem].forEach(function(s) {
    var sd     = futureSemesters[s];
    var limits = sd.limits;
    var label  = sd.label;

    /* Core warnings */
    Object.keys(selectedCourses[s].core).forEach(function(idx) {
      var c = sd.courses[parseInt(idx)];
      if (c.warning) errors.push(label + ': "' + c.name + '" — ' + c.warning);
    });

    if (!limits) return;

    var peCount   = Object.keys(selectedCourses[s].PE).length;
    var ieCount   = Object.keys(selectedCourses[s].IE).length;
    var seedCount = Object.keys(selectedCourses[s].SEED).length;

    if (peCount !== limits.PE)
      errors.push(label + ': Need exactly ' + limits.PE + ' PE, got ' + peCount + '.');
    if (limits.IE > 0 && ieCount !== limits.IE)
      errors.push(label + ': Need exactly ' + limits.IE + ' IE, got ' + ieCount + '.');
    if (seedCount !== limits.SEED)
      errors.push(label + ': Need exactly ' + limits.SEED + ' SEED, got ' + seedCount + '.');
  });
  return errors;
}

/* ── GENERATE ── */
function generateRoadmap() {
  if (currentSem === null) return;

  var errors = validateSelections();
  if (errors.length > 0) {
    clearError();

    /* Switch to first failing sem */
    var firstFail = null;
    semSequence[currentSem].forEach(function(s) {
      if (firstFail) return;
      var sd     = futureSemesters[s];
      var limits = sd.limits;
      var hasCoreWarn = Object.keys(selectedCourses[s].core).some(function(idx) {
        return !!sd.courses[parseInt(idx)].warning;
      });
      if (hasCoreWarn) { firstFail = s; return; }
      if (!limits) return;
      if (Object.keys(selectedCourses[s].PE).length   !== limits.PE)   { firstFail = s; return; }
      if (limits.IE > 0 && Object.keys(selectedCourses[s].IE).length !== limits.IE) { firstFail = s; return; }
      if (Object.keys(selectedCourses[s].SEED).length !== limits.SEED) { firstFail = s; return; }
    });

    if (firstFail) { activePlanSem = firstFail; renderCourseSection(firstFail); }

    var err       = document.createElement('div');
    err.id        = 'prereqError';
    err.className = 'prereq-error-banner';
    err.innerHTML = '⛔ Fix before generating:<br><ul style="margin:6px 0 0 14px;padding:0">' +
      errors.map(function(e) { return '<li>' + e + '</li>'; }).join('') + '</ul>';
    document.getElementById('coursesSection').appendChild(err);
    return;
  }

  clearError();
  document.getElementById('planView').style.display    = 'none';
  document.getElementById('stickyBar').style.display   = 'none';
  document.getElementById('roadmapView').style.display = 'block';

  var row = document.getElementById('roadmapCardsRow');
  row.innerHTML = '';

  semSequence[currentSem].forEach(function(s) {
    var sd           = futureSemesters[s];
    var selectedList = [];
    var totalCr      = 0;

    Object.keys(selectedCourses[s].core).forEach(function(idx) {
      var c = sd.courses[parseInt(idx)];
      selectedList.push({ name: c.name, credits: c.credits, type: 'core' });
      totalCr += c.credits;
    });
    Object.keys(selectedCourses[s].PE).forEach(function(idx) {
      selectedList.push({ name: allProgramElectives[parseInt(idx)], credits: 3, type: 'PE' });
      totalCr += 3;
    });
    Object.keys(selectedCourses[s].IE).forEach(function(idx) {
      selectedList.push({ name: allInstituteElectives[parseInt(idx)], credits: 3, type: 'IE' });
      totalCr += 3;
    });
    Object.keys(selectedCourses[s].SEED).forEach(function(idx) {
      selectedList.push({ name: allSeedCourses[parseInt(idx)], credits: 2, type: 'SEED' });
      totalCr += 2;
    });

    row.appendChild(buildFutureCard(sd.label, sd.date, selectedList, totalCr));
  });

  var fp2 = document.getElementById('footer-placeholder-2');
  if (fp2 && fp2.innerHTML.trim() === '') {
    fetch('student_footer.html')
      .then(function(r) { return r.text(); })
      .then(function(html) { fp2.innerHTML = html; });
  }
}

/* ── BUILD CARDS ── */
function buildHistoryCard(data, isCurrent) {
  var card     = document.createElement('div');
  card.className = 'rm-card';
  var chipHtml = isCurrent ? '<span class="rm-current-chip">CURRENT</span>' : '';
  var rowsHtml = data.courses.map(function(c) {
    return '<div class="rm-row"><div class="rm-bar teal"></div><span class="rm-name">' + c.name + '</span><span class="rm-cr">' + c.credits + ' CR</span></div>';
  }).join('');
  card.innerHTML =
    '<div class="rm-card-header dark-header">' +
      '<div class="rm-card-title">' + data.title + chipHtml + '</div>' +
      '<div class="rm-card-date">' + data.date + '</div>' +
    '</div>' +
    '<div class="rm-card-body">' + rowsHtml + '</div>' +
    '<div class="rm-card-footer"><span class="rm-footer-label">TOTAL CREDITS</span><span class="rm-total-credits">' + data.totalCredits + ' Credits</span></div>';
  return card;
}

function buildFutureCard(label, date, courses, totalCr) {
  var typeLabels = { core: 'Core', PE: 'PE', IE: 'IE', SEED: 'SEED' };
  var typeColors = { core: 'badge-core', PE: 'badge-pe', IE: 'badge-ie', SEED: 'badge-seed' };
  var card       = document.createElement('div');
  card.className = 'rm-card';
  var rowsHtml   = courses.map(function(c) {
    return '<div class="rm-row"><div class="rm-bar"></div><span class="rm-name">' +
      c.name + ' <span class="type-tag ' + typeColors[c.type] + '">' + typeLabels[c.type] + '</span>' +
      '</span><span class="rm-cr">' + c.credits + ' CR</span></div>';
  }).join('') || '<div style="padding:12px 0;color:#94a3b8;font-size:13px;">No courses selected.</div>';
  card.innerHTML =
    '<div class="rm-card-header">' +
      '<div class="rm-card-title">' + label + '</div>' +
      '<div class="rm-card-date">' + date + '</div>' +
    '</div>' +
    '<div class="rm-card-body">' + rowsHtml + '</div>' +
    '<div class="rm-card-footer"><span class="rm-footer-label">TOTAL CREDITS</span><span class="rm-total-credits">' + totalCr + ' Credits</span></div>';
  return card;
}

/* ── PDF DOWNLOAD ── */
function downloadRoadmapPDF() {
  currentRoadmapProfile = window.getCurrentStudentProfile ? window.getCurrentStudentProfile() : currentRoadmapProfile;
  var seqs = semSequence[currentSem];
  var cardStyles = `
    body{font-family:Arial,sans-serif;background:#f4f6f9;padding:32px;color:#1a2744;}
    h1{font-size:22px;font-weight:700;margin:0 0 4px 0;}
    p{font-size:13px;color:#64748b;margin:0 0 24px 0;}
    .cards{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;}
    .card{background:white;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;width:210px;display:flex;flex-direction:column;}
    .card-header{padding:14px 16px;background:#f4f6f9;}
    .card-header.dark{background:#1a2744;}
    .card-title{font-size:15px;font-weight:700;color:#1a2744;display:flex;justify-content:space-between;align-items:center;}
    .card-header.dark .card-title{color:white;}
    .card-date{font-size:11px;color:#94a3b8;margin-top:3px;}
    .card-header.dark .card-date{color:rgba(255,255,255,0.6);}
    .chip{background:#22c55e;color:white;font-size:9px;font-weight:700;padding:2px 8px;border-radius:20px;}
    .card-body{padding:8px 14px;flex:1;}
    .row{display:flex;align-items:center;padding:7px 0;border-bottom:1px solid #f1f5f9;}
    .row:last-child{border-bottom:none;}
    .bar{width:3px;height:20px;border-radius:3px;background:#3b82f6;margin-right:8px;flex-shrink:0;}
    .bar.teal{background:#0d9488;}
    .rname{font-size:11px;font-weight:500;flex:1;}
    .tag{font-size:9px;font-weight:700;padding:1px 5px;border-radius:4px;margin-left:4px;}
    .tag-pe{background:#d1fae5;color:#065f46;}
    .tag-ie{background:#fef3c7;color:#92400e;}
    .tag-seed{background:#ede9fe;color:#5b21b6;}
    .tag-core{background:#dbeafe;color:#1e40af;}
    .rcr{font-size:11px;font-weight:700;color:#94a3b8;margin-left:6px;white-space:nowrap;}
    .card-footer{padding:10px 14px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;}
    .fl{font-size:9px;font-weight:700;color:#94a3b8;letter-spacing:0.07em;}
    .fc{font-size:15px;font-weight:700;color:#1a2744;}
  `;
  var allCardsHtml = '';

  seqs.forEach(function(s) {
    var sd = futureSemesters[s]; var rows = ''; var totalCr = 0;
    Object.keys(selectedCourses[s].core).forEach(function(idx) {
      var c = sd.courses[parseInt(idx)];
      rows += '<div class="row"><div class="bar"></div><span class="rname">' + c.name + ' <span class="tag tag-core">Core</span></span><span class="rcr">' + c.credits + ' CR</span></div>';
      totalCr += c.credits;
    });
    Object.keys(selectedCourses[s].PE).forEach(function(idx) {
      rows += '<div class="row"><div class="bar"></div><span class="rname">' + allProgramElectives[parseInt(idx)] + ' <span class="tag tag-pe">PE</span></span><span class="rcr">3 CR</span></div>';
      totalCr += 3;
    });
    Object.keys(selectedCourses[s].IE).forEach(function(idx) {
      rows += '<div class="row"><div class="bar"></div><span class="rname">' + allInstituteElectives[parseInt(idx)] + ' <span class="tag tag-ie">IE</span></span><span class="rcr">3 CR</span></div>';
      totalCr += 3;
    });
    Object.keys(selectedCourses[s].SEED).forEach(function(idx) {
      rows += '<div class="row"><div class="bar"></div><span class="rname">' + allSeedCourses[parseInt(idx)] + ' <span class="tag tag-seed">SEED</span></span><span class="rcr">2 CR</span></div>';
      totalCr += 2;
    });
    allCardsHtml += '<div class="card"><div class="card-header"><div class="card-title">' + sd.label +
      '</div><div class="card-date">' + sd.date + '</div></div><div class="card-body">' +
      (rows || '<div style="color:#94a3b8;font-size:12px;padding:8px 0;">No courses selected.</div>') +
      '</div><div class="card-footer"><span class="fl">TOTAL CREDITS</span><span class="fc">' + totalCr + ' Credits</span></div></div>';
  });

  var win = window.open('', '_blank');
  win.document.write('<!DOCTYPE html><html><head><title>Academic Roadmap – Lumina</title><style>' +
    cardStyles + '</style></head><body><h1>Academic Roadmap</h1><p>Personalized semester-wise plan — ' + (currentRoadmapProfile.user.Full_Name || CURRENT_STUDENT_ID) + '</p>' +
    '<div class="cards">' + allCardsHtml + '</div>' +
    '<script>window.onload=function(){window.print();}<\/script></body></html>');
  win.document.close();
}

/* ── BACK TO PLAN ── */
function backToPlan() {
  document.getElementById('roadmapView').style.display = 'none';
  document.getElementById('planView').style.display    = 'block';
  document.getElementById('stickyBar').style.display   = 'flex';
  if (activePlanSem) renderCourseSection(activePlanSem);
}

/* ── HELPERS ── */
function clearError() {
  var e = document.getElementById('prereqError'); if (e) e.remove();
}

document.querySelectorAll('.popup-bg').forEach(function(bg) {
  bg.addEventListener('click', function(e) { if (e.target === bg) closePopup(bg.id); });
});
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closePopup('semModal'); });
