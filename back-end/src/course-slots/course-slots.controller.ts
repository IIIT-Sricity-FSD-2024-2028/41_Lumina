import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { CourseSlotsService } from './course-slots.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateCourseSlotDto, UpdateCourseSlotDto } from '../common/dto';
import { multerUploadOptions } from './file-upload.config';

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

  @Post(':id/syllabus')
  @Roles('Assistant_Dean_1', 'Dean', 'Faculty')
  @UseInterceptors(FileInterceptor('file', multerUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a syllabus file for a course slot' })
  @ApiParam({ name: 'id', description: 'Slot ID', type: Number })
  @ApiBody({
    description: 'Syllabus document (PDF, Word, Text, CSV, Excel, Image - max 5MB)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Syllabus uploaded successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid file type, size exceeded, or no file provided.' })
  @ApiResponse({ status: 404, description: 'Course slot not found.' })
  uploadSyllabus(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException(
        'No file provided. Please upload a valid file using the "file" field.',
      );
    }
    return this.courseSlotsService.uploadSyllabus(id, file);
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

