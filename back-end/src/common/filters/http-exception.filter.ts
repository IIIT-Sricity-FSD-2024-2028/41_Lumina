import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

/**
 * AllExceptionsFilter
 *
 * Centralized error-handling middleware for the Lumina Academic Planning System.
 *
 * Responsibilities:
 *  1. Intercept every unhandled exception across the entire application.
 *  2. Derive an appropriate HTTP status code.
 *  3. Return a consistent, structured JSON error response to the client.
 *  4. Log every error to the console via NestJS Logger.
 *  5. Persist every error to a date-stamped file in back-end/logs/
 *     in a single-line pipe-separated format:
 *     TIMESTAMP | WARN | ROLE: <role> | METHOD | PATH | STATUS CODE+NAME | Xms | IP: x.x.x.x | UA: <agent>
 *
 * Registered globally in main.ts via app.useGlobalFilters().
 *
 * Execution flow:
 *   Any thrown exception → AllExceptionsFilter.catch()
 *     → determine status & message
 *     → log to console
 *     → append single-line entry to logs/error-YYYY-MM-DD.log
 *     → send JSON response to client
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Track response time — start time is stamped when the request entered
    const startTime: number =
      (request as any)._startTime ?? Date.now();
    const responseTimeMs = Date.now() - startTime;

    // ── 1. Determine HTTP status code ────────────────────────
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // ── 2. Determine error message ───────────────────────────
    let message: string | string[];
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        message = resObj.message ?? exception.message;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    } else {
      message = 'An unexpected error occurred';
    }

    // Normalise to array for consistent API shape
    const messages = Array.isArray(message) ? message : [message];

    // ── 3. Build structured JSON response ────────────────────
    const errorResponse = {
      statusCode: status,
      error: this.getHttpErrorName(status),
      message: messages,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    };

    // ── 4. Console logging ───────────────────────────────────
    this.logger.error(
      `[${request.method}] ${request.url} → HTTP ${status} | ${messages.join(', ')}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // ── 5. Persist error to file (single-line format) ────────
    this.writeErrorToFile(request, status, responseTimeMs, messages, exception);

    // ── 6. Send response ─────────────────────────────────────
    response.status(status).json(errorResponse);
  }

  // ─────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────

  /**
   * Appends a single-line error entry to today's log file.
   *
   * Format:
   *   TIMESTAMP | WARN | ROLE: <role> | METHOD | PATH | STATUS CODE+NAME | Xms | IP: x.x.x.x | UA: <agent>
   *
   * Example:
   *   2026-08-25T09:08:35.097Z | WARN | ROLE: Anonymous | POST | /auth/login | 401 UNAUTHORIZED | 1ms | IP: 127.0.0.1 | UA: curl/7.81.0
   *
   * File pattern: back-end/logs/error-YYYY-MM-DD.log
   */
  private writeErrorToFile(
    request: Request,
    status: number,
    responseTimeMs: number,
    messages: string[],
    exception: unknown,
  ): void {
    try {
      // ── Extract fields ──────────────────────────────────────
      const timestamp = new Date().toISOString();

      // Role from x-role header; fallback to 'Anonymous'
      const role = (request.headers['x-role'] as string) ?? 'Anonymous';

      const method  = request.method.padEnd(6);
      const urlPath = request.url;

      const statusLabel = `${status} ${this.getHttpErrorName(status).toUpperCase()}`;

      const duration = `${responseTimeMs}ms`;

      // Client IP — handle proxies (X-Forwarded-For)
      const ip =
        (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
        request.socket?.remoteAddress ??
        '0.0.0.0';

      // User-Agent header
      const ua = request.headers['user-agent'] ?? 'Unknown';

      // ── Build single log line (same fields as before, one line) ──
      const stackFirstLine =
        exception instanceof Error
          ? (exception.stack ?? '').split('\n')[0]
          : 'No stack';

      const logLine =
        `${timestamp} | WARN | ROLE: ${role} | ${method} | ${urlPath} | ${statusLabel} | ${duration} | IP: ${ip} | UA: ${ua} | MSG: ${messages.join(', ')} | ${stackFirstLine}\n`;


      // ── Write to unified logs/error.log ─────────────────────
      const logsDir     = path.resolve(process.cwd(), 'logs');
      const logFilePath = path.join(logsDir, 'error.log');

      // Auto-create logs/ directory if it does not exist
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      fs.appendFileSync(logFilePath, logLine, 'utf8');

    } catch (fileWriteError) {
      // Never let file-writing crash the application
      this.logger.warn(
        `Could not write to error log file: ${(fileWriteError as Error).message}`,
      );
    }
  }

  /**
   * Maps an HTTP status code to its standard reason-phrase string.
   */
  private getHttpErrorName(status: number): string {
    const names: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      501: 'Not Implemented',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
    };
    return names[status] ?? 'Error';
  }
}
