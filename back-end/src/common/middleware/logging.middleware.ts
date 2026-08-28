import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';

/**
 * LoggingMiddleware
 *
 * Intercepts every incoming HTTP request and records:
 * 1. Request start time
 * 2. HTTP method, URL path, Client IP, User-Agent, and x-role header
 * 3. Latency in milliseconds once the response completes (res.on('finish'))
 * 4. Human-readable Status code (e.g. 200 OK, 403 FORBIDDEN)
 * 5. Pipe-separated (|) standardized log structure
 * 6. Appends to logs/access.log and logs/error.log
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');
  private readonly logDirectory = path.resolve(process.cwd(), 'logs');
  private readonly accessLogFilePath = path.join(this.logDirectory, 'access.log');
  private readonly errorLogFilePath = path.join(this.logDirectory, 'error.log');

  constructor() {
    // Automatically create the logs/ directory if it doesn't exist yet
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, originalUrl } = req;
    
    // Normalize IP address (properly handles IPv6 localhost ::1 and ::ffff: prefixes)
    let clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
      clientIp = '127.0.0.1';
    } else if (clientIp.startsWith('::ffff:')) {
      clientIp = clientIp.substring(7);
    }


    const userAgent = req.get('user-agent') || 'Unknown-Agent';
    const userRole = (req.headers['x-role'] as string) || 'Anonymous';

    // Listen for when the response has finished sending to the client
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const { statusCode } = res;
      const timestamp = new Date().toISOString();
      const statusText = this.getStatusText(statusCode);
      const level = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';

      // Exclude log reader polling probes to avoid log feedback loops
      if (originalUrl.startsWith('/super-user/logs') && statusCode < 400) {
        return;
      }

      // Standard Pipe-Separated (|) Log Format
      const logMessage = `${timestamp} | ${level.padEnd(5)} | ROLE: ${userRole.padEnd(12)} | ${method.padEnd(6)} | ${originalUrl} | ${statusCode} ${statusText} | ${responseTime}ms | IP: ${clientIp} | UA: ${userAgent}`;


      // 1. Colorized console output based on HTTP Status Code
      if (statusCode >= 500) {
        this.logger.error(logMessage);
        this.writeErrorToFile(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
        this.writeErrorToFile(logMessage);
      } else {
        this.logger.log(logMessage);
      }

      // 2. Asynchronously append all requests to logs/access.log
      this.writeAccessToFile(logMessage);
    });

    // Pass control to the next middleware or route handler in the pipeline
    next();
  }

  /**
   * Helper to return standard HTTP status text
   */
  private getStatusText(code: number): string {
    const map: Record<number, string> = {
      200: 'OK',
      201: 'CREATED',
      204: 'NO CONTENT',
      400: 'BAD REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT FOUND',
      409: 'CONFLICT',
      500: 'INTERNAL SERVER ERROR',
      502: 'BAD GATEWAY',
      503: 'SERVICE UNAVAILABLE',
    };
    return map[code] || 'STATUS';
  }

  /**
   * Appends access logs to logs/access.log
   */
  private writeAccessToFile(logEntry: string): void {
    const entryWithNewline = `${logEntry}\n`;
    fs.appendFile(this.accessLogFilePath, entryWithNewline, (err) => {
      if (err) {
        console.error('Failed to write access log to disk:', err);
      }
    });
  }

  /**
   * Appends error logs (4xx/5xx) to logs/error.log
   */
  private writeErrorToFile(errorEntry: string): void {
    const entryWithNewline = `${errorEntry}\n`;
    fs.appendFile(this.errorLogFilePath, entryWithNewline, (err) => {
      if (err) {
        console.error('Failed to write error log to disk:', err);
      }
    });
  }
}
