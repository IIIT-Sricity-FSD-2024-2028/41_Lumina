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
exports.CourseSlotsController = void 0;
const common_1 = require("@nestjs/common");
const course_slots_service_1 = require("./course-slots.service");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const swagger_1 = require("@nestjs/swagger");
let CourseSlotsController = class CourseSlotsController {
    courseSlotsService;
    constructor(courseSlotsService) {
        this.courseSlotsService = courseSlotsService;
    }
    findAll() {
        return this.courseSlotsService.findAll();
    }
    create(data) {
        return this.courseSlotsService.create(data);
    }
    update(id, data) {
        return this.courseSlotsService.update(Number(id), data);
    }
    remove(id) {
        return this.courseSlotsService.remove(Number(id));
    }
};
exports.CourseSlotsController = CourseSlotsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('Assistant_Dean_1', 'Dean', 'Faculty', 'Student', 'Assistant_Dean_2'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CourseSlotsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('Assistant_Dean_1', 'Dean'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CourseSlotsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('Assistant_Dean_1', 'Dean'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CourseSlotsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('Assistant_Dean_1', 'Dean'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CourseSlotsController.prototype, "remove", null);
exports.CourseSlotsController = CourseSlotsController = __decorate([
    (0, swagger_1.ApiTags)('CourseSlots'),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true }),
    (0, common_1.Controller)('course-slots'),
    __metadata("design:paramtypes", [course_slots_service_1.CourseSlotsService])
], CourseSlotsController);
//# sourceMappingURL=course-slots.controller.js.map