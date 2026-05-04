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

var _dean1ApiCache = {};

async function fetchDean1Data() {
  const sessionData = JSON.parse(localStorage.getItem('Lumina_Session') || '{}');
  const role = sessionData.Role || 'Assistant_Dean_1';
  const headers = { 'x-role': role };
  try {
    const [coursesRes, usersRes, regsRes, sectionsRes, slotsRes, overridesRes, degreeReqRes, prereqRes] = await Promise.all([
      fetch('http://localhost:3000/courses', { headers }),
      fetch('http://localhost:3000/users', { headers }),
      fetch('http://localhost:3000/registrations', { headers }),
      fetch('http://localhost:3000/sections', { headers }),
      fetch('http://localhost:3000/course-slots', { headers }),
      fetch('http://localhost:3000/overrides', { headers }).catch(() => null),
      fetch('http://localhost:3000/degree-requirements', { headers }).catch(() => null),
      fetch('http://localhost:3000/courses/prerequisites', { headers }).catch(() => null)
    ]);
    if (coursesRes.ok) {
      const courses = await coursesRes.json();
      _dean1ApiCache['Course_Catalog'] = courses.map(c => ({
        Course_ID: c.courseId, Course_Name: c.courseName, Credits: c.credits,
        Course_Capacity: c.courseCapacity, Status: c.status, Dept_ID: c.deptId
      }));
    }
    if (usersRes.ok) {
      const users = await usersRes.json();
      _dean1ApiCache['Users'] = users.map(u => ({
        User_ID: u.userId, Full_Name: u.fullName, Email: u.email, Role: u.role, Dept_ID: u.deptId
      }));
    }
    if (regsRes.ok) {
      const regs = await regsRes.json();
      _dean1ApiCache['Registration'] = regs.map(r => ({
        Enrollment_ID: r.enrollmentId, Student_ID: r.studentId, Course_ID: r.courseId,
        Term_ID: r.termId, Section_ID: r.sectionId, Status: r.status, Final_Grade: r.finalGrade
      }));
    }
    if (sectionsRes && sectionsRes.ok) {
      const sections = await sectionsRes.json();
      _dean1ApiCache['Section'] = sections.map(s => ({
        Section_ID: s.sectionId, Section_Name: s.sectionName, Course_ID: s.courseId, Term_ID: s.termId
      }));
    }
    if (slotsRes && slotsRes.ok) {
      const slots = await slotsRes.json();
      _dean1ApiCache['Course_Slot'] = slots.map(s => ({
        Slot_ID: s.slotId, Section_ID: s.sectionId, Faculty_ID: s.facultyId,
        Room_Number: s.roomNumber, Day_of_Week: s.dayOfWeek,
        Start_Time: s.startTime, End_Time: s.endTime, Syllabus: s.syllabus
      }));
    }
    if (overridesRes && overridesRes.ok) {
      const overrides = await overridesRes.json();
      _dean1ApiCache['Override_Request'] = overrides.map(o => ({
        Request_ID: o.requestId, Student_ID: o.studentId, Course_ID: o.courseId,
        Reason: o.reason, Approval_Status: o.approvalStatus, Created_At: o.createdAt
      }));
    }
    if (degreeReqRes && degreeReqRes.ok) {
      const degreeReqs = await degreeReqRes.json();
      _dean1ApiCache['Degree_Requirements'] = degreeReqs.map(dr => ({
        Requirement_ID: dr.requirementId, Dept_ID: dr.deptId, Course_ID: dr.courseId,
        Course_Type: dr.courseType === 'SEED' ? 'Seed Course' : dr.courseType,
        Target_Semester: dr.targetSemester
      }));
    }
    if (prereqRes && prereqRes.ok) {
      const prereqs = await prereqRes.json();
      _dean1ApiCache['Course_Prerequisite'] = prereqs.map(p => ({
        Target_Course_ID: p.targetCourseId, Required_Course_ID: p.requiredCourseId
      }));
    }
  } catch (e) {
    console.error('Dean1 data fetch error:', e);
  }
  ['Department', 'Students', 'Degree_Requirements', 'Course_Prerequisite',
    'Academic_Term', 'Section', 'Course_Slot', 'Override_Request', 'Academic_Roadmap'].forEach(t => {
      if (!_dean1ApiCache[t]) _dean1ApiCache[t] = [];
    });
}

