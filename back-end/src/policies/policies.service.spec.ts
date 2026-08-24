import { Test, TestingModule } from '@nestjs/testing';
import { PoliciesService } from './policies.service';
import { DatabaseService } from '../database/database.service';
import { RegistrationsService } from '../registrations/registrations.service';
import { BadRequestException } from '@nestjs/common';

describe('Policies and Dynamic Validation Integration', () => {
  let policiesService: PoliciesService;
  let registrationsService: RegistrationsService;
  let dbService: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseService, PoliciesService, RegistrationsService],
    }).compile();

    dbService = module.get<DatabaseService>(DatabaseService);
    dbService.onModuleInit(); // seed in-memory DB
    policiesService = module.get<PoliciesService>(PoliciesService);
    registrationsService = module.get<RegistrationsService>(RegistrationsService);
  });

  it('should return initial policy settings and change logs', () => {
    const settings = policiesService.getSettings();
    expect(settings).toBeDefined();
    expect(settings.minCredits).toBe(12);
    expect(settings.maxCredits).toBe(22);
    expect(settings.enforcePrereq).toBe(true);

    const logs = policiesService.getLogs();
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThan(0);
  });

  it('should update policies and record audit log', () => {
    const result = policiesService.updateSettings(
      { maxCredits: 26, enforcePrereq: false },
      'Assistant_Dean_2',
    );
    expect(result.settings.maxCredits).toBe(26);
    expect(result.settings.enforcePrereq).toBe(false);
    expect(result.logs[0].message).toBe('Policy settings updated');
    expect(result.logs[0].by).toBe('Assistant Dean 2');
  });

  it('should prevent modifications when policies are locked', () => {
    policiesService.updateSettings({ isLocked: true }, 'Assistant_Dean_2');
    expect(() => {
      policiesService.updateSettings({ minCredits: 10 }, 'Assistant_Dean_2');
    }).toThrow(BadRequestException);
  });

  it('should throw BadRequestException if minCredits is greater than maxCredits', () => {
    expect(() => {
      policiesService.updateSettings({ minCredits: 25, maxCredits: 15 }, 'Assistant_Dean_2');
    }).toThrow(BadRequestException);
  });

  it('should enforce prerequisite check when enforcePrereq is true and skip when false', () => {
    // S2024002 failed PC201, PC302 requires PC201
    // 1. With enforcePrereq = true (default)
    expect(() => {
      registrationsService.enroll('S2024002', 'PC302');
    }).toThrow(BadRequestException);

    // 2. With enforcePrereq = false
    policiesService.updateSettings({ enforcePrereq: false }, 'Assistant_Dean_2');
    const reg = registrationsService.enroll('S2024002', 'PC302');
    expect(reg).toBeDefined();
    expect(reg.courseId).toBe('PC302');
  });
});
