/**
 * migrate deploy ; en cas de base existante sans historique (P3005), baseline auto puis redeploy.
 */
import { execSync } from 'child_process'
import fs from 'fs'
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

function sqliteDbPathFromEnv(schema = 'prisma/schema.prisma') {
  return resolveSqliteDbPath(schema, process.env.DATABASE_URL ?? '')
}

/** Chemin SQLite comme Prisma (relatif au dossier du schema.prisma). */
function resolveSqliteDbPath(schema, databaseUrl) {
  const url = databaseUrl ?? ''
  const m = url.match(/^file:(.+)$/i)
  if (!m) return null
  const schemaDir = path.dirname(path.resolve(serverRoot, schema))
  return path.resolve(schemaDir, m[1].replace(/^\.\//, ''))
}

function sqliteHasColumn(dbPath, table, column) {
  try {
    const out = execSync(
      `sqlite3 "${dbPath.replace(/"/g, '""')}" "SELECT COUNT(*) FROM pragma_table_info('${table}') WHERE name='${column}';"`,
      { encoding: 'utf8' },
    ).trim()
    return out === '1'
  } catch {
    return false
  }
}

function ensureSqliteColumn(dbPath, table, column, alterSql) {
  if (!dbPath || !fs.existsSync(dbPath)) return
  if (sqliteHasColumn(dbPath, table, column)) return
  console.log(`\nColonne manquante ${table}.${column} — application du correctif sur ${dbPath}`)
  execSync(`sqlite3 "${dbPath.replace(/"/g, '""')}" "${alterSql.replace(/"/g, '""')}"`, {
    stdio: 'inherit',
  })
}

function promoteLegacySqliteDb(canonicalPath) {
  const dir = path.dirname(canonicalPath)
  const base = path.basename(canonicalPath)
  const candidates = [
    path.join(dir, 'prisma', base),
    path.join(dir, 'prisma', 'prisma', base),
    path.join(dir, 'prisma', 'prisma', 'prisma', base),
    canonicalPath,
  ]
  let best = null
  for (const p of candidates) {
    try {
      const st = fs.statSync(p)
      if (st.size <= 0) continue
      const users = Number(
        execSync(
          `sqlite3 "${p.replace(/"/g, '""')}" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='User';"`,
          { encoding: 'utf8' },
        ).trim(),
      )
      const userRows =
        users > 0
          ? Number(
              execSync(`sqlite3 "${p.replace(/"/g, '""')}" "SELECT COUNT(*) FROM User;"`, {
                encoding: 'utf8',
              }).trim(),
            )
          : 0
      const score = userRows > 0 ? st.size + userRows * 1_000_000 : st.size
      if (!best || score > best.score) best = { path: p, size: st.size, score, userRows }
    } catch {
      /* absent ou illisible */
    }
  }
  if (!best) return canonicalPath
  const canonSize = fs.existsSync(canonicalPath) ? fs.statSync(canonicalPath).size : 0
  let canonUsers = 0
  try {
    canonUsers = Number(
      execSync(
        `sqlite3 "${canonicalPath.replace(/"/g, '""')}" "SELECT COUNT(*) FROM User;"`,
        { encoding: 'utf8' },
      ).trim(),
    )
  } catch {
    canonUsers = 0
  }
  if (best.path !== canonicalPath && (canonUsers === 0 || canonSize < best.size)) {
    fs.mkdirSync(path.dirname(canonicalPath), { recursive: true })
    fs.copyFileSync(best.path, canonicalPath)
    console.log(`\nBase SQLite : copie ${best.path} → ${canonicalPath} (${best.userRows} utilisateurs)`)
  }
  return canonicalPath
}

function repairSqliteSchemaDrift(schema) {
  const url = process.env.DATABASE_URL ?? ''
  if (!url.startsWith('file:')) return
  const dbPath = resolveSqliteDbPath(schema, url)
  if (!dbPath) return
  ensureSqliteColumn(
    dbPath,
    'User',
    'documentTagLibrary',
    'ALTER TABLE "User" ADD COLUMN "documentTagLibrary" TEXT;',
  )
}

function tryGenerate(schema) {
  try {
    run(`npx prisma generate --schema ${schema}`)
  } catch (e) {
    console.warn(
      '\nprisma generate a échoué (souvent query_engine verrouillé — arrêtez le serveur puis relancez).',
      e.message ?? e,
    )
  }
}

function resetSqliteTestDbIfNeeded(schema) {
  const dbPath = sqliteDbPathFromEnv(schema)
  if (!dbPath || !dbPath.replace(/\\/g, '/').includes('test.db')) return false
  for (const p of [dbPath, `${dbPath}-journal`, `${dbPath}-wal`, `${dbPath}-shm`]) {
    try {
      fs.unlinkSync(p)
    } catch {
      /* absent */
    }
  }
  console.log(`\nBase test SQLite recréée : ${dbPath}`)
  return true
}

function main() {
  const { schema } = parseArgs(process.argv)
  const isSqlite = (process.env.DATABASE_URL ?? '').startsWith('file:')
  if (isSqlite && !process.env.DATABASE_URL?.includes('postgresql')) {
    const canonical = resolveSqliteDbPath(schema, process.env.DATABASE_URL ?? 'file:./dev.db')
    if (canonical) promoteLegacySqliteDb(canonical)
  }
  if (process.env.NODE_ENV === 'test') {
    resetSqliteTestDbIfNeeded(schema)
    try {
      execSync(
        `npx prisma migrate reset --force --skip-seed --skip-generate --schema ${schema}`,
        { cwd: serverRoot, stdio: 'inherit', env: process.env },
      )
      console.log('\nBase test SQLite réinitialisée (migrate reset).')
      tryGenerate(schema)
      return
    } catch (e) {
      console.warn('\nmigrate reset test.db a échoué, repli sur migrate deploy…', e.message ?? e)
    }
  }
  if (tryDeploy(schema)) {
    console.log('\nMigrations à jour.')
    repairSqliteSchemaDrift(schema)
    tryGenerate(schema)
    return
  }

  if (resetSqliteTestDbIfNeeded(schema) && tryDeploy(schema)) {
    console.log('\nMigrations à jour (test.db régénérée).')
    repairSqliteSchemaDrift(schema)
    tryGenerate(schema)
    return
  }

  console.log('\nBase existante sans historique Prisma (P3005) — baseline (tout le historique)…')
  run(`node scripts/prisma-baseline.mjs --schema ${schema} --all`)
  tryDeploy(schema)
  repairSqliteSchemaDrift(schema)
  tryGenerate(schema)
  console.log('\nSetup migrations terminé.')
}

main()
