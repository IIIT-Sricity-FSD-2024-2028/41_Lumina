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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
let AuthService = class AuthService {
    db;
    constructor(db) {
        this.db = db;
    }
    login(userId, password) {
        const user = this.db.users.find(u => u.userId === userId && u.password === password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid Username or Password.');
        }
        const session = {
            User_ID: user.userId,
            Full_Name: user.fullName,
            Email: user.email,
            Role: user.role,
            Dept_ID: user.deptId,
        };
        if (user.role === 'Student') {
            const student = this.db.students.find(s => s.studentId === user.userId);
            if (student) {
                session.Current_Semester = student.currentSemester;
            }
        }
        return session;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], AuthService);
//# sourceMappingURL=auth.service.js.map