import { RegistrationsService } from './registrations.service';
import { DatabaseService } from '../database/database.service';
import { NotFoundException } from '@nestjs/common';

describe('RegistrationsService – Grade Submission', () => {
  let service: RegistrationsService;
  let db: DatabaseService;

  beforeEach(() => {
    db = new DatabaseService();
    db.onModuleInit(); // Seed in-memory DB
    service = new RegistrationsService(db);
  });

  /* ═══════════════════════════════════════════
     updateGrade() — Single Grade Submission
     ═══════════════════════════════════════════ */

  describe('updateGrade()', () => {
    it('should submit a final grade for an existing registration', () => {
      // Seed: enrollmentId 180 = S2024001, PC402, SPRING2026, finalGrade: null
      const reg = db.registrations.find(r => r.enrollmentId === 180);
      expect(reg).toBeDefined();
      expect(reg!.finalGrade).toBeNull();

      const result = service.updateGrade(180, 'A');
      expect(result.finalGrade).toBe('A');
      expect(result.enrollmentId).toBe(180);

      // Verify persistence in DB
      const updatedReg = db.registrations.find(r => r.enrollmentId === 180);
      expect(updatedReg!.finalGrade).toBe('A');
    });

    it('should allow updating an existing grade (e.g. from B to A)', () => {
      service.updateGrade(180, 'B');
      expect(db.registrations.find(r => r.enrollmentId === 180)!.finalGrade).toBe('B');

      const result = service.updateGrade(180, 'A');
      expect(result.finalGrade).toBe('A');
    });

    it('should throw NotFoundException if registration does not exist', () => {
      expect(() => service.updateGrade(99999, 'A')).toThrow(NotFoundException);
    });
  });

  /* ═══════════════════════════════════════════
     batchUpdateGrades() — Batch Grade Submission
     ═══════════════════════════════════════════ */

  describe('batchUpdateGrades()', () => {
    it('should update grades for multiple students in a single batch', () => {
      const result = service.batchUpdateGrades([
        { enrollmentId: 180, finalGrade: 'S' },
        { enrollmentId: 181, finalGrade: 'A' },
        { enrollmentId: 182, finalGrade: 'B' },
      ]);

      expect(result.updated).toHaveLength(3);
      expect(result.errors).toHaveLength(0);

      expect(result.updated[0].finalGrade).toBe('S');
      expect(result.updated[1].finalGrade).toBe('A');
      expect(result.updated[2].finalGrade).toBe('B');

      // Verify in-memory persistence
      expect(db.registrations.find(r => r.enrollmentId === 180)!.finalGrade).toBe('S');
      expect(db.registrations.find(r => r.enrollmentId === 181)!.finalGrade).toBe('A');
      expect(db.registrations.find(r => r.enrollmentId === 182)!.finalGrade).toBe('B');
    });

    it('should collect individual errors for invalid IDs without failing the entire batch', () => {
      const result = service.batchUpdateGrades([
        { enrollmentId: 180, finalGrade: 'A' },
        { enrollmentId: 99999, finalGrade: 'B' }, // Invalid ID
        { enrollmentId: 181, finalGrade: 'C' },
      ]);

      expect(result.updated).toHaveLength(2);
      expect(result.errors).toHaveLength(1);

      expect(result.errors[0].enrollmentId).toBe(99999);
      expect(result.errors[0].error).toContain('not found');

      expect(db.registrations.find(r => r.enrollmentId === 180)!.finalGrade).toBe('A');
      expect(db.registrations.find(r => r.enrollmentId === 181)!.finalGrade).toBe('C');
    });

    it('should handle an empty grades array gracefully', () => {
      const result = service.batchUpdateGrades([]);
      expect(result.updated).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });
});
