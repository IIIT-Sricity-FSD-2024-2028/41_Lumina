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
exports.AnnouncementsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
let AnnouncementsService = class AnnouncementsService {
    db;
    constructor(db) {
        this.db = db;
    }
    findAll() {
        return this.db.announcements;
    }
    create(facultyId, data) {
        const maxId = this.db.announcements.reduce((max, a) => Math.max(max, a.announcementId), 0);
        const newAnnouncement = {
            announcementId: maxId + 1,
            facultyId,
            courseId: data.courseId,
            title: data.title,
            message: data.message,
            createdAt: new Date().toISOString()
        };
        this.db.announcements.unshift(newAnnouncement);
        return newAnnouncement;
    }
    update(id, data) {
        const idx = this.db.announcements.findIndex(a => a.announcementId === id);
        if (idx === -1) {
            throw new common_1.NotFoundException(`Announcement ${id} not found`);
        }
        this.db.announcements[idx] = {
            ...this.db.announcements[idx],
            courseId: data.courseId,
            title: data.title,
            message: data.message
        };
        return this.db.announcements[idx];
    }
    delete(id) {
        const idx = this.db.announcements.findIndex(a => a.announcementId === id);
        if (idx === -1) {
            throw new common_1.NotFoundException(`Announcement ${id} not found`);
        }
        this.db.announcements.splice(idx, 1);
        return { success: true };
    }
};
exports.AnnouncementsService = AnnouncementsService;
exports.AnnouncementsService = AnnouncementsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], AnnouncementsService);
//# sourceMappingURL=announcements.service.js.map