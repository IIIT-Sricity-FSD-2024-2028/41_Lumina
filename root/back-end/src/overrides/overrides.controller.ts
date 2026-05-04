import { Controller, Get, Post, Patch, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody, ApiParam } from '@nestjs/swagger';
import { OverridesService } from './overrides.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateOverrideDto } from '../common/dto/create-override.dto';
import { UpdateOverrideStatusDto } from '../common/dto/update-override-status.dto';
import { ApprovalStatus } from '../database/interfaces';

@ApiTags('Overrides')
@ApiHeader({ name: 'x-role', required: true, description: 'Role of the requesting user' })
@Controller('overrides')
export class OverridesController {
  constructor(private readonly overridesService: OverridesService) {}

  @Get()
  @Roles('Assistant_Dean_1', 'Assistant_Dean_2', 'Dean')
  @ApiOperation({ summary: 'Get all override requests', description: 'Returns all administrative override requests. Requires: Assistant_Dean_1, Assistant_Dean_2, or Dean.' })
  @ApiResponse({ status: 200, description: 'List of override requests returned.' })
  @ApiResponse({ status: 403, description: 'Forbidden — missing or unauthorized x-role header.' })
  findAll() {
    return this.overridesService.findAll();
  }

  @Get('my/:studentId')
  @Roles('Student')
  @ApiOperation({ summary: 'Get override requests for a student' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student override requests returned.' })
  findByStudent(@Param('studentId') studentId: string) {
    return this.overridesService.findByStudent(studentId);
  }

  @Post()
  @Roles('Student')
  @ApiOperation({ summary: 'Submit an override request', description: 'Students submit an exception request for a course. Auto-sets status to Pending. Requires: Student.' })
  @ApiBody({ type: CreateOverrideDto })
  @ApiResponse({ status: 201, description: 'Override request created with Pending status.' })
  @ApiResponse({ status: 400, description: 'Validation error — invalid or missing fields.' })
  @ApiResponse({ status: 403, description: 'Forbidden — missing or unauthorized x-role header.' })
  create(@Body() dto: CreateOverrideDto) {
    return this.overridesService.create(
      dto.Student_ID,
      dto.Course_ID,
      dto.Reason,
    );
  }

  @Patch(':id/status')
  @Roles('Assistant_Dean_1', 'Assistant_Dean_2')
  @ApiOperation({ summary: 'Approve or reject an override', description: 'Updates the approval status. Only Approved or Rejected are valid. Requires: Assistant_Dean_1 or Assistant_Dean_2.' })
  @ApiParam({ name: 'id', type: Number, description: 'Override request ID' })
  @ApiBody({ type: UpdateOverrideStatusDto })
  @ApiResponse({ status: 200, description: 'Override status updated.' })
  @ApiResponse({ status: 400, description: 'Validation error — invalid status value.' })
  @ApiResponse({ status: 403, description: 'Forbidden — missing or unauthorized x-role header.' })
  @ApiResponse({ status: 404, description: 'Override request not found.' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOverrideStatusDto,
  ) {
    return this.overridesService.updateStatus(
      id,
      dto.Approval_Status as ApprovalStatus,
    );
  }
}
