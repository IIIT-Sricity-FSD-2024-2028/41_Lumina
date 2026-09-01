import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Registration } from '../database/interfaces';

@Injectable()
export class RegistrationsService {
  constructor(private readonly db: DatabaseService) {}

  findAll(): Registration[] {
    return this.db.registrations;
  }

  /**
   * Determine the currently active academic term based on today's date.
   * Falls back to the last term if none is currently open.
   */
  private getActiveTermId(): string {
    const now = new Date();
    const activeTerm = this.db.academicTerms.find(t => {
      const start = new Date(t.startTimestamp);
      const end = new Date(t.endTimestamp);
      return now >= start && now <= end;
    });
    if (activeTerm) return activeTerm.termId;

    // Fallback: use the most recent term
    const sorted = [...this.db.academicTerms].sort(
      (a, b) => new Date(b.startTimestamp).getTime() - new Date(a.startTimestamp).getTime(),
    );
    return sorted.length > 0 ? sorted[0].termId : 'SPRING2026';
  }

  /**
   * Enroll a student in a course with full domain constraint enforcement:
   * 1. Course existence check
   * 2. Duplicate enrollment check (same course + term)
   * 3. Registration window check (Academic_Term timestamps)
   * 4. Prerequisite validation (Course_Prerequisite vs past PASSING records)
   * 5. Credit limit check (Max_Credit_Limit for the term)
   * 6. Capacity check (Enrolled vs Waitlisted)
   */
  enroll(studentId: string, courseId: string): Registration {
    // ── 0. Tenant Lifecycle Check ────────────────────────────
    if (
      this.db.activeInstitutePlan?.status === 'Read_Only_Grace_Period' ||
      this.db.activeInstitutePlan?.status === 'Suspended'
    ) {
      throw new BadRequestException(
        'Operation locked: Institution subscription is in 60-Day Read-Only Grace Period. Course registration is disabled until license reactivation.',
      );
    }

    // ── 0.5 Student Semester Tuition Clearance Check (B2C Model) ──
    const payment = this.db.studentPaymentLedger[studentId];
    const isCleared = payment ? (payment.status === 'Cleared' || payment.status === 'Waived') : false;
    if (!isCleared) {
      const balance = payment ? Math.max(0, payment.totalSemesterFee - payment.amountPaid) : 2500;
      throw new BadRequestException(
        `Financial Hold Active: Semester tuition fee ($${balance}) is unpaid. Course registration is disabled until semester fee clearance.`,
      );
    }

    const termId = this.getActiveTermId();

    // ── 1. Course existence ──────────────────────────────────
    const course = this.db.courseCatalog.find(c => c.courseId === courseId);
    if (!course) {
      throw new NotFoundException(`Course '${courseId}' not found in the catalog.`);
    }

    // ── 2. Duplicate check (same course + term) ──────────────
    const duplicate = this.db.registrations.find(
      r =>
        r.studentId === studentId &&
        r.courseId === courseId &&
        r.termId === termId &&
        (r.status === 'Enrolled' || r.status === 'Waitlisted' || r.status === 'Pending_Allocation'),
    );
    if (duplicate) {
      throw new BadRequestException(
        `Student '${studentId}' is already registered for '${courseId}' in term '${termId}' (Status: ${duplicate.status}).`,
      );
    }

    // ── 3. System & Window Status check ─────────────────────
    const policy = this.db.policySettings;
    if (policy.systemStatus === 'Deactivated') {
      throw new BadRequestException('Enrollment system is currently deactivated.');
    }
    if (policy.windowStatus === 'Closed') {
      throw new BadRequestException('Enrollment window is currently closed.');
    }
    if (policy.windowStatus === 'Paused') {
      throw new BadRequestException('Enrollment is currently paused.');
    }

    // ── 3b. Phase-Driven Enrollment check ─────────────────────
    const activePhase = this.db.enrollmentPhases.find(p => p.status === 'Active');
    if (!activePhase) {
      throw new BadRequestException('Enrollment is currently closed. No active phase.');
    }

    const student = this.db.students.find(s => s.studentId === studentId);
    if (!student) {
      throw new BadRequestException(`Student '${studentId}' not found.`);
    }

    let isEligible = false;
    const sem = student.currentSemester;
    const groups = activePhase.eligibleGroups;

    if (groups === 'All Students') isEligible = true;
    else if (groups === 'Final Year' && (sem >= 7)) isEligible = true;
    else if (groups === '3rd Year' && (sem === 5 || sem === 6)) isEligible = true;
    else if (groups === '2nd Year' && (sem === 3 || sem === 4)) isEligible = true;
    else if (groups === '1st Year' && (sem === 1 || sem === 2)) isEligible = true;
    else if (groups === 'Backlog Students') {
      const hasBacklog = this.db.registrations.some(r => r.studentId === studentId && r.finalGrade === 'F');
      if (hasBacklog) isEligible = true;
    }

    if (!isEligible) {
      throw new BadRequestException(`You are not eligible to enroll during the current phase: '${activePhase.name}' (Eligible: ${groups}).`);
    }

    const term = this.db.academicTerms.find(t => t.termId === termId);

    // ── 4. Prerequisite validation ───────────────────────────
    // Only enforced if policy.enforcePrereq is true
    if (policy.enforcePrereq) {
      const prereqs = this.db.coursePrerequisites.filter(
        p => p.targetCourseId === courseId,
      );
      if (prereqs.length > 0) {
        const passedCourses = this.db.registrations
          .filter(
            r =>
              r.studentId === studentId &&
              r.finalGrade !== null &&
              r.finalGrade !== 'F',
          )
          .map(r => r.courseId);

        const missingPrereqs = prereqs.filter(
          p => !passedCourses.includes(p.requiredCourseId),
        );

        if (missingPrereqs.length > 0) {
          const missing = missingPrereqs
            .map(p => {
              const c = this.db.courseCatalog.find(cc => cc.courseId === p.requiredCourseId);
              return c ? `${c.courseName} (${p.requiredCourseId})` : p.requiredCourseId;
            })
            .join(', ');
          throw new BadRequestException(
            `Prerequisite(s) not met for '${courseId}'. Missing: [${missing}]. You must pass these courses first.`,
          );
        }
      }
    }

    // ── 5. Credit limit check ────────────────────────────────
    const maxCreditLimit = policy.maxCredits || (term ? term.maxCreditLimit : 22);
    const currentCredits = this.db.registrations
      .filter(
        r =>
          r.studentId === studentId &&
          r.termId === termId &&
          (r.status === 'Enrolled' || r.status === 'Waitlisted' || r.status === 'Pending_Allocation'),
      )
      .reduce((sum, r) => {
        const c = this.db.courseCatalog.find(cc => cc.courseId === r.courseId);
        return sum + (c ? c.credits : 0);
      }, 0);

    if (currentCredits + course.credits > maxCreditLimit) {
      throw new BadRequestException(
        `Adding '${courseId}' (${course.credits} cr) would exceed the max credit limit of ${maxCreditLimit} for '${term ? term.termName : termId}'. Current: ${currentCredits} credits.`,
      );
    }

    // ── 6. Capacity check → Enrolled or Waitlisted ──────────
    const enrolledCount = this.db.registrations.filter(
      r => r.courseId === courseId && r.termId === termId && r.status === 'Enrolled',
    ).length;

    if (enrolledCount >= course.courseCapacity) {
      throw new BadRequestException(`No seats left in '${courseId}'. Capacity is ${course.courseCapacity}. Please request an override.`);
    }

    const status = 'Enrolled';

    // ── Generate next enrollment ID ──────────────────────────
    const maxId = this.db.registrations.reduce(
      (max, r) => Math.max(max, r.enrollmentId),
      0,
    );

    const registration: Registration = {
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

  updateGrade(id: number, finalGrade: string): Registration {
    if (
      this.db.activeInstitutePlan?.status === 'Read_Only_Grace_Period' ||
      this.db.activeInstitutePlan?.status === 'Suspended'
    ) {
      throw new BadRequestException(
        'Operation locked: Institution subscription is in 60-Day Read-Only Grace Period. Grade submission is disabled until license reactivation.',
      );
    }
    const registration = this.db.registrations.find(r => r.enrollmentId === id);
    if (!registration) {
      throw new NotFoundException(`Registration with ID ${id} not found.`);
    }
    registration.finalGrade = finalGrade;
    return registration;
  }

  /**
   * Assign a section to a single registration.
   * Validates that both the registration and the section exist,
   * and that the section belongs to the same course as the registration.
   */
  assignSection(enrollmentId: number, sectionId: string): Registration {
    const registration = this.db.registrations.find(r => r.enrollmentId === enrollmentId);
    if (!registration) {
      throw new NotFoundException(`Registration with ID ${enrollmentId} not found.`);
    }

    const section = this.db.sections.find(s => s.sectionId === sectionId);
    if (!section) {
      throw new NotFoundException(`Section '${sectionId}' not found.`);
    }

    if (section.courseId !== registration.courseId) {
      throw new BadRequestException(
        `Section '${sectionId}' belongs to course '${section.courseId}', but registration ${enrollmentId} is for course '${registration.courseId}'.`,
      );
    }

    registration.sectionId = sectionId;
    return registration;
  }

  /**
   * Batch-assign sections to multiple registrations in one call.
   * Each assignment is validated independently. A sectionId of null unassigns the student.
   * Returns a summary with successes and failures so Dean 1 can see what happened.
   */
  batchAssignSections(
    assignments: { enrollmentId: number; sectionId: string | null }[],
  ): { updated: Registration[]; errors: { enrollmentId: number; error: string }[] } {
    const updated: Registration[] = [];
    const errors: { enrollmentId: number; error: string }[] = [];

    for (const assignment of assignments) {
      const registration = this.db.registrations.find(
        r => r.enrollmentId === assignment.enrollmentId,
      );
      if (!registration) {
        errors.push({
          enrollmentId: assignment.enrollmentId,
          error: `Registration with ID ${assignment.enrollmentId} not found.`,
        });
        continue;
      }

      // Allow null to unassign
      if (assignment.sectionId === null) {
        registration.sectionId = null;
        updated.push(registration);
        continue;
      }

      const section = this.db.sections.find(s => s.sectionId === assignment.sectionId);
      if (!section) {
        errors.push({
          enrollmentId: assignment.enrollmentId,
          error: `Section '${assignment.sectionId}' not found.`,
        });
        continue;
      }

      if (section.courseId !== registration.courseId) {
        errors.push({
          enrollmentId: assignment.enrollmentId,
          error: `Section '${assignment.sectionId}' belongs to course '${section.courseId}', not '${registration.courseId}'.`,
        });
        continue;
      }

      registration.sectionId = assignment.sectionId;
      updated.push(registration);
    }

    return { updated, errors };
  }

  /**
   * Batch update grades for multiple registrations in one atomic operation.
   * Returns list of updated registrations and any individual errors encountered.
   */
  batchUpdateGrades(
    gradeSubmissions: { enrollmentId: number; finalGrade: string }[],
  ): { updated: Registration[]; errors: { enrollmentId: number; error: string }[] } {
    const updated: Registration[] = [];
    const errors: { enrollmentId: number; error: string }[] = [];

    for (const item of gradeSubmissions) {
      const registration = this.db.registrations.find(
        r => r.enrollmentId === item.enrollmentId,
      );
      if (!registration) {
        errors.push({
          enrollmentId: item.enrollmentId,
          error: `Registration with ID ${item.enrollmentId} not found.`,
        });
        continue;
      }

      registration.finalGrade = item.finalGrade;
      updated.push(registration);
    }

    return { updated, errors };
  }
}
