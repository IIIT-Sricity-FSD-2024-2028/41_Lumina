import { Test, TestingModule } from '@nestjs/testing';
import { RevenueService } from './revenue.service';
import { DatabaseService } from '../database/database.service';

describe('RevenueService', () => {
  let service: RevenueService;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RevenueService, DatabaseService],
    }).compile();

    databaseService = module.get<DatabaseService>(DatabaseService);
    databaseService.onModuleInit(); // Seed in-memory database
    service = module.get<RevenueService>(RevenueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return valid institutional revenue summary with real modules', () => {
    const summary = service.getRevenueSummary();
    expect(summary).toBeDefined();
    expect(summary.currency).toBe('USD');
    expect(summary.totalGrossRevenue).toBeGreaterThan(0);
    expect(summary.totalCreditsEnrolled).toBeGreaterThan(0);
    expect(summary.departmentBreakdown.length).toBeGreaterThan(0);
    expect(summary.activeSaasPlan.enabledModules.length).toBeGreaterThan(0);
  });

  it('should return active tier and allow updating tier', () => {
    const activeTier = service.getActiveTier();
    expect(activeTier.activeTier).toBe('Enterprise');

    const updated = service.setActiveTier('Starter');
    expect(updated.activeTier).toBe('Starter');
    expect(updated.activePlan.includedModules).toContain('Course Catalog & Prerequisite Validation');
  });

  it('should return itemized student billing', () => {
    const billing = service.getStudentBilling('S2024001');
    expect(billing).toBeDefined();
    expect(billing.studentId).toBe('S2024001');
    expect(billing.tuitionFee).toBeGreaterThanOrEqual(0);
    expect(billing.itemizedCourses.length).toBeGreaterThan(0);
  });

  it('should process simulated student fee payment', () => {
    const result = service.payStudentTuition('S2024001');
    expect(result.success).toBe(true);
    expect(result.paymentStatus).toBe('Cleared');
    expect(result.transactionId).toBeDefined();
  });

  it('should return SaaS subscription plans matching real Lumina modules', () => {
    const plansData = service.getSaasPlans();
    expect(plansData.plans.length).toBe(3);
    const campusPlan = plansData.plans.find((p) => p.id === 'campus');
    expect(campusPlan?.popular).toBe(true);
    expect(campusPlan?.includedModules).toContain('Assistant Dean 1: Slot & Timetable Allocation');
  });
});
