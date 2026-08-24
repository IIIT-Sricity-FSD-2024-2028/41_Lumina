import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { CourseSlotsService } from './course-slots.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateCourseSlotDto, UpdateCourseSlotDto } from '../common/dto';

@ApiTags('CourseSlots')
@ApiHeader({ name: 'x-role', required: true, description: 'Role of the requesting user' })
@Controller('course-slots')
export class CourseSlotsController {
  constructor(private readonly courseSlotsService: CourseSlotsService) {}

  @Get()
  @Roles('Assistant_Dean_1', 'Dean', 'Faculty', 'Student', 'Assistant_Dean_2')
  @ApiOperation({ summary: 'Get all timetable course slots' })
  @ApiResponse({ status: 200, description: 'List of all course slots.' })
  findAll() {
    return this.courseSlotsService.findAll();
  }

  @Post()
  @Roles('Assistant_Dean_1', 'Dean')
  @ApiOperation({ summary: 'Create a new timetable course slot' })
  @ApiBody({ type: CreateCourseSlotDto })
  @ApiResponse({ status: 201, description: 'Course slot created successfully.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  create(@Body() dto: CreateCourseSlotDto) {
    return this.courseSlotsService.create(dto);
  }

  @Put(':id')
  @Roles('Assistant_Dean_1', 'Dean')
  @ApiOperation({ summary: 'Update a timetable course slot' })
  @ApiParam({ name: 'id', description: 'Slot ID', type: Number })
  @ApiBody({ type: UpdateCourseSlotDto })
  @ApiResponse({ status: 200, description: 'Course slot updated successfully.' })
  @ApiResponse({ status: 404, description: 'Course slot not found.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourseSlotDto,
  ) {
    return this.courseSlotsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('Assistant_Dean_1', 'Dean')
  @ApiOperation({ summary: 'Delete a timetable course slot' })
  @ApiParam({ name: 'id', description: 'Slot ID', type: Number })
  @ApiResponse({ status: 200, description: 'Course slot deleted.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.courseSlotsService.remove(id);
  }
}
