import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthentikGuard } from './authentik.guard.js';

function makeGuard(env: Record<string, string> = {}, isPublic = false) {
  const reflector = { getAllAndOverride: () => isPublic } as unknown as Reflector;
  const config = { get: (k: string) => env[k] } as unknown as ConfigService;
  return new AuthentikGuard(reflector, config);
}

function makeContext(headers: Record<string, string>) {
  const req: { headers: Record<string, string>; user?: unknown } = { headers };
  const ctx = {
    getHandler: () => null,
    getClass: () => null,
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
  return { ctx, req };
}

describe('AuthentikGuard', () => {
  it('rejette sans header username (401)', () => {
    const { ctx } = makeContext({});
    expect(() => makeGuard().canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('rejette si le groupe requis est absent (403)', () => {
    const { ctx } = makeContext({
      'x-authentik-username': 'bob',
      'x-authentik-groups': 'autre',
    });
    expect(() => makeGuard().canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('accepte et expose l\'utilisateur', () => {
    const { ctx, req } = makeContext({
      'x-authentik-username': 'bob',
      'x-authentik-email': 'bob@example.org',
      'x-authentik-groups': 'a|conso-users',
    });
    expect(makeGuard().canActivate(ctx)).toBe(true);
    expect(req.user).toEqual({
      username: 'bob',
      email: 'bob@example.org',
      name: undefined,
      groups: ['a', 'conso-users'],
    });
  });

  it('laisse passer les routes publiques', () => {
    const { ctx } = makeContext({});
    expect(makeGuard({}, true).canActivate(ctx)).toBe(true);
  });

  it('simule un utilisateur si AUTH_REQUIRED=false', () => {
    const { ctx, req } = makeContext({});
    expect(makeGuard({ AUTH_REQUIRED: 'false' }).canActivate(ctx)).toBe(true);
    expect(req.user).toMatchObject({ username: 'dev' });
  });
});
