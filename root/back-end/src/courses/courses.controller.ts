import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody, ApiParam } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateCourseDto, UpdateCourseDto } from '../common/dto';

@ApiTags('Courses')
@ApiHeader({ name: 'x-role', required: true, description: 'Role of the requesting user' })
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) { }

  @Get()
  @Roles('Student', 'Faculty', 'Dean', 'Assistant_Dean_1', 'Assistant_Dean_2')
  @ApiOperation({ summary: 'Get course catalog', description: 'Returns the full course catalog. Accessible to all authenticated roles.' })
  @ApiResponse({ status: 200, description: 'Course catalog returned successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden — missing or unauthorized x-role header.' })
  findAll() {
    return this.coursesService.findAll();
  }

  @Get('prerequisites')
  @Roles('Student', 'Faculty', 'Dean', 'Assistant_Dean_1', 'Assistant_Dean_2')
  @ApiOperation({ summary: 'Get all course prerequisites', description: 'Returns all prerequisite mappings.' })
  @ApiResponse({ status: 200, description: 'Prerequisites returned successfully.' })
  findAllPrerequisites() {
    return this.coursesService.findAllPrerequisites();
  }

  @Get('for-student/:studentId')
  @Roles('Student', 'Dean', 'Assistant_Dean_1', 'Assistant_Dean_2')
  @ApiOperation({ summary: 'Get enrollable courses for a student', description: 'Returns courses for the student\'s current semester that have sections in the active term. Read-only.' })
  @ApiParam({ name: 'studentId', description: 'Student ID', example: 'S2024001' })
  @ApiResponse({ status: 200, description: 'Courses with sections returned.' })
  getCoursesForStudent(@Param('studentId') studentId: string) {
    return this.coursesService.getCoursesForStudent(studentId);
  }


  @Post()
  @Roles('Assistant_Dean_1', 'Dean')
  @ApiOperation({ summary: 'Create a new course', description: 'Adds a new course to the catalog. Restricted to AD1 and Dean.' })
  @ApiBody({ type: CreateCourseDto })
  @ApiResponse({ status: 201, description: 'Course created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Put(':id')
  @Roles('Assistant_Dean_1', 'Dean')
  @ApiOperation({ summary: 'Update a course', description: 'Updates an existing course. Restricted to AD1 and Dean.' })
  @ApiParam({ name: 'id', description: 'Course ID', example: 'CS101' })
  @ApiBody({ type: UpdateCourseDto })
  @ApiResponse({ status: 200, description: 'Course updated successfully.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(id, updateCourseDto);
  }
}