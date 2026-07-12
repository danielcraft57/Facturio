import { copyFile, mkdir, stat, unlink } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  captureExtension,
  captureFilename,
  getScreenshotConfig,
  loadMarketingEnv,
  marketingViewport,
  marketingVideoViewport,
} from './marketing-screenshot-env.mjs'

loadMarketingEnv()

export {
  captureExtension,
  captureFilename,
  getScreenshotConfig,
  loadMarketingEnv,
  marketingViewport,
  marketingVideoViewport,
} from './marketing-screenshot-env.mjs'

const __helpersDir = path.dirname(fileURLToPath(import.meta.url))

const TRACKER_PATTERN =
  /google-analytics|googletagmanager|doubleclick|facebook\.net|hotjar|segment\.io|sentry\.io\/api\/envelope/i

/** Racine monorepo (docs/marketing/scripts → ../../..) */
export const REPO_ROOT = path.resolve(__helpersDir, '../../..')

/** Playwright est une devDependency de frontend/, pas de la racine. */
export const FRONTEND_ROOT = path.join(REPO_ROOT, 'frontend')

/**
 * Charge playwright depuis frontend/node_modules (npm run marketing:* depuis la racine).
 * @returns {Promise<typeof import('playwright')>}
 */
export async function loadPlaywright() {
  const require = createRequire(import.meta.url)
  try {
    const modulePath = require.resolve('playwright', { paths: [FRONTEND_ROOT] })
    const loaded = require(modulePath)
    return loaded.default ?? loaded
  } catch {
    try {
      return await import('playwright')
    } catch {
      throw new Error(
        'Playwright introuvable. Installez-le dans frontend/ :\n' +
          '  cd frontend && npm i -D playwright && npx playwright install chromium',
      )
    }
  }
}

/** Viewport Playwright (docs/marketing/.env → WEBSITE_SCREENSHOT_*). */
export function getViewport() {
  return marketingViewport()
}

/** @deprecated Préférer getViewport() */
export const VIEWPORT = {
  get width() {
    return getViewport().width
  },
  get height() {
    return getViewport().height
  },
}

export const DEFAULT_BASE_URL = 'http://localhost:5173'
export const DEFAULT_EMAIL = 'playwright@facturio.local'
export const DEFAULT_PASSWORD = 'playwright'
/** Empreinte stable pour éviter la vérif. appareil à chaque capture marketing. */
export const MARKETING_DEVICE_FINGERPRINT = 'facturio-marketing-playwright'

export function envApiBase(baseUrl = envBaseUrl()) {
  if (process.env.FACTURIO_API_URL) return process.env.FACTURIO_API_URL.replace(/\/$/, '')
  return `${baseUrl.replace(/\/$/, '')}/api`
}

export function envBaseUrl() {
  return process.env.FACTURIO_BASE_URL ?? DEFAULT_BASE_URL
}

export function envCredentials() {
  return {
    email: process.env.FACTURIO_TEST_EMAIL ?? process.env.PLAYWRIGHT_DEMO_EMAIL ?? DEFAULT_EMAIL,
    password: process.env.FACTURIO_TEST_PASSWORD ?? process.env.PLAYWRIGHT_DEMO_PASSWORD ?? DEFAULT_PASSWORD,
  }
}

/** Détecte la page /login (pas un champ email métier type paramètres entreprise). */
export async function isLoginPage(page) {
  try {
    const { pathname } = new URL(page.url())
    if (pathname === '/login' || pathname.startsWith('/login/')) return true
  } catch {
    /* ignore */
  }
  const password = page.getByLabel(/^mot de passe/i)
  return password.isVisible().catch(() => false)
}

/**
 * Barre desktop prête (mega-menus, liens ou CTA — pas de networkidle).
 * @param {import('playwright').Page} page
 */
