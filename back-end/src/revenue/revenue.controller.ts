import {
  Controller,
  Get,
  Post,
  Param,
  Query,
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

  @Get('tier/proration-preview')
  @Roles('*')
  @ApiOperation({ summary: 'Calculate real-time prorated invoice for upgrading/downgrading/renewing' })
  @ApiResponse({ status: 200, description: 'Proration calculation preview' })
  getProrationPreview(
    @Query('targetTier') targetTier: 'Starter' | 'Campus' | 'Enterprise',
    @Query('billingCycle') billingCycle?: 'monthly' | 'annual',
  ) {
    return this.revenueService.calculateProration(targetTier || 'Enterprise', billingCycle || 'annual');
  }

  @Post('tier')
  @Roles('Super_User', 'Dean')
  @ApiOperation({ summary: 'Update active SaaS tier for the institution' })
  @ApiResponse({ status: 200, description: 'Updated active SaaS tier' })
  setActiveTier(
    @Body('tier') tier: 'Starter' | 'Campus' | 'Enterprise',
    @Body('billingCycle') billingCycle?: 'monthly' | 'annual',
  ) {
    return this.revenueService.setActiveTier(tier, billingCycle || 'annual');
  }

  @Post('tier/cancel')
  @Roles('Super_User', 'Dean')
  @ApiOperation({ summary: 'Cancel institutional SaaS subscription at period end' })
  @ApiResponse({ status: 200, description: 'Canceled subscription confirmation' })
  cancelSubscription() {
    return this.revenueService.cancelSubscription();
  }

  @Get('lifecycle')
  @Roles('*')
  @ApiOperation({ summary: 'Get institutional tenant lifecycle, 60-day grace period status & export rights' })
  @ApiResponse({ status: 200, description: 'Tenant lifecycle status and grace period details' })
  getTenantLifecycle() {
    return this.revenueService.getTenantLifecycle();
  }

  @Get('export/archive')
  @Roles('Dean', 'Super_User', 'Lumina_SPOC')
  @ApiOperation({ summary: 'Export complete institutional academic and financial archive' })
  @ApiResponse({ status: 200, description: 'Institutional academic and financial archive' })
  exportInstitutionalArchive() {
    return this.revenueService.exportInstitutionalArchive();
  }

  @Post('simulate-grace-period')
  @Roles('Dean', 'Super_User')
  @ApiOperation({ summary: 'Simulate 60-day read-only grace period for evaluation demos' })
  @ApiResponse({ status: 200, description: 'Updated tenant lifecycle status' })
  simulateGracePeriod(@Body('enableGrace') enableGrace: boolean) {
    return this.revenueService.simulateGracePeriod(enableGrace ?? true);
  }

  @Get('students/clearance-roster')
  @Roles('Dean', 'Super_User', 'Lumina_SPOC')
  @ApiOperation({ summary: 'Get complete student financial clearance roster for Dean' })
  @ApiResponse({ status: 200, description: 'Student fee clearance roster' })
  getStudentsClearanceRoster() {
    return this.revenueService.getStudentsClearanceRoster();
  }

  @Get('student/:studentId')
  @Roles('*')
  @ApiOperation({ summary: 'Get itemized semester tuition billing for a student' })
  @ApiResponse({ status: 200, description: 'Student tuition billing details' })
  getStudentBilling(@Param('studentId') studentId: string) {
    return this.revenueService.getStudentBilling(studentId);
  }

  @Post('student/:studentId/pay')
  @Roles('*')
  @ApiOperation({ summary: 'Pay outstanding tuition balance for a student' })
  @ApiResponse({ status: 200, description: 'Payment receipt and updated ledger status' })
  payStudentTuition(
    @Param('studentId') studentId: string,
    @Body('amount') amount: number,
  ) {
    return this.revenueService.payStudentTuition(studentId, amount);
  }

  @Post('student/:studentId/waive-hold')
  @Roles('Dean', 'Super_User')
  @ApiOperation({ summary: 'Grant financial hold waiver for a student (Dean only)' })
  @ApiResponse({ status: 200, description: 'Financial hold waived and registration unlocked' })
  waiveStudentFeeHold(
    @Param('studentId') studentId: string,
    @Body('waiverReason') waiverReason: string,
  ) {
    return this.revenueService.waiveStudentFeeHold(studentId, waiverReason);
  }
}
