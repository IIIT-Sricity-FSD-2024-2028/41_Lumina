import { DatabaseService } from '../database/database.service';
import { Section } from '../database/interfaces';
export declare class SectionsService {
    private readonly db;
    constructor(db: DatabaseService);
    findAll(): Section[];
    create(data: Omit<Section, ''>): Section;
    update(sectionId: string, data: Partial<Section>): Section;
    remove(sectionId: string): {
        success: boolean;
    };
}
