/* rosters.js */
document.addEventListener("DOMContentLoaded", function(){
  var D = LuminaData;
  var PAGE_SIZE = 4;
  var currentPage = 1;
  var currentCourse = sessionStorage.getItem("selectedCourse") || ((D.courses[0] && D.courses[0].id) || "");
  var searchTerm = "";
  var faculty = D.facultyProfile || {};

  if (faculty.displayName) {
    var nameEl = document.querySelector(".navbar-user-name");
    var deptEl = document.querySelector(".navbar-user-dept");
    var avatarEl = document.querySelector(".navbar-avatar");
    if (nameEl) nameEl.textContent = faculty.displayName;
    if (deptEl) deptEl.textContent = faculty.deptName;
    if (avatarEl) avatarEl.textContent = faculty.avatar;
  }

  // Pre-select course from session
  var sel = document.getElementById("courseSelector");
  sel.value = currentCourse;

  function getFiltered(){
    var all = D.students[currentCourse] || [];
    if(!searchTerm) return all;
    return all.filter(function(s){
      return s.name.toLowerCase().includes(searchTerm)
        || s.roll.toLowerCase().includes(searchTerm)
        || s.email.toLowerCase().includes(searchTerm)
        || s.prog.toLowerCase().includes(searchTerm)
        || currentCourse.toLowerCase().includes(searchTerm);
    });
  }

  function render(){
    var filtered = getFiltered();
    var total = filtered.length;
    var totalPages = Math.ceil(total / PAGE_SIZE) || 1;
    if(currentPage > totalPages) currentPage = 1;

    var start = (currentPage - 1) * PAGE_SIZE;
    var pageData = filtered.slice(start, start + PAGE_SIZE);

    document.getElementById("enrolledCount").textContent = total;
    document.getElementById("pagInfo").textContent =
      "Showing " + (total === 0 ? 0 : start + 1) + "-" + Math.min(start + PAGE_SIZE, total) + " of " + total + " students";

    var tbody = document.getElementById("rosterTableBody");
    var empty = document.getElementById("rosterEmpty");

    if(pageData.length === 0){
      tbody.innerHTML = "";
      empty.style.display = "block";
    } else {
      empty.style.display = "none";
      tbody.innerHTML = pageData.map(function(s){
        return '<tr>'
          + '<td>' + s.roll + '</td>'
          + '<td><div class="student-cell"><div class="st-avatar" style="background:' + s.color + '">' + s.init + '</div>' + s.name + '</div></td>'
          + '<td>' + s.email + '</td>'
          + '<td><span class="prog-badge">' + s.prog + '</span></td>'
          + '</tr>';
      }).join("");
    }

    var pagBtns = document.getElementById("pagBtns");
    var btns = "";
    for(var i = 1; i <= totalPages; i++){
      btns += '<button class="pag-btn' + (i === currentPage ? ' active' : '') + '" data-pg="' + i + '">' + i + '</button>';
    }
    if(currentPage < totalPages){
      btns += '<button class="pag-btn pag-btn-next" id="nextBtn">Next &#8594;</button>';
    }
    pagBtns.innerHTML = btns;

    pagBtns.querySelectorAll(".pag-btn[data-pg]").forEach(function(b){
      b.addEventListener("click", function(){
        currentPage = parseInt(this.dataset.pg, 10);
        render();
      });
    });

    var nb = pagBtns.querySelector("#nextBtn");
    if(nb) {
      nb.addEventListener("click", function(){
        currentPage++;
        render();
      });
    }
  }

  // Course selector change
  sel.addEventListener("change", function(){
    currentCourse = this.value;
    currentPage = 1;
    sessionStorage.setItem("selectedCourse", currentCourse);
    render();
  });

  // Student search
  document.getElementById("studentSearch").addEventListener("input", function(){
    searchTerm = this.value.trim().toLowerCase();
    currentPage = 1;
    render();
  });

  // Export
  document.getElementById("exportBtn").addEventListener("click", function(){
    var students = D.students[currentCourse] || [];
    var csv = "Roll Number,Name,Email,Program\n"
      + students.map(function(s){ return s.roll + "," + s.name + "," + s.email + "," + s.prog; }).join("\n");
    var blob = new Blob([csv], {type:"text/csv"});
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = currentCourse + "_roster.csv";
    a.click();
    showToast("Roster exported successfully!", "success");
  });

  function showToast(msg, type){
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.className = "toast " + (type || "");
    t.classList.add("show");
    setTimeout(function(){ t.classList.remove("show"); }, 3000);
  }

  render();
});
