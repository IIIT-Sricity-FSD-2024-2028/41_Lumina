import { Controller, Get, Post, Put, Delete, Body, Param, Headers, ParseIntPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AnnouncementsService } from './announcements.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from '../common/dto';
import { multerUploadOptions } from '../course-slots/file-upload.config';

@ApiTags('Announcements')
@ApiHeader({ name: 'x-role', required: true, description: 'Role of the requesting user' })
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  @Roles('Faculty', 'Student', 'Dean', 'Assistant_Dean_1', 'Assistant_Dean_2')
  @ApiOperation({ summary: 'Get all announcements', description: 'Returns all announcements. Accessible to all roles.' })
  @ApiResponse({ status: 200, description: 'List of announcements.' })
  findAll() {
    return this.announcementsService.findAll();
  }

  @Post()
  @Roles('Faculty', 'Dean')
  @UseInterceptors(FileInterceptor('file', multerUploadOptions))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({ summary: 'Create an announcement with optional file attachment', description: 'Creates a new announcement with Multer file upload middleware validation. Faculty and Dean only.' })
  @ApiBody({ type: CreateAnnouncementDto })
  @ApiResponse({ status: 201, description: 'Announcement created.' })
  @ApiResponse({ status: 400, description: 'Validation or file upload error.' })
  create(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateAnnouncementDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Note: fallback to mock facultyId if header isn't passed
    const facultyId = userId || 'F2024001'; 
    return this.announcementsService.create(facultyId, dto, file);
  }


  @Put(':id')
  @Roles('Faculty', 'Dean')
  @ApiOperation({ summary: 'Update an announcement', description: 'Updates an existing announcement. Faculty and Dean only.' })
  @ApiParam({ name: 'id', description: 'Announcement ID', type: Number })
  @ApiBody({ type: UpdateAnnouncementDto })
  @ApiResponse({ status: 200, description: 'Announcement updated.' })
  @ApiResponse({ status: 404, description: 'Announcement not found.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('Faculty', 'Dean')
  @ApiOperation({ summary: 'Delete an announcement', description: 'Deletes an announcement. Faculty and Dean only.' })
  @ApiParam({ name: 'id', description: 'Announcement ID', type: Number })
  @ApiResponse({ status: 200, description: 'Announcement deleted.' })
  @ApiResponse({ status: 404, description: 'Announcement not found.' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.announcementsService.delete(id);
  }
}
