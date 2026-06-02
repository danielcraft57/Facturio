#!/usr/bin/env node
/**
 * Suppression définitive de factures d'une organisation (prod / dev).
 * Utile pour retirer des factures de test (ex. paiements Stripe test) du quota mensuel Free.
 *
 * Le quota compte toutes les factures créées dans le mois calendaire (archivées ou non).
 *
 * cd /opt/facturio/server && node scripts/purge-organization-invoices.js …
 *
 * Lister les factures :
 *   node scripts/purge-organization-invoices.js list user@example.com
 *   node scripts/purge-organization-invoices.js list user@example.com --stripe
 *
 * Quota du mois :
 *   node scripts/purge-organization-invoices.js usage user@example.com
 *
 * Simulation :
 *   node scripts/purge-organization-invoices.js purge user@example.com --stripe --dry-run
 *
 * Supprimer (irréversible) :
 *   node scripts/purge-organization-invoices.js purge user@example.com --stripe --confirm
 *   node scripts/purge-organization-invoices.js purge user@example.com --this-month --confirm
 *   node scripts/purge-organization-invoices.js purge org:1 --all --confirm
 *   npm run invoices:purge -- user@example.com --stripe --confirm
 *
 * Doc : docs/deployment/SCRIPTS_EXPLOITATION_PRODUCTION.md
 * Shell : scripts/deploy/ops-facturio.sh invoices-purge …
 */

const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  });
}

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const FREE_MONTHLY_LIMIT = 25;

function usage() {
  console.log(`
Usage:
  node scripts/purge-organization-invoices.js list <email|org:id> [filtres]
  node scripts/purge-organization-invoices.js usage <email|org:id>
  node scripts/purge-organization-invoices.js purge <email|org:id> [filtres] [--confirm]

Filtres (list / purge) :
  --all              Toutes les factures de l'organisation
  --this-month       Factures créées ce mois-ci (quota Free)
  --stripe           Au moins un paiement method=STRIPE (tests Stripe)
  --paid             Statut PAID ou solde <= 0
  --status=SENT,PAID Liste de statuts (séparés par des virgules)
  --ids=id1,id2      IDs facture précis

Options purge :
  --confirm          Exécute la suppression (sinon refus)
  --dry-run          Détail sans écriture (défaut si pas --confirm)

Exemples :
  node scripts/purge-organization-invoices.js list daniel@danielcraft.fr --stripe
  node scripts/purge-organization-invoices.js purge daniel@danielcraft.fr --stripe --confirm
  npm run invoices:purge -- user@example.com --this-month --confirm

Doc : docs/deployment/SCRIPTS_EXPLOITATION_PRODUCTION.md
Shell : scripts/deploy/ops-facturio.sh invoices-purge …
`);
}

function parseArgv(argv) {
  const positional = [];
  const flags = {};
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      if (eq === -1) flags[arg.slice(2)] = true;
      else flags[arg.slice(2, eq)] = arg.slice(eq + 1);
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

function parseTarget(target) {
  if (!target) return null;
  const orgMatch = target.match(/^org:(\d+)$/i) || target.match(/^#(\d+)$/);
  if (orgMatch) return { organizationId: Number(orgMatch[1]) };
  return { email: target.trim().toLowerCase() };
}

async function resolveOrganization(target) {
  const parsed = parseTarget(target);
  if (!parsed) throw new Error('Cible manquante (email ou org:ID)');

  if (parsed.organizationId != null) {
    const org = await prisma.organization.findUnique({ where: { id: parsed.organizationId } });
    if (!org) throw new Error(`Organisation #${parsed.organizationId} introuvable`);
    return org;
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.email },
    include: { organization: true },
  });
  if (!user) throw new Error(`Utilisateur "${parsed.email}" introuvable`);
  if (!user.organization) throw new Error(`Utilisateur "${parsed.email}" sans organisation`);
  return user.organization;
}

function monthBounds(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const resetsAt = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  return { start, end, resetsAt };
}

function decimal(n) {
  if (n == null) return 0;
  return Number(n?.toNumber?.() ?? n);
}

