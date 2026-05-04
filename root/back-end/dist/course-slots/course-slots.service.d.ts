import { DatabaseService } from '../database/database.service';
import { CourseSlot } from '../database/interfaces';
export declare class CourseSlotsService {
    private readonly db;
    constructor(db: DatabaseService);
    findAll(): CourseSlot[];
    create(data: Omit<CourseSlot, 'slotId'>): CourseSlot;
    update(slotId: number, data: Partial<CourseSlot>): CourseSlot;
    remove(slotId: number): {
        success: boolean;
    };
}
