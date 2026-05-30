import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

export const VIEWPORT = { width: 1440, height: 900 }

export const DEFAULT_BASE_URL = 'http://localhost:5173'
export const DEFAULT_EMAIL = 'playwright@facturio.local'
export const DEFAULT_PASSWORD = 'playwright'

export function envBaseUrl() {
  return process.env.FACTURIO_BASE_URL ?? DEFAULT_BASE_URL
}

export function envCredentials() {
  return {
    email: process.env.FACTURIO_TEST_EMAIL ?? process.env.PLAYWRIGHT_DEMO_EMAIL ?? DEFAULT_EMAIL,
    password: process.env.FACTURIO_TEST_PASSWORD ?? process.env.PLAYWRIGHT_DEMO_PASSWORD ?? DEFAULT_PASSWORD,
  }
}

/** Attend que le shell app (nav Facturio) soit visible. */
export async function waitForAppShell(page) {
  await page.getByRole('link', { name: /^Facturio$/i }).first().waitFor({ timeout: 45_000 })
  await page.waitForTimeout(400)
}

export async function login(page, baseUrl = envBaseUrl()) {
  const { email, password } = envCredentials()
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' })
  await page.getByLabel(/^email$/i).fill(email)
  await page.getByLabel(/mot de passe/i).fill(password)
  await page.getByRole('button', { name: /connexion/i }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 45_000 })
  await page.goto(`${baseUrl}/auth/session?from=${encodeURIComponent('/dashboard')}`, {
    waitUntil: 'domcontentloaded',
  })
  await waitForAppShell(page)
}

/**
 * Capture viewport (marketing) + copie optionnelle vers public/.
 * @param {import('playwright').Page} page
 * @param {string} filePath absolu .png
 * @param {{ publicPath?: string, fullPage?: boolean, waitMs?: number }} opts
 */
export async function snap(page, filePath, opts = {}) {
  if (opts.waitMs) await page.waitForTimeout(opts.waitMs)
  await mkdir(path.dirname(filePath), { recursive: true })
  await page.screenshot({
    path: filePath,
    fullPage: opts.fullPage ?? false,
    animations: 'disabled',
  })
  if (opts.publicPath) {
    await mkdir(path.dirname(opts.publicPath), { recursive: true })
    await copyFile(filePath, opts.publicPath)
  }
}

/** Premier lien « voir » / numéro de document dans un tableau. */
export async function openFirstDocumentRow(page, kind) {
  const rowLink = page.locator('table tbody tr a').first()
  await rowLink.waitFor({ timeout: 15_000 })
  await rowLink.click()
  await page.waitForURL(new RegExp(`/${kind}/voir/`), { timeout: 20_000 })
  await page.waitForTimeout(800)
}
