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
exports.AnnouncementsController = void 0;
const common_1 = require("@nestjs/common");
const announcements_service_1 = require("./announcements.service");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const swagger_1 = require("@nestjs/swagger");
let AnnouncementsController = class AnnouncementsController {
    announcementsService;
    constructor(announcementsService) {
        this.announcementsService = announcementsService;
    }
    findAll() {
        return this.announcementsService.findAll();
    }
    create(userId, data) {
        const facultyId = userId || 'F2024001';
        return this.announcementsService.create(facultyId, data);
    }
    update(id, data) {
        return this.announcementsService.update(parseInt(id, 10), data);
    }
    delete(id) {
        return this.announcementsService.delete(parseInt(id, 10));
    }
};
exports.AnnouncementsController = AnnouncementsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('Faculty', 'Student', 'Dean', 'Assistant_Dean_1', 'Assistant_Dean_2'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all announcements', description: 'Returns all announcements. Accessible to all roles.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of announcements.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AnnouncementsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('Faculty', 'Dean'),
    (0, swagger_1.ApiOperation)({ summary: 'Create an announcement', description: 'Creates a new announcement. Faculty and Dean only.' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Announcement created.' }),
    __param(0, (0, common_1.Headers)('x-user-id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AnnouncementsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('Faculty', 'Dean'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an announcement', description: 'Updates an existing announcement. Faculty and Dean only.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Announcement updated.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AnnouncementsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('Faculty', 'Dean'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an announcement', description: 'Deletes an announcement. Faculty and Dean only.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Announcement deleted.' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AnnouncementsController.prototype, "delete", null);
exports.AnnouncementsController = AnnouncementsController = __decorate([
    (0, swagger_1.ApiTags)('Announcements'),
    (0, swagger_1.ApiHeader)({ name: 'x-role', required: true }),
    (0, common_1.Controller)('announcements'),
    __metadata("design:paramtypes", [announcements_service_1.AnnouncementsService])
], AnnouncementsController);
//# sourceMappingURL=announcements.controller.js.map