import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * SecurityMiddleware
 *
 * Hardens application security at the HTTP transport layer before requests reach route handlers.
 *
 * Key Responsibilities:
 * 1. Fingerprint Reduction: Removes `X-Powered-By` header to conceal backend tech stack.
 * 2. OWASP Defensive Headers:
 *    - X-Content-Type-Options: nosniff (Prevents MIME-sniffing / CWE-79)
 *    - X-Frame-Options: SAMEORIGIN (Prevents Clickjacking / CWE-1021)
 *    - X-XSS-Protection: 1; mode=block (Cross-Site Scripting filter for legacy browsers)
 *    - Strict-Transport-Security (HSTS: Enforces HTTPS)
 *    - Content-Security-Policy (CSP: Restricts origins for scripts, styles, and assets)
 *    - Referrer-Policy: strict-origin-when-cross-origin
 *    - Permissions-Policy: Disables unused hardware device APIs (camera, mic, geolocation)
 * 3. Request Sanitization: Inspects query parameters and payload keys against Prototype Pollution.
 * 4. IP-Based Rate Limiting: Defends against brute-force attacks and DoS (returns 429 Too Many Requests).
 */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  // In-memory rate limiting store: Client IP -> Record
  private readonly rateLimitStore = new Map<string, RateLimitRecord>();
  private readonly maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);
  private readonly windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10); // 1 minute

  constructor() {
    // Periodically clean up expired rate limit entries every 5 minutes to prevent memory leaks
    setInterval(() => {
      const now = Date.now();
      for (const [ip, record] of this.rateLimitStore.entries()) {
        if (now > record.resetTime) {
          this.rateLimitStore.delete(ip);
        }
      }
    }, 5 * 60 * 1000);
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // 1. Remove Fingerprinting Header
    res.removeHeader('X-Powered-By');

    // 2. Set OWASP Recommended HTTP Security Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload',
    );
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' http://localhost:* ws://localhost:*;",
    );
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()',
    );

    // 3. Request Sanitization (Prototype Pollution Defense)
    this.sanitizeIncomingRequest(req);

    // 4. IP-Based Rate Limiting Defense
    this.applyRateLimiting(req, res);

    // 5. Pass control to the next middleware or route handler
    next();
  }

  /**
   * Enforces request rate limiting per client IP address.
   */
  private applyRateLimiting(req: Request, res: Response): void {
    let clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
      clientIp = '127.0.0.1';
    } else if (clientIp.startsWith('::ffff:')) {
      clientIp = clientIp.substring(7);
    }

    const now = Date.now();
    let record = this.rateLimitStore.get(clientIp);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      this.rateLimitStore.set(clientIp, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, this.maxRequests - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    // Standard rate limit response headers (RFC 6585)
    res.setHeader('X-RateLimit-Limit', this.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', resetSeconds.toString());

    if (record.count > this.maxRequests) {
      res.setHeader('Retry-After', resetSeconds.toString());
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Maximum ${this.maxRequests} requests per minute allowed. Try again in ${resetSeconds}s.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
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
