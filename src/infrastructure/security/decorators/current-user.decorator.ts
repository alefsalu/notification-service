import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../../../application/ports/token-verifier.port.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
