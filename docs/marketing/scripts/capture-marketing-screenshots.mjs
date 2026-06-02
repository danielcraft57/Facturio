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
 * Sortie : docs/marketing/pub-2026/captures/ (option --sync-public pour la landing)
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { PATHS, syncPublic, PUBLIC_OVERFLOW_CAPTURES } from './marketing-paths.mjs'
import { captureFilename } from './marketing-screenshot-env.mjs'
import {
  envBaseUrl,
  envCredentials,
  assertAppReachable,
  login,
  openMegaMenu,
  snap,
  loadPlaywright,
  gotoReady,
  createMarketingContext,
  getViewport,
  syncAccountingFromInvoices,
  navigateToFirstInvoiceDetail,
  navigateToFirstQuoteDetail,
} from './playwright-marketing-helpers.mjs'
import {
  fillQuoteModal,
  fillInvoiceModal,
  fillNewProductWizard,
  fillEditProductWizard,
  openFirstProductForEdit,
} from './playwright-marketing-forms.mjs'

const OUT_DIR = PATHS.captures
const BASE_URL = envBaseUrl()

function pub(slug) {
  return syncPublic() ? { publicPath: path.join(PUBLIC_OVERFLOW_CAPTURES, `${slug}.png`) } : {}
}

/** @type {Array<{ slug: string, path: string, waitMs?: number, fullPage?: boolean, before?: (page: import('playwright').Page) => Promise<void> }>} */
const TARGETS = [
  { slug: 'dashboard', path: '/dashboard', waitMs: 2000 },
  {
    slug: 'menu-commercial',
    path: '/dashboard',
    waitMs: 600,
    before: async (page) => {
      await openMegaMenu(page, 'Commercial')
    },
  },
  {
    slug: 'menu-finance',
    path: '/dashboard',
    waitMs: 600,
    before: async (page) => {
      await openMegaMenu(page, 'Finance')
    },
  },
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
      await fillNewProductWizard(page)
    },
  },
  {
    slug: 'produits-modifier',
    path: '/produits',
    waitMs: 700,
    before: async (page) => {
      await openFirstProductForEdit(page)
      await fillEditProductWizard(page)
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
    waitMs: 500,
    before: async (page) => {
      await page.getByRole('button', { name: /nouveau devis/i }).first().click()
      await fillQuoteModal(page)
    },
  },
  {
    slug: 'factures-nouvelle-modal',
    path: '/factures/inbox',
    waitMs: 500,
    before: async (page) => {
      await page.getByRole('button', { name: /nouvelle facture/i }).first().click()
      await fillInvoiceModal(page)
    },
  },
  {
    slug: 'facture-detail',
    path: '/factures/voir',
    waitMs: 1200,
    skipGoto: true,
    before: async (page) => {
      await navigateToFirstInvoiceDetail(page, BASE_URL)
    },
  },
  {
    slug: 'devis-detail',
    path: '/devis/voir',
    waitMs: 1200,
    skipGoto: true,
    before: async (page) => {
      await navigateToFirstQuoteDetail(page, BASE_URL)
    },
  },
  {
    slug: 'comptabilite',
    path: '/comptabilite',
    waitMs: 2500,
    before: async (page) => {
      await syncAccountingFromInvoices(page)
      await gotoReady(page, '/comptabilite', BASE_URL)
      const syncBtn = page.getByRole('button', { name: /synchroniser/i }).first()
      if (await syncBtn.isVisible().catch(() => false)) {
        await syncBtn.click().catch(() => {})
        await page.waitForTimeout(1200)
      }
    },
  },
  { slug: 'parametres', path: '/parametres', waitMs: 1000 },
  { slug: 'parametres-entreprise', path: '/parametres/entreprise', waitMs: 1500 },
  { slug: 'parametres-efacture', path: '/parametres/facturation-electronique', waitMs: 1200 },
]

async function main() {
  let chromium
  try {
    ;({ chromium } = await loadPlaywright())
  } catch (err) {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }

  await mkdir(OUT_DIR, { recursive: true })
  await mkdir(PATHS.root, { recursive: true })
  if (syncPublic()) await mkdir(PUBLIC_OVERFLOW_CAPTURES, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await createMarketingContext(browser)
  const page = await context.newPage()

  await assertAppReachable(BASE_URL)

  console.log(`[capture] Connexion ${envCredentials().email} @ ${BASE_URL}`)
  await login(page, BASE_URL)
  const vp = getViewport()
  console.log(`[capture] Viewport ${vp.width}×${vp.height} — ${TARGETS.length} écrans\n`)

  const manifest = { capturedAt: new Date().toISOString(), baseUrl: BASE_URL, files: [] }

  for (const target of TARGETS) {
    const file = path.join(OUT_DIR, captureFilename(target.slug))
    const skipGoto = target.skipGoto === true || target.slug === 'comptabilite'
    try {
      console.log(`[capture] → ${target.slug} (${target.path})`)
      if (!skipGoto) {
        await gotoReady(page, target.path, BASE_URL)
      }
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
  await writeFile(PATHS.manifest, JSON.stringify({ ...manifest, capturesDir: OUT_DIR }, null, 2))
  await browser.close()
  console.log(`\n[capture] ${manifest.files.length}/${TARGETS.length} OK → ${OUT_DIR}`)
  if (syncPublic()) console.log(`[capture] Copie landing → ${PUBLIC_OVERFLOW_CAPTURES}`)
}

main().catch(async (err) => {
  console.error(err)
  process.exit(1)
})
