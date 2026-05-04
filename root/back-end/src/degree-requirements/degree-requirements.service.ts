import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { DegreeRequirement } from '../database/interfaces';

@Injectable()
export class DegreeRequirementsService {
  constructor(private readonly db: DatabaseService) {}

  findAll(): DegreeRequirement[] {
    return this.db.degreeRequirements;
  }

  findByDept(deptId: string): DegreeRequirement[] {
    return this.db.degreeRequirements.filter(dr => dr.deptId === deptId);
  }

  findBySemester(semester: number): DegreeRequirement[] {
    return this.db.degreeRequirements.filter(dr => dr.targetSemester === semester);
  }
}
