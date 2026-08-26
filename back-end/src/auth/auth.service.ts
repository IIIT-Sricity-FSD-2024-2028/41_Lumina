import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { LogManagerService } from '../common/middleware/log-manager.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly logManager: LogManagerService,
  ) {}

  login(userId: string, password: string, clientIp = '127.0.0.1') {
    const user = this.db.users.find(
      (u) => u.userId === userId && u.password === password,
    );

    if (!user) {
      // Record failed authentication attempt in logs/auth.log
      this.logManager.writeAuthLog('FAILED', userId || 'UNKNOWN', 'Anonymous', clientIp, 'Invalid Username or Password.');
      throw new UnauthorizedException('Invalid Username or Password.');
    }

    // Record successful authentication event in logs/auth.log
    this.logManager.writeAuthLog('SUCCESS', user.userId, user.role, clientIp, 'User logged in successfully.');

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
      const student = this.db.students.find((s) => s.studentId === user.userId);
      if (student) {
        session.Current_Semester = student.currentSemester;
      }
    }

    return session;
  }
}
