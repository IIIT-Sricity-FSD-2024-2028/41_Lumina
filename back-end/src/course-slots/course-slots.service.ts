import { Injectable, NotFoundException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
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

  uploadSyllabus(slotId: number, file: Express.Multer.File) {
    const slot = this.db.courseSlots.find(s => s.slotId === Number(slotId));
    if (!slot) {
      if (file?.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new NotFoundException(`Course Slot ${slotId} not found`);
    }

    const relativePath = path.relative(process.cwd(), file.path).replace(/\\/g, '/');
    slot.syllabus = relativePath;

    return {
      success: true,
      message: 'Syllabus uploaded successfully',
      slotId: slot.slotId,
      file: {
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        path: relativePath,
      },
      slot,
    };
  }
}