export async function waitForDesktopNav(page, { timeout = 30_000 } = {}) {
  if (await isLoginPage(page)) {
    throw new Error(
      `Page login (url=${page.url()}) — seed requis : npm run seed:playwright --prefix server`,
    )
  }

  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const ready =
      (await page.getByRole('button', { name: /commercial/i }).first().isVisible().catch(() => false)) ||
      (await page.getByRole('button', { name: /finance/i }).first().isVisible().catch(() => false)) ||
      (await page.getByRole('link', { name: /tableau de bord/i }).first().isVisible().catch(() => false)) ||
      (await page.getByRole('link', { name: /nouvelle facture/i }).first().isVisible().catch(() => false)) ||
      (await page.getByRole('button', { name: /nouvelle facture/i }).first().isVisible().catch(() => false)) ||
      (await page.getByText(/espace démo prérempli/i).first().isVisible().catch(() => false)) ||
      (await page.getByRole('heading', { name: /^tous$/i }).first().isVisible().catch(() => false))

    if (ready) {
      const busy = page.locator('.MuiCircularProgress-root:visible, .MuiLinearProgress-root:visible')
      for (let i = 0; i < 24; i++) {
        if ((await busy.count()) === 0) break
        await page.waitForTimeout(100)
      }
      await page.waitForTimeout(getScreenshotConfig().videoWaitMs)
      return
    }
    await page.waitForTimeout(200)
  }

  const vp = page.viewportSize()
  throw new Error(
    `Barre nav absente (url=${page.url()}, viewport=${vp?.width ?? '?'}×${vp?.height ?? '?'}) — ` +
      'npm run start:all puis seed:playwright',
  )
}

/** Attente minimale vidéo (barre desktop, pas de networkidle). */
export async function waitForShellLite(page) {
  await waitForDesktopNav(page, { timeout: 25_000 })
}

/** Attend que le shell app (logo + barre de navigation desktop) soit visible. */
export async function waitForAppShell(page) {
  if (await isLoginPage(page)) {
    throw new Error('Non connecté — la page login est affichée (session Playwright manquante)')
  }

  await page.locator('a[href="/"], a[href="/dashboard"]').first().waitFor({ timeout: 45_000 })
  await waitForDesktopNav(page, { timeout: 35_000 })
  await page.waitForTimeout(400)
}

/**
 * Attend la fin des loaders MUI (évite captures/vidéos sur spinners).
 * @param {import('playwright').Page} page
 */
export async function waitForPageReady(page, { timeout = 45_000 } = {}) {
  await waitForAppShell(page)
  const busy = page.locator(
    '.MuiCircularProgress-root:visible, [role="progressbar"]:visible, .MuiLinearProgress-root:visible',
  )
  for (let i = 0; i < 80; i++) {
    const n = await busy.count()
    if (n === 0) break
    await page.waitForTimeout(250)
  }
  await page
    .locator('.MuiSkeleton-root:visible')
    .first()
    .waitFor({ state: 'hidden', timeout: 8_000 })
    .catch(() => {})
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {})
  await page.waitForTimeout(getScreenshotConfig().waitMs)
}

/** Viewport vidéo (16:9 UI, sans bandes vides). */
export function getVideoViewport() {
  return marketingVideoViewport()
}

/** Attente légère pour enregistrements vidéo (pas de networkidle). */
export async function waitForPageReadyVideo(page, { timeout = 15_000 } = {}) {
  await waitForShellLite(page)
  await page.waitForLoadState('domcontentloaded', { timeout }).catch(() => {})
}

export async function gotoReadyVideo(page, url, baseUrl = envBaseUrl()) {
  const cfg = getScreenshotConfig()
  const pathname = url.startsWith('http') ? new URL(url).pathname : url.split('?')[0]
  const target = url.startsWith('http') ? url : `${baseUrl.replace(/\/$/, '')}${url}`
  let currentPath = ''
  try {
    currentPath = new URL(page.url()).pathname
  } catch {
    currentPath = ''
  }
  if (currentPath !== pathname) {
    await page.goto(target, {
      waitUntil: 'commit',
      timeout: cfg.gotoTimeoutMs,
    })
  }
  await waitForPageReadyVideo(page)
}

