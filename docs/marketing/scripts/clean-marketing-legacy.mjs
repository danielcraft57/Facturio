#!/usr/bin/env node
/**
 * Supprime les anciens dossiers marketing éparpillés (screenshots-temp, tts-output).
 * Conserve docs/marketing/pub-2026/
 */

import { rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const marketingDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const LEGACY_DIRS = [
  'screenshots-temp',
  'tts-output',
]

async function main() {
  for (const dir of LEGACY_DIRS) {
    const target = path.join(marketingDir, dir)
    try {
      await rm(target, { recursive: true, force: true })
      console.log(`[clean] supprimé ${target}`)
    } catch (err) {
      console.warn(`[clean] ${target}:`, err.message)
    }
  }
  console.log('\n[clean] Production actuelle : docs/marketing/pub-2026/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
