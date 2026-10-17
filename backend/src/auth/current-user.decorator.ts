import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthentikUser } from './authentik-user.js';

export type RequestWithUser = Request & { user?: AuthentikUser };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthentikUser | undefined =>
    ctx.switchToHttp().getRequest<RequestWithUser>().user,
);
