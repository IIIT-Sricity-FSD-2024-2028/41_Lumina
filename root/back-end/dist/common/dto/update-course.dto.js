"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCourseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_course_dto_1 = require("./create-course.dto");
class UpdateCourseDto extends (0, swagger_1.PartialType)(create_course_dto_1.CreateCourseDto) {
}
exports.UpdateCourseDto = UpdateCourseDto;
//# sourceMappingURL=update-course.dto.js.map