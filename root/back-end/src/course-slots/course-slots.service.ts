import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CourseSlot } from '../database/interfaces';

@Injectable()
export class CourseSlotsService {
  constructor(private readonly db: DatabaseService) {}

  findAll(): CourseSlot[] {
    return this.db.courseSlots;
  }

  create(data: Omit<CourseSlot, 'slotId'>): CourseSlot {
    const maxId = this.db.courseSlots.reduce((max, s) => Math.max(max, s.slotId), 0);
    const newSlot = { slotId: maxId + 1, ...data };
    this.db.courseSlots.push(newSlot);
    return newSlot;
  }

  update(slotId: number, data: Partial<CourseSlot>): CourseSlot {
    const slot = this.db.courseSlots.find(s => s.slotId === Number(slotId));
    if (!slot) throw new NotFoundException(`Course Slot ${slotId} not found`);
    Object.assign(slot, data);
    return slot;
  }

  remove(slotId: number) {
    this.db.courseSlots = this.db.courseSlots.filter(s => s.slotId !== Number(slotId));
    return { success: true };
  }
}
