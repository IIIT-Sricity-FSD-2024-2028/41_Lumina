import { Controller, Get, Post, Put, Delete, Body, Param, Headers, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from '../common/dto';

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
  @ApiOperation({ summary: 'Create an announcement', description: 'Creates a new announcement. Faculty and Dean only.' })
  @ApiBody({ type: CreateAnnouncementDto })
  @ApiResponse({ status: 201, description: 'Announcement created.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  create(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateAnnouncementDto,
  ) {
    // Note: fallback to mock facultyId if header isn't passed
    const facultyId = userId || 'F2024001'; 
    return this.announcementsService.create(facultyId, dto);
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
