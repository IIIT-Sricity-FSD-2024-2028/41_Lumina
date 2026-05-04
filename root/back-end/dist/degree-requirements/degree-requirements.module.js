"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DegreeRequirementsModule = void 0;
const common_1 = require("@nestjs/common");
const degree_requirements_controller_1 = require("./degree-requirements.controller");
const degree_requirements_service_1 = require("./degree-requirements.service");
let DegreeRequirementsModule = class DegreeRequirementsModule {
};
exports.DegreeRequirementsModule = DegreeRequirementsModule;
exports.DegreeRequirementsModule = DegreeRequirementsModule = __decorate([
    (0, common_1.Module)({
        controllers: [degree_requirements_controller_1.DegreeRequirementsController],
        providers: [degree_requirements_service_1.DegreeRequirementsService],
    })
], DegreeRequirementsModule);
//# sourceMappingURL=degree-requirements.module.js.map