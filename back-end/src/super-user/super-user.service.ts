import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { LogManagerService } from '../common/middleware/log-manager.service';
import * as os from 'os';

/**
 * SuperUserService
 *
 * Provides administrative business logic for the Super User (Top Admin):
 * 1. Log querying and inspection (Access Logs, Error Logs).
 * 2. System health metrics (Memory usage, Node uptime, Platform info).
 * 3. Global ecosystem stats (Total Users, Courses, Sections, Registrations).
 * 4. On-demand log archive triggers.
 */
@Injectable()
export class SuperUserService {
  constructor(
    private readonly db: DatabaseService,
    private readonly logManager: LogManagerService,
  ) {}

  /**
   * Retrieves access, error, or auth log lines from the server filesystem.
   */
  getSystemLogs(type: 'access' | 'error' | 'auth' = 'access', maxLines = 50) {
    const logs = this.logManager.getRecentLogs(type, maxLines);
    return {
      logType: type,
      totalLinesRetrieved: logs.length,
      timestamp: new Date().toISOString(),
      logs,
    };
  }


  /**
   * Triggers an immediate log maintenance archive run.
   */
  triggerLogArchive() {
    this.logManager.performPeriodicLogMaintenance();
    return {
      success: true,
      message: 'Log maintenance and snapshot archive executed successfully.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Aggregates live system health, process metrics, and database ecosystem stats.
   */
  getSystemHealth() {
    const memoryUsage = process.memoryUsage();
    return {
      server: {
        status: 'ONLINE',
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        cpuCount: os.cpus().length,
        freeMemoryMB: Math.round(os.freemem() / (1024 * 1024)),
        totalMemoryMB: Math.round(os.totalmem() / (1024 * 1024)),
        processMemory: {
          heapUsedMB: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
          heapTotalMB: Math.round(memoryUsage.heapTotal / (1024 * 1024)),
          rssMB: Math.round(memoryUsage.rss / (1024 * 1024)),
        },
      },
      ecosystem: {
        totalUsers: this.db.users.length,
        totalStudents: this.db.students.length,
        totalDepartments: this.db.departments.length,
        totalCourses: this.db.courseCatalog.length,
        totalSections: this.db.sections.length,
        totalRegistrations: this.db.registrations.length,
        policyStatus: this.db.policySettings.systemStatus,
        windowStatus: this.db.policySettings.windowStatus,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Returns a breakdown of all system users by role.
   */
  getAllUsersSummary() {
    const roleCounts: Record<string, number> = {};
    for (const user of this.db.users) {
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
    }

    return {
      totalUsers: this.db.users.length,
      roleBreakdown: roleCounts,
      users: this.db.users.map((u) => ({
        userId: u.userId,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        deptId: u.deptId,
      })),
    };
  }
}