/** Navigation démo : shell visible sans networkidle (Vite HMR en dev). */
export async function gotoDemoReady(page, url, baseUrl = envBaseUrl()) {
  const cfg = getScreenshotConfig()
  const target = url.startsWith('http') ? url : `${baseUrl.replace(/\/$/, '')}${url}`
  await page.goto(target, {
    waitUntil: cfg.gotoWaitUntil,
    timeout: Math.max(cfg.gotoTimeoutMs, 60_000),
  })
  await waitForDesktopNav(page, { timeout: 90_000 })
  const busy = page.locator('.MuiCircularProgress-root:visible, .MuiSkeleton-root:visible')
  for (let i = 0; i < 40; i++) {
    if ((await busy.count()) === 0) break
    await page.waitForTimeout(200)
  }
  await page.waitForTimeout(cfg.waitMs)
}

/** Navigation + attente contenu prêt (captures PNG). */
export async function gotoReady(page, url, baseUrl = envBaseUrl()) {
  const cfg = getScreenshotConfig()
  const target = url.startsWith('http') ? url : `${baseUrl.replace(/\/$/, '')}${url}`
  await page.goto(target, {
    waitUntil: cfg.gotoWaitUntil,
    timeout: cfg.gotoTimeoutMs,
  })
  await waitForPageReady(page)
}

/** Options contexte Playwright (captures / vidéos). */
export function marketingContextOptions({ forVideo = false } = {}) {
  const cfg = getScreenshotConfig()
  return {
    viewport: forVideo ? getVideoViewport() : getViewport(),
    deviceScaleFactor: cfg.deviceScaleFactor,
    locale: 'fr-FR',
    reducedMotion: forVideo ? 'no-preference' : cfg.reducedMotion ? 'reduce' : 'no-preference',
  }
}

/** Bloqueurs + désactivation animations (sauf scroll vidéo). */
export async function prepareMarketingContext(context, { forVideo = false } = {}) {
  const cfg = getScreenshotConfig()
  if (cfg.blockTrackers) {
    await context.route('**/*', (route) => {
      const url = route.request().url()
      if (TRACKER_PATTERN.test(url)) return route.abort()
      return route.continue()
    })
  }
  const freezeCss = cfg.disableAnimations && !forVideo
  if (freezeCss) {
    await context.addInitScript(() => {
      const style = document.createElement('style')
      style.textContent =
        '*, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }'
      document.documentElement.appendChild(style)
    })
  }
}

export async function createMarketingContext(browser, opts = {}) {
  const context = await browser.newContext({
    ...marketingContextOptions(opts),
    ...(opts.storageState ? { storageState: opts.storageState } : {}),
    ...(opts.recordVideo ? { recordVideo: opts.recordVideo } : {}),
  })
  await prepareMarketingContext(context, opts)
  return context
}

/** Connexion unique + fichier storageState pour les enregistrements suivants. */
export async function saveMarketingAuthState(browser, authStatePath, baseUrl = envBaseUrl()) {
  const context = await createMarketingContext(browser)
  const page = await context.newPage()
  await login(page, baseUrl)
  await mkdir(path.dirname(authStatePath), { recursive: true })
  await context.storageState({ path: authStatePath })
  await context.close()
  return authStatePath
}

/** Copie la WebM Playwright et refuse les fichiers vides. */
export async function finalizeRecordedVideo(video, outFile) {
  if (!video) throw new Error('Enregistrement vidéo absent (recordVideo non activé)')
  await mkdir(path.dirname(outFile), { recursive: true })
  await video.saveAs(outFile)
  const { size } = await stat(outFile)
  if (size < 512) {
    await unlink(outFile).catch(() => {})
    throw new Error(`Vidéo vide (${size} o) — ${path.basename(outFile)}`)
  }
}

/**
 * Défilement fluide (scroll limité en vidéo).
 * @param {import('playwright').Page} page
 * @param {{ maxSteps?: number, pauseMs?: number }} [opts]
 */
