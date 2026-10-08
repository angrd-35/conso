import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

export function getUploadsDir(): string {
  const dir = process.env.UPLOADS_DIR ?? join(process.cwd(), 'data', 'uploads');
  mkdirSync(dir, { recursive: true });
  return dir;
}

export const PHOTO_MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
