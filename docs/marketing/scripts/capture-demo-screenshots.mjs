#!/usr/bin/env node
/**
 * Captures de l'espace démo (pages publiques, app, modales, toasts lecture seule).
 *
 * Prérequis :
 *   npm run ensure-demo --prefix server
 *   npm run start:all
 *   cd frontend && npx playwright install chromium
 *
 * Usage :
 *   npm run demo:capture
 *
 * Sortie : docs/marketing/demo/captures/
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { captureFilename } from './marketing-screenshot-env.mjs'
import {
  assertAppReachable,
  dismissDemoWelcomeDialog,
  enterDemo,
  envBaseUrl,
  gotoDemoReady,
  gotoReady,
  loadPlaywright,
  createMarketingContext,
  getViewport,
  openMegaMenu,
  snap,
  syncAccountingFromInvoices,
  navigateToFirstInvoiceDetail,
  navigateToFirstQuoteDetail,
} from './playwright-marketing-helpers.mjs'
import {
  fillEditProductWizard,
  fillInvoiceModal,
  fillQuoteModal,
  openFirstProductForEdit,
} from './playwright-marketing-forms.mjs'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.resolve(__dirname, '../demo/captures')
const BASE_URL = envBaseUrl()
const CAPTURE_ONLY = (process.env.CAPTURE_ONLY || '')
  .split(',')
  .map((slug) => slug.trim())
  .filter(Boolean)

/** @param {import('playwright').Page} page */
async function snapDemoToast(page, file, labelPattern) {
  const toastLocator = page
    .locator('[role="alert"], [role="status"], .MuiAlert-root, .MuiSnackbar-root')
    .filter({ hasText: labelPattern })
    .first()
  const anyToastLocator = page.locator('.MuiSnackbar-root, [role="alert"], [role="status"]').first()
  const textLocator = page.getByText(labelPattern).first()
  const deadline = Date.now() + 22_000
  while (Date.now() < deadline) {
    if (await toastLocator.isVisible().catch(() => false)) break
    if (await textLocator.isVisible().catch(() => false)) break
    if (await anyToastLocator.isVisible().catch(() => false)) break
    await page.waitForTimeout(200)
  }
  if (!(await toastLocator.isVisible().catch(() => false))) {
    if (await anyToastLocator.isVisible().catch(() => false)) {
      await anyToastLocator.waitFor({ state: 'visible', timeout: 3_000 })
    } else {
      await textLocator.waitFor({ state: 'visible', timeout: 3_000 })
    }
  }
  await page.waitForTimeout(900)
  await snap(page, file, { waitMs: 300 })
}

/** Ouvre la modale de création en démo (?create=1) et attend le bandeau aperçu. */
async function openDemoCreateModalPreview(page, inboxPath) {
  const pathWithCreate = inboxPath.includes('?') ? `${inboxPath}&create=1` : `${inboxPath}?create=1`
  await gotoDemoReady(page, pathWithCreate, BASE_URL)
  await dismissDemoWelcomeDialog(page)
  const isInvoice = inboxPath.includes('factures')
  const dialog = page.getByRole('dialog').filter({
    hasText: isInvoice ? /nouvelle facture/i : /nouveau devis/i,
  })
  await dialog.waitFor({ state: 'visible', timeout: 15_000 })
  await page.getByText(/aperçu interactif/i).first().waitFor({ timeout: 8_000 }).catch(() => {})
  await page.waitForTimeout(600)
  return dialog
}

/** Clique sur « enregistrer » en démo pour déclencher le toast de persistance bloquée. */
async function triggerDemoPersistBlockedToast(page, inboxPath) {
  const dialog = await openDemoCreateModalPreview(page, inboxPath)
  if (inboxPath.includes('devis')) {
    await fillQuoteModal(page)
  } else {
    await fillInvoiceModal(page)
  }
  const submitBtn = dialog
    .getByRole('button', { name: /aperçu|créer la facture|créer le devis|inscription pour enregistrer/i })
    .last()
  await submitBtn.waitFor({ state: 'visible', timeout: 10_000 })
  for (let i = 0; i < 80; i++) {
    if (await submitBtn.isEnabled().catch(() => false)) break
    await page.waitForTimeout(200)
  }
  if (!(await submitBtn.isEnabled().catch(() => false))) {
    throw new Error('Bouton enregistrement toujours désactivé après remplissage du formulaire démo')
  }
  await submitBtn.click({ timeout: 8_000 })
  await page.waitForTimeout(500)
}

/** @type {Array<{ slug: string, path: string, waitMs?: number, fullPage?: boolean, public?: boolean, before?: (page: import('playwright').Page) => Promise<void>, skipGoto?: boolean }>} */
const PUBLIC_TARGETS = [
  { slug: 'public-landing', path: '/', waitMs: 1200, public: true },
  { slug: 'public-login-demo-link', path: '/login', waitMs: 800, public: true },
  { slug: 'public-essayer', path: '/essayer', waitMs: 2500, public: true },
]

/** Réinitialise le stockage local du parcours démo (popin + checklist). */
async function resetDemoExploreStorage(page) {
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('facturio_demo_explore_')) localStorage.removeItem(key)
    }
  })
}

