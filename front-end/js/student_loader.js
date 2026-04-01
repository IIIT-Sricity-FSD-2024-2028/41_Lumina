/* ==========================================
   student_loader.js
   Loads shared navbar + footer into every page.
   Usage (at the bottom of each page's <body>):
     loadSharedComponents('student_index.html');
     loadSharedComponents('student_Roadmap.html');
     loadSharedComponents('student_registration.html');
========================================== */

function loadComponent(placeholderId, filePath, afterLoadCallback) {
  fetch(filePath)
    .then(function(response) { return response.text(); })
    .then(function(html) {
      document.getElementById(placeholderId).innerHTML = html;
      if (afterLoadCallback) afterLoadCallback();
    });
}

function loadSharedComponents(activeNavLink) {
  loadComponent('navbar-placeholder', 'student_navbar.html', function() {

    /* Mark the correct nav link as active */
    if (activeNavLink) {
      var links = document.querySelectorAll('#navbar-placeholder .nav-link');
      links.forEach(function(link) {
        if (link.getAttribute('href') === activeNavLink) {
          link.classList.add('active');
        }
      });
    }

    populateNavbarIdentity();
    initNavbar();
  });

  loadComponent('footer-placeholder', 'student_footer.html');
}

function getLuminaTable(name) {
  try { return JSON.parse(localStorage.getItem('Lumina_' + name)) || []; }
  catch (e) { return []; }
}

function getStudentInitials(fullName) {
  if (!fullName) return 'ST';
  return fullName
    .split(' ')
    .filter(function(part) { return !!part; })
    .map(function(part) { return part.charAt(0); })
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function resolveStoredStudentId(users, students) {
  var sessionRaw = localStorage.getItem('Lumina_Session') || sessionStorage.getItem('Lumina_Session');
  if (sessionRaw) {
    try {
      var sessionData = JSON.parse(sessionRaw);
      var sessionId = sessionData.User_ID || sessionData.Student_ID || sessionData.userId || '';
      if (sessionId) {
        var sessionUser = users.find(function(user) {
          return user.User_ID === sessionId && user.Role === 'Student';
        });
        var sessionStudent = students.find(function(student) {
          return student.Student_ID === sessionId;
        });
        if (sessionUser && sessionStudent) {
          return sessionId;
        }
      }
    } catch (e) {}
  }

  var candidateKeys = [
    'Lumina_Current_Student_ID',
    'Lumina_Current_User_ID',
    'currentStudentId',
    'currentUserId',
    'loggedInUserId',
    'userId',
    'studentId',
    'currentStudent',
    'currentUser',
    'loggedInUser'
  ];

  function readCandidate(rawValue) {
    if (!rawValue) return '';

    if (typeof rawValue === 'string') {
      var trimmed = rawValue.trim();
      if (!trimmed) return '';

      if (trimmed.charAt(0) === '{') {
        try {
          var parsed = JSON.parse(trimmed);
          return parsed.Student_ID || parsed.User_ID || parsed.studentId || parsed.userId || parsed.id || '';
        } catch (e) {
          return trimmed;
        }
      }

      return trimmed;
    }

    return rawValue.Student_ID || rawValue.User_ID || rawValue.studentId || rawValue.userId || rawValue.id || '';
  }

  for (var i = 0; i < candidateKeys.length; i += 1) {
    var candidateId = readCandidate(localStorage.getItem(candidateKeys[i])) ||
      readCandidate(sessionStorage.getItem(candidateKeys[i]));

    if (!candidateId) continue;

    var matchingUser = users.find(function(user) {
      return user.User_ID === candidateId && user.Role === 'Student';
    });
    var matchingStudent = students.find(function(student) {
      return student.Student_ID === candidateId;
    });

    if (matchingUser && matchingStudent) {
      return candidateId;
    }
  }

  return '';
}

function getCurrentStudentId() {
  var users = getLuminaTable('Users');
  var students = getLuminaTable('Students');
  var storedStudentId = resolveStoredStudentId(users, students);

  if (storedStudentId) {
    return storedStudentId;
  }

  var defaultStudent = students.find(function(student) {
    return student.Student_ID === 'S2024002';
  });

  if (defaultStudent) {
    return defaultStudent.Student_ID;
  }

  var fallbackStudent = students.find(function(student) {
    return users.some(function(user) {
      return user.User_ID === student.Student_ID && user.Role === 'Student';
    });
  });

  return fallbackStudent ? fallbackStudent.Student_ID : 'S2024002';
}

function getCurrentStudentProfile() {
  var users = getLuminaTable('Users');
  var students = getLuminaTable('Students');
  var studentId = getCurrentStudentId();
  var user = users.find(function(item) { return item.User_ID === studentId; }) || {};
  var student = students.find(function(item) { return item.Student_ID === studentId; }) || {};

  return {
    studentId: studentId,
    user: user,
    student: student
  };
}

function setCurrentStudentId(studentId) {
  if (!studentId) return;
  localStorage.setItem('Lumina_Current_Student_ID', studentId);
  sessionStorage.setItem('Lumina_Current_Student_ID', studentId);
  populateNavbarIdentity();
}

function clearCurrentStudentSession() {
  localStorage.removeItem('Lumina_Current_Student_ID');
  sessionStorage.removeItem('Lumina_Current_Student_ID');
  localStorage.removeItem('Lumina_Current_User_ID');
  sessionStorage.removeItem('Lumina_Current_User_ID');
  localStorage.removeItem('currentStudentId');
  sessionStorage.removeItem('currentStudentId');
  localStorage.removeItem('currentUserId');
  sessionStorage.removeItem('currentUserId');
  localStorage.removeItem('Lumina_Session');
  sessionStorage.removeItem('Lumina_Session');
}

function populateNavbarIdentity() {
  var profile = getCurrentStudentProfile();
  var usernameEl = document.querySelector('.username');
  var avatarEl = document.querySelector('.avatar');

  if (usernameEl) {
    usernameEl.textContent = profile.user.Full_Name || profile.studentId;
  }

  if (avatarEl) {
    avatarEl.textContent = getStudentInitials(profile.user.Full_Name || profile.studentId);
  }
}

window.getCurrentStudentId = getCurrentStudentId;
window.getCurrentStudentProfile = getCurrentStudentProfile;
window.getStudentInitials = getStudentInitials;
window.setCurrentStudentId = setCurrentStudentId;
window.clearCurrentStudentSession = clearCurrentStudentSession;

function initNavbar() {
  var bellBtn       = document.getElementById('bellBtn');
  var notifDropdown = document.getElementById('notifDropdown');
  var hamburgerBtn  = document.getElementById('hamburgerBtn');
  var mobileMenu    = document.getElementById('mobileMenu');
  var signoutBtn    = document.getElementById('signoutBtn');

  if (bellBtn) {
    bellBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      notifDropdown.classList.toggle('open');
    });
  }

  document.addEventListener('click', function() {
    if (notifDropdown) notifDropdown.classList.remove('open');
  });

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', function() {
      mobileMenu.classList.toggle('open');
      hamburgerBtn.textContent = mobileMenu.classList.contains('open') ? '✕' : '☰';
    });
  }

  window.addEventListener('resize', function() {
    if (window.innerWidth > 680 && mobileMenu) {
      mobileMenu.classList.remove('open');
      if (hamburgerBtn) hamburgerBtn.textContent = '☰';
    }
  });

  if (signoutBtn) {
    signoutBtn.addEventListener('click', function() {
      clearCurrentStudentSession();
      window.location.href = 'login.html';
    });
  }
}
