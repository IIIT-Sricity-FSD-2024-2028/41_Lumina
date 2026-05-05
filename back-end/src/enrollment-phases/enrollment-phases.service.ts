import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EnrollmentPhase } from '../database/interfaces';

@Injectable()
export class EnrollmentPhasesService {
  constructor(private readonly db: DatabaseService) {}

  findAll(): EnrollmentPhase[] {
    return this.db.enrollmentPhases;
  }

  create(data: Omit<EnrollmentPhase, 'id'>): EnrollmentPhase {
    const maxId = this.db.enrollmentPhases.reduce((max, p) => Math.max(max, p.id), 0);
    const newPhase = { id: maxId + 1, ...data };
    
    // If setting active, deactivate others
    if (data.status === 'Active') {
      this.db.enrollmentPhases.forEach(p => { if (p.status === 'Active') p.status = 'Upcoming'; });
    }
    
    this.db.enrollmentPhases.push(newPhase);
    return newPhase;
  }

  update(id: number, data: Partial<EnrollmentPhase>): EnrollmentPhase {
    const phase = this.db.enrollmentPhases.find(p => p.id === Number(id));
    if (!phase) throw new NotFoundException(`Phase ${id} not found`);
    
    if (data.status === 'Active') {
      this.db.enrollmentPhases.forEach(p => { if (p.status === 'Active') p.status = 'Upcoming'; });
    }
    
    Object.assign(phase, data);
    return phase;
  }

  remove(id: number) {
    this.db.enrollmentPhases = this.db.enrollmentPhases.filter(p => p.id !== Number(id));
    return { success: true };
  }
}
