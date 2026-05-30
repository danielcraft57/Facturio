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
 *   docs/marketing/screenshots-temp/workflow/
 *   frontend/public/images/marketing/workflow/
 *   docs/marketing/screenshots-temp/videos/ (webm)
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
const WORKFLOW_DIR = path.resolve(__dirname, '../screenshots-temp/workflow')
const PUBLIC_WORKFLOW = path.resolve(__dirname, '../../../frontend/public/images/marketing/workflow')
const VIDEO_DIR = path.resolve(__dirname, '../screenshots-temp/videos')
const BASE_URL = envBaseUrl()

const args = new Set(process.argv.slice(2))
const quoteOnly = args.has('--quote-only')
const invoiceOnly = args.has('--invoice-only')
const runQuote = !invoiceOnly
const runInvoice = !quoteOnly

function pub(name) {
  return { publicPath: path.join(PUBLIC_WORKFLOW, name) }
}

async function fillFirstQuoteLine(page) {
  const dialog = page.getByRole('dialog')
  const lineInput = dialog.locator('input[type="text"]').filter({ visible: true }).nth(1)
  await lineInput.click()
  await lineInput.fill('Développement React Native — écrans, navigation et API')
  await page.keyboard.press('Tab')
  const price = dialog.locator('input[type="number"], input[inputmode="decimal"]').first()
  await price.fill('1200')
}

async function fillFirstInvoiceLine(page) {
  const dialog = page.getByRole('dialog')
  const lineInput = dialog.locator('input[type="text"]').filter({ visible: true }).nth(1)
  await lineInput.click()
  await lineInput.fill('Maintenance & correctifs — forfait mensuel')
  await page.keyboard.press('Tab')
  const price = dialog.locator('input[type="number"], input[inputmode="decimal"]').first()
  await price.fill('290')
}

async function pickFirstClient(page, query = 'Atelier') {
  const dialog = page.getByRole('dialog')
  const client = dialog.getByPlaceholder(/rechercher un client/i)
  await client.click()
  await client.fill(query)
  await page.waitForTimeout(600)
  await page.getByRole('option').first().click()
  await page.waitForTimeout(400)
}

async function recordQuoteWorkflow(page) {
  console.log('\n[workflow] Devis — création & envoi')

  await page.goto(`${BASE_URL}/devis/inbox`, { waitUntil: 'networkidle' })
  await waitForAppShell(page)
  await snap(page, path.join(WORKFLOW_DIR, 'quote-01-liste.png'), { ...pub('quote-01-liste.png'), waitMs: 800 })

  await page.getByRole('button', { name: /nouveau devis/i }).first().click()
  await page.getByText(/nouveau devis/i).first().waitFor({ timeout: 12_000 })
  await snap(page, path.join(WORKFLOW_DIR, 'quote-02-modal-vide.png'), { ...pub('quote-02-modal-vide.png'), waitMs: 500 })

  await pickFirstClient(page)
  await snap(page, path.join(WORKFLOW_DIR, 'quote-03-modal-client.png'), { ...pub('quote-03-modal-client.png'), waitMs: 400 })

  await fillFirstQuoteLine(page)
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

  await page.goto(`${BASE_URL}/factures/inbox`, { waitUntil: 'networkidle' })
  await waitForAppShell(page)
  await snap(page, path.join(WORKFLOW_DIR, 'invoice-01-liste.png'), { ...pub('invoice-01-liste.png'), waitMs: 800 })

  await page.getByRole('button', { name: /nouvelle facture/i }).first().click()
  await page.getByText(/nouvelle facture/i).first().waitFor({ timeout: 12_000 })
  await snap(page, path.join(WORKFLOW_DIR, 'invoice-02-modal-vide.png'), { ...pub('invoice-02-modal-vide.png'), waitMs: 500 })

  await pickFirstClient(page, 'Studio')
  await snap(page, path.join(WORKFLOW_DIR, 'invoice-03-modal-client.png'), { ...pub('invoice-03-modal-client.png'), waitMs: 400 })

  await fillFirstInvoiceLine(page)
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
  const videoDir = path.join(VIDEO_DIR, name)
  await mkdir(videoDir, { recursive: true })
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    locale: 'fr-FR',
    recordVideo: { dir: videoDir, size: VIEWPORT },
  })
  const page = await context.newPage()
  await login(page, BASE_URL)
  await fn(page)
  await context.close()
  console.log(`[workflow] Vidéo ${name} → ${videoDir}`)
}

async function main() {
  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch {
    console.error('Installez Playwright dans frontend/')
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
