import { DatabaseService } from '../database/database.service';
import { CourseCatalog, CoursePrerequisite } from '../database/interfaces';
import { CreateCourseDto } from '../common/dto';
export declare class CoursesService {
    private readonly db;
    constructor(db: DatabaseService);
    private normalizeSemester;
    private normalizeCourseType;
    private getTargetSemester;
    private getLatestTermIdForSemester;
    findAll(): CourseCatalog[];
    create(dto: CreateCourseDto): CourseCatalog;
    getCoursesForStudent(studentId: string): {
        currentSemester: number;
        activeTerm: string;
        courses: {
            course: CourseCatalog;
            sections: import('../database/interfaces').Section[];
            courseType: string;
        }[];
    };
    findAllPrerequisites(): CoursePrerequisite[];
    update(courseId: string, updates: Partial<CourseCatalog>): CourseCatalog;
}
