/**
 * facultyData.js
 *
 * Unified data layer for Faculty portal:
 * - Attempts to fetch from live backend APIs (courses, sections, course-slots, registrations, users, announcements).
 * - Falls back smoothly to comprehensive university mock data when backend is unreachable or returning empty data.
 * - Stores live mutations (grades, announcements, materials) in localStorage so changes persist across refreshes.
 */
import api from './api';
import { registrationsService } from './registrations.service';
import { announcementsService } from './announcements.service';
import { slotsService } from './slots.service';

const STORAGE_KEYS = {
  GRADES: 'lumina_faculty_grades_v1',
  MATERIALS: 'lumina_faculty_materials_v1',
  ANNOUNCEMENTS: 'lumina_faculty_announcements_v1',
};

// Initial realistic fallback data matching Lumina institute requirements
const DEFAULT_FACULTY_COURSES = [
  {
    id: 'CS402',
    name: 'Operating Systems',
    semester: 'SEMESTER 4',
    termId: 'SPRING2026',
    termLabel: 'Spring 2026',
    credits: 4,
    capacity: 60,
    students: 42,
    status: 'active',
    room: 'Room 204',
    schedule: 'Mon, Wed 09:00 - 10:30 AM',
    syllabus: 'Processes, CPU Scheduling, Synchronization, Memory Management, File Systems',
    sectionId: 'PC402-S1',
    slotId: 1,
  },
  {
    id: 'CS305',
    name: 'Database Management Systems',
    semester: 'SEMESTER 3',
    termId: 'SPRING2026',
    termLabel: 'Spring 2026',
    credits: 4,
    capacity: 60,
    students: 38,
    status: 'active',
    room: 'Room 105',
    schedule: 'Tue, Thu 11:00 AM - 12:30 PM',
    syllabus: 'Relational Model, Normalization, SQL, Transactions, Concurrency Control',
    sectionId: 'CS305-S1',
    slotId: 3,
  },
  {
    id: 'CS210',
    name: 'Data Structures and Algorithms',
    semester: 'SEMESTER 2',
    termId: 'SPRING2026',
    termLabel: 'Spring 2026',
    credits: 4,
    capacity: 65,
    students: 48,
    status: 'active',
    room: 'Room 302',
    schedule: 'Mon, Fri 02:00 - 03:30 PM',
    syllabus: 'Linear Structures, Trees, Graphs, Sorting & Searching, Dynamic Programming',
    sectionId: 'CS210-S1',
    slotId: 5,
  },
  {
    id: 'CS512',
    name: 'Advanced Distributed Computing',
    semester: 'SEMESTER 6',
    termId: 'FALL2026',
    termLabel: 'Monsoon 2026',
    credits: 3,
    capacity: 40,
    students: 24,
    status: 'inactive',
    room: 'Lab 3',
    schedule: 'Wed, Fri 04:00 - 05:30 PM',
    syllabus: 'Consensus protocols, Raft, Paxos, Distributed Storage & Vector Clocks',
    sectionId: 'CS512-S1',
    slotId: 6,
  },
];

