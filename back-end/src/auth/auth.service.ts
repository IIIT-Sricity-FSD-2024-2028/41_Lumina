import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { LogManagerService } from '../common/middleware/log-manager.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly logManager: LogManagerService,
    private readonly jwtService: JwtService,
  ) {}

  login(userId: string, password: string, clientIp = '127.0.0.1') {
    const user = this.db.users.find(
      (u) => (u.userId.toLowerCase() === (userId || '').toLowerCase() || u.email.toLowerCase() === (userId || '').toLowerCase()) && u.password === password,
    );


    if (!user) {
      // Record failed authentication attempt in logs/auth.log
      this.logManager.writeAuthLog('FAILED', userId || 'UNKNOWN', 'Anonymous', clientIp, 'Invalid Username or Password.');
      throw new UnauthorizedException('Invalid Username or Password.');
    }

    // Record successful authentication event in logs/auth.log
    this.logManager.writeAuthLog('SUCCESS', user.userId, user.role, clientIp, 'User logged in successfully.');

    // Generate cryptographic signed JWT token
    const payload = {
      sub: user.userId,
      userId: user.userId,
      role: user.role,
      email: user.email,
      deptId: user.deptId,
    };
    const accessToken = this.jwtService.sign(payload);

    // Return session-compatible object (PascalCase keys for frontend compatibility + JWT)
    const session: Record<string, any> = {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_EXPIRATION || '24h',
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

