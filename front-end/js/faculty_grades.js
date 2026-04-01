/* grades.js – Excel-style grade sheet */
document.addEventListener("DOMContentLoaded", function(){
  var D = LuminaData;
  var currentCourse = sessionStorage.getItem("selectedCourse") || ((D.courses[0] && D.courses[0].id) || "");
  var searchTerm = "";
  var faculty = D.facultyProfile || {};
  // Local copy of grades so edits don't mutate original until submit
  var localGrades = {};

  if (faculty.displayName) {
    var nameEl = document.querySelector(".navbar-user-name");
    var deptEl = document.querySelector(".navbar-user-dept");
    var avatarEl = document.querySelector(".navbar-avatar");
    if (nameEl) nameEl.textContent = faculty.displayName;
    if (deptEl) deptEl.textContent = faculty.deptName;
    if (avatarEl) avatarEl.textContent = faculty.avatar;
  }

  function deepCopy(obj){ return JSON.parse(JSON.stringify(obj)); }

  function initLocalGrades(courseId){
    localGrades[courseId] = localGrades[courseId] || deepCopy(D.grades[courseId] || []);
  }

  // Set course selector
  var courseSelect = document.getElementById("grCourseSelect");
  courseSelect.value = currentCourse;
  initLocalGrades(currentCourse);

  function getFiltered(){
    var all = localGrades[currentCourse] || [];
    if(!searchTerm) return all;
    return all.filter(function(r){
      return r.name.toLowerCase().includes(searchTerm) || r.roll.includes(searchTerm);
    });
  }

  function calcTotal(mid, fin){ return Math.round(mid * 0.4 + fin * 0.6); }

  function render(){
    var list = getFiltered();
    document.getElementById("xlSheetName").textContent = courseSelect.options[courseSelect.selectedIndex].text;
    document.getElementById("xlSheetSem").textContent  = document.getElementById("grSemSelect").value;
    document.getElementById("xlCount").textContent = list.length + " student" + (list.length!==1?"s":"");

    var tbody = document.getElementById("xlTableBody");
    tbody.innerHTML = list.map(function(r, i){
      var total = calcTotal(r.mid, r.fin);
      var gl    = D.gradeLetter(total);
      return '<tr id="row-'+r.roll+'">'
        +'<td class="xl-td xl-td-num">'+(i+1)+'</td>'
        +'<td class="xl-td">'+r.roll+'</td>'
        +'<td class="xl-td">'+r.name+'</td>'
        +'<td class="xl-td-score" id="mid-cell-'+r.roll+'">'
        +'  <input class="xl-score-input" type="number" min="0" max="100" value="'+r.mid+'" data-roll="'+r.roll+'" data-type="mid"/>'
        +'</td>'
        +'<td class="xl-td-score" id="fin-cell-'+r.roll+'">'
        +'  <input class="xl-score-input" type="number" min="0" max="100" value="'+r.fin+'" data-roll="'+r.roll+'" data-type="fin"/>'
        +'</td>'
        +'<td class="xl-td xl-td-total" id="total-'+r.roll+'">'+total+'</td>'
        +'<td class="xl-td xl-td-grade">'
        +'  <span class="grade-badge" id="grade-'+r.roll+'" style="background:'+gl.c+'">'+gl.l+'</span>'
        +'</td>'
        +'</tr>';
    }).join("");

    // Footer averages row
    if(list.length > 0){
      var avgMid  = (list.reduce(function(s,r){return s+r.mid;},0)/list.length).toFixed(1);
      var avgFin  = (list.reduce(function(s,r){return s+r.fin;},0)/list.length).toFixed(1);
      var avgTot  = (list.reduce(function(s,r){return s+calcTotal(r.mid,r.fin);},0)/list.length).toFixed(1);
      document.getElementById("xlTableFoot").innerHTML =
        '<tr class="xl-foot-row">'
        +'<td class="xl-td xl-td-num"></td>'
        +'<td class="xl-td" colspan="2" style="font-weight:700;color:#374151;">Class Average</td>'
        +'<td class="xl-td xl-td-total" style="text-align:center;">'+avgMid+'</td>'
        +'<td class="xl-td xl-td-total" style="text-align:center;">'+avgFin+'</td>'
        +'<td class="xl-td xl-td-total" style="text-align:center;">'+avgTot+'</td>'
        +'<td class="xl-td"></td>'
        +'</tr>';
    } else {
      document.getElementById("xlTableFoot").innerHTML = "";
    }

    attachInputListeners();
  }

  function attachInputListeners(){
    document.querySelectorAll(".xl-score-input").forEach(function(inp){
      inp.addEventListener("input", function(){
        var roll = this.dataset.roll;
        var type = this.dataset.type;
        var val  = parseInt(this.value);
        var cell = document.getElementById((type==="mid"?"mid":"fin")+"-cell-"+roll);

        // Validation
        if(isNaN(val) || val < 0 || val > 100){
          cell.classList.add("has-error");
          return;
        }
        cell.classList.remove("has-error");

        // Update local grades
        var rec = (localGrades[currentCourse]||[]).find(function(r){ return r.roll===roll; });
        if(rec){ rec[type] = val; }

        // Recalculate total and grade
        var r2 = (localGrades[currentCourse]||[]).find(function(r){ return r.roll===roll; });
        if(r2){
          var tot = calcTotal(r2.mid, r2.fin);
          var gl  = D.gradeLetter(tot);
          var totalEl = document.getElementById("total-"+roll);
          var gradeEl = document.getElementById("grade-"+roll);
          if(totalEl) totalEl.textContent = tot;
          if(gradeEl){ gradeEl.textContent = gl.l; gradeEl.style.background = gl.c; }
        }

        // Hide saved tag when editing
        document.getElementById("xlSavedTag").style.display = "none";
      });
    });
  }

  // Validate all inputs
  function validateAll(){
    var errors = document.querySelectorAll(".has-error");
    if(errors.length > 0){ showToast("Fix highlighted cells before submitting.", "error"); return false; }
    var inputs = document.querySelectorAll(".xl-score-input");
    var allFilled = true;
    inputs.forEach(function(inp){
      if(inp.value === "" || inp.value === null){ allFilled = false; }
    });
    if(!allFilled){ showToast("Please fill all grade fields.", "error"); return false; }
    return true;
  }

  // Save draft
  document.getElementById("saveDraftBtn").addEventListener("click", function(){
    sessionStorage.setItem("gradesDraft_"+currentCourse, JSON.stringify(localGrades[currentCourse]));
    document.getElementById("xlSavedTag").style.display = "inline";
    showToast("Draft saved successfully!", "success");
  });

  // Submit grades
  document.getElementById("submitGradesBtn").addEventListener("click", function(){
    if(!validateAll()) return;
    // Commit to data
    D.grades[currentCourse] = deepCopy(localGrades[currentCourse]);
    showToast("Grades submitted successfully!", "success");
    document.getElementById("xlSavedTag").style.display = "inline";
  });

  // Export as CSV (Excel-compatible)
  document.getElementById("exportXlBtn").addEventListener("click", function(){
    var list = localGrades[currentCourse] || [];
    var rows = [["Roll Number","Student Name","Midterm","Final","Total","Grade"]];
    list.forEach(function(r){
      var tot = calcTotal(r.mid, r.fin);
      var gl  = D.gradeLetter(tot);
      rows.push([r.roll, r.name, r.mid, r.fin, tot, gl.l]);
    });
    var csv = rows.map(function(r){ return r.join(","); }).join("\n");
    var blob = new Blob([csv], {type:"text/csv"});
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = currentCourse+"_grades.csv";
    a.click();
    showToast("Grades exported as Excel-compatible CSV!", "success");
  });

  // Course change
  courseSelect.addEventListener("change", function(){
    currentCourse = this.value;
    sessionStorage.setItem("selectedCourse", currentCourse);
    initLocalGrades(currentCourse);
    searchTerm = "";
    document.getElementById("grStudentSearch").value = "";
    document.getElementById("xlSavedTag").style.display = "none";
    render();
  });

  // Semester change
  document.getElementById("grSemSelect").addEventListener("change", function(){
    document.getElementById("xlSheetSem").textContent = this.value;
  });

  // Search
  document.getElementById("grStudentSearch").addEventListener("input", function(){
    searchTerm = this.value.trim().toLowerCase();
    render();
  });

  // Toast
  function showToast(msg, type){
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.className = "toast "+(type||"");
    t.classList.add("show");
    setTimeout(function(){ t.classList.remove("show"); }, 3000);
  }

  render();
});
