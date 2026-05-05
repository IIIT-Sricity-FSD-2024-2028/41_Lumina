import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto } from '../common/dto';
export declare class CoursesController {
    private readonly coursesService;
    constructor(coursesService: CoursesService);
    findAll(): import("../database").CourseCatalog[];
    findAllPrerequisites(): import("../database").CoursePrerequisite[];
    getCoursesForStudent(studentId: string): {
        currentSemester: number;
        activeTerm: string;
        courses: {
            course: import("../database").CourseCatalog;
            sections: import("../database").Section[];
            courseType: string;
        }[];
    };
    create(createCourseDto: CreateCourseDto): import("../database").CourseCatalog;
    update(id: string, updateCourseDto: UpdateCourseDto): import("../database").CourseCatalog;
}
