import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuthService {
  constructor(private readonly db: DatabaseService) {}

  login(userId: string, password: string) {
    const user = this.db.users.find(
      u => u.userId === userId && u.password === password,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid Username or Password.');
    }

    // Return session-compatible object (PascalCase keys for frontend compatibility)
    const session: Record<string, any> = {
      User_ID: user.userId,
      Full_Name: user.fullName,
      Email: user.email,
      Role: user.role,
      Dept_ID: user.deptId,
    };

    // Include semester info for Student users
    if (user.role === 'Student') {
      const student = this.db.students.find(s => s.studentId === user.userId);
      if (student) {
        session.Current_Semester = student.currentSemester;
      }
    }

    return session;
  }
}
