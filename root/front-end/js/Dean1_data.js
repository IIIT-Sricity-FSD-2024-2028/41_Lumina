/**
 * Lumina shared data compatibility layer.
 * Reads the Review 3 Lumina_* localStorage tables and maps them to the
 * Dean1 page-friendly structure used across the existing UI scripts.
 */

const ROOM_CAPACITY = 100;
const ROOM_MASTER = [
  'G01', 'G02', 'G03', 'G04', 'G05', 'G06', 'G07', 'G08', 'G09', 'G10',
  'B01', 'B02', 'B03', 'B04', 'B05', 'B06'
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readTable(tableName, fallback = []) {
  try {
    const raw = localStorage.getItem(`Lumina_${tableName}`);
    return raw ? JSON.parse(raw) : clone(fallback);
  } catch (error) {
    console.warn(`Lumina: failed to parse table ${tableName}.`, error);
    return clone(fallback);
  }
}

function writeTable(tableName, rows) {
  localStorage.setItem(`Lumina_${tableName}`, JSON.stringify(rows));
}

function getMockDatabaseFallback() {
  if (typeof mockDatabase === 'object' && mockDatabase) {
    return mockDatabase;
  }
  return {
    Department: [],
    Users: [],
    Students: [],
    Course_Catalog: [],
    Degree_Requirements: [],
    Course_Prerequisite: [],
    Academic_Term: [],
    Section: [],
    Course_Slot: [],
    Registration: [],
    Override_Request: [],
    Academic_Roadmap: []
  };
}

function loadSeedTables() {
  const fallback = getMockDatabaseFallback();
  return {
    departments: readTable('Department', fallback.Department || []),
    users: readTable('Users', fallback.Users || []),
    students: readTable('Students', fallback.Students || []),
    courses: readTable('Course_Catalog', fallback.Course_Catalog || []),
    requirements: readTable('Degree_Requirements', fallback.Degree_Requirements || []),
    prerequisites: readTable('Course_Prerequisite', fallback.Course_Prerequisite || []),
    terms: readTable('Academic_Term', fallback.Academic_Term || []),
    sections: readTable('Section', fallback.Section || []),
    slots: readTable('Course_Slot', fallback.Course_Slot || []),
    registrations: readTable('Registration', fallback.Registration || []),
    overrides: readTable('Override_Request', fallback.Override_Request || []),
    roadmap: readTable('Academic_Roadmap', fallback.Academic_Roadmap || [])
  };
}

function getLevelFromCourseId(courseId = '') {
  const match = String(courseId).match(/(\d)/);
  return match ? Number(match[1]) : 1;
}

function getUgYearFromTargetSemester(targetSemester, courseId) {
  if (Number.isFinite(Number(targetSemester)) && Number(targetSemester) > 0) {
    return `UG${Math.ceil(Number(targetSemester) / 2)}`;
  }
  return `UG${Math.min(Math.max(getLevelFromCourseId(courseId), 1), 4)}`;
}

function getSemesterLabel(targetSemester) {
  if (!Number.isFinite(Number(targetSemester)) || Number(targetSemester) <= 0) {
    return 'Monsoon';
  }
  return Number(targetSemester) % 2 === 0 ? 'Spring' : 'Monsoon';
}

function getDefaultSections(courseId, ugYear, type) {
  if (type === 'Seed Course') {
    if (ugYear === 'UG1') return 4;
    if (ugYear === 'UG2') return 3;
    return 2;
  }
  const level = getLevelFromCourseId(courseId);
  if (level <= 1) return 4;
  if (level === 2) return 3;
  return 2;
}

function normalizeCourseType(rawType, courseId) {
  if (rawType === 'SEED' || rawType === 'Seed Course' || /^SE/i.test(courseId)) return 'Seed Course';
  if (rawType === 'Institute Core') return 'Institute Core';
  if (rawType === 'Program Core') return 'Program Core';
  if (rawType === 'Elective') return 'Elective';
  return /^SE/i.test(courseId) ? 'Seed Course' : 'Program Core';
}

function getCourseDeptDisplay(courseRow, courseType) {
  if (courseType === 'Seed Course') return 'All Departments (CSE, ECE, AIDS)';
  if (courseType === 'Institute Core') return '-';
  return courseRow.Dept_ID || '-';
}

function buildCourseRequirementMap(requirements) {
  const map = new Map();
  requirements.forEach((requirement) => {
    if (!map.has(requirement.Course_ID)) {
      map.set(requirement.Course_ID, requirement);
    }
  });
  return map;
}

function buildAppCourses(tableData) {
  const requirementMap = buildCourseRequirementMap(tableData.requirements);
  return tableData.courses.map((courseRow) => {
    const requirement = requirementMap.get(courseRow.Course_ID);
    const type = normalizeCourseType(requirement?.Course_Type, courseRow.Course_ID);
    const ugYear = getUgYearFromTargetSemester(requirement?.Target_Semester, courseRow.Course_ID);
    const semester = getSemesterLabel(requirement?.Target_Semester);
    const sections = tableData.sections.filter((section) => section.Course_ID === courseRow.Course_ID).length
      || getDefaultSections(courseRow.Course_ID, ugYear, type);

    return {
      code: courseRow.Course_ID,
      name: courseRow.Course_Name,
      dept: getCourseDeptDisplay(courseRow, type),
      credits: Number(courseRow.Credits),
      type,
      prerequisites: tableData.prerequisites
        .filter((row) => row.Target_Course_ID === courseRow.Course_ID)
        .map((row) => row.Required_Course_ID),
      ugYear,
      semester,
      status: courseRow.Status,
      sections
    };
  });
}

function buildFaculty(tableData, appCourses) {
  const facultyUsers = tableData.users.filter((user) => user.Role === 'Faculty');
  return facultyUsers.map((user) => {
    const assignedCourseIds = Array.from(new Set(
      tableData.slots
        .filter((slot) => slot.Faculty_ID === user.User_ID)
        .map((slot) => {
          const section = tableData.sections.find((row) => row.Section_ID === slot.Section_ID);
          return section ? section.Course_ID : null;
        })
        .filter(Boolean)
    ));

    return {
      id: user.User_ID,
      name: user.Full_Name,
      dept: user.Dept_ID,
      courses: assignedCourseIds.length
        ? assignedCourseIds
        : appCourses.filter((course) => course.dept === user.Dept_ID || course.type === 'Institute Core' || course.type === 'Seed Course').slice(0, 3).map((course) => course.code)
    };
  });
}

function buildStudentRecords(tableData, appCourses) {
  return tableData.registrations
    .filter((registration) => registration.Term_ID === 'MONSOON2026')
    .map((registration) => {
    const user = tableData.users.find((row) => row.User_ID === registration.Student_ID);
    const student = tableData.students.find((row) => row.Student_ID === registration.Student_ID);
    const course = appCourses.find((row) => row.code === registration.Course_ID);
    const section = tableData.sections.find((row) => row.Section_ID === registration.Section_ID);
    const currentSemester = Number(student?.Current_Semester || 1);

    return {
      id: registration.Student_ID,
      name: user?.Full_Name || registration.Student_ID,
      program: user?.Dept_ID || course?.dept || 'CSE',
      ugYear: `UG${Math.max(1, Math.min(4, Math.ceil(currentSemester / 2)))}`,
      course: registration.Course_ID,
      section: section ? section.Section_Name.replace(/^S/, 'Section ') : 'Unassigned',
      status: registration.Status
    };
  });
}

function buildTimetable(tableData, facultyUsers) {
  return tableData.slots
    .filter((slot) => {
      const section = tableData.sections.find((row) => row.Section_ID === slot.Section_ID);
      return section?.Term_ID === 'MONSOON2026';
    })
    .map((slot) => {
    const section = tableData.sections.find((row) => row.Section_ID === slot.Section_ID);
    const faculty = facultyUsers.find((row) => row.User_ID === slot.Faculty_ID);
    return {
      id: slot.Slot_ID,
      day: slot.Day_of_Week,
      timeSlot: `${slot.Start_Time}-${slot.End_Time}`,
      courseCode: section?.Course_ID || '',
      room: slot.Room_Number,
      professor: faculty?.Full_Name || '',
      section: section ? section.Section_Name.replace(/^S/, '') : '1'
    };
  });
}

function buildRooms(tableData) {
  const slotRooms = tableData.slots.map((slot) => slot.Room_Number);
  const allRooms = Array.from(new Set([...ROOM_MASTER, ...slotRooms])).sort();
  return allRooms.map((roomName) => ({ name: roomName, capacity: ROOM_CAPACITY }));
}

function buildCurrentUser(tableData) {
  const deanUser = tableData.users.find((user) => user.Role === 'Assistant_Dean_1');
  return deanUser
    ? {
        id: deanUser.User_ID,
        name: 'Dean1',
        role: 'assistant_dean_1',
        avatar: 'D1'
      }
    : {
        id: 'dean1',
        name: 'Dean1',
        role: 'assistant_dean_1',
        avatar: 'D1'
      };
}

function buildRecentActivities(tableData) {
  const pendingOverrides = tableData.overrides.filter((row) => row.Approval_Status === 'Pending').length;
  return [
    { icon: 'slot', title: 'Course Slots Loaded', detail: `${tableData.slots.length} active timetable slots available`, time: 'Just now' },
    { icon: 'course', title: 'Course Catalog Ready', detail: `${tableData.courses.length} courses loaded from mock database`, time: 'Just now' },
    { icon: 'success', title: 'Enrollment Synced', detail: `${tableData.registrations.length} registrations mapped for section allocation`, time: 'Just now' },
    { icon: 'course', title: 'Override Requests Available', detail: `${pendingOverrides} pending override requests in storage`, time: 'Just now' }
  ];
}

function loadData() {
  const tableData = loadSeedTables();
  const appCourses = buildAppCourses(tableData);
  const facultyUsers = tableData.users.filter((user) => user.Role === 'Faculty');

  return {
    students: buildStudentRecords(tableData, appCourses),
    currentUser: buildCurrentUser(tableData),
    courses: appCourses,
    rooms: buildRooms(tableData),
    timetable: buildTimetable(tableData, facultyUsers),
    faculty: buildFaculty(tableData, appCourses),
    recentActivities: buildRecentActivities(tableData),
    departments: tableData.departments.map((department) => department.Dept_ID)
  };
}

function syncCourseCatalog(appData, tableData) {
  const courseRows = appData.courses.map((course) => ({
    Course_ID: course.code,
    Course_Name: course.name,
    Credits: Number(course.credits),
    Course_Capacity: course.type === 'Seed Course' ? 120 : 60,
    Status: course.status,
    Dept_ID: course.type === 'Program Core' ? course.dept : (course.type === 'Elective' ? course.dept.split(',')[0].trim() : 'CSE')
  }));

  const requirementRows = appData.courses.map((course, index) => {
    const ug = Number(String(course.ugYear).replace('UG', '')) || 1;
    const targetSemester = course.semester === 'Spring' ? (ug * 2) : (ug * 2 - 1);
    return {
      Requirement_ID: index + 1,
      Dept_ID: course.type === 'Program Core' ? course.dept : 'CSE',
      Course_ID: course.code,
      Course_Type: course.type === 'Seed Course' ? 'SEED' : course.type,
      Target_Semester: targetSemester
    };
  });

  const prerequisiteRows = [];
  appData.courses.forEach((course) => {
    (course.prerequisites || []).forEach((prereq) => {
      if (prereq && prereq !== '-') {
        prerequisiteRows.push({
          Target_Course_ID: course.code,
          Required_Course_ID: prereq
        });
      }
    });
  });

  writeTable('Course_Catalog', courseRows);
  writeTable('Degree_Requirements', requirementRows);
  writeTable('Course_Prerequisite', prerequisiteRows);
}

function syncRegistrationsAndSections(appData, tableData) {
  const termBySemester = {
    Monsoon: tableData.terms.find((term) => term.Term_Name.toUpperCase().includes('MONSOON'))?.Term_ID || 'MONSOON2026',
    Spring: tableData.terms.find((term) => term.Term_Name.toUpperCase().includes('SPRING'))?.Term_ID || 'SPRING2027'
  };

  const sectionRows = [];
  const sectionIdMap = new Map();
  appData.courses.forEach((course) => {
    const termId = termBySemester[course.semester] || 'MONSOON2026';
    for (let i = 1; i <= Number(course.sections || 1); i += 1) {
      const sectionId = `${course.code}-S${i}`;
      sectionRows.push({
        Section_ID: sectionId,
        Section_Name: `S${i}`,
        Course_ID: course.code,
        Term_ID: termId
      });
      sectionIdMap.set(`${course.code}|Section ${i}|${termId}`, sectionId);
    }
  });

  const registrationRows = appData.students.map((student, index) => {
    const course = appData.courses.find((row) => row.code === student.course);
    const termId = termBySemester[course?.semester || 'Monsoon'] || 'MONSOON2026';
    const sectionId = student.section && student.section !== 'Unassigned'
      ? (sectionIdMap.get(`${student.course}|${student.section}|${termId}`) || `${student.course}-S1`)
      : null;

    return {
      Enrollment_ID: index + 1,
      Student_ID: student.id,
      Course_ID: student.course,
      Term_ID: termId,
      Section_ID: sectionId,
      Status: student.section && student.section !== 'Unassigned' ? 'Enrolled' : 'Waitlisted',
      Final_Grade: null
    };
  });

  writeTable('Section', sectionRows);
  writeTable('Registration', registrationRows);
}

function syncCourseSlots(appData) {
  const slotRows = appData.timetable.map((slot, index) => ({
    Slot_ID: slot.id || (index + 1),
    Section_ID: `${slot.courseCode}-S${String(slot.section).replace('Section ', '')}`,
    Faculty_ID: appData.faculty.find((faculty) => faculty.name === slot.professor)?.id || 'F2024001',
    Room_Number: slot.room,
    Day_of_Week: slot.day,
    Start_Time: slot.timeSlot.split('-')[0],
    End_Time: slot.timeSlot.split('-')[1],
    Syllabus: 'Updated from Dean1 timetable allocation.'
  }));
  writeTable('Course_Slot', slotRows);
}

function saveData(appData) {
  const tableData = loadSeedTables();
  syncCourseCatalog(appData, tableData);
  syncRegistrationsAndSections(appData, tableData);
  syncCourseSlots(appData);
}

function resetData() {
  if (typeof resetLuminaDB === 'function') {
    resetLuminaDB();
    return loadData();
  }
  return loadData();
}
