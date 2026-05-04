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
exports.EnrollmentPhasesService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
let EnrollmentPhasesService = class EnrollmentPhasesService {
    db;
    constructor(db) {
        this.db = db;
    }
    findAll() {
        return this.db.enrollmentPhases;
    }
    create(data) {
        const maxId = this.db.enrollmentPhases.reduce((max, p) => Math.max(max, p.id), 0);
        const newPhase = { id: maxId + 1, ...data };
        if (data.status === 'Active') {
            this.db.enrollmentPhases.forEach(p => { if (p.status === 'Active')
                p.status = 'Upcoming'; });
        }
        this.db.enrollmentPhases.push(newPhase);
        return newPhase;
    }
    update(id, data) {
        const phase = this.db.enrollmentPhases.find(p => p.id === Number(id));
        if (!phase)
            throw new common_1.NotFoundException(`Phase ${id} not found`);
        if (data.status === 'Active') {
            this.db.enrollmentPhases.forEach(p => { if (p.status === 'Active')
                p.status = 'Upcoming'; });
        }
        Object.assign(phase, data);
        return phase;
    }
    remove(id) {
        this.db.enrollmentPhases = this.db.enrollmentPhases.filter(p => p.id !== Number(id));
        return { success: true };
    }
};
exports.EnrollmentPhasesService = EnrollmentPhasesService;
exports.EnrollmentPhasesService = EnrollmentPhasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], EnrollmentPhasesService);
//# sourceMappingURL=enrollment-phases.service.js.map