import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const MARKETING_DIR = path.resolve(__dirname, '..')

const ENV_FILES = [
  path.join(MARKETING_DIR, '.env'),
  path.join(MARKETING_DIR, '.env.local'),
]

let loaded = false

function parseBool(raw, fallback) {
  if (raw === undefined || raw === '') return fallback
  return /^(1|true|yes|on)$/i.test(String(raw).trim())
}

function parseIntEnv(raw, fallback) {
  if (raw === undefined || raw === '') return fallback
  const n = Number.parseInt(String(raw).trim(), 10)
  return Number.isFinite(n) ? n : fallback
}

/** Charge docs/marketing/.env sans écraser les variables déjà définies. */
export function loadMarketingEnv() {
  if (loaded) return
  for (const file of ENV_FILES) {
    if (!existsSync(file)) continue
    const content = readFileSync(file, 'utf8')
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (process.env[key] === undefined) process.env[key] = val
    }
  }
  loaded = true
}

function profileViewport(profile) {
  const p = (profile || 'desktop').toLowerCase()
  if (p === 'tablet') {
    return {
      width: parseIntEnv(process.env.WEBSITE_SCREENSHOT_VIEWPORT_TABLET_WIDTH, 1024),
      height: parseIntEnv(process.env.WEBSITE_SCREENSHOT_VIEWPORT_TABLET_HEIGHT, 2500),
      maxWidth: parseIntEnv(process.env.WEBSITE_SCREENSHOT_MAX_WIDTH_TABLET, 1200),
    }
  }
  if (p === 'mobile') {
    return {
      width: parseIntEnv(process.env.WEBSITE_SCREENSHOT_VIEWPORT_MOBILE_WIDTH, 430),
      height: parseIntEnv(process.env.WEBSITE_SCREENSHOT_VIEWPORT_MOBILE_HEIGHT, 2500),
      maxWidth: parseIntEnv(process.env.WEBSITE_SCREENSHOT_MAX_WIDTH_MOBILE, 800),
    }
  }
  return {
    width: parseIntEnv(process.env.WEBSITE_SCREENSHOT_VIEWPORT_DESKTOP_WIDTH, 1920),
    height: parseIntEnv(process.env.WEBSITE_SCREENSHOT_VIEWPORT_DESKTOP_HEIGHT, 2400),
    maxWidth: parseIntEnv(process.env.WEBSITE_SCREENSHOT_MAX_WIDTH_DESKTOP, 1600),
  }
}

/** @returns {ReturnType<typeof buildScreenshotConfig>} */
export function getScreenshotConfig() {
  loadMarketingEnv()
  const profile = process.env.MARKETING_SCREENSHOT_PROFILE || 'desktop'
  const vp = profileViewport(profile)
  const viewportWidth = Math.min(vp.width, vp.maxWidth)

  return {
    profile,
    viewport: { width: viewportWidth, height: vp.height },
    waitMs: parseIntEnv(process.env.WEBSITE_SCREENSHOT_WAIT_MS, 700),
    gotoWaitUntil: process.env.WEBSITE_SCREENSHOT_GOTO_WAIT_UNTIL || 'domcontentloaded',
    gotoTimeoutMs: parseIntEnv(process.env.WEBSITE_SCREENSHOT_GOTO_TIMEOUT_MS, 28_000),
    webpQuality: parseIntEnv(process.env.WEBSITE_SCREENSHOT_WEBP_QUALITY, 78),
    captureFormat: (process.env.WEBSITE_SCREENSHOT_CAPTURE_FORMAT || 'png').toLowerCase(),
    jpegQuality: parseIntEnv(process.env.WEBSITE_SCREENSHOT_JPEG_QUALITY, 82),
    deviceScaleFactor: parseIntEnv(process.env.WEBSITE_SCREENSHOT_DEVICE_SCALE_FACTOR, 1),
    blockTrackers: parseBool(process.env.WEBSITE_SCREENSHOT_BLOCK_TRACKERS, true),
    reducedMotion: parseBool(process.env.WEBSITE_SCREENSHOT_REDUCED_MOTION, true),
    disableAnimations: parseBool(process.env.WEBSITE_SCREENSHOT_DISABLE_ANIMATIONS, true),
    parallel: parseBool(process.env.WEBSITE_SCREENSHOT_PARALLEL, true),
    keepSets: parseIntEnv(process.env.WEBSITE_SCREENSHOT_KEEP_SETS, 5),
    cleanupBatchSize: parseIntEnv(process.env.WEBSITE_SCREENSHOT_CLEANUP_BATCH_SIZE, 1500),
    scrollEnabled: parseBool(process.env.WEBSITE_SCREENSHOT_SCROLL_ENABLED, true),
    scrollStepPx: parseIntEnv(process.env.WEBSITE_SCREENSHOT_SCROLL_STEP_PX, 480),
    scrollPauseMs: parseIntEnv(process.env.WEBSITE_SCREENSHOT_SCROLL_PAUSE_MS, 140),
    scrollMaxSteps: parseIntEnv(process.env.WEBSITE_SCREENSHOT_SCROLL_MAX_STEPS, 14),
    videoViewport: {
      width: parseIntEnv(process.env.MARKETING_VIDEO_VIEWPORT_WIDTH, 1600),
      height: parseIntEnv(process.env.MARKETING_VIDEO_VIEWPORT_HEIGHT, 900),
    },
    videoWaitMs: parseIntEnv(process.env.MARKETING_VIDEO_WAIT_MS, 200),
    videoScrollMaxSteps: parseIntEnv(process.env.MARKETING_VIDEO_SCROLL_MAX_STEPS, 5),
    sceneHoldMs: parseIntEnv(process.env.MARKETING_VIDEO_SCENE_HOLD_MS, 1200),
    scenePaceMs: parseIntEnv(process.env.MARKETING_VIDEO_SCENE_PACE_MS, 320),
    sceneTimeoutMs: parseIntEnv(process.env.MARKETING_VIDEO_SCENE_TIMEOUT_MS, 120_000),
    videoTrimStartSec: parseFloat(process.env.MARKETING_VIDEO_TRIM_START_SEC || '0') || 0,
    videoAutoTrim: parseBool(process.env.MARKETING_VIDEO_AUTO_TRIM, true),
    transitionMenuMs: parseIntEnv(process.env.MARKETING_VIDEO_TRANSITION_MENU_MS, 520),
    transitionFadeMs: parseIntEnv(process.env.MARKETING_VIDEO_TRANSITION_FADE_MS, 320),
    transitionRouteBarMs: parseIntEnv(process.env.MARKETING_VIDEO_TRANSITION_ROUTE_MS, 340),
  }
}

export function marketingVideoViewport() {
  return getScreenshotConfig().videoViewport
}

export function marketingViewport() {
  return getScreenshotConfig().viewport
}

/** Extension fichier capture (landing publique = toujours png). */
export function captureExtension({ forPublic = false } = {}) {
  if (forPublic) return 'png'
  const fmt = getScreenshotConfig().captureFormat
  return fmt === 'jpeg' || fmt === 'jpg' ? 'jpeg' : 'png'
}

export function captureFilename(slug, opts = {}) {
  return `${slug}.${captureExtension(opts)}`
}
