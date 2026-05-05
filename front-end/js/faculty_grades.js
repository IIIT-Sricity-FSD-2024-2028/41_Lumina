/* grades.js – API Driven */
const API_BASE = 'http://localhost:3000';
const sessionData = localStorage.getItem('Lumina_Session');
const currentUser = sessionData ? JSON.parse(sessionData) : null;
const API_HEADERS = {
    'Content-Type': 'application/json',
    'x-role': currentUser ? currentUser.Role : 'Faculty'
};

document.addEventListener("DOMContentLoaded", async function(){
  var currentCourse = sessionStorage.getItem("selectedCourse") || "";
  var searchTerm = "";
  var allStudents = {};
  var localGrades = {};

  if (currentUser) {
    var nameEl = document.querySelector(".navbar-user-name");
    var deptEl = document.querySelector(".navbar-user-dept");
    var avatarEl = document.querySelector(".navbar-avatar");
    if (nameEl) nameEl.textContent = currentUser.Full_Name;
    if (deptEl) deptEl.textContent = currentUser.Dept_ID;
    if (avatarEl) avatarEl.textContent = currentUser.Full_Name.charAt(0);
  }

  function getGradeLetter(total) {
    if(total >= 90) return {l:'S', c:'#22c55e'};
    if(total >= 80) return {l:'A', c:'#3b82f6'};
    if(total >= 70) return {l:'B', c:'#8b5cf6'};
    if(total >= 60) return {l:'C', c:'#eab308'};
    if(total >= 50) return {l:'D', c:'#f97316'};
    return {l:'F', c:'#ef4444'};
  }

  function deepCopy(obj){ return JSON.parse(JSON.stringify(obj)); }

  function initLocalGrades(courseId){
    localGrades[courseId] = localGrades[courseId] || deepCopy(allStudents[courseId] || []);
  }

  try {
      const [regRes, userRes] = await Promise.all([
          fetch(`${API_BASE}/registrations`, { headers: API_HEADERS }),
          fetch(`${API_BASE}/users`, { headers: API_HEADERS })
      ]);
      
      let registrations = [];
      let usersMap = {};

      if (regRes.ok) registrations = await regRes.json();
      if (userRes.ok) {
          const users = await userRes.json();
          users.forEach(u => usersMap[u.userId] = u);
      }

      registrations.forEach(r => {
          if (r.status !== 'Enrolled') return;
          if (!allStudents[r.courseId]) allStudents[r.courseId] = [];
          const u = usersMap[r.studentId] || {};
          allStudents[r.courseId].push({
              enrollmentId: r.enrollmentId,
              roll: r.studentId,
              name: u.fullName || r.studentId,
              mid: 0,
              fin: 0,
              finalGrade: r.finalGrade
          });
      });
  } catch (err) {
      console.error(err);
      showToast('Failed to load grades data.', 'error');
  }

  var courseSelect = document.getElementById("grCourseSelect");
  if (!currentCourse && courseSelect.options.length > 0) {
      currentCourse = courseSelect.options[0].value;
  } else {
      courseSelect.value = currentCourse;
  }
  initLocalGrades(currentCourse);

  function getFiltered(){
    var all = localGrades[currentCourse] || [];
    if(!searchTerm) return all;
    return all.filter(function(r){
      return r.name.toLowerCase().includes(searchTerm) || r.roll.toLowerCase().includes(searchTerm);
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
      var gl    = r.finalGrade ? {l: r.finalGrade, c: getGradeLetter(total).c} : getGradeLetter(total);
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

        if(isNaN(val) || val < 0 || val > 100){
          cell.classList.add("has-error");
          return;
        }
        cell.classList.remove("has-error");

        var rec = (localGrades[currentCourse]||[]).find(function(r){ return r.roll===roll; });
        if(rec){ rec[type] = val; }

        var r2 = (localGrades[currentCourse]||[]).find(function(r){ return r.roll===roll; });
        if(r2){
          var tot = calcTotal(r2.mid, r2.fin);
          var gl  = getGradeLetter(tot);
          var totalEl = document.getElementById("total-"+roll);
          var gradeEl = document.getElementById("grade-"+roll);
          if(totalEl) totalEl.textContent = tot;
          if(gradeEl){ gradeEl.textContent = gl.l; gradeEl.style.background = gl.c; }
        }

        document.getElementById("xlSavedTag").style.display = "none";
      });
    });
  }

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

  document.getElementById("saveDraftBtn").addEventListener("click", function(){
    sessionStorage.setItem("gradesDraft_"+currentCourse, JSON.stringify(localGrades[currentCourse]));
    document.getElementById("xlSavedTag").style.display = "inline";
    showToast("Draft saved successfully!", "success");
  });

  document.getElementById("submitGradesBtn").addEventListener("click", async function(){
    if(!validateAll()) return;
    
    // Submit to backend
    let successCount = 0;
    const students = localGrades[currentCourse] || [];
    
    for (let r of students) {
        var tot = calcTotal(r.mid, r.fin);
        var gl = getGradeLetter(tot).l;
        try {
            const res = await fetch(`${API_BASE}/registrations/${r.enrollmentId}/grade`, {
                method: 'PATCH',
                headers: API_HEADERS,
                body: JSON.stringify({ finalGrade: gl })
            });
            if (res.ok) {
                successCount++;
                r.finalGrade = gl;
            }
        } catch (e) {
            console.error(e);
        }
    }
    
    if (successCount === students.length) {
        showToast("All grades submitted successfully!", "success");
        document.getElementById("xlSavedTag").style.display = "inline";
    } else {
        showToast(`Submitted ${successCount}/${students.length} grades. Some failed.`, "error");
    }
  });

  document.getElementById("exportXlBtn").addEventListener("click", function(){
    var list = localGrades[currentCourse] || [];
    var rows = [["Roll Number","Student Name","Midterm","Final","Total","Grade"]];
    list.forEach(function(r){
      var tot = calcTotal(r.mid, r.fin);
      var gl  = getGradeLetter(tot);
      rows.push([r.roll, r.name, r.mid, r.fin, tot, gl.l]);
    });
    var csv = rows.map(function(r){ return r.join(","); }).join("\\n");
    var blob = new Blob([csv], {type:"text/csv"});
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = currentCourse+"_grades.csv";
    a.click();
    showToast("Grades exported as Excel-compatible CSV!", "success");
  });

  courseSelect.addEventListener("change", function(){
    currentCourse = this.value;
    sessionStorage.setItem("selectedCourse", currentCourse);
    initLocalGrades(currentCourse);
    searchTerm = "";
    document.getElementById("grStudentSearch").value = "";
    document.getElementById("xlSavedTag").style.display = "none";
    render();
  });

  document.getElementById("grSemSelect").addEventListener("change", function(){
    document.getElementById("xlSheetSem").textContent = this.value;
  });

  document.getElementById("grStudentSearch").addEventListener("input", function(){
    searchTerm = this.value.trim().toLowerCase();
    render();
  });

  function showToast(msg, type){
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.className = "toast "+(type||"");
    t.classList.add("show");
    setTimeout(function(){ t.classList.remove("show"); }, 3000);
  }

  render();
});