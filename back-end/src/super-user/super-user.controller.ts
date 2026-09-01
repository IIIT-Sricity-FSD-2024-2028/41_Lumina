import { Controller, Get, Post, Query, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiHeader, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SuperUserService, LuminaAdminSpoc, ClientInstitute } from './super-user.service';

@ApiTags('SuperUser')
@Controller('super-user')
@UseGuards(RolesGuard)
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

  // =========================================================================
  // --- MULTI-COLLEGE SAAS: LUMINA ADMIN TEAM & INSTITUTE SPOC APIS ---
  // =========================================================================

  @Get('admin-team')
  @Roles('Super_User')
  @ApiOperation({ summary: 'Get Lumina Admin Team / Institute SPOCs (Super User only)' })
  @ApiResponse({ status: 200, description: 'Lumina staff & SPOC roster' })
  getAdminTeam() {
    return this.superUserService.getAdminTeam();
  }

  @Post('admin-team')
  @Roles('Super_User')
  @ApiOperation({ summary: 'Add a new Lumina Admin / SPOC to the internal staff' })
  @ApiResponse({ status: 201, description: 'New Admin SPOC created' })
  addAdminSpoc(@Body() payload: Partial<LuminaAdminSpoc>) {
    return this.superUserService.addAdminSpoc(payload);
  }

  @Get('institutes')
  @Roles('Super_User', 'Dean')
  @ApiOperation({ summary: 'Get all onboarded client institutions' })
  @ApiResponse({ status: 200, description: 'Client universities directory' })
  getInstitutes() {
    return this.superUserService.getInstitutes();
  }

  @Post('institutes')
  @Roles('Super_User')
  @ApiOperation({ summary: 'Onboard a new university client tenant' })
  @ApiResponse({ status: 201, description: 'University tenant provisioned' })
  onboardInstitute(@Body() payload: Partial<ClientInstitute>) {
    return this.superUserService.onboardInstitute(payload);
  }

  @Patch('institutes/:id/tier')
  @Roles('Super_User')
  @ApiOperation({ summary: 'Update an institute subscription plan tier' })
  @ApiResponse({ status: 200, description: 'Plan tier updated' })
  updateTier(
    @Param('id') instituteId: string,
    @Body('tier') tier: 'Starter' | 'Campus' | 'Enterprise',
  ) {
    return this.superUserService.updateInstituteTier(instituteId, tier);
  }

  @Post('institutes/:id/assign-spoc')
  @Roles('Super_User')
  @ApiOperation({ summary: 'Assign or reassign a Lumina SPOC to a client institute' })
  @ApiResponse({ status: 200, description: 'SPOC assigned successfully' })
  assignSpoc(
    @Param('id') instituteId: string,
    @Body('spocAdminId') spocAdminId: string,
  ) {
    return this.superUserService.assignSpocToInstitute(instituteId, spocAdminId);
  }

  @Post('institutes/:id/archive')
  @Roles('Super_User')
  @ApiOperation({ summary: 'Archive an expired tenant and move to Cold Storage' })
  @ApiResponse({ status: 200, description: 'Tenant archived successfully' })
  archiveInstitute(@Param('id') instituteId: string) {
    return this.superUserService.archiveInstitute(instituteId);
  }
}
