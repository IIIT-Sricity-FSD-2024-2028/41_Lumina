// ─────────────────────────────────────────────────────────────
// Lumina Academic Planning System – Entity Interfaces
// Single Source of Truth for all in-memory data shapes.
// ─────────────────────────────────────────────────────────────

/** Roles assignable to any system actor */
export type UserRole =
  | 'Student'
  | 'Faculty'
  | 'Assistant_Dean_1'
  | 'Assistant_Dean_2'
  | 'Dean';

/** Course lifecycle status */
export type CourseStatus = 'Active' | 'Inactive';

/** Degree-requirement classification */
export type CourseType = 'Institute Core' | 'Program Core' | 'SEED' | 'Elective';

/** Registration workflow states */
export type RegistrationStatus =
  | 'Pending_Allocation'
  | 'Enrolled'
  | 'Waitlisted'
  | 'Dropped';

/** Override-request approval states */
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

// ─────────────────────────────────────────────────────────────

export interface User {
  userId: string;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  deptId: string;
}

export interface Student {
  studentId: string;
  currentSemester: number;
  enrollmentYear: number;
}

export interface Department {
  deptId: string;
  deptName: string;
  totalRequiredCredits: number;
}

export interface CourseCatalog {
  courseId: string;
  courseName: string;
  credits: number;
  courseCapacity: number;
  status: CourseStatus;
  deptId: string;
}

export interface DegreeRequirement {
  requirementId: number;
  deptId: string;
  courseId: string;
  courseType: CourseType;
  targetSemester: number;
}

export interface CoursePrerequisite {
  targetCourseId: string;
  requiredCourseId: string;
}

export interface AcademicTerm {
  termId: string;
  termName: string;
  startTimestamp: string;
  endTimestamp: string;
  minCreditLimit: number;
  maxCreditLimit: number;
}

export interface Section {
  sectionId: string;
  sectionName: string;
  courseId: string;
  termId: string;
}

export interface CourseSlot {
  slotId: number;
  sectionId: string;
  facultyId: string;
  roomNumber: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  syllabus: string | null;
}

export interface Registration {
  enrollmentId: number;
  studentId: string;
  courseId: string;
  termId: string;
  sectionId: string | null;
  status: RegistrationStatus;
  finalGrade: string | null;
}

export interface OverrideRequest {
  requestId: number;
  studentId: string;
  courseId: string;
  reason: string;
  approvalStatus: ApprovalStatus;
  createdAt: string;
}

export interface AcademicRoadmap {
  roadmapId: number;
  studentId: string;
  courseId: string;
  plannedTerm: number;
}

export interface Announcement {
  announcementId: number;
  facultyId: string;
  courseId: string;
  title: string;
  message: string;
  createdAt: string;
}

export interface EnrollmentPhase {
  id: number;
  name: string;
  eligibleGroups: string; // 'Final Year', '3rd Year', '2nd Year', '1st Year', 'Backlog Students', 'All Students'
  timeline: string;
  status: 'Upcoming' | 'Active' | 'Completed';
}
