import { DatabaseService } from '../database/database.service';
import { EnrollmentPhase } from '../database/interfaces';
export declare class EnrollmentPhasesService {
    private readonly db;
    constructor(db: DatabaseService);
    findAll(): EnrollmentPhase[];
    create(data: Omit<EnrollmentPhase, 'id'>): EnrollmentPhase;
    update(id: number, data: Partial<EnrollmentPhase>): EnrollmentPhase;
    remove(id: number): {
        success: boolean;
    };
}
