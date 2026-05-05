import { Controller, Get, Post, Body, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody, ApiParam } from '@nestjs/swagger';
import { RegistrationsService } from './registrations.service';
import { Roles } from '../common/decorators/roles.decorator';
import { EnrollCourseDto } from '../common/dto/enroll-course.dto';
import { UpdateGradeDto } from '../common/dto/update-grade.dto';

@ApiTags('Registrations')
@ApiHeader({ name: 'x-role', required: true, description: 'Role of the requesting user' })
@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Get()
  @Roles('Dean', 'Assistant_Dean_1', 'Assistant_Dean_2', 'Faculty', 'Student')
  @ApiOperation({ summary: 'Get all registrations' })
  @ApiResponse({ status: 200, description: 'List of all registration records.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findAll() {
    return this.registrationsService.findAll();
  }

  @Post()
  @Roles('Student')
  @ApiOperation({ summary: 'Enroll in a course', description: 'Full constraint validation: duplicate, window, prerequisites, credit limit, capacity.' })
  @ApiBody({ type: EnrollCourseDto })
  @ApiResponse({ status: 201, description: 'Registration created (Enrolled or Waitlisted).' })
  @ApiResponse({ status: 400, description: 'Domain constraint violation.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  enroll(@Body() dto: EnrollCourseDto) {
    return this.registrationsService.enroll(dto.Student_ID, dto.Course_ID);
  }

  @Patch(':id/grade')
  @Roles('Faculty', 'Dean')
  @ApiOperation({ summary: 'Submit final grade' })
  @ApiParam({ name: 'id', description: 'Enrollment ID', type: Number })
  @ApiBody({ type: UpdateGradeDto })
  @ApiResponse({ status: 200, description: 'Grade updated successfully.' })
  @ApiResponse({ status: 404, description: 'Registration not found.' })
  updateGrade(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGradeDto,
  ) {
    return this.registrationsService.updateGrade(id, dto.finalGrade);
  }
}
