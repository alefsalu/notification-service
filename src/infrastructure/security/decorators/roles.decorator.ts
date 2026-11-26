import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../application/ports/token-verifier.port.js';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
