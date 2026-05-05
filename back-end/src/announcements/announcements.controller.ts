import { Controller, Get, Post, Put, Delete, Body, Param, Headers } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiTags, ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Announcements')
@ApiHeader({ name: 'x-role', required: true })
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
  @ApiResponse({ status: 201, description: 'Announcement created.' })
  create(@Headers('x-user-id') userId: string, @Body() data: any) {
    // Note: since auth isn't fully implemented with JWT, we use a mock facultyId if header isn't passed
    const facultyId = userId || 'F2024001'; 
    return this.announcementsService.create(facultyId, data);
  }

  @Put(':id')
  @Roles('Faculty', 'Dean')
  @ApiOperation({ summary: 'Update an announcement', description: 'Updates an existing announcement. Faculty and Dean only.' })
  @ApiResponse({ status: 200, description: 'Announcement updated.' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.announcementsService.update(parseInt(id, 10), data);
  }

  @Delete(':id')
  @Roles('Faculty', 'Dean')
  @ApiOperation({ summary: 'Delete an announcement', description: 'Deletes an announcement. Faculty and Dean only.' })
  @ApiResponse({ status: 200, description: 'Announcement deleted.' })
  delete(@Param('id') id: string) {
    return this.announcementsService.delete(parseInt(id, 10));
  }
}
