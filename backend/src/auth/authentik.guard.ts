import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { AuthentikUser } from './authentik-user.js';
import type { RequestWithUser } from './current-user.decorator.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

/**
 * Identifie l'utilisateur via les headers posés par Nginx Proxy Manager
 * (forward auth Authentik) et vérifie son appartenance au groupe requis.
 *
 * Sécurité : ces headers ne sont dignes de confiance que si le backend n'est
 * joignable QUE via NPM (aucun port publié, réseau Docker privé).
 */
@Injectable()
export class AuthentikGuard implements CanActivate {
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

    const username = this.header(req, 'x-authentik-username');
    if (!username) {
      throw new UnauthorizedException('Non authentifié');
    }

    const user: AuthentikUser = {
      username,
      email: this.header(req, 'x-authentik-email'),
      name: this.header(req, 'x-authentik-name'),
      groups: (this.header(req, 'x-authentik-groups') ?? '')
        .split('|')
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
