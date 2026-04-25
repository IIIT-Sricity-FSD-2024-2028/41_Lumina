/* announcements.js - full CRUD + validation */
document.addEventListener("DOMContentLoaded", function(){
  var D = LuminaData;
  var faculty = D.facultyProfile || {};
  var announcements = D.announcements.slice();
  var courses = D.courses || [];
  var nextId = announcements.reduce(function(m, a){ return Math.max(m, a.id); }, 0) + 1;
  var deleteTargetId = null;
  var searchTerm = "";
  var courseFilter = "all";

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

  var courseLabels = {};
  courses.forEach(function(course) {
    courseLabels[course.id] = course.id + " - " + String(course.name || "").toUpperCase();
  });

  function populateCourseOptions() {
    var filterEl = document.getElementById("annCourseFilter");
    var formEl = document.getElementById("annCourse");

    filterEl.innerHTML = '<option value="all">All Courses</option>' + courses.map(function(course) {
      return '<option value="' + course.id + '">' + course.id + ' - ' + course.name + '</option>';
    }).join("");

    formEl.innerHTML = '<option value="">Select a course</option>' + courses.map(function(course) {
      return '<option value="' + course.id + '">' + course.id + ' - ' + course.name + '</option>';
    }).join("");
  }

  function render(){
    var list = announcements.filter(function(a){
      var matchCourse = courseFilter === "all" || a.courseId === courseFilter;
      var q = searchTerm.toLowerCase();
      var matchSearch = !q || a.title.toLowerCase().includes(q) || a.msg.toLowerCase().includes(q);
      return matchCourse && matchSearch;
    });

    var grid = document.getElementById("annGrid");
    var empty = document.getElementById("annEmpty");

    if(list.length === 0){
      grid.innerHTML = "";
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    grid.innerHTML = list.map(function(a){
      return '<div class="ann-card" id="ann-' + a.id + '">'
        + '<div class="ann-card-top">'
        + '  <span class="ann-course-tag">' + a.courseLabel + '</span>'
        + '  <span class="ann-time">' + a.ago + '</span>'
        + '</div>'
        + '<div class="ann-card-title">' + a.title + '</div>'
        + '<div class="ann-card-msg">' + a.msg + '</div>'
        + '<div class="ann-card-actions">'
        + '  <button class="ann-action-btn ann-edit-btn" onclick="openEdit(' + a.id + ')">'
        + '    <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        + '    Edit'
        + '  </button>'
        + '  <button class="ann-action-btn ann-delete-btn" onclick="confirmDelete(' + a.id + ')">'
        + '    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        + '    Delete'
        + '  </button>'
        + '</div>'
        + '</div>';
    }).join("");
  }

  document.getElementById("newAnnBtn").addEventListener("click", function(){
    clearForm();
    document.getElementById("annModalTitle").textContent = "New Announcement";
    document.getElementById("editAnnId").value = "";
    document.getElementById("annModal").classList.add("open");
  });

  window.openEdit = function(id){
    var a = announcements.find(function(x){ return x.id === id; });
    if(!a) return;
    clearForm();
    document.getElementById("annModalTitle").textContent = "Edit Announcement";
    document.getElementById("editAnnId").value = id;
    document.getElementById("annCourse").value = a.courseId;
    document.getElementById("annTitle").value = a.title;
    document.getElementById("annMsg").value = a.msg;
    document.getElementById("annModal").classList.add("open");
  };

  document.getElementById("cancelAnnBtn").addEventListener("click", closeModal);
  document.getElementById("annModal").addEventListener("click", function(e){
    if(e.target === this) closeModal();
  });

  function closeModal(){
    document.getElementById("annModal").classList.remove("open");
    clearForm();
  }

  document.getElementById("annForm").addEventListener("submit", function(e){
    e.preventDefault();
    if(!validateForm()) return;

    var editId = document.getElementById("editAnnId").value;
    var courseId = document.getElementById("annCourse").value;
    var title = document.getElementById("annTitle").value.trim();
    var msg = document.getElementById("annMsg").value.trim();

    if(editId){
      var idx = announcements.findIndex(function(a){ return a.id === parseInt(editId, 10); });
      if(idx > -1){
        announcements[idx].courseId = courseId;
        announcements[idx].courseLabel = courseLabels[courseId] || courseId;
        announcements[idx].title = title;
        announcements[idx].msg = msg;
        announcements[idx].ago = "Just now";
      }
      showToast("Announcement updated successfully!", "success");
    } else {
      announcements.unshift({
        id: nextId++,
        courseId: courseId,
        courseLabel: courseLabels[courseId] || courseId,
        title: title,
        msg: msg,
        ago: "Just now"
      });
      showToast("Announcement posted successfully!", "success");
    }

    closeModal();
    render();
  });

  function validateForm(){
    var ok = true;

    var course = document.getElementById("annCourse").value;
    var errC = document.getElementById("errCourse");
    if(!course){ errC.textContent = "Please select a course."; ok = false; }
    else errC.textContent = "";

    var title = document.getElementById("annTitle").value.trim();
    var errT = document.getElementById("errTitle");
    if(!title){ errT.textContent = "Title is required."; ok = false; }
    else if(title.length < 5){ errT.textContent = "Title must be at least 5 characters."; ok = false; }
    else errT.textContent = "";

    var msg = document.getElementById("annMsg").value.trim();
    var errM = document.getElementById("errMsg");
    if(!msg){ errM.textContent = "Message is required."; ok = false; }
    else if(msg.length < 10){ errM.textContent = "Message must be at least 10 characters."; ok = false; }
    else errM.textContent = "";

    return ok;
  }

  function clearForm(){
    document.getElementById("annForm").reset();
    ["errCourse","errTitle","errMsg"].forEach(function(id){ document.getElementById(id).textContent = ""; });
    document.getElementById("fdSelected").style.display = "none";
  }

  window.confirmDelete = function(id){
    deleteTargetId = id;
    document.getElementById("deleteModal").classList.add("open");
  };

  document.getElementById("cancelDelBtn").addEventListener("click", function(){
    document.getElementById("deleteModal").classList.remove("open");
    deleteTargetId = null;
  });

  document.getElementById("confirmDelBtn").addEventListener("click", function(){
    if(deleteTargetId === null) return;
    announcements = announcements.filter(function(a){ return a.id !== deleteTargetId; });
    document.getElementById("deleteModal").classList.remove("open");
    deleteTargetId = null;
    showToast("Announcement deleted.", "success");
    render();
  });

  document.getElementById("deleteModal").addEventListener("click", function(e){
    if(e.target === this){ this.classList.remove("open"); deleteTargetId = null; }
  });

  document.getElementById("fileDrop").addEventListener("click", function(){
    document.getElementById("annFile").click();
  });

  document.getElementById("annFile").addEventListener("change", function(){
    var f = this.files[0];
    if(!f) return;
    var allowed = ["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if(!allowed.includes(f.type)){ showToast("Only PDF and DOCX files are allowed.", "error"); return; }
    if(f.size > 10 * 1024 * 1024){ showToast("File size must be under 10MB.", "error"); return; }
    var sel = document.getElementById("fdSelected");
    sel.textContent = "Attached: " + f.name;
    sel.style.display = "block";
  });

  document.getElementById("annSearch").addEventListener("input", function(){
    searchTerm = this.value.trim();
    render();
  });

  document.getElementById("annCourseFilter").addEventListener("change", function(){
    courseFilter = this.value;
    render();
  });

  function showToast(msg, type){
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.className = "toast " + (type || "");
    t.classList.add("show");
    setTimeout(function(){ t.classList.remove("show"); }, 3000);
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

  populateCourseOptions();
  render();
});
