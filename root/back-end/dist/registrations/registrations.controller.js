"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const registrations_service_1 = require("./registrations.service");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const enroll_course_dto_1 = require("../common/dto/enroll-course.dto");
const update_grade_dto_1 = require("../common/dto/update-grade.dto");
let RegistrationsController = class RegistrationsController {
    registrationsService;
    constructor(registrationsService) {
        this.registrationsService = registrationsService;
    }
    findAll() {
        return this.registrationsService.findAll();
    }
    enroll(dto) {
        return this.registrationsService.enroll(dto.Student_ID, dto.Course_ID);
    }
    updateGrade(id, dto) {
        return this.registrationsService.updateGrade(id, dto.finalGrade);
    }
};
exports.RegistrationsController = RegistrationsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('Dean', 'Assistant_Dean_1', 'Assistant_Dean_2', 'Faculty'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all registrations' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of all registration records.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RegistrationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('Student'),
    (0, swagger_1.ApiOperation)({ summary: 'Enroll in a course', description: 'Full constraint validation: duplicate, window, prerequisites, credit limit, capacity.' }),
    (0, swagger_1.ApiBody)({ type: enroll_course_dto_1.EnrollCourseDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Registration created (Enrolled or Waitlisted).' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Domain constraint violation.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Course not found.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [enroll_course_dto_1.EnrollCourseDto]),
    __metadata("design:returntype", void 0)
], RegistrationsController.prototype, "enroll", null);
__decorate([
    (0, common_1.Patch)(':id/grade'),
    (0, roles_decorator_1.Roles)('Faculty', 'Dean'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit final grade' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Enrollment ID', type: Number }),
    (0, swagger_1.ApiBody)({ type: update_grade_dto_1.UpdateGradeDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Grade updated successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Registration not found.' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_grade_dto_1.UpdateGradeDto]),
    __metadata("design:returntype", void 0)
], RegistrationsController.prototype, "updateGrade", null);
exports.RegistrationsController = RegistrationsController = __decorate([
    (0, swagger_1.ApiTags)('Registrations'),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, description: 'Role of the requesting user' }),
    (0, common_1.Controller)('registrations'),
    __metadata("design:paramtypes", [registrations_service_1.RegistrationsService])
], RegistrationsController);
//# sourceMappingURL=registrations.controller.js.map