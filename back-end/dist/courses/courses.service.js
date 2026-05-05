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
exports.CoursesService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
let CoursesService = class CoursesService {
    db;
    constructor(db) {
        this.db = db;
    }
    normalizeSemester(semester) {
        return String(semester || 'Spring').trim().toLowerCase() === 'monsoon'
            ? 'Monsoon'
            : 'Spring';
    }
    normalizeCourseType(courseType) {
        if (courseType === 'Seed Course' || courseType === 'SEED')
            return 'SEED';
        if (courseType === 'Institute Core')
            return 'Institute Core';
        if (courseType === 'Elective')
            return 'Elective';
        return 'Program Core';
    }
    getTargetSemester(ugYear, semester) {
        const ugNum = parseInt(String(ugYear || 'UG1').replace('UG', ''), 10) || 1;
        return this.normalizeSemester(semester) === 'Spring' ? ugNum * 2 : ugNum * 2 - 1;
    }
    getLatestTermIdForSemester(semester) {
        const normalizedSemester = this.normalizeSemester(semester);
        const matchingTerms = this.db.academicTerms
            .filter(t => t.termName.toLowerCase().includes(normalizedSemester.toLowerCase()))
            .sort((a, b) => new Date(b.startTimestamp).getTime() - new Date(a.startTimestamp).getTime());
        return matchingTerms.length > 0
            ? matchingTerms[0].termId
            : (normalizedSemester === 'Monsoon' ? 'MONSOON2025' : 'SPRING2026');
    }
    findAll() {
        return this.db.courseCatalog;
    }
    create(dto) {
        const existing = this.db.courseCatalog.find(c => c.courseId === dto.courseId);
        if (existing) {
            throw new common_1.BadRequestException(`Course with ID ${dto.courseId} already exists.`);
        }
        const course = {
            courseId: dto.courseId,
            courseName: dto.courseName,
            credits: dto.credits,
            courseCapacity: dto.courseCapacity,
            status: dto.status,
            deptId: dto.deptId,
        };
        this.db.courseCatalog.push(course);
        if (dto.ugYear || dto.semester || dto.courseType) {
            const targetSemester = this.getTargetSemester(dto.ugYear, dto.semester);
            const courseType = this.normalizeCourseType(dto.courseType);
            const maxId = this.db.degreeRequirements.reduce((max, r) => Math.max(max, r.requirementId), 0);
            this.db.degreeRequirements.push({
                requirementId: maxId + 1,
                deptId: dto.deptId,
                courseId: dto.courseId,
                courseType,
                targetSemester,
            });
        }
        if (dto.prerequisites && dto.prerequisites.length > 0) {
            for (const prereqId of dto.prerequisites) {
                this.db.coursePrerequisites.push({
                    targetCourseId: dto.courseId,
                    requiredCourseId: prereqId,
                });
            }
        }
        const termId = this.getLatestTermIdForSemester(dto.semester);
        this.db.sections.push({
            sectionId: `${dto.courseId}-S1`,
            sectionName: 'S1',
            courseId: dto.courseId,
            termId: termId,
        });
        return course;
    }
    getCoursesForStudent(studentId) {
        const student = this.db.students.find(s => s.studentId === studentId);
        if (!student) {
            return { currentSemester: 0, activeTerm: '', courses: [] };
        }
        const user = this.db.users.find(u => u.userId === studentId);
        if (!user) {
            return { currentSemester: student.currentSemester, activeTerm: '', courses: [] };
        }
        const now = new Date();
        const activeTerm = this.db.academicTerms.find(t => {
            const start = new Date(t.startTimestamp);
            const end = new Date(t.endTimestamp);
            return now >= start && now <= end;
        }) ?? [...this.db.academicTerms].sort((a, b) => new Date(b.startTimestamp).getTime() - new Date(a.startTimestamp).getTime())[0];
        if (!activeTerm) {
            return { currentSemester: student.currentSemester, activeTerm: '', courses: [] };
        }
        const semesterReqs = this.db.degreeRequirements.filter(dr => dr.deptId === user.deptId && dr.targetSemester === student.currentSemester);
        const result = [];
        for (const req of semesterReqs) {
            const course = this.db.courseCatalog.find(c => c.courseId === req.courseId);
            if (!course || course.status !== 'Active')
                continue;
            const sectionsInTerm = this.db.sections.filter(s => s.courseId === req.courseId && s.termId === activeTerm.termId);
            if (sectionsInTerm.length === 0)
                continue;
            result.push({
                course,
                sections: sectionsInTerm,
                courseType: req.courseType,
            });
        }
        return {
            currentSemester: student.currentSemester,
            activeTerm: activeTerm.termName,
            courses: result,
        };
    }
    findAllPrerequisites() {
        return this.db.coursePrerequisites;
    }
    update(courseId, updates) {
        const courseIndex = this.db.courseCatalog.findIndex(c => c.courseId === courseId);
        if (courseIndex === -1) {
            throw new common_1.NotFoundException(`Course with ID ${courseId} not found.`);
        }
        this.db.courseCatalog[courseIndex] = { ...this.db.courseCatalog[courseIndex], ...updates };
        return this.db.courseCatalog[courseIndex];
    }
};
exports.CoursesService = CoursesService;
exports.CoursesService = CoursesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], CoursesService);
//# sourceMappingURL=courses.service.js.map