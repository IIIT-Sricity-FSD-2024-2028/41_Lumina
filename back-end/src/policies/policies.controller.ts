import { Controller, Get, Put, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody } from '@nestjs/swagger';
import { PoliciesService } from './policies.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdatePolicyDto } from './dto/update-policy.dto';

@ApiTags('Policies')
@ApiHeader({ name: 'x-role', required: true, description: 'Role of the requesting user' })
@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  @Roles('Dean', 'Assistant_Dean_1', 'Assistant_Dean_2', 'Faculty', 'Student')
  @ApiOperation({ summary: 'Get current academic policies and logs' })
  @ApiResponse({ status: 200, description: 'Current policy settings and audit logs returned.' })
  getPolicies() {
    return {
      settings: this.policiesService.getSettings(),
      logs: this.policiesService.getLogs(),
    };
  }

  @Put()
  @Roles('Assistant_Dean_2', 'Dean')
  @ApiOperation({ summary: 'Update academic policy settings', description: 'Restricted to Assistant Dean 2 and Dean.' })
  @ApiBody({ type: UpdatePolicyDto })
  @ApiResponse({ status: 200, description: 'Policies updated successfully.' })
  @ApiResponse({ status: 400, description: 'Policy modification rejected (e.g., policies are locked).' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  updatePolicies(
    @Body() dto: UpdatePolicyDto,
    @Headers('x-role') role?: string,
  ) {
    return this.policiesService.updateSettings(dto, role || 'Assistant_Dean_2');
  }
}
