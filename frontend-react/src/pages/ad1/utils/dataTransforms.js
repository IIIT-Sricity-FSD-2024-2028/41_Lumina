/**
 * Deal1 Data Transforms
 *
 * Pure functions extracted from the legacy Dean1_data.js.
 * They transform raw API responses into the app-level data structures
 * consumed by every Deal1 page.
 */

// ─── Constants ───────────────────────────────────────────────────
export const ROOM_CAPACITY = 100;

export const ROOM_MASTER = [
  'G01', 'G02', 'G03', 'G04', 'G05', 'G06', 'G07', 'G08', 'G09', 'G10',
  'B01', 'B02', 'B03', 'B04', 'B05', 'B06',
];

export const ALL_SLOT_KEYS = [
  '08:45-09:45',
  '09:45-10:45',
  '11:00-12:00',
  '12:00-13:00',
  '14:15-15:15',
  '15:15-16:15',
  '16:30-17:30',
  '17:30-18:30',
];

export const TIME_SLOTS = [
  { key: '08:45-09:45', label: '08:45 AM - 09:45 AM', type: 'slot' },
  { key: '09:45-10:45', label: '09:45 AM - 10:45 AM', type: 'slot' },
  { key: '10:45-11:00', label: '10:45 - 11:00', type: 'short_break' },
  { key: '11:00-12:00', label: '11:00 AM - 12:00 PM', type: 'slot' },
  { key: '12:00-13:00', label: '12:00 PM - 01:00 PM', type: 'slot' },
  { key: '13:00-14:00', label: '01:00 - 02:00', type: 'lunch_break' },
  { key: '14:15-15:15', label: '02:15 PM - 03:15 PM', type: 'slot' },
  { key: '15:15-16:15', label: '03:15 PM - 04:15 PM', type: 'slot' },
  { key: '16:15-16:30', label: '04:15 - 04:30', type: 'short_break' },
  { key: '16:30-17:30', label: '04:30 PM - 05:30 PM', type: 'slot' },
  { key: '17:30-18:30', label: '05:30 PM - 06:30 PM', type: 'slot' },
];

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const MAX_SECTION_CAPACITY = 100;

// ─── Helpers ─────────────────────────────────────────────────────

export function getLevelFromCourseId(courseId = '') {
  const match = String(courseId).match(/(\d)/);
  return match ? Number(match[1]) : 1;
}

export function getUgYearFromTargetSemester(targetSemester, courseId) {
  if (Number.isFinite(Number(targetSemester)) && Number(targetSemester) > 0) {
    return `UG${Math.ceil(Number(targetSemester) / 2)}`;
  }
  return `UG${Math.min(Math.max(getLevelFromCourseId(courseId), 1), 4)}`;
}

export function getSemesterLabel(targetSemester) {
  if (!Number.isFinite(Number(targetSemester)) || Number(targetSemester) <= 0) {
    return 'Monsoon';
  }
  return Number(targetSemester) % 2 === 0 ? 'Spring' : 'Monsoon';
}

export function getSemesterFromSections(courseId, sections) {
  const section = sections.find((row) => row.Course_ID === courseId && row.Term_ID);
  if (!section) return '';
  const termId = String(section.Term_ID).toUpperCase();
  if (termId.includes('SPRING')) return 'Spring';
  if (termId.includes('MONSOON')) return 'Monsoon';
  return '';
}

export function getSemesterFromTerm(term) {
  return term && term.toLowerCase().includes('spring') ? 'Spring' : 'Monsoon';
}

