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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DegreeRequirementsController = void 0;
const common_1 = require("@nestjs/common");
const degree_requirements_service_1 = require("./degree-requirements.service");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const swagger_1 = require("@nestjs/swagger");
let DegreeRequirementsController = class DegreeRequirementsController {
    drService;
    constructor(drService) {
        this.drService = drService;
    }
    findAll() {
        return this.drService.findAll();
    }
};
exports.DegreeRequirementsController = DegreeRequirementsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('Assistant_Dean_1', 'Dean', 'Faculty', 'Student', 'Assistant_Dean_2'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DegreeRequirementsController.prototype, "findAll", null);
exports.DegreeRequirementsController = DegreeRequirementsController = __decorate([
    (0, swagger_1.ApiTags)('Degree Requirements'),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true }),
    (0, common_1.Controller)('degree-requirements'),
    __metadata("design:paramtypes", [degree_requirements_service_1.DegreeRequirementsService])
], DegreeRequirementsController);
//# sourceMappingURL=degree-requirements.controller.js.map