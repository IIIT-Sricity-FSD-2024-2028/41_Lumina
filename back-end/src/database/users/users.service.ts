import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database.service';
import { User } from '../interfaces';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  findAll(): User[] {
    return this.db.users;
  }

  create(data: {
    userId: string;
    fullName: string;
    email: string;
    password: string;
    role: string;
    deptId: string;
  }): User {
    // Check for duplicate ID
    if (this.db.users.some(u => u.userId === data.userId)) {
      throw new BadRequestException(`User ID '${data.userId}' already exists.`);
    }

    const newUser: User = {
      userId: data.userId,
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      role: data.role as User['role'],
      deptId: data.deptId,
    };
    this.db.users.push(newUser);
    return newUser;
  }

  update(
    userId: string,
    data: { fullName?: string; email?: string; role?: string; deptId?: string },
  ): User {
    const user = this.db.users.find(u => u.userId === userId);
    if (!user) {
      throw new NotFoundException(`User '${userId}' not found.`);
    }
    if (data.fullName !== undefined) user.fullName = data.fullName;
    if (data.email !== undefined) user.email = data.email;
    if (data.role !== undefined) user.role = data.role as User['role'];
    if (data.deptId !== undefined) user.deptId = data.deptId;
    return user;
  }

  delete(userId: string): { deleted: boolean } {
    const index = this.db.users.findIndex(u => u.userId === userId);
    if (index === -1) {
      throw new NotFoundException(`User '${userId}' not found.`);
    }
    this.db.users.splice(index, 1);
    return { deleted: true };
  }
}
