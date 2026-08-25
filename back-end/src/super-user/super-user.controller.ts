import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiHeader, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { SuperUserService } from './super-user.service';

@ApiTags('SuperUser')
@Controller('super-user')
export class SuperUserController {
  constructor(private readonly superUserService: SuperUserService) {}

  @Get('logs')
  @Roles('Super_User')
  @ApiOperation({
    summary: 'View server logs from disk (Super User only)',
    description: 'Retrieves recent access, error, or auth log records stored on the filesystem.',
  })
  @ApiHeader({
    name: 'x-role',
    description: 'Must be Super_User',
    required: true,
  })
  @ApiQuery({
    name: 'type',
    enum: ['access', 'error', 'auth'],
    required: false,
    description: 'Log type to query (default: access)',
  })
  @ApiQuery({
    name: 'lines',
    required: false,
    description: 'Number of recent lines to retrieve (default: 50)',
  })
  @ApiResponse({ status: 200, description: 'Log lines retrieved successfully.' })
  @ApiResponse({ status: 403, description: 'Access denied. Only Super_User role is authorized.' })
  getLogs(
    @Query('type') type: 'access' | 'error' | 'auth' = 'access',
    @Query('lines') lines?: string,
  ) {
    const maxLines = lines ? parseInt(lines, 10) || 50 : 50;
    return this.superUserService.getSystemLogs(type, maxLines);
  }

  @Post('logs/archive')
  @Roles('Super_User')
  @ApiOperation({
    summary: 'Trigger manual log snapshot archive (Super User only)',
    description: 'Forces an immediate archive snapshot of active log files to disk.',
  })
  @ApiHeader({
    name: 'x-role',
    description: 'Must be Super_User',
    required: true,
  })
  triggerArchive() {
    return this.superUserService.triggerLogArchive();
  }

  @Get('system-health')
  @Roles('Super_User')
  @ApiOperation({
    summary: 'System health & resource metrics (Super User only)',
    description: 'Returns server uptime, memory usage, CPU count, and Lumina ecosystem counts.',
  })
  @ApiHeader({
    name: 'x-role',
    description: 'Must be Super_User',
    required: true,
  })
  getSystemHealth() {
    return this.superUserService.getSystemHealth();
  }

  @Get('users')
  @Roles('Super_User')
  @ApiOperation({
    summary: 'List all system users and role breakdown (Super User only)',
    description: 'Returns comprehensive user list across Students, Faculty, Deans, and Super Users.',
  })
  @ApiHeader({
    name: 'x-role',
    description: 'Must be Super_User',
    required: true,
  })
  getUsersSummary() {
    return this.superUserService.getAllUsersSummary();
  }
}