const DEFAULT_STUDENTS = {
  CS402: [
    { enrollmentId: 180, roll: 'S2024001', name: 'Aarav Sharma', email: 'aarav.sharma@lumina.edu', prog: 'CSE', semester: 4, mid: 28, fin: 64, finalGrade: 'O' },
    { enrollmentId: 181, roll: 'S2024002', name: 'Aditi Rao', email: 'aditi.rao@lumina.edu', prog: 'CSE', semester: 4, mid: 25, fin: 58, finalGrade: 'A' },
    { enrollmentId: 182, roll: 'S2024003', name: 'Ananya Verma', email: 'ananya.v@lumina.edu', prog: 'CSE', semester: 4, mid: 22, fin: 52, finalGrade: 'B' },
    { enrollmentId: 183, roll: 'S2024004', name: 'Devendra Patel', email: 'devendra.p@lumina.edu', prog: 'ECE', semester: 4, mid: 18, fin: 45, finalGrade: 'C' },
    { enrollmentId: 184, roll: 'S2024005', name: 'Ishita Kapoor', email: 'ishita.k@lumina.edu', prog: 'CSE', semester: 4, mid: 29, fin: 66, finalGrade: 'O' },
    { enrollmentId: 185, roll: 'S2024006', name: 'Kunal Singhal', email: 'kunal.s@lumina.edu', prog: 'CSE', semester: 4, mid: 24, fin: 55, finalGrade: 'B' },
    { enrollmentId: 186, roll: 'S2024007', name: 'Meera Nambiar', email: 'meera.n@lumina.edu', prog: 'AI&DS', semester: 4, mid: 27, fin: 61, finalGrade: 'A' },
    { enrollmentId: 187, roll: 'S2024008', name: 'Nikhil Saxena', email: 'nikhil.s@lumina.edu', prog: 'CSE', semester: 4, mid: 16, fin: 40, finalGrade: 'D' },
    { enrollmentId: 188, roll: 'S2024009', name: 'Pooja Iyer', email: 'pooja.i@lumina.edu', prog: 'CSE', semester: 4, mid: 26, fin: 59, finalGrade: 'A' },
    { enrollmentId: 189, roll: 'S2024010', name: 'Rohan Deshmukh', email: 'rohan.d@lumina.edu', prog: 'ECE', semester: 4, mid: 21, fin: 50, finalGrade: 'B' },
    { enrollmentId: 190, roll: 'S2024011', name: 'Sneha Kulkarni', email: 'sneha.k@lumina.edu', prog: 'CSE', semester: 4, mid: 30, fin: 68, finalGrade: 'O' },
    { enrollmentId: 191, roll: 'S2024012', name: 'Tarun Joshi', email: 'tarun.j@lumina.edu', prog: 'CSE', semester: 4, mid: 23, fin: 51, finalGrade: 'B' },
  ],
  CS305: [
    { enrollmentId: 161, roll: 'S2024013', name: 'Bhavya Mishra', email: 'bhavya.m@lumina.edu', prog: 'CSE', semester: 3, mid: 26, fin: 60, finalGrade: 'A' },
    { enrollmentId: 162, roll: 'S2024014', name: 'Chirag Reddy', email: 'chirag.r@lumina.edu', prog: 'CSE', semester: 3, mid: 23, fin: 54, finalGrade: 'B' },
    { enrollmentId: 163, roll: 'S2024015', name: 'Deepika Sen', email: 'deepika.s@lumina.edu', prog: 'CSE', semester: 3, mid: 28, fin: 63, finalGrade: 'O' },
    { enrollmentId: 164, roll: 'S2024016', name: 'Gautam Menon', email: 'gautam.m@lumina.edu', prog: 'ECE', semester: 3, mid: 20, fin: 48, finalGrade: 'C' },
    { enrollmentId: 165, roll: 'S2024017', name: 'Harini Sundaram', email: 'harini.s@lumina.edu', prog: 'CSE', semester: 3, mid: 27, fin: 62, finalGrade: 'A' },
    { enrollmentId: 166, roll: 'S2024018', name: 'Jaideep Bhatt', email: 'jaideep.b@lumina.edu', prog: 'AI&DS', semester: 3, mid: 24, fin: 56, finalGrade: 'B' },
  ],
  CS210: [
    { enrollmentId: 137, roll: 'S2024019', name: 'Kavita Ghosh', email: 'kavita.g@lumina.edu', prog: 'CSE', semester: 2, mid: 27, fin: 63, finalGrade: 'A' },
    { enrollmentId: 138, roll: 'S2024020', name: 'Manish Tiwari', email: 'manish.t@lumina.edu', prog: 'CSE', semester: 2, mid: 29, fin: 67, finalGrade: 'O' },
    { enrollmentId: 139, roll: 'S2024021', name: 'Neha Chawla', email: 'neha.c@lumina.edu', prog: 'ECE', semester: 2, mid: 21, fin: 49, finalGrade: 'C' },
    { enrollmentId: 140, roll: 'S2024022', name: 'Pranav Nair', email: 'pranav.n@lumina.edu', prog: 'CSE', semester: 2, mid: 25, fin: 58, finalGrade: 'A' },
    { enrollmentId: 141, roll: 'S2024023', name: 'Ritu Agarwal', email: 'ritu.a@lumina.edu', prog: 'CSE', semester: 2, mid: 19, fin: 44, finalGrade: 'D' },
    { enrollmentId: 142, roll: 'S2024024', name: 'Siddharth Roy', email: 'siddharth.r@lumina.edu', prog: 'AI&DS', semester: 2, mid: 28, fin: 65, finalGrade: 'O' },
  ],
  CS512: [
    { enrollmentId: 172, roll: 'S2024001', name: 'Aarav Sharma', email: 'aarav.sharma@lumina.edu', prog: 'CSE', semester: 6, mid: 26, fin: 60, finalGrade: 'A' },
    { enrollmentId: 173, roll: 'S2024005', name: 'Ishita Kapoor', email: 'ishita.k@lumina.edu', prog: 'CSE', semester: 6, mid: 29, fin: 65, finalGrade: 'O' },
  ],
};

