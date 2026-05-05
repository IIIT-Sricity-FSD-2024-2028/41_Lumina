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
exports.CourseSlotsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
let CourseSlotsService = class CourseSlotsService {
    db;
    constructor(db) {
        this.db = db;
    }
    findAll() {
        return this.db.courseSlots;
    }
    create(data) {
        const maxId = this.db.courseSlots.reduce((max, s) => Math.max(max, s.slotId), 0);
        const newSlot = { slotId: maxId + 1, ...data };
        this.db.courseSlots.push(newSlot);
        return newSlot;
    }
    update(slotId, data) {
        const slot = this.db.courseSlots.find(s => s.slotId === Number(slotId));
        if (!slot)
            throw new common_1.NotFoundException(`Course Slot ${slotId} not found`);
        Object.assign(slot, data);
        return slot;
    }
    remove(slotId) {
        this.db.courseSlots = this.db.courseSlots.filter(s => s.slotId !== Number(slotId));
        return { success: true };
    }
};
exports.CourseSlotsService = CourseSlotsService;
exports.CourseSlotsService = CourseSlotsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], CourseSlotsService);
//# sourceMappingURL=course-slots.service.js.map