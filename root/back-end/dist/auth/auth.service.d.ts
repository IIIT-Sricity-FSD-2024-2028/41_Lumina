import { DatabaseService } from '../database/database.service';
export declare class AuthService {
    private readonly db;
    constructor(db: DatabaseService);
    login(userId: string, password: string): Record<string, any>;
}
