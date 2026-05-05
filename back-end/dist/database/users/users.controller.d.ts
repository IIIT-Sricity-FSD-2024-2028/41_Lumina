import { UsersService } from './users.service';
import { CreateUserDto } from '../../common/dto/create-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): import("..").User[];
    create(dto: CreateUserDto): import("..").User;
    update(id: string, body: any): import("..").User;
    remove(id: string): {
        deleted: boolean;
    };
}
