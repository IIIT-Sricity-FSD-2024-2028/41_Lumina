import { Module } from '@nestjs/common';
import { CourseSlotsController } from './course-slots.controller';
import { CourseSlotsService } from './course-slots.service';

@Module({
  controllers: [CourseSlotsController],
  providers: [CourseSlotsService]
})
export class CourseSlotsModule {}
