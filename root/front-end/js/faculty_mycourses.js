/* mycourses.js - My Courses page with Roster, Materials, Grades overlays */
function initFacultyMyCoursesPage() {
  var D = LuminaData;
  var faculty = D.facultyProfile || {};
  var currentFilter = "all";
  var currentSearch = "";
  var currentTerm = "all";
  var currentCourseId = "";
  var roCurrentCourse = "";
  var roSearchTerm = "";
  var roCurrentPage = 1;
  var RO_PAGE_SIZE = 8;
  var grCurrentCourse = "";
  var localGrades = {};
  var localMaterials = {};

  if (faculty.displayName) {
    var nameEl = document.querySelector(".navbar-user-name");
    var deptEl = document.querySelector(".navbar-user-dept");
    var avatarEl = document.querySelector(".navbar-avatar");
    if (nameEl) nameEl.textContent = faculty.displayName;
    if (deptEl) deptEl.textContent = faculty.deptName;
    if (avatarEl) avatarEl.textContent = faculty.avatar;
  }

  document.getElementById("alertsList").innerHTML = D.alerts.map(function (a) {
    return '<li class="alert-item">'
      + '<span class="alert-dot ' + a.dot + '"></span>'
      + '<div><div class="alert-text">' + a.text + '</div><div class="alert-time">' + a.time + '</div></div>'
      + '</li>';
  }).join("");

  function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function getMaterials(courseId) {
    if (!localMaterials[courseId]) {
      localMaterials[courseId] = (D.materials[courseId] || []).map(function (item) {
        return { name: item, kind: "mock" };
      });
    }
    return localMaterials[courseId];
  }

  function populateTermFilter() {
    var semFilter = document.getElementById("semFilter");
    var seen = {};
    var terms = [];

    function addTerm(id, label) {
      if (!id || seen[id]) return;
      seen[id] = true;
      terms.push({ id: id, label: label || id });
    }

    D.courses.forEach(function (course) {
      var termId = course.termId || "";
      addTerm(termId, course.termLabel || termId);

      var yearMatch = termId.match(/(\d{4})/);
      if (yearMatch && termId.toUpperCase().indexOf("SPRING") !== -1) {
        addTerm("FALL" + yearMatch[1], "Monsoon " + yearMatch[1]);
      } else if (yearMatch && termId.toUpperCase().indexOf("FALL") !== -1) {
        addTerm("SPRING" + yearMatch[1], "Spring " + yearMatch[1]);
      }
    });

    semFilter.innerHTML = '<option value="all">All Semesters</option>'
      + terms.map(function (term) {
        return '<option value="' + term.id + '">' + term.label + '</option>';
      }).join("");

    if (D.courses[0] && D.courses[0].termId) {
      semFilter.value = D.courses[0].termId;
      currentTerm = D.courses[0].termId;
    }
  }

  function renderCourses() {
    var list = D.courses.filter(function (c) {
      var matchStatus = currentFilter === "all" || c.status === currentFilter;
      var matchTerm = currentTerm === "all" || c.termId === currentTerm;
      var q = currentSearch.toLowerCase();
      var matchSearch = !q || c.id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
      return matchStatus && matchTerm && matchSearch;
    });

    var grid = document.getElementById("coursesGrid");
    var noR = document.getElementById("noResults");

    if (list.length === 0) {
      grid.innerHTML = "";
      noR.style.display = "block";
      return;
    }
    noR.style.display = "none";

    grid.innerHTML = list.map(function (c) {
      var badgeCls = c.status === "active" ? "badge-active" : "badge-inactive";
      var badgeTxt = c.status === "active" ? "&#9679; Active" : "&#9679; Inactive";
      return '<div class="course-card" data-id="' + c.id + '">'
        + '<div class="cc-top">'
        + '  <span class="cc-code">' + c.id + '</span>'
        + '  <span class="badge ' + badgeCls + '">' + badgeTxt + '</span>'
        + '</div>'
        + '<div class="cc-title">' + c.name + '</div>'
        + '<div class="cc-stats">'
        + '  <div class="cc-stat-item">'
        + '    <span class="cc-stat-lbl">Students</span>'
        + '    <div class="cc-stat-row">'
        + '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="14" height="14"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>'
        + '      ' + c.students
        + '    </div>'
        + '  </div>'
        + '  <div class="cc-stat-item">'
        + '    <span class="cc-stat-lbl">Year</span>'
        + '    <div class="cc-stat-row">'
        + '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke-linecap="round"/></svg>'
        + '      ' + c.year
        + '    </div>'
        + '  </div>'
        + '  <div class="cc-stat-item">'
        + '    <span class="cc-stat-lbl">Credits</span>'
        + '    <div class="cc-stat-row">'
        + '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="14" height="14"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3" stroke-linecap="round"/></svg>'
        + '      ' + c.credits.toFixed(1)
        + '    </div>'
        + '  </div>'
        + '</div>'
        + '<div class="cc-actions">'
        + '  <button class="cc-btn" onclick="openRoster(\'' + c.id + '\')">'
        + '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 10h8M8 14h5" stroke-linecap="round"/></svg>'
        + '    ROSTER'
        + '  </button>'
        + '  <button class="cc-btn" onclick="openMaterials(\'' + c.id + '\')">'
        + '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>'
        + '    MATERIALS'
        + '  </button>'
        + '  <button class="cc-btn" onclick="openGrades(\'' + c.id + '\')">'
        + '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
        + '    GRADES'
        + '  </button>'
        + '</div>'
        + '</div>';
    }).join("");
  }

  function renderMaterialsList() {
    var mats = getMaterials(currentCourseId);
    document.getElementById("matList").innerHTML = mats.map(function (m, index) {
      return '<li class="mat-item">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
        + '<span class="mat-item-name">' + m.name + '</span>'
        + '<div style="display:flex;gap:12px;">'
        + '  <button class="mat-item-view" type="button" onclick="viewMaterial(' + index + ')">View</button>'
        + '  <button class="mat-item-view" style="color: #dc2626;" type="button" onclick="deleteMaterial(' + index + ')">Delete</button>'
        + '</div>'
        + '</li>';
    }).join("");
  }

  window.openMaterials = function (courseId) {
    currentCourseId = courseId;
    var course = D.courses.find(function (c) { return c.id === courseId; });
    document.getElementById("matModalTitle").textContent = course.id + " - " + course.name;
    document.getElementById("matModalSub").textContent = "Course materials and modules";
    renderMaterialsList();
    document.getElementById("materialsOverlay").classList.add("open");
  };

  window.viewMaterial = function (index) {
    var mats = getMaterials(currentCourseId);
    var material = mats[index];
    if (!material) return;

    if (material.file) {
      var fileUrl = URL.createObjectURL(material.file);
      window.open(fileUrl, "_blank");
      return;
    }

    var previewWindow = window.open("", "_blank");
    if (previewWindow) {
      previewWindow.document.write(
        "<!DOCTYPE html><html><head><title>" + material.name + "</title></head><body style=\"font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#0f172a;\">"
        + "<h1 style=\"margin:0 0 12px;font-size:22px;\">" + material.name + "</h1>"
        + "<p style=\"margin:0;font-size:14px;line-height:1.6;\">Preview is not attached for this sample material yet. Faculty can still review the title here and upload real files with the Add Material button.</p>"
        + "</body></html>"
      );
      previewWindow.document.close();
    }
  };

  window.deleteMaterial = function (index) {
    var mats = getMaterials(currentCourseId);
    if (!mats[index]) return;
    if (confirm("Are you sure you want to delete '" + mats[index].name + "'?")) {
      mats.splice(index, 1);
      renderMaterialsList();
      showToast("Material deleted successfully.", "success");
    }
  };

  document.getElementById("matAddBtn").addEventListener("click", function () {
    document.getElementById("matFileInput").click();
  });

  document.getElementById("matFileInput").addEventListener("change", function () {
    var files = Array.from(this.files || []);
    if (files.length === 0 || !currentCourseId) return;

    var mats = getMaterials(currentCourseId);
    files.forEach(function (file) {
      mats.push({ name: file.name, kind: "upload", file: file });
    });

    renderMaterialsList();
    showToast(files.length + " material" + (files.length > 1 ? "s" : "") + " added.", "success");
    this.value = "";
  });

  document.getElementById("matCloseBtn").addEventListener("click", function () {
    document.getElementById("materialsOverlay").classList.remove("open");
  });

  document.getElementById("materialsOverlay").addEventListener("click", function (e) {
    if (e.target === this) this.classList.remove("open");
  });

  window.openRoster = function (courseId) {
    roCurrentCourse = courseId;
    roSearchTerm = "";
    roCurrentPage = 1;
    document.getElementById("roSearchInput").value = "";
    var course = D.courses.find(function (c) { return c.id === courseId; });
    document.getElementById("rosterModalTitle").textContent = course.id + " - " + course.name;
    document.getElementById("rosterModalSub").textContent = "Students enrolled in this course";
    renderRosterTable();
    document.getElementById("rosterOverlay").classList.add("open");
  };

  function renderRosterTable() {
    var all = D.students[roCurrentCourse] || [];
    var list = !roSearchTerm ? all : all.filter(function (s) {
      return s.name.toLowerCase().includes(roSearchTerm)
        || s.roll.toLowerCase().includes(roSearchTerm)
        || s.email.toLowerCase().includes(roSearchTerm)
        || s.prog.toLowerCase().includes(roSearchTerm);
    });
    var total = list.length;
    var totalPages = Math.max(1, Math.ceil(total / RO_PAGE_SIZE));
    if (roCurrentPage > totalPages) {
      roCurrentPage = 1;
    }
    var start = (roCurrentPage - 1) * RO_PAGE_SIZE;
    var pageList = list.slice(start, start + RO_PAGE_SIZE);

    document.getElementById("roEnrolledCount").textContent = all.length;
    var tbody = document.getElementById("roTableBody");
    var empty = document.getElementById("roEmpty");
    var pagInfo = document.getElementById("roPagInfo");
    var pagBtns = document.getElementById("roPagBtns");

    if (pageList.length === 0) {
      tbody.innerHTML = "";
      empty.style.display = "block";
      pagInfo.textContent = "Showing 0-0 of 0 students";
      pagBtns.innerHTML = "";
      return;
    }
    empty.style.display = "none";
    pagInfo.textContent = "Showing " + (start + 1) + "-" + Math.min(start + RO_PAGE_SIZE, total) + " of " + total + " students";

    tbody.innerHTML = pageList.map(function (s) {
      return '<tr>'
        + '<td><div class="ro-student-cell">'
        + '  <div class="ro-avatar" style="background:' + s.color + '">' + s.init + '</div>'
        + '  ' + s.roll
        + '</div></td>'
        + '<td>' + s.name + '</td>'
        + '<td>' + s.email + '</td>'
        + '<td><span class="ro-prog-badge">' + s.prog + '</span></td>'
        + '</tr>';
    }).join("");

    renderRosterPagination(totalPages);
  }

  function renderRosterPagination(totalPages) {
    var pagBtns = document.getElementById("roPagBtns");
    var parts = [];
    var i;

    for (i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= roCurrentPage - 1 && i <= roCurrentPage + 1)
      ) {
        parts.push('<button class="ro-pag-btn' + (i === roCurrentPage ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>');
      } else if (
        i === roCurrentPage - 2 ||
        i === roCurrentPage + 2
      ) {
        parts.push('<span class="ro-pag-dots">...</span>');
      }
    }

    if (roCurrentPage < totalPages) {
      parts.push('<button class="ro-pag-btn" data-page="next">Next</button>');
    }

    pagBtns.innerHTML = parts.join("");

    pagBtns.querySelectorAll(".ro-pag-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var page = this.dataset.page;
        if (page === "next") {
          roCurrentPage++;
        } else {
          roCurrentPage = parseInt(page, 10);
        }
        renderRosterTable();
      });
    });
  }

  document.getElementById("roSearchInput").addEventListener("input", function () {
    roSearchTerm = this.value.trim().toLowerCase();
    roCurrentPage = 1;
    renderRosterTable();
  });

  document.getElementById("rosterCloseBtn").addEventListener("click", function () {
    document.getElementById("rosterOverlay").classList.remove("open");
  });

  document.getElementById("rosterOverlay").addEventListener("click", function (e) {
    if (e.target === this) this.classList.remove("open");
  });

  document.getElementById("roExportBtn").addEventListener("click", function () {
    var students = D.students[roCurrentCourse] || [];
    var csv = "Roll Number,Name,Email,Program\n"
      + students.map(function (s) { return s.roll + "," + s.name + "," + s.email + "," + s.prog; }).join("\n");
    var blob = new Blob([csv], { type: "text/csv" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = roCurrentCourse + "_roster.csv";
    a.click();
    showToast("Roster exported!", "success");
  });

  function initLocalGrades(courseId) {
    if (!localGrades[courseId]) {
      localGrades[courseId] = deepCopy(D.grades[courseId] || []);
    }
  }

  function calcTotal(mid, fin) {
    return Math.round(mid + fin);
  }

  window.openGrades = function (courseId) {
    grCurrentCourse = courseId;
    initLocalGrades(courseId);
    var course = D.courses.find(function (c) { return c.id === courseId; });
    document.getElementById("gradesModalTitle").textContent = course.id + " - " + course.name;
    document.getElementById("gradesModalSub").textContent = "Enter and manage student grades";
    document.getElementById("grSavedTag").style.display = "none";
    renderGradesTable();
    document.getElementById("gradesOverlay").classList.add("open");
  };

  function renderGradesTable() {
    var list = localGrades[grCurrentCourse] || [];
    var tbody = document.getElementById("grTableBody");
    var empty = document.getElementById("grEmpty");

    if (list.length === 0) {
      tbody.innerHTML = "";
      empty.style.display = "block";
      document.getElementById("grTableFoot").innerHTML = "";
      return;
    }
    empty.style.display = "none";

    tbody.innerHTML = list.map(function (r, i) {
      var total = calcTotal(r.mid, r.fin);
      var gl = D.gradeLetter(total);
      return '<tr id="gr-row-' + r.roll + '">'
        + '<td class="td-num">' + (i + 1) + '</td>'
        + '<td><span class="td-text">' + r.roll + '</span></td>'
        + '<td><span class="td-text">' + r.name + '</span></td>'
        + '<td class="xl-td-score-cell" id="mid-cell-' + r.roll + '">'
        + '  <input class="xl-score-inp" type="number" min="0" max="30" value="' + r.mid + '" data-roll="' + r.roll + '" data-type="mid"/>'
        + '</td>'
        + '<td class="xl-td-score-cell" id="fin-cell-' + r.roll + '">'
        + '  <input class="xl-score-inp" type="number" min="0" max="70" value="' + r.fin + '" data-roll="' + r.roll + '" data-type="fin"/>'
        + '</td>'
        + '<td class="td-total" id="total-' + r.roll + '">' + total + '</td>'
        + '<td class="td-grade">'
        + '  <span class="grade-pill" id="grade-' + r.roll + '" style="background:' + gl.c + '">' + gl.l + '</span>'
        + '</td>'
        + '</tr>';
    }).join("");

    var avgMid = (list.reduce(function (s, r) { return s + r.mid; }, 0) / list.length).toFixed(1);
    var avgFin = (list.reduce(function (s, r) { return s + r.fin; }, 0) / list.length).toFixed(1);
    var avgTot = (list.reduce(function (s, r) { return s + calcTotal(r.mid, r.fin); }, 0) / list.length).toFixed(1);
    document.getElementById("grTableFoot").innerHTML =
      '<tr class="xl-foot-tr">'
      + '<td class="td-num"></td>'
      + '<td colspan="2"><span class="td-text" style="font-weight:700;">Class Average</span></td>'
      + '<td style="text-align:center;padding:9px;font-weight:700;">' + avgMid + '</td>'
      + '<td style="text-align:center;padding:9px;font-weight:700;">' + avgFin + '</td>'
      + '<td style="text-align:center;padding:9px;font-weight:700;">' + avgTot + '</td>'
      + '<td></td>'
      + '</tr>';

    attachGradeInputListeners();
  }

  function attachGradeInputListeners() {
    document.querySelectorAll(".xl-score-inp").forEach(function (inp) {
      inp.addEventListener("input", function () {
        var roll = this.dataset.roll;
        var type = this.dataset.type;
        var val = parseInt(this.value, 10);
        
        var maxVal = type === 'mid' ? 30 : 70;
        if (isNaN(val) || val < 0 || val > maxVal) {
          this.classList.add("inp-error");
          return;
        }
        this.classList.remove("inp-error");

        var rec = (localGrades[grCurrentCourse] || []).find(function (r) { return r.roll === roll; });
        if (rec) {
          rec[type] = val;
          var tot = calcTotal(rec.mid, rec.fin);
          var gl = D.gradeLetter(tot);
          var te = document.getElementById("total-" + roll);
          var ge = document.getElementById("grade-" + roll);
          if (te) te.textContent = tot;
          if (ge) {
            ge.textContent = gl.l;
            ge.style.background = gl.c;
          }
        }
        document.getElementById("grSavedTag").style.display = "none";
      });
    });
  }

  document.getElementById("gradesCloseBtn").addEventListener("click", function () {
    document.getElementById("gradesOverlay").classList.remove("open");
  });

  document.getElementById("gradesOverlay").addEventListener("click", function (e) {
    if (e.target === this) this.classList.remove("open");
  });

  document.getElementById("grSaveDraftBtn").addEventListener("click", function () {
    var errors = document.querySelectorAll(".inp-error");
    if (errors.length > 0) {
      showToast("Fix highlighted cells first.", "error");
      return;
    }
    sessionStorage.setItem("gradesDraft_" + grCurrentCourse, JSON.stringify(localGrades[grCurrentCourse]));
    document.getElementById("grSavedTag").style.display = "inline";
    showToast("Draft saved!", "success");
  });

  document.getElementById("grSubmitBtn").addEventListener("click", function () {
    var errors = document.querySelectorAll(".inp-error");
    if (errors.length > 0) {
      showToast("Fix highlighted cells before submitting.", "error");
      return;
    }
    D.grades[grCurrentCourse] = deepCopy(localGrades[grCurrentCourse]);
    document.getElementById("grSavedTag").style.display = "inline";
    showToast("Grades submitted successfully!", "success");
  });

  document.getElementById("grExportBtn").addEventListener("click", function () {
    var list = localGrades[grCurrentCourse] || [];
    var rows = [["Roll Number", "Student Name", "Midterm", "Final", "Total", "Grade"]];
    list.forEach(function (r) {
      var tot = calcTotal(r.mid, r.fin);
      var gl = D.gradeLetter(tot);
      rows.push([r.roll, r.name, r.mid, r.fin, tot, gl.l]);
    });
    var csv = rows.map(function (r) { return r.join(","); }).join("\n");
    var blob = new Blob([csv], { type: "text/csv" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = grCurrentCourse + "_grades.csv";
    a.click();
    showToast("Grades exported as CSV!", "success");
  });

  document.querySelectorAll(".stab").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".stab").forEach(function (b) { b.classList.remove("active"); });
      this.classList.add("active");
      currentFilter = this.dataset.s;
      renderCourses();
    });
  });

  document.getElementById("courseSearch").addEventListener("input", function () {
    currentSearch = this.value.trim();
    renderCourses();
  });

  document.getElementById("semFilter").addEventListener("change", function () {
    currentTerm = this.value;
    renderCourses();
  });

  function showToast(msg, type) {
    var t = document.getElementById("mcToast");
    t.textContent = msg;
    t.className = "toast " + (type || "");
    t.classList.add("show");
    setTimeout(function () { t.classList.remove("show"); }, 3000);
  }

  var notifOverlay = document.getElementById("notifOverlay");
  var closeNotif = document.getElementById("closeNotif");

  document.getElementById("notifBtn").addEventListener("click", function () {
    notifOverlay.classList.add("show");
  });

  closeNotif.addEventListener("click", function () {
    notifOverlay.classList.remove("show");
  });

  notifOverlay.addEventListener("click", function (e) {
    if (e.target === notifOverlay) {
      notifOverlay.classList.remove("show");
    }
  });

  populateTermFilter();
  renderCourses();
}

if (window.LuminaData) {
  initFacultyMyCoursesPage();
} else {
  window.addEventListener("LuminaDataReady", initFacultyMyCoursesPage, { once: true });
}