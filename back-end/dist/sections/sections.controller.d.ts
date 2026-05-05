import { SectionsService } from './sections.service';
export declare class SectionsController {
    private readonly sectionsService;
    constructor(sectionsService: SectionsService);
    findAll(): import("../database").Section[];
    create(data: any): import("../database").Section;
    update(id: string, data: any): import("../database").Section;
    remove(id: string): {
        success: boolean;
    };
}
