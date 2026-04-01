(function(){
  function readTable(name) {
    try {
      var stored = localStorage.getItem('Lumina_' + name);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}

    if (typeof mockDatabase !== 'undefined' && mockDatabase[name]) {
      return mockDatabase[name];
    }

    return [];
  }

  function unique(list) {
    return Array.from(new Set(list));
  }

  function initials(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(function(part){
      return part.charAt(0).toUpperCase();
    }).join('');
  }

  function colorFromId(id) {
    var palette = ['#2563eb', '#db2777', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#0f766e'];
    var total = 0;
    for (var i = 0; i < id.length; i++) total += id.charCodeAt(i);
    return palette[total % palette.length];
  }

  function sortByTime(a, b) {
    return a.Start_Time.localeCompare(b.Start_Time);
  }

  function uniqueBy(list, keyFn) {
    var seen = {};
    return list.filter(function(item) {
      var key = keyFn(item);
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function semesterLabel(num) {
    return 'SEMESTER ' + num;
  }

  function yearLabel(sem) {
    return 'Year ' + Math.max(1, Math.ceil(sem / 2));
  }

  function formatTime24to12(time) {
    var parts = time.split(':');
    var hour = parseInt(parts[0], 10);
    var minute = parts[1];
    var ampm = hour >= 12 ? 'PM' : 'AM';
    var normalized = hour % 12;
    if (normalized === 0) normalized = 12;
    return {
      display: String(normalized).padStart(2, '0') + ':' + minute,
      ampm: ampm
    };
  }

  function endLabel(time) {
    var parts = time.split(':');
    var hour = parseInt(parts[0], 10);
    var minute = parseInt(parts[1], 10);
    hour += 1;
    var ampm = hour >= 12 ? 'PM' : 'AM';
    var normalized = hour % 12;
    if (normalized === 0) normalized = 12;
    return String(normalized).padStart(2, '0') + ':' + String(minute).padStart(2, '0') + ' ' + ampm + ' End';
  }

  function buildData() {
    var sessionData = JSON.parse(localStorage.getItem('Lumina_Session') || '{}');
    var facultyId = sessionData.User_ID || 'F2024001';
    var departments = readTable('Department');
    var users = readTable('Users');
    var studentsMeta = readTable('Students');
    var courseCatalog = readTable('Course_Catalog');
    var degreeRequirements = readTable('Degree_Requirements');
    var sections = readTable('Section');
    var sectionSlots = readTable('Course_Slot');
    var enrollments = readTable('Registration');
    var facultyUser = users.find(function(user){ return user.User_ID === facultyId; }) || {};

    var deptMap = {};
    departments.forEach(function(d){ deptMap[d.Dept_ID] = d; });

    var userMap = {};
    users.forEach(function(u){ userMap[u.User_ID] = u; });

    var studentMetaMap = {};
    studentsMeta.forEach(function(s){ studentMetaMap[s.Student_ID] = s; });

    var courseMap = {};
    courseCatalog.forEach(function(c){ courseMap[c.Course_ID] = c; });

    var semesterMap = {};
    degreeRequirements.forEach(function(r){
      if (!semesterMap[r.Course_ID]) semesterMap[r.Course_ID] = r.Target_Semester;
    });

    var sectionMap = {};
    sections.forEach(function(s){ sectionMap[s.Section_ID] = s; });

    var facultySlots = sectionSlots.filter(function(slot){
      return slot.Faculty_ID === facultyId;
    });

    var facultySections = uniqueBy(facultySlots.map(function(slot) {
      var section = sectionMap[slot.Section_ID];
      if (!section) return null;
      return {
        sectionId: section.Section_ID,
        courseId: section.Course_ID,
        termId: section.Term_ID,
        slot: slot
      };
    }).filter(Boolean), function(item) {
      return item.sectionId;
    });

    var facultyCourseIds = unique(facultySections.map(function(item) {
      return item.courseId;
    }).filter(Boolean));

    var studentsByCourse = {};
    facultyCourseIds.forEach(function(courseId){
      var relatedSections = facultySections.filter(function(item) {
        return item.courseId === courseId;
      });

      var relatedSectionIds = relatedSections.map(function(item) {
        return item.sectionId;
      });

      var relatedTermIds = unique(relatedSections.map(function(item) {
        return item.termId;
      }).filter(Boolean));

      studentsByCourse[courseId] = enrollments.filter(function(enrollment){
        return enrollment.Status === 'Enrolled'
          && relatedSectionIds.indexOf(enrollment.Section_ID) !== -1
          && (!relatedTermIds.length || relatedTermIds.indexOf(enrollment.Term_ID) !== -1);
      }).map(function(enrollment){
        var user = userMap[enrollment.Student_ID] || {};
        var meta = studentMetaMap[enrollment.Student_ID] || {};
        return {
          roll: enrollment.Student_ID,
          name: user.Full_Name || enrollment.Student_ID,
          init: initials(user.Full_Name || enrollment.Student_ID),
          color: colorFromId(enrollment.Student_ID),
          email: user.Email || '',
          prog: user.Dept_ID || 'CSE',
          semester: meta.Current_Semester || semesterMap[courseId] || 1,
          year: yearLabel(meta.Current_Semester || semesterMap[courseId] || 1)
        };
      });
    });

    var courses = facultyCourseIds.map(function(courseId){
      var course = courseMap[courseId] || {};
      var sem = semesterMap[courseId] || (studentsByCourse[courseId][0] ? studentsByCourse[courseId][0].semester : 1);
      var relatedSection = facultySections.find(function(item) {
        return item.courseId === courseId;
      }) || {};
      return {
        id: courseId,
        name: course.Course_Name || courseId,
        sectionId: relatedSection.sectionId || '',
        year: yearLabel(sem),
        credits: Number(course.Credits || 0),
        students: (studentsByCourse[courseId] || []).length,
        semester: semesterLabel(sem),
        status: String(course.Status || 'Active').toLowerCase()
      };
    });

    var facultyDept = deptMap[facultyUser.Dept_ID] || {};
    var facultyProfile = {
      id: facultyId,
      name: facultyUser.Full_Name || 'Dr. Arun P V',
      shortName: (facultyUser.Full_Name || 'Dr. Arun P V').replace(/^Dr\.\s*/i, ''),
      displayName: 'Prof. ' + ((facultyUser.Full_Name || 'Arun P V').replace(/^Dr\.\s*/i, '')),
      deptName: facultyDept.Dept_Name || facultyUser.Dept_ID || 'Computer Science and Engineering',
      avatar: initials((facultyUser.Full_Name || 'Arun P V').replace(/^Dr\.\s*/i, ''))
    };

    var dayOrder = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
    var todaysClasses = facultySlots.slice().sort(function(a, b){
      return (dayOrder[a.Day_of_Week] || 99) - (dayOrder[b.Day_of_Week] || 99) || sortByTime(a, b);
    }).slice(0, 3).map(function(slot, index){
      var courseId = sectionMap[slot.Section_ID] ? sectionMap[slot.Section_ID].Course_ID : '';
      var course = courseMap[courseId] || {};
      var time = formatTime24to12(slot.Start_Time || '09:00');
      return {
        time: time.display,
        ampm: time.ampm,
        course: courseId + ' - ' + (course.Course_Name || 'Course'),
        room: 'Room ' + (slot.Room_Number || 'TBA'),
        end: endLabel(slot.End_Time || slot.Start_Time || '10:00'),
        status: index === 0 ? 'upcoming' : index === 1 ? 'pending' : 'upcoming'
      };
    });

    var alerts = facultyCourseIds.slice(0, 3).map(function(courseId, index){
      var course = courseMap[courseId] || {};
      return {
        text: index === 0 ? 'Enrollment open for ' + courseId : index === 1 ? 'Syllabus updated for ' + courseId : 'New activity in ' + courseId,
        time: index === 0 ? '2 hours ago' : index === 1 ? 'Today, 09:15 AM' : 'Yesterday',
        dot: index === 2 ? 'dot-yellow' : 'dot-green'
      };
    });

    var materials = {};
    facultyCourseIds.forEach(function(courseId){
      var slot = facultySlots.find(function(item){
        return sectionMap[item.Section_ID] && sectionMap[item.Section_ID].Course_ID === courseId;
      });
      var topic = slot && slot.Syllabus ? slot.Syllabus : 'Course Overview';
      materials[courseId] = [
        'Syllabus',
        topic + ' Notes',
        topic + ' Slides',
        'Assignment 1',
        'Reference Reading'
      ];
    });

    var announcements = facultyCourseIds.slice(0, 4).map(function(courseId, index){
      var course = courseMap[courseId] || {};
      return {
        id: index + 1,
        courseId: courseId,
        courseLabel: courseId + ' - ' + String(course.Course_Name || '').toUpperCase(),
        title: index === 0 ? 'Course Schedule Update' : index === 1 ? 'Assessment Reminder' : index === 2 ? 'Lab Instructions' : 'Class Notice',
        msg: 'Please review the latest update for ' + (course.Course_Name || courseId) + '. Details have been shared for the upcoming class activities and submissions.',
        ago: index === 0 ? '2 hours ago' : index === 1 ? '5 hours ago' : index === 2 ? 'Yesterday' : '3 days ago'
      };
    });

    var grades = {};
    facultyCourseIds.forEach(function(courseId){
      grades[courseId] = (studentsByCourse[courseId] || []).map(function(student, index){
        var seed = index + student.roll.length;
        var mid = 58 + (seed * 7) % 35;
        var fin = 62 + (seed * 9) % 33;
        return {
          roll: student.roll,
          name: student.name,
          mid: Math.min(mid, 98),
          fin: Math.min(fin, 99)
        };
      });
    });

    return {
      facultyProfile: facultyProfile,
      courses: courses,
      todaysClasses: todaysClasses,
      alerts: alerts,
      students: studentsByCourse,
      grades: grades,
      materials: materials,
      announcements: announcements,
      gradeLetter: function(total){
        if(total >= 90) return { l: 'O', c: '#1d4ed8' };
        if(total >= 80) return { l: 'A', c: '#15803d' };
        if(total >= 70) return { l: 'B', c: '#92400e' };
        if(total >= 60) return { l: 'C', c: '#b45309' };
        return { l: 'F', c: '#b91c1c' };
      }
    };
  }

  window.LuminaData = buildData();
})();