export async function playScrollAnimation(page, opts = {}) {
  const cfg = getScreenshotConfig()
  if (!cfg.scrollEnabled) return

  const maxSteps = opts.maxSteps ?? cfg.videoScrollMaxSteps ?? cfg.scrollMaxSteps
  const pauseMs = opts.pauseMs ?? cfg.scrollPauseMs

  const metrics = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
  }))
  if (metrics.scrollHeight <= metrics.clientHeight + 80) return

  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(120)

  let y = 0
  let steps = 0
  const maxY = metrics.scrollHeight - metrics.clientHeight

  while (y < maxY && steps < maxSteps) {
    y = Math.min(y + cfg.scrollStepPx, maxY)
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'smooth' }), y)
    await page.waitForTimeout(pauseMs)
    steps += 1
  }

  await page.waitForTimeout(pauseMs)
}

/** Ouvre un mega-menu de la barre supérieure (Commercial, Finance). */
export async function openMegaMenu(page, label) {
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(120)

  const trigger = page.getByRole('button', { name: new RegExp(label, 'i') }).first()
  await trigger.waitFor({ state: 'visible', timeout: 20_000 })
  await trigger.scrollIntoViewIfNeeded()

  const popper = page.locator('.MuiPopper-root:visible')

  // Hover seul ouvre le menu ; un clic après hover le referme (toggle MUI) — ne pas enchaîner les deux.
  for (let attempt = 0; attempt < 3; attempt++) {
    await trigger.hover()
    await page.waitForTimeout(320)
    if (await popper.isVisible().catch(() => false)) break

    await trigger.click({ force: true, noWaitAfter: true })
    await page.waitForTimeout(280)
    if (await popper.isVisible().catch(() => false)) break
  }

  await popper.waitFor({ state: 'visible', timeout: 12_000 })
  await page.waitForTimeout(350)
}

export async function assertAppReachable(baseUrl = envBaseUrl()) {
  const apiBase = envApiBase(baseUrl)
  try {
    const [front, api] = await Promise.all([
      fetch(`${baseUrl}/login`, { signal: AbortSignal.timeout(8_000) }),
      fetch(`${apiBase}/auth/me`, { signal: AbortSignal.timeout(8_000) }).catch(() => null),
    ])
    if (!front.ok) throw new Error(`frontend HTTP ${front.status}`)
    if (api && api.status >= 500) throw new Error(`API HTTP ${api.status}`)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    throw new Error(
      `Application inaccessible (frontend ${baseUrl}, API ${apiBase}).\n` +
        '  npm run start:all\n' +
        `Détail : ${detail}`,
    )
  }
}

export function unwrapApiBody(json) {
  if (json && typeof json === 'object' && 'data' in json && json.data != null) return json.data
  return json
}

