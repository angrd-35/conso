import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Exclut une route du contrôle d'identité Authelia (ex. healthcheck). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
