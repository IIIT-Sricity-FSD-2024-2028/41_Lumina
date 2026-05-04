import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CourseSlotsService } from './course-slots.service';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiTags, ApiHeader } from '@nestjs/swagger';

@ApiTags('CourseSlots')
@ApiHeader({ name: 'x-role', required: true })
@Controller('course-slots')
export class CourseSlotsController {
  constructor(private readonly courseSlotsService: CourseSlotsService) {}

  @Get()
  @Roles('Assistant_Dean_1', 'Dean', 'Faculty', 'Student', 'Assistant_Dean_2')
  findAll() {
    return this.courseSlotsService.findAll();
  }

  @Post()
  @Roles('Assistant_Dean_1', 'Dean')
  create(@Body() data: any) {
    return this.courseSlotsService.create(data);
  }

  @Put(':id')
  @Roles('Assistant_Dean_1', 'Dean')
  update(@Param('id') id: string, @Body() data: any) {
    return this.courseSlotsService.update(Number(id), data);
  }

  @Delete(':id')
  @Roles('Assistant_Dean_1', 'Dean')
  remove(@Param('id') id: string) {
    return this.courseSlotsService.remove(Number(id));
  }
}
