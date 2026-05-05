import { OnModuleInit } from '@nestjs/common';
import { User, Student, Department, CourseCatalog, DegreeRequirement, CoursePrerequisite, AcademicTerm, Section, CourseSlot, Registration, OverrideRequest, AcademicRoadmap, Announcement, EnrollmentPhase } from './interfaces';
export declare class DatabaseService implements OnModuleInit {
    private readonly logger;
    users: User[];
    students: Student[];
    departments: Department[];
    courseCatalog: CourseCatalog[];
    degreeRequirements: DegreeRequirement[];
    coursePrerequisites: CoursePrerequisite[];
    academicTerms: AcademicTerm[];
    sections: Section[];
    courseSlots: CourseSlot[];
    registrations: Registration[];
    overrideRequests: OverrideRequest[];
    academicRoadmaps: AcademicRoadmap[];
    announcements: Announcement[];
    enrollmentPhases: EnrollmentPhase[];
    onModuleInit(): void;
    private seed;
}
