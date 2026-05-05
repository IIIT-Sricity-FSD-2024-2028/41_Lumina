import { CourseSlotsService } from './course-slots.service';
export declare class CourseSlotsController {
    private readonly courseSlotsService;
    constructor(courseSlotsService: CourseSlotsService);
    findAll(): import("../database").CourseSlot[];
    create(data: any): import("../database").CourseSlot;
    update(id: string, data: any): import("../database").CourseSlot;
    remove(id: string): {
        success: boolean;
    };
}
