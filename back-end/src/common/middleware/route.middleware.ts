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
 * 3. Validate authentication (Authorization Bearer JWT or x-role header) on all protected routes.
 */
@Injectable()
export class RouteMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const originalUrl = req.originalUrl || req.url || '';
    const method = req.method;
    const authHeader = req.headers['authorization'] as string | undefined;
    const roleHeader = req.headers['x-role'] as string | undefined;

    // Check if the route is exempted / public
    const isPublicRoute =
      originalUrl.startsWith('/auth/login') ||
      originalUrl.startsWith('/revenue/plans') ||
      originalUrl.startsWith('/revenue/tier') ||
      originalUrl.startsWith('/api') ||
      originalUrl.startsWith('/docs') ||
      originalUrl === '/' ||
      originalUrl === '';



    // Enforce 403 Forbidden at router level for protected routes missing credentials
    if (!isPublicRoute && !roleHeader && !authHeader) {
      throw new ForbiddenException(
        'Access denied. Missing Authorization Bearer token or x-role header for protected route.',
      );
    }

    // Attach enriched route metadata/context
    req.routeContext = {
      timestamp: new Date().toISOString(),
      method,
      route: originalUrl,
      role: roleHeader || (authHeader ? 'JWT_USER' : 'PUBLIC'),
      isPublic: isPublicRoute,
    };

    next();
  }
}
