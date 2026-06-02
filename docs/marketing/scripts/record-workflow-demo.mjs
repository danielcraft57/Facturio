#!/usr/bin/env node
/**
 * Enregistre une démo pas-à-pas : création + envoi devis / facture (PNG + WebM).
 *
 * Prérequis : seed Playwright + app locale (npm run start:all)
 *
 *   node docs/marketing/scripts/record-workflow-demo.mjs
 *   node docs/marketing/scripts/record-workflow-demo.mjs --quote-only
 *   node docs/marketing/scripts/record-workflow-demo.mjs --invoice-only
 *
 * Sortie :
 *   docs/marketing/pub-2026/workflow/
 *   docs/marketing/pub-2026/videos/workflow/*.webm
 *   frontend/public/images/marketing/workflow/ (PNG publics)
 */

import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PATHS } from './marketing-paths.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
import {
  envBaseUrl,
  loadPlaywright,
  login,
  snap,
  gotoReady,
  createMarketingContext,
  getVideoViewport,
  saveMarketingAuthState,
  finalizeRecordedVideo,
} from './playwright-marketing-helpers.mjs'
import { pauseAfterScene } from './marketing-showreel-scenes.mjs'
import {
  fillQuoteModal,
  fillInvoiceModal,
  fillQuoteClientOnly,
  fillInvoiceClientOnly,
} from './playwright-marketing-forms.mjs'

const WORKFLOW_DIR = PATHS.workflow
const PUBLIC_WORKFLOW = path.resolve(__dirname, '../../../frontend/public/images/marketing/workflow')
const VIDEO_DIR = path.join(PATHS.videos, 'workflow')
const BASE_URL = envBaseUrl()

const args = new Set(process.argv.slice(2))
const quoteOnly = args.has('--quote-only')
const invoiceOnly = args.has('--invoice-only')
const runQuote = !invoiceOnly
const runInvoice = !quoteOnly

function pub(name) {
  return { publicPath: path.join(PUBLIC_WORKFLOW, name) }
}

