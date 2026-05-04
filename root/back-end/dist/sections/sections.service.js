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
exports.SectionsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
let SectionsService = class SectionsService {
    db;
    constructor(db) {
        this.db = db;
    }
    findAll() {
        return this.db.sections;
    }
    create(data) {
        this.db.sections.push(data);
        return data;
    }
    update(sectionId, data) {
        const section = this.db.sections.find(s => s.sectionId === sectionId);
        if (!section)
            throw new common_1.NotFoundException(`Section ${sectionId} not found`);
        Object.assign(section, data);
        return section;
    }
    remove(sectionId) {
        this.db.sections = this.db.sections.filter(s => s.sectionId !== sectionId);
        return { success: true };
    }
};
exports.SectionsService = SectionsService;
exports.SectionsService = SectionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], SectionsService);
//# sourceMappingURL=sections.service.js.map