import type { CourseStatus } from '../../database/interfaces';
export declare class CreateCourseDto {
    courseId: string;
    courseName: string;
    credits: number;
    courseCapacity: number;
    status: CourseStatus;
    deptId: string;
}