/** @type {typeof PUBLIC_TARGETS} */
const APP_TARGETS = [
  {
    slug: 'demo-welcome-dialog',
    path: '/dashboard',
    waitMs: 800,
    skipGoto: true,
    before: async (page) => {
      await resetDemoExploreStorage(page)
      await gotoDemoReady(page, '/dashboard', BASE_URL)
      await page.getByRole('dialog').filter({ hasText: /espace démo/i }).waitFor({ state: 'visible', timeout: 8000 })
    },
  },
  { slug: 'demo-banner-dashboard', path: '/dashboard', waitMs: 1500 },
  {
    slug: 'demo-explore-checklist',
    path: '/dashboard',
    waitMs: 1200,
    before: async (page) => {
      await page.getByRole('dialog').getByRole('button', { name: /explorer seul|fermer|première victoire|continuer/i }).click({ timeout: 2000 }).catch(() => {})
      await page.keyboard.press('Escape').catch(() => {})
    },
  },
  {
    slug: 'demo-menu-commercial',
    path: '/dashboard',
    waitMs: 600,
    before: async (page) => {
      await openMegaMenu(page, 'Commercial')
    },
  },
  {
    slug: 'demo-menu-finance',
    path: '/dashboard',
    waitMs: 600,
    before: async (page) => {
      await openMegaMenu(page, 'Finance')
    },
  },
  { slug: 'demo-clients-inbox', path: '/clients/inbox', waitMs: 1200 },
  { slug: 'demo-clients-prospects', path: '/clients/prospects', waitMs: 1000 },
  {
    slug: 'demo-produits-catalogue',
    path: '/produits',
    waitMs: 1500,
    before: async (page) => {
      await page.getByRole('button', { name: /^catalogue$/i }).click()
    },
  },
  {
    slug: 'demo-produits-liste',
    path: '/produits',
    waitMs: 800,
    before: async (page) => {
      await page.getByRole('button', { name: /^liste$/i }).click()
    },
  },
  { slug: 'demo-factures-inbox', path: '/factures/inbox', waitMs: 1400 },
  { slug: 'demo-factures-brouillons', path: '/factures/brouillons', waitMs: 1000 },
  { slug: 'demo-devis-inbox', path: '/devis/inbox', waitMs: 1400 },
  { slug: 'demo-devis-brouillons', path: '/devis/brouillons', waitMs: 1000 },
  {
    slug: 'demo-devis-create-vitrine',
    path: '/devis/inbox',
    waitMs: 600,
    before: async (page) => {
      await openDemoCreateModalPreview(page, '/devis/inbox')
      await snap(
        page,
        path.join(OUT_DIR, captureFilename('demo-devis-create-vitrine')),
        { waitMs: 400 },
      )
    },
  },
  {
    slug: 'demo-factures-create-vitrine',
    path: '/factures/inbox',
    waitMs: 600,
    before: async (page) => {
      await openDemoCreateModalPreview(page, '/factures/inbox')
      await snap(
        page,
        path.join(OUT_DIR, captureFilename('demo-factures-create-vitrine')),
        { waitMs: 400 },
      )
    },
  },
  {
    slug: 'demo-produits-modifier-modal',
    path: '/produits',
    waitMs: 700,
    before: async (page) => {
      await gotoDemoReady(page, '/produits', BASE_URL)
      await dismissDemoWelcomeDialog(page)
      await openFirstProductForEdit(page)
      await page.getByRole('dialog').filter({ hasText: /modifier|produit/i }).waitFor({ timeout: 15_000 })
      await page.waitForTimeout(500)
    },
  },
  {
    slug: 'demo-facture-detail',
    path: '/factures/voir',
    waitMs: 1200,
    skipGoto: true,
    before: async (page) => {
      await navigateToFirstInvoiceDetail(page, BASE_URL)
    },
  },
  {
    slug: 'demo-devis-detail',
    path: '/devis/voir',
    waitMs: 1200,
    skipGoto: true,
    before: async (page) => {
      await navigateToFirstQuoteDetail(page, BASE_URL)
    },
  },
  {
    slug: 'demo-command-palette',
    path: '/dashboard',
    waitMs: 600,
    before: async (page) => {
      await dismissDemoWelcomeDialog(page)
      await page.keyboard.press('Control+k')
      await page.getByPlaceholder(/rechercher une page/i).waitFor({ state: 'visible', timeout: 8_000 })
      await page.waitForTimeout(500)
    },
  },
  {
    slug: 'demo-quest-complete-dialog',
    path: '/dashboard',
    waitMs: 800,
    skipGoto: true,
    before: async (page) => {
      await page.evaluate(() => {
        const prefix = 'facturio_demo_explore_'
        for (const step of ['see-invoice', 'see-quote', 'see-efacture']) {
          localStorage.setItem(`${prefix}${step}`, '1')
        }
        localStorage.removeItem(`${prefix}quest_recap_seen`)
        localStorage.setItem(`${prefix}welcome_seen`, '1')
      })
      await gotoDemoReady(page, '/dashboard', BASE_URL)
      await page.getByRole('dialog').filter({ hasText: /mission accomplie/i }).waitFor({ state: 'visible', timeout: 12_000 })
      await page.waitForTimeout(400)
    },
  },
  {
    slug: 'demo-toast-creation-bloquee',
    path: '/factures/inbox',
    waitMs: 300,
    skipGoto: false,
    before: async (page) => {
      await triggerDemoPersistBlockedToast(page, '/factures/inbox')
      await snapDemoToast(
        page,
        path.join(OUT_DIR, captureFilename('demo-toast-creation-bloquee')),
        /inscrivez|enregistrement désactivé|compte gratuit|aperçu interactif|s'inscrire/i,
      )
    },
  },
  {
    slug: 'demo-comptabilite',
    path: '/comptabilite',
    waitMs: 2500,
    before: async (page) => {
      await page.keyboard.press('Escape').catch(() => {})
      await page.locator('[role="dialog"]').first().waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {})
      await dismissDemoWelcomeDialog(page)
      await syncAccountingFromInvoices(page)
      await gotoDemoReady(page, '/comptabilite', BASE_URL)
    },
  },
  { slug: 'demo-parametres', path: '/parametres', waitMs: 1000 },
  { slug: 'demo-parametres-entreprise', path: '/parametres/entreprise', waitMs: 1500 },
  { slug: 'demo-parametres-efacture', path: '/parametres/facturation-electronique', waitMs: 1200 },
  { slug: 'demo-tarifs-public', path: '/tarifs', waitMs: 1000, public: true },
]