function buildInvoiceWhere(organizationId, flags) {
  const where = { organizationId };
  const { start, end } = monthBounds();

  const hasScope =
    flags.all ||
    flags['this-month'] ||
    flags.stripe ||
    flags.paid ||
    flags.status ||
    flags.ids;

  if (!hasScope) {
    throw new Error(
      'Précisez un filtre : --all, --this-month, --stripe, --paid, --status=… ou --ids=…',
    );
  }

  if (flags['this-month']) {
    where.createdAt = { gte: start, lte: end };
  }

  if (flags.status) {
    const statuses = String(flags.status)
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    if (statuses.length) where.status = { in: statuses };
  }

  if (flags.ids) {
    const ids = String(flags.ids)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length) where.id = { in: ids };
  }

  if (flags.paid) {
    where.OR = [{ status: 'PAID' }, { balance: { lte: 0 } }];
  }

  if (flags.stripe) {
    where.payments = { some: { method: { equals: 'STRIPE', mode: 'insensitive' } } };
  }

  return where;
}

async function fetchInvoices(organizationId, flags) {
  return prisma.invoice.findMany({
    where: buildInvoiceWhere(organizationId, flags),
    orderBy: { createdAt: 'desc' },
    include: {
      payments: { select: { id: true, amount: true, method: true, date: true, notes: true } },
      _count: { select: { lines: true, refunds: true } },
    },
  });
}

function formatInvoiceRow(inv) {
  const pay =
    inv.payments.length === 0
      ? '—'
      : inv.payments
          .map((p) => `${decimal(p.amount).toFixed(2)}€ ${p.method ?? '?'}`)
          .join(' ; ');
  return (
    `${inv.number.padEnd(14)} ${inv.status.padEnd(8)} ` +
    `total=${decimal(inv.total).toFixed(2)}€ solde=${decimal(inv.balance).toFixed(2)}€ ` +
    `créée=${inv.createdAt.toISOString().slice(0, 10)} ` +
    `id=${inv.id}\n` +
    `    paiements: ${pay}`
  );
}

async function cmdList(target, flags) {
  const org = await resolveOrganization(target);
  const invoices = await fetchInvoices(org.id, flags);
  const { start, end, resetsAt } = monthBounds();
  const monthCount = await prisma.invoice.count({
    where: { organizationId: org.id, createdAt: { gte: start, lte: end } },
  });

  console.log(`Organisation #${org.id} "${org.name}"`);
  console.log(`Quota mois en cours : ${monthCount} / ${FREE_MONTHLY_LIMIT} (reset ${resetsAt.toISOString().slice(0, 10)})`);
  console.log(`Factures correspondant aux filtres : ${invoices.length}\n`);

  if (invoices.length === 0) return;

  for (const inv of invoices) {
    console.log(formatInvoiceRow(inv));
  }
}

async function cmdUsage(target) {
  const org = await resolveOrganization(target);
  const { start, end, resetsAt } = monthBounds();
  const monthCount = await prisma.invoice.count({
    where: { organizationId: org.id, createdAt: { gte: start, lte: end } },
  });
  const total = await prisma.invoice.count({ where: { organizationId: org.id } });

  console.log(`Organisation #${org.id} "${org.name}"`);
  console.log(`  Plan (saasPlan) : ${org.saasPlan}`);
  console.log(`  Factures ce mois : ${monthCount} (limite Free typique : ${FREE_MONTHLY_LIMIT})`);
  console.log(`  Reset quota      : ${resetsAt.toISOString()}`);
  console.log(`  Factures totales : ${total}`);
}

async function deleteJournalEntriesForInvoices(tx, invoices) {
  const entryIdSet = new Set();

  for (const inv of invoices) {
    const num = inv.number;
    const entries = await tx.journalEntry.findMany({
      where: {
        OR: [
          { reference: `VENTE ${num}` },
          { reference: `PAIEMENT ${num}` },
          { reference: { startsWith: `PAIEMENT ${num}#` } },
          { reference: { startsWith: `REMBOURSEMENT ${num}` } },
        ],
      },
      select: { id: true },
    });
    for (const e of entries) entryIdSet.add(e.id);
  }

  const entryIds = [...entryIdSet];
  if (entryIds.length === 0) return 0;

  await tx.avoir.updateMany({
    where: { accountingEntryId: { in: entryIds } },
    data: { accountingEntryId: null },
  });

  await tx.journalLine.deleteMany({ where: { entryId: { in: entryIds } } });
  await tx.journalEntry.deleteMany({ where: { id: { in: entryIds } } });
  return entryIds.length;
}

