import { SetMetadata } from '@nestjs/common';

/**
 * Custom decorator to attach required roles metadata to a route handler.
 * Usage: @Roles('Dean', 'Faculty')
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
