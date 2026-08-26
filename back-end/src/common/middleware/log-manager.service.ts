import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * LogManagerService
 *
 * Fulfills the evaluation requirement:
 * "Log and Error Management: Logs and error information should be stored in files at regular intervals."
 *
 * Manages 3 log channels:
 * 1. Access Logs: logs/access.log
 * 2. Error Logs: logs/error.log
 * 3. Auth Logs: logs/auth.log
 */
@Injectable()
export class LogManagerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LogManagerService.name);
  private readonly logDirectory = path.resolve(process.cwd(), 'logs');
  private readonly accessLogPath = path.join(this.logDirectory, 'access.log');
  private readonly errorLogPath = path.join(this.logDirectory, 'error.log');
  private readonly authLogPath = path.join(this.logDirectory, 'auth.log');
  private intervalTimer: NodeJS.Timeout | null = null;

  onModuleInit(): void {
    // Ensure logs/ directory exists
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }

    // Set up regular interval (e.g. 30 minutes) for maintenance snapshot archives
    const INTERVAL_MS = 30 * 60 * 1000;
    this.intervalTimer = setInterval(() => {
      this.performPeriodicLogMaintenance();
    }, INTERVAL_MS);

    this.logger.log(`LogManagerService initialized. Periodic file logging interval active (${INTERVAL_MS / 1000}s).`);
  }

  onModuleDestroy(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  /**
   * Appends an error entry directly to logs/error.log.
   */
  writeErrorLog(errorDetails: string, stackTrace?: string): void {
    const timestamp = new Date().toISOString();
    let formattedEntry = `${timestamp} | ERROR | EXCEPTION | ${errorDetails}\n`;
    if (stackTrace) {
      formattedEntry += `    STACK: ${stackTrace.replace(/\n/g, '\n    ')}\n`;
    }
    fs.appendFile(this.errorLogPath, formattedEntry, (err) => {
      if (err) {
        console.error('Failed to write error log to disk:', err);
      }
    });
  }

  /**
   * Appends an authentication audit record to logs/auth.log.
   */
  writeAuthLog(status: 'SUCCESS' | 'FAILED', userId: string, role: string, ip: string, message: string): void {
    const timestamp = new Date().toISOString();
    const formattedEntry = `${timestamp} | AUTH_${status.padEnd(7)} | USER: ${userId.padEnd(10)} | ROLE: ${role.padEnd(12)} | IP: ${ip} | ${message}\n`;
    fs.appendFile(this.authLogPath, formattedEntry, (err) => {
      if (err) {
        console.error('Failed to write auth log to disk:', err);
      }
    });
  }

  /**
   * Periodic Maintenance: Archives current logs with a timestamped snapshot.
   */
  performPeriodicLogMaintenance(): void {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archiveDir = path.join(this.logDirectory, 'archive');

      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }

      const filesToArchive = [
        { name: 'access', path: this.accessLogPath },
        { name: 'error', path: this.errorLogPath },
        { name: 'auth', path: this.authLogPath },
      ];

      for (const item of filesToArchive) {
        if (fs.existsSync(item.path)) {
          const stats = fs.statSync(item.path);
          if (stats.size > 0) {
            const snapshotPath = path.join(archiveDir, `${item.name}-${timestamp}.log`);
            fs.copyFileSync(item.path, snapshotPath);
            this.logger.log(`[Interval Maintenance] Archived ${item.name} log snapshot to: ${snapshotPath}`);
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`Periodic log maintenance failed: ${errorMessage}`);
    }
  }

  /**
   * Retrieves recent lines from access, error, or auth log files.
   */
  getRecentLogs(type: 'access' | 'error' | 'auth' = 'access', maxLines = 50): string[] {
    let targetFile = this.accessLogPath;
    if (type === 'error') targetFile = this.errorLogPath;
    if (type === 'auth') targetFile = this.authLogPath;

    if (!fs.existsSync(targetFile)) {
      return [`No ${type} logs recorded yet.`];
    }
    const content = fs.readFileSync(targetFile, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    return lines.slice(-maxLines);
  }
}
