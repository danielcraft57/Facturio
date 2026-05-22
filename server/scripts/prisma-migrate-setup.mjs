/**
 * migrate deploy ; en cas de base existante sans historique (P3005), baseline auto puis redeploy.
 */
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverRoot = path.resolve(__dirname, '..')

function parseArgs(argv) {
  let schema = 'prisma/schema.prisma'
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--schema' && argv[i + 1]) schema = argv[++i]
  }
  return { schema }
}

function run(cmd) {
  console.log(`\n> ${cmd}`)
  execSync(cmd, { cwd: serverRoot, stdio: 'inherit', env: process.env })
}

function tryDeploy(schema) {
  const maxAttempts = 12
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      execSync(`npx prisma migrate deploy --schema ${schema}`, {
        cwd: serverRoot,
        encoding: 'utf8',
        env: process.env,
      })
      return true
    } catch (e) {
      const msg = `${e.stdout ?? ''}${e.stderr ?? ''}${e.message ?? ''}`
      if (msg.includes('P3005')) return false

      const failed =
        msg.match(/Migration name: (\d{14}_[\w]+)/)?.[1] ??
        msg.match(/Applying migration `(\d{14}_[\w]+)`/)?.[1]
      const alreadyThere =
        /duplicate column name/i.test(msg) ||
        /already exists/i.test(msg) ||
        /duplicate key/i.test(msg)

      if (failed && alreadyThere) {
        console.log(`\nColonne/table déjà présente — marquer ${failed} comme appliquée…`)
        run(`npx prisma migrate resolve --applied ${failed} --schema ${schema}`)
        continue
      }
      throw e
    }
  }
  throw new Error('migrate deploy : trop de tentatives (migrations en conflit)')
}

function main() {
  const { schema } = parseArgs(process.argv)
  if (tryDeploy(schema)) {
    console.log('\nMigrations à jour.')
    run(`npx prisma generate --schema ${schema}`)
    return
  }

  console.log('\nBase existante sans historique Prisma (P3005) — baseline (tout le historique)…')
  run(`node scripts/prisma-baseline.mjs --schema ${schema} --all`)
  tryDeploy(schema)
  run(`npx prisma generate --schema ${schema}`)
  console.log('\nSetup migrations terminé.')
}

main()
