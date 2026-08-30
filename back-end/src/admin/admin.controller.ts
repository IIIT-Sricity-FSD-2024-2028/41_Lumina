import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Lumina Admin Team & SPOC Operations')
@Controller('admin')
@UseGuards(RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/:spocId')
  @Roles('Lumina_SPOC', 'Admin', 'Super_User', 'Dean')
  @ApiOperation({ summary: 'Get assigned institute operational dashboard for a SPOC Admin' })
  @ApiResponse({ status: 200, description: 'SPOC dashboard metrics and tickets' })
  getDashboard(
    @Param('spocId') spocId: string,
    @Query('instituteId') instituteId?: string,
  ) {
    return this.adminService.getDashboard(spocId, instituteId);
  }

  @Get('dockets')
  @Roles('Lumina_SPOC', 'Admin', 'Super_User', 'Dean')
  @ApiOperation({ summary: 'Get support dockets and registration exception queue' })
  @ApiResponse({ status: 200, description: 'List of support dockets' })
  getDockets(
    @Query('spocId') spocId?: string,
    @Query('instituteId') instituteId?: string,
  ) {
    return this.adminService.getDockets(spocId, instituteId);
  }

  @Post('dockets')
  @Roles('*')
  @ApiOperation({ summary: 'Submit a new support ticket or administrative docket' })
  @ApiResponse({ status: 201, description: 'Created support docket' })
  createDocket(@Body() payload: any) {
    return this.adminService.createDocket(payload);
  }


  @Patch('dockets/:id/status')
  @Roles('Lumina_SPOC', 'Admin', 'Super_User')
  @ApiOperation({ summary: 'Update docket status and resolution notes' })
  @ApiResponse({ status: 200, description: 'Updated docket' })
  updateDocketStatus(
    @Param('id') id: string,
    @Body('status') status: 'Open' | 'In_Progress' | 'Resolved',
    @Body('resolutionNotes') resolutionNotes?: string,
  ) {
    return this.adminService.updateDocketStatus(id, status, resolutionNotes);
  }

  @Post('bulk-import/courses')
  @Roles('Lumina_SPOC', 'Admin', 'Super_User')
  @ApiOperation({ summary: 'Bulk ingest courses for the assigned institute' })
  @ApiResponse({ status: 201, description: 'Bulk course ingestion result' })
  bulkImportCourses(@Body('courses') courses: any[]) {
    return this.adminService.bulkImportCourses(courses || []);
  }
}
