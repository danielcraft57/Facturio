#!/usr/bin/env node
/**
 * Enregistrement vidéo marketing — une seule page / session.
 *
 *   npm run marketing:clips              # showreel unique (défaut)
 *   npm run marketing:clips -- --split   # même session → extrait un WebM par plan (ffmpeg)
 *   npm run marketing:clips -- --merge   # concat des split (legacy)
 */

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { PATHS } from './marketing-paths.mjs'
import { getScreenshotConfig } from './marketing-screenshot-env.mjs'
import {
  envBaseUrl,
  loadPlaywright,
  assertAppReachable,
} from './playwright-marketing-helpers.mjs'
import { performStoryboardScene, pauseAfterScene } from './marketing-showreel-scenes.mjs'
import {
  openMarketingVideoSession,
  finalizeMarketingVideo,
  extractClipSegment,
} from './marketing-video-session.mjs'

const BASE_URL = envBaseUrl()
const args = process.argv.slice(2)
const variantArg = args.find((a) => a.startsWith('--variant='))?.split('=')[1]
  ?? (args.includes('--variant') ? args[args.indexOf('--variant') + 1] : '30s-main')
const splitMode = args.includes('--split')
const mergeMode = args.includes('--merge')

async function loadVariantScenes(variantId) {
  const raw = JSON.parse(await readFile(PATHS.storyboard, 'utf8'))
  const variant = raw.variants?.find((v) => v.id === variantId)
  if (!variant) throw new Error(`Variante ${variantId} introuvable dans storyboard.json`)
  return variant.segments
    .filter((s) => s.captureSlug)
    .map((s) => ({
      id: s.id,
      slug: s.captureSlug,
      holdMs: Number(s.holdMs ?? s.hold_ms ?? getScreenshotConfig().sceneHoldMs),
    }))
}

async function recordOnSinglePage(browser, scenes, { extractSplit = false } = {}) {
  const showreelFile = path.join(PATHS.videos, variantArg, `showreel-${variantArg}.webm`)
  const tmpDir = path.join(PATHS.videos, variantArg, '_tmp', 'session')
  await mkdir(path.dirname(showreelFile), { recursive: true })

  const cfg = getScreenshotConfig()
  const { context, page } = await openMarketingVideoSession(browser, tmpDir, BASE_URL)
  const markers = []
  const wallStart = Date.now()

  try {
    console.log(`[showreel] ${scenes.length} plans — même page`)

    for (const scene of scenes) {
      const startSec = (Date.now() - wallStart) / 1000
      console.log(`[showreel] → ${scene.id} (${scene.slug})`)
      const sceneStart = Date.now()
      try {
        await Promise.race([
          performStoryboardScene(page, scene.slug, BASE_URL, { paceMs: cfg.scenePaceMs }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`timeout scène ${cfg.sceneTimeoutMs / 1000}s`)), cfg.sceneTimeoutMs),
          ),
        ])
        console.log(`[showreel] ✓ ${scene.slug} (${((Date.now() - sceneStart) / 1000).toFixed(1)}s)`)
      } catch (err) {
        console.warn(`[showreel] ✗ ${scene.slug}:`, err.message)
      }
      await pauseAfterScene(page, scene.holdMs)
      markers.push({
        scene,
        startSec,
        endSec: (Date.now() - wallStart) / 1000,
      })
    }

    const video = page.video()
    await context.close()
    const { trimSec } = await finalizeMarketingVideo(video, showreelFile)
    console.log(`[showreel] ✓ ${path.basename(showreelFile)}`)

    const recorded = [showreelFile]

    if (extractSplit) {
      console.log('[split] Extraction depuis le showreel (même session)…')
      for (const m of markers) {
        const clipFile = path.join(
          PATHS.videos,
          variantArg,
          `${m.scene.id}-${m.scene.slug}.webm`,
        )
        const start = Math.max(0, m.startSec - trimSec)
        const dur = Math.max(0.5, m.endSec - m.startSec)
        try {
          await extractClipSegment(showreelFile, clipFile, start, dur)
          console.log(`[split] ✓ ${path.basename(clipFile)}`)
          recorded.push(clipFile)
        } catch (err) {
          console.warn(`[split] ✗ ${m.scene.slug}:`, err.message)
        }
      }
    }

    return { recorded, markers, trimSec, showreelFile }
  } catch (err) {
    await context.close().catch(() => {})
    throw err
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}

function mergeClipsWithFfmpeg(files, outFile) {
  const ffmpeg = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' })
  if (ffmpeg.status !== 0) throw new Error('ffmpeg introuvable — requis pour --merge')
  const listPath = path.join(path.dirname(outFile), '_concat.txt')
  const lines = files.map((f) => `file '${f.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`)
  return writeFile(listPath, lines.join('\n'), 'utf8').then(() => {
    const run = spawnSync(
      'ffmpeg',
      ['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', outFile],
      { encoding: 'utf8' },
    )
    if (run.status !== 0) throw new Error(run.stderr || 'ffmpeg concat failed')
    console.log(`[merge] ✓ ${outFile}`)
    return outFile
  })
}

async function main() {
  const scenes = await loadVariantScenes(variantArg)
  const { chromium } = await loadPlaywright()
  await assertAppReachable(BASE_URL)
  await mkdir(path.join(PATHS.videos, variantArg), { recursive: true })

  if (mergeMode) {
    const manifestPath = path.join(PATHS.videos, variantArg, 'manifest.json')
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    const outFile = path.join(PATHS.videos, variantArg, `merged-${variantArg}.webm`)
    const browser = await chromium.launch({ headless: true })
    await mergeClipsWithFfmpeg(manifest.files.filter((f) => f.includes('-')), outFile)
    await browser.close()
    return
  }

  const browser = await chromium.launch({ headless: true })
  let recorded = []
  let meta = {}

  try {
    const result = await recordOnSinglePage(browser, scenes, { extractSplit: splitMode })
    recorded = splitMode
      ? result.recorded.filter((f) => f !== result.showreelFile)
      : [result.showreelFile]
    meta = { markers: result.markers, trimSec: result.trimSec, showreel: result.showreelFile }
  } catch (err) {
    console.error('[clips] ✗', err.message)
  }

  await browser.close()

  await writeFile(
    path.join(PATHS.videos, variantArg, 'manifest.json'),
    JSON.stringify(
      {
        variant: variantArg,
        mode: splitMode ? 'split-from-showreel' : 'showreel',
        recordedAt: new Date().toISOString(),
        files: recorded,
        ...meta,
      },
      null,
      2,
    ),
  )
  console.log(`\n[clips] ${recorded.length} fichier(s) → ${path.join(PATHS.videos, variantArg)}`)
  if (recorded.length === 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
