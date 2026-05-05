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
exports.CoursesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const courses_service_1 = require("./courses.service");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const dto_1 = require("../common/dto");
let CoursesController = class CoursesController {
    coursesService;
    constructor(coursesService) {
        this.coursesService = coursesService;
    }
    findAll() {
        return this.coursesService.findAll();
    }
    findAllPrerequisites() {
        return this.coursesService.findAllPrerequisites();
    }
    getCoursesForStudent(studentId) {
        return this.coursesService.getCoursesForStudent(studentId);
    }
    create(createCourseDto) {
        return this.coursesService.create(createCourseDto);
    }
    update(id, updateCourseDto) {
        return this.coursesService.update(id, updateCourseDto);
    }
};
exports.CoursesController = CoursesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('Student', 'Faculty', 'Dean', 'Assistant_Dean_1', 'Assistant_Dean_2'),
    (0, swagger_1.ApiOperation)({ summary: 'Get course catalog', description: 'Returns the full course catalog. Accessible to all authenticated roles.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Course catalog returned successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — missing or unauthorized x-role header.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('prerequisites'),
    (0, roles_decorator_1.Roles)('Student', 'Faculty', 'Dean', 'Assistant_Dean_1', 'Assistant_Dean_2'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all course prerequisites', description: 'Returns all prerequisite mappings.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Prerequisites returned successfully.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "findAllPrerequisites", null);
__decorate([
    (0, common_1.Get)('for-student/:studentId'),
    (0, roles_decorator_1.Roles)('Student', 'Dean', 'Assistant_Dean_1', 'Assistant_Dean_2'),
    (0, swagger_1.ApiOperation)({ summary: 'Get enrollable courses for a student', description: 'Returns courses for the student\'s current semester that have sections in the active term. Read-only.' }),
    (0, swagger_1.ApiParam)({ name: 'studentId', description: 'Student ID', example: 'S2024001' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Courses with sections returned.' }),
    __param(0, (0, common_1.Param)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "getCoursesForStudent", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('Assistant_Dean_1', 'Dean'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new course', description: 'Adds a new course to the catalog. Restricted to AD1 and Dean.' }),
    (0, swagger_1.ApiBody)({ type: dto_1.CreateCourseDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Course created successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateCourseDto]),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('Assistant_Dean_1', 'Dean'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a course', description: 'Updates an existing course. Restricted to AD1 and Dean.' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Course ID', example: 'CS101' }),
    (0, swagger_1.ApiBody)({ type: dto_1.UpdateCourseDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Course updated successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Course not found.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateCourseDto]),
    __metadata("design:returntype", void 0)
], CoursesController.prototype, "update", null);
exports.CoursesController = CoursesController = __decorate([
    (0, swagger_1.ApiTags)('Courses'),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, description: 'Role of the requesting user' }),
    (0, common_1.Controller)('courses'),
    __metadata("design:paramtypes", [courses_service_1.CoursesService])
], CoursesController);
//# sourceMappingURL=courses.controller.js.map