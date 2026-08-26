import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * SecurityMiddleware (Request Sanitization & Prototype Pollution Defense)
 *
 * Runs before route controllers and guards to protect against:
 * 1. Prototype Pollution Attacks (`__proto__`, `constructor`, `prototype` in query or body).
 * 2. Unwanted parameter injection.
 */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    this.sanitizeIncomingRequest(req);
    next();
  }

  /**
   * Inspects request query parameters and body keys for prototype pollution patterns.
   */
  private sanitizeIncomingRequest(req: Request): void {
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

    // Check URL query parameters
    if (req.query && typeof req.query === 'object') {
      for (const key of Object.keys(req.query)) {
        if (dangerousKeys.includes(key.toLowerCase())) {
          throw new BadRequestException(`Malicious query parameter detected: '${key}'`);
        }
      }
    }

    // Check JSON body if already parsed
    if (req.body && typeof req.body === 'object') {
      for (const key of Object.keys(req.body)) {
        if (dangerousKeys.includes(key.toLowerCase())) {
          throw new BadRequestException(`Malicious payload key detected: '${key}'`);
        }
      }
    }
  }
}