/** Token Bearer pour context.request (Playwright n’utilise pas localStorage). */
export async function marketingApiHeaders(page) {
  const token = await page.evaluate(() => localStorage.getItem('auth_token')).catch(() => null)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** Dossiers factures à parcourir si la boîte inbox est vide. */
const INVOICE_LIST_FOLDERS = ['inbox', 'envoyes', 'brouillons', 'nouveau', 'suivi', 'important']

/** Dossiers devis à parcourir si la boîte inbox est vide. */
const QUOTE_LIST_FOLDERS = ['inbox', 'envoyes', 'brouillons', 'nouveau', 'suivi', 'important']

/**
 * Récupère l'ID du premier document via l'API (essaye plusieurs dossiers).
 *
 * @param {import('playwright').Page} page
 * @param {string} apiBase
 * @param {Record<string, string>} headers
 * @param {'facture' | 'devis'} kind
 * @returns {Promise<string | null>}
 */
async function fetchFirstFinanceDocumentId(page, apiBase, headers, kind) {
  const folders = kind === 'facture' ? INVOICE_LIST_FOLDERS : QUOTE_LIST_FOLDERS
  const path = kind === 'facture' ? 'factures' : 'devis'
  const key = kind === 'facture' ? 'invoices' : 'quotes'
  for (const folder of folders) {
    const res = await page.context().request.get(`${apiBase}/${path}?folder=${folder}&page=1&limit=5`, {
      headers,
    })
    if (!res.ok()) continue
    const payload = unwrapApiBody(await res.json())
    const doc = payload?.[key]?.[0]
    if (doc?.id) return String(doc.id)
  }
  return null
}

/**
 * Ouvre une fiche facture/devis depuis la liste (menu « Voir » — pas de clic ligne).
 *
 * @param {import('playwright').Page} page
 * @param {'facture' | 'devis'} kind
 */
async function openFinanceDocumentFromListUi(page, kind, baseUrl = envBaseUrl()) {
  const inboxPath = kind === 'facture' ? '/factures/inbox' : '/devis/inbox'
  await gotoDemoReady(page, inboxPath, baseUrl)
  await dismissDemoWelcomeDialog(page)
  const viewPattern = kind === 'facture' ? /voir la facture|voir/i : /voir le devis|voir/i
  const menuBtn = page.getByRole('button', { name: /actions|plus d'actions|menu/i }).first()
  if (await menuBtn.isVisible().catch(() => false)) {
    await menuBtn.click()
    await page.getByRole('menuitem', { name: viewPattern }).first().click({ timeout: 8_000 }).catch(() => {})
  }
  const detailPath = kind === 'facture' ? /\/factures\/voir\// : /\/devis\/voir\//
  const detailPage = await page.context().waitForEvent('page', { timeout: 12_000 }).catch(() => null)
  if (detailPage) {
    await detailPage.waitForURL(detailPath, { timeout: 20_000 })
    await detailPage.bringToFront()
    return detailPage
  }
  await page.waitForURL(detailPath, { timeout: 20_000 }).catch(() => {})
  return page
}

/** Ouvre la fiche première facture / devis (pas de lien dans le tableau desktop). */
export async function navigateToFirstInvoiceDetail(page, baseUrl = envBaseUrl()) {
  const apiBase = envApiBase(baseUrl)
  const headers = await marketingApiHeaders(page)
  const id = await fetchFirstFinanceDocumentId(page, apiBase, headers, 'facture')
  if (id) {
    await gotoDemoReady(page, `/factures/voir/${encodeURIComponent(id)}`, baseUrl)
    await waitForFinanceDocumentDetail(page, 'facture')
    return
  }
  const detailPage = await openFinanceDocumentFromListUi(page, 'facture', baseUrl)
  await waitForFinanceDocumentDetail(detailPage, 'facture')
}

/**
 * Attend le rendu d'une fiche facture ou devis (après navigation directe ou clic liste).
 *
 * @param {import('playwright').Page} page
 * @param {'facture' | 'devis'} kind
 */
export async function waitForFinanceDocumentDetail(page, kind = 'facture') {
  await dismissDemoWelcomeDialog(page)
  const urlPattern = kind === 'facture' ? /\/factures\/voir\// : /\/devis\/voir\//
  await page.waitForURL(urlPattern, { timeout: 20_000 }).catch(() => {})
  await page.locator('main').waitFor({ state: 'visible', timeout: 15_000 })
  const breadcrumb = page.getByRole('navigation', { name: /fil d'ariane|breadcrumb/i }).or(
    page.locator('nav[aria-label*="breadcrumb" i]'),
  )
  if (await breadcrumb.first().isVisible().catch(() => false)) {
    await breadcrumb.first().waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {})
  }
  await page.waitForTimeout(500)
}

export async function navigateToFirstQuoteDetail(page, baseUrl = envBaseUrl()) {
  const apiBase = envApiBase(baseUrl)
  const headers = await marketingApiHeaders(page)
  const id = await fetchFirstFinanceDocumentId(page, apiBase, headers, 'devis')
  if (id) {
    await gotoDemoReady(page, `/devis/voir/${encodeURIComponent(id)}`, baseUrl)
    await waitForFinanceDocumentDetail(page, 'devis')
    return
  }
  const detailPage = await openFinanceDocumentFromListUi(page, 'devis', baseUrl)
  await waitForFinanceDocumentDetail(detailPage, 'devis')
}

/** Connexion via API (cookie + localStorage) — fiable pour scripts headless. */
export async function loginViaApi(page, baseUrl = envBaseUrl()) {
  const { email, password } = envCredentials()
  const apiBase = envApiBase(baseUrl)
  const res = await page.context().request.post(`${apiBase}/auth/login`, {
    data: {
      email,
      password,
      deviceFingerprint: MARKETING_DEVICE_FINGERPRINT,
    },
  })

  if (!res.ok()) {
    const body = await res.text().catch(() => '')
    throw new Error(`Login API ${res.status()} — vérifiez le seed (npm run seed:playwright --prefix server).\n${body.slice(0, 300)}`)
  }

  const payload = unwrapApiBody(await res.json())
  if (payload?.needDeviceVerification) {
    throw new Error(
      'Vérification nouvel appareil demandée par l’API. Ouvrez une fois /login dans Chrome, ' +
        'validez l’email, puis relancez marketing:capture.',
    )
  }

  const token = payload?.access_token
  const user = payload?.user
  if (!token) throw new Error('Login API : pas de access_token dans la réponse')

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await page.evaluate(
    ({ token, user, deviceFingerprint }) => {
      localStorage.setItem('auth_token', token)
      if (user) localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('facturio_device_fp', deviceFingerprint)
      localStorage.setItem('facturio_cookie_consent_v1', new Date().toISOString())
    },
    { token, user, deviceFingerprint: MARKETING_DEVICE_FINGERPRINT },
  )

  const org = user?.organization?.name ?? user?.organizationId ?? '?'
  console.log(`[capture] Session API OK — ${email} (org: ${org})`)
}

/** Fallback UI si l’API est indisponible. */
export async function loginViaForm(page, baseUrl = envBaseUrl()) {
  const { email, password } = envCredentials()
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 })

  const emailField = page.getByRole('textbox', { name: /email/i })
  await emailField.waitFor({ timeout: 30_000 })
  await emailField.fill(email)
  await page.getByLabel(/^mot de passe/i).fill(password)
  await page.getByRole('button', { name: /connexion/i }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 45_000 })
  console.log(`[capture] Session formulaire OK — ${email}`)
}

