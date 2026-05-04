import { AnnouncementsService } from './announcements.service';
export declare class AnnouncementsController {
    private readonly announcementsService;
    constructor(announcementsService: AnnouncementsService);
    findAll(): import("../database").Announcement[];
    create(userId: string, data: any): import("../database").Announcement;
    update(id: string, data: any): import("../database").Announcement;
    delete(id: string): {
        success: boolean;
    };
}
