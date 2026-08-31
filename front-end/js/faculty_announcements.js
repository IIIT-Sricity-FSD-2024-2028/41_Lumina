/* announcements.js - full CRUD + validation */
function initFacultyPage() {

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

  var courseLabels = { "all": "All Courses" };
  courses.forEach(function(course) {
    courseLabels[course.id] = course.id + " - " + String(course.name || "").toUpperCase();
  });

  function populateCourseOptions() {
    var filterEl = document.getElementById("annCourseFilter");
    var formEl = document.getElementById("annCourse");

    var options = courses.map(function(course) {
      return '<option value="' + course.id + '">' + course.id + ' - ' + course.name + '</option>';
    }).join("");

    filterEl.innerHTML = '<option value="all">All Courses</option>' + options;

    formEl.innerHTML = '<option value="all">All Courses</option>' + options;
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
      var attachmentHtml = "";
      if (a.attachmentUrl || a.attachmentName) {
        var attachName = a.attachmentName || "Attached Document";
        var attachUrl = a.attachmentUrl ? (a.attachmentUrl.startsWith('http') ? a.attachmentUrl : ('http://localhost:3000' + a.attachmentUrl)) : '#';
        attachmentHtml = '<div style="margin: 8px 0 4px 0;">'
          + '<a href="' + attachUrl + '" target="_blank" style="display:inline-flex; align-items:center; gap:6px; background:#f8fafc; border:1px solid #cbd5e1; padding:5px 10px; border-radius:6px; font-size:0.76rem; color:#1e40af; text-decoration:none; font-weight:600;">'
          + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
          + '<span>📎 ' + attachName + '</span>'
          + '</a>'
          + '</div>';
      }

      return '<div class="ann-card" id="ann-' + a.id + '">'
        + '<div class="ann-card-top">'
        + '  <span class="ann-course-tag">' + a.courseLabel + '</span>'
        + '  <span class="ann-time">' + a.ago + '</span>'
        + '</div>'
        + '<div class="ann-card-title">' + a.title + '</div>'
        + '<div class="ann-card-msg">' + a.msg + '</div>'
        + attachmentHtml
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
    updateRecipientHelp(a.courseId);
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

  document.getElementById("annForm").addEventListener("submit", async function(e){
    e.preventDefault();
    if(!validateForm()) return;

    var editId = document.getElementById("editAnnId").value;
    var courseId = document.getElementById("annCourse").value;
    var title = document.getElementById("annTitle").value.trim();
    var msg = document.getElementById("annMsg").value.trim();
    var fileInput = document.getElementById("annFile");
    var attachedFile = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

    var session = JSON.parse(localStorage.getItem('Lumina_Session') || '{}');
    var facultyUser = JSON.parse(localStorage.getItem('Lumina_User') || '{}');
    var facultyId = faculty.id || facultyUser.userId || session.userId || 'F2024001';

    try {
      if(editId){
        var res = await fetch('http://localhost:3000/announcements/' + editId, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-role': 'Faculty',
            'x-user-id': facultyId,
            ...(session.accessToken ? { 'Authorization': `Bearer ${session.accessToken}` } : {})
          },
          body: JSON.stringify({ courseId: courseId, title: title, message: msg })
        });
        if (!res.ok) {
          var errData = await res.json().catch(function() { return {}; });
          throw new Error(errData.message || "Error updating announcement.");
        }
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
        // Build FormData to invoke Multer file upload middleware
        var formData = new FormData();
        formData.append('courseId', courseId);
        formData.append('title', title);
        formData.append('message', msg);
        if (attachedFile) {
          formData.append('file', attachedFile);
        }

        var res = await fetch('http://localhost:3000/announcements', {
          method: 'POST',
          headers: {
            'x-role': 'Faculty',
            'x-user-id': facultyId,
            ...(session.accessToken ? { 'Authorization': `Bearer ${session.accessToken}` } : {})
          },
          body: formData
        });

        if (!res.ok) {
          var errData = await res.json().catch(function() { return {}; });
          var errMsg = Array.isArray(errData.message) ? errData.message.join(', ') : (errData.message || "Error saving announcement.");
          throw new Error(errMsg);
        }

        var newAnn = await res.json();
        announcements.unshift({
          id: newAnn.announcementId,
          courseId: courseId,
          courseLabel: courseLabels[courseId] || courseId,
          title: title,
          msg: msg,
          ago: "Just now",
          attachmentName: newAnn.attachmentName,
          attachmentUrl: newAnn.attachmentUrl,
          fileSize: newAnn.fileSize
        });
        showToast(attachedFile ? "Announcement & attachment uploaded successfully!" : "Announcement posted successfully!", "success");
      }
      closeModal();
      render();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Error saving announcement.", "error");
    }
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
    var fileInput = document.getElementById("annFile");
    if (fileInput) fileInput.value = "";
    ["errCourse","errTitle","errMsg"].forEach(function(id){ document.getElementById(id).textContent = ""; });
    var sel = document.getElementById("fdSelected");
    if (sel) {
      sel.textContent = "";
      sel.style.display = "none";
    }
    updateRecipientHelp("all");
  }

  window.confirmDelete = function(id){
    deleteTargetId = id;
    document.getElementById("deleteModal").classList.add("open");
  };

  document.getElementById("cancelDelBtn").addEventListener("click", function(){
    document.getElementById("deleteModal").classList.remove("open");
    deleteTargetId = null;
  });

  document.getElementById("confirmDelBtn").addEventListener("click", async function(){
    if(deleteTargetId === null) return;
    try {
      var session = JSON.parse(localStorage.getItem('Lumina_Session') || '{}');
      await fetch('http://localhost:3000/announcements/' + deleteTargetId, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(session.accessToken ? { 'Authorization': `Bearer ${session.accessToken}` } : {}),
          'x-role': 'Faculty',
          'x-user-id': faculty.id || 'F2024001'
        }
      });

      announcements = announcements.filter(function(a){ return a.id !== deleteTargetId; });
      document.getElementById("deleteModal").classList.remove("open");
      deleteTargetId = null;
      showToast("Announcement deleted.", "success");
      render();
    } catch (err) {
      console.error(err);
      showToast("Error deleting announcement.", "error");
    }
  });

  document.getElementById("deleteModal").addEventListener("click", function(e){
    if(e.target === this){ this.classList.remove("open"); deleteTargetId = null; }
  });

  var fileDropEl = document.getElementById("fileDrop");
  if (fileDropEl) {
    fileDropEl.addEventListener("click", function(){
      document.getElementById("annFile").click();
    });

    fileDropEl.addEventListener("dragover", function(e) {
      e.preventDefault();
      fileDropEl.style.borderColor = "#2563eb";
      fileDropEl.style.background = "#eff6ff";
    });

    fileDropEl.addEventListener("dragleave", function(e) {
      e.preventDefault();
      fileDropEl.style.borderColor = "";
      fileDropEl.style.background = "";
    });

    fileDropEl.addEventListener("drop", function(e) {
      e.preventDefault();
      fileDropEl.style.borderColor = "";
      fileDropEl.style.background = "";
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        var fileInput = document.getElementById("annFile");
        fileInput.files = e.dataTransfer.files;
        var f = e.dataTransfer.files[0];
        var sel = document.getElementById("fdSelected");
        sel.textContent = "Attached: " + f.name;
        sel.style.display = "block";
      }
    });
  }

  document.getElementById("annFile").addEventListener("change", function(){
    var f = this.files[0];
    if(!f) return;
    var sel = document.getElementById("fdSelected");
    sel.textContent = "Attached: " + f.name;
    sel.style.display = "block";
  });


  function updateRecipientHelp(val) {
    var help = document.getElementById("recipientHelp");
    if(!help) return;
    if(val === "all" || !val){
      help.textContent = "All students enrolled in your assigned courses will see this announcement.";
    } else {
      var label = courseLabels[val] || val;
      help.textContent = "Students enrolled in " + label + " will receive this announcement.";
    }
  }

  document.getElementById("annCourse").addEventListener("change", function(){
    updateRecipientHelp(this.value);
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
}

// Wait for data
if (window.LuminaData) { initFacultyPage(); }
else { window.addEventListener('LuminaDataReady', initFacultyPage); }