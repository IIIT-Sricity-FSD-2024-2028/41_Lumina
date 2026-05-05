import { DatabaseService } from '../database/database.service';
import { DegreeRequirement } from '../database/interfaces';
export declare class DegreeRequirementsService {
    private readonly db;
    constructor(db: DatabaseService);
    findAll(): DegreeRequirement[];
    findByDept(deptId: string): DegreeRequirement[];
    findBySemester(semester: number): DegreeRequirement[];
}
