/**
 * Session vidéo unique : auth API → initScript → navigation immédiate (même page).
 */

import { spawnSync } from 'node:child_process'
import { mkdir, rm, stat, unlink } from 'node:fs/promises'
import path from 'node:path'
import {
  createMarketingContext,
  envApiBase,
  envBaseUrl,
  envCredentials,
  getVideoViewport,
  MARKETING_DEVICE_FINGERPRINT,
  prepareMarketingContext,
  unwrapApiBody,
  waitForAppShell,
  isLoginPage,
  loginViaApi,
} from './playwright-marketing-helpers.mjs'
import { getScreenshotConfig } from './marketing-screenshot-env.mjs'

/** @returns {Promise<{ token: string, user: object | null }>} */
export async function fetchMarketingAuth(baseUrl = envBaseUrl()) {
  const { email, password } = envCredentials()
  const apiBase = envApiBase(baseUrl)
  const res = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      deviceFingerprint: MARKETING_DEVICE_FINGERPRINT,
    }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Login API ${res.status} — seed:playwright requis.\n${body.slice(0, 200)}`)
  }
  const payload = unwrapApiBody(await res.json())
  if (payload?.needDeviceVerification) {
    throw new Error('Vérification appareil requise — connectez-vous une fois dans Chrome.')
  }
  if (!payload?.access_token) throw new Error('Login API : pas de access_token')
  return { token: payload.access_token, user: payload.user ?? null }
}

/**
 * Contexte + page uniques, prêts avant le showreel (auth déjà en localStorage).
 * @param {import('playwright').Browser} browser
 * @param {string} tmpDir
 */
export async function openMarketingVideoSession(browser, tmpDir, baseUrl = envBaseUrl()) {
  const vpRaw = getVideoViewport()
  const vp = { width: Math.max(vpRaw.width, 1280), height: vpRaw.height }
  const auth = await fetchMarketingAuth(baseUrl)
  await mkdir(tmpDir, { recursive: true })

  const context = await browser.newContext({
    viewport: vp,
    deviceScaleFactor: getScreenshotConfig().deviceScaleFactor,
    locale: 'fr-FR',
    reducedMotion: 'no-preference',
    recordVideo: { dir: tmpDir, size: vp },
    extraHTTPHeaders: {
      Authorization: `Bearer ${auth.token}`,
    },
  })
  await prepareMarketingContext(context, { forVideo: true })

  await context.addInitScript((data) => {
    localStorage.setItem('auth_token', data.token)
    if (data.user) localStorage.setItem('user', JSON.stringify(data.user))
    localStorage.setItem('facturio_device_fp', data.deviceFingerprint)
  }, { ...auth, deviceFingerprint: MARKETING_DEVICE_FINGERPRINT })

  const page = await context.newPage()
  page.setDefaultTimeout(30_000)
  page.setDefaultNavigationTimeout(60_000)

  const origin = baseUrl.replace(/\/$/, '')
  const cfg = getScreenshotConfig()
  const sessionUrl = `${origin}/auth/session?from=${encodeURIComponent('/dashboard')}`

  const bootstrapDashboard = async () => {
    await page.goto(sessionUrl, {
      waitUntil: 'domcontentloaded',
      timeout: cfg.gotoTimeoutMs,
    })
    await page.waitForURL(/\/dashboard(?:\/|\?|$)/, { timeout: 90_000 })
    await waitForAppShell(page)
  }

  try {
    await bootstrapDashboard()
  } catch (firstErr) {
    const url = page.url()
    if (await isLoginPage(page)) {
      console.warn('[video] Bootstrap session → login, retry loginViaApi…')
    } else if (url.includes('pending=device')) {
      throw new Error('Vérification appareil requise — connectez-vous une fois dans Chrome.')
    } else {
      console.warn('[video] Bootstrap session échoué, retry loginViaApi…', firstErr.message)
    }
    await loginViaApi(page, baseUrl)
    await page.goto(`${origin}/dashboard`, {
      waitUntil: 'domcontentloaded',
      timeout: cfg.gotoTimeoutMs,
    })
    await waitForAppShell(page)
  }

  console.log('[video] Session prête — même page pour tout le showreel')
  return { context, page, auth }
}

/** Détecte la fin du noir/blanc initial (ffmpeg blackdetect). */
export function detectLeadingBlackSec(webmPath) {
  const run = spawnSync(
    'ffmpeg',
    ['-hide_banner', '-i', webmPath, '-vf', 'blackdetect=d=0.12:pix_th=0.14', '-an', '-f', 'null', '-'],
    { encoding: 'utf8', timeout: 120_000 },
  )
  const log = `${run.stderr || ''}\n${run.stdout || ''}`
  const match = log.match(/black_start:0(?:\.0+)?\s+black_end:(\d+(?:\.\d+)?)/)
  if (match) return Math.max(0, parseFloat(match[1]) - 0.05)
  return 0
}

export async function trimVideoStart(inputPath, outputPath, startSec) {
  if (startSec <= 0.05) {
    const { copyFile } = await import('node:fs/promises')
    await copyFile(inputPath, outputPath)
    return outputPath
  }
  const run = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-y',
      '-ss',
      String(startSec.toFixed(3)),
      '-i',
      inputPath,
      '-c:v',
      'libvpx-vp9',
      '-crf',
      '32',
      '-b:v',
      '0',
      '-c:a',
      'libopus',
      outputPath,
    ],
    { encoding: 'utf8', timeout: 180_000 },
  )
  if (run.status !== 0) {
    throw new Error(`ffmpeg trim: ${(run.stderr || '').slice(-400)}`)
  }
  return outputPath
}

/**
 * @param {import('playwright').Video | null} video
 * @param {string} outFile
 */
export async function finalizeMarketingVideo(video, outFile) {
  if (!video) throw new Error('Enregistrement vidéo absent')

  const cfg = getScreenshotConfig()
  const raw = `${outFile}.raw.webm`
  await mkdir(path.dirname(outFile), { recursive: true })
  await video.saveAs(raw)

  let { size } = await stat(raw)
  if (size < 512) {
    await unlink(raw).catch(() => {})
    throw new Error(`Vidéo vide (${size} o)`)
  }

  let trimSec = cfg.videoTrimStartSec
  if (cfg.videoAutoTrim) {
    const detected = detectLeadingBlackSec(raw)
    trimSec = Math.max(trimSec, detected)
    if (detected > 0.1) {
      console.log(`[video] Auto-trim ${detected.toFixed(2)}s (blackdetect)`)
    }
  } else if (trimSec > 0) {
    console.log(`[video] Trim fixe ${trimSec.toFixed(2)}s`)
  }

  await trimVideoStart(raw, outFile, trimSec).catch(async (err) => {
    console.warn('[video] Trim ffmpeg échoué, export brut:', err.message)
    const { copyFile } = await import('node:fs/promises')
    await copyFile(raw, outFile)
    trimSec = 0
  })
  await unlink(raw).catch(() => {})

  ;({ size } = await stat(outFile))
  if (size < 512) throw new Error(`Vidéo invalide après trim (${size} o)`)
  return { outFile, trimSec }
}

export async function extractClipSegment(fullVideo, outClip, startSec, durationSec) {
  const run = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-y',
      '-ss',
      String(startSec.toFixed(3)),
      '-i',
      fullVideo,
      '-t',
      String(durationSec.toFixed(3)),
      '-c:v',
      'libvpx-vp9',
      '-crf',
      '32',
      '-b:v',
      '0',
      '-c:a',
      'libopus',
      outClip,
    ],
    { encoding: 'utf8' },
  )
  if (run.status !== 0) throw new Error(`ffmpeg extract: ${(run.stderr || '').slice(-300)}`)
  return outClip
}