async function recordQuoteWorkflow(page) {
  console.log('\n[workflow] Devis — création & envoi')

  await gotoReady(page, '/devis/inbox', BASE_URL)
  await snap(page, path.join(WORKFLOW_DIR, 'quote-01-liste.png'), { ...pub('quote-01-liste.png'), waitMs: 800 })

  await page.getByRole('button', { name: /nouveau devis/i }).first().click()
  await page.getByRole('dialog').waitFor({ timeout: 12_000 })
  await snap(page, path.join(WORKFLOW_DIR, 'quote-02-modal-vide.png'), { ...pub('quote-02-modal-vide.png'), waitMs: 500 })

  await fillQuoteClientOnly(page)
  await snap(page, path.join(WORKFLOW_DIR, 'quote-03-modal-client.png'), { ...pub('quote-03-modal-client.png'), waitMs: 400 })

  await fillQuoteModal(page)
  await snap(page, path.join(WORKFLOW_DIR, 'quote-04-modal-lignes.png'), { ...pub('quote-04-modal-lignes.png'), waitMs: 600 })

  const createBtn = page.getByRole('button', { name: /créer le devis/i })
  if (await createBtn.isEnabled()) {
    await createBtn.click()
    await page.waitForURL(/\/devis\/voir\//, { timeout: 25_000 }).catch(() => {})
    await page.waitForTimeout(1200)
    await snap(page, path.join(WORKFLOW_DIR, 'quote-05-devis-cree.png'), { ...pub('quote-05-devis-cree.png'), waitMs: 400 })

    const sendBtn = page.getByRole('button', { name: /^envoyer$/i }).first()
    if (await sendBtn.isVisible().catch(() => false)) {
      await sendBtn.click()
      await page.getByRole('heading', { name: /envoyer le devis/i }).waitFor({ timeout: 10_000 })
      await snap(page, path.join(WORKFLOW_DIR, 'quote-06-envoi-email.png'), { ...pub('quote-06-envoi-email.png'), waitMs: 500 })
      await page.keyboard.press('Escape')
    }
  } else {
    console.warn('[workflow] Bouton « Créer le devis » désactivé — étapes 5-6 ignorées')
  }
}

async function recordInvoiceWorkflow(page) {
  console.log('\n[workflow] Facture — création & envoi')

  await gotoReady(page, '/factures/inbox', BASE_URL)
  await snap(page, path.join(WORKFLOW_DIR, 'invoice-01-liste.png'), { ...pub('invoice-01-liste.png'), waitMs: 800 })

  await page.getByRole('button', { name: /nouvelle facture/i }).first().click()
  await page.getByRole('dialog').waitFor({ timeout: 12_000 })
  await snap(page, path.join(WORKFLOW_DIR, 'invoice-02-modal-vide.png'), { ...pub('invoice-02-modal-vide.png'), waitMs: 500 })

  await fillInvoiceClientOnly(page)
  await snap(page, path.join(WORKFLOW_DIR, 'invoice-03-modal-client.png'), { ...pub('invoice-03-modal-client.png'), waitMs: 400 })

  await fillInvoiceModal(page)
  await snap(page, path.join(WORKFLOW_DIR, 'invoice-04-modal-lignes.png'), { ...pub('invoice-04-modal-lignes.png'), waitMs: 600 })

  const createBtn = page.getByRole('button', { name: /créer la facture/i })
  if (await createBtn.isEnabled()) {
    await createBtn.click()
    await page.waitForURL(/\/factures\/voir\//, { timeout: 25_000 }).catch(() => {})
    await page.waitForTimeout(1200)
    await snap(page, path.join(WORKFLOW_DIR, 'invoice-05-facture-creee.png'), { ...pub('invoice-05-facture-creee.png'), waitMs: 400 })

    const sendBtn = page.getByRole('button', { name: /renvoyer|envoyer/i }).first()
    if (await sendBtn.isVisible().catch(() => false)) {
      await sendBtn.click()
      await page.getByRole('heading', { name: /envoyer|email/i }).waitFor({ timeout: 10_000 }).catch(() => {})
      await snap(page, path.join(WORKFLOW_DIR, 'invoice-06-envoi-email.png'), { ...pub('invoice-06-envoi-email.png'), waitMs: 500 })
    }
  } else {
    console.warn('[workflow] Bouton « Créer la facture » désactivé — étapes 5-6 ignorées')
  }
}

async function recordWithVideo(browser, name, fn) {
  const outFile = path.join(VIDEO_DIR, `${name}.webm`)
  const tmpDir = path.join(VIDEO_DIR, '_tmp', name)
  await mkdir(tmpDir, { recursive: true })
  const vp = getVideoViewport()
  const context = await createMarketingContext(browser, {
    forVideo: true,
    recordVideo: { dir: tmpDir, size: vp },
  })
  const page = await context.newPage()
  try {
    await login(page, BASE_URL)
    await fn(page)
    await pauseAfterScene(page, 800)
    const video = page.video()
    await context.close()
    await finalizeRecordedVideo(video, outFile)
    console.log(`[workflow] Vidéo → ${outFile}`)
  } catch (err) {
    await context.close().catch(() => {})
    throw err
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}

async function main() {
  let chromium
  try {
    ;({ chromium } = await loadPlaywright())
  } catch (err) {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }

  await mkdir(WORKFLOW_DIR, { recursive: true })
  await mkdir(PUBLIC_WORKFLOW, { recursive: true })
  await mkdir(VIDEO_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })

  if (runQuote) {
    await recordWithVideo(browser, 'quote-flow', recordQuoteWorkflow)
  }
  if (runInvoice) {
    await recordWithVideo(browser, 'invoice-flow', recordInvoiceWorkflow)
  }

  const manifest = {
    recordedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    quote: runQuote
      ? [
          'quote-01-liste.png',
          'quote-02-modal-vide.png',
          'quote-03-modal-client.png',
          'quote-04-modal-lignes.png',
          'quote-05-devis-cree.png',
          'quote-06-envoi-email.png',
        ]
      : [],
    invoice: runInvoice
      ? [
          'invoice-01-liste.png',
          'invoice-02-modal-vide.png',
          'invoice-03-modal-client.png',
          'invoice-04-modal-lignes.png',
          'invoice-05-facture-creee.png',
          'invoice-06-envoi-email.png',
        ]
      : [],
  }
  await writeFile(path.join(WORKFLOW_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  await browser.close()
  console.log('\n[workflow] Terminé — assets publics dans', PUBLIC_WORKFLOW)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
