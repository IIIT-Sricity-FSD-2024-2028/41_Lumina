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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database.service");
let UsersService = class UsersService {
    db;
    constructor(db) {
        this.db = db;
    }
    findAll() {
        return this.db.users;
    }
    create(data) {
        if (this.db.users.some(u => u.userId === data.userId)) {
            throw new common_1.BadRequestException(`User ID '${data.userId}' already exists.`);
        }
        const newUser = {
            userId: data.userId,
            fullName: data.fullName,
            email: data.email,
            password: data.password,
            role: data.role,
            deptId: data.deptId,
        };
        this.db.users.push(newUser);
        return newUser;
    }
    update(userId, data) {
        const user = this.db.users.find(u => u.userId === userId);
        if (!user) {
            throw new common_1.NotFoundException(`User '${userId}' not found.`);
        }
        if (data.fullName !== undefined)
            user.fullName = data.fullName;
        if (data.email !== undefined)
            user.email = data.email;
        if (data.role !== undefined)
            user.role = data.role;
        if (data.deptId !== undefined)
            user.deptId = data.deptId;
        return user;
    }
    delete(userId) {
        const index = this.db.users.findIndex(u => u.userId === userId);
        if (index === -1) {
            throw new common_1.NotFoundException(`User '${userId}' not found.`);
        }
        this.db.users.splice(index, 1);
        return { deleted: true };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], UsersService);
//# sourceMappingURL=users.service.js.map