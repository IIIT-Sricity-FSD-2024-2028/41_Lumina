/* faculty_home.js - Faculty Dashboard logic */
function initFacultyPage() {

  var D = LuminaData;
  var faculty = D.facultyProfile || {};

  if (faculty.displayName) {
    var nameEl = document.querySelector(".navbar-user-name");
    var deptEl = document.querySelector(".navbar-user-dept");
    var avatarEl = document.querySelector(".navbar-avatar");
    var welcomeEl = document.querySelector(".welcome-title");
    if (nameEl) nameEl.textContent = faculty.displayName;
    if (deptEl) deptEl.textContent = faculty.deptName;
    if (avatarEl) avatarEl.textContent = faculty.avatar;
    if (welcomeEl) welcomeEl.textContent = "Welcome " + faculty.displayName;
  }

  // Stats
  document.getElementById("statActive").textContent = D.courses.filter(function(c){
    return c.status === "active";
  }).length;
  document.getElementById("statEnrolled").textContent = D.courses.reduce(function(sum, course){
    return sum + course.students;
  }, 0);
  document.getElementById("statToday").textContent = D.todaysClasses.length;

  // Today's Classes
  document.getElementById("todaysClasses").innerHTML = D.todaysClasses.map(function(c){
    return '<div class="class-card">'
      + '<div class="class-time-box"><span class="time-hour">' + c.time + '</span><span class="time-ampm">' + c.ampm + "</span></div>"
      + '<div class="class-info"><div class="class-name">' + c.course + '</div><div class="class-meta">' + c.dayOfWeek + " &bull; " + c.room + " &bull; " + c.end + "</div></div>"
      + '<span class="badge badge-' + c.status + '">' + c.status.toUpperCase() + "</span>"
      + "</div>";
  }).join("");

  // Alerts
  document.getElementById("alertsList").innerHTML = D.alerts.map(function(a){
    return '<li class="alert-item">'
      + '<span class="alert-dot ' + a.dot + '"></span>'
      + '<div><div class="alert-text">' + a.text + '</div><div class="alert-time">' + a.time + "</div></div>"
      + "</li>";
  }).join("");

  // Quick Roster
  var rosterSearch = document.getElementById("rosterSearch");
  var allRosterStudents = [];

  Object.keys(D.students).forEach(function(courseId){
    D.students[courseId].forEach(function(student){
      allRosterStudents.push(Object.assign({}, student, {
        courseId: courseId,
        course: courseId + (courseId === "CS402" ? " - SEM 4"
          : courseId === "CS305" ? " - SEM 3"
          : courseId === "CS210" ? " - SEM 2"
          : " - SEM 1")
      }));
    });
  });

  function renderRoster(query){
    var normalizedQuery = (query || "").trim().toLowerCase();
    var visibleStudents = allRosterStudents.filter(function(student){
      return !normalizedQuery
        || student.name.toLowerCase().includes(normalizedQuery)
        || student.roll.toLowerCase().includes(normalizedQuery)
        || student.course.toLowerCase().includes(normalizedQuery);
    }).slice(0, 9);

    document.getElementById("quickRosterList").innerHTML = visibleStudents.map(function(student){
      return '<li class="roster-row" data-course="' + student.courseId + '" data-roll="' + student.roll + '">'
        + '<div class="r-avatar" style="background:' + student.color + '">' + student.init + "</div>"
        + '<div><div class="r-name">' + student.name + '</div><div class="r-course">' + student.course + "</div></div>"
        + '<span class="r-arrow">&#8250;</span></li>';
    }).join("");
  }

  renderRoster("");

  if (rosterSearch) {
    rosterSearch.addEventListener("input", function(){
      renderRoster(this.value);
    });
  }

  // Mini Courses
  document.getElementById("miniCoursesGrid").innerHTML = D.courses.filter(function(c){
    return c.status === "active";
  }).slice(0, 2).map(function(c){
    return '<div class="mini-card">'
      + '<div class="mini-semester">' + c.semester + "</div>"
      + '<div class="mini-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 10h8M8 14h5" stroke-linecap="round"/></svg></div>'
      + '<div class="mini-name">' + c.id + " &ndash; " + c.name + "</div>"
      + '<div class="mini-meta"><span>&#128101; ' + c.students + " Students</span><span>&#127979; " + c.credits + " Credits</span></div>"
      + "</div>";
  }).join("");

  // Notifications
  var notifOverlay = document.getElementById("notifOverlay");
  var closeNotif = document.getElementById("closeNotif");

  document.getElementById("notifBtn").addEventListener("click", function(){
    notifOverlay.classList.add("show");
  });

  closeNotif.addEventListener("click", function(){
    notifOverlay.classList.remove("show");
  });

  notifOverlay.addEventListener("click", function(e){
    if (e.target === notifOverlay) {
      notifOverlay.classList.remove("show");
    }
  });
}


// Wait for data
if (window.LuminaData) { initFacultyPage(); }
else { window.addEventListener('LuminaDataReady', initFacultyPage); }