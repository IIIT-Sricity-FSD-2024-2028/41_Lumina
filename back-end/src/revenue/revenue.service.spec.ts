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
    expect(summary.flatSemesterTuition).toBe(2500);
    expect(summary.totalTuitionTarget).toBeGreaterThan(0);
    expect(summary.studentClearanceRoster.length).toBeGreaterThan(0);
    expect(summary.activeSaasPlan.enabledModules.length).toBeGreaterThan(0);
  });

  it('should return active tier and allow updating tier', () => {
    const activeTier = service.getActiveTier();
    expect(activeTier.activeTier).toBe('Enterprise');

    const updated = service.setActiveTier('Starter');
    expect(updated.activeTier).toBe('Starter');
  });

  it('should return flat semester student billing', () => {
    const billing = service.getStudentBilling('S2024001');
    expect(billing).toBeDefined();
    expect(billing.studentId).toBe('S2024001');
    expect(billing.flatSemesterTuition).toBe(2500);
    expect(billing.totalAmountDue).toBe(2500);
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
    expect(campusPlan).toBeDefined();
  });
});