function readTable(tableName, fallback = []) {
  return _dean1ApiCache[tableName] || clone(fallback);
}

function writeTable(tableName, rows) {
  _dean1ApiCache[tableName] = rows;
}

function getMockDatabaseFallback() {
  // No longer uses mockDatabase - all data from API
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

function getSemesterFromSections(courseId, sections) {
  const section = sections.find((row) => row.Course_ID === courseId && row.Term_ID);
  if (!section) return '';

  const termId = String(section.Term_ID).toUpperCase();
  if (termId.includes('SPRING')) return 'Spring';
  if (termId.includes('MONSOON')) return 'Monsoon';
  return '';
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
  // First honour explicitly provided type
  if (rawType === 'SEED' || rawType === 'Seed Course') return 'Seed Course';
  if (rawType === 'Institute Core') return 'Institute Core';
  if (rawType === 'Program Core') return 'Program Core';
  if (rawType === 'Elective') return 'Elective';

  // Fallback: infer from course ID prefix
  const id = String(courseId || '').toUpperCase();
  if (/^SEED/.test(id)) return 'Seed Course';
  if (/^IC/.test(id))   return 'Institute Core';
  if (/^PE|^IE/.test(id)) return 'Elective';
  if (/^PC/.test(id))   return 'Program Core';
  return 'Program Core';
}

function getCourseDeptDisplay(courseRow, courseType) {
  if (courseType === 'Seed Course') return 'All Departments (CSE, ECE, AIDS)';
  if (courseType === 'Institute Core') return '-';
  return courseRow.Dept_ID || '-';
}

// Static degree requirements derived from backend seed data
// Used as fallback when the API does not expose a /degree-requirements endpoint.
const STATIC_DEGREE_REQUIREMENTS = [
  { Course_ID: 'IC101',  Course_Type: 'Institute Core', Target_Semester: 1 },
  { Course_ID: 'IC102',  Course_Type: 'Institute Core', Target_Semester: 1 },
  { Course_ID: 'IC103',  Course_Type: 'Institute Core', Target_Semester: 1 },
  { Course_ID: 'IC104',  Course_Type: 'Institute Core', Target_Semester: 1 },
  { Course_ID: 'SEED01', Course_Type: 'Seed Course',    Target_Semester: 1 },
  { Course_ID: 'SEED02', Course_Type: 'Seed Course',    Target_Semester: 1 },
  { Course_ID: 'IC201',  Course_Type: 'Institute Core', Target_Semester: 2 },
  { Course_ID: 'PC201',  Course_Type: 'Program Core',   Target_Semester: 2 },
  { Course_ID: 'IC202',  Course_Type: 'Institute Core', Target_Semester: 2 },
  { Course_ID: 'IC203',  Course_Type: 'Institute Core', Target_Semester: 2 },
  { Course_ID: 'SEED03', Course_Type: 'Seed Course',    Target_Semester: 2 },
  { Course_ID: 'IC301',  Course_Type: 'Institute Core', Target_Semester: 3 },
  { Course_ID: 'PC301',  Course_Type: 'Program Core',   Target_Semester: 3 },
  { Course_ID: 'PC302',  Course_Type: 'Program Core',   Target_Semester: 3 },
  { Course_ID: 'PC303',  Course_Type: 'Program Core',   Target_Semester: 3 },
  { Course_ID: 'PC304',  Course_Type: 'Program Core',   Target_Semester: 3 },
  { Course_ID: 'SEED04', Course_Type: 'Seed Course',    Target_Semester: 3 },
  { Course_ID: 'PC401',  Course_Type: 'Program Core',   Target_Semester: 4 },
  { Course_ID: 'PC402',  Course_Type: 'Program Core',   Target_Semester: 4 },
  { Course_ID: 'IC401',  Course_Type: 'Institute Core', Target_Semester: 4 },
  { Course_ID: 'PC403',  Course_Type: 'Program Core',   Target_Semester: 4 },
  { Course_ID: 'SEED05', Course_Type: 'Seed Course',    Target_Semester: 4 },
  { Course_ID: 'PC501',  Course_Type: 'Program Core',   Target_Semester: 5 },
  { Course_ID: 'PC601',  Course_Type: 'Program Core',   Target_Semester: 6 },
  { Course_ID: 'PE501',  Course_Type: 'Elective',       Target_Semester: 5 },
  { Course_ID: 'PE502',  Course_Type: 'Elective',       Target_Semester: 5 },
  { Course_ID: 'PE503',  Course_Type: 'Elective',       Target_Semester: 5 },
  { Course_ID: 'PE504',  Course_Type: 'Elective',       Target_Semester: 6 },
  { Course_ID: 'PE505',  Course_Type: 'Elective',       Target_Semester: 6 },
  { Course_ID: 'IE501',  Course_Type: 'Elective',       Target_Semester: 5 },
  { Course_ID: 'IE502',  Course_Type: 'Elective',       Target_Semester: 6 },
];

function buildCourseRequirementMap(requirements) {
  // Merge API requirements with static fallback; API values take precedence
  const merged = [...STATIC_DEGREE_REQUIREMENTS];
  requirements.forEach((req) => {
    const idx = merged.findIndex((r) => r.Course_ID === req.Course_ID);
    if (idx !== -1) merged[idx] = req;
    else merged.push(req);
  });

  const map = new Map();
  merged.forEach((requirement) => {
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
    const semester = requirement
      ? getSemesterLabel(requirement.Target_Semester)
      : (getSemesterFromSections(courseRow.Course_ID, tableData.sections) || getSemesterLabel(requirement?.Target_Semester));
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
    .filter((registration) => registration.Term_ID === 'SPRING2026')
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
      return section?.Term_ID === 'SPRING2026';
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
    { icon: 'slot', title: 'CS101 Slot Allocated', detail: 'Room 204, Mon 10:00 AM', time: '2 mins ago' },
    { icon: 'course', title: 'New Course Added', detail: 'Advanced AI Ethics (ETH402)', time: '45 mins ago' },
    { icon: 'slot', title: 'EC202 Slot Updated', detail: 'Moved to Wed 08:45 AM', time: '1 hour ago' },
    { icon: 'success', title: 'Section Assignment Saved', detail: 'CS301 - 4 sections', time: '3 hours ago' },
    { icon: 'slot', title: 'AD401 Slot Allocated', detail: 'G01, Wed 02:15 PM', time: '5 hours ago' },
    { icon: 'course', title: 'CS102 Course Updated', detail: 'Credits changed to 3', time: '1 day ago' },
    { icon: 'slot', title: 'CS201 Slot Allocated', detail: 'G07, Tue 02:15 PM', time: '1 day ago' },
    { icon: 'course', title: 'New Course Added', detail: 'Signals & Systems (EC301)', time: '2 days ago' },
    { icon: 'success', title: 'Enrollment Synced', detail: `${tableData.registrations.length} registrations mapped`, time: '2 days ago' },
    { icon: 'course', title: 'Override Requests', detail: `${pendingOverrides} pending override requests`, time: '3 days ago' }
  ];
}

async function loadData() {
  await fetchDean1Data();
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
    Monsoon: tableData.terms.find((term) => term.Term_Name.toUpperCase().includes('MONSOON'))?.Term_ID || 'MONSOON2025',
    Spring: tableData.terms.find((term) => term.Term_Name.toUpperCase().includes('SPRING'))?.Term_ID || 'SPRING2026'
  };

  const sectionRows = [];
  const sectionIdMap = new Map();
  appData.courses.forEach((course) => {
    const termId = termBySemester[course.semester] || 'SPRING2026';
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
    const termId = termBySemester[course?.semester || 'Monsoon'] || 'SPRING2026';
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
  // No-op: data is now managed by the NestJS backend
  console.log('saveData: Backend manages persistence via API calls.');
}

function resetData() {
  if (typeof resetLuminaDB === 'function') {
    resetLuminaDB();
    return loadData();
  }
  return loadData();
}
