import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../../database/database.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard – Global RBAC & JWT Authentication enforcement.
 *
 * Checks for:
 * 1. `Authorization: Bearer <jwt>` -> Cryptographically verifies token & extracts role.
 * 2. Fallback to `x-role` header -> Backwards-compatible development mode.
 *
 * Compares role against the @Roles(...) decorator on the target handler.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly db: DatabaseService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Retrieve the roles metadata set by @Roles() on the handler
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are specified, the endpoint is open
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Wildcard '*' means the endpoint is public (e.g. login, logout)
    if (requiredRoles.includes('*')) {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers['authorization'] as string | undefined;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        try {
          const decoded = this.jwtService.verify(token, {
            secret:
              process.env.JWT_SECRET ||
              'lumina_super_secure_jwt_secret_key_2026_academic_platform',
          });
          request.user = decoded;
        } catch {
          // Public endpoint: permit access without blocking on expired/invalid token
        }
      }
      return true;
    }

    const request = context.switchToHttp().getRequest();
    let userRole: string | undefined;

    // ── 1. JWT Authentication (Industry Standard) ─────────────
    const authHeader = request.headers['authorization'] as string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();

      // Check if token has been blacklisted / invalidated on logout or superseded by new login
      if (this.db.isTokenRevoked(token)) {
        throw new UnauthorizedException(
          'Authentication token has been revoked or invalidated. Please log in again.',
        );
      }

      try {
        const decoded = this.jwtService.verify(token, {
          secret:
            process.env.JWT_SECRET ||
            'lumina_super_secure_jwt_secret_key_2026_academic_platform',
        });
        request.user = decoded;
        userRole = decoded.role;
      } catch (err) {
        throw new UnauthorizedException(
          'Authentication token has expired or is invalid. Please log in again.',
        );
      }
    }


    // ── 2. Fallback to x-role header (Compatibility Mode) ─────
    if (!userRole) {
      userRole = request.headers['x-role'] as string | undefined;
    }

    if (!userRole) {
      throw new UnauthorizedException(
        'Access denied. Missing Authorization Bearer token or x-role header.',
      );
    }

    // ── 3. Super_User Universal Supervisory Access ───────────
    if (userRole === 'Super_User') {
      return true;
    }

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        `Access denied. Role '${userRole}' is not authorized. Required: [${requiredRoles.join(', ')}]`,
      );
    }

    return true;

  }
}
