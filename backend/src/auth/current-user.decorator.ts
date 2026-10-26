import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { ForwardAuthUser } from './forward-auth-user.js';

export type RequestWithUser = Request & { user?: ForwardAuthUser };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ForwardAuthUser | undefined =>
    ctx.switchToHttp().getRequest<RequestWithUser>().user,
);
