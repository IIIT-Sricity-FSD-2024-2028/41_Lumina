import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RevenueService } from './revenue.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Revenue & Billing')
@Controller('revenue')
@UseGuards(RolesGuard)
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Get('summary')
  @Roles('Dean', 'Super_User', 'Assistant_Dean_1', 'Assistant_Dean_2')
  @ApiOperation({ summary: 'Get institutional revenue, tuition collections, and SaaS metrics' })
  @ApiResponse({ status: 200, description: 'Institutional revenue summary' })
  getRevenueSummary() {
    return this.revenueService.getRevenueSummary();
  }

  @Get('plans')
  @Roles('*')
  @ApiOperation({ summary: 'Get public B2B SaaS pricing & subscription tiers' })
  @ApiResponse({ status: 200, description: 'SaaS licensing plans' })
  getSaasPlans() {
    return this.revenueService.getSaasPlans();
  }

  @Get('tier')
  @Roles('*')
  @ApiOperation({ summary: 'Get current active SaaS tier and enabled modules' })
  @ApiResponse({ status: 200, description: 'Active SaaS tier configuration' })
  getActiveTier() {
    return this.revenueService.getActiveTier();
  }


  @Post('tier')
  @Roles('Super_User', 'Dean')
  @ApiOperation({ summary: 'Update active SaaS tier for the institution' })
  @ApiResponse({ status: 200, description: 'Updated active SaaS tier' })
  setActiveTier(@Body('tier') tier: 'Starter' | 'Campus' | 'Enterprise') {
    return this.revenueService.setActiveTier(tier);
  }

  @Get('student/:studentId')
  @Roles('Student', 'Dean', 'Super_User')
  @ApiOperation({ summary: 'Get itemized semester tuition billing for a student' })
  @ApiResponse({ status: 200, description: 'Student tuition billing details' })
  getStudentBilling(@Param('studentId') studentId: string) {
    return this.revenueService.getStudentBilling(studentId);
  }

  @Post('student/:studentId/pay')
  @Roles('Student', 'Dean', 'Super_User')
  @ApiOperation({ summary: 'Simulate tuition payment for a student' })
  @ApiResponse({ status: 200, description: 'Payment receipt confirmation' })
  payStudentTuition(
    @Param('studentId') studentId: string,
    @Body('amount') amount?: number,
  ) {
    return this.revenueService.payStudentTuition(studentId, amount);
  }
}
