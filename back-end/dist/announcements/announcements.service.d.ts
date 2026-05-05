import { DatabaseService } from '../database/database.service';
import { Announcement } from '../database/interfaces';
export declare class AnnouncementsService {
    private readonly db;
    constructor(db: DatabaseService);
    findAll(): Announcement[];
    create(facultyId: string, data: {
        courseId: string;
        title: string;
        message: string;
    }): Announcement;
    update(id: number, data: {
        courseId: string;
        title: string;
        message: string;
    }): Announcement;
    delete(id: number): {
        success: boolean;
    };
}
