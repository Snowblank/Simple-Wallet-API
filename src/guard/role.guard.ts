import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export enum ERoleUser {
    USER,
    ADMIN
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ERoleUser[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(
        private reflector: Reflector
    ) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<ERoleUser[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();
        if (requiredRoles.some((targetRole) => user.role === targetRole) == false) {
            throw new ForbiddenException()
        }
        return true
    }
}