/**
 * Baseline Prisma Migrate sur une base déjà remplie (ex. créée avec `db push`).
 * Marque les migrations déjà reflétées dans le schéma comme « appliquées »,
 * puis laisse `migrate deploy` appliquer le reste.
 *
 * Usage (depuis server/) :
 *   node scripts/prisma-baseline.mjs
 *   node scripts/prisma-baseline.mjs --schema prisma/postgresql/schema.prisma
 *   node scripts/prisma-baseline.mjs --all
 *   node scripts/prisma-baseline.mjs --pending 20260522200000_mailbox_flags_tags
 */
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverRoot = path.resolve(__dirname, '..')

function parseArgs(argv) {
  const opts = { schema: 'prisma/schema.prisma', all: false, pending: [], auto: false }
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--schema' && argv[i + 1]) {
      opts.schema = argv[++i]
      continue
    }
    if (argv[i] === '--all') {
      opts.all = true
      continue
    }
    if (argv[i] === '--auto') {
      opts.auto = true
      continue
    }
    if (argv[i] === '--pending' && argv[i + 1]) {
      opts.pending = argv[++i].split(',').map((s) => s.trim()).filter(Boolean)
      continue
    }
  }
  return opts
}

function migrationsDirForSchema(schemaRel) {
  const dir = path.dirname(schemaRel)
  return dir === 'prisma' ? 'prisma/migrations' : path.join(dir, 'migrations')
}

function listMigrations(migrationsRel) {
  const abs = path.join(serverRoot, migrationsRel)
  if (!fs.existsSync(abs)) {
    throw new Error(`Dossier migrations introuvable: ${abs}`)
  }
  return fs
    .readdirSync(abs)
    .filter((name) => fs.statSync(path.join(abs, name)).isDirectory())
    .sort()
}

function run(cmd) {
  console.log(`\n> ${cmd}`)
  execSync(cmd, { cwd: serverRoot, stdio: 'inherit', env: process.env })
}

function schemaDiffScript(schemaRel) {
  try {
    return execSync(
      `npx prisma migrate diff --from-schema-datasource ${schemaRel} --to-schema-datamodel ${schemaRel} --script`,
      { cwd: serverRoot, encoding: 'utf8', env: process.env },
    ).trim()
  } catch (e) {
    const out = `${e.stdout ?? ''}${e.stderr ?? ''}`
    if (out.includes('P1003') || out.includes('does not exist')) {
      return null
    }
    throw e
  }
}

/** Déduit les migrations encore à exécuter via le diff schéma ↔ base. */
function detectPendingFromDiff(schemaRel, allMigrationNames) {
  const diff = schemaDiffScript(schemaRel)
  if (diff === null) return []
  if (!diff) return []

  const pending = new Set()
  const rules = [
    { needle: /starred|seenAt|snoozedUntil|"tags"/i, migration: '20260522200000_mailbox_flags_tags' },
    { needle: /archivedAt/i, migration: '20260522190000_archive_invoices_quotes' },
    { needle: /ApiAccessToken|api_access_token/i, migration: '20260521180000_api_access_tokens' },
    { needle: /sourceQuoteId|invoice_source/i, migration: '20260521140000_invoice_source_quote' },
    { needle: /StripePlatformEvent|stripe_platform/i, migration: '20260521120000_stripe_platform_events' },
  ]

  for (const { needle, migration } of rules) {
    if (needle.test(diff) && allMigrationNames.includes(migration)) {
      pending.add(migration)
    }
  }

  if (pending.size === 0 && diff.length > 0) {
    console.warn(
      'Diff non vide mais aucune règle connue — marquez manuellement avec --pending ou appliquez le SQL du diff.',
    )
    console.warn(diff.slice(0, 800))
  }

  return [...pending]
}

function main() {
  const opts = parseArgs(process.argv)
  const migrationsRel = migrationsDirForSchema(opts.schema)
  const all = listMigrations(migrationsRel)

  let pending = new Set(opts.pending)
  if (opts.all) {
    pending = new Set()
  } else if (opts.auto || pending.size === 0) {
    const detected = detectPendingFromDiff(opts.schema, all)
    detected.forEach((m) => pending.add(m))
    if (opts.auto && detected.length) {
      console.log(`\nMigrations laissées pour deploy: ${detected.join(', ')}`)
    }
  }

  const toResolve = all.filter((m) => !pending.has(m))
  if (!toResolve.length) {
    console.log('Aucune migration à marquer comme appliquée (tout est en attente).')
    return
  }

  console.log(`\nSchéma: ${opts.schema}`)
  console.log(`Dossier: ${migrationsRel}`)
  console.log(`Marquer comme appliquées (${toResolve.length}):`)
  toResolve.forEach((m) => console.log(`  - ${m}`))
  if (pending.size) {
    console.log(`En attente pour migrate deploy (${pending.size}):`)
    ;[...pending].forEach((m) => console.log(`  - ${m}`))
  }

  for (const name of toResolve) {
    run(`npx prisma migrate resolve --applied ${name} --schema ${opts.schema}`)
  }

  console.log('\nBaseline terminé. Lancez: npx prisma migrate deploy --schema ' + opts.schema)
}

main()
