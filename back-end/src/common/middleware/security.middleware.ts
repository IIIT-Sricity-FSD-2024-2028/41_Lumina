import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

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
 * 3. Request Sanitization: Inspects query parameters and payload keys to defend against Prototype Pollution.
 */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // 1. Remove Fingerprinting Header
    res.removeHeader('X-Powered-By');

    // 2. Set OWASP Recommended HTTP Security Headers
    // Instructs browsers not to override the declared Content-Type (MIME-Sniffing)
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Disallows embedding this app in external iframes (Clickjacking Defense)
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    // Enables legacy browser XSS filters
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Enforces HTTPS transport (HTTP Strict Transport Security)
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload',
    );

    // Whitelists trusted content sources
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' http://localhost:* ws://localhost:*;",
    );

    // Limits referrer leakage to third-party domains
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Explicitly restricts access to sensitive browser device features
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()',
    );

    // 3. Request Sanitization (Prototype Pollution Defense)
    this.sanitizeIncomingRequest(req);

    // 4. Pass control to the next middleware or route handler
    next();
  }

  /**
   * Inspects request query parameters and body keys for prototype pollution patterns.
   * If detected, throws a 400 BadRequestException immediately.
   */
  private sanitizeIncomingRequest(req: Request): void {
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

    // Check URL query parameters (e.g. ?__proto__[isAdmin]=true)
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