const DEFAULT_TODAYS_CLASSES = [
  {
    id: 'tc-1',
    courseId: 'CS402',
    courseName: 'Operating Systems',
    time: '09:00',
    ampm: 'AM',
    end: '10:30 AM',
    dayOfWeek: 'Monday',
    room: 'Room 204',
    status: 'upcoming',
    duration: '90 mins',
  },
  {
    id: 'tc-2',
    courseId: 'CS305',
    courseName: 'Database Management Systems',
    time: '11:00',
    ampm: 'AM',
    end: '12:30 PM',
    dayOfWeek: 'Monday',
    room: 'Room 105',
    status: 'upcoming',
    duration: '90 mins',
  },
  {
    id: 'tc-3',
    courseId: 'CS210',
    courseName: 'Data Structures and Algorithms',
    time: '02:00',
    ampm: 'PM',
    end: '03:30 PM',
    dayOfWeek: 'Monday',
    room: 'Room 302',
    status: 'upcoming',
    duration: '90 mins',
  },
];

const DEFAULT_MATERIALS = {
  CS402: [
    { id: 'm-1', name: 'CS402 Complete Course Syllabus & Schedule', type: 'Syllabus', date: 'Jan 05, 2026', size: '1.4 MB' },
    { id: 'm-2', name: 'Lecture 01-03: Process Concept & IPC', type: 'Slides', date: 'Jan 12, 2026', size: '4.2 MB' },
    { id: 'm-3', name: 'Lecture 04-06: Multithreading & POSIX Threads', type: 'Slides', date: 'Jan 19, 2026', size: '3.8 MB' },
    { id: 'm-4', name: 'Assignment 1: Kernel Process Scheduler Sim', type: 'Assignment', date: 'Feb 02, 2026', size: '820 KB' },
    { id: 'm-5', name: 'Synchronization Primitives & Peterson Algorithm Notes', type: 'Notes', date: 'Feb 10, 2026', size: '2.1 MB' },
  ],
  CS305: [
    { id: 'm-6', name: 'CS305 Syllabus & Course Policies', type: 'Syllabus', date: 'Jan 05, 2026', size: '980 KB' },
    { id: 'm-7', name: 'Relational Algebra & Calculus Lecture Slides', type: 'Slides', date: 'Jan 14, 2026', size: '3.1 MB' },
    { id: 'm-8', name: 'Assignment 1: Complex SQL Queries & Optimization', type: 'Assignment', date: 'Jan 28, 2026', size: '540 KB' },
  ],
  CS210: [
    { id: 'm-9', name: 'CS210 Syllabus & Reference Textbooks', type: 'Syllabus', date: 'Jan 05, 2026', size: '1.1 MB' },
    { id: 'm-10', name: 'Balanced Search Trees (AVL & Red-Black)', type: 'Notes', date: 'Jan 22, 2026', size: '2.6 MB' },
  ],
  CS512: [
    { id: 'm-11', name: 'CS512 Distributed Systems Course Plan', type: 'Syllabus', date: 'Aug 01, 2026', size: '1.2 MB' },
  ],
};

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: 1,
    courseId: 'CS402',
    courseLabel: 'CS402 - OPERATING SYSTEMS',
    title: 'Midterm Examination Schedule & Format',
    message: 'The midterm examination for CS402 will be conducted next Wednesday from 10:00 AM to 12:00 PM in Room 204. Topics cover Process Synchronization, Deadlocks, and CPU Scheduling. Please bring your university ID.',
    createdAt: new Date(Date.now() - 3600 * 2000).toISOString(),
    ago: '2 hours ago',
    attachmentName: 'CS402_Midterm_Guidelines.pdf',
  },
  {
    id: 2,
    courseId: 'CS305',
    courseLabel: 'CS305 - DATABASE MANAGEMENT SYSTEMS',
    title: 'Lab Assignment 2 Deadline Extension',
    message: 'Due to requests regarding database server maintenance, the submission deadline for Lab Assignment 2 (B+ Tree indexing) has been extended to Friday 11:59 PM. Late submissions will incur standard deductions.',
    createdAt: new Date(Date.now() - 3600 * 18000).toISOString(),
    ago: 'Yesterday',
    attachmentName: 'Lab2_Indexing_Starter.zip',
  },
  {
    id: 3,
    courseId: 'all',
    courseLabel: 'ALL ASSIGNED COURSES',
    title: 'Syllabus Coverage & Supplementary Reading Notes',
    message: 'Updated reading references and lecture recordings have been uploaded under Course Materials. Students preparing for upcoming project milestones are advised to consult office hours on Tuesdays.',
    createdAt: new Date(Date.now() - 3600 * 50000).toISOString(),
    ago: '3 days ago',
  },
];

