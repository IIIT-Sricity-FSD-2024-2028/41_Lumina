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
 *  5. Persist every error to a date-stamped file in back-end/logs/.
 *
 * Registered globally in main.ts via app.useGlobalFilters().
 *
 * Execution flow:
 *   Any thrown exception → AllExceptionsFilter.catch()
 *     → determine status & message
 *     → log to console
 *     → append to logs/error-YYYY-MM-DD.log
 *     → send JSON response to client
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

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

    // ── 3. Build structured error response ───────────────────
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

    // ── 5. Persist error to file ─────────────────────────────
    this.writeErrorToFile(errorResponse, exception);

    // ── 6. Send response ─────────────────────────────────────
    response.status(status).json(errorResponse);
  }

  // ─────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────

  /**
   * Appends a structured error entry to today's log file.
   * File pattern: back-end/logs/error-YYYY-MM-DD.log
   * Each entry is a JSON object followed by a newline separator.
   */
  private writeErrorToFile(errorResponse: object, exception: unknown): void {
    try {
      const stackTrace =
        exception instanceof Error
          ? exception.stack ?? 'No stack trace available'
          : 'No stack trace available';

      const logEntry = {
        ...errorResponse,
        stack: stackTrace,
      };

      // Build file path relative to the process working directory (back-end/)
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const logsDir = path.resolve(process.cwd(), 'logs');
      const logFilePath = path.join(logsDir, `error-${today}.log`);

      // Create logs/ directory automatically if it does not exist
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      // Append entry — uses a separator line for readability
      const separator = '\n' + '-'.repeat(80) + '\n';
      fs.appendFileSync(
        logFilePath,
        JSON.stringify(logEntry, null, 2) + separator,
        'utf8',
      );
    } catch (fileWriteError) {
      // Failing to write the log must never crash the application
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