export function getDefaultSections(courseId, ugYear, type) {
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

export function normalizeCourseType(rawType, courseId) {
  if (rawType === 'SEED' || rawType === 'Seed Course') return 'Seed Course';
  if (rawType === 'Institute Core') return 'Institute Core';
  if (rawType === 'Program Core') return 'Program Core';
  if (rawType === 'Elective') return 'Elective';

  const id = String(courseId || '').toUpperCase();
  if (/^SEED/.test(id)) return 'Seed Course';
  if (/^IC/.test(id)) return 'Institute Core';
  if (/^PE|^IE/.test(id)) return 'Elective';
  if (/^PC/.test(id)) return 'Program Core';
  return 'Program Core';
}

export function getCourseDeptDisplay(courseRow, courseType) {
  if (courseType === 'Seed Course') return 'All Departments (CSE, ECE, AIDS)';
  if (courseType === 'Institute Core') return '-';
  return courseRow.Dept_ID || '-';
}

export function normalizeSectionValue(section) {
  if (!section || section === 'Unassigned') return '';
  return section.startsWith('Section') ? section : `Section ${section}`;
}

export function formatSectionLabel(section) {
  const normalized = normalizeSectionValue(section);
  return normalized || 'Unassigned';
}

// ─── Course type badge helpers ───────────────────────────────────

export function getTypeBadgeInfo(type) {
  switch (type) {
    case 'Institute Core':
      return { cls: 'institute', label: 'INSTITUTE CORE' };
    case 'Program Core':
      return { cls: 'program', label: 'PROGRAM CORE' };
    case 'Seed Course':
      return { cls: 'seed', label: 'SEED COURSE' };
    case 'Elective':
    case 'Institute Elective':
    case 'Program Elective':
      return { cls: 'elective', label: type.toUpperCase() };
    default:
      return { cls: 'institute', label: type?.toUpperCase() || 'UNKNOWN' };
  }
}

export function getCardColorClass(courseCode, courses) {
  const course = courses.find((c) => c.code === courseCode);
  if (!course) return 'cardInstitute';
  if (course.type === 'Institute Core') return 'cardInstitute';
  if (course.type === 'Seed Course') return 'cardSeed';
  if (course.type === 'Elective') return 'cardElective';
  if (course.dept === 'CSE') return 'cardCse';
  if (course.dept === 'ECE') return 'cardEce';
  if (course.dept === 'AIDS') return 'cardAids';
  return 'cardInstitute';
}

// ─── Builders ────────────────────────────────────────────────────

function buildCourseRequirementMap(requirements) {
  const map = new Map();
  if (Array.isArray(requirements)) {
    requirements.forEach((requirement) => {
      if (requirement && requirement.Course_ID && !map.has(requirement.Course_ID)) {
        map.set(requirement.Course_ID, requirement);
      }
    });
  }
  return map;
}

/**
 * Transform raw API data into the app-level course list used by all Deal1 pages.
 */
export function buildAppCourses(rawCourses, rawRequirements, rawPrerequisites, rawSections) {
  const requirementMap = buildCourseRequirementMap(rawRequirements);

  return rawCourses.map((courseRow) => {
    const requirement = requirementMap.get(courseRow.Course_ID);
    const type = normalizeCourseType(requirement?.Course_Type, courseRow.Course_ID);
    const ugYear = getUgYearFromTargetSemester(requirement?.Target_Semester, courseRow.Course_ID);
    const semester = requirement
      ? getSemesterLabel(requirement.Target_Semester)
      : getSemesterFromSections(courseRow.Course_ID, rawSections) || getSemesterLabel(requirement?.Target_Semester);
    const sections =
      rawSections.filter((s) => s.Course_ID === courseRow.Course_ID).length ||
      getDefaultSections(courseRow.Course_ID, ugYear, type);

    return {
      code: courseRow.Course_ID,
      name: courseRow.Course_Name,
      dept: getCourseDeptDisplay(courseRow, type),
      credits: Number(courseRow.Credits),
      type,
      prerequisites: rawPrerequisites
        .filter((row) => row.Target_Course_ID === courseRow.Course_ID)
        .map((row) => row.Required_Course_ID),
      ugYear,
      semester,
      status: courseRow.Status,
      sections,
    };
  });
}

export function buildFaculty(rawUsers, rawSlots, rawSections, appCourses) {
  const facultyUsers = rawUsers.filter((user) => user.Role === 'Faculty');
  return facultyUsers.map((user) => {
    const assignedCourseIds = Array.from(
      new Set(
        rawSlots
          .filter((slot) => slot.Faculty_ID === user.User_ID)
          .map((slot) => {
            const section = rawSections.find((row) => row.Section_ID === slot.Section_ID);
            return section ? section.Course_ID : null;
          })
          .filter(Boolean)
      )
    );

    return {
      id: user.User_ID,
      name: user.Full_Name,
      dept: user.Dept_ID,
      courses: assignedCourseIds.length
        ? assignedCourseIds
        : appCourses
            .filter(
              (course) =>
                course.dept === user.Dept_ID ||
                course.type === 'Institute Core' ||
                course.type === 'Seed Course'
            )
            .slice(0, 3)
            .map((course) => course.code),
    };
  });
}

export function buildStudentRecords(rawRegistrations, rawUsers, rawSections, appCourses, rawStudents) {
  return rawRegistrations
    .filter((registration) => registration.Term_ID && registration.Status !== 'Dropped')
    .map((registration) => {
      const user = rawUsers.find((row) => row.User_ID === registration.Student_ID);
      const course = appCourses.find((row) => row.code === registration.Course_ID);
      const section = rawSections.find((row) => row.Section_ID === registration.Section_ID);

      // Derive UG year purely on frontend:
      // Lumina terms:
      // - MONSOON <Year>: Starts academic year Year/(Year+1). E.g. MONSOON2025 -> 2024 batch is in 2nd year (UG2)
      // - SPRING <Year>: 2nd semester of academic year (Year-1)/Year. E.g. SPRING2026 -> 2024 batch is in 2nd year (UG2)
      let ugYear = course?.ugYear || 'UG1';
      const termUpper = String(registration.Term_ID || '').toUpperCase();
      const isMonsoon = termUpper.includes('MONSOON');
      const studentRecord = (rawStudents || []).find((s) => s.Student_ID === registration.Student_ID);
      if (studentRecord?.Current_Semester) {
        ugYear = `UG${Math.min(4, Math.ceil(studentRecord.Current_Semester / 2))}`;
      } else {
        const yearMatch = String(registration.Student_ID || '').match(/^S(\d{4})/i);
        if (yearMatch) {
          const enrollYear = parseInt(yearMatch[1], 10);
          const termYearMatch = termUpper.match(/\d{4}/);
          const termYear = termYearMatch ? parseInt(termYearMatch[0], 10) : (isMonsoon ? 2025 : 2026);
          // For Monsoon terms, 2024 batch in 2025 is starting 2nd year: (2025 - 2024 + 1) = 2 -> UG2
          // For Spring terms, 2024 batch in 2026 is finishing 2nd year: (2026 - 2024) = 2 -> UG2
          const yearDiff = isMonsoon ? (termYear - enrollYear + 1) : (termYear - enrollYear);
          if (yearDiff >= 1 && yearDiff <= 4) {
            ugYear = `UG${yearDiff}`;
          }
        }
      }

      let sectionDisplay = 'Unassigned';
      if (section?.Section_Name) {
        sectionDisplay = section.Section_Name.replace(/^S/, 'Section ');
      } else if (registration.Section_ID && registration.Section_ID !== 'null') {
        const secMatch = String(registration.Section_ID).match(/S?(\d+)$/i);
        sectionDisplay = secMatch ? `Section ${secMatch[1]}` : registration.Section_ID;
      }

      return {
        enrollmentId: registration.Enrollment_ID,
        id: registration.Student_ID,
        name: user?.Full_Name || registration.Student_ID,
        program: user?.Dept_ID || course?.dept || 'CSE',
        ugYear,
        course: registration.Course_ID,
        termId: registration.Term_ID,
        section: sectionDisplay,
        status: registration.Status,
      };
    });
}

export function buildTimetable(rawSlots, rawSections, rawUsers) {
  const facultyUsers = rawUsers.filter((u) => u.Role === 'Faculty');
  return rawSlots
    .filter((slot) => {
      const section = rawSections.find((row) => row.Section_ID === slot.Section_ID);
      return section?.Term_ID === 'SPRING2026';
    })
    .map((slot) => {
      const section = rawSections.find((row) => row.Section_ID === slot.Section_ID);
      const faculty = facultyUsers.find((row) => row.User_ID === slot.Faculty_ID);
      return {
        id: slot.Slot_ID,
        day: slot.Day_of_Week,
        timeSlot: `${slot.Start_Time}-${slot.End_Time}`,
        courseCode: section?.Course_ID || '',
        room: slot.Room_Number,
        professor: faculty?.Full_Name || '',
        section: section ? section.Section_Name.replace(/^S/, '') : '1',
      };
    });
}

export function buildRooms(rawSlots) {
  const slotRooms = rawSlots.map((slot) => slot.Room_Number);
  const allRooms = Array.from(new Set([...ROOM_MASTER, ...slotRooms])).sort();
  return allRooms.map((roomName) => ({ name: roomName, capacity: ROOM_CAPACITY }));
}

export function buildRecentActivities(rawRegistrations = [], rawCourses = [], rawSlots = [], rawUsers = []) {
  const activities = [];

  // 1. Course Slot allocations from active database timetable
  if (Array.isArray(rawSlots) && rawSlots.length > 0) {
    const latestSlots = [...rawSlots].reverse().slice(0, 3);
    latestSlots.forEach((slot, i) => {
      activities.push({
        icon: 'slot',
        title: `${slot.Section_ID || 'Course'} Slot Allocated`,
        detail: `Room ${slot.Room_Number || 'G01'}, ${slot.Day_of_Week || 'Mon'} ${slot.Start_Time || '08:45'} - ${slot.End_Time || '09:45'}`,
        time: `${(i + 1) * 20} mins ago`,
      });
    });
  }

  // 2. Active Course Catalog listings
  if (Array.isArray(rawCourses) && rawCourses.length > 0) {
    const recentCourses = [...rawCourses].slice(0, 3);
    recentCourses.forEach((c, i) => {
      activities.push({
        icon: 'course',
        title: `${c.Course_Name} (${c.Course_ID})`,
        detail: `${c.Credits} Credits • ${c.Dept_ID || 'Institute Core'} • ${c.Status || 'Active'}`,
        time: `${i + 1} hour ago`,
      });
    });
  }

  // 3. Enrollment database synchronization
  if (Array.isArray(rawRegistrations) && rawRegistrations.length > 0) {
    activities.push({
      icon: 'success',
      title: 'Enrollment Records Synced',
      detail: `${rawRegistrations.length} active course enrollments mapped to sections`,
      time: 'Today',
    });
  }

  // 4. Faculty active workload
  if (Array.isArray(rawUsers)) {
    const facultyCount = rawUsers.filter((u) => u.Role === 'Faculty').length;
    if (facultyCount > 0) {
      activities.push({
        icon: 'course',
        title: 'Faculty Workload Verified',
        detail: `${facultyCount} departmental faculty members active in system`,
        time: 'Today',
      });
    }
  }

  return activities;
}

/**
 * getDeptDisplay — pretty-print department in course table
 */
export function getDeptDisplay(course) {
  if (course.type === 'Institute Core' || course.type === 'Institute Elective') {
    return 'CSE, ECE, AIDS';
  }
  if (course.type === 'Seed Course') {
    return 'All Departments (CSE, ECE, AIDS)';
  }
  return course.dept;
}
