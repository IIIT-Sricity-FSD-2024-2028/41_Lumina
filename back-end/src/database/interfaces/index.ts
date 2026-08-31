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
  | 'Dean'
  | 'Super_User'
  | 'Lumina_SPOC'
  | 'Admin';

export interface SupportDocket {
  docketId: string;
  instituteId: string;
  instituteName: string;
  submittedBy: string;
  category: 'SSO_Integration' | 'Data_Migration' | 'Performance_Latency' | 'Seat_Quota_Expansion' | 'Database_Backup' | 'System_Incident';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  subject: string;
  description: string;
  status: 'Open' | 'In_Progress' | 'Resolved';
  assignedSpocId: string;
  createdAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface LuminaAdminSpoc {
  adminId: string;
  fullName: string;
  email: string;
  phone: string;
  assignedInstituteId: string;
  assignedInstituteName: string;
  role: 'Lumina_SPOC';
  status: 'Active' | 'On Leave';
  slaHealth: string;
  activeDockets: number;
}

export interface ClientInstitute {
  instituteId: string;
  name: string;
  tier: 'Starter' | 'Campus' | 'Enterprise';
  spocAdminId: string;
  spocName: string;
  deanName: string;
  deanEmail: string;
  studentCount: number;
  status: 'Active' | 'Onboarding' | 'Trial';
  annualContractValue: number;
  joinedDate: string;
}

export interface SaasPlanDefinition {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  studentCapacity: string;
  includedModules: string[];
  restrictedModules: string[];
  popular: boolean;
}

export interface ActivePlanState {
  tier: 'Starter' | 'Campus' | 'Enterprise';
  billingCycle: 'monthly' | 'annual';
  status: 'Active' | 'Trial' | 'Past_Due';
  activatedAt: string;
  renewalDate: string;
  autoRenew: boolean;
}

export interface PaymentRecord {
  amountPaid: number;
  paymentDate: string;
  status: 'Cleared' | 'Pending';
}







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
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  fileSize?: number | null;
}


export interface EnrollmentPhase {
  id: number;
  name: string;
  eligibleGroups: string; // 'Final Year', '3rd Year', '2nd Year', '1st Year', 'Backlog Students', 'All Students'
  timeline: string;
  status: 'Upcoming' | 'Active' | 'Completed';
}

export interface PolicySettings {
  status: 'Validated' | 'Pending';
  isLocked: boolean;
  minCredits: number;
  maxCredits: number;
  maxCourses: number;
  enforcePrereq: boolean;
  allowConditional: boolean;
  allowAdvisorOverride: boolean;
  minGpa: number;
  financialClearance: boolean;
  advisorApproval: boolean;
  academicYear: string;
  term: string;
  termLocked: boolean;
  systemStatus: 'Active' | 'Deactivated';
  windowStatus: 'Open' | 'Paused' | 'Closed';
  startDate: string;
  endDate: string;
}

export interface PolicyChangeLog {
  id: number;
  message: string;
  by: string;
  createdAt: string;
}
