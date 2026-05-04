import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard – Global RBAC enforcement.
 *
 * Reads the `x-role` header from every incoming HTTP request
 * and compares it against the roles specified by the @Roles()
 * decorator on the target handler.
 *
 * If no @Roles() decorator is present, the route is public (allowed).
 * If the header is missing or the role is not in the allowed list,
 * a 403 ForbiddenException is thrown.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

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

    // Wildcard '*' means the endpoint is public (e.g. login)
    if (requiredRoles.includes('*')) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userRole = request.headers['x-role'] as string | undefined;

    if (!userRole) {
      throw new ForbiddenException(
        'Access denied. Missing x-role header.',
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
