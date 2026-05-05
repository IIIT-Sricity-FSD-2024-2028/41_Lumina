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
exports.OverridesService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
let OverridesService = class OverridesService {
    db;
    constructor(db) {
        this.db = db;
    }
    findAll() {
        return this.db.overrideRequests;
    }
    findByStudent(studentId) {
        return this.db.overrideRequests.filter(r => r.studentId === studentId);
    }
    create(studentId, courseId, reason) {
        const maxId = this.db.overrideRequests.reduce((max, r) => Math.max(max, r.requestId), 0);
        const override = {
            requestId: maxId + 1,
            studentId,
            courseId,
            reason,
            approvalStatus: 'Pending',
            createdAt: new Date().toISOString(),
        };
        this.db.overrideRequests.push(override);
        return override;
    }
    getActiveTermId() {
        const now = new Date();
        const activeTerm = this.db.academicTerms.find(t => {
            const start = new Date(t.startTimestamp);
            const end = new Date(t.endTimestamp);
            return now >= start && now <= end;
        });
        if (activeTerm)
            return activeTerm.termId;
        const sorted = [...this.db.academicTerms].sort((a, b) => new Date(b.startTimestamp).getTime() - new Date(a.startTimestamp).getTime());
        return sorted.length > 0 ? sorted[0].termId : 'SPRING2026';
    }
    updateStatus(id, status) {
        const override = this.db.overrideRequests.find(r => r.requestId === id);
        if (!override) {
            throw new common_1.NotFoundException(`Override request with ID ${id} not found.`);
        }
        if (status === 'Approved' && override.approvalStatus !== 'Approved') {
            const termId = this.getActiveTermId();
            const duplicate = this.db.registrations.find(r => r.studentId === override.studentId &&
                r.courseId === override.courseId &&
                r.termId === termId &&
                (r.status === 'Enrolled' || r.status === 'Waitlisted'));
            if (!duplicate) {
                const maxId = this.db.registrations.reduce((max, r) => Math.max(max, r.enrollmentId), 0);
                this.db.registrations.push({
                    enrollmentId: maxId + 1,
                    studentId: override.studentId,
                    courseId: override.courseId,
                    termId,
                    sectionId: null,
                    status: 'Enrolled',
                    finalGrade: null,
                });
            }
        }
        else if (status === 'Rejected' && override.approvalStatus === 'Approved') {
            const termId = this.getActiveTermId();
            const regIndex = this.db.registrations.findIndex(r => r.studentId === override.studentId && r.courseId === override.courseId && r.termId === termId);
            if (regIndex !== -1) {
                this.db.registrations.splice(regIndex, 1);
            }
        }
        override.approvalStatus = status;
        return override;
    }
};
exports.OverridesService = OverridesService;
exports.OverridesService = OverridesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], OverridesService);
//# sourceMappingURL=overrides.service.js.map