/** Synchronise les écritures comptables depuis les factures émises / payées. */
export async function syncAccountingFromInvoices(page, baseUrl = envBaseUrl()) {
  const apiBase = envApiBase(baseUrl)
  const res = await page.context().request.post(`${apiBase}/accounting/sync/invoices`)
  if (!res.ok()) {
    const body = await res.text().catch(() => '')
    console.warn(`[capture] Sync compta HTTP ${res.status()}`, body.slice(0, 200))
    return null
  }
  const payload = await res.json()
  const data = payload?.data ?? payload
  console.log(
    `[capture] Compta synchronisée — ventes +${data?.salesCreated ?? 0}, encaissements +${data?.paymentsCreated ?? 0}`,
  )
  return data
}

export async function login(page, baseUrl = envBaseUrl()) {
  try {
    await loginViaApi(page, baseUrl)
  } catch (apiErr) {
    console.warn('[capture] Login API échoué, essai formulaire…', apiErr instanceof Error ? apiErr.message : apiErr)
    await loginViaForm(page, baseUrl)
  }

  await gotoReady(page, `/auth/session?from=${encodeURIComponent('/dashboard')}`, baseUrl)
}

/**
 * Connexion sur le compte démo partagé (POST /api/demo/enter).
 *
 * @param {import('playwright').Page} page
 * @param {string} [baseUrl]
 */
