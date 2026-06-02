#!/usr/bin/env node
/**
 * Génère icon.png, splash-icon.png, favicon.png depuis assets/source/icon.svg
 * Prérequis : npm install sharp --save-dev (dans mobile/)
 */
import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svgPath = join(root, 'assets/source/icon.svg')
const outDir = join(root, 'assets')

async function main() {
  let sharp
  try {
    sharp = (await import('sharp')).default
  } catch {
    console.error('Installez sharp : npm install sharp --save-dev --prefix mobile')
    process.exit(1)
  }

  if (!existsSync(svgPath)) {
    console.error('SVG introuvable:', svgPath)
    process.exit(1)
  }

  const svg = readFileSync(svgPath)

  await sharp(svg).resize(1024, 1024).png().toFile(join(outDir, 'icon.png'))
  await sharp(svg).resize(512, 512).png().toFile(join(outDir, 'splash-icon.png'))
  await sharp(svg).resize(48, 48).png().toFile(join(outDir, 'favicon.png'))
  await sharp(svg).resize(432, 432).png().toFile(join(outDir, 'android-icon-foreground.png'))

  console.log('Assets générés dans mobile/assets/')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
