import { DatabaseService } from '../database.service';
import { User } from '../interfaces';
export declare class UsersService {
    private readonly db;
    constructor(db: DatabaseService);
    findAll(): User[];
    create(data: {
        userId: string;
        fullName: string;
        email: string;
        password: string;
        role: string;
        deptId: string;
    }): User;
    update(userId: string, data: {
        fullName?: string;
        email?: string;
        role?: string;
        deptId?: string;
    }): User;
    delete(userId: string): {
        deleted: boolean;
    };
}
