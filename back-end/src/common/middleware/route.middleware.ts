import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from '../../database/database.service';

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
 * 4. Enforce global Read-Only write-lock when institutional tenant is in 60-day Grace Period.
 */
@Injectable()
export class RouteMiddleware implements NestMiddleware {
  constructor(private readonly db: DatabaseService) {}

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
      (originalUrl.startsWith('/admin/dockets') && method === 'POST') ||
      originalUrl.startsWith('/api') ||
      originalUrl.startsWith('/docs') ||
      originalUrl.startsWith('/health') ||
      originalUrl === '/favicon.ico' ||
      originalUrl === '/' ||
      originalUrl === '';

    // Enforce 403 Forbidden at router level for protected routes missing credentials
    if (!isPublicRoute && !roleHeader && !authHeader) {
      throw new ForbiddenException(
        'Access denied. Missing Authorization Bearer token or x-role header for protected route.',
      );
    }

    // Enforce Institute-Level Read-Only lock during Grace Period or Suspension
    // Platform operators (Super_User, Lumina_SPOC, Admin) and platform administration routes are EXEMPT
    const planStatus = this.db?.activeInstitutePlan?.status;
    const isMutatingMethod = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
    const isPlatformAdmin = roleHeader === 'Super_User' || roleHeader === 'Lumina_SPOC' || roleHeader === 'Admin';
    const isPlatformRoute = originalUrl.startsWith('/super-user') || originalUrl.startsWith('/admin');

    if ((planStatus === 'Read_Only_Grace_Period' || planStatus === 'Suspended') && !isPlatformAdmin && !isPlatformRoute) {
      const isExemptMutatingRoute =
        originalUrl.startsWith('/auth/login') ||
        originalUrl.startsWith('/revenue/simulate-grace-period') ||
        originalUrl.startsWith('/revenue/tier');

      if (isMutatingMethod && !isExemptMutatingRoute) {
        throw new ForbiddenException(
          'Operation locked: Your university’s SaaS subscription is currently in a 60-Day Read-Only Grace Period. Write and modification operations (enrollments, announcements, grading, course creation) are disabled until the subscription is reactivated.',
        );
      }
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
