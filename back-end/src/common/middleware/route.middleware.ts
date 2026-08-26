import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface RouteContext {
  timestamp: string;
  method: string;
  route: string;
  role: string;
  isPublic: boolean;
}

// Extend Express Request interface to include routeContext
declare global {
  namespace Express {
    interface Request {
      routeContext?: RouteContext;
    }
  }
}

/**
 * RouteMiddleware – Dedicated Router-Level Middleware.
 *
 * Intercepts incoming requests at the router level to:
 * 1. Extract and attach custom route metadata/context (`req.routeContext`).
 * 2. Exempt public routes (e.g. `/auth/login`, `/api`, `/docs`, `/`).
 * 3. Validate the `x-role` header on all protected routes, throwing a
 *    403 ForbiddenException if missing.
 */
@Injectable()
export class RouteMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const originalUrl = req.originalUrl || req.url || '';
    const method = req.method;
    const roleHeader = req.headers['x-role'] as string | undefined;

    // Check if the route is exempted / public
    const isPublicRoute =
      originalUrl.startsWith('/auth/login') ||
      originalUrl.startsWith('/api') ||
      originalUrl.startsWith('/docs') ||
      originalUrl === '/' ||
      originalUrl === '';

    // Enforce 403 Forbidden at router level for protected routes missing x-role
    if (!isPublicRoute && !roleHeader) {
      throw new ForbiddenException(
        'Access denied. Missing x-role header for protected route.',
      );
    }

    // Attach enriched route metadata/context
    req.routeContext = {
      timestamp: new Date().toISOString(),
      method,
      route: originalUrl,
      role: roleHeader || 'PUBLIC',
      isPublic: isPublicRoute,
    };

    next();
  }
}
