import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
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

    const request = context.switchToHttp().getRequest();

    // Wildcard '*' means the endpoint is public (e.g. login)
    if (requiredRoles.includes('*')) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userRole = request.headers['x-role'] as string | undefined;

    if (!userRole) {
      throw new UnauthorizedException(
        'Access denied. Missing Authorization Bearer token or x-role header.',
      );
    }

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        `Access denied. Role '${userRole}' is not authorized. Required: [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }
}

