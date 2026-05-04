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
exports.EnrollmentPhasesController = void 0;
const common_1 = require("@nestjs/common");
const enrollment_phases_service_1 = require("./enrollment-phases.service");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const swagger_1 = require("@nestjs/swagger");
let EnrollmentPhasesController = class EnrollmentPhasesController {
    phasesService;
    constructor(phasesService) {
        this.phasesService = phasesService;
    }
    findAll() {
        return this.phasesService.findAll();
    }
    create(data) {
        return this.phasesService.create(data);
    }
    update(id, data) {
        return this.phasesService.update(Number(id), data);
    }
    remove(id) {
        return this.phasesService.remove(Number(id));
    }
};
exports.EnrollmentPhasesController = EnrollmentPhasesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('Assistant_Dean_2', 'Dean', 'Student'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EnrollmentPhasesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('Assistant_Dean_2', 'Dean'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EnrollmentPhasesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('Assistant_Dean_2', 'Dean'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EnrollmentPhasesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('Assistant_Dean_2', 'Dean'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EnrollmentPhasesController.prototype, "remove", null);
exports.EnrollmentPhasesController = EnrollmentPhasesController = __decorate([
    (0, swagger_1.ApiTags)('EnrollmentPhases'),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true }),
    (0, common_1.Controller)('enrollment-phases'),
    __metadata("design:paramtypes", [enrollment_phases_service_1.EnrollmentPhasesService])
], EnrollmentPhasesController);
//# sourceMappingURL=enrollment-phases.controller.js.map