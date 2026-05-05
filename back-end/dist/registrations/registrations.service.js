"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrationsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
let RegistrationsService = class RegistrationsService {
    db;
    constructor(db) {
        this.db = db;
    }
    findAll() {
        return this.db.registrations;
    }
    getActiveTermId() {
        const now = new Date();
        const activeTerm = this.db.academicTerms.find(t => {
            const start = new Date(t.startTimestamp);
            const end = new Date(t.endTimestamp);
            return now >= start && now <= end;
        });
        if (activeTerm)
            return activeTerm.termId;
        const sorted = [...this.db.academicTerms].sort((a, b) => new Date(b.startTimestamp).getTime() - new Date(a.startTimestamp).getTime());
        return sorted.length > 0 ? sorted[0].termId : 'SPRING2026';
    }
    enroll(studentId, courseId) {
        const termId = this.getActiveTermId();
        const course = this.db.courseCatalog.find(c => c.courseId === courseId);
        if (!course) {
            throw new common_1.NotFoundException(`Course '${courseId}' not found in the catalog.`);
        }
        const duplicate = this.db.registrations.find(r => r.studentId === studentId &&
            r.courseId === courseId &&
            r.termId === termId &&
            (r.status === 'Enrolled' || r.status === 'Waitlisted' || r.status === 'Pending_Allocation'));
        if (duplicate) {
            throw new common_1.BadRequestException(`Student '${studentId}' is already registered for '${courseId}' in term '${termId}' (Status: ${duplicate.status}).`);
        }
        const activePhase = this.db.enrollmentPhases.find(p => p.status === 'Active');
        if (!activePhase) {
            throw new common_1.BadRequestException('Enrollment is currently closed. No active phase.');
        }
        const student = this.db.students.find(s => s.studentId === studentId);
        if (!student) {
            throw new common_1.BadRequestException(`Student '${studentId}' not found.`);
        }
        let isEligible = false;
        const sem = student.currentSemester;
        const groups = activePhase.eligibleGroups;
        if (groups === 'All Students')
            isEligible = true;
        else if (groups === 'Final Year' && (sem >= 7))
            isEligible = true;
        else if (groups === '3rd Year' && (sem === 5 || sem === 6))
            isEligible = true;
        else if (groups === '2nd Year' && (sem === 3 || sem === 4))
            isEligible = true;
        else if (groups === '1st Year' && (sem === 1 || sem === 2))
            isEligible = true;
        else if (groups === 'Backlog Students') {
            const hasBacklog = this.db.registrations.some(r => r.studentId === studentId && r.finalGrade === 'F');
            if (hasBacklog)
                isEligible = true;
        }
        if (!isEligible) {
            throw new common_1.BadRequestException(`You are not eligible to enroll during the current phase: '${activePhase.name}' (Eligible: ${groups}).`);
        }
        const term = this.db.academicTerms.find(t => t.termId === termId);
        const prereqs = this.db.coursePrerequisites.filter(p => p.targetCourseId === courseId);
        if (prereqs.length > 0) {
            const passedCourses = this.db.registrations
                .filter(r => r.studentId === studentId &&
                r.finalGrade !== null &&
                r.finalGrade !== 'F')
                .map(r => r.courseId);
            const missingPrereqs = prereqs.filter(p => !passedCourses.includes(p.requiredCourseId));
            if (missingPrereqs.length > 0) {
                const missing = missingPrereqs
                    .map(p => {
                    const c = this.db.courseCatalog.find(cc => cc.courseId === p.requiredCourseId);
                    return c ? `${c.courseName} (${p.requiredCourseId})` : p.requiredCourseId;
                })
                    .join(', ');
                throw new common_1.BadRequestException(`Prerequisite(s) not met for '${courseId}'. Missing: [${missing}]. You must pass these courses first.`);
            }
        }
        if (term) {
            const currentCredits = this.db.registrations
                .filter(r => r.studentId === studentId &&
                r.termId === termId &&
                (r.status === 'Enrolled' || r.status === 'Waitlisted' || r.status === 'Pending_Allocation'))
                .reduce((sum, r) => {
                const c = this.db.courseCatalog.find(cc => cc.courseId === r.courseId);
                return sum + (c ? c.credits : 0);
            }, 0);
            if (currentCredits + course.credits > term.maxCreditLimit) {
                throw new common_1.BadRequestException(`Adding '${courseId}' (${course.credits} cr) would exceed the max credit limit of ${term.maxCreditLimit} for '${term.termName}'. Current: ${currentCredits} credits.`);
            }
        }
        const enrolledCount = this.db.registrations.filter(r => r.courseId === courseId && r.termId === termId && r.status === 'Enrolled').length;
        if (enrolledCount >= course.courseCapacity) {
            throw new common_1.BadRequestException(`No seats left in '${courseId}'. Capacity is ${course.courseCapacity}. Please request an override.`);
        }
        const status = 'Enrolled';
        const maxId = this.db.registrations.reduce((max, r) => Math.max(max, r.enrollmentId), 0);
        const registration = {
            enrollmentId: maxId + 1,
            studentId,
            courseId,
            termId,
            sectionId: null,
            status,
            finalGrade: null,
        };
        this.db.registrations.push(registration);
        return registration;
    }
    updateGrade(id, finalGrade) {
        const registration = this.db.registrations.find(r => r.enrollmentId === id);
        if (!registration) {
            throw new common_1.NotFoundException(`Registration with ID ${id} not found.`);
        }
        registration.finalGrade = finalGrade;
        return registration;
    }
};
exports.RegistrationsService = RegistrationsService;
exports.RegistrationsService = RegistrationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], RegistrationsService);
//# sourceMappingURL=registrations.service.js.map