// Grade letter calculation following university policy
export function getGradeLetter(total) {
  const score = Math.round(Number(total) || 0);
  if (score >= 90) return { grade: 'O', label: 'Outstanding', color: '#10b981', bg: '#ecfdf5' };
  if (score >= 80) return { grade: 'A', label: 'Excellent', color: '#3b82f6', bg: '#eff6ff' };
  if (score >= 70) return { grade: 'B', label: 'Very Good', color: '#6366f1', bg: '#eef2ff' };
  if (score >= 60) return { grade: 'C', label: 'Good', color: '#f59e0b', bg: '#fffbeb' };
  if (score >= 50) return { grade: 'D', label: 'Satisfactory', color: '#f97316', bg: '#fff7ed' };
  return { grade: 'F', label: 'Fail', color: '#ef4444', bg: '#fef2f2' };
}

export function getInitials(name) {
  if (!name) return 'PM';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function getColorForString(str) {
  const palette = ['#2563eb', '#059669', '#7c3aed', '#db2777', '#d97706', '#0891b2', '#4f46e5', '#0f766e'];
  let sum = 0;
  for (let i = 0; i < (str || '').length; i++) sum += str.charCodeAt(i);
  return palette[sum % palette.length];
}

// LocalStorage helpers for persistent updates
function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Storage write error', e);
  }
}

