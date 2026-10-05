import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@regtracker/shared';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: (UserRole | 'ADMIN' | 'VIEWER')[]) => SetMetadata(ROLES_KEY, roles);
