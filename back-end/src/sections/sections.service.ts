import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Section } from '../database/interfaces';

@Injectable()
export class SectionsService {
  constructor(private readonly db: DatabaseService) {}

  findAll(): Section[] {
    return this.db.sections;
  }

  create(data: Omit<Section, ''>): Section {
    this.db.sections.push(data);
    return data;
  }
  
  update(sectionId: string, data: Partial<Section>): Section {
    const section = this.db.sections.find(s => s.sectionId === sectionId);
    if (!section) throw new NotFoundException(`Section ${sectionId} not found`);
    Object.assign(section, data);
    return section;
  }
  
  remove(sectionId: string) {
    this.db.sections = this.db.sections.filter(s => s.sectionId !== sectionId);
    return { success: true };
  }
}
