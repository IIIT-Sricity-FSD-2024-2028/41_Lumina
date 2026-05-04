"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const database_module_1 = require("./database/database.module");
const roles_guard_1 = require("./common/guards/roles.guard");
const users_module_1 = require("./database/users/users.module");
const auth_module_1 = require("./auth/auth.module");
const courses_module_1 = require("./courses/courses.module");
const registrations_module_1 = require("./registrations/registrations.module");
const overrides_module_1 = require("./overrides/overrides.module");
const announcements_module_1 = require("./announcements/announcements.module");
const sections_module_1 = require("./sections/sections.module");
const course_slots_module_1 = require("./course-slots/course-slots.module");
const enrollment_phases_module_1 = require("./enrollment-phases/enrollment-phases.module");
const degree_requirements_module_1 = require("./degree-requirements/degree-requirements.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            database_module_1.DatabaseModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            courses_module_1.CoursesModule,
            registrations_module_1.RegistrationsModule,
            overrides_module_1.OverridesModule,
            announcements_module_1.AnnouncementsModule,
            sections_module_1.SectionsModule,
            course_slots_module_1.CourseSlotsModule,
            enrollment_phases_module_1.EnrollmentPhasesModule,
            degree_requirements_module_1.DegreeRequirementsModule,
        ],
        controllers: [],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map