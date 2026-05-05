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
exports.OverridesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const overrides_service_1 = require("./overrides.service");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const create_override_dto_1 = require("../common/dto/create-override.dto");
const update_override_status_dto_1 = require("../common/dto/update-override-status.dto");
let OverridesController = class OverridesController {
    overridesService;
    constructor(overridesService) {
        this.overridesService = overridesService;
    }
    findAll() {
        return this.overridesService.findAll();
    }
    findByStudent(studentId) {
        return this.overridesService.findByStudent(studentId);
    }
    create(dto) {
        return this.overridesService.create(dto.Student_ID, dto.Course_ID, dto.Reason);
    }
    updateStatus(id, dto) {
        return this.overridesService.updateStatus(id, dto.Approval_Status);
    }
};
exports.OverridesController = OverridesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('Assistant_Dean_1', 'Assistant_Dean_2', 'Dean'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all override requests', description: 'Returns all administrative override requests. Requires: Assistant_Dean_1, Assistant_Dean_2, or Dean.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of override requests returned.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — missing or unauthorized x-role header.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OverridesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my/:studentId'),
    (0, roles_decorator_1.Roles)('Student'),
    (0, swagger_1.ApiOperation)({ summary: 'Get override requests for a student' }),
    (0, swagger_1.ApiParam)({ name: 'studentId', description: 'Student ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Student override requests returned.' }),
    __param(0, (0, common_1.Param)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OverridesController.prototype, "findByStudent", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('Student'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit an override request', description: 'Students submit an exception request for a course. Auto-sets status to Pending. Requires: Student.' }),
    (0, swagger_1.ApiBody)({ type: create_override_dto_1.CreateOverrideDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Override request created with Pending status.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error — invalid or missing fields.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — missing or unauthorized x-role header.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_override_dto_1.CreateOverrideDto]),
    __metadata("design:returntype", void 0)
], OverridesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)('Assistant_Dean_1', 'Assistant_Dean_2'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve or reject an override', description: 'Updates the approval status. Only Approved or Rejected are valid. Requires: Assistant_Dean_1 or Assistant_Dean_2.' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number, description: 'Override request ID' }),
    (0, swagger_1.ApiBody)({ type: update_override_status_dto_1.UpdateOverrideStatusDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Override status updated.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error — invalid status value.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — missing or unauthorized x-role header.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Override request not found.' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_override_status_dto_1.UpdateOverrideStatusDto]),
    __metadata("design:returntype", void 0)
], OverridesController.prototype, "updateStatus", null);
exports.OverridesController = OverridesController = __decorate([
    (0, swagger_1.ApiTags)('Overrides'),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true, description: 'Role of the requesting user' }),
    (0, common_1.Controller)('overrides'),
    __metadata("design:paramtypes", [overrides_service_1.OverridesService])
], OverridesController);
//# sourceMappingURL=overrides.controller.js.map