function filterTargets(targets) {
  if (CAPTURE_ONLY.length === 0) return targets
  const keep = new Set(CAPTURE_ONLY)
  return targets.filter((target) => keep.has(target.slug))
}

async function captureTarget(page, target, manifest) {
  if (
    target.slug === 'demo-toast-creation-bloquee' ||
    target.slug === 'demo-devis-create-vitrine' ||
    target.slug === 'demo-factures-create-vitrine'
  ) {
    if (target.before) await target.before(page)
    manifest.files.push({ slug: target.slug, path: target.path })
    console.log(`[demo-capture] ✓ ${target.slug} (aperçu / toast)`)
    return
  }

  const file = path.join(OUT_DIR, captureFilename(target.slug))
  const skipGoto = target.skipGoto === true

  if (!skipGoto) {
    if (target.public) {
      const url = target.path.startsWith('http') ? target.path : `${BASE_URL.replace(/\/$/, '')}${target.path}`
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
      await page.waitForTimeout(target.waitMs ?? 800)
    } else {
      await gotoDemoReady(page, target.path, BASE_URL)
    }
  }
  if (target.before) await target.before(page)
  await snap(page, file, { fullPage: target.fullPage ?? false, waitMs: target.waitMs })
  manifest.files.push({ slug: target.slug, path: target.path })
  console.log(`[demo-capture] ✓ ${target.slug}`)
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
  await assertAppReachable(BASE_URL)

  const browser = await chromium.launch({ headless: true })
  const manifest = { capturedAt: new Date().toISOString(), baseUrl: BASE_URL, mode: 'demo', files: [] }
  const vp = getViewport()
  console.log(`[demo-capture] Viewport ${vp.width}×${vp.height}\n`)

  // Pages publiques (sans session)
  const publicContext = await createMarketingContext(browser)
  const publicPage = await publicContext.newPage()
  const selectedPublicTargets = filterTargets(PUBLIC_TARGETS)
  const selectedAppTargets = filterTargets(APP_TARGETS)
  if (CAPTURE_ONLY.length > 0) {
    console.log(`[demo-capture] Filtre CAPTURE_ONLY : ${CAPTURE_ONLY.join(', ')}\n`)
  }
  console.log('[demo-capture] — Pages publiques —\n')
  for (const target of selectedPublicTargets) {
    try {
      console.log(`[demo-capture] → ${target.slug}`)
      await captureTarget(publicPage, target, manifest)
    } catch (err) {
      console.warn(`[demo-capture] ✗ ${target.slug}:`, err.message)
    }
  }
  await publicContext.close()

  // Application connectée en mode démo
  const context = await createMarketingContext(browser)
  const page = await context.newPage()
  console.log('\n[demo-capture] — Connexion démo —\n')
  await enterDemo(page, BASE_URL)
  await dismissDemoWelcomeDialog(page)

  for (const target of selectedAppTargets) {
    if (target.public) {
      try {
        console.log(`[demo-capture] → ${target.slug}`)
        await captureTarget(page, target, manifest)
      } catch (err) {
        console.warn(`[demo-capture] ✗ ${target.slug}:`, err.message)
      }
      continue
    }
    try {
      console.log(`[demo-capture] → ${target.slug}`)
      await captureTarget(page, target, manifest)
    } catch (err) {
      console.warn(`[demo-capture] ✗ ${target.slug}:`, err.message)
    }
  }

  await writeFile(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  await browser.close()
  console.log(`\n[demo-capture] ${manifest.files.length} captures → ${OUT_DIR}`)
}

main().catch(async (err) => {
  console.error(err)
  process.exit(1)
})
