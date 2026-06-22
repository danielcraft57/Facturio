#!/usr/bin/env node
/**
 * @deprecated Utiliser capture-marketing-screenshots.mjs (viewport + modales UX).
 * Capture full-page screenshots de PrestaFacture pour cadres overflow marketing.
 *
 * Prérequis :
 *   cd frontend && npm i -D playwright && npx playwright install chromium
 *
 * Usage :
 *   FACTURIO_BASE_URL=http://localhost:5173 \
 *   FACTURIO_TEST_EMAIL=demo@example.com \
 *   FACTURIO_TEST_PASSWORD=secret \
 *   node docs/marketing/scripts/capture-overflow-screenshots.mjs
 *
 * Sortie : docs/marketing/screenshots-temp/captures/<slug>.png
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadPlaywright } from './playwright-marketing-helpers.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.resolve(__dirname, '../screenshots-temp/captures')

const BASE_URL = process.env.FACTURIO_BASE_URL ?? 'http://localhost:5173'
const EMAIL = process.env.FACTURIO_TEST_EMAIL
const PASSWORD = process.env.FACTURIO_TEST_PASSWORD

/** Viewport « desktop marketing » — hauteur document capturée en fullPage */
const VIEWPORT = { width: 1440, height: 900 }

/**
 * @type {Array<{ slug: string; path: string; waitMs?: number; before?: (page: import('playwright').Page) => Promise<void> }>}
 */
const TARGETS = [
  { slug: 'landing-public', path: '/' },
  { slug: 'dashboard', path: '/dashboard', waitMs: 1500 },
  { slug: 'factures-inbox', path: '/factures/inbox', waitMs: 1200 },
  { slug: 'devis-inbox', path: '/devis/inbox', waitMs: 1200 },
  { slug: 'clients-inbox', path: '/clients/inbox', waitMs: 1200 },
  { slug: 'parametres', path: '/parametres', waitMs: 800 },
  { slug: 'tarifs-public', path: '/tarifs' },
  { slug: 'efacture-public', path: '/facturation-electronique' },
]

async function login(page) {
  if (!EMAIL || !PASSWORD) {
    console.warn('[capture] FACTURIO_TEST_EMAIL/PASSWORD absents — captures publiques uniquement.')
    return false
  }
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await page.getByLabel(/email/i).fill(EMAIL)
  await page.getByLabel(/mot de passe|password/i).fill(PASSWORD)
  await page.getByRole('button', { name: /connexion|se connecter|login/i }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 })
  return true
}

async function capturePage(browser, target, meta) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    locale: 'fr-FR',
  })
  const page = await context.newPage()
  if (meta.authenticated) {
    const ok = await login(page)
    if (!ok && target.path !== '/') {
      console.warn(`[capture] skip ${target.slug} (pas de session)`)
      await context.close()
      return
    }
  }
  const url = `${BASE_URL}${target.path}`
  await page.goto(url, { waitUntil: 'networkidle' })
  if (target.waitMs) await page.waitForTimeout(target.waitMs)
  if (target.before) await target.before(page)
  const file = path.join(OUT_DIR, `${target.slug}.png`)
  await page.screenshot({
    path: file,
    fullPage: true,
    animations: 'disabled',
  })
  console.log(`[capture] ${file}`)
  await context.close()
}

async function main() {
  let chromium
  try {
    ;({ chromium } = await loadPlaywright())
  } catch (err) {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }

  await mkdir(OUT_DIR, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const manifest = { capturedAt: new Date().toISOString(), baseUrl: BASE_URL, files: [] }

  for (const target of TARGETS) {
    const isPublic =
      target.path === '/' ||
      target.path.startsWith('/tarifs') ||
      target.path.startsWith('/facturation-electronique') ||
      target.path.startsWith('/fonctionnalites')
    await capturePage(browser, target, { authenticated: !isPublic })
    manifest.files.push({ slug: target.slug, path: target.path })
  }

  await writeFile(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  await browser.close()
  console.log(`[capture] Terminé — ${manifest.files.length} cibles dans ${OUT_DIR}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
