import { RegistrationsService } from './registrations.service';
import { EnrollCourseDto } from '../common/dto/enroll-course.dto';
import { UpdateGradeDto } from '../common/dto/update-grade.dto';
export declare class RegistrationsController {
    private readonly registrationsService;
    constructor(registrationsService: RegistrationsService);
    findAll(): import("../database").Registration[];
    enroll(dto: EnrollCourseDto): import("../database").Registration;
    updateGrade(id: number, dto: UpdateGradeDto): import("../database").Registration;
}
