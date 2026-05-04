import { DatabaseService } from '../database/database.service';
import { Registration } from '../database/interfaces';
export declare class RegistrationsService {
    private readonly db;
    constructor(db: DatabaseService);
    findAll(): Registration[];
    private getActiveTermId;
    enroll(studentId: string, courseId: string): Registration;
    updateGrade(id: number, finalGrade: string): Registration;
}