export const facultyDataService = {
  /**
   * Get Faculty profile information
   */
  getProfile(currentUser) {
    const name = currentUser?.Full_Name || 'Dr. Arun P V';
    const cleanName = name.replace(/^Dr\.\s*/i, '').replace(/^Prof\.\s*/i, '');
    return {
      id: currentUser?.User_ID || 'F2024001',
      displayName: `Prof. ${cleanName}`,
      fullName: name,
      deptName: currentUser?.Dept_ID || 'Computer Science and Engineering',
      email: currentUser?.Email || 'faculty@lumina.edu',
      avatar: getInitials(cleanName),
    };
  },

  /**
   * Fetch courses assigned to faculty (with fallback)
   */
  async getCourses(currentUser) {
    const facultyId = currentUser?.User_ID || 'F2024001';
    try {
      const [coursesRes, slotsRes] = await Promise.all([
        api.get('/courses'),
        api.get('/course-slots'),
      ]);

      const allCourses = coursesRes.data || [];
      const allSlots = slotsRes.data || [];

      // Filter slots for this faculty
      const facultySlots = allSlots.filter((s) => s.facultyId === facultyId || s.Faculty_ID === facultyId);

      if (facultySlots.length > 0) {
        // Map to course items
        const courseMap = {};
        allCourses.forEach((c) => {
          courseMap[c.courseId || c.Course_ID] = c;
        });

        const mapped = facultySlots.map((slot) => {
          const cId = slot.courseId || slot.Course_ID || 'CS402';
          const c = courseMap[cId] || {};
          return {
            id: cId,
            name: c.courseName || c.Course_Name || 'Course',
            credits: Number(c.credits || c.Credits || 4),
            semester: 'SEMESTER 4',
            termId: 'SPRING2026',
            termLabel: 'Spring 2026',
            students: 40,
            status: String(c.status || c.Status || 'Active').toLowerCase(),
            room: `Room ${slot.roomNumber || slot.Room_Number || '204'}`,
            schedule: `${slot.dayOfWeek || 'Mon'} ${slot.startTime || '09:00'} - ${slot.endTime || '10:30'}`,
            syllabus: slot.syllabus || slot.Syllabus || 'Course Overview',
            sectionId: slot.sectionId || slot.Section_ID || 'S1',
            slotId: Number(slot.slotId || slot.Slot_ID || 1),
          };
        });

        if (mapped.length > 0) return mapped;
      }
    } catch {
      // Backend unavailable or empty; proceed to fallback
    }

    return DEFAULT_FACULTY_COURSES;
  },

  /**
   * Get today's upcoming classes
   */
  async getTodaysClasses() {
    return DEFAULT_TODAYS_CLASSES;
  },

  /**
   * Get students for a specific course (attempts live backend API, falls back cleanly)
   */
  async getStudentsForCourse(courseId) {
    // 1. Attempt to fetch live registration & user data from backend
    try {
      const [regRes, usersRes] = await Promise.all([
        api.get('/registrations'),
        api.get('/users'),
      ]);

      const allRegs = regRes.data || [];
      const allUsers = usersRes.data || [];

      const usersMap = {};
      allUsers.forEach((u) => {
        const uId = u.userId || u.User_ID;
        if (uId) usersMap[uId] = u;
      });

      // Filter registrations for this course
      const courseRegs = allRegs.filter(
        (r) =>
          (r.courseId === courseId || r.Course_ID === courseId) &&
          (r.status === 'Enrolled' || r.Status === 'Enrolled' || !r.status)
      );

      if (courseRegs.length > 0) {
        // Retrieve local draft mark inputs if saved
        const localGrades = readStorage(STORAGE_KEYS.GRADES, {});
        const draftList = localGrades[courseId] || [];
        const draftMap = {};
        draftList.forEach((d) => {
          draftMap[d.roll] = d;
        });

        const liveList = courseRegs.map((r, idx) => {
          const sId = r.studentId || r.Student_ID;
          const u = usersMap[sId] || {};
          const d = draftMap[sId] || {};

          const mid = d.mid !== undefined ? d.mid : 25;
          const fin = d.fin !== undefined ? d.fin : 55;
          const gradeInfo = getGradeLetter(mid + fin);
          const finalLetter = r.finalGrade || d.finalGrade || gradeInfo.grade;

          return {
            enrollmentId: Number(r.enrollmentId || r.Enrollment_ID || 180 + idx),
            roll: sId,
            name: u.fullName || u.Full_Name || sId,
            email: u.email || u.Email || `${sId.toLowerCase()}@lumina.edu`,
            prog: u.deptId || u.Dept_ID || 'CSE',
            semester: 4,
            mid,
            fin,
            finalGrade: finalLetter,
            submitted: !!r.finalGrade,
            isLive: true,
          };
        });

        return liveList;
      }
    } catch {
      // Backend unavailable; proceed to local persistence and fallback
    }

    // 2. Read from persistent local storage or default institution mock
    const storedGrades = readStorage(STORAGE_KEYS.GRADES, DEFAULT_STUDENTS);
    if (storedGrades[courseId]) {
      return storedGrades[courseId];
    }
    return DEFAULT_STUDENTS[courseId] || DEFAULT_STUDENTS['CS402'];
  },

  /**
   * Get all students enrolled across all faculty courses (for Quick Roster)
   */
  async getAllEnrolledStudents() {
    const storedGrades = readStorage(STORAGE_KEYS.GRADES, DEFAULT_STUDENTS);
    const list = [];
    Object.keys(storedGrades).forEach((courseId) => {
      storedGrades[courseId].forEach((student) => {
        list.push({
          ...student,
          courseId,
          color: getColorForString(student.roll),
          init: getInitials(student.name),
        });
      });
    });
    return list;
  },

  /**
   * Save draft grades for a course (Local Draft Persistence)
   */
  async saveDraftGrades(courseId, gradesList) {
    const stored = readStorage(STORAGE_KEYS.GRADES, DEFAULT_STUDENTS);
    stored[courseId] = gradesList.map((g) => ({
      ...g,
      finalGrade: getGradeLetter(g.mid + g.fin).grade,
    }));
    writeStorage(STORAGE_KEYS.GRADES, stored);
    return stored[courseId];
  },

  /**
   * Submit finalized grades (persists locally and syncs to backend batch endpoint)
   */
  async submitFinalGrades(courseId, gradesList) {
    const updated = gradesList.map((g) => {
      const letter = getGradeLetter(g.mid + g.fin).grade;
      return {
        ...g,
        finalGrade: letter,
        submitted: true,
      };
    });

    const stored = readStorage(STORAGE_KEYS.GRADES, DEFAULT_STUDENTS);
    stored[courseId] = updated;
    writeStorage(STORAGE_KEYS.GRADES, stored);

    let backendSuccess = false;
    let backendError = null;

    // Filter valid numeric enrollment IDs
    const payload = updated
      .filter((g) => g.enrollmentId && !isNaN(Number(g.enrollmentId)))
      .map((g) => ({
        enrollmentId: Number(g.enrollmentId),
        finalGrade: g.finalGrade,
      }));

    if (payload.length > 0) {
      try {
        const res = await registrationsService.batchUpdateGrades(payload);
        if (res && res.updated && res.updated.length > 0) {
          backendSuccess = true;
        } else if (res) {
          backendSuccess = true;
        }
      } catch (e) {
        backendError = e.response?.data?.message || e.message;
        console.warn('Backend sync for grades not reached, stored locally:', backendError);
      }
    }

    return {
      grades: updated,
      backendSuccess,
      backendError,
      syncedCount: backendSuccess ? payload.length : 0,
    };
  },

  /**
   * Get materials for a course
   */
  async getMaterials(courseId) {
    const stored = readStorage(STORAGE_KEYS.MATERIALS, DEFAULT_MATERIALS);
    return stored[courseId] || DEFAULT_MATERIALS[courseId] || [];
  },

  /**
   * Add a course material / syllabus
   */
  async addMaterial(courseId, materialData, file) {
    const stored = readStorage(STORAGE_KEYS.MATERIALS, DEFAULT_MATERIALS);
    const courseMats = stored[courseId] || [];
    const newMaterial = {
      id: `mat-${Date.now()}`,
      name: materialData.name || file?.name || 'Course Document',
      type: materialData.type || 'Notes',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      size: file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : '1.2 MB',
      fileUrl: file ? URL.createObjectURL(file) : null,
    };
    stored[courseId] = [newMaterial, ...courseMats];
    writeStorage(STORAGE_KEYS.MATERIALS, stored);

    let backendSuccess = false;
    let backendError = null;

    // If numeric slotId is present and file is uploaded, attempt syllabus backend upload
    const numericSlotId = Number(materialData.slotId);
    if (!isNaN(numericSlotId) && numericSlotId > 0 && file) {
      try {
        await slotsService.uploadSyllabus(numericSlotId, file);
        backendSuccess = true;
      } catch (e) {
        backendError = e.response?.data?.message || e.message;
        console.warn('Backend syllabus upload skipped:', backendError);
      }
    }

    return {
      material: newMaterial,
      backendSuccess,
      backendError,
    };
  },

  /**
   * Get announcements
   */
  async getAnnouncements() {
    try {
      const res = await announcementsService.getAll();
      if (Array.isArray(res) && res.length > 0) {
        return res.map((a) => ({
          id: a.announcementId || a.id,
          courseId: a.courseId || 'all',
          courseLabel: a.courseId ? `${a.courseId} - COURSE` : 'ALL COURSES',
          title: a.title,
          message: a.message || a.content,
          ago: 'Recently',
          attachmentName: a.attachmentName || a.attachmentUrl ? 'Attached Document' : null,
        }));
      }
    } catch {
      // Backend unavailable; fallback to local storage
    }

    return readStorage(STORAGE_KEYS.ANNOUNCEMENTS, DEFAULT_ANNOUNCEMENTS);
  },

  /**
   * Create an announcement
   */
  async createAnnouncement(data, file) {
    const stored = readStorage(STORAGE_KEYS.ANNOUNCEMENTS, DEFAULT_ANNOUNCEMENTS);
    const newAnn = {
      id: Date.now(),
      courseId: data.courseId,
      courseLabel: data.courseId === 'all' ? 'ALL ASSIGNED COURSES' : `${data.courseId} - COURSE`,
      title: data.title,
      message: data.message,
      createdAt: new Date().toISOString(),
      ago: 'Just now',
      attachmentName: file ? file.name : null,
    };

    stored.unshift(newAnn);
    writeStorage(STORAGE_KEYS.ANNOUNCEMENTS, stored);

    let backendSuccess = false;
    let backendError = null;

    try {
      const res = await announcementsService.create({
        title: data.title,
        message: data.message,
        courseId: data.courseId === 'all' ? 'PC402' : data.courseId,
      }, file);
      backendSuccess = true;
      if (res && (res.announcementId || res.id)) {
        newAnn.id = res.announcementId || res.id;
      }
    } catch (e) {
      backendError = e.response?.data?.message || e.message;
      console.warn('Backend announcement create skipped:', backendError);
    }

    return {
      created: newAnn,
      backendSuccess,
      backendError,
    };
  },

  /**
   * Update an existing announcement (syncs with PUT /announcements/:id)
   */
  async updateAnnouncement(id, data) {
    const stored = readStorage(STORAGE_KEYS.ANNOUNCEMENTS, DEFAULT_ANNOUNCEMENTS);
    const numId = Number(id);
    let updatedItem = null;

    const updatedList = stored.map((a) => {
      if (a.id === numId || a.id === id) {
        updatedItem = {
          ...a,
          courseId: data.courseId,
          courseLabel: data.courseId === 'all' ? 'ALL ASSIGNED COURSES' : `${data.courseId} - COURSE`,
          title: data.title,
          message: data.message,
        };
        return updatedItem;
      }
      return a;
    });

    writeStorage(STORAGE_KEYS.ANNOUNCEMENTS, updatedList);

    let backendSuccess = false;
    let backendError = null;

    if (!isNaN(numId)) {
      try {
        await announcementsService.update(numId, {
          title: data.title,
          message: data.message,
          courseId: data.courseId === 'all' ? 'PC402' : data.courseId,
        });
        backendSuccess = true;
      } catch (e) {
        backendError = e.response?.data?.message || e.message;
        console.warn('Backend announcement update failed:', backendError);
      }
    }

    return {
      updated: updatedItem || { id, ...data },
      backendSuccess,
      backendError,
    };
  },

  /**
   * Delete an announcement
   */
  async deleteAnnouncement(id) {
    const stored = readStorage(STORAGE_KEYS.ANNOUNCEMENTS, DEFAULT_ANNOUNCEMENTS);
    const numId = Number(id);
    const filtered = stored.filter((a) => a.id !== numId && a.id !== id);
    writeStorage(STORAGE_KEYS.ANNOUNCEMENTS, filtered);

    let backendSuccess = false;
    let backendError = null;

    if (!isNaN(numId)) {
      try {
        await announcementsService.delete(numId);
        backendSuccess = true;
      } catch (e) {
        backendError = e.response?.data?.message || e.message;
        console.warn('Backend announcement delete skipped:', backendError);
      }
    }

    return {
      success: true,
      backendSuccess,
      backendError,
    };
  },
};
