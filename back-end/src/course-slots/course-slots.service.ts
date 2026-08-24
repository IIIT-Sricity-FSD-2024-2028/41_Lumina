import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CourseSlot } from '../database/interfaces';
import { CreateCourseSlotDto, UpdateCourseSlotDto } from '../common/dto';

@Injectable()
export class CourseSlotsService {
  constructor(private readonly db: DatabaseService) {}

  findAll(): CourseSlot[] {
    return this.db.courseSlots;
  }

  create(data: CreateCourseSlotDto): CourseSlot {
    const maxId = this.db.courseSlots.reduce((max, s) => Math.max(max, s.slotId), 0);
    const newSlot: CourseSlot = {
      slotId: maxId + 1,
      sectionId: data.sectionId,
      facultyId: data.facultyId,
      roomNumber: data.roomNumber,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      syllabus: data.syllabus ?? null,
    };
    this.db.courseSlots.push(newSlot);
    return newSlot;
  }

  update(slotId: number, data: UpdateCourseSlotDto): CourseSlot {
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
