import { RegistrationsService } from './registrations.service';
import { DatabaseService } from '../database/database.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('RegistrationsService – Section Assignment', () => {
  let service: RegistrationsService;
  let db: DatabaseService;

  beforeEach(() => {
    db = new DatabaseService();
    db.onModuleInit(); // Seed the in-memory database
    service = new RegistrationsService(db);
  });

  /* ═══════════════════════════════════════════
     assignSection() — Single Assignment
     ═══════════════════════════════════════════ */

  describe('assignSection()', () => {
    it('should assign a valid section to a registration', () => {
      // Seed: enrollmentId 180 = S2024001 enrolled in PC402, SPRING2026
      // Section PC402-S1 exists for course PC402
      const reg = db.registrations.find(r => r.enrollmentId === 180);
      expect(reg).toBeDefined();
      expect(reg!.courseId).toBe('PC402');

      const result = service.assignSection(180, 'PC402-S1');
      expect(result.sectionId).toBe('PC402-S1');
      expect(result.enrollmentId).toBe(180);
    });

    it('should allow reassignment to a different section of the same course', () => {
      // First assign to S1
      service.assignSection(180, 'PC402-S1');
      expect(db.registrations.find(r => r.enrollmentId === 180)!.sectionId).toBe('PC402-S1');

      // Now reassign to S2
      const result = service.assignSection(180, 'PC402-S2');
      expect(result.sectionId).toBe('PC402-S2');
    });

    it('should throw NotFoundException for non-existent registration', () => {
      expect(() => service.assignSection(99999, 'PC402-S1')).toThrow(NotFoundException);
    });

    it('should throw NotFoundException for non-existent section', () => {
      expect(() => service.assignSection(180, 'FAKE-S99')).toThrow(NotFoundException);
    });

    it('should throw BadRequestException when section belongs to a different course', () => {
      // enrollmentId 180 is for PC402, but PC201-S1 belongs to PC201
      expect(() => service.assignSection(180, 'PC201-S1')).toThrow(BadRequestException);
      try {
        service.assignSection(180, 'PC201-S1');
      } catch (e) {
        expect((e as BadRequestException).message).toContain('PC201');
        expect((e as BadRequestException).message).toContain('PC402');
      }
    });

    it('should persist the change in the database array', () => {
      service.assignSection(180, 'PC402-S2');
      const dbReg = db.registrations.find(r => r.enrollmentId === 180);
      expect(dbReg!.sectionId).toBe('PC402-S2');
    });
  });

  /* ═══════════════════════════════════════════
     batchAssignSections() — Batch Assignment
     ═══════════════════════════════════════════ */

  describe('batchAssignSections()', () => {
    it('should assign sections to multiple registrations', () => {
      // enrollmentId 180 and 181 are both for PC402
      const result = service.batchAssignSections([
        { enrollmentId: 180, sectionId: 'PC402-S1' },
        { enrollmentId: 181, sectionId: 'PC402-S2' },
      ]);

      expect(result.updated).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(result.updated[0].sectionId).toBe('PC402-S1');
      expect(result.updated[1].sectionId).toBe('PC402-S2');
    });

    it('should allow null to unassign a section', () => {
      // First assign
      service.assignSection(180, 'PC402-S1');
      expect(db.registrations.find(r => r.enrollmentId === 180)!.sectionId).toBe('PC402-S1');

      // Now unassign via batch
      const result = service.batchAssignSections([
        { enrollmentId: 180, sectionId: null },
      ]);

      expect(result.updated).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.updated[0].sectionId).toBeNull();
    });

    it('should collect errors for invalid registrations without failing the batch', () => {
      const result = service.batchAssignSections([
        { enrollmentId: 180, sectionId: 'PC402-S1' },      // valid
        { enrollmentId: 99999, sectionId: 'PC402-S1' },     // invalid: no such registration
        { enrollmentId: 181, sectionId: 'PC402-S2' },       // valid
      ]);

      expect(result.updated).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].enrollmentId).toBe(99999);
      expect(result.errors[0].error).toContain('not found');
    });

    it('should collect errors for non-existent sections', () => {
      const result = service.batchAssignSections([
        { enrollmentId: 180, sectionId: 'NONEXIST-S99' },
      ]);

      expect(result.updated).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('not found');
    });

    it('should collect errors for course-section mismatch', () => {
      // enrollmentId 180 is for PC402, PC201-S1 belongs to PC201
      const result = service.batchAssignSections([
        { enrollmentId: 180, sectionId: 'PC201-S1' },
      ]);

      expect(result.updated).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('PC201');
    });

    it('should handle an empty assignments array', () => {
      const result = service.batchAssignSections([]);

      expect(result.updated).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle a mix of valid, invalid, null, and mismatch in one batch', () => {
      const result = service.batchAssignSections([
        { enrollmentId: 180, sectionId: 'PC402-S1' },      // valid
        { enrollmentId: 181, sectionId: null },              // valid unassign
        { enrollmentId: 99999, sectionId: 'PC402-S1' },     // error: no reg
        { enrollmentId: 182, sectionId: 'PC201-S1' },       // error: mismatch (182 is PC402)
      ]);

      expect(result.updated).toHaveLength(2);
      expect(result.errors).toHaveLength(2);
    });

    it('should persist all changes in the database', () => {
      service.batchAssignSections([
        { enrollmentId: 180, sectionId: 'PC402-S1' },
        { enrollmentId: 188, sectionId: 'PC402-S2' },
      ]);

      expect(db.registrations.find(r => r.enrollmentId === 180)!.sectionId).toBe('PC402-S1');
      expect(db.registrations.find(r => r.enrollmentId === 188)!.sectionId).toBe('PC402-S2');
    });
  });
});
