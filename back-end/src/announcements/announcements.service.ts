import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Announcement } from '../database/interfaces';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly db: DatabaseService) {}

  findAll(): Announcement[] {
    return this.db.announcements;
  }

  create(facultyId: string, data: { courseId: string; title: string; message: string }): Announcement {
    const maxId = this.db.announcements.reduce((max, a) => Math.max(max, a.announcementId), 0);
    const newAnnouncement: Announcement = {
      announcementId: maxId + 1,
      facultyId,
      courseId: data.courseId,
      title: data.title,
      message: data.message,
      createdAt: new Date().toISOString()
    };
    this.db.announcements.unshift(newAnnouncement);
    return newAnnouncement;
  }

  update(id: number, data: { courseId: string; title: string; message: string }): Announcement {
    const idx = this.db.announcements.findIndex(a => a.announcementId === id);
    if (idx === -1) {
      throw new NotFoundException(`Announcement ${id} not found`);
    }
    this.db.announcements[idx] = {
      ...this.db.announcements[idx],
      courseId: data.courseId,
      title: data.title,
      message: data.message
    };
    return this.db.announcements[idx];
  }

  delete(id: number): { success: boolean } {
    const idx = this.db.announcements.findIndex(a => a.announcementId === id);
    if (idx === -1) {
      throw new NotFoundException(`Announcement ${id} not found`);
    }
    this.db.announcements.splice(idx, 1);
    return { success: true };
  }
}
