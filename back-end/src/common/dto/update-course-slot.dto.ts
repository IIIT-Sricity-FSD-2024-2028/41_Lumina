import { PartialType } from '@nestjs/swagger';
import { CreateCourseSlotDto } from './create-course-slot.dto';

export class UpdateCourseSlotDto extends PartialType(CreateCourseSlotDto) {}
