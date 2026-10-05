import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private reflector: Reflector) {
    if (!this.reflector) {
      this.reflector = new Reflector();
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const reflector = this.reflector || new Reflector();
    const requiredRoles = reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('User authentication required');
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(`Insufficient permissions. Required role(s): ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