async function purgeInvoices(tx, invoices) {
  const ids = invoices.map((i) => i.id);
  if (ids.length === 0) return { invoices: 0 };

  const journalDeleted = await deleteJournalEntriesForInvoices(tx, invoices);

  const avoirsLinked = await tx.avoir.findMany({
    where: {
      OR: [{ invoiceId: { in: ids } }, { applications: { some: { invoiceId: { in: ids } } } }],
    },
    select: { id: true, accountingEntryId: true },
  });
  const avoirIds = avoirsLinked.map((a) => a.id);
  const extraEntryIds = avoirsLinked.map((a) => a.accountingEntryId).filter((id) => id != null);

  if (extraEntryIds.length > 0) {
    await tx.avoir.updateMany({
      where: { id: { in: avoirIds } },
      data: { accountingEntryId: null },
    });
    await tx.journalLine.deleteMany({ where: { entryId: { in: extraEntryIds } } });
    await tx.journalEntry.deleteMany({ where: { id: { in: extraEntryIds } } });
  }

  if (avoirIds.length > 0) {
    await tx.avoirApplication.deleteMany({
      where: { OR: [{ invoiceId: { in: ids } }, { avoirId: { in: avoirIds } }] },
    });
    await tx.avoirLine.deleteMany({ where: { avoirId: { in: avoirIds } } });
    await tx.avoir.deleteMany({ where: { id: { in: avoirIds } } });
  } else {
    await tx.avoirApplication.deleteMany({ where: { invoiceId: { in: ids } } });
  }

  await tx.refund.deleteMany({ where: { invoiceId: { in: ids } } });
  await tx.taxDeduction.deleteMany({ where: { invoiceId: { in: ids } } });
  await tx.emailEvent.deleteMany({ where: { invoiceId: { in: ids } } });
  await tx.payment.deleteMany({ where: { invoiceId: { in: ids } } });
  await tx.invoiceLine.deleteMany({ where: { invoiceId: { in: ids } } });
  const deleted = await tx.invoice.deleteMany({ where: { id: { in: ids } } });

  return {
    invoices: deleted.count,
    journalEntries: journalDeleted + extraEntryIds.length,
    avoirs: avoirIds.length,
  };
}

async function cmdPurge(target, flags) {
  const org = await resolveOrganization(target);
  const invoices = await fetchInvoices(org.id, flags);
  const dryRun = !flags.confirm;

  console.log(`Organisation #${org.id} "${org.name}"`);
  console.log(`Factures à supprimer : ${invoices.length}`);

  if (invoices.length === 0) {
    console.log('Rien à faire.');
    return;
  }

  console.log('\nAperçu :');
  for (const inv of invoices.slice(0, 20)) {
    console.log(formatInvoiceRow(inv));
  }
  if (invoices.length > 20) {
    console.log(`… et ${invoices.length - 20} autre(s)`);
  }

  const { start, end, resetsAt } = monthBounds();
  const before = await prisma.invoice.count({
    where: { organizationId: org.id, createdAt: { gte: start, lte: end } },
  });

  if (dryRun) {
    console.log(
      `\n(dry-run) Ajoutez --confirm pour supprimer définitivement.\n` +
        `Quota mois actuel : ${before} → estimé après : ${Math.max(0, before - invoices.filter((i) => i.createdAt >= start && i.createdAt <= end).length)}`,
    );
    return;
  }

  console.log('\n⚠️  Suppression en cours (irréversible)…');

  const stats = await prisma.$transaction(async (tx) => purgeInvoices(tx, invoices));

  const after = await prisma.invoice.count({
    where: { organizationId: org.id, createdAt: { gte: start, lte: end } },
  });

  console.log('\n✓ Terminé.');
  console.log(`  Factures supprimées     : ${stats.invoices}`);
  console.log(`  Écritures comptables    : ~${stats.journalEntries}`);
  console.log(`  Avoirs liés            : ${stats.avoirs}`);
  console.log(`  Quota mois : ${before} → ${after} (reset ${resetsAt.toISOString().slice(0, 10)})`);
  console.log(
    '\nLes paiements Stripe test ne sont pas annulés côté Stripe — seules les données Facturio sont effacées.',
  );
}

async function main() {
  const { positional, flags } = parseArgv(process.argv.slice(2));
  const [cmd, target, ..._rest] = positional;

  if (!cmd || !['list', 'usage', 'purge'].includes(cmd)) {
    usage();
    process.exit(1);
  }

  if (!target) {
    console.error('Erreur: email ou org:id requis.');
    usage();
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('Erreur: DATABASE_URL manquant (.env dans server/).');
    process.exit(1);
  }

  try {
    if (cmd === 'list') await cmdList(target, flags);
    else if (cmd === 'usage') await cmdUsage(target);
    else if (cmd === 'purge') await cmdPurge(target, flags);
  } catch (e) {
    console.error('Erreur:', e.message || e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
