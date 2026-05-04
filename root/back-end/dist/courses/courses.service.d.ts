import { DatabaseService } from '../database/database.service';
import { CourseCatalog } from '../database/interfaces';
export declare class CoursesService {
    private readonly db;
    constructor(db: DatabaseService);
    findAll(): CourseCatalog[];
    create(course: CourseCatalog): CourseCatalog;
    getCoursesForStudent(studentId: string): {
        currentSemester: number;
        activeTerm: string;
        courses: {
            course: CourseCatalog;
            sections: import('../database/interfaces').Section[];
            courseType: string;
        }[];
    };
    update(courseId: string, updates: Partial<CourseCatalog>): CourseCatalog;
}
