import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { OverrideRequest, ApprovalStatus } from '../database/interfaces';

@Injectable()
export class OverridesService {
  constructor(private readonly db: DatabaseService) {}

  findAll(): OverrideRequest[] {
    return this.db.overrideRequests;
  }

  findByStudent(studentId: string): OverrideRequest[] {
    return this.db.overrideRequests.filter(r => r.studentId === studentId);
  }

  create(studentId: string, courseId: string, reason: string): OverrideRequest {
    const maxId = this.db.overrideRequests.reduce(
      (max, r) => Math.max(max, r.requestId),
      0,
    );

    const override: OverrideRequest = {
      requestId: maxId + 1,
      studentId,
      courseId,
      reason,
      approvalStatus: 'Pending',
      createdAt: new Date().toISOString(),
    };

    this.db.overrideRequests.push(override);
    return override;
  }

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

  updateStatus(id: number, status: ApprovalStatus): OverrideRequest {
    const override = this.db.overrideRequests.find(r => r.requestId === id);
    if (!override) {
      throw new NotFoundException(`Override request with ID ${id} not found.`);
    }

    if (status === 'Approved' && override.approvalStatus !== 'Approved') {
      const termId = this.getActiveTermId();
      
      const duplicate = this.db.registrations.find(
        r =>
          r.studentId === override.studentId &&
          r.courseId === override.courseId &&
          r.termId === termId &&
          (r.status === 'Enrolled' || r.status === 'Waitlisted'),
      );

      if (!duplicate) {
        const maxId = this.db.registrations.reduce(
          (max, r) => Math.max(max, r.enrollmentId),
          0,
        );

        this.db.registrations.push({
          enrollmentId: maxId + 1,
          studentId: override.studentId,
          courseId: override.courseId,
          termId,
          sectionId: null,
          status: 'Enrolled',
          finalGrade: null,
        });
      }
    } else if (status === 'Rejected' && override.approvalStatus === 'Approved') {
      // Optional: Handle revocation by removing registration if desired
      const termId = this.getActiveTermId();
      const regIndex = this.db.registrations.findIndex(
        r => r.studentId === override.studentId && r.courseId === override.courseId && r.termId === termId
      );
      if (regIndex !== -1) {
        this.db.registrations.splice(regIndex, 1);
      }
    }

    override.approvalStatus = status;
    return override;
  }
}
