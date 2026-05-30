#!/usr/bin/env node
/**
 * Captures marketing (viewport + quelques full-page) pour landing / overflow.
 *
 * Prérequis :
 *   npm run seed:playwright --prefix server
 *   npm run start:all
 *   cd frontend && npx playwright install chromium
 *
 * Usage :
 *   node docs/marketing/scripts/capture-marketing-screenshots.mjs
 *
 * Sortie :
 *   docs/marketing/screenshots-temp/captures/*.png
 *   frontend/public/images/marketing/overflow/captures/*.png
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  VIEWPORT,
  envBaseUrl,
  login,
  snap,
  waitForAppShell,
} from './playwright-marketing-helpers.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.resolve(__dirname, '../screenshots-temp/captures')
const PUBLIC_DIR = path.resolve(__dirname, '../../../frontend/public/images/marketing/overflow/captures')
const BASE_URL = envBaseUrl()

function pub(slug) {
  return { publicPath: path.join(PUBLIC_DIR, `${slug}.png`) }
}

/** @type {Array<{ slug: string, path: string, waitMs?: number, fullPage?: boolean, before?: (page: import('playwright').Page) => Promise<void> }>} */
const TARGETS = [
  { slug: 'dashboard', path: '/dashboard', waitMs: 2000 },
  { slug: 'clients-inbox', path: '/clients/inbox', waitMs: 1200 },
  { slug: 'clients-prospects', path: '/clients/prospects', waitMs: 1000 },
  {
    slug: 'produits-catalogue',
    path: '/produits',
    waitMs: 1500,
    before: async (page) => {
      await page.getByRole('button', { name: /^catalogue$/i }).click()
    },
  },
  {
    slug: 'produits-liste',
    path: '/produits',
    waitMs: 800,
    before: async (page) => {
      await page.getByRole('button', { name: /^liste$/i }).click()
    },
  },
  {
    slug: 'produits-compact',
    path: '/produits',
    waitMs: 800,
    before: async (page) => {
      await page.getByRole('button', { name: /^compact$/i }).click()
    },
  },
  {
    slug: 'produits-nouveau',
    path: '/produits',
    waitMs: 600,
    before: async (page) => {
      await page.getByRole('button', { name: /nouveau produit/i }).click()
      await page.getByRole('heading', { name: /nouveau produit|modifier/i }).waitFor({ timeout: 10_000 })
    },
  },
  { slug: 'factures-inbox', path: '/factures/inbox', waitMs: 1400 },
  { slug: 'factures-brouillons', path: '/factures/brouillons', waitMs: 1000 },
  { slug: 'factures-envoyes', path: '/factures/envoyes', waitMs: 1000 },
  { slug: 'factures-important', path: '/factures/important', waitMs: 1000 },
  { slug: 'devis-inbox', path: '/devis/inbox', waitMs: 1400 },
  { slug: 'devis-brouillons', path: '/devis/brouillons', waitMs: 1000 },
  { slug: 'devis-envoyes', path: '/devis/envoyes', waitMs: 1000 },
  {
    slug: 'devis-nouveau-modal',
    path: '/devis/inbox',
    waitMs: 400,
    before: async (page) => {
      await page.getByRole('button', { name: /nouveau devis/i }).first().click()
      await page.getByText(/nouveau devis/i).first().waitFor({ timeout: 10_000 })
    },
  },
  {
    slug: 'factures-nouvelle-modal',
    path: '/factures/inbox',
    waitMs: 400,
    before: async (page) => {
      await page.getByRole('button', { name: /nouvelle facture/i }).first().click()
      await page.getByText(/nouvelle facture/i).first().waitFor({ timeout: 10_000 })
    },
  },
  {
    slug: 'facture-detail',
    path: '/factures/inbox',
    waitMs: 500,
    before: async (page) => {
      const link = page.locator('table tbody tr a').first()
      await link.waitFor({ timeout: 15_000 })
      await link.click()
      await page.waitForURL(/\/factures\/voir\//, { timeout: 20_000 })
      await page.waitForTimeout(1200)
    },
  },
  {
    slug: 'devis-detail',
    path: '/devis/inbox',
    waitMs: 500,
    before: async (page) => {
      const link = page.locator('table tbody tr a').first()
      await link.waitFor({ timeout: 15_000 })
      await link.click()
      await page.waitForURL(/\/devis\/voir\//, { timeout: 20_000 })
      await page.waitForTimeout(1200)
    },
  },
  { slug: 'comptabilite', path: '/comptabilite', waitMs: 2000 },
  { slug: 'parametres', path: '/parametres', waitMs: 1000 },
  { slug: 'parametres-entreprise', path: '/parametres/entreprise', waitMs: 1500 },
  { slug: 'parametres-efacture', path: '/parametres/facturation-electronique', waitMs: 1200 },
]

async function main() {
  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch {
    console.error(
      'Playwright manquant : cd frontend && npm i -D playwright && npx playwright install chromium',
    )
    process.exit(1)
  }

  await mkdir(OUT_DIR, { recursive: true })
  await mkdir(PUBLIC_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    locale: 'fr-FR',
  })
  const page = await context.newPage()

  console.log(`[capture] Connexion ${envCredentials().email} @ ${BASE_URL}`)
  await login(page, BASE_URL)

  const manifest = { capturedAt: new Date().toISOString(), baseUrl: BASE_URL, files: [] }

  for (const target of TARGETS) {
    const file = path.join(OUT_DIR, `${target.slug}.png`)
    try {
      await page.goto(`${BASE_URL}${target.path}`, { waitUntil: 'networkidle' })
      await waitForAppShell(page)
      if (target.before) await target.before(page)
      await snap(page, file, {
        ...pub(target.slug),
        fullPage: target.fullPage ?? false,
        waitMs: target.waitMs,
      })
      console.log(`[capture] ✓ ${target.slug}`)
      manifest.files.push({ slug: target.slug, path: target.path })
    } catch (err) {
      console.warn(`[capture] ✗ ${target.slug}:`, err.message)
    }
  }

  await writeFile(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  await browser.close()
  console.log(`\n[capture] ${manifest.files.length}/${TARGETS.length} OK → ${PUBLIC_DIR}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
