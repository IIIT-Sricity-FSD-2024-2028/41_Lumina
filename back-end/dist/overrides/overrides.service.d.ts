import { DatabaseService } from '../database/database.service';
import { OverrideRequest, ApprovalStatus } from '../database/interfaces';
export declare class OverridesService {
    private readonly db;
    constructor(db: DatabaseService);
    findAll(): OverrideRequest[];
    findByStudent(studentId: string): OverrideRequest[];
    create(studentId: string, courseId: string, reason: string): OverrideRequest;
    private getActiveTermId;
    updateStatus(id: number, status: ApprovalStatus): OverrideRequest;
}
