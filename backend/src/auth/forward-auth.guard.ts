import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { ForwardAuthUser } from './forward-auth-user.js';
import type { RequestWithUser } from './current-user.decorator.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

/**
 * Identifie l'utilisateur via les headers Remote-* posés par le middleware
 * forward-auth Authelia (via Traefik) et vérifie son appartenance au groupe requis.
 *
 * Sécurité : ces headers ne sont dignes de confiance que si le backend n'est
 * joignable QUE via Traefik (aucun port publié, réseau Docker privé).
 */
@Injectable()
export class ForwardAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<RequestWithUser>();

    // Dev local : pas de NPM, on simule un utilisateur.
    if (this.config.get<string>('AUTH_REQUIRED') === 'false') {
      req.user = {
        username: this.config.get<string>('AUTH_DEV_USER') ?? 'dev',
        groups: [],
      };
      return true;
    }

    const username = this.header(req, 'remote-user');
    if (!username) {
      throw new UnauthorizedException('Non authentifié');
    }

    const user: ForwardAuthUser = {
      username,
      email: this.header(req, 'remote-email'),
      name: this.header(req, 'remote-name'),
      groups: (this.header(req, 'remote-groups') ?? '')
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean),
    };

    const requiredGroup = this.config.get<string>('AUTH_REQUIRED_GROUP') ?? 'conso-users';
    if (requiredGroup && !user.groups.includes(requiredGroup)) {
      throw new ForbiddenException('Accès refusé');
    }

    req.user = user;
    return true;
  }

  private header(req: RequestWithUser, name: string): string | undefined {
    const value = req.headers[name];
    const first = Array.isArray(value) ? value[0] : value;
    return first?.trim() || undefined;
  }
}
