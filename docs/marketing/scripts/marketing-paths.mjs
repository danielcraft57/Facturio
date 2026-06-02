import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Dossier unique de production pub (captures, vidéos, audio, sous-titres, exports). */
export const PUB_ROOT = path.resolve(__dirname, '../pub-2026')

export const PATHS = {
  root: PUB_ROOT,
  storyboard: path.join(PUB_ROOT, 'storyboard.json'),
  captures: path.join(PUB_ROOT, 'captures'),
  videos: path.join(PUB_ROOT, 'videos'),
  workflow: path.join(PUB_ROOT, 'workflow'),
  audio: path.join(PUB_ROOT, 'audio'),
  subtitles: path.join(PUB_ROOT, 'subtitles'),
  exports: path.join(PUB_ROOT, 'exports'),
  manifest: path.join(PUB_ROOT, 'manifest.json'),
  /** Session Playwright (cookies + localStorage) — généré par marketing:clips / workflow */
  authState: path.join(PUB_ROOT, '.playwright-auth.json'),
}

/** Copie optionnelle vers la landing (Vite). */
export const PUBLIC_OVERFLOW_CAPTURES = path.resolve(
  __dirname,
  '../../../frontend/public/images/marketing/overflow/captures',
)

export const syncPublic = () =>
  process.env.MARKETING_SYNC_PUBLIC === '1' || process.argv.includes('--sync-public')