export async function loginDemoViaApi(page, baseUrl = envBaseUrl()) {
  const apiBase = envApiBase(baseUrl)
  const res = await page.context().request.post(`${apiBase}/demo/enter`, {
    data: { deviceFingerprint: MARKETING_DEVICE_FINGERPRINT },
  })

  if (!res.ok()) {
    const body = await res.text().catch(() => '')
    throw new Error(
      `Demo enter API ${res.status()} — lancez npm run ensure-demo --prefix server.\n${body.slice(0, 300)}`,
    )
  }

  const payload = unwrapApiBody(await res.json())
  const token = payload?.access_token
  const user = payload?.user
  if (!token) throw new Error('Demo enter : pas de access_token')

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await page.evaluate(
    ({ token, user, deviceFingerprint }) => {
      localStorage.setItem('auth_token', token)
      if (user) localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('demo_mode', '1')
      localStorage.setItem('facturio_device_fp', deviceFingerprint)
      localStorage.setItem('facturio_cookie_consent_v1', new Date().toISOString())
    },
    { token, user, deviceFingerprint: MARKETING_DEVICE_FINGERPRINT },
  )

  const org = user?.organization?.name ?? '?'
  console.log(`[demo-capture] Session démo OK — ${user?.email ?? 'demo'} (org: ${org})`)
}

/** Entre en démo puis ouvre l'application (bootstrap session comme après /essayer). */
export async function enterDemo(page, baseUrl = envBaseUrl()) {
  await loginDemoViaApi(page, baseUrl)
  const origin = baseUrl.replace(/\/$/, '')
  const from = encodeURIComponent('/factures/inbox')
  await page.goto(`${origin}/auth/session?from=${from}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  })
  await page.waitForURL(/\/(factures|dashboard|devis|auth\/session)/, { timeout: 90_000 })
  if (page.url().includes('/auth/session')) {
    await page.waitForURL(/\/(factures|dashboard|devis)/, { timeout: 90_000 })
  }
  await waitForDesktopNav(page, { timeout: 90_000 })
  await page.waitForTimeout(800)
}

/** Ferme la popin de bienvenue démo si elle est ouverte. */
export async function dismissDemoWelcomeDialog(page) {
  const dialog = page.getByRole('dialog').filter({ hasText: /espace démo/i })
  if (!(await dialog.isVisible().catch(() => false))) return
  await dialog
    .getByRole('button', { name: /explorer seul|fermer|voir les factures/i })
    .first()
    .click({ timeout: 4000 })
    .catch(() => page.keyboard.press('Escape').catch(() => {}))
  await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
}

/**
 * Capture viewport (marketing) + copie optionnelle vers public/.
 * @param {import('playwright').Page} page
 * @param {string} filePath absolu .png
 * @param {{ publicPath?: string, fullPage?: boolean, waitMs?: number }} opts
 */
export async function snap(page, filePath, opts = {}) {
  const cfg = getScreenshotConfig()
  await waitForPageReady(page).catch(() => {})
  if (opts.waitMs) await page.waitForTimeout(opts.waitMs)
  await mkdir(path.dirname(filePath), { recursive: true })

  const ext = path.extname(filePath).slice(1).toLowerCase()
  const type =
    ext === 'jpg' || ext === 'jpeg' ? 'jpeg' : ext === 'png' ? 'png' : captureExtension()
  const animations =
    cfg.disableAnimations && !opts.allowAnimations ? 'disabled' : 'allow'

  await page.screenshot({
    path: filePath,
    fullPage: opts.fullPage ?? false,
    type,
    ...(type === 'jpeg' ? { quality: cfg.jpegQuality } : {}),
    animations,
  })

  if (opts.publicPath) {
    await mkdir(path.dirname(opts.publicPath), { recursive: true })
    if (type === 'png' && opts.publicPath === filePath) return
    if (type === 'png') {
      await copyFile(filePath, opts.publicPath)
    } else {
      await page.screenshot({ path: opts.publicPath, fullPage: opts.fullPage ?? false, type: 'png', animations })
    }
  }
}

/** @deprecated Préférer navigateToFirstInvoiceDetail / navigateToFirstQuoteDetail */
export async function openFirstDocumentRow(page, kind) {
  if (kind === 'factures') return navigateToFirstInvoiceDetail(page)
  if (kind === 'devis') return navigateToFirstQuoteDetail(page)
  throw new Error(`openFirstDocumentRow: kind inconnu ${kind}`)